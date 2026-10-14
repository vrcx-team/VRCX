using System.Net;
using System.Net.Sockets;
using System.Text;
using System.Text.Json;
using VRCX;

var tests = new (string Name, Func<Task> Run)[]
{
    ("Google desktop code and identity exchange", BrowserFlows.Google),
    ("Google rejects identity nonce and audience mismatch", BrowserFlows.GoogleMismatch),
    ("Configuration failure does not open a browser", BrowserFlows.ConfigFailure),
    ("OAuth state, duplicate fields and Host validation", BrowserFlows.RejectOAuth),
    ("Discord local code and provisional session exchange", BrowserFlows.Discord),
    ("Provider cancellation must match state", BrowserFlows.Denied),
    ("Safe callback error diagnostics and no rate-limit retry", BrowserFlows.Failure),
    ("Unknown response fails without revealing credentials", BrowserFlows.UnknownResponse),
    ("Callback session still requires auth/user verification", BrowserFlows.DirectSession),
    ("Steam local signed response and session exchange", BrowserFlows.Steam),
    ("Steam rejects unsigned or tampered return addresses", BrowserFlows.RejectSteam),
    ("Additional verification cannot activate an account", BrowserFlows.StepUp),
    ("Cancellation during exchange cannot resurrect login", BrowserFlows.CancelInFlight),
    ("A ready session can expire before commit", BrowserFlows.ReadyExpiry),
    ("Apple callback validates before session activation", NativeCallback),
    ("Meta callback uses the web exchange", MetaCallback),
    ("Restored session rejects a mismatched account", Mismatch),
    ("Unrelated and malformed callbacks do not consume login", RejectCallbacks),
    ("Cookie imports are allowlisted, atomic and preserve expiry", CookieValidation),
    ("Cancelled login cannot be committed", Cancel),
    ("Expired login cannot be committed", Expire),
    ("Device polling respects interval and hides device secret", Device),
    ("Device rate limit terminates without repeated requests", DeviceRateLimit)
};
foreach (var test in tests)
{
    await test.Run();
    Console.WriteLine("PASS " + test.Name);
}

static HttpResponseMessage Json(int status, string text) => new((HttpStatusCode)status)
{ Content = new StringContent(text, Encoding.UTF8, "application/json") };
static string State(ExternalLoginOperation operation) => JsonDocument.Parse(operation.Snapshot()).RootElement.GetProperty("status").GetString();
static void Check(bool condition, string message) { if (!condition) throw new Exception(message); }
static async Task Until(Func<bool> condition)
{
    for (var i = 0; i < 200; i++) { if (condition()) return; await Task.Delay(10); }
    throw new Exception("Timed out waiting for test state.");
}
static string Callback(ExternalLoginOperation operation)
{
    var url = new Uri(operation.BrowserUrl);
    return Uri.UnescapeDataString(url.Query.Split("returnUrl=")[1]);
}
static HttpClient LocalClient() => new(new HttpClientHandler { UseProxy = false }) { Timeout = TimeSpan.FromSeconds(3) };
static async Task NativeCallback()
{
    var requests = new List<string>();
    using var operation = new ExternalLoginOperation("apple", null, "VRCX-Test", new Transport(async request =>
    {
        Check(!request.Headers.Contains("Authorization"), "External login must not send Basic credentials.");
        requests.Add(request.RequestUri.AbsolutePath);
        if (request.Method == HttpMethod.Post)
        {
            var body = JsonDocument.Parse(await request.Content.ReadAsStringAsync());
            Check(body.RootElement.GetProperty("authType").GetString() == "web", "Apple auth type missing.");
        }
        return Json(200, "{\"id\":\"usr_test\",\"displayName\":\"Tester\"}");
    }));
    await operation.StartAsync();
    using var client = LocalClient();
    using var response = await client.GetAsync(Callback(operation) + "?identityToken=apple-test-token");
    Check(response.StatusCode == HttpStatusCode.OK, "Callback failed.");
    var page = await response.Content.ReadAsStringAsync();
    Check(page.Contains("history.replaceState") && !page.Contains("apple-test-token") && response.Headers.GetValues("Content-Security-Policy").Single().Contains("script-src 'sha256-"), "Callback page did not remove private URL parameters safely.");
    Check(State(operation) == "ready", "Account must be verified before activation.");
    Check(page.Contains("Authorization complete") && !page.Contains("confirm the account"), "Callback must not request account confirmation.");
    Check(!operation.Snapshot().Contains("apple-test-token"), "Snapshot leaked token.");
    Check(requests.SequenceEqual(new[] { "/api/1/auth/apple", "/api/1/auth/user" }), "Wrong exchange sequence.");
    Check(operation.TakeSession().User.GetProperty("id").GetString() == "usr_test", "Wrong account committed.");
    Check(State(operation) == "completed", "Commit is not terminal.");
}
static async Task MetaCallback()
{
    var exchanged = false;
    using var operation = new ExternalLoginOperation("meta", null, "VRCX-Test", new Transport(request =>
    {
        if (request.Method == HttpMethod.Post) exchanged = request.RequestUri.AbsolutePath == "/api/1/auth/oculus/web";
        return Task.FromResult(Json(200, "{\"id\":\"usr_test\"}"));
    }));
    await operation.StartAsync();
    using var client = LocalClient();
    await client.GetAsync(Callback(operation) + "?oauthPayload=meta-test-payload");
    Check(exchanged && State(operation) == "ready", "Meta web exchange was not used.");
}
static async Task Mismatch()
{
    using var operation = new ExternalLoginOperation("device", null, "VRCX-Test", new Transport(_ => Task.FromResult(Json(200, "{\"id\":\"usr_other\"}"))));
    await operation.RestoreAsync("[{\"name\":\"auth\",\"value\":\"test-session\"}]", "usr_expected");
    Check(State(operation) == "failed" && operation.Snapshot().Contains("account_mismatch"), "Mismatched account accepted.");
}
static async Task RejectCallbacks()
{
    var requests = 0;
    using var operation = new ExternalLoginOperation("apple", null, "VRCX-Test", new Transport(_ => { requests++; return Task.FromResult(Json(200, "{}")); }));
    await operation.StartAsync();
    var uri = new Uri(Callback(operation));
    foreach (var target in new[] { "/wrong?identityToken=wrong-test-token", uri.AbsolutePath + "?identityToken=first&identityToken=duplicate" })
    {
        using var connection = new TcpClient();
        await connection.ConnectAsync(IPAddress.Loopback, uri.Port);
        await connection.GetStream().WriteAsync(Encoding.ASCII.GetBytes($"GET {target} HTTP/1.1\r\nHost: 127.0.0.1:{uri.Port}\r\n\r\n"));
        await Task.Delay(30);
    }
    Check(requests == 0 && State(operation) == "waiting", "Invalid request consumed pending login.");
}
static Task CookieValidation()
{
    var jar = new CookieContainer();
    var expires = DateTimeOffset.UtcNow.AddMinutes(10).ToUnixTimeSeconds();
    using var good = JsonDocument.Parse($"[{{\"name\":\"auth\",\"value\":\"test-token\",\"expires\":{expires}}}]");
    ExternalLoginOperation.ImportCookies(jar, good.RootElement);
    Check(new DateTimeOffset(jar.GetCookies(ExternalLoginOperation.Api)["auth"].Expires).ToUnixTimeSeconds() == expires, "Expiry changed.");
    foreach (var json in new[] {
        "[{\"name\":\"auth\",\"value\":\"replacement\"},{\"name\":\"unrelated\",\"value\":\"bad\"}]",
        "[{\"name\":\"auth\",\"value\":\"bad;inject\"}]",
        "[{\"name\":\"auth\",\"value\":\"expired\",\"expires\":1}]"
    })
    {
        using var document = JsonDocument.Parse(json);
        var rejected = false;
        try { ExternalLoginOperation.ImportCookies(jar, document.RootElement); } catch { rejected = true; }
        Check(rejected, "Invalid cookie accepted.");
        Check(jar.GetCookies(ExternalLoginOperation.Api)["auth"].Value == "test-token", "Partial cookie import changed the jar.");
    }
    return Task.CompletedTask;
}
static async Task Cancel()
{
    using var operation = new ExternalLoginOperation("apple", null, "VRCX-Test");
    await operation.StartAsync(); operation.Dispose();
    var rejected = false;
    try { operation.TakeSession(); } catch (InvalidOperationException) { rejected = true; }
    Check(rejected && State(operation) == "cancelled", "Cancelled operation committed.");
}
static async Task Expire()
{
    using var operation = new ExternalLoginOperation("apple", null, "VRCX-Test");
    await operation.StartAsync(); operation.ExpiresAt = DateTimeOffset.UtcNow.AddSeconds(-1);
    Check(State(operation) == "expired", "Expiration not enforced.");
    var rejected = false;
    try { operation.TakeSession(); } catch (InvalidOperationException) { rejected = true; }
    Check(rejected, "Expired operation committed.");
}
static async Task Device()
{
    var polls = 0;
    var delays = new List<TimeSpan>();
    using var operation = new ExternalLoginOperation("device", null, "VRCX-Test", new Transport(request =>
    {
        var route = request.RequestUri.AbsolutePath;
        if (route.EndsWith("/code")) return Task.FromResult(Json(200, "{\"deviceCode\":\"private-device-code\",\"verificationUrlComplete\":\"https://vrchat.com/home/device?code=TEST\",\"interval\":1,\"expiresIn\":300}"));
        if (route.EndsWith("/status")) { polls++; return Task.FromResult(polls == 1 ? Json(400, "{\"error\":{\"message\":\"authorization_pending\"}}") : Json(200, "{\"user\":{\"id\":\"usr_test\"}}")); }
        return Task.FromResult(Json(200, "{\"id\":\"usr_test\"}"));
    }), (delay, _) => { delays.Add(delay); return Task.CompletedTask; });
    await operation.StartAsync(); await Until(() => State(operation) == "ready");
    Check(polls == 2 && delays.All(d => d.TotalSeconds >= 5), "Device polling ignored minimum interval.");
    Check(!operation.Snapshot().Contains("private-device-code"), "Device secret escaped backend.");
}
static async Task DeviceRateLimit()
{
    var requests = 0;
    using var operation = new ExternalLoginOperation("device", null, "VRCX-Test", new Transport(_ => { requests++; return Task.FromResult(Json(429, "{}")); }));
    await operation.StartAsync(); await Until(() => State(operation) == "failed");
    Check(requests == 1 && operation.Snapshot().Contains("rate_limited"), "Rate-limited code was repeatedly generated.");
}

sealed class Transport(Func<HttpRequestMessage, Task<HttpResponseMessage>> send) : HttpMessageHandler
{
    protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken token) => send(request);
}
