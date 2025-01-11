using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Globalization;
using System.IO;
using System.Security.Cryptography;
using System.Text;
using librsync.net;
using NLog;

namespace VRCX
{
    public partial class AppApi
    {
        private static readonly Logger logger = LogManager.GetCurrentClassLogger();
        private static readonly MD5 _hasher = MD5.Create();
        
        public void Init()
        {
        }
        
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
    }
}