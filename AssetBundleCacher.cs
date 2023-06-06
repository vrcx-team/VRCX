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
        /// <returns>An array containing the file size and lock status of the asset bundle.</returns>
        public long[] CheckVRChatCache(string id, int version)
        {
            long FileSize = -1;
            long IsLocked = 0;
            var FullLocation = GetVRChatCacheFullLocation(id, version);
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

        public void DownloadFile(string url, int size)
        {
            DownloadProgress = 0;
            DownloadSize = size;
            DownloadCanceled = false;
            DownloadTempLocation = Path.Combine(Program.AppDataDirectory, "tempDownload.exe");
            DownloadDestinationLocation = Path.Combine(Program.AppDataDirectory, "update.exe");
            client = new WebClient();
            client.Headers.Add("user-agent", Program.Version);
            client.DownloadProgressChanged += new DownloadProgressChangedEventHandler(DownloadProgressCallback);
            client.DownloadFileCompleted += new AsyncCompletedEventHandler(DownloadCompletedCallback);
            client.DownloadFileAsync(new System.Uri(url), DownloadTempLocation);
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