using SixLabors.ImageSharp.ColorSpaces;
using System;
using System.Buffers.Binary;
using System.Collections.Generic;
using System.IO;
using System.IO.Pipes;
using System.Linq;
using System.Net.NetworkInformation;
using System.Text;
using System.Threading.Tasks;

namespace VRCX
{
    // See http://www.libpng.org/pub/png/spec/1.2/PNG-Chunks.html 4.2.3
    // Basic PNG Chunk Structure: Length(int, 4 bytes) | Type (string, 4 bytes) | chunk data (x bytes) | 32-bit CRC code (4 bytes)
    // basic iTXt data structure: Keyword (1-79 bytes string) | Null separator (1 byte) | Compression flag (1 byte) | Compression method (1 byte) | Language tag (0-x bytes) | Null separator | Translated keyword (0-x bytes) | Null separator | Text (x bytes)
    public static class PNGHelper
    {
        private static readonly Encoding keywordEncoding = Encoding.GetEncoding("ISO-8859-1"); // ISO-8859-1/Latin1 is the encoding used for the keyword in text chunks. 
        // crc lookup table
        private static uint[] crcTable;
        // init lookup table and store crc for iTXt
        private static readonly uint iTXtCrc = Crc32(new[] { (byte)'i', (byte)'T', (byte)'X', (byte)'t' }, 0, 4, 0);
        private static readonly byte[] pngSignatureBytes = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
        private static readonly byte[] endChunkBytes = new byte[] { (byte)'I', (byte)'E', (byte)'N', (byte)'D' };
        // text chunk keyword byte array in keywordEncoding ISO-8859-1
        
        struct PNGChunk
        {
            public long Index;
            public int Length;
            public string ChunkType;
            public byte[] Data;
        }

        public static string ReadResolution(string filePath)
        {
            using (var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read, 1024))
            {
                if (!IsValidPNG(fileStream)) return null;

                int hdrChunkIndex = FindChunkIndex(fileStream, "IHDR");
                if (hdrChunkIndex == -1) return null;

                PNGChunk? chunk = ReadChunk(fileStream, hdrChunkIndex);
                if (!chunk.HasValue) return null;

                int chunkLength = (int)chunk.Value.Length;
                byte[] chunkData = chunk.Value.Data;

                int width = BitConverter.ToInt32(chunkData, 0);
                int height = BitConverter.ToInt32(chunkData, 4);

                width = BinaryPrimitives.ReverseEndianness(width);
                height = BinaryPrimitives.ReverseEndianness(height);

                return $"{width}x{height}";
            }
        }

        public static string ReadDescription(string filePath)
        {
            using (var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.Read, FileShare.Read, 1024))
            {
                if (!IsValidPNG(fileStream)) return null;

                int textChunkIndex = FindChunkIndex(fileStream, "iTXt");
                if (textChunkIndex == -1)
                {
                    // Check for chunk only present in files created by older modded versions of vrchat. (LFS, screenshotmanager), which put their description at the end of the file.
                    // Searching from the end of the file is a slower bruteforce operation so only do it if we have to.
                    if (FindChunkIndex(fileStream, "sRGB") != -1)
                    {
                        textChunkIndex = FindChunkIndexReverse(fileStream, "iTXt");

                        if (textChunkIndex == -1) return null;
                    }
                    else
                    {
                        return null;
                    }
                }

                PNGChunk? chunk = ReadChunk(fileStream, textChunkIndex);
                if (!chunk.HasValue) 
                    return null;

                int chunkLength = (int)chunk.Value.Length;
                byte[] chunkData = chunk.Value.Data;

                /*
                 *  iTXt Chunk Structure:
                 *  Keyword:             1-79 bytes (character string)
                    Null separator:      1 byte
                    Compression flag:    1 byte
                    Compression method:  1 byte
                    Language tag:        0 or more bytes (character string)
                    Null separator:      1 byte
                    Translated keyword:  0 or more bytes
                    Null separator:      1 byte
                    Text:                0 or more bytes

                    We're treating the language tag/translated keyword as if they dont exist
                */

                int keywordLength = keywordEncoding.GetByteCount("Description");
                if (chunkLength < keywordLength) return null;
                string keyword = keywordEncoding.GetString(chunkData, 0, keywordLength);

                // We don't want to process any other iTXt chunks.
                if (!keyword.Equals("Description")) 
                    return null;

                int textOffset = keywordLength + 5;
                int textLength = chunkLength - textOffset;

                return Encoding.UTF8.GetString(chunkData, textOffset, textLength);
            }
        }

        public static bool WriteDescription(string filePath, string text)
        {
            using (var fileStream = new FileStream(filePath, FileMode.Open, FileAccess.ReadWrite, FileShare.Read, 65536))
            {
                if (!IsValidPNG(fileStream)) return false;

                int textChunkIndex = FindChunkIndex(fileStream, "iTXt");
                if (textChunkIndex != -1)
                {
                    // Chunk already exists. Return
                    return false;
                }

                int hdrChunkIndex = FindChunkIndex(fileStream, "IHDR");
                if (hdrChunkIndex == -1) return false;

                var chunk = ReadChunk(fileStream, hdrChunkIndex);
                if (!chunk.HasValue) return false;

                int chunkLength = (int)chunk.Value.Length;
                int nextChunkIndex = hdrChunkIndex + chunkLength + 12;

                fileStream.Seek(nextChunkIndex, SeekOrigin.Begin);

                // Copy all bytes from current position to end of file
                byte[] fileBytes = new byte[fileStream.Length - nextChunkIndex];

                fileStream.Read(fileBytes, 0, fileBytes.Length);

                fileStream.Seek(nextChunkIndex, SeekOrigin.Begin);

                var newPngChunk = CreateTextDescriptionChunk(text);

                fileStream.Write(newPngChunk, 0, newPngChunk.Length);
                fileStream.Write(fileBytes, 0, fileBytes.Length);

                return true;
            }
        }

        private static byte[] CreateTextDescriptionChunk(string description)
        {
            byte[] descriptionBytes = Encoding.UTF8.GetBytes(description);
            byte[] chunkTypeBytes = Encoding.ASCII.GetBytes("iTXt");
            byte[] keywordBytes = keywordEncoding.GetBytes("Description");
            byte[] chunkLengthBytes = BitConverter.GetBytes(descriptionBytes.Length + keywordBytes.Length + 5);

            List<byte> constructedTextChunk = new List<byte>();

            constructedTextChunk.AddRange(keywordBytes);
            constructedTextChunk.Add(0x0); // Null separator
            constructedTextChunk.Add(0x0); // Compression flag
            constructedTextChunk.Add(0x0); // Compression method
            constructedTextChunk.Add(0x0); // Null separator (skipping over language tag byte)
            constructedTextChunk.Add(0x0); // Null separator (skipping over translated keyword byte)
            constructedTextChunk.AddRange(descriptionBytes);

            byte[] chunkCRCBytes = BitConverter.GetBytes(Crc32(constructedTextChunk.ToArray(), 0, constructedTextChunk.Count, iTXtCrc));

            if (BitConverter.IsLittleEndian)
            {
                Array.Reverse(chunkLengthBytes);
                Array.Reverse(chunkCRCBytes);
            }

            List<byte> constructedChunk = new List<byte>();

            constructedChunk.AddRange(chunkLengthBytes);
            constructedChunk.AddRange(chunkTypeBytes);
            constructedChunk.AddRange(constructedTextChunk);
            constructedChunk.AddRange(chunkCRCBytes);

            return constructedChunk.ToArray();
        }

        private static PNGChunk? ReadChunk(FileStream fileStream, int chunkIndex)
        {
            PNGChunk chunk = new PNGChunk();

            fileStream.Seek(chunkIndex, SeekOrigin.Begin);

            byte[] buffer = new byte[4];

            // read chunk length
            if (fileStream.Read(buffer, 0, 4) < 4)
                return null;

            // BitConverter wants little endian(unless your system is big endian for some reason), PNG multi-byte integers are big endian. So we reverse the array.
            if (BitConverter.IsLittleEndian)
                Array.Reverse(buffer, 0, 4);

            int chunkLength = BitConverter.ToInt32(buffer, 0);
            if (chunkLength < 0 || chunkLength > fileStream.Length)
                return null;

            chunk.Length = chunkLength;
            
            // read chunk type
            if (fileStream.Read(buffer, 0, 4) < 4)
                return null;

            chunk.ChunkType = Encoding.ASCII.GetString(buffer, 0, 4);
            chunk.Data = new byte[chunk.Length];

            if (fileStream.Read(chunk.Data, 0, (int)chunk.Length) < (int)chunk.Length)
                return null;

            chunk.Index = chunkIndex;

            return chunk;
        }

        private static int FindChunkIndex(FileStream fileStream, string searchChunkType)
        {
            int chunksProcessed = 0;
            int chunkSeekLimit = 3;

            if (fileStream.Length < 12)
                return -1;

            // skip png signature
            fileStream.Seek(8, SeekOrigin.Begin);

            bool isLittleEndian = BitConverter.IsLittleEndian;

            byte[] searchChunkBytes = Encoding.ASCII.GetBytes(searchChunkType);
            byte[] chunkLengthBuffer = new byte[4];
            byte[] chunkTypeBuffer = new byte[4];

            while (fileStream.Position < fileStream.Length)
            {
                int chunkIndex = (int)fileStream.Position;

                // Read chunk length (big endian)
                if (fileStream.Read(chunkLengthBuffer, 0, 4) < 4) 
                    break;

                // Read chunk type
                if (fileStream.Read(chunkTypeBuffer, 0, 4) < 4) 
                    break;

                // BitConverter wants little endian(unless your system is big endian for some reason), PNG multi-byte integers are big endian. So we reverse the array.
                if (isLittleEndian)
                    Array.Reverse(chunkLengthBuffer, 0, 4);

                int chunkLength = BitConverter.ToInt32(chunkLengthBuffer, 0);

                if (chunkLength < 0) // uhh junk data
                    break;

                if (chunkTypeBuffer.SequenceEqual(searchChunkBytes))
                    return chunkIndex;

                // Nothing should exist past IEND in a normal png file, so we should stop parsing here to avoid trying to parse junk data. (it'd be pretty unusual to find it this early in the file tho)
                if (chunkLengthBuffer.SequenceEqual(endChunkBytes))
                    return -1;

                // The chunk length is 4 bytes, the chunk name is 4 bytes, the chunk data is chunkLength bytes, and the chunk CRC after chunk data is 4 bytes.
                // We've already read the length/type which is the first 8 bytes, so we'll seek the chunk length + 4(CRC) to get to the start of the next chunk in the file.
                fileStream.Seek(chunkLength + 4, SeekOrigin.Current);
                chunksProcessed++;

                if (chunksProcessed > chunkSeekLimit) break;
            }

            return -1;
        }

        private static int FindChunkIndexReverse(FileStream fileStream, string searchChunkType)
        {
            byte[] searchChunkBytes = Encoding.ASCII.GetBytes(searchChunkType);

            if (fileStream.Length < 8300) return -1;

            // Start at an offset of 12 since the IEND chunk (should) always be the last chunk in the file, be 12 bytes, and we don't need to check it.
            fileStream.Seek(-12, SeekOrigin.End);

            // Read the last 4KB of the file, which (should) be enough to find any trailing iTXt chunks we're looking for.
            fileStream.Seek(-4096, SeekOrigin.Current);

            byte[] trailingBytesBuffer = new byte[4096];
            int bytesRead = fileStream.Read(trailingBytesBuffer, 0, 4096);

            for (int i = 0; i < bytesRead - searchChunkBytes.Length; i++)
            {
                if (trailingBytesBuffer[i] == searchChunkBytes[0] &&
                    trailingBytesBuffer[i + 1] == searchChunkBytes[1] &&
                    trailingBytesBuffer[i + 2] == searchChunkBytes[2] &&
                    trailingBytesBuffer[i + 3] == searchChunkBytes[3])
                {
                    // Return the position of the chunk, starting from length field
                    return (int)(fileStream.Position - bytesRead + i - 4);
                }
            }

            return -1;
        }

        /// <summary>
        ///     Determines whether the specified file is a PNG file. We do this by checking if the first 8 bytes in the file path match the PNG signature.
        /// </summary>
        /// <returns></returns>
        private static bool IsValidPNG(FileStream fileStream)
        {
            if (fileStream.Length < 57) return false; // Ignore files smaller than the absolute minimum size any PNG file could theoretically be (Signature + IHDR + IDAT + IEND)

            var signature = new byte[8];
            if (fileStream.Read(signature, 0, 8) < 8) return false;

            return signature.SequenceEqual(pngSignatureBytes);
        }

        // Crc32 implementation from
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
                            c = (c >> 1) & 0x7FFFFFFF;
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
