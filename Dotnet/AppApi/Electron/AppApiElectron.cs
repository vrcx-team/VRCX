using System;
using System.Diagnostics;
using System.IO;
using System.Threading.Tasks;
using NLog;

namespace VRCX
{
    public partial class AppApiElectron : AppApi
    {
        private static readonly Logger logger = LogManager.GetCurrentClassLogger();
        
        public override void DeleteAllCookies()
        {
        }
        
        public override void ShowDevTools()
        {
        }
        
        public override void SetVR(bool active, bool hmdOverlay, bool wristOverlay, bool menuButton, int overlayHand)
        {
        }
        
        public override void RefreshVR()
        {
        }

        public override void RestartVR()
        {
        }

        public override void SetZoom(double zoomLevel)
        {
        }
        
        public override async Task<double> GetZoom()
        {
            return 1;
        }

        public override void DesktopNotification(string BoldText, string Text = "", string Image = "")
        {
        }

        public override void RestartApplication(bool isUpgrade)
        {
        }

        public override bool CheckForUpdateExe()
        {
            return false;
        }
        
        public override void ExecuteAppFunction(string function, string json)
        {
        }

        public override void ExecuteVrFeedFunction(string function, string json)
        {
        }

        public override void ExecuteVrOverlayFunction(string function, string json)
        {
        }
        
        public override string GetLaunchCommand()
        {
            return string.Empty;
        }
        
        public override void FocusWindow()
        {
        }
        
        public override void ChangeTheme(int value)
        {
        }

        public override void DoFunny()
        {
        }
        
        public override string GetClipboard()
        {
            return string.Empty;
        }

        public override void SetStartup(bool enabled)
        {
        }
        
        public override void CopyImageToClipboard(string path)
        {
            if (!File.Exists(path) ||
                (!path.EndsWith(".png") &&
                 !path.EndsWith(".jpg") &&
                 !path.EndsWith(".jpeg") &&
                 !path.EndsWith(".gif") &&
                 !path.EndsWith(".bmp") &&
                 !path.EndsWith(".webp")))
                return;
        
            var process = new Process
            {
                StartInfo = new ProcessStartInfo
                {
                    FileName = "xclip",
                    Arguments = $"-selection clipboard -t image/png -i \"{path}\"",
                    UseShellExecute = false,
                    CreateNoWindow = true
                }
            };
            try 
            {
                process.Start();
                process.WaitForExit();
            }
            catch (Exception ex)
            {
                logger.Error($"Failed to copy image to clipboard: {ex.Message}");
            }
        }

        public override void FlashWindow()
        {
        }
        
        public override void SetUserAgent()
        {
        }
        
        public override bool IsRunningUnderWine()
        {
            return false;
        }
        
        
    }
}