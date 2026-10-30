// requires binding of WebApi

// NexVR authenticates with bearer tokens, not cookies. The cookie methods keep
// their names because the auth store saves and restores "cookies" per account;
// what moves through them now is the NexVR token pair.
//
// The NexVR modules are imported lazily: they depend on appConfig, which pulls
// in shared/utils, which reaches back here.
const nexvrShim = () => import('./nexvr/shim');
const nexvrSession = () => import('./nexvr/session');

class WebApiService {
    async clearCookies() {
        await (await nexvrShim()).endSession();
        return WebApi.ClearCookies();
    }

    async getCookies() {
        return (await nexvrSession()).exportTokens();
    }

    async setCookies(cookie) {
        return (await nexvrSession()).restoreTokens(cookie);
    }

    /**
     * @param {import('@/types/vrcx').WebApiOptions} options
     * @returns {Promise<{ status: number; data?: string }>}
     */
    async execute(options) {
        const { handleShimRequest, isNexvrApiUrl } = await nexvrShim();
        if (isNexvrApiUrl(options?.url)) {
            return handleShimRequest(options, (init) => this.executeNative(init));
        }
        return this.executeNative(options);
    }

    /**
     * @param {import('@/types/vrcx').WebApiOptions} options
     * @returns {Promise<{ status: number; data?: string }>}
     */
    async executeNative(options) {
        if (!options) {
            throw new Error('options is required');
        }
        if (LINUX) {
            const requestJson = JSON.stringify(options);
            var json = await WebApi.ExecuteJson(requestJson);
            var data = JSON.parse(json);
            if (data.status === -1) {
                throw new Error(data.message);
            }
            return {
                status: data.status,
                data: data.message
            };
        }

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
