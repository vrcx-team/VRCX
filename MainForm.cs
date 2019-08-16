// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System.Drawing;
using System.Reflection;
using System.Windows.Forms;
using CefSharp;
using CefSharp.WinForms;

namespace VRCX
{
    public partial class MainForm : Form
    {
        public static MainForm Instance { get; private set; }
        public static ChromiumWebBrowser Browser { get; private set; }

        public MainForm()
        {
            Instance = this;
            InitializeComponent();
            try
            {
                Icon = Icon.ExtractAssociatedIcon(Assembly.GetExecutingAssembly().Location);
            }
            catch
            {
            }
            // Application.StartupPath + "/html/index.html"
            Browser = new ChromiumWebBrowser(Application.StartupPath + "/html/index.html")
            {
                BrowserSettings =
                {
                    // UniversalAccessFromFileUrls = CefState.Enabled,
                    DefaultEncoding = "UTF-8",
                },
                Dock = DockStyle.Fill,
            };
            var options = new BindingOptions()
            {
                CamelCaseJavascriptNames = false
            };
            Browser.JavascriptObjectRepository.Register("VRCX", new VRCX(), true, options);
            Browser.JavascriptObjectRepository.Register("VRCXStorage", new VRCXStorage(), false, options);
            Browser.JavascriptObjectRepository.Register("LogWatcher", new VRCX_LogWatcher(), true, options);
            Browser.JavascriptObjectRepository.Register("Discord", new Discord(), true, options);
            Browser.IsBrowserInitializedChanged += (A, B) =>
            {
                // Browser.ShowDevTools();
            };
            Controls.Add(Browser);
        }

        private void timer_Tick(object sender, System.EventArgs e)
        {
            Discord.Update();
        }
    }
}