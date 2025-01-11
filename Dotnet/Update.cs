// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.Collections.Generic;
using System.IO;
using System.Diagnostics;
using System.Net.Http;
using System.Security.Cryptography;
using System.Threading;
using System.Threading.Tasks;
using NLog;

#if !LINUX
using System.Windows.Forms;
#endif

namespace VRCX
{
    public class Update
    {
        private static readonly Logger logger = LogManager.GetCurrentClassLogger();
        private static readonly string VrcxSetupExecutable = Path.Combine(Program.AppDataDirectory, "VRCX_Setup.exe");
        private static readonly string UpdateExecutable = Path.Combine(Program.AppDataDirectory, "update.exe");
        private static readonly string TempDownload = Path.Combine(Program.AppDataDirectory, "tempDownload");
        private static readonly string HashLocation = Path.Combine(Program.AppDataDirectory, "sha256sum.txt");
        private static readonly HttpClient httpClient;
        private static CancellationToken _cancellationToken;
        public static int UpdateProgress;
        private static string AppImagePath = string.Empty;
        private static string AppImagePathOld = string.Empty;

        static Update()
        {
            var httpClientHandler = new HttpClientHandler();
            if (WebApi.ProxySet)
                httpClientHandler.Proxy = WebApi.Proxy;
            
            httpClient = new HttpClient(httpClientHandler);
            httpClient.DefaultRequestHeaders.Add("User-Agent", Program.Version);
        }

        public void Init(string appImagePath = "")
        {
            if (string.IsNullOrEmpty(appImagePath))
                return;
            
            AppImagePath = appImagePath;
            AppImagePathOld = appImagePath + ".old";
            logger.Info($"AppImagePath: {AppImagePath}");
        }

        public static void Check()
        {
            if (Process.GetProcessesByName("VRCX_Setup").Length > 0)
                Environment.Exit(0);
            
            if (File.Exists(HashLocation))
                File.Delete(HashLocation);
            if (File.Exists(TempDownload))
                File.Delete(TempDownload);
            if (File.Exists(VrcxSetupExecutable))
                File.Delete(VrcxSetupExecutable);
            
            if (File.Exists(UpdateExecutable))
                InstallUpdate();
        }

        private static void InstallUpdate()
        {
            var setupArguments = string.Empty;
#if !LINUX
            if (Wine.GetIfWine())
                setupArguments += "/SKIP_SHORTCUT=true";
#endif
            
            try
            {
                if (File.Exists(VrcxSetupExecutable))
                    File.Delete(VrcxSetupExecutable);
                File.Move(UpdateExecutable, VrcxSetupExecutable);
                var vrcxProcess = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = VrcxSetupExecutable,
                        Arguments = setupArguments,
                        UseShellExecute = true,
                        WorkingDirectory = Program.AppDataDirectory
                    }
                };
                vrcxProcess.Start();
                Environment.Exit(0);
            }
            catch (Exception e)
            {
                var message = $"Failed to install the update: {e.Message}";
                logger.Info(message);
#if !LINUX
                MessageBox.Show(message, "Update failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
#endif
            }
        }
        
        public static async Task DownloadInstallRedist()
        {
            try
            {
                var filePath = await DownloadFile("https://aka.ms/vs/17/release/vc_redist.x64.exe");
                var installRedist = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = filePath,
                        Arguments = "/install /quiet /norestart"
                    }
                };
                installRedist.Start();
                await installRedist.WaitForExitAsync();
            }
            catch (Exception e)
            {
                var message = $"Failed to download and install the Visual C++ Redistributable: {e.Message}";
                logger.Info(message);
#if !LINUX
                MessageBox.Show(message, "Update failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
#endif
            }
        }

        private static async Task<string> DownloadFile(string fileUrl, CancellationToken cancellationToken = default)
        {
            var response = await httpClient.GetAsync(fileUrl, cancellationToken);
            if (!response.IsSuccessStatusCode)
                throw new Exception($"Failed to download the file. Status code: {response.StatusCode}");

            var fileName = GetFileNameFromContentDisposition(response);
            var tempPath = Path.Combine(Path.GetTempPath(), "VRCX");
            Directory.CreateDirectory(tempPath);
            var filePath = Path.Combine(tempPath, fileName);
            await using var fileStream = File.Create(filePath);
            await response.Content.CopyToAsync(fileStream, cancellationToken);
            return filePath;
        }

        private static string GetFileNameFromContentDisposition(HttpResponseMessage response)
        {
            string contentDisposition = response.Content.Headers.ContentDisposition?.ToString();
            if (contentDisposition != null)
            {
                int startIndex = contentDisposition.IndexOf("filename=", StringComparison.OrdinalIgnoreCase);
                if (startIndex >= 0)
                {
                    startIndex += "filename=".Length;
                    int endIndex = contentDisposition.IndexOf(";", startIndex, StringComparison.Ordinal);
                    if (endIndex == -1)
                    {
                        endIndex = contentDisposition.Length;
                    }

                    string fileName = contentDisposition.Substring(startIndex, endIndex - startIndex).Trim(' ', '"');
                    return fileName;
                }
            }

            throw new Exception("Unable to extract file name from content-disposition header.");
        }

        public static async Task DownloadUpdate(string fileUrl, string fileName, string hashUrl, int downloadSize)
        {
            _cancellationToken = CancellationToken.None;
            const int chunkSize = 8192;

            if (File.Exists(TempDownload))
                File.Delete(TempDownload);
            if (File.Exists(HashLocation))
                File.Delete(HashLocation);
            
            var hashesPath = await DownloadFile(hashUrl, _cancellationToken);
            if (!string.IsNullOrEmpty(hashesPath))
                File.Move(hashesPath, HashLocation);
            
            await using var destination = File.OpenWrite(TempDownload);
            using (var response = await httpClient.GetAsync(fileUrl, HttpCompletionOption.ResponseHeadersRead, _cancellationToken))
            await using (var download = await response.Content.ReadAsStreamAsync(_cancellationToken))
            {
                var contentLength = response.Content.Headers.ContentLength;
                var buffer = new byte[chunkSize];
                long totalBytesRead = 0;

                while (true)
                {
                    int bytesRead = await download.ReadAsync(buffer, 0, chunkSize, _cancellationToken);
                    if (bytesRead == 0) break;

                    if (_cancellationToken.IsCancellationRequested)
                        throw new OperationCanceledException("Download was cancelled.");

                    await destination.WriteAsync(buffer.AsMemory(0, bytesRead), _cancellationToken);
                    totalBytesRead += bytesRead;

                    if (contentLength.HasValue)
                    {
                        double percentage = Math.Round((double)totalBytesRead / contentLength.Value * 100, 2);
                        UpdateProgress = (int)percentage;
                    }
                }

                if (contentLength.HasValue)
                {
                    double percentage = Math.Round((double)totalBytesRead / contentLength.Value * 100, 2);
                    UpdateProgress = (int)percentage;
                }
            }
            destination.Close();
            
            var data = new FileInfo(TempDownload);
            if (data.Length != downloadSize)
            {
                File.Delete(TempDownload);
                logger.Error("Downloaded file size does not match expected size");
                throw new Exception("Downloaded file size does not match expected size");
            }
            if (File.Exists(HashLocation))
            {
                logger.Info("Checking hash");
                var lines = await File.ReadAllLinesAsync(HashLocation, _cancellationToken);
                var hashDict = new Dictionary<string, string>();
                foreach (var line in lines)
                {
                    var split = line.Split(' ');
                    if (split.Length == 3)
                        hashDict[split[2]] = split[0];
                }
                using (var sha256 = SHA256.Create())
                await using (var stream = File.OpenRead(TempDownload))
                {
                    var hashBytes = await sha256.ComputeHashAsync(stream, _cancellationToken);
                    var hashString = BitConverter.ToString(hashBytes).Replace("-", "");
                    if (!hashDict.TryGetValue(fileName, out var expectedHash))
                    {
                        logger.Error("Hash check failed, file not found in hash file");
                    }
                    if (!string.IsNullOrEmpty(expectedHash) &&
                        !hashString.Equals(expectedHash, StringComparison.OrdinalIgnoreCase))
                    {
                        logger.Error($"Hash check failed file:{hashString} web:{expectedHash}");
                        throw new Exception("Hash check failed");
                        // can't delete file yet because it's in use
                    }
                }
                File.Delete(HashLocation);
                logger.Info("Hash check passed");
            }

            if (string.IsNullOrEmpty(AppImagePath))
            {
                // Windows
                if (File.Exists(UpdateExecutable))
                    File.Delete(UpdateExecutable);
                File.Move(TempDownload, UpdateExecutable);
            }
            else
            {
                // Linux
                if (File.Exists(AppImagePathOld))
                    File.Delete(AppImagePathOld);
                File.Move(AppImagePath, AppImagePathOld);
                File.Move(TempDownload, AppImagePath);
                var process = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = "chmod",
                        Arguments = $"+x {AppImagePath}"
                    }
                };
                process.Start();
                await process.WaitForExitAsync();
            }

            UpdateProgress = 0;
            _cancellationToken = CancellationToken.None;
        }

        public static async Task CancelUpdate()
        {
            _cancellationToken = new CancellationToken(true);
            UpdateProgress = 0;
            await Task.Delay(100);
            try
            {
                if (File.Exists(TempDownload))
                    File.Delete(TempDownload);
            }
            catch
            {
                // ignored
            }
        }
    }
}