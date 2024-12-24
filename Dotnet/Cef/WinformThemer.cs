using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;
using System.Windows.Forms;

namespace VRCX
{
    //Based off DWMWA_USE_IMMERSIVE_DARK_MODE, documentation: https://docs.microsoft.com/en-us/windows/win32/api/dwmapi/ne-dwmapi-dwmwindowattribute
    //dwAttribute was 19 before Windows 20H1, 20 after Windows 20H1

    internal static class WinformThemer
    {
        /// <summary>
        ///     Flash both the window caption and taskbar button.
        ///     This is equivalent to setting the FLASHW_CAPTION | FLASHW_TRAY flags.
        /// </summary>
        public const uint FLASHW_ALL = 3;

        /// <summary>
        ///     Flash continuously until the window comes to the foreground.
        /// </summary>
        public const uint FLASHW_TIMERNOFG = 12;

        /// <summary>
        ///     Private holder of current theme
        /// </summary>
        private static int currentTheme;

        /// <summary>
        ///     Sets the global theme of the app
        ///     Light = 0
        ///     Dark = 1
        /// </summary>
        public static void SetGlobalTheme(int theme)
        {
            currentTheme = theme;

            //Make a seperate list for all current forms (causes issues otherwise)
            var forms = new List<Form>();
            foreach (Form form in Application.OpenForms)
            {
                forms.Add(form);
            }

            SetThemeToGlobal(forms);
        }

        /// <summary>
        ///     Gets the global theme of the app
        ///     Light = 0
        ///     Dark = 1
        /// </summary>
        public static int GetGlobalTheme()
        {
            return currentTheme;
        }

        /// <summary>
        ///     Set given form to the current global theme
        /// </summary>
        /// <param name="form"></param>
        public static void SetThemeToGlobal(Form form)
        {
            SetThemeToGlobal(new List<Form> { form });
        }

        /// <summary>
        ///     Set a list of given forms to the current global theme
        /// </summary>
        /// <param name="forms"></param>
        public static void SetThemeToGlobal(List<Form> forms)
        {
            MainForm.Instance.Invoke(new Action(() =>
            {
                //For each form, set the theme, then move focus onto it to force refresh
                foreach (var form in forms)
                {
                    //Set the theme of the window
                    SetThemeToGlobal(form.Handle);

                    //Change opacity to foce full redraw
                    form.Opacity = 0.99999;
                    form.Opacity = 1;
                }
            }));
        }

        private static void SetThemeToGlobal(IntPtr handle)
        {
            if (GetTheme(handle) != currentTheme)
            {
                if (PInvoke.DwmSetWindowAttribute(handle, 19, new[] { currentTheme }, 4) != 0)
                    PInvoke.DwmSetWindowAttribute(handle, 20, new[] { currentTheme }, 4);
            }
        }

        private static int GetTheme(IntPtr handle)
        {
            //Allocate needed memory
            var curThemePtr = Marshal.AllocHGlobal(4);

            //See what window state it currently is
            if (PInvoke.DwmGetWindowAttribute(handle, 19, curThemePtr, 4) != 0)
                PInvoke.DwmGetWindowAttribute(handle, 20, curThemePtr, 4);

            //Read current theme (light = 0, dark = 1)
            var theme = Marshal.ReadInt32(curThemePtr);

            //Free previously allocated
            Marshal.FreeHGlobal(curThemePtr);

            return theme;
        }

        public static void DoFunny()
        {
            foreach (Form form in Application.OpenForms)
            {
                PInvoke.SetWindowLong(form.Handle, -20, 0x00C00000);
                // PInvoke.SetWindowLong(form.Handle, -20, 0x00050100);
            }
        }

        private static FLASHWINFO Create_FLASHWINFO(IntPtr handle, uint flags, uint count, uint timeout)
        {
            var fi = new FLASHWINFO();
            fi.cbSize = Convert.ToUInt32(Marshal.SizeOf(fi));
            fi.hwnd = handle;
            fi.dwFlags = flags;
            fi.uCount = count;
            fi.dwTimeout = timeout;
            return fi;
        }

        /// <summary>
        ///     Flash the spacified Window (Form) until it receives focus.
        /// </summary>
        /// <param name="form">The Form (Window) to Flash.</param>
        /// <returns></returns>
        public static bool Flash(Form form)
        {
            var fi = Create_FLASHWINFO(form.Handle, FLASHW_ALL | FLASHW_TIMERNOFG, uint.MaxValue, 0);
            return PInvoke.FlashWindowEx(ref fi);
        }

        internal static class PInvoke
        {
            [DllImport("DwmApi")]
            internal static extern int DwmSetWindowAttribute(IntPtr hwnd, int dwAttribute, int[] pvAttribute, int cbAttribute);

            [DllImport("DwmApi")]
            internal static extern int DwmGetWindowAttribute(IntPtr hwnd, int dwAttribute, IntPtr pvAttribute, int cbAttribute);

            [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
            internal static extern int SetWindowLong(IntPtr hwnd, int index, int newStyle);

            [DllImport("user32.dll")]
            [return: MarshalAs(UnmanagedType.Bool)]
            internal static extern bool FlashWindowEx(ref FLASHWINFO pwfi);
        }

        [StructLayout(LayoutKind.Sequential)]
        internal struct FLASHWINFO
        {
            /// <summary>
            ///     The size of the structure in bytes.
            /// </summary>
            public uint cbSize;

            /// <summary>
            ///     A Handle to the Window to be Flashed. The window can be either opened or minimized.
            /// </summary>
            public IntPtr hwnd;

            /// <summary>
            ///     The Flash Status.
            /// </summary>
            public uint dwFlags;

            /// <summary>
            ///     The number of times to Flash the window.
            /// </summary>
            public uint uCount;

            /// <summary>
            ///     The rate at which the Window is to be flashed, in milliseconds. If Zero, the function uses the default cursor blink
            ///     rate.
            /// </summary>
            public uint dwTimeout;
        }
    }
}