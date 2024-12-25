using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.RegularExpressions;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;

namespace VRCX;

public partial class AppApiCommon
{
        public string GetExtraScreenshotData(string path, bool carouselCache)
        {
            var fileName = Path.GetFileNameWithoutExtension(path);
            var metadata = new JObject();

            if (!File.Exists(path) || !path.EndsWith(".png"))
                return null;

            var files = Directory.GetFiles(Path.GetDirectoryName(path), "*.png");

            // Add previous/next file paths to metadata so the screenshot viewer carousel can request metadata for next/previous images in directory
            if (carouselCache)
            {
                var index = Array.IndexOf(files, path);
                if (index > 0)
                {
                    metadata.Add("previousFilePath", files[index - 1]);
                }
                if (index < files.Length - 1)
                {
                    metadata.Add("nextFilePath", files[index + 1]);
                }
            }

            metadata.Add("fileResolution", ScreenshotHelper.ReadPNGResolution(path));

            var creationDate = File.GetCreationTime(path);
            metadata.Add("creationDate", creationDate.ToString("yyyy-MM-dd HH:mm:ss"));

            var fileSizeBytes = new FileInfo(path).Length;
            metadata.Add("fileSizeBytes", fileSizeBytes.ToString());
            metadata.Add("fileName", fileName);
            metadata.Add("filePath", path);
            metadata.Add("fileSize", $"{(fileSizeBytes / 1024f / 1024f).ToString("0.00")} MB");

            return metadata.ToString(Formatting.Indented);
        }

        public string GetScreenshotMetadata(string path)
        {
            if (string.IsNullOrEmpty(path))
                return null;


            var metadata = ScreenshotHelper.GetScreenshotMetadata(path);

            if (metadata == null)
            {
                var obj = new JObject
                {
                    { "sourceFile", path },
                    { "error", "Screenshot contains no metadata." }
                };

                return obj.ToString(Formatting.Indented);
            };

            if (metadata.Error != null)
            {
                var obj = new JObject
                {
                    { "sourceFile", path },
                    { "error", metadata.Error }
                };

                return obj.ToString(Formatting.Indented);
            }

            return JsonConvert.SerializeObject(metadata, Formatting.Indented, new JsonSerializerSettings
            {
                ContractResolver = new DefaultContractResolver
                {
                    NamingStrategy = new CamelCaseNamingStrategy() // This'll serialize our .net property names to their camelCase equivalents. Ex; "FileName" -> "fileName"
                }
            });
        }

        public string FindScreenshotsBySearch(string searchQuery, int searchType = 0)
        {
            var stopwatch = new Stopwatch();
            stopwatch.Start();

            var searchPath = GetVRChatPhotosLocation();
            var screenshots = ScreenshotHelper.FindScreenshots(searchQuery, searchPath, (ScreenshotHelper.ScreenshotSearchType)searchType);

            JArray json = new JArray();

            foreach (var screenshot in screenshots)
            {
                json.Add(screenshot.SourceFile);
            }

            stopwatch.Stop();

            logger.Info($"FindScreenshotsBySearch took {stopwatch.ElapsedMilliseconds}ms to complete.");

            return json.ToString();
        }

        public string GetLastScreenshot()
        {
            // Get the last screenshot taken by VRChat
            var path = GetVRChatPhotosLocation();
            if (!Directory.Exists(path))
                return null;

            var lastDirectory = Directory.GetDirectories(path).OrderByDescending(Directory.GetCreationTime).FirstOrDefault();
            if (lastDirectory == null)
                return null;

            var lastScreenshot = Directory.GetFiles(lastDirectory, "*.png").OrderByDescending(File.GetCreationTime).FirstOrDefault();
            if (lastScreenshot == null)
                return null;

            return lastScreenshot;
        }
}