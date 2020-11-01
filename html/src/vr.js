// Copyright(c) 2019-2020 pypy and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import Noty from 'noty';
import Vue from 'vue';
import ElementUI from 'element-ui';
import locale from 'element-ui/lib/locale/lang/en';

import sharedRepository from './repository/shared.js';
import configRepository from './repository/config.js';

window.sharedRepository = sharedRepository;
window.configRepository = configRepository;

(async function () {
    await CefSharp.BindObjectAsync(
        'VRCX',
        'SharedVariable',
        'SQLite'
    );

    await configRepository.init();

    Noty.overrideDefaults({
        animation: {
            open: 'animate__animated animate__fadeIn',
            close: 'animate__animated animate__zoomOut'
        },
        layout: 'topCenter',
        theme: 'relax',
        timeout: 3000
    });

    Vue.use(ElementUI, {
        locale
    });

    var escapeTag = (s) => String(s).replace(/["&'<>]/gu, (c) => `&#${c.charCodeAt(0)};`);
    Vue.filter('escapeTag', escapeTag);

    var commaNumber = (n) => String(Number(n) || 0).replace(/(\d)(?=(\d{3})+(?!\d))/gu, '$1,');
    Vue.filter('commaNumber', commaNumber);

    var formatDate = (s, format) => {
        var dt = new Date(s);
        if (isNaN(dt)) {
            return escapeTag(s);
        }
        var hours = dt.getHours();
        var map = {
            'YYYY': String(10000 + dt.getFullYear()).substr(-4),
            'MM': String(101 + dt.getMonth()).substr(-2),
            'DD': String(100 + dt.getDate()).substr(-2),
            'HH24': String(100 + hours).substr(-2),
            'HH': String(100 + (hours > 12
                ? hours - 12
                : hours)).substr(-2),
            'MI': String(100 + dt.getMinutes()).substr(-2),
            'SS': String(100 + dt.getSeconds()).substr(-2),
            'AMPM': hours >= 12
                ? 'PM'
                : 'AM'
        };
        return format.replace(/YYYY|MM|DD|HH24|HH|MI|SS|AMPM/gu, (c) => map[c] || c);
    };
    Vue.filter('formatDate', formatDate);

    var textToHex = (s) => String(s).split('').map((c) => c.charCodeAt(0).toString(16)).join(' ');
    Vue.filter('textToHex', textToHex);

    var timeToText = (t) => {
        var sec = Number(t);
        if (isNaN(sec)) {
            return escapeTag(t);
        }
        sec = Math.floor(sec / 1000);
        var arr = [];
        if (sec < 0) {
            sec = -sec;
        }
        if (sec >= 86400) {
            arr.push(`${Math.floor(sec / 86400)}d`);
            sec %= 86400;
        }
        if (sec >= 3600) {
            arr.push(`${Math.floor(sec / 3600)}h`);
            sec %= 3600;
        }
        if (sec >= 60) {
            arr.push(`${Math.floor(sec / 60)}m`);
            sec %= 60;
        }
        if (sec ||
            !arr.length) {
            arr.push(`${sec}s`);
        }
        return arr.join(' ');
    };
    Vue.filter('timeToText', timeToText);

    //
    // API
    //

    var API = {};

    API.eventHandlers = new Map();

    API.$emit = function (name, ...args) {
        // console.log(name, ...args);
        var handlers = this.eventHandlers.get(name);
        if (handlers === undefined) {
            return;
        }
        try {
            for (var handler of handlers) {
                handler.apply(this, args);
            }
        } catch (err) {
            console.error(err);
        }
    };

    API.$on = function (name, handler) {
        var handlers = this.eventHandlers.get(name);
        if (handlers === undefined) {
            handlers = [];
            this.eventHandlers.set(name, handlers);
        }
        handlers.push(handler);
    };

    API.$off = function (name, handler) {
        var handlers = this.eventHandlers.get(name);
        if (handlers === undefined) {
            return;
        }
        var { length } = handlers;
        for (var i = 0; i < length; ++i) {
            if (handlers[i] === handler) {
                if (length > 1) {
                    handlers.splice(i, 1);
                } else {
                    this.eventHandlers.delete(name);
                }
                break;
            }
        }
    };

    API.pendingGetRequests = new Map();

    API.call = function (endpoint, options) {
        var resource = `https://api.vrchat.cloud/api/1/${endpoint}`;
        var init = {
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
            cache: 'no-cache',
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            ...options
        };
        var { params } = init;
        var isGetRequest = init.method === 'GET';
        if (isGetRequest) {
            // transform body to url
            if (params === Object(params)) {
                var url = new URL(resource);
                var { searchParams } = url;
                for (var key in params) {
                    searchParams.set(key, params[key]);
                }
                resource = url.toString();
            }
            // merge requests
            var req = this.pendingGetRequests.get(resource);
            if (req !== undefined) {
                return req;
            }
        } else {
            init.headers = {
                'Content-Type': 'application/json;charset=utf-8',
                ...init.headers
            };
            init.body = params === Object(params)
                ? JSON.stringify(params)
                : '{}';
        }
        var req = fetch(resource, init).catch((err) => {
            this.$throw(0, err);
        }).then((res) => res.json().catch(() => {
            if (res.ok) {
                this.$throw(0, 'Invalid JSON response');
            }
            this.$throw(res.status);
        }).then((json) => {
            if (res.ok) {
                if (json.success === Object(json.success)) {
                    new Noty({
                        type: 'success',
                        text: escapeTag(json.success.message)
                    }).show();
                }
                return json;
            }
            if (json === Object(json)) {
                if (json.error === Object(json.error)) {
                    this.$throw(
                        json.error.status_code || res.status,
                        json.error.message,
                        json.error.data
                    );
                } else if (typeof json.error === 'string') {
                    this.$throw(
                        json.status_code || res.status,
                        json.error
                    );
                }
            }
            this.$throw(res.status, json);
            return json;
        }));
        if (isGetRequest) {
            req.finally(() => {
                this.pendingGetRequests.delete(resource);
            });
            this.pendingGetRequests.set(resource, req);
        }
        return req;
    };

    API.statusCodes = {
        100: 'Continue',
        101: 'Switching Protocols',
        102: 'Processing',
        103: 'Early Hints',
        200: 'OK',
        201: 'Created',
        202: 'Accepted',
        203: 'Non-Authoritative Information',
        204: 'No Content',
        205: 'Reset Content',
        206: 'Partial Content',
        207: 'Multi-Status',
        208: 'Already Reported',
        226: 'IM Used',
        300: 'Multiple Choices',
        301: 'Moved Permanently',
        302: 'Found',
        303: 'See Other',
        304: 'Not Modified',
        305: 'Use Proxy',
        306: 'Switch Proxy',
        307: 'Temporary Redirect',
        308: 'Permanent Redirect',
        400: 'Bad Request',
        401: 'Unauthorized',
        402: 'Payment Required',
        403: 'Forbidden',
        404: 'Not Found',
        405: 'Method Not Allowed',
        406: 'Not Acceptable',
        407: 'Proxy Authentication Required',
        408: 'Request Timeout',
        409: 'Conflict',
        410: 'Gone',
        411: 'Length Required',
        412: 'Precondition Failed',
        413: 'Payload Too Large',
        414: 'URI Too Long',
        415: 'Unsupported Media Type',
        416: 'Range Not Satisfiable',
        417: 'Expectation Failed',
        418: "I'm a teapot",
        421: 'Misdirected Request',
        422: 'Unprocessable Entity',
        423: 'Locked',
        424: 'Failed Dependency',
        425: 'Too Early',
        426: 'Upgrade Required',
        428: 'Precondition Required',
        429: 'Too Many Requests',
        431: 'Request Header Fields Too Large',
        451: 'Unavailable For Legal Reasons',
        500: 'Internal Server Error',
        501: 'Not Implemented',
        502: 'Bad Gateway',
        503: 'Service Unavailable',
        504: 'Gateway Timeout',
        505: 'HTTP Version Not Supported',
        506: 'Variant Also Negotiates',
        507: 'Insufficient Storage',
        508: 'Loop Detected',
        510: 'Not Extended',
        511: 'Network Authentication Required',
        // CloudFlare Error
        520: 'Web server returns an unknown error',
        521: 'Web server is down',
        522: 'Connection timed out',
        523: 'Origin is unreachable',
        524: 'A timeout occurred',
        525: 'SSL handshake failed',
        526: 'Invalid SSL certificate',
        527: 'Railgun Listener to origin error'
    };

    API.$throw = function (code, error) {
        var text = [];
        if (code > 0) {
            var status = this.statusCodes[code];
            if (status === undefined) {
                text.push(`${code}`);
            } else {
                text.push(`${code} ${status}`);
            }
        }
        if (error !== undefined) {
            text.push(JSON.stringify(error));
        }
        text = text.map((s) => escapeTag(s)).join('<br>');
        if (text.length) {
            new Noty({
                type: 'error',
                text
            }).show();
        }
        throw new Error(text);
    };

    // API: Config

    API.cachedConfig = {};

    API.$on('CONFIG', function (args) {
        args.ref = this.applyConfig(args.json);
    });

    API.applyConfig = function (json) {
        var ref = {
            clientApiKey: '',
            ...json
        };
        this.cachedConfig = ref;
        return ref;
    };

    API.getConfig = function () {
        return this.call('config', {
            method: 'GET'
        }).then((json) => {
            var args = {
                ref: null,
                json
            };
            this.$emit('CONFIG', args);
            return args;
        });
    };

    // API: Location

    API.parseLocation = function (tag) {
        tag = String(tag || '');
        var ctx = {
            tag,
            isOffline: false,
            isPrivate: false,
            worldId: '',
            instanceId: '',
            instanceName: '',
            accessType: '',
            userId: null,
            hiddenId: null,
            privateId: null,
            friendsId: null,
            canRequestInvite: false
        };
        if (tag === 'offline') {
            ctx.isOffline = true;
        } else if (tag === 'private') {
            ctx.isPrivate = true;
        } else if (tag.startsWith('local') === false) {
            var sep = tag.indexOf(':');
            if (sep >= 0) {
                ctx.worldId = tag.substr(0, sep);
                ctx.instanceId = tag.substr(sep + 1);
                ctx.instanceId.split('~').forEach((s, i) => {
                    if (i) {
                        var A = s.indexOf('(');
                        var Z = A >= 0
                            ? s.lastIndexOf(')')
                            : -1;
                        var key = Z >= 0
                            ? s.substr(0, A)
                            : s;
                        var value = A < Z
                            ? s.substr(A + 1, Z - A - 1)
                            : '';
                        if (key === 'hidden') {
                            ctx.hiddenId = value;
                        } else if (key === 'private') {
                            ctx.privateId = value;
                        } else if (key === 'friends') {
                            ctx.friendsId = value;
                        } else if (key === 'canRequestInvite') {
                            ctx.canRequestInvite = true;
                        }
                    } else {
                        ctx.instanceName = s;
                    }
                });
                ctx.accessType = 'public';
                if (ctx.privateId !== null) {
                    if (ctx.canRequestInvite) {
                        // InvitePlus
                        ctx.accessType = 'invite+';
                    } else {
                        // InviteOnly
                        ctx.accessType = 'invite';
                    }
                    ctx.userId = ctx.privateId;
                } else if (ctx.friendsId !== null) {
                    // FriendsOnly
                    ctx.accessType = 'friends';
                    ctx.userId = ctx.friendsId;
                } else if (ctx.hiddenId !== null) {
                    // FriendsOfGuests
                    ctx.accessType = 'friends+';
                    ctx.userId = ctx.hiddenId;
                }
            } else {
                ctx.worldId = tag;
            }
        }
        return ctx;
    };

    Vue.component('location', {
        template: '<span>{{ text }}<slot></slot></span>',
        props: {
            location: String
        },
        data() {
            return {
                text: this.location
            };
        },
        methods: {
            parse() {
                var L = API.parseLocation(this.location);
                if (L.isOffline) {
                    this.text = 'Offline';
                } else if (L.isPrivate) {
                    this.text = 'Private';
                } else if (L.worldId) {
                    var ref = API.cachedWorlds.get(L.worldId);
                    if (ref === undefined) {
                        API.getWorld({
                            worldId: L.worldId
                        }).then((args) => {
                            if (L.tag === this.location) {
                                if (L.instanceId) {
                                    this.text = `${args.json.name} #${L.instanceName} ${L.accessType}`;
                                } else {
                                    this.text = args.json.name;
                                }
                            }
                            return args;
                        });
                    } else if (L.instanceId) {
                        this.text = `${ref.name} #${L.instanceName} ${L.accessType}`;
                    } else {
                        this.text = ref.name;
                    }
                }
            }
        },
        watch: {
            location() {
                this.parse();
            }
        },
        created() {
            this.parse();
        }
    });

    // API: World

    API.cachedWorlds = new Map();

    API.$on('WORLD', function (args) {
        args.ref = this.applyWorld(args.json);
    });

    API.applyWorld = function (json) {
        var ref = this.cachedWorlds.get(json.id);
        if (ref === undefined) {
            ref = {
                id: '',
                name: '',
                description: '',
                authorId: '',
                authorName: '',
                capacity: 0,
                tags: [],
                releaseStatus: '',
                imageUrl: '',
                thumbnailImageUrl: '',
                assetUrl: '',
                assetUrlObject: {},
                pluginUrl: '',
                pluginUrlObject: {},
                unityPackageUrl: '',
                unityPackageUrlObject: {},
                unityPackages: [],
                version: 0,
                favorites: 0,
                created_at: '',
                updated_at: '',
                publicationDate: '',
                labsPublicationDate: '',
                visits: 0,
                popularity: 0,
                heat: 0,
                publicOccupants: 0,
                privateOccupants: 0,
                occupants: 0,
                instances: [],
                // VRCX
                $isLabs: false,
                //
                ...json
            };
            this.cachedWorlds.set(ref.id, ref);
        } else {
            Object.assign(ref, json);
        }
        ref.$isLabs = ref.tags.includes('system_labs');
        return ref;
    };

    /*
        params: {
            worldId: string
        }
    */
    API.getWorld = function (params) {
        return this.call(`worlds/${params.worldId}`, {
            method: 'GET'
        }).then((json) => {
            var args = {
                ref: null,
                json,
                params
            };
            this.$emit('WORLD', args);
            return args;
        });
    };

    var $app = {
        data: {
            API,
            VRCX,
            // 1 = 대시보드랑 손목에 보이는거
            // 2 = 항상 화면에 보이는 거
            appType: location.href.substr(-1),
            currentTime: new Date().toJSON(),
            currentUserStatus: null,
            cpuUsage: 0,
            feeds: [],
            devices: [],
            isMinimalFeed: false,
        },
        computed: {},
        methods: {},
        watch: {},
        el: '#x-app',
        mounted() {
            // https://media.discordapp.net/attachments/581757976625283083/611170278218924033/unknown.png
            // 현재 날짜 시간
            // 컨트롤러 배터리 상황
            // --
            // OO is in Let's Just H!!!!! [GPS]
            // OO has logged in [Online] -> TODO: location
            // OO has logged out [Offline] -> TODO: location
            // OO has joined [OnPlayerJoined]
            // OO has left [OnPlayerLeft]
            // [Moderation]
            // OO has blocked you
            // OO has muted you
            // OO has hidden you
            // --
            API.getConfig().catch((err) => {
                // FIXME: 어케 복구하냐 이건
                throw err;
            }).then((args) => {
                this.updateLoop();
                this.updateCpuUsageLoop();
                this.$nextTick(function () {
                    if (this.appType === '1') {
                        this.$el.style.display = '';
                    }
                });
                return args;
            });
        }
    };

    $app.methods.updateLoop = async function () {
        try {
            this.currentTime = new Date().toJSON();
            this.currentUserStatus = sharedRepository.get('current_user_status');
            if (configRepository.getBool('VRCX_hideDevicesFromFeed') === false) {
                VRCX.GetVRDevices().then((devices) => {
                    devices.forEach((device) => {
                        device[2] = parseInt(device[2], 10);
                    });
                    this.devices = devices;
                });
            }
            else {
                this.devices = '';
            }
            await this.updateSharedFeed();
        } catch (err) {
            console.error(err);
        }
        setTimeout(() => this.updateLoop(), 500);
    };

    $app.methods.updateCpuUsageLoop = async function () {
        try {
            var cpuUsage = await VRCX.CpuUsage();
            this.cpuUsage = cpuUsage.toFixed(2);
        } catch (err) {
            console.error(err);
        }
        setTimeout(() => this.updateCpuUsageLoop(), 1000);
    };

    $app.methods.updateSharedFeed = async function () {
        this.isMinimalFeed = configRepository.getBool('VRCX_minimalFeed');
        // TODO: block mute hideAvatar unfriend

        var feeds = sharedRepository.getArray('feeds');
        if (feeds === null) {
            return;
        }

        var _feeds = this.feeds;
        this.feeds = feeds;

        if (this.appType === '2') {
            var map = {};
            _feeds.forEach((feed) => {
                if (feed.isFavorite) {
                    if (feed.type === 'OnPlayerJoined' ||
                        feed.type === 'OnPlayerLeft') {
                        if (!map[feed.data] ||
                            map[feed.data] < feed.created_at) {
                            map[feed.data] = feed.created_at;
                        }
                    } else if (feed.type === 'Online' ||
                        feed.type === 'Offline') {
                        if (!map[feed.displayName] ||
                            map[feed.displayName] < feed.created_at) {
                            map[feed.displayName] = feed.created_at;
                        }
                    }
                }
            });
            // disable notification on busy
            if (this.currentUserStatus === 'busy') {
                return;
            }
            if (configRepository.getBool('VRCX_VIPNotifications') === true) {
                var notys = [];
                this.feeds.forEach((feed) => {
                    if (feed.isFavorite) {
                        if (feed.type === 'Online' ||
                            feed.type === 'Offline') {
                            if (!map[feed.displayName] ||
                                map[feed.displayName] < feed.created_at) {
                                map[feed.displayName] = feed.created_at;
                                notys.push(feed);
                            }
                        } else if (feed.type === 'OnPlayerJoined' ||
                            feed.type === 'OnPlayerLeft') {
                            if (!map[feed.data] ||
                                map[feed.data] < feed.created_at) {
                                map[feed.data] = feed.created_at;
                                notys.push(feed);
                            }
                        }
                    }
                });
                var bias = new Date(Date.now() - 60000).toJSON();
                var theme = 'relax';
                if (configRepository.getBool('isDarkMode') === true) {
                    theme = 'sunset';
                }
                notys.forEach((noty) => {
                    if (noty.created_at > bias) {
                        switch (noty.type) {
                            case 'OnPlayerJoined':
                                new Noty({
                                    type: 'alert',
                                    theme: theme,
                                    text: `<strong>${noty.data}</strong> has joined`
                                }).show();
                                break;
                            case 'OnPlayerLeft':
                                new Noty({
                                    type: 'alert',
                                    theme: theme,
                                    text: `<strong>${noty.data}</strong> has left`
                                }).show();
                                break;
                            case 'Online':
                                new Noty({
                                    type: 'alert',
                                    theme: theme,
                                    text: `<strong>${noty.displayName}</strong> has logged in`
                                }).show();
                                break;
                            case 'Offline':
                                new Noty({
                                    type: 'alert',
                                    theme: theme,
                                    text: `<strong>${noty.displayName}</strong> has logged out`
                                }).show();
                                break;
                        }
                    }
                });
            }
        }
    };

    $app.methods.userStatusClass = function (user) {
        var style = {};
        if (user) {
            if (user.location === 'offline') {
                style.offline = true;
            } else if (user.status === 'active') {
                style.active = true;
            } else if (user.status === 'join me') {
                style.joinme = true;
            } else if (user.status === 'busy') {
                style.busy = true;
            }
        }
        return style;
    };

    $app = new Vue($app);
    window.$app = $app;
})();
