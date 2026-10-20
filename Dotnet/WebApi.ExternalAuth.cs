using System;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace VRCX;

public partial class WebApi
{
    private ExternalLoginOperation _externalLogin;
    private bool _externalSession;
    private string _externalUserId;

    public async Task<string> BeginExternalLogin(string provider)
    {
        CancelExternalLogin();
        var operation = new ExternalLoginOperation(provider, ProxySet ? Proxy : null, Program.Version);
        _externalLogin = operation;
        await operation.StartAsync();
        return operation.Snapshot();
    }

    public string GetExternalLoginState(string operationId) =>
        _externalLogin?.Id == operationId ? _externalLogin.Snapshot() : "{\"status\":\"cancelled\"}";

    public bool OpenExternalLogin(string operationId)
    {
        var operation = _externalLogin;
        if (operation?.Id != operationId || !operation.CanOpenBrowser) return false;
        try
        {
            Process.Start(new ProcessStartInfo { FileName = operation.BrowserUrl, UseShellExecute = true });
            return true;
        }
        catch { return false; } // The URL contains a pairing capability; never log it.
    }

    public void CancelExternalLogin()
    {
        _externalLogin?.Dispose();
        _externalLogin = null;
    }

    public string CommitExternalLogin(string operationId)
    {
        if (_externalLogin?.Id != operationId) throw new InvalidOperationException("Login was cancelled.");
        var session = _externalLogin.TakeSession();
        CommitExternalCookieJar(session.Cookies, ExternalLoginOperation.Text(session.User, "id"));
        var user = session.User.GetRawText();
        CancelExternalLogin();
        return user;
    }

    private void CommitExternalCookieJar(CookieContainer cookies, string userId)
    {
        lock (_cookiePersistenceGate)
        {
            // Remove the previous global cookie snapshot before disabling its persistence.
            // The new session must never pass through GetAllCookies(), which rewrites expiry.
            SQLite.Instance.ExecuteNonQuery("DELETE FROM `cookies` WHERE `key` = 'default'");
            _externalSession = true;
            _externalUserId = userId;
            CookieContainer = cookies;
            _cookieDirty = false;
            InitializeHttpClient();
        }
    }

    // Electron calls these methods from its main process, encrypting with safeStorage.
    // The local renderer receives only user metadata from RestoreExternalSession.
#if !LINUX
    [CefSharp.JavascriptIgnore]
#endif
    public string ExportExternalSession(string userId)
    {
        lock (_cookiePersistenceGate)
        {
            if (!_externalSession || userId != _externalUserId) throw new InvalidOperationException("No matching external session.");
            var cookies = CookieContainer.GetCookies(ExternalLoginOperation.Api).Cast<Cookie>()
                .Where(c => ExternalLoginOperation.CookieNames.Contains(c.Name) && !c.Expired)
                .Select(c => new
                {
                    name = c.Name,
                    value = c.Value,
                    expires = c.Expires == DateTime.MinValue ? 0 : new DateTimeOffset(c.Expires.ToUniversalTime()).ToUnixTimeSeconds()
                }).ToArray();
            if (!cookies.Any(c => c.name == "auth")) throw new InvalidOperationException("Session expired.");
            return JsonSerializer.Serialize(cookies);
        }
    }

#if !LINUX
    [CefSharp.JavascriptIgnore]
#endif
    public async Task<string> RestoreExternalSession(string json, string userId)
    {
        if (!IsSessionUserId(userId)) return "{\"status\":\"reauthorize\"}";
        using var candidate = new ExternalLoginOperation("device", ProxySet ? Proxy : null, Program.Version);
        try
        {
            await candidate.RestoreAsync(json, userId);
            var state = JsonDocument.Parse(candidate.Snapshot());
            using (state)
            {
                if (ExternalLoginOperation.Text(state.RootElement, "status") != "ready")
                {
                    var error = ExternalLoginOperation.Text(state.RootElement, "error");
                    return error is "network_error" or "rate_limited"
                        ? "{\"status\":\"retry\",\"error\":\"network_error\"}"
                        : "{\"status\":\"reauthorize\"}";
                }
            }
            var session = candidate.TakeSession();
            CommitExternalCookieJar(session.Cookies, userId);
            return "{\"status\":\"ready\",\"user\":" + session.User.GetRawText() + "}";
        }
        catch (Exception ex) when (ex is HttpRequestException or OperationCanceledException)
        { return "{\"status\":\"retry\",\"error\":\"network_error\"}"; }
        catch { return "{\"status\":\"reauthorize\"}"; }
    }

    internal static bool IsSessionUserId(string userId) =>
        userId != null && Regex.IsMatch(userId, @"^usr_[A-Za-z0-9_-]{1,80}$");

#if !LINUX
    private static string SessionPath(string userId)
    {
        if (!IsSessionUserId(userId)) throw new ArgumentException("Invalid user ID.");
        return Path.Combine(Program.AppDataDirectory, "auth-sessions", userId + ".bin");
    }

    public bool SaveExternalSession(string userId)
    {
        var file = SessionPath(userId);
        var bytes = ProtectedData.Protect(Encoding.UTF8.GetBytes(ExportExternalSession(userId)), null, DataProtectionScope.CurrentUser);
        Directory.CreateDirectory(Path.GetDirectoryName(file));
        var temp = file + "." + Guid.NewGuid().ToString("N");
        try { File.WriteAllBytes(temp, bytes); File.Move(temp, file, true); }
        finally { if (File.Exists(temp)) File.Delete(temp); }
        return true;
    }

    public async Task<string> LoadExternalSession(string userId)
    {
        try
        {
            var bytes = ProtectedData.Unprotect(File.ReadAllBytes(SessionPath(userId)), null, DataProtectionScope.CurrentUser);
            return await RestoreExternalSession(Encoding.UTF8.GetString(bytes), userId);
        }
        catch (CryptographicException) { return "{\"status\":\"unavailable\",\"error\":\"storage_unavailable\"}"; }
        catch { return "{\"status\":\"reauthorize\"}"; }
    }

    public void DeleteExternalSession(string userId) => File.Delete(SessionPath(userId));
#endif
}
