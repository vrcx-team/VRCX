using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Threading;
using System.Windows.Forms;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using Newtonsoft.Json.Serialization;

namespace VRCX
{
    public partial class AppApiElectron
    {
        public override string AddScreenshotMetadata(string path, string metadataString, string worldId, bool changeFilename = false)
        {
            var winePrefix = Path.Join(_vrcPrefixPath, "drive_c");
            var winePath = path.Substring(3).Replace("\\", "/");
            path = Path.Combine(winePrefix, winePath);
            
            var fileName = Path.GetFileNameWithoutExtension(path);
            if (!File.Exists(path) || !path.EndsWith(".png") || !fileName.StartsWith("VRChat_"))
                return string.Empty;

            if (changeFilename)
            {
                var newFileName = $"{fileName}_{worldId}";
                var newPath = Path.Combine(Path.GetDirectoryName(path), newFileName + Path.GetExtension(path));
                File.Move(path, newPath);
                path = newPath;
            }

            ScreenshotHelper.WritePNGDescription(path, metadataString);
            return path;
        }
    }
}