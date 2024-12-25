using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text;

namespace VRCX
{
    public partial class AppApiCommon
    {
        public Dictionary<string, short> GetVRChatModerations(string currentUserId)
        {
            // 004 = hideAvatar
            // 005 = showAvatar
            var filePath = Path.Combine(GetVRChatAppDataLocation(), @$"LocalPlayerModerations\{currentUserId}-show-hide-user.vrcset");
            if (!File.Exists(filePath))
                return null;

            var output = new Dictionary<string, short>();
            using var reader = new StreamReader(filePath);
            string line;
            while ((line = reader.ReadLine()) != null)
            {
                var index = line.IndexOf(' ');
                if (index <= 0)
                    continue;

                var userId = line.Substring(0, index);
                var type = short.Parse(line.Substring(line.Length - 3));
                output.Add(userId, type);
            }

            return output;
        }
        
        public short GetVRChatUserModeration(string currentUserId, string userId)
        {
            var filePath = Path.Combine(GetVRChatAppDataLocation(), @$"LocalPlayerModerations\{currentUserId}-show-hide-user.vrcset");
            if (!File.Exists(filePath))
                return 0;

            using var reader = new StreamReader(filePath);
            string line;
            while ((line = reader.ReadLine()) != null)
            {
                var index = line.IndexOf(' ');
                if (index <= 0)
                    continue;

                if (userId == line.Substring(0, index))
                {
                    return short.Parse(line.Substring(line.Length - 3));
                }
            }

            return 0;
        }

        public bool SetVRChatUserModeration(string currentUserId, string userId, int type)
        {
            var filePath = Path.Combine(GetVRChatAppDataLocation(), @$"LocalPlayerModerations\{currentUserId}-show-hide-user.vrcset");
            if (!File.Exists(filePath))
                return false;

            var lines = File.ReadAllLines(filePath).ToList();
            var index = lines.FindIndex(x => x.StartsWith(userId));
            if (index >= 0)
                lines.RemoveAt(index);

            if (type != 0)
            {
                var sb = new StringBuilder(userId);
                while (sb.Length < 64)
                    sb.Append(' ');

                sb.Append(type.ToString("000"));
                lines.Add(sb.ToString());
            }

            try
            {
                File.WriteAllLines(filePath, lines);
            }
            catch (Exception)
            {
                return false;
            }

            return true;
        }
    }
}