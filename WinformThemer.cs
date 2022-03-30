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
        /// <summary>
        /// Private holder of current theme
        /// </summary>
        private static int currentTheme = 0;

        /// <summary>
        /// Sets the global theme of the app
        /// Light = 0
        /// Dark = 1
        /// </summary>
        public static void SetGlobalTheme(int theme)
        {
            currentTheme = theme;

            //Make a seperate list for all current forms (causes issues otherwise)
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

        /// <summary>
        /// Set given form to the current global theme
        /// </summary>
        /// <param name="form"></param>
        public static void SetThemeToGlobal(Form form)
        {
            SetThemeToGlobal(new List<Form>() { form });
        }

        /// <summary>
        /// Set a list of given forms to the current global theme
        /// </summary>
        /// <param name="forms"></param>
        public static void SetThemeToGlobal(List<Form> forms)
        {
            //For each form, set the theme, then move focus onto it to force refresh
            foreach(Form form in forms)
            {
                //Set the theme of the window
                SetThemeToGlobal(form.Handle);

                //Change opacity to foce full redraw
                form.Opacity = 0.99999;
                form.Opacity = 1;
            }
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
            IntPtr curThemePtr = Marshal.AllocHGlobal(4);

            //See what window state it currently is
            if (PInvoke.DwmGetWindowAttribute(handle, 19, curThemePtr, 4) != 0)
                PInvoke.DwmGetWindowAttribute(handle, 20, curThemePtr, 4);

            //Read current theme (light = 0, dark = 1)
            int theme = Marshal.ReadInt32(curThemePtr);

            //Free previously allocated
            Marshal.FreeHGlobal(curThemePtr);

            return theme;
        }

        internal static class PInvoke
        {
            [DllImport("DwmApi")]
            internal static extern int DwmSetWindowAttribute(IntPtr hwnd, int dwAttribute, int[] pvAttribute, int cbAttribute);

            [DllImport("DwmApi")]
            internal static extern int DwmGetWindowAttribute(IntPtr hwnd, int dwAttribute, IntPtr pvAttribute, int cbAttribute);

            [DllImport("user32.dll", CharSet = CharSet.Auto, SetLastError = true)]
            internal static extern int SetWindowLong(IntPtr hwnd, int index, int newStyle);
        }

        public static void DoFunny()
        {
            foreach (Form form in Application.OpenForms)
            {
                PInvoke.SetWindowLong(form.Handle, -20, 0x00C00000);
                // PInvoke.SetWindowLong(form.Handle, -20, 0x00050100);
            }
        }
    }
}
