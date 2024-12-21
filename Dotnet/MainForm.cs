// Copyright(c) 2019-2022 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.Drawing;
using System.Net;
using System.Reflection;
using System.Windows.Forms;
using CefSharp;
using CefSharp.WinForms;

namespace VRCX
{
    public partial class MainForm : WinformBase
    {
        public static MainForm Instance;
        public static NativeWindow nativeWindow;
        private static NLog.Logger jslogger = NLog.LogManager.GetLogger("Javascript");
        public ChromiumWebBrowser Browser;
        private readonly Timer _saveTimer;
        private int LastLocationX;
        private int LastLocationY;
        private int LastSizeWidth;
        private int LastSizeHeight;

        private FormWindowState _LastWindowStateToRestore = FormWindowState.Normal;
        private FormWindowState LastWindowStateToRestore
        {
            get => _LastWindowStateToRestore;
            set
            {
                // Used to restore window state after minimized
                if (FormWindowState.Minimized != value)
                {
                    _LastWindowStateToRestore = value;
                }
            }
        }

        public MainForm()
        {
            Instance = this;
            InitializeComponent();
            nativeWindow = NativeWindow.FromHandle(this.Handle);

            // adding a 5s delay here to avoid excessive writes to disk
            _saveTimer = new Timer();
            _saveTimer.Interval = 5000;
            _saveTimer.Tick += SaveTimer_Tick;
            try
            {
                var location = Assembly.GetExecutingAssembly().Location;
                var icon = Icon.ExtractAssociatedIcon(location);
                Icon = icon;
                TrayIcon.Icon = icon;
            }
            catch (Exception ex)
            {
                jslogger.Error(ex);
            }

            Browser = new ChromiumWebBrowser("file://vrcx/index.html")
            {
                DragHandler = new CustomDragHandler(),
                MenuHandler = new CustomMenuHandler(),
                DownloadHandler = new CustomDownloadHandler(),
                BrowserSettings =
                {
                    DefaultEncoding = "UTF-8",
                },
                Dock = DockStyle.Fill
            };

            Browser.IsBrowserInitializedChanged += (A, B) =>
            {
                if (Program.LaunchDebug)
                    Browser.ShowDevTools();
            };

            JavascriptBindings.ApplyAppJavascriptBindings(Browser.JavascriptObjectRepository);
            Browser.ConsoleMessage += (_, args) =>
            {
                jslogger.Debug(args.Message + " (" + args.Source + ":" + args.Line + ")");
            };

            Controls.Add(Browser);
        }

        private void MainForm_Load(object sender, System.EventArgs e)
        {
            try
            {
                int.TryParse(VRCXStorage.Instance.Get("VRCX_LocationX"), out LastLocationX);
                int.TryParse(VRCXStorage.Instance.Get("VRCX_LocationY"), out LastLocationY);
                int.TryParse(VRCXStorage.Instance.Get("VRCX_SizeWidth"), out LastSizeWidth);
                int.TryParse(VRCXStorage.Instance.Get("VRCX_SizeHeight"), out LastSizeHeight);
                var location = new Point(LastLocationX, LastLocationY);
                var size = new Size(LastSizeWidth, LastSizeHeight);
                var screen = Screen.FromPoint(location);
                if (screen.Bounds.Contains(location.X, location.Y))
                {
                    Location = location;
                }
                Size = new Size(1920, 1080);
                if (size.Width > 0 && size.Height > 0)
                {
                    Size = size;
                }
            }
            catch (Exception ex)
            {
                jslogger.Error(ex);
            }

            try
            {
                var state = WindowState;
                if (int.TryParse(VRCXStorage.Instance.Get("VRCX_WindowState"), out int v))
                {
                    state = (FormWindowState)v;
                }
                if (state == FormWindowState.Minimized)
                {
                    state = FormWindowState.Normal;
                }
                if ("true".Equals(VRCXStorage.Instance.Get("VRCX_StartAsMinimizedState")))
                {
                    state = FormWindowState.Minimized;
                }
                if ("true".Equals(VRCXStorage.Instance.Get("VRCX_StartAsMinimizedState")) &&
                    "true".Equals(VRCXStorage.Instance.Get("VRCX_CloseToTray")))
                {
                    BeginInvoke(Hide);
                }
                else
                {
                    WindowState = state;
                }
            }
            catch (Exception ex)
            {
                jslogger.Error(ex);
            }

            LastWindowStateToRestore = WindowState;

            // 가끔 화면 위치가 안맞음.. 이걸로 해결 될지는 모르겠음
            Browser.Invalidate();
        }

        private void MainForm_Resize(object sender, System.EventArgs e)
        {
            LastWindowStateToRestore = WindowState;

            if (WindowState != FormWindowState.Normal)
            {
                return;
            }
            LastSizeWidth = Size.Width;
            LastSizeHeight = Size.Height;

            _saveTimer?.Start();
        }

        private void SaveTimer_Tick(object sender, EventArgs e)
        {
            SaveWindowState();
            _saveTimer?.Stop();
        }

        private void MainForm_Move(object sender, System.EventArgs e)
        {
            if (WindowState != FormWindowState.Normal)
            {
                return;
            }
            LastLocationX = Location.X;
            LastLocationY = Location.Y;

            _saveTimer?.Start();
        }

        private void MainForm_FormClosing(object sender, FormClosingEventArgs e)
        {
            if (e.CloseReason == CloseReason.UserClosing &&
                "true".Equals(VRCXStorage.Instance.Get("VRCX_CloseToTray")))
            {
                e.Cancel = true;
                Hide();
            }
        }

        private void SaveWindowState()
        {
            VRCXStorage.Instance.Set("VRCX_LocationX", LastLocationX.ToString());
            VRCXStorage.Instance.Set("VRCX_LocationY", LastLocationY.ToString());
            VRCXStorage.Instance.Set("VRCX_SizeWidth", LastSizeWidth.ToString());
            VRCXStorage.Instance.Set("VRCX_SizeHeight", LastSizeHeight.ToString());
            VRCXStorage.Instance.Set("VRCX_WindowState", ((int)WindowState).ToString());
            VRCXStorage.Instance.Flush();
        }

        private void MainForm_FormClosed(object sender, FormClosedEventArgs e)
        {
            SaveWindowState();
        }

        private void TrayIcon_MouseClick(object sender, MouseEventArgs e)
        {
            if (e.Button == MouseButtons.Left)
            {
                Focus_Window();
            }
        }

        private void TrayMenu_Open_Click(object sender, System.EventArgs e)
        {
            Focus_Window();
        }

        public void Focus_Window()
        {
            Show();
            if (WindowState == FormWindowState.Minimized)
            {
                WindowState = LastWindowStateToRestore;
            }
            // Focus();
            Activate();
        }

        private void TrayMenu_DevTools_Click(object sender, System.EventArgs e)
        {
            Instance.Browser.ShowDevTools();
        }

        private void TrayMenu_Quit_Click(object sender, System.EventArgs e)
        {
            SaveWindowState();
            Application.Exit();
        }
    }
}