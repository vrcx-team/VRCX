using CefSharp;
using CefSharp.Wpf;
using System;
using System.ComponentModel;
using System.Drawing;
using System.IO;
using System.Reflection;
using System.Windows;
using System.Windows.Forms;
using System.Windows.Input;

namespace VRCX
{
    public partial class MainWindow : Window
    {
        public static MainWindow Instance;
        public ChromiumWebBrowser Browser;

        // Store draggable region if we have one - used for hit testing
        private Region Region_;

        private NotifyIcon NotifyIcon_;
        private bool Quit_;

        private int LastLocationX;
        private int LastLocationY;
        private int LastSizeWidth;
        private int LastSizeHeight;

        public MainWindow()
        {
            Instance = this;
            InitializeComponent();
            DoTrayIcon();

            var dragHandler = new DragHandler();
            dragHandler.RegionsChanged += (region) =>
            {
                if (region != null)
                {
                    // Only wire up event handler once
                    if (Region_ == null)
                    {
                        Browser.PreviewMouseLeftButtonDown += (sender, e) =>
                        {
                            var point = e.GetPosition(Browser);

                            if (Region_.IsVisible((float)point.X, (float)point.Y))
                            {
                                var window = GetWindow(this);
                                window.DragMove();

                                e.Handled = true;
                            }
                        };
                    }

                    Region_ = region;
                }
            };

            Browser = new ChromiumWebBrowser(
                Path.Combine(Program.BaseDirectory, "html/index.html")
            )
            {
                DragHandler = dragHandler,
                MenuHandler = new NoopMenuHandler(),
                BrowserSettings =
                {
                    DefaultEncoding = "UTF-8",
                }
            };

            Browser.IsBrowserInitializedChanged += (A, B) =>
            {
                if (Browser.IsDisposed == false)
                {
                    Browser.ShowDevTools();
                }
            };

            Util.ApplyJavascriptBindings(Browser.JavascriptObjectRepository);

            Content = Browser;
        }


        private void Window_Loaded(object sender, RoutedEventArgs e)
        {
            // restore last window location and size
            try
            {
                int.TryParse(VRCXStorage.Instance.Get("VRCX_LocationX"), out LastLocationX);
                int.TryParse(VRCXStorage.Instance.Get("VRCX_LocationY"), out LastLocationY);
                int.TryParse(VRCXStorage.Instance.Get("VRCX_SizeWidth"), out LastSizeWidth);
                int.TryParse(VRCXStorage.Instance.Get("VRCX_SizeHeight"), out LastSizeHeight);
                var location = new System.Drawing.Point(LastLocationX, LastLocationY);
                var size = new System.Drawing.Size(LastSizeWidth, LastSizeHeight);
                var screen = Screen.FromPoint(location);
                if (screen.Bounds.Contains(location.X, location.Y) == true)
                {
                    Left = location.X;
                    Top = location.Y;
                }
                if (size.Width > 0 && size.Height > 0)
                {
                    Width = size.Width;
                    Height = size.Height;
                }
            }
            catch
            {
            }

            // restore last window state
            try
            {
                var state = WindowState;
                if ("true".Equals(VRCXStorage.Instance.Get("VRCX_StartAsMinimizedState")))
                {
                    state = WindowState.Minimized;
                }
                else
                {
                    if (int.TryParse(VRCXStorage.Instance.Get("VRCX_WindowState"), out int v))
                    {
                        state = (WindowState)v;
                    }
                    if (state == WindowState.Minimized)
                    {
                        state = WindowState.Normal;
                    }
                }
                WindowState = state;
            }
            catch
            {
            }
        }

        private void Window_Closed(object sender, EventArgs e)
        {
            try
            {
                VRCXStorage.Instance.Set("VRCX_LocationX", LastLocationX.ToString());
                VRCXStorage.Instance.Set("VRCX_LocationY", LastLocationY.ToString());
                VRCXStorage.Instance.Set("VRCX_SizeWidth", LastSizeWidth.ToString());
                VRCXStorage.Instance.Set("VRCX_SizeHeight", LastSizeHeight.ToString());
                VRCXStorage.Instance.Set("VRCX_WindowState", ((int)WindowState).ToString());
            }
            catch
            {
            }

            if (NotifyIcon_ != null)
            {
                NotifyIcon_.Visible = false;
            }

            Content = null;
        }

        private void DoTrayIcon()
        {
            var contextMenu = new ContextMenu();

            contextMenu.MenuItems.Add("Open", (sender, e) =>
            {
                if (WindowState == WindowState.Minimized)
                {
                    WindowState = WindowState.Normal;
                }
                Show();
                Focus();
            });

            contextMenu.MenuItems.Add("-");

            contextMenu.MenuItems.Add("Quit VRCX", (sender, e) =>
            {
                Quit_ = true;
                Close();
            });

            NotifyIcon_ = new NotifyIcon();

            try
            {
                var location = Assembly.GetExecutingAssembly().Location;
                NotifyIcon_.Icon = System.Drawing.Icon.ExtractAssociatedIcon(location);
            }
            catch
            {
            }

            NotifyIcon_.ContextMenu = contextMenu;
            NotifyIcon_.Text = "VRCX";
            NotifyIcon_.DoubleClick += (sender, e) =>
            {
                if (WindowState == WindowState.Minimized)
                {
                    WindowState = WindowState.Normal;
                }
                Show();
                Focus();
            };
            NotifyIcon_.Visible = true;
        }

        private void Window_Closing(object sender, CancelEventArgs e)
        {
            try
            {
                if (Quit_ == false &&
                    "true".Equals(SharedVariable.Instance.Get("config:vrcx_closetotray")) == true)
                {
                    e.Cancel = true;
                    Hide();
                }
            }
            catch
            {
            }
        }

        private void Window_LocationChanged(object sender, EventArgs e)
        {
            if (WindowState == WindowState.Normal)
            {
                LastLocationX = (int)Left;
                LastLocationY = (int)Top;
            }
        }

        private void Window_SizeChanged(object sender, SizeChangedEventArgs e)
        {
            if (WindowState == WindowState.Normal)
            {
                LastSizeWidth = (int)Width;
                LastSizeHeight = (int)Height;
            }
        }
    }
}
