using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Sockets;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading;
using System.Threading.Tasks;

namespace VRCX;

// Owns an isolated cookie jar until the frontend activates the verified account.
// No provider token, device code or cookie value is returned by Snapshot().
internal sealed class ExternalLoginOperation : IDisposable
{
    internal static readonly Uri Api = new("https://api.vrchat.cloud/api/1/");
    internal static readonly string[] CookieNames = { "auth", "twoFactorAuth" };
    private readonly object _gate = new();
    private readonly CancellationTokenSource _stop = new(TimeSpan.FromMinutes(5));
    private readonly HttpClient _client;
    private readonly Func<TimeSpan, CancellationToken, Task> _delay;
    private TcpListener _listener;
    private string _nonce;
    private string _status = "waiting";
    private string _error;
    private JsonElement? _user;
    private string _verificationUrl;
    private string _browserUrl;
    private string _redirectUri;
    private string _callbackPath;
    private string _requestState;
    private string _exchangeState;
    private string _identityNonce;
    private string _googleClientId;
    private string _stage = "authorization";
    private int? _httpStatus;
    private string[] _responseFields = Array.Empty<string>();
    private bool _disposed;
    internal readonly string Id = Guid.NewGuid().ToString("N");
    internal readonly string Provider;
    internal readonly CookieContainer Cookies = new();
    internal DateTimeOffset ExpiresAt = DateTimeOffset.UtcNow.AddMinutes(5);

    internal ExternalLoginOperation(string provider, IWebProxy proxy, string userAgent,
        HttpMessageHandler transport = null, Func<TimeSpan, CancellationToken, Task> delay = null)
    {
        if (!new[] { "steam", "meta", "google", "apple", "discord", "device" }.Contains(provider))
            throw new ArgumentException("Unsupported login provider.");
        Provider = provider;
        var handler = new HttpClientHandler
        {
            CookieContainer = Cookies,
            AutomaticDecompression = DecompressionMethods.All,
            AllowAutoRedirect = false
        };
        if (proxy != null)
        {
            handler.Proxy = proxy;
            handler.UseProxy = true;
        }
        if (transport != null) handler.Dispose();
        _client = new HttpClient(transport ?? handler) { BaseAddress = Api, Timeout = TimeSpan.FromSeconds(30) };
        _delay = delay ?? Task.Delay;
        _client.DefaultRequestHeaders.TryAddWithoutValidation("User-Agent", userAgent);
    }

    private static string EncodeState(object state) => Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(state)));

    private static string QueryUrl(string path, IEnumerable<KeyValuePair<string, string>> values) =>
        path + "?" + string.Join("&", values.Select(p => Uri.EscapeDataString(p.Key) + "=" + Uri.EscapeDataString(p.Value)));

    internal async Task StartAsync()
    {
        if (Provider == "device")
        {
            _ = RunDeviceAsync();
            return;
        }
        _nonce = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        _listener = new TcpListener(IPAddress.Loopback, 0);
        _listener.Start(4);
        var port = ((IPEndPoint)_listener.LocalEndpoint).Port;
        _callbackPath = Provider == "google" ? "/" : Provider == "discord" ? "/callback" : "/" + _nonce;
        _redirectUri = $"http://127.0.0.1:{port}{_callbackPath}";
        _identityNonce = Convert.ToHexString(RandomNumberGenerator.GetBytes(32)).ToLowerInvariant();
        _exchangeState = EncodeState(new { redirectUri = _redirectUri, csrf = _nonce });
        _requestState = Provider == "google" ? _exchangeState : _nonce;
        try
        {
            switch (Provider)
            {
                case "google":
                    SetStage("configuration");
                    var config = await SendAsync("config");
                    _googleClientId = Text(config.Json, "googleApiUnityClientId");
                    if (config.Status != 200 || _googleClientId == null ||
                        !Regex.IsMatch(_googleClientId, @"^[0-9]+-[a-z0-9]+\.apps\.googleusercontent\.com$"))
                    { Fail(config.Status == 429 ? "rate_limited" : "configuration_failed"); break; }
                    _browserUrl = QueryUrl("https://accounts.google.com/o/oauth2/v2/auth", new Dictionary<string, string>
                    {
                        ["client_id"] = _googleClientId,
                        ["redirect_uri"] = _redirectUri,
                        ["response_type"] = "code",
                        ["scope"] = "openid email profile",
                        ["state"] = _requestState,
                        ["nonce"] = _identityNonce
                    });
                    break;
                case "discord":
                    _browserUrl = QueryUrl("https://discord.com/oauth2/authorize", new Dictionary<string, string>
                    {
                        ["client_id"] = "1366854478250381462",
                        ["redirect_uri"] = _redirectUri,
                        ["response_type"] = "code",
                        ["scope"] = "openid sdk.social_layer_presence identify email",
                        ["state"] = _requestState
                    });
                    break;
                case "steam":
                    _browserUrl = QueryUrl("https://steamcommunity.com/openid/login", new Dictionary<string, string>
                    {
                        ["openid.ns"] = "http://specs.openid.net/auth/2.0",
                        ["openid.mode"] = "checkid_setup",
                        ["openid.return_to"] = _redirectUri,
                        ["openid.realm"] = $"http://127.0.0.1:{port}/",
                        ["openid.identity"] = "http://specs.openid.net/auth/2.0/identifier_select",
                        ["openid.claimed_id"] = "http://specs.openid.net/auth/2.0/identifier_select"
                    });
                    break;
                case "meta":
                case "apple":
                    // Official desktop pages return tokens for the web authentication exchange.
                    _browserUrl = $"https://vrchat.com/home/{Provider}/auth/desktop?returnUrl=" + Uri.EscapeDataString(_redirectUri);
                    break;
            }
            if (_stop.IsCancellationRequested) { _listener.Stop(); return; }
            SetStage("authorization");
            _ = ListenAsync();
        }
        catch (Exception ex) when (ex is HttpRequestException or OperationCanceledException or JsonException or ObjectDisposedException)
        { Fail("network_error"); _listener.Stop(); }
    }

    internal string BrowserUrl => _browserUrl;

    internal bool CanOpenBrowser
    {
        get { lock (_gate) return _browserUrl != null && _status == "waiting" && !_stop.IsCancellationRequested && DateTimeOffset.UtcNow < ExpiresAt; }
    }

    internal string Snapshot()
    {
        lock (_gate)
        {
            if (DateTimeOffset.UtcNow >= ExpiresAt && _status is "waiting" or "validating" or "ready")
            {
                _status = "expired";
                _stop.Cancel();
            }
            object summary = null;
            if (_user.HasValue)
            {
                var user = _user.Value;
                summary = new { id = Text(user, "id"), displayName = Text(user, "displayName") };
            }
            return JsonSerializer.Serialize(new
            {
                operationId = Id,
                provider = Provider,
                status = _status,
                error = _error,
                user = summary,
                verificationUrl = _status == "waiting" ? _verificationUrl : null,
                expiresAt = ExpiresAt.ToUnixTimeMilliseconds(),
                stage = _stage,
                httpStatus = _httpStatus,
                responseFields = _status == "failed" ? _responseFields : Array.Empty<string>()
            });
        }
    }

    private void Fail(string code)
    {
        lock (_gate)
        {
            if (_stop.IsCancellationRequested) return;
            _status = "failed";
            _error = code;
            _stop.Cancel();
        }
    }

    internal static string Text(JsonElement json, string key) =>
        json.ValueKind == JsonValueKind.Object && json.TryGetProperty(key, out var value) && value.ValueKind == JsonValueKind.String ? value.GetString() : null;

    private void SetStage(string stage)
    {
        lock (_gate) { _stage = stage; _httpStatus = null; _responseFields = Array.Empty<string>(); }
    }

    private async Task<(int Status, JsonElement Json)> SendAsync(string path, object body = null)
    {
        using var request = new HttpRequestMessage(body == null ? HttpMethod.Get : HttpMethod.Post, path);
        if (body != null)
            request.Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json");
        using var response = await _client.SendAsync(request, _stop.Token);
        lock (_gate) _httpStatus = (int)response.StatusCode;
        var bytes = await response.Content.ReadAsByteArrayAsync(_stop.Token);
        if (bytes.Length > 1024 * 1024) throw new InvalidDataException();
        using var document = JsonDocument.Parse(bytes);
        lock (_gate) _responseFields = document.RootElement.ValueKind == JsonValueKind.Object
            ? document.RootElement.EnumerateObject().Select(p => p.Name).Where(n => Regex.IsMatch(n, @"^[A-Za-z][A-Za-z0-9_]{0,39}$")).Take(16).ToArray()
            : Array.Empty<string>();
        return ((int)response.StatusCode, document.RootElement.Clone());
    }

    private async Task ValidateAsync(string expectedUserId = null)
    {
        SetStage("verify_account");
        var response = await SendAsync("auth/user");
        var id = Text(response.Json, "id");
        if (response.Status != 200 || id == null || !id.StartsWith("usr_", StringComparison.Ordinal))
        {
            Fail(response.Status == 429 ? "rate_limited" : "website_required");
            return;
        }
        if (expectedUserId != null && expectedUserId != id)
        {
            Fail("account_mismatch");
            return;
        }
        lock (_gate)
        {
            if (_stop.IsCancellationRequested) return;
            _user = response.Json;
            _status = "ready";
        }
    }

    internal (CookieContainer Cookies, JsonElement User) TakeSession()
    {
        lock (_gate)
        {
            if (_stop.IsCancellationRequested || DateTimeOffset.UtcNow >= ExpiresAt || _status != "ready" || !_user.HasValue)
                throw new InvalidOperationException("Login is not ready.");
            _status = "completed";
            _stop.Cancel();
            return (Cookies, _user.Value);
        }
    }

    internal static void ImportCookies(CookieContainer jar, JsonElement values)
    {
        if (values.ValueKind != JsonValueKind.Array || values.GetArrayLength() is < 1 or > 2)
            throw new InvalidDataException();
        var seen = new HashSet<string>();
        var imported = new List<Cookie>();
        foreach (var value in values.EnumerateArray())
        {
            var name = Text(value, "name");
            var token = Text(value, "value");
            if (!CookieNames.Contains(name) || !seen.Add(name) || string.IsNullOrEmpty(token) || token.Length > 4096 ||
                token.Any(c => c < 0x21 || c > 0x7e || c is ';' or ',' or '"' or '\\'))
                throw new InvalidDataException();
            var cookie = new Cookie(name, token, "/", Api.Host) { Secure = true, HttpOnly = true };
            if (value.TryGetProperty("expires", out var expires) && expires.TryGetInt64(out var seconds) && seconds > 0)
            {
                cookie.Expires = DateTimeOffset.FromUnixTimeSeconds(seconds).UtcDateTime;
                if (cookie.Expired) throw new InvalidDataException();
            }
            imported.Add(cookie);
        }
        if (!seen.Contains("auth")) throw new InvalidDataException();
        foreach (var cookie in imported) jar.Add(cookie);
    }

    internal async Task RestoreAsync(string json, string expectedUserId)
    {
        using var doc = JsonDocument.Parse(json);
        ImportCookies(Cookies, doc.RootElement);
        await ValidateAsync(expectedUserId);
    }

    private async Task ListenAsync()
    {
        try
        {
            while (!_stop.IsCancellationRequested)
            {
                using var connection = await _listener.AcceptTcpClientAsync(_stop.Token);
                using var timeout = CancellationTokenSource.CreateLinkedTokenSource(_stop.Token);
                timeout.CancelAfter(TimeSpan.FromSeconds(5));
                try { await HandleConnectionAsync(connection.GetStream(), timeout.Token); }
                catch (Exception ex) when (ex is IOException or OperationCanceledException or JsonException or
                    FormatException or ArgumentException or InvalidOperationException or KeyNotFoundException or CookieException)
                {
                    // Malformed/unrelated requests must not consume a pending login.
                }
            }
        }
        catch (Exception ex) when (ex is OperationCanceledException or SocketException or ObjectDisposedException) { }
        finally { _listener.Stop(); }
    }

    private async Task HandleConnectionAsync(NetworkStream stream, CancellationToken token)
    {
        var header = new List<byte>();
        var single = new byte[1];
        while (header.Count < 8192)
        {
            if (await stream.ReadAsync(single.AsMemory(), token) == 0) return;
            header.Add(single[0]);
            if (header.Count >= 4 && header[^4] == 13 && header[^3] == 10 && header[^2] == 13 && header[^1] == 10) break;
        }
        if (header.Count < 4 || header[^4] != 13 || header[^3] != 10 || header[^2] != 13 || header[^1] != 10) return;
        var lines = Encoding.ASCII.GetString(header.ToArray()).Split("\r\n");
        var request = lines[0].Split(' ');
        if (request.Length != 3 || request[0] != "GET" || !request[1].StartsWith('/') || request[1].StartsWith("//")) return;
        var uri = new Uri("http://127.0.0.1" + request[1]);
        if (uri.AbsolutePath != _callbackPath) return;
        var headers = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase);
        foreach (var line in lines.Skip(1).Where(l => l.Contains(':')))
        {
            var index = line.IndexOf(':');
            if (!headers.TryAdd(line[..index], line[(index + 1)..].Trim())) return;
        }
        var expectedHost = new Uri(_redirectUri).Authority;
        if (!headers.TryGetValue("Host", out var host) || !string.Equals(host, expectedHost, StringComparison.OrdinalIgnoreCase)) return;
        var query = ParseQuery(uri.Query);
        lock (_gate)
        {
            if (_status != "waiting") return;
        }
        if (Provider is "google" or "discord")
        {
            if (!query.TryGetValue("state", out var state) || state != _requestState) return;
            if (query.ContainsKey("error"))
            { Fail(TextError(query)); await ReplyAsync(stream, "<p>Authorization was not completed. Return to VRCX.</p>"); return; }
            if (!query.TryGetValue("code", out var code) || code.Length is < 1 or > 4096) return;
        }
        else if (Provider == "steam")
        {
            if (query.GetValueOrDefault("openid.mode") == "cancel")
            { Fail("provider_cancelled"); await ReplyAsync(stream, "<p>Authorization cancelled. Return to VRCX.</p>"); return; }
            if (!ValidSteamResponse(query)) return;
        }
        else
        {
            var key = Provider == "apple" ? "identityToken" : "oauthPayload";
            if (!query.TryGetValue(key, out var value) || value.Length is < 8 or > 12000) return;
        }
        lock (_gate)
        {
            if (_status != "waiting" || _stop.IsCancellationRequested || DateTimeOffset.UtcNow >= ExpiresAt) return;
            _status = "validating";
        }
        try
        {
            await ExchangeAsync(query);
            if (!_stop.IsCancellationRequested) await ValidateAsync();
            bool ready;
            lock (_gate) ready = _status == "ready";
            await ReplyAsync(stream, ready
                ? "<p>Authorization complete. Return to VRCX. You may close this tab.</p>"
                : "<p>Login could not be completed. Return to VRCX for details.</p>");
        }
        catch (JsonException) { Fail("unexpected_response"); }
        catch (InvalidDataException) { Fail("unexpected_response"); }
        catch (Exception ex) when (ex is HttpRequestException or OperationCanceledException or InvalidOperationException)
        {
            Fail("network_error");
        }
    }

    internal static Dictionary<string, string> ParseQuery(string query) => query.TrimStart('?').Split('&', StringSplitOptions.RemoveEmptyEntries)
        .Select(p => p.Split('=', 2)).Where(p => p.Length == 2)
        .ToDictionary(p => Uri.UnescapeDataString(p[0].Replace('+', ' ')), p => Uri.UnescapeDataString(p[1].Replace('+', ' ')));

    private static string TextError(Dictionary<string, string> query) =>
        query.GetValueOrDefault("error") == "access_denied" ? "provider_cancelled" : "authorization_failed";

    private bool ValidSteamResponse(Dictionary<string, string> query)
    {
        if (query.GetValueOrDefault("openid.mode") != "id_res" || query.GetValueOrDefault("openid.ns") != "http://specs.openid.net/auth/2.0" ||
            query.GetValueOrDefault("openid.return_to") != _redirectUri ||
            query.GetValueOrDefault("openid.op_endpoint") != "https://steamcommunity.com/openid/login" ||
            !query.TryGetValue("openid.claimed_id", out var id) || !Regex.IsMatch(id, @"^https?://steamcommunity\.com/openid/id/[0-9]{17}$") ||
            query.GetValueOrDefault("openid.identity") != id || string.IsNullOrEmpty(query.GetValueOrDefault("openid.sig"))) return false;
        var signed = (query.GetValueOrDefault("openid.signed") ?? "").Split(',');
        return new[] { "op_endpoint", "claimed_id", "identity", "return_to", "response_nonce", "assoc_handle" }
            .All(key => signed.Contains(key) && !string.IsNullOrEmpty(query.GetValueOrDefault("openid." + key)));
    }

    private bool Accept((int Status, JsonElement Json) result, string error)
    {
        if (result.Status == 429) { Fail("rate_limited"); return false; }
        if (result.Json.ValueKind != JsonValueKind.Object) { Fail("unexpected_response"); return false; }
        if (result.Json.TryGetProperty("continueToken", out _) || result.Json.TryGetProperty("requiresTwoFactorAuth", out _))
        { Fail("website_required"); return false; }
        if (result.Status is < 200 or >= 300) { Fail(error); return false; }
        return true;
    }

    private bool HasUser(JsonElement response) => Text(response, "id")?.StartsWith("usr_", StringComparison.Ordinal) == true ||
        response.TryGetProperty("user", out var user) && Text(user, "id")?.StartsWith("usr_", StringComparison.Ordinal) == true;

    private bool CheckGoogleToken(string token)
    {
        try
        {
            var parts = token.Split('.');
            if (parts.Length != 3) return false;
            var payload = parts[1].Replace('-', '+').Replace('_', '/');
            using var document = JsonDocument.Parse(Convert.FromBase64String(payload.PadRight((payload.Length + 3) / 4 * 4, '=')));
            // VRChat validates the signature during login. These additional checks
            // bind a returned identity token to this authorization and client.
            return Text(document.RootElement, "nonce") == _identityNonce && Text(document.RootElement, "aud") == _googleClientId;
        }
        catch (Exception ex) when (ex is FormatException or JsonException) { return false; }
    }

    private async Task ExchangeAsync(Dictionary<string, string> query)
    {
        SetStage("callback_exchange");
        (int Status, JsonElement Json) result;
        if (Provider is "google" or "discord")
        {
            var route = Provider == "google" ? "auth/google/v3/callback" : "auth/discord/v2/callback";
            result = await SendAsync(QueryUrl(route, new Dictionary<string, string> { ["code"] = query["code"], ["state"] = _exchangeState }));
            if (!Accept(result, "callback_failed")) return;
            if (Provider == "google")
            {
                var identity = Text(result.Json, "idToken") ?? Text(result.Json, "id_token") ?? Text(result.Json, "identityToken") ?? Text(result.Json, "token");
                if (string.IsNullOrEmpty(identity)) { if (!CallbackSession(result.Json)) Fail("unexpected_response"); return; }
                if (!CheckGoogleToken(identity)) { Fail("identity_mismatch"); return; }
                SetStage("session_exchange");
                result = await SendAsync("auth/google/v3", new { idToken = identity });
            }
            else
            {
                var provisional = Text(result.Json, "provisionalId");
                if (string.IsNullOrEmpty(provisional)) { if (!CallbackSession(result.Json)) Fail("unexpected_response"); return; }
                SetStage("session_exchange");
                result = await SendAsync("auth/discord/v2", new { provisionalId = provisional });
            }
        }
        else if (Provider == "steam")
        {
            result = await SendAsync("auth/steam/callback", query.Where(p => p.Key.StartsWith("openid.", StringComparison.Ordinal)).ToDictionary(p => p.Key, p => p.Value));
            if (!Accept(result, "callback_failed")) return;
            var provisional = Text(result.Json, "provisionalId");
            if (string.IsNullOrEmpty(provisional)) { Fail("unexpected_response"); return; }
            SetStage("session_exchange");
            result = await SendAsync("auth/steam/openid", new { provisionalId = provisional });
        }
        else
        {
            result = Provider == "apple"
                ? await SendAsync("auth/apple", new { identityToken = query["identityToken"], authType = "web" })
                : await SendAsync("auth/oculus/web", new { oauthPayload = query["oauthPayload"] });
        }
        Accept(result, "login_failed");
    }

    private bool CallbackSession(JsonElement response) => HasUser(response) || Cookies.GetCookies(Api)["auth"] is { Expired: false };

    private static async Task ReplyAsync(NetworkStream stream, string body)
    {
        const string cleanup = "history.replaceState(null,'',location.pathname);";
        var scriptHash = Convert.ToBase64String(SHA256.HashData(Encoding.UTF8.GetBytes(cleanup)));
        var bytes = Encoding.UTF8.GetBytes("<!doctype html><meta charset=utf-8><title>VRCX login</title><script>" + cleanup + "</script>" + body);
        var header = Encoding.ASCII.GetBytes($"HTTP/1.1 200 OK\r\nContent-Type: text/html; charset=utf-8\r\nContent-Length: {bytes.Length}\r\nCache-Control: no-store\r\nReferrer-Policy: no-referrer\r\nContent-Security-Policy: default-src 'none'; script-src 'sha256-{scriptHash}'; base-uri 'none'; frame-ancestors 'none'\r\nConnection: close\r\n\r\n");
        using var timeout = new CancellationTokenSource(TimeSpan.FromSeconds(3));
        await stream.WriteAsync(header, timeout.Token);
        await stream.WriteAsync(bytes, timeout.Token);
    }

    private async Task RunDeviceAsync()
    {
        try
        {
            var result = await SendAsync("auth/device/code", new { });
            if (result.Status != 200) { Fail(result.Status == 429 ? "rate_limited" : "unavailable"); return; }
            var code = Text(result.Json, "deviceCode");
            var url = Text(result.Json, "verificationUrlComplete");
            if (code == null || !Uri.TryCreate(url, UriKind.Absolute, out var uri) || uri.Scheme != "https" ||
                uri.Host != "vrchat.com" || uri.AbsolutePath != "/home/device") { Fail("unavailable"); return; }
            var interval = result.Json.TryGetProperty("interval", out var value) && value.TryGetInt32(out var seconds) ? Math.Clamp(seconds, 5, 60) : 5;
            var expires = result.Json.TryGetProperty("expiresIn", out value) && value.TryGetInt32(out seconds) ? Math.Clamp(seconds, 1, 300) : 300;
            lock (_gate) { _verificationUrl = url; ExpiresAt = DateTimeOffset.UtcNow.AddSeconds(expires); }
            while (!_stop.IsCancellationRequested && DateTimeOffset.UtcNow < ExpiresAt)
            {
                await _delay(TimeSpan.FromSeconds(interval), _stop.Token);
                result = await SendAsync("auth/device/status", new { deviceCode = code });
                if (result.Status == 429) { Fail("rate_limited"); return; }
                if (result.Status == 200 && result.Json.TryGetProperty("user", out _)) { await ValidateAsync(); return; }
                var error = result.Json.TryGetProperty("error", out value) ? Text(value, "message") : null;
                if (error == "slow_down") { interval = Math.Min(interval + 5, 60); continue; }
                if (result.Status == 200 || error == "authorization_pending") continue;
                Fail(error == "expired_token" ? "expired" : "website_required");
                return;
            }
        }
        catch (Exception ex) when (ex is HttpRequestException or OperationCanceledException or JsonException or InvalidOperationException)
        { Fail("network_error"); }
    }

    public void Dispose()
    {
        lock (_gate)
        {
            if (_disposed) return;
            _disposed = true;
            if (_status is "waiting" or "validating" or "ready") _status = "cancelled";
            _stop.Cancel();
            _listener?.Stop();
            _client.Dispose();
        }
    }
}
