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
        private static readonly string VRCX_Setup_Executable = Path.Combine(Program.AppDataDirectory, "VRCX_Setup.exe");
        private static readonly string Update_Executable = Path.Combine(Program.AppDataDirectory, "update.exe");

        public static void Check()
        {
            if (Process.GetProcessesByName("VRCX_Setup").Length > 0)
                Environment.Exit(0);
            if (File.Exists(VRCX_Setup_Executable))
                File.Delete(VRCX_Setup_Executable);
            if (File.Exists(Update_Executable))
                Install();
        }

        public static void Install()
        {
            try
            {
                File.Move(Update_Executable, VRCX_Setup_Executable);
                var VRCXProcess = new Process
                {
                    StartInfo = new ProcessStartInfo
                    {
                        FileName = VRCX_Setup_Executable,
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