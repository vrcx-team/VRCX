// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.Runtime.InteropServices;

namespace VRCX
{
    public static class WinApi
    {
        [DllImport("kernel32.dll", SetLastError = false)]
        public static extern void CopyMemory(IntPtr destination, IntPtr source, uint length);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);

        [DllImport("user32.dll", SetLastError = true)]
        public static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);
        [DllImport("shell32.dll", CharSet = CharSet.Unicode)]
        public static extern int SHParseDisplayName([MarshalAs(UnmanagedType.LPWStr)] string pszName, IntPtr pbc, out IntPtr ppidl, uint sfgaoIn, out uint psfgaoOut);
        [DllImport("shell32.dll", CharSet = CharSet.Auto)]
        public static extern IntPtr SHOpenFolderAndSelectItems(IntPtr pidlFolder, uint cidl, IntPtr[] apidl, uint dwFlags);
    }
}
