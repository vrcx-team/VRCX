import Vue from 'vue';

const AppGlobal = Vue.observable({
    debug: false,
    debugWebSocket: false,
    debugUserDiff: false,
    debugPhotonLogging: false,
    debugGameLog: false,
    debugWebRequests: false,
    debugFriendState: false,
    errorNoty: null,
    dontLogMeOut: false,
    endpointDomain: 'https://api.vrchat.cloud/api/1',
    endpointDomainVrchat: 'https://api.vrchat.cloud/api/1',
    websocketDomain: 'wss://pipeline.vrchat.cloud',
    websocketDomainVrchat: 'wss://pipeline.vrchat.cloud'
});

window.__APP_GLOBALS__ = AppGlobal;

export { AppGlobal };
