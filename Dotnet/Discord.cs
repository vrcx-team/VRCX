// Copyright(c) 2019-2025 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

using System;
using DiscordRPC;
using System.Text;
using System.Threading;
using NLog;

namespace VRCX
{
    public class Discord
    {
        private readonly Logger _logger = LogManager.GetCurrentClassLogger();
        public static readonly Discord Instance;
        private readonly ReaderWriterLockSlim _lock;
        private readonly RichPresence _presence;
        private DiscordRpcClient _client;
        private readonly Timer _timer;
        private bool _active;
        private string _discordAppId;
        private const string VrcxUrl = "https://vrcx.app";

        static Discord()
        {
            Instance = new Discord();
        }

        public Discord()
        {
            _lock = new ReaderWriterLockSlim();
            _presence = new RichPresence();
            _timer = new Timer(TimerCallback, null, -1, -1);
        }

        public void Init()
        {
            _timer.Change(0, 3000);
        }

        public void Exit()
        {
            lock (this)
            {
                _timer.Change(-1, -1);
                _client?.Dispose();
            }
        }

        private void TimerCallback(object state)
        {
            lock (this)
            {
                try
                {
                    Update();
                }
                catch (Exception ex)
                {
                    _logger.Error(ex, "Error updating Discord Rich Presence {Error}", ex.Message);
                }
            }
        }

        private void Update()
        {
            if (_client == null && _active)
            {
                _client = new DiscordRpcClient(_discordAppId);
                _client.OnReady += (sender, e) =>
                {
                    _logger.Info("Discord Rich Presence connected: {User}", e.User.DisplayName);
                };
                _client.OnError += (sender, e) =>
                {
                    _logger.Error("Discord Rich Presence error: {Error}", e.Message);
                };
                _client.OnConnectionFailed += (sender, e) =>
                {
                    _logger.Error("Discord Rich Presence connection failed: {Error}", e.Type);
                };
                _client.OnConnectionEstablished += (sender, e) =>
                {
                    _logger.Info("Discord Rich Presence connection established");
                };
                if (!_client.Initialize())
                {
                    _client.Dispose();
                    _client = null;
                }
            }

            if (_client != null && !_active)
            {
                _client.Dispose();
                _client = null;
            }

            if (_client != null && !_lock.IsWriteLockHeld)
            {
                _lock.EnterReadLock();
                try
                {
                    _client.SetPresence(_presence);
                }
                finally
                {
                    _lock.ExitReadLock();
                }
                _client.Invoke();
            }
        }

        public bool SetActive(bool active)
        {
            _active = active;
            return _active;
        }

        // https://stackoverflow.com/questions/1225052/best-way-to-shorten-utf8-string-based-on-byte-length
        private static string LimitByteLength(string str, int maxBytesLength)
        {
            if (str == null)
                return string.Empty;
            var bytesArr = Encoding.UTF8.GetBytes(str);
            var bytesToRemove = 0;
            var lastIndexInString = str.Length - 1;
            while (bytesArr.Length - bytesToRemove > maxBytesLength)
            {
                bytesToRemove += Encoding.UTF8.GetByteCount(new char[] { str[lastIndexInString] });
                --lastIndexInString;
            }
            return Encoding.UTF8.GetString(bytesArr, 0, bytesArr.Length - bytesToRemove);
        }
        
        public void SetAssets(
            string details,
            string state,
            string detailsUrl,
            
            string largeKey,
            string largeText,
            
            string smallKey,
            string smallText,
            
            double startUnixMilliseconds,
            double endUnixMilliseconds,
            
            string partyId,
            int partySize,
            int partyMax,
            string buttonText,
            string buttonUrl,
            string appId,
            int activityType)
        {
            _lock.EnterWriteLock();
            try
            {
                if (string.IsNullOrEmpty(largeKey) &&
                    string.IsNullOrEmpty(smallKey))
                {
                    _presence.Assets = null;
                    _presence.Party = null;
                    _presence.Timestamps = null;
                    _lock.ExitWriteLock();
                    return;
                }
                
                _presence.Details = LimitByteLength(details, 127);
                _presence.DetailsUrl = !string.IsNullOrEmpty(detailsUrl) ? detailsUrl : null;
                // _presence.StateUrl
                _presence.State = LimitByteLength(state, 127);
                _presence.Assets ??= new Assets();
                
                _presence.Assets.LargeImageKey = largeKey;
                _presence.Assets.LargeImageText = largeText;
                _presence.Assets.LargeImageUrl = VrcxUrl;
                
                _presence.Assets.SmallImageKey = smallKey;
                _presence.Assets.SmallImageText = smallText;
                // m_Presence.Assets.SmallImageUrl
                
                if (startUnixMilliseconds == 0)
                {
                    _presence.Timestamps = null;
                }
                else
                {
                    _presence.Timestamps ??= new Timestamps();
                    _presence.Timestamps.StartUnixMilliseconds = (ulong)startUnixMilliseconds;
                    if (endUnixMilliseconds == 0)
                        _presence.Timestamps.End = null;
                    else
                        _presence.Timestamps.EndUnixMilliseconds = (ulong)endUnixMilliseconds;
                }

                if (partyMax == 0)
                {
                    _presence.Party = null;
                }
                else
                {
                    _presence.Party ??= new Party();
                    _presence.Party.ID = partyId;
                    _presence.Party.Size = partySize;
                    _presence.Party.Max = partyMax;
                }

                _presence.Type = (ActivityType)activityType;
                _presence.StatusDisplay = StatusDisplayType.Details;
                
                Button[] buttons = [];
                if (!string.IsNullOrEmpty(buttonUrl))
                {
                    buttons =
                    [
                        new Button { Label = buttonText, Url = buttonUrl }
                    ];
                }
                _presence.Buttons = buttons;
                
                if (_discordAppId != appId)
                {
                    _discordAppId = appId;
                    if (_client != null)
                    {
                        _client.Dispose();
                        _client = null;
                    }
                    Update();
                }
            }
            catch (Exception ex)
            {
                _logger.Error(ex, "Error setting Discord Rich Presence assets: {Error}", ex.Message);
            }
            finally
            {
                _lock.ExitWriteLock();
            }
        }
    }
}