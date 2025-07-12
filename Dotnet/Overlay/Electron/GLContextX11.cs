using System;
using System.Runtime.InteropServices;

public static class GLContextX11
{
    [DllImport("libX11.so.6")]
    private static extern IntPtr XOpenDisplay(IntPtr display);

    [DllImport("libX11.so.6")]
    private static extern int XDefaultScreen(IntPtr display);

    [DllImport("libGL.so.1")]
    private static extern IntPtr glXChooseVisual(IntPtr display, int screen, int[] attribList);

    [DllImport("libX11.so.6")]
    private static extern IntPtr XCreateSimpleWindow(IntPtr display, IntPtr parent, int x, int y, uint width, uint height, uint border_width, ulong border, ulong background);

    [DllImport("libX11.so.6")]
    private static extern int XMapWindow(IntPtr display, IntPtr window);

    [DllImport("libX11.so.6")]
    private static extern int XUnmapWindow(IntPtr display, IntPtr window);

    [DllImport("libGL.so.1")]
    private static extern IntPtr glXCreateContext(IntPtr display, IntPtr visual, IntPtr shareList, bool direct);

    [DllImport("libGL.so.1")]
    private static extern bool glXMakeCurrent(IntPtr display, IntPtr drawable, IntPtr context);

    [DllImport("libGL.so.1")]
    private static extern void glXDestroyContext(IntPtr display, IntPtr context);

    [DllImport("libX11.so.6")]
    private static extern int XDestroyWindow(IntPtr display, IntPtr window);

    [DllImport("libX11.so.6")]
    private static extern int XCloseDisplay(IntPtr display);

    [DllImport("libX11.so.6")]
    private static extern int XFlush(IntPtr display);

    [DllImport("libX11.so.6")]
    private static extern IntPtr XRootWindow(IntPtr display, int screen);

    [DllImport("libX11.so.6")]
    private static extern int XStoreName(IntPtr display, IntPtr window, string window_name);

    [DllImport("libX11.so.6")]
    private static extern int XChangeWindowAttributes(IntPtr display, IntPtr window, ulong valuemask, ref XSetWindowAttributes attributes);

    [DllImport("libX11.so.6")]
    private static extern int XMoveWindow(IntPtr display, IntPtr window, int x, int y);

    [DllImport("libX11.so.6")]
    private static extern int XResizeWindow(IntPtr display, IntPtr window, uint width, uint height);

    [StructLayout(LayoutKind.Sequential)]
    private struct XSetWindowAttributes
    {
        public IntPtr background_pixmap;
        public ulong background_pixel;
        public IntPtr border_pixmap;
        public ulong border_pixel;
        public int bit_gravity;
        public int win_gravity;
        public int backing_store;
        public ulong backing_planes;
        public ulong backing_pixel;
        public bool save_under;
        public long event_mask;
        public long do_not_propagate_mask;
        public bool override_redirect;
        public IntPtr colormap;
        public IntPtr cursor;
    }

    private const ulong CWOverrideRedirect = 0x00000200;
    private const ulong CWBackPixel = 0x00000002;
    private const ulong CWBorderPixel = 0x00000008;

    private static IntPtr display = IntPtr.Zero;
    private static IntPtr window = IntPtr.Zero;
    private static IntPtr context = IntPtr.Zero;
    private static bool windowVisible = false;

    public static bool Initialise()
    {
        try
        {
            display = XOpenDisplay(IntPtr.Zero);
            if (display == IntPtr.Zero)
            {
                Console.WriteLine("No X11 display available");
                return false;
            }

            int screen = XDefaultScreen(display);

            // Request a visual that supports OpenGL
            int[] attribs = { 4, 1, 5, 1, 12, 1, 0 }; // GLX_RGBA, GLX_DOUBLEBUFFER, GLX_DEPTH_SIZE, 1, None
            IntPtr visual = glXChooseVisual(display, screen, attribs);
            if (visual == IntPtr.Zero)
            {
                Console.WriteLine("Failed to find a GLX visual");
                return false;
            }

            IntPtr root = XRootWindow(display, screen);

            // Create window off-screen and very small to minimize visibility
            window = XCreateSimpleWindow(display, root, -10000, -10000, 1, 1, 0, 0, 0);
            if (window == IntPtr.Zero)
            {
                Console.WriteLine("Failed to create X11 window");
                return false;
            }

            // Set window attributes to make it invisible
            XSetWindowAttributes attrs = new XSetWindowAttributes();
            attrs.override_redirect = true; // Bypass window manager
            attrs.background_pixel = 0;
            attrs.border_pixel = 0;

            XChangeWindowAttributes(display, window, CWOverrideRedirect | CWBackPixel | CWBorderPixel, ref attrs);

            // Give it a name that indicates it's a hidden OpenGL context
            XStoreName(display, window, "Hidden OpenGL Context");

            context = glXCreateContext(display, visual, IntPtr.Zero, true);
            if (context == IntPtr.Zero)
            {
                Console.WriteLine("Failed to create GLX context");
                return false;
            }

            if (!glXMakeCurrent(display, window, context))
            {
                Console.WriteLine("Failed to make GLX context current");
                return false;
            }

            // Don't map the window at all - keep it completely hidden
            // The GLX context will work without the window being visible
            XFlush(display);

            Console.WriteLine("OpenGL context created successfully (X11/GLX)");
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
        if (display != IntPtr.Zero)
        {
            if (context != IntPtr.Zero)
                glXDestroyContext(display, context);
            if (window != IntPtr.Zero)
                XDestroyWindow(display, window);
            XCloseDisplay(display);
            display = IntPtr.Zero;
            window = IntPtr.Zero;
            context = IntPtr.Zero;
        }
    }
}