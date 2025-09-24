using System;
using System.IO;
using System.Security.Cryptography;
using librsync.net;

namespace VRCX;

public partial class AppApi
{
    public string MD5File(string blob)
    {
        var fileData = Convert.FromBase64CharArray(blob.ToCharArray(), 0, blob.Length);
        using var md5 = MD5.Create();
        var md5Hash = md5.ComputeHash(fileData);
        return Convert.ToBase64String(md5Hash);
    }

    public string SignFile(string blob)
    {
        var fileData = Convert.FromBase64String(blob);
        using var sig = Librsync.ComputeSignature(new MemoryStream(fileData));
        using var memoryStream = new MemoryStream();
        sig.CopyTo(memoryStream);
        var sigBytes = memoryStream.ToArray();
        return Convert.ToBase64String(sigBytes);
    }

    public string FileLength(string blob)
    {
        var fileData = Convert.FromBase64String(blob);
        return fileData.Length.ToString();
    }
}