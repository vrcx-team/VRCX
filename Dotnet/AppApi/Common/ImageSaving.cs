using System;
using System.Drawing;
using System.IO;
using System.Threading.Tasks;

namespace VRCX
{
    public partial class AppApi
    {
        public async Task<string> GetImage(string url, string fileId, string version)
        {
            return await ImageCache.GetImage(url, fileId, version);
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
            const int desiredWidth = 1920;
            const int desiredHeight = 1080;

            using var fileMemoryStream = new MemoryStream(imageData);
            var image = new Bitmap(fileMemoryStream);

            if (image.Height > image.Width)
                image.RotateFlip(RotateFlipType.Rotate90FlipNone);

            // increase size to 1920x1080
            if (image.Width < desiredWidth || image.Height < desiredHeight)
            {
                var newHeight = image.Height;
                var newWidth = image.Width;
                if (image.Width < desiredWidth)
                {
                    var testHeight = (int)Math.Round(image.Height / (image.Width / (double)desiredWidth));
                    if (testHeight <= desiredHeight)
                    {
                        newWidth = desiredWidth;
                        newHeight = testHeight;
                    }
                }
                if (image.Height < desiredHeight)
                {
                    var testWidth = (int)Math.Round(image.Width / (image.Height / (double)desiredHeight));
                    if (testWidth <= desiredWidth)
                    {
                        newHeight = desiredHeight;
                        newWidth = testWidth;
                    }
                }
                var resizedImage = new Bitmap(desiredWidth, desiredHeight);
                using var graphics1 = Graphics.FromImage(resizedImage);
                graphics1.Clear(Color.White);
                var x = (desiredWidth - newWidth) / 2;
                var y = (desiredHeight - newHeight) / 2;
                graphics1.DrawImage(image, new Rectangle(x, y, newWidth, newHeight));
                image.Dispose();
                image = resizedImage;
            }
            
            // limit size to 1920x1080
            if (image.Width > desiredWidth)
            {
                var sizingFactor = image.Width / (double)desiredWidth;
                var newHeight = (int)Math.Round(image.Height / sizingFactor);
                image = new Bitmap(image, desiredWidth, newHeight);
            }
            if (image.Height > desiredHeight)
            {
                var sizingFactor = image.Height / (double)desiredHeight;
                var newWidth = (int)Math.Round(image.Width / sizingFactor);
                image = new Bitmap(image, newWidth, desiredHeight);
            }

            // add white border
            // wtf are these magic numbers
            const int xOffset = 64; // 2048 / 32
            const int yOffset = 69; // 1440 / 20.869
            var newImage = new Bitmap(2048, 1440);
            using var graphics = Graphics.FromImage(newImage);
            graphics.Clear(Color.White);
            // graphics.DrawImage(image, new Rectangle(xOffset, yOffset, image.Width, image.Height));
            var newX = (2048 - image.Width) / 2;
            var newY = yOffset;
            graphics.DrawImage(image, new Rectangle(newX, newY, image.Width, image.Height));
            image.Dispose();
            image = newImage;

            using var imageSaveMemoryStream = new MemoryStream();
            image.Save(imageSaveMemoryStream, System.Drawing.Imaging.ImageFormat.Png);
            return imageSaveMemoryStream.ToArray();
        }
        
        public async Task CropAllPrints(string ugcFolderPath)
        {
            var folder = Path.Combine(GetUGCPhotoLocation(ugcFolderPath), "Prints");
            var files = Directory.GetFiles(folder, "*.png", SearchOption.AllDirectories);
            foreach (var file in files)
            {
                await CropPrintImage(file);
            }
        }

        public async Task<bool> CropPrintImage(string path)
        {
            var tempPath = path + ".temp";
            var bytes = await File.ReadAllBytesAsync(path);
            var ms = new MemoryStream(bytes);
            Bitmap print = new Bitmap(ms);
            // validation step to ensure image is actually a print
            if (print.Width != 2048 || print.Height != 1440)
            {
                return false;
            }
            var point = new Point(64, 69);
            var size = new Size(1920, 1080);
            var rectangle = new Rectangle(point, size);
            Bitmap cropped = print.Clone(rectangle, print.PixelFormat);
            cropped.Save(tempPath);
            if (ScreenshotHelper.HasTXt(path))
            {
                var success = ScreenshotHelper.CopyTXt(path, tempPath);
                if (!success)
                {
                    File.Delete(tempPath);
                    return false;
                }
            }
            File.Move(tempPath, path, true);
            return true;
        }
        
        public async Task<string> SavePrintToFile(string url, string ugcFolderPath, string monthFolder, string fileName)
        {
            var folder = Path.Combine(GetUGCPhotoLocation(ugcFolderPath), "Prints", MakeValidFileName(monthFolder));
            Directory.CreateDirectory(folder);
            var filePath = Path.Combine(folder, MakeValidFileName(fileName));
            if (File.Exists(filePath))
                return null;

            var success = await ImageCache.SaveImageToFile(url, filePath);

            return success ? filePath : null;
        }

        public async Task<string> SaveStickerToFile(string url, string ugcFolderPath, string monthFolder, string fileName)
        {
            var folder = Path.Combine(GetUGCPhotoLocation(ugcFolderPath), "Stickers", MakeValidFileName(monthFolder));
            Directory.CreateDirectory(folder);
            var filePath = Path.Combine(folder, MakeValidFileName(fileName));
            if (File.Exists(filePath))
                return null;

            var success = await ImageCache.SaveImageToFile(url, filePath);

            return success ? filePath : null;
        }
    }
}