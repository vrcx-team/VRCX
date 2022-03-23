using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;

namespace VRCX
{
    //Based off DWMWA_USE_IMMERSIVE_DARK_MODE, documentation: https://docs.microsoft.com/en-us/windows/win32/api/dwmapi/ne-dwmapi-dwmwindowattribute
    //dwAttribute was 19 before Windows 20H1, 20 after Windows 20H1

    internal static class WinformThemer
    {
        [DllImport("DwmApi")]
        private static extern int DwmSetWindowAttribute(IntPtr hwnd, int dwAttribute, int[] pvAttribute, int cbAttribute);

        [DllImport("DwmApi")]
        private static extern int DwmGetWindowAttribute(IntPtr hwnd, int dwAttribute, IntPtr pvAttribute, int cbAttribute);

        private static int currentTheme = 0;

        /// <summary>
        /// Sets the global theme of the app
        /// Light = 0
        /// Dark = 1
        /// </summary>
        public static void SetGlobalTheme(int theme)
        {
            currentTheme = theme;
            foreach (Form form in Application.OpenForms)
            {
                SetThemeToGlobal(form);
            }
        }

        /// <summary>
        /// Gets the global theme of the app
        /// Light = 0
        /// Dark = 1
        /// </summary>
        public static int GetGlobalTheme() => currentTheme;

        public static void SetThemeToGlobal(Form form)
        {
            SetThemeToGlobal(form.Handle);
        }

        private static void SetThemeToGlobal(IntPtr handle)
        {
            if (GetTheme(handle) != currentTheme)
            {
                if (DwmSetWindowAttribute(handle, 19, new[] { currentTheme }, 4) != 0)
                    DwmSetWindowAttribute(handle, 20, new[] { currentTheme }, 4);
            }
        }

        private static int GetTheme(IntPtr handle)
        {
            //Allocate needed memory
            IntPtr curThemePtr = Marshal.AllocHGlobal(4);

            //See what window state it currently is
            if (DwmGetWindowAttribute(handle, 19, curThemePtr, 4) != 0)
                DwmGetWindowAttribute(handle, 20, curThemePtr, 4);

            //Read current theme (light = 0, dark = 1)
            int theme = Marshal.ReadInt32(curThemePtr);

            //Free previously allocated
            Marshal.FreeHGlobal(curThemePtr);

            return theme;
        }
    }
}
