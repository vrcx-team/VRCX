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
        private static NLog.Logger logger = NLog.LogManager.GetCurrentClassLogger();

        static AssetBundleCacher()
        {
            Instance = new AssetBundleCacher();
        }

        public static string DownloadTempLocation;
        public static string DownloadDestinationLocation;
        public static string DownloadHashLocation;
        public static int DownloadProgress;
        public static int DownloadSize;
        public static bool DownloadCanceled;
        public static WebClient client;
        public static Process process;

        public string GetAssetId(string id)
        {
            using(var sha256 = SHA256.Create())
            {
                byte[] hash = sha256.ComputeHash(Encoding.UTF8.GetBytes(id));
                StringBuilder idHex = new StringBuilder(hash.Length * 2);
                foreach (byte b in hash)
                {
                    idHex.AppendFormat("{0:x2}", b);
                }
                return idHex.ToString().ToUpper().Substring(0, 16);
            }
        }

        public string GetAssetVersion(int version)
        {
            byte[] bytes = BitConverter.GetBytes(version);
            string versionHex = string.Empty;
            foreach (byte b in bytes)
            {
                versionHex += b.ToString("X2");
            }
            return versionHex.PadLeft(32, '0');
        }

        public string GetVRChatCacheLocation()
        {
            return AppApi.Instance.GetVRChatCacheLocation();
        }

        /// <summary>
        /// Gets the full location of the VRChat cache for a specific asset bundle.
        /// </summary>
        /// <param name="id">The ID of the asset bundle.</param>
        /// <param name="version">The version of the asset bundle.</param>
        /// <returns>The full location of the VRChat cache for the specified asset bundle.</returns>
        public string GetVRChatCacheFullLocation(string id, int version)
        {
            var cachePath = GetVRChatCacheLocation();
            var idHash = GetAssetId(id);
            var versionLocation = GetAssetVersion(version);
            return Path.Combine(cachePath, idHash, versionLocation);
        }

        /// <summary>
        /// Checks the VRChat cache for a specific asset bundle.
        /// </summary>
        /// <param name="id">The ID of the asset bundle.</param>
        /// <param name="version">The version of the asset bundle.</param>
        /// <returns>A Tuple containing the file size, lock status and path of the asset bundle.</returns>
        public Tuple<long, bool, string> CheckVRChatCache(string id, int version)
        {
            long fileSize = -1;
            var isLocked = false;
            var fullLocation = GetVRChatCacheFullLocation(id, version);
            var fileLocation = Path.Combine(fullLocation, "__data");
            var cachePath = string.Empty;
            if (File.Exists(fileLocation))
            {
                cachePath = fullLocation;
                FileInfo data = new FileInfo(fileLocation);
                fileSize = data.Length;
            }
            if (File.Exists(Path.Combine(fullLocation, "__lock")))
            {
                isLocked = true;
            }
            return new Tuple<long, bool, string>(fileSize, isLocked, cachePath);
        }

        // old asset bundle cacher downloader method reused for updating, it's not pretty
        public void DownloadFile(string fileUrl, string hashUrl, int size)
        {
#pragma warning disable SYSLIB0014 // Type or member is obsolete
            client = new WebClient();
#pragma warning restore SYSLIB0014 // Type or member is obsolete
            if (WebApi.ProxySet)
                client.Proxy = WebApi.Proxy;
            client.Headers.Add("user-agent", Program.Version);
            DownloadProgress = 0;
            DownloadSize = size;
            DownloadCanceled = false;
            DownloadTempLocation = Path.Combine(Program.AppDataDirectory, "tempDownload.exe");
            DownloadDestinationLocation = Path.Combine(Program.AppDataDirectory, "update.exe");
            DownloadHashLocation = Path.Combine(Program.AppDataDirectory, "sha256sum.txt");
            if (File.Exists(DownloadHashLocation))
                File.Delete(DownloadHashLocation);
            if (!string.IsNullOrEmpty(hashUrl))
                client.DownloadFile(new Uri(hashUrl), DownloadHashLocation);

            client.DownloadProgressChanged += new DownloadProgressChangedEventHandler(DownloadProgressCallback);
            client.DownloadFileCompleted += new AsyncCompletedEventHandler(DownloadCompletedCallback);
            client.DownloadFileAsync(new Uri(fileUrl), DownloadTempLocation);
        }

        public void CancelDownload()
        {
            DownloadCanceled = true;
            try
            {
                client?.CancelAsync();
                if (File.Exists(DownloadTempLocation))
                    File.Delete(DownloadTempLocation);
            }
            catch (Exception)
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
            if (File.Exists(DownloadHashLocation))
            {
                logger.Info("Updater: Checking hash");
                var lines = File.ReadAllLines(DownloadHashLocation);
                var hash = lines.Length > 0 ? lines[0].Split(' ') : new[] { "" };
                using (var sha256 = SHA256.Create())
                using (var stream = File.OpenRead(DownloadTempLocation))
                {
                    var hashBytes = sha256.ComputeHash(stream);
                    var hashString = BitConverter.ToString(hashBytes).Replace("-", "");
                    if (!hashString.Equals(hash[0], StringComparison.OrdinalIgnoreCase))
                    {
                        logger.Error($"Updater: Hash check failed file:{hashString} remote:{hash[0]}");
                        // can't delete file yet because it's in use
                        DownloadProgress = -14;
                        return;
                    }
                }
                logger.Info("Updater: Hash check passed");
            }

            if (File.Exists(DownloadDestinationLocation))
                File.Delete(DownloadDestinationLocation);
            File.Move(DownloadTempLocation, DownloadDestinationLocation);
            DownloadProgress = -16;
        }

        /// <summary>
        /// Deletes the cache directory for a specific asset bundle.
        /// </summary>
        /// <param name="id">The ID of the asset bundle to delete.</param>
        /// <param name="version">The version of the asset bundle to delete.</param>
        public void DeleteCache(string id, int version)
        {
            var FullLocation = GetVRChatCacheFullLocation(id, version);
            if (Directory.Exists(FullLocation))
                Directory.Delete(FullLocation, true);
        }

        /// <summary>
        /// Deletes the entire VRChat cache directory.
        /// </summary>
        public void DeleteAllCache()
        {
            var cachePath = GetVRChatCacheLocation();
            if (Directory.Exists(cachePath))
            {
                Directory.Delete(cachePath, true);
                Directory.CreateDirectory(cachePath);
            }
        }

        /// <summary>
        /// Removes empty directories from the VRChat cache directory and deletes old versions of cached asset bundles.
        /// </summary>
        public void SweepCache()
        {
            var cachePath = GetVRChatCacheLocation();
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

        /// <summary>
        /// Returns the size of the VRChat cache directory in bytes.
        /// </summary>
        /// <returns>The size of the VRChat cache directory in bytes.</returns>
        public long GetCacheSize()
        {
            var cachePath = GetVRChatCacheLocation();

            if (!Directory.Exists(cachePath)) return 0;

            return DirSize(new DirectoryInfo(cachePath));
        }


        /// <summary>
        /// Recursively calculates the size of a directory and all its subdirectories.
        /// </summary>
        /// <param name="d">The directory to calculate the size of.</param>
        /// <returns>The size of the directory and all its subdirectories in bytes.</returns>
        public long DirSize(DirectoryInfo d)
        {
            long size = 0;
            FileInfo[] files = d.GetFiles("*.*", SearchOption.AllDirectories);
            foreach (FileInfo file in files)
            {
                size += file.Length;
            }
            return size;
        }
    }
}