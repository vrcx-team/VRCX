using System;
using System.Collections.Generic;
using System.IO;
using System.Text.Json;
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
        public void PopulateImageHosts(string json)
        {
            var hosts = JsonSerializer.Deserialize<List<string>>(json);
            ImageCache.PopulateImageHosts(hosts);
        }
        
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
                var targetSize = Math.Max(image.Width, image.Height);
                var squareCanvas = new Image<Rgba32>(targetSize, targetSize);
                var xOffset = (targetSize - image.Width) / 2;
                var yOffset = (targetSize - image.Height) / 2;
                squareCanvas.Mutate(x => 
                    x.DrawImage(image, new Point(xOffset, yOffset), 1f));
                image = squareCanvas;
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

            if (image.Height > image.Width)
                image.Mutate(x => x.Rotate(RotateMode.Rotate270));

            // increase size to 1920x1080
            if (image.Width < desiredWidth || image.Height < desiredHeight)
            {
                const double expectedAspectRatio = 1920.0 / 1080.0;
                var target = new Image<Rgba32>(1920, 1080);
                var aspectRatio = (double)image.Width / image.Height;
                int width, height, xOffset, yOffset;
    
                if (aspectRatio > expectedAspectRatio)
                {
                    // Image is wider than 16:9 - scale based on width
                    width = 1920;
                    height = (int)(width / aspectRatio);
                    xOffset = 0;
                    yOffset = (1080 - height) / 2;
                }
                else
                {
                    // Image is taller than 16:9 - scale based on height
                    height = 1080;
                    width = (int)(height * aspectRatio);
                    xOffset = (1920 - width) / 2;
                    yOffset = 0;
                }
                using var scaledImage = image.Clone(ctx => ctx.Resize(width, height));
                target.Mutate(x => x.Fill(Color.White)
                    .DrawImage(scaledImage, new Point(xOffset, yOffset), 1f));
                image = target;
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
            const int xBorderOffset = 64; // 2048 / 32
            const int yBorderOffset = 69; // 1440 / 20.869
            using Image<Rgba32> newImage = new(2048, 1440);
            newImage.Mutate(x => x.Fill(Color.White));
            // graphics.DrawImage(image, new Rectangle(xOffset, yOffset, image.Width, image.Height));
            var newX = (2048 - image.Width) / 2;
            var borderPoint = new Point(newX, yBorderOffset);
            newImage.Mutate(x => x.DrawImage(image, borderPoint, 1f));
            using var imageSaveMemoryStream = new MemoryStream();
            newImage.SaveAsPng(imageSaveMemoryStream);
            return imageSaveMemoryStream.ToArray();
        }
        
        public async Task CropAllPrints(string ugcFolderPath)
        {
            var folder = Path.Join(GetUGCPhotoLocation(ugcFolderPath), "Prints");

            if (!Directory.Exists(folder))
            {
                return;
            }
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
            if (!CropPrint(ref print))
                return false;
            
            await print.SaveAsPngAsync(tempPath);
            
            var oldPngFile = new PNGFile(path, false);
            var newPngFile = new PNGFile(tempPath, true);

            // Copy all iTXt chunks to new file
            var textChunks = oldPngFile.GetChunksOfType(PNGChunkTypeFilter.iTXt);

            for (var i = 0; i < textChunks.Count; i++)
            {
                newPngFile.WriteChunk(textChunks[i]);
            }

            oldPngFile.Dispose();
            newPngFile.Dispose();

            File.Move(tempPath, path, true);
            return true;
        }
        
        public bool CropPrint(ref Image image)
        {
            if (image.Width != 2048 || image.Height != 1440)
                return false;
            
            var point = new Point(64, 69);
            var size = new Size(1920, 1080);
            var rectangle = new Rectangle(point, size);
            image.Mutate(x => x.Crop(rectangle));
            return true;
        }
        
        public async Task<string> SavePrintToFile(string url, string ugcFolderPath, string monthFolder, string fileName)
        {
            var folder = Path.Join(GetUGCPhotoLocation(ugcFolderPath), "Prints", MakeValidFileName(monthFolder));
            Directory.CreateDirectory(folder);
            var filePath = Path.Join(folder, MakeValidFileName(fileName));
            if (File.Exists(filePath))
                return null;

            try
            {
                await ImageCache.SaveImageToFile(url, filePath);
            }
            catch (Exception ex)
            {
                logger.Error(ex, "Failed to save print to file");
                return null;
            }
            
            return filePath;
        }

        public async Task<string> SaveStickerToFile(string url, string ugcFolderPath, string monthFolder, string fileName)
        {
            var folder = Path.Join(GetUGCPhotoLocation(ugcFolderPath), "Stickers", MakeValidFileName(monthFolder));
            Directory.CreateDirectory(folder);
            var filePath = Path.Join(folder, MakeValidFileName(fileName));
            if (File.Exists(filePath))
                return null;

            try
            {
                await ImageCache.SaveImageToFile(url, filePath);
            }
            catch (Exception ex)
            {
                logger.Error(ex, "Failed to save print to file");
                return null;
            }
            
            return filePath;
        }
        
        public async Task<string> SaveEmojiToFile(string url, string ugcFolderPath, string monthFolder, string fileName)
        {
            var folder = Path.Join(GetUGCPhotoLocation(ugcFolderPath), "Emoji", MakeValidFileName(monthFolder));
            Directory.CreateDirectory(folder);
            var filePath = Path.Join(folder, MakeValidFileName(fileName));
            if (File.Exists(filePath))
                return null;

            try
            {
                await ImageCache.SaveImageToFile(url, filePath);
            }
            catch (Exception ex)
            {
                logger.Error(ex, "Failed to save print to file");
                return null;
            }
            
            return filePath;
        }
    }
}