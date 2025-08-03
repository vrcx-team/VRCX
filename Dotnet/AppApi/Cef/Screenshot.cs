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
    public partial class AppApiCef
    {
        /// <summary>
        /// Adds metadata to a PNG screenshot file and optionally renames the file to include the specified world ID.
        /// </summary>
        /// <param name="path">The path to the PNG screenshot file.</param>
        /// <param name="metadataString">The metadata to add to the screenshot file.</param>
        /// <param name="worldId">The ID of the world to associate with the screenshot.</param>
        /// <param name="changeFilename">Whether to rename the screenshot file to include the world ID.</param>
        public override string AddScreenshotMetadata(string path, string metadataString, string worldId, bool changeFilename = false)
        {
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

            ScreenshotHelper.WriteVRCXMetadata(metadataString, path);
            
            return path;
        }
    }
}