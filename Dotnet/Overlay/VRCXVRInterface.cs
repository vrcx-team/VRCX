namespace VRCX;

public abstract class VRCXVRInterface
{
    public bool IsHmdAfk;
    
    public abstract void Init();
    public abstract void Exit();
    public abstract void Refresh();
    public abstract void Restart();
    public abstract void SetActive(bool active, bool hmdOverlay, bool wristOverlay, bool menuButton, int overlayHand);
    public abstract string[][] GetDevices();
    public abstract void ExecuteVrFeedFunction(string function, string json);
    public abstract void ExecuteVrOverlayFunction(string function, string json);
}