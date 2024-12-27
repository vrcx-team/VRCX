// requires binding of WebApi

class WebApiService {
    clearCookies() {
        return WebApi.ClearCookies();
    }

    getCookies() {
        return WebApi.GetCookies();
    }

    setCookies(cookie) {
        return WebApi.SetCookies(cookie);
    }

    async execute(options) {
        var item = await WebApi.Execute(options);
        if (item.Item1 === -1) {
            throw item.Item2;
        }
        return {
            status: item.Item1,
            data: item.Item2
        };
    }
}

var self = new WebApiService();
window.webApiService = self;

export { self as default, WebApiService };
