// Copyright(c) 2019-2021 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.IO;
using System.IO.Compression;
using System.Windows.Forms;

namespace VRCX
{
    class Update
    {
        public static void Check()
        {
            try
            {
                var CurrentDirectory = new DirectoryInfo(Program.BaseDirectory);
                FileInfo[] Files = CurrentDirectory.GetFiles();
                foreach (FileInfo FileDetails in Files)
                {
                    var FilePath = Path.Combine(Program.BaseDirectory, FileDetails.Name);
                    if (FileDetails.Extension == ".old")
                        File.Delete(FilePath);
                }
                var Location = Path.Combine(Program.BaseDirectory, "update.zip");
                if (File.Exists(Location))
                    Install();
            }
            catch (Exception e)
            {
                MessageBox.Show(e.ToString(), "Update failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }

        public static void Install()
        {
            var Location = Path.Combine(Program.BaseDirectory, "update.zip");
            if (!File.Exists(Location))
                return;
            if (File.Exists(Path.Combine(Program.BaseDirectory, "VRCX.exe.old")))
                File.Delete(Path.Combine(Program.BaseDirectory, "VRCX.exe.old"));
            if (File.Exists(Path.Combine(Program.BaseDirectory, "VRCX.exe")))
                File.Move(Path.Combine(Program.BaseDirectory, "VRCX.exe"), Path.Combine(Program.BaseDirectory, "VRCX.exe.old"));
            var CurrentDirectory = new DirectoryInfo(Program.BaseDirectory);
            FileInfo[] Files = CurrentDirectory.GetFiles();
            foreach (FileInfo FileDetails in Files)
            {
                var FilePath = Path.Combine(Program.BaseDirectory, $"{FileDetails.Name}.old");
                if (FileDetails.Extension == ".dll")
                {
                    if (File.Exists(FilePath))
                        File.Delete(FilePath);
                    File.Move(Path.Combine(Program.BaseDirectory, FileDetails.Name), FilePath);
                }
            }
            using (ZipArchive archive = ZipFile.OpenRead(Location))
            {
                foreach (ZipArchiveEntry entry in archive.Entries)
                {
                    var path = Path.Combine(Program.BaseDirectory, entry.FullName);
                    if (entry.Name == "")
                    {
                        Directory.CreateDirectory(Path.GetDirectoryName(path));
                        continue;
                    }
                    entry.ExtractToFile(path, true);
                }
            }
            File.Delete(Location);
            System.Diagnostics.Process VRCXProcess = new System.Diagnostics.Process();
            VRCXProcess.StartInfo.FileName = Path.Combine(Program.BaseDirectory, "VRCX.exe");
            VRCXProcess.StartInfo.UseShellExecute = false;
            VRCXProcess.Start();
            System.Environment.Exit(0);
        }
    }
}
