// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.Diagnostics;
using System.IO;
using System.Security.Cryptography;
using System.Net;
using System.Text;
using System.ComponentModel;
using System.Linq;

namespace VRCX
{
    public class AssetBundleCacher
    {
        public static readonly AssetBundleCacher Instance;

        static AssetBundleCacher()
        {
            Instance = new AssetBundleCacher();
        }

        public static string DownloadTempLocation;
        public static string DownloadDestinationLocation;
        public static int DownloadProgress;
        public static int DownloadSize;
        public static bool DownloadCanceled;
        public static WebClient client;
        public static Process process;

        public string GetAssetId(string id)
        {
            byte[] hash = SHA256.Create().ComputeHash(Encoding.UTF8.GetBytes(id));
            StringBuilder idHex = new StringBuilder(hash.Length * 2);
            foreach (byte b in hash)
            {
                idHex.AppendFormat("{0:x2}", b);
            }
            return idHex.ToString().ToUpper().Substring(0, 16);
        }

        public string GetAssetVersion(int version)
        {
            byte[] bytes = BitConverter.GetBytes(version);
            string versionHex = String.Empty;
            foreach (byte b in bytes)
            {
                versionHex += b.ToString("X2");
            }
            return versionHex.PadLeft(32, '0');
        }

        public string GetVRChatCacheLocation(string cacheDir)
        {
            var cachePath = Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData) + @"Low\VRChat\VRChat\Cache-WindowsPlayer";
            if (!string.IsNullOrEmpty(cacheDir) && Directory.Exists(cacheDir))
                cachePath = Path.Combine(cacheDir, @"Cache-WindowsPlayer");
            return cachePath;
        }

        public string GetVRChatCacheFullLocation(string id, int version, string cacheDir)
        {
            var cachePath = GetVRChatCacheLocation(cacheDir);
            var idHash = GetAssetId(id);
            var versionLocation = GetAssetVersion(version);
            return Path.Combine(cachePath, idHash, versionLocation);
        }

        public long[] CheckVRChatCache(string id, int version, string cacheDir)
        {
            long FileSize = -1;
            long IsLocked = 0;
            var FullLocation = GetVRChatCacheFullLocation(id, version, cacheDir);
            var FileLocation = Path.Combine(FullLocation, "__data");
            if (File.Exists(FileLocation))
            {
                FileInfo data = new FileInfo(FileLocation);
                FileSize = data.Length;
            }
            if (File.Exists(Path.Combine(FullLocation, "__lock")))
            {
                IsLocked = 1;
            }
            return new long[]
            {
                FileSize,
                IsLocked
            };
        }

        public void DownloadFile(string url, int size, string AppVersion)
        {
            DownloadSize = size;
            DownloadCanceled = false;
            DownloadTempLocation = Path.Combine(Program.AppDataDirectory, "tempDownload.exe");
            DownloadDestinationLocation = Path.Combine(Program.AppDataDirectory, "update.exe");
            client = new WebClient();
            client.Headers.Add("user-agent", AppVersion);
            client.DownloadProgressChanged += new DownloadProgressChangedEventHandler(DownloadProgressCallback);
            client.DownloadFileCompleted += new AsyncCompletedEventHandler(DownloadCompletedCallback);
            client.DownloadFileAsync(new System.Uri(url), DownloadTempLocation);
        }

        public void CancelDownload()
        {
            DownloadCanceled = true;
            try
            {
                if (client != null)
                    client.CancelAsync();
                if (File.Exists(DownloadTempLocation))
                    File.Delete(DownloadTempLocation);
            }
            catch(Exception)
            {

            }
            DownloadProgress = -4;
        }

        public int CheckDownloadProgress()
        {
            return DownloadProgress;
        }

        private static void DownloadProgressCallback(object sender, DownloadProgressChangedEventArgs e)
        {
            DownloadProgress = e.ProgressPercentage;
        }

        private static void DownloadCompletedCallback(object sender, AsyncCompletedEventArgs e)
        {
            if (DownloadCanceled)
            {
                if (File.Exists(DownloadTempLocation))
                    File.Delete(DownloadTempLocation);
                return;
            }
            if (!File.Exists(DownloadTempLocation))
            {
                DownloadProgress = -15;
                return;
            }
            FileInfo data = new FileInfo(DownloadTempLocation);
            if (data.Length != DownloadSize)
            {
                File.Delete(DownloadTempLocation);
                DownloadProgress = -15;
                return;
            }
            if (File.Exists(DownloadDestinationLocation))
                File.Delete(DownloadDestinationLocation);
            File.Move(DownloadTempLocation, DownloadDestinationLocation);
            DownloadProgress = -16;
        }

        public void DeleteCache(string cacheDir, string id, int version)
        {
            var FullLocation = GetVRChatCacheFullLocation(id, version, cacheDir);
            if (Directory.Exists(FullLocation))
                Directory.Delete(FullLocation, true);
        }

        public void DeleteAllCache(string cacheDir)
        {
            var cachePath = GetVRChatCacheLocation(cacheDir);
            if (Directory.Exists(cachePath))
            {
                Directory.Delete(cachePath, true);
                Directory.CreateDirectory(cachePath);
            }
        }

        public void SweepCache(string cacheDir)
        {
            var cachePath = GetVRChatCacheLocation(cacheDir);
            if (!Directory.Exists(cachePath))
                return;
            var directories = new DirectoryInfo(cachePath);
            DirectoryInfo[] cacheDirectories = directories.GetDirectories();
            foreach (DirectoryInfo cacheDirectory in cacheDirectories)
            {
                var VersionDirectories = cacheDirectory.GetDirectories().OrderBy(d => Convert.ToInt32(d.Name, 16));
                int i = 0;
                foreach (DirectoryInfo VersionDirectory in VersionDirectories)
                {
                    i++;
                    if (VersionDirectory.GetDirectories().Length + VersionDirectory.GetFiles().Length == 0)
                    {
                        VersionDirectory.Delete();
                    }
                    else if (i < VersionDirectories.Count())
                    {
                        if (!File.Exists(Path.Combine(VersionDirectory.FullName, "__lock")))
                            VersionDirectory.Delete(true);
                    }
                }
                if (cacheDirectory.GetDirectories().Length + cacheDirectory.GetFiles().Length == 0)
                    cacheDirectory.Delete();
            }
        }

        public long GetCacheSize(string cacheDir)
        {
            var cachePath = GetVRChatCacheLocation(cacheDir);
            if (Directory.Exists(cachePath))
            {
                return DirSize(new DirectoryInfo(cachePath));
            }
            else
            {
                return 0;
            }
        }

        public long DirSize(DirectoryInfo d)
        {
            long size = 0;
            FileInfo[] files = d.GetFiles();
            foreach (FileInfo file in files)
            {
                size += file.Length;
            }
            DirectoryInfo[] directories = d.GetDirectories();
            foreach (DirectoryInfo directory in directories)
            {
                size += DirSize(directory);
            }
            return size;
        }
    }
}
