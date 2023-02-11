using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
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

            int newChunkIndex = FindChunk(png, "IHDR");
            if (newChunkIndex == -1) return false;

            // If this file already has a text chunk, chances are it got logged twice for some reason. Stop.
            int existingiTXt = FindChunk(png, "iTXt");
            if (existingiTXt != -1) return false;

            var newChunk = new PNGChunk("iTXt");
            newChunk.InitializeTextChunk("Description", text);

            var newFile = png.ToList();
            newFile.InsertRange(newChunkIndex, newChunk.ConstructChunkByteArray());

            File.WriteAllBytes(path, newFile.ToArray());

            return true;
        }

        public static bool IsPNGFile(string path)
        {
            var png = File.ReadAllBytes(path);
            var pngSignature = png.Take(8).ToArray();
            return pngSignatureBytes.SequenceEqual(pngSignature);
        }

        static int FindChunk(byte[] png, string type)
        {
            int index = 8;

            while (index < png.Length)
            {
                byte[] chunkLength = new byte[4];
                Array.Copy(png, index, chunkLength, 0, 4);
                Array.Reverse(chunkLength);
                int length = BitConverter.ToInt32(chunkLength, 0);

                byte[] chunkName = new byte[4];
                Array.Copy(png, index + 4, chunkName, 0, 4);
                string name = Encoding.ASCII.GetString(chunkName);

                if (name == type)
                {
                    return index + length + 12;
                }
                index += length + 12;
            }

            return -1;
        }
    }

    // See http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html 4.2.3
    // Basic PNG Chunk Structure: Length(int, 4 bytes) | Type (string, 4 bytes) | chunk data (Depends on type) | 32-bit CRC code (4 bytes)
    // basic tEXt data structure: Keyword (1-79 bytes string) | Null separator (1 byte) | Text (x bytes)
    // basic iTXt data structure: Keyword (1-79 bytes string) | Null separator (1 byte) | Compression flag (1 byte) | Compression method (1 byte) | Language tag (0-x bytes) | Null separator | Translated keyword (0-x bytes) | Null separator | Text (x bytes)

    // Proper practice here for arbitrary image processing would be to check the PNG file being passed for any existing iTXt chunks with the same keyword that we're trying to use; If we find one, we replace that chunk's data instead of creating a new chunk.
    // Luckily, VRChat should never do this! Bugs notwithstanding, we should never re-process a png file either. So we're just going to skip that logic.
    internal class PNGChunk
    {
        public string ChunkType;
        public List<byte> ChunkDataBytes;
        public int ChunkDataLength;

        // crc lookup table
        private static uint[] crcTable;
        // init lookup table and store crc for iTXt
        private static uint tEXtCRC = Crc32(new byte[] { (byte)'i', (byte)'T', (byte)'X', (byte)'t' }, 0, 4, 0);

        public PNGChunk(string chunkType)
        {
            this.ChunkType = chunkType;
            this.ChunkDataBytes = new List<byte>();
        }

        // Construct iTXt chunk data
        public void InitializeTextChunk(string keyword, string text)
        {
            // Create our chunk data byte array
            ChunkDataBytes.AddRange(Encoding.UTF8.GetBytes(keyword)); // keyword
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

            chunk.AddRange(BitConverter.GetBytes(ChunkDataLength).Reverse()); // add data length
            chunk.AddRange(Encoding.ASCII.GetBytes(ChunkType)); // add chunk type
            chunk.AddRange(ChunkDataBytes); // Add chunk data
            chunk.AddRange(BitConverter.GetBytes(Crc32(ChunkDataBytes.ToArray(), 0, ChunkDataLength, tEXtCRC)).Reverse()); // Add chunk CRC32 hash

            return chunk.ToArray();
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
