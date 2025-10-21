import { reactive } from 'vue';

import dayjs from 'dayjs';

import * as utils from '../shared/utils';

const AppDebug = reactive({
    debug: false,
    debugWebSocket: false,
    debugUserDiff: false,
    debugPhotonLogging: false,
    debugGameLog: false,
    debugWebRequests: false,
    debugFriendState: false,
    debugIPC: false,
    errorNoty: null,
    dontLogMeOut: false,
    endpointDomain: 'https://api.vrchat.cloud/api/1',
    endpointDomainVrchat: 'https://api.vrchat.cloud/api/1',
    websocketDomain: 'wss://pipeline.vrchat.cloud',
    websocketDomainVrchat: 'wss://pipeline.vrchat.cloud'
});

window.$debug = AppDebug;
window.utils = utils;
window.dayjs = dayjs;

export { AppDebug };
