// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.IO;
using System.Windows.Forms;
using System.Diagnostics;

namespace VRCX
{
    internal class Update
    {
        public static void Check()
        {
            if (Process.GetProcessesByName("VRCX_Setup").Length > 0)
                Environment.Exit(0);
            if (File.Exists(Path.Combine(Program.AppDataDirectory, "VRCX_Setup.exe")))
                File.Delete(Path.Combine(Program.AppDataDirectory, "VRCX_Setup.exe"));
            if (File.Exists(Path.Combine(Program.AppDataDirectory, "update.exe")))
                Install();
        }

        public static void Install()
        {
            try
            {
                File.Move(Path.Combine(Program.AppDataDirectory, "update.exe"), Path.Combine(Program.AppDataDirectory, "VRCX_Setup.exe"));
                var VRCXProcess = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = Path.Combine(Program.AppDataDirectory, "VRCX_Setup.exe"),
                        Arguments = "/S"
                    }
                };
                VRCXProcess.Start();
                Environment.Exit(0);
            }
            catch (Exception e)
            {
                MessageBox.Show(e.ToString(), "Update failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}