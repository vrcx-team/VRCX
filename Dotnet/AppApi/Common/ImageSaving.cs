using System;
using System.IO;
using System.Threading.Tasks;
using SixLabors.ImageSharp;
using SixLabors.ImageSharp.Drawing.Processing;
using SixLabors.ImageSharp.Formats.Png;
using SixLabors.ImageSharp.PixelFormats;
using SixLabors.ImageSharp.Processing;
using Color = SixLabors.ImageSharp.Color;
using Image = SixLabors.ImageSharp.Image;
using Point = SixLabors.ImageSharp.Point;
using Rectangle = SixLabors.ImageSharp.Rectangle;
using Size = SixLabors.ImageSharp.Size;

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

        public byte[] ResizeImageToFitLimits(byte[] imageData, bool matchingDimensions, int maxWidth = 2000,
            int maxHeight = 2000, long maxSize = 10_000_000)
        {
            using var fileMemoryStream = new MemoryStream(imageData);
            var image = Image.Load(fileMemoryStream);

            // for APNG, check if image is png format and less than maxSize
            if ((!matchingDimensions || image.Width == image.Height) &&
                image.Metadata.DecodedImageFormat == PngFormat.Instance &&
                imageData.Length < maxSize &&
                image.Width <= maxWidth &&
                image.Height <= maxHeight)
            {
                return imageData;
            }

            // FIXME: I think these are aspect ratio preserving calcs, but we can ask ImageSharp nicely to do this by
            //        passing 0, see docs for Resize()
            if (image.Width > maxWidth)
            {
                var sizingFactor = image.Width / (double)maxWidth;
                var newHeight = (int)Math.Round(image.Height / sizingFactor);
                image.Mutate(x => x.Resize(maxWidth, newHeight));
            }
            if (image.Height > maxHeight)
            {
                var sizingFactor = image.Height / (double)maxHeight;
                var newWidth = (int)Math.Round(image.Width / sizingFactor);
                image.Mutate(x => x.Resize(newWidth, maxHeight));
            }
            if (matchingDimensions && image.Width != image.Height)
            {
                var newSize = Math.Max(image.Width, image.Height);
                using Image<Rgba32> resizedImage = new(newSize, newSize);
                // regalialong: i think the access should be safe
                // ReSharper disable AccessToModifiedClosure
                // ReSharper disable AccessToDisposedClosure
                resizedImage.Mutate(x => x.DrawImage(image,
                    new Rectangle((newSize - image.Width) / 2, (newSize - image.Height) / 2, image.Width, image.Height), 
                    0));
                // ReSharper restore AccessToDisposedClosure
                // ReSharper restore AccessToModifiedClosure
                image.Dispose();
                image = resizedImage;
            }

            SaveToFileToUpload();
            for (var i = 0; i < 250 && imageData.Length > maxSize; i++)
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

                image.Mutate(x => x.Resize(newWidth, newHeight));
            }

            if (imageData.Length > maxSize)
            {
                throw new Exception("Failed to get image into target filesize.");
            }

            image.Dispose();
            return imageData;

            void SaveToFileToUpload()
            {
                using var imageSaveMemoryStream = new MemoryStream();
                image.SaveAsPng(imageSaveMemoryStream);
                imageData = imageSaveMemoryStream.ToArray();
            }
        }

        public byte[] ResizePrintImage(byte[] imageData)
        {
            const int desiredWidth = 1920;
            const int desiredHeight = 1080;

            using var fileMemoryStream = new MemoryStream(imageData);
            var image = Image.Load(fileMemoryStream);

            if (image.Height > image.Width) image.Mutate(x => x.Rotate(RotateMode.Rotate90));

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


                using Image<Rgba32> resizedImage = new(desiredWidth, desiredHeight);
                resizedImage.Mutate(x
                    // ReSharper disable once AccessToModifiedClosure
                    // ReSharper disable once AccessToDisposedClosure
                    => x.Fill(Color.White).DrawImage(image,
                        new Rectangle((desiredWidth - newWidth) / 2, (desiredHeight - newHeight) / 2, newWidth,
                            newHeight), 0)
                );
                image.Dispose();
                image = resizedImage;
            }
            
            // limit size to 1920x1080
            if (image.Width > desiredWidth)
            {
                var sizingFactor = image.Width / (double)desiredWidth;
                var newHeight = (int)Math.Round(image.Height / sizingFactor);
                image.Mutate(x => x.Resize(desiredWidth, newHeight));
            }
            if (image.Height > desiredHeight)
            {
                var sizingFactor = image.Height / (double)desiredHeight;
                var newWidth = (int)Math.Round(image.Width / sizingFactor);
                image.Mutate(x => x.Resize(newWidth, desiredHeight));
            }

            // add white border
            // wtf are these magic numbers
            const int xOffset = 64; // 2048 / 32
            const int yOffset = 69; // 1440 / 20.869
            using Image<Rgba32> newImage = new(2048, 1440);
            newImage.Mutate(x => x.Fill(Color.White));
            // graphics.DrawImage(image, new Rectangle(xOffset, yOffset, image.Width, image.Height));
            var newX = (2048 - image.Width) / 2;
            newImage.Mutate(x => x.DrawImage(image, new Rectangle(newX, yOffset, image.Width, image.Height), 0));
            using var imageSaveMemoryStream = new MemoryStream();
            newImage.SaveAsPng(imageSaveMemoryStream);
            return imageSaveMemoryStream.ToArray();
        }
        
        public async Task CropAllPrints(string ugcFolderPath)
        {
            var folder = Path.Join(GetUGCPhotoLocation(ugcFolderPath), "Prints");
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
            var print = await Image.LoadAsync(ms);
            // validation step to ensure image is actually a print
            if (print.Width != 2048 || print.Height != 1440) return false;
         
            var point = new Point(64, 69);
            var size = new Size(1920, 1080);
            var rectangle = new Rectangle(point, size);
            print.Mutate(x => x.Crop(rectangle));
            await print.SaveAsPngAsync(tempPath);
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
            var folder = Path.Join(GetUGCPhotoLocation(ugcFolderPath), "Prints", MakeValidFileName(monthFolder));
            Directory.CreateDirectory(folder);
            var filePath = Path.Join(folder, MakeValidFileName(fileName));
            if (File.Exists(filePath))
                return null;

            var success = await ImageCache.SaveImageToFile(url, filePath);

            return success ? filePath : null;
        }

        public async Task<string> SaveStickerToFile(string url, string ugcFolderPath, string monthFolder, string fileName)
        {
            var folder = Path.Join(GetUGCPhotoLocation(ugcFolderPath), "Stickers", MakeValidFileName(monthFolder));
            Directory.CreateDirectory(folder);
            var filePath = Path.Join(folder, MakeValidFileName(fileName));
            if (File.Exists(filePath))
                return null;

            var success = await ImageCache.SaveImageToFile(url, filePath);

            return success ? filePath : null;
        }
    }
}