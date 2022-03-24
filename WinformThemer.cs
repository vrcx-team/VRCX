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
        private static int currentTheme = 0;

        /// <summary>
        /// Sets the global theme of the app
        /// Light = 0
        /// Dark = 1
        /// </summary>
        public static void SetGlobalTheme(int theme)
        {
            currentTheme = theme;

            List<Form> forms = new List<Form>();
            foreach(Form form in Application.OpenForms)
            {
                forms.Add(form);
            }
            SetThemeToGlobal(forms);
        }

        /// <summary>
        /// Gets the global theme of the app
        /// Light = 0
        /// Dark = 1
        /// </summary>
        public static int GetGlobalTheme() => currentTheme;


        public static void SetThemeToGlobal(Form form)
        {
            SetThemeToGlobal(new List<Form>() { form });
        }

        public static void SetThemeToGlobal(List<Form> forms)
        {
            InvisPopupHandler.Show();

            foreach(Form form in forms)
            {
                SetThemeToGlobal(form.Handle);

                if (form.WindowState != FormWindowState.Minimized)
                {
                    //attempting to refresh this god forsaken title bar

                    //Minimize, Downside: shows animation
                    //PInvokeFun.ShowWindow(form.Handle, (int)PInvokeFun.SW_TYPES.SW_MINIMIZE);
                    //PInvokeFun.ShowWindow(form.Handle, (int)PInvokeFun.SW_TYPES.SW_RESTORE);

                    //Hide, Downside: reorders window to last in taskbar if not pinned
                    PInvokeFun.ShowWindow(form.Handle, (int)PInvokeFun.SW_TYPES.SW_HIDE);
                    PInvokeFun.ShowWindow(form.Handle, (int)PInvokeFun.SW_TYPES.SW_SHOW);
                }
            }

            InvisPopupHandler.Close();
        }

        private static void SetThemeToGlobal(IntPtr handle)
        {
            if (GetTheme(handle) != currentTheme)
            {
                if (PInvokeFun.DwmSetWindowAttribute(handle, 19, new[] { currentTheme }, 4) != 0)
                    PInvokeFun.DwmSetWindowAttribute(handle, 20, new[] { currentTheme }, 4);
            }
        }

        private static int GetTheme(IntPtr handle)
        {
            //Allocate needed memory
            IntPtr curThemePtr = Marshal.AllocHGlobal(4);

            //See what window state it currently is
            if (PInvokeFun.DwmGetWindowAttribute(handle, 19, curThemePtr, 4) != 0)
                PInvokeFun.DwmGetWindowAttribute(handle, 20, curThemePtr, 4);

            //Read current theme (light = 0, dark = 1)
            int theme = Marshal.ReadInt32(curThemePtr);

            //Free previously allocated
            Marshal.FreeHGlobal(curThemePtr);

            return theme;
        }

        internal static class InvisPopupHandler
        {
            private static InvisPopup instance;

            internal static void Show()
            {
                if(instance == null)
                    instance = new InvisPopup();
                instance.Show();
            }

            internal static void Close()
            {
                instance.Close();
                instance.Dispose();
                instance = null;
            }
        }

        internal static class PInvokeFun
        {
            [DllImport("DwmApi")]
            internal static extern int DwmSetWindowAttribute(IntPtr hwnd, int dwAttribute, int[] pvAttribute, int cbAttribute);

            [DllImport("DwmApi")]
            internal static extern int DwmGetWindowAttribute(IntPtr hwnd, int dwAttribute, IntPtr pvAttribute, int cbAttribute);

            [DllImport("user32.dll")]
            internal static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
            internal enum SW_TYPES
            {
                SW_HIDE = 0,
                SW_SHOWNORMAL = 1,
                SW_SHOWMINIMIZED = 2,
                SW_SHOWMAXIMIZED = 3,
                SW_SHOWNOACTIVATE = 4,
                SW_SHOW = 5,
                SW_MINIMIZE = 6,
                SW_SHOWMINNOACTIVE = 7,
                SW_SHOWNA = 8,
                SW_RESTORE = 9,
                SW_SHOWDEFAULT = 10,
                SW_FORCEMINIMIZE = 11
            }
        }
    }
}
