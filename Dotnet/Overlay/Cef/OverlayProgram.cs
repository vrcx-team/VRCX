using System;
using System.Threading.Tasks;
using System.Windows.Forms;
using NLog;

namespace VRCX.Overlay;

internal static class OverlayProgram
{
    private static readonly Logger logger = LogManager.GetCurrentClassLogger();
    
    public static VRCXVRInterface VRCXVRInstance;
    
    public static void OverlayMain()
    {
        logger.Info("VRCX Overlay starting...");
        CefService.Instance.Init();
        AppApiVr.Instance = new AppApiVrCef();
        var isLegacy = VRCXStorage.Instance.Get("VRCX_DisableVrOverlayGpuAcceleration") == "true";
        VRCXVRInstance = new VRCXVRCef(isLegacy);
        VRCXVRInstance.Init();
        
        OverlayClient.Init();

        logger.Info("VRCX Overlay started...");
        QuitProcess();
        ApplicationConfiguration.Initialize();
        var context = new ApplicationContext();
        Application.Run(context);
        Exit();
    }

    private static void Exit()
    {
        logger.Info("VRCX Overlay exiting...");
        // CefService.Instance.Exit();
        OverlayClient.Exit();
        VRCXVRInstance.Exit();
        Environment.Exit(0);
    }

    private static async Task QuitProcess()
    {
        await Task.Delay(5000);
        while (OverlayClient.ConnectedAndActive)
        {
            await Task.Delay(500);
        }
        Exit();
    }
}