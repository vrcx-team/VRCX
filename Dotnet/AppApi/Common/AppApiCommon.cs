using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using librsync.net;
using NLog;

namespace VRCX
{
    public abstract partial class AppApiCommon
    {
        private static readonly Logger logger = LogManager.GetCurrentClassLogger();
        private static readonly MD5 _hasher = MD5.Create();
        
        public string MD5File(string blob)
        {
            var fileData = Convert.FromBase64CharArray(blob.ToCharArray(), 0, blob.Length);
            using var md5 = MD5.Create();
            var md5Hash = md5.ComputeHash(fileData);
            return Convert.ToBase64String(md5Hash);
        }
        
        public int GetColourFromUserID(string userId)
        {
            var hash = _hasher.ComputeHash(Encoding.UTF8.GetBytes(userId));
            return (hash[3] << 8) | hash[4];
        }
        
        public string ResizeImageToFitLimits(string base64data)
        {
            return Convert.ToBase64String(ResizeImageToFitLimits(Convert.FromBase64String(base64data), false));
        }

        public byte[] ResizeImageToFitLimits(byte[] imageData, bool matchingDimensions, int maxWidth = 2000, int maxHeight = 2000, long maxSize = 10_000_000)
        {
            using var fileMemoryStream = new MemoryStream(imageData);
            var image = new Bitmap(fileMemoryStream);

            // for APNG, check if image is png format and less than maxSize
            if ((!matchingDimensions || image.Width == image.Height) &&
                image.RawFormat.Equals(System.Drawing.Imaging.ImageFormat.Png) &&
                imageData.Length < maxSize &&
                image.Width <= maxWidth &&
                image.Height <= maxHeight)
            {
                return imageData;
            }

            if (image.Width > maxWidth)
            {
                var sizingFactor = image.Width / (double)maxWidth;
                var newHeight = (int)Math.Round(image.Height / sizingFactor);
                image = new Bitmap(image, maxWidth, newHeight);
            }
            if (image.Height > maxHeight)
            {
                var sizingFactor = image.Height / (double)maxHeight;
                var newWidth = (int)Math.Round(image.Width / sizingFactor);
                image = new Bitmap(image, newWidth, maxHeight);
            }
            if (matchingDimensions && image.Width != image.Height)
            {
                var newSize = Math.Max(image.Width, image.Height);
                var newImage = new Bitmap(newSize, newSize);
                using var graphics = Graphics.FromImage(newImage);
                graphics.Clear(Color.Transparent);
                graphics.DrawImage(image, new Rectangle((newSize - image.Width) / 2, (newSize - image.Height) / 2, image.Width, image.Height));
                image.Dispose();
                image = newImage;
            }

            SaveToFileToUpload();
            for (int i = 0; i < 250 && imageData.Length > maxSize; i++)
            {
                SaveToFileToUpload();
                if (imageData.Length < maxSize)
                    break;

                int newWidth;
                int newHeight;
                if (image.Width > image.Height)
                {
                    newWidth = image.Width - 25;
                    newHeight = (int)Math.Round(image.Height / (image.Width / (double)newWidth));
                }
                else
                {
                    newHeight = image.Height - 25;
                    newWidth = (int)Math.Round(image.Width / (image.Height / (double)newHeight));
                }
                image = new Bitmap(image, newWidth, newHeight);
            }

            if (imageData.Length > maxSize)
            {
                throw new Exception("Failed to get image into target filesize.");
            }

            return imageData;

            void SaveToFileToUpload()
            {
                using var imageSaveMemoryStream = new MemoryStream();
                image.Save(imageSaveMemoryStream, System.Drawing.Imaging.ImageFormat.Png);
                imageData = imageSaveMemoryStream.ToArray();
            }
        }

        public byte[] ResizePrintImage(byte[] imageData)
        {
            var inputImage = ResizeImageToFitLimits(imageData, false, 1920, 1080);
            using var fileMemoryStream = new MemoryStream(inputImage);
            var image = new Bitmap(fileMemoryStream);

            // increase size to 1920x1080
            if (image.Width < 1920 || image.Height < 1080)
            {
                var newHeight = image.Height;
                var newWidth = image.Width;
                if (image.Width < 1920)
                {
                    newWidth = 1920;
                    newHeight = (int)Math.Round(image.Height / (image.Width / (double)newWidth));
                }
                if (image.Height < 1080)
                {
                    newHeight = 1080;
                    newWidth = (int)Math.Round(image.Width / (image.Height / (double)newHeight));
                }
                var resizedImage = new Bitmap(1920, 1080);
                using var graphics1 = Graphics.FromImage(resizedImage);
                graphics1.Clear(Color.White);
                var x = (1920 - newWidth) / 2;
                var y = (1080 - newHeight) / 2;
                graphics1.DrawImage(image, new Rectangle(x, y, newWidth, newHeight));
                image.Dispose();
                image = resizedImage;
            }

            // add white border
            // wtf are these magic numbers
            const int xOffset = 64; // 2048 / 32
            const int yOffset = 69; // 1440 / 20.869
            var newImage = new Bitmap(2048, 1440);
            using var graphics = Graphics.FromImage(newImage);
            graphics.Clear(Color.White);
            graphics.DrawImage(image, new Rectangle(xOffset, yOffset, image.Width, image.Height));
            image.Dispose();
            image = newImage;

            using var imageSaveMemoryStream = new MemoryStream();
            image.Save(imageSaveMemoryStream, System.Drawing.Imaging.ImageFormat.Png);
            return imageSaveMemoryStream.ToArray();
        }
        
        public string SignFile(string blob)
        {
            var fileData = Convert.FromBase64String(blob);
            using var sig = Librsync.ComputeSignature(new MemoryStream(fileData));
            using var memoryStream = new MemoryStream();
            sig.CopyTo(memoryStream);
            var sigBytes = memoryStream.ToArray();
            return Convert.ToBase64String(sigBytes);
        }
        
        public string FileLength(string blob)
        {
            var fileData = Convert.FromBase64String(blob);
            return fileData.Length.ToString();
        }
        
        public void OpenLink(string url)
        {
            if (url.StartsWith("http://") ||
                url.StartsWith("https://"))
            {
                Process.Start(new ProcessStartInfo(url)
                {
                    UseShellExecute = true
                });
            }
        }
        
        public async Task<string> GetImage(string url, string fileId, string version)
        {
            return await ImageCache.GetImage(url, fileId, version);
        }
        
        public void IPCAnnounceStart()
        {
            IPCServer.Send(new IPCPacket
            {
                Type = "VRCXLaunch",
                MsgType = "VRCXLaunch"
            });
        }
        
        public void SendIpc(string type, string data)
        {
            IPCServer.Send(new IPCPacket
            {
                Type = "VrcxMessage",
                MsgType = type,
                Data = data
            });
        }
        
        public string CustomCssPath()
        {
            var output = string.Empty;
            var filePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "VRCX\\custom.css");
            if (File.Exists(filePath))
                output = filePath;
            return output;
        }

        public string CustomScriptPath()
        {
            var output = string.Empty;
            var filePath = Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "VRCX\\custom.js");
            if (File.Exists(filePath))
                output = filePath;
            return output;
        }

        public string CurrentCulture()
        {
            return CultureInfo.CurrentCulture.ToString();
        }

        public string CurrentLanguage()
        {
            return CultureInfo.InstalledUICulture.Name;
        }

        public string GetVersion()
        {
            return Program.Version;
        }

        public bool VrcClosedGracefully()
        {
            return LogWatcher.Instance.VrcClosedGracefully;
        }

        public Dictionary<string, int> GetColourBulk(List<object> userIds)
        {
            var output = new Dictionary<string, int>();
            foreach (string userId in userIds)
            {
                output.Add(userId, GetColourFromUserID(userId));
            }

            return output;
        }
        
        public void SetAppLauncherSettings(bool enabled, bool killOnExit)
        {
            AutoAppLaunchManager.Instance.Enabled = enabled;
            AutoAppLaunchManager.Instance.KillChildrenOnExit = killOnExit;
        }
        
        public string GetFileBase64(string path)
        {
            if (File.Exists(path))
            {
                return Convert.ToBase64String(File.ReadAllBytes(path));
            }

            return null;
        }
        
        public async Task<bool> SavePrintToFile(string url, string ugcFolderPath, string monthFolder, string fileName)
        {
            var folder = Path.Combine(GetUGCPhotoLocation(ugcFolderPath), "Prints", MakeValidFileName(monthFolder));
            Directory.CreateDirectory(folder);
            var filePath = Path.Combine(folder, MakeValidFileName(fileName));
            if (File.Exists(filePath))
                return false;

            return await ImageCache.SaveImageToFile(url, filePath);
        }

        public async Task<bool> SaveStickerToFile(string url, string ugcFolderPath, string monthFolder, string fileName)
        {
            var folder = Path.Combine(GetUGCPhotoLocation(ugcFolderPath), "Stickers", MakeValidFileName(monthFolder));
            Directory.CreateDirectory(folder);
            var filePath = Path.Combine(folder, MakeValidFileName(fileName));
            if (File.Exists(filePath))
                return false;

            return await ImageCache.SaveImageToFile(url, filePath);
        }
    }
}