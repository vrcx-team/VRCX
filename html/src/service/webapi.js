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

    execute(options) {
        return new Promise((resolve, reject) => {
            WebApi.Execute(options, (err, response) => {
                if (err !== null) {
                    reject(err);
                    return;
                }
                resolve(response);
            });
        });
    }
}

var self = new WebApiService();
window.webApiService = self;

export { self as default, WebApiService };
