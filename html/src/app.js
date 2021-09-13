// Copyright(c) 2019-2021 pypy and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import Noty from 'noty';
import Vue from 'vue';
import VueLazyload from 'vue-lazyload';
import {DataTables} from 'vue-data-tables';
import VSwatches from 'vue-swatches';
Vue.component('v-swatches', VSwatches);
import ElementUI from 'element-ui';
import locale from 'element-ui/lib/locale/lang/en';
import {v4 as uuidv4} from 'uuid';

import {appVersion} from './constants.js';
import configRepository from './repository/config.js';
import webApiService from './service/webapi.js';
import gameLogService from './service/gamelog.js';
import security from './security.js';
import database from './repository/database.js';

speechSynthesis.getVoices();

(async function () {
    var $app = null;

    await CefSharp.BindObjectAsync(
        'AppApi',
        'WebApi',
        'SharedVariable',
        'VRCXStorage',
        'SQLite',
        'LogWatcher',
        'Discord',
        'AssetBundleCacher'
    );

    await configRepository.init();

    if (configRepository.getBool('migrate_config_20201101') === null) {
        var legacyConfigKeys = [
            'orderFriendGroup0',
            'orderFriendGroup1',
            'orderFriendGroup2',
            'orderFriendGroup3',
            'discordActive',
            'discordInstance',
            'openVR',
            'openVRAlways',
            'VRCX_hidePrivateFromFeed',
            'VRCX_hideLoginsFromFeed',
            'VRCX_hideDevicesFromFeed',
            'VRCX_VIPNotifications',
            'VRCX_minimalFeed',
            'isDarkMode',
            'VRCX_StartAtWindowsStartup',
            'VRCX_StartAsMinimizedState',
            'VRCX_CloseToTray',
            'launchAsDesktop'
        ];
        for (var _key of legacyConfigKeys) {
            configRepository.setBool(_key, VRCXStorage.Get(_key) === 'true');
        }
        configRepository.setBool('migrate_config_20201101', true);
    }

    var showConsoleWarningMessage = function () {
        if ($app.debug || $app.debugWebRequests || $app.debugWebSocket) {
            return;
        }
        console.log(
            '%cCareful! This might not do what you think.',
            'background-color: red; color: yellow; font-size: 32px; font-weight: bold'
        );
        console.log(
            '%cIf someone told you to copy-paste something here, it can give them access to your account.',
            'font-size: 20px;'
        );
    };

    document.addEventListener('keyup', function (e) {
        if (e.ctrlKey) {
            if (e.key === 'I') {
                AppApi.ShowDevTools();
                showConsoleWarningMessage();
            } else if (e.key === 'r') {
                location.reload();
            }
        }
    });

    VRCXStorage.GetArray = function (key) {
        try {
            var array = JSON.parse(this.Get(key));
            if (Array.isArray(array)) {
                return array;
            }
        } catch (err) {
            console.error(err);
        }
        return [];
    };

    VRCXStorage.SetArray = function (key, value) {
        this.Set(key, JSON.stringify(value));
    };

    VRCXStorage.GetObject = function (key) {
        try {
            var object = JSON.parse(this.Get(key));
            if (object === Object(object)) {
                return object;
            }
        } catch (err) {
            console.error(err);
        }
        return {};
    };

    VRCXStorage.SetObject = function (key, value) {
        this.Set(key, JSON.stringify(value));
    };

    setInterval(function () {
        VRCXStorage.Flush();
    }, 5 * 60 * 1000);

    Noty.overrideDefaults({
        animation: {
            open: 'animate__animated animate__bounceInLeft',
            close: 'animate__animated animate__bounceOutLeft'
        },
        layout: 'bottomLeft',
        theme: 'mint',
        timeout: 6000
    });

    Vue.use(ElementUI, {
        locale
    });

    var removeFromArray = function (array, item) {
        var {length} = array;
        for (var i = 0; i < length; ++i) {
            if (array[i] === item) {
                array.splice(i, 1);
                return true;
            }
        }
        return false;
    };

    var escapeTag = function (tag) {
        var s = String(tag);
        return s.replace(/["&'<>]/g, (c) => `&#${c.charCodeAt(0)};`);
    };
    Vue.filter('escapeTag', escapeTag);

    var commaNumber = function (num) {
        var s = String(Number(num));
        return s.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1,');
    };
    Vue.filter('commaNumber', commaNumber);

    var formatDate = function (date, format) {
        var dt = new Date(date);
        if (isNaN(dt)) {
            return escapeTag(date);
        }
        var hours = dt.getHours();
        var map = {
            YYYY: String(10000 + dt.getFullYear()).substr(-4),
            MM: String(101 + dt.getMonth()).substr(-2),
            DD: String(100 + dt.getDate()).substr(-2),
            HH24: String(100 + hours).substr(-2),
            HH: String(100 + (hours > 12 ? hours - 12 : hours)).substr(-2),
            MI: String(100 + dt.getMinutes()).substr(-2),
            SS: String(100 + dt.getSeconds()).substr(-2),
            AMPM: hours >= 12 ? 'PM' : 'AM'
        };
        return format.replace(
            /YYYY|MM|DD|HH24|HH|MI|SS|AMPM/g,
            (c) => map[c] || c
        );
    };
    Vue.filter('formatDate', formatDate);

    var textToHex = function (text) {
        var s = String(text);
        return s
            .split('')
            .map((c) => c.charCodeAt(0).toString(16))
            .join(' ');
    };
    Vue.filter('textToHex', textToHex);

    var timeToText = function (sec) {
        var n = Number(sec);
        if (isNaN(n)) {
            return escapeTag(sec);
        }
        n = Math.floor(n / 1000);
        var arr = [];
        if (n < 0) {
            n = -n;
        }
        if (n >= 86400) {
            arr.push(`${Math.floor(n / 86400)}d`);
            n %= 86400;
        }
        if (n >= 3600) {
            arr.push(`${Math.floor(n / 3600)}h`);
            n %= 3600;
        }
        if (n >= 60) {
            arr.push(`${Math.floor(n / 60)}m`);
            n %= 60;
        }
        if (n || arr.length === 0) {
            arr.push(`${n}s`);
        }
        return arr.join(' ');
    };
    Vue.filter('timeToText', timeToText);

    Vue.use(VueLazyload, {
        preLoad: 1,
        observer: true,
        observerOptions: {
            rootMargin: '0px',
            threshold: 0.1
        },
        error: './assets/blank.png',
        loading: './assets/blank.png'
    });

    Vue.use(DataTables);

    var $appDarkStyle = document.createElement('link');
    $appDarkStyle.disabled = true;
    $appDarkStyle.rel = 'stylesheet';
    $appDarkStyle.href = `app.dark.css?_=${Date.now()}`;
    document.head.appendChild($appDarkStyle);

    var getLaunchURL = function (worldId, instanceId) {
        if (instanceId) {
            return `https://vrchat.com/home/launch?worldId=${encodeURIComponent(
                worldId
            )}&instanceId=${encodeURIComponent(instanceId)}`;
        }
        return `https://vrchat.com/home/launch?worldId=${encodeURIComponent(
            worldId
        )}`;
    };

    //
    // Languages
    //

    var subsetOfLanguages = {
        eng: 'English',
        kor: '한국어',
        rus: 'Русский',
        spa: 'Español',
        por: 'Português',
        zho: '中文',
        deu: 'Deutsch',
        jpn: '日本語',
        fra: 'Français',
        swe: 'Svenska',
        nld: 'Nederlands',
        pol: 'Polski',
        dan: 'Dansk',
        nor: 'Norsk',
        ita: 'Italiano',
        tha: 'ภาษาไทย',
        fin: 'Suomi',
        hun: 'Magyar',
        ces: 'Čeština',
        tur: 'Türkçe',
        ara: 'العربية',
        ron: 'Română',
        vie: 'Tiếng Việt',
        ase: 'American Sign Language',
        bfi: 'British Sign Language',
        dse: 'Dutch Sign Language',
        fsl: 'French Sign Language',
        kvk: 'Korean Sign Language'
    };

    // vrchat to famfamfam
    var languageMappings = {
        eng: 'us',
        kor: 'kr',
        rus: 'ru',
        spa: 'es',
        por: 'pt',
        zho: 'cn',
        deu: 'de',
        jpn: 'jp',
        fra: 'fr',
        swe: 'se',
        nld: 'nl',
        pol: 'pl',
        dan: 'dk',
        nor: 'no',
        ita: 'it',
        tha: 'th',
        fin: 'fi',
        hun: 'hu',
        ces: 'cz',
        tur: 'tr',
        ara: 'ae',
        ron: 'ro',
        vie: 'vn',
        ase: 'us',
        bfi: 'gb',
        dse: 'nl',
        fsl: 'fr',
        kvk: 'kr'
    };

    //
    // API
    //

    var API = {};

    API.eventHandlers = new Map();

    API.$emit = function (name, ...args) {
        if ($app.debug) {
            console.log(name, ...args);
        }
        var handlers = this.eventHandlers.get(name);
        if (typeof handlers === 'undefined') {
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
        if (typeof handlers === 'undefined') {
            handlers = [];
            this.eventHandlers.set(name, handlers);
        }
        handlers.push(handler);
    };

    API.$off = function (name, handler) {
        var handlers = this.eventHandlers.get(name);
        if (typeof handlers === 'undefined') {
            return;
        }
        var {length} = handlers;
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
    API.failedGetRequests = new Map();

    API.call = function (endpoint, options) {
        var init = {
            url: `https://api.vrchat.cloud/api/1/${endpoint}`,
            method: 'GET',
            ...options
        };
        var {params} = init;
        if (init.method === 'GET') {
            // don't retry recent 404
            if (this.failedGetRequests.has(endpoint)) {
                var lastRun = this.failedGetRequests.get(endpoint);
                if (lastRun >= Date.now() - 900000) {
                    // 15mins
                    throw new Error(
                        `Bailing request due to past 404, ${endpoint}`
                    );
                }
                this.failedGetRequests.delete(endpoint);
            }
            // transform body to url
            if (params === Object(params)) {
                var url = new URL(init.url);
                var {searchParams} = url;
                for (var key in params) {
                    searchParams.set(key, params[key]);
                }
                init.url = url.toString();
            }
            // merge requests
            var req = this.pendingGetRequests.get(init.url);
            if (typeof req !== 'undefined') {
                return req;
            }
        } else if (init.uploadImage || init.uploadFilePUT) {
            // nothing
        } else {
            init.headers = {
                'Content-Type': 'application/json;charset=utf-8',
                ...init.headers
            };
            init.body =
                params === Object(params) ? JSON.stringify(params) : '{}';
        }
        init.headers = {
            'User-Agent': appVersion,
            ...init.headers
        };
        var req = webApiService
            .execute(init)
            .catch((err) => {
                this.$throw(0, err);
            })
            .then((response) => {
                try {
                    response.data = JSON.parse(response.data);
                    if ($app.debugWebRequests) {
                        console.log(init, response.data);
                    }
                    return response;
                } catch (e) {}
                if (response.status === 200) {
                    this.$throw(0, 'Invalid JSON response');
                }
                this.$throw(response.status, endpoint);
                return {};
            })
            .then(({data, status}) => {
                if (status === 200) {
                    if (data.success === Object(data.success)) {
                        new Noty({
                            type: 'success',
                            text: escapeTag(data.success.message)
                        }).show();
                    }
                    return data;
                }
                if (
                    status === 401 &&
                    data.error.message === '"Missing Credentials"'
                ) {
                    if (endpoint.substring(0, 10) === 'auth/user?') {
                        this.$emit('AUTOLOGIN');
                    }
                    throw new Error('401: Missing Credentials');
                }
                if (status === 404 && endpoint.substring(0, 8) === 'avatars/') {
                    $app.$message({
                        message: 'Avatar private or deleted',
                        type: 'error'
                    });
                    $app.avatarDialog.visible = false;
                    throw new Error("404: Can't find avatarǃ");
                }
                if (init.method === 'GET' && status === 404) {
                    this.failedGetRequests.set(endpoint, Date.now());
                }
                if (status === 404 && endpoint.substring(0, 6) === 'users/') {
                    throw new Error("404: Can't find user!");
                }
                if (data.error === Object(data.error)) {
                    this.$throw(
                        data.error.status_code || status,
                        data.error.message,
                        endpoint
                    );
                } else if (typeof data.error === 'string') {
                    this.$throw(
                        data.status_code || status,
                        data.error,
                        endpoint
                    );
                }
                this.$throw(status, data);
                return data;
            });
        if (init.method === 'GET') {
            req.finally(() => {
                this.pendingGetRequests.delete(init.url);
            });
            this.pendingGetRequests.set(init.url, req);
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

    // FIXME : extra를 없애줘
    API.$throw = function (code, error, extra) {
        var text = [];
        if (code > 0) {
            var status = this.statusCodes[code];
            if (typeof status === 'undefined') {
                text.push(`${code}`);
            } else {
                text.push(`${code} ${status}`);
            }
        }
        if (typeof error !== 'undefined') {
            text.push(JSON.stringify(error));
        }
        if (typeof extra !== 'undefined') {
            text.push(JSON.stringify(extra));
        }
        text = text.map((s) => escapeTag(s)).join('<br>');
        if (text.length) {
            if (this.errorNoty) {
                this.errorNoty.close();
            }
            this.errorNoty = new Noty({
                type: 'error',
                text
            }).show();
        }
        throw new Error(text);
    };

    API.$bulk = function (options, args) {
        if ('handle' in options) {
            options.handle.call(this, args, options);
        }
        if (
            args.json.length > 0 &&
            ((options.params.offset += args.json.length),
            // eslint-disable-next-line no-nested-ternary
            options.N > 0
                ? options.N > options.params.offset
                : options.N < 0
                ? args.json.length
                : options.params.n === args.json.length)
        ) {
            this.bulk(options);
        } else if ('done' in options) {
            options.done.call(this, true, options);
        }
        return args;
    };

    API.bulk = function (options) {
        this[options.fn](options.params)
            .catch((err) => {
                if ('done' in options) {
                    options.done.call(this, false, options);
                }
                throw err;
            })
            .then((args) => this.$bulk(options, args));
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
                json
            };
            this.$emit('CONFIG', args);
            return args;
        });
    };

    // API: Location

    API.parseLocation = function (tag) {
        var _tag = String(tag || '');
        var ctx = {
            tag: _tag,
            isOffline: false,
            isPrivate: false,
            worldId: '',
            instanceId: '',
            instanceName: '',
            accessType: '',
            region: '',
            userId: null,
            hiddenId: null,
            privateId: null,
            friendsId: null,
            canRequestInvite: false
        };
        if (_tag === 'offline') {
            ctx.isOffline = true;
        } else if (_tag === 'private') {
            ctx.isPrivate = true;
        } else if (_tag.startsWith('local') === false) {
            var sep = _tag.indexOf(':');
            if (sep >= 0) {
                ctx.worldId = _tag.substr(0, sep);
                ctx.instanceId = _tag.substr(sep + 1);
                ctx.instanceId.split('~').forEach((s, i) => {
                    if (i) {
                        var A = s.indexOf('(');
                        var Z = A >= 0 ? s.lastIndexOf(')') : -1;
                        var key = Z >= 0 ? s.substr(0, A) : s;
                        var value = A < Z ? s.substr(A + 1, Z - A - 1) : '';
                        if (key === 'hidden') {
                            ctx.hiddenId = value;
                        } else if (key === 'private') {
                            ctx.privateId = value;
                        } else if (key === 'friends') {
                            ctx.friendsId = value;
                        } else if (key === 'canRequestInvite') {
                            ctx.canRequestInvite = true;
                        } else if (key === 'region') {
                            ctx.region = value;
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
                ctx.worldId = _tag;
            }
        }
        return ctx;
    };

    Vue.component('launch', {
        template:
            '<el-button @click="confirm" size="mini" icon="el-icon-info" circle></el-button>',
        props: {
            location: String
        },
        methods: {
            parse() {
                var L = API.parseLocation(this.location);
                this.$el.style.display =
                    L.isOffline || L.isPrivate ? 'none' : '';
            },
            confirm() {
                API.$emit('SHOW_LAUNCH_DIALOG', this.location);
            }
        },
        watch: {
            location() {
                this.parse();
            }
        },
        mounted() {
            this.parse();
        }
    });

    Vue.component('invite-yourself', {
        template:
            '<el-button @click="confirm" size="mini" icon="el-icon-message" circle></el-button>',
        props: {
            location: String
        },
        methods: {
            parse() {
                var L = API.parseLocation(this.location);
                this.$el.style.display =
                    L.isOffline || L.isPrivate ? 'none' : '';
            },
            confirm() {
                var L = API.parseLocation(this.location);
                if (L.isOffline || L.isPrivate || L.worldId === '') {
                    return;
                }
                if (API.currentUser.status === 'busy') {
                    this.$message({
                        message:
                            "You can't invite yourself in 'Do Not Disturb' mode",
                        type: 'error'
                    });
                    return;
                }
                API.selfInvite({
                    instanceId: L.instanceId,
                    worldId: L.worldId
                });
            }
        },
        watch: {
            location() {
                this.parse();
            }
        },
        mounted() {
            this.parse();
        }
    });

    Vue.component('location', {
        template:
            '<span @click="showWorldDialog" :class="{ \'x-link\': link && this.location !== \'private\' && this.location !== \'offline\'}">{{ text }}<slot></slot><span class="famfamfam-flags" :class="region" style="display:inline-block;margin-left:5px"></span></span>',
        props: {
            location: String,
            hint: {
                type: String,
                default: ''
            },
            link: {
                type: Boolean,
                default: true
            }
        },
        data() {
            return {
                text: this.location,
                region: this.region
            };
        },
        methods: {
            parse() {
                this.text = this.location;
                var L = API.parseLocation(this.location);
                if (L.isOffline) {
                    this.text = 'Offline';
                } else if (L.isPrivate) {
                    this.text = 'Private';
                } else if (typeof this.hint === 'string' && this.hint !== '') {
                    if (L.instanceId) {
                        this.text = `${this.hint} #${L.instanceName} ${L.accessType}`;
                    } else {
                        this.text = this.hint;
                    }
                } else if (L.worldId) {
                    var ref = API.cachedWorlds.get(L.worldId);
                    if (typeof ref === 'undefined') {
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
                this.region = '';
                if (
                    this.location !== '' &&
                    L.instanceId &&
                    !L.isOffline &&
                    !L.isPrivate
                ) {
                    if (L.region === 'eu') {
                        this.region = 'europeanunion';
                    } else if (L.region === 'jp') {
                        this.region = 'jp';
                    } else {
                        this.region = 'us';
                    }
                }
            },
            showWorldDialog() {
                if (this.link) {
                    API.$emit('SHOW_WORLD_DIALOG', this.location);
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

    Vue.component('avatar-info', {
        template:
            '<div @click="confirm" class="avatar-info"><span style="display:inline-block;margin-right:5px">{{ avatarName }}</span><span :class="color">{{ avatarType }}</span></div>',
        props: {
            imageurl: String,
            userid: String,
            hintownerid: String,
            hintavatarname: String
        },
        data() {
            return {
                avatarName: this.avatarName,
                avatarType: this.avatarType,
                color: this.color
            };
        },
        methods: {
            async parse() {
                this.ownerId = '';
                this.avatarName = '';
                this.avatarType = '';
                this.color = '';
                if (this.hintownerid) {
                    this.avatarName = this.hintavatarname;
                    this.ownerId = this.hintownerid;
                } else {
                    try {
                        var avatarInfo = await $app.getAvatarName(
                            this.imageurl
                        );
                        this.avatarName = avatarInfo.avatarName;
                        this.ownerId = avatarInfo.ownerId;
                    } catch (err) {}
                }
                if (typeof this.userid === 'undefined' || !this.ownerId) {
                    this.color = '';
                    this.avatarType = '';
                } else if (this.ownerId === this.userid) {
                    this.color = 'avatar-info-own';
                    this.avatarType = '(own)';
                } else {
                    this.color = 'avatar-info-public';
                    this.avatarType = '(public)';
                }
            },
            confirm() {
                $app.showAvatarAuthorDialog(this.userid, this.imageurl);
            }
        },
        watch: {
            imageurl() {
                this.parse();
            },
            userid() {
                this.parse();
            }
        },
        mounted() {
            this.parse();
        }
    });

    // API: User

    // changeUserName: PUT users/${userId} {displayName: string, currentPassword: string}
    // changeUserEmail: PUT users/${userId} {email: string, currentPassword: string}
    // changePassword: PUT users/${userId} {password: string, currentPassword: string}
    // updateTOSAggreement: PUT users/${userId} {acceptedTOSVersion: number}

    // 2FA
    // removeTwoFactorAuth: DELETE auth/twofactorauth
    // getTwoFactorAuthpendingSecret: POST auth/twofactorauth/totp/pending -> { qrCodeDataUrl: string, secret: string }
    // verifyTwoFactorAuthPendingSecret: POST auth/twofactorauth/totp/pending/verify { code: string } -> { verified: bool, enabled: bool }
    // cancelVerifyTwoFactorAuthPendingSecret: DELETE auth/twofactorauth/totp/pending
    // getTwoFactorAuthOneTimePasswords: GET auth/user/twofactorauth/otp -> { otp: [ { code: string, used: bool } ] }

    // Account Link
    // merge: PUT auth/user/merge {mergeToken: string}
    // 링크됐다면 CurrentUser에 steamId, oculusId 값이 생기는듯
    // 스팀 계정으로 로그인해도 steamId, steamDetails에 값이 생김

    // Password Recovery
    // sendLink: PUT auth/password {email: string}
    // setNewPassword: PUT auth/password {emailToken: string, id: string, password: string}

    API.isLoggedIn = false;
    API.cachedUsers = new Map();
    API.currentUser = {};

    API.$on('LOGOUT', function () {
        this.isLoggedIn = false;
    });

    API.$on('USER:CURRENT', function (args) {
        var {json} = args;
        args.ref = this.applyCurrentUser(json);
        this.applyUser({
            id: json.id,
            username: json.username,
            displayName: json.displayName,
            bio: json.bio,
            bioLinks: json.bioLinks,
            currentAvatarImageUrl: json.currentAvatarImageUrl,
            currentAvatarThumbnailImageUrl: json.currentAvatarThumbnailImageUrl,
            status: json.status,
            statusDescription: json.statusDescription,
            state: json.state,
            tags: json.tags,
            developerType: json.developerType,
            last_login: json.last_login,
            last_platform: json.last_platform,
            date_joined: json.date_joined,
            allowAvatarCopying: json.allowAvatarCopying,
            userIcon: json.userIcon,
            fallbackAvatar: json.fallbackAvatar,
            isFriend: false,
            location: $app.lastLocation.location
        });
    });

    API.$on('USER:CURRENT:SAVE', function (args) {
        this.$emit('USER:CURRENT', args);
    });

    API.$on('USER', function (args) {
        args.ref = this.applyUser(args.json);
    });

    API.$on('USER:LIST', function (args) {
        for (var json of args.json) {
            this.$emit('USER', {
                json,
                params: {
                    userId: json.id
                }
            });
        }
    });

    API.logout = function () {
        this.$emit('LOGOUT');
        // return this.call('logout', {
        //     method: 'PUT'
        // }).finally(() => {
        //     this.$emit('LOGOUT');
        // });
    };

    /*
        params: {
            username: string,
            password: string
        }
    */
    API.login = function (params) {
        var {username, password, saveCredentials, cipher} = params;
        username = encodeURIComponent(username);
        password = encodeURIComponent(password);
        var auth = btoa(`${username}:${password}`);
        if (saveCredentials) {
            delete params.saveCredentials;
            if (cipher) {
                params.password = cipher;
                delete params.cipher;
            }
            $app.saveCredentials = params;
        }
        return this.call(`auth/user?apiKey=${this.cachedConfig.clientApiKey}`, {
            method: 'GET',
            headers: {
                Authorization: `Basic ${auth}`
            }
        }).then((json) => {
            var args = {
                json,
                params,
                origin: true
            };
            if (json.requiresTwoFactorAuth) {
                this.$emit('USER:2FA', args);
            } else {
                this.$emit('USER:CURRENT', args);
            }
            return args;
        });
    };

    /*
        params: {
            steamTicket: string
        }
    */
    API.loginWithSteam = function (params) {
        return this.call(
            `auth/steam?apiKey=${this.cachedConfig.clientApiKey}`,
            {
                method: 'POST',
                params
            }
        ).then((json) => {
            var args = {
                json,
                params,
                origin: true
            };
            if (json.requiresTwoFactorAuth) {
                this.$emit('USER:2FA', args);
            } else {
                this.$emit('USER:CURRENT', args);
            }
            return args;
        });
    };

    /*
        params: {
            code: string
        }
    */
    API.verifyOTP = function (params) {
        return this.call('auth/twofactorauth/otp/verify', {
            method: 'POST',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('OTP', args);
            return args;
        });
    };

    /*
        params: {
            code: string
        }
    */
    API.verifyTOTP = function (params) {
        return this.call('auth/twofactorauth/totp/verify', {
            method: 'POST',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('TOTP', args);
            return args;
        });
    };

    API.applyUserTrustLevel = function (ref) {
        ref.$isModerator = ref.developerType && ref.developerType !== 'none';
        ref.$isTroll = false;
        var {tags} = ref;
        if (tags.includes('admin_moderator')) {
            ref.$isModerator = true;
        }
        if (
            tags.includes('system_troll') ||
            tags.includes('system_probable_troll')
        ) {
            ref.$isTroll = true;
        }
        if (tags.includes('system_legend')) {
            ref.$isLegend = true;
        }
        if (tags.includes('system_trust_legend')) {
            ref.$trustLevel = 'Veteran User';
            ref.$trustClass = 'x-tag-legend';
            ref.$trustSortNum = 6;
        } else if (tags.includes('system_trust_veteran')) {
            ref.$trustLevel = 'Trusted User';
            ref.$trustClass = 'x-tag-veteran';
            ref.$trustSortNum = 5;
        } else if (tags.includes('system_trust_trusted')) {
            ref.$trustLevel = 'Known User';
            ref.$trustClass = 'x-tag-trusted';
            ref.$trustSortNum = 4;
        } else if (tags.includes('system_trust_known')) {
            ref.$trustLevel = 'User';
            ref.$trustClass = 'x-tag-known';
            ref.$trustSortNum = 3;
        } else if (tags.includes('system_trust_basic')) {
            ref.$trustLevel = 'New User';
            ref.$trustClass = 'x-tag-basic';
            ref.$trustSortNum = 2;
        } else {
            ref.$trustLevel = 'Visitor';
            ref.$trustClass = 'x-tag-untrusted';
            ref.$trustSortNum = 1;
        }
        ref.$trustColor = ref.$trustClass;
        if (ref.$isTroll) {
            ref.$trustColor = 'x-tag-troll';
            ref.$trustSortNum += 0.1;
        }
        if (ref.$isLegend) {
            ref.$trustColor = 'x-tag-legendary';
            ref.$trustSortNum += 0.2;
        }
        if (ref.$isModerator) {
            ref.$trustColor = 'x-tag-vip';
            ref.$trustSortNum += 0.3;
        }
    };

    // FIXME: it may performance issue. review here
    API.applyUserLanguage = function (ref) {
        ref.$languages = [];
        var {tags} = ref;
        for (var tag of tags) {
            if (tag.startsWith('language_') === false) {
                continue;
            }
            var key = tag.substr(9);
            var value = subsetOfLanguages[key];
            if (typeof value === 'undefined') {
                continue;
            }
            ref.$languages.push({
                key,
                value
            });
        }
    };

    API.applyCurrentUser = function (json) {
        var ref = this.currentUser;
        if (this.isLoggedIn) {
            Object.assign(ref, json);
            if (ref.homeLocation !== ref.$homeLocation.tag) {
                ref.$homeLocation = this.parseLocation(ref.homeLocation);
            }
            ref.$isVRCPlus = ref.tags.includes('system_supporter');
            this.applyUserTrustLevel(ref);
            this.applyUserLanguage(ref);
        } else {
            ref = {
                id: '',
                username: '',
                displayName: '',
                userIcon: '',
                bio: '',
                bioLinks: [],
                pastDisplayNames: [],
                friends: [],
                currentAvatarImageUrl: '',
                currentAvatarThumbnailImageUrl: '',
                currentAvatar: '',
                currentAvatarAssetUrl: '',
                homeLocation: '',
                twoFactorAuthEnabled: false,
                status: '',
                statusDescription: '',
                state: '',
                tags: [],
                developerType: '',
                last_login: '',
                last_platform: '',
                date_joined: '',
                allowAvatarCopying: false,
                onlineFriends: [],
                activeFriends: [],
                offlineFriends: [],
                // VRCX
                $homeLocation: {},
                $isVRCPlus: false,
                $isModerator: false,
                $isTroll: false,
                $trustLevel: 'Visitor',
                $trustClass: 'x-tag-untrusted',
                $trustColor: 'x-tag-untrusted',
                $trustSortNum: 1,
                $languages: [],
                //
                ...json
            };
            ref.$homeLocation = this.parseLocation(ref.homeLocation);
            ref.$isVRCPlus = ref.tags.includes('system_supporter');
            this.applyUserTrustLevel(ref);
            this.applyUserLanguage(ref);
            this.currentUser = ref;
            this.isLoggedIn = true;
            this.$emit('LOGIN', {
                json,
                ref
            });
        }
        return ref;
    };

    API.getCurrentUser = function () {
        return this.call(`auth/user?apiKey=${this.cachedConfig.clientApiKey}`, {
            method: 'GET'
        }).then((json) => {
            var args = {
                json,
                origin: true
            };
            if (json.requiresTwoFactorAuth) {
                this.$emit('USER:2FA', args);
            } else {
                this.$emit('USER:CURRENT', args);
            }
            return args;
        });
    };

    var userUpdateQueue = [];
    var userUpdateTimer = null;
    var queueUserUpdate = function (ctx) {
        userUpdateQueue.push(ctx);
        if (userUpdateTimer !== null) {
            return;
        }
        userUpdateTimer = setTimeout(function () {
            userUpdateTimer = null;
            var {length} = userUpdateQueue;
            for (var i = 0; i < length; ++i) {
                API.$emit('USER:UPDATE', userUpdateQueue[i]);
            }
            userUpdateQueue.length = 0;
        }, 1);
    };

    API.applyUser = function (json) {
        var ref = this.cachedUsers.get(json.id);
        // some missing variables on currentUser
        if (json.id === API.currentUser.id) {
            json.status = API.currentUser.status;
            json.statusDescription = API.currentUser.statusDescription;
            json.state = API.currentUser.state;
            json.last_login = API.currentUser.last_login;
            if (
                typeof json.location !== 'undefined' &&
                json.location === 'offline'
            ) {
                json.location = '';
            }
            if ($app.lastLocation.location) {
                json.location = $app.lastLocation.location;
                json.$location_at = $app.lastLocation.date;
            }
            json.$online_for = API.currentUser.$online_for;
            json.$offline_for = API.currentUser.$offline_for;
        }
        if (typeof json.statusDescription !== 'undefined') {
            json.statusDescription = $app.replaceBioSymbols(
                json.statusDescription
            );
        }
        if (typeof json.bio !== 'undefined') {
            json.bio = $app.replaceBioSymbols(json.bio);
        }
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                username: '',
                displayName: '',
                userIcon: '',
                bio: '',
                bioLinks: [],
                currentAvatarImageUrl: '',
                currentAvatarThumbnailImageUrl: '',
                status: '',
                statusDescription: '',
                state: '',
                tags: [],
                developerType: '',
                last_login: '',
                last_platform: '',
                date_joined: '',
                allowAvatarCopying: false,
                isFriend: false,
                location: '',
                worldId: '',
                instanceId: '',
                // VRCX
                $location: {},
                $location_at: Date.now(),
                $online_for: Date.now(),
                $offline_for: '',
                $isVRCPlus: false,
                $isModerator: false,
                $isTroll: false,
                $trustLevel: 'Visitor',
                $trustClass: 'x-tag-untrusted',
                $trustColor: 'x-tag-untrusted',
                $trustSortNum: 1,
                $languages: [],
                //
                ...json
            };
            ref.$location = this.parseLocation(ref.location);
            ref.$isVRCPlus = ref.tags.includes('system_supporter');
            this.applyUserTrustLevel(ref);
            this.applyUserLanguage(ref);
            this.cachedUsers.set(ref.id, ref);
        } else {
            var props = {};
            for (var prop in ref) {
                if (ref[prop] !== Object(ref[prop])) {
                    props[prop] = true;
                }
            }
            var $ref = {...ref};
            Object.assign(ref, json);
            if (ref.location !== ref.$location.tag) {
                ref.$location = this.parseLocation(ref.location);
            }
            ref.$isVRCPlus = ref.tags.includes('system_supporter');
            this.applyUserTrustLevel(ref);
            this.applyUserLanguage(ref);
            for (var prop in ref) {
                if (ref[prop] !== Object(ref[prop])) {
                    props[prop] = true;
                }
            }
            var has = false;
            for (var prop in props) {
                var asis = $ref[prop];
                var tobe = ref[prop];
                if (asis === tobe) {
                    delete props[prop];
                } else {
                    has = true;
                    props[prop] = [tobe, asis];
                }
            }
            // FIXME
            // if the status is offline, just ignore status and statusDescription only.
            if (has && ref.status !== 'offline' && $ref.status !== 'offline') {
                if (props.location) {
                    var ts = Date.now();
                    props.location.push(ts - ref.$location_at);
                    ref.$location_at = ts;
                }
                queueUserUpdate({
                    ref,
                    props
                });
            }
        }
        return ref;
    };

    /*
        params: {
            userId: string
        }
    */
    API.getUser = function (params) {
        return this.call(`users/${params.userId}`, {
            method: 'GET'
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('USER', args);
            return args;
        });
    };

    /*
        params: {
            userId: string
        }
    */
    API.getCachedUser = function (params) {
        return new Promise((resolve, reject) => {
            var ref = this.cachedUsers.get(params.userId);
            if (typeof ref === 'undefined') {
                this.getUser(params).catch(reject).then(resolve);
            } else {
                resolve({
                    cache: true,
                    json: ref,
                    params,
                    ref
                });
            }
        });
    };

    /*
        params: {
            n: number,
            offset: number,
            search: string,
            sort: string ('nuisanceFactor', 'created', '_created_at', 'last_login'),
            order: string ('ascending', 'descending')
        }
    */
    API.getUsers = function (params) {
        return this.call('users', {
            method: 'GET',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('USER:LIST', args);
            return args;
        });
    };

    /*
        params: {
            username: string
        }
    */
    API.getUserByUsername = function (params) {
        return this.call(`users/${params.username}/name`, {
            method: 'GET'
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('USER', args);
            return args;
        });
    };

    /*
        params: {
            status: string ('active', 'offline', 'busy', 'ask me', 'join me'),
            statusDescription: string
        }
    */
    API.saveCurrentUser = function (params) {
        return this.call(`users/${this.currentUser.id}`, {
            method: 'PUT',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('USER:CURRENT:SAVE', args);
            return args;
        });
    };

    /*
        params: {
            tags: array[string]
        }
    */
    API.addUserTags = function (params) {
        return this.call(`users/${this.currentUser.id}/addTags`, {
            method: 'POST',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('USER:CURRENT:SAVE', args);
            return args;
        });
    };

    /*
        params: {
            tags: array[string]
        }
    */
    API.removeUserTags = function (params) {
        return this.call(`users/${this.currentUser.id}/removeTags`, {
            method: 'POST',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('USER:CURRENT:SAVE', args);
            return args;
        });
    };

    // API: World

    API.cachedWorlds = new Map();

    API.$on('WORLD', function (args) {
        args.ref = this.applyWorld(args.json);
    });

    API.$on('WORLD:LIST', function (args) {
        for (var json of args.json) {
            this.$emit('WORLD', {
                json,
                params: {
                    worldId: json.id
                }
            });
        }
    });

    API.$on('WORLD:DELETE', function (args) {
        var {json} = args;
        this.cachedWorlds.delete(json.id);
        if ($app.worldDialog.ref.authorId === json.authorId) {
            var map = new Map();
            for (var ref of this.cachedWorlds.values()) {
                if (ref.authorId === json.authorId) {
                    map.set(ref.id, ref);
                }
            }
            var array = Array.from(map.values());
            $app.sortUserDialogWorlds(array);
        }
    });

    API.$on('WORLD:SAVE', function (args) {
        var {json} = args;
        this.$emit('WORLD', {
            json,
            params: {
                worldId: json.id
            }
        });
    });

    API.applyWorld = function (json) {
        var ref = this.cachedWorlds.get(json.id);
        if (typeof ref === 'undefined') {
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
                json,
                params
            };
            this.$emit('WORLD', args);
            return args;
        });
    };

    /*
        params: {
            worldId: string
        }
    */
    API.getCachedWorld = function (params) {
        return new Promise((resolve, reject) => {
            var ref = this.cachedWorlds.get(params.worldId);
            if (typeof ref === 'undefined') {
                this.getWorld(params).catch(reject).then(resolve);
            } else {
                resolve({
                    cache: true,
                    json: ref,
                    params,
                    ref
                });
            }
        });
    };

    /*
        params: {
            n: number,
            offset: number,
            search: string,
            userId: string,
            user: string ('me','friend')
            sort: string ('popularity','heat','trust','shuffle','favorites','reportScore','reportCount','publicationDate','labsPublicationDate','created','_created_at','updated','_updated_at','order'),
            order: string ('ascending','descending'),
            releaseStatus: string ('public','private','hidden','all'),
            featured: boolean
        },
        option: string
    */
    API.getWorlds = function (params, option) {
        var endpoint = 'worlds';
        if (typeof option !== 'undefined') {
            endpoint = `worlds/${option}`;
        }
        return this.call(endpoint, {
            method: 'GET',
            params
        }).then((json) => {
            var args = {
                json,
                params,
                option
            };
            this.$emit('WORLD:LIST', args);
            return args;
        });
    };

    /*
        params: {
            worldId: string
        }
    */
    API.deleteWorld = function (params) {
        return this.call(`worlds/${params.worldId}`, {
            method: 'DELETE'
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('WORLD:DELETE', args);
            return args;
        });
    };

    /*
        params: {
            worldId: string
        }
    */
    API.saveWorld = function (params) {
        return this.call(`worlds/${params.id}`, {
            method: 'PUT',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('WORLD:SAVE', args);
            return args;
        });
    };

    /*
        params: {
            worldId: string,
            instanceId: string
        }
    */
    API.getInstance = function (params) {
        return this.call(`instances/${params.worldId}:${params.instanceId}`, {
            method: 'GET'
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('INSTANCE', args);
            return args;
        });
    };

    /*
        params: {
            worldId: string,
            instanceId: string
        }
    */
    API.selfInvite = function (params) {
        return this.call(
            `instances/${params.worldId}:${params.instanceId}/invite`,
            {
                method: 'POST'
            }
        ).then((json) => {
            var args = {
                json,
                params
            };
            return args;
        });
    };

    API.$on('INSTANCE', function (args) {
        var {json} = args;
        var D = $app.userDialog;
        if ($app.userDialog.visible && D.ref.location === json.id) {
            D.instance = {
                id: json.id,
                occupants: json.n_users
            };
        }
    });

    API.$on('INSTANCE', function (args) {
        var {json} = args;
        var D = $app.worldDialog;
        if ($app.worldDialog.visible && $app.worldDialog.id === json.worldId) {
            for (var instance of D.rooms) {
                if (instance.id === json.instanceId) {
                    instance.occupants = json.n_users;
                    break;
                }
            }
        }
    });

    // API: Friend

    API.$on('FRIEND:LIST', function (args) {
        for (var json of args.json) {
            this.$emit('USER', {
                json,
                params: {
                    userId: json.id
                }
            });
        }
    });

    API.isRefreshFriendsLoading = false;

    API.refreshFriends = async function () {
        this.isRefreshFriendsLoading = true;
        var onlineFriends = await this.refreshOnlineFriends();
        var offlineFriends = await this.refreshOfflineFriends();
        var friends = onlineFriends.concat(offlineFriends);
        this.isRefreshFriendsLoading = false;
        return friends;
    };

    API.refreshOnlineFriends = async function () {
        var friends = [];
        var params = {
            n: 50,
            offset: 0,
            offline: false
        };
        var N =
            this.currentUser.onlineFriends.length +
            this.currentUser.activeFriends.length;
        var count = Math.trunc(N / 50);
        for (var i = count; i > -1; i--) {
            var args = await this.getFriends(params);
            friends = friends.concat(args.json);
            params.offset += 50;
        }
        return friends;
    };

    API.refreshOfflineFriends = async function () {
        var friends = [];
        var params = {
            n: 50,
            offset: 0,
            offline: true
        };
        var onlineCount =
            this.currentUser.onlineFriends.length +
            this.currentUser.activeFriends.length;
        var N = this.currentUser.friends.length - onlineCount;
        var count = Math.trunc(N / 50);
        for (var i = count; i > -1; i--) {
            var args = await this.getFriends(params);
            friends = friends.concat(args.json);
            params.offset += 50;
        }
        return friends;
    };

    /*
        params: {
            n: number,
            offset: number,
            offline: boolean
        }
    */
    API.getFriends = function (params) {
        return this.call('auth/user/friends', {
            method: 'GET',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('FRIEND:LIST', args);
            return args;
        });
    };

    /*
        params: {
            userId: string
        }
    */
    API.deleteFriend = function (params) {
        return this.call(`auth/user/friends/${params.userId}`, {
            method: 'DELETE'
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('FRIEND:DELETE', args);
            return args;
        });
    };

    /*
        params: {
            userId: string
        }
    */
    API.sendFriendRequest = function (params) {
        return this.call(`user/${params.userId}/friendRequest`, {
            method: 'POST'
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('FRIEND:REQUEST', args);
            return args;
        });
    };

    /*
        params: {
            userId: string
        }
    */
    API.cancelFriendRequest = function (params) {
        return this.call(`user/${params.userId}/friendRequest`, {
            method: 'DELETE'
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('FRIEND:REQUEST:CANCEL', args);
            return args;
        });
    };

    API.deleteHiddenFriendRequest = function (params, userId) {
        return this.call(`user/${userId}/friendRequest`, {
            method: 'DELETE',
            params
        }).then((json) => {
            var args = {
                json,
                params,
                userId
            };
            this.$emit('NOTIFICATION:HIDE', args);
            return args;
        });
    };

    /*
        params: {
            userId: string
        }
    */
    API.getFriendStatus = function (params) {
        return this.call(`user/${params.userId}/friendStatus`, {
            method: 'GET'
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('FRIEND:STATUS', args);
            return args;
        });
    };

    // API: Avatar

    API.cachedAvatars = new Map();

    API.$on('AVATAR', function (args) {
        args.ref = this.applyAvatar(args.json);
    });

    API.$on('AVATAR:LIST', function (args) {
        for (var json of args.json) {
            this.$emit('AVATAR', {
                json,
                params: {
                    avatarId: json.id
                }
            });
        }
    });

    API.$on('AVATAR:SAVE', function (args) {
        var {json} = args;
        this.$emit('AVATAR', {
            json,
            params: {
                avatarId: json.id
            }
        });
    });

    API.$on('AVATAR:SELECT', function (args) {
        this.$emit('USER:CURRENT', args);
    });

    API.$on('AVATAR:DELETE', function (args) {
        var {json} = args;
        this.cachedAvatars.delete(json._id);
        if ($app.userDialog.id === json.authorId) {
            var map = new Map();
            for (var ref of this.cachedAvatars.values()) {
                if (ref.authorId === json.authorId) {
                    map.set(ref.id, ref);
                }
            }
            var array = Array.from(map.values());
            $app.sortUserDialogAvatars(array);
        }
    });

    API.applyAvatar = function (json) {
        var ref = this.cachedAvatars.get(json.id);
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                name: '',
                description: '',
                authorId: '',
                authorName: '',
                tags: [],
                assetUrl: '',
                assetUrlObject: {},
                imageUrl: '',
                thumbnailImageUrl: '',
                releaseStatus: '',
                version: 0,
                unityPackages: [],
                unityPackageUrl: '',
                unityPackageUrlObject: {},
                created_at: '',
                updated_at: '',
                ...json
            };
            this.cachedAvatars.set(ref.id, ref);
        } else {
            Object.assign(ref, json);
        }
        return ref;
    };

    /*
        params: {
            avatarId: string
        }
    */
    API.getAvatar = function (params) {
        return this.call(`avatars/${params.avatarId}`, {
            method: 'GET'
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('AVATAR', args);
            return args;
        });
    };

    /*
        params: {
            n: number,
            offset: number,
            search: string,
            userId: string,
            user: string ('me','friends')
            sort: string ('created','updated','order','_created_at','_updated_at'),
            order: string ('ascending','descending'),
            releaseStatus: string ('public','private','hidden','all'),
            featured: boolean
        }
    */
    API.getAvatars = function (params) {
        return this.call('avatars', {
            method: 'GET',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('AVATAR:LIST', args);
            return args;
        });
    };

    /*
        params: {
            id: string
            releaseStatus: string ('public','private'),
        }
    */
    API.saveAvatar = function (params) {
        return this.call(`avatars/${params.id}`, {
            method: 'PUT',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('AVATAR:SAVE', args);
            return args;
        });
    };

    /*
        params: {
            avatarId: string
        }
    */
    API.selectAvatar = function (params) {
        return this.call(`avatars/${params.avatarId}/select`, {
            method: 'PUT',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('AVATAR:SELECT', args);
            return args;
        });
    };

    /*
        params: {
            avatarId: string
        }
    */
    API.selectFallbackAvatar = function (params) {
        return this.call(`avatars/${params.avatarId}/selectfallback`, {
            method: 'PUT',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('AVATAR:SELECT', args);
            return args;
        });
    };

    /*
        params: {
            avatarId: string
        }
    */
    API.deleteAvatar = function (params) {
        return this.call(`avatars/${params.avatarId}`, {
            method: 'DELETE'
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('AVATAR:DELETE', args);
            return args;
        });
    };

    // API: Notification

    API.cachedNotifications = new Map();
    API.isNotificationsLoading = false;

    API.$on('LOGIN', function () {
        this.cachedNotifications.clear();
        this.isNotificationsLoading = false;
    });

    API.$on('NOTIFICATION', function (args) {
        args.ref = this.applyNotification(args.json);
    });

    API.$on('NOTIFICATION:LIST', function (args) {
        for (var json of args.json) {
            this.$emit('NOTIFICATION', {
                json,
                params: {
                    notificationId: json.id
                }
            });
        }
    });

    API.$on('NOTIFICATION:LIST:HIDDEN', function (args) {
        for (var json of args.json) {
            json.type = 'hiddenFriendRequest';
            this.$emit('NOTIFICATION', {
                json,
                params: {
                    notificationId: json.id
                }
            });
        }
    });

    API.$on('NOTIFICATION:ACCEPT', function (args) {
        var ref = this.cachedNotifications.get(args.params.notificationId);
        if (typeof ref === 'undefined' || ref.$isDeleted) {
            return;
        }
        args.ref = ref;
        ref.$isDeleted = true;
        this.$emit('NOTIFICATION:@DELETE', {
            ref,
            params: {
                notificationId: ref.id
            }
        });
        this.$emit('FRIEND:ADD', {
            params: {
                userId: ref.senderUserId
            }
        });
    });

    API.$on('NOTIFICATION:HIDE', function (args) {
        var ref = this.cachedNotifications.get(args.params.notificationId);
        if (typeof ref === 'undefined' && ref.$isDeleted) {
            return;
        }
        args.ref = ref;
        ref.$isDeleted = true;
        this.$emit('NOTIFICATION:@DELETE', {
            ref,
            params: {
                notificationId: ref.id
            }
        });
    });

    API.applyNotification = function (json) {
        var ref = this.cachedNotifications.get(json.id);
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                senderUserId: '',
                senderUsername: '',
                type: '',
                message: '',
                details: {},
                seen: false,
                created_at: '',
                // VRCX
                $isDeleted: false,
                $isExpired: false,
                //
                ...json
            };
            this.cachedNotifications.set(ref.id, ref);
        } else {
            Object.assign(ref, json);
            ref.$isExpired = false;
        }
        if (ref.details !== Object(ref.details)) {
            var details = {};
            if (ref.details !== '{}') {
                try {
                    var object = JSON.parse(ref.details);
                    if (object === Object(object)) {
                        details = object;
                    }
                } catch (err) {}
            }
            ref.details = details;
        }
        return ref;
    };

    API.expireNotifications = function () {
        for (var ref of this.cachedNotifications.values()) {
            ref.$isExpired = true;
            if (
                ref.type === 'friendRequest' ||
                ref.type === 'hiddenFriendRequest'
            ) {
                this.cachedNotifications.delete(ref.id);
            }
        }
    };

    API.deleteExpiredNotifcations = function () {
        for (var ref of this.cachedNotifications.values()) {
            if (ref.$isDeleted || ref.$isExpired === false) {
                continue;
            }
            ref.$isDeleted = true;
            this.$emit('NOTIFICATION:@DELETE', {
                ref,
                params: {
                    notificationId: ref.id
                }
            });
        }
    };

    API.refreshNotifications = async function () {
        this.isNotificationsLoading = true;
        this.expireNotifications();
        var params = {
            n: 100,
            offset: 0
        };
        var count = 50; // 5000 max
        for (var i = 0; i < count; i++) {
            var args = await this.getNotifications(params);
            $app.unseenNotifications = [];
            params.offset += 100;
            if (args.json.length < 100) {
                break;
            }
        }
        var params = {
            n: 100,
            offset: 0
        };
        var count = 50; // 5000 max
        for (var i = 0; i < count; i++) {
            var args = await this.getHiddenFriendRequests(params);
            $app.unseenNotifications = [];
            params.offset += 100;
            if (args.json.length < 100) {
                break;
            }
        }
        this.deleteExpiredNotifcations();
        this.isNotificationsLoading = false;
    };

    /*
        params: {
            n: number,
            offset: number,
            sent: boolean,
            type: string,
            after: string (ISO8601 or 'five_minutes_ago')
        }
    */
    API.getNotifications = function (params) {
        return this.call('auth/user/notifications', {
            method: 'GET',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('NOTIFICATION:LIST', args);
            return args;
        });
    };

    API.getHiddenFriendRequests = function (params) {
        return this.call('auth/user/notifications', {
            method: 'GET',
            params: {
                type: 'friendRequest',
                hidden: true,
                ...params
            }
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('NOTIFICATION:LIST:HIDDEN', args);
            return args;
        });
    };

    API.clearNotifications = function () {
        return this.call('auth/user/notifications/clear', {
            method: 'PUT'
        }).then((json) => {
            var args = {
                json
            };
            // FIXME: NOTIFICATION:CLEAR 핸들링
            this.$emit('NOTIFICATION:CLEAR', args);
            return args;
        });
    };

    /*
        params: {
            receiverUserId: string,
            type: string,
            message: string,
            seen: boolean,
            details: json-string
        }
    */

    API.sendInvite = function (params, receiverUserId) {
        return this.call(`invite/${receiverUserId}`, {
            method: 'POST',
            params
        }).then((json) => {
            var args = {
                json,
                params,
                receiverUserId
            };
            this.$emit('NOTIFICATION:INVITE:SEND', args);
            return args;
        });
    };

    API.sendInvitePhoto = function (params, receiverUserId) {
        return this.call(`invite/${receiverUserId}/photo`, {
            uploadImage: true,
            postData: JSON.stringify(params),
            imageData: $app.uploadImage
        }).then((json) => {
            var args = {
                json,
                params,
                receiverUserId
            };
            this.$emit('NOTIFICATION:INVITE:PHOTO:SEND', args);
            return args;
        });
    };

    API.sendRequestInvite = function (params, receiverUserId) {
        return this.call(`requestInvite/${receiverUserId}`, {
            method: 'POST',
            params
        }).then((json) => {
            var args = {
                json,
                params,
                receiverUserId
            };
            this.$emit('NOTIFICATION:REQUESTINVITE:SEND', args);
            return args;
        });
    };

    API.sendRequestInvitePhoto = function (params, receiverUserId) {
        return this.call(`requestInvite/${receiverUserId}/photo`, {
            uploadImage: true,
            postData: JSON.stringify(params),
            imageData: $app.uploadImage
        }).then((json) => {
            var args = {
                json,
                params,
                receiverUserId
            };
            this.$emit('NOTIFICATION:REQUESTINVITE:PHOTO:SEND', args);
            return args;
        });
    };

    API.sendInviteResponse = function (params, inviteID) {
        return this.call(`invite/${inviteID}/response`, {
            method: 'POST',
            params
        }).then((json) => {
            var args = {
                json,
                params,
                inviteID
            };
            this.$emit('INVITE:RESPONSE:SEND', args);
            return args;
        });
    };

    API.sendInviteResponsePhoto = function (params, inviteID) {
        return this.call(`invite/${inviteID}/response/photo`, {
            uploadImage: true,
            postData: JSON.stringify(params),
            imageData: $app.uploadImage
        }).then((json) => {
            var args = {
                json,
                params,
                inviteID
            };
            this.$emit('INVITE:RESPONSE:PHOTO:SEND', args);
            return args;
        });
    };

    /*
        params: {
            notificationId: string
        }
    */
    API.acceptNotification = function (params) {
        return this.call(
            `auth/user/notifications/${params.notificationId}/accept`,
            {
                method: 'PUT'
            }
        ).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('NOTIFICATION:ACCEPT', args);
            return args;
        });
    };

    /*
        params: {
            notificationId: string
        }
    */
    API.hideNotification = function (params) {
        return this.call(
            `auth/user/notifications/${params.notificationId}/hide`,
            {
                method: 'PUT'
            }
        ).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('NOTIFICATION:HIDE', args);
            return args;
        });
    };

    API.getFriendRequest = function (userId) {
        for (var ref of this.cachedNotifications.values()) {
            if (
                ref.$isDeleted === false &&
                ref.type === 'friendRequest' &&
                ref.senderUserId === userId
            ) {
                return ref.id;
            }
        }
        return '';
    };

    // API: PlayerModeration

    API.cachedPlayerModerations = new Map();
    API.isPlayerModerationsLoading = false;

    API.$on('LOGIN', function () {
        this.cachedPlayerModerations.clear();
        this.isPlayerModerationsLoading = false;
        this.refreshPlayerModerations();
    });

    API.$on('PLAYER-MODERATION', function (args) {
        args.ref = this.applyPlayerModeration(args.json);
    });

    API.$on('PLAYER-MODERATION:LIST', function (args) {
        for (var json of args.json) {
            this.$emit('PLAYER-MODERATION', {
                json,
                params: {
                    playerModerationId: json.id
                }
            });
        }
    });

    API.$on('PLAYER-MODERATION:SEND', function (args) {
        var ref = {
            json: args.json,
            params: {
                playerModerationId: args.json.id
            }
        };
        this.$emit('PLAYER-MODERATION', ref);
        this.$emit('PLAYER-MODERATION:@SEND', ref);
    });

    API.$on('PLAYER-MODERATION:DELETE', function (args) {
        var {type, moderated} = args.params;
        var userId = this.currentUser.id;
        for (var ref of this.cachedPlayerModerations.values()) {
            if (
                ref.$isDeleted === false &&
                ref.type === type &&
                ref.targetUserId === moderated &&
                ref.sourceUserId === userId
            ) {
                ref.$isDeleted = true;
                this.$emit('PLAYER-MODERATION:@DELETE', {
                    ref,
                    params: {
                        playerModerationId: ref.id
                    }
                });
            }
        }
    });

    API.applyPlayerModeration = function (json) {
        var ref = this.cachedPlayerModerations.get(json.id);
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                type: '',
                sourceUserId: '',
                sourceDisplayName: '',
                targetUserId: '',
                targetDisplayName: '',
                created: '',
                // VRCX
                $isDeleted: false,
                $isExpired: false,
                //
                ...json
            };
            this.cachedPlayerModerations.set(ref.id, ref);
        } else {
            Object.assign(ref, json);
            ref.$isExpired = false;
        }
        return ref;
    };

    API.expirePlayerModerations = function () {
        for (var ref of this.cachedPlayerModerations.values()) {
            ref.$isExpired = true;
        }
    };

    API.deleteExpiredPlayerModerations = function () {
        for (var ref of this.cachedPlayerModerations.values()) {
            if (ref.$isDeleted || ref.$isExpired === false) {
                continue;
            }
            ref.$isDeleted = true;
            this.$emit('PLAYER-MODERATION:@DELETE', {
                ref,
                params: {
                    playerModerationId: ref.id
                }
            });
        }
    };

    API.refreshPlayerModerations = function () {
        if (this.isPlayerModerationsLoading) {
            return;
        }
        this.isPlayerModerationsLoading = true;
        this.expirePlayerModerations();
        Promise.all([
            this.getPlayerModerations()
            // this.getPlayerModerationsAgainstMe();
        ])
            .finally(() => {
                this.isPlayerModerationsLoading = false;
            })
            .then(() => {
                this.deleteExpiredPlayerModerations();
            });
    };

    API.getPlayerModerations = function () {
        return this.call('auth/user/playermoderations', {
            method: 'GET'
        }).then((json) => {
            var args = {
                json
            };
            this.$emit('PLAYER-MODERATION:LIST', args);
            return args;
        });
    };

    API.getPlayerModerationsAgainstMe = function () {
        return this.call('auth/user/playermoderated', {
            method: 'GET'
        }).then((json) => {
            var args = {
                json
            };
            this.$emit('PLAYER-MODERATION:LIST', args);
            return args;
        });
    };

    /*
        params: {
            moderated: string,
            type: string
        }
    */
    // old-way: POST auth/user/blocks {blocked:userId}
    API.sendPlayerModeration = function (params) {
        return this.call('auth/user/playermoderations', {
            method: 'POST',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('PLAYER-MODERATION:SEND', args);
            return args;
        });
    };

    /*
        params: {
            moderated: string,
            type: string
        }
    */
    // old-way: PUT auth/user/unblocks {blocked:userId}
    API.deletePlayerModeration = function (params) {
        return this.call('auth/user/unplayermoderate', {
            method: 'PUT',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('PLAYER-MODERATION:DELETE', args);
            return args;
        });
    };

    // API: Favorite

    API.cachedFavorites = new Map();
    API.cachedFavoritesByObjectId = new Map();
    API.cachedFavoriteGroups = new Map();
    API.cachedFavoriteGroupsByTypeName = new Map();
    API.favoriteFriendGroups = [];
    API.favoriteWorldGroups = [];
    API.favoriteAvatarGroups = [];
    API.isFavoriteLoading = false;
    API.isFavoriteGroupLoading = false;

    API.$on('LOGIN', function () {
        this.cachedFavorites.clear();
        this.cachedFavoritesByObjectId.clear();
        this.cachedFavoriteGroups.clear();
        this.cachedFavoriteGroupsByTypeName.clear();
        this.favoriteFriendGroups = [];
        this.favoriteWorldGroups = [];
        this.favoriteAvatarGroups = [];
        this.isFavoriteLoading = false;
        this.isFavoriteGroupLoading = false;
        this.refreshFavorites();
    });

    API.$on('FAVORITE', function (args) {
        var ref = this.applyFavorite(args.json);
        if (ref.$isDeleted) {
            return;
        }
        args.ref = ref;
    });

    API.$on('FAVORITE:@DELETE', function (args) {
        var {ref} = args;
        if (ref.$groupRef !== null) {
            --ref.$groupRef.count;
        }
    });

    API.$on('FAVORITE:LIST', function (args) {
        for (var json of args.json) {
            this.$emit('FAVORITE', {
                json,
                params: {
                    favoriteId: json.id
                }
            });
        }
    });

    API.$on('FAVORITE:ADD', function (args) {
        this.$emit('FAVORITE', {
            json: args.json,
            params: {
                favoriteId: args.json.id
            }
        });
    });

    API.$on('FAVORITE:ADD', function (args) {
        if (
            args.params.type === 'avatar' &&
            !API.cachedAvatars.has(args.params.favoriteId)
        ) {
            this.refreshFavoriteAvatars(args.params.tags);
        }
    });

    API.$on('FAVORITE:DELETE', function (args) {
        var ref = this.cachedFavoritesByObjectId.get(args.params.objectId);
        if (typeof ref === 'undefined') {
            return;
        }
        // 애초에 $isDeleted인데 여기로 올 수 가 있나..?
        this.cachedFavoritesByObjectId.delete(args.params.objectId);
        if (ref.$isDeleted) {
            return;
        }
        args.ref = ref;
        ref.$isDeleted = true;
        API.$emit('FAVORITE:@DELETE', {
            ref,
            params: {
                favoriteId: ref.id
            }
        });
    });

    API.$on('FAVORITE:GROUP', function (args) {
        var ref = this.applyFavoriteGroup(args.json);
        if (ref.$isDeleted) {
            return;
        }
        args.ref = ref;
        if (ref.$groupRef !== null) {
            ref.$groupRef.displayName = ref.displayName;
            ref.$groupRef.visibility = ref.visibility;
        }
    });

    API.$on('FAVORITE:GROUP:LIST', function (args) {
        for (var json of args.json) {
            this.$emit('FAVORITE:GROUP', {
                json,
                params: {
                    favoriteGroupId: json.id
                }
            });
        }
    });

    API.$on('FAVORITE:GROUP:SAVE', function (args) {
        this.$emit('FAVORITE:GROUP', {
            json: args.json,
            params: {
                favoriteGroupId: args.json.id
            }
        });
    });

    API.$on('FAVORITE:GROUP:CLEAR', function (args) {
        var key = `${args.params.type}:${args.params.group}`;
        for (var ref of this.cachedFavorites.values()) {
            if (ref.$isDeleted || ref.$groupKey !== key) {
                continue;
            }
            this.cachedFavoritesByObjectId.delete(ref.favoriteId);
            ref.$isDeleted = true;
            API.$emit('FAVORITE:@DELETE', {
                ref,
                params: {
                    favoriteId: ref.id
                }
            });
        }
    });

    API.$on('FAVORITE:WORLD:LIST', function (args) {
        for (var json of args.json) {
            if (json.id === '???') {
                // FIXME
                // json.favoriteId로 따로 불러와야 하나?
                // 근데 ???가 많으면 과다 요청이 될듯
                continue;
            }
            this.$emit('WORLD', {
                json,
                params: {
                    worldId: json.id
                }
            });
        }
    });

    API.$on('FAVORITE:AVATAR:LIST', function (args) {
        for (var json of args.json) {
            if (json.releaseStatus === 'hidden') {
                // NOTE: 얘는 또 더미 데이터로 옴
                continue;
            }
            this.$emit('AVATAR', {
                json,
                params: {
                    avatarId: json.id
                }
            });
        }
    });

    API.applyFavorite = function (json) {
        var ref = this.cachedFavorites.get(json.id);
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                type: '',
                favoriteId: '',
                tags: [],
                // VRCX
                $isDeleted: false,
                $isExpired: false,
                $groupKey: '',
                $groupRef: null,
                //
                ...json
            };
            this.cachedFavorites.set(ref.id, ref);
            this.cachedFavoritesByObjectId.set(ref.favoriteId, ref);
        } else {
            Object.assign(ref, json);
            ref.$isExpired = false;
        }
        ref.$groupKey = `${ref.type}:${String(ref.tags[0])}`;
        if (ref.$isDeleted === false && ref.$groupRef === null) {
            var group = this.cachedFavoriteGroupsByTypeName.get(ref.$groupKey);
            if (typeof group !== 'undefined') {
                ref.$groupRef = group;
                ++group.count;
            }
        }
        return ref;
    };

    API.expireFavorites = function () {
        for (var ref of this.cachedFavorites.values()) {
            ref.$isExpired = true;
        }
    };

    API.deleteExpiredFavorites = function () {
        for (var ref of this.cachedFavorites.values()) {
            if (ref.$isDeleted || ref.$isExpired === false) {
                continue;
            }
            ref.$isDeleted = true;
            this.$emit('FAVORITE:@DELETE', {
                ref,
                params: {
                    favoriteId: ref.id
                }
            });
        }
    };

    API.refreshFavoriteAvatars = function (tag) {
        var params = {
            n: 100,
            offset: 0,
            tag
        };
        this.getFavoriteAvatars(params);
    };

    API.refreshFavoriteItems = function () {
        var types = {
            world: [0, 'getFavoriteWorlds'],
            avatar: [0, 'getFavoriteAvatars']
        };
        var tags = [];
        for (var ref of this.cachedFavorites.values()) {
            if (ref.$isDeleted) {
                continue;
            }
            var type = types[ref.type];
            if (typeof type === 'undefined') {
                continue;
            }
            if (ref.type === 'avatar' && !tags.includes(ref.tags[0])) {
                tags.push(ref.tags[0]);
            }
            ++type[0];
        }
        for (var type in types) {
            var [N, fn] = types[type];
            if (N > 0) {
                if (type === 'avatar') {
                    for (var tag of tags) {
                        this.bulk({
                            fn,
                            N,
                            params: {
                                n: 100,
                                offset: 0,
                                tag
                            }
                        });
                    }
                } else {
                    this.bulk({
                        fn,
                        N,
                        params: {
                            n: 50,
                            offset: 0
                        }
                    });
                }
            }
        }
    };

    API.refreshFavorites = function () {
        if (this.isFavoriteLoading) {
            return;
        }
        this.isFavoriteLoading = true;
        this.expireFavorites();
        this.bulk({
            fn: 'getFavorites',
            N: -1,
            params: {
                n: 50,
                offset: 0
            },
            done(ok) {
                if (ok) {
                    this.deleteExpiredFavorites();
                }
                this.refreshFavoriteItems();
                this.refreshFavoriteGroups();
                this.isFavoriteLoading = false;
            }
        });
    };

    API.applyFavoriteGroup = function (json) {
        var ref = this.cachedFavoriteGroups.get(json.id);
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                ownerId: '',
                ownerDisplayName: '',
                name: '',
                displayName: '',
                type: '',
                visibility: '',
                tags: [],
                // VRCX
                $isDeleted: false,
                $isExpired: false,
                $groupRef: null,
                //
                ...json
            };
            this.cachedFavoriteGroups.set(ref.id, ref);
        } else {
            Object.assign(ref, json);
            ref.$isExpired = false;
        }
        return ref;
    };

    API.buildFavoriteGroups = function () {
        // 192 = ['group_0', 'group_1', 'group_2'] x 64
        this.favoriteFriendGroups = [];
        for (var i = 0; i < 3; ++i) {
            this.favoriteFriendGroups.push({
                assign: false,
                key: `friend:group_${i}`,
                type: 'friend',
                name: `group_${i}`,
                displayName: `Group ${i + 1}`,
                capacity: 64,
                count: 0,
                visibility: 'private'
            });
        }
        // 256 = ['worlds1', 'worlds2', 'worlds3', 'worlds4'] x 64
        this.favoriteWorldGroups = [];
        for (var i = 0; i < 4; ++i) {
            this.favoriteWorldGroups.push({
                assign: false,
                key: `world:worlds${i + 1}`,
                type: 'world',
                name: `worlds${i + 1}`,
                displayName: `Group ${i + 1}`,
                capacity: 64,
                count: 0,
                visibility: 'private'
            });
        }
        // 100 = ['avatars1'] x 25
        // Favorite Avatars (0/25)
        // VRC+ Group 1 (0/25)
        // VRC+ Group 2 (0/25)
        // VRC+ Group 3 (0/25)
        var avatarGroupNames = [
            'Favorite Avatars',
            'VRC+ Group 1',
            'VRC+ Group 2',
            'VRC+ Group 3'
        ];
        this.favoriteAvatarGroups = [];
        for (var i = 0; i < 4; ++i) {
            this.favoriteAvatarGroups.push({
                assign: false,
                key: `avatar:avatars${i + 1}`,
                type: 'avatar',
                name: `avatars${i + 1}`,
                displayName: avatarGroupNames[i],
                capacity: 25,
                count: 0,
                visibility: 'private'
            });
        }
        var types = {
            friend: this.favoriteFriendGroups,
            world: this.favoriteWorldGroups,
            avatar: this.favoriteAvatarGroups
        };
        var assigns = new Set();
        // assign the same name first
        for (var ref of this.cachedFavoriteGroups.values()) {
            if (ref.$isDeleted) {
                continue;
            }
            var groups = types[ref.type];
            if (typeof groups === 'undefined') {
                continue;
            }
            for (var group of groups) {
                if (group.assign === false && group.name === ref.name) {
                    group.assign = true;
                    if (ref.type !== 'avatar') {
                        group.displayName = ref.displayName;
                    }
                    group.visibility = ref.visibility;
                    ref.$groupRef = group;
                    assigns.add(ref.id);
                    break;
                }
            }
        }
        // assign the rest
        // FIXME
        // The order (cachedFavoriteGroups) is very important. It should be
        // processed in the order in which the server responded. But since we
        // used Map(), the order would be a mess. So we need something to solve
        // this.
        for (var ref of this.cachedFavoriteGroups.values()) {
            if (ref.$isDeleted || assigns.has(ref.id)) {
                continue;
            }
            var groups = types[ref.type];
            if (typeof groups === 'undefined') {
                continue;
            }
            for (var group of groups) {
                if (group.assign === false) {
                    group.assign = true;
                    group.key = `${group.type}:${ref.name}`;
                    group.name = ref.name;
                    if (ref.type !== 'avatar') {
                        group.displayName = ref.displayName;
                    }
                    ref.$groupRef = group;
                    assigns.add(ref.id);
                    break;
                }
            }
        }
        // update favorites
        this.cachedFavoriteGroupsByTypeName.clear();
        for (var type in types) {
            for (var group of types[type]) {
                this.cachedFavoriteGroupsByTypeName.set(group.key, group);
            }
        }
        for (var ref of this.cachedFavorites.values()) {
            ref.$groupRef = null;
            if (ref.$isDeleted) {
                continue;
            }
            var group = this.cachedFavoriteGroupsByTypeName.get(ref.$groupKey);
            if (typeof group === 'undefined') {
                continue;
            }
            ref.$groupRef = group;
            ++group.count;
        }
    };

    API.expireFavoriteGroups = function () {
        for (var ref of this.cachedFavoriteGroups.values()) {
            ref.$isExpired = true;
        }
    };

    API.deleteExpiredFavoriteGroups = function () {
        for (var ref of this.cachedFavoriteGroups.values()) {
            if (ref.$isDeleted || ref.$isExpired === false) {
                continue;
            }
            ref.$isDeleted = true;
            this.$emit('FAVORITE:GROUP:@DELETE', {
                ref,
                params: {
                    favoriteGroupId: ref.id
                }
            });
        }
    };

    API.refreshFavoriteGroups = function () {
        if (this.isFavoriteGroupLoading) {
            return;
        }
        this.isFavoriteGroupLoading = true;
        this.expireFavoriteGroups();
        this.bulk({
            fn: 'getFavoriteGroups',
            N: -1,
            params: {
                n: 50,
                offset: 0
            },
            done(ok) {
                if (ok) {
                    this.deleteExpiredFavoriteGroups();
                    this.buildFavoriteGroups();
                }
                this.isFavoriteGroupLoading = false;
            }
        });
    };

    /*
        params: {
            n: number,
            offset: number,
            type: string,
            tag: string
        }
    */
    API.getFavorites = function (params) {
        return this.call('favorites', {
            method: 'GET',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('FAVORITE:LIST', args);
            return args;
        });
    };

    /*
        params: {
            type: string,
            favoriteId: string (objectId),
            tags: string
        }
    */
    API.addFavorite = function (params) {
        return this.call('favorites', {
            method: 'POST',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('FAVORITE:ADD', args);
            return args;
        });
    };

    /*
        params: {
            objectId: string
        }
    */
    API.deleteFavorite = function (params) {
        return this.call(`favorites/${params.objectId}`, {
            method: 'DELETE'
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('FAVORITE:DELETE', args);
            return args;
        });
    };

    /*
        params: {
            n: number,
            offset: number,
            type: string
        }
    */
    API.getFavoriteGroups = function (params) {
        return this.call('favorite/groups', {
            method: 'GET',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('FAVORITE:GROUP:LIST', args);
            return args;
        });
    };

    /*
        params: {
            type: string,
            group: string (name),
            displayName: string,
            visibility: string
        }
    */
    API.saveFavoriteGroup = function (params) {
        return this.call(
            `favorite/group/${params.type}/${params.group}/${this.currentUser.id}`,
            {
                method: 'PUT',
                params
            }
        ).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('FAVORITE:GROUP:SAVE', args);
            return args;
        });
    };

    /*
        params: {
            type: string,
            group: string (name)
        }
    */
    API.clearFavoriteGroup = function (params) {
        return this.call(
            `favorite/group/${params.type}/${params.group}/${this.currentUser.id}`,
            {
                method: 'DELETE',
                params
            }
        ).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('FAVORITE:GROUP:CLEAR', args);
            return args;
        });
    };

    /*
        params: {
            n: number,
            offset: number
        }
    */
    API.getFavoriteWorlds = function (params) {
        return this.call('worlds/favorites', {
            method: 'GET',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('FAVORITE:WORLD:LIST', args);
            return args;
        });
    };

    /*
        params: {
            n: number,
            offset: number
        }
    */
    API.getFavoriteAvatars = function (params) {
        return this.call('avatars/favorites', {
            method: 'GET',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('FAVORITE:AVATAR:LIST', args);
            return args;
        });
    };

    // API: WebSocket

    API.webSocket = null;

    API.$on('LOGOUT', function () {
        this.closeWebSocket();
    });

    API.$on('USER:CURRENT', function () {
        if ($app.friendLogInitStatus && this.webSocket === null) {
            this.getAuth();
        }
    });

    API.$on('AUTH', function (args) {
        if (args.json.ok) {
            this.connectWebSocket(args.json.token);
        }
    });

    API.$on('PIPELINE', function (args) {
        var {type, content} = args.json;
        if (typeof content.user !== 'undefined') {
            delete content.user.state;
        }
        switch (type) {
            case 'notification':
                this.$emit('NOTIFICATION', {
                    json: content,
                    params: {
                        notificationId: content.id
                    }
                });
                break;

            case 'see-notification':
                this.$emit('NOTIFICATION:SEE', {
                    params: {
                        notificationId: content
                    }
                });
                break;

            case 'hide-notification':
                this.$emit('NOTIFICATION:SEE', {
                    params: {
                        notificationId: content
                    }
                });
                break;

            case 'friend-add':
                this.$emit('USER', {
                    json: content.user,
                    params: {
                        userId: content.userId
                    }
                });
                this.$emit('FRIEND:ADD', {
                    params: {
                        userId: content.userId
                    }
                });
                break;

            case 'friend-delete':
                this.$emit('FRIEND:DELETE', {
                    params: {
                        userId: content.userId
                    }
                });
                break;

            case 'friend-online':
                if (content.location !== 'private') {
                    this.$emit('WORLD', {
                        json: content.world,
                        params: {
                            worldId: content.world.id
                        }
                    });
                }
                this.$emit('USER', {
                    json: {
                        location: content.location,
                        ...content.user
                    },
                    params: {
                        userId: content.userId
                    }
                });
                this.$emit('FRIEND:STATE', {
                    json: {
                        state: 'online'
                    },
                    params: {
                        userId: content.userId
                    }
                });
                break;

            case 'friend-active':
                this.$emit('USER', {
                    json: content.user,
                    params: {
                        userId: content.userId
                    }
                });
                this.$emit('FRIEND:STATE', {
                    json: {
                        state: 'active'
                    },
                    params: {
                        userId: content.userId
                    }
                });
                break;

            case 'friend-offline':
                this.$emit('FRIEND:STATE', {
                    json: {
                        state: 'offline'
                    },
                    params: {
                        userId: content.userId
                    }
                });
                break;

            case 'friend-update':
                this.$emit('USER', {
                    json: content.user,
                    params: {
                        userId: content.userId
                    }
                });
                break;

            case 'friend-location':
                if (content.location !== 'private') {
                    this.$emit('WORLD', {
                        json: content.world,
                        params: {
                            worldId: content.world.id
                        }
                    });
                }
                if (content.userId === this.currentUser.id) {
                    this.$emit('USER', {
                        json: content.user,
                        params: {
                            userId: content.userId
                        }
                    });
                } else {
                    this.$emit('USER', {
                        json: {
                            location: content.location,
                            ...content.user
                        },
                        params: {
                            userId: content.userId
                        }
                    });
                }
                break;

            case 'user-update':
                this.$emit('USER:CURRENT', {
                    json: content.user,
                    params: {
                        userId: content.userId
                    }
                });
                break;

            case 'user-location':
                if (content.world === Object(content.world)) {
                    this.$emit('WORLD', {
                        json: content.world,
                        params: {
                            worldId: content.world.id
                        }
                    });
                }
                this.$emit('USER', {
                    json: {
                        id: content.userId,
                        location: content.location
                    },
                    params: {
                        userId: content.userId
                    }
                });
                break;
        }
    });

    API.getAuth = function () {
        return this.call('auth', {
            method: 'GET'
        }).then((json) => {
            var args = {
                json
            };
            this.$emit('AUTH', args);
            return args;
        });
    };

    API.connectWebSocket = function (token) {
        if (this.webSocket === null) {
            var socket = new WebSocket(
                `wss://pipeline.vrchat.cloud/?auth=${token}`
            );
            socket.onclose = () => {
                if (this.webSocket === socket) {
                    this.webSocket = null;
                }
                try {
                    socket.close();
                } catch (err) {}
            };
            socket.onerror = socket.onclose;
            socket.onmessage = ({data}) => {
                try {
                    var json = JSON.parse(data);
                    try {
                        json.content = JSON.parse(json.content);
                    } catch (err) {}
                    this.$emit('PIPELINE', {
                        json
                    });
                    if ($app.debugWebSocket && json.content) {
                        var displayName = '';
                        var user = this.cachedUsers.get(json.content.userId);
                        if (user) {
                            displayName = user.displayName;
                        }
                        console.log(
                            'WebSocket',
                            json.type,
                            displayName,
                            json.content
                        );
                    }
                } catch (err) {
                    console.error(err);
                }
            };
            this.webSocket = socket;
        }
    };

    API.closeWebSocket = function () {
        var socket = this.webSocket;
        if (socket === null) {
            return;
        }
        this.webSocket = null;
        try {
            socket.close();
        } catch (err) {}
    };

    // API: Visit

    API.getVisits = function () {
        return this.call('visits', {
            method: 'GET'
        }).then((json) => {
            var args = {
                json
            };
            this.$emit('VISITS', args);
            return args;
        });
    };

    // API

    var extractFileId = (s) => {
        var match = String(s).match(/file_[0-9A-Za-z-]+/);
        return match ? match[0] : '';
    };

    var extractFileVersion = (s) => {
        var match = /(?:\/file_[0-9A-Za-z-]+\/)([0-9]+)/gi.exec(s);
        return match ? match[1] : '';
    };

    var buildTreeData = (json) => {
        var node = [];
        for (var key in json) {
            var value = json[key];
            if (Array.isArray(value)) {
                node.push({
                    children: value.map((val, idx) => {
                        if (val === Object(val)) {
                            return {
                                children: buildTreeData(val),
                                key: idx
                            };
                        }
                        return {
                            key: idx,
                            value: val
                        };
                    }),
                    key
                });
            } else if (value === Object(value)) {
                node.push({
                    children: buildTreeData(value),
                    key
                });
            } else {
                node.push({
                    key,
                    value: String(value)
                });
            }
        }
        node.sort(function (a, b) {
            var A = String(a.key).toUpperCase();
            var B = String(b.key).toUpperCase();
            if (A < B) {
                return -1;
            }
            if (A > B) {
                return 1;
            }
            return 0;
        });
        return node;
    };

    // Misc

    var $timers = [];

    Vue.component('timer', {
        template: '<span v-text="text"></span>',
        props: {
            epoch: {
                type: Number,
                default() {
                    return Date.now();
                }
            }
        },
        data() {
            return {
                text: ''
            };
        },
        methods: {
            update() {
                this.text = timeToText(Date.now() - this.epoch);
            }
        },
        watch: {
            date() {
                this.update();
            }
        },
        mounted() {
            $timers.push(this);
            this.update();
        },
        destroyed() {
            removeFromArray($timers, this);
        }
    });

    setInterval(function () {
        for (var $timer of $timers) {
            $timer.update();
        }
    }, 5000);

    // Countdown timer

    var $countDownTimers = [];

    Vue.component('countdown-timer', {
        template: '<span v-text="text"></span>',
        props: {
            datetime: {
                type: String,
                default() {
                    return '';
                }
            },
            hours: {
                type: Number,
                default() {
                    return 1;
                }
            }
        },
        data() {
            return {
                text: ''
            };
        },
        methods: {
            update() {
                var epoch =
                    new Date(this.datetime).getTime() +
                    1000 * 60 * 60 * this.hours -
                    Date.now();
                if (epoch >= 0) {
                    this.text = timeToText(epoch);
                } else {
                    this.text = '';
                }
            }
        },
        watch: {
            date() {
                this.update();
            }
        },
        mounted() {
            $countDownTimers.push(this);
            this.update();
        },
        destroyed() {
            removeFromArray($countDownTimers, this);
        }
    });

    setInterval(function () {
        for (var $countDownTimer of $countDownTimers) {
            $countDownTimer.update();
        }
    }, 5000);

    // initialise

    var $app = {
        data: {
            API,
            nextCurrentUserRefresh: 0,
            nextFriendsRefresh: 0,
            nextAppUpdateCheck: 0,
            isGameRunning: false,
            isGameNoVR: false,
            appVersion,
            latestAppVersion: '',
            ossDialog: false,
            exportFriendsListDialog: false,
            exportFriendsListContent: ''
        },
        computed: {},
        methods: {},
        watch: {},
        el: '#x-app',
        mounted() {
            API.$on('SHOW_WORLD_DIALOG', (tag) => this.showWorldDialog(tag));
            API.$on('SHOW_LAUNCH_DIALOG', (tag) => this.showLaunchDialog(tag));
            this.updateLoop();
            this.getGameLogTable();
            this.$nextTick(function () {
                this.$el.style.display = '';
                if (!this.enablePrimaryPassword) {
                    this.loginForm.loading = true;
                    API.getConfig()
                        .catch((err) => {
                            this.loginForm.loading = false;
                            throw err;
                        })
                        .then((args) => {
                            API.getCurrentUser().finally(() => {
                                this.loginForm.loading = false;
                            });
                            return args;
                        });
                } else {
                    this.loginForm.loading = false;
                }
            });
        }
    };

    $app.methods.openExternalLink = function (link) {
        this.$confirm(`${link}`, 'Open External Link', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    AppApi.OpenLink(link);
                }
            }
        });
    };

    $app.methods.languageClass = function (language) {
        var style = {};
        var mapping = languageMappings[language];
        if (typeof mapping !== 'undefined') {
            style[mapping] = true;
        }
        return style;
    };

    $app.methods.updateLoop = function () {
        try {
            if (API.isLoggedIn === true) {
                if (--this.nextCurrentUserRefresh <= 0) {
                    this.nextCurrentUserRefresh = 60; // 30secs
                    API.getCurrentUser().catch((err1) => {
                        throw err1;
                    });
                }
                if (--this.nextFriendsRefresh <= 0) {
                    this.nextFriendsRefresh = 7200; // 1hour
                    API.refreshFriends();
                    if (this.isGameRunning) {
                        API.refreshPlayerModerations();
                    }
                }
                if (--this.nextAppUpdateCheck <= 0) {
                    this.nextAppUpdateCheck = 43200; // 6hours
                    if (this.autoUpdateVRCX !== 'Off') {
                        this.checkForVRCXUpdate();
                    }
                }
                AppApi.CheckGameRunning().then(
                    ([isGameRunning, isGameNoVR]) => {
                        this.updateOpenVR(isGameRunning, isGameNoVR);
                        if (isGameRunning !== this.isGameRunning) {
                            this.isGameRunning = isGameRunning;
                            if (isGameRunning) {
                                API.currentUser.$online_for = Date.now();
                                API.currentUser.$offline_for = '';
                            } else {
                                API.currentUser.$online_for = '';
                                API.currentUser.$offline_for = Date.now();
                                Discord.SetActive(false);
                                this.autoVRChatCacheManagement();
                            }
                            this.lastLocationReset();
                            this.clearNowPlaying();
                            this.updateVRConfigVars();
                        }
                        if (isGameNoVR !== this.isGameNoVR) {
                            this.isGameNoVR = isGameNoVR;
                            this.updateVRConfigVars();
                        }
                        this.updateDiscord();
                    }
                );
            }
        } catch (err) {
            console.error(err);
        }
        setTimeout(() => this.updateLoop(), 500);
    };

    $app.data.debug = false;
    $app.data.debugWebRequests = false;
    $app.data.debugWebSocket = false;

    $app.data.APILastOnline = new Map();

    $app.data.sharedFeed = {
        gameLog: {
            wrist: [],
            lastEntryDate: ''
        },
        feedTable: {
            wrist: [],
            lastEntryDate: ''
        },
        notificationTable: {
            wrist: [],
            lastEntryDate: ''
        },
        friendLogTable: {
            wrist: [],
            lastEntryDate: ''
        },
        pendingUpdate: false
    };

    $app.methods.updateSharedFeed = function (forceUpdate) {
        if (!this.friendLogInitStatus) {
            return;
        }
        this.updateSharedFeedGameLog(forceUpdate);
        this.updateSharedFeedFeedTable(forceUpdate);
        this.updateSharedFeedNotificationTable(forceUpdate);
        this.updateSharedFeedFriendLogTable(forceUpdate);
        var feeds = this.sharedFeed;
        if (!feeds.pendingUpdate) {
            return;
        }
        var wristFeed = [];
        wristFeed = wristFeed.concat(
            feeds.gameLog.wrist,
            feeds.feedTable.wrist,
            feeds.notificationTable.wrist,
            feeds.friendLogTable.wrist
        );
        // OnPlayerJoining
        var L = API.parseLocation(this.lastLocation.location); // WebSocket dosen't update friend only instances
        var locationBias = Date.now() - 30000; // 30 seconds
        if (
            this.isGameRunning &&
            L.accessType !== 'friends' &&
            this.lastLocation.date < locationBias &&
            (this.sharedFeedFilters.wrist.OnPlayerJoining === 'Friends' ||
                this.sharedFeedFilters.wrist.OnPlayerJoining === 'VIP' ||
                this.sharedFeedFilters.noty.OnPlayerJoining === 'Friends' ||
                this.sharedFeedFilters.noty.OnPlayerJoining === 'VIP')
        ) {
            var joiningMap = [];
            var bias = new Date(Date.now() - 120000).toJSON(); // 2 minutes
            var feedTable = this.feedTable.data;
            for (var i = feedTable.length - 1; i > -1; i--) {
                var ctx = feedTable[i];
                if (ctx.created_at < bias) {
                    break;
                }
                if (
                    ctx.type === 'GPS' &&
                    ctx.location === this.lastLocation.location
                ) {
                    if (joiningMap[ctx.displayName]) {
                        continue;
                    }
                    joiningMap[ctx.displayName] = ctx.created_at;
                    if (API.cachedUsers.has(ctx.userId)) {
                        var user = API.cachedUsers.get(ctx.userId);
                        if (ctx.location !== user.location) {
                            continue;
                        }
                    }
                    var playersInInstance = this.lastLocation.playerList;
                    if (playersInInstance.has(ctx.displayName)) {
                        continue;
                    }
                    var joining = true;
                    var gameLogTable = this.gameLogTable.data;
                    for (var k = gameLogTable.length - 1; k > -1; k--) {
                        var gameLogItem = gameLogTable[k];
                        if (
                            gameLogItem.type === 'Location' ||
                            gameLogItem.created_at < bias
                        ) {
                            break;
                        }
                        if (
                            gameLogItem.type === 'OnPlayerJoined' &&
                            gameLogItem.displayName === ctx.displayName
                        ) {
                            joining = false;
                            break;
                        }
                    }
                    if (joining) {
                        var isFriend = this.friends.has(ctx.userId);
                        var isFavorite = API.cachedFavoritesByObjectId.has(
                            ctx.userId
                        );
                        var onPlayerJoining = {
                            ...ctx,
                            isFriend,
                            isFavorite,
                            type: 'OnPlayerJoining'
                        };
                        if (
                            this.sharedFeedFilters.wrist.OnPlayerJoining ===
                                'Friends' ||
                            (this.sharedFeedFilters.wrist.OnPlayerJoining ===
                                'VIP' &&
                                isFavorite)
                        ) {
                            wristFeed.unshift(onPlayerJoining);
                        }
                        this.queueFeedNoty(onPlayerJoining);
                    }
                }
            }
        }
        wristFeed.sort(function (a, b) {
            if (a.created_at < b.created_at) {
                return 1;
            }
            if (a.created_at > b.created_at) {
                return -1;
            }
            return 0;
        });
        wristFeed.splice(20);
        AppApi.ExecuteVrFeedFunction(
            'wristFeedUpdate',
            JSON.stringify(wristFeed)
        );
        if (this.userDialog.visible) {
            this.applyUserDialogLocation();
        }
        if (this.worldDialog.visible) {
            this.applyWorldDialogInstances();
        }
        feeds.pendingUpdate = false;
    };

    $app.methods.updateSharedFeedGameLog = function (forceUpdate) {
        // Location, OnPlayerJoined, OnPlayerLeft
        var {data} = this.gameLogTable;
        var i = data.length;
        if (i > 0) {
            if (
                data[i - 1].created_at ===
                    this.sharedFeed.gameLog.lastEntryDate &&
                forceUpdate === false
            ) {
                return;
            }
            this.sharedFeed.gameLog.lastEntryDate = data[i - 1].created_at;
        } else {
            return;
        }
        var bias = new Date(Date.now() - 86400000).toJSON(); // 24 hours
        var wristArr = [];
        var w = 0;
        var wristFilter = this.sharedFeedFilters.wrist;
        var currentUserLeaveTime = 0;
        var locationJoinTime = 0;
        for (var i = data.length - 1; i > -1; i--) {
            var ctx = data[i];
            if (ctx.created_at < bias) {
                break;
            }
            if (ctx.type === 'Notification') {
                continue;
            }
            // on Location change remove OnPlayerLeft
            if (ctx.type === 'LocationDestination') {
                currentUserLeaveTime = Date.parse(ctx.created_at);
                for (var k = w - 1; k > -1; k--) {
                    var feedItem = wristArr[k];
                    if (
                        feedItem.type === 'OnPlayerLeft' &&
                        Date.parse(feedItem.created_at) >=
                            currentUserLeaveTime &&
                        Date.parse(feedItem.created_at) <=
                            currentUserLeaveTime + 5 * 1000
                    ) {
                        wristArr.splice(k, 1);
                        w--;
                    }
                }
            }
            // on Location change remove OnPlayerJoined
            if (ctx.type === 'Location') {
                locationJoinTime = Date.parse(ctx.created_at);
                for (var k = w - 1; k > -1; k--) {
                    var feedItem = wristArr[k];
                    if (
                        feedItem.type === 'OnPlayerJoined' &&
                        Date.parse(feedItem.created_at) >= locationJoinTime &&
                        Date.parse(feedItem.created_at) <=
                            locationJoinTime + 20 * 1000
                    ) {
                        wristArr.splice(k, 1);
                        w--;
                    }
                }
            }
            // remove current user
            if (
                (ctx.type === 'OnPlayerJoined' ||
                    ctx.type === 'OnPlayerLeft' ||
                    ctx.type === 'PortalSpawn') &&
                ctx.displayName === API.currentUser.displayName
            ) {
                continue;
            }
            var isFriend = false;
            var isFavorite = false;
            if (ctx.userId) {
                isFriend = this.friends.has(ctx.userId);
                isFavorite = API.cachedFavoritesByObjectId.has(ctx.userId);
            } else if (ctx.displayName) {
                for (var ref of API.cachedUsers.values()) {
                    if (ref.displayName === ctx.displayName) {
                        isFriend = this.friends.has(ref.id);
                        isFavorite = API.cachedFavoritesByObjectId.has(ref.id);
                        break;
                    }
                }
            }
            // BlockedOnPlayerJoined, BlockedOnPlayerLeft, MutedOnPlayerJoined, MutedOnPlayerLeft
            if (ctx.type === 'OnPlayerJoined' || ctx.type === 'OnPlayerLeft') {
                for (var ref of this.playerModerationTable.data) {
                    if (ref.targetDisplayName === ctx.displayName) {
                        if (ref.type === 'block') {
                            var type = `Blocked${ctx.type}`;
                        } else if (ref.type === 'mute') {
                            var type = `Muted${ctx.type}`;
                        } else {
                            continue;
                        }
                        var entry = {
                            created_at: ctx.created_at,
                            type,
                            displayName: ref.targetDisplayName,
                            userId: ref.targetUserId,
                            isFriend,
                            isFavorite
                        };
                        if (
                            wristFilter[type] &&
                            (wristFilter[type] === 'Everyone' ||
                                (wristFilter[type] === 'Friends' && isFriend) ||
                                (wristFilter[type] === 'VIP' && isFavorite))
                        ) {
                            wristArr.unshift(entry);
                        }
                        this.queueFeedNoty(entry);
                    }
                }
            }
            if (
                w < 20 &&
                wristFilter[ctx.type] &&
                (wristFilter[ctx.type] === 'On' ||
                    wristFilter[ctx.type] === 'Everyone' ||
                    (wristFilter[ctx.type] === 'Friends' && isFriend) ||
                    (wristFilter[ctx.type] === 'VIP' && isFavorite))
            ) {
                wristArr.push({
                    ...ctx,
                    isFriend,
                    isFavorite
                });
                ++w;
            }
        }
        this.sharedFeed.gameLog.wrist = wristArr;
        this.sharedFeed.pendingUpdate = true;
    };

    $app.methods.queueGameLogNoty = function (noty) {
        // remove join/leave notifications when switching worlds
        if (noty.type === 'OnPlayerJoined') {
            var bias = this.lastLocation.date + 30 * 1000; // 30 secs
            if (Date.parse(noty.created_at) <= bias) {
                return;
            }
        }
        if (noty.type === 'OnPlayerLeft') {
            var bias = this.lastLocationDestinationTime + 5 * 1000; // 5 secs
            if (Date.parse(noty.created_at) <= bias) {
                return;
            }
        }
        if (
            noty.type === 'Notification' ||
            noty.type === 'LocationDestination'
            // skip unused entries
        ) {
            return;
        }
        if (noty.type === 'VideoPlay') {
            if (!noty.videoName || noty.videoUrl === this.nowPlaying.url) {
                // skip video without name
                // skip video already playing
                return;
            }
            noty.notyName = noty.videoName;
            if (noty.displayName) {
                // add requester's name to noty
                noty.notyName = `${noty.videoName} (${noty.displayName})`;
            }
        }
        if (
            noty.type !== 'VideoPlay' &&
            noty.displayName === API.currentUser.displayName
        ) {
            // remove current user
            return;
        }
        noty.isFriend = false;
        noty.isFavorite = false;
        if (noty.userId) {
            noty.isFriend = this.friends.has(noty.userId);
            noty.isFavorite = API.cachedFavoritesByObjectId.has(noty.userId);
        } else if (noty.displayName) {
            for (var ref of API.cachedUsers.values()) {
                if (ref.displayName === noty.displayName) {
                    noty.isFriend = this.friends.has(ref.id);
                    noty.isFavorite = API.cachedFavoritesByObjectId.has(ref.id);
                    break;
                }
            }
        }
        var notyFilter = this.sharedFeedFilters.noty;
        if (
            notyFilter[noty.type] &&
            (notyFilter[noty.type] === 'On' ||
                notyFilter[noty.type] === 'Everyone' ||
                (notyFilter[noty.type] === 'Friends' && noty.isFriend) ||
                (notyFilter[noty.type] === 'VIP' && noty.isFavorite))
        ) {
            this.playNoty(noty);
        }
    };

    $app.methods.updateSharedFeedFeedTable = function (forceUpdate) {
        // GPS, Online, Offline, Status, Avatar
        var {data} = this.feedTable;
        var i = data.length;
        if (i > 0) {
            if (
                data[i - 1].created_at ===
                    this.sharedFeed.feedTable.lastEntryDate &&
                forceUpdate === false
            ) {
                return;
            }
            this.sharedFeed.feedTable.lastEntryDate = data[i - 1].created_at;
        } else {
            return;
        }
        var bias = new Date(Date.now() - 86400000).toJSON(); // 24 hours
        var wristArr = [];
        var w = 0;
        var wristFilter = this.sharedFeedFilters.wrist;
        for (var i = data.length - 1; i > -1; i--) {
            var ctx = data[i];
            if (ctx.created_at < bias) {
                break;
            }
            if (ctx.type === 'Avatar') {
                continue;
            }
            // hide private worlds from feed
            if (
                this.hidePrivateFromFeed &&
                ctx.type === 'GPS' &&
                ctx.location === 'private'
            ) {
                continue;
            }
            var isFriend = this.friends.has(ctx.userId);
            var isFavorite = API.cachedFavoritesByObjectId.has(ctx.userId);
            if (
                w < 20 &&
                wristFilter[ctx.type] &&
                (wristFilter[ctx.type] === 'Friends' ||
                    (wristFilter[ctx.type] === 'VIP' && isFavorite))
            ) {
                wristArr.push({
                    ...ctx,
                    isFriend,
                    isFavorite
                });
                ++w;
            }
        }
        this.sharedFeed.feedTable.wrist = wristArr;
        this.sharedFeed.pendingUpdate = true;
    };

    $app.methods.queueFeedNoty = function (noty) {
        if (noty.type === 'Avatar') {
            return;
        }
        // hide private worlds from feed
        if (
            this.hidePrivateFromFeed &&
            noty.type === 'GPS' &&
            noty.location === 'private'
        ) {
            return;
        }
        noty.isFriend = this.friends.has(noty.userId);
        noty.isFavorite = API.cachedFavoritesByObjectId.has(noty.userId);
        var notyFilter = this.sharedFeedFilters.noty;
        if (
            notyFilter[noty.type] &&
            (notyFilter[noty.type] === 'Friends' ||
                (notyFilter[noty.type] === 'VIP' && noty.isFavorite))
        ) {
            this.playNoty(noty);
        }
    };

    $app.methods.updateSharedFeedNotificationTable = function (forceUpdate) {
        // invite, requestInvite, requestInviteResponse, inviteResponse, friendRequest
        var {data} = this.notificationTable;
        var i = data.length;
        if (i > 0) {
            if (
                data[i - 1].created_at ===
                    this.sharedFeed.notificationTable.lastEntryDate &&
                forceUpdate === false
            ) {
                return;
            }
            this.sharedFeed.notificationTable.lastEntryDate =
                data[i - 1].created_at;
        } else {
            return;
        }
        var bias = new Date(Date.now() - 86400000).toJSON(); // 24 hours
        var wristArr = [];
        var w = 0;
        var wristFilter = this.sharedFeedFilters.wrist;
        for (var i = data.length - 1; i > -1; i--) {
            var ctx = data[i];
            if (ctx.created_at < bias) {
                break;
            }
            if (ctx.senderUserId === API.currentUser.id) {
                continue;
            }
            var isFriend = this.friends.has(ctx.senderUserId);
            var isFavorite = API.cachedFavoritesByObjectId.has(
                ctx.senderUserId
            );
            if (
                w < 20 &&
                wristFilter[ctx.type] &&
                (wristFilter[ctx.type] === 'On' ||
                    wristFilter[ctx.type] === 'Friends' ||
                    (wristFilter[ctx.type] === 'VIP' && isFavorite))
            ) {
                wristArr.push({
                    ...ctx,
                    isFriend,
                    isFavorite
                });
                ++w;
            }
        }
        this.sharedFeed.notificationTable.wrist = wristArr;
        this.sharedFeed.pendingUpdate = true;
    };

    $app.methods.queueNotificationNoty = function (noty) {
        if (noty.senderUserId === API.currentUser.id) {
            return;
        }
        noty.isFriend = this.friends.has(noty.senderUserId);
        noty.isFavorite = API.cachedFavoritesByObjectId.has(noty.senderUserId);
        var notyFilter = this.sharedFeedFilters.noty;
        if (
            notyFilter[noty.type] &&
            (notyFilter[noty.type] === 'On' ||
                notyFilter[noty.type] === 'Friends' ||
                (notyFilter[noty.type] === 'VIP' && noty.isFavorite))
        ) {
            this.playNoty(noty);
        }
    };

    $app.methods.updateSharedFeedFriendLogTable = function (forceUpdate) {
        // TrustLevel, Friend, FriendRequest, Unfriend, DisplayName
        var {data} = this.friendLogTable;
        var i = data.length;
        if (i > 0) {
            if (
                data[i - 1].created_at ===
                    this.sharedFeed.friendLogTable.lastEntryDate &&
                forceUpdate === false
            ) {
                return;
            }
            this.sharedFeed.friendLogTable.lastEntryDate =
                data[i - 1].created_at;
        } else {
            return;
        }
        var bias = new Date(Date.now() - 86400000).toJSON(); // 24 hours
        var wristArr = [];
        var w = 0;
        var wristFilter = this.sharedFeedFilters.wrist;
        for (var i = data.length - 1; i > -1; i--) {
            var ctx = data[i];
            if (ctx.created_at < bias) {
                break;
            }
            if (ctx.type === 'FriendRequest') {
                continue;
            }
            var isFriend = this.friends.has(ctx.userId);
            var isFavorite = API.cachedFavoritesByObjectId.has(ctx.userId);
            if (
                w < 20 &&
                wristFilter[ctx.type] &&
                (wristFilter[ctx.type] === 'On' ||
                    wristFilter[ctx.type] === 'Friends' ||
                    (wristFilter[ctx.type] === 'VIP' && isFavorite))
            ) {
                wristArr.push({
                    ...ctx,
                    isFriend,
                    isFavorite
                });
                ++w;
            }
        }
        this.sharedFeed.friendLogTable.wrist = wristArr;
        this.sharedFeed.pendingUpdate = true;
    };

    $app.methods.queueFriendLogNoty = function (noty) {
        if (noty.type === 'FriendRequest') {
            return;
        }
        noty.isFriend = this.friends.has(noty.userId);
        noty.isFavorite = API.cachedFavoritesByObjectId.has(noty.userId);
        var notyFilter = this.sharedFeedFilters.noty;
        if (
            notyFilter[noty.type] &&
            (notyFilter[noty.type] === 'On' ||
                notyFilter[noty.type] === 'Friends' ||
                (notyFilter[noty.type] === 'VIP' && noty.isFavorite))
        ) {
            this.playNoty(noty);
        }
    };

    $app.data.notyMap = [];

    $app.methods.playNoty = function (noty) {
        if (API.currentUser.status === 'busy' || !this.friendLogInitStatus) {
            return;
        }
        var displayName = '';
        if (noty.displayName) {
            displayName = noty.displayName;
        } else if (noty.senderUsername) {
            displayName = noty.senderUsername;
        } else if (noty.sourceDisplayName) {
            displayName = noty.sourceDisplayName;
        }
        if (displayName) {
            // don't play noty twice
            if (
                this.notyMap[displayName] &&
                this.notyMap[displayName] >= noty.created_at
            ) {
                return;
            }
            this.notyMap[displayName] = noty.created_at;
        }
        var bias = new Date(Date.now() - 60000).toJSON();
        if (noty.created_at < bias) {
            // don't play noty if it's over 1min old
            return;
        }

        var playNotificationTTS = false;
        if (
            this.notificationTTS === 'Always' ||
            (this.notificationTTS === 'Inside VR' &&
                !this.isGameNoVR &&
                this.isGameRunning) ||
            (this.notificationTTS === 'Game Closed' && !this.isGameRunning) ||
            (this.notificationTTS === 'Game Running' && this.isGameRunning)
        ) {
            playNotificationTTS = true;
        }
        var playDesktopToast = false;
        if (
            this.desktopToast === 'Always' ||
            (this.desktopToast === 'Inside VR' &&
                !this.isGameNoVR &&
                this.isGameRunning) ||
            (this.desktopToast === 'Game Closed' && !this.isGameRunning) ||
            (this.desktopToast === 'Game Running' && this.isGameRunning)
        ) {
            playDesktopToast = true;
        }
        var playXSNotification = false;
        if (this.xsNotifications && this.isGameRunning && !this.isGameNoVR) {
            playXSNotification = true;
        }
        var playOverlayNotification = false;
        if (
            this.overlayNotifications &&
            !this.isGameNoVR &&
            this.isGameRunning
        ) {
            playOverlayNotification = true;
        }
        var messageList = [
            'inviteMessage',
            'requestMessage',
            'responseMessage'
        ];
        let message = '';
        for (var k = 0; k < messageList.length; k++) {
            if (
                typeof noty.details !== 'undefined' &&
                typeof noty.details[messageList[k]] !== 'undefined'
            ) {
                message = `, ${noty.details[messageList[k]]}`;
            }
        }
        if (playNotificationTTS) {
            this.playNotyTTS(noty, message);
        }
        if (playDesktopToast || playXSNotification || playOverlayNotification) {
            if (this.imageNotifications) {
                this.notySaveImage(noty).then((image) => {
                    if (playXSNotification) {
                        this.displayXSNotification(noty, message, image);
                    }
                    if (playDesktopToast) {
                        this.displayDesktopToast(noty, message, image);
                    }
                    if (playOverlayNotification) {
                        this.displayOverlayNotification(noty, message, image);
                    }
                });
            } else {
                if (playXSNotification) {
                    this.displayXSNotification(noty, message, '');
                }
                if (playDesktopToast) {
                    this.displayDesktopToast(noty, message, '');
                }
                if (playOverlayNotification) {
                    this.displayOverlayNotification(noty, message, '');
                }
            }
        }
    };

    $app.methods.notyGetImage = async function (noty) {
        var imageUrl = '';
        var userId = '';
        if (noty.userId) {
            userId = noty.userId;
        } else if (noty.senderUserId) {
            userId = noty.senderUserId;
        } else if (noty.sourceUserId) {
            userId = noty.sourceUserId;
        } else if (noty.displayName) {
            for (var ref of API.cachedUsers.values()) {
                if (ref.displayName === noty.displayName) {
                    userId = ref.id;
                    break;
                }
            }
        }
        if (noty.thumbnailImageUrl) {
            imageUrl = noty.thumbnailImageUrl;
        } else if (noty.details && noty.details.imageUrl) {
            imageUrl = noty.details.imageURL;
        } else if (userId) {
            imageUrl = await API.getCachedUser({
                userId
            })
                .catch((err) => {
                    console.error(err);
                    return '';
                })
                .then((args) => {
                    if (
                        this.displayVRCPlusIconsAsAvatar &&
                        args.json.userIcon
                    ) {
                        return args.json.userIcon;
                    }
                    if (args.json.profilePicOverride) {
                        return args.json.profilePicOverride;
                    }
                    return args.json.currentAvatarThumbnailImageUrl;
                });
        }
        return imageUrl;
    };

    $app.methods.notySaveImage = async function (noty) {
        var imageUrl = await this.notyGetImage(noty);
        var base64Image = '';
        if (imageUrl) {
            try {
                base64Image = await fetch(imageUrl, {
                    method: 'GET',
                    redirect: 'follow'
                })
                    .then((response) => response.arrayBuffer())
                    .then((buffer) => {
                        var binary = '';
                        var bytes = new Uint8Array(buffer);
                        var length = bytes.byteLength;
                        for (var i = 0; i < length; i++) {
                            binary += String.fromCharCode(bytes[i]);
                        }
                        return btoa(binary);
                    });
            } catch (err) {
                console.error(err);
            }
        }
        return base64Image;
    };

    $app.methods.displayOverlayNotification = function (noty, message, image) {
        AppApi.ExecuteVrOverlayFunction(
            'playNoty',
            JSON.stringify({noty, message, image})
        );
    };

    $app.methods.playNotyTTS = function (noty, message) {
        switch (noty.type) {
            case 'OnPlayerJoined':
                this.speak(`${noty.displayName} has joined`);
                break;
            case 'OnPlayerLeft':
                this.speak(`${noty.displayName} has left`);
                break;
            case 'OnPlayerJoining':
                this.speak(`${noty.displayName} is joining`);
                break;
            case 'GPS':
                this.speak(
                    `${noty.displayName} is in ${this.displayLocation(
                        noty.location,
                        noty.worldName
                    )}`
                );
                break;
            case 'Online':
                this.speak(`${noty.displayName} has logged in`);
                break;
            case 'Offline':
                this.speak(`${noty.displayName} has logged out`);
                break;
            case 'Status':
                this.speak(
                    `${noty.displayName} status is now ${noty.status} ${noty.statusDescription}`
                );
                break;
            case 'invite':
                this.speak(
                    `${
                        noty.senderUsername
                    } has invited you to ${this.displayLocation(
                        noty.details.worldId,
                        noty.details.worldName
                    )}${message}`
                );
                break;
            case 'requestInvite':
                this.speak(
                    `${noty.senderUsername} has requested an invite${message}`
                );
                break;
            case 'inviteResponse':
                this.speak(
                    `${noty.senderUsername} has responded to your invite${message}`
                );
                break;
            case 'requestInviteResponse':
                this.speak(
                    `${noty.senderUsername} has responded to your invite request${message}`
                );
                break;
            case 'friendRequest':
                this.speak(
                    `${noty.senderUsername} has sent you a friend request`
                );
                break;
            case 'Friend':
                this.speak(`${noty.displayName} is now your friend`);
                break;
            case 'Unfriend':
                this.speak(`${noty.displayName} is no longer your friend`);
                break;
            case 'TrustLevel':
                this.speak(
                    `${noty.displayName} trust level is now ${noty.trustLevel}`
                );
                break;
            case 'DisplayName':
                this.speak(
                    `${noty.previousDisplayName} changed their name to ${noty.displayName}`
                );
                break;
            case 'PortalSpawn':
                var locationName = '';
                if (noty.worldName) {
                    locationName = ` to ${this.displayLocation(
                        noty.instanceId,
                        noty.worldName
                    )}`;
                }
                this.speak(
                    `${noty.displayName} has spawned a portal${locationName}`
                );
                break;
            case 'AvatarChange':
                this.speak(
                    `${noty.displayName} changed into avatar ${noty.name}`
                );
                break;
            case 'Event':
                this.speak(noty.data);
                break;
            case 'VideoPlay':
                this.speak(`Now playing: ${noty.notyName}`);
                break;
            case 'BlockedOnPlayerJoined':
                this.speak(`Blocked user ${noty.displayName} has joined`);
                break;
            case 'BlockedOnPlayerLeft':
                this.speak(`Blocked user ${noty.displayName} has left`);
                break;
            case 'MutedOnPlayerJoined':
                this.speak(`Muted user ${noty.displayName} has joined`);
                break;
            case 'MutedOnPlayerLeft':
                this.speak(`Muted user ${noty.displayName} has left`);
                break;
        }
    };

    $app.methods.displayXSNotification = function (noty, message, image) {
        var timeout = Math.floor(parseInt(this.notificationTimeout, 10) / 1000);
        switch (noty.type) {
            case 'OnPlayerJoined':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} has joined`,
                    timeout,
                    image
                );
                break;
            case 'OnPlayerLeft':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} has left`,
                    timeout,
                    image
                );
                break;
            case 'OnPlayerJoining':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} is joining`,
                    timeout,
                    image
                );
                break;
            case 'GPS':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} is in ${this.displayLocation(
                        noty.location,
                        noty.worldName
                    )}`,
                    timeout,
                    image
                );
                break;
            case 'Online':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} has logged in`,
                    timeout,
                    image
                );
                break;
            case 'Offline':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} has logged out`,
                    timeout,
                    image
                );
                break;
            case 'Status':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} status is now ${noty.status} ${noty.statusDescription}`,
                    timeout,
                    image
                );
                break;
            case 'invite':
                AppApi.XSNotification(
                    'VRCX',
                    `${
                        noty.senderUsername
                    } has invited you to ${this.displayLocation(
                        noty.details.worldId,
                        noty.details.worldName
                    )}${message}`,
                    timeout,
                    image
                );
                break;
            case 'requestInvite':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.senderUsername} has requested an invite${message}`,
                    timeout,
                    image
                );
                break;
            case 'inviteResponse':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.senderUsername} has responded to your invite${message}`,
                    timeout,
                    image
                );
                break;
            case 'requestInviteResponse':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.senderUsername} has responded to your invite request${message}`,
                    timeout,
                    image
                );
                break;
            case 'friendRequest':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.senderUsername} has sent you a friend request`,
                    timeout,
                    image
                );
                break;
            case 'Friend':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} is now your friend`,
                    timeout,
                    image
                );
                break;
            case 'Unfriend':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} is no longer your friend`,
                    timeout,
                    image
                );
                break;
            case 'TrustLevel':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} trust level is now ${noty.trustLevel}`,
                    timeout,
                    image
                );
                break;
            case 'DisplayName':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.previousDisplayName} changed their name to ${noty.displayName}`,
                    timeout,
                    image
                );
                break;
            case 'PortalSpawn':
                var locationName = '';
                if (noty.worldName) {
                    locationName = ` to ${this.displayLocation(
                        noty.instanceId,
                        noty.worldName
                    )}`;
                }
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} has spawned a portal${locationName}`,
                    timeout,
                    image
                );
                break;
            case 'AvatarChange':
                AppApi.XSNotification(
                    'VRCX',
                    `${noty.displayName} changed into avatar ${noty.name}`,
                    timeout,
                    image
                );
                break;
            case 'Event':
                AppApi.XSNotification('VRCX', noty.data, timeout, image);
                break;
            case 'VideoPlay':
                AppApi.XSNotification(
                    'VRCX',
                    `Now playing: ${noty.notyName}`,
                    timeout,
                    image
                );
                break;
            case 'BlockedOnPlayerJoined':
                AppApi.XSNotification(
                    'VRCX',
                    `Blocked user ${noty.displayName} has joined`,
                    timeout,
                    image
                );
                break;
            case 'BlockedOnPlayerLeft':
                AppApi.XSNotification(
                    'VRCX',
                    `Blocked user ${noty.displayName} has left`,
                    timeout,
                    image
                );
                break;
            case 'MutedOnPlayerJoined':
                AppApi.XSNotification(
                    'VRCX',
                    `Muted user ${noty.displayName} has joined`,
                    timeout,
                    image
                );
                break;
            case 'MutedOnPlayerLeft':
                AppApi.XSNotification(
                    'VRCX',
                    `Muted user ${noty.displayName} has left`,
                    timeout,
                    image
                );
                break;
        }
    };

    $app.methods.displayDesktopToast = function (noty, message, image) {
        switch (noty.type) {
            case 'OnPlayerJoined':
                AppApi.DesktopNotification(
                    noty.displayName,
                    'has joined',
                    image
                );
                break;
            case 'OnPlayerLeft':
                AppApi.DesktopNotification(noty.displayName, 'has left', image);
                break;
            case 'OnPlayerJoining':
                AppApi.DesktopNotification(
                    noty.displayName,
                    'is joining',
                    image
                );
                break;
            case 'GPS':
                AppApi.DesktopNotification(
                    noty.displayName,
                    `is in ${this.displayLocation(
                        noty.location,
                        noty.worldName
                    )}`,
                    image
                );
                break;
            case 'Online':
                AppApi.DesktopNotification(
                    noty.displayName,
                    'has logged in',
                    image
                );
                break;
            case 'Offline':
                AppApi.DesktopNotification(
                    noty.displayName,
                    'has logged out',
                    image
                );
                break;
            case 'Status':
                AppApi.DesktopNotification(
                    noty.displayName,
                    `status is now ${noty.status} ${noty.statusDescription}`,
                    image
                );
                break;
            case 'invite':
                AppApi.DesktopNotification(
                    noty.senderUsername,
                    `has invited you to ${this.displayLocation(
                        noty.details.worldId,
                        noty.details.worldName
                    )}${message}`,
                    image
                );
                break;
            case 'requestInvite':
                AppApi.DesktopNotification(
                    noty.senderUsername,
                    `has requested an invite${message}`,
                    image
                );
                break;
            case 'inviteResponse':
                AppApi.DesktopNotification(
                    noty.senderUsername,
                    `has responded to your invite${message}`,
                    image
                );
                break;
            case 'requestInviteResponse':
                AppApi.DesktopNotification(
                    noty.senderUsername,
                    `has responded to your invite request${message}`,
                    image
                );
                break;
            case 'friendRequest':
                AppApi.DesktopNotification(
                    noty.senderUsername,
                    'has sent you a friend request',
                    image
                );
                break;
            case 'Friend':
                AppApi.DesktopNotification(
                    noty.displayName,
                    'is now your friend',
                    image
                );
                break;
            case 'Unfriend':
                AppApi.DesktopNotification(
                    noty.displayName,
                    'is no longer your friend',
                    image
                );
                break;
            case 'TrustLevel':
                AppApi.DesktopNotification(
                    noty.displayName,
                    `trust level is now ${noty.trustLevel}`,
                    image
                );
                break;
            case 'DisplayName':
                AppApi.DesktopNotification(
                    noty.previousDisplayName,
                    `changed their name to ${noty.displayName}`,
                    image
                );
                break;
            case 'PortalSpawn':
                var locationName = '';
                if (noty.worldName) {
                    locationName = ` to ${this.displayLocation(
                        noty.instanceId,
                        noty.worldName
                    )}`;
                }
                AppApi.DesktopNotification(
                    noty.displayName,
                    `has spawned a portal${locationName}`,
                    image
                );
                break;
            case 'AvatarChange':
                AppApi.DesktopNotification(
                    noty.displayName,
                    `changed into avatar ${noty.name}`,
                    image
                );
                break;
            case 'Event':
                AppApi.DesktopNotification('Event', noty.data, image);
                break;
            case 'VideoPlay':
                AppApi.DesktopNotification('Now playing', noty.notyName, image);
                break;
            case 'BlockedOnPlayerJoined':
                AppApi.DesktopNotification(
                    noty.displayName,
                    'blocked user has joined',
                    image
                );
                break;
            case 'BlockedOnPlayerLeft':
                AppApi.DesktopNotification(
                    noty.displayName,
                    'blocked user has left',
                    image
                );
                break;
            case 'MutedOnPlayerJoined':
                AppApi.DesktopNotification(
                    noty.displayName,
                    'muted user has joined',
                    image
                );
                break;
            case 'MutedOnPlayerLeft':
                AppApi.DesktopNotification(
                    noty.displayName,
                    'muted user has left',
                    image
                );
                break;
        }
    };

    $app.methods.displayLocation = function (location, worldName) {
        var text = '';
        var L = API.parseLocation(location);
        if (L.isOffline) {
            text = 'Offline';
        } else if (L.isPrivate) {
            text = 'Private';
        } else if (L.worldId) {
            if (L.instanceId) {
                text = `${worldName} ${L.accessType}`;
            } else {
                text = worldName;
            }
        }
        return text;
    };

    $app.methods.notifyMenu = function (index) {
        var {menu} = this.$refs;
        if (menu.activeIndex !== index) {
            var item = menu.items[index];
            if (item) {
                item.$el.classList.add('notify');
            }
        }
    };

    $app.methods.selectMenu = function (index) {
        // NOTE
        // 툴팁이 쌓여서 느려지기 때문에 날려줌.
        // 근데 이 방법이 안전한지는 모르겠음
        document.querySelectorAll('[role="tooltip"]').forEach((node) => {
            node.remove();
        });
        var item = this.$refs.menu.items[index];
        if (item) {
            item.$el.classList.remove('notify');
        }
        if (index === 'notification') {
            this.unseenNotifications = [];
        }
    };

    $app.methods.promptTOTP = function () {
        this.$prompt(
            'Enter a numeric code from your authenticator app',
            'Two-factor Authentication',
            {
                distinguishCancelAndClose: true,
                cancelButtonText: 'Use OTP',
                confirmButtonText: 'Verify',
                inputPlaceholder: 'Code',
                inputPattern: /^[0-9]{6}$/,
                inputErrorMessage: 'Invalid Code',
                callback: (action, instance) => {
                    if (action === 'confirm') {
                        API.verifyTOTP({
                            code: instance.inputValue
                        })
                            .catch((err) => {
                                this.promptTOTP();
                                throw err;
                            })
                            .then((args) => {
                                API.getCurrentUser();
                                return args;
                            });
                    } else if (action === 'cancel') {
                        this.promptOTP();
                    }
                }
            }
        );
    };

    $app.methods.promptOTP = function () {
        this.$prompt(
            'Enter one of your saved recovery codes',
            'Two-factor Authentication',
            {
                distinguishCancelAndClose: true,
                cancelButtonText: 'Use TOTP',
                confirmButtonText: 'Verify',
                inputPlaceholder: 'Code',
                inputPattern: /^[a-z0-9]{4}-[a-z0-9]{4}$/,
                inputErrorMessage: 'Invalid Code',
                callback: (action, instance) => {
                    if (action === 'confirm') {
                        API.verifyOTP({
                            code: instance.inputValue
                        })
                            .catch((err) => {
                                this.promptOTP();
                                throw err;
                            })
                            .then((args) => {
                                API.getCurrentUser();
                                return args;
                            });
                    } else if (action === 'cancel') {
                        this.promptTOTP();
                    }
                }
            }
        );
    };

    $app.methods.showExportFriendsListDialog = function () {
        var {friends} = API.currentUser;
        if (Array.isArray(friends) === false) {
            return;
        }
        var lines = ['UserID,DisplayName,Memo'];
        var _ = function (str) {
            if (/[\x00-\x1f,"]/.test(str) === true) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        for (var userId of friends) {
            var ref = this.friends.get(userId);
            var name = (typeof ref !== 'undefined' && ref.name) || '';
            var memo = (typeof ref !== 'undefined' && ref.memo) || '';
            lines.push(`${_(userId)},${_(name)},${_(memo)}`);
        }
        this.exportFriendsListContent = lines.join('\n');
        this.exportFriendsListDialog = true;
    };

    $app.data.exportAvatarsListDialog = false;
    $app.data.exportAvatarsListContent = '';

    $app.methods.showExportAvatarsListDialog = function () {
        for (var ref of API.cachedAvatars.values()) {
            if (ref.authorId === API.currentUser.id) {
                API.cachedAvatars.delete(ref.id);
            }
        }
        var params = {
            n: 50,
            offset: 0,
            sort: 'updated',
            order: 'descending',
            releaseStatus: 'all',
            user: 'me'
        };
        var map = new Map();
        API.bulk({
            fn: 'getAvatars',
            N: -1,
            params,
            handle: (args) => {
                for (var json of args.json) {
                    var $ref = API.cachedAvatars.get(json.id);
                    if (typeof $ref !== 'undefined') {
                        map.set($ref.id, $ref);
                    }
                }
            },
            done: () => {
                var avatars = Array.from(map.values());
                if (Array.isArray(avatars) === false) {
                    return;
                }
                var lines = ['AvatarID,AvatarName'];
                var _ = function (str) {
                    if (/[\x00-\x1f,"]/.test(str) === true) {
                        return `"${str.replace(/"/g, '""')}"`;
                    }
                    return str;
                };
                for (var avatar of avatars) {
                    lines.push(`${_(avatar.id)},${_(avatar.name)}`);
                }
                this.exportAvatarsListContent = lines.join('\n');
                this.exportAvatarsListDialog = true;
            }
        });
    };

    API.$on('USER:2FA', function () {
        $app.promptTOTP();
    });

    API.$on('LOGOUT', function () {
        new Noty({
            type: 'success',
            text: `See you again, <strong>${escapeTag(
                this.currentUser.displayName
            )}</strong>!`
        }).show();
    });

    API.$on('LOGIN', function (args) {
        new Noty({
            type: 'success',
            text: `Hello there, <strong>${escapeTag(
                args.ref.displayName
            )}</strong>!`
        }).show();
        $app.$refs.menu.activeIndex = 'feed';
    });

    API.$on('LOGIN', function (args) {
        $app.updateStoredUser(args.ref);
    });

    API.$on('LOGOUT', function () {
        $app.updateStoredUser(this.currentUser);
        webApiService.clearCookies();
    });

    $app.methods.checkPrimaryPassword = function (args) {
        return new Promise((resolve, reject) => {
            if (!this.enablePrimaryPassword) {
                resolve(args.password);
            }
            $app.$prompt(
                'Please enter your Primary Password.',
                'Primary Password Required',
                {
                    inputType: 'password',
                    inputPattern: /[\s\S]{1,32}/
                }
            )
                .then(({value}) => {
                    security
                        .decrypt(args.password, value)
                        .then(resolve)
                        .catch(reject);
                })
                .catch(reject);
        });
    };

    $app.data.enablePrimaryPassword = configRepository.getBool(
        'enablePrimaryPassword',
        false
    );
    $app.data.enablePrimaryPasswordDialog = {
        visible: false,
        password: '',
        rePassword: '',
        beforeClose(done) {
            $app._data.enablePrimaryPassword = false;
            done();
        }
    };
    $app.methods.enablePrimaryPasswordChange = function () {
        this.enablePrimaryPasswordDialog.password = '';
        this.enablePrimaryPasswordDialog.rePassword = '';
        if (this.enablePrimaryPassword) {
            this.enablePrimaryPasswordDialog.visible = true;
        } else {
            this.$prompt(
                'Please enter your Primary Password.',
                'Primary Password Required',
                {
                    inputType: 'password',
                    inputPattern: /[\s\S]{1,32}/
                }
            )
                .then(({value}) => {
                    for (let name in this.loginForm.savedCredentials) {
                        security
                            .decrypt(
                                this.loginForm.savedCredentials[name]
                                    .loginParmas.password,
                                value
                            )
                            .then((pt) => {
                                this.saveCredentials = {
                                    username: name,
                                    password: pt
                                };
                                this.updateStoredUser(
                                    this.loginForm.savedCredentials[name].user
                                );
                                configRepository.setBool(
                                    'enablePrimaryPassword',
                                    false
                                );
                            })
                            .catch(() => {
                                this.enablePrimaryPassword = true;
                                configRepository.setBool(
                                    'enablePrimaryPassword',
                                    true
                                );
                            });
                    }
                })
                .catch(() => {
                    this.enablePrimaryPassword = true;
                    configRepository.setBool('enablePrimaryPassword', true);
                });
        }
    };
    $app.methods.setPrimaryPassword = function () {
        configRepository.setBool(
            'enablePrimaryPassword',
            this.enablePrimaryPassword
        );
        this.enablePrimaryPasswordDialog.visible = false;
        if (this.enablePrimaryPassword) {
            let key = this.enablePrimaryPasswordDialog.password;
            for (let name in this.loginForm.savedCredentials) {
                security
                    .encrypt(
                        this.loginForm.savedCredentials[name].loginParmas
                            .password,
                        key
                    )
                    .then((ct) => {
                        this.saveCredentials = {username: name, password: ct};
                        this.updateStoredUser(
                            this.loginForm.savedCredentials[name].user
                        );
                    });
            }
        }
    };

    $app.methods.updateStoredUser = async function (currentUser) {
        var savedCredentialsArray = {};
        if (configRepository.getString('savedCredentials') !== null) {
            var savedCredentialsArray = JSON.parse(
                configRepository.getString('savedCredentials')
            );
        }
        if (this.saveCredentials) {
            var credentialsToSave = {
                user: currentUser,
                loginParmas: this.saveCredentials
            };
            savedCredentialsArray[currentUser.username] = credentialsToSave;
            delete this.saveCredentials;
        } else if (
            typeof savedCredentialsArray[currentUser.username] !== 'undefined'
        ) {
            savedCredentialsArray[currentUser.username].user = currentUser;
        }
        savedCredentialsArray[currentUser.username].cookies =
            await webApiService.getCookies();
        this.loginForm.savedCredentials = savedCredentialsArray;
        var jsonCredentialsArray = JSON.stringify(savedCredentialsArray);
        configRepository.setString('savedCredentials', jsonCredentialsArray);
        this.loginForm.lastUserLoggedIn = currentUser.username;
        configRepository.setString('lastUserLoggedIn', currentUser.username);
    };

    $app.methods.relogin = function (user) {
        var {loginParmas} = user;
        if (user.cookies) {
            webApiService.setCookies(user.cookies);
        }
        return new Promise((resolve, reject) => {
            if (this.enablePrimaryPassword) {
                this.checkPrimaryPassword(loginParmas)
                    .then((pwd) => {
                        this.loginForm.loading = true;
                        return API.getConfig()
                            .catch((err) => {
                                this.loginForm.loading = false;
                                reject(err);
                            })
                            .then(() => {
                                API.login({
                                    username: loginParmas.username,
                                    password: pwd,
                                    cipher: loginParmas.password
                                })
                                    .catch((err2) => {
                                        this.loginForm.loading = false;
                                        API.logout();
                                        reject(err2);
                                    })
                                    .then(() => {
                                        this.loginForm.loading = false;
                                        resolve();
                                    });
                            });
                    })
                    .catch((_) => {
                        this.$message({
                            message: 'Incorrect primary password',
                            type: 'error'
                        });
                        reject(_);
                    });
            } else {
                API.getConfig()
                    .catch((err) => {
                        this.loginForm.loading = false;
                        reject(err);
                    })
                    .then(() => {
                        API.login({
                            username: loginParmas.username,
                            password: loginParmas.password
                        })
                            .catch((err2) => {
                                this.loginForm.loading = false;
                                API.logout();
                                reject(err2);
                            })
                            .then(() => {
                                this.loginForm.loading = false;
                                resolve();
                            });
                    });
            }
        });
    };

    $app.methods.deleteSavedLogin = function (username) {
        var savedCredentialsArray = JSON.parse(
            configRepository.getString('savedCredentials')
        );
        delete savedCredentialsArray[username];
        // Disable primary password when no account is available.
        if (Object.keys(savedCredentialsArray).length === 0) {
            this.enablePrimaryPassword = false;
            configRepository.setBool('enablePrimaryPassword', false);
        }
        this.loginForm.savedCredentials = savedCredentialsArray;
        var jsonCredentialsArray = JSON.stringify(savedCredentialsArray);
        configRepository.setString('savedCredentials', jsonCredentialsArray);
        new Noty({
            type: 'success',
            text: 'Account removed.'
        }).show();
    };

    API.$on('AUTOLOGIN', function () {
        var user =
            $app.loginForm.savedCredentials[$app.loginForm.lastUserLoggedIn];
        if (typeof user !== 'undefined') {
            $app.relogin(user).then(() => {
                new Noty({
                    type: 'success',
                    text: 'Automatically logged in.'
                }).show();
            });
        }
    });

    $app.data.loginForm = {
        loading: true,
        username: '',
        password: '',
        saveCredentials: false,
        savedCredentials:
            configRepository.getString('lastUserLoggedIn') !== null
                ? JSON.parse(configRepository.getString('savedCredentials'))
                : {},
        lastUserLoggedIn: configRepository.getString('lastUserLoggedIn'),
        rules: {
            username: [
                {
                    required: true,
                    trigger: 'blur'
                }
            ],
            password: [
                {
                    required: true,
                    trigger: 'blur'
                }
            ]
        }
    };

    $app.methods.login = function () {
        this.$refs.loginForm.validate((valid) => {
            if (valid && !this.loginForm.loading) {
                this.loginForm.loading = true;
                API.getConfig()
                    .catch((err) => {
                        this.loginForm.loading = false;
                        throw err;
                    })
                    .then((args) => {
                        if (
                            this.loginForm.saveCredentials &&
                            this.enablePrimaryPassword
                        ) {
                            $app.$prompt(
                                'Please enter your Primary Password.',
                                'Primary Password Required',
                                {
                                    inputType: 'password',
                                    inputPattern: /[\s\S]{1,32}/
                                }
                            )
                                .then(({value}) => {
                                    let saveCredential =
                                        this.loginForm.savedCredentials[
                                            Object.keys(
                                                this.loginForm.savedCredentials
                                            )[0]
                                        ];
                                    security
                                        .decrypt(
                                            saveCredential.loginParmas.password,
                                            value
                                        )
                                        .then(() => {
                                            security
                                                .encrypt(
                                                    this.loginForm.password,
                                                    value
                                                )
                                                .then((pwd) => {
                                                    API.login({
                                                        username:
                                                            this.loginForm
                                                                .username,
                                                        password:
                                                            this.loginForm
                                                                .password,
                                                        saveCredentials:
                                                            this.loginForm
                                                                .saveCredentials,
                                                        cipher: pwd
                                                    }).finally(() => {
                                                        this.loginForm.username =
                                                            '';
                                                        this.loginForm.password =
                                                            '';
                                                    });
                                                });
                                        });
                                })
                                .finally(() => {
                                    this.loginForm.loading = false;
                                });
                            return args;
                        }
                        API.login({
                            username: this.loginForm.username,
                            password: this.loginForm.password,
                            saveCredentials: this.loginForm.saveCredentials
                        }).finally(() => {
                            this.loginForm.username = '';
                            this.loginForm.password = '';
                            this.loginForm.loading = false;
                        });
                        return args;
                    });
            }
        });
    };

    $app.methods.loginWithSteam = function () {
        if (!this.loginForm.loading) {
            this.loginForm.loading = true;
            AppApi.LoginWithSteam()
                .catch((err) => {
                    this.loginForm.loading = false;
                    throw err;
                })
                .then((steamTicket) => {
                    if (steamTicket) {
                        API.getConfig()
                            .catch((err) => {
                                this.loginForm.loading = false;
                                throw err;
                            })
                            .then((args) => {
                                API.loginWithSteam({
                                    steamTicket
                                }).finally(() => {
                                    this.loginForm.loading = false;
                                });
                                return args;
                            });
                    } else {
                        this.loginForm.loading = false;
                        this.$message({
                            message: 'It only works when VRChat is running.',
                            type: 'error'
                        });
                    }
                });
        }
    };

    $app.methods.migrateMemos = async function () {
        var json = JSON.parse(VRCXStorage.GetAll());
        database.begin();
        for (var line in json) {
            if (line.substring(0, 8) === 'memo_usr') {
                var userId = line.substring(5);
                var memo = json[line];
                if (memo) {
                    await this.saveMemo(userId, memo);
                    VRCXStorage.Remove(`memo_${userId}`);
                }
            }
        }
        database.commit();
    };

    $app.methods.getMemo = async function (userId) {
        try {
            var row = await database.getMemo(userId);
            return row.memo;
        } catch (err) {}
        return '';
    };

    $app.methods.saveMemo = function (id, memo) {
        if (memo) {
            database.setMemo({
                userId: id,
                editedAt: new Date().toJSON(),
                memo
            });
        } else {
            database.deleteMemo(id);
        }
        var ref = this.friends.get(id);
        if (ref) {
            ref.memo = String(memo || '');
        }
    };

    // App: Friends

    $app.data.friends = new Map();
    $app.data.pendingActiveFriends = new Set();
    $app.data.friendsNo = 0;
    $app.data.isFriendsGroupMe = true;
    $app.data.isFriendsGroup0 = true;
    $app.data.isFriendsGroup1 = true;
    $app.data.isFriendsGroup2 = true;
    $app.data.isFriendsGroup3 = false;
    $app.data.friendsGroup0_ = [];
    $app.data.friendsGroup1_ = [];
    $app.data.friendsGroup2_ = [];
    $app.data.friendsGroup3_ = [];
    $app.data.friendsGroupA_ = [];
    $app.data.friendsGroupB_ = [];
    $app.data.friendsGroupC_ = [];
    $app.data.friendsGroupD_ = [];
    $app.data.sortFriendsGroup0 = false;
    $app.data.sortFriendsGroup1 = false;
    $app.data.sortFriendsGroup2 = false;
    $app.data.sortFriendsGroup3 = false;
    $app.data.orderFriendsGroup0 =
        configRepository.getBool('orderFriendGroup0');
    $app.data.orderFriendsGroup1 =
        configRepository.getBool('orderFriendGroup1');
    $app.data.orderFriendsGroup2 =
        configRepository.getBool('orderFriendGroup2');
    $app.data.orderFriendsGroup3 =
        configRepository.getBool('orderFriendGroup3');
    $app.data.orderFriendsGroupPrivate = configRepository.getBool(
        'orderFriendGroupPrivate'
    );
    $app.data.orderFriendsGroupStatus = configRepository.getBool(
        'orderFriendGroupPrivate'
    );
    $app.data.orderFriendsGroupGPS = configRepository.getBool(
        'orderFriendGroupGPS'
    );
    var saveOrderFriendGroup = function () {
        configRepository.setBool('orderFriendGroup0', this.orderFriendsGroup0);
        configRepository.setBool('orderFriendGroup1', this.orderFriendsGroup1);
        configRepository.setBool('orderFriendGroup2', this.orderFriendsGroup2);
        configRepository.setBool('orderFriendGroup3', this.orderFriendsGroup3);
        configRepository.setBool(
            'orderFriendGroupPrivate',
            this.orderFriendsGroupPrivate
        );
        configRepository.setBool(
            'orderFriendsGroupStatus',
            this.orderFriendsGroupStatus
        );
        configRepository.setBool(
            'orderFriendGroupGPS',
            this.orderFriendsGroupGPS
        );
        this.sortFriendsGroup0 = true;
        this.sortFriendsGroup1 = true;
    };
    $app.watch.orderFriendsGroup0 = saveOrderFriendGroup;
    $app.watch.orderFriendsGroup1 = saveOrderFriendGroup;
    $app.watch.orderFriendsGroup2 = saveOrderFriendGroup;
    $app.watch.orderFriendsGroup3 = saveOrderFriendGroup;
    $app.watch.orderFriendsGroupPrivate = saveOrderFriendGroup;
    $app.watch.orderFriendsGroupStatus = saveOrderFriendGroup;
    $app.watch.orderFriendsGroupGPS = saveOrderFriendGroup;

    $app.methods.fetchActiveFriend = function (userId) {
        this.pendingActiveFriends.add(userId);
        // FIXME: handle error
        return API.getUser({
            userId
        }).then((args) => {
            this.pendingActiveFriends.delete(userId);
            return args;
        });
    };

    API.$on('USER:CURRENT', function (args) {
        $app.checkActiveFriends(args.json);
    });

    $app.methods.checkActiveFriends = function (ref) {
        if (
            Array.isArray(ref.activeFriends) === false ||
            !this.friendLogInitStatus
        ) {
            return;
        }
        for (var userId of ref.activeFriends) {
            if (this.pendingActiveFriends.has(userId)) {
                continue;
            }
            var user = API.cachedUsers.get(userId);
            if (typeof user !== 'undefined' && user.status !== 'offline') {
                continue;
            }
            if (this.pendingActiveFriends.size >= 5) {
                break;
            }
            this.fetchActiveFriend(userId);
        }
    };

    API.$on('LOGIN', function () {
        $app.friends.clear();
        $app.pendingActiveFriends.clear();
        $app.friendsNo = 0;
        $app.isFriendsGroup0 = true;
        $app.isFriendsGroup1 = true;
        $app.isFriendsGroup2 = true;
        $app.isFriendsGroup3 = false;
        $app.friendsGroup0_ = [];
        $app.friendsGroup1_ = [];
        $app.friendsGroup2_ = [];
        $app.friendsGroup3_ = [];
        $app.friendsGroupA_ = [];
        $app.friendsGroupB_ = [];
        $app.friendsGroupC_ = [];
        $app.friendsGroupD_ = [];
        $app.sortFriendsGroup0 = false;
        $app.sortFriendsGroup1 = false;
        $app.sortFriendsGroup2 = false;
        $app.sortFriendsGroup3 = false;
    });

    API.$on('USER:CURRENT', function (args) {
        // USER:CURRENT에서 처리를 함
        $app.refreshFriends(args.ref, args.origin);
    });

    API.$on('USER', function (args) {
        $app.updateFriend(args.ref.id);
    });

    API.$on('FRIEND:ADD', function (args) {
        $app.addFriend(args.params.userId);
    });

    API.$on('FRIEND:DELETE', function (args) {
        $app.deleteFriend(args.params.userId);
    });

    API.$on('FRIEND:STATE', function (args) {
        if (args.json.state === 'online') {
            $app.APILastOnline.set(args.params.userId, Date.now());
        }
        $app.updateFriend(args.params.userId, args.json.state);
    });

    API.$on('FAVORITE', function (args) {
        $app.updateFriend(args.ref.favoriteId);
    });

    API.$on('FAVORITE:@DELETE', function (args) {
        $app.updateFriend(args.ref.favoriteId);
    });

    API.$on('LOGIN', function () {
        this.cachedUsers = new Map(); // fix memos loading very slowly on relogin
        $app.nextFriendsRefresh = 0;
    });

    $app.methods.refreshFriends = function (ref, origin) {
        var map = new Map();
        for (var id of ref.friends) {
            map.set(id, 'offline');
        }
        for (var id of ref.offlineFriends) {
            map.set(id, 'offline');
        }
        for (var id of ref.activeFriends) {
            map.set(id, 'active');
        }
        for (var id of ref.onlineFriends) {
            map.set(id, 'online');
        }
        for (var [id, state] of map) {
            if (this.friends.has(id)) {
                this.updateFriend(id, state, origin);
            } else {
                this.addFriend(id, state);
            }
        }
        for (var id of this.friends.keys()) {
            if (map.has(id) === false) {
                this.deleteFriend(id);
            }
        }
    };

    $app.methods.addFriend = function (id, state) {
        if (this.friends.has(id)) {
            return;
        }
        var ref = API.cachedUsers.get(id);
        var isVIP = API.cachedFavoritesByObjectId.has(id);
        var ctx = {
            id,
            state: state || 'offline',
            isVIP,
            ref,
            name: '',
            no: ++this.friendsNo,
            memo: ''
        };
        this.getMemo(id).then((memo) => {
            ctx.memo = memo;
        });
        if (typeof ref === 'undefined') {
            ref = this.friendLog.get(id);
            if (typeof ref !== 'undefined' && ref.displayName) {
                ctx.name = ref.displayName;
            }
        } else {
            ctx.name = ref.name;
        }
        this.friends.set(id, ctx);
        if (ctx.state === 'online') {
            if (ctx.isVIP) {
                this.sortFriendsGroup0 = true;
                this.friendsGroup0_.push(ctx);
                this.friendsGroupA_.unshift(ctx);
            } else {
                this.sortFriendsGroup1 = true;
                this.friendsGroup1_.push(ctx);
                this.friendsGroupB_.unshift(ctx);
            }
        } else if (ctx.state === 'active') {
            this.sortFriendsGroup2 = true;
            this.friendsGroup2_.push(ctx);
            this.friendsGroupC_.unshift(ctx);
        } else {
            this.sortFriendsGroup3 = true;
            this.friendsGroup3_.push(ctx);
            this.friendsGroupD_.unshift(ctx);
        }
    };

    $app.methods.deleteFriend = function (id) {
        var ctx = this.friends.get(id);
        if (typeof ctx === 'undefined') {
            return;
        }
        this.friends.delete(id);
        if (ctx.state === 'online') {
            if (ctx.isVIP) {
                removeFromArray(this.friendsGroup0_, ctx);
                removeFromArray(this.friendsGroupA_, ctx);
            } else {
                removeFromArray(this.friendsGroup1_, ctx);
                removeFromArray(this.friendsGroupB_, ctx);
            }
        } else if (ctx.state === 'active') {
            removeFromArray(this.friendsGroup2_, ctx);
            removeFromArray(this.friendsGroupC_, ctx);
        } else {
            removeFromArray(this.friendsGroup3_, ctx);
            removeFromArray(this.friendsGroupD_, ctx);
        }
    };

    $app.data.updateFriendInProgress = new Set();

    $app.methods.updateFriend = async function (id, stateInput, origin) {
        var ctx = this.friends.get(id);
        if (typeof ctx === 'undefined') {
            return;
        }
        if (this.updateFriendInProgress.has(id)) {
            return;
        }
        this.updateFriendInProgress.add(id);
        var ref = API.cachedUsers.get(id);
        var isVIP = API.cachedFavoritesByObjectId.has(id);
        if (typeof stateInput === 'undefined' || ctx.state === stateInput) {
            // this is should be: undefined -> user
            if (ctx.ref !== ref) {
                ctx.ref = ref;
                // NOTE
                // AddFriend (CurrentUser) 이후,
                // 서버에서 오는 순서라고 보면 될 듯.
                if (ctx.state === 'online') {
                    if (this.friendLogInitStatus) {
                        API.getUser({
                            userId: id
                        });
                    }
                    if (ctx.isVIP) {
                        removeFromArray(this.friendsGroupA_, ctx);
                        this.friendsGroupA_.push(ctx);
                    } else {
                        removeFromArray(this.friendsGroupB_, ctx);
                        this.friendsGroupB_.push(ctx);
                    }
                } else if (ctx.state === 'active') {
                    removeFromArray(this.friendsGroupC_, ctx);
                    this.friendsGroupC_.push(ctx);
                } else {
                    removeFromArray(this.friendsGroupD_, ctx);
                    this.friendsGroupD_.push(ctx);
                }
            }
            if (ctx.isVIP !== isVIP) {
                ctx.isVIP = isVIP;
                if (ctx.state === 'online') {
                    if (ctx.isVIP) {
                        removeFromArray(this.friendsGroup1_, ctx);
                        removeFromArray(this.friendsGroupB_, ctx);
                        this.sortFriendsGroup0 = true;
                        this.friendsGroup0_.push(ctx);
                        this.friendsGroupA_.unshift(ctx);
                    } else {
                        removeFromArray(this.friendsGroup0_, ctx);
                        removeFromArray(this.friendsGroupA_, ctx);
                        this.sortFriendsGroup1 = true;
                        this.friendsGroup1_.push(ctx);
                        this.friendsGroupB_.unshift(ctx);
                    }
                }
            }
            if (typeof ref !== 'undefined' && ctx.name !== ref.displayName) {
                ctx.name = ref.displayName;
                if (ctx.state === 'online') {
                    if (ctx.isVIP) {
                        this.sortFriendsGroup0 = true;
                    } else {
                        this.sortFriendsGroup1 = true;
                    }
                } else if (ctx.state === 'active') {
                    this.sortFriendsGroup2 = true;
                } else {
                    this.sortFriendsGroup3 = true;
                }
            }
            // FIXME: 도배 가능성 있음
            if (
                origin &&
                ctx.state !== 'online' &&
                typeof ref !== 'undefined' &&
                ref.location !== '' &&
                ref.location !== 'offline' &&
                ref.location !== 'private'
            ) {
                API.getUser({
                    userId: id
                }).catch(() => {
                    this.updateFriendInProgress.delete(id);
                });
            }
        } else {
            var newState = stateInput;
            var location = '';
            var $location_at = '';
            if (
                typeof ref !== 'undefined' &&
                typeof ref.location !== 'undefined'
            ) {
                var {location, $location_at} = ref;
            }
            // prevent status flapping
            if (
                ctx.state === 'online' &&
                (stateInput === 'active' || stateInput === 'offline')
            ) {
                await new Promise((resolve) => {
                    setTimeout(resolve, 50000);
                });
                if (this.APILastOnline.has(id)) {
                    var date = this.APILastOnline.get(id);
                    if (date > Date.now() - 60000) {
                        this.updateFriendInProgress.delete(id);
                        return;
                    }
                }
            }
            try {
                var args = await API.getUser({
                    userId: id
                });
                if (
                    typeof args !== 'undefined' &&
                    typeof args.ref !== 'undefined'
                ) {
                    newState = args.ref.state;
                    ctx.ref = args.ref;
                }
            } catch (err) {
                console.error(err);
            }
            if (ctx.state !== newState) {
                if (
                    typeof ctx.ref.$offline_for !== 'undefined' &&
                    ctx.ref.$offline_for === '' &&
                    (newState === 'offline' || newState === 'active') &&
                    ctx.state === 'online'
                ) {
                    ctx.ref.$online_for = '';
                    ctx.ref.$offline_for = Date.now();
                    var ts = Date.now();
                    var time = ts - $location_at;
                    var worldName = await this.getWorldName(location);
                    var feed = {
                        created_at: new Date().toJSON(),
                        type: 'Offline',
                        userId: ctx.ref.id,
                        displayName: ctx.ref.displayName,
                        location,
                        worldName,
                        time
                    };
                    this.addFeed(feed);
                    database.addOnlineOfflineToDatabase(feed);
                } else if (newState === 'online') {
                    ctx.ref.$location_at = Date.now();
                    ctx.ref.$online_for = Date.now();
                    ctx.ref.$offline_for = '';
                    if (
                        typeof ctx.ref.location !== 'undefined' &&
                        ctx.ref.location !== 'offline'
                    ) {
                        var {location} = ctx.ref;
                    }
                    var worldName = await this.getWorldName(ctx.ref.location);
                    var feed = {
                        created_at: new Date().toJSON(),
                        type: 'Online',
                        userId: ctx.ref.id,
                        displayName: ctx.ref.displayName,
                        location,
                        worldName,
                        time: ''
                    };
                    this.addFeed(feed);
                    database.addOnlineOfflineToDatabase(feed);
                }
            }
            if (ctx.state === 'online') {
                if (ctx.isVIP) {
                    removeFromArray(this.friendsGroup0_, ctx);
                    removeFromArray(this.friendsGroupA_, ctx);
                } else {
                    removeFromArray(this.friendsGroup1_, ctx);
                    removeFromArray(this.friendsGroupB_, ctx);
                }
            } else if (ctx.state === 'active') {
                removeFromArray(this.friendsGroup2_, ctx);
                removeFromArray(this.friendsGroupC_, ctx);
            } else {
                removeFromArray(this.friendsGroup3_, ctx);
                removeFromArray(this.friendsGroupD_, ctx);
            }
            if (newState === 'online') {
                if (isVIP) {
                    this.sortFriendsGroup0 = true;
                    this.friendsGroup0_.push(ctx);
                    this.friendsGroupA_.unshift(ctx);
                } else {
                    this.sortFriendsGroup1 = true;
                    this.friendsGroup1_.push(ctx);
                    this.friendsGroupB_.unshift(ctx);
                }
            } else if (newState === 'active') {
                this.sortFriendsGroup2 = true;
                this.friendsGroup2_.push(ctx);
                this.friendsGroupC_.unshift(ctx);
            } else {
                this.sortFriendsGroup3 = true;
                this.friendsGroup3_.push(ctx);
                this.friendsGroupD_.unshift(ctx);
            }
            ctx.state = newState;
            ctx.name = ctx.ref.displayName;
            ctx.isVIP = isVIP;
        }
        this.updateFriendInProgress.delete(id);
    };

    $app.methods.getWorldName = async function (location) {
        var worldName = '';
        if (location !== 'offline') {
            try {
                var L = API.parseLocation(location);
                if (L.worldId) {
                    var args = await API.getCachedWorld({
                        worldId: L.worldId
                    });
                    worldName = args.ref.name;
                }
            } catch (err) {}
        }
        return worldName;
    };

    $app.methods.updateFriendGPS = function (userId) {
        if (!this.orderFriendsGroupGPS) {
            return;
        }
        var ctx = this.friends.get(userId);
        if (typeof ctx.ref !== 'undefined' && ctx.state === 'online') {
            if (ctx.isVIP) {
                removeFromArray(this.friendsGroupA_, ctx);
                this.sortFriendsGroup1 = true;
                this.friendsGroupA_.unshift(ctx);
            } else {
                removeFromArray(this.friendsGroupB_, ctx);
                this.sortFriendsGroup0 = true;
                this.friendsGroupB_.unshift(ctx);
            }
        }
    };

    // ascending
    var compareByName = function (a, b) {
        var A = String(a.name).toUpperCase();
        var B = String(b.name).toUpperCase();
        if (A < B) {
            return -1;
        }
        if (A > B) {
            return 1;
        }
        return 0;
    };

    // descending
    var compareByUpdatedAt = function (a, b) {
        var A = String(a.updated_at).toUpperCase();
        var B = String(b.updated_at).toUpperCase();
        if (A < B) {
            return 1;
        }
        if (A > B) {
            return -1;
        }
        return 0;
    };

    // private
    var compareByPrivate = function (a, b) {
        if (typeof a.ref === 'undefined' || typeof b.ref === 'undefined') {
            return 0;
        }
        if (a.ref.location === 'private' && b.ref.location === 'private') {
            return 0;
        } else if (a.ref.location === 'private') {
            return 1;
        } else if (b.ref.location === 'private') {
            return -1;
        }
        return 0;
    };

    // status
    var compareByStatus = function (a, b) {
        if (typeof a.ref === 'undefined' || typeof b.ref === 'undefined') {
            return 0;
        }
        if (
            $app.orderFriendsGroupPrivate &&
            (a.ref.location !== 'private' || b.ref.location !== 'private')
        ) {
            return 0;
        }
        if (a.ref.status === b.ref.status) {
            return 0;
        }
        if (a.ref.state === 'offline') {
            return 1;
        }
        return $app.sortStatus(a.ref.status, b.ref.status);
    };

    $app.methods.sortByStatus = function (a, b, field) {
        return this.sortStatus(a[field], b[field]);
    };

    $app.methods.sortStatus = function (a, b) {
        switch (b) {
            case 'join me':
                switch (a) {
                    case 'active':
                        return 1;
                    case 'ask me':
                        return 1;
                    case 'busy':
                        return 1;
                }
                break;
            case 'active':
                switch (a) {
                    case 'join me':
                        return -1;
                    case 'ask me':
                        return 1;
                    case 'busy':
                        return 1;
                }
                break;
            case 'ask me':
                switch (a) {
                    case 'join me':
                        return -1;
                    case 'active':
                        return -1;
                    case 'busy':
                        return 1;
                }
                break;
            case 'busy':
                switch (a) {
                    case 'join me':
                        return -1;
                    case 'active':
                        return -1;
                    case 'ask me':
                        return -1;
                }
                break;
        }
        return 0;
    };

    // location at
    var compareByLocationAt = function (a, b) {
        if (a.$location_at < b.$location_at) {
            return -1;
        }
        if (a.$location_at > b.$location_at) {
            return 1;
        }
        return 0;
    };

    // VIP friends
    $app.computed.friendsGroup0 = function () {
        if (this.orderFriendsGroup0) {
            if (this.orderFriendsGroupPrivate) {
                this.friendsGroupA_.sort(compareByPrivate);
            }
            if (this.orderFriendsGroupStatus) {
                this.friendsGroupA_.sort(compareByStatus);
            }
            return this.friendsGroupA_;
        }
        if (this.sortFriendsGroup0) {
            this.sortFriendsGroup0 = false;
            this.friendsGroup0_.sort(compareByName);
            if (this.orderFriendsGroupPrivate) {
                this.friendsGroup0_.sort(compareByPrivate);
            }
            if (this.orderFriendsGroupStatus) {
                this.friendsGroup0_.sort(compareByStatus);
            }
        }
        return this.friendsGroup0_;
    };

    // Online friends
    $app.computed.friendsGroup1 = function () {
        if (this.orderFriendsGroup1) {
            if (this.orderFriendsGroupPrivate) {
                this.friendsGroupB_.sort(compareByPrivate);
            }
            if (this.orderFriendsGroupStatus) {
                this.friendsGroupB_.sort(compareByStatus);
            }
            return this.friendsGroupB_;
        }
        if (this.sortFriendsGroup1) {
            this.sortFriendsGroup1 = false;
            this.friendsGroup1_.sort(compareByName);
            if (this.orderFriendsGroupPrivate) {
                this.friendsGroup1_.sort(compareByPrivate);
            }
            if (this.orderFriendsGroupStatus) {
                this.friendsGroup1_.sort(compareByStatus);
            }
        }
        return this.friendsGroup1_;
    };

    // Active friends
    $app.computed.friendsGroup2 = function () {
        if (this.orderFriendsGroup2) {
            return this.friendsGroupC_;
        }
        if (this.sortFriendsGroup2) {
            this.sortFriendsGroup2 = false;
            this.friendsGroup2_.sort(compareByName);
        }
        return this.friendsGroup2_;
    };

    // Offline friends
    $app.computed.friendsGroup3 = function () {
        if (this.orderFriendsGroup3) {
            return this.friendsGroupD_;
        }
        if (this.sortFriendsGroup3) {
            this.sortFriendsGroup3 = false;
            this.friendsGroup3_.sort(compareByName);
        }
        return this.friendsGroup3_;
    };

    $app.methods.userStatusClass = function (user) {
        var style = {};
        if (typeof user !== 'undefined') {
            var id = '';
            if (user.id) {
                id = user.id;
            } else if (user.userId) {
                id = user.userId;
            }
            if (id && id === API.currentUser.id) {
                return this.statusClass(user.status);
            }
            if (!user.isFriend) {
                return '';
            }
            // temp fix
            if (
                user.status !== 'active' &&
                user.location === 'private' &&
                user.state === '' &&
                id &&
                !API.currentUser.onlineFriends.includes(id)
            ) {
                if (API.currentUser.activeFriends.includes(id)) {
                    // Active
                    style.active = true;
                } else {
                    // Offline
                    style.offline = true;
                }
            } else if (user.location === 'offline') {
                // Offline
                style.offline = true;
            } else if (user.state === 'active') {
                // Active
                style.active = true;
            } else if (user.status === 'active') {
                // Online
                style.online = true;
            } else if (user.status === 'join me') {
                // Join Me
                style.joinme = true;
            } else if (user.status === 'ask me') {
                // Ask Me
                style.askme = true;
            } else if (user.status === 'busy') {
                // Do Not Disturb
                style.busy = true;
            }
        }
        return style;
    };

    $app.methods.statusClass = function (status) {
        var style = {};
        if (typeof status !== 'undefined') {
            if (status === 'active') {
                // Online
                style.online = true;
            } else if (status === 'join me') {
                // Join Me
                style.joinme = true;
            } else if (status === 'ask me') {
                // Ask Me
                style.askme = true;
            } else if (status === 'busy') {
                // Do Not Disturb
                style.busy = true;
            }
        }
        return style;
    };

    $app.methods.confirmDeleteFriend = function (id) {
        this.$confirm('Continue? Unfriend', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    API.deleteFriend({
                        userId: id
                    });
                }
            }
        });
    };

    // App: Quick Search

    $app.data.quickSearch = '';
    $app.data.quickSearchItems = [];

    $app.methods.quickSearchRemoteMethod = function (query) {
        var results = [];
        if (query) {
            var QUERY = query.toUpperCase();
            for (var ctx of this.friends.values()) {
                if (typeof ctx.ref === 'undefined') {
                    continue;
                }
                var NAME = ctx.name.toUpperCase();
                var match = NAME.includes(QUERY);
                if (!match) {
                    var uname = String(ctx.ref.username);
                    match =
                        uname.toUpperCase().includes(QUERY) &&
                        !uname.startsWith('steam_');
                }
                if (!match && ctx.memo) {
                    match = String(ctx.memo).toUpperCase().includes(QUERY);
                }
                if (match) {
                    results.push({
                        value: ctx.id,
                        label: ctx.name,
                        ref: ctx.ref,
                        NAME
                    });
                }
            }
            results.sort(function (a, b) {
                var A = a.NAME.startsWith(QUERY);
                var B = b.NAME.startsWith(QUERY);
                if (A !== B) {
                    if (A) {
                        return -1;
                    }
                    if (B) {
                        return 1;
                    }
                }
                if (a.NAME < b.NAME) {
                    return -1;
                }
                if (a.NAME > b.NAME) {
                    return 1;
                }
                return 0;
            });
            if (results.length > 4) {
                results.length = 4;
            }
            results.push({
                value: `search:${query}`,
                label: query
            });
        }
        this.quickSearchItems = results;
    };

    $app.methods.quickSearchChange = function (value) {
        if (value) {
            if (value.startsWith('search:')) {
                this.friendsListSearch = value.substr(7);
                this.$refs.menu.activeIndex = 'friendsList';
            } else {
                this.showUserDialog(value);
            }
        }
    };

    // NOTE: 그냥 열고 닫고 했을때 changed 이벤트 발생이 안되기 때문에 넣음
    $app.methods.quickSearchVisibleChange = function (value) {
        if (value) {
            this.quickSearch = '';
        }
    };

    // App: Feed

    $app.data.feedTable = {
        data: [],
        filters: [
            {
                prop: 'type',
                value: [],
                filterFn: (row, filter) =>
                    filter.value.some((v) => v === row.type)
            },
            {
                prop: 'displayName',
                value: ''
            },
            {
                prop: 'userId',
                value: false,
                filterFn: (row, filter) =>
                    !filter.value ||
                    API.cachedFavoritesByObjectId.has(row.userId)
            }
        ],
        tableProps: {
            stripe: true,
            size: 'mini',
            defaultSort: {
                prop: 'created_at',
                order: 'descending'
            }
        },
        pageSize: 10,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 25, 50, 100]
        }
    };

    API.$on('LOGIN', async function (args) {
        $app.feedTable.data = [];
        $app.friendLogInitStatus = false;
        await database.initUserTables(args.json.id);
        $app.feedTable.data = await database.getFeedDatabase();
        $app.sweepFeed();
        if (configRepository.getBool(`friendLogInit_${args.json.id}`)) {
            await $app.getFriendLog();
        } else {
            await $app.initFriendLog(args.json.id);
        }
        this.getAuth();

        $app.updateSharedFeed(true);

        if ($app.isGameRunning) {
            $app.loadPlayerList();
        }
        // remove old data from json file and migrate to SQLite
        if (VRCXStorage.Get(`${args.json.id}_friendLogUpdatedAt`)) {
            VRCXStorage.Remove(`${args.json.id}_feedTable`);
            $app.migrateMemos();
            $app.migrateFriendLog(args.json.id);
        }
    });

    $app.methods.loadPlayerList = function () {
        var {data} = this.gameLogTable;
        if (data.length === 0) {
            return;
        }
        var length = 0;
        for (var i = data.length - 1; i > -1; i--) {
            var ctx = data[i];
            if (ctx.type === 'Location') {
                this.lastLocation = {
                    date: Date.parse(ctx.created_at),
                    location: ctx.location,
                    name: ctx.worldName,
                    playerList: new Map(),
                    friendList: new Map()
                };
                length = i;
                break;
            }
        }
        if (length > 0) {
            for (var i = length + 1; i < data.length; i++) {
                var ctx = data[i];
                if (ctx.type === 'OnPlayerJoined') {
                    if (!ctx.userId) {
                        for (var ref of API.cachedUsers.values()) {
                            if (ref.displayName === ctx.displayName) {
                                ctx.userId = ref.id;
                                break;
                            }
                        }
                    }
                    var userMap = {
                        displayName: ctx.displayName,
                        userId: ctx.userId,
                        joinTime: Date.parse(ctx.created_at)
                    };
                    this.lastLocation.playerList.set(ctx.displayName, userMap);
                    if (
                        this.friends.has(ctx.userId) ||
                        API.currentUser.displayName === ctx.displayName
                    ) {
                        this.lastLocation.friendList.set(
                            ctx.displayName,
                            userMap
                        );
                    }
                }
                if (ctx.type === 'OnPlayerLeft') {
                    this.lastLocation.playerList.delete(ctx.displayName);
                    this.lastLocation.friendList.delete(ctx.displayName);
                }
            }
            this.updateVRLastLocation();
        }
    };

    API.$on('USER:UPDATE', async function (args) {
        var {ref, props} = args;
        if ($app.friends.has(ref.id) === false) {
            return;
        }
        if (
            props.location &&
            props.location[0] !== 'offline' &&
            props.location[0] !== '' &&
            props.location[1] !== 'offline' &&
            props.location[1] !== ''
        ) {
            var worldName = await $app.getWorldName(props.location[0]);
            var feed = {
                created_at: new Date().toJSON(),
                type: 'GPS',
                userId: ref.id,
                displayName: ref.displayName,
                location: props.location[0],
                worldName,
                previousLocation: props.location[1],
                time: props.location[2]
            };
            $app.addFeed(feed);
            database.addGPSToDatabase(feed);
            $app.updateFriendGPS(ref.id);
            $app.feedDownloadWorldCache(ref.id, props.location[0]);
        }
        if (
            (props.currentAvatarImageUrl ||
                props.currentAvatarThumbnailImageUrl) &&
            props.currentAvatarImageUrl !==
                'https://assets.vrchat.com/system/defaultAvatar.png'
        ) {
            var currentAvatarImageUrl = '';
            var previousCurrentAvatarImageUrl = '';
            var currentAvatarThumbnailImageUrl = '';
            var previousCurrentAvatarThumbnailImageUrl = '';
            if (props.currentAvatarImageUrl) {
                currentAvatarImageUrl = props.currentAvatarImageUrl[0];
                previousCurrentAvatarImageUrl = props.currentAvatarImageUrl[1];
            } else {
                currentAvatarImageUrl = ref.currentAvatarImageUrl;
                previousCurrentAvatarImageUrl = ref.currentAvatarImageUrl;
            }
            if (props.currentAvatarThumbnailImageUrl) {
                currentAvatarThumbnailImageUrl =
                    props.currentAvatarThumbnailImageUrl[0];
                previousCurrentAvatarThumbnailImageUrl =
                    props.currentAvatarThumbnailImageUrl[1];
            } else {
                currentAvatarThumbnailImageUrl =
                    ref.currentAvatarThumbnailImageUrl;
                previousCurrentAvatarThumbnailImageUrl =
                    ref.currentAvatarThumbnailImageUrl;
            }
            var avatarInfo = {
                ownerId: '',
                avatarName: ''
            };
            try {
                avatarInfo = await $app.getAvatarName(currentAvatarImageUrl);
            } catch (err) {}
            var feed = {
                created_at: new Date().toJSON(),
                type: 'Avatar',
                userId: ref.id,
                displayName: ref.displayName,
                ownerId: avatarInfo.ownerId,
                avatarName: avatarInfo.avatarName,
                currentAvatarImageUrl,
                currentAvatarThumbnailImageUrl,
                previousCurrentAvatarImageUrl,
                previousCurrentAvatarThumbnailImageUrl
            };
            $app.addFeed(feed);
            database.addAvatarToDatabase(feed);
        }
        if (props.status || props.statusDescription) {
            var status = '';
            var previousStatus = '';
            var statusDescription = '';
            var previousStatusDescription = '';
            if (props.status) {
                if (props.status[0]) {
                    status = props.status[0];
                }
                if (props.status[1]) {
                    previousStatus = props.status[1];
                }
            } else if (ref.status) {
                status = ref.status;
                previousStatus = ref.status;
            }
            if (props.statusDescription) {
                if (props.statusDescription[0]) {
                    statusDescription = props.statusDescription[0];
                }
                if (props.statusDescription[1]) {
                    previousStatusDescription = props.statusDescription[1];
                }
            } else if (ref.statusDescription) {
                statusDescription = ref.statusDescription;
                previousStatusDescription = ref.statusDescription;
            }
            var feed = {
                created_at: new Date().toJSON(),
                type: 'Status',
                userId: ref.id,
                displayName: ref.displayName,
                status,
                statusDescription,
                previousStatus,
                previousStatusDescription
            };
            $app.addFeed(feed);
            database.addStatusToDatabase(feed);
        }
    });

    $app.methods.addFeed = function (feed) {
        this.feedTable.data.push(feed);
        this.sweepFeed();
        this.updateSharedFeed(false);
        this.queueFeedNoty(feed);
        this.notifyMenu('feed');
    };

    $app.methods.clearFeed = function () {
        // FIXME: 메시지 수정
        this.$confirm('Continue? Clear Feed', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    // 필터된 데이터만 삭제 하려면.. 허어
                    var T = this.feedTable;
                    T.data = T.data.filter(
                        (row) =>
                            !T.filters.every((filter) => {
                                if (filter.value) {
                                    if (!Array.isArray(filter.value)) {
                                        if (filter.filterFn) {
                                            return filter.filterFn(row, filter);
                                        }
                                        return String(row[filter.prop])
                                            .toUpperCase()
                                            .includes(
                                                String(
                                                    filter.value
                                                ).toUpperCase()
                                            );
                                    }
                                    if (filter.value.length) {
                                        if (filter.filterFn) {
                                            return filter.filterFn(row, filter);
                                        }
                                        var prop = String(
                                            row[filter.prop]
                                        ).toUpperCase();
                                        return filter.value.some((v) =>
                                            prop.includes(
                                                String(v).toUpperCase()
                                            )
                                        );
                                    }
                                }
                                return true;
                            })
                    );
                }
            }
        });
    };

    $app.methods.sweepFeed = function () {
        var {data} = this.feedTable;
        // 로그는 3일까지만 남김
        var limit = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toJSON();
        var i = 0;
        var j = data.length;
        while (i < j && data[i].created_at < limit) {
            ++i;
        }
        if (i === j) {
            this.feedTable.data = [];
        } else if (i) {
            data.splice(0, i);
        }
    };

    // App: gameLog

    $app.data.lastLocation = {
        date: 0,
        location: '',
        name: '',
        playerList: new Map(),
        friendList: new Map()
    };

    $app.methods.lastLocationReset = function () {
        var playerList = Array.from(this.lastLocation.playerList.values());
        for (var ref of playerList) {
            var time = new Date().getTime() - ref.joinTime;
            var entry = {
                created_at: new Date().toJSON(),
                type: 'OnPlayerLeft',
                displayName: ref.displayName,
                location: this.lastLocation.location,
                userId: ref.userId,
                time
            };
            $app.addGameLog(entry);
            database.addGamelogJoinLeaveToDatabase(entry);
        }
        if (this.lastLocation.date !== 0) {
            var timeLocation = new Date().getTime() - this.lastLocation.date;
            var update = {
                time: timeLocation,
                created_at: new Date(this.lastLocation.date).toJSON()
            };
            database.updateGamelogLocationTimeToDatabase(update);
        }
        this.lastLocation = {
            date: 0,
            location: '',
            name: '',
            playerList: new Map(),
            friendList: new Map()
        };
        this.updateVRLastLocation();
    };

    $app.data.lastLocation$ = {
        tag: '',
        instanceId: '',
        accessType: '',
        worldName: '',
        worldCapacity: 0,
        joinUrl: '',
        statusName: '',
        statusImage: ''
    };
    $app.data.discordActive = configRepository.getBool('discordActive');
    $app.data.discordInstance = configRepository.getBool('discordInstance');
    $app.data.discordJoinButton = configRepository.getBool('discordJoinButton');
    $app.methods.saveDiscordOption = function () {
        configRepository.setBool('discordActive', this.discordActive);
        configRepository.setBool('discordInstance', this.discordInstance);
        configRepository.setBool('discordJoinButton', this.discordJoinButton);
        if (!this.discordActive) {
            Discord.SetText('', '');
            Discord.SetActive(false);
        }
        this.lastLocation$.tag = '';
        this.updateDiscord();
    };

    $app.data.gameLogTable = {
        data: [],
        lastEntryDate: '',
        filters: [
            {
                prop: 'type',
                value: [],
                filterFn: (row, filter) =>
                    filter.value.some((v) => v === row.type)
            },
            {
                prop: 'displayName',
                value: ''
            },
            {
                prop: 'displayName',
                value: true,
                filterFn: (row) =>
                    row.displayName !== API.currentUser.displayName
            },
            {
                prop: 'type',
                value: true,
                filterFn: (row) =>
                    row.type !== 'Notification' &&
                    row.type !== 'LocationDestination'
            }
        ],
        tableProps: {
            stripe: true,
            size: 'mini',
            defaultSort: {
                prop: 'created_at',
                order: 'descending'
            }
        },
        pageSize: 10,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 25, 50, 100]
        }
    };

    $app.methods.resetGameLog = async function () {
        await gameLogService.reset();
        this.gameLogTable.data = [];
        this.lastLocationReset();
    };

    $app.methods.sweepGameLog = function () {
        var {data} = this.gameLogTable;
        // 로그는 7일까지만 남김
        var limit = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toJSON();
        var i = 0;
        var j = data.length;
        while (i < j && data[i].created_at < limit) {
            ++i;
        }
        if (i === j) {
            this.gameLogTable.data = [];
        } else if (i) {
            data.splice(0, i);
        }
    };

    $app.methods.refreshEntireGameLog = async function () {
        await gameLogService.setDateTill('1970-01-01');
        await database.initTables();
        await this.resetGameLog();
        var location = '';
        var pushToTable = false;
        for (var gameLog of await gameLogService.getAll()) {
            if (gameLog.type === 'location') {
                location = gameLog.location;
            }
            this.addGameLogEntry(gameLog, location, pushToTable);
        }
        this.getGameLogTable();
    };

    $app.methods.getGameLogTable = async function () {
        await database.initTables();
        this.gameLogTable.data = await database.getGamelogDatabase();
        this.sweepGameLog();
        var length = this.gameLogTable.data.length;
        if (length > 1) {
            this.updateGameLog(this.gameLogTable.data[length - 1].created_at);
        }
    };

    $app.methods.updateGameLog = async function (dateTill) {
        await gameLogService.setDateTill(dateTill);
        await gameLogService.reset();
        await new Promise((resolve) => {
            setTimeout(resolve, 10000);
        });
        var location = '';
        var pushToTable = true;
        for (var gameLog of await gameLogService.getAll()) {
            if (gameLog.type === 'location') {
                location = gameLog.location;
            }
            this.addGameLogEntry(gameLog, location, pushToTable);
        }
    };

    $app.methods.addGameLogEvent = function (json) {
        var rawLogs = JSON.parse(json);
        var gameLog = gameLogService.parseRawGameLog(
            rawLogs[1],
            rawLogs[2],
            rawLogs.slice(3)
        );
        var pushToTable = true;
        this.addGameLogEntry(gameLog, this.lastLocation.location, pushToTable);
    };

    $app.lastLocationDestinationTime = 0;

    $app.methods.addGameLogEntry = function (gameLog, location, pushToTable) {
        var userId = '';
        if (gameLog.userDisplayName) {
            for (var ref of API.cachedUsers.values()) {
                if (ref.displayName === gameLog.userDisplayName) {
                    userId = ref.id;
                    break;
                }
            }
        }
        switch (gameLog.type) {
            case 'location-destination':
                if (this.isGameRunning) {
                    this.cancelVRChatCacheDownload(gameLog.location);
                    this.clearNowPlaying();
                }
                this.lastLocationDestinationTime = Date.parse(gameLog.dt);
                var entry = {
                    created_at: gameLog.dt,
                    type: 'LocationDestination',
                    location: gameLog.location
                };
                break;
            case 'location':
                if (this.isGameRunning) {
                    this.lastLocationReset();
                    this.clearNowPlaying();
                    this.lastLocation = {
                        date: Date.parse(gameLog.dt),
                        location: gameLog.location,
                        name: gameLog.worldName,
                        playerList: new Map(),
                        friendList: new Map()
                    };
                    this.updateVRLastLocation();
                    this.cancelVRChatCacheDownload(gameLog.location);
                }
                var L = API.parseLocation(gameLog.location);
                var entry = {
                    created_at: gameLog.dt,
                    type: 'Location',
                    location: gameLog.location,
                    worldId: L.worldId,
                    worldName: gameLog.worldName,
                    time: 0
                };
                database.addGamelogLocationToDatabase(entry);
                break;
            case 'player-joined':
                var userMap = {
                    displayName: gameLog.userDisplayName,
                    userId,
                    joinTime: Date.parse(gameLog.dt)
                };
                this.lastLocation.playerList.set(
                    gameLog.userDisplayName,
                    userMap
                );
                if (
                    this.friends.has(userId) ||
                    API.currentUser.displayName === gameLog.userDisplayName
                ) {
                    this.lastLocation.friendList.set(
                        gameLog.userDisplayName,
                        userMap
                    );
                }
                this.updateVRLastLocation();
                var entry = {
                    created_at: gameLog.dt,
                    type: 'OnPlayerJoined',
                    displayName: gameLog.userDisplayName,
                    location,
                    userId,
                    time: 0
                };
                database.addGamelogJoinLeaveToDatabase(entry);
                break;
            case 'player-left':
                var time = 0;
                var ref = this.lastLocation.playerList.get(
                    gameLog.userDisplayName
                );
                if (typeof ref !== 'undefined') {
                    time = new Date().getTime() - ref.joinTime;
                    this.lastLocation.playerList.delete(
                        gameLog.userDisplayName
                    );
                    this.lastLocation.friendList.delete(
                        gameLog.userDisplayName
                    );
                }
                this.updateVRLastLocation();
                var entry = {
                    created_at: gameLog.dt,
                    type: 'OnPlayerLeft',
                    displayName: gameLog.userDisplayName,
                    location,
                    userId,
                    time
                };
                database.addGamelogJoinLeaveToDatabase(entry);
                break;
            case 'portal-spawn':
                var entry = {
                    created_at: gameLog.dt,
                    type: 'PortalSpawn',
                    displayName: gameLog.userDisplayName,
                    location,
                    userId,
                    instanceId: '',
                    worldName: ''
                };
                database.addGamelogPortalSpawnToDatabase(entry);
                break;
            case 'video-play':
                this.addGameLogVideo(gameLog, location, userId, pushToTable);
                return;
            case 'vrcx':
                // VideoPlay(PyPyDance) "https://jd.pypy.moe/api/v1/videos/jr1NX4Jo8GE.mp4",0.1001,239.606,"0905 : [J-POP] 【まなこ】金曜日のおはよう 踊ってみた (vernities)"
                var type = gameLog.data.substr(0, gameLog.data.indexOf(' '));
                if (type === 'VideoPlay(PyPyDance)') {
                    this.addGameLogPyPyDance(gameLog, location, pushToTable);
                }
                return;
            case 'notification':
                var entry = {
                    created_at: gameLog.dt,
                    type: 'Notification',
                    data: gameLog.json
                };
                break;
            case 'event':
                var entry = {
                    created_at: gameLog.dt,
                    type: 'Event',
                    data: gameLog.event
                };
                database.addGamelogEventToDatabase(entry);
                break;
        }
        if (pushToTable && entry) {
            this.queueGameLogNoty(entry);
            this.gameLogTable.data.push(entry);
            this.updateSharedFeed(false);
            this.notifyMenu('gameLog');
            this.sweepGameLog();
        }
    };

    $app.methods.addGameLogVideo = async function (
        gameLog,
        location,
        userId,
        pushToTable
    ) {
        var videoUrl = gameLog.videoUrl;
        var youtubeVideoId = '';
        var videoId = '';
        var videoName = '';
        var videoLength = '';
        var displayName = '';
        var videoPos = 10; // video loading delay
        if (typeof gameLog.displayName !== 'undefined') {
            displayName = gameLog.displayName;
        }
        if (typeof gameLog.videoPos !== 'undefined') {
            videoPos = gameLog.videoPos;
        }
        var L = API.parseLocation(location);
        if (
            L.worldId !== 'wrld_f20326da-f1ac-45fc-a062-609723b097b1' ||
            gameLog.videoId === 'YouTube'
        ) {
            // skip PyPyDance videos
            try {
                var url = new URL(videoUrl);
                var id1 = url.pathname;
                var id2 = url.searchParams.get('v');
                if (id1 && id1.length === 12) {
                    youtubeVideoId = id1.substring(1, 12);
                }
                if (id2 && id2.length === 11) {
                    youtubeVideoId = id2;
                }
                if (this.youTubeApi && youtubeVideoId) {
                    var data = await this.lookupYouTubeVideo(youtubeVideoId);
                    if (data || data.pageInfo.totalResults !== 0) {
                        videoId = 'YouTube';
                        videoName = data.items[0].snippet.title;
                        videoLength = this.convertYoutubeTime(
                            data.items[0].contentDetails.duration
                        );
                    }
                }
            } catch {
                console.error(`Invalid URL: ${url}`);
            }
            var entry = {
                created_at: gameLog.dt,
                type: 'VideoPlay',
                videoUrl,
                videoId,
                videoName,
                videoLength,
                location,
                displayName,
                userId,
                videoPos
            };
            if (pushToTable) {
                this.setNowPlaying(entry);
                this.queueGameLogNoty(entry);
                this.gameLogTable.data.push(entry);
                this.updateSharedFeed(false);
                this.notifyMenu('gameLog');
                this.sweepGameLog();
            }
            database.addGamelogVideoPlayToDatabase(entry);
        }
    };

    $app.methods.addGameLogPyPyDance = function (
        gameLog,
        location,
        pushToTable
    ) {
        var data =
            /VideoPlay\(PyPyDance\) "(.+?)",([\d.]+),([\d.]+),"(.+?)\s*(?:)?"/g.exec(
                gameLog.data
            );
        var videoUrl = data[1];
        var videoPos = Number(data[2]);
        var videoLength = Number(data[3]);
        var title = data[4];
        var bracketArray = title.split('(');
        var text1 = bracketArray.pop();
        var displayName = text1.slice(0, -1);
        var text2 = bracketArray.join('(');
        if (text2 === 'URL ') {
            var videoId = 'YouTube';
        } else {
            var videoId = text2.substr(0, text2.indexOf(':') - 1);
            text2 = text2.substr(text2.indexOf(':') + 2);
        }
        var videoName = text2.slice(0, -1);
        var userId = '';
        if (displayName && displayName !== 'Random') {
            for (var ref of API.cachedUsers.values()) {
                if (ref.displayName === displayName) {
                    userId = ref.id;
                    break;
                }
            }
        }
        if (videoId === 'YouTube') {
            var entry = {
                dt: gameLog.dt,
                videoUrl,
                displayName,
                videoPos,
                videoId
            };
            this.addGameLogVideo(entry, location, userId, pushToTable);
        } else {
            var entry = {
                created_at: gameLog.dt,
                type: 'VideoPlay',
                videoUrl,
                videoId,
                videoName,
                videoLength,
                location,
                displayName,
                userId,
                videoPos
            };
            if (pushToTable) {
                this.setNowPlaying(entry);
                this.queueGameLogNoty(entry);
                this.gameLogTable.data.push(entry);
                this.updateSharedFeed(false);
                this.notifyMenu('gameLog');
                this.sweepGameLog();
            }
            database.addGamelogVideoPlayToDatabase(entry);
        }
    };

    $app.methods.lookupYouTubeVideo = async function (videoId) {
        var data = null;
        var apiKey = 'AIzaSyA-iUQCpWf5afEL3NanEOSxbzziPMU3bxY';
        if (this.youTubeApiKey) {
            apiKey = this.youTubeApiKey;
        }
        try {
            var response = await webApiService.execute({
                url: `https://www.googleapis.com/youtube/v3/videos?id=${videoId}&part=snippet,contentDetails&key=${apiKey}`,
                method: 'GET',
                headers: {
                    'User-Agent': appVersion,
                    Referer: 'https://vrcx.pypy.moe'
                }
            });
            var json = JSON.parse(response.data);
            if (response.status === 200) {
                data = json;
            } else {
                throw new Error(`Error: ${response.data}`);
            }
        } catch {
            console.error(`YouTube video lookup failed for ${videoId}`);
        }
        return data;
    };

    $app.data.nowPlaying = {
        url: '',
        name: '',
        length: 0,
        startTime: 0,
        elapsed: 0,
        percentage: 0,
        remainingText: '',
        playing: false
    };

    $app.methods.clearNowPlaying = function () {
        this.nowPlaying = {
            url: '',
            name: '',
            length: 0,
            startTime: 0,
            elapsed: 0,
            percentage: 0,
            remainingText: '',
            playing: false
        };
        this.updateVrNowPlaying();
    };

    $app.methods.setNowPlaying = function (ctx) {
        var displayName = '';
        if (ctx.displayName) {
            displayName = ` (${ctx.displayName})`;
        }
        var name = `${ctx.videoName}${displayName}`;
        this.nowPlaying = {
            url: ctx.videoUrl,
            name,
            length: ctx.videoLength,
            startTime: Date.parse(ctx.created_at) / 1000 - ctx.videoPos,
            elapsed: 0,
            percentage: 0,
            remainingText: ''
        };
        if (!this.nowPlaying.playing) {
            this.nowPlaying.playing = true;
            this.updateNowPlaying();
        }
    };

    $app.methods.updateNowPlaying = function () {
        var np = this.nowPlaying;
        if (!np.url) {
            this.nowPlaying.playing = false;
            return;
        }
        var now = Date.now() / 1000;
        np.elapsed = Math.round((now - np.startTime) * 10) / 10;
        if (np.elapsed >= np.length) {
            this.clearNowPlaying();
            return;
        }
        np.remainingText = this.formatSeconds(np.length - np.elapsed);
        np.percentage = Math.round(((np.elapsed * 100) / np.length) * 10) / 10;
        this.updateVrNowPlaying();
        setTimeout(() => this.updateNowPlaying(), 1000);
    };

    $app.methods.updateVrNowPlaying = function () {
        var json = JSON.stringify(this.nowPlaying);
        AppApi.ExecuteVrFeedFunction('nowPlayingUpdate', json);
    };

    $app.methods.formatSeconds = function (duration) {
        var pad = function (num, size) {
                return `000${num}`.slice(size * -1);
            },
            time = parseFloat(duration).toFixed(3),
            hours = Math.floor(time / 60 / 60),
            minutes = Math.floor(time / 60) % 60,
            seconds = Math.floor(time - minutes * 60);
        var hoursOut = '';
        if (hours > '0') {
            hoursOut = `${pad(hours, 2)}:`;
        }
        return `${hoursOut + pad(minutes, 2)}:${pad(seconds, 2)}`;
    };

    $app.methods.convertYoutubeTime = function (duration) {
        var a = duration.match(/\d+/g);
        if (
            duration.indexOf('M') >= 0 &&
            duration.indexOf('H') === -1 &&
            duration.indexOf('S') === -1
        ) {
            a = [0, a[0], 0];
        }
        if (duration.indexOf('H') >= 0 && duration.indexOf('M') === -1) {
            a = [a[0], 0, a[1]];
        }
        if (
            duration.indexOf('H') >= 0 &&
            duration.indexOf('M') === -1 &&
            duration.indexOf('S') === -1
        ) {
            a = [a[0], 0, 0];
        }
        var length = 0;
        if (a.length === 3) {
            length += parseInt(a[0], 10) * 3600;
            length += parseInt(a[1], 10) * 60;
            length += parseInt(a[2], 10);
        }
        if (a.length === 2) {
            length += parseInt(a[0], 10) * 60;
            length += parseInt(a[1], 10);
        }
        if (a.length === 1) {
            length += parseInt(a[0], 10);
        }
        return length;
    };

    $app.methods.updateDiscord = function () {
        if (!this.discordActive || !this.isGameRunning) {
            return;
        }
        var L = this.lastLocation$;
        if (this.lastLocation.location !== this.lastLocation$.tag) {
            if (this.lastLocation.location) {
                Discord.SetActive(true);
            }
            Discord.SetTimestamps(this.lastLocation.date, 0);
            L = API.parseLocation(this.lastLocation.location);
            L.worldName = '';
            L.worldCapacity = 0;
            L.joinUrl = '';
            if (L.worldId) {
                var ref = API.cachedWorlds.get(L.worldId);
                if (ref) {
                    L.worldName = ref.name;
                    L.worldCapacity = ref.capacity * 2;
                } else {
                    API.getWorld({
                        worldId: L.worldId
                    }).then((args) => {
                        L.worldName = args.ref.name;
                        L.worldCapacity = args.ref.capacity * 2;
                        return args;
                    });
                }
                switch (L.accessType) {
                    case 'public':
                        L.joinUrl = getLaunchURL(L.worldId, L.instanceId);
                        L.accessType = 'Public';
                        break;
                    case 'invite+':
                        L.accessType = 'Invite+';
                        break;
                    case 'invite':
                        L.accessType = 'Invite';
                        break;
                    case 'friends':
                        L.accessType = 'Friends';
                        break;
                    case 'friends+':
                        L.accessType = 'Friends+';
                        break;
                }
            }
            this.lastLocation$ = L;
        }
        switch (API.currentUser.status) {
            case 'active':
                L.statusName = 'Online';
                L.statusImage = 'active';
                break;
            case 'join me':
                L.statusName = 'Join Me';
                L.statusImage = 'joinme';
                break;
            case 'ask me':
                L.statusName = 'Ask Me';
                L.statusImage = 'askme';
                break;
            case 'busy':
                L.statusName = 'Do Not Disturb';
                L.statusImage = 'busy';
                break;
        }
        var appId = '883308884863901717';
        var bigIcon = 'vrchat';
        if (
            L.worldId === 'wrld_f20326da-f1ac-45fc-a062-609723b097b1' ||
            L.worldId === 'wrld_42377cf1-c54f-45ed-8996-5875b0573a83'
        ) {
            if (L.worldId === 'wrld_f20326da-f1ac-45fc-a062-609723b097b1') {
                appId = '784094509008551956';
                bigIcon = 'pypy';
            } else if (
                L.worldId === 'wrld_42377cf1-c54f-45ed-8996-5875b0573a83'
            ) {
                appId = '846232616054030376';
                bigIcon = 'vr_dancing';
            }
            if (this.nowPlaying.playing) {
                L.worldName = this.nowPlaying.name;
                Discord.SetTimestamps(
                    Date.now(),
                    (this.nowPlaying.startTime + this.nowPlaying.length) * 1000
                );
            }
        }
        Discord.SetAssets(
            bigIcon, // big icon
            'Powered by VRCX', // big icon hover text
            L.statusImage, // small icon
            L.statusName, // small icon hover text
            L.instanceId, // party id
            this.lastLocation.playerList.size, // party size
            L.worldCapacity, // party max size
            'Join', // button text
            L.joinUrl, // button url
            appId // app id
        );
        // NOTE
        // 글자 수가 짧으면 업데이트가 안된다..
        if (L.worldName.length < 2) {
            L.worldName += '\uFFA0'.repeat(2 - L.worldName.length);
        }
        if (API.currentUser.status === 'busy') {
            Discord.SetText('Do Not Disturb', '');
            Discord.SetTimestamps(0, 0);
        } else if (this.discordInstance) {
            Discord.SetText(L.worldName, L.accessType);
        } else {
            Discord.SetText(L.worldName, '');
        }
    };

    $app.methods.lookupUser = async function (ref) {
        if (ref.userId) {
            this.showUserDialog(ref.userId);
            return;
        }
        for (var ctx of API.cachedUsers.values()) {
            if (ctx.displayName === ref.displayName) {
                this.showUserDialog(ctx.id);
                return;
            }
        }
        try {
            var username = encodeURIComponent(ref.displayName.toLowerCase());
            var args = await API.getUserByUsername({username});
            if (args.ref.displayName === ref.displayName) {
                this.showUserDialog(args.ref.id);
                return;
            }
        } catch (err) {}
        this.searchText = ref.displayName;
        await this.searchUser();
        for (var ctx of this.searchUserResults) {
            if (ctx.displayName === ref.displayName) {
                this.searchText = '';
                this.clearSearch();
                this.showUserDialog(ctx.id);
                return;
            }
        }
        this.$refs.searchTab.currentName = '0';
        this.$refs.menu.activeIndex = 'search';
    };

    // App: Search

    $app.data.searchText = '';
    $app.data.searchUserResults = [];
    $app.data.searchUserParams = {};
    $app.data.searchWorldResults = [];
    $app.data.searchWorldOption = '';
    $app.data.searchWorldParams = {};
    $app.data.searchAvatarResults = [];
    $app.data.searchAvatarParams = {};
    $app.data.isSearchUserLoading = false;
    $app.data.isSearchWorldLoading = false;
    $app.data.isSearchAvatarLoading = false;

    API.$on('LOGIN', function () {
        $app.searchText = '';
        $app.searchUserResults = [];
        $app.searchUserParams = {};
        $app.searchWorldResults = [];
        $app.searchWorldOption = '';
        $app.searchWorldParams = {};
        $app.searchAvatarResults = [];
        $app.searchAvatarParams = {};
        $app.isSearchUserLoading = false;
        $app.isSearchWorldLoading = false;
        $app.isSearchAvatarLoading = false;
    });

    $app.methods.clearSearch = function () {
        this.searchUserResults = [];
        this.searchWorldResults = [];
        this.searchAvatarResults = [];
    };

    $app.methods.search = function () {
        this.searchUser();
        this.searchWorld({});
    };

    $app.methods.searchUser = async function () {
        this.searchUserParams = {
            n: 10,
            offset: 0,
            search: this.searchText
        };
        await this.moreSearchUser();
    };

    $app.methods.moreSearchUser = async function (go) {
        var params = this.searchUserParams;
        if (go) {
            params.offset += params.n * go;
            if (params.offset < 0) {
                params.offset = 0;
            }
        }
        this.isSearchUserLoading = true;
        await API.getUsers(params)
            .finally(() => {
                this.isSearchUserLoading = false;
            })
            .then((args) => {
                var map = new Map();
                for (var json of args.json) {
                    var ref = API.cachedUsers.get(json.id);
                    if (typeof ref !== 'undefined') {
                        map.set(ref.id, ref);
                    }
                }
                this.searchUserResults = Array.from(map.values());
                return args;
            });
    };

    $app.data.searchWorldLabs = false;

    $app.methods.searchWorld = function (ref) {
        this.searchWorldOption = '';
        var params = {
            n: 10,
            offset: 0
        };
        switch (ref.sortHeading) {
            case 'featured':
                params.sort = 'order';
                params.featured = 'true';
                break;
            case 'trending':
                params.sort = 'popularity';
                params.featured = 'false';
                break;
            case 'updated':
                params.sort = 'updated';
                break;
            case 'created':
                params.sort = 'created';
                break;
            case 'publication':
                params.sort = 'publicationDate';
                break;
            case 'shuffle':
                params.sort = 'shuffle';
                break;
            case 'active':
                this.searchWorldOption = 'active';
                break;
            case 'recent':
                this.searchWorldOption = 'recent';
                break;
            case 'favorite':
                this.searchWorldOption = 'favorites';
                break;
            case 'labs':
                params.sort = 'labsPublicationDate';
                break;
            case 'heat':
                params.sort = 'heat';
                params.featured = 'false';
                break;
            default:
                params.sort = 'relevance';
                params.search = this.searchText;
                break;
        }
        params.order = ref.sortOrder || 'descending';
        if (ref.sortOwnership === 'mine') {
            params.user = 'me';
            params.releaseStatus = 'all';
        }
        if (!this.searchWorldLabs) {
            params.tag = 'system_approved';
        }
        // TODO: option.platform
        this.searchWorldParams = params;
        this.moreSearchWorld();
    };

    $app.methods.moreSearchWorld = function (go) {
        var params = this.searchWorldParams;
        if (go) {
            params.offset += params.n * go;
            if (params.offset < 0) {
                params.offset = 0;
            }
        }
        this.isSearchWorldLoading = true;
        API.getWorlds(params, this.searchWorldOption)
            .finally(() => {
                this.isSearchWorldLoading = false;
            })
            .then((args) => {
                var map = new Map();
                for (var json of args.json) {
                    var ref = API.cachedWorlds.get(json.id);
                    if (typeof ref !== 'undefined') {
                        map.set(ref.id, ref);
                    }
                }
                this.searchWorldResults = Array.from(map.values());
                return args;
            });
    };

    $app.methods.searchAvatar = function (option) {
        var params = {
            n: 10,
            offset: 0
        };
        switch (option) {
            case 'updated':
                params.sort = 'updated';
                break;
            case 'created':
                params.sort = 'created';
                break;
            case 'mine':
                params.user = 'me';
                params.releaseStatus = 'all';
                break;
            default:
                params.sort = 'popularity';
                params.search = this.searchText;
                break;
        }
        params.order = 'descending';
        // TODO: option.platform
        this.searchAvatarParams = params;
        this.moreSearchAvatar();
    };

    $app.methods.moreSearchAvatar = function (go) {
        var params = this.searchAvatarParams;
        if (go) {
            params.offset += params.n * go;
            if (params.offset < 0) {
                params.offset = 0;
            }
        }
        this.isSearchAvatarLoading = true;
        API.getAvatars(params)
            .finally(() => {
                this.isSearchAvatarLoading = false;
            })
            .then((args) => {
                var map = new Map();
                for (var json of args.json) {
                    var ref = API.cachedAvatars.get(json.id);
                    if (typeof ref !== 'undefined') {
                        map.set(ref.id, ref);
                    }
                }
                this.searchAvatarResults = Array.from(map.values());
                return args;
            });
    };

    // App: Favorite

    $app.data.favoriteObjects = new Map();
    $app.data.favoriteFriends_ = [];
    $app.data.favoriteWorlds_ = [];
    $app.data.favoriteAvatars_ = [];
    $app.data.sortFavoriteFriends = false;
    $app.data.sortFavoriteWorlds = false;
    $app.data.sortFavoriteAvatars = false;

    API.$on('LOGIN', function () {
        $app.favoriteObjects.clear();
        $app.favoriteFriends_ = [];
        $app.favoriteWorlds_ = [];
        $app.favoriteAvatars_ = [];
        $app.sortFavoriteFriends = false;
        $app.sortFavoriteWorlds = false;
        $app.sortFavoriteAvatars = false;
    });

    API.$on('FAVORITE', function (args) {
        $app.applyFavorite(args.ref.type, args.ref.favoriteId);
    });

    API.$on('FAVORITE:@DELETE', function (args) {
        $app.applyFavorite(args.ref.type, args.ref.favoriteId);
    });

    API.$on('USER', function (args) {
        $app.applyFavorite('friend', args.ref.id);
    });

    API.$on('WORLD', function (args) {
        $app.applyFavorite('world', args.ref.id);
    });

    API.$on('AVATAR', function (args) {
        $app.applyFavorite('avatar', args.ref.id);
    });

    $app.methods.applyFavorite = function (type, objectId) {
        var favorite = API.cachedFavoritesByObjectId.get(objectId);
        var ctx = this.favoriteObjects.get(objectId);
        if (typeof favorite !== 'undefined') {
            var isTypeChanged = false;
            if (typeof ctx === 'undefined') {
                ctx = {
                    id: objectId,
                    type,
                    groupKey: favorite.$groupKey,
                    ref: null,
                    name: ''
                };
                this.favoriteObjects.set(objectId, ctx);
                if (type === 'friend') {
                    var ref = API.cachedUsers.get(objectId);
                    if (typeof ref === 'undefined') {
                        ref = this.friendLog.get(objectId);
                        if (typeof ref !== 'undefined' && ref.displayName) {
                            ctx.name = ref.displayName;
                        }
                    } else {
                        ctx.ref = ref;
                        ctx.name = ref.displayName;
                    }
                } else if (type === 'world') {
                    var ref = API.cachedWorlds.get(objectId);
                    if (typeof ref !== 'undefined') {
                        ctx.ref = ref;
                        ctx.name = ref.name;
                    }
                } else if (type === 'avatar') {
                    var ref = API.cachedAvatars.get(objectId);
                    if (typeof ref !== 'undefined') {
                        ctx.ref = ref;
                        ctx.name = ref.name;
                    }
                }
                isTypeChanged = true;
            } else {
                if (ctx.type !== type) {
                    // WTF???
                    isTypeChanged = true;
                    if (type === 'friend') {
                        removeFromArray(this.favoriteFriends_, ctx);
                    } else if (type === 'world') {
                        removeFromArray(this.favoriteWorlds_, ctx);
                    } else if (type === 'avatar') {
                        removeFromArray(this.favoriteAvatars_, ctx);
                    }
                }
                if (type === 'friend') {
                    var ref = API.cachedUsers.get(objectId);
                    if (typeof ref !== 'undefined') {
                        if (ctx.ref !== ref) {
                            ctx.ref = ref;
                        }
                        if (ctx.name !== ref.displayName) {
                            ctx.name = ref.displayName;
                            this.sortFavoriteFriends = true;
                        }
                    }
                } else if (type === 'world') {
                    var ref = API.cachedWorlds.get(objectId);
                    if (typeof ref !== 'undefined') {
                        if (ctx.ref !== ref) {
                            ctx.ref = ref;
                        }
                        if (ctx.name !== ref.name) {
                            ctx.name = ref.name;
                            this.sortFavoriteWorlds = true;
                        }
                    }
                } else if (type === 'avatar') {
                    var ref = API.cachedAvatars.get(objectId);
                    if (typeof ref !== 'undefined') {
                        if (ctx.ref !== ref) {
                            ctx.ref = ref;
                        }
                        if (ctx.name !== ref.name) {
                            ctx.name = ref.name;
                            this.sortFavoriteAvatars = true;
                        }
                    }
                }
            }
            if (isTypeChanged) {
                if (type === 'friend') {
                    this.favoriteFriends_.push(ctx);
                    this.sortFavoriteFriends = true;
                } else if (type === 'world') {
                    this.favoriteWorlds_.push(ctx);
                    this.sortFavoriteWorlds = true;
                } else if (type === 'avatar') {
                    this.favoriteAvatars_.push(ctx);
                    this.sortFavoriteAvatars = true;
                }
            }
        } else if (typeof ctx !== 'undefined') {
            this.favoriteObjects.delete(objectId);
            if (type === 'friend') {
                removeFromArray(this.favoriteFriends_, ctx);
            } else if (type === 'world') {
                removeFromArray(this.favoriteWorlds_, ctx);
            } else if (type === 'avatar') {
                removeFromArray(this.favoriteAvatars_, ctx);
            }
        }
    };

    $app.methods.deleteFavorite = function (objectId) {
        // FIXME: 메시지 수정
        this.$confirm('Continue? Delete Favorite', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    API.deleteFavorite({
                        objectId
                    });
                }
            }
        });
    };

    $app.methods.changeFavoriteGroupName = function (ctx) {
        this.$prompt('Enter a new name', 'Change Group Name', {
            distinguishCancelAndClose: true,
            cancelButtonText: 'Cancel',
            confirmButtonText: 'Change',
            inputPlaceholder: 'Name',
            inputValue: ctx.displayName,
            inputPattern: /\S+/,
            inputErrorMessage: 'Name is required',
            callback: (action, instance) => {
                if (action === 'confirm') {
                    API.saveFavoriteGroup({
                        type: ctx.type,
                        group: ctx.name,
                        displayName: instance.inputValue
                    }).then((args) => {
                        this.$message({
                            message: 'Group renamed',
                            type: 'success'
                        });
                        return args;
                    });
                }
            }
        });
    };

    $app.methods.clearFavoriteGroup = function (ctx) {
        // FIXME: 메시지 수정
        this.$confirm('Continue? Clear Group', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    API.clearFavoriteGroup({
                        type: ctx.type,
                        group: ctx.name
                    });
                }
            }
        });
    };

    $app.computed.favoriteFriends = function () {
        if (this.sortFavoriteFriends) {
            this.sortFavoriteFriends = false;
            this.favoriteFriends_.sort(compareByName);
        }
        return this.favoriteFriends_;
    };

    $app.computed.favoriteWorlds = function () {
        if (this.sortFavoriteWorlds) {
            this.sortFavoriteWorlds = false;
            this.favoriteWorlds_.sort(compareByName);
        }
        return this.favoriteWorlds_;
    };

    $app.computed.favoriteAvatars = function () {
        if (this.sortFavoriteAvatars) {
            this.sortFavoriteAvatars = false;
            this.favoriteAvatars_.sort(compareByName);
        }
        return this.favoriteAvatars_;
    };

    // App: friendLog

    $app.data.friendLog = new Map();
    $app.data.friendLogTable = {
        data: [],
        filters: [
            {
                prop: 'type',
                value: [],
                filterFn: (row, filter) =>
                    filter.value.some((v) => v === row.type)
            },
            {
                prop: 'displayName',
                value: ''
            }
        ],
        tableProps: {
            stripe: true,
            size: 'mini',
            defaultSort: {
                prop: 'created_at',
                order: 'descending'
            }
        },
        pageSize: 10,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 25, 50, 100]
        }
    };

    API.$on('USER:CURRENT', function (args) {
        $app.updateFriendships(args.ref);
    });

    API.$on('USER', function (args) {
        $app.updateFriendship(args.ref);
    });

    API.$on('FRIEND:ADD', function (args) {
        $app.addFriendship(args.params.userId);
    });

    API.$on('FRIEND:DELETE', function (args) {
        $app.deleteFriendship(args.params.userId);
    });

    API.$on('FRIEND:REQUEST', function (args) {
        var ref = this.cachedUsers.get(args.params.userId);
        if (typeof ref === 'undefined') {
            return;
        }
        var friendLogHistory = {
            created_at: new Date().toJSON(),
            type: 'FriendRequest',
            userId: ref.id,
            displayName: ref.displayName
        };
        $app.friendLogTable.data.push(friendLogHistory);
        database.addFriendLogHistory(friendLogHistory);
    });

    API.$on('FRIEND:REQUEST:CANCEL', function (args) {
        var ref = this.cachedUsers.get(args.params.userId);
        if (typeof ref === 'undefined') {
            return;
        }
        var friendLogHistory = {
            created_at: new Date().toJSON(),
            type: 'CancelFriendRequst',
            userId: ref.id,
            displayName: ref.displayName
        };
        $app.friendLogTable.data.push(friendLogHistory);
        database.addFriendLogHistory(friendLogHistory);
    });

    $app.data.friendLogInitStatus = false;

    $app.methods.initFriendLog = async function (userId) {
        var sqlValues = [];
        var friends = await API.refreshFriends();
        for (var friend of friends) {
            var ref = API.applyUser(friend);
            var row = {
                userId: ref.id,
                displayName: ref.displayName,
                trustLevel: ref.$trustLevel
            };
            this.friendLog.set(friend.id, row);
            sqlValues.unshift(row);
        }
        database.setFriendLogCurrentArray(sqlValues);
        configRepository.setBool(`friendLogInit_${userId}`, true);
        this.friendLogInitStatus = true;
    };

    $app.methods.migrateFriendLog = function (userId) {
        VRCXStorage.Remove(`${userId}_friendLogUpdatedAt`);
        VRCXStorage.Remove(`${userId}_friendLog`);
        this.friendLogTable.data = VRCXStorage.GetArray(
            `${userId}_friendLogTable`
        );
        database.addFriendLogHistoryArray(this.friendLogTable.data);
        VRCXStorage.Remove(`${userId}_friendLogTable`);
        configRepository.setBool(`friendLogInit_${userId}`, true);
    };

    $app.methods.getFriendLog = async function () {
        this.friendLog = new Map();
        var friendLogCurrentArray = await database.getFriendLogCurrent();
        for (var friend of friendLogCurrentArray) {
            this.friendLog.set(friend.userId, friend);
        }
        this.friendLogTable.data = [];
        this.friendLogTable.data = await database.getFriendLogHistory();
        await API.refreshFriends();
        this.friendLogInitStatus = true;
    };

    $app.methods.addFriendship = function (id) {
        if (!this.friendLogInitStatus || this.friendLog.has(id)) {
            return;
        }
        var ctx = {
            id,
            displayName: null,
            trustLevel: null
        };
        var ref = API.cachedUsers.get(id);
        if (typeof ref !== 'undefined') {
            ctx.displayName = ref.displayName;
            ctx.trustLevel = ref.$trustLevel;
            var friendLogHistory = {
                created_at: new Date().toJSON(),
                type: 'Friend',
                userId: id,
                displayName: ctx.displayName
            };
            this.friendLogTable.data.push(friendLogHistory);
            database.addFriendLogHistory(friendLogHistory);
            this.queueFriendLogNoty(friendLogHistory);
            var friendLogCurrent = {
                userId: id,
                displayName: ctx.displayName,
                trustLevel: ctx.trustLevel
            };
            this.friendLog.set(id, friendLogCurrent);
            database.setFriendLogCurrent(friendLogCurrent);
            this.notifyMenu('friendLog');
        }
    };

    $app.methods.deleteFriendship = function (id) {
        var ctx = this.friendLog.get(id);
        if (typeof ctx === 'undefined') {
            return;
        }
        var friendLogHistory = {
            created_at: new Date().toJSON(),
            type: 'Unfriend',
            userId: id,
            displayName: ctx.displayName
        };
        this.friendLogTable.data.push(friendLogHistory);
        database.addFriendLogHistory(friendLogHistory);
        this.queueFriendLogNoty(friendLogHistory);
        this.friendLog.delete(id);
        database.deleteFriendLogCurrent(id);
        this.notifyMenu('friendLog');
    };

    $app.methods.updateFriendships = function (ref) {
        var set = new Set();
        for (var id of ref.friends) {
            set.add(id);
            this.addFriendship(id);
        }
        for (var id in this.friendLog) {
            if (set.has(id) === false) {
                this.deleteFriendship(id);
            }
        }
    };

    $app.methods.updateFriendship = function (ref) {
        var ctx = this.friendLog.get(ref.id);
        if (!this.friendLogInitStatus || typeof ctx === 'undefined') {
            return;
        }
        if (ctx.displayName !== ref.displayName) {
            if (ctx.displayName) {
                var friendLogHistory = {
                    created_at: new Date().toJSON(),
                    type: 'DisplayName',
                    userId: ref.id,
                    displayName: ref.displayName,
                    previousDisplayName: ctx.displayName
                };
            } else {
                var friendLogHistory = {
                    created_at: new Date().toJSON(),
                    type: 'Friend',
                    userId: ref.id,
                    displayName: ref.displayName
                };
            }
            this.friendLogTable.data.push(friendLogHistory);
            database.addFriendLogHistory(friendLogHistory);
            this.queueFriendLogNoty(friendLogHistory);
            var friendLogCurrent = {
                userId: ref.id,
                displayName: ref.displayName,
                trustLevel: ref.$trustLevel
            };
            this.friendLog.set(ref.id, friendLogCurrent);
            database.setFriendLogCurrent(friendLogCurrent);
            ctx.displayName = ref.displayName;
            this.notifyMenu('friendLog');
        }
        if (
            ref.$trustLevel &&
            ctx.trustLevel &&
            ctx.trustLevel !== ref.$trustLevel
        ) {
            var friendLogHistory = {
                created_at: new Date().toJSON(),
                type: 'TrustLevel',
                userId: ref.id,
                displayName: ref.displayName,
                trustLevel: ref.$trustLevel,
                previousTrustLevel: ctx.trustLevel
            };
            this.friendLogTable.data.push(friendLogHistory);
            database.addFriendLogHistory(friendLogHistory);
            this.queueFriendLogNoty(friendLogHistory);
            var friendLogCurrent = {
                userId: ref.id,
                displayName: ref.displayName,
                trustLevel: ref.$trustLevel
            };
            this.friendLog.set(ref.id, friendLogCurrent);
            database.setFriendLogCurrent(friendLogCurrent);
            this.notifyMenu('friendLog');
        }
        ctx.trustLevel = ref.$trustLevel;
    };

    $app.methods.deleteFriendLog = function (row) {
        // FIXME: 메시지 수정
        this.$confirm('Continue? Delete Log', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (
                    action === 'confirm' &&
                    removeFromArray(this.friendLogTable.data, row)
                ) {
                    database.deleteFriendLogHistory(row.rowId);
                }
            }
        });
    };

    // App: Moderation

    $app.data.playerModerationTable = {
        data: [],
        lastRunLength: 0,
        filters: [
            {
                prop: 'type',
                value: [],
                filterFn: (row, filter) =>
                    filter.value.some((v) => v === row.type)
            },
            {
                prop: ['sourceDisplayName', 'targetDisplayName'],
                value: ''
            }
        ],
        tableProps: {
            stripe: true,
            size: 'mini',
            defaultSort: {
                prop: 'created',
                order: 'descending'
            }
        },
        pageSize: 10,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 25, 50, 100]
        }
    };

    API.$on('LOGIN', function () {
        $app.playerModerationTable.data = [];
    });

    API.$on('PLAYER-MODERATION', function (args) {
        var {ref} = args;
        var array = $app.playerModerationTable.data;
        var {length} = array;
        for (var i = 0; i < length; ++i) {
            if (array[i].id === ref.id) {
                if (ref.$isDeleted) {
                    array.splice(i, 1);
                } else {
                    Vue.set(array, i, ref);
                }
                return;
            }
        }
        if (ref.$isDeleted === false) {
            $app.playerModerationTable.data.push(ref);
        }
    });

    API.$on('PLAYER-MODERATION:@DELETE', function (args) {
        var {ref} = args;
        var array = $app.playerModerationTable.data;
        var {length} = array;
        for (var i = 0; i < length; ++i) {
            if (array[i].id === ref.id) {
                array.splice(i, 1);
                return;
            }
        }
    });

    $app.methods.deletePlayerModeration = function (row) {
        // FIXME: 메시지 수정
        this.$confirm('Continue? Delete Moderation', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    API.deletePlayerModeration({
                        moderated: row.targetUserId,
                        type: row.type
                    });
                }
            }
        });
    };

    // App: Notification

    $app.data.notificationTable = {
        data: [],
        filters: [
            {
                prop: 'type',
                value: [],
                filterFn: (row, filter) =>
                    filter.value.some((v) => v === row.type)
            },
            {
                prop: 'senderUsername',
                value: ''
            }
        ],
        tableProps: {
            stripe: true,
            size: 'mini',
            defaultSort: {
                prop: 'created_at',
                order: 'descending'
            }
        },
        pageSize: 10,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 25, 50, 100]
        }
    };

    API.$on('LOGIN', function () {
        $app.notificationTable.data = [];
    });

    $app.data.unseenNotifications = [];

    API.$on('NOTIFICATION', function (args) {
        var {ref} = args;
        var array = $app.notificationTable.data;
        var {length} = array;
        for (var i = 0; i < length; ++i) {
            if (array[i].id === ref.id) {
                if (ref.$isDeleted) {
                    array.splice(i, 1);
                } else {
                    Vue.set(array, i, ref);
                }
                return;
            }
        }
        if (ref.$isDeleted === false) {
            $app.notificationTable.data.push(ref);
            if (ref.senderUserId !== this.currentUser.id) {
                $app.notifyMenu('notification');
                $app.unseenNotifications.push(ref.id);
            }
            $app.queueNotificationNoty(ref);
        }
        $app.updateSharedFeed(true);
    });

    API.$on('NOTIFICATION:SEE', function (args) {
        var {notificationId} = args.params;
        removeFromArray($app.unseenNotifications, notificationId);
        if ($app.unseenNotifications.length === 0) {
            $app.selectMenu('notification');
        }
    });

    API.$on('NOTIFICATION:@DELETE', function (args) {
        var {ref} = args;
        var array = $app.notificationTable.data;
        var {length} = array;
        for (var i = 0; i < length; ++i) {
            if (array[i].id === ref.id) {
                array.splice(i, 1);
                return;
            }
        }
    });

    $app.methods.acceptNotification = function (row) {
        // FIXME: 메시지 수정
        this.$confirm('Continue? Accept Friend Request', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    API.acceptNotification({
                        notificationId: row.id
                    });
                }
            }
        });
    };

    $app.methods.hideNotification = function (row) {
        // FIXME: 메시지 수정
        this.$confirm('Continue? Delete Notification', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    if (row.type === 'hiddenFriendRequest') {
                        API.deleteHiddenFriendRequest(
                            {
                                notificationId: row.id
                            },
                            row.senderUserId
                        );
                    } else {
                        API.hideNotification({
                            notificationId: row.id
                        });
                    }
                }
            }
        });
    };

    $app.methods.acceptRequestInvite = function (row) {
        this.$confirm('Continue? Send Invite', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    var L = API.parseLocation(this.lastLocation.location);
                    API.getCachedWorld({
                        worldId: L.worldId
                    }).then((args) => {
                        API.sendInvite(
                            {
                                instanceId: this.lastLocation.location,
                                worldId: this.lastLocation.location,
                                worldName: args.ref.name,
                                rsvp: true
                            },
                            row.senderUserId
                        ).then((_args) => {
                            this.$message('Invite sent');
                            API.hideNotification({
                                notificationId: row.id
                            });
                            return _args;
                        });
                    });
                }
            }
        });
    };

    // Save Table Filters
    $app.methods.saveTableFilters = function () {
        configRepository.setString(
            'VRCX_feedTableFilters',
            JSON.stringify(this.feedTable.filters[0].value)
        );
        configRepository.setBool(
            'VRCX_feedTableVIPFilter',
            this.feedTable.filters[2].value
        );
        configRepository.setString(
            'VRCX_gameLogTableFilters',
            JSON.stringify(this.gameLogTable.filters[0].value)
        );
        configRepository.setString(
            'VRCX_friendLogTableFilters',
            JSON.stringify(this.friendLogTable.filters[0].value)
        );
        configRepository.setString(
            'VRCX_playerModerationTableFilters',
            JSON.stringify(this.playerModerationTable.filters[0].value)
        );
        configRepository.setString(
            'VRCX_notificationTableFilters',
            JSON.stringify(this.notificationTable.filters[0].value)
        );
    };
    if (configRepository.getString('VRCX_feedTableFilters')) {
        $app.data.feedTable.filters[0].value = JSON.parse(
            configRepository.getString('VRCX_feedTableFilters')
        );
        $app.data.feedTable.filters[2].value = configRepository.getBool(
            'VRCX_feedTableVIPFilter'
        );
    }
    if (configRepository.getString('VRCX_gameLogTableFilters')) {
        $app.data.gameLogTable.filters[0].value = JSON.parse(
            configRepository.getString('VRCX_gameLogTableFilters')
        );
    }
    if (configRepository.getString('VRCX_friendLogTableFilters')) {
        $app.data.friendLogTable.filters[0].value = JSON.parse(
            configRepository.getString('VRCX_friendLogTableFilters')
        );
    }
    if (configRepository.getString('VRCX_playerModerationTableFilters')) {
        $app.data.playerModerationTable.filters[0].value = JSON.parse(
            configRepository.getString('VRCX_playerModerationTableFilters')
        );
    }
    if (configRepository.getString('VRCX_notificationTableFilters')) {
        $app.data.notificationTable.filters[0].value = JSON.parse(
            configRepository.getString('VRCX_notificationTableFilters')
        );
    }

    // App: Profile + Settings

    $app.data.configTreeData = [];
    $app.data.currentUserTreeData = [];
    $app.data.pastDisplayNameTable = {
        data: [],
        tableProps: {
            stripe: true,
            size: 'mini',
            defaultSort: {
                prop: 'updated_at',
                order: 'descending'
            }
        },
        layout: 'table'
    };
    $app.data.VRCPlusIconsTable = [];
    $app.data.galleryTable = [];
    $app.data.inviteMessageTable = {
        visible: false,
        data: [],
        tableProps: {
            stripe: true,
            size: 'mini'
        },
        layout: 'table'
    };
    $app.data.inviteResponseMessageTable = {
        visible: false,
        data: [],
        tableProps: {
            stripe: true,
            size: 'mini'
        },
        layout: 'table'
    };
    $app.data.inviteRequestMessageTable = {
        visible: false,
        data: [],
        tableProps: {
            stripe: true,
            size: 'mini'
        },
        layout: 'table'
    };
    $app.data.inviteRequestResponseMessageTable = {
        visible: false,
        data: [],
        tableProps: {
            stripe: true,
            size: 'mini'
        },
        layout: 'table'
    };
    $app.data.friendsListTable = {
        visible: false,
        data: [],
        tableProps: {
            stripe: true,
            size: 'mini',
            defaultSort: {
                prop: '$friendNum',
                order: 'descending'
            }
        },
        pageSize: 100,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [50, 100, 250, 500]
        }
    };
    $app.data.downloadHistoryTable = {
        data: [],
        tableProps: {
            stripe: true,
            size: 'mini'
        },
        pageSize: 10,
        paginationProps: {
            small: true,
            layout: 'prev,pager,next',
            pageSizes: [10, 25, 50, 100]
        }
    };
    $app.data.downloadQueueTable = {
        data: [],
        tableProps: {
            stripe: true,
            size: 'mini'
        },
        layout: 'table'
    };
    $app.data.socialStatusHistoryTable = {
        data: [],
        tableProps: {
            stripe: true,
            size: 'mini'
        },
        layout: 'table'
    };
    $app.data.visits = 0;
    $app.data.openVR = configRepository.getBool('openVR');
    $app.data.openVRAlways = configRepository.getBool('openVRAlways');
    $app.data.overlaybutton = configRepository.getBool('VRCX_overlaybutton');
    $app.data.hidePrivateFromFeed = configRepository.getBool(
        'VRCX_hidePrivateFromFeed'
    );
    $app.data.hideDevicesFromFeed = configRepository.getBool(
        'VRCX_hideDevicesFromFeed'
    );
    $app.data.overlayNotifications = configRepository.getBool(
        'VRCX_overlayNotifications'
    );
    $app.data.overlayWrist = configRepository.getBool('VRCX_overlayWrist');
    $app.data.xsNotifications = configRepository.getBool(
        'VRCX_xsNotifications'
    );
    $app.data.imageNotifications = configRepository.getBool(
        'VRCX_imageNotifications'
    );
    $app.data.desktopToast = configRepository.getString('VRCX_desktopToast');
    $app.data.minimalFeed = configRepository.getBool('VRCX_minimalFeed');
    $app.data.displayVRCPlusIconsAsAvatar = configRepository.getBool(
        'displayVRCPlusIconsAsAvatar'
    );
    $app.data.hideTooltips = configRepository.getBool('VRCX_hideTooltips');
    $app.data.notificationTTS = configRepository.getString(
        'VRCX_notificationTTS'
    );
    $app.data.notificationTTSVoice = configRepository.getString(
        'VRCX_notificationTTSVoice'
    );
    $app.data.notificationTimeout = configRepository.getString(
        'VRCX_notificationTimeout'
    );
    $app.data.worldAutoCacheInvite = configRepository.getString(
        'VRCX_worldAutoCacheInvite'
    );
    $app.data.worldAutoCacheGPS = configRepository.getString(
        'VRCX_worldAutoCacheGPS'
    );
    $app.data.worldAutoCacheInviteFilter = configRepository.getBool(
        'VRCX_worldAutoCacheInviteFilter'
    );
    $app.data.worldAutoCacheGPSFilter = configRepository.getBool(
        'VRCX_worldAutoCacheGPSFilter'
    );
    $app.data.autoSweepVRChatCache = configRepository.getBool(
        'VRCX_autoSweepVRChatCache'
    );
    $app.data.vrBackgroundEnabled = configRepository.getBool(
        'VRCX_vrBackgroundEnabled'
    );
    $app.data.asideWidth = configRepository.getInt('VRCX_asidewidth');
    $app.data.autoUpdateVRCX = configRepository.getString(
        'VRCX_autoUpdateVRCX'
    );
    $app.data.branch = configRepository.getString('VRCX_branch');
    $app.methods.saveOpenVROption = function () {
        configRepository.setBool('openVR', this.openVR);
        configRepository.setBool('openVRAlways', this.openVRAlways);
        configRepository.setBool('VRCX_overlaybutton', this.overlaybutton);
        configRepository.setBool(
            'VRCX_hidePrivateFromFeed',
            this.hidePrivateFromFeed
        );
        configRepository.setBool(
            'VRCX_hideDevicesFromFeed',
            this.hideDevicesFromFeed
        );
        configRepository.setBool(
            'VRCX_overlayNotifications',
            this.overlayNotifications
        );
        configRepository.setBool('VRCX_overlayWrist', this.overlayWrist);
        configRepository.setBool('VRCX_xsNotifications', this.xsNotifications);
        configRepository.setBool(
            'VRCX_imageNotifications',
            this.imageNotifications
        );
        configRepository.setString('VRCX_desktopToast', this.desktopToast);
        configRepository.setBool('VRCX_minimalFeed', this.minimalFeed);
        configRepository.setBool(
            'displayVRCPlusIconsAsAvatar',
            this.displayVRCPlusIconsAsAvatar
        );
        configRepository.setBool('VRCX_hideTooltips', this.hideTooltips);
        configRepository.setString(
            'VRCX_worldAutoCacheInvite',
            this.worldAutoCacheInvite
        );
        configRepository.setString(
            'VRCX_worldAutoCacheGPS',
            this.worldAutoCacheGPS
        );
        configRepository.setBool(
            'VRCX_worldAutoCacheInviteFilter',
            this.worldAutoCacheInviteFilter
        );
        configRepository.setBool(
            'VRCX_worldAutoCacheGPSFilter',
            this.worldAutoCacheGPSFilter
        );
        configRepository.setBool(
            'VRCX_autoSweepVRChatCache',
            this.autoSweepVRChatCache
        );
        configRepository.setBool(
            'VRCX_vrBackgroundEnabled',
            this.vrBackgroundEnabled
        );
        this.updateSharedFeed(true);
        this.updateVRConfigVars();
    };
    $app.data.TTSvoices = speechSynthesis.getVoices();
    $app.methods.saveNotificationTTS = function () {
        speechSynthesis.cancel();
        if (
            configRepository.getString('VRCX_notificationTTS') === 'Never' &&
            this.notificationTTS !== 'Never'
        ) {
            this.speak('Notification text-to-speech enabled');
        }
        configRepository.setString(
            'VRCX_notificationTTS',
            this.notificationTTS
        );
        this.updateVRConfigVars();
    };
    $app.data.themeMode = configRepository.getString('VRCX_ThemeMode');
    if (!$app.data.themeMode) {
        $app.data.themeMode = 'system';
    }
    var systemIsDarkMode = () =>
        window.matchMedia('(prefers-color-scheme: dark)').matches;
    $app.data.isDarkMode =
        $app.data.themeMode === 'system'
            ? systemIsDarkMode()
            : configRepository.getBool('isDarkMode');
    $appDarkStyle.disabled = $app.data.isDarkMode === false;
    $app.watch.isDarkMode = function () {
        configRepository.setBool('isDarkMode', this.isDarkMode);
        $appDarkStyle.disabled = this.isDarkMode === false;
        this.updateVRConfigVars();
    };
    window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', (e) => {
            $app._data.isDarkMode = e && e.matches;
        });
    $app.watch.themeMode = function () {
        configRepository.setString('VRCX_ThemeMode', this.themeMode);
        if (this.themeMode === 'system') {
            this.isDarkMode = systemIsDarkMode();
        } else {
            this.isDarkMode = this.themeMode === 'dark';
        }
    };
    $app.data.isStartAtWindowsStartup = configRepository.getBool(
        'VRCX_StartAtWindowsStartup'
    );
    $app.data.isStartAsMinimizedState =
        VRCXStorage.Get('VRCX_StartAsMinimizedState') === 'true';
    $app.data.isCloseToTray = configRepository.getBool('VRCX_CloseToTray');
    var saveVRCXWindowOption = function () {
        configRepository.setBool(
            'VRCX_StartAtWindowsStartup',
            this.isStartAtWindowsStartup
        );
        VRCXStorage.Set(
            'VRCX_StartAsMinimizedState',
            this.isStartAsMinimizedState.toString()
        );
        configRepository.setBool('VRCX_CloseToTray', this.isCloseToTray);
        AppApi.SetStartup(this.isStartAtWindowsStartup);
    };
    $app.watch.isStartAtWindowsStartup = saveVRCXWindowOption;
    $app.watch.isStartAsMinimizedState = saveVRCXWindowOption;
    $app.watch.isCloseToTray = saveVRCXWindowOption;

    // setting defaults
    if (!configRepository.getString('VRCX_notificationPosition')) {
        $app.data.notificationPosition = 'topCenter';
        configRepository.setString(
            'VRCX_notificationPosition',
            $app.data.notificationPosition
        );
    }
    if (!configRepository.getString('VRCX_notificationTimeout')) {
        $app.data.notificationTimeout = 3000;
        configRepository.setString(
            'VRCX_notificationTimeout',
            $app.data.notificationTimeout
        );
    }
    if (!configRepository.getString('VRCX_notificationTTSVoice')) {
        $app.data.notificationTTSVoice = '0';
        configRepository.setString(
            'VRCX_notificationTTSVoice',
            $app.data.notificationTTSVoice
        );
    }
    if (!configRepository.getString('VRCX_desktopToast')) {
        $app.data.desktopToast = 'Never';
        configRepository.setString('VRCX_desktopToast', $app.data.desktopToast);
    }
    if (!configRepository.getString('VRCX_notificationTTS')) {
        $app.data.notificationTTS = 'Never';
        configRepository.setString(
            'VRCX_notificationTTS',
            $app.data.notificationTTS
        );
    }
    if (!configRepository.getString('VRCX_worldAutoCacheInvite')) {
        $app.data.worldAutoCacheInvite = 'Never';
        configRepository.setString(
            'VRCX_worldAutoCacheInvite',
            $app.data.worldAutoCacheInvite
        );
    }
    if (!configRepository.getString('VRCX_worldAutoCacheGPS')) {
        $app.data.worldAutoCacheGPS = 'Never';
        configRepository.setString(
            'VRCX_worldAutoCacheGPS',
            $app.data.worldAutoCacheGPS
        );
    }
    if (!configRepository.getBool('VRCX_vrBackgroundEnabled')) {
        $app.data.vrBackgroundEnabled = false;
        configRepository.setBool(
            'VRCX_vrBackgroundEnabled',
            $app.data.vrBackgroundEnabled
        );
    }
    if (!configRepository.getInt('VRCX_asidewidth')) {
        $app.data.asideWidth = 236;
        configRepository.setInt('VRCX_asidewidth', $app.data.asideWidth);
    }
    if (!configRepository.getString('VRCX_autoUpdateVRCX')) {
        $app.data.autoUpdateVRCX = 'Notify';
        configRepository.setString(
            'VRCX_autoUpdateVRCX',
            $app.data.autoUpdateVRCX
        );
    }
    if (!configRepository.getString('VRCX_branch')) {
        $app.data.branch = 'Stable';
        if (appVersion.substring(0, 24) === 'VRCX.PyPyDance.Companion') {
            $app.data.branch = 'Beta';
        }
        configRepository.setString('VRCX_branch', $app.data.branch);
    }
    if (!configRepository.getString('VRCX_lastVRCXVersion')) {
        configRepository.setString('VRCX_lastVRCXVersion', appVersion);
    }
    if (!configRepository.getString('sharedFeedFilters')) {
        var sharedFeedFilters = {
            noty: {
                Location: 'Off',
                OnPlayerJoined: 'VIP',
                OnPlayerLeft: 'VIP',
                OnPlayerJoining: 'Off',
                Online: 'VIP',
                Offline: 'VIP',
                GPS: 'Off',
                Status: 'Off',
                invite: 'Friends',
                requestInvite: 'Friends',
                inviteResponse: 'Friends',
                requestInviteResponse: 'Friends',
                friendRequest: 'On',
                Friend: 'On',
                Unfriend: 'On',
                DisplayName: 'VIP',
                TrustLevel: 'VIP',
                PortalSpawn: 'Everyone',
                AvatarChange: 'Off',
                Event: 'On',
                VideoPlay: 'Off',
                BlockedOnPlayerJoined: 'Off',
                BlockedOnPlayerLeft: 'Off',
                MutedOnPlayerJoined: 'Off',
                MutedOnPlayerLeft: 'Off'
            },
            wrist: {
                Location: 'On',
                OnPlayerJoined: 'Everyone',
                OnPlayerLeft: 'Everyone',
                OnPlayerJoining: 'Friends',
                Online: 'Friends',
                Offline: 'Friends',
                GPS: 'Friends',
                Status: 'Friends',
                invite: 'Friends',
                requestInvite: 'Friends',
                inviteResponse: 'Friends',
                requestInviteResponse: 'Friends',
                friendRequest: 'On',
                Friend: 'On',
                Unfriend: 'On',
                DisplayName: 'Friends',
                TrustLevel: 'Friends',
                PortalSpawn: 'Everyone',
                AvatarChange: 'Everyone',
                Event: 'On',
                VideoPlay: 'On',
                BlockedOnPlayerJoined: 'Off',
                BlockedOnPlayerLeft: 'Off',
                MutedOnPlayerJoined: 'Off',
                MutedOnPlayerLeft: 'Off'
            }
        };
        configRepository.setString(
            'sharedFeedFilters',
            JSON.stringify(sharedFeedFilters)
        );
    }
    $app.data.sharedFeedFilters = JSON.parse(
        configRepository.getString('sharedFeedFilters')
    );

    if (!configRepository.getString('VRCX_trustColor')) {
        configRepository.setString(
            'VRCX_trustColor',
            JSON.stringify({
                untrusted: '#CCCCCC',
                basic: '#1778FF',
                known: '#2BCF5C',
                trusted: '#FF7B42',
                veteran: '#B18FFF',
                legend: '#FFD000',
                legendary: '#FF69B4',
                vip: '#FF2626',
                troll: '#782F2F'
            })
        );
    }
    $app.data.trustColor = JSON.parse(
        configRepository.getString('VRCX_trustColor')
    );

    $app.data.trustColorSwatches = [
        '#CCCCCC',
        '#1778FF',
        '#2BCF5C',
        '#FF7B42',
        '#B18FFF',
        '#FFD000',
        '#FF69B4',
        '#ABCDEF',
        '#8143E6',
        '#B52626',
        '#FF2626',
        '#782F2F'
    ];

    $app.methods.updatetrustColor = function () {
        var trustColor = $app.trustColor;
        if (trustColor) {
            configRepository.setString(
                'VRCX_trustColor',
                JSON.stringify(trustColor)
            );
        } else {
            trustColor = JSON.parse(
                configRepository.getString('VRCX_trustColor')
            );
            $app.trustColor = trustColor;
        }
        if (document.getElementById('trustColor') !== null) {
            document.getElementById('trustColor').outerHTML = '';
        }
        var style = document.createElement('style');
        style.id = 'trustColor';
        style.type = 'text/css';
        var newCSS = '';
        for (var rank in trustColor) {
            newCSS += `.x-tag-${rank} { color: ${trustColor[rank]} !important; border-color: ${trustColor[rank]} !important; } `;
        }
        style.innerHTML = newCSS;
        document.getElementsByTagName('head')[0].appendChild(style);
    };
    $app.methods.updatetrustColor();
    $app.watch['trustColor.untrusted'] = $app.methods.updatetrustColor;
    $app.watch['trustColor.basic'] = $app.methods.updatetrustColor;
    $app.watch['trustColor.known'] = $app.methods.updatetrustColor;
    $app.watch['trustColor.trusted'] = $app.methods.updatetrustColor;
    $app.watch['trustColor.veteran'] = $app.methods.updatetrustColor;
    $app.watch['trustColor.legend'] = $app.methods.updatetrustColor;
    $app.watch['trustColor.legendary'] = $app.methods.updatetrustColor;
    $app.watch['trustColor.vip'] = $app.methods.updatetrustColor;
    $app.watch['trustColor.troll'] = $app.methods.updatetrustColor;

    $app.methods.saveSharedFeedFilters = function () {
        this.notyFeedFiltersDialog.visible = false;
        this.wristFeedFiltersDialog.visible = false;
        configRepository.setString(
            'sharedFeedFilters',
            JSON.stringify(this.sharedFeedFilters)
        );
        this.updateVRConfigVars();
    };

    $app.methods.cancelSharedFeedFilters = function () {
        this.notyFeedFiltersDialog.visible = false;
        this.wristFeedFiltersDialog.visible = false;
        this.sharedFeedFilters = JSON.parse(
            configRepository.getString('sharedFeedFilters')
        );
    };

    $app.data.notificationPosition = configRepository.getString(
        'VRCX_notificationPosition'
    );
    $app.methods.changeNotificationPosition = function () {
        configRepository.setString(
            'VRCX_notificationPosition',
            this.notificationPosition
        );
        this.updateVRConfigVars();
    };

    $app.data.youTubeApi = configRepository.getBool('VRCX_youtubeAPI');
    $app.data.youTubeApiKey = configRepository.getString('VRCX_youtubeAPIKey');

    var downloadProgressStateChange = function () {
        this.updateVRConfigVars();
    };
    $app.watch.downloadProgress = downloadProgressStateChange;

    $app.methods.updateVRConfigVars = function () {
        var notificationTheme = 'relax';
        if (this.isDarkMode) {
            notificationTheme = 'sunset';
        }
        var VRConfigVars = {
            notificationTTS: this.notificationTTS,
            notificationTTSVoice: this.notificationTTSVoice,
            overlayNotifications: this.overlayNotifications,
            hideDevicesFromFeed: this.hideDevicesFromFeed,
            minimalFeed: this.minimalFeed,
            notificationPosition: this.notificationPosition,
            notificationTimeout: this.notificationTimeout,
            notificationTheme,
            backgroundEnabled: this.vrBackgroundEnabled,
            isGameRunning: this.isGameRunning,
            isGameNoVR: this.isGameNoVR,
            downloadProgress: this.downloadProgress
        };
        var json = JSON.stringify(VRConfigVars);
        AppApi.ExecuteVrFeedFunction('configUpdate', json);
        AppApi.ExecuteVrOverlayFunction('configUpdate', json);
    };

    $app.methods.updateVRLastLocation = function () {
        var lastLocation = {
            date: this.lastLocation.date,
            location: this.lastLocation.location,
            name: this.lastLocation.name,
            playerList: Array.from(this.lastLocation.playerList.values()),
            friendList: Array.from(this.lastLocation.friendList.values())
        };
        var json = JSON.stringify(lastLocation);
        AppApi.ExecuteVrFeedFunction('lastLocationUpdate', json);
        AppApi.ExecuteVrOverlayFunction('lastLocationUpdate', json);
    };

    $app.methods.vrInit = function () {
        this.updateVRConfigVars();
        this.updateVRLastLocation();
        this.updateVrNowPlaying();
        this.updateSharedFeed(true);
    };

    API.$on('LOGIN', function () {
        $app.currentUserTreeData = [];
        $app.pastDisplayNameTable.data = [];
    });

    API.$on('USER:CURRENT', function (args) {
        if (args.ref.pastDisplayNames) {
            $app.pastDisplayNameTable.data = args.ref.pastDisplayNames;
        }
    });

    API.$on('VISITS', function (args) {
        $app.visits = args.json;
    });

    $app.methods.logout = function () {
        this.$confirm('Continue? Logout', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    API.logout();
                }
            }
        });
    };

    $app.methods.resetHome = function () {
        this.$confirm('Continue? Reset Home', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    API.saveCurrentUser({
                        homeLocation: ''
                    }).then((args) => {
                        this.$message({
                            message: 'Home world has been reset',
                            type: 'success'
                        });
                        return args;
                    });
                }
            }
        });
    };

    $app.methods.updateOpenVR = function (isGameRunning, isGameNoVR) {
        if (
            this.openVR &&
            !isGameNoVR &&
            (isGameRunning || this.openVRAlways)
        ) {
            AppApi.StartVR();
        } else {
            AppApi.StopVR();
        }
    };

    $app.methods.changeTTSVoice = function (index) {
        this.notificationTTSVoice = index;
        configRepository.setString(
            'VRCX_notificationTTSVoice',
            this.notificationTTSVoice
        );
        var voices = speechSynthesis.getVoices();
        if (voices.length === 0) {
            return;
        }
        var voiceName = voices[index < voices.length ? index : 0].name;
        speechSynthesis.cancel();
        this.speak(voiceName);
        this.updateVRConfigVars();
    };

    $app.methods.speak = function (text) {
        var tts = new SpeechSynthesisUtterance();
        var voices = speechSynthesis.getVoices();
        tts.voice = voices[this.notificationTTSVoice];
        tts.text = text;
        speechSynthesis.speak(tts);
    };

    $app.methods.refreshConfigTreeData = function () {
        this.configTreeData = buildTreeData(API.cachedConfig);
    };

    $app.methods.refreshCurrentUserTreeData = function () {
        this.currentUserTreeData = buildTreeData(API.currentUser);
    };

    $app.methods.promptUserIdDialog = function () {
        this.$prompt('Enter a User URL or ID (UUID)', 'Direct Access', {
            distinguishCancelAndClose: true,
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            inputPattern: /\S+/,
            inputErrorMessage: 'User URL/ID is required',
            callback: (action, instance) => {
                if (action === 'confirm' && instance.inputValue) {
                    var testUrl = instance.inputValue.substring(0, 15);
                    if (testUrl === 'https://vrchat.') {
                        var userId = this.parseUserUrl(instance.inputValue);
                        if (userId) {
                            this.showUserDialog(userId);
                        } else {
                            this.$message({
                                message: 'Invalid URL',
                                type: 'error'
                            });
                        }
                    } else {
                        this.showUserDialog(instance.inputValue);
                    }
                }
            }
        });
    };

    $app.methods.promptUsernameDialog = function () {
        this.$prompt('Enter a Username', 'Direct Access', {
            distinguishCancelAndClose: true,
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            inputPattern: /\S+/,
            inputErrorMessage: 'Username is required',
            callback: (action, instance) => {
                if (action === 'confirm' && instance.inputValue) {
                    this.lookupUser({displayName: instance.inputValue});
                }
            }
        });
    };

    $app.methods.promptWorldDialog = function () {
        this.$prompt('Enter a World URL or ID (UUID)', 'Direct Access', {
            distinguishCancelAndClose: true,
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            inputPattern: /\S+/,
            inputErrorMessage: 'World URL/ID is required',
            callback: (action, instance) => {
                if (action === 'confirm' && instance.inputValue) {
                    var testUrl = instance.inputValue.substring(0, 15);
                    if (testUrl === 'https://vrchat.') {
                        var worldInstance = this.parseLocationUrl(
                            instance.inputValue
                        );
                        if (worldInstance) {
                            this.showWorldDialog(worldInstance);
                        } else {
                            this.$message({
                                message: 'Invalid URL',
                                type: 'error'
                            });
                        }
                    } else {
                        this.showWorldDialog(instance.inputValue);
                    }
                }
            }
        });
    };

    $app.methods.promptAvatarDialog = function () {
        this.$prompt('Enter a Avatar URL or ID (UUID)', 'Direct Access', {
            distinguishCancelAndClose: true,
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            inputPattern: /\S+/,
            inputErrorMessage: 'Avatar URL/ID is required',
            callback: (action, instance) => {
                if (action === 'confirm' && instance.inputValue) {
                    var testUrl = instance.inputValue.substring(0, 15);
                    if (testUrl === 'https://vrchat.') {
                        var avatarId = this.parseAvatarUrl(instance.inputValue);
                        if (avatarId) {
                            this.showAvatarDialog(avatarId);
                        } else {
                            this.$message({
                                message: 'Invalid URL',
                                type: 'error'
                            });
                        }
                    } else {
                        this.showAvatarDialog(instance.inputValue);
                    }
                }
            }
        });
    };

    $app.methods.promptOmniDirectDialog = function () {
        this.$prompt(
            'Enter a User/World/Instance/Avatar URL or ID (UUID)',
            'Direct Access',
            {
                distinguishCancelAndClose: true,
                confirmButtonText: 'OK',
                cancelButtonText: 'Cancel',
                inputPattern: /\S+/,
                inputErrorMessage: 'URL/ID is required',
                callback: (action, instance) => {
                    if (action === 'confirm' && instance.inputValue) {
                        var input = instance.inputValue;
                        var testUrl = input.substring(0, 15);
                        if (testUrl === 'https://vrchat.') {
                            var url = new URL(input);
                            var urlPath = url.pathname;
                            if (urlPath.substring(5, 11) === '/user/') {
                                var userId = urlPath.substring(11);
                                this.showUserDialog(userId);
                            } else if (
                                urlPath.substring(5, 13) === '/avatar/'
                            ) {
                                var avatarId = urlPath.substring(13);
                                this.showAvatarDialog(avatarId);
                            } else if (urlPath.substring(5, 12) === '/world/') {
                                var worldId = urlPath.substring(12);
                                this.showWorldDialog(worldId);
                            } else if (urlPath.substring(5, 12) === '/launch') {
                                var urlParams = new URLSearchParams(url.search);
                                var worldId = urlParams.get('worldId');
                                var instanceId = urlParams.get('instanceId');
                                if (instanceId) {
                                    var location = `${worldId}:${instanceId}`;
                                    this.showWorldDialog(location);
                                } else if (worldId) {
                                    this.showWorldDialog(worldId);
                                }
                            } else {
                                this.$message({
                                    message: 'Invalid URL',
                                    type: 'error'
                                });
                            }
                        } else if (input.substring(0, 4) === 'usr_') {
                            this.showUserDialog(input);
                        } else if (input.substring(0, 5) === 'wrld_') {
                            this.showWorldDialog(input);
                        } else if (input.substring(0, 5) === 'avtr_') {
                            this.showAvatarDialog(input);
                        } else {
                            this.$message({
                                message: 'Invalid ID/URL',
                                type: 'error'
                            });
                        }
                    }
                }
            }
        );
    };

    $app.methods.promptNotificationTimeout = function () {
        this.$prompt('Enter amount of seconds', 'Notification Timeout', {
            distinguishCancelAndClose: true,
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            inputValue: this.notificationTimeout / 1000,
            inputPattern: /\d+$/,
            inputErrorMessage: 'Valid number is required',
            callback: (action, instance) => {
                if (
                    action === 'confirm' &&
                    instance.inputValue &&
                    !isNaN(instance.inputValue)
                ) {
                    this.notificationTimeout = Math.trunc(
                        Number(instance.inputValue) * 1000
                    );
                    configRepository.setString(
                        'VRCX_notificationTimeout',
                        this.notificationTimeout
                    );
                    this.updateVRConfigVars();
                }
            }
        });
    };

    $app.methods.promptRenameAvatar = function (avatar) {
        this.$prompt('Enter avatar name', 'Rename Avatar', {
            distinguishCancelAndClose: true,
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            inputValue: avatar.ref.name,
            inputErrorMessage: 'Valid name is required',
            callback: (action, instance) => {
                if (
                    action === 'confirm' &&
                    instance.inputValue !== avatar.ref.name
                ) {
                    API.saveAvatar({
                        id: avatar.id,
                        name: instance.inputValue
                    }).then((args) => {
                        this.$message({
                            message: 'Avatar renamed',
                            type: 'success'
                        });
                        return args;
                    });
                }
            }
        });
    };

    $app.methods.promptChangeAvatarDescription = function (avatar) {
        this.$prompt('Enter avatar description', 'Change Description', {
            distinguishCancelAndClose: true,
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            inputValue: avatar.ref.description,
            inputErrorMessage: 'Valid description is required',
            callback: (action, instance) => {
                if (
                    action === 'confirm' &&
                    instance.inputValue !== avatar.ref.description
                ) {
                    API.saveAvatar({
                        id: avatar.id,
                        description: instance.inputValue
                    }).then((args) => {
                        this.$message({
                            message: 'Avatar description changed',
                            type: 'success'
                        });
                        return args;
                    });
                }
            }
        });
    };

    $app.methods.promptRenameWorld = function (world) {
        this.$prompt('Enter world name', 'Rename World', {
            distinguishCancelAndClose: true,
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            inputValue: world.ref.name,
            inputErrorMessage: 'Valid name is required',
            callback: (action, instance) => {
                if (
                    action === 'confirm' &&
                    instance.inputValue !== world.ref.name
                ) {
                    API.saveWorld({
                        id: world.id,
                        name: instance.inputValue
                    }).then((args) => {
                        this.$message({
                            message: 'World renamed',
                            type: 'success'
                        });
                        return args;
                    });
                }
            }
        });
    };

    $app.methods.promptChangeWorldDescription = function (world) {
        this.$prompt('Enter world description', 'Change Description', {
            distinguishCancelAndClose: true,
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            inputValue: world.ref.description,
            inputErrorMessage: 'Valid description is required',
            callback: (action, instance) => {
                if (
                    action === 'confirm' &&
                    instance.inputValue !== world.ref.description
                ) {
                    API.saveWorld({
                        id: world.id,
                        description: instance.inputValue
                    }).then((args) => {
                        this.$message({
                            message: 'World description changed',
                            type: 'success'
                        });
                        return args;
                    });
                }
            }
        });
    };

    // App: Dialog

    var adjustDialogZ = (el) => {
        var z = 0;
        document
            .querySelectorAll('.v-modal,.el-dialog__wrapper')
            .forEach((v) => {
                var _z = Number(v.style.zIndex) || 0;
                if (_z && _z > z && v !== el) {
                    z = _z;
                }
            });
        if (z) {
            el.style.zIndex = z + 1;
        }
    };

    // App: User Dialog

    $app.data.userDialog = {
        visible: false,
        loading: false,
        id: '',
        ref: {},
        friend: {},
        isFriend: false,
        incomingRequest: false,
        outgoingRequest: false,
        isBlock: false,
        isMute: false,
        isHideAvatar: false,
        isFavorite: false,

        $location: {},
        users: [],
        instance: {},

        worlds: [],
        avatars: [],
        isWorldsLoading: false,
        isFavoriteWorldsLoading: false,
        isAvatarsLoading: false,

        worldSorting: 'update',
        avatarSorting: 'update',
        avatarReleaseStatus: 'all',

        treeData: [],
        memo: '',
        $avatarInfo: {
            ownerId: '',
            avatarName: '',
            fileCreatedAt: ''
        }
    };

    $app.watch['userDialog.memo'] = function () {
        var D = this.userDialog;
        this.saveMemo(D.id, D.memo);
    };

    $app.methods.getFaviconUrl = function (resource) {
        try {
            var url = new URL(resource);
            return `https://icons.duckduckgo.com/ip2/${url.host}.ico`;
        } catch (err) {
            return '';
        }
    };

    API.$on('LOGOUT', function () {
        $app.userDialog.visible = false;
    });

    API.$on('USER', function (args) {
        var {ref} = args;
        var D = $app.userDialog;
        if (D.visible === false || D.id !== ref.id) {
            return;
        }
        D.ref = ref;
        $app.applyUserDialogLocation();
    });

    API.$on('WORLD', function (args) {
        var D = $app.userDialog;
        if (D.visible === false || D.$location.worldId !== args.ref.id) {
            return;
        }
        $app.applyUserDialogLocation();
    });

    API.$on('FRIEND:STATUS', function (args) {
        var D = $app.userDialog;
        if (D.visible === false || D.id !== args.params.userId) {
            return;
        }
        var {json} = args;
        D.isFriend = json.isFriend;
        D.incomingRequest = json.incomingRequest;
        D.outgoingRequest = json.outgoingRequest;
    });

    API.$on('FRIEND:REQUEST', function (args) {
        var D = $app.userDialog;
        if (D.visible === false || D.id !== args.params.userId) {
            return;
        }
        if (args.json.success) {
            D.isFriend = true;
        } else {
            D.outgoingRequest = true;
        }
    });

    API.$on('FRIEND:REQUEST:CANCEL', function (args) {
        var D = $app.userDialog;
        if (D.visible === false || D.id !== args.params.userId) {
            return;
        }
        D.outgoingRequest = false;
    });

    API.$on('NOTIFICATION', function (args) {
        var {ref} = args;
        var D = $app.userDialog;
        if (
            D.visible === false ||
            ref.$isDeleted ||
            ref.type !== 'friendRequest' ||
            ref.senderUserId !== D.id
        ) {
            return;
        }
        D.incomingRequest = true;
    });

    API.$on('NOTIFICATION:ACCEPT', function (args) {
        var {ref} = args;
        var D = $app.userDialog;
        // 얘는 @DELETE가 오고나서 ACCEPT가 옴
        // 따라서 $isDeleted라면 ref가 undefined가 됨
        if (
            D.visible === false ||
            typeof ref === 'undefined' ||
            ref.type !== 'friendRequest' ||
            ref.senderUserId !== D.id
        ) {
            return;
        }
        D.isFriend = true;
    });

    API.$on('NOTIFICATION:@DELETE', function (args) {
        var {ref} = args;
        var D = $app.userDialog;
        if (
            D.visible === false ||
            ref.type !== 'friendRequest' ||
            ref.senderUserId !== D.id
        ) {
            return;
        }
        D.incomingRequest = false;
    });

    API.$on('FRIEND:DELETE', function (args) {
        var D = $app.userDialog;
        if (D.visible === false || D.id !== args.params.userId) {
            return;
        }
        D.isFriend = false;
    });

    API.$on('PLAYER-MODERATION:@SEND', function (args) {
        var {ref} = args;
        var D = $app.userDialog;
        if (
            D.visible === false ||
            ref.$isDeleted ||
            (ref.targetUserId !== D.id &&
                ref.sourceUserId !== this.currentUser.id)
        ) {
            return;
        }
        if (ref.type === 'block') {
            D.isBlock = true;
        } else if (ref.type === 'mute') {
            D.isMute = true;
        } else if (ref.type === 'hideAvatar') {
            D.isHideAvatar = true;
        }
        $app.$message({
            message: 'User moderated',
            type: 'success'
        });
    });

    API.$on('PLAYER-MODERATION:@DELETE', function (args) {
        var {ref} = args;
        var D = $app.userDialog;
        if (
            D.visible === false ||
            ref.targetUserId !== D.id ||
            ref.sourceUserId !== this.currentUser.id
        ) {
            return;
        }
        if (ref.type === 'block') {
            D.isBlock = false;
        } else if (ref.type === 'mute') {
            D.isMute = false;
        } else if (ref.type === 'hideAvatar') {
            D.isHideAvatar = false;
        }
    });

    API.$on('FAVORITE', function (args) {
        var {ref} = args;
        var D = $app.userDialog;
        if (D.visible === false || ref.$isDeleted || ref.favoriteId !== D.id) {
            return;
        }
        D.isFavorite = true;
    });

    API.$on('FAVORITE:@DELETE', function (args) {
        var D = $app.userDialog;
        if (D.visible === false || D.id !== args.ref.favoriteId) {
            return;
        }
        D.isFavorite = false;
    });

    $app.methods.showUserDialog = function (userId) {
        this.$nextTick(() => adjustDialogZ(this.$refs.userDialog.$el));
        var D = this.userDialog;
        D.currentAvatarThumbnailImageUrl = '';
        D.userIcon = '';
        D.id = userId;
        D.treeData = [];
        this.getMemo(userId).then((memo) => {
            D.memo = memo;
            var ref = this.friends.get(userId);
            if (ref) {
                ref.memo = String(memo || '');
            }
        });
        D.visible = true;
        D.loading = true;
        D.avatars = [];
        D.worlds = [];
        D.instance = {};
        API.getCachedUser({
            userId
        })
            .catch((err) => {
                D.loading = false;
                D.visible = false;
                throw err;
            })
            .then((args) => {
                if (args.ref.id === D.id) {
                    D.loading = false;
                    D.ref = args.ref;
                    D.friend = this.friends.get(D.id);
                    D.isFriend = Boolean(D.friend);
                    D.incomingRequest = false;
                    D.outgoingRequest = false;
                    D.isBlock = false;
                    D.isMute = false;
                    D.isHideAvatar = false;
                    for (var ref of API.cachedPlayerModerations.values()) {
                        if (
                            ref.$isDeleted === false &&
                            ref.targetUserId === D.id &&
                            ref.sourceUserId === API.currentUser.id
                        ) {
                            if (ref.type === 'block') {
                                D.isBlock = true;
                            } else if (ref.type === 'mute') {
                                D.isMute = true;
                            } else if (ref.type === 'hideAvatar') {
                                D.isHideAvatar = true;
                            }
                        }
                    }
                    D.isFavorite = API.cachedFavoritesByObjectId.has(D.id);
                    this.applyUserDialogLocation();
                    if (this.$refs.userDialogTabs.currentName === '0') {
                        this.userDialogLastActiveTab = 'Info';
                    } else if (this.$refs.userDialogTabs.currentName === '1') {
                        this.userDialogLastActiveTab = 'Worlds';
                        this.setUserDialogWorlds(userId);
                        if (this.userDialogLastWorld !== userId) {
                            this.userDialogLastWorld = userId;
                            this.refreshUserDialogWorlds();
                        }
                    } else if (this.$refs.userDialogTabs.currentName === '2') {
                        this.userDialogLastActiveTab = 'Favorite Worlds';
                        if (this.userDialogLastFavoriteWorld !== userId) {
                            this.userDialogLastFavoriteWorld = userId;
                            this.getUserFavoriteWorlds(userId);
                        }
                    } else if (this.$refs.userDialogTabs.currentName === '3') {
                        this.userDialogLastActiveTab = 'Avatars';
                        this.setUserDialogAvatars(userId);
                        if (this.userDialogLastAvatar !== userId) {
                            this.userDialogLastAvatar = userId;
                            if (
                                userId === API.currentUser.id &&
                                D.avatars.length === 0
                            ) {
                                this.refreshUserDialogAvatars();
                            }
                        }
                    } else if (this.$refs.userDialogTabs.currentName === '4') {
                        this.userDialogLastActiveTab = 'JSON';
                        this.refreshUserDialogTreeData();
                    }
                    API.getFriendStatus({
                        userId: D.id
                    });
                    if (args.cache) {
                        API.getUser(args.params);
                    }
                    var L = API.parseLocation(D.ref.location);
                    if (L.worldId && this.lastLocation.location !== L.tag) {
                        API.getInstance({
                            worldId: L.worldId,
                            instanceId: L.instanceId
                        });
                    }
                }
                return args;
            });
    };

    $app.methods.applyUserDialogLocation = function () {
        var D = this.userDialog;
        var L = API.parseLocation(D.ref.location);
        D.$location = L;
        if (L.userId) {
            var ref = API.cachedUsers.get(L.userId);
            if (typeof ref === 'undefined') {
                API.getUser({
                    userId: L.userId
                }).then((args) => {
                    Vue.set(L, 'user', args.ref);
                    return args;
                });
            } else {
                L.user = ref;
            }
        }
        var users = [];
        var playersInInstance = this.lastLocation.playerList;
        if (
            this.lastLocation.location === L.tag &&
            playersInInstance.size > 0
        ) {
            var ref = API.cachedUsers.get(API.currentUser.id);
            if (typeof ref === 'undefined') {
                ref = API.currentUser;
            }
            if (playersInInstance.has(ref.displayName)) {
                users.push(ref); // add self
            }
            var friendsInInstance = this.lastLocation.friendList;
            for (var friend of friendsInInstance.values()) {
                // if friend isn't in instance add them
                var addUser = true;
                for (var k = 0; k < users.length; k++) {
                    var user = users[k];
                    if (friend.displayName === user.displayName) {
                        addUser = false;
                        break;
                    }
                }
                if (addUser && API.cachedUsers.has(friend.userId)) {
                    users.push(API.cachedUsers.get(friend.userId));
                }
            }
        } else if (L.isOffline === false) {
            for (var friend of this.friends.values()) {
                if (
                    typeof friend.ref !== 'undefined' &&
                    friend.ref.location === L.tag
                ) {
                    if (
                        friend.state !== 'online' &&
                        friend.ref.location === 'private'
                    ) {
                        continue;
                    }
                    users.push(friend.ref);
                }
            }
        }
        users.sort(compareByLocationAt);
        D.users = users;
        if (L.worldId && this.lastLocation.location === D.ref.location) {
            D.instance = {
                id: D.ref.location,
                occupants: this.lastLocation.playerList.size
            };
        }
        if (L.isOffline || L.isPrivate || L.worldId === '') {
            D.instance = {
                id: D.ref.location,
                occupants: 0
            };
        }
    };

    $app.methods.setUserDialogWorlds = function (userId) {
        var worlds = [];
        for (var ref of API.cachedWorlds.values()) {
            if (ref.authorId === userId) {
                worlds.push(ref);
            }
        }
        this.sortUserDialogWorlds(worlds);
    };

    $app.methods.sortUserDialogWorlds = function (array) {
        var D = this.userDialog;
        if (D.worldSorting === 'update') {
            array.sort(compareByUpdatedAt);
        } else {
            array.sort(compareByName);
        }
        D.worlds = array;
    };

    $app.methods.setUserDialogAvatars = function (userId) {
        var avatars = [];
        for (var ref of API.cachedAvatars.values()) {
            if (ref.authorId === userId) {
                avatars.push(ref);
            }
        }
        this.sortUserDialogAvatars(avatars);
    };

    $app.methods.sortUserDialogAvatars = function (array) {
        var D = this.userDialog;
        if (D.avatarSorting === 'update') {
            array.sort(compareByUpdatedAt);
        } else {
            array.sort(compareByName);
        }
        D.avatars = array;
    };

    $app.methods.refreshUserDialogWorlds = function () {
        var D = this.userDialog;
        if (D.isWorldsLoading) {
            return;
        }
        D.isWorldsLoading = true;
        var params = {
            n: 50,
            offset: 0,
            sort: 'updated',
            order: 'descending',
            // user: 'friends',
            userId: D.id,
            releaseStatus: 'public'
        };
        if (params.userId === API.currentUser.id) {
            params.user = 'me';
            params.releaseStatus = 'all';
        }
        var map = new Map();
        for (var ref of API.cachedWorlds.values()) {
            if (ref.authorId === D.id) {
                API.cachedWorlds.delete(ref.id);
            }
        }
        API.bulk({
            fn: 'getWorlds',
            N: -1,
            params,
            handle: (args) => {
                for (var json of args.json) {
                    var $ref = API.cachedWorlds.get(json.id);
                    if (typeof $ref !== 'undefined') {
                        map.set($ref.id, $ref);
                    }
                }
            },
            done: () => {
                if (D.id === params.userId) {
                    var array = Array.from(map.values());
                    this.sortUserDialogWorlds(array);
                }
                D.isWorldsLoading = false;
            }
        });
    };

    $app.methods.refreshUserDialogAvatars = function (fileId) {
        var D = this.userDialog;
        if (D.isAvatarsLoading) {
            return;
        }
        D.isAvatarsLoading = true;
        if (fileId) {
            D.loading = true;
        }
        var params = {
            n: 50,
            offset: 0,
            sort: 'updated',
            order: 'descending',
            releaseStatus: 'all',
            user: 'me'
        };
        for (let ref of API.cachedAvatars.values()) {
            if (ref.authorId === D.id) {
                API.cachedAvatars.delete(ref.id);
            }
        }
        var map = new Map();
        API.bulk({
            fn: 'getAvatars',
            N: -1,
            params,
            handle: (args) => {
                for (var json of args.json) {
                    var $ref = API.cachedAvatars.get(json.id);
                    if (typeof $ref !== 'undefined') {
                        map.set($ref.id, $ref);
                    }
                }
            },
            done: () => {
                var array = Array.from(map.values());
                this.sortUserDialogAvatars(array);
                D.isAvatarsLoading = false;
                if (fileId) {
                    D.loading = false;
                    for (let ref of array) {
                        if (extractFileId(ref.imageUrl) === fileId) {
                            this.showAvatarDialog(ref.id);
                            return;
                        }
                    }
                    this.$message({
                        message: 'Own avatar not found',
                        type: 'error'
                    });
                }
            }
        });
    };

    var performUserDialogCommand = (command, userId) => {
        switch (command) {
            case 'Delete Favorite':
                API.deleteFavorite({
                    objectId: userId
                });
                break;
            case 'Accept Friend Request':
                var key = API.getFriendRequest(userId);
                if (key === '') {
                    API.sendFriendRequest({
                        userId
                    });
                } else {
                    API.acceptNotification({
                        notificationId: key
                    });
                }
                break;
            case 'Decline Friend Request':
                var key = API.getFriendRequest(userId);
                if (key === '') {
                    API.cancelFriendRequest({
                        userId
                    });
                } else {
                    API.hideNotification({
                        notificationId: key
                    });
                }
                break;
            case 'Cancel Friend Request':
                API.cancelFriendRequest({
                    userId
                });
                break;
            case 'Send Friend Request':
                API.sendFriendRequest({
                    userId
                });
                break;
            case 'Unblock':
                API.deletePlayerModeration({
                    moderated: userId,
                    type: 'block'
                });
                break;
            case 'Block':
                API.sendPlayerModeration({
                    moderated: userId,
                    type: 'block'
                });
                break;
            case 'Unmute':
                API.deletePlayerModeration({
                    moderated: userId,
                    type: 'mute'
                });
                break;
            case 'Mute':
                API.sendPlayerModeration({
                    moderated: userId,
                    type: 'mute'
                });
                break;
            case 'Show Avatar':
                API.deletePlayerModeration({
                    moderated: userId,
                    type: 'hideAvatar'
                });
                break;
            case 'Hide Avatar':
                API.sendPlayerModeration({
                    moderated: userId,
                    type: 'hideAvatar'
                });
                break;
            case 'Unfriend':
                API.deleteFriend({
                    userId
                });
                break;
        }
    };

    $app.methods.userDialogCommand = function (command) {
        var D = this.userDialog;
        if (D.visible === false) {
            return;
        }
        if (command === 'Refresh') {
            D.loading = true;
            API.getUser({
                userId: D.id
            })
                .catch((err) => {
                    D.loading = false;
                    D.visible = false;
                    throw err;
                })
                .then((args) => {
                    if (D.id === args.ref.id) {
                        D.loading = false;
                        D.ref = args.ref;
                        D.friend = this.friends.get(D.id);
                        D.isFriend = Boolean(D.friend);
                        D.incomingRequest = false;
                        D.outgoingRequest = false;
                        D.isBlock = false;
                        D.isMute = false;
                        D.isHideAvatar = false;
                        for (var ref of API.cachedPlayerModerations.values()) {
                            if (
                                ref.$isDeleted === false &&
                                ref.targetUserId === D.id &&
                                ref.sourceUserId === API.currentUser.id
                            ) {
                                if (ref.type === 'block') {
                                    D.isBlock = true;
                                } else if (ref.type === 'mute') {
                                    D.isMute = true;
                                } else if (ref.type === 'hideAvatar') {
                                    D.isHideAvatar = true;
                                }
                            }
                        }
                        D.isFavorite = API.cachedFavoritesByObjectId.has(D.id);
                        this.applyUserDialogLocation();
                        API.getFriendStatus({
                            userId: D.id
                        });
                        var L = API.parseLocation(D.ref.location);
                        if (L.worldId && this.lastLocation.location !== L.tag) {
                            API.getInstance({
                                worldId: L.worldId,
                                instanceId: L.instanceId
                            });
                        }
                    }
                    return args;
                });
        } else if (command === 'Add Favorite') {
            this.showFavoriteDialog('friend', D.id);
        } else if (command === 'Edit Social Status') {
            this.showSocialStatusDialog();
        } else if (command === 'Edit Language') {
            this.showLanguageDialog();
        } else if (command === 'Edit Bio') {
            this.showBioDialog();
        } else if (command === 'Logout') {
            this.logout();
        } else if (command === 'Request Invite') {
            API.sendRequestInvite(
                {
                    platform: 'standalonewindows'
                },
                D.id
            ).then((args) => {
                this.$message('Request invite sent');
                return args;
            });
        } else if (command === 'Invite Message') {
            var L = API.parseLocation(this.lastLocation.location);
            API.getCachedWorld({
                worldId: L.worldId
            }).then((args) => {
                this.showSendInviteDialog(
                    {
                        instanceId: this.lastLocation.location,
                        worldId: this.lastLocation.location,
                        worldName: args.ref.name
                    },
                    D.id
                );
            });
        } else if (command === 'Request Invite Message') {
            this.showSendInviteRequestDialog(
                {
                    platform: 'standalonewindows'
                },
                D.id
            );
        } else if (command === 'Invite') {
            var L = API.parseLocation(this.lastLocation.location);
            API.getCachedWorld({
                worldId: L.worldId
            }).then((args) => {
                API.sendInvite(
                    {
                        instanceId: this.lastLocation.location,
                        worldId: this.lastLocation.location,
                        worldName: args.ref.name
                    },
                    D.id
                ).then((_args) => {
                    this.$message('Invite sent');
                    return _args;
                });
            });
        } else if (command === 'Show Avatar Author') {
            var {currentAvatarImageUrl} = D.ref;
            this.showAvatarAuthorDialog(D.id, currentAvatarImageUrl);
        } else if (command === 'Show Fallback Avatar Details') {
            var {fallbackAvatar} = D.ref;
            if (fallbackAvatar) {
                this.showAvatarDialog(fallbackAvatar);
            } else {
                this.$message({
                    message: 'No fallback avatar set',
                    type: 'error'
                });
            }
        } else if (command === 'Previous Images') {
            this.displayPreviousImages('User', 'Display');
        } else if (command === 'Manage Gallery') {
            this.showGalleryDialog();
        } else {
            this.$confirm(`Continue? ${command}`, 'Confirm', {
                confirmButtonText: 'Confirm',
                cancelButtonText: 'Cancel',
                type: 'info',
                callback: (action) => {
                    if (action === 'confirm') {
                        performUserDialogCommand(command, D.id);
                    }
                }
            });
        }
    };

    $app.methods.refreshUserDialogTreeData = function () {
        var D = this.userDialog;
        D.treeData = buildTreeData(D.ref);
    };

    $app.methods.changeUserDialogWorldSorting = function () {
        var D = this.userDialog;
        this.sortUserDialogWorlds(D.worlds);
    };

    $app.methods.changeUserDialogAvatarSorting = function () {
        var D = this.userDialog;
        this.sortUserDialogAvatars(D.avatars);
    };

    $app.computed.userDialogAvatars = function () {
        var {avatars, avatarReleaseStatus} = this.userDialog;
        if (
            avatarReleaseStatus === 'public' ||
            avatarReleaseStatus === 'private'
        ) {
            return avatars.filter(
                (avatar) => avatar.releaseStatus === avatarReleaseStatus
            );
        }
        return avatars;
    };

    // App: World Dialog

    $app.data.worldDialog = {
        visible: false,
        loading: false,
        id: '',
        $location: {},
        ref: {},
        isFavorite: false,
        rooms: [],
        treeData: [],
        fileCreatedAt: '',
        fileSize: '',
        inCache: false,
        cacheSize: 0,
        cacheLocked: false
    };

    API.$on('LOGOUT', function () {
        $app.worldDialog.visible = false;
    });

    API.$on('WORLD', function (args) {
        var {ref} = args;
        var D = $app.worldDialog;
        if (D.visible === false || D.id !== ref.id) {
            return;
        }
        D.ref = ref;
        $app.applyWorldDialogInstances();
        for (var room of D.rooms) {
            if (room.occupants === 0) {
                API.getInstance({
                    worldId: D.id,
                    instanceId: room.id
                });
            }
        }
        D.rooms.sort(function (a, b) {
            return b.users.length - a.users.length || b.occupants - a.occupants;
        });
        if (D.fileSize === 'Loading') {
            var assetUrl = '';
            for (let i = ref.unityPackages.length - 1; i > -1; i--) {
                var unityPackage = ref.unityPackages[i];
                if (
                    unityPackage.platform === 'standalonewindows' &&
                    $app.compareUnityVersion(unityPackage.unityVersion)
                ) {
                    assetUrl = unityPackage.assetUrl;
                    break;
                }
            }
            var fileId = extractFileId(assetUrl);
            var fileVersion = parseInt(extractFileVersion(assetUrl), 10);
            if (fileId) {
                API.getBundles(fileId)
                    .then((args2) => {
                        var {versions} = args2.json;
                        for (let i = versions.length - 1; i > -1; i--) {
                            var version = versions[i];
                            if (version.version === fileVersion) {
                                D.fileCreatedAt = version.created_at;
                                D.fileSize = `${(
                                    version.file.sizeInBytes / 1048576
                                ).toFixed(2)} MiB`;
                                break;
                            }
                        }
                    })
                    .catch(() => {
                        D.fileSize = 'Error';
                    });
            }
        }
    });

    API.$on('FAVORITE', function (args) {
        var {ref} = args;
        var D = $app.worldDialog;
        if (D.visible === false || ref.$isDeleted || ref.favoriteId !== D.id) {
            return;
        }
        D.isFavorite = true;
    });

    API.$on('FAVORITE:@DELETE', function (args) {
        var D = $app.worldDialog;
        if (D.visible === false || D.id !== args.ref.favoriteId) {
            return;
        }
        D.isFavorite = false;
    });

    $app.methods.showWorldDialog = function (tag) {
        this.$nextTick(() => adjustDialogZ(this.$refs.worldDialog.$el));
        var D = this.worldDialog;
        var L = API.parseLocation(tag);
        if (L.worldId === '') {
            return;
        }
        D.id = L.worldId;
        D.$location = L;
        D.treeData = [];
        D.fileCreatedAt = '';
        D.fileSize = 'Loading';
        D.visible = true;
        D.loading = true;
        D.inCache = false;
        D.cacheSize = 0;
        D.cacheLocked = false;
        D.rooms = [];
        API.getCachedWorld({
            worldId: L.worldId
        })
            .catch((err) => {
                D.loading = false;
                D.visible = false;
                throw err;
            })
            .then((args) => {
                if (D.id === args.ref.id) {
                    D.loading = false;
                    D.ref = args.ref;
                    D.isFavorite = API.cachedFavoritesByObjectId.has(D.id);
                    this.updateVRChatWorldCache();
                    if (args.cache) {
                        API.getWorld(args.params)
                            .catch((err) => {
                                throw err;
                            })
                            .then((args1) => {
                                if (D.id === args1.ref.id) {
                                    D.ref = args1.ref;
                                    this.updateVRChatWorldCache();
                                }
                                return args1;
                            });
                    }
                }
                return args;
            });
    };

    $app.methods.applyWorldDialogInstances = function () {
        var D = this.worldDialog;
        var instances = {};
        for (var [id, occupants] of D.ref.instances) {
            instances[id] = {
                id,
                occupants,
                users: []
            };
        }
        var {instanceId} = D.$location;
        if (instanceId && typeof instances[instanceId] === 'undefined') {
            instances[instanceId] = {
                id: instanceId,
                occupants: 0,
                users: []
            };
        }
        var lastLocation$ = API.parseLocation(this.lastLocation.location);
        var playersInInstance = this.lastLocation.playerList;
        if (lastLocation$.worldId === D.id) {
            var instance = {
                id: lastLocation$.instanceId,
                occupants: playersInInstance.size,
                users: []
            };
            instances[instance.id] = instance;
            var ref = API.cachedUsers.get(API.currentUser.id);
            if (typeof ref === 'undefined') {
                ref = API.currentUser;
            }
            if (playersInInstance.has(ref.displayName)) {
                instance.users.push(ref); // add self
            }
            var friendsInInstance = this.lastLocation.friendList;
            for (var friend of friendsInInstance.values()) {
                // if friend isn't in instance add them
                var addUser = true;
                for (var k = 0; k < instance.users.length; k++) {
                    var user = instance.users[k];
                    if (friend.displayName === user.displayName) {
                        addUser = false;
                        break;
                    }
                }
                if (addUser) {
                    var ref = API.cachedUsers.get(friend.userId);
                    if (typeof ref !== 'undefined') {
                        instance.users.push(ref);
                    }
                }
            }
        }
        for (var {ref} of this.friends.values()) {
            if (
                typeof ref === 'undefined' ||
                typeof ref.$location === 'undefined' ||
                ref.$location.worldId !== D.id ||
                ref.$location.instanceId === lastLocation$.instanceId
            ) {
                continue;
            }
            var {instanceId} = ref.$location;
            var instance = instances[instanceId];
            if (typeof instance === 'undefined') {
                instance = {
                    id: instanceId,
                    occupants: 0,
                    users: []
                };
                instances[instanceId] = instance;
            }
            instance.users.push(ref);
        }
        var rooms = [];
        for (var instance of Object.values(instances)) {
            // due to references on callback of API.getUser()
            // this should be block scope variable
            const L = API.parseLocation(`${D.id}:${instance.id}`);
            instance.location = L.tag;
            instance.$location = L;
            if (L.userId) {
                var ref = API.cachedUsers.get(L.userId);
                if (typeof ref === 'undefined') {
                    API.getUser({
                        userId: L.userId
                    }).then((args) => {
                        Vue.set(L, 'user', args.ref);
                        return args;
                    });
                } else {
                    L.user = ref;
                }
            }
            instance.users.sort(compareByLocationAt);
            rooms.push(instance);
        }
        // reuse instance occupants from getInstance
        for (var room of rooms) {
            if (room.occupants === 0) {
                for (var instance of D.rooms) {
                    if (instance.id === room.id) {
                        room.occupants = instance.occupants;
                        break;
                    }
                }
            }
        }
        // sort by more friends, occupants
        rooms.sort(function (a, b) {
            return b.users.length - a.users.length || b.occupants - a.occupants;
        });
        D.rooms = rooms;
    };

    $app.methods.worldDialogCommand = function (command) {
        var D = this.worldDialog;
        if (D.visible === false) {
            return;
        }
        switch (command) {
            case 'Refresh':
                D.loading = true;
                API.getWorld({
                    worldId: D.id
                })
                    .catch((err) => {
                        D.loading = false;
                        D.visible = false;
                        throw err;
                    })
                    .then((args) => {
                        if (D.id === args.ref.id) {
                            D.loading = false;
                            D.ref = args.ref;
                            D.isFavorite = API.cachedFavoritesByObjectId.has(
                                D.id
                            );
                            this.updateVRChatWorldCache();
                        }
                        return args;
                    });
                break;
            case 'New Instance':
                this.showNewInstanceDialog(D.$location.tag);
                break;
            case 'Add Favorite':
                this.showFavoriteDialog('world', D.id);
                break;
            case 'Rename':
                this.promptRenameWorld(D);
                break;
            case 'Upload Image':
                document.getElementById('WorldImageUploadButton').click();
                break;
            case 'Change Image':
                this.displayPreviousImages('World', 'Change');
                break;
            case 'Previous Images':
                this.displayPreviousImages('World', 'Display');
                break;
            case 'Change Description':
                this.promptChangeWorldDescription(D);
                break;
            default:
                this.$confirm(`Continue? ${command}`, 'Confirm', {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info',
                    callback: (action) => {
                        if (action !== 'confirm') {
                            return;
                        }
                        switch (command) {
                            case 'Delete Favorite':
                                API.deleteFavorite({
                                    objectId: D.id
                                });
                                break;
                            case 'Make Home':
                                API.saveCurrentUser({
                                    homeLocation: D.id
                                }).then((args) => {
                                    this.$message({
                                        message: 'Home world updated',
                                        type: 'success'
                                    });
                                    return args;
                                });
                                break;
                            case 'Reset Home':
                                API.saveCurrentUser({
                                    homeLocation: ''
                                }).then((args) => {
                                    this.$message({
                                        message: 'Home world has been reset',
                                        type: 'success'
                                    });
                                    return args;
                                });
                                break;
                            case 'Delete':
                                API.deleteWorld({
                                    worldId: D.id
                                }).then((args) => {
                                    this.$message({
                                        message: 'World has been deleted',
                                        type: 'success'
                                    });
                                    D.visible = false;
                                    return args;
                                });
                                break;
                        }
                    }
                });
                break;
        }
    };

    $app.methods.refreshWorldDialogTreeData = function () {
        var D = this.worldDialog;
        D.treeData = buildTreeData(D.ref);
    };

    $app.computed.worldDialogPlatform = function () {
        var {ref} = this.worldDialog;
        var platforms = [];
        if (ref.unityPackages) {
            for (var unityPackage of ref.unityPackages) {
                var platform = 'PC';
                if (unityPackage.platform === 'standalonewindows') {
                    platform = 'PC';
                } else if (unityPackage.platform === 'android') {
                    platform = 'Quest';
                } else if (unityPackage.platform) {
                    ({platform} = unityPackage);
                }
                platforms.push(`${platform}/${unityPackage.unityVersion}`);
            }
        }
        return platforms.join(', ');
    };

    // App: Avatar Dialog

    $app.data.avatarDialog = {
        visible: false,
        loading: false,
        id: '',
        ref: {},
        isFavorite: false,
        isQuestFallback: false,
        treeData: [],
        fileSize: '',
        inCache: false,
        cacheSize: 0,
        cacheLocked: false
    };

    API.$on('LOGOUT', function () {
        $app.avatarDialog.visible = false;
    });

    API.$on('FAVORITE', function (args) {
        var {ref} = args;
        var D = $app.avatarDialog;
        if (D.visible === false || ref.$isDeleted || ref.favoriteId !== D.id) {
            return;
        }
        D.isFavorite = true;
    });

    API.$on('FAVORITE:@DELETE', function (args) {
        var D = $app.avatarDialog;
        if (D.visible === false || D.id !== args.ref.favoriteId) {
            return;
        }
        D.isFavorite = false;
    });

    $app.methods.showAvatarDialog = function (avatarId) {
        this.$nextTick(() => adjustDialogZ(this.$refs.avatarDialog.$el));
        var D = this.avatarDialog;
        D.visible = true;
        D.id = avatarId;
        D.treeData = [];
        D.fileSize = '';
        D.inCache = false;
        D.cacheSize = 0;
        D.cacheLocked = false;
        D.isQuestFallback = false;
        D.isFavorite = API.cachedFavoritesByObjectId.has(avatarId);
        var ref2 = API.cachedAvatars.get(avatarId);
        if (typeof ref2 !== 'undefined') {
            D.ref = ref2;
            this.updateVRChatAvatarCache();
        }
        API.getAvatar({avatarId}).then((args) => {
            var {ref} = args;
            D.ref = ref;
            this.updateVRChatAvatarCache();
            if (
                ref.imageUrl === API.currentUser.currentAvatarImageUrl &&
                !ref.assetUrl
            ) {
                D.ref.assetUrl = API.currentUser.currentAvatarAssetUrl;
            }
            if (/quest/.test(ref.tags)) {
                D.isQuestFallback = true;
            }
            var assetUrl = '';
            for (let i = ref.unityPackages.length - 1; i > -1; i--) {
                var unityPackage = ref.unityPackages[i];
                if (
                    unityPackage.platform === 'standalonewindows' &&
                    this.compareUnityVersion(unityPackage.unityVersion)
                ) {
                    assetUrl = unityPackage.assetUrl;
                    break;
                }
            }
            var fileId = extractFileId(assetUrl);
            var fileVersion = parseInt(extractFileVersion(assetUrl), 10);
            if (!fileId) {
                fileId = extractFileId(ref.assetUrl);
                fileVersion = parseInt(extractFileVersion(ref.assetUrl), 10);
            }
            D.fileSize = '';
            if (fileId) {
                D.fileSize = 'Loading';
                API.getBundles(fileId)
                    .then((args2) => {
                        var {versions} = args2.json;
                        for (let i = versions.length - 1; i > -1; i--) {
                            var version = versions[i];
                            if (version.version === fileVersion) {
                                D.fileSize = `${(
                                    version.file.sizeInBytes / 1048576
                                ).toFixed(2)} MiB`;
                                break;
                            }
                        }
                    })
                    .catch(() => {
                        D.fileSize = 'Error';
                    });
            }
        });
    };

    $app.methods.avatarDialogCommand = function (command) {
        var D = this.avatarDialog;
        if (D.visible === false) {
            return;
        }
        switch (command) {
            case 'Rename':
                this.promptRenameAvatar(D);
                break;
            case 'Upload Image':
                document.getElementById('AvatarImageUploadButton').click();
                break;
            case 'Change Image':
                this.displayPreviousImages('Avatar', 'Change');
                break;
            case 'Previous Images':
                this.displayPreviousImages('Avatar', 'Display');
                break;
            case 'Change Description':
                this.promptChangeAvatarDescription(D);
                break;
            case 'Download Unity Package':
                this.openExternalLink(this.avatarDialog.ref.unityPackageUrl);
                break;
            case 'Add Favorite':
                this.showFavoriteDialog('avatar', D.id);
                break;
            default:
                this.$confirm(`Continue? ${command}`, 'Confirm', {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info',
                    callback: (action) => {
                        if (action !== 'confirm') {
                            return;
                        }
                        switch (command) {
                            case 'Delete Favorite':
                                API.deleteFavorite({
                                    objectId: D.id
                                });
                                break;
                            case 'Select Avatar':
                                API.selectAvatar({
                                    avatarId: D.id
                                }).then((args) => {
                                    this.$message({
                                        message: 'Avatar changed',
                                        type: 'success'
                                    });
                                    return args;
                                });
                                break;
                            case 'Select Fallback Avatar':
                                API.selectFallbackAvatar({
                                    avatarId: D.id
                                }).then((args) => {
                                    this.$message({
                                        message: 'Fallback avatar changed',
                                        type: 'success'
                                    });
                                    return args;
                                });
                                break;
                            case 'Make Public':
                                API.saveAvatar({
                                    id: D.id,
                                    releaseStatus: 'public'
                                }).then((args) => {
                                    this.$message({
                                        message: 'Avatar updated to public',
                                        type: 'success'
                                    });
                                    return args;
                                });
                                break;
                            case 'Make Private':
                                API.saveAvatar({
                                    id: D.id,
                                    releaseStatus: 'private'
                                }).then((args) => {
                                    this.$message({
                                        message: 'Avatar updated to private',
                                        type: 'success'
                                    });
                                    return args;
                                });
                                break;
                            case 'Delete':
                                API.deleteAvatar({
                                    avatarId: D.id
                                }).then((args) => {
                                    this.$message({
                                        message: 'Avatar deleted',
                                        type: 'success'
                                    });
                                    D.visible = false;
                                    return args;
                                });
                                break;
                        }
                    }
                });
                break;
        }
    };

    $app.methods.showAvatarAuthorDialog = function (
        refUserId,
        currentAvatarImageUrl
    ) {
        var fileId = extractFileId(currentAvatarImageUrl);
        if (!fileId) {
            this.$message({
                message: 'Sorry, the author is unknown',
                type: 'error'
            });
            return;
        }
        if (refUserId === API.currentUser.id) {
            this.showAvatarDialog(API.currentUser.currentAvatar);
            return;
        }
        for (var ref of API.cachedAvatars.values()) {
            if (extractFileId(ref.imageUrl) === fileId) {
                this.showAvatarDialog(ref.id);
                return;
            }
        }
        if (API.cachedAvatarNames.has(fileId)) {
            let {ownerId} = API.cachedAvatarNames.get(fileId);
            if (ownerId === API.currentUser.id) {
                this.refreshUserDialogAvatars(fileId);
                return;
            }
            if (ownerId === refUserId) {
                this.$message({
                    message: "It's personal (own) avatar",
                    type: 'warning'
                });
                return;
            }
            this.showUserDialog(ownerId);
        } else {
            API.getAvatarImages({fileId}).then((args) => {
                let ownerId = args.json.ownerId;
                if (ownerId === refUserId) {
                    this.$message({
                        message: "It's personal (own) avatar",
                        type: 'warning'
                    });
                    return;
                }
                this.showUserDialog(ownerId);
            });
        }
    };

    $app.methods.refreshAvatarDialogTreeData = function () {
        var D = this.avatarDialog;
        D.treeData = buildTreeData(D.ref);
    };

    $app.computed.avatarDialogPlatform = function () {
        var {ref} = this.avatarDialog;
        var platforms = [];
        if (ref.unityPackages) {
            for (var unityPackage of ref.unityPackages) {
                var platform = 'PC';
                if (unityPackage.platform === 'standalonewindows') {
                    platform = 'PC';
                } else if (unityPackage.platform === 'android') {
                    platform = 'Quest';
                } else if (unityPackage.platform) {
                    ({platform} = unityPackage);
                }
                platforms.push(`${platform}/${unityPackage.unityVersion}`);
            }
        }
        return platforms.join(', ');
    };

    // App: Favorite Dialog

    $app.data.favoriteDialog = {
        visible: false,
        loading: false,
        type: '',
        objectId: '',
        groups: []
    };

    API.$on('LOGOUT', function () {
        $app.favoriteDialog.visible = false;
    });

    $app.methods.addFavorite = function (group) {
        var D = this.favoriteDialog;
        D.loading = true;
        API.addFavorite({
            type: D.type,
            favoriteId: D.objectId,
            tags: group.name
        })
            .finally(() => {
                D.loading = false;
            })
            .then((args) => {
                D.visible = false;
                return args;
            });
    };

    $app.methods.addFavoriteAvatar = function (ref, group) {
        API.addFavorite({
            type: 'avatar',
            favoriteId: ref.id,
            tags: group.name
        });
    };

    $app.methods.moveFavorite = function (ref, group, type) {
        API.deleteFavorite({
            objectId: ref.id
        }).then(() => {
            API.addFavorite({
                type,
                favoriteId: ref.id,
                tags: group.name
            });
        });
    };

    $app.methods.showFavoriteDialog = function (type, objectId) {
        this.$nextTick(() => adjustDialogZ(this.$refs.favoriteDialog.$el));
        var D = this.favoriteDialog;
        D.type = type;
        D.objectId = objectId;
        if (type === 'friend') {
            D.groups = API.favoriteFriendGroups;
            D.visible = true;
        } else if (type === 'world') {
            D.groups = API.favoriteWorldGroups;
            D.visible = true;
        } else if (type === 'avatar') {
            D.groups = API.favoriteAvatarGroups;
            D.visible = true;
        }
    };

    // App: Invite Dialog

    $app.data.inviteDialog = {
        visible: false,
        loading: false,
        worldId: '',
        worldName: '',
        userIds: []
    };

    API.$on('LOGOUT', function () {
        $app.inviteDialog.visible = false;
    });

    $app.methods.sendInvite = function () {
        this.$confirm('Continue? Invite', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                var D = this.inviteDialog;
                if (action !== 'confirm' || D.loading === true) {
                    return;
                }
                if (
                    this.API.currentUser.status === 'busy' &&
                    D.userIds.includes(this.API.currentUser.id) === true
                ) {
                    this.$message({
                        message:
                            "You can't invite yourself in 'Do Not Disturb' mode",
                        type: 'error'
                    });
                    return;
                }
                D.loading = true;
                var inviteLoop = () => {
                    if (D.userIds.length > 0) {
                        var receiverUserId = D.userIds.shift();
                        API.sendInvite(
                            {
                                instanceId: D.worldId,
                                worldId: D.worldId,
                                worldName: D.worldName
                            },
                            receiverUserId
                        ).finally(inviteLoop);
                    } else {
                        D.loading = false;
                        D.visible = false;
                        this.$message({
                            message: 'Invite sent',
                            type: 'success'
                        });
                    }
                };
                inviteLoop();
            }
        });
    };

    $app.methods.showInviteDialog = function (tag) {
        this.$nextTick(() => adjustDialogZ(this.$refs.inviteDialog.$el));
        var L = API.parseLocation(tag);
        if (L.isOffline || L.isPrivate || L.worldId === '') {
            return;
        }
        API.getCachedWorld({
            worldId: L.worldId
        }).then((args) => {
            var D = this.inviteDialog;
            D.userIds = [];
            D.worldId = L.tag;
            D.worldName = args.ref.name;
            D.visible = true;
        });
    };

    // App: Social Status Dialog

    $app.data.socialStatusDialog = {
        visible: false,
        loading: false,
        status: '',
        statusDescription: ''
    };

    API.$on('LOGOUT', function () {
        $app.socialStatusDialog.visible = false;
    });

    $app.methods.saveSocialStatus = function () {
        var D = this.socialStatusDialog;
        if (D.loading) {
            return;
        }
        D.loading = true;
        API.saveCurrentUser({
            status: D.status,
            statusDescription: D.statusDescription
        })
            .finally(() => {
                D.loading = false;
            })
            .then((args) => {
                D.visible = false;
                this.$message({
                    message: 'Status updated',
                    type: 'success'
                });
                return args;
            });
    };

    $app.methods.showSocialStatusDialog = function () {
        this.$nextTick(() => adjustDialogZ(this.$refs.socialStatusDialog.$el));
        var D = this.socialStatusDialog;
        var {statusHistory} = API.currentUser;
        var statusHistoryArray = [];
        for (var i = 0; i < statusHistory.length; ++i) {
            var addStatus = {
                no: i + 1,
                status: statusHistory[i]
            };
            statusHistoryArray.push(addStatus);
        }
        this.socialStatusHistoryTable.data = statusHistoryArray;
        D.status = API.currentUser.status;
        D.statusDescription = API.currentUser.statusDescription;
        D.visible = true;
    };

    $app.methods.setSocialStatusFromHistory = function (val) {
        if (val === null) {
            return;
        }
        var D = this.socialStatusDialog;
        D.statusDescription = val.status;
    };

    // App: Language Dialog

    $app.data.languageDialog = {
        visible: false,
        loading: false,
        languageChoice: false,
        languageValue: '',
        languages: (function () {
            var data = [];
            for (var key in subsetOfLanguages) {
                var value = subsetOfLanguages[key];
                data.push({
                    key,
                    value
                });
            }
            return data;
        })()
    };

    API.$on('LOGOUT', function () {
        $app.languageDialog.visible = false;
    });

    $app.methods.addUserLanguage = function (language) {
        if (language !== String(language)) {
            return;
        }
        var D = this.languageDialog;
        D.loading = true;
        API.addUserTags({
            tags: [`language_${language}`]
        }).finally(function () {
            D.loading = false;
        });
    };

    $app.methods.removeUserLanguage = function (language) {
        if (language !== String(language)) {
            return;
        }
        var D = this.languageDialog;
        D.loading = true;
        API.removeUserTags({
            tags: [`language_${language}`]
        }).finally(function () {
            D.loading = false;
        });
    };

    $app.methods.showLanguageDialog = function () {
        this.$nextTick(() => adjustDialogZ(this.$refs.languageDialog.$el));
        var D = this.languageDialog;
        D.visible = true;
    };

    // App: Bio Dialog

    $app.data.bioDialog = {
        visible: false,
        loading: false,
        bio: '',
        bioLinks: []
    };

    API.$on('LOGOUT', function () {
        $app.bioDialog.visible = false;
    });

    $app.methods.saveBio = function () {
        var D = this.bioDialog;
        if (D.loading) {
            return;
        }
        D.loading = true;
        API.saveCurrentUser({
            bio: D.bio,
            bioLinks: D.bioLinks
        })
            .finally(() => {
                D.loading = false;
            })
            .then((args) => {
                D.visible = false;
                this.$message({
                    message: 'Bio updated',
                    type: 'success'
                });
                return args;
            });
    };

    $app.methods.showBioDialog = function () {
        this.$nextTick(() => adjustDialogZ(this.$refs.bioDialog.$el));
        var D = this.bioDialog;
        D.bio = API.currentUser.bio;
        D.bioLinks = API.currentUser.bioLinks.slice();
        D.visible = true;
    };

    // App: New Instance Dialog

    $app.data.newInstanceDialog = {
        visible: false,
        loading: false,
        worldId: '',
        instanceId: '',
        instanceName: '',
        userId: '',
        accessType: '',
        region: '',
        location: '',
        url: ''
    };

    API.$on('LOGOUT', function () {
        $app.newInstanceDialog.visible = false;
    });

    $app.methods.buildInstance = function () {
        var D = this.newInstanceDialog;
        var tags = [];
        if (D.instanceName) {
            D.instanceName = D.instanceName.replace(/[^A-Za-z0-9]/g, '');
            tags.push(D.instanceName);
        } else {
            tags.push((99999 * Math.random() + 1).toFixed(0));
        }
        if (D.userId) {
            var userId = D.userId;
        } else {
            D.userId = API.currentUser.id;
            var userId = API.currentUser.id;
        }
        if (D.accessType !== 'public') {
            if (D.accessType === 'friends+') {
                tags.push(`~hidden(${userId})`);
            } else if (D.accessType === 'friends') {
                tags.push(`~friends(${userId})`);
            } else {
                tags.push(`~private(${userId})`);
            }
            if (D.accessType === 'invite+') {
                tags.push('~canRequestInvite');
            }
        }
        if (D.region === 'USA') {
            tags.push(`~region(us)`);
        } else if (D.region === 'Europe') {
            tags.push(`~region(eu)`);
        } else if (D.region === 'Japan') {
            tags.push(`~region(jp)`);
        }
        if (D.accessType !== 'public') {
            tags.push(`~nonce(${uuidv4()})`);
        }
        D.instanceId = tags.join('');
    };

    $app.methods.selfInvite = function (location) {
        var L = API.parseLocation(location);
        if (L.isOffline || L.isPrivate || L.worldId === '') {
            return;
        }
        if (API.currentUser.status === 'busy') {
            this.$message({
                message: "You can't invite yourself in 'Do Not Disturb' mode",
                type: 'error'
            });
            return;
        }
        API.selfInvite({
            instanceId: L.instanceId,
            worldId: L.worldId
        });
    };

    var updateLocationURL = function () {
        var D = $app.newInstanceDialog;
        if (D.instanceId) {
            D.location = `${D.worldId}:${D.instanceId}`;
        } else {
            D.location = D.worldId;
        }
        D.url = getLaunchURL(D.worldId, D.instanceId);
    };
    var saveNewInstanceDialog = function () {
        configRepository.setString(
            'instanceDialogAccessType',
            this.newInstanceDialog.accessType
        );
        configRepository.setString(
            'instanceRegion',
            this.newInstanceDialog.region
        );
        configRepository.setString(
            'instanceDialogInstanceName',
            this.newInstanceDialog.instanceName
        );
        if (this.newInstanceDialog.userId === API.currentUser.id) {
            configRepository.setString('instanceDialogUserId', '');
        } else {
            configRepository.setString(
                'instanceDialogUserId',
                this.newInstanceDialog.userId
            );
        }
        $app.buildInstance();
        updateLocationURL();
    };
    $app.watch['newInstanceDialog.worldId'] = updateLocationURL;
    $app.watch['newInstanceDialog.instanceName'] = saveNewInstanceDialog;
    $app.watch['newInstanceDialog.accessType'] = saveNewInstanceDialog;
    $app.watch['newInstanceDialog.region'] = saveNewInstanceDialog;
    $app.watch['newInstanceDialog.userId'] = saveNewInstanceDialog;

    $app.methods.showNewInstanceDialog = function (tag) {
        this.$nextTick(() => adjustDialogZ(this.$refs.newInstanceDialog.$el));
        var L = API.parseLocation(tag);
        if (L.isOffline || L.isPrivate || L.worldId === '') {
            return;
        }
        var D = this.newInstanceDialog;
        D.worldId = L.worldId;
        D.accessType = 'public';
        if (configRepository.getString('instanceDialogAccessType') !== null) {
            D.accessType = configRepository.getString(
                'instanceDialogAccessType'
            );
        }
        D.region = 'USA';
        if (configRepository.getString('instanceRegion') !== null) {
            D.region = configRepository.getString('instanceRegion');
        }
        D.instanceName = '';
        if (configRepository.getString('instanceDialogInstanceName') !== null) {
            D.instanceName = configRepository.getString(
                'instanceDialogInstanceName'
            );
        }
        D.userId = '';
        if (configRepository.getString('instanceDialogUserId') !== null) {
            D.userId = configRepository.getString('instanceDialogUserId');
        }
        this.buildInstance();
        D.visible = true;
    };

    $app.methods.makeHome = function (tag) {
        this.$confirm('Continue? Make Home', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action !== 'confirm') {
                    return;
                }
                API.saveCurrentUser({
                    homeLocation: tag
                }).then((args) => {
                    this.$message({
                        message: 'Home world updated',
                        type: 'success'
                    });
                    return args;
                });
            }
        });
    };

    // App: Launch Options

    $app.data.launchArguments = VRCXStorage.Get('launchArguments');

    // App: Launch Options Dialog

    $app.data.launchOptionsDialog = {
        visible: false,
        arguments: ''
    };

    API.$on('LOGOUT', function () {
        $app.launchOptionsDialog.visible = false;
    });

    $app.methods.updateLaunchOptions = function () {
        var D = this.launchOptionsDialog;
        D.visible = false;
        var args = String(D.arguments).replace(/\s+/g, ' ').trim();
        this.launchArguments = args;
        VRCXStorage.Set('launchArguments', args);
        this.$message({
            message: 'updated',
            type: 'success'
        });
    };

    $app.methods.showLaunchOptions = function () {
        this.$nextTick(() => adjustDialogZ(this.$refs.launchOptionsDialog.$el));
        var D = this.launchOptionsDialog;
        D.arguments = this.launchArguments;
        D.visible = true;
    };

    // App: Notification position

    $app.data.notificationPositionDialog = {
        visible: false
    };

    $app.methods.showNotificationPositionDialog = function () {
        this.$nextTick(() =>
            adjustDialogZ(this.$refs.notificationPositionDialog.$el)
        );
        this.notificationPositionDialog.visible = true;
    };

    // App: Noty feed filters

    $app.data.notyFeedFiltersDialog = {
        visible: false
    };

    $app.methods.showNotyFeedFiltersDialog = function () {
        this.$nextTick(() =>
            adjustDialogZ(this.$refs.notyFeedFiltersDialog.$el)
        );
        this.notyFeedFiltersDialog.visible = true;
    };

    // App: Wrist feed filters

    $app.data.wristFeedFiltersDialog = {
        visible: false
    };

    $app.methods.showWristFeedFiltersDialog = function () {
        this.$nextTick(() =>
            adjustDialogZ(this.$refs.wristFeedFiltersDialog.$el)
        );
        this.wristFeedFiltersDialog.visible = true;
    };

    // App: Launch Dialog

    $app.data.launchDialog = {
        visible: false,
        loading: false,
        desktop: configRepository.getBool('launchAsDesktop'),
        location: '',
        url: ''
    };

    $app.watch['launchDialog.desktop'] = function () {
        configRepository.setBool('launchAsDesktop', this.launchDialog.desktop);
    };

    API.$on('LOGOUT', function () {
        $app.launchDialog.visible = false;
    });

    $app.methods.showLaunchDialog = function (tag) {
        this.$nextTick(() => adjustDialogZ(this.$refs.launchDialog.$el));
        var L = API.parseLocation(tag);
        if (L.isOffline || L.isPrivate || L.worldId === '') {
            return;
        }
        var D = this.launchDialog;
        if (L.instanceId) {
            D.location = `${L.worldId}:${L.instanceId}`;
        } else {
            D.location = L.worldId;
        }
        D.url = getLaunchURL(L.worldId, L.instanceId);
        D.visible = true;
    };

    $app.methods.locationToLaunchArg = function (location) {
        return `vrchat://launch?id=${location}`;
    };

    $app.methods.launchGame = function (...args) {
        var D = this.launchDialog;
        if (this.launchArguments) {
            args.push(this.launchArguments);
        }
        if (D.desktop === true) {
            args.push('--no-vr');
        }
        AppApi.StartGame(args.join(' '));
        D.visible = false;
    };

    // App: Copy To Clipboard

    $app.methods.copyToClipboard = function (text) {
        var textArea = document.createElement('textarea');
        textArea.id = 'copy_to_clipboard';
        textArea.value = text;
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.position = 'fixed';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.getElementById('copy_to_clipboard').remove();
    };

    $app.methods.copyInstanceUrl = function (url) {
        this.copyToClipboard(url);
        this.$message({
            message: 'Instance URL copied to clipboard',
            type: 'success'
        });
        this.launchDialog.visible = false;
        this.newInstanceDialog.visible = false;
    };

    $app.methods.copyLocation = function (location) {
        var L = API.parseLocation(location);
        var url = getLaunchURL(L.worldId, L.instanceId);
        this.copyToClipboard(url);
        this.$message({
            message: 'Instance URL copied to clipboard',
            type: 'success'
        });
    };

    $app.methods.copyLocationCheck = function (location) {
        if (
            location === '' ||
            location === 'offline' ||
            location === 'private'
        ) {
            return false;
        }
        return true;
    };

    $app.methods.copyAvatar = function (avatarId) {
        this.$message({
            message: 'Avatar URL copied to clipboard',
            type: 'success'
        });
        this.copyToClipboard(`https://vrchat.com/home/avatar/${avatarId}`);
    };

    $app.methods.copyWorld = function (worldId) {
        this.$message({
            message: 'World URL copied to clipboard',
            type: 'success'
        });
        this.copyToClipboard(`https://vrchat.com/home/world/${worldId}`);
    };

    // App: VRCPlus Icons

    API.$on('LOGIN', function () {
        $app.VRCPlusIconsTable = [];
    });

    $app.methods.refreshVRCPlusIconsTable = function () {
        this.galleryDialogIconsLoading = true;
        var params = {
            n: 100,
            tag: 'icon'
        };
        API.getFileList(params);
    };

    API.getFileList = function (params) {
        return this.call('files', {
            method: 'GET',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('FILES:LIST', args);
            return args;
        });
    };

    API.$on('FILES:LIST', function (args) {
        if (args.params.tag === 'icon') {
            $app.VRCPlusIconsTable = args.json.reverse();
            $app.galleryDialogIconsLoading = false;
        }
    });

    $app.methods.setVRCPlusIcon = function (fileId) {
        var userIcon = '';
        if (fileId) {
            userIcon = `https://api.vrchat.cloud/api/1/file/${fileId}/1`;
        }
        if (userIcon === API.currentUser.userIcon) {
            return;
        }
        API.saveCurrentUser({
            userIcon
        }).then((args) => {
            this.$message({
                message: 'Icon changed',
                type: 'success'
            });
            return args;
        });
    };

    $app.methods.deleteVRCPlusIcon = function (fileId) {
        API.deleteFile(fileId).then((args) => {
            API.$emit('VRCPLUSICON:DELETE', args);
            return args;
        });
    };

    API.$on('VRCPLUSICON:DELETE', function (args) {
        var array = $app.VRCPlusIconsTable;
        var {length} = array;
        for (var i = 0; i < length; ++i) {
            if (args.fileId === array[i].id) {
                array.splice(i, 1);
                break;
            }
        }
    });

    API.deleteFile = function (fileId) {
        return this.call(`file/${fileId}`, {
            method: 'DELETE'
        }).then((json) => {
            var args = {
                json,
                fileId
            };
            return args;
        });
    };

    $app.methods.compareCurrentVRCPlusIcon = function (userIcon) {
        var currentUserIcon = extractFileId(API.currentUser.userIcon);
        if (userIcon === currentUserIcon) {
            return true;
        }
        return false;
    };

    $app.methods.onFileChangeVRCPlusIcon = function (e) {
        var clearFile = function () {
            if (document.querySelector('#VRCPlusIconUploadButton')) {
                document.querySelector('#VRCPlusIconUploadButton').value = '';
            }
        };
        var files = e.target.files || e.dataTransfer.files;
        if (!files.length) {
            return;
        }
        if (files[0].size >= 10000000) {
            // 10MB
            $app.$message({
                message: 'File size too large',
                type: 'error'
            });
            clearFile();
            return;
        }
        if (!files[0].type.match(/image.*/)) {
            $app.$message({
                message: "File isn't an image",
                type: 'error'
            });
            clearFile();
            return;
        }
        var r = new FileReader();
        r.onload = function () {
            var base64Body = btoa(r.result);
            API.uploadVRCPlusIcon(base64Body).then((args) => {
                $app.$message({
                    message: 'Icon uploaded',
                    type: 'success'
                });
                return args;
            });
        };
        r.readAsBinaryString(files[0]);
        clearFile();
    };

    $app.methods.displayVRCPlusIconUpload = function () {
        document.getElementById('VRCPlusIconUploadButton').click();
    };

    API.uploadVRCPlusIcon = function (params) {
        return this.call('icon', {
            uploadImage: true,
            imageData: params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('VRCPLUSICON:ADD', args);
            return args;
        });
    };

    API.$on('VRCPLUSICON:ADD', function (args) {
        if (Object.keys($app.VRCPlusIconsTable).length !== 0) {
            $app.VRCPlusIconsTable.push(args.json);
        }
    });

    $app.data.uploadImage = '';

    $app.methods.inviteImageUpload = function (e) {
        var files = e.target.files || e.dataTransfer.files;
        if (!files.length) {
            return;
        }
        if (files[0].size >= 10000000) {
            // 10MB
            $app.$message({
                message: 'File size too large',
                type: 'error'
            });
            this.clearInviteImageUpload();
            return;
        }
        if (!files[0].type.match(/image.png/)) {
            $app.$message({
                message: "File isn't a png",
                type: 'error'
            });
            this.clearInviteImageUpload();
            return;
        }
        var r = new FileReader();
        r.onload = function () {
            $app.uploadImage = btoa(r.result);
        };
        r.readAsBinaryString(files[0]);
    };

    $app.methods.clearInviteImageUpload = function () {
        var buttonList = document.querySelectorAll('.inviteImageUploadButton');
        buttonList.forEach((button) => (button.value = ''));
        this.uploadImage = '';
    };

    $app.methods.userOnlineFor = function (ctx) {
        if (ctx.ref.state === 'online' && ctx.ref.$online_for) {
            return timeToText(Date.now() - ctx.ref.$online_for);
        } else if (ctx.ref.$offline_for) {
            return timeToText(Date.now() - ctx.ref.$offline_for);
        }
        return '-';
    };

    // App: Invite Messages

    API.$on('LOGIN', function () {
        $app.inviteMessageTable.data = [];
        $app.inviteResponseMessageTable.data = [];
        $app.inviteRequestMessageTable.data = [];
        $app.inviteRequestResponseMessageTable.data = [];
        $app.inviteMessageTable.visible = false;
        $app.inviteResponseMessageTable.visible = false;
        $app.inviteRequestMessageTable.visible = false;
        $app.inviteRequestResponseMessageTable.visible = false;
    });

    $app.methods.refreshInviteMessageTable = function (messageType) {
        API.refreshInviteMessageTableData(messageType);
    };

    API.refreshInviteMessageTableData = function (messageType) {
        return this.call(`message/${this.currentUser.id}/${messageType}`, {
            method: 'GET'
        }).then((json) => {
            var args = {
                json,
                messageType
            };
            this.$emit(`INVITE:${messageType.toUpperCase()}`, args);
            return args;
        });
    };

    API.$on('INVITE:MESSAGE', function (args) {
        $app.inviteMessageTable.data = args.json;
    });

    API.$on('INVITE:RESPONSE', function (args) {
        $app.inviteResponseMessageTable.data = args.json;
    });

    API.$on('INVITE:REQUEST', function (args) {
        $app.inviteRequestMessageTable.data = args.json;
    });

    API.$on('INVITE:REQUESTRESPONSE', function (args) {
        $app.inviteRequestResponseMessageTable.data = args.json;
    });

    API.editInviteMessage = function (params, messageType, slot) {
        return this.call(
            `message/${this.currentUser.id}/${messageType}/${slot}`,
            {
                method: 'PUT',
                params
            }
        ).then((json) => {
            var args = {
                json,
                params,
                messageType,
                slot
            };
            return args;
        });
    };

    // App: Edit Invite Message Dialog

    $app.data.editInviteMessageDialog = {
        visible: false,
        inviteMessage: {},
        messageType: '',
        newMessage: ''
    };

    $app.methods.showEditInviteMessageDialog = function (
        messageType,
        inviteMessage
    ) {
        this.$nextTick(() =>
            adjustDialogZ(this.$refs.editInviteMessageDialog.$el)
        );
        var D = this.editInviteMessageDialog;
        D.newMessage = inviteMessage.message;
        D.visible = true;
        D.inviteMessage = inviteMessage;
        D.messageType = messageType;
    };

    $app.methods.saveEditInviteMessage = function () {
        var D = this.editInviteMessageDialog;
        D.visible = false;
        if (D.inviteMessage.message !== D.newMessage) {
            var slot = D.inviteMessage.slot;
            var messageType = D.messageType;
            var params = {
                message: D.newMessage
            };
            API.editInviteMessage(params, messageType, slot)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    API.$emit(`INVITE:${messageType.toUpperCase()}`, args);
                    if (args.json[slot].message === D.inviteMessage.message) {
                        this.$message({
                            message:
                                "VRChat API didn't update message, try again",
                            type: 'error'
                        });
                        throw new Error(
                            "VRChat API didn't update message, try again"
                        );
                    } else {
                        this.$message('Invite message updated');
                    }
                    return args;
                });
        }
    };

    $app.methods.cancelEditInviteMessage = function () {
        this.editInviteMessageDialog.visible = false;
    };

    // App: Edit and Send Invite Response Message Dialog

    $app.data.editAndSendInviteResponseDialog = {
        visible: false,
        inviteMessage: {},
        messageType: '',
        newMessage: ''
    };

    $app.methods.showEditAndSendInviteResponseDialog = function (
        messageType,
        inviteMessage
    ) {
        this.$nextTick(() =>
            adjustDialogZ(this.$refs.editAndSendInviteResponseDialog.$el)
        );
        this.editAndSendInviteResponseDialog = {
            newMessage: inviteMessage.message,
            visible: true,
            messageType,
            inviteMessage
        };
    };

    $app.methods.saveEditAndSendInviteResponse = async function () {
        var D = this.editAndSendInviteResponseDialog;
        D.visible = false;
        var messageType = D.messageType;
        var slot = D.inviteMessage.slot;
        if (D.inviteMessage.message !== D.newMessage) {
            var params = {
                message: D.newMessage
            };
            await API.editInviteMessage(params, messageType, slot)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    API.$emit(`INVITE:${messageType.toUpperCase()}`, args);
                    if (args.json[slot].message === D.inviteMessage.message) {
                        this.$message({
                            message:
                                "VRChat API didn't update message, try again",
                            type: 'error'
                        });
                        throw new Error(
                            "VRChat API didn't update message, try again"
                        );
                    } else {
                        this.$message('Invite message updated');
                    }
                    return args;
                });
        }
        var I = this.sendInviteResponseDialog;
        var params = {
            responseSlot: slot,
            rsvp: true
        };
        if ($app.uploadImage) {
            API.sendInviteResponsePhoto(params, I.invite.id)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    API.hideNotification({
                        notificationId: I.invite.id
                    });
                    this.$message({
                        message: 'Invite response message sent',
                        type: 'success'
                    });
                    this.sendInviteResponseDialogVisible = false;
                    this.sendInviteRequestResponseDialogVisible = false;
                    return args;
                });
        } else {
            API.sendInviteResponse(params, I.invite.id)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    API.hideNotification({
                        notificationId: I.invite.id
                    });
                    this.$message({
                        message: 'Invite response message sent',
                        type: 'success'
                    });
                    this.sendInviteResponseDialogVisible = false;
                    this.sendInviteRequestResponseDialogVisible = false;
                    return args;
                });
        }
    };

    $app.methods.cancelEditAndSendInviteResponse = function () {
        this.editAndSendInviteResponseDialog.visible = false;
    };

    $app.data.sendInviteResponseDialog = {
        message: '',
        messageSlot: 0,
        invite: {}
    };

    $app.data.sendInviteResponseDialogVisible = false;

    $app.data.sendInviteResponseConfirmDialog = {
        visible: false
    };

    API.$on('LOGIN', function () {
        $app.sendInviteResponseDialogVisible = false;
        $app.sendInviteResponseConfirmDialog.visible = false;
    });

    $app.methods.showSendInviteResponseDialog = function (invite) {
        this.sendInviteResponseDialog = {
            invite
        };
        API.refreshInviteMessageTableData('response');
        this.$nextTick(() =>
            adjustDialogZ(this.$refs.sendInviteResponseDialog.$el)
        );
        this.clearInviteImageUpload();
        this.sendInviteResponseDialogVisible = true;
    };

    $app.methods.showSendInviteResponseConfirmDialog = function (val) {
        if (
            this.editAndSendInviteResponseDialog.visible === true ||
            val === null
        ) {
            return;
        }
        this.$nextTick(() =>
            adjustDialogZ(this.$refs.sendInviteResponseConfirmDialog.$el)
        );
        this.sendInviteResponseConfirmDialog.visible = true;
        this.sendInviteResponseDialog.messageSlot = val.slot;
    };

    $app.methods.cancelSendInviteResponse = function () {
        this.sendInviteResponseDialogVisible = false;
    };

    $app.methods.cancelInviteResponseConfirm = function () {
        this.sendInviteResponseConfirmDialog.visible = false;
    };

    $app.methods.sendInviteResponseConfirm = function () {
        var D = this.sendInviteResponseDialog;
        var params = {
            responseSlot: D.messageSlot,
            rsvp: true
        };
        if ($app.uploadImage) {
            API.sendInviteResponsePhoto(params, D.invite.id, D.messageType)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    API.hideNotification({
                        notificationId: D.invite.id
                    });
                    this.$message({
                        message: 'Invite response photo message sent',
                        type: 'success'
                    });
                    return args;
                });
        } else {
            API.sendInviteResponse(params, D.invite.id, D.messageType)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    API.hideNotification({
                        notificationId: D.invite.id
                    });
                    this.$message({
                        message: 'Invite response message sent',
                        type: 'success'
                    });
                    return args;
                });
        }
        this.sendInviteResponseDialogVisible = false;
        this.sendInviteRequestResponseDialogVisible = false;
        this.sendInviteResponseConfirmDialog.visible = false;
    };

    // App: Invite Request Response Message Dialog

    $app.data.sendInviteRequestResponseDialogVisible = false;

    $app.methods.cancelSendInviteRequestResponse = function () {
        this.sendInviteRequestResponseDialogVisible = false;
    };

    API.$on('LOGIN', function () {
        $app.sendInviteRequestResponseDialogVisible = false;
        $app.showSendInviteResponseConfirmDialog.visible = false;
    });

    $app.methods.showSendInviteRequestResponseDialog = function (invite) {
        this.sendInviteResponseDialog = {
            invite
        };
        API.refreshInviteMessageTableData('requestResponse');
        this.$nextTick(() =>
            adjustDialogZ(this.$refs.sendInviteRequestResponseDialog.$el)
        );
        this.clearInviteImageUpload();
        this.sendInviteRequestResponseDialogVisible = true;
    };

    // App: Invite Message Dialog

    $app.data.editAndSendInviteDialog = {
        visible: false,
        messageType: '',
        newMessage: '',
        inviteMessage: {}
    };

    $app.methods.showEditAndSendInviteDialog = function (
        messageType,
        inviteMessage
    ) {
        this.$nextTick(() =>
            adjustDialogZ(this.$refs.editAndSendInviteDialog.$el)
        );
        this.editAndSendInviteDialog = {
            newMessage: inviteMessage.message,
            visible: true,
            messageType,
            inviteMessage
        };
    };

    $app.methods.saveEditAndSendInvite = async function () {
        var D = this.editAndSendInviteDialog;
        D.visible = false;
        var messageType = D.messageType;
        var slot = D.inviteMessage.slot;
        if (D.inviteMessage.message !== D.newMessage) {
            var params = {
                message: D.newMessage
            };
            await API.editInviteMessage(params, messageType, slot)
                .catch((err) => {
                    throw err;
                })
                .then((args) => {
                    API.$emit(`INVITE:${messageType.toUpperCase()}`, args);
                    if (args.json[slot].message === D.inviteMessage.message) {
                        this.$message({
                            message:
                                "VRChat API didn't update message, try again",
                            type: 'error'
                        });
                        throw new Error(
                            "VRChat API didn't update message, try again"
                        );
                    } else {
                        this.$message('Invite message updated');
                    }
                    return args;
                });
        }
        var I = this.sendInviteDialog;
        var J = this.inviteDialog;
        if (J.visible) {
            if (
                this.API.currentUser.status === 'busy' &&
                J.userIds.includes(this.API.currentUser.id) === true
            ) {
                this.$message({
                    message:
                        "You can't invite yourself in 'Do Not Disturb' mode",
                    type: 'error'
                });
                return;
            }
            var inviteLoop = () => {
                if (J.userIds.length > 0) {
                    var receiverUserId = J.userIds.shift();
                    if ($app.uploadImage) {
                        API.sendInvitePhoto(
                            {
                                instanceId: J.worldId,
                                worldId: J.worldId,
                                worldName: J.worldName,
                                messageSlot: slot
                            },
                            receiverUserId
                        ).finally(inviteLoop);
                    } else {
                        API.sendInvite(
                            {
                                instanceId: J.worldId,
                                worldId: J.worldId,
                                worldName: J.worldName,
                                messageSlot: slot
                            },
                            receiverUserId
                        ).finally(inviteLoop);
                    }
                } else {
                    J.loading = false;
                    J.visible = false;
                    this.$message({
                        message: 'Invite message sent',
                        type: 'success'
                    });
                }
            };
            inviteLoop();
        } else if (I.messageType === 'invite') {
            I.params.messageSlot = slot;
            if ($app.uploadImage) {
                API.sendInvitePhoto(I.params, I.userId)
                    .catch((err) => {
                        throw err;
                    })
                    .then((args) => {
                        this.$message({
                            message: 'Invite photo message sent',
                            type: 'success'
                        });
                        return args;
                    });
            } else {
                API.sendInvite(I.params, I.userId)
                    .catch((err) => {
                        throw err;
                    })
                    .then((args) => {
                        this.$message({
                            message: 'Invite message sent',
                            type: 'success'
                        });
                        return args;
                    });
            }
        } else if (I.messageType === 'requestInvite') {
            I.params.requestSlot = slot;
            if ($app.uploadImage) {
                API.sendRequestInvitePhoto(I.params, I.userId)
                    .catch((err) => {
                        this.clearInviteImageUpload();
                        throw err;
                    })
                    .then((args) => {
                        this.$message({
                            message: 'Request invite photo message sent',
                            type: 'success'
                        });
                        return args;
                    });
            } else {
                API.sendRequestInvite(I.params, I.userId)
                    .catch((err) => {
                        throw err;
                    })
                    .then((args) => {
                        this.$message({
                            message: 'Request invite message sent',
                            type: 'success'
                        });
                        return args;
                    });
            }
        }
        this.sendInviteDialogVisible = false;
        this.sendInviteRequestDialogVisible = false;
    };

    $app.methods.cancelEditAndSendInvite = function () {
        this.editAndSendInviteDialog.visible = false;
    };

    $app.data.sendInviteDialog = {
        message: '',
        messageSlot: 0,
        userId: '',
        messageType: '',
        params: {}
    };

    $app.data.sendInviteDialogVisible = false;

    $app.data.sendInviteConfirmDialog = {
        visible: false
    };

    API.$on('LOGIN', function () {
        $app.sendInviteDialogVisible = false;
        $app.sendInviteConfirmDialog.visible = false;
    });

    $app.methods.showSendInviteDialog = function (params, userId) {
        this.sendInviteDialog = {
            params,
            userId,
            messageType: 'invite'
        };
        API.refreshInviteMessageTableData('message');
        this.$nextTick(() => adjustDialogZ(this.$refs.sendInviteDialog.$el));
        this.clearInviteImageUpload();
        this.sendInviteDialogVisible = true;
    };

    $app.methods.showSendInviteConfirmDialog = function (val) {
        if (this.editAndSendInviteDialog.visible === true || val === null) {
            return;
        }
        this.$nextTick(() =>
            adjustDialogZ(this.$refs.sendInviteConfirmDialog.$el)
        );
        this.sendInviteConfirmDialog.visible = true;
        this.sendInviteDialog.messageSlot = val.slot;
    };

    $app.methods.cancelSendInvite = function () {
        this.sendInviteDialogVisible = false;
    };

    $app.methods.cancelInviteConfirm = function () {
        this.sendInviteConfirmDialog.visible = false;
    };

    $app.methods.sendInviteConfirm = function () {
        var D = this.sendInviteDialog;
        var J = this.inviteDialog;
        if (J.visible) {
            if (
                this.API.currentUser.status === 'busy' &&
                J.userIds.includes(this.API.currentUser.id) === true
            ) {
                this.$message({
                    message:
                        "You can't invite yourself in 'Do Not Disturb' mode",
                    type: 'error'
                });
                return;
            }
            var inviteLoop = () => {
                if (J.userIds.length > 0) {
                    var receiverUserId = J.userIds.shift();
                    if ($app.uploadImage) {
                        API.sendInvitePhoto(
                            {
                                instanceId: J.worldId,
                                worldId: J.worldId,
                                worldName: J.worldName,
                                messageSlot: D.messageSlot
                            },
                            receiverUserId
                        ).finally(inviteLoop);
                    } else {
                        API.sendInvite(
                            {
                                instanceId: J.worldId,
                                worldId: J.worldId,
                                worldName: J.worldName,
                                messageSlot: D.messageSlot
                            },
                            receiverUserId
                        ).finally(inviteLoop);
                    }
                } else {
                    J.loading = false;
                    J.visible = false;
                    this.$message({
                        message: 'Invite message sent',
                        type: 'success'
                    });
                }
            };
            inviteLoop();
        } else if (D.messageType === 'invite') {
            D.params.messageSlot = D.messageSlot;
            if ($app.uploadImage) {
                API.sendInvitePhoto(D.params, D.userId)
                    .catch((err) => {
                        throw err;
                    })
                    .then((args) => {
                        this.$message({
                            message: 'Invite photo message sent',
                            type: 'success'
                        });
                        return args;
                    });
            } else {
                API.sendInvite(D.params, D.userId)
                    .catch((err) => {
                        throw err;
                    })
                    .then((args) => {
                        this.$message({
                            message: 'Invite message sent',
                            type: 'success'
                        });
                        return args;
                    });
            }
        } else if (D.messageType === 'requestInvite') {
            D.params.requestSlot = D.messageSlot;
            if ($app.uploadImage) {
                API.sendRequestInvitePhoto(D.params, D.userId)
                    .catch((err) => {
                        this.clearInviteImageUpload();
                        throw err;
                    })
                    .then((args) => {
                        this.$message({
                            message: 'Request invite photo message sent',
                            type: 'success'
                        });
                        return args;
                    });
            } else {
                API.sendRequestInvite(D.params, D.userId)
                    .catch((err) => {
                        throw err;
                    })
                    .then((args) => {
                        this.$message({
                            message: 'Request invite message sent',
                            type: 'success'
                        });
                        return args;
                    });
            }
        }
        this.sendInviteDialogVisible = false;
        this.sendInviteRequestDialogVisible = false;
        this.sendInviteConfirmDialog.visible = false;
    };

    // App: Invite Request Message Dialog

    $app.data.sendInviteRequestDialogVisible = false;

    $app.methods.cancelSendInviteRequest = function () {
        this.sendInviteRequestDialogVisible = false;
    };

    API.$on('LOGIN', function () {
        $app.sendInviteRequestDialogVisible = false;
        $app.showSendInviteConfirmDialog.visible = false;
    });

    $app.methods.showSendInviteRequestDialog = function (params, userId) {
        this.sendInviteDialog = {
            params,
            userId,
            messageType: 'requestInvite'
        };
        API.refreshInviteMessageTableData('request');
        this.$nextTick(() =>
            adjustDialogZ(this.$refs.sendInviteRequestDialog.$el)
        );
        this.clearInviteImageUpload();
        this.sendInviteRequestDialogVisible = true;
    };

    // App: Friends List

    API.$on('LOGIN', function () {
        $app.friendsListTable.data = [];
    });

    $app.methods.selectFriendsListRow = function (val) {
        if (val === null) {
            return;
        }
        if (!val.id) {
            this.lookupUser(val);
            return;
        }
        this.showUserDialog(val.id);
    };

    $app.data.friendsListSearch = '';
    $app.data.friendsListSearchFilterVIP = false;
    $app.data.friendsListSearchFilters = [];

    $app.methods.friendsListSearchChange = function () {
        var filters = [...this.friendsListSearchFilters];
        if (filters.length === 0) {
            filters = [
                'Display Name',
                'User Name',
                'Rank',
                'Status',
                'Bio',
                'Memo'
            ];
        }
        var results = [];
        if (this.friendsListSearch) {
            var query = this.friendsListSearch.toUpperCase();
        }
        for (var ctx of this.friends.values()) {
            if (typeof ctx.ref === 'undefined') {
                continue;
            }
            if (this.friendsListSearchFilterVIP && !ctx.isVIP) {
                continue;
            }
            if (query && filters) {
                var match = false;
                if (!match && filters.includes('User Name')) {
                    var uname = String(ctx.ref.username);
                    match =
                        uname.toUpperCase().includes(query) &&
                        !uname.startsWith('steam_');
                }
                if (
                    !match &&
                    filters.includes('Display Name') &&
                    ctx.ref.displayName
                ) {
                    match = String(ctx.ref.displayName)
                        .toUpperCase()
                        .includes(query);
                }
                if (!match && filters.includes('Memo') && ctx.memo) {
                    match = String(ctx.memo).toUpperCase().includes(query);
                }
                if (!match && filters.includes('Bio') && ctx.ref.bio) {
                    match = String(ctx.ref.bio).toUpperCase().includes(query);
                }
                if (
                    !match &&
                    filters.includes('Status') &&
                    ctx.ref.statusDescription
                ) {
                    match = String(ctx.ref.statusDescription)
                        .toUpperCase()
                        .includes(query);
                }
                if (!match && filters.includes('Rank') && ctx.ref.$friendNum) {
                    match = String(ctx.ref.$trustLevel)
                        .toUpperCase()
                        .includes(query);
                }
                if (!match) {
                    continue;
                }
            }
            ctx.ref.$friendNum = ctx.no;
            results.push(ctx.ref);
        }
        this.friendsListTable.data = results;
    };

    $app.watch.friendsListSearch = $app.methods.friendsListSearchChange;
    $app.data.friendsListLoading = false;
    $app.data.friendsListLoadingProgress = '';

    $app.methods.friendsListLoadUsers = async function () {
        this.friendsListLoading = true;
        var i = 0;
        var toFetch = [];
        for (var ctx of this.friends.values()) {
            if (ctx.ref && !ctx.ref.date_joined) {
                toFetch.push(ctx.id);
            }
        }
        var length = toFetch.length;
        for (var userId of toFetch) {
            if (!this.friendsListLoading) {
                this.friendsListLoadingProgress = '';
                return;
            }
            i++;
            this.friendsListLoadingProgress = `${i}/${length}`;
            await API.getUser({
                userId
            });
            await new Promise((resolve) => {
                setTimeout(resolve, 1000);
            });
        }
        this.friendsListLoadingProgress = '';
        this.friendsListLoading = false;
    };

    $app.methods.sortAlphabetically = function (a, b, field) {
        return a[field].toLowerCase().localeCompare(b[field].toLowerCase());
    };

    $app.methods.sortLanguages = function (a, b) {
        var sortedA = [];
        var sortedB = [];
        a.$languages.forEach((item) => {
            sortedA.push(item.value);
        });
        b.$languages.forEach((item) => {
            sortedB.push(item.value);
        });
        sortedA.sort();
        sortedB.sort();
        return JSON.stringify(sortedA).localeCompare(JSON.stringify(sortedB));
    };

    $app.methods.genMd5 = async function (file) {
        var response = await AppApi.MD5File(file);
        return response;
    };

    $app.methods.genSig = async function (file) {
        var response = await AppApi.SignFile(file);
        return response;
    };

    $app.methods.genLength = async function (file) {
        var response = await AppApi.FileLength(file);
        return response;
    };

    // Upload avatar image

    $app.methods.onFileChangeAvatarImage = function (e) {
        var clearFile = function () {
            if (document.querySelector('#AvatarImageUploadButton')) {
                document.querySelector('#AvatarImageUploadButton').value = '';
            }
        };
        var files = e.target.files || e.dataTransfer.files;
        if (
            !files.length ||
            !this.avatarDialog.visible ||
            this.avatarDialog.loading
        ) {
            clearFile();
            return;
        }
        if (files[0].size >= 10000000) {
            // 10MB
            $app.$message({
                message: 'File size too large',
                type: 'error'
            });
            clearFile();
            return;
        }
        if (!files[0].type.match(/image.png/)) {
            $app.$message({
                message: "File isn't a png",
                type: 'error'
            });
            clearFile();
            return;
        }
        this.avatarDialog.loading = true;
        var r = new FileReader();
        r.onload = async function (file) {
            var base64File = btoa(r.result);
            var fileMd5 = await $app.genMd5(base64File);
            var fileSizeInBytes = file.total;
            var base64SignatureFile = await $app.genSig(base64File);
            var signatureMd5 = await $app.genMd5(base64SignatureFile);
            var signatureSizeInBytes = await $app.genLength(
                base64SignatureFile
            );
            var avatarId = $app.avatarDialog.id;
            var {imageUrl} = $app.avatarDialog.ref;
            var fileId = extractFileId(imageUrl);
            if (!fileId) {
                $app.$message({
                    message: 'Current avatar image invalid',
                    type: 'error'
                });
                clearFile();
                return;
            }
            $app.avatarImage = {
                base64File,
                fileMd5,
                base64SignatureFile,
                signatureMd5,
                fileId,
                avatarId
            };
            var params = {
                fileMd5,
                fileSizeInBytes,
                signatureMd5,
                signatureSizeInBytes
            };
            API.uploadAvatarImage(params, fileId);
        };
        r.readAsBinaryString(files[0]);
        clearFile();
    };

    API.uploadAvatarImage = async function (params, fileId) {
        try {
            return await this.call(`file/${fileId}`, {
                method: 'POST',
                params
            }).then((json) => {
                var args = {
                    json,
                    params,
                    fileId
                };
                this.$emit('AVATARIMAGE:INIT', args);
                return args;
            });
        } catch (err) {
            console.error(err);
            this.uploadAvatarFailCleanup(fileId);
        }
        return void 0;
    };

    API.uploadAvatarFailCleanup = async function (fileId) {
        var json = await this.call(`file/${fileId}`, {
            method: 'GET'
        });
        var fileId = json.id;
        var fileVersion = json.versions[json.versions.length - 1].version;
        this.call(`file/${fileId}/${fileVersion}/signature/finish`, {
            method: 'PUT'
        });
        this.call(`file/${fileId}/${fileVersion}/file/finish`, {
            method: 'PUT'
        });
        $app.avatarDialog.loading = false;
    };

    API.$on('AVATARIMAGE:INIT', function (args) {
        var fileId = args.json.id;
        var fileVersion =
            args.json.versions[args.json.versions.length - 1].version;
        var params = {
            fileId,
            fileVersion
        };
        this.uploadAvatarImageFileStart(params);
    });

    API.uploadAvatarImageFileStart = async function (params) {
        try {
            return await this.call(
                `file/${params.fileId}/${params.fileVersion}/file/start`,
                {
                    method: 'PUT'
                }
            ).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('AVATARIMAGE:FILESTART', args);
                return args;
            });
        } catch (err) {
            console.error(err);
            this.uploadAvatarFailCleanup(params.fileId);
        }
        return void 0;
    };

    API.$on('AVATARIMAGE:FILESTART', function (args) {
        var {url} = args.json;
        var {fileId, fileVersion} = args.params;
        var params = {
            url,
            fileId,
            fileVersion
        };
        this.uploadAvatarImageFileAWS(params);
    });

    API.uploadAvatarImageFileAWS = function (params) {
        return webApiService
            .execute({
                url: params.url,
                uploadFilePUT: true,
                fileData: $app.avatarImage.base64File,
                fileMIME: 'image/png',
                headers: {
                    'Content-MD5': $app.avatarImage.fileMd5
                }
            })
            .then((json) => {
                if (json.status !== 200) {
                    $app.avatarDialog.loading = false;
                    this.$throw('Avatar image upload failed', json);
                }
                var args = {
                    json,
                    params
                };
                this.$emit('AVATARIMAGE:FILEAWS', args);
                return args;
            });
    };

    API.$on('AVATARIMAGE:FILEAWS', function (args) {
        var {fileId, fileVersion} = args.params;
        var params = {
            fileId,
            fileVersion
        };
        this.uploadAvatarImageFileFinish(params);
    });

    API.uploadAvatarImageFileFinish = function (params) {
        return this.call(
            `file/${params.fileId}/${params.fileVersion}/file/finish`,
            {
                method: 'PUT',
                params: {
                    maxParts: 0,
                    nextPartNumber: 0
                }
            }
        ).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('AVATARIMAGE:FILEFINISH', args);
            return args;
        });
    };

    API.$on('AVATARIMAGE:FILEFINISH', function (args) {
        var {fileId, fileVersion} = args.params;
        var params = {
            fileId,
            fileVersion
        };
        this.uploadAvatarImageSigStart(params);
    });

    API.uploadAvatarImageSigStart = async function (params) {
        try {
            return await this.call(
                `file/${params.fileId}/${params.fileVersion}/signature/start`,
                {
                    method: 'PUT'
                }
            ).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('AVATARIMAGE:SIGSTART', args);
                return args;
            });
        } catch (err) {
            console.error(err);
            this.uploadAvatarFailCleanup(params.fileId);
        }
        return void 0;
    };

    API.$on('AVATARIMAGE:SIGSTART', function (args) {
        var {url} = args.json;
        var {fileId, fileVersion} = args.params;
        var params = {
            url,
            fileId,
            fileVersion
        };
        this.uploadAvatarImageSigAWS(params);
    });

    API.uploadAvatarImageSigAWS = function (params) {
        return webApiService
            .execute({
                url: params.url,
                uploadFilePUT: true,
                fileData: $app.avatarImage.base64SignatureFile,
                fileMIME: 'application/x-rsync-signature',
                headers: {
                    'Content-MD5': $app.avatarImage.signatureMd5
                }
            })
            .then((json) => {
                if (json.status !== 200) {
                    $app.avatarDialog.loading = false;
                    this.$throw('Avatar image upload failed', json);
                }
                var args = {
                    json,
                    params
                };
                this.$emit('AVATARIMAGE:SIGAWS', args);
                return args;
            });
    };

    API.$on('AVATARIMAGE:SIGAWS', function (args) {
        var {fileId, fileVersion} = args.params;
        var params = {
            fileId,
            fileVersion
        };
        this.uploadAvatarImageSigFinish(params);
    });

    API.uploadAvatarImageSigFinish = function (params) {
        return this.call(
            `file/${params.fileId}/${params.fileVersion}/signature/finish`,
            {
                method: 'PUT',
                params: {
                    maxParts: 0,
                    nextPartNumber: 0
                }
            }
        ).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('AVATARIMAGE:SIGFINISH', args);
            return args;
        });
    };

    API.$on('AVATARIMAGE:SIGFINISH', function (args) {
        var {fileId, fileVersion} = args.params;
        var parmas = {
            id: $app.avatarImage.avatarId,
            imageUrl: `https://api.vrchat.cloud/api/1/file/${fileId}/${fileVersion}/file`
        };
        this.setAvatarImage(parmas);
    });

    API.setAvatarImage = function (params) {
        return this.call(`avatars/${params.id}`, {
            method: 'PUT',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('AVATARIMAGE:SET', args);
            this.$emit('AVATAR', args);
            return args;
        });
    };

    // Upload world image

    $app.methods.onFileChangeWorldImage = function (e) {
        var clearFile = function () {
            if (document.querySelector('#WorldImageUploadButton')) {
                document.querySelector('#WorldImageUploadButton').value = '';
            }
        };
        var files = e.target.files || e.dataTransfer.files;
        if (
            !files.length ||
            !this.worldDialog.visible ||
            this.worldDialog.loading
        ) {
            clearFile();
            return;
        }
        if (files[0].size >= 10000000) {
            // 10MB
            $app.$message({
                message: 'File size too large',
                type: 'error'
            });
            clearFile();
            return;
        }
        if (!files[0].type.match(/image.png/)) {
            $app.$message({
                message: "File isn't a png",
                type: 'error'
            });
            clearFile();
            return;
        }
        this.worldDialog.loading = true;
        var r = new FileReader();
        r.onload = async function (file) {
            var base64File = btoa(r.result);
            var fileMd5 = await $app.genMd5(base64File);
            var fileSizeInBytes = file.total;
            var base64SignatureFile = await $app.genSig(base64File);
            var signatureMd5 = await $app.genMd5(base64SignatureFile);
            var signatureSizeInBytes = await $app.genLength(
                base64SignatureFile
            );
            var worldId = $app.worldDialog.id;
            var {imageUrl} = $app.worldDialog.ref;
            var fileId = extractFileId(imageUrl);
            if (!fileId) {
                $app.$message({
                    message: 'Current world image invalid',
                    type: 'error'
                });
                clearFile();
                return;
            }
            $app.worldImage = {
                base64File,
                fileMd5,
                base64SignatureFile,
                signatureMd5,
                fileId,
                worldId
            };
            var params = {
                fileMd5,
                fileSizeInBytes,
                signatureMd5,
                signatureSizeInBytes
            };
            API.uploadWorldImage(params, fileId);
        };
        r.readAsBinaryString(files[0]);
        clearFile();
    };

    API.uploadWorldImage = async function (params, fileId) {
        try {
            return await this.call(`file/${fileId}`, {
                method: 'POST',
                params
            }).then((json) => {
                var args = {
                    json,
                    params,
                    fileId
                };
                this.$emit('WORLDIMAGE:INIT', args);
                return args;
            });
        } catch (err) {
            console.error(err);
            this.uploadWorldFailCleanup(fileId);
        }
        return void 0;
    };

    API.uploadWorldFailCleanup = async function (fileId) {
        var json = await this.call(`file/${fileId}`, {
            method: 'GET'
        });
        var fileId = json.id;
        var fileVersion = json.versions[json.versions.length - 1].version;
        this.call(`file/${fileId}/${fileVersion}/signature/finish`, {
            method: 'PUT'
        });
        this.call(`file/${fileId}/${fileVersion}/file/finish`, {
            method: 'PUT'
        });
        $app.worldDialog.loading = false;
    };

    API.$on('WORLDIMAGE:INIT', function (args) {
        var fileId = args.json.id;
        var fileVersion =
            args.json.versions[args.json.versions.length - 1].version;
        var params = {
            fileId,
            fileVersion
        };
        this.uploadWorldImageFileStart(params);
    });

    API.uploadWorldImageFileStart = async function (params) {
        try {
            return await this.call(
                `file/${params.fileId}/${params.fileVersion}/file/start`,
                {
                    method: 'PUT'
                }
            ).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('WORLDIMAGE:FILESTART', args);
                return args;
            });
        } catch (err) {
            console.error(err);
            this.uploadWorldFailCleanup(params.fileId);
        }
        return void 0;
    };

    API.$on('WORLDIMAGE:FILESTART', function (args) {
        var {url} = args.json;
        var {fileId, fileVersion} = args.params;
        var params = {
            url,
            fileId,
            fileVersion
        };
        this.uploadWorldImageFileAWS(params);
    });

    API.uploadWorldImageFileAWS = function (params) {
        return webApiService
            .execute({
                url: params.url,
                uploadFilePUT: true,
                fileData: $app.worldImage.base64File,
                fileMIME: 'image/png',
                headers: {
                    'Content-MD5': $app.worldImage.fileMd5
                }
            })
            .then((json) => {
                if (json.status !== 200) {
                    $app.worldDialog.loading = false;
                    this.$throw('World image upload failed', json);
                }
                var args = {
                    json,
                    params
                };
                this.$emit('WORLDIMAGE:FILEAWS', args);
                return args;
            });
    };

    API.$on('WORLDIMAGE:FILEAWS', function (args) {
        var {fileId, fileVersion} = args.params;
        var params = {
            fileId,
            fileVersion
        };
        this.uploadWorldImageFileFinish(params);
    });

    API.uploadWorldImageFileFinish = function (params) {
        return this.call(
            `file/${params.fileId}/${params.fileVersion}/file/finish`,
            {
                method: 'PUT',
                params: {
                    maxParts: 0,
                    nextPartNumber: 0
                }
            }
        ).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('WORLDIMAGE:FILEFINISH', args);
            return args;
        });
    };

    API.$on('WORLDIMAGE:FILEFINISH', function (args) {
        var {fileId, fileVersion} = args.params;
        var params = {
            fileId,
            fileVersion
        };
        this.uploadWorldImageSigStart(params);
    });

    API.uploadWorldImageSigStart = async function (params) {
        try {
            return await this.call(
                `file/${params.fileId}/${params.fileVersion}/signature/start`,
                {
                    method: 'PUT'
                }
            ).then((json) => {
                var args = {
                    json,
                    params
                };
                this.$emit('WORLDIMAGE:SIGSTART', args);
                return args;
            });
        } catch (err) {
            console.error(err);
            this.uploadWorldFailCleanup(params.fileId);
        }
        return void 0;
    };

    API.$on('WORLDIMAGE:SIGSTART', function (args) {
        var {url} = args.json;
        var {fileId, fileVersion} = args.params;
        var params = {
            url,
            fileId,
            fileVersion
        };
        this.uploadWorldImageSigAWS(params);
    });

    API.uploadWorldImageSigAWS = function (params) {
        return webApiService
            .execute({
                url: params.url,
                uploadFilePUT: true,
                fileData: $app.worldImage.base64SignatureFile,
                fileMIME: 'application/x-rsync-signature',
                headers: {
                    'Content-MD5': $app.worldImage.signatureMd5
                }
            })
            .then((json) => {
                if (json.status !== 200) {
                    $app.worldDialog.loading = false;
                    this.$throw('World image upload failed', json);
                }
                var args = {
                    json,
                    params
                };
                this.$emit('WORLDIMAGE:SIGAWS', args);
                return args;
            });
    };

    API.$on('WORLDIMAGE:SIGAWS', function (args) {
        var {fileId, fileVersion} = args.params;
        var params = {
            fileId,
            fileVersion
        };
        this.uploadWorldImageSigFinish(params);
    });

    API.uploadWorldImageSigFinish = function (params) {
        return this.call(
            `file/${params.fileId}/${params.fileVersion}/signature/finish`,
            {
                method: 'PUT',
                params: {
                    maxParts: 0,
                    nextPartNumber: 0
                }
            }
        ).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('WORLDIMAGE:SIGFINISH', args);
            return args;
        });
    };

    API.$on('WORLDIMAGE:SIGFINISH', function (args) {
        var {fileId, fileVersion} = args.params;
        var parmas = {
            id: $app.worldImage.worldId,
            imageUrl: `https://api.vrchat.cloud/api/1/file/${fileId}/${fileVersion}/file`
        };
        this.setWorldImage(parmas);
    });

    API.setWorldImage = function (params) {
        return this.call(`worlds/${params.id}`, {
            method: 'PUT',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('WORLDIMAGE:SET', args);
            this.$emit('WORLD', args);
            return args;
        });
    };

    API.$on('AVATARIMAGE:SET', function (args) {
        $app.avatarDialog.loading = false;
        if (args.json.imageUrl === args.params.imageUrl) {
            $app.$message({
                message: 'Avatar image changed',
                type: 'success'
            });
        } else {
            this.$throw(0, 'Avatar image change failed');
        }
    });

    API.setWorldImage = function (params) {
        return this.call(`worlds/${params.id}`, {
            method: 'PUT',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('WORLDIMAGE:SET', args);
            this.$emit('WORLD', args);
            return args;
        });
    };

    API.$on('WORLDIMAGE:SET', function (args) {
        $app.worldDialog.loading = false;
        if (args.json.imageUrl === args.params.imageUrl) {
            $app.$message({
                message: 'World image changed',
                type: 'success'
            });
        } else {
            this.$throw(0, 'World image change failed');
        }
    });

    // Set avatar/world image

    $app.methods.displayPreviousImages = function (type, command) {
        this.previousImagesTableFileId = '';
        this.previousImagesTable = '';
        var imageUrl = '';
        if (type === 'Avatar') {
            var {imageUrl} = this.avatarDialog.ref;
        } else if (type === 'World') {
            var {imageUrl} = this.worldDialog.ref;
        } else if (type === 'User') {
            imageUrl = this.userDialog.ref.currentAvatarImageUrl;
        }
        var fileId = extractFileId(imageUrl);
        if (!fileId) {
            return;
        }
        var params = {
            fileId
        };
        if (command === 'Display') {
            this.previousImagesDialogVisible = true;
            this.$nextTick(() =>
                adjustDialogZ(this.$refs.previousImagesDialog.$el)
            );
        }
        if (type === 'Avatar') {
            if (command === 'Change') {
                this.changeAvatarImageDialogVisible = true;
                this.$nextTick(() =>
                    adjustDialogZ(this.$refs.changeAvatarImageDialog.$el)
                );
            }
            API.getAvatarImages(params).then((args) => {
                this.previousImagesTableFileId = args.json.id;
                var images = args.json.versions.reverse();
                this.checkPreviousImageAvailable(images);
            });
        } else if (type === 'World') {
            if (command === 'Change') {
                this.changeWorldImageDialogVisible = true;
                this.$nextTick(() =>
                    adjustDialogZ(this.$refs.changeWorldImageDialog.$el)
                );
            }
            API.getWorldImages(params).then((args) => {
                this.previousImagesTableFileId = args.json.id;
                var images = args.json.versions.reverse();
                this.checkPreviousImageAvailable(images);
            });
        } else if (type === 'User') {
            API.getAvatarImages(params).then((args) => {
                this.previousImagesTableFileId = args.json.id;
                var images = args.json.versions.reverse();
                this.checkPreviousImageAvailable(images);
            });
        }
    };

    $app.methods.checkPreviousImageAvailable = async function (images) {
        this.previousImagesTable = [];
        for (var image of images) {
            if (image.file && image.file.url) {
                var response = await fetch(image.file.url, {
                    method: 'HEAD',
                    redirect: 'follow'
                }).catch((error) => {
                    console.log(error);
                });
                if (response.status === 200) {
                    this.previousImagesTable.push(image);
                }
            }
        }
    };

    $app.data.previousImagesDialogVisible = false;
    $app.data.changeAvatarImageDialogVisible = false;
    $app.data.changeAvatarImageDialogLoading = false;
    $app.data.changeWorldImageDialogVisible = false;
    $app.data.changeWorldImageDialogLoading = false;
    $app.data.previousImagesTable = {};
    $app.data.previousImagesFileId = '';

    API.$on('LOGIN', function () {
        $app.previousImagesTable = {};
        $app.previousImagesDialogVisible = false;
    });

    API.getAvatarImages = function (params) {
        return this.call(`file/${params.fileId}`, {
            method: 'GET',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('AVATARIMAGE:GET', args);
            return args;
        });
    };

    API.getWorldImages = function (params) {
        return this.call(`file/${params.fileId}`, {
            method: 'GET',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('WORLDIMAGE:GET', args);
            return args;
        });
    };

    API.$on('AVATARIMAGE:GET', function (args) {
        $app.storeAvatarImage(args);
    });

    $app.methods.storeAvatarImage = function (args) {
        var refCreatedAt = args.json.versions[0];
        var fileCreatedAt = refCreatedAt.created_at;
        var fileId = args.params.fileId;
        var avatarName = '';
        var imageName = args.json.name;
        var avatarNameRegex = /Avatar - (.*) - Image -/g.exec(imageName);
        if (avatarNameRegex) {
            avatarName = avatarNameRegex[1];
        }
        var ownerId = args.json.ownerId;
        var avatarInfo = {
            ownerId,
            avatarName,
            fileCreatedAt
        };
        API.cachedAvatarNames.set(fileId, avatarInfo);
        return avatarInfo;
    };

    $app.methods.setAvatarImage = function (image) {
        this.changeAvatarImageDialogLoading = true;
        var parmas = {
            id: this.avatarDialog.id,
            imageUrl: `https://api.vrchat.cloud/api/1/file/${this.previousImagesTableFileId}/${image.version}/file`
        };
        API.setAvatarImage(parmas).finally(() => {
            this.changeAvatarImageDialogLoading = false;
            this.changeAvatarImageDialogVisible = false;
        });
    };

    $app.methods.setWorldImage = function (image) {
        this.changeWorldImageDialogLoading = true;
        var parmas = {
            id: this.worldDialog.id,
            imageUrl: `https://api.vrchat.cloud/api/1/file/${this.previousImagesTableFileId}/${image.version}/file`
        };
        API.setWorldImage(parmas).finally(() => {
            this.changeWorldImageDialogLoading = false;
            this.changeWorldImageDialogVisible = false;
        });
    };

    $app.methods.compareCurrentImage = function (image) {
        if (
            `https://api.vrchat.cloud/api/1/file/${this.previousImagesTableFileId}/${image.version}/file` ===
            this.avatarDialog.ref.imageUrl
        ) {
            return true;
        }
        return false;
    };

    // Avatar names

    API.cachedAvatarNames = new Map();

    $app.methods.getAvatarName = async function (imageUrl) {
        var fileId = extractFileId(imageUrl);
        if (!fileId) {
            return {
                ownerId: '',
                avatarName: '-'
            };
        }
        if (API.cachedAvatarNames.has(fileId)) {
            return API.cachedAvatarNames.get(fileId);
        }
        var args = await API.getAvatarImages({fileId});
        return this.storeAvatarImage(args);
    };

    $app.data.discordNamesDialogVisible = false;
    $app.data.discordNamesContent = '';

    $app.methods.showDiscordNamesDialog = function () {
        var {friends} = API.currentUser;
        if (Array.isArray(friends) === false) {
            return;
        }
        var lines = ['DisplayName,DiscordName'];
        var _ = function (str) {
            if (/[\x00-\x1f,"]/.test(str) === true) {
                return `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        for (var userId of friends) {
            var {ref} = this.friends.get(userId);
            var discord = '';
            if (typeof ref === 'undefined') {
                continue;
            }
            var name = ref.displayName;
            if (ref.statusDescription) {
                var statusRegex =
                    /(?:^|\n*)(?:(?:[^\n:]|\|)*(?::|˸|discord)[\t\v\f\r]*)?([^\n]*(#|＃)(?: )?\d{4})/gi.exec(
                        ref.statusDescription
                    );
                if (statusRegex) {
                    discord = statusRegex[1];
                }
            }
            if (!discord && ref.bio) {
                var bioRegex =
                    /(?:^|\n*)(?:(?:[^\n:]|\|)*(?::|˸|discord)[\t\v\f\r]*)?([^\n]*(#|＃)(?: )?\d{4})/gi.exec(
                        ref.bio
                    );
                if (bioRegex) {
                    discord = bioRegex[1];
                }
            }
            if (!discord) {
                continue;
            }
            discord = discord.replace('＃', '#');
            if (discord.substring(0, 1) === '#') {
                discord = `${_(name)}${_(discord)}`;
            }
            lines.push(`${_(name)},${_(discord)}`);
        }
        this.discordNamesContent = lines.join('\n');
        this.discordNamesDialogVisible = true;
    };

    // userDialog world/avatar tab click

    $app.data.userDialogLastActiveTab = '';
    $app.data.userDialogLastAvatar = '';
    $app.data.userDialogLastWorld = '';
    $app.data.userDialogLastFavoriteWorld = '';

    $app.methods.userDialogTabClick = function (obj) {
        var userId = this.userDialog.id;
        if (this.userDialogLastActiveTab === obj.label) {
            return;
        }
        if (obj.label === 'Avatars') {
            this.setUserDialogAvatars(userId);
            if (this.userDialogLastAvatar !== userId) {
                this.userDialogLastAvatar = userId;
                if (
                    userId === API.currentUser.id &&
                    this.userDialog.avatars.length === 0
                ) {
                    this.refreshUserDialogAvatars();
                }
            }
        } else if (obj.label === 'Worlds') {
            this.setUserDialogWorlds(userId);
            if (this.userDialogLastWorld !== userId) {
                this.userDialogLastWorld = userId;
                this.refreshUserDialogWorlds();
            }
        } else if (obj.label === 'Favorite Worlds') {
            if (this.userDialogLastFavoriteWorld !== userId) {
                this.userDialogLastFavoriteWorld = userId;
                this.getUserFavoriteWorlds(userId);
            }
        } else if (obj.label === 'JSON') {
            this.refreshUserDialogTreeData();
        }
        this.userDialogLastActiveTab = obj.label;
    };

    // VRChat Config JSON

    $app.data.VRChatConfigFile = {};

    $app.data.VRChatConfigList = {
        cache_size: {
            name: 'Max Cache Size [GB] (minimum 20)',
            default: '20',
            type: 'number',
            min: 20
        },
        cache_expiry_delay: {
            name: 'Cache Expiry [Days] (minimum 30)',
            default: '30',
            type: 'number',
            min: 30
        },
        cache_directory: {
            name: 'Custom Cache Folder Location',
            default: '%AppData%\\..\\LocalLow\\VRChat\\vrchat'
        },
        dynamic_bone_max_affected_transform_count: {
            name: 'Dynamic Bones Limit Max Transforms (0 always disable transforms)',
            default: '32',
            type: 'number',
            min: 0
        },
        dynamic_bone_max_collider_check_count: {
            name: 'Dynamic Bones Limit Max Collider Collisions (0 always disable colliders)',
            default: '8',
            type: 'number',
            min: 0
        }
    };

    $app.methods.readVRChatConfigFile = async function () {
        this.VRChatConfigFile = {};
        var config = await AppApi.ReadConfigFile();
        if (config) {
            try {
                this.VRChatConfigFile = JSON.parse(config);
            } catch {
                this.$message({
                    message: 'Invalid JSON in config.json',
                    type: 'error'
                });
                throw new Error('Invalid JSON in config.json');
            }
        }
    };

    $app.methods.WriteVRChatConfigFile = function () {
        var json = JSON.stringify(this.VRChatConfigFile, null, '\t');
        AppApi.WriteConfigFile(json);
    };

    $app.data.VRChatConfigDialog = {
        visible: false
    };

    API.$on('LOGIN', function () {
        $app.VRChatConfigDialog.visible = false;
    });

    $app.methods.showVRChatConfig = async function () {
        await this.readVRChatConfigFile();
        this.$nextTick(() => adjustDialogZ(this.$refs.VRChatConfigDialog.$el));
        this.VRChatConfigDialog.visible = true;
        if (!this.VRChatUsedCacheSize) {
            this.getVRChatCacheSize();
        }
    };

    $app.methods.saveVRChatConfigFile = function () {
        for (var item in this.VRChatConfigFile) {
            if (this.VRChatConfigFile[item] === '') {
                delete this.VRChatConfigFile[item];
            } else if (
                typeof this.VRChatConfigFile[item] === 'boolean' &&
                this.VRChatConfigFile[item] === false
            ) {
                delete this.VRChatConfigFile[item];
            } else if (
                typeof this.VRChatConfigFile[item] === 'string' &&
                !isNaN(this.VRChatConfigFile[item])
            ) {
                this.VRChatConfigFile[item] = parseInt(
                    this.VRChatConfigFile[item],
                    10
                );
            }
        }
        this.VRChatConfigDialog.visible = false;
        this.WriteVRChatConfigFile();
    };

    $app.methods.getVRChatCacheDir = async function () {
        await this.readVRChatConfigFile();
        var cacheDirectory = '';
        if (this.VRChatConfigFile.cache_directory) {
            cacheDirectory = this.VRChatConfigFile.cache_directory;
        }
        return cacheDirectory;
    };

    $app.data.VRChatResolutions = [
        {name: '1280x720 (720p)', width: 1280, height: 720},
        {name: '1920x1080 (Default 1080p)', width: '', height: ''},
        {name: '2560x1440 (2K)', width: 2560, height: 1440},
        {name: '3840x2160 (4K)', width: 3840, height: 2160}
    ];

    $app.methods.getVRChatResolution = function (res) {
        switch (res) {
            case '1280x720':
                return '1280x720 (720p)';
            case '1920x1080':
                return '1920x1080 (1080p)';
            case '2560x1440':
                return '2560x1440 (2K)';
            case '3840x2160':
                return '3840x2160 (4K)';
        }
        return `${res} (Custom)`;
    };

    $app.methods.getVRChatCameraResolution = function () {
        if (
            this.VRChatConfigFile.camera_res_height &&
            this.VRChatConfigFile.camera_res_width
        ) {
            var res = `${this.VRChatConfigFile.camera_res_width}x${this.VRChatConfigFile.camera_res_height}`;
            return this.getVRChatResolution(res);
        }
        return '1920x1080 (1080p)';
    };

    $app.methods.getVRChatScreenshotResolution = function () {
        if (
            this.VRChatConfigFile.screenshot_res_height &&
            this.VRChatConfigFile.screenshot_res_width
        ) {
            var res = `${this.VRChatConfigFile.screenshot_res_width}x${this.VRChatConfigFile.screenshot_res_height}`;
            return this.getVRChatResolution(res);
        }
        return '1920x1080 (1080p)';
    };

    $app.methods.setVRChatCameraResolution = function (res) {
        this.VRChatConfigFile.camera_res_height = res.height;
        this.VRChatConfigFile.camera_res_width = res.width;
    };

    $app.methods.setVRChatScreenshotResolution = function (res) {
        this.VRChatConfigFile.screenshot_res_height = res.height;
        this.VRChatConfigFile.screenshot_res_width = res.width;
    };

    // YouTube API

    $app.data.youTubeApiKey = '';

    $app.data.youTubeApiDialog = {
        visible: false
    };

    API.$on('LOGOUT', function () {
        $app.youTubeApiDialog.visible = false;
    });

    $app.methods.testYouTubeApiKey = async function () {
        if (!this.youTubeApiKey) {
            this.$message({
                message: 'YouTube API key removed',
                type: 'success'
            });
            this.youTubeApiDialog.visible = false;
            return;
        }
        var data = await this.lookupYouTubeVideo('dQw4w9WgXcQ');
        if (!data) {
            this.youTubeApiKey = '';
            this.$message({
                message: 'Invalid YouTube API key',
                type: 'error'
            });
        } else {
            configRepository.setString(
                'VRCX_youtubeAPIKey',
                this.youTubeApiKey
            );
            this.$message({
                message: 'YouTube API key valid!',
                type: 'success'
            });
            this.youTubeApiDialog.visible = false;
        }
    };

    $app.methods.changeYouTubeApi = function () {
        configRepository.setBool('VRCX_youtubeAPI', this.youTubeApi);
    };

    $app.methods.showYouTubeApiDialog = function () {
        this.$nextTick(() => adjustDialogZ(this.$refs.youTubeApiDialog.$el));
        var D = this.youTubeApiDialog;
        D.visible = true;
    };

    // Asset Bundle Cacher

    $app.methods.updateVRChatWorldCache = function () {
        var D = this.worldDialog;
        if (D.visible) {
            D.inCache = false;
            D.cacheSize = 0;
            D.cacheLocked = false;
            this.checkVRChatCache(D.ref).then((cacheInfo) => {
                if (cacheInfo[0] > 0) {
                    D.inCache = true;
                    D.cacheSize = `${(cacheInfo[0] / 1048576).toFixed(2)} MiB`;
                }
                if (cacheInfo[1] === 1) {
                    D.cacheLocked = true;
                }
            });
        }
    };

    $app.methods.updateVRChatAvatarCache = function () {
        var D = this.avatarDialog;
        if (D.visible) {
            D.inCache = false;
            D.cacheSize = 0;
            D.cacheLocked = false;
            this.checkVRChatCache(D.ref).then((cacheInfo) => {
                if (cacheInfo[0] > 0) {
                    D.inCache = true;
                    D.cacheSize = `${(cacheInfo[0] / 1048576).toFixed(2)} MiB`;
                }
                if (cacheInfo[1] === 1) {
                    D.cacheLocked = true;
                }
            });
        }
    };

    $app.methods.checkVRChatCache = async function (ref) {
        var cacheDir = await this.getVRChatCacheDir();
        var assetUrl = '';
        for (var i = ref.unityPackages.length - 1; i > -1; i--) {
            var unityPackage = ref.unityPackages[i];
            if (
                unityPackage.platform === 'standalonewindows' &&
                this.compareUnityVersion(unityPackage.unityVersion)
            ) {
                assetUrl = unityPackage.assetUrl;
                break;
            }
        }
        var id = extractFileId(assetUrl);
        var version = parseInt(extractFileVersion(assetUrl), 10);
        if (!id || !version) {
            return [-1, 0];
        }
        return AssetBundleCacher.CheckVRChatCache(id, version, cacheDir);
    };

    $app.methods.queueCacheDownload = function (ref, type) {
        if (!this.downloadQueue.has(ref.id)) {
            var date = new Date().toJSON();
            var userId = '';
            var location = ref.id;
            this.downloadQueue.set(ref.id, {ref, type, date, userId, location});
            this.downloadQueueTable.data = Array.from(
                this.downloadQueue.values()
            );
        }
        if (!this.downloadInProgress) {
            this.downloadVRChatCache();
        }
    };

    API.getBundles = function (fileId) {
        return this.call(`file/${fileId}`, {
            method: 'GET'
        }).then((json) => {
            var args = {
                json
            };
            return args;
        });
    };

    $app.data.cacheAutoDownloadHistory = new Set();

    $app.methods.downloadVRChatCache = async function () {
        if (this.downloadQueue.size === 0) {
            return;
        }
        this.downloadProgress = 0;
        this.downloadIsProcessing = false;
        this.downloadInProgress = true;
        this.downloadCurrent = this.downloadQueue.values().next().value;
        this.downloadCurrent.id = this.downloadQueue.keys().next().value;
        var {ref} = this.downloadCurrent;
        this.downloadQueue.delete(ref.id);
        this.downloadQueueTable.data = Array.from(this.downloadQueue.values());
        if (this.downloadCurrent.id === 'VRCXUpdate') {
            var url = this.downloadCurrent.updateZipUrl;
            await AssetBundleCacher.DownloadCacheFile(
                '',
                url,
                '',
                0,
                0,
                '',
                appVersion,
                true
            );
            this.downloadVRChatCacheProgress();
            return;
        }
        var assetUrl = '';
        for (var i = ref.unityPackages.length - 1; i > -1; i--) {
            var unityPackage = ref.unityPackages[i];
            if (
                unityPackage.platform === 'standalonewindows' &&
                this.compareUnityVersion(unityPackage.unityVersion)
            ) {
                assetUrl = unityPackage.assetUrl;
                break;
            }
        }
        var fileId = extractFileId(assetUrl);
        var fileVersion = parseInt(extractFileVersion(assetUrl), 10);
        if (!fileId) {
            this.downloadCurrent.status = 'Invalid asset url';
            this.downloadCurrent.date = Date.now();
            this.downloadHistoryTable.data.unshift(this.downloadCurrent);
            this.downloadCurrent = {};
            this.downloadInProgress = false;
            this.downloadVRChatCache();
            return;
        }
        if (
            this.downloadCurrent.type !== 'Auto' ||
            !this.cacheAutoDownloadHistory.has(assetUrl)
        ) {
            this.cacheAutoDownloadHistory.add(assetUrl);
            try {
                var args = await API.getBundles(fileId);
            } catch (err) {
                this.downloadCurrent.status = 'API request failed';
                this.downloadCurrent.date = Date.now();
                this.downloadHistoryTable.data.unshift(this.downloadCurrent);
                this.downloadCurrent = {};
                this.downloadInProgress = false;
                this.downloadVRChatCache();
                return;
            }
        } else {
            this.downloadCurrent = {};
            this.downloadInProgress = false;
            this.downloadVRChatCache();
            return;
        }
        var {versions} = args.json;
        var file = '';
        for (var i = versions.length - 1; i > -1; i--) {
            var version = versions[i];
            if (version.version === fileVersion) {
                file = version.file;
                break;
            }
        }
        if (!file) {
            this.downloadCurrent.status = 'Missing asset version';
            this.downloadCurrent.date = Date.now();
            this.downloadHistoryTable.data.unshift(this.downloadCurrent);
            this.downloadCurrent = {};
            this.downloadInProgress = false;
            this.downloadVRChatCache();
            return;
        }
        var {url, md5, sizeInBytes} = file;
        var cacheDir = await this.getVRChatCacheDir();
        await AssetBundleCacher.DownloadCacheFile(
            cacheDir,
            url,
            fileId,
            fileVersion,
            sizeInBytes,
            md5,
            appVersion,
            false
        );
        this.downloadVRChatCacheProgress();
    };

    $app.methods.cancelVRChatCacheDownload = function (location) {
        var L = API.parseLocation(location);
        if (L.worldId) {
            if (this.downloadCurrent.id === L.worldId) {
                AssetBundleCacher.CancelDownload();
            }
            if (this.downloadQueue.has(L.worldId)) {
                this.downloadQueue.delete(L.worldId);
                this.downloadQueueTable.data = Array.from(
                    this.downloadQueue.values()
                );
            }
        }
    };

    $app.methods.cancelAllVRChatCacheDownload = function () {
        if (typeof this.downloadCurrent.id !== 'undefined') {
            this.cancelVRChatCacheDownload(this.downloadCurrent.id);
        }
        for (var queue of this.downloadQueue.values()) {
            this.cancelVRChatCacheDownload(queue.ref.id);
        }
    };

    API.$on('NOTIFICATION', function (args) {
        var {json} = args;
        if (json.type === 'invite') {
            $app.inviteDownloadWorldCache(json);
        }
    });

    $app.methods.inviteDownloadWorldCache = function (invite) {
        if (
            this.worldAutoCacheInvite === 'Always' ||
            (this.worldAutoCacheInvite === 'Game Closed' &&
                !this.isGameRunning) ||
            (this.worldAutoCacheInvite === 'Game Running' && this.isGameRunning)
        ) {
            if (
                !this.worldAutoCacheInviteFilter &&
                !API.cachedFavoritesByObjectId.has(invite.senderUserId)
            ) {
                return;
            }
            this.autoDownloadWorldCache(
                invite.details.worldId,
                'Invite',
                invite.senderUserId
            );
        }
    };

    $app.methods.feedDownloadWorldCache = function (id, location) {
        if (
            this.worldAutoCacheGPS === 'Always' ||
            (this.worldAutoCacheGPS === 'Game Closed' && !this.isGameRunning) ||
            (this.worldAutoCacheGPS === 'Game Running' && this.isGameRunning)
        ) {
            if (
                location === '' ||
                location === 'offline' ||
                location === 'private' ||
                (!this.worldAutoCacheGPSFilter &&
                    !API.cachedFavoritesByObjectId.has(id))
            ) {
                return;
            }
            this.autoDownloadWorldCache(location, 'GPS', id);
        }
    };

    $app.methods.autoDownloadWorldCache = function (location, type, userId) {
        var L = API.parseLocation(location);
        if (
            !L.worldId ||
            this.downloadQueue.has(L.worldId) ||
            this.downloadCurrent.id === L.worldId
        ) {
            return;
        }
        API.getWorld({
            worldId: L.worldId
        }).then((args) => {
            var {ref} = args;
            this.checkVRChatCache(ref).then((cacheInfo) => {
                if (cacheInfo[0] === -1 && cacheInfo[1] === 0) {
                    this.downloadQueue.set(ref.id, {
                        ref,
                        type,
                        userId,
                        location
                    });
                    this.downloadQueueTable.data = Array.from(
                        this.downloadQueue.values()
                    );
                    if (!this.downloadInProgress) {
                        this.downloadVRChatCache();
                    }
                }
            });
        });
    };

    $app.data.downloadProgress = 0;
    $app.data.downloadInProgress = false;
    $app.data.downloadIsProcessing = false;
    $app.data.downloadQueue = new Map();
    $app.data.downloadCurrent = {};

    $app.methods.downloadVRChatCacheProgress = async function () {
        var downloadProgress = await AssetBundleCacher.CheckDownloadProgress();
        switch (downloadProgress) {
            case -1:
                this.downloadProgress = 100;
                this.downloadIsProcessing = true;
                break;
            case -3:
                if (this.worldDialog.id === this.downloadCurrent.id) {
                    this.updateVRChatWorldCache();
                }
                if (this.avatarDialog.id === this.downloadCurrent.id) {
                    this.updateVRChatAvatarCache();
                }
                if (this.downloadCurrent.type === 'Manual') {
                    this.$message({
                        message: 'World cache complete',
                        type: 'success'
                    });
                } else if (this.downloadCurrent.type === 'Avatar') {
                    this.$message({
                        message: 'Avatar cache complete',
                        type: 'success'
                    });
                }
                this.downloadCurrent.status = 'Success';
                this.downloadCurrent.date = Date.now();
                this.downloadHistoryTable.data.unshift(this.downloadCurrent);
                this.downloadCurrent = {};
                this.downloadProgress = 0;
                this.downloadInProgress = false;
                this.downloadVRChatCache();
                return;
            case -4:
                this.$message({
                    message: 'Download canceled',
                    type: 'info'
                });
                this.downloadCurrent.status = 'Canceled';
                this.downloadCurrent.date = Date.now();
                this.downloadHistoryTable.data.unshift(this.downloadCurrent);
                this.downloadCurrent = {};
                this.downloadProgress = 0;
                this.downloadInProgress = false;
                this.downloadVRChatCache();
                return;
            case -10:
                this.$message({
                    message: "AssetBundleCacher can't be located",
                    type: 'error'
                });
                this.downloadCurrent = {};
                this.downloadQueue = new Map();
                this.downloadQueueTable.data = [];
                this.downloadProgress = 0;
                this.downloadInProgress = false;
                return;
            case -11:
                this.$message({
                    message:
                        "Delete 'data.unity3d' file from AssetBundleCacher_Data folder",
                    type: 'error'
                });
                this.downloadCurrent = {};
                this.downloadQueue = new Map();
                this.downloadQueueTable.data = [];
                this.downloadProgress = 0;
                this.downloadInProgress = false;
                return;
            case -12:
                if (this.worldDialog.id === this.downloadCurrent.id) {
                    this.updateVRChatWorldCache();
                }
                if (this.avatarDialog.id === this.downloadCurrent.id) {
                    this.updateVRChatAvatarCache();
                }
                if (this.downloadCurrent.type === 'Manual') {
                    this.$message({
                        message: 'File already in cache',
                        type: 'warning'
                    });
                }
                this.downloadCurrent.status = 'Already in cache';
                this.downloadCurrent.date = Date.now();
                this.downloadHistoryTable.data.unshift(this.downloadCurrent);
                this.downloadCurrent = {};
                this.downloadProgress = 0;
                this.downloadInProgress = false;
                this.downloadVRChatCache();
                return;
            case -13:
                this.$message({
                    message: 'Failed to process file',
                    type: 'error'
                });
                this.downloadCurrent.status = 'Failed to process';
                this.downloadCurrent.date = Date.now();
                this.downloadHistoryTable.data.unshift(this.downloadCurrent);
                this.downloadCurrent = {};
                this.downloadProgress = 0;
                this.downloadInProgress = false;
                this.downloadVRChatCache();
                return;
            case -14:
                this.$message({
                    message: 'Failed to move file into cache',
                    type: 'error'
                });
                this.downloadCurrent.status = 'Failed to move into cache';
                this.downloadCurrent.date = Date.now();
                this.downloadHistoryTable.data.unshift(this.downloadCurrent);
                this.downloadCurrent = {};
                this.downloadProgress = 0;
                this.downloadInProgress = false;
                this.downloadVRChatCache();
                return;
            case -15:
                this.$message({
                    message: 'Download failed',
                    type: 'error'
                });
                this.downloadCurrent.status = 'Download failed';
                this.downloadCurrent.date = Date.now();
                this.downloadHistoryTable.data.unshift(this.downloadCurrent);
                this.downloadCurrent = {};
                this.downloadProgress = 0;
                this.downloadInProgress = false;
                this.downloadVRChatCache();
                return;
            case -16:
                this.downloadCurrent.status = 'Success';
                this.downloadCurrent.date = Date.now();
                this.downloadHistoryTable.data.unshift(this.downloadCurrent);
                if (this.downloadCurrent.autoInstall) {
                    this.restartVRCX();
                } else {
                    this.downloadDialog.visible = false;
                    this.showVRCXUpdateDialog();
                }
                this.downloadCurrent = {};
                this.downloadProgress = 0;
                this.downloadInProgress = false;
                this.downloadVRChatCache();
                return;
            default:
                this.downloadProgress = downloadProgress;
        }
        setTimeout(() => this.downloadVRChatCacheProgress(), 150);
    };

    $app.methods.showDownloadDialog = function () {
        this.$nextTick(() => adjustDialogZ(this.$refs.downloadDialog.$el));
        this.downloadDialog.visible = true;
    };

    $app.data.downloadDialog = {
        visible: false
    };

    $app.methods.downloadProgressText = function () {
        if (this.downloadIsProcessing) {
            return 'Processing';
        }
        if (this.downloadProgress >= 0) {
            return `${this.downloadProgress}%`;
        }
        return '';
    };

    $app.methods.getDisplayName = function (userId) {
        if (userId) {
            var ref = API.cachedUsers.get(userId);
            if (ref.displayName) {
                return ref.displayName;
            }
        }
        return '';
    };

    $app.methods.deleteVRChatCache = async function (ref) {
        var cacheDir = await this.getVRChatCacheDir();
        var assetUrl = '';
        for (var i = ref.unityPackages.length - 1; i > -1; i--) {
            var unityPackage = ref.unityPackages[i];
            if (
                unityPackage.platform === 'standalonewindows' &&
                this.compareUnityVersion(unityPackage.unityVersion)
            ) {
                assetUrl = unityPackage.assetUrl;
                break;
            }
        }
        var id = extractFileId(assetUrl);
        var version = parseInt(extractFileVersion(assetUrl), 10);
        await AssetBundleCacher.DeleteCache(cacheDir, id, version);
        this.getVRChatCacheSize();
        this.updateVRChatWorldCache();
        this.updateVRChatAvatarCache();
    };

    $app.methods.showDeleteAllVRChatCacheConfirm = function () {
        this.$confirm(`Continue? Delete all VRChat cache`, 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    this.deleteAllVRChatCache();
                }
            }
        });
    };

    $app.methods.deleteAllVRChatCache = async function () {
        var cacheDir = await this.getVRChatCacheDir();
        await AssetBundleCacher.DeleteAllCache(cacheDir);
        this.getVRChatCacheSize();
    };

    $app.methods.autoVRChatCacheManagement = function () {
        if (this.autoSweepVRChatCache) {
            this.sweepVRChatCache();
        }
    };

    $app.methods.sweepVRChatCache = async function () {
        var cacheDir = await this.getVRChatCacheDir();
        await AssetBundleCacher.SweepCache(cacheDir);
        if (this.VRChatConfigDialog.visible) {
            this.getVRChatCacheSize();
        }
    };

    $app.data.VRChatUsedCacheSize = '';
    $app.data.VRChatTotalCacheSize = '';
    $app.data.VRChatCacheSizeLoading = false;

    $app.methods.getVRChatCacheSize = async function () {
        this.VRChatCacheSizeLoading = true;
        var cacheDir = await this.getVRChatCacheDir();
        var totalCacheSize = 20;
        if (this.VRChatConfigFile.cache_size) {
            totalCacheSize = this.VRChatConfigFile.cache_size;
        }
        this.VRChatTotalCacheSize = totalCacheSize;
        var usedCacheSize = await AssetBundleCacher.GetCacheSize(cacheDir);
        this.VRChatUsedCacheSize = (usedCacheSize / 1073741824).toFixed(2);
        this.VRChatCacheSizeLoading = false;
    };

    API.$on('LOGIN', function () {
        $app.downloadDialog.visible = false;
    });

    // Parse location URL

    $app.methods.parseLocationUrl = function (location) {
        var url = new URL(location);
        var urlPath = url.pathname;
        if (urlPath.substring(5, 12) === '/world/') {
            var worldId = urlPath.substring(12);
            return worldId;
        }
        if (urlPath.substring(5, 12) === '/launch') {
            var urlParams = new URLSearchParams(url.search);
            var worldId = urlParams.get('worldId');
            var instanceId = urlParams.get('instanceId');
            if (instanceId) {
                return `${worldId}:${instanceId}`;
            }
            if (worldId) {
                return worldId;
            }
        }
        return void 0;
    };

    // Parse User URL

    $app.methods.parseUserUrl = function (user) {
        var url = new URL(user);
        var urlPath = url.pathname;
        if (urlPath.substring(5, 11) === '/user/') {
            var userId = urlPath.substring(11);
            return userId;
        }
        return void 0;
    };

    // Parse Avatar URL

    $app.methods.parseAvatarUrl = function (avatar) {
        var url = new URL(avatar);
        var urlPath = url.pathname;
        if (urlPath.substring(5, 13) === '/avatar/') {
            var avatarId = urlPath.substring(13);
            return avatarId;
        }
        return void 0;
    };

    // userDialog Favorite Worlds

    $app.data.userFavoriteWorlds = [];

    $app.methods.getUserFavoriteWorlds = async function (userId) {
        this.userDialog.isFavoriteWorldsLoading = true;
        this.userFavoriteWorlds = [];
        var worldLists = [];
        var params = {
            ownerId: userId
        };
        var json = await API.call('favorite/groups', {
            method: 'GET',
            params
        });
        for (var i = 0; i < json.length; ++i) {
            var list = json[i];
            if (list.type !== 'world') {
                continue;
            }
            var params = {
                n: 100,
                offset: 0,
                userId,
                tag: list.name
            };
            try {
                var args = await API.getFavoriteWorlds(params);
                worldLists.push([list.displayName, list.visibility, args.json]);
            } catch (err) {}
        }
        this.userFavoriteWorlds = worldLists;
        this.userDialog.isFavoriteWorldsLoading = false;
    };

    $app.data.worldGroupVisibilityOptions = ['private', 'friends', 'public'];

    $app.methods.userFavoriteWorldsStatus = function (visibility) {
        var style = {};
        if (visibility === 'public') {
            style.online = true;
        } else if (visibility === 'friends') {
            style.joinme = true;
        } else {
            style.busy = true;
        }
        return style;
    };

    $app.methods.changeWorldGroupVisibility = function (name, visibility) {
        var params = {
            type: 'world',
            group: name,
            visibility
        };
        API.saveFavoriteGroup(params).then((args) => {
            this.$message({
                message: 'Group visibility changed',
                type: 'success'
            });
            return args;
        });
    };

    $app.methods.refreshInstancePlayerCount = function (instance) {
        var L = API.parseLocation(instance);
        if (L.worldId) {
            API.getInstance({
                worldId: L.worldId,
                instanceId: L.instanceId
            });
        }
    };

    // gallery

    $app.data.galleryDialog = {};
    $app.data.galleryDialogVisible = false;
    $app.data.galleryDialogGalleryLoading = false;
    $app.data.galleryDialogIconsLoading = false;

    API.$on('LOGIN', function () {
        $app.galleryTable = [];
    });

    $app.methods.showGalleryDialog = function () {
        this.galleryDialogVisible = true;
        this.refreshGalleryTable();
        this.refreshVRCPlusIconsTable();
    };

    $app.methods.refreshGalleryTable = function () {
        this.galleryDialogGalleryLoading = true;
        var params = {
            n: 100,
            tag: 'gallery'
        };
        API.getFileList(params);
    };

    API.$on('FILES:LIST', function (args) {
        if (args.params.tag === 'gallery') {
            $app.galleryTable = args.json.reverse();
            $app.galleryDialogGalleryLoading = false;
        }
    });

    $app.methods.setProfilePicOverride = function (fileId) {
        var profilePicOverride = '';
        if (fileId) {
            profilePicOverride = `https://api.vrchat.cloud/api/1/file/${fileId}/1`;
        }
        if (profilePicOverride === API.currentUser.profilePicOverride) {
            return;
        }
        API.saveCurrentUser({
            profilePicOverride
        }).then((args) => {
            this.$message({
                message: 'Profile picture changed',
                type: 'success'
            });
            return args;
        });
    };

    $app.methods.deleteGalleryImage = function (fileId) {
        API.deleteFile(fileId).then((args) => {
            API.$emit('GALLERYIMAGE:DELETE', args);
            return args;
        });
    };

    API.$on('GALLERYIMAGE:DELETE', function (args) {
        var array = $app.galleryTable;
        var {length} = array;
        for (var i = 0; i < length; ++i) {
            if (args.fileId === array[i].id) {
                array.splice(i, 1);
                break;
            }
        }
    });

    $app.methods.compareCurrentProfilePic = function (fileId) {
        var currentProfilePicOverride = extractFileId(
            API.currentUser.profilePicOverride
        );
        if (fileId === currentProfilePicOverride) {
            return true;
        }
        return false;
    };

    $app.methods.onFileChangeGallery = function (e) {
        var clearFile = function () {
            if (document.querySelector('#GalleryUploadButton')) {
                document.querySelector('#GalleryUploadButton').value = '';
            }
        };
        var files = e.target.files || e.dataTransfer.files;
        if (!files.length) {
            return;
        }
        if (files[0].size >= 10000000) {
            // 10MB
            $app.$message({
                message: 'File size too large',
                type: 'error'
            });
            clearFile();
            return;
        }
        if (!files[0].type.match(/image.*/)) {
            $app.$message({
                message: "File isn't an image",
                type: 'error'
            });
            clearFile();
            return;
        }
        var r = new FileReader();
        r.onload = function () {
            var base64Body = btoa(r.result);
            API.uploadGalleryImage(base64Body).then((args) => {
                $app.$message({
                    message: 'Gallery image uploaded',
                    type: 'success'
                });
                return args;
            });
        };
        r.readAsBinaryString(files[0]);
        clearFile();
    };

    $app.methods.displayGalleryUpload = function () {
        document.getElementById('GalleryUploadButton').click();
    };

    API.uploadGalleryImage = function (params) {
        return this.call('gallery', {
            uploadImage: true,
            imageData: params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('GALLERYIMAGE:ADD', args);
            return args;
        });
    };

    API.$on('GALLERYIMAGE:ADD', function (args) {
        if (Object.keys($app.galleryTable).length !== 0) {
            $app.galleryTable.push(args.json);
        }
    });

    $app.methods.replaceBioSymbols = function (text) {
        if (!text) {
            return void 0;
        }
        var symbolList = {
            '@': '＠',
            '#': '＃',
            $: '＄',
            '%': '％',
            '&': '＆',
            '=': '＝',
            '+': '＋',
            '/': '⁄',
            '\\': '＼',
            ';': ';',
            ':': '˸',
            ',': '‚',
            '?': '？',
            '!': 'ǃ',
            '"': '＂',
            '<': '≺',
            '>': '≻',
            '.': '․',
            '^': '＾',
            '{': '｛',
            '}': '｝',
            '[': '［',
            ']': '］',
            '(': '（',
            ')': '）',
            '|': '｜',
            '*': '∗'
        };
        var newText = text;
        for (var key in symbolList) {
            var regex = new RegExp(symbolList[key], 'g');
            newText = newText.replace(regex, key);
        }
        return newText.replace(/ {1,}/g, ' ').trimRight();
    };

    $app.methods.checkCanInvite = function (location) {
        var L = API.parseLocation(location);
        if (L.accessType === 'invite' || L.accessType === 'friends') {
            if (L.userId === API.currentUser.id) {
                return false;
            }
            return true;
        }
        return false;
    };

    $app.methods.setAsideWidth = function () {
        document.getElementById('aside').style.width = `${this.asideWidth}px`;
        configRepository.setInt('VRCX_asidewidth', this.asideWidth);
    };

    // VRCX auto update

    $app.data.VRCXUpdateDialog = {
        visible: false,
        updatePending: false,
        release: '',
        releases: []
    };

    $app.data.checkingForVRCXUpdate = false;

    $app.data.branches = {
        Stable: {
            name: 'Stable',
            urlReleases: 'https://vrcx.pypy.moe/releases/pypy-vrc.json',
            urlLatest: 'https://vrcx.pypy.moe/releases/latest/pypy-vrc.json'
        },
        Beta: {
            name: 'Beta',
            urlReleases: 'https://vrcx.pypy.moe/releases/natsumi-sama.json',
            urlLatest: 'https://vrcx.pypy.moe/releases/latest/natsumi-sama.json'
        }
    };

    $app.methods.showVRCXUpdateDialog = async function () {
        this.$nextTick(() => adjustDialogZ(this.$refs.VRCXUpdateDialog.$el));
        var D = this.VRCXUpdateDialog;
        D.visible = true;
        D.updatePending = await AppApi.CheckForUpdateZip();
        this.loadBranchVersions();
    };

    $app.methods.downloadVRCXUpdate = function (
        updateZipUrl,
        name,
        type,
        autoInstall
    ) {
        var ref = {
            id: 'VRCXUpdate',
            name
        };
        this.downloadQueue.set('VRCXUpdate', {
            ref,
            type,
            updateZipUrl,
            autoInstall
        });
        this.downloadQueueTable.data = Array.from(this.downloadQueue.values());
        if (!this.downloadInProgress) {
            this.downloadVRChatCache();
        }
    };

    $app.methods.installVRCXUpdate = function () {
        for (var release of this.VRCXUpdateDialog.releases) {
            if (release.name === this.VRCXUpdateDialog.release) {
                for (var asset of release.assets) {
                    if (
                        asset.content_type === 'application/x-msdownload' &&
                        asset.state === 'uploaded'
                    ) {
                        var downloadUrl = asset.browser_download_url;
                        break;
                    }
                }
                if (!downloadUrl) {
                    return;
                }
                var name = release.name;
                var type = 'Manual';
                var autoInstall = false;
                this.downloadVRCXUpdate(downloadUrl, name, type, autoInstall);
                this.VRCXUpdateDialog.visible = false;
                this.showDownloadDialog();
            }
        }
    };

    $app.methods.restartVRCX = function () {
        AppApi.RestartApplication();
    };

    $app.methods.loadBranchVersions = async function () {
        var D = this.VRCXUpdateDialog;
        var url = this.branches[this.branch].urlReleases;
        this.checkingForVRCXUpdate = true;
        var response = await webApiService.execute({
            url,
            method: 'GET',
            headers: {
                'User-Agent': appVersion
            }
        });
        this.checkingForVRCXUpdate = false;
        var json = JSON.parse(response.data);
        var releases = [];
        for (var release of json) {
            for (var asset of release.assets) {
                if (
                    asset.content_type === 'application/x-msdownload' &&
                    asset.state === 'uploaded'
                ) {
                    releases.push(release);
                }
            }
        }
        D.releases = releases;
        D.release = json[0].name;
        if (configRepository.getString('VRCX_branch') !== this.branch) {
            configRepository.setString('VRCX_branch', this.branch);
        }
    };

    $app.methods.saveAutoUpdateVRCX = function () {
        configRepository.setString('VRCX_autoUpdateVRCX', this.autoUpdateVRCX);
    };

    $app.methods.checkForVRCXUpdate = async function () {
        if (await AppApi.CheckForUpdateZip()) {
            return;
        }
        var url = this.branches[this.branch].urlLatest;
        this.checkingForVRCXUpdate = true;
        var response = await webApiService.execute({
            url,
            method: 'GET',
            headers: {
                'User-Agent': appVersion
            }
        });
        this.checkingForVRCXUpdate = false;
        var json = JSON.parse(response.data);
        if (json === Object(json) && json.name && json.published_at) {
            this.latestAppVersion = `${json.name} (${formatDate(
                json.published_at,
                'YYYY-MM-DD HH24:MI:SS'
            )})`;
            if (json.name > this.appVersion) {
                for (var asset of json.assets) {
                    if (
                        asset.content_type === 'application/x-msdownload' &&
                        asset.state === 'uploaded'
                    ) {
                        var downloadUrl = asset.browser_download_url;
                        break;
                    }
                }
                if (!downloadUrl) {
                    return;
                }
                this.notifyMenu('settings');
                var name = json.name;
                var type = 'Auto';
                if (this.autoUpdateVRCX === 'Notify') {
                    this.showVRCXUpdateDialog();
                } else if (this.autoUpdateVRCX === 'Auto Download') {
                    var autoInstall = false;
                    this.downloadVRCXUpdate(
                        downloadUrl,
                        name,
                        type,
                        autoInstall
                    );
                } else if (this.autoUpdateVRCX === 'Auto Install') {
                    var autoInstall = true;
                    this.downloadVRCXUpdate(
                        downloadUrl,
                        name,
                        type,
                        autoInstall
                    );
                }
            }
        } else {
            this.latestAppVersion = 'Error occured';
        }
    };

    $app.methods.compareUnityVersion = function (version) {
        var currentUnityVersion = API.cachedConfig.sdkUnityVersion.replace(
            /\D/g,
            ''
        );
        var assetVersion = version.replace(/\D/g, '');
        if (parseInt(assetVersion, 10) <= parseInt(currentUnityVersion, 10)) {
            return true;
        }
        return false;
    };

    $app.methods.userImage = function (user) {
        if (this.displayVRCPlusIconsAsAvatar && user.userIcon) {
            return user.userIcon;
        }
        if (user.profilePicOverride) {
            return user.profilePicOverride;
        }
        return user.currentAvatarThumbnailImageUrl;
    };

    $app.methods.userImageFull = function (user) {
        if (this.displayVRCPlusIconsAsAvatar && user.userIcon) {
            return user.userIcon;
        }
        if (user.profilePicOverride) {
            return user.profilePicOverride;
        }
        return user.currentAvatarImageUrl;
    };

    $app = new Vue($app);
    window.$app = $app;
})();
