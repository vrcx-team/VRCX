using System;
using System.Runtime.InteropServices;
using Valve.VR;

public class GLTextureWriter : IDisposable
{
    private uint _textureId;
    private readonly int _width, _height;
    private byte[] _buffer;

    // OpenGL P/Invoke declarations
    [DllImport("libGL.so.1", EntryPoint = "glGenTextures")]
    private static extern void glGenTextures(int n, out uint textures);

    [DllImport("libGL.so.1", EntryPoint = "glBindTexture")]
    private static extern void glBindTexture(uint target, uint texture);

    [DllImport("libGL.so.1", EntryPoint = "glTexParameteri")]
    private static extern void glTexParameteri(uint target, uint pname, int param);

    [DllImport("libGL.so.1", EntryPoint = "glTexImage2D")]
    private static extern void glTexImage2D(uint target, int level, int internalformat, int width, int height, int border, uint format, uint type, IntPtr pixels);

    [DllImport("libGL.so.1", EntryPoint = "glTexSubImage2D")]
    private static extern void glTexSubImage2D(uint target, int level, int xoffset, int yoffset, int width, int height, uint format, uint type, byte[] pixels);

    [DllImport("libGL.so.1", EntryPoint = "glDeleteTextures")]
    private static extern void glDeleteTextures(int n, ref uint textures);

    // OpenGL constants
    private const uint GL_TEXTURE_2D = 0x0DE1;
    private const uint GL_TEXTURE_MIN_FILTER = 0x2801;
    private const uint GL_TEXTURE_MAG_FILTER = 0x2800;
    private const uint GL_TEXTURE_WRAP_S = 0x2802;
    private const uint GL_TEXTURE_WRAP_T = 0x2803;
    private const uint GL_LINEAR = 0x2601;
    private const uint GL_CLAMP_TO_EDGE = 0x812F;
    private const uint GL_RGBA = 0x1908;
    private const uint GL_BGRA = 0x80E1;
    private const uint GL_UNSIGNED_BYTE = 0x1401;

    public GLTextureWriter(int width, int height)
    {
        _width = width;
        _height = height;
        _buffer = new byte[width * height * 4]; // 4 bytes per pixel (RGBA)
        InitTexture();
    }

    private void InitTexture()
    {
        glGenTextures(1, out _textureId);
        glBindTexture(GL_TEXTURE_2D, _textureId);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MIN_FILTER, (int)GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_MAG_FILTER, (int)GL_LINEAR);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_S, (int)GL_CLAMP_TO_EDGE);
        glTexParameteri(GL_TEXTURE_2D, GL_TEXTURE_WRAP_T, (int)GL_CLAMP_TO_EDGE);

        // Allocate texture storage with no initial data.
        glTexImage2D(GL_TEXTURE_2D, 0, (int)GL_RGBA, _width, _height, 0,
                    GL_BGRA, GL_UNSIGNED_BYTE, IntPtr.Zero);
    }

    /// <summary>
    /// Copies image data into the internal buffer.
    /// </summary>
    public void WriteImageToBuffer(byte[] data)
    {
        if (data.Length != _buffer.Length)
            throw new ArgumentException("Data size does not match texture size.");

        System.Buffer.BlockCopy(data, 0, _buffer, 0, _buffer.Length);
    }

    /// <summary>
    /// Updates the OpenGL texture with the current buffer.
    /// </summary>
    public void UpdateTexture()
    {
        glBindTexture(GL_TEXTURE_2D, _textureId);
        glTexSubImage2D(GL_TEXTURE_2D, 0, 0, 0, _width, _height,
                       GL_BGRA, GL_UNSIGNED_BYTE, _buffer);
    }

    /// <summary>
    /// Returns a Texture_t structure for use with OpenVR.
    /// </summary>
    public Texture_t AsTextureT()
    {
        return new Texture_t
        {
            handle = (IntPtr)_textureId,
            eType = ETextureType.OpenGL,
            eColorSpace = EColorSpace.Auto
        };
    }

    public void Dispose()
    {
        if (_textureId != 0)
        {
            glDeleteTextures(1, ref _textureId);
            _textureId = 0;
        }
    }
}