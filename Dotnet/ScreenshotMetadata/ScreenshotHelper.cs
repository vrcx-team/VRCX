using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Xml;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NLog;

namespace VRCX
{
    internal static class ScreenshotHelper
    {
        private static readonly Logger logger = LogManager.GetCurrentClassLogger();
        private static readonly ScreenshotMetadataDatabase cacheDatabase = new ScreenshotMetadataDatabase(Path.Combine(Program.AppDataDirectory, "metadataCache.db"));
        private static readonly Dictionary<string, ScreenshotMetadata> metadataCache = new Dictionary<string, ScreenshotMetadata>();

        public enum ScreenshotSearchType
        {
            Username,
            UserID,
            WorldName,
            WorldID,
        }

        public static bool TryGetCachedMetadata(string filePath, out ScreenshotMetadata metadata)
        {
            if (metadataCache.TryGetValue(filePath, out metadata))
                return true;

            int id = cacheDatabase.IsFileCached(filePath);

            if (id != -1)
            {
                string metadataStr = cacheDatabase.GetMetadataById(id);
                var metadataObj = metadataStr == null ? null : JsonConvert.DeserializeObject<ScreenshotMetadata>(metadataStr);

                metadataCache.Add(filePath, metadataObj);

                metadata = metadataObj;
                return true;
            }

            return false;
        }

        public static List<ScreenshotMetadata> FindScreenshots(string query, string directory, ScreenshotSearchType searchType)
        {
            var result = new List<ScreenshotMetadata>();

            var files = Directory.GetFiles(directory, "*.png", SearchOption.AllDirectories);

            var addToCache = new List<MetadataCache>();

            int amtFromCache = 0;
            foreach (var file in files)
            {
                ScreenshotMetadata metadata = null;

                if (TryGetCachedMetadata(file, out metadata))
                {
                    amtFromCache++;
                }
                else
                {
                    metadata = GetScreenshotMetadata(file, false);
                    var dbEntry = new MetadataCache()
                    {
                        FilePath = file,
                        Metadata = null,
                        CachedAt = DateTimeOffset.Now
                    };

                    if (metadata == null || metadata.Error != null)
                    {
                        addToCache.Add(dbEntry);
                        metadataCache.Add(file, null);
                        continue;
                    }

                    dbEntry.Metadata = JsonConvert.SerializeObject(metadata);
                    addToCache.Add(dbEntry);
                    metadataCache.Add(file, metadata);
                }

                if (metadata == null) continue;

                switch (searchType)
                {
                    case ScreenshotSearchType.Username:
                        if (metadata.ContainsPlayerName(query, true, true))
                            result.Add(metadata);

                        break;
                    case ScreenshotSearchType.UserID:
                        if (metadata.ContainsPlayerID(query))
                            result.Add(metadata);

                        break;
                    case ScreenshotSearchType.WorldName:
                        if (metadata.World.Name.IndexOf(query, StringComparison.OrdinalIgnoreCase) != -1)
                            result.Add(metadata);

                        break;
                    case ScreenshotSearchType.WorldID:
                        if (metadata.World.Id == query)
                            result.Add(metadata);

                        break;

                }
            }

            if (addToCache.Count > 0)
                cacheDatabase.BulkAddMetadataCache(addToCache);

            logger.ConditionalDebug("Found {0}/{1} screenshots matching query '{2}' of type '{3}'. {4}/{5} pulled from cache.", result.Count, files.Length, query, searchType, amtFromCache, files.Length);

            return result;
        }

        /// <summary>
        /// Retrieves metadata from a PNG screenshot file and attempts to parse it.
        /// </summary>
        /// <param name="path">The path to the PNG screenshot file.</param>
        /// <returns>A JObject containing the metadata or null if no metadata was found.</returns>
        public static ScreenshotMetadata GetScreenshotMetadata(string path, bool includeJSON = false)
        {
            // Early return if file doesn't exist, or isn't a PNG(Check both extension and file header)
            if (!File.Exists(path) || !path.EndsWith(".png") || !IsPNGFile(path))
                return null;

            ///if (metadataCache.TryGetValue(path, out var cachedMetadata))
            //    return cachedMetadata;

            string metadataString;

            // Get the metadata string from the PNG file
            try
            {
                metadataString = ReadPNGDescription(path);
            }
            catch (Exception ex)
            {
                logger.Error(ex, "Failed to read PNG description for file '{0}'", path);
                return ScreenshotMetadata.JustError(path, "Failed to read PNG description. Check logs.");
            }

            // If the metadata string is empty for some reason, there's nothing to parse.
            if (string.IsNullOrEmpty(metadataString))
                return null;

            // Check for specific metadata string start sequences
            if (metadataString.StartsWith("lfs") || metadataString.StartsWith("screenshotmanager"))
            {
                try
                {
                    var result = ScreenshotHelper.ParseLfsPicture(metadataString);
                    result.SourceFile = path;

                    return result;
                }
                catch (Exception ex)
                {
                    logger.Error(ex, "Failed to parse LFS/ScreenshotManager metadata for file '{0}'", path);
                    return ScreenshotMetadata.JustError(path, "Failed to parse LFS/ScreenshotManager metadata.");
                }
            }

            // If not JSON metadata, return early so we're not throwing/catching pointless exceptions
            if (!metadataString.StartsWith("{"))
            {
                // parse VRC prints
                var xmlIndex = metadataString.IndexOf("<x:xmpmeta", StringComparison.Ordinal);
                if (xmlIndex != -1)
                {
                    try
                    {
                        var xmlString = metadataString.Substring(xmlIndex);
                        // everything after index
                        var result = ParseVRCPrint(xmlString.Substring(xmlIndex - 7));
                        result.SourceFile = path;

                        return result;
                    }
                    catch (Exception ex)
                    {
                        logger.Error(ex, "Failed to parse VRCPrint XML metadata for file '{0}'", path);
                        return ScreenshotMetadata.JustError(path, "Failed to parse VRCPrint metadata.");
                    }
                }
                
                logger.ConditionalDebug("Screenshot file '{0}' has unknown non-JSON metadata:\n{1}\n", path, metadataString);
                return ScreenshotMetadata.JustError(path, "File has unknown non-JSON metadata.");
            }

            // Parse the metadata as VRCX JSON metadata
            try
            {
                var result = JsonConvert.DeserializeObject<ScreenshotMetadata>(metadataString);
                result.SourceFile = path;

                if (includeJSON)
                    result.JSON = metadataString;

                return result;
            }
            catch (JsonException ex)
            {
                logger.Error(ex, "Failed to parse screenshot metadata JSON for file '{0}'", path);
                return ScreenshotMetadata.JustError(path, "Failed to parse screenshot metadata JSON. Check logs.");
            }
        }
        
        public static ScreenshotMetadata ParseVRCPrint(string xmlString)
        {
            var doc = new XmlDocument();
            doc.LoadXml(xmlString);
            var root = doc.DocumentElement;
            var nsManager = new XmlNamespaceManager(doc.NameTable);
            nsManager.AddNamespace("x", "adobe:ns:meta/");
            nsManager.AddNamespace("rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#");
            nsManager.AddNamespace("xmp", "http://ns.adobe.com/xap/1.0/");
            nsManager.AddNamespace("tiff", "http://ns.adobe.com/tiff/1.0/");
            nsManager.AddNamespace("dc", "http://purl.org/dc/elements/1.1/");
            nsManager.AddNamespace("vrc", "http://ns.vrchat.com/vrc/1.0/");
            var creatorTool = root.SelectSingleNode("//xmp:CreatorTool", nsManager)?.InnerText;
            var authorId = root.SelectSingleNode("//xmp:Author", nsManager)?.InnerText;
            var dateTime = root.SelectSingleNode("//tiff:DateTime", nsManager)?.InnerText;
            var note = root.SelectSingleNode("//dc:title/rdf:Alt/rdf:li", nsManager)?.InnerText;
            var worldId = root.SelectSingleNode("//vrc:World", nsManager)?.InnerText;

            return new ScreenshotMetadata
            {
                Application = creatorTool,
                Version = 1,
                Author = new ScreenshotMetadata.AuthorDetail
                {
                    Id = authorId,
                    DisplayName = null
                },
                World = new ScreenshotMetadata.WorldDetail
                {
                    Id = worldId,
                    InstanceId = worldId,
                    Name = null
                },
                Timestamp = DateTime.TryParse(dateTime, out var dt) ? dt : null,
                Note = note
            };
        }

        /// <summary>
        ///     Writes a text description into a PNG file at the specified path.
        ///     Creates an iTXt PNG chunk in the target file, using the Description tag, with the specified text.
        /// </summary>
        /// <param name="path">The file path of the PNG file in which the description is to be written.</param>
        /// <param name="text">The text description that is to be written into the PNG file.</param>
        /// <returns>
        ///     <c>true</c> if the text description is successfully written to the PNG file;
        ///     otherwise, <c>false</c>.
        /// </returns>
        public static bool WritePNGDescription(string path, string text)
        {
            if (!File.Exists(path) || !IsPNGFile(path)) return false;

            var png = File.ReadAllBytes(path);

            var newChunkIndex = FindEndOfChunk(png, "IHDR");
            if (newChunkIndex == -1) return false;

            // If this file already has a text chunk, chances are it got logged twice for some reason. Stop.
            var existingiTXt = FindChunkIndex(png, "iTXt");
            if (existingiTXt != -1) return false;

            var newChunk = new PNGChunk("iTXt");
            newChunk.InitializeTextChunk("Description", text);

            var newFile = png.ToList();
            newFile.InsertRange(newChunkIndex, newChunk.ConstructChunkByteArray());

            File.WriteAllBytes(path, newFile.ToArray());

            return true;
        }

        public static bool CopyTXt(string sourceImage, string targetImage)
        {
            if (!File.Exists(sourceImage) || !IsPNGFile(sourceImage) ||
                !File.Exists(targetImage) || !IsPNGFile(targetImage)) 
                return false;

            var sourceMetadata = ReadTXt(sourceImage);

            if (sourceMetadata == null) 
                return false;

            var targetImageData = File.ReadAllBytes(targetImage);

            var newChunkIndex = FindEndOfChunk(targetImageData, "IHDR");
            if (newChunkIndex == -1) return false;

            // If this file already has a text chunk, chances are it got logged twice for some reason. Stop.
            var existingiTXt = FindChunkIndex(targetImageData, "iTXt");
            if (existingiTXt != -1) return false;

            var newFile = targetImageData.ToList();
            newFile.InsertRange(newChunkIndex, sourceMetadata.ConstructChunkByteArray());

            File.WriteAllBytes(targetImage, newFile.ToArray());

            return true;
        }

        /// <summary>
        ///     Reads a text description from a PNG file at the specified path.
        ///     Reads any existing iTXt PNG chunk in the target file, using the Description tag.
        /// </summary>
        /// <param name="path">The file path of the PNG file in which the description is to be read from.</param>
        /// <returns>
        ///     The text description that is read from the PNG file.
        /// </returns>
        public static string ReadPNGDescription(string path)
        {
            if (!File.Exists(path) || !IsPNGFile(path)) return null;

            using (var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 512))
            {
                var existingiTXt = FindChunk(stream, "iTXt", true);
                if (existingiTXt == null) return null;

                return existingiTXt.GetText("Description");
            }
        }

        public static bool HasTXt(string path)
        {
            if (!File.Exists(path) || !IsPNGFile(path)) return false;

            using (var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 512))
            {
                var existingiTXt = FindChunk(stream, "iTXt", true);

                return existingiTXt != null;
            }
        }

        public static PNGChunk ReadTXt(string path)
        {
            if (!File.Exists(path) || !IsPNGFile(path)) return null;

            using (var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 512))
            {
                var existingiTXt = FindChunk(stream, "iTXt", true);

                return existingiTXt;
            }
        }

        /// <summary>
        /// Reads the PNG resolution.
        /// </summary>
        /// <param name="path">The path.</param>
        /// <returns></returns>
        public static string ReadPNGResolution(string path)
        {
            if (!File.Exists(path) || !IsPNGFile(path)) return null;

            using (var stream = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.Read, 512))
            {
                var existingiHDR = FindChunk(stream, "IHDR", false);
                if (existingiHDR == null) return null;

                return existingiHDR.GetResolution();
            }
        }

        /// <summary>
        ///     Determines whether the specified file is a PNG file. We do this by checking if the first 8 bytes in the file path match the PNG signature.
        /// </summary>
        /// <param name="path">The path of the file to check.</param>
        /// <returns></returns>
        public static bool IsPNGFile(string path)
        {
            var pngSignatureBytes = new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A };
            
            // Read only the first 8 bytes of the file to check if it's a PNG file instead of reading the entire thing into memory just to see check a couple bytes.
            using (var fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite))
            {
                if (fs.Length < 33) return false; // I don't remember how I came up with this number, but a PNG file below this size is not going to be valid for our purposes.

                var signature = new byte[8];
                fs.Read(signature, 0, 8);
                return signature.SequenceEqual(pngSignatureBytes);
            }
        }

        /// <summary>
        ///     Finds the index of the first of a specified chunk type in the specified PNG file.
        /// </summary>
        /// <param name="png">Array of bytes representing a PNG file.</param>
        /// <param name="type">Type of PMG chunk to find</param>
        /// <returns></returns>
        private static int FindChunkIndex(byte[] png, string type)
        {
            int chunksProcessed = 0;
            int chunkSeekLimit = 5;

            bool isLittleEndian = BitConverter.IsLittleEndian;

            // The first 8 bytes of the file are the png signature, so we can skip them.
            var index = 8;

            while (index < png.Length)
            {
                var chunkLength = new byte[4];
                Array.Copy(png, index, chunkLength, 0, 4);

                // BitConverter wants little endian(unless your system is big endian for some reason), PNG multi-byte integers are big endian. So we reverse the array.
                if (isLittleEndian) Array.Reverse(chunkLength);

                var length = BitConverter.ToInt32(chunkLength, 0);

                // We don't need to reverse strings since UTF-8 strings aren't affected by endianess, given that they're a sequence of bytes. 
                var chunkName = new byte[4];
                Array.Copy(png, index + 4, chunkName, 0, 4);
                var name = Encoding.UTF8.GetString(chunkName);

                if (name == type)
                {
                    return index;
                }

                if (name == "IEND") // Nothing should exist past IEND in a normal png file, so we should stop parsing here to avoid trying to parse junk data.
                {
                    return -1;
                }

                // The chunk length is 4 bytes, the chunk name is 4 bytes, the chunk data is length bytes, and the chunk CRC is 4 bytes.
                // We add 12 to the index to get to the start of the next chunk in the file on the next loop.
                index += length + 12;
                chunksProcessed++;

                if (chunksProcessed > chunkSeekLimit) break;
            }

            return -1;
        }

        private static int FindChunkIndex(FileStream fs, string type, bool seekEnd)
        {
            int chunksProcessed = 0;
            int chunkSeekLimit = 5;

            bool isLittleEndian = BitConverter.IsLittleEndian;

            fs.Seek(8, SeekOrigin.Begin);

            byte[] buffer = new byte[8];

            while (fs.Position < fs.Length)
            {
                int chunkIndex = (int)fs.Position;

                fs.Read(buffer, 0, 8); // Read both chunkLength and chunkName at once into this buffer

                // BitConverter wants little endian(unless your system is big endian for some reason), PNG multi-byte integers are big endian. So we reverse the array.
                if (isLittleEndian) Array.Reverse(buffer, 0, 4); // Only reverse the chunkLength part

                int chunkLength = BitConverter.ToInt32(buffer, 0);
                string chunkType = Encoding.UTF8.GetString(buffer, 4, 4); // We don't need to reverse strings since UTF-8 strings aren't affected by endianess, given that they're a sequence of bytes. 

                if (chunkType == type) return chunkIndex;
                if (chunkType == "IEND") return -1; // Nothing should exist past IEND in a normal png file, so we should stop parsing here to avoid trying to parse junk data.

                // The chunk length is 4 bytes, the chunk name is 4 bytes, the chunk data is chunkLength bytes, and the chunk CRC after chunk data is 4 bytes.
                // We've already read the length/type which is the first 8 bytes, so we'll seek the chunk length + 4(CRC) to get to the start of the next chunk in the file.
                fs.Seek(chunkLength + 4, SeekOrigin.Current);
                chunksProcessed++;

                if (chunksProcessed > chunkSeekLimit) break;
            }

            // If we've processed more than 5 chunks and still haven't found the chunk we're looking for, we'll start searching from the end of the file.

            // We start at an offset of 12 since the IEND chunk (should) always be the last chunk in the file, be 12 bytes, and we don't need to check it.
            fs.Seek(-12, SeekOrigin.End);

            // We're going to read the last 4096 bytes of the file, which (should) be enough to find any trailing iTXt chunks we're looking for.
            // If an LFS screenshots has the metadata of like 80 players attached to it, this likely won't be enough to find the iTXt chunk.
            // I don't have any screenshots with that much metadata to test with and will not create them manually, so I'm not going to worry about it for now.
            var chunkNameBytes = Encoding.UTF8.GetBytes(type);
            fs.Seek(-4096, SeekOrigin.Current);

            byte[] trailingBytes = new byte[4096];
            fs.Read(trailingBytes, 0, 4096);

            // At this scale we can just brute force/naive search for the chunk name in the trailing bytes and performance will be fine.
            for (int i = 0; i <= trailingBytes.Length - chunkNameBytes.Length; i++)
            {
                bool isMatch = true;
                for (int j = 0; j < chunkNameBytes.Length; j++)
                {
                    if (trailingBytes[i + j] != chunkNameBytes[j])
                    {
                        isMatch = false;
                        break;
                    }
                }
                if (isMatch)
                {
                    return (int)fs.Position - 4096 + i - 4;
                }
            }

            return -1;
        }

        /// <summary>
        ///     Finds the index of the end of the specified chunk type in the specified PNG file.
        /// </summary>
        /// <param name="png">Array of bytes representing a PNG file.</param>
        /// <param name="type">Type of PMG chunk to find</param>
        /// <returns></returns>
        private static int FindEndOfChunk(byte[] png, string type)
        {
            var index = FindChunkIndex(png, type);
            if (index == -1) return index;

            var chunkLength = new byte[4];
            Array.Copy(png, index, chunkLength, 0, 4);
            Array.Reverse(chunkLength);
            var length = BitConverter.ToInt32(chunkLength, 0);

            return index + length + 12;
        }

        /// <summary>
        ///     Finds the specified chunk type in the specified PNG file and returns it as a PNGChunk.
        /// </summary>
        /// <param name="png">Array of bytes representing a PNG file</param>
        /// <param name="type">Type of PMG chunk to find</param>
        /// <returns>PNGChunk</returns>
        private static PNGChunk FindChunk(byte[] png, string type)
        {
            var index = FindChunkIndex(png, type);
            if (index == -1) return null;

            var chunkLength = new byte[4];
            Array.Copy(png, index, chunkLength, 0, 4);
            Array.Reverse(chunkLength);
            var length = BitConverter.ToInt32(chunkLength, 0);

            var chunkData = new byte[length];
            Array.Copy(png, index + 8, chunkData, 0, length);

            return new PNGChunk(type, chunkData);
        }

        /// <summary>
        ///     Finds the specified chunk type in the specified PNG file and returns it as a PNGChunk.
        /// </summary>
        /// <param name="fs">FileStream of a PNG file.</param>
        /// <param name="type">Type of PMG chunk to find</param>
        /// <returns>PNGChunk</returns>
        private static PNGChunk FindChunk(FileStream fs, string type, bool seekFromEnd)
        {
            var index = FindChunkIndex(fs, type, seekFromEnd);
            if (index == -1) return null;

            // Seek back to start of found chunk
            fs.Seek(index, SeekOrigin.Begin);

            var chunkLength = new byte[4];
            fs.Read(chunkLength, 0, 4);
            Array.Reverse(chunkLength);
            var length = BitConverter.ToInt32(chunkLength, 0);

            // Skip the chunk type bytes
            fs.Seek(4, SeekOrigin.Current);

            var chunkData = new byte[length];
            fs.Read(chunkData, 0, length);

            return new PNGChunk(type, chunkData);
        }

        /// <summary>
        /// Parses the metadata string of a vrchat screenshot with taken with LFS and returns a JObject containing the parsed data.
        /// </summary>
        /// <param name="metadataString">The metadata string to parse.</param>
        /// <returns>A JObject containing the parsed data.</returns>
        public static ScreenshotMetadata ParseLfsPicture(string metadataString)
        {
            var metadata = new ScreenshotMetadata();
            // LFS v2 format: https://github.com/knah/VRCMods/blob/c7e84936b52b6f476db452a37ab889eabe576845/LagFreeScreenshots/API/MetadataV2.cs#L35
            // Normal entry
            // lfs|2|author:usr_032383a7-748c-4fb2-94e4-bcb928e5de6b,Natsumi-sama|world:wrld_b016712b-5ce6-4bcb-9144-c8ed089b520f,35372,pet park test|pos:-60.49379,-0.002925932,5.805772|players:usr_9d73bff9-4543-4b6f-a004-9e257869ff50,-0.85,-0.17,-0.58,Olivia.;usr_3097f91e-a816-4c7a-a625-38fbfdee9f96,12.30,13.72,0.08,Zettai Ryouiki;usr_032383a7-748c-4fb2-94e4-bcb928e5de6b,0.68,0.32,-0.28,Natsumi-sama;usr_7525f45f-517e-442b-9abc-fbcfedb29f84,0.51,0.64,0.70,Weyoun
            // Entry with image rotation enabled (rq:)
            // lfs|2|author:usr_8c0a2f22-26d4-4dc9-8396-2ab40e3d07fc,knah|world:wrld_fb4edc80-6c48-43f2-9bd1-2fa9f1345621,35341,Luminescent Ledge|pos:8.231676,0.257298,-0.1983307|rq:2|players:usr_65b9eeeb-7c91-4ad2-8ce4-addb1c161cd6,0.74,0.59,1.57,Jakkuba;usr_6a50647f-d971-4281-90c3-3fe8caf2ba80,8.07,9.76,0.16,SopwithPup;usr_8c0a2f22-26d4-4dc9-8396-2ab40e3d07fc,0.26,1.03,-0.28,knah;usr_7f593ad1-3e9e-4449-a623-5c1c0a8d8a78,0.15,0.60,1.46,NekOwneD

            // LFS v1 format: https://github.com/knah/VRCMods/blob/23c3311fdfc4af4b568eedfb2e366710f2a9f925/LagFreeScreenshots/LagFreeScreenshotsMod.cs 
            // Why support this tho
            // lfs|1|world:wrld_6caf5200-70e1-46c2-b043-e3c4abe69e0f:47213,The Great Pug|players:usr_290c03d6-66cc-4f0e-b782-c07f5cfa8deb,VirtualTeacup;usr_290c03d6-66cc-4f0e-b782-c07f5cfa8deb,VirtualTeacup

            // LFS CVR Edition v1 format: https://github.com/dakyneko/DakyModsCVR/blob/48eecd1bccd1a5b2ea844d899d59cf1186ec9912/LagFreeScreenshots/API/MetadataV2.cs#L41
            // lfs|cvr|1|author:047b30bd-089d-887c-8734-b0032df5d176,Hordini|world:2e73b387-c6d4-45e9-b998-0fd6aa122c1d,i+efec20004ef1cd8b-404003-93833f-1aee112a,Bono's Basement (Anime) (#816724)|pos:2.196716,0.01250899,-3.817466|players:5301af21-eb8d-7b36-3ef4-b623fa51c2c6,3.778407,0.01250887,-3.815876,DDAkebono;f9e5c36c-41b0-7031-1185-35b4034010c0,4.828233,0.01250893,-3.920135,Natsumi

            var lfsParts = metadataString.Split('|');
            if (lfsParts[1] == "cvr")
                lfsParts = lfsParts.Skip(1).ToArray();

            var version = int.Parse(lfsParts[1]);
            var application = lfsParts[0];
            metadata.Application = application;
            metadata.Version = version;

            bool isCVR = application == "cvr";

            if (application == "screenshotmanager")
            {
                // ScreenshotManager format: https://github.com/DragonPlayerX/ScreenshotManager/blob/33950b98003e795d29c68ce5fe1d86e7e65c92ad/ScreenshotManager/Core/FileDataHandler.cs#L94
                // screenshotmanager|0|author:usr_290c03d6-66cc-4f0e-b782-c07f5cfa8deb,VirtualTeacup|wrld_6caf5200-70e1-46c2-b043-e3c4abe69e0f,47213,The Great Pug
                var author = lfsParts[2].Split(',');

                metadata.Author.Id = author[0];
                metadata.Author.DisplayName = author[1];

                var world = lfsParts[3].Split(',');

                metadata.World.Id = world[0];
                metadata.World.Name = world[2];
                metadata.World.InstanceId = string.Join(":", world[0], world[1]); // worldId:instanceId format, same as vrcx format, just minimal
                return metadata;
            }

            for (var i = 2; i < lfsParts.Length; i++)
            {
                var split = lfsParts[i].Split(':');
                var key = split[0];
                var value = split[1];

                if (String.IsNullOrEmpty(value)) // One of my LFS files had an empty value for 'players:'. not pog
                    continue;

                var parts = value.Split(',');

                switch (key)
                {
                    case "author":
                        metadata.Author.Id = isCVR ? string.Empty : parts[0];
                        metadata.Author.DisplayName = isCVR ? $"{parts[1]} ({parts[0]})" : parts[1];
                        break;

                    case "world":
                        metadata.World.Id = isCVR || version == 1 ? string.Empty : parts[0];
                        metadata.World.InstanceId = isCVR || version == 1 ? string.Empty : string.Join(":", parts[0], parts[1]); // worldId:instanceId format, same as vrcx format, just minimal
                        metadata.World.Name = isCVR ? $"{parts[2]} ({parts[0]})" : (version == 1 ? value : parts[2]);
                        break;

                    case "pos":
                        float.TryParse(parts[0], out float x);
                        float.TryParse(parts[1], out float y);
                        float.TryParse(parts[2], out float z);

                        metadata.Pos = new Vector3(x, y, z);
                        break;

                    // We don't use this, so don't parse it.
                    /*case "rq":
                        // Image rotation 
                        metadata.Add("rq", value);
                        break;*/

                    case "players":
                        var playersArray = metadata.Players;
                        var players = value.Split(';');

                        foreach (var player in players)
                        {
                            var playerParts = player.Split(',');

                            float.TryParse(playerParts[1], out float x2);
                            float.TryParse(playerParts[2], out float y2);
                            float.TryParse(playerParts[3], out float z2);

                            var playerDetail = new ScreenshotMetadata.PlayerDetail
                            {
                                Id = isCVR ? string.Empty : playerParts[0],
                                DisplayName = isCVR ? $"{playerParts[4]} ({playerParts[0]})" : playerParts[4],
                                Pos = new Vector3(x2, y2, z2)
                            };

                            playersArray.Add(playerDetail);
                        }
                        break;
                }
            }

            return metadata;
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
        // crc lookup table
        private static uint[] crcTable;

        // init lookup table and store crc for iTXt
        private static readonly uint iTXtCrc = Crc32(new[] { (byte)'i', (byte)'T', (byte)'X', (byte)'t' }, 0, 4, 0);
        private readonly Encoding keywordEncoding = Encoding.GetEncoding("ISO-8859-1"); // ISO-8859-1/Latin1 is the encoding used for the keyword in text chunks. 
        public List<byte> ChunkDataBytes;
        public int ChunkDataLength;
        public string ChunkType;

        public PNGChunk(string chunkType)
        {
            ChunkType = chunkType;
            ChunkDataBytes = new List<byte>();
        }

        public PNGChunk(string chunkType, byte[] bytes)
        {
            ChunkType = chunkType;
            ChunkDataBytes = bytes.ToList();
            ChunkDataLength = bytes.Length;
        }

        /// <summary>
        ///     Initializes this PNGChunk's data in the format of an iTXt chunk with the specified keyword and text.
        /// </summary>
        /// <param name="keyword">Keyword for text chunk</param>
        /// <param name="text">Text data for text chunk</param>
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

        /// <summary>
        ///     Constructs and returns a full, coherent PNG chunk from this PNGChunk's data.
        /// </summary>
        /// <returns>PNG chunk byte array</returns>
        public byte[] ConstructChunkByteArray()
        {
            var chunk = new List<byte>();

            var chunkLengthBytes = BitConverter.GetBytes(ChunkDataLength);
            var chunkCRCBytes = BitConverter.GetBytes(Crc32(ChunkDataBytes.ToArray(), 0, ChunkDataLength, iTXtCrc));

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

        /// <summary>
        ///     Gets the text from an iTXt chunk
        /// </summary>
        /// <param name="keyword">Keyword of the text chunk</param>
        /// <returns>Text from chunk.</returns>
        public string GetText(string keyword)
        {
            var offset = keywordEncoding.GetByteCount(keyword) + 5;
            return Encoding.UTF8.GetString(ChunkDataBytes.ToArray(), offset, ChunkDataBytes.Count - offset);
        }

        public string GetResolution()
        {
            var x = BitConverter.ToInt32(ChunkDataBytes.Take(4).Reverse().ToArray(), 0);
            var y = BitConverter.ToInt32(ChunkDataBytes.Skip(4).Take(4).Reverse().ToArray(), 0);
            return $"{x}x{y}";
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