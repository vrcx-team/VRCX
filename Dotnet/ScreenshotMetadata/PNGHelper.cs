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
    public static class PNGHelper
    {
        public static string ReadResolution(PNGFile pngFile)
        {
            var ihdrChunk = pngFile.GetChunk(PNGChunkTypeFilter.IHDR);
            if (ihdrChunk.HasValue)
            {
                var resolution = ihdrChunk.Value.ReadIHDRChunkResolution();
                return resolution.Item1 + "x" + resolution.Item2;
            }

            return "0x0";
        }
        public static string ReadVRCXMetadata(PNGFile pngFile)
        {
            var metadata = ReadTextChunk("Description", pngFile);

            // Check for chunk only present in files created by older modded versions of vrchat. (LFS, screenshotmanager), which put their description at the end of the file.
            // Searching from the end of the file is a slower bruteforce operation so only do it if we have to.
            if (metadata == null && pngFile.GetChunk(PNGChunkTypeFilter.sRGB).HasValue)
            {
                // reverse check logic
                //textChunkIndex = FindChunkIndexReverse(fileStream, "iTXt");

                //if (textChunkIndex == -1) return null;
            }

            return metadata;
        }
        
        public static bool WriteVRCXMetadata(string text, PNGFile pngFile)
        {
            var textChunkData = GenerateTextChunkData("Description", text);
            var chunk = new PNGChunk()
            {
                Index = -1,
                Length = textChunkData.Length,
                ChunkType = "iTXt",
                ChunkTypeEnum = PNGChunkTypeFilter.iTXt,
                Data = textChunkData
            };
            
            return pngFile.WriteChunk(chunk);
        }

        public static string ReadVRChatMetadata(PNGFile pngFile)
        {
            return ReadTextChunk("XML:com.adobe.xmp", pngFile);
        }
        private static string ReadTextChunk(string keyword, PNGFile pngFile)
        {
            var iTXtChunk = pngFile.GetChunksOfType(PNGChunkTypeFilter.iTXt);
            if (iTXtChunk.Count == 0)
                return null;

            for (int i = 0; i < iTXtChunk.Count; i++)
            {
                var data = iTXtChunk[i].ReadITXtChunk();
                if (data.Item1 == keyword)
                    return data.Item2;
            }

            return null;
        }

        private static byte[] GenerateTextChunkData(string keyword, string text)
        {
            byte[] textBytes = Encoding.UTF8.GetBytes(text);
            byte[] keywordBytes = Encoding.GetEncoding("ISO-8859-1").GetBytes(keyword);

            List<byte> constructedTextChunk = new List<byte>();
            constructedTextChunk.AddRange(keywordBytes);
            constructedTextChunk.Add(0x0); // Null separator
            constructedTextChunk.Add(0x0); // Compression flag
            constructedTextChunk.Add(0x0); // Compression method
            constructedTextChunk.Add(0x0); // Null separator (skipping over language tag byte)
            constructedTextChunk.Add(0x0); // Null separator (skipping over translated keyword byte)
            constructedTextChunk.AddRange(textBytes);

            return constructedTextChunk.ToArray();
        }
    }
}
