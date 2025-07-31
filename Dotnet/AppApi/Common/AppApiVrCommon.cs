using System.Collections.Generic;

namespace VRCX;

public abstract partial class AppApiVr
{
    public static AppApiVr Instance;
    public abstract void Init();
    public abstract void VrInit();
    public abstract void ToggleSystemMonitor(bool enabled);
    public abstract float CpuUsage();
    public abstract string[][] GetVRDevices();
    public abstract double GetUptime();
    public abstract string CurrentCulture();
    public abstract string CustomVrScript();
    public abstract List<KeyValuePair<string, string>> GetExecuteVrFeedFunctionQueue();
    public abstract List<KeyValuePair<string, string>> GetExecuteVrOverlayFunctionQueue();
}