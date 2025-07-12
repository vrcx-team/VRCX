using System;
using System.Runtime.InteropServices;

public static class GLContextWayland
{
    // Wayland
    [DllImport("libwayland-client.so.0")]
    private static extern IntPtr wl_display_connect(string name);

    [DllImport("libwayland-client.so.0")]
    private static extern void wl_display_disconnect(IntPtr display);

    [DllImport("libwayland-client.so.0")]
    private static extern int wl_display_roundtrip(IntPtr display);

    // EGL
    [DllImport("libEGL.so.1")]
    private static extern IntPtr eglGetDisplay(IntPtr display_id);

    [DllImport("libEGL.so.1")]
    private static extern bool eglInitialize(IntPtr display, out int major, out int minor);

    [DllImport("libEGL.so.1")]
    private static extern bool eglTerminate(IntPtr display);

    [DllImport("libEGL.so.1")]
    private static extern bool eglChooseConfig(IntPtr display, int[] attrib_list, IntPtr[] configs, int config_size, out int num_config);

    [DllImport("libEGL.so.1")]
    private static extern IntPtr eglCreatePbufferSurface(IntPtr display, IntPtr config, int[] attrib_list);

    [DllImport("libEGL.so.1")]
    private static extern IntPtr eglCreateContext(IntPtr display, IntPtr config, IntPtr share_context, int[] attrib_list);

    [DllImport("libEGL.so.1")]
    private static extern bool eglMakeCurrent(IntPtr display, IntPtr draw, IntPtr read, IntPtr context);

    [DllImport("libEGL.so.1")]
    private static extern bool eglDestroySurface(IntPtr display, IntPtr surface);

    [DllImport("libEGL.so.1")]
    private static extern bool eglDestroyContext(IntPtr display, IntPtr context);

    [DllImport("libEGL.so.1")]
    private static extern int eglGetError();

    [DllImport("libEGL.so.1")]
    private static extern IntPtr eglQueryString(IntPtr display, int name);

    [DllImport("libGL.so.1")]
    private static extern IntPtr glGetString(int name);

    // EGL constants
    private const int EGL_SURFACE_TYPE = 0x3033;
    private const int EGL_PBUFFER_BIT = 0x0001;
    private const int EGL_RENDERABLE_TYPE = 0x3040;
    private const int EGL_OPENGL_BIT = 0x0008;
    private const int EGL_OPENGL_ES2_BIT = 0x0004;
    private const int EGL_RED_SIZE = 0x3024;
    private const int EGL_GREEN_SIZE = 0x3023;
    private const int EGL_BLUE_SIZE = 0x3022;
    private const int EGL_ALPHA_SIZE = 0x3021;
    private const int EGL_DEPTH_SIZE = 0x3025;
    private const int EGL_NONE = 0x3038;
    private const int EGL_WIDTH = 0x3057;
    private const int EGL_HEIGHT = 0x3056;
    private const int EGL_CONTEXT_CLIENT_VERSION = 0x3098;
    private const int EGL_VENDOR = 0x3053;
    private const int EGL_VERSION = 0x3054;
    private const int EGL_EXTENSIONS = 0x3055;

    // OpenGL constants
    private const int GL_VENDOR = 0x1F00;
    private const int GL_RENDERER = 0x1F01;
    private const int GL_VERSION = 0x1F02;

    private static IntPtr waylandDisplay = IntPtr.Zero;
    private static IntPtr eglDisplay = IntPtr.Zero;
    private static IntPtr eglContext = IntPtr.Zero;
    private static IntPtr eglSurface = IntPtr.Zero;

    public static bool Initialise()
    {
        try
        {
            // Connect to Wayland display
            waylandDisplay = wl_display_connect(null);
            if (waylandDisplay == IntPtr.Zero)
            {
                Console.WriteLine("Failed to connect to Wayland display");
                return false;
            }

            // Perform initial roundtrip to ensure connection is established
            wl_display_roundtrip(waylandDisplay);

            // Get EGL display
            eglDisplay = eglGetDisplay(waylandDisplay);
            if (eglDisplay == IntPtr.Zero)
            {
                Console.WriteLine("Failed to get EGL display");
                return false;
            }

            // Initialize EGL
            if (!eglInitialize(eglDisplay, out int major, out int minor))
            {
                Console.WriteLine($"Failed to initialize EGL. Error: 0x{eglGetError():X}");
                return false;
            }

            Console.WriteLine($"EGL version: {major}.{minor}");

            // Choose EGL config for offscreen rendering
            int[] configAttribs = {
                EGL_SURFACE_TYPE, EGL_PBUFFER_BIT,
                EGL_RENDERABLE_TYPE, EGL_OPENGL_BIT,
                EGL_RED_SIZE, 8,
                EGL_GREEN_SIZE, 8,
                EGL_BLUE_SIZE, 8,
                EGL_ALPHA_SIZE, 8,
                EGL_DEPTH_SIZE, 24,
                EGL_NONE
            };

            IntPtr[] configs = new IntPtr[10];
            if (!eglChooseConfig(eglDisplay, configAttribs, configs, 10, out int numConfigs) || numConfigs == 0)
            {
                Console.WriteLine($"Failed to choose EGL config. Error: 0x{eglGetError():X}");
                return false;
            }

            Console.WriteLine($"Found {numConfigs} EGL configs");
            IntPtr config = configs[0];

            // Create a minimal pbuffer surface (offscreen)
            int[] pbufferAttribs = {
                EGL_WIDTH, 1,
                EGL_HEIGHT, 1,
                EGL_NONE
            };

            eglSurface = eglCreatePbufferSurface(eglDisplay, config, pbufferAttribs);
            if (eglSurface == IntPtr.Zero)
            {
                Console.WriteLine($"Failed to create EGL pbuffer surface. Error: 0x{eglGetError():X}");
                return false;
            }

            // Create OpenGL context
            int[] contextAttribs = {
                EGL_NONE
            };

            eglContext = eglCreateContext(eglDisplay, config, IntPtr.Zero, contextAttribs);
            if (eglContext == IntPtr.Zero)
            {
                Console.WriteLine($"Failed to create EGL context. Error: 0x{eglGetError():X}");
                return false;
            }

            // Make context current
            if (!eglMakeCurrent(eglDisplay, eglSurface, eglSurface, eglContext))
            {
                Console.WriteLine($"Failed to make EGL context current. Error: 0x{eglGetError():X}");
                return false;
            }

            Console.WriteLine("OpenGL context created successfully (Wayland/EGL offscreen)");
            return true;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Failed to initialize OpenGL context: {ex.Message}");
            return false;
        }
    }

    public static void Cleanup()
    {
        if (eglDisplay != IntPtr.Zero)
        {
            if (eglContext != IntPtr.Zero)
            {
                eglMakeCurrent(eglDisplay, IntPtr.Zero, IntPtr.Zero, IntPtr.Zero);
                eglDestroyContext(eglDisplay, eglContext);
            }
            if (eglSurface != IntPtr.Zero)
                eglDestroySurface(eglDisplay, eglSurface);

            eglTerminate(eglDisplay);
        }

        if (waylandDisplay != IntPtr.Zero)
        {
            wl_display_disconnect(waylandDisplay);
        }

        waylandDisplay = IntPtr.Zero;
        eglDisplay = IntPtr.Zero;
        eglContext = IntPtr.Zero;
        eglSurface = IntPtr.Zero;
    }
}