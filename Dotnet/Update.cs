// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.IO;
using System.Windows.Forms;
using System.Diagnostics;
using System.Net.Http;

namespace VRCX
{
    internal class Update
    {
        private static readonly string VRCX_Setup_Executable = Path.Combine(Program.AppDataDirectory, "VRCX_Setup.exe");
        private static readonly string Update_Executable = Path.Combine(Program.AppDataDirectory, "update.exe");

        public static void Check()
        {
            if (Process.GetProcessesByName("VRCX_Setup").Length > 0)
                Environment.Exit(0);
            var setupHash = Path.Combine(Program.AppDataDirectory, "sha256sum.txt");
            if (File.Exists(setupHash))
                File.Delete(setupHash);
            var tempDownload = Path.Combine(Program.AppDataDirectory, "tempDownload.exe");
            if (File.Exists(tempDownload))
                File.Delete(tempDownload);
            if (File.Exists(VRCX_Setup_Executable))
                File.Delete(VRCX_Setup_Executable);
            if (File.Exists(Update_Executable))
                Install();
        }

        private static void Install()
        {
            var setupArguments = "/S";
            if (Wine.GetIfWine()) setupArguments += " /DISABLE_SHORTCUT=true";
            
            try
            {
                File.Move(Update_Executable, VRCX_Setup_Executable);
                var vrcxProcess = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = VRCX_Setup_Executable,
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
                MessageBox.Show(e.ToString(), "Update failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
        
        public static void DownloadInstallRedist()
        {
            try
            {
                var filePath = DownloadFile("https://aka.ms/vs/17/release/vc_redist.x64.exe");
                var installRedist = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = filePath,
                        Arguments = "/install /quiet /norestart"
                    }
                };
                installRedist.Start();
                installRedist.WaitForExit();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.ToString(), "Update failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        private static string DownloadFile(string fileUrl)
        {
            var httpClientHandler = new HttpClientHandler();
            if (WebApi.ProxySet)
                httpClientHandler.Proxy = WebApi.Proxy;
            
            var httpClient = new HttpClient(httpClientHandler);

            try
            {
                HttpResponseMessage response = httpClient.GetAsync(fileUrl).Result;

                if (response.IsSuccessStatusCode)
                {
                    string fileName = GetFileNameFromContentDisposition(response);

                    string tempPath = Path.Combine(Path.GetTempPath(), "VRCX");
                    Directory.CreateDirectory(tempPath);
                    
                    string filePath = Path.Combine(tempPath, fileName);
                    
                    using (FileStream fileStream = File.Create(filePath))
                    {
                        response.Content.CopyToAsync(fileStream).Wait();
                    }

                    return filePath;
                }
                else
                {
                    throw new Exception($"Failed to download the file. Status code: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                throw new Exception($"Error downloading the file: {ex.Message}");
            }
            finally
            {
                httpClient.Dispose();
            }
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
                    int endIndex = contentDisposition.IndexOf(";", startIndex);
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
    }
}