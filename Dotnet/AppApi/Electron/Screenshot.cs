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
            if (path.Length >= 3 && path[1] == ':' &&
                (path[2] == '\\' || path[2] == '/'))
            {
                var driveLetter = path[0].ToString().ToLower();
                var winePrefix = Path.Join(_vrcPrefixPath, $"dosdevices/{driveLetter}:");
                var winePath = path[3..]; // remove C:\
                path = Path.Join(winePrefix, winePath);
            }

            path = path.Replace("\\", "/");
            
            var fileName = Path.GetFileNameWithoutExtension(path);
            if (!File.Exists(path) || !path.EndsWith(".png") || !fileName.StartsWith("VRChat_"))
                return string.Empty;

            if (changeFilename)
            {
                var newFileName = $"{fileName}_{worldId}";
                var newPath = Path.Join(Path.GetDirectoryName(path), newFileName + Path.GetExtension(path));
                File.Move(path, newPath);
                path = newPath;
            }

            ScreenshotHelper.WriteVRCXMetadata(path, metadataString);
            return path;
        }
    }
}