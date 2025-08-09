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
            if (ihdrChunk != null)
            {
                var resolution = ihdrChunk.ReadIHDRChunkResolution();
                return resolution.Item1 + "x" + resolution.Item2;
            }

            return "0x0";
        }
        

        /// <summary>
        /// Reads the metadata associated with a specified keyword from text chunks within a PNG file.
        /// </summary>
        /// <param name="keyword">The unique keyword for a speicifc text chunk to search for.</param>
        /// <param name="pngFile">The PNG file containing the chunks to be searched.</param>
        /// <param name="legacySearch">
        /// Specifies whether to search for legacy text chunks created by older VRChat mods.
        /// If true, the function searches from the end of the file using a reverse search bruteforce method.
        /// </param>
        /// <returns>The text associated with the specified keyword, or null if not found.</returns>
        public static string? ReadTextChunk(string keyword, PNGFile pngFile, bool legacySearch = false)
        {
            // Search for legacy text chunks created by old vrchat mods
            if (legacySearch)
            {
                var legacyTextChunk = pngFile.GetChunkReverse(PNGChunkTypeFilter.iTXt);
                if (legacyTextChunk != null)
                {
                    var data = legacyTextChunk.ReadITXtChunk();
                    if (data.Item1 == keyword)
                        return data.Item2;
                }

                return null;
            }
            
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

        public static bool DeleteTextChunk(string keyword, PNGFile pngFile)
        {
            var iTXtChunk = pngFile.GetChunksOfType(PNGChunkTypeFilter.iTXt);
            if (iTXtChunk.Count == 0)
                return false;

            for (int i = 0; i < iTXtChunk.Count; i++)
            {
                var data = iTXtChunk[i].ReadITXtChunk();
                if (data.Item1 == keyword)
                    return pngFile.DeleteChunk(iTXtChunk[i]);
            }

            return false;
        }

        /// <summary>
        /// Generates a PNG text chunk ready for writing.
        /// </summary>
        /// <param name="keyword">The keyword to write to the text chunk.</param>
        /// <param name="text">The text to write to the text chunk.</param>
        /// <returns>The binary data for the text chunk.</returns>
        public static PNGChunk GenerateTextChunk(string keyword, string text)
        {
            byte[] textBytes = Encoding.UTF8.GetBytes(text);
            byte[] keywordBytes = Encoding.UTF8.GetBytes(keyword);

            List<byte> constructedTextChunk = new List<byte>();
            constructedTextChunk.AddRange(keywordBytes);
            constructedTextChunk.Add(0x0); // Null separator
            constructedTextChunk.Add(0x0); // Compression flag
            constructedTextChunk.Add(0x0); // Compression method
            constructedTextChunk.Add(0x0); // Null separator (skipping over language tag byte)
            constructedTextChunk.Add(0x0); // Null separator (skipping over translated keyword byte)
            constructedTextChunk.AddRange(textBytes);

            return new PNGChunk
            {
                ChunkType = "iTXt",
                ChunkTypeEnum = PNGChunkTypeFilter.iTXt,
                Data = constructedTextChunk.ToArray(),
                Length = constructedTextChunk.Count
            };
        }
    }
}
