using System;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading;
using NLog;
using Renci.SshNet;

namespace VRCX
{
    public class RemoteHostClient
    {
        public static readonly RemoteHostClient Instance;
        private static readonly Logger logger = LogManager.GetCurrentClassLogger();

        private const string LogFilePrefix = "output_log_";
        private const int PollIntervalMs = 1000;
        private const int GameCheckEveryNPolls = 15;
        private const int RotationCheckEveryNPolls = 30;

        private readonly object m_Lock = new object();
        private Thread m_Thread;
        private volatile bool m_Enabled;
        private volatile bool m_Connected;
        private volatile bool m_GameRunning;
        private string m_LastError = string.Empty;

        private string m_Address;
        private string m_Username;
        private string m_Password;
        private string m_LogPathOverride;

        private SftpClient m_Client;
        private SshClient m_Shell;
        private bool m_IsWindows;
        private string m_LogDirectory;
        private string m_CurrentLogFile;
        private long m_Offset;
        private int m_PollCount;

        public bool Enabled => m_Enabled;
        public bool Connected => m_Connected;
        public bool IsGameRunning => m_GameRunning;
        public static string MirrorLogDirectory => Path.Join(Program.AppDataDirectory, "remote-logs");

        static RemoteHostClient()
        {
            Instance = new RemoteHostClient();
        }

        public void StartFromConfig()
        {
            var enabled = VRCXStorage.Instance.Get("VRCX_RemoteHostEnabled") == "true";
            var address = VRCXStorage.Instance.Get("VRCX_RemoteHostAddress");
            var username = VRCXStorage.Instance.Get("VRCX_RemoteHostUsername");
            var password = VRCXStorage.Instance.Get("VRCX_RemoteHostPassword");
            var logPath = VRCXStorage.Instance.Get("VRCX_RemoteHostLogPath");

            if (!enabled || string.IsNullOrWhiteSpace(address) || string.IsNullOrWhiteSpace(username))
            {
                Stop();
                return;
            }

            Start(address, username, password, logPath);
        }

        public void Start(string address, string username, string password, string logPathOverride)
        {
            lock (m_Lock)
            {
                Stop();

                PreloadAssemblies();

                m_Address = address;
                m_Username = username;
                m_Password = password;
                m_LogPathOverride = logPathOverride;
                m_LastError = string.Empty;
                m_Enabled = true;

                Directory.CreateDirectory(MirrorLogDirectory);

                m_Thread = new Thread(ThreadLoop)
                {
                    IsBackground = true,
                    Name = "RemoteHostClient"
                };
                m_Thread.Start();
                logger.Info("Remote host client started: {0}@{1}", username, address);
            }
        }

        public void Stop()
        {
            lock (m_Lock)
            {
                if (!m_Enabled && m_Thread == null)
                {
                    return;
                }

                m_Enabled = false;
                var thread = m_Thread;
                m_Thread = null;
                thread?.Interrupt();
                thread?.Join(5000);

                try
                {
                    m_Client?.Disconnect();
                    m_Client?.Dispose();
                }
                catch
                {
                }

                m_Client = null;
                m_Connected = false;
                m_GameRunning = false;
                logger.Info("Remote host client stopped");
            }
        }

        public string GetStatusJson()
        {
            var payload = new
            {
                enabled = m_Enabled,
                connected = m_Connected,
                isWindows = m_IsWindows,
                gameRunning = m_GameRunning,
                logDirectory = m_LogDirectory ?? string.Empty,
                currentFile = m_CurrentLogFile ?? string.Empty,
                mirrorDirectory = MirrorLogDirectory,
                lastError = m_LastError
            };
            return JsonSerializer.Serialize(payload);
        }

        private static void PreloadAssemblies()
        {
            var dir = Path.GetDirectoryName(typeof(RemoteHostClient).Assembly.Location);
            if (string.IsNullOrEmpty(dir))
            {
                return;
            }

            foreach (var dll in new[] { "BouncyCastle.Cryptography.dll", "System.Formats.Asn1.dll", "Renci.SshNet.dll" })
            {
                var path = Path.Join(dir, dll);
                try
                {
                    if (File.Exists(path))
                    {
                        System.Reflection.Assembly.LoadFrom(path);
                    }
                }
                catch (Exception ex)
                {
                    logger.Warn(ex, "Preloading {0} failed", dll);
                }
            }
        }

        private void ThreadLoop()
        {
            var backoffSeconds = 5;

            while (m_Enabled)
            {
                try
                {
                    ConnectAndProbe();
                    backoffSeconds = 5;

                    AttachLatestFile();

                    m_PollCount = 0;
                    while (m_Enabled)
                    {
                        PollTick();

                        m_PollCount++;
                        if (m_PollCount % GameCheckEveryNPolls == 0)
                        {
                            CheckGameRunning();
                        }
                        if (m_PollCount % RotationCheckEveryNPolls == 0)
                        {
                            CheckRotation();
                        }

                        Thread.Sleep(PollIntervalMs);
                    }
                }
                catch (ThreadInterruptedException)
                {
                }
                catch (Exception ex)
                {
                    m_LastError = ex.InnerException?.Message ?? ex.Message;
                    m_Connected = false;
                    m_GameRunning = false;
                    logger.Warn(ex, "Remote host poll failed, retrying in {0}s", backoffSeconds);
                }

                if (!m_Enabled)
                {
                    break;
                }

                Disconnect();
                try
                {
                    Thread.Sleep(backoffSeconds * 1000);
                }
                catch (ThreadInterruptedException)
                {
                }

                backoffSeconds = Math.Min(backoffSeconds * 2, 60);
            }
        }

        private void Disconnect()
        {
            try
            {
                m_Client?.Disconnect();
                m_Client?.Dispose();
                m_Shell?.Disconnect();
                m_Shell?.Dispose();
            }
            catch
            {
            }

            m_Client = null;
            m_Shell = null;
            m_Connected = false;
        }

        private void ConnectAndProbe()
        {
            var address = m_Address;
            var port = 22;
            var hostParts = address.Split(':');
            if (hostParts.Length == 2 && int.TryParse(hostParts[1], out var customPort))
            {
                address = hostParts[0];
                port = customPort;
            }

            m_Shell = new SshClient(address, port, m_Username, m_Password);
            m_Shell.ConnectionInfo.Timeout = TimeSpan.FromSeconds(8);
            m_Shell.Connect();
            if (!m_Shell.IsConnected)
            {
                throw new Exception($"SSH connection to {address}:{port} failed");
            }

            m_Connected = true;
            m_LastError = string.Empty;

            var os = m_Shell.RunCommand("echo %OS%").Execute().Trim();
            m_IsWindows = os.Equals("Windows_NT", StringComparison.OrdinalIgnoreCase);

            m_Client = new SftpClient(address, port, m_Username, m_Password);
            m_Client.ConnectionInfo.Timeout = TimeSpan.FromSeconds(8);
            m_Client.Connect();
            if (!m_Client.IsConnected)
            {
                throw new Exception($"SFTP connection to {address}:{port} failed");
            }

            if (string.IsNullOrWhiteSpace(m_LogPathOverride))
            {
                var profile = m_IsWindows
                    ? m_Shell.RunCommand("echo %USERPROFILE%").Execute().Trim()
                    : m_Shell.RunCommand("echo $HOME").Execute().Trim();
                var sftpProfile = profile.Replace('\\', '/');
                if (m_IsWindows && !sftpProfile.StartsWith("/"))
                {
                    sftpProfile = "/" + sftpProfile;
                }

                m_LogDirectory = DetectLogDirectory(sftpProfile);
                if (m_LogDirectory == null)
                {
                    throw new Exception("No VRChat output_log directory found on the remote host");
                }
            }
            else
            {
                m_LogDirectory = NormalizeRemotePath(m_LogPathOverride);
            }

            logger.Info("Remote host connected: {0}@{1} platform={2} logDir={3}",
                m_Username, address, m_IsWindows ? "windows" : "unix", m_LogDirectory);
        }

        private string DetectLogDirectory(string sftpProfile)
        {
            var candidates = new[]
            {
                $"{sftpProfile}/AppData/LocalLow/VRChat/VRChat",
                $"{sftpProfile}/.config/VRChat/VRChat",
                $"{sftpProfile}/Library/Application Support/VRChat/VRChat"
            };

            foreach (var candidate in candidates)
            {
                try
                {
                    var hasLogs = m_Client.ListDirectory(candidate)
                        .Any(f => f.Name.StartsWith(LogFilePrefix, StringComparison.Ordinal) &&
                                  f.Name.EndsWith(".txt", StringComparison.Ordinal));
                    if (hasLogs)
                    {
                        return candidate;
                    }
                }
                catch
                {
                }
            }

            return null;
        }

        private static string NormalizeRemotePath(string path)
        {
            var normalized = path.Replace('\\', '/');
            if (normalized.Length >= 2 && normalized[1] == ':' && normalized[0] != '/')
            {
                normalized = "/" + normalized;
            }
            return normalized.TrimEnd('/');
        }

        private string NewestLogFile()
        {
            return m_Client.ListDirectory(m_LogDirectory)
                .Where(f => f.Name.StartsWith(LogFilePrefix, StringComparison.Ordinal) &&
                            f.Name.EndsWith(".txt", StringComparison.Ordinal))
                .OrderByDescending(f => f.LastWriteTimeUtc)
                .Select(f => f.Name)
                .FirstOrDefault();
        }

        private void AttachLatestFile()
        {
            var newest = NewestLogFile()
                ?? throw new Exception("No output_log_*.txt file on the remote host yet");

            var mirrorPath = Path.Join(MirrorLogDirectory, newest);
            if (m_CurrentLogFile != newest)
            {
                logger.Info("Remote log file attached: {0}", newest);
                m_CurrentLogFile = newest;
                m_Offset = 0;

                foreach (var stale in Directory.GetFiles(MirrorLogDirectory, $"{LogFilePrefix}*.txt"))
                {
                    if (!stale.Equals(mirrorPath, StringComparison.Ordinal))
                    {
                        try
                        {
                            File.Delete(stale);
                        }
                        catch
                        {
                        }
                    }
                }
            }

            var mirrorFile = new FileInfo(mirrorPath);
            if (!mirrorFile.Exists)
            {
                using (File.Create(mirrorPath))
                {
                }
                mirrorFile.Refresh();
            }

            m_Offset = mirrorFile.Length;
            PollTick();
        }

        private void CheckRotation()
        {
            var newest = NewestLogFile();
            if (newest != null && newest != m_CurrentLogFile)
            {
                logger.Info("Remote log rotation detected: {0} -> {1}", m_CurrentLogFile, newest);
                m_CurrentLogFile = newest;
                m_Offset = 0;
                var mirrorPath = Path.Join(MirrorLogDirectory, newest);
                if (!File.Exists(mirrorPath))
                {
                    using (File.Create(mirrorPath))
                    {
                    }
                }
                m_Offset = 0;
                PollTick();
            }
        }

        private void PollTick()
        {
            var remotePath = $"{m_LogDirectory}/{m_CurrentLogFile}";
            var mirrorPath = Path.Join(MirrorLogDirectory, m_CurrentLogFile);

            using var stream = m_Client.OpenRead(remotePath);
            var remoteLength = stream.Length;
            if (remoteLength < m_Offset)
            {
                m_Offset = 0;
                using (File.Create(mirrorPath))
                {
                }
            }

            if (remoteLength == m_Offset)
            {
                return;
            }

            stream.Seek(m_Offset, SeekOrigin.Begin);
            using var mirror = new FileStream(mirrorPath, FileMode.Append, FileAccess.Write, FileShare.Read);
            var buffer = new byte[64 * 1024];
            int read;
            while (m_Offset < remoteLength &&
                   (read = stream.Read(buffer, 0, (int)Math.Min(buffer.Length, remoteLength - m_Offset))) > 0)
            {
                mirror.Write(buffer, 0, read);
                m_Offset += read;
            }
        }

        private void CheckGameRunning()
        {
            var command = m_IsWindows
                ? "tasklist /FI \"IMAGENAME eq VRChat.exe\" | find /I \"VRChat.exe\""
                : "pgrep -x VRChat >/dev/null && echo Y || echo N";
            var output = m_Shell.RunCommand(command).Execute();
            m_GameRunning = m_IsWindows
                ? output.Contains("VRChat.exe", StringComparison.OrdinalIgnoreCase)
                : output.Trim().Equals("Y", StringComparison.OrdinalIgnoreCase);
        }
    }
}
