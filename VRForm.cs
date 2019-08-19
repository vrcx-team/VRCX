// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System.Windows.Forms;
using CefSharp;
using CefSharp.WinForms;

namespace VRCX
{
    public partial class VRForm : Form
    {
        public static VRForm Instance { get; private set; }
        public static ChromiumWebBrowser Browser1 { get; private set; }
        public static ChromiumWebBrowser Browser2 { get; private set; }

        public VRForm()
        {
            Instance = this;
            InitializeComponent();
            // 
            Browser1 = new ChromiumWebBrowser(Application.StartupPath + "/html/vr.html?1")
            {
                BrowserSettings =
                {
                    // UniversalAccessFromFileUrls = CefState.Enabled,
                    DefaultEncoding = "UTF-8",
                },
                Dock = DockStyle.Fill,
            };
            Browser2 = new ChromiumWebBrowser(Application.StartupPath + "/html/vr.html?2")
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
            Browser1.JavascriptObjectRepository.Register("VRCX", new VRCX(), true, options);
            Browser1.JavascriptObjectRepository.Register("VRCXStorage", new VRCXStorage(), false, options);
            Browser1.JavascriptObjectRepository.Register("SQLite", new SQLite(), true, options);
            Browser2.JavascriptObjectRepository.Register("VRCX", new VRCX(), true, options);
            Browser2.JavascriptObjectRepository.Register("VRCXStorage", new VRCXStorage(), false, options);
            Browser2.JavascriptObjectRepository.Register("SQLite", new SQLite(), true, options);
            Browser1.IsBrowserInitializedChanged += (A, B) =>
            {
                // Browser1.ShowDevTools();
            };
            Browser2.IsBrowserInitializedChanged += (A, B) =>
            {
                // Browser2.ShowDevTools();
            };
            panel1.Controls.Add(Browser1);
            panel2.Controls.Add(Browser2);
        }

        private void button_refresh_Click(object sender, System.EventArgs e)
        {
            Browser1.ExecuteScriptAsync("location.reload()");
            Browser2.ExecuteScriptAsync("location.reload()");
            VRCXVR.Refresh();
        }

        private void button_devtools_Click(object sender, System.EventArgs e)
        {
            Browser1.ShowDevTools();
            Browser2.ShowDevTools();
        }
    }
}