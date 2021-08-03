// Copyright(c) 2019-2021 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.IO;
using System.Windows.Forms;

namespace VRCX
{
    class Update
    {
        public static void Check()
        {
            if (File.Exists(Path.Combine(Program.AppDataDirectory, "VRCX_Setup.exe")))
                File.Delete(Path.Combine(Program.AppDataDirectory, "VRCX_Setup.exe"));
            if (File.Exists(Path.Combine(Program.AppDataDirectory, "update.exe")))
                Install();
        }

        public static void Install()
        {
            try
            {
                if (!File.Exists(Path.Combine(Program.AppDataDirectory, "update.exe")))
                    return;
                File.Move(Path.Combine(Program.AppDataDirectory, "update.exe"), Path.Combine(Program.AppDataDirectory, "VRCX_Setup.exe"));
                System.Diagnostics.Process VRCXProcess = new System.Diagnostics.Process();
                VRCXProcess.StartInfo.FileName = Path.Combine(Program.AppDataDirectory, "VRCX_Setup.exe");
                VRCXProcess.StartInfo.Arguments = "/S";
                VRCXProcess.Start();
                System.Environment.Exit(0);
            }
            catch (Exception e)
            {
                MessageBox.Show(e.ToString(), "Update failed", MessageBoxButtons.OK, MessageBoxIcon.Error);
            }
        }
    }
}
