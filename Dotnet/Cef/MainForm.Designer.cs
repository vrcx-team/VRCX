// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

namespace VRCX
{
    partial class MainForm
    {
        /// <summary>
        /// 필수 디자이너 변수입니다.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// 사용 중인 모든 리소스를 정리합니다.
        /// </summary>
        /// <param name="disposing">관리되는 리소스를 삭제해야 하면 true이고, 그렇지 않으면 false입니다.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form 디자이너에서 생성한 코드

        /// <summary>
        /// 디자이너 지원에 필요한 메서드입니다.
        /// 이 메서드의 내용을 코드 편집기로 수정하지 마세요.
        /// </summary>
        private void InitializeComponent()
        {
            this.components = new System.ComponentModel.Container();
            this.TrayMenu = new System.Windows.Forms.ContextMenuStrip(this.components);
            this.TrayMenu_Open = new System.Windows.Forms.ToolStripMenuItem();
            this.TrayMenu_DevTools = new System.Windows.Forms.ToolStripMenuItem();
            this.TrayMenu_Separator = new System.Windows.Forms.ToolStripSeparator();
            this.TrayMenu_Quit = new System.Windows.Forms.ToolStripMenuItem();
            this.TrayIcon = new System.Windows.Forms.NotifyIcon(this.components);
            this.TrayMenu.SuspendLayout();
            this.SuspendLayout();
            //
            // TrayMenu
            //
            this.TrayMenu.Items.AddRange(new System.Windows.Forms.ToolStripItem[] {
            this.TrayMenu_Open,
            this.TrayMenu_DevTools,
            this.TrayMenu_Separator,
            this.TrayMenu_Quit});
            this.TrayMenu.Name = "TrayMenu";
            this.TrayMenu.Size = new System.Drawing.Size(132, 54);
            //
            // TrayMenu_Open
            //
            this.TrayMenu_Open.Name = "TrayMenu_Open";
            this.TrayMenu_Open.Size = new System.Drawing.Size(131, 22);
            this.TrayMenu_Open.Text = "Open";
            this.TrayMenu_Open.Click += new System.EventHandler(this.TrayMenu_Open_Click);
            //
            // TrayMenu_DevTools
            //
            this.TrayMenu_DevTools.Name = "TrayMenu_DevTools";
            this.TrayMenu_DevTools.Size = new System.Drawing.Size(131, 22);
            this.TrayMenu_DevTools.Text = "DevTools";
            this.TrayMenu_DevTools.Click += new System.EventHandler(this.TrayMenu_DevTools_Click);
            //
            // TrayMenu_Separator
            //
            this.TrayMenu_Separator.Name = "TrayMenu_Separator";
            this.TrayMenu_Separator.Size = new System.Drawing.Size(128, 6);
            //
            // TrayMenu_Quit
            //
            this.TrayMenu_Quit.Name = "TrayMenu_Quit";
            this.TrayMenu_Quit.Size = new System.Drawing.Size(131, 22);
            this.TrayMenu_Quit.Text = "Quit VRCX";
            this.TrayMenu_Quit.Click += new System.EventHandler(this.TrayMenu_Quit_Click);
            //
            // TrayIcon
            //
            this.TrayIcon.ContextMenuStrip = this.TrayMenu;
            this.TrayIcon.Text = "VRCX";
            this.TrayIcon.Visible = true;
            this.TrayIcon.MouseClick += new System.Windows.Forms.MouseEventHandler(this.TrayIcon_MouseClick);
            //
            // MainForm
            //
            this.AutoScaleDimensions = new System.Drawing.SizeF(96F, 96F);
            this.AutoScaleMode = System.Windows.Forms.AutoScaleMode.Dpi;
            this.ClientSize = new System.Drawing.Size(842, 561);
            this.MinimumSize = new System.Drawing.Size(320, 240);
            this.Name = "MainForm";
            this.StartPosition = System.Windows.Forms.FormStartPosition.CenterScreen;
            this.Text = Program.Version;
            this.FormClosing += new System.Windows.Forms.FormClosingEventHandler(this.MainForm_FormClosing);
            this.FormClosed += new System.Windows.Forms.FormClosedEventHandler(this.MainForm_FormClosed);
            this.Load += new System.EventHandler(this.MainForm_Load);
            this.Move += new System.EventHandler(this.MainForm_Move);
            this.Resize += new System.EventHandler(this.MainForm_Resize);
            this.TrayMenu.ResumeLayout(false);
            this.ResumeLayout(false);

        }

        #endregion

        private System.Windows.Forms.ContextMenuStrip TrayMenu;
        private System.Windows.Forms.ToolStripMenuItem TrayMenu_Open;
        private System.Windows.Forms.ToolStripMenuItem TrayMenu_DevTools;
        private System.Windows.Forms.ToolStripSeparator TrayMenu_Separator;
        private System.Windows.Forms.ToolStripMenuItem TrayMenu_Quit;
        private System.Windows.Forms.NotifyIcon TrayIcon;
    }
}