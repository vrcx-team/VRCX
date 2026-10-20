using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using VRCX;

internal static class BrowserFlows
{
    private const string ClientId = "123-desktop.apps.googleusercontent.com";
    private static HttpResponseMessage Json(int status, object body) => new((HttpStatusCode)status)
    { Content = new StringContent(JsonSerializer.Serialize(body), Encoding.UTF8, "application/json") };
    private static HttpResponseMessage User() => Json(200, new { id = "usr_test", displayName = "Tester" });
    private static Dictionary<string, string> Query(string url) => ExternalLoginOperation.ParseQuery(new Uri(url).Query);
    private static string Encode(object value) => Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonSerializer.Serialize(value)));
    private static string Jwt(string nonce, string audience = ClientId) => "e30." + Encode(new { nonce, aud = audience }).TrimEnd('=').Replace('+', '-').Replace('/', '_') + ".test-signature";
    private static void Check(bool value, string message) { if (!value) throw new Exception(message); }
    private static string State(ExternalLoginOperation operation) => JsonDocument.Parse(operation.Snapshot()).RootElement.GetProperty("status").GetString();
    private static HttpClient Local() => new(new HttpClientHandler { UseProxy = false }) { Timeout = TimeSpan.FromSeconds(5) };
    private static ExternalLoginOperation Operation(string provider, Func<HttpRequestMessage, Task<HttpResponseMessage>> send) =>
        new(provider, null, "VRCX-Test", new Transport(r => r.RequestUri.AbsolutePath.EndsWith("/config")
            ? Task.FromResult(Json(200, new { googleApiUnityClientId = ClientId })) : send(r)));
    private static string Callback(ExternalLoginOperation op)
    {
        var q = Query(op.BrowserUrl);
        return q.GetValueOrDefault("redirect_uri") ?? q.GetValueOrDefault("returnUrl") ?? q["openid.return_to"];
    }
    private static string Response(ExternalLoginOperation op, string code = "test-code") => Callback(op) + "?code=" + Uri.EscapeDataString(code) + "&state=" + Uri.EscapeDataString(Query(op.BrowserUrl)["state"]);
    private static async Task Raw(ExternalLoginOperation op, string target, string host = null)
    {
        var uri = new Uri(Callback(op)); using var connection = new TcpClient();
        await connection.ConnectAsync(IPAddress.Loopback, uri.Port);
        await connection.GetStream().WriteAsync(Encoding.ASCII.GetBytes($"GET {target} HTTP/1.1\r\nHost: {host ?? uri.Authority}\r\n\r\n"));
        await Task.Delay(35);
    }
    public static async Task Google()
    {
        var paths = new List<string>(); string nonce = null, redirect = null;
        using var op = Operation("google", async request =>
        {
            var path = request.RequestUri.AbsolutePath; paths.Add(path);
            Check(!request.Headers.Contains("Authorization"), "Unexpected Basic credentials.");
            if (path.EndsWith("/callback"))
            {
                var q = Query(request.RequestUri.ToString());
                using var state = JsonDocument.Parse(Convert.FromBase64String(q["state"]));
                Check(request.Method == HttpMethod.Get && q["code"] == "opaque code+suffix" && state.RootElement.GetProperty("redirectUri").GetString() == redirect, "Callback code or redirect state corrupted.");
                return Json(200, new { idToken = Jwt(nonce) });
            }
            if (path.EndsWith("/google/v3"))
            {
                using var body = JsonDocument.Parse(await request.Content.ReadAsStringAsync());
                Check(body.RootElement.GetProperty("idToken").GetString() == Jwt(nonce), "Identity exchange lost token.");
            }
            return User();
        });
        await op.StartAsync(); var auth = Query(op.BrowserUrl); nonce = auth["nonce"]; redirect = auth["redirect_uri"];
        Check(new Uri(op.BrowserUrl).Host == "accounts.google.com" && auth["client_id"] == ClientId && auth["response_type"] == "code" && new Uri(redirect).AbsolutePath == "/", "Wrong Google native request.");
        using var client = Local(); await client.GetAsync(Response(op, "opaque code+suffix"));
        Check(State(op) == "ready" && paths.SequenceEqual(new[] { "/api/1/auth/google/v3/callback", "/api/1/auth/google/v3", "/api/1/auth/user" }), "Wrong Google exchange sequence.");
        Check(!op.Snapshot().Contains(nonce) && !op.Snapshot().Contains(Jwt(nonce)), "Private OAuth data escaped backend.");
    }
    public static async Task GoogleMismatch()
    {
        foreach (var wrongAudience in new[] { false, true })
        {
            var posts = 0; string nonce = null;
            using var op = Operation("google", r => { if (r.Method == HttpMethod.Post) posts++; return Task.FromResult(Json(200, new { idToken = Jwt(wrongAudience ? nonce : "wrong", wrongAudience ? "other-client" : ClientId) })); });
            await op.StartAsync(); nonce = Query(op.BrowserUrl)["nonce"];
            using var client = Local(); await client.GetAsync(Response(op));
            Check(State(op) == "failed" && op.Snapshot().Contains("identity_mismatch") && posts == 0, "Unbound Google identity accepted.");
        }
    }
    public static async Task ConfigFailure()
    {
        using var op = new ExternalLoginOperation("google", null, "VRCX-Test", new Transport(_ => Task.FromResult(Json(503, new { }))));
        await op.StartAsync(); Check(State(op) == "failed" && op.BrowserUrl == null && op.Snapshot().Contains("configuration_failed"), "Invalid config opened browser.");
    }
    public static async Task RejectOAuth()
    {
        foreach (var provider in new[] { "google", "discord" })
        {
            var calls = 0;
            using var op = Operation(provider, _ => { calls++; return Task.FromResult(User()); }); await op.StartAsync();
            var uri = new Uri(Response(op));
            await Raw(op, uri.AbsolutePath + "?code=unrelated&state=wrong");
            await Raw(op, uri.PathAndQuery + "&state=duplicate"); await Raw(op, uri.PathAndQuery + "&code=duplicate");
            await Raw(op, uri.PathAndQuery, "attacker.example");
            Check(calls == 0 && State(op) == "waiting", "Invalid OAuth callback consumed operation.");
            using var client = Local(); await client.GetAsync(Response(op)); Check(State(op) == "ready", "Valid callback blocked after unrelated traffic.");
        }
    }
    public static async Task Discord()
    {
        var paths = new List<string>(); string redirect = null;
        using var op = Operation("discord", async request =>
        {
            var path = request.RequestUri.AbsolutePath; paths.Add(path);
            if (path.EndsWith("/callback"))
            {
                var q = Query(request.RequestUri.ToString()); using var state = JsonDocument.Parse(Convert.FromBase64String(q["state"]));
                Check(q["code"] == "discord-code" && state.RootElement.GetProperty("redirectUri").GetString() == redirect, "Incorrect Discord backend state.");
                return Json(200, new { provisionalId = "private-provisional", user = new { id = "usr_preview" } });
            }
            if (path.EndsWith("/discord/v2"))
            { using var body = JsonDocument.Parse(await request.Content.ReadAsStringAsync()); Check(body.RootElement.GetProperty("provisionalId").GetString() == "private-provisional", "Provisional ID lost."); }
            return User();
        });
        await op.StartAsync(); redirect = Callback(op);
        Check(new Uri(redirect).AbsolutePath == "/callback" && Query(op.BrowserUrl)["client_id"] == "1366854478250381462", "Wrong Discord native request.");
        using var client = Local(); await client.GetAsync(Response(op, "discord-code"));
        Check(State(op) == "ready" && paths.SequenceEqual(new[] { "/api/1/auth/discord/v2/callback", "/api/1/auth/discord/v2", "/api/1/auth/user" }) && !op.Snapshot().Contains("private-provisional"), "Discord exchange failed or leaked token.");
    }
    public static async Task Denied()
    {
        using var op = Operation("discord", _ => throw new Exception("Cancelled flow contacted API.")); await op.StartAsync();
        await Raw(op, "/callback?error=access_denied&state=wrong"); Check(State(op) == "waiting", "Unrelated refusal cancelled operation.");
        using var client = Local(); await client.GetAsync(Callback(op) + "?error=access_denied&state=" + Query(op.BrowserUrl)["state"]);
        Check(State(op) == "failed" && op.Snapshot().Contains("provider_cancelled"), "Refusal not terminal.");
    }
    public static async Task Failure()
    {
        foreach (var status in new[] { 403, 429 })
        {
            var calls = 0; using var op = Operation("discord", _ => { calls++; return Task.FromResult(Json(status, new { error = new { message = "sensitive-backend-detail" } })); });
            await op.StartAsync(); using var client = Local(); await client.GetAsync(Response(op));
            using var snapshot = JsonDocument.Parse(op.Snapshot()); var state = snapshot.RootElement;
            Check(State(op) == "failed" && state.GetProperty("httpStatus").GetInt32() == status && state.GetProperty("stage").GetString() == "callback_exchange" && calls == 1, "Lost diagnostics or retried failure.");
            Check(state.GetProperty("error").GetString() == (status == 429 ? "rate_limited" : "callback_failed") && !op.Snapshot().Contains("sensitive-backend-detail"), "Error misreported or leaked details.");
        }
    }
    public static async Task UnknownResponse()
    {
        using var op = Operation("discord", _ => Task.FromResult(Json(200, new { unknownCredential = "secret-value" })));
        await op.StartAsync(); using var client = Local(); await client.GetAsync(Response(op));
        Check(State(op) == "failed" && op.Snapshot().Contains("unexpected_response") && op.Snapshot().Contains("unknownCredential") && !op.Snapshot().Contains("secret-value"), "Unsupported response guessed or exposed secrets.");
    }
    public static async Task DirectSession()
    {
        var verified = false;
        using var op = Operation("discord", request => { if (request.RequestUri.AbsolutePath.EndsWith("/callback")) return Task.FromResult(Json(200, new { user = new { id = "usr_claimed" } })); verified = true; return Task.FromResult(User()); });
        await op.StartAsync(); using var client = Local(); await client.GetAsync(Response(op));
        Check(verified && State(op) == "ready" && op.TakeSession().User.GetProperty("id").GetString() == "usr_test", "Callback bypassed account verification.");
    }
    private static Dictionary<string, string> Assertion(ExternalLoginOperation op) => new()
    {
        ["openid.ns"] = "http://specs.openid.net/auth/2.0",
        ["openid.mode"] = "id_res",
        ["openid.return_to"] = Callback(op),
        ["openid.op_endpoint"] = "https://steamcommunity.com/openid/login",
        ["openid.claimed_id"] = "https://steamcommunity.com/openid/id/76561198000000000",
        ["openid.identity"] = "https://steamcommunity.com/openid/id/76561198000000000",
        ["openid.response_nonce"] = "test-nonce",
        ["openid.assoc_handle"] = "test-association",
        ["openid.sig"] = "test-signature",
        ["openid.signed"] = "op_endpoint,claimed_id,identity,return_to,response_nonce,assoc_handle"
    };
    private static string SteamResponse(ExternalLoginOperation op, Dictionary<string, string> values) => Callback(op) + "?" + string.Join("&", values.Select(p => Uri.EscapeDataString(p.Key) + "=" + Uri.EscapeDataString(p.Value)));
    public static async Task Steam()
    {
        var paths = new List<string>(); using var op = Operation("steam", async request =>
        {
            var path = request.RequestUri.AbsolutePath; paths.Add(path);
            if (path.EndsWith("/callback"))
            { using var body = JsonDocument.Parse(await request.Content.ReadAsStringAsync()); Check(body.RootElement.GetProperty("openid.sig").GetString() == "test-signature", "Signed response altered."); return Json(200, new { provisionalId = "steam-provisional" }); }
            return User();
        });
        await op.StartAsync(); Check(new Uri(Query(op.BrowserUrl)["openid.realm"]).Host == "127.0.0.1", "Wrong local realm.");
        using var client = Local(); await client.GetAsync(SteamResponse(op, Assertion(op)));
        Check(State(op) == "ready" && paths.SequenceEqual(new[] { "/api/1/auth/steam/callback", "/api/1/auth/steam/openid", "/api/1/auth/user" }), "Wrong Steam exchange sequence.");
    }
    public static async Task RejectSteam()
    {
        var calls = 0; using var op = Operation("steam", _ => { calls++; return Task.FromResult(User()); }); await op.StartAsync();
        foreach (var change in new Action<Dictionary<string, string>>[] { q => q["openid.return_to"] = "http://127.0.0.1:1/other", q => q["openid.signed"] = "claimed_id,identity", q => q["openid.op_endpoint"] = "https://attacker.example/", q => q["openid.identity"] = "https://steamcommunity.com/openid/id/76561198000000001" })
        { var q = Assertion(op); change(q); await Raw(op, new Uri(SteamResponse(op, q)).PathAndQuery); }
        Check(State(op) == "waiting" && calls == 0, "Tampered assertion accepted.");
    }
    public static async Task StepUp()
    {
        var calls = 0; using var op = Operation("discord", r => { calls++; return Task.FromResult(r.Method == HttpMethod.Get ? Json(200, new { provisionalId = "test-provisional" }) : Json(200, new { continueToken = "setup-required" })); });
        await op.StartAsync(); using var client = Local(); await client.GetAsync(Response(op)); Check(State(op) == "failed" && op.Snapshot().Contains("website_required") && calls == 2, "Additional verification treated as login.");
    }
    public static async Task CancelInFlight()
    {
        var pending = new TaskCompletionSource<HttpResponseMessage>(); var entered = false;
        using var op = Operation("discord", _ => { entered = true; return pending.Task; }); await op.StartAsync(); using var client = Local(); var callback = client.GetAsync(Response(op));
        for (var i = 0; i < 200 && !entered; i++) await Task.Delay(10); Check(entered, "Exchange did not start.");
        op.Dispose(); pending.SetResult(Json(200, new { provisionalId = "test-provisional" }));
        try { await callback; } catch (HttpRequestException) { }
        Check(State(op) == "cancelled", "Delayed exchange resurrected operation.");
    }
    public static async Task ReadyExpiry()
    {
        using var op = Operation("apple", _ => Task.FromResult(User())); await op.StartAsync(); using var client = Local(); await client.GetAsync(Callback(op) + "?identityToken=test-identity");
        Check(State(op) == "ready", "Account not ready."); op.ExpiresAt = DateTimeOffset.UtcNow.AddSeconds(-1); var rejected = false;
        try { op.TakeSession(); } catch (InvalidOperationException) { rejected = true; }
        Check(rejected && State(op) == "expired", "Ready session committed after expiry.");
    }
}
