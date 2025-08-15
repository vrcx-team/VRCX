#nullable enable
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Numerics;
using System.Text;
using System.Xml;
using Newtonsoft.Json;
using NLog;

namespace VRCX
{
    internal static class ScreenshotHelper
    {
        private static readonly Logger Logger = LogManager.GetCurrentClassLogger();
        private static readonly ScreenshotMetadataDatabase CacheDatabase = new(Path.Join(Program.AppDataDirectory, "metadataCache.db"));
        private static readonly Dictionary<string, ScreenshotMetadata?> MetadataCache = new();

        public enum ScreenshotSearchType
        {
            Username,
            UserID,
            WorldName,
            WorldID,
        }

        public static bool TryGetCachedMetadata(string filePath, out ScreenshotMetadata? metadata)
        {
            if (MetadataCache.TryGetValue(filePath, out metadata))
                return true;

            var id = CacheDatabase.IsFileCached(filePath);
            if (id == -1)
                return false;
            
            var metadataStr = CacheDatabase.GetMetadataById(id);
            var metadataObj = metadataStr == null ? null : JsonConvert.DeserializeObject<ScreenshotMetadata>(metadataStr);
            MetadataCache.Add(filePath, metadataObj);

            metadata = metadataObj;
            return true;
        }

        public static List<ScreenshotMetadata> FindScreenshots(string query, string directory, ScreenshotSearchType searchType)
        {
            var result = new List<ScreenshotMetadata>();
            var files = Directory.GetFiles(directory, "*.png", SearchOption.AllDirectories);
            var addToCache = new List<MetadataCache>();
            var amtFromCache = 0;
            foreach (var file in files)
            {
                ScreenshotMetadata? metadata;
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
                        MetadataCache.TryAdd(file, null);
                        continue;
                    }

                    dbEntry.Metadata = JsonConvert.SerializeObject(metadata);
                    addToCache.Add(dbEntry);
                    MetadataCache.TryAdd(file, metadata);
                }

                if (metadata == null)
                    continue;

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
                        if (metadata.World.Name == null)
                            continue;
                        
                        if (metadata.World.Name.Contains(query, StringComparison.OrdinalIgnoreCase))
                            result.Add(metadata);

                        break;
                    case ScreenshotSearchType.WorldID:
                        if (metadata.World.Id == query)
                            result.Add(metadata);

                        break;
                }
            }

            if (addToCache.Count > 0)
                CacheDatabase.BulkAddMetadataCache(addToCache);

            Logger.ConditionalDebug("Found {0}/{1} screenshots matching query '{2}' of type '{3}'. {4}/{5} pulled from cache.", result.Count, files.Length, query, searchType, amtFromCache, files.Length);

            return result;
        }

        public static ScreenshotMetadata? GetScreenshotMetadata(string path, bool includeJSON = false)
        {
            // Early return if file doesn't exist, or isn't a PNG(Check both extension and file header)
            if (!File.Exists(path) || !path.EndsWith(".png"))
                return null;

            List<string> metadata = ReadTextMetadata(path);
            ScreenshotMetadata result = new ScreenshotMetadata();

            for (var i = 0; i < metadata.Count; i++)
            {
                bool gotMetadata = false;
                bool gotVrchatMetadata = false;
                try
                {
                    var metadataString = metadata[i];

                    if (metadataString.StartsWith("<x:xmpmeta"))
                    {
                        result = ParseVRCImage(metadataString);
                        result.SourceFile = path;

                        gotVrchatMetadata = true;
                    }
                    
                    if (metadataString.StartsWith("{") && metadataString.EndsWith("}")) // # Professional Json Validatior© 2.0
                    {
                        var vrcxMetadataResult = JsonConvert.DeserializeObject<ScreenshotMetadata>(metadataString);
                        if (vrcxMetadataResult != null)
                        {
                            vrcxMetadataResult.SourceFile = path;
                            if (gotVrchatMetadata)
                            {
                                result.Players = vrcxMetadataResult.Players;
                                result.World.InstanceId = vrcxMetadataResult.World.InstanceId;
                            }
                            else
                            {
                                result = vrcxMetadataResult;
                            }

                            if (includeJSON)
                                result.JSON = metadataString;
                        
                            gotMetadata = true;
                        }
                    }

                    if (metadataString.StartsWith("lfs") || metadataString.StartsWith("screenshotmanager"))
                    {
                        result = ScreenshotHelper.ParseLfsPicture(metadataString);
                        result.SourceFile = path;
                    }
                }
                catch (Exception ex)
                {
                    Logger.Error(ex, "Failed to parse metadata for file '{0}\n---'{1}\n---", path, String.Join("\n", metadata));
                    return ScreenshotMetadata.JustError(path, "Failed to parse metadata. Check log file for details.");
                }
            }

            if (result.Application == null || metadata.Count == 0) 
                return ScreenshotMetadata.JustError(path, "Image has no valid metadata.");

            return result;
        }
        
        /// <summary>
        /// Reads textual metadata from a PNG image file.
        /// </summary>
        /// <param name="path">The path to the PNG image file.</param>
        /// <returns>A list of metadata strings found in the image file.</returns>
        /// <remarks>
        /// This function reads all the text chunks from the PNG image file and returns them as a list.
        /// For VRChat screenshots, the list will contain the "XML:com.adobe.xmp"(VRChat, usually) and "Description"(VRCX) chunks, with the VRChat metadata always coming first if available.
        /// The strings are not guaranteed to be valid metadata.
        /// If no metadata is found, an empty list is returned.
        /// </remarks>
        public static List<string> ReadTextMetadata(string path)
        {
            using var pngFile = new PNGFile(path, false);
            var result = new List<string>();
            var metadata = PNGHelper.ReadTextChunk("Description", pngFile);
            var vrchatMetadata = PNGHelper.ReadTextChunk("XML:com.adobe.xmp", pngFile);
            
            if (!string.IsNullOrEmpty(vrchatMetadata))
                result.Add(vrchatMetadata);
            
            if (!string.IsNullOrEmpty(metadata))
                result.Add(metadata);

            // Check for chunk only present in files created by older modded versions of vrchat. (LFS, screenshotmanager), which put their metadata at the end of the file (which is not in spec bro).
            // Searching from the end of the file is a slower bruteforce operation so only do it if we have to.
            if (result.Count == 0 && pngFile.GetChunk(PNGChunkTypeFilter.sRGB) != null)
            {
                var lfsMetadata = PNGHelper.ReadTextChunk("Description", pngFile, true);
                
                if (!string.IsNullOrEmpty(lfsMetadata))
                    result.Add(lfsMetadata);
            }

            return result;
        }

        public static void DeleteTextMetadata(string path, bool deleteVRChatMetadata = false)
        {
            using var pngFile = new PNGFile(path, 128 * 1024);
            if (deleteVRChatMetadata)
                PNGHelper.DeleteTextChunk("XML:com.adobe.xmp", pngFile);
            
            PNGHelper.DeleteTextChunk("Description", pngFile);
        }
        
        public static bool WriteVRCXMetadata(string text, string path)
        {
            using var pngFile = new PNGFile(path, true);
            var chunk = PNGHelper.GenerateTextChunk("Description", text);
            
            return pngFile.WriteChunk(chunk);;
        }

        public static ScreenshotMetadata ParseVRCImage(string xmlString)
        {
            var index = xmlString.IndexOf("<x:xmpmeta", StringComparison.Ordinal);
            xmlString = xmlString.Substring(index);
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
            var authorName = root.SelectSingleNode("//xmp:Author", nsManager)?.InnerText; // legacy, it was authorId
            var dateTime = root.SelectSingleNode("//tiff:DateTime", nsManager)?.InnerText;
            var note = root.SelectSingleNode("//dc:title/rdf:Alt/rdf:li", nsManager)?.InnerText;
            var worldId = root.SelectSingleNode("//vrc:WorldID", nsManager)?.InnerText;
            var worldDisplayName = root.SelectSingleNode("//vrc:WorldDisplayName", nsManager)?.InnerText; // new, 01.08.2025
            var authorId = root.SelectSingleNode("//vrc:AuthorID", nsManager)?.InnerText; // new, 01.08.2025
            
            if (string.IsNullOrEmpty(worldId))
                worldId = root.SelectSingleNode("//vrc:World", nsManager)?.InnerText; // legacy, it's gone now
            
            if (string.IsNullOrEmpty(authorId))
            {
                // If authorId is not set, we assume legacy metadata format where authorName is used as authorId.
                authorId = authorName;
                authorName = null;
            }

            return new ScreenshotMetadata
            {
                Application = creatorTool,
                Version = 1,
                Author = new ScreenshotMetadata.AuthorDetail
                {
                    Id = authorId,
                    DisplayName = authorName
                },
                World = new ScreenshotMetadata.WorldDetail
                {
                    Id = worldId,
                    InstanceId = worldId,
                    Name = worldDisplayName
                },
                Timestamp = DateTime.TryParse(dateTime, out var dt) ? dt : null,
                Note = note
            };
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
            using var fs = new FileStream(path, FileMode.Open, FileAccess.Read, FileShare.ReadWrite);
            if (fs.Length < 33) return false; // I don't remember how I came up with this number, but a PNG file below this size is not going to be valid for our purposes.

            var signature = new byte[8];
            fs.ReadExactly(signature, 0, 8);
            return signature.SequenceEqual(pngSignatureBytes);
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

            var isCVR = application == "cvr";

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

                if (string.IsNullOrEmpty(value)) // One of my LFS files had an empty value for 'players:'. not pog
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
}