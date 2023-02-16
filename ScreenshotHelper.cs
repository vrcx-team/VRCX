using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Runtime.Remoting.Messaging;
using System.Text;
using System.Threading.Tasks;

namespace VRCX
{
    internal static class ScreenshotHelper
    {
        private static byte[] pngSignatureBytes = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
        
        public static bool WritePNGDescription(string path, string text)
        {
            if (!File.Exists(path) || !IsPNGFile(path)) return false;
            
            var png = File.ReadAllBytes(path);

            int newChunkIndex = FindEndOfChunk(png, "IHDR");
            if (newChunkIndex == -1) return false;

            // If this file already has a text chunk, chances are it got logged twice for some reason. Stop.
            int existingiTXt = FindChunkIndex(png, "iTXt");
            if (existingiTXt != -1) return false;

            var newChunk = new PNGChunk("iTXt");
            newChunk.InitializeTextChunk("Description", text);

            var newFile = png.ToList();
            newFile.InsertRange(newChunkIndex, newChunk.ConstructChunkByteArray());

            File.WriteAllBytes(path, newFile.ToArray());

            return true;
        }

        public static string ReadPNGDescription(string path)
        {
            if (!File.Exists(path) || !IsPNGFile(path)) return null;
            
            var png = File.ReadAllBytes(path);
            PNGChunk existingiTXt = FindChunk(png, "iTXt");
            if (existingiTXt == null) return null;

            string text = existingiTXt.GetText("Description");

            return text;
        }

        public static bool IsPNGFile(string path)
        {
            // Read only the first 8 bytes of the file to check if it's a PNG file instead of reading the entire thing into memory just to see check a couple bytes.
            using (FileStream fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
            {
                if (fs.Length < 33) return false;
                
                byte[] signature = new byte[8];
                fs.Read(signature, 0, 8);
                return signature.SequenceEqual(pngSignatureBytes);
        }

        static int FindChunkIndex(byte[] png, string type)
        {
            int index = 8;

            while (index < png.Length)
            {
                byte[] chunkLength = new byte[4];
                Array.Copy(png, index, chunkLength, 0, 4);

                // BitConverter wants little endian(unless your system is big endian for some reason), PNG multi-byte integers are big endian. So we reverse the array.
                http://www.libpng.org/pub/png/spec/1.2/PNG-DataRep.html
                if (BitConverter.IsLittleEndian) Array.Reverse(chunkLength); 

                int length = BitConverter.ToInt32(chunkLength, 0);

                byte[] chunkName = new byte[4];
                Array.Copy(png, index + 4, chunkName, 0, 4);
                string name = Encoding.UTF8.GetString(chunkName);

                if (name == type)
                {
                    return index;
                }
                index += length + 12;
            }
            
            return -1;
        }

        static int FindEndOfChunk(byte[] png, string type)
        {
            int index = FindChunkIndex(png, type);
            if (index == -1) return index;

            byte[] chunkLength = new byte[4];
            Array.Copy(png, index, chunkLength, 0, 4);
            Array.Reverse(chunkLength);
            int length = BitConverter.ToInt32(chunkLength, 0);

            return index + length + 12;
        }

        static PNGChunk FindChunk(byte[] png, string type)
        {
            int index = FindChunkIndex(png, type);
            if (index == -1) return null;

            byte[] chunkLength = new byte[4];
            Array.Copy(png, index, chunkLength, 0, 4);
            Array.Reverse(chunkLength);
            int length = BitConverter.ToInt32(chunkLength, 0);

            byte[] chunkData = new byte[length];
            Array.Copy(png, index + 8, chunkData, 0, length);

            string test = BitConverter.ToString(chunkData);

            return new PNGChunk(type, chunkData);
        }
    }

    // See http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html 4.2.3
    // Basic PNG Chunk Structure: Length(int, 4 bytes) | Type (string, 4 bytes) | chunk data (Depends on type) | 32-bit CRC code (4 bytes)
    // basic tEXt data structure: Keyword (1-79 bytes string) | Null separator (1 byte) | Text (x bytes)
    // basic iTXt data structure: Keyword (1-79 bytes string) | Null separator (1 byte) | Compression flag (1 byte) | Compression method (1 byte) | Language tag (0-x bytes) | Null separator | Translated keyword (0-x bytes) | Null separator | Text (x bytes)

    // Proper practice here for arbitrary image processing would be to check the PNG file being passed for any existing iTXt chunks with the same keyword that we're trying to use; If we find one, we replace that chunk's data instead of creating a new chunk.
    // Luckily, VRChat should never do this! Bugs notwithstanding, we should never re-process a png file either. So we're just going to skip that logic.
    // This code would be HORRIBLE for general parsing of PNG files/metadata. It's not really meant to do that, it's just meant to do exactly what we need it to do.
    internal class PNGChunk
    {
        public string ChunkType;
        public List<byte> ChunkBytes;
        public List<byte> ChunkDataBytes;
        public int ChunkDataLength;
        private readonly Encoding keywordEncoding = Encoding.GetEncoding("ISO-8859-1"); // ISO-8859-1/Latin1 is the encoding used for the keyword in text chunks. 

        // crc lookup table
        private static uint[] crcTable;
        // init lookup table and store crc for iTXt
        private static uint iTXtCrc = Crc32(new byte[] { (byte)'i', (byte)'T', (byte)'X', (byte)'t' }, 0, 4, 0);

        public PNGChunk(string chunkType)
        {
            this.ChunkType = chunkType;
            this.ChunkDataBytes = new List<byte>();
        }

        public PNGChunk(string chunkType, byte[] bytes)
        {
            this.ChunkType = chunkType;
            this.ChunkDataBytes = bytes.ToList();
            this.ChunkDataLength = bytes.Length;
        }

        // Construct iTXt chunk data
        public void InitializeTextChunk(string keyword, string text)
        {
            // Create our chunk data byte array
            ChunkDataBytes.AddRange(keywordEncoding.GetBytes(keyword)); // keyword
            ChunkDataBytes.Add(0x0); // Null separator
            ChunkDataBytes.Add(0x0); // Compression flag
            ChunkDataBytes.Add(0x0); // Compression method
            ChunkDataBytes.Add(0x0); // Null separator (skipping over language tag byte)
            ChunkDataBytes.Add(0x0); // Null separator (skipping over translated keyword byte)
            ChunkDataBytes.AddRange(Encoding.UTF8.GetBytes(text)); // our text

            ChunkDataLength = ChunkDataBytes.Count;
        }

        // Construct & return PNG chunk
        public byte[] ConstructChunkByteArray()
        {
            List<byte> chunk = new List<byte>();

            byte[] chunkLengthBytes = BitConverter.GetBytes(ChunkDataLength);
            byte[] chunkCRCBytes = BitConverter.GetBytes(Crc32(ChunkDataBytes.ToArray(), 0, ChunkDataLength, iTXtCrc));

            // Reverse the chunk length bytes/CRC bytes if system is little endian since PNG integers are big endian
            if (BitConverter.IsLittleEndian)
            {
                Array.Reverse(chunkLengthBytes);
                Array.Reverse(chunkCRCBytes);
            }

            chunk.AddRange(chunkLengthBytes); // add data length
            chunk.AddRange(Encoding.UTF8.GetBytes(ChunkType)); // add chunk type
            chunk.AddRange(ChunkDataBytes); // Add chunk data
            chunk.AddRange(chunkCRCBytes); // Add chunk CRC32 hash. 

            return chunk.ToArray();
        }

        public string GetText(string keyword)
        {
            int offset = keywordEncoding.GetByteCount(keyword) + 5;
            // Read string from PNG chunk
            return Encoding.UTF8.GetString(ChunkDataBytes.ToArray(), offset, ChunkDataBytes.Count - offset);
        }

        // https://web.archive.org/web/20150825201508/http://upokecenter.dreamhosters.com/articles/png-image-encoder-in-c/
        private static uint Crc32(byte[] stream, int offset, int length, uint crc)
        {
            uint c;
            if (crcTable == null)
            {
                crcTable = new uint[256];
                for (uint n = 0; n <= 255; n++)
                {
                    c = n;
                    for (var k = 0; k <= 7; k++)
                    {
                        if ((c & 1) == 1)
                            c = 0xEDB88320 ^ ((c >> 1) & 0x7FFFFFFF);
                        else
                            c = ((c >> 1) & 0x7FFFFFFF);
                    }
                    crcTable[n] = c;
                }
            }
            c = crc ^ 0xffffffff;
            var endOffset = offset + length;
            for (var i = offset; i < endOffset; i++)
            {
                c = crcTable[(c ^ stream[i]) & 255] ^ ((c >> 8) & 0xFFFFFF);
            }
            return c ^ 0xffffffff;
        }
    }
}
