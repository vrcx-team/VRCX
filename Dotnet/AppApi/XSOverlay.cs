using System.Net;
using System.Net.Sockets;

namespace VRCX
{
    public partial class AppApi
    {
        /// <summary>
        /// Displays an XSOverlay notification with the specified title, content, and optional image.
        /// </summary>
        /// <param name="title">The title of the notification.</param>
        /// <param name="content">The content of the notification.</param>
        /// <param name="timeout">The duration of the notification in milliseconds.</param>
        /// <param name="image">The optional image to display in the notification.</param>
        public void XSNotification(string title, string content, int timeout, string image = "")
        {
            var broadcastSocket = new Socket(AddressFamily.InterNetwork, SocketType.Dgram, ProtocolType.Udp);
            var endPoint = new IPEndPoint(IPAddress.Loopback, 42069);
            var useBase64Icon = false;
            var icon = image;
            if (string.IsNullOrEmpty(image))
            {
                useBase64Icon = true;
                icon = "iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAACXBIWXMAAAsTAAALEwEAmpwYAAAHaGlUWHRYTUw6Y29tLmFkb2JlLnhtcAAAAAAAPD94cGFja2V0IGJlZ2luPSLvu78iIGlkPSJXNU0wTXBDZWhpSHpyZVN6TlRjemtjOWQiPz4gPHg6eG1wbWV0YSB4bWxuczp4PSJhZG9iZTpuczptZXRhLyIgeDp4bXB0az0iQWRvYmUgWE1QIENvcmUgNS42LWMxNDUgNzkuMTYzNDk5LCAyMDE4LzA4LzEzLTE2OjQwOjIyICAgICAgICAiPiA8cmRmOlJERiB4bWxuczpyZGY9Imh0dHA6Ly93d3cudzMub3JnLzE5OTkvMDIvMjItcmRmLXN5bnRheC1ucyMiPiA8cmRmOkRlc2NyaXB0aW9uIHJkZjphYm91dD0iIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtbG5zOmRjPSJodHRwOi8vcHVybC5vcmcvZGMvZWxlbWVudHMvMS4xLyIgeG1sbnM6cGhvdG9zaG9wPSJodHRwOi8vbnMuYWRvYmUuY29tL3Bob3Rvc2hvcC8xLjAvIiB4bWxuczp4bXBNTT0iaHR0cDovL25zLmFkb2JlLmNvbS94YXAvMS4wL21tLyIgeG1sbnM6c3RFdnQ9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9zVHlwZS9SZXNvdXJjZUV2ZW50IyIgeG1wOkNyZWF0b3JUb29sPSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiIHhtcDpDcmVhdGVEYXRlPSIyMDIxLTA0LTA4VDE0OjU3OjAxKzEyOjAwIiB4bXA6TW9kaWZ5RGF0ZT0iMjAyMS0wNC0wOFQxNjozMzoxMCsxMjowMCIgeG1wOk1ldGFkYXRhRGF0ZT0iMjAyMS0wNC0wOFQxNjozMzoxMCsxMjowMCIgZGM6Zm9ybWF0PSJpbWFnZS9wbmciIHBob3Rvc2hvcDpDb2xvck1vZGU9IjMiIHBob3Rvc2hvcDpJQ0NQcm9maWxlPSJzUkdCIElFQzYxOTY2LTIuMSIgeG1wTU06SW5zdGFuY2VJRD0ieG1wLmlpZDo2YTY5MmQzYi03ZTJkLTNiNGUtYTMzZC1hN2MwOTNlOGU0OTkiIHhtcE1NOkRvY3VtZW50SUQ9ImFkb2JlOmRvY2lkOnBob3Rvc2hvcDo1NTE2MWIyMi1hYzgxLTY3NDYtODAyYi1kODIzYWFmN2RjYjciIHhtcE1NOk9yaWdpbmFsRG9jdW1lbnRJRD0ieG1wLmRpZDo3ZjJjNTA2ZS02YTVhLWRhNGEtOTg5Mi02NDZiMzQ0MGQxZTgiPiA8cGhvdG9zaG9wOkRvY3VtZW50QW5jZXN0b3JzPiA8cmRmOkJhZz4gPHJkZjpsaT5hZG9iZTpkb2NpZDpwaG90b3Nob3A6NmJmOGE5MTgtY2QzZS03OTRjLTk3NzktMzM0YjYwZWJiNTYyPC9yZGY6bGk+IDwvcmRmOkJhZz4gPC9waG90b3Nob3A6RG9jdW1lbnRBbmNlc3RvcnM+IDx4bXBNTTpIaXN0b3J5PiA8cmRmOlNlcT4gPHJkZjpsaSBzdEV2dDphY3Rpb249ImNyZWF0ZWQiIHN0RXZ0Omluc3RhbmNlSUQ9InhtcC5paWQ6N2YyYzUwNmUtNmE1YS1kYTRhLTk4OTItNjQ2YjM0NDBkMWU4IiBzdEV2dDp3aGVuPSIyMDIxLTA0LTA4VDE0OjU3OjAxKzEyOjAwIiBzdEV2dDpzb2Z0d2FyZUFnZW50PSJBZG9iZSBQaG90b3Nob3AgQ0MgMjAxOSAoV2luZG93cykiLz4gPHJkZjpsaSBzdEV2dDphY3Rpb249InNhdmVkIiBzdEV2dDppbnN0YW5jZUlEPSJ4bXAuaWlkOmJhM2ZjODI3LTM0ZjQtYjU0OC05ZGFiLTZhMTZlZmQzZjAxMSIgc3RFdnQ6d2hlbj0iMjAyMS0wNC0wOFQxNTowMTozMSsxMjowMCIgc3RFdnQ6c29mdHdhcmVBZ2VudD0iQWRvYmUgUGhvdG9zaG9wIENDIDIwMTkgKFdpbmRvd3MpIiBzdEV2dDpjaGFuZ2VkPSIvIi8+IDxyZGY6bGkgc3RFdnQ6YWN0aW9uPSJzYXZlZCIgc3RFdnQ6aW5zdGFuY2VJRD0ieG1wLmlpZDo2YTY5MmQzYi03ZTJkLTNiNGUtYTMzZC1hN2MwOTNlOGU0OTkiIHN0RXZ0OndoZW49IjIwMjEtMDQtMDhUMTY6MzM6MTArMTI6MDAiIHN0RXZ0OnNv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";
            }
            
            var height = 110f;
            if (content.Length > 300)
                height = 250f;
            else if (content.Length > 200)
                height = 200f;
            else if (content.Length > 100)
                height = 150f;
            
            var msg = new XSOMessage
            {
                messageType = 1,
                title = title,
                content = content,
                height = height,
                sourceApp = "VRCX",
                timeout = timeout,
                audioPath = string.Empty,
                useBase64Icon = useBase64Icon,
                icon = icon
            };
            
            var byteBuffer = System.Text.Json.JsonSerializer.SerializeToUtf8Bytes(msg);
            broadcastSocket.SendTo(byteBuffer, endPoint);
            broadcastSocket.Close();
        }
        
        private struct XSOMessage
        {
            public int messageType { get; set; }
            public int index { get; set; }
            public float volume { get; set; }
            public string audioPath { get; set; }
            public float timeout { get; set; }
            public string title { get; set; }
            public string content { get; set; }
            public string icon { get; set; }
            public float height { get; set; }
            public float opacity { get; set; }
            public bool useBase64Icon { get; set; }
            public string sourceApp { get; set; }
        }
    }
}