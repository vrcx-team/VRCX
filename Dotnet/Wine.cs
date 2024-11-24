using System;
using System.Runtime.InteropServices;

namespace VRCX;

public static class Wine
{
    [DllImport("ntdll.dll")]
    private static extern IntPtr wine_get_version();

    public static bool GetIfWine()
    {
        // wine_get_version should be guaranteed to exist exclusively in Wine envs,
        // unlike some other suggestions like checking Wine registry keys 
        try
        {
            wine_get_version();
            return true;
        }
        catch { return false; }
    }
}

