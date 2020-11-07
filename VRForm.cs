// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using System.IO;
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
            Browser1 = new ChromiumWebBrowser(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "html/vr.html?1"))
            {
                DragHandler = new NoopDragHandler(),
                BrowserSettings =
                {
                    // UniversalAccessFromFileUrls = CefState.Enabled,
                    DefaultEncoding = "UTF-8",
                },
                Dock = DockStyle.Fill,
            };
            Browser2 = new ChromiumWebBrowser(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "html/vr.html?2"))
            {
                DragHandler = new NoopDragHandler(),
                BrowserSettings =
                {
                    // UniversalAccessFromFileUrls = CefState.Enabled,
                    DefaultEncoding = "UTF-8",
                },
                Dock = DockStyle.Fill,
            };
            Util.ApplyJavascriptBindings(Browser1.JavascriptObjectRepository);
            Util.ApplyJavascriptBindings(Browser2.JavascriptObjectRepository);
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
