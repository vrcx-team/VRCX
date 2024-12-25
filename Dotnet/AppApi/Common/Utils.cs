using System.IO;
using System.Text.RegularExpressions;

namespace VRCX;

public partial class AppApiCommon
{
    private static readonly Regex _folderRegex = new Regex(string.Format(@"([{0}]*\.+$)|([{0}]+)",
        Regex.Escape(new string(Path.GetInvalidPathChars()))));

    private static readonly Regex _fileRegex = new Regex(string.Format(@"([{0}]*\.+$)|([{0}]+)",
        Regex.Escape(new string(Path.GetInvalidFileNameChars()))));

    private static string MakeValidFileName(string name)
    {
        name = name.Replace("/", "");
        name = name.Replace("\\", "");
        name = _folderRegex.Replace(name, "");
        name = _fileRegex.Replace(name, "");

        return name;
    }
}