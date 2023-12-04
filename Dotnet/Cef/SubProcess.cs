using CefSharp.Internals;
using System;
using System.IO;

namespace VRCX;

public class BrowserSubprocess
{
    /// <summary>
    /// This function should be called from the application entry point function (typically Program.Main)
    /// to execute a secondary process e.g. gpu, renderer, utility
    /// This overload is specifically used for .Net Core. For hosting your own BrowserSubProcess
    /// it's preferable to use the Main method provided by this class.
    /// - Pass in command line args
    /// </summary>
    /// <param name="args">command line args</param>
    /// <returns>
    /// If called for the browser process (identified by no "type" command-line value) it will return immediately
    /// with a value of -1. If called for a recognized secondary process it will block until the process should exit
    /// and then return the process exit code.
    /// </returns>
    public static void Start()
    {
        var args = Environment.GetCommandLineArgs();
        var type = CommandLineArgsParser.GetArgumentValue(args, CefSharpArguments.SubProcessTypeArgument);

        if (string.IsNullOrEmpty(type))
        {
            // If --type param missing from command line CEF/Chromium assums
            // this is the main process (as all subprocesses must have a type param).
            return;
        }
        
        var browserSubprocessDllPath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "CefSharp.BrowserSubprocess.Core.dll");
        if (!File.Exists(browserSubprocessDllPath))
        {
            browserSubprocessDllPath = Path.Combine(Path.GetDirectoryName(typeof(CefSharp.Core.BrowserSettings).Assembly.Location), "CefSharp.BrowserSubprocess.Core.dll");
        }
        var browserSubprocessDll = System.Runtime.Loader.AssemblyLoadContext.Default.LoadFromAssemblyPath(browserSubprocessDllPath);
        var browserSubprocessExecutableType = browserSubprocessDll.GetType("CefSharp.BrowserSubprocess.BrowserSubprocessExecutable");

        var browserSubprocessExecutable = Activator.CreateInstance(browserSubprocessExecutableType);

        var mainMethod = browserSubprocessExecutableType.GetMethod("MainSelfHost", System.Reflection.BindingFlags.Static | System.Reflection.BindingFlags.Public);
        var argCount = mainMethod.GetParameters();

        var methodArgs = new object[] { args };

        var exitCode = mainMethod.Invoke(null, methodArgs);

        Environment.Exit((int)exitCode);
    }
}

