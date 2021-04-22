// Copyright(c) 2019-2021 pypy and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

import Noty from 'noty';
import Vue from 'vue';
import VueLazyload from 'vue-lazyload';
import { DataTables } from 'vue-data-tables';
// eslint-disable-next-line no-unused-vars
import ToggleSwitch from 'vuejs-toggle-switch';
import VSwatches from 'vue-swatches';
Vue.component('v-swatches', VSwatches);
import '../node_modules/vue-swatches/dist/vue-swatches.css';
import ElementUI from 'element-ui';
import locale from 'element-ui/lib/locale/lang/en';

import {appVersion} from './constants.js';
import sharedRepository from './repository/shared.js';
import configRepository from './repository/config.js';
import webApiService from './service/webapi.js';
import gameLogService from './service/gamelog.js';

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
        'Discord'
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

    document.addEventListener('keyup', function (e) {
        if (e.ctrlKey) {
            if (e.key === 'I') {
                AppApi.ShowDevTools();
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
        var { length } = array;
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
        return format.replace(/YYYY|MM|DD|HH24|HH|MI|SS|AMPM/g, (c) => map[c] || c);
    };
    Vue.filter('formatDate', formatDate);

    var textToHex = function (text) {
        var s = String(text);
        return s.split('').map((c) => c.charCodeAt(0).toString(16)).join(' ');
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
        if (n ||
            arr.length === 0) {
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
        }
    });

    Vue.use(DataTables);

    var uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        var v = Math.random() * 16 | 0;
        if (c !== 'x') {
            v |= 8;
        }
        return v.toString(16);
    });

    var $appDarkStyle = document.createElement('link');
    $appDarkStyle.disabled = true;
    $appDarkStyle.rel = 'stylesheet';
    $appDarkStyle.href = `app.dark.css?_=${Date.now()}`;
    document.head.appendChild($appDarkStyle);

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
        ara: 'العربية'
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
        ara: 'ae'
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
        var init = {
            url: `https://api.vrchat.cloud/api/1/${endpoint}`,
            method: 'GET',
            ...options
        };
        var { params } = init;
        if (init.method === 'GET') {
            // transform body to url
            if (params === Object(params)) {
                var url = new URL(init.url);
                var { searchParams } = url;
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
        } else {
            init.headers = {
                'Content-Type': 'application/json;charset=utf-8',
                ...init.headers
            };
            init.body = params === Object(params)
                ? JSON.stringify(params)
                : '{}';
        }
        init.headers = {
            'User-Agent': appVersion,
            ...init.headers
        };
        var req = webApiService.execute(init).catch((err) => {
            this.$throw(0, err);
        }).then((response) => {
            try {
                response.data = JSON.parse(response.data);
                if ($app.debug) {
                    console.log(init, response.data);
                }
                return response;
            } catch (e) {
            }
            if (response.status === 200) {
                this.$throw(0, 'Invalid JSON response');
            }
            this.$throw(response.status);
            return {};
        }).then(({ data, status }) => {
            if (status === 200) {
                if (data.success === Object(data.success)) {
                    new Noty({
                        type: 'success',
                        text: escapeTag(data.success.message)
                    }).show();
                }
                return data;
            }
            if ((status === 401) && (data.error.message === '"Missing Credentials"') && ($app.isAutoLogin)) {
                if (endpoint.substring(0, 10) === 'auth/user?') {
                    this.$emit('AUTOLOGIN');
                }
                throw new Error('401: Missing Credentials');
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
        Noty.closeAll();
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
            new Noty({
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
        if (args.json.length > 0 &&
            (options.params.offset += args.json.length,
                // eslint-disable-next-line no-nested-ternary
                options.N > 0
                    ? options.N > options.params.offset
                    : options.N < 0
                        ? args.json.length
                        : options.params.n === args.json.length)) {
            this.bulk(options);
        } else if ('done' in options) {
            options.done.call(this, true, options);
        }
        return args;
    };

    API.bulk = function (options) {
        this[options.fn](options.params).catch((err) => {
            if ('done' in options) {
                options.done.call(this, false, options);
            }
            throw err;
        }).then((args) => this.$bulk(options, args));
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

    Vue.component('launch', {
        template: '<el-button @click="confirm" size="mini" icon="el-icon-link" circle></el-button>',
        props: {
            location: String
        },
        methods: {
            parse() {
                var L = API.parseLocation(this.location);
                this.$el.style.display = L.isOffline || L.isPrivate
                    ? 'none'
                    : '';
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
        template: '<el-button @click="confirm" size="mini" icon="el-icon-message" circle></el-button>',
        props: {
            location: String
        },
        methods: {
            parse() {
                var L = API.parseLocation(this.location);
                this.$el.style.display = L.isOffline || L.isPrivate
                    ? 'none'
                    : '';
            },
            confirm() {
                var L = API.parseLocation(this.location);
                if (L.isOffline ||
                    L.isPrivate ||
                    L.worldId === '') {
                    return;
                }
                API.getCachedWorld({
                    worldId: L.worldId
                }).then((args) => {
                    if (API.currentUser.status === 'busy') {
                        this.$message({
                            message: 'You can\'t invite yourself in \'Do Not Disturb\' mode',
                            type: 'error'
                        });
                        return;
                    }
                    API.sendInvite({
                        instanceId: L.tag,
                        worldId: L.tag,
                        worldName: args.ref.name
                    }, API.currentUser.id).finally(() => {
                        this.$message({
                            message: 'Invite sent to yourself',
                            type: 'success'
                        });
                    });
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
        template: '<span @click="showWorldDialog" :class="{ \'x-link\': link && this.location !== \'private\' && this.location !== \'offline\'}">{{ text }}<slot></slot></span>',
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
        webApiService.clearCookies();
        this.isLoggedIn = false;
    });

    API.$on('USER:CURRENT', function (args) {
        var { json } = args;
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
        return this.call('logout', {
            method: 'PUT'
        }).finally(() => {
            this.$emit('LOGOUT');
        });
    };

    /*
        params: {
            username: string,
            password: string
        }
    */
    API.login = function (params) {
        var { username, password, saveCredentials } = params;
        username = encodeURIComponent(username);
        password = encodeURIComponent(password);
        var auth = btoa(`${username}:${password}`);
        if (saveCredentials) {
            delete params.saveCredentials;
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
        return this.call(`auth/steam?apiKey=${this.cachedConfig.clientApiKey}`, {
            method: 'POST',
            params
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
        ref.$isModerator = ref.developerType &&
            ref.developerType !== 'none';
        ref.$isTroll = false;
        var { tags } = ref;
        if (tags.includes('admin_moderator')) {
            ref.$isModerator = true;
        }
        if (tags.includes('system_troll') ||
            tags.includes('system_probable_troll')) {
            ref.$isTroll = true;
        }
        if (tags.includes('system_legend')) {
            ref.$trustLevel = 'Legendary User';
            ref.$trustClass = 'x-tag-legendary';
        } else if (tags.includes('system_trust_legend')) {
            ref.$trustLevel = 'Veteran User';
            ref.$trustClass = 'x-tag-legend';
        } else if (tags.includes('system_trust_veteran')) {
            ref.$trustLevel = 'Trusted User';
            ref.$trustClass = 'x-tag-veteran';
        } else if (tags.includes('system_trust_trusted')) {
            ref.$trustLevel = 'Known User';
            ref.$trustClass = 'x-tag-trusted';
        } else if (tags.includes('system_trust_known')) {
            ref.$trustLevel = 'User';
            ref.$trustClass = 'x-tag-known';
        } else if (tags.includes('system_trust_basic')) {
            ref.$trustLevel = 'New User';
            ref.$trustClass = 'x-tag-basic';
        } else {
            ref.$trustLevel = 'Visitor';
            ref.$trustClass = 'x-tag-untrusted';
        }
        if (ref.$isModerator) {
            ref.$trustLevel = 'VRChat Team';
            ref.$trustClass = 'x-tag-vip';
        } else if (ref.$isTroll) {
            ref.$trustLevel = 'Nuisance';
            ref.$trustClass = 'x-tag-troll';
        }
    };

    // FIXME: it may performance issue. review here
    API.applyUserLanguage = function (ref) {
        ref.$languages = [];
        var { tags } = ref;
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
        sharedRepository.setString('current_user_status', ref.status);
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
            var { length } = userUpdateQueue;
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
            if ($app.lastLocation.location) {
                json.location = $app.lastLocation.location;
                json.$location_at = $app.lastLocation.date;
            }
            json.$online_for = API.currentUser.$online_for;
            json.$offline_for = API.currentUser.$offline_for;
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
            var $ref = { ...ref };
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
                    props[prop] = [
                        tobe,
                        asis
                    ];
                }
            }
            // FIXME
            // if the status is offline, just ignore status and statusDescription only.
            if (has &&
                (ref.status !== 'offline' && $ref.status !== 'offline')) {
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
        var { json } = args;
        this.cachedWorlds.delete(json.id);
        if ($app.worldDialog.ref.authorId === json.authorId) {
            var map = new Map();
            for (var ref of this.cachedWorlds.values()) {
                if (ref.authorId === json.authorId) {
                    map.set(ref.id, ref);
                }
            }
            var array = Array.from(map.values());
            $app.setUserDialogWorlds(array);
        }
    });

    API.$on('WORLD:SAVE', function (args) {
        var { json } = args;
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
                params
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

    // API: Friend

    API.friends200 = new Set();
    API.friends404 = new Map();
    API.isFriendsLoading = false;

    API.$on('LOGIN', function () {
        this.friends200.clear();
        this.friends404.clear();
        this.isFriendsLoading = false;
    });

    API.$on('USER', function (args) {
        this.friends200.add(args.ref.id);
        this.friends404.delete(args.ref.id);
    });

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

    API.isAllFriendsRetrived = function (flag) {
        if (flag) {
            for (var id of this.currentUser.friends) {
                if (this.friends200.has(id) === false) {
                    var n = this.friends404.get(id) || 0;
                    if (n < 2) {
                        this.friends404.set(id, n + 1);
                    }
                }
            }
        } else {
            for (var id of this.currentUser.friends) {
                if (this.friends200.has(id) === false ||
                    this.friends404.get(id) < 2) {
                    return false;
                }
            }
        }
        return true;
    };

    API.refreshFriends = function () {
        var params = {
            n: 50,
            offset: 0,
            offline: false
        };
        var N = this.currentUser.onlineFriends.length;
        if (N === 0) {
            N = this.currentUser.friends.length;
            if (N === 0 ||
                this.isAllFriendsRetrived(false)) {
                return;
            }
            params.offline = true;
        }
        if (this.isFriendsLoading) {
            return;
        }
        this.isFriendsLoading = true;
        this.bulk({
            fn: 'getFriends',
            N,
            params,
            done(ok, options) {
                if (this.isAllFriendsRetrived(params.offline)) {
                    this.isFriendsLoading = false;
                    return;
                }
                var { length } = this.currentUser.friends;
                options.N = length - params.offset;
                if (options.N <= 0) {
                    options.N = length;
                }
                params.offset = 0;
                params.offline = true;
                this.bulk(options);
            }
        });
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
        var { json } = args;
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
        var { json } = args;
        this.cachedAvatars.delete(json._id);
        if ($app.userDialog.id === json.authorId) {
            var map = new Map();
            for (var ref of this.cachedAvatars.values()) {
                if (ref.authorId === json.authorId) {
                    map.set(ref.id, ref);
                }
            }
            var array = Array.from(map.values());
            $app.setUserDialogAvatars(array);
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
            avatarId: string
        }
    */
    API.getCachedAvatar = function (params) {
        return new Promise((resolve, reject) => {
            var ref = this.cachedAvatars.get(params.avatarId);
            if (typeof ref === 'undefined') {
                this.getAvatar(params).catch(reject).then(resolve);
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

    API.$on('NOTIFICATION:ACCEPT', function (args) {
        var ref = this.cachedNotifications.get(args.params.notificationId);
        if (typeof ref === 'undefined' ||
            ref.$isDeleted) {
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
        if (typeof ref === 'undefined' &&
            ref.$isDeleted) {
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
                } catch (err) {
                }
            }
            ref.details = details;
        }
        return ref;
    };

    API.expireNotifications = function () {
        for (var ref of this.cachedNotifications.values()) {
            ref.$isExpired = true;
        }
    };

    API.deleteExpiredNotifcations = function () {
        for (var ref of this.cachedNotifications.values()) {
            if (ref.$isDeleted ||
                ref.$isExpired === false) {
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

    API.refreshNotifications = function () {
        // NOTE : 캐시 때문에 after=~ 로는 갱신이 안됨. 그래서 첨부터 불러옴
        if (this.isNotificationsLoading) {
            return;
        }
        this.isNotificationsLoading = true;
        this.expireNotifications();
        this.bulk({
            fn: 'getNotifications',
            N: -1,
            params: {
                n: 50,
                offset: 0
            },
            done(ok) {
                if (ok) {
                    this.deleteExpiredNotifcations();
                }
                this.isNotificationsLoading = false;
            }
        });
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
                params
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
                params
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
                params
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
                params
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
        return this.call(`auth/user/notifications/${params.notificationId}/accept`, {
            method: 'PUT'
        }).then((json) => {
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
        return this.call(`auth/user/notifications/${params.notificationId}/hide`, {
            method: 'PUT'
        }).then((json) => {
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
            if (ref.$isDeleted === false &&
                ref.type === 'friendRequest' &&
                ref.senderUserId === userId) {
                return ref.id;
            }
        }
        return '';
    };

    API.parseInviteLocation = function (ref) {
        try {
            var L = API.parseLocation(ref.details.worldId);
            if (L.worldId && L.instanceId) {
                return `${ref.details.worldName} #${L.instanceName} ${L.accessType}`;
            }
            return ref.message ||
                ref.details.worldId ||
                ref.details.worldName;
        } catch (err) {
            return '';
        }
    };

    // API: PlayerModeration

    API.cachedPlayerModerations = new Map();
    API.isPlayerModerationsLoading = false;

    API.$on('LOGIN', function () {
        this.cachedPlayerModerations.clear();
        $app.playerModerationTable.lastRunLength = 0;
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
        var { type, moderated } = args.params;
        var userId = this.currentUser.id;
        for (var ref of this.cachedPlayerModerations.values()) {
            if (ref.$isDeleted === false &&
                ref.type === type &&
                ref.targetUserId === moderated &&
                ref.sourceUserId === userId) {
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
            if (ref.$isDeleted ||
                ref.$isExpired === false) {
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
            this.getPlayerModerations(),
            //this.getPlayerModerationsAgainstMe();
        ]).finally(() => {
            this.isPlayerModerationsLoading = false;
        }).then(() => {
            this.deleteExpiredPlayerModerations();
            if (($app.playerModerationTable.data.length !== $app.playerModerationTable.lastRunLength) &&
                ($app.playerModerationTable.lastRunLength > 0)) {
                $app.notifyMenu('moderation');
            }
            $app.playerModerationTable.lastRunLength = $app.playerModerationTable.data.length;
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
        var { ref } = args;
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
            if (ref.$isDeleted ||
                ref.$groupKey !== key) {
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
        if (ref.$isDeleted === false &&
            ref.$groupRef === null) {
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
            if (ref.$isDeleted ||
                ref.$isExpired === false) {
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

    API.refreshFavoriteItems = function () {
        var types = {
            'world': [0, 'getFavoriteWorlds'],
            'avatar': [0, 'getFavoriteAvatars']
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
            if ((ref.type === 'avatar') && (!tags.includes(ref.tags[0]))) {
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
                                n: 50,
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
        // 96 = ['group_0', 'group_1', 'group_2'] x 32
        this.favoriteFriendGroups = [];
        for (var i = 0; i < 3; ++i) {
            this.favoriteFriendGroups.push({
                assign: false,
                key: `friend:group_${i}`,
                type: 'friend',
                name: `group_${i}`,
                displayName: `Group ${i + 1}`,
                capacity: 32,
                count: 0
            });
        }
        // 128 = ['worlds1', 'worlds2', 'worlds3', 'worlds4'] x 32
        this.favoriteWorldGroups = [];
        for (var i = 0; i < 4; ++i) {
            this.favoriteWorldGroups.push({
                assign: false,
                key: `world:worlds${i + 1}`,
                type: 'world',
                name: `worlds${i + 1}`,
                displayName: `Group ${i + 1}`,
                capacity: 32,
                count: 0
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
                count: 0
            });
        }
        var types = {
            'friend': this.favoriteFriendGroups,
            'world': this.favoriteWorldGroups,
            'avatar': this.favoriteAvatarGroups
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
                if (group.assign === false &&
                    group.name === ref.name) {
                    group.assign = true;
                    if (ref.type !== 'avatar') {
                        group.displayName = ref.displayName;
                    }
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
            if (ref.$isDeleted ||
                assigns.has(ref.id)) {
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
            if (ref.$isDeleted ||
                ref.$isExpired === false) {
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
        return this.call(`favorite/group/${params.type}/${params.group}/${this.currentUser.id}`, {
            method: 'PUT',
            params
        }).then((json) => {
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
        return this.call(`favorite/group/${params.type}/${params.group}/${this.currentUser.id}`, {
            method: 'DELETE',
            params
        }).then((json) => {
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
        if (this.webSocket === null) {
            this.getAuth();
        }
    });

    API.$on('AUTH', function (args) {
        if (args.json.ok) {
            this.connectWebSocket(args.json.token);
        }
    });

    API.$on('PIPELINE', function (args) {
        var { type, content } = args.json;
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
                $app.APILastOnline.set(content.userId, Date.now());
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

            default:
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
            var socket = new WebSocket(`wss://pipeline.vrchat.cloud/?auth=${token}`);
            socket.onclose = () => {
                if (this.webSocket === socket) {
                    this.webSocket = null;
                }
                try {
                    socket.close();
                } catch (err) {
                }
            };
            socket.onerror = socket.onclose;
            socket.onmessage = ({ data }) => {
                try {
                    var json = JSON.parse(data);
                    json.content = JSON.parse(json.content);
                    this.$emit('PIPELINE', {
                        json
                    });
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
        } catch (err) {
        }
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
        return match
            ? match[0]
            : '';
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
                var epoch = new Date(this.datetime).getTime() + (1000 * 60 * 60 * this.hours) - Date.now();
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
            this.checkAppVersion();
            API.$on('SHOW_WORLD_DIALOG', (tag) => this.showWorldDialog(tag));
            API.$on('SHOW_LAUNCH_DIALOG', (tag) => this.showLaunchDialog(tag));
            this.updateLoop();
            this.updateGameLogLoop();
            this.$nextTick(function () {
                this.$el.style.display = '';
                this.loginForm.loading = true;
                API.getConfig().catch((err) => {
                    this.loginForm.loading = false;
                    throw err;
                }).then((args) => {
                    API.getCurrentUser().finally(() => {
                        this.loginForm.loading = false;
                    });
                    return args;
                });
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

    $app.methods.checkAppVersion = async function () {
        var response = await webApiService.execute({
            url: 'https://api.github.com/repos/pypy-vrc/VRCX/releases/latest',
            method: 'GET',
            headers: {
                'User-Agent': 'VRCX'
            }
        });
        var json = JSON.parse(response.data);
        if (json === Object(json) &&
            json.name &&
            json.published_at) {
            this.latestAppVersion = `${json.name} (${formatDate(json.published_at, 'YYYY-MM-DD HH24:MI:SS')})`;
            if (json.name > this.appVersion) {
                new Noty({
                    type: 'info',
                    text: `Update available!!<br>${this.latestAppVersion}`,
                    timeout: 60000,
                    callbacks: {
                        onClick: () => AppApi.OpenLink('https://github.com/pypy-vrc/VRCX/releases')
                    }
                }).show();
                this.notifyMenu('settings');
            }
        } else {
            this.latestAppVersion = 'Error occured';
        }
    };

    $app.methods.updateLoop = function () {
        try {
            if (API.isLoggedIn === true) {
                if (--this.nextCurrentUserRefresh <= 0) {
                    this.nextCurrentUserRefresh = 60;  // 30secs
                    API.getCurrentUser().catch((err1) => {
                        throw err1;
                    });
                }
                if (--this.nextFriendsRefresh <= 0) {
                    this.nextFriendsRefresh = 7200; // 1hour
                    API.refreshFriends();
                }
                AppApi.CheckGameRunning().then(([isGameRunning, isGameNoVR]) => {
                    if (isGameRunning !== this.isGameRunning) {
                        this.isGameRunning = isGameRunning;
                        Discord.SetTimestamps(Date.now(), 0);
                    }
                    this.isGameNoVR = isGameNoVR;
                    this.updateDiscord();
                    this.updateOpenVR();
                });
            }
        } catch (err) {
            console.error(err);
        }
        setTimeout(() => this.updateLoop(), 500);
    };

    $app.data.debug = false;

    $app.data.APILastOnline = new Map();

    $app.data.sharedFeed = {
        gameLog: {
            wrist: [],
            noty: [],
            lastEntryDate: ''
        },
        feedTable: {
            wrist: [],
            noty: [],
            lastEntryDate: ''
        },
        notificationTable: {
            wrist: [],
            noty: [],
            lastEntryDate: ''
        },
        friendLogTable: {
            wrist: [],
            noty: [],
            lastEntryDate: ''
        },
        pendingUpdate: false
    };

    $app.data.appInit = false;
    $app.data.notyInit = false;

    API.$on('LOGIN', function (args) {
        sharedRepository.setArray('wristFeed', []);
        sharedRepository.setArray('notyFeed', []);
        setTimeout(function () {
            $app.appInit = true;
            $app.updateSharedFeed(true);
            $app.notyInit = true;
            sharedRepository.setBool('VRInit', true);
        }, 10000);
    });

    $app.methods.updateSharedFeed = function (forceUpdate) {
        if (!this.appInit) {
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
        wristFeed = wristFeed.concat(feeds.gameLog.wrist, feeds.feedTable.wrist, feeds.notificationTable.wrist, feeds.friendLogTable.wrist);
        var notyFeed = [];
        notyFeed = notyFeed.concat(feeds.gameLog.noty, feeds.feedTable.noty, feeds.notificationTable.noty, feeds.friendLogTable.noty);
        // OnPlayerJoining
        var locationBias = Date.now() - 30000; //30 seconds
        if ((this.isGameRunning) && (this.lastLocation.date < locationBias) &&
            ((this.sharedFeedFilters.wrist.OnPlayerJoining === 'Friends') || (this.sharedFeedFilters.wrist.OnPlayerJoining === 'VIP') ||
            (this.sharedFeedFilters.noty.OnPlayerJoining === 'Friends') || (this.sharedFeedFilters.noty.OnPlayerJoining === 'VIP'))) {
            var joiningMap = [];
            var bias = new Date(Date.now() - 120000).toJSON(); //2 minutes
            var feedTable = this.feedTable.data;
            for (var i = feedTable.length - 1; i > -1; i--) {
                var ctx = feedTable[i];
                if (ctx.created_at < bias) {
                    break;
                }
                if ((ctx.type === 'GPS') && (ctx.location[0] === this.lastLocation.location)) {
                    if (joiningMap[ctx.displayName]) {
                        continue;
                    }
                    joiningMap[ctx.displayName] = ctx.created_at;
                    if (API.cachedUsers.has(ctx.userId)) {
                        var user = API.cachedUsers.get(ctx.userId);
                        if (ctx.location[0] !== user.location) {
                            continue;
                        }
                    }
                    var playersInInstance = this.lastLocation.playerList;
                    if (playersInInstance.includes(ctx.displayName)) {
                        continue;
                    }
                    var joining = true;
                    var gameLogTable = this.gameLogTable.data;
                    for (var k = gameLogTable.length - 1; k > -1; k--) {
                        var gameLogItem = gameLogTable[k];
                        if (gameLogItem.type === 'Notification') {
                            continue;
                        }
                        if ((gameLogItem.type === 'Location') || (gameLogItem.created_at < bias)) {
                            break;
                        }
                        if ((gameLogItem.type === 'OnPlayerJoined') && (gameLogItem.data === ctx.displayName)) {
                            joining = false;
                            break;
                        }
                    }
                    if (joining) {
                        var isFriend = this.friends.has(ctx.userId);
                        var isFavorite = API.cachedFavoritesByObjectId.has(ctx.userId);
                        var onPlayerJoining = {
                            ...ctx,
                            isFriend,
                            isFavorite,
                            type: 'OnPlayerJoining'
                        };
                        if ((this.sharedFeedFilters.wrist.OnPlayerJoining === 'Friends') ||
                            ((this.sharedFeedFilters.wrist.OnPlayerJoining === 'VIP') && (isFavorite))) {
                            wristFeed.unshift(onPlayerJoining);
                        }
                        if ((this.sharedFeedFilters.noty.OnPlayerJoining === 'Friends') ||
                            ((this.sharedFeedFilters.noty.OnPlayerJoining === 'VIP') && (isFavorite))) {
                            notyFeed.unshift(onPlayerJoining);
                        }
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
        notyFeed.sort(function (a, b) {
            if (a.created_at < b.created_at) {
                return 1;
            }
            if (a.created_at > b.created_at) {
                return -1;
            }
            return 0;
        });
        notyFeed.splice(1);
        sharedRepository.setArray('wristFeed', wristFeed);
        sharedRepository.setArray('notyFeed', notyFeed);
        if (this.userDialog.visible) {
            this.applyUserDialogLocation();
        }
        if (this.worldDialog.visible) {
            this.applyWorldDialogInstances();
        }
        this.playNoty(notyFeed);
        feeds.pendingUpdate = false;
    };

    $app.methods.updateSharedFeedGameLog = function (forceUpdate) {
        // Location, OnPlayerJoined, OnPlayerLeft
        var { data } = this.gameLogTable;
        var i = data.length;
        if (i > 0) {
            if ((data[i - 1].created_at === this.sharedFeed.gameLog.lastEntryDate) &&
                (forceUpdate === false)) {
                return;
            }
            this.sharedFeed.gameLog.lastEntryDate = data[i - 1].created_at;
        } else {
            return;
        }
        var bias = new Date(Date.now() - 86400000).toJSON(); //24 hours
        var wristArr = [];
        var notyArr = [];
        var w = 0;
        var n = 0;
        var wristFilter = this.sharedFeedFilters.wrist;
        var notyFilter = this.sharedFeedFilters.noty;
        var playerCountIndex = 0;
        var playerList = [];
        var friendList = [];
        for (var i = data.length - 1; i > -1; i--) {
            var ctx = data[i];
            if (ctx.created_at < bias) {
                break;
            }
            if (ctx.type === 'Notification') {
                continue;
            }
            if ((playerCountIndex === 0) && (ctx.type === 'Location')) {
                playerCountIndex = i;
            }
            if (((ctx.type === 'OnPlayerJoined') ||
                (ctx.type === 'OnPlayerLeft') ||
                (ctx.type === 'PortalSpawn')) &&
                (ctx.data === API.currentUser.displayName)) {
                continue;
            }
            // on Location change remove OnPlayerJoined
            if (ctx.type === 'Location') {
                var locationBias = new Date(Date.parse(ctx.created_at) + 15000).toJSON(); //15 seconds
                if (this.hideOnPlayerJoined) {
                    for (var k = w - 1; k > -1; k--) {
                        var feedItem = wristArr[k];
                        if ((feedItem.created_at > locationBias) || (feedItem.type === 'Location')) {
                        break;
                    }
                    if (feedItem.type === 'OnPlayerJoined') {
                        wristArr.splice(k, 1);
                            w--;
                        }
                    }
                }
                for (var k = n - 1; k > -1; k--) {
                    var feedItem = notyArr[k];
                    if (feedItem.created_at > locationBias) {
                        break;
                    }
                    if (feedItem.type === 'OnPlayerJoined') {
                        notyArr.splice(k, 1);
                        n--;
                    }
                }
            }
            var isFriend = false;
            var isFavorite = false;
            if ((ctx.type === 'OnPlayerJoined') ||
                (ctx.type === 'OnPlayerLeft') ||
                (ctx.type === 'PortalSpawn')) {
                for (var ref of API.cachedUsers.values()) {
                    if (ref.displayName === ctx.data) {
                        isFriend = this.friends.has(ref.id);
                        isFavorite = API.cachedFavoritesByObjectId.has(ref.id);
                        break;
                    }
                }
            }
            if ((w < 20) && (wristFilter[ctx.type]) &&
                ((wristFilter[ctx.type] === 'On') ||
                (wristFilter[ctx.type] === 'Everyone') ||
                ((wristFilter[ctx.type] === 'Friends') && (isFriend)) ||
                ((wristFilter[ctx.type] === 'VIP') && (isFavorite)))) {
                wristArr.push({
                    ...ctx,
                    isFriend,
                    isFavorite
                });
                ++w;
            }
            if ((n < 1) && (notyFilter[ctx.type]) &&
                ((notyFilter[ctx.type] === 'On') ||
                (notyFilter[ctx.type] === 'Everyone') ||
                ((notyFilter[ctx.type] === 'Friends') && (isFriend)) ||
                ((notyFilter[ctx.type] === 'VIP') && (isFavorite)))) {
                notyArr.push({
                    ...ctx,
                    isFriend,
                    isFavorite
                });
                ++n;
            }
        }
        // instance player list
        for (var i = playerCountIndex + 1; i < data.length; i++) {
            var ctx = data[i];
            if (ctx.type === 'OnPlayerJoined') {
                playerList.push(ctx.data);
                var isFriend = false;
                for (var ref of API.cachedUsers.values()) {
                    if (ref.displayName === ctx.data) {
                        isFriend = this.friends.has(ref.id);
                        break;
                    }
                }
                if (isFriend) {
                    friendList.push(ctx.data);
                }
            }
            if (ctx.type === 'OnPlayerLeft') {
                var index = playerList.indexOf(ctx.data);
                if (index > -1) {
                    playerList.splice(index, 1);
                }
                var index = friendList.indexOf(ctx.data);
                if (index > -1) {
                    friendList.splice(index, 1);
                }
            }
        }
        if (this.isGameRunning) {
            this.lastLocation.playerList = playerList;
            this.lastLocation.friendList = friendList;
            sharedRepository.setObject('last_location', this.lastLocation);
        }
        this.sharedFeed.gameLog.wrist = wristArr;
        this.sharedFeed.gameLog.noty = notyArr;
        this.sharedFeed.pendingUpdate = true;
    };

    $app.methods.updateSharedFeedFeedTable = function (forceUpdate) {
        // GPS, Online, Offline, Status, Avatar
        var { data } = this.feedTable;
        var i = data.length;
        if (i > 0) {
            if ((data[i - 1].created_at === this.sharedFeed.feedTable.lastEntryDate) &&
                (forceUpdate === false)) {
                return;
            }
            this.sharedFeed.feedTable.lastEntryDate = data[i - 1].created_at;
        } else {
            return;
        }
        var bias = new Date(Date.now() - 86400000).toJSON(); //24 hours
        var wristArr = [];
        var notyArr = [];
        var w = 0;
        var n = 0;
        var wristFilter = this.sharedFeedFilters.wrist;
        var notyFilter = this.sharedFeedFilters.noty;
        for (var i = data.length - 1; i > -1; i--) {
            var ctx = data[i];
            if (ctx.created_at < bias) {
                break;
            }
            if (ctx.type === 'Avatar') {
                continue;
            }
            // hide private worlds from feeds
            if ((this.hidePrivateFromFeed) &&
                (ctx.type === 'GPS') && (ctx.location[0] === 'private')) {
                continue;
            }
            var isFriend = this.friends.has(ctx.userId);
            var isFavorite = API.cachedFavoritesByObjectId.has(ctx.userId);
            if ((w < 20) && (wristFilter[ctx.type]) &&
                ((wristFilter[ctx.type] === 'Friends') ||
                ((wristFilter[ctx.type] === 'VIP') && (isFavorite)))) {
                wristArr.push({
                    ...ctx,
                    isFriend,
                    isFavorite
                });
                ++w;
            }
            if ((n < 1) && (notyFilter[ctx.type]) &&
                ((notyFilter[ctx.type] === 'Friends') ||
                ((notyFilter[ctx.type] === 'VIP') && (isFavorite)))) {
                notyArr.push({
                    ...ctx,
                    isFriend,
                    isFavorite
                });
                ++n;
            }
        }
        this.sharedFeed.feedTable.wrist = wristArr;
        this.sharedFeed.feedTable.noty = notyArr;
        this.sharedFeed.pendingUpdate = true;
    };

    $app.methods.updateSharedFeedNotificationTable = function (forceUpdate) {
        // invite, requestInvite, requestInviteResponse, inviteResponse, friendRequest
        var { data } = this.notificationTable;
        var i = data.length;
        if (i > 0) {
            if ((data[i - 1].created_at === this.sharedFeed.notificationTable.lastEntryDate) &&
                (forceUpdate === false)) {
                return;
            }
            this.sharedFeed.notificationTable.lastEntryDate = data[i - 1].created_at;
        } else {
            return;
        }
        var bias = new Date(Date.now() - 86400000).toJSON(); //24 hours
        var wristArr = [];
        var notyArr = [];
        var w = 0;
        var n = 0;
        var wristFilter = this.sharedFeedFilters.wrist;
        var notyFilter = this.sharedFeedFilters.noty;
        for (var i = data.length - 1; i > -1; i--) {
            var ctx = data[i];
            if (ctx.created_at < bias) {
                break;
            }
            if (ctx.senderUserId === API.currentUser.id) {
                continue;
            }
            var isFriend = this.friends.has(ctx.senderUserId);
            var isFavorite = API.cachedFavoritesByObjectId.has(ctx.senderUserId);
            if ((w < 20) && (wristFilter[ctx.type]) &&
                ((wristFilter[ctx.type] === 'On') ||
                (wristFilter[ctx.type] === 'Friends') ||
                ((wristFilter[ctx.type] === 'VIP') && (isFavorite)))) {
                wristArr.push({
                    ...ctx,
                    isFriend,
                    isFavorite
                });
                ++w;
            }
            if ((n < 1) && (notyFilter[ctx.type]) &&
                ((notyFilter[ctx.type] === 'On') ||
                (notyFilter[ctx.type] === 'Friends') ||
                ((notyFilter[ctx.type] === 'VIP') && (isFavorite)))) {
                notyArr.push({
                    ...ctx,
                    isFriend,
                    isFavorite
                });
                ++n;
            }
        }
        this.sharedFeed.notificationTable.wrist = wristArr;
        this.sharedFeed.notificationTable.noty = notyArr;
        this.sharedFeed.pendingUpdate = true;
    };

    $app.methods.updateSharedFeedFriendLogTable = function (forceUpdate) {
        // TrustLevel, Friend, FriendRequest, Unfriend, DisplayName
        var { data } = this.friendLogTable;
        var i = data.length;
        if (i > 0) {
            if ((data[i - 1].created_at === this.sharedFeed.friendLogTable.lastEntryDate) &&
                (forceUpdate === false)) {
                return;
            }
            this.sharedFeed.friendLogTable.lastEntryDate = data[i - 1].created_at;
        } else {
            return;
        }
        var bias = new Date(Date.now() - 86400000).toJSON(); //24 hours
        var wristArr = [];
        var notyArr = [];
        var w = 0;
        var n = 0;
        var wristFilter = this.sharedFeedFilters.wrist;
        var notyFilter = this.sharedFeedFilters.noty;
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
            if ((w < 20) && (wristFilter[ctx.type]) &&
                ((wristFilter[ctx.type] === 'On') ||
                (wristFilter[ctx.type] === 'Friends') ||
                ((wristFilter[ctx.type] === 'VIP') && (isFavorite)))) {
                wristArr.push({
                    ...ctx,
                    isFriend,
                    isFavorite
                });
                ++w;
            }
            if ((n < 1) && (notyFilter[ctx.type]) &&
                ((notyFilter[ctx.type] === 'On') ||
                (notyFilter[ctx.type] === 'Friends') ||
                ((notyFilter[ctx.type] === 'VIP') && (isFavorite)))) {
                notyArr.push({
                    ...ctx,
                    isFriend,
                    isFavorite
                });
                ++n;
            }
        }
        this.sharedFeed.friendLogTable.wrist = wristArr;
        this.sharedFeed.friendLogTable.noty = notyArr;
        this.sharedFeed.pendingUpdate = true;
    };

    $app.data.notyMap = [];

    $app.methods.playNoty = function (notyFeed) {
        var playNotificationTTS = false;
        if ((this.notificationTTS === 'Always') ||
            ((this.notificationTTS === 'Outside VR') && ((this.isGameNoVR) || (!this.isGameRunning))) ||
            ((this.notificationTTS === 'Inside VR') && (!this.isGameNoVR) && (this.isGameRunning)) ||
            ((this.notificationTTS === 'Game Closed') && (!this.isGameRunning)) ||
            ((this.notificationTTS === 'Desktop Mode') && (this.isGameNoVR) && (this.isGameRunning))) {
            playNotificationTTS = true;
        }
        var playDesktopToast = false;
        if ((this.desktopToast === 'Always') ||
            ((this.desktopToast === 'Outside VR') && ((this.isGameNoVR) || (!this.isGameRunning))) ||
            ((this.desktopToast === 'Inside VR') && (!this.isGameNoVR) && (this.isGameRunning)) ||
            ((this.desktopToast === 'Game Closed') && (!this.isGameRunning)) ||
            ((this.desktopToast === 'Desktop Mode') && (this.isGameNoVR) && (this.isGameRunning))) {
            playDesktopToast = true;
        }
        var playXSNotification = false;
        if ((this.xsNotifications) && (this.isGameRunning) && (!this.isGameNoVR)) {
            playXSNotification = true;
        }
        if ((this.currentUserStatus === 'busy') ||
            (!this.notyInit)) {
            return;
        }
        var notyToPlay = [];
        notyFeed.forEach((feed) => {
            var displayName = '';
            if (feed.displayName) {
                displayName = feed.displayName;
            } else if (feed.senderUsername) {
                displayName = feed.senderUsername;
            } else if (feed.sourceDisplayName) {
                displayName = feed.sourceDisplayName;
            } else if (feed.data) {
                displayName = feed.data;
            } else {
                console.error('missing displayName');
            }
            if ((displayName) && (!this.notyMap[displayName]) ||
                (this.notyMap[displayName] < feed.created_at)) {
                this.notyMap[displayName] = feed.created_at;
                notyToPlay.push(feed);
            }
        });
        var bias = new Date(Date.now() - 60000).toJSON();
        var noty = {};
        var messageList = ['inviteMessage', 'requestMessage', 'responseMessage'];
        for (var i = 0; i < notyToPlay.length; i++) {
            noty = notyToPlay[i];
            if (noty.created_at < bias) {
                continue;
            }
            var message = '';
            for (var k = 0; k < messageList.length; k++) {
                if (typeof noty.details !== 'undefined' && typeof noty.details[messageList[k]] !== 'undefined') {
                    message = noty.details[messageList[k]];
                }
            }
            if (message) {
                message = `, ${message}`;
            }
            if (playNotificationTTS) {
                this.playNotyTTS(noty, message);
            }
            if ((playDesktopToast) || (playXSNotification)) {
                this.notyGetImage(noty).then((image) => {
                    if (playXSNotification) {
                        this.displayXSNotification(noty, message, image);
                    }
                    if (playDesktopToast) {
                        this.displayDesktopToast(noty, message, image);
                    }
                });
            }
        }
    };

    $app.methods.notyGetImage = async function (noty) {
        var imageURL = '';
        var userId = '';
        if (noty.userId) {
            userId = noty.userId;
        } else if (noty.senderUserId) {
            userId = noty.senderUserId;
        } else if (noty.sourceUserId) {
            userId = noty.sourceUserId;
        } else if (noty.data) {
            for (var ref of API.cachedUsers.values()) {
                if (ref.displayName === noty.data) {
                    userId = ref.id;
                    break;
                }
            }
        }
        if ((noty.details) && (noty.details.imageUrl)) {
            imageURL = noty.details.imageUrl;
        } else if (userId) {
            imageURL = await API.getCachedUser({
                userId: userId
            }).catch((err) => {
                console.error(err);
                return false;
            }).then((args) => {
                if ((this.displayVRCPlusIconsAsAvatar) && (args.json.userIcon)) {
                    return args.json.userIcon;
                }
                return args.json.currentAvatarThumbnailImageUrl;
            });
        }
        if (!imageURL) {
            return false;
        }
        try {
            await fetch(imageURL, {
                method: 'GET',
                redirect: 'follow',
                headers: {
                    'User-Agent': appVersion
                }
            }).then(response => {
                return response.arrayBuffer();
            }).then(buffer => {
                var binary = '';
                var bytes = new Uint8Array(buffer);
                var length = bytes.byteLength;
                for (var i = 0; i < length; i++) {
                    binary += String.fromCharCode(bytes[i]);
                }
                var imageData = btoa(binary);
                AppApi.CacheImage(imageData);
            });
            return true;
        } catch (err) {
            console.error(err);
            return false;
        }
    };

    $app.methods.playNotyTTS = async function (noty, message) {
        switch (noty.type) {
            case 'OnPlayerJoined':
                this.speak(`${noty.data} has joined`);
                break;
            case 'OnPlayerLeft':
                this.speak(`${noty.data} has left`);
                break;
            case 'OnPlayerJoining':
                this.speak(`${noty.displayName} is joining`);
                break;
            case 'GPS':
                this.speak(`${noty.displayName} is in ${await this.displayLocation(noty.location[0])}`);
                break;
            case 'Online':
                this.speak(`${noty.displayName} has logged in`);
                break;
            case 'Offline':
                this.speak(`${noty.displayName} has logged out`);
                break;
            case 'Status':
                this.speak(`${noty.displayName} status is now ${noty.status[0].status} ${noty.status[0].statusDescription}`);
                break;
            case 'invite':
                this.speak(`${noty.senderUsername} has invited you to ${noty.details.worldName}${message}`);
                break;
            case 'requestInvite':
                this.speak(`${noty.senderUsername} has requested an invite${message}`);
                break;
            case 'inviteResponse':
                this.speak(`${noty.senderUsername} has responded to your invite${message}`);
                break;
            case 'requestInviteResponse':
                this.speak(`${noty.senderUsername} has responded to your invite request${message}`);
                break;
            case 'friendRequest':
                this.speak(`${noty.senderUsername} has sent you a friend request`);
                break;
            case 'Friend':
                this.speak(`${noty.displayName} is now your friend`);
                break;
            case 'Unfriend':
                this.speak(`${noty.displayName} is no longer your friend`);
                break;
            case 'TrustLevel':
                this.speak(`${noty.displayName} trust level is now ${noty.trustLevel}`);
                break;
            case 'DisplayName':
                this.speak(`${noty.previousDisplayName} changed their name to ${noty.displayName}`);
                break;
            case 'PortalSpawn':
                this.speak(`${noty.data} has spawned a portal`);
                break;
            case 'Event':
                this.speak(noty.data);
                break;
            case 'VideoPlay':
                this.speak(`Now playing: ${noty.data}`);
                break;
            default:
                break;
        }
    };

    $app.methods.displayXSNotification = async function (noty, message, image) {
        var timeout = parseInt(parseInt(this.notificationTimeout) / 1000);
        switch (noty.type) {
            case 'OnPlayerJoined':
                AppApi.XSNotification('VRCX', `${noty.data} has joined`, timeout, image);
                break;
            case 'OnPlayerLeft':
                AppApi.XSNotification('VRCX', `${noty.data} has left`, timeout, image);
                break;
            case 'OnPlayerJoining':
                AppApi.XSNotification('VRCX', `${noty.displayName} is joining`, timeout, image);
                break;
            case 'GPS':
                AppApi.XSNotification('VRCX', `${noty.displayName} is in ${await this.displayLocation(noty.location[0])}`, timeout, image);
                break;
            case 'Online':
                AppApi.XSNotification('VRCX', `${noty.displayName} has logged in`, timeout, image);
                break;
            case 'Offline':
                AppApi.XSNotification('VRCX', `${noty.displayName} has logged out`, timeout, image);
                break;
            case 'Status':
                AppApi.XSNotification('VRCX', `${noty.displayName} status is now ${noty.status[0].status} ${noty.status[0].statusDescription}`, timeout, image);
                break;
            case 'invite':
                AppApi.XSNotification('VRCX', `${noty.senderUsername} has invited you to ${noty.details.worldName}${message}`, timeout, image);
                break;
            case 'requestInvite':
                AppApi.XSNotification('VRCX', `${noty.senderUsername} has requested an invite${message}`, timeout, image);
                break;
            case 'inviteResponse':
                AppApi.XSNotification('VRCX', `${noty.senderUsername} has responded to your invite${message}`, timeout, image);
                break;
            case 'requestInviteResponse':
                AppApi.XSNotification('VRCX', `${noty.senderUsername} has responded to your invite request${message}`, timeout, image);
                break;
            case 'friendRequest':
                AppApi.XSNotification('VRCX', `${noty.senderUsername} has sent you a friend request`, timeout, image);
                break;
            case 'Friend':
                AppApi.XSNotification('VRCX', `${noty.displayName} is now your friend`, timeout, image);
                break;
            case 'Unfriend':
                AppApi.XSNotification('VRCX', `${noty.displayName} is no longer your friend`, timeout, image);
                break;
            case 'TrustLevel':
                AppApi.XSNotification('VRCX', `${noty.displayName} trust level is now ${noty.trustLevel}`, timeout, image);
                break;
            case 'DisplayName':
                AppApi.XSNotification('VRCX', `${noty.previousDisplayName} changed their name to ${noty.displayName}`, timeout, image);
                break;
            case 'PortalSpawn':
                AppApi.XSNotification('VRCX', `${noty.data} has spawned a portal`, timeout, image);
                break;
            case 'Event':
                AppApi.XSNotification('VRCX', noty.data, timeout, image);
                break;
            case 'VideoPlay':
                AppApi.XSNotification('VRCX', `Now playing: ${noty.data}`, timeout, image);
                break;
            default:
                break;
        }
    };

    $app.methods.displayDesktopToast = async function (noty, message, image) {
        switch (noty.type) {
            case 'OnPlayerJoined':
                AppApi.DesktopNotification(noty.data, 'has joined', image);
                break;
            case 'OnPlayerLeft':
                AppApi.DesktopNotification(noty.data, 'has left', image);
                break;
            case 'OnPlayerJoining':
                AppApi.DesktopNotification(noty.displayName, 'is joining', image);
                break;
            case 'GPS':
                AppApi.DesktopNotification(noty.displayName, `is in ${await this.displayLocation(noty.location[0])}`, image);
                break;
            case 'Online':
                AppApi.DesktopNotification(noty.displayName, 'has logged in', image);
                break;
            case 'Offline':
                AppApi.DesktopNotification(noty.displayName, 'has logged out', image);
                break;
            case 'Status':
                AppApi.DesktopNotification(noty.displayName, `status is now ${noty.status[0].status} ${noty.status[0].statusDescription}`, image);
                break;
            case 'invite':
                AppApi.DesktopNotification(noty.senderUsername, `has invited you to ${noty.details.worldName}${message}`, image);
                break;
            case 'requestInvite':
                AppApi.DesktopNotification(noty.senderUsername, `has requested an invite${message}`, image);
                break;
            case 'inviteResponse':
                AppApi.DesktopNotification(noty.senderUsername, `has responded to your invite${message}`, image);
                break;
            case 'requestInviteResponse':
                AppApi.DesktopNotification(noty.senderUsername, `has responded to your invite request${message}`, image);
                break;
            case 'friendRequest':
                AppApi.DesktopNotification(noty.senderUsername, 'has sent you a friend request', image);
                break;
            case 'Friend':
                AppApi.DesktopNotification(noty.displayName, 'is now your friend', image);
                break;
            case 'Unfriend':
                AppApi.DesktopNotification(noty.displayName, 'is no longer your friend', image);
                break;
            case 'TrustLevel':
                AppApi.DesktopNotification(noty.displayName, `trust level is now ${noty.trustLevel}`, image);
                break;
            case 'DisplayName':
                AppApi.DesktopNotification(noty.previousDisplayName, `changed their name to ${noty.displayName}`, image);
                break;
            case 'PortalSpawn':
                AppApi.DesktopNotification(noty.data, `has spawned a portal`, image);
                break;
            case 'Event':
                AppApi.DesktopNotification('Event', noty.data, image);
                break;
            case 'VideoPlay':
                AppApi.DesktopNotification('Now playing', noty.data, image);
                break;
            default:
                break;
        }
    };

    $app.methods.displayLocation = async function (location) {
        var text = '';
        var L = API.parseLocation(location);
        if (L.isOffline) {
            text = 'Offline';
        } else if (L.isPrivate) {
            text = 'Private';
        } else if (L.worldId) {
            var ref = API.cachedWorlds.get(L.worldId);
            if (typeof ref === 'undefined') {
                await API.getWorld({
                    worldId: L.worldId
                }).then((args) => {
                    if (L.tag === location) {
                        if (L.instanceId) {
                            text = `${args.json.name} ${L.accessType}`;
                        } else {
                            text = args.json.name;
                        }
                    }
                });
            } else if (L.instanceId) {
                text = `${ref.name} ${L.accessType}`;
            } else {
                text = ref.name;
            }
        }
        return text;
    };

    $app.methods.notifyMenu = function (index) {
        var { menu } = this.$refs;
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
    };

    $app.methods.promptTOTP = function () {
        this.$prompt('Enter a numeric code from your authenticator app', 'Two-factor Authentication', {
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
                    }).catch((err) => {
                        this.promptTOTP();
                        throw err;
                    }).then((args) => {
                        API.getCurrentUser();
                        return args;
                    });
                } else if (action === 'cancel') {
                    this.promptOTP();
                }
            }
        });
    };

    $app.methods.promptOTP = function () {
        this.$prompt('Enter one of your saved recovery codes', 'Two-factor Authentication', {
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
                    }).catch((err) => {
                        this.promptOTP();
                        throw err;
                    }).then((args) => {
                        API.getCurrentUser();
                        return args;
                    });
                } else if (action === 'cancel') {
                    this.promptTOTP();
                }
            }
        });
    };

    $app.methods.showExportFriendsListDialog = function () {
        var { friends } = API.currentUser;
        if (Array.isArray(friends) === false) {
            return;
        }
        var lines = [
            'UserID,DisplayName,Memo'
        ];
        var _ = function (str) {
            if (/[\x00-\x1f,"]/.test(str) === true) {
                str = `"${str.replace(/"/g, '""')}"`;
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

    API.$on('USER:2FA', function () {
        $app.promptTOTP();
    });

    API.$on('LOGOUT', function () {
        new Noty({
            type: 'success',
            text: `See you again, <strong>${escapeTag(this.currentUser.displayName)}</strong>!`
        }).show();
    });

    API.$on('LOGIN', function (args) {
        new Noty({
            type: 'success',
            text: `Hello there, <strong>${escapeTag(args.ref.displayName)}</strong>!`
        }).show();
        $app.$refs.menu.activeIndex = 'feed';
        $app.resetGameLog();
    });

    API.$on('LOGIN', function (args) {
        $app.updateStoredUser(args.ref);
    });

    API.$on('LOGOUT', function () {
        $app.updateStoredUser(this.currentUser);
    });

    $app.methods.updateStoredUser = function (currentUser) {
        var savedCredentialsArray = {};
        if (configRepository.getString('savedCredentials') !== null) {
            var savedCredentialsArray = JSON.parse(configRepository.getString('savedCredentials'));
        }
        if (this.saveCredentials) {
            var credentialsToSave = { user: currentUser, loginParmas: this.saveCredentials };
            savedCredentialsArray[currentUser.username] = credentialsToSave;
            delete this.saveCredentials;
        } else if (typeof savedCredentialsArray[currentUser.username] !== 'undefined') {
            savedCredentialsArray[currentUser.username].user = currentUser;
        }
        this.loginForm.savedCredentials = savedCredentialsArray;
        var jsonCredentialsArray = JSON.stringify(savedCredentialsArray);
        configRepository.setString('savedCredentials', jsonCredentialsArray);
        this.loginForm.lastUserLoggedIn = currentUser.username;
        configRepository.setString('lastUserLoggedIn', currentUser.username);
    };

    $app.methods.relogin = function (loginParmas) {
        this.loginForm.loading = true;
        return API.getConfig().catch((err) => {
            this.loginForm.loading = false;
            throw err;
        }).then(() => {
            API.login({
                username: loginParmas.username,
                password: loginParmas.password
            }).catch((err2) => {
                API.logout();
                throw err2;
            }).finally(() => {
                this.loginForm.loading = false;
            });
        });
    };

    $app.methods.deleteSavedLogin = function (username) {
        var savedCredentialsArray = JSON.parse(configRepository.getString('savedCredentials'));
        delete savedCredentialsArray[username];
        $app.loginForm.savedCredentials = savedCredentialsArray;
        var jsonCredentialsArray = JSON.stringify(savedCredentialsArray);
        configRepository.setString('savedCredentials', jsonCredentialsArray);
        new Noty({
            type: 'success',
            text: 'Account removed.'
        }).show();
    };

    API.$on('AUTOLOGIN', function () {
        var user = $app.loginForm.savedCredentials[$app.loginForm.lastUserLoggedIn];
        if (typeof user !== 'undefined') {
            $app.relogin({
                username: user.loginParmas.username,
                password: user.loginParmas.password
            }).then(() => {
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
        savedCredentials: ((configRepository.getString('lastUserLoggedIn') !== null)
            ? JSON.parse(configRepository.getString('savedCredentials'))
            : {}),
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
            if (valid &&
                !this.loginForm.loading) {
                this.loginForm.loading = true;
                API.getConfig().catch((err) => {
                    this.loginForm.loading = false;
                    throw err;
                }).then((args) => {
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
            AppApi.LoginWithSteam().catch((err) => {
                this.loginForm.loading = false;
                throw err;
            }).then((steamTicket) => {
                if (steamTicket) {
                    API.getConfig().catch((err) => {
                        this.loginForm.loading = false;
                        throw err;
                    }).then((args) => {
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

    $app.methods.loadMemo = function (id) {
        var key = `memo_${id}`;
        return VRCXStorage.Get(key);
    };

    $app.methods.saveMemo = function (id, memo) {
        var key = `memo_${id}`;
        if (memo) {
            VRCXStorage.Set(key, String(memo));
        } else {
            VRCXStorage.Remove(key);
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
    $app.data.orderFriendsGroup0 = configRepository.getBool('orderFriendGroup0');
    $app.data.orderFriendsGroup1 = configRepository.getBool('orderFriendGroup1');
    $app.data.orderFriendsGroup2 = configRepository.getBool('orderFriendGroup2');
    $app.data.orderFriendsGroup3 = configRepository.getBool('orderFriendGroup3');
    var saveOrderFriendGroup = function () {
        configRepository.setBool('orderFriendGroup0', this.orderFriendsGroup0);
        configRepository.setBool('orderFriendGroup1', this.orderFriendsGroup1);
        configRepository.setBool('orderFriendGroup2', this.orderFriendsGroup2);
        configRepository.setBool('orderFriendGroup3', this.orderFriendsGroup3);
    };
    $app.watch.orderFriendsGroup0 = saveOrderFriendGroup;
    $app.watch.orderFriendsGroup1 = saveOrderFriendGroup;
    $app.watch.orderFriendsGroup2 = saveOrderFriendGroup;
    $app.watch.orderFriendsGroup3 = saveOrderFriendGroup;

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
        if (Array.isArray(ref.activeFriends) === false || !this.appInit) {
            return;
        }
        for (var userId of ref.activeFriends) {
            if (this.pendingActiveFriends.has(userId)) {
                continue;
            }
            var user = API.cachedUsers.get(userId);
            if (typeof user !== 'undefined' &&
                user.status !== 'offline') {
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
        // initFriendship()이 LOGIN에서 처리되기 때문에
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
        $app.updateFriend(args.params.userId, args.json.state);
    });

    API.$on('FAVORITE', function (args) {
        $app.updateFriend(args.ref.favoriteId);
    });

    API.$on('FAVORITE:@DELETE', function (args) {
        $app.updateFriend(args.ref.favoriteId);
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
            memo: this.loadMemo(id)
        };
        if (typeof ref === 'undefined') {
            ref = this.friendLog[id];
            if (typeof ref !== 'undefined' &&
                ref.displayName) {
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

    $app.methods.updateFriend = async function (id, state, origin) {
        var ctx = this.friends.get(id);
        if (typeof ctx === 'undefined') {
            return;
        }
        var ref = API.cachedUsers.get(id);
        var isVIP = API.cachedFavoritesByObjectId.has(id);
        if (typeof state === 'undefined' ||
            ctx.state === state) {
            // this is should be: undefined -> user
            if (ctx.ref !== ref) {
                ctx.ref = ref;
                // NOTE
                // AddFriend (CurrentUser) 이후,
                // 서버에서 오는 순서라고 보면 될 듯.
                if (ctx.state === 'online') {
                    if (this.appInit) {
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
            if (typeof ref !== 'undefined' &&
                ctx.name !== ref.displayName) {
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
            if (origin &&
                ctx.state !== 'online' &&
                typeof ref !== 'undefined' &&
                ref.location !== '' &&
                ref.location !== 'offline' &&
                ref.location !== 'private') {
                API.getUser({
                    userId: id
                });
            }
        } else {
            if (ctx.state === 'online' && state === 'active') {
                await new Promise(resolve => setTimeout(resolve, 50000));
                if (this.APILastOnline.has(id)) {
                    var date = this.APILastOnline.get(id);
                    if (date > Date.now() - 60000) {
                        return;
                    }
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
            // changing property triggers Vue
            // so, we need compare and set
            if (ctx.state !== state) {
                ctx.state = state;
            }
            if (ctx.isVIP !== isVIP) {
                ctx.isVIP = isVIP;
            }
            if (typeof ref !== 'undefined') {
                if (ctx.ref !== ref) {
                    ctx.ref = ref;
                }
                if (ctx.name !== ref.displayName) {
                    ctx.name = ref.displayName;
                }
            }
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
            if (typeof ctx.ref !== 'undefined') {
                if ((ctx.ref.$offline_for === '') &&
                    ((ctx.state === 'offline') && ctx.ref.state === '') ||
                    (((ctx.state === 'offline') || (ctx.state === 'active')) &&
                        ((ctx.ref.state === 'online')))) {
                    ctx.ref.$online_for = '';
                    ctx.ref.$offline_for = Date.now();
                }
                if (ctx.state === 'online') {
                    ctx.ref.$location_at = Date.now();
                    ctx.ref.$online_for = Date.now();
                    ctx.ref.$offline_for = '';
                    API.getUser({
                        userId: id
                    });
                }
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

    // ascending
    var compareByDisplayName = function (a, b) {
        var A = String(a.displayName).toUpperCase();
        var B = String(b.displayName).toUpperCase();
        if (A < B) {
            return -1;
        }
        if (A > B) {
            return 1;
        }
        return 0;
    };

    // VIP friends
    $app.computed.friendsGroup0 = function () {
        if (this.orderFriendsGroup0) {
            return this.friendsGroupA_;
        }
        if (this.sortFriendsGroup0) {
            this.sortFriendsGroup0 = false;
            this.friendsGroup0_.sort(compareByName);
        }
        return this.friendsGroup0_;
    };

    // Online friends
    $app.computed.friendsGroup1 = function () {
        if (this.orderFriendsGroup1) {
            return this.friendsGroupB_;
        }
        if (this.sortFriendsGroup1) {
            this.sortFriendsGroup1 = false;
            this.friendsGroup1_.sort(compareByName);
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
            if ((!user.isFriend) && (id) && (id !== API.currentUser.id)) {
                return;
            }
            //temp fix
            if ((user.status !== 'active') && (id) && (id !== API.currentUser.id) &&
                (!this.friendsGroup0_.filter(e => e.id === id).length > 0) &&
                (!this.friendsGroup1_.filter(e => e.id === id).length > 0)) {
                // Offline
                style.offline = true;
            } else if ((user.location === 'offline') ||
                ((user.state === 'active') && (user.location === 'private'))) {
                // Offline
                style.offline = true;
            } else if (user.status === 'active') {
                // Online
                style.active = true;
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
                    match = uname.toUpperCase().includes(QUERY) &&
                        !uname.startsWith('steam_');
                }
                if (!match &&
                    ctx.memo) {
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
                filterFn: (row, filter) => filter.value.some((v) => v === row.type)
            },
            {
                prop: 'displayName',
                value: ''
            },
            {
                prop: 'userId',
                value: false,
                filterFn: (row, filter) => !filter.value ||
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
            pageSizes: [
                10,
                25,
                50,
                100
            ]
        }
    };

    API.$on('LOGIN', function (args) {
        $app.feedTable.data = VRCXStorage.GetArray(`${args.ref.id}_feedTable`);
        $app.sweepFeed();
    });

    API.$on('USER:UPDATE', function (args) {
        var { ref, props } = args;
        if ($app.friends.has(ref.id) === false) {
            return;
        }
        if (props.location) {
            if (props.location[0] === 'offline') {
                $app.addFeed('Offline', ref, {
                    location: props.location[1],
                    time: props.location[2]
                });
            } else if (props.location[1] === 'offline') {
                $app.addFeed('Online', ref, {
                    location: props.location[0]
                });
            } else {
                $app.addFeed('GPS', ref, {
                    location: [
                        props.location[0],
                        props.location[1]
                    ],
                    time: props.location[2]
                });
            }
        }
        if (props.currentAvatarImageUrl ||
            props.currentAvatarThumbnailImageUrl) {
            $app.addFeed('Avatar', ref, {
                avatar: [
                    {
                        currentAvatarImageUrl: props.currentAvatarImageUrl
                            ? props.currentAvatarImageUrl[0]
                            : ref.currentAvatarImageUrl,
                        currentAvatarThumbnailImageUrl: props.currentAvatarThumbnailImageUrl
                            ? props.currentAvatarThumbnailImageUrl[0]
                            : ref.currentAvatarThumbnailImageUrl
                    },
                    {
                        currentAvatarImageUrl: props.currentAvatarImageUrl
                            ? props.currentAvatarImageUrl[1]
                            : ref.currentAvatarImageUrl,
                        currentAvatarThumbnailImageUrl: props.currentAvatarThumbnailImageUrl
                            ? props.currentAvatarThumbnailImageUrl[1]
                            : ref.currentAvatarThumbnailImageUrl
                    }
                ]
            });
        }
        if (props.status ||
            props.statusDescription) {
            $app.addFeed('Status', ref, {
                status: [
                    {
                        status: props.status
                            ? props.status[0]
                            : ref.status,
                        statusDescription: props.statusDescription
                            ? props.statusDescription[0]
                            : ref.statusDescription
                    },
                    {
                        status: props.status
                            ? props.status[1]
                            : ref.status,
                        statusDescription: props.statusDescription
                            ? props.statusDescription[1]
                            : ref.statusDescription
                    }
                ]
            });
        }
    });

    var saveFeedTimer = null;
    $app.methods.saveFeed = function () {
        if (saveFeedTimer !== null) {
            return;
        }
        saveFeedTimer = setTimeout(() => {
            saveFeedTimer = null;
            VRCXStorage.SetArray(`${API.currentUser.id}_feedTable`, this.feedTable.data);
        }, 1);
    };

    $app.methods.addFeed = function (type, ref, extra) {
        this.feedTable.data.push({
            created_at: new Date().toJSON(),
            type,
            userId: ref.id,
            displayName: ref.displayName,
            ...extra
        });
        this.sweepFeed();
        this.saveFeed();
        this.updateSharedFeed(false);
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
                    T.data = T.data.filter((row) => !T.filters.every((filter) => {
                        if (filter.value) {
                            if (!Array.isArray(filter.value)) {
                                if (filter.filterFn) {
                                    return filter.filterFn(row, filter);
                                }
                                return String(row[filter.prop]).toUpperCase().includes(String(filter.value).toUpperCase());
                            }
                            if (filter.value.length) {
                                if (filter.filterFn) {
                                    return filter.filterFn(row, filter);
                                }
                                var prop = String(row[filter.prop]).toUpperCase();
                                return filter.value.some((v) => prop.includes(String(v).toUpperCase()));
                            }
                        }
                        return true;
                    }));
                }
            }
        });
    };

    $app.methods.sweepFeed = function () {
        var { data } = this.feedTable;
        // 로그는 3일까지만 남김
        var limit = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toJSON();
        var i = 0;
        var j = data.length;
        while (i < j &&
            data[i].created_at < limit) {
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
        playerList: [],
        friendList: []
    };
    $app.data.lastLocation$ = {};
    $app.data.discordActive = configRepository.getBool('discordActive');
    $app.data.discordInstance = configRepository.getBool('discordInstance');
    var saveDiscordOption = function () {
        configRepository.setBool('discordActive', this.discordActive);
        configRepository.setBool('discordInstance', this.discordInstance);
    };
    $app.watch.discordActive = saveDiscordOption;
    $app.watch.discordInstance = saveDiscordOption;

    $app.data.gameLogTable = {
        data: [],
        lastEntryDate: '',
        filters: [
            {
                prop: 'type',
                value: [],
                filterFn: (row, filter) => filter.value.some((v) => v === row.type)
            },
            {
                prop: 'data',
                value: ''
            },
            {
                prop: 'data',
                value: true,
                filterFn: (row, filter) => row.data !== API.currentUser.displayName
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
            pageSizes: [
                10,
                25,
                50,
                100
            ]
        }
    };

    $app.methods.resetGameLog = async function () {
        await gameLogService.reset();
        this.gameLogTable.data = [];
        this.lastLocation = {
            date: 0,
            location: '',
            name: '',
            playerList: [],
            friendList: []
        };
    };

    $app.methods.updateGameLogLoop = async function () {
        try {
            if (API.isLoggedIn === true) {
                await this.updateGameLog();
                this.sweepGameLog();
                var length = this.gameLogTable.data.length;
                if (length > 0) {
                    if (this.gameLogTable.data[length - 1].created_at !== this.gameLogTable.lastEntryDate) {
                        this.notifyMenu('gameLog');
                    }
                    this.gameLogTable.lastEntryDate = this.gameLogTable.data[length - 1].created_at;
                }
                this.updateSharedFeed(false);
            }
        } catch (err) {
            console.error(err);
        }
        setTimeout(() => this.updateGameLogLoop(), 500);
    };

    $app.methods.updateGameLog = async function () {
        for (var gameLog of await gameLogService.poll()) {
            var tableData = null;

            switch (gameLog.type) {
                case 'location':
                    if (this.isGameRunning) {
                        this.lastLocation = {
                            date: Date.parse(gameLog.dt),
                            location: gameLog.location,
                            name: gameLog.worldName,
                            playerList: [],
                            friendList: []
                        };
                    }
                    tableData = {
                        created_at: gameLog.dt,
                        type: 'Location',
                        data: [gameLog.location, gameLog.worldName]
                    };
                    break;

                case 'player-joined':
                    tableData = {
                        created_at: gameLog.dt,
                        type: 'OnPlayerJoined',
                        data: gameLog.userDisplayName
                    };
                    break;

                case 'player-left':
                    tableData = {
                        created_at: gameLog.dt,
                        type: 'OnPlayerLeft',
                        data: gameLog.userDisplayName
                    };
                    break;

                case 'notification':
                    tableData = {
                        created_at: gameLog.dt,
                        type: 'Notification',
                        data: gameLog.json
                    };
                    break;

                case 'portal-spawn':
                    tableData = {
                        created_at: gameLog.dt,
                        type: 'PortalSpawn',
                        data: gameLog.userDisplayName
                    };
                    break;

                case 'event':
                    tableData = {
                        created_at: gameLog.dt,
                        type: 'Event',
                        data: gameLog.event
                    };
                    break;

                case 'video-play':
                    tableData = {
                        created_at: gameLog.dt,
                        type: 'VideoPlay',
                        data: gameLog.videoURL
                    };
                    break;

                default:
                    break;
            }

            if (tableData !== null) {
                this.gameLogTable.data.push(tableData);
            }
        }
    };

    $app.methods.sweepGameLog = function () {
        var { data } = this.gameLogTable;
        // 로그는 7일까지만 남김
        var limit = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toJSON();
        var i = 0;
        var j = data.length;
        while (i < j &&
            data[i].created_at < limit) {
            ++i;
        }
        if (i === j) {
            this.gameLogTable.data = [];
        } else if (i) {
            data.splice(0, i);
        }
    };

    $app.methods.updateDiscord = function () {
        var ref = API.cachedUsers.get(API.currentUser.id);
        if (typeof ref !== 'undefined') {
            var myLocation = this.lastLocation.location;
            if (ref.location !== myLocation) {
                API.applyUser({
                    id: ref.id,
                    location: myLocation
                });
            }
        }
        if (this.isGameRunning === false ||
            this.lastLocation.location === '') {
            Discord.SetActive(false);
            return;
        }
        if (this.lastLocation.location !== this.lastLocation$.tag) {
            var L = API.parseLocation(this.lastLocation.location);
            L.worldName = L.worldId;
            this.lastLocation$ = L;
            if (L.worldId) {
                var ref = API.cachedWorlds.get(L.worldId);
                if (ref) {
                    L.worldName = ref.name;
                } else {
                    API.getWorld({
                        worldId: L.worldId
                    }).then((args) => {
                        L.worldName = args.ref.name;
                        return args;
                    });
                }
            }
        }
        // NOTE
        // 글자 수가 짧으면 업데이트가 안된다..
        var LL = this.lastLocation$;
        if (LL.worldName.length < 2) {
            LL.worldName += '\uFFA0'.repeat(2 - LL.worldName.length);
        }
        if (this.discordInstance) {
            Discord.SetText(LL.worldName, `#${LL.instanceName} ${LL.accessType}`);
        } else {
            Discord.SetText(LL.worldName, '');
        }
        Discord.SetActive(this.discordActive);
    };

    $app.methods.lookupUser = async function (name) {
        for (var ref of API.cachedUsers.values()) {
            if (ref.displayName === name) {
                this.showUserDialog(ref.id);
                return;
            }
        }
        this.searchText = name;
        await this.searchUser();
        for (var ref of this.searchUserResults) {
            if (ref.displayName === name) {
                this.searchText = '';
                this.clearSearch();
                this.showUserDialog(ref.id);
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
        await API.getUsers(params).finally(() => {
            this.isSearchUserLoading = false;
        }).then((args) => {
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
                params.sort = 'popularity';
                params.search = this.searchText;
                break;
        }
        params.order = ref.sortOrder || 'descending';
        if (ref.sortOwnership === 'mine') {
            params.user = 'me';
            params.releaseStatus = 'all';
        }
        if (ref.tag) {
            params.tag = ref.tag;
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
        API.getWorlds(params, this.searchWorldOption).finally(() => {
            this.isSearchWorldLoading = false;
        }).then((args) => {
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
        API.getAvatars(params).finally(() => {
            this.isSearchAvatarLoading = false;
        }).then((args) => {
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
                        ref = this.friendLog[objectId];
                        if (typeof ref !== 'undefined' &&
                            ref.displayName) {
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
                        this.$message('Group updated!');
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

    $app.data.friendLog = {};
    $app.data.friendLogTable = {
        data: [],
        filters: [
            {
                prop: 'type',
                value: [],
                filterFn: (row, filter) => filter.value.some((v) => v === row.type)
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
            pageSizes: [
                10,
                25,
                50,
                100
            ]
        }
    };

    API.$on('LOGIN', function (args) {
        $app.initFriendship(args.ref);
    });

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
        $app.friendLogTable.data.push({
            created_at: new Date().toJSON(),
            type: 'FriendRequest',
            userId: ref.id,
            displayName: ref.displayName
        });
        $app.saveFriendLog();
    });

    API.$on('FRIEND:REQUEST:CANCEL', function (args) {
        var ref = this.cachedUsers.get(args.params.userId);
        if (typeof ref === 'undefined') {
            return;
        }
        $app.friendLogTable.data.push({
            created_at: new Date().toJSON(),
            type: 'CancelFriendRequst',
            userId: ref.id,
            displayName: ref.displayName
        });
        $app.saveFriendLog();
    });

    var saveFriendLogTimer = null;
    $app.methods.saveFriendLog = function () {
        if (saveFriendLogTimer !== null) {
            return;
        }
        this.updateSharedFeed(true);
        saveFriendLogTimer = setTimeout(() => {
            saveFriendLogTimer = null;
            VRCXStorage.SetObject(`${API.currentUser.id}_friendLog`, this.friendLog);
            VRCXStorage.SetArray(`${API.currentUser.id}_friendLogTable`, this.friendLogTable.data);
            VRCXStorage.Set(`${API.currentUser.id}_friendLogUpdatedAt`, new Date().toJSON());
        }, 1);
    };

    $app.methods.initFriendship = function (ref) {
        if (VRCXStorage.Get(`${ref.id}_friendLogUpdatedAt`)) {
            this.friendLog = VRCXStorage.GetObject(`${ref.id}_friendLog`);
            this.friendLogTable.data = VRCXStorage.GetArray(`${ref.id}_friendLogTable`);
        } else {
            var friendLog = {};
            for (var id of ref.friends) {
                // DO NOT set displayName,
                // it's flag about it's new friend
                var ctx = {
                    id
                };
                var user = API.cachedUsers.get(id);
                if (typeof user !== 'undefined') {
                    ctx.displayName = user.displayName;
                    ctx.trustLevel = user.$trustLevel;
                }
                friendLog[id] = ctx;
            }
            this.friendLog = friendLog;
            this.friendLogTable.data = [];
            this.saveFriendLog();
        }
    };

    $app.methods.addFriendship = function (id) {
        if (typeof this.friendLog[id] !== 'undefined') {
            return;
        }
        var ctx = {
            id,
            displayName: null,
            trustLevel: null
        };
        Vue.set(this.friendLog, id, ctx);
        var ref = API.cachedUsers.get(id);
        if (typeof ref !== 'undefined') {
            ctx.displayName = ref.displayName;
            ctx.trustLevel = ref.$trustLevel;
            this.friendLogTable.data.push({
                created_at: new Date().toJSON(),
                type: 'Friend',
                userId: ref.id,
                displayName: ctx.displayName
            });
        }
        this.saveFriendLog();
        this.notifyMenu('friendLog');
    };

    $app.methods.deleteFriendship = function (id) {
        var ctx = this.friendLog[id];
        if (typeof ctx === 'undefined') {
            return;
        }
        Vue.delete(this.friendLog, id);
        this.friendLogTable.data.push({
            created_at: new Date().toJSON(),
            type: 'Unfriend',
            userId: id,
            displayName: ctx.displayName
        });
        this.saveFriendLog();
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
        var ctx = this.friendLog[ref.id];
        if (typeof ctx === 'undefined') {
            return;
        }
        if (ctx.displayName !== ref.displayName) {
            if (ctx.displayName) {
                this.friendLogTable.data.push({
                    created_at: new Date().toJSON(),
                    type: 'DisplayName',
                    userId: ref.id,
                    displayName: ref.displayName,
                    previousDisplayName: ctx.displayName
                });
            } else if (ctx.displayName === null) {
                this.friendLogTable.data.push({
                    created_at: new Date().toJSON(),
                    type: 'Friend',
                    userId: ref.id,
                    displayName: ref.displayName
                });
            }
            ctx.displayName = ref.displayName;
            this.saveFriendLog();
            this.notifyMenu('friendLog');
        }
        if (ref.$trustLevel &&
            ctx.trustLevel !== ref.$trustLevel) {
            if (ctx.trustLevel) {
                this.friendLogTable.data.push({
                    created_at: new Date().toJSON(),
                    type: 'TrustLevel',
                    userId: ref.id,
                    displayName: ref.displayName,
                    trustLevel: ref.$trustLevel,
                    previousTrustLevel: ctx.trustLevel
                });
            }
            ctx.trustLevel = ref.$trustLevel;
            this.saveFriendLog();
            this.notifyMenu('friendLog');
        }
    };

    $app.methods.deleteFriendLog = function (row) {
        // FIXME: 메시지 수정
        this.$confirm('Continue? Delete Log', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm' &&
                    removeFromArray(this.friendLogTable.data, row)) {
                    this.saveFriendLog();
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
                filterFn: (row, filter) => filter.value.some((v) => v === row.type)
            },
            {
                prop: [
                    'sourceDisplayName',
                    'targetDisplayName'
                ],
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
            pageSizes: [
                10,
                25,
                50,
                100
            ]
        }
    };

    API.$on('LOGIN', function () {
        $app.playerModerationTable.data = [];
    });

    API.$on('PLAYER-MODERATION', function (args) {
        var { ref } = args;
        var array = $app.playerModerationTable.data;
        var { length } = array;
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
        var { ref } = args;
        var array = $app.playerModerationTable.data;
        var { length } = array;
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
                filterFn: (row, filter) => filter.value.some((v) => v === row.type)
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
            pageSizes: [
                10,
                25,
                50,
                100
            ]
        }
    };

    API.$on('LOGIN', function () {
        $app.notificationTable.data = [];
    });

    API.$on('NOTIFICATION', function (args) {
        var { ref } = args;
        var array = $app.notificationTable.data;
        var { length } = array;
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
            $app.notifyMenu('notification');
        }
        $app.updateSharedFeed(true);
    });

    API.$on('NOTIFICATION:@DELETE', function (args) {
        var { ref } = args;
        var array = $app.notificationTable.data;
        var { length } = array;
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
                    API.hideNotification({
                        notificationId: row.id
                    });
                }
            }
        });
    };

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
    $app.data.VRCPlusIconsTable = {};
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
        layout: 'table'
    };
    $app.data.visits = 0;
    $app.data.openVR = configRepository.getBool('openVR');
    $app.data.openVRAlways = configRepository.getBool('openVRAlways');
    $app.data.overlaybutton = configRepository.getBool('VRCX_overlaybutton');
    $app.data.hidePrivateFromFeed = configRepository.getBool('VRCX_hidePrivateFromFeed');
    $app.data.hideOnPlayerJoined = configRepository.getBool('VRCX_hideOnPlayerJoined');
    $app.data.hideDevicesFromFeed = configRepository.getBool('VRCX_hideDevicesFromFeed');
    $app.data.overlayNotifications = configRepository.getBool('VRCX_overlayNotifications');
    $app.data.overlayWrist = configRepository.getBool('VRCX_overlayWrist');
    $app.data.xsNotifications = configRepository.getBool('VRCX_xsNotifications');
    $app.data.desktopToast = configRepository.getString('VRCX_desktopToast');
    $app.data.minimalFeed = configRepository.getBool('VRCX_minimalFeed');
    $app.data.displayVRCPlusIconsAsAvatar = configRepository.getBool('displayVRCPlusIconsAsAvatar');
    $app.data.notificationTTS = configRepository.getString('VRCX_notificationTTS');
    $app.data.notificationTTSVoice = configRepository.getString('VRCX_notificationTTSVoice');
    $app.data.notificationTimeout = configRepository.getString('VRCX_notificationTimeout');
    var saveOpenVROption = function () {
        configRepository.setBool('openVR', this.openVR);
        configRepository.setBool('openVRAlways', this.openVRAlways);
        configRepository.setBool('VRCX_overlaybutton', this.overlaybutton);
        configRepository.setBool('VRCX_hidePrivateFromFeed', this.hidePrivateFromFeed);
        configRepository.setBool('VRCX_hideOnPlayerJoined', this.hideOnPlayerJoined);
        configRepository.setBool('VRCX_hideDevicesFromFeed', this.hideDevicesFromFeed);
        configRepository.setBool('VRCX_overlayNotifications', this.overlayNotifications);
        configRepository.setBool('VRCX_overlayWrist', this.overlayWrist);
        configRepository.setBool('VRCX_xsNotifications', this.xsNotifications);
        configRepository.setString('VRCX_desktopToast', this.desktopToast);
        configRepository.setBool('VRCX_minimalFeed', this.minimalFeed);
        configRepository.setBool('displayVRCPlusIconsAsAvatar', this.displayVRCPlusIconsAsAvatar);
        this.updateVRConfigVars();
    };
    $app.data.TTSvoices = speechSynthesis.getVoices();
    var saveNotificationTTS = function () {
        speechSynthesis.cancel();
        if ((configRepository.getString('VRCX_notificationTTS') === 'Never') && (this.notificationTTS !== 'Never')) {
            this.speak('Notification text-to-speech enabled');
        }
        configRepository.setString('VRCX_notificationTTS', this.notificationTTS);
        this.updateVRConfigVars();
    };
    $app.watch.openVR = saveOpenVROption;
    $app.watch.openVRAlways = saveOpenVROption;
    $app.watch.overlaybutton = saveOpenVROption;
    $app.watch.hidePrivateFromFeed = saveOpenVROption;
    $app.watch.hideOnPlayerJoined = saveOpenVROption;
    $app.watch.hideDevicesFromFeed = saveOpenVROption;
    $app.watch.overlayNotifications = saveOpenVROption;
    $app.watch.overlayWrist = saveOpenVROption;
    $app.watch.xsNotifications = saveOpenVROption;
    $app.watch.desktopToast = saveOpenVROption;
    $app.watch.minimalFeed = saveOpenVROption;
    $app.watch.displayVRCPlusIconsAsAvatar = saveOpenVROption;
    $app.watch.notificationTTS = saveNotificationTTS;
    $app.data.isDarkMode = configRepository.getBool('isDarkMode');
    $appDarkStyle.disabled = $app.data.isDarkMode === false;
    $app.watch.isDarkMode = function () {
        configRepository.setBool('isDarkMode', this.isDarkMode);
        $appDarkStyle.disabled = this.isDarkMode === false;
        this.updateVRConfigVars();
    };
    $app.data.isStartAtWindowsStartup = configRepository.getBool('VRCX_StartAtWindowsStartup');
    $app.data.isStartAsMinimizedState = (VRCXStorage.Get('VRCX_StartAsMinimizedState') === 'true');
    $app.data.isCloseToTray = configRepository.getBool('VRCX_CloseToTray');
    $app.data.isAutoLogin = configRepository.getBool('VRCX_AutoLogin');
    var saveVRCXWindowOption = function () {
        configRepository.setBool('VRCX_StartAtWindowsStartup', this.isStartAtWindowsStartup);
        VRCXStorage.Set('VRCX_StartAsMinimizedState', this.isStartAsMinimizedState.toString());
        configRepository.setBool('VRCX_CloseToTray', this.isCloseToTray);
        AppApi.SetStartup(this.isStartAtWindowsStartup);
        configRepository.setBool('VRCX_AutoLogin', this.isAutoLogin);
    };
    $app.watch.isStartAtWindowsStartup = saveVRCXWindowOption;
    $app.watch.isStartAsMinimizedState = saveVRCXWindowOption;
    $app.watch.isCloseToTray = saveVRCXWindowOption;
    $app.watch.isAutoLogin = saveVRCXWindowOption;

    // setting defaults
    if (configRepository.getBool('displayVRCPlusIconsAsAvatar') === null) {
        $app.data.displayVRCPlusIconsAsAvatar = true;
        configRepository.setBool('displayVRCPlusIconsAsAvatar', $app.data.displayVRCPlusIconsAsAvatar);
    }
    if (!configRepository.getString('VRCX_notificationPosition')) {
        $app.data.notificationPosition = 'topCenter';
        configRepository.setString('VRCX_notificationPosition', $app.data.notificationPosition);
    }
    if (!configRepository.getString('VRCX_notificationTimeout')) {
        $app.data.notificationTimeout = 3000;
        configRepository.setString('VRCX_notificationTimeout', $app.data.notificationTimeout);
    }
    if (!configRepository.getString('VRCX_notificationTTSVoice')) {
        $app.data.notificationTTSVoice = '0';
        configRepository.setString('VRCX_notificationTTSVoice', $app.data.notificationTTSVoice);
    }
    if (!configRepository.getString('VRCX_desktopToast')) {
        $app.data.desktopToast = 'Never';
        configRepository.setString('VRCX_desktopToast', $app.data.desktopToast);
    }
    if (!configRepository.getString('VRCX_notificationTTS')) {
        $app.data.notificationTTS = 'Never';
        configRepository.setString('VRCX_notificationTTS', $app.data.notificationTTS);
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
                ItemDestroy: 'Off',
                Event: 'On',
                VideoPlay: 'On'
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
                ItemDestroy: 'Everyone',
                Event: 'On',
                VideoPlay: 'On'
            }
        };
        configRepository.setString('sharedFeedFilters', JSON.stringify(sharedFeedFilters));
    }
    $app.data.sharedFeedFilters = JSON.parse(configRepository.getString('sharedFeedFilters'));

    var toggleSwitchLayout = {
        backgroundColor: 'white',
        selectedBackgroundColor: '#409eff',
        selectedColor: 'white',
            color: '#409eff',
        borderColor: '#409eff',
        fontWeight: 'bold',
        fontFamily: '"Noto Sans JP", "Noto Sans KR", "Meiryo UI", "Malgun Gothic", "Segoe UI", "sans-serif"'
    };

    $app.data.toggleSwitchOptionsEveryone = {
        layout: toggleSwitchLayout,
        size: {
            height: 1.5,
            width: 15,
            padding: 0.1,
            fontSize: 0.75
        },
        items: {
            labels: [{ name: 'Off' }, { name: 'VIP' }, { name: 'Friends' }, { name: 'Everyone' }]
        }
    };
    $app.data.toggleSwitchOptionsFriends = {
        layout: toggleSwitchLayout,
        size: {
            height: 1.5,
            width: 11.25,
            padding: 0.1,
            fontSize: 0.75
        },
        items: {
            labels: [{ name: 'Off' }, { name: 'VIP' }, { name: 'Friends' }]
        }
    };
    $app.data.toggleSwitchOptionsOn = {
        layout: toggleSwitchLayout,
        size: {
            height: 1.5,
            width: 7.5,
            padding: 0.1,
            fontSize: 0.75
        },
        items: {
            labels: [{ name: 'Off' }, { name: 'On' }]
        }
    };
    $app.data.whenToPlayToggleSwitchOption = {
        layout: toggleSwitchLayout,
        size: {
            height: 1.5,
            width: 33,
            padding: 0.1,
            fontSize: 0.75
        },
        items: {
            labels: [{ name: 'Never' }, { name: 'Desktop Mode' }, { name: 'Outside VR' }, { name: 'Inside VR' }, { name: 'Game Closed' }, { name: 'Always' }]
        }
    };

    if (!configRepository.getString('VRCX_trustColor')) {
        var trustColor = {
            untrusted: '#CCCCCC',
            basic: '#1778FF',
            known: '#2BCF5C',
            trusted: '#FF7B42',
            veteran: '#B18FFF',
            legend: '#FFD000',
            legendary: '#FF69B4',
            vip: '#FF2626',
            troll: '#782F2F'
        };
        configRepository.setString('VRCX_trustColor', JSON.stringify(trustColor));
    }
    $app.data.trustColor = JSON.parse(configRepository.getString('VRCX_trustColor'));

    $app.data.trustColorSwatches = ['#CCCCCC', '#1778FF', '#2BCF5C', '#FF7B42', '#B18FFF', '#FFD000', '#FF69B4', '#ABCDEF', '#8143E6', '#B52626', '#FF2626', '#782F2F'];

    $app.methods.updatetrustColor = function () {
        var trustColor = $app.trustColor;
        if (trustColor) {
            configRepository.setString('VRCX_trustColor', JSON.stringify(trustColor));
        } else {
            trustColor = JSON.parse(configRepository.getString('VRCX_trustColor'));
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
        configRepository.setString('sharedFeedFilters', JSON.stringify(this.sharedFeedFilters));
        this.updateVRConfigVars();
    };

    $app.methods.cancelSharedFeedFilters = function () {
        this.notyFeedFiltersDialog.visible = false;
        this.wristFeedFiltersDialog.visible = false;
        this.sharedFeedFilters = JSON.parse(configRepository.getString('sharedFeedFilters'));
    };

    $app.data.notificationPosition = configRepository.getString('VRCX_notificationPosition');
    $app.methods.changeNotificationPosition = function () {
        configRepository.setString('VRCX_notificationPosition', this.notificationPosition);
        this.updateVRConfigVars();
    };

    sharedRepository.setBool('is_game_running', false);
    var isGameRunningStateChange = function () {
        sharedRepository.setBool('is_game_running', this.isGameRunning);
        this.lastLocation = {
            date: 0,
            location: '',
            name: '',
            playerList: [],
            friendList: []
        };
        if (this.isGameRunning) {
            API.currentUser.$online_for = Date.now();
            API.currentUser.$offline_for = '';
        } else {
            API.currentUser.$online_for = '';
            API.currentUser.$offline_for = Date.now();
        }
    };
    $app.watch.isGameRunning = isGameRunningStateChange;

    sharedRepository.setBool('is_Game_No_VR', false);
    var isGameNoVRStateChange = function () {
        sharedRepository.setBool('is_Game_No_VR', this.isGameNoVR);
    };
    $app.watch.isGameNoVR = isGameNoVRStateChange;

    var lastLocationStateChange = function () {
        sharedRepository.setObject('last_location', $app.lastLocation);
    };
    $app.watch['lastLocation.location'] = lastLocationStateChange;

    $app.methods.updateVRConfigVars = function () {
        if (configRepository.getBool('isDarkMode')) {
            var notificationTheme = 'sunset';
        } else {
            var notificationTheme = 'relax';
        }
        var VRConfigVars = {
            notificationTTS: this.notificationTTS,
            notificationTTSVoice: this.notificationTTSVoice,
            overlayNotifications: this.overlayNotifications,
            hideDevicesFromFeed: this.hideDevicesFromFeed,
            minimalFeed: this.minimalFeed,
            displayVRCPlusIconsAsAvatar: this.displayVRCPlusIconsAsAvatar,
            notificationPosition: this.notificationPosition,
            notificationTimeout: this.notificationTimeout,
            notificationTheme
        };
        sharedRepository.setObject('VRConfigVars', VRConfigVars);
        this.updateSharedFeed(true);
    };

    API.$on('LOGIN', function () {
        $app.updateVRConfigVars();
    });

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

    $app.methods.updateOpenVR = function () {
        if (this.openVR &&
            this.isGameNoVR === false &&
            (this.isGameRunning || this.openVRAlways)) {
            AppApi.StartVR();
        } else {
            AppApi.StopVR();
        }
    };

    $app.methods.changeTTSVoice = function (index) {
        this.notificationTTSVoice = index;
        configRepository.setString('VRCX_notificationTTSVoice', this.notificationTTSVoice);
        var voices = speechSynthesis.getVoices();
        var voiceName = voices[index].name;
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

    $app.methods.promptUserDialog = function () {
        this.$prompt('Enter a User ID (UUID)', 'Direct Access', {
            distinguishCancelAndClose: true,
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            inputPattern: /\S+/,
            inputErrorMessage: 'User ID is required',
            callback: (action, instance) => {
                if (action === 'confirm' &&
                    instance.inputValue) {
                    this.showUserDialog(instance.inputValue);
                }
            }
        });
    };

    $app.methods.promptWorldDialog = function () {
        this.$prompt('Enter a World ID (UUID)', 'Direct Access', {
            distinguishCancelAndClose: true,
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            inputPattern: /\S+/,
            inputErrorMessage: 'World ID is required',
            callback: (action, instance) => {
                if (action === 'confirm' &&
                    instance.inputValue) {
                    this.showWorldDialog(instance.inputValue);
                }
            }
        });
    };

    $app.methods.promptAvatarDialog = function () {
        this.$prompt('Enter a Avatar ID (UUID)', 'Direct Access', {
            distinguishCancelAndClose: true,
            confirmButtonText: 'OK',
            cancelButtonText: 'Cancel',
            inputPattern: /\S+/,
            inputErrorMessage: 'Avatar ID is required',
            callback: (action, instance) => {
                if (action === 'confirm' &&
                    instance.inputValue) {
                    this.showAvatarDialog(instance.inputValue);
                }
            }
        });
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
                if (action === 'confirm' &&
                    instance.inputValue &&
                    !isNaN(instance.inputValue)) {
                    this.notificationTimeout = Math.trunc(Number(instance.inputValue) * 1000);
                    configRepository.setString('VRCX_notificationTimeout', this.notificationTimeout);
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
                if (action === 'confirm' &&
                    instance.inputValue !== avatar.ref.name) {
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
                if (action === 'confirm' &&
                    instance.inputValue !== avatar.ref.description) {
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
                if (action === 'confirm' &&
                    instance.inputValue !== world.ref.name) {
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
                if (action === 'confirm' &&
                    instance.inputValue !== world.ref.description) {
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
        document.querySelectorAll('.v-modal,.el-dialog__wrapper').forEach((v) => {
            var _z = Number(v.style.zIndex) || 0;
            if (_z &&
                _z > z &&
                v !== el) {
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
            return `https://www.google.com/s2/favicons?domain=${url.origin}`;
        } catch (err) {
            return '';
        }
    };

    API.$on('LOGOUT', function () {
        $app.userDialog.visible = false;
    });

    API.$on('USER', function (args) {
        var { ref } = args;
        var D = $app.userDialog;
        if (D.visible === false ||
            D.id !== ref.id) {
            return;
        }
        D.ref = ref;
        $app.applyUserDialogLocation();
    });

    API.$on('WORLD', function (args) {
        var D = $app.userDialog;
        if (D.visible === false ||
            D.$location.worldId !== args.ref.id) {
            return;
        }
        $app.applyUserDialogLocation();
    });

    API.$on('FRIEND:STATUS', function (args) {
        var D = $app.userDialog;
        if (D.visible === false ||
            D.id !== args.params.userId) {
            return;
        }
        var { json } = args;
        D.isFriend = json.isFriend;
        D.incomingRequest = json.incomingRequest;
        D.outgoingRequest = json.outgoingRequest;
    });

    API.$on('FRIEND:REQUEST', function (args) {
        var D = $app.userDialog;
        if (D.visible === false ||
            D.id !== args.params.userId) {
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
        if (D.visible === false ||
            D.id !== args.params.userId) {
            return;
        }
        D.outgoingRequest = false;
    });

    API.$on('NOTIFICATION', function (args) {
        var { ref } = args;
        var D = $app.userDialog;
        if (D.visible === false ||
            ref.$isDeleted ||
            ref.type !== 'friendRequest' ||
            ref.senderUserId !== D.id) {
            return;
        }
        D.incomingRequest = true;
    });

    API.$on('NOTIFICATION:ACCEPT', function (args) {
        var { ref } = args;
        var D = $app.userDialog;
        // 얘는 @DELETE가 오고나서 ACCEPT가 옴
        // 따라서 $isDeleted라면 ref가 undefined가 됨
        if (D.visible === false ||
            typeof ref === 'undefined' ||
            ref.type !== 'friendRequest' ||
            ref.senderUserId !== D.id) {
            return;
        }
        D.isFriend = true;
    });

    API.$on('NOTIFICATION:@DELETE', function (args) {
        var { ref } = args;
        var D = $app.userDialog;
        if (D.visible === false ||
            ref.type !== 'friendRequest' ||
            ref.senderUserId !== D.id) {
            return;
        }
        D.incomingRequest = false;
    });

    API.$on('FRIEND:DELETE', function (args) {
        var D = $app.userDialog;
        if (D.visible === false ||
            D.id !== args.params.userId) {
            return;
        }
        D.isFriend = false;
    });

    API.$on('PLAYER-MODERATION:@SEND', function (args) {
        var { ref } = args;
        var D = $app.userDialog;
        if (D.visible === false ||
            ref.$isDeleted ||
            ref.targetUserId !== D.id &&
            ref.sourceUserId !== this.currentUser.id) {
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
        var { ref } = args;
        var D = $app.userDialog;
        if (D.visible === false ||
            ref.targetUserId !== D.id ||
            ref.sourceUserId !== this.currentUser.id) {
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
        var { ref } = args;
        var D = $app.userDialog;
        if (D.visible === false ||
            ref.$isDeleted ||
            ref.favoriteId !== D.id) {
            return;
        }
        D.isFavorite = true;
    });

    API.$on('FAVORITE:@DELETE', function (args) {
        var D = $app.userDialog;
        if (D.visible === false ||
            D.id !== args.ref.favoriteId) {
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
        D.memo = this.loadMemo(userId);
        D.visible = true;
        D.loading = true;
        API.getCachedUser({
            userId
        }).catch((err) => {
            D.loading = false;
            D.visible = false;
            throw err;
        }).then((args) => {
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
                    if (ref.$isDeleted === false &&
                        ref.targetUserId === D.id &&
                        ref.sourceUserId === API.currentUser.id) {
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
                var worlds = [];
                for (var ref of API.cachedWorlds.values()) {
                    if (ref.authorId === D.id) {
                        worlds.push(ref);
                    }
                }
                this.setUserDialogWorlds(worlds);
                var avatars = [];
                for (var ref of API.cachedAvatars.values()) {
                    if (ref.authorId === D.id) {
                        avatars.push(ref);
                    }
                }
                this.setUserDialogAvatars(avatars);
                D.avatars = avatars;
                D.isWorldsLoading = false;
                D.isAvatarsLoading = false;
                API.getFriendStatus({
                    userId: D.id
                });
                if (args.cache) {
                    API.getUser(args.params);
                }
                this.getAvatarName(args);
                var L = API.parseLocation(D.ref.location);
                if ((L.worldId) &&
                    (this.lastLocation.location !== L.tag) &&
                    ((L.accessType === 'public') ||
                    (this.friends.has(L.userId)))) {
                    API.getWorld({
                        worldId: L.worldId
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
        if ((this.lastLocation.location === L.tag) && (playersInInstance.length > 0)) {
            var ref = API.cachedUsers.get(API.currentUser.id);
            if (typeof ref === 'undefined') {
                ref = API.currentUser;
            }
            if (playersInInstance.includes(ref.displayName)) {
                users.push(ref);
            }
            var friendsInInstance = this.lastLocation.friendList;
            for (var i = 0; i < friendsInInstance.length; i++) {
                var addUser = true;
                var player = friendsInInstance[i];
                for (var k = 0; k < users.length; k++) {
                    var user = users[k];
                    if (user.displayName === player) {
                        addUser = false;
                        break;
                    }
                }
                if (addUser) {
                    for (var ref of API.cachedUsers.values()) {
                        if (ref.displayName === player) {
                            users.push(ref);
                        break;
                    }
                    }
                }
            }
        } else {
            if (L.isOffline === false) {
                for (var { ref } of this.friends.values()) {
                    if (typeof ref !== 'undefined' &&
                        ref.location === L.tag) {
                        if ((ref.state === 'active') && (ref.location === 'private')) {
                            continue;
                        }
                        users.push(ref);
                    }
                }
            }
        }
        users.sort(compareByDisplayName);
        D.users = users;
        D.instance = {};
        if (!L.worldId) {
            return;
        }
        if (this.lastLocation.location === L.tag) {
            D.instance = {
                id: L.tag,
                occupants: this.lastLocation.playerList.length
            };
        } else {
            var applyInstance = function (instances) {
                for (var [id, occupants] of instances) {
                    if (id === L.instanceId) {
                        D.instance = {
                            id,
                            occupants
                        };
                        break;
                    }
                }
            };
            var ref = API.cachedWorlds.get(L.worldId);
            if (typeof ref === 'undefined') {
                API.getWorld({
                    worldId: L.worldId
                }).then((args) => {
                    if (args.ref.id === L.worldId) {
                        applyInstance(args.ref.instances);
                    }
                    return true;
                });
            } else {
                applyInstance(ref.instances);
            }
        }
    };

    $app.methods.setUserDialogWorlds = function (array) {
        var D = this.userDialog;
        if (D.worldSorting === 'update') {
            array.sort(compareByUpdatedAt);
        } else {
            array.sort(compareByName);
        }
        D.worlds = array;
    };

    $app.methods.setUserDialogAvatars = function (array) {
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
                    this.setUserDialogWorlds(array);
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
            user: 'me',
        };
        for (var ref of API.cachedAvatars.values()) {
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
                this.setUserDialogAvatars(array);
                D.isAvatarsLoading = false;
                if (fileId) {
                    D.loading = false;
                    for (var ref of array) {
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
            default:
                break;
        }
    };

    $app.methods.userDialogCommand = function (command) {
        var D = this.userDialog;
        if (D.visible === false) {
            return;
        }
        if (command === 'Add Favorite') {
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
            API.sendRequestInvite({
                platform: 'standalonewindows'
            }, D.id).then((args) => {
                this.$message('Request invite sent');
                return args;
            });
        } else if (command === 'Invite Message') {
            var L = API.parseLocation(this.lastLocation.location);
            API.getCachedWorld({
                worldId: L.worldId
            }).then((args) => {
                this.showSendInviteDialog({
                    instanceId: this.lastLocation.location,
                    worldId: this.lastLocation.location,
                    worldName: args.ref.name
                }, D.id);
            });
        } else if (command === 'Request Invite Message') {
            this.showSendInviteRequestDialog({
                platform: 'standalonewindows'
            }, D.id);
        } else if (command === 'Invite') {
            var L = API.parseLocation(this.lastLocation.location);
            API.getCachedWorld({
                worldId: L.worldId
            }).then((args) => {
                API.sendInvite({
                    instanceId: this.lastLocation.location,
                    worldId: this.lastLocation.location,
                    worldName: args.ref.name
                }, D.id).then((_args) => {
                    this.$message('Invite sent');
                    return _args;
                });
            });
        } else if (command === 'Show Avatar Author') {
            var { currentAvatarImageUrl } = D.ref;
            this.showAvatarAuthorDialog(D.id, currentAvatarImageUrl)
        } else if (command === 'Show Fallback Avatar Details') {
            var { fallbackAvatar } = D.ref;
            if (fallbackAvatar) {
                this.showAvatarDialog(fallbackAvatar);
            } else {
                this.$message({
                    message: 'No fallback avatar set',
                    type: 'error'
                });
            }
        } else if (command === 'Previous Images') {
            this.displayPreviousImages('User');
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
        this.setUserDialogWorlds(D.worlds);
    };

    $app.methods.changeUserDialogAvatarSorting = function () {
        var D = this.userDialog;
        this.setUserDialogAvatars(D.avatars);
    };

    $app.computed.userDialogAvatars = function () {
        var { avatars, avatarReleaseStatus } = this.userDialog;
        if (avatarReleaseStatus === 'public' ||
            avatarReleaseStatus === 'private') {
            return avatars.filter((avatar) => avatar.releaseStatus === avatarReleaseStatus);
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
        fileSize: ''
    };

    API.$on('LOGOUT', function () {
        $app.worldDialog.visible = false;
    });

    API.$on('WORLD', function (args) {
        var { ref } = args;
        var D = $app.worldDialog;
        if (D.visible === false ||
            D.id !== ref.id) {
            return;
        }
        D.ref = ref;
        if (D.fileSize === 'Loading') {
            var id = extractFileId(ref.assetUrl);
            if (id) {
                this.call(`file/${id}`).then(function (json) {
                    var ctx = json.versions[json.versions.length - 1];
                    D.fileCreatedAt = ctx.created_at;
                    D.fileSize = `${(ctx.file.sizeInBytes / 1048576).toFixed(2)} MiB`;
                });
            }
        }
        $app.applyWorldDialogInstances();
    });

    API.$on('FAVORITE', function (args) {
        var { ref } = args;
        var D = $app.worldDialog;
        if (D.visible === false ||
            ref.$isDeleted ||
            ref.favoriteId !== D.id) {
            return;
        }
        D.isFavorite = true;
    });

    API.$on('FAVORITE:@DELETE', function (args) {
        var D = $app.worldDialog;
        if (D.visible === false ||
            D.id !== args.ref.favoriteId) {
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
        API.getCachedWorld({
            worldId: L.worldId
        }).catch((err) => {
            D.loading = false;
            D.visible = false;
            throw err;
        }).then((args) => {
            if (D.id === args.ref.id) {
                D.loading = false;
                D.ref = args.ref;
                D.isFavorite = API.cachedFavoritesByObjectId.has(D.id);
                D.rooms = [];
                this.applyWorldDialogInstances();
                if (args.cache) {
                    API.getWorld(args.params);
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
        var { instanceId } = D.$location;
        if (instanceId &&
            typeof instances[instanceId] === 'undefined') {
            instances[instanceId] = {
                id: instanceId,
                occupants: 0,
                users: []
            };
        }
        var lastLocation$ = API.parseLocation(this.lastLocation.location);
        var playersInInstance = this.lastLocation.playerList;
        if ((lastLocation$.worldId === D.id) && (playersInInstance.length > 0)) {
            var instance = instances[lastLocation$.instanceId];
            if (typeof instance === 'undefined') {
                instance = {
                        id: lastLocation$.instanceId,
                        occupants: 1,
                        users: []
                };
                instances[instance.id] = instance;
            }
            instances[instance.id].occupants = playersInInstance.length;
            var ref = API.cachedUsers.get(API.currentUser.id);
            if (typeof ref === 'undefined') {
                ref = API.currentUser;
            }
            if (playersInInstance.includes(ref.displayName)) {
                instance.users.push(ref);
            }
                var friendsInInstance = this.lastLocation.friendList;
                for (var i = 0; i < friendsInInstance.length; i++) {
                    var addUser = true;
                    var player = friendsInInstance[i];
                    for (var k = 0; k < instance.users.length; k++) {
                        var user = instance.users[k];
                        if (user.displayName === player) {
                            addUser = false;
                            break;
                        }
                    }
                    if (addUser) {
                        for (var ref of API.cachedUsers.values()) {
                            if (ref.displayName === player) {
                                instance.users.push(ref);
                            break;
                        }
                    }
                }
            }
        }
        for (var { ref } of this.friends.values()) {
            if (typeof ref === 'undefined' ||
                typeof ref.$location === 'undefined' ||
                ref.$location.worldId !== D.id ||
                ref.$location.instanceId === lastLocation$.instanceId) {
                continue;
            }
            var { instanceId } = ref.$location;
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
            instance.users.sort(compareByDisplayName);
            rooms.push(instance);
        }
        // sort by more friends, occupants
        rooms.sort(function (a, b) {
            return b.users.length - a.users.length ||
                b.occupants - a.occupants;
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
            }).catch((err) => {
                D.loading = false;
                D.visible = false;
                throw err;
            }).then((args) => {
                if (D.id === args.ref.id) {
                    D.loading = false;
                    D.ref = args.ref;
                    D.isFavorite = API.cachedFavoritesByObjectId.has(D.id);
                    D.rooms = [];
                    this.applyWorldDialogInstances();
                    if (args.cache) {
                        API.getWorld(args.params);
                    }
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
                            default:
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
        var { ref } = this.worldDialog;
        var platforms = [];
        if (ref.unityPackages) {
            for (var unityPackage of ref.unityPackages) {
                var platform = 'PC';
                if (unityPackage.platform === 'standalonewindows') {
                    platform = 'PC';
                } else if (unityPackage.platform === 'android') {
                    platform = 'Quest';
                } else if (unityPackage.platform) {
                    ({ platform } = unityPackage);
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
        treeData: [],
        fileCreatedAt: '',
        fileSize: ''
    };

    API.$on('LOGOUT', function () {
        $app.avatarDialog.visible = false;
    });

    API.$on('AVATAR', function (args) {
        var D = $app.avatarDialog;
        if (D.visible === false ||
            D.id !== args.ref.id) {
            return;
        }
        D.ref = args.ref;
        if (D.fileSize === 'Unknown') {
            var id = extractFileId(args.ref.assetUrl);
            if (id) {
                D.fileSize = 'Loading';
                this.call(`file/${id}`).then((json) => {
                    var ref = json.versions[json.versions.length - 1];
                    D.ref.created_at = ref.created_at;
                    D.fileSize = `${(ref.file.sizeInBytes / 1048576).toFixed(2)} MiB`;
                });
            }
        }
    });

    API.$on('FAVORITE', function (args) {
        var { ref } = args;
        var D = $app.avatarDialog;
        if (D.visible === false ||
            ref.$isDeleted ||
            ref.favoriteId !== D.id) {
            return;
        }
        D.isFavorite = true;
    });

    API.$on('FAVORITE:@DELETE', function (args) {
        var D = $app.avatarDialog;
        if (D.visible === false ||
            D.id !== args.ref.favoriteId) {
            return;
        }
        D.isFavorite = false;
    });

    $app.methods.showAvatarDialog = function (avatarId) {
        this.$nextTick(() => adjustDialogZ(this.$refs.avatarDialog.$el));
        var D = this.avatarDialog;
        D.id = avatarId;
        D.treeData = [];
        D.fileSize = 'Unknown';
        D.visible = true;
        D.loading = true;
        API.getCachedAvatar({
            avatarId
        }).catch((err) => {
            D.loading = false;
            D.visible = false;
            throw err;
        }).then((args) => {
            if ((D.visible) && (D.id === args.ref.id)) {
                D.loading = false;
                D.ref = args.ref;
                D.isFavorite = API.cachedFavoritesByObjectId.has(D.ref.id);
                if ((args.cache) && (D.ref.authorId === API.currentUser.id)) {
                    API.getAvatar(args.params);
                } else {
                    var fileId = extractFileId(D.ref.imageUrl);
                    if ((fileId) && (!D.ref.created_at)) {
                        if (API.cachedAvatarNames.has(fileId)) {
                            var avatarInfo = API.cachedAvatarNames.get(fileId);
                            D.ref.created_at = avatarInfo.fileCreatedAt;
                        } else {
                            API.getAvatarImages({fileId}).then((args) => {
                                var avatarInfo = this.storeAvatarImage(args);
                                D.ref.created_at = avatarInfo.fileCreatedAt;
                            });
                        }
                    }
                }
            }
            return args;
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
                            default:
                                break;
                        }
                    }
                });
                break;
        }
    };

    $app.methods.showAvatarAuthorDialog = function (refUserId, currentAvatarImageUrl) {
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
            var { ownerId } = API.cachedAvatarNames.get(fileId);
            if (ownerId === API.currentUser.id) {
                this.refreshUserDialogAvatars(fileId);
                return;
            }
            if (ownerId === refUserId) {
                this.$message({
                    message: 'It\'s personal (own) avatar',
                        type: 'warning'
                    });
                    return;
                }
                this.showUserDialog(ownerId);
            } else {
                API.getAvatarImages({fileId}).then((args) => {
                    var ownerId = args.json.ownerId;
                    if (ownerId === refUserId) {
                        this.$message({
                            message: 'It\'s personal (own) avatar',
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
        var { ref } = this.avatarDialog;
        var platforms = [];
        if (ref.unityPackages) {
            for (var unityPackage of ref.unityPackages) {
                var platform = 'PC';
                if (unityPackage.platform === 'standalonewindows') {
                    platform = 'PC';
                } else if (unityPackage.platform === 'android') {
                    platform = 'Quest';
                } else if (unityPackage.platform) {
                    ({ platform } = unityPackage);
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
        }).finally(() => {
            D.loading = false;
        }).then((args) => {
            D.visible = false;
            return args;
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
                if (action !== 'confirm' ||
                    D.loading === true) {
                    return;
                }
                if (this.API.currentUser.status === 'busy' &&
                    D.userIds.includes(this.API.currentUser.id) === true) {
                    this.$message({
                        message: 'You can\'t invite yourself in \'Do Not Disturb\' mode',
                        type: 'error'
                    });
                    return;
                }
                D.loading = true;
                var inviteLoop = () => {
                    if (D.userIds.length > 0) {
                        var receiverUserId = D.userIds.shift();
                        API.sendInvite({
                            instanceId: D.worldId,
                            worldId: D.worldId,
                            worldName: D.worldName
                        }, receiverUserId).finally(inviteLoop);
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
        if (L.isOffline ||
            L.isPrivate ||
            L.worldId === '') {
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
        }).finally(() => {
            D.loading = false;
        }).then((args) => {
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
        D.status = API.currentUser.status;
        D.statusDescription = API.currentUser.statusDescription;
        D.visible = true;
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
        }())
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
        }).finally(() => {
            D.loading = false;
        }).then((args) => {
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
        accessType: '',
        location: '',
        url: ''
    };

    API.$on('LOGOUT', function () {
        $app.newInstanceDialog.visible = false;
    });

    $app.methods.buildInstance = function () {
        var D = this.newInstanceDialog;
        var tags = [];
        tags.push((99999 * Math.random() + 1).toFixed(0));
        if (D.accessType !== 'public') {
            if (D.accessType === 'friends+') {
                tags.push(`~hidden(${API.currentUser.id})`);
            } else if (D.accessType === 'friends') {
                tags.push(`~friends(${API.currentUser.id})`);
            } else {
                tags.push(`~private(${API.currentUser.id})`);
            }
            // NOTE : crypto.getRandomValues()를 쓰면 안전한 대신 무겁겠지..
            /*
            var nonce = [];
            for (var i = 0; i < 10; ++i) {
                nonce.push(Math.random().toString(16).substr(2).toUpperCase());
            }
            nonce = nonce.join('').substr(0, 64);
            */
            tags.push(`~nonce(${uuidv4()})`);
            if (D.accessType === 'invite+') {
                tags.push('~canRequestInvite');
            }
        }
        D.instanceId = tags.join('');
    };

    var getLaunchURL = function (worldId, instanceId) {
        if (instanceId) {
            return `https://vrchat.net/launch?worldId=${encodeURIComponent(worldId)}&instanceId=${encodeURIComponent(instanceId)}`;
        }
        return `https://vrchat.net/launch?worldId=${encodeURIComponent(worldId)}`;
    };

    var updateLocationURL = function () {
        var D = this.newInstanceDialog;
        if (D.instanceId) {
            D.location = `${D.worldId}:${D.instanceId}`;
        } else {
            D.location = D.worldId;
        }
        D.url = getLaunchURL(D.worldId, D.instanceId);
    };
    $app.watch['newInstanceDialog.worldId'] = updateLocationURL;
    $app.watch['newInstanceDialog.instanceId'] = updateLocationURL;

    $app.methods.showNewInstanceDialog = function (tag) {
        this.$nextTick(() => adjustDialogZ(this.$refs.newInstanceDialog.$el));
        var L = API.parseLocation(tag);
        if (L.isOffline ||
            L.isPrivate ||
            L.worldId === '') {
            return;
        }
        var D = this.newInstanceDialog;
        D.worldId = L.worldId;
        D.accessType = 'public';
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
        this.$nextTick(() => adjustDialogZ(this.$refs.notificationPositionDialog.$el));
        this.notificationPositionDialog.visible = true;
    };

    // App: Noty feed filters

    $app.data.notyFeedFiltersDialog = {
        visible: false
    };

    $app.methods.showNotyFeedFiltersDialog = function () {
        this.$nextTick(() => adjustDialogZ(this.$refs.notyFeedFiltersDialog.$el));
        this.notyFeedFiltersDialog.visible = true;
    };

    // App: Wrist feed filters

    $app.data.wristFeedFiltersDialog = {
        visible: false
    };

    $app.methods.showWristFeedFiltersDialog = function () {
        this.$nextTick(() => adjustDialogZ(this.$refs.wristFeedFiltersDialog.$el));
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
        if (L.isOffline ||
            L.isPrivate ||
            L.worldId === '') {
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

    // App: VRCPlus Icons

    API.$on('LOGIN', function () {
        $app.VRCPlusIconsTable = {};
    });

    $app.methods.displayVRCPlusIconsTable = function () {
        var params = {
            n: 50,
            tag: 'icon'
        };
        API.refreshVRCPlusIconsTableData(params);
    };

    API.refreshVRCPlusIconsTableData = function (params) {
        return this.call('files', {
            method: 'GET',
            params
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('VRCPLUSICON:LIST', args);
            return args;
        });
    };

    API.$on('VRCPLUSICON:LIST', function (args) {
        $app.VRCPlusIconsTable = args.json;
    });

    $app.methods.setVRCPlusIcon = function (userIcon) {
        if (userIcon !== '') {
            userIcon = `https://api.vrchat.cloud/api/1/file/${userIcon}/1`;
        }
        API.setVRCPlusIcon({
            userIcon
        }).then((args) => {
            this.$message({
                message: 'Icon changed',
                type: 'success'
            });
            return args;
        });
    };

    API.setVRCPlusIcon = function (params) {
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

    $app.methods.deleteVRCPlusIcon = function (userIcon) {
        API.deleteVRCPlusIcon(userIcon).then((args) => {
            API.$emit('VRCPLUSICON:DELETE', args);
            return args;
        });
    };

    API.$on('VRCPLUSICON:DELETE', function (args) {
        var array = $app.VRCPlusIconsTable;
        var { length } = array;
        for (var i = 0; i < length; ++i) {
            if (args.userIcon === array[i].id) {
                array.splice(i, 1);
                break;
            }
        }
    });

    API.deleteVRCPlusIcon = function (userIcon) {
        return this.call(`file/${userIcon}`, {
            method: 'DELETE'
        }).then((json) => {
            var args = {
                json,
                userIcon
            };
            return args;
        });
    };

    $app.methods.compareCurrentVRCPlusIcon = function (userIcon) {
        try {
            var currentUserIcon = extractFileId(API.currentUser.userIcon);
            if (userIcon === currentUserIcon) {
                return true;
            }
        } catch (err) {
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
        if (files[0].size >= 10000000) { //10MB
            $app.$message({
                message: 'File size too large',
                type: 'error'
            });
            clearFile();
            return;
        }
        if (!files[0].type.match(/image.*/)) {
            $app.$message({
                message: 'File isn\'t an image',
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
        if (files[0].size >= 10000000) { //10MB
            $app.$message({
                message: 'File size too large',
                type: 'error'
            });
            this.clearInviteImageUpload();
            return;
        }
        if (!files[0].type.match(/image.png/)) {
            $app.$message({
                message: 'File isn\'t a png',
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
        buttonList.forEach(button => button.value = '');
        this.uploadImage = '';
    };

    $app.methods.userOnlineFor = function (ctx) {
        if ((ctx.ref.state === 'online') && (ctx.ref.$online_for)) {
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
    }

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
        return this.call(`message/${this.currentUser.id}/${messageType}/${slot}`, {
            method: 'PUT',
            params
        }).then((json) => {
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

    $app.methods.showEditInviteMessageDialog = function (messageType, inviteMessage) {
        this.$nextTick(() => adjustDialogZ(this.$refs.editInviteMessageDialog.$el));
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
            API.editInviteMessage(params, messageType, slot).catch((err) => {
                throw err;
            }).then((args) => {
                API.$emit(`INVITE:${messageType.toUpperCase()}`, args);
                if (args.json[slot].message === D.inviteMessage.message) {
                    this.$message({
                        message: 'VRChat API didn\'t update message, try again',
                        type: 'error'
                    });
                    throw new Error('VRChat API didn\'t update message, try again');
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

    $app.methods.showEditAndSendInviteResponseDialog = function (messageType, inviteMessage) {
        this.$nextTick(() => adjustDialogZ(this.$refs.editAndSendInviteResponseDialog.$el));
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
            await API.editInviteMessage(params, messageType, slot).catch((err) => {
                throw err;
            }).then((args) => {
                API.$emit(`INVITE:${messageType.toUpperCase()}`, args);
                if (args.json[slot].message === D.inviteMessage.message) {
                    this.$message({
                        message: 'VRChat API didn\'t update message, try again',
                        type: 'error'
                    });
                    throw new Error('VRChat API didn\'t update message, try again');
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
            API.sendInviteResponsePhoto(params, I.invite.id).catch((err) => {
                throw err;
            }).then((args) => {
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
            API.sendInviteResponse(params, I.invite.id).catch((err) => {
                throw err;
            }).then((args) => {
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
        this.$nextTick(() => adjustDialogZ(this.$refs.sendInviteResponseDialog.$el));
        this.clearInviteImageUpload();
        this.sendInviteResponseDialogVisible = true;
    };

    $app.methods.showSendInviteResponseConfirmDialog = function (val) {
        if (this.editAndSendInviteResponseDialog.visible === true || val === null) {
            return;
        }
        this.$nextTick(() => adjustDialogZ(this.$refs.sendInviteResponseConfirmDialog.$el));
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
            API.sendInviteResponsePhoto(params, D.invite.id, D.messageType).catch((err) => {
                throw err;
            }).then((args) => {
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
            API.sendInviteResponse(params, D.invite.id, D.messageType).catch((err) => {
                throw err;
            }).then((args) => {
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
        this.$nextTick(() => adjustDialogZ(this.$refs.sendInviteRequestResponseDialog.$el));
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

    $app.methods.showEditAndSendInviteDialog = function (messageType, inviteMessage) {
        this.$nextTick(() => adjustDialogZ(this.$refs.editAndSendInviteDialog.$el));
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
            await API.editInviteMessage(params, messageType, slot).catch((err) => {
                throw err;
            }).then((args) => {
                API.$emit(`INVITE:${messageType.toUpperCase()}`, args);
                if (args.json[slot].message === D.inviteMessage.message) {
                    this.$message({
                        message: 'VRChat API didn\'t update message, try again',
                        type: 'error'
                    });
                    throw new Error('VRChat API didn\'t update message, try again');
                } else {
                    this.$message('Invite message updated');
                }
                return args;
            });
        }
        var I = this.sendInviteDialog;
        var J = this.inviteDialog;
        if (J.visible) {
            if (this.API.currentUser.status === 'busy' &&
                J.userIds.includes(this.API.currentUser.id) === true) {
                this.$message({
                    message: 'You can\'t invite yourself in \'Do Not Disturb\' mode',
                    type: 'error'
                });
                return;
            }
            var inviteLoop = () => {
                if (J.userIds.length > 0) {
                    var receiverUserId = J.userIds.shift();
                    if ($app.uploadImage) {
                        API.sendInvitePhoto({
                            instanceId: J.worldId,
                            worldId: J.worldId,
                            worldName: J.worldName,
                            messageSlot: slot
                        }, receiverUserId).finally(inviteLoop);
                    } else {
                        API.sendInvite({
                            instanceId: J.worldId,
                            worldId: J.worldId,
                            worldName: J.worldName,
                            messageSlot: slot
                        }, receiverUserId).finally(inviteLoop);
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
        } else {
            if (I.messageType === 'invite') {
                I.params.messageSlot = slot;
                if ($app.uploadImage) {
                    API.sendInvitePhoto(I.params, I.userId).catch((err) => {
                        throw err;
                    }).then((args) => {
                        this.$message({
                            message: 'Invite photo message sent',
                            type: 'success'
                        });
                        return args;
                    });
                } else {
                    API.sendInvite(I.params, I.userId).catch((err) => {
                        throw err;
                    }).then((args) => {
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
                    API.sendRequestInvitePhoto(I.params, I.userId).catch((err) => {
                        this.clearInviteImageUpload();
                        throw err;
                    }).then((args) => {
                        this.$message({
                            message: 'Request invite photo message sent',
                            type: 'success'
                        });
                        return args;
                    });
                } else {
                    API.sendRequestInvite(I.params, I.userId).catch((err) => {
                        throw err;
                    }).then((args) => {
                        this.$message({
                            message: 'Request invite message sent',
                            type: 'success'
                        });
                        return args;
                    });
                }
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
        this.$nextTick(() => adjustDialogZ(this.$refs.sendInviteConfirmDialog.$el));
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
            if (this.API.currentUser.status === 'busy' &&
                J.userIds.includes(this.API.currentUser.id) === true) {
                this.$message({
                    message: 'You can\'t invite yourself in \'Do Not Disturb\' mode',
                    type: 'error'
                });
                return;
            }
            var inviteLoop = () => {
                if (J.userIds.length > 0) {
                    var receiverUserId = J.userIds.shift();
                    if ($app.uploadImage) {
                        API.sendInvitePhoto({
                            instanceId: J.worldId,
                            worldId: J.worldId,
                            worldName: J.worldName,
                            messageSlot: D.messageSlot
                        }, receiverUserId).finally(inviteLoop);
                    } else {
                        API.sendInvite({
                            instanceId: J.worldId,
                            worldId: J.worldId,
                            worldName: J.worldName,
                            messageSlot: D.messageSlot
                        }, receiverUserId).finally(inviteLoop);
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
        } else {
            if (D.messageType === 'invite') {
                D.params.messageSlot = D.messageSlot;
                if ($app.uploadImage) {
                    API.sendInvitePhoto(D.params, D.userId).catch((err) => {
                        throw err;
                    }).then((args) => {
                        this.$message({
                            message: 'Invite photo message sent',
                            type: 'success'
                        });
                        return args;
                    });
                } else {
                    API.sendInvite(D.params, D.userId).catch((err) => {
                        throw err;
                    }).then((args) => {
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
                    API.sendRequestInvitePhoto(D.params, D.userId).catch((err) => {
                        this.clearInviteImageUpload();
                        throw err;
                    }).then((args) => {
                        this.$message({
                            message: 'Request invite photo message sent',
                            type: 'success'
                        });
                        return args;
                    });
                } else {
                    API.sendRequestInvite(D.params, D.userId).catch((err) => {
                        throw err;
                    }).then((args) => {
                        this.$message({
                            message: 'Request invite message sent',
                            type: 'success'
                        });
                        return args;
                    });
                }
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
        this.$nextTick(() => adjustDialogZ(this.$refs.sendInviteRequestDialog.$el));
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
        this.showUserDialog(val.id);
    };

    $app.data.friendsListSearch = '';
    $app.data.friendsListSearchFilterVIP = false;
    $app.data.friendsListSearchFilters = [ 'Display Name', 'User Name', 'Rank', 'Status', 'Bio', 'Memo' ];

    $app.methods.friendsListSearchChange = function () {
        var filters = this.friendsListSearchFilters;
        var results = [];
        if (this.friendsListSearch) {
            var query = this.friendsListSearch.toUpperCase();
        }
        for (var ctx of this.friends.values()) {
            if (typeof ctx.ref === 'undefined') {
                continue;
            }
            if (this.friendsListSearchFilterVIP &&
                !ctx.isVIP) {
                continue;
            }
            if (query && filters) {
                var match = false;
                if (!match &&
                    filters.includes('User Name')) {
                    var uname = String(ctx.ref.username);
                    match = uname.toUpperCase().includes(query) &&
                        !uname.startsWith('steam_');
                }
                if (!match &&
                    filters.includes('Display Name') &&
                    ctx.ref.displayName) {
                    match = String(ctx.ref.displayName).toUpperCase().includes(query);
                }
                if (!match &&
                    filters.includes('Memo') &&
                    ctx.memo) {
                    match = String(ctx.memo).toUpperCase().includes(query);
                }
                if (!match &&
                    filters.includes('Bio') &&
                    ctx.ref.bio) {
                    match = String(ctx.ref.bio).toUpperCase().includes(query);
                }
                if (!match &&
                    filters.includes('Status') &&
                    ctx.ref.statusDescription) {
                    match = String(ctx.ref.statusDescription).toUpperCase().includes(query);
                }
                if (!match &&
                    filters.includes('Rank') &&
                    ctx.ref.$friendNum) {
                    match = String(ctx.ref.$trustLevel).toUpperCase().includes(query);
                }
                if (!match) {
                    continue;
                }
            }
            ctx.ref.$friendNum = ctx.no;
            switch (ctx.ref.$trustLevel) {
                case 'Nuisance':
                    ctx.ref.$trustNum = '0';
                    break;
                case 'Visitor':
                    ctx.ref.$trustNum = '1';
                    break;
                case 'New User':
                    ctx.ref.$trustNum = '2';
                    break;
                case 'User':
                    ctx.ref.$trustNum = '3';
                    break;
                case 'Known User':
                    ctx.ref.$trustNum = '4';
                    break;
                case 'Trusted User':
                    ctx.ref.$trustNum = '5';
                    break;
                case 'Veteran User':
                    ctx.ref.$trustNum = '6';
                    break;
                case 'Legendary User':
                    ctx.ref.$trustNum = '7';
                    break;
                case 'VRChat Team':
                    ctx.ref.$trustNum = '8';
                    break;
            }
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
                userId: userId
            });
            await new Promise(resolve => setTimeout(resolve, 1000));
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
        if ((!files.length) || (!this.avatarDialog.visible) || (this.avatarDialog.loading)) {
            clearFile();
            return;
        }
        if (files[0].size >= 10000000) { //10MB
            $app.$message({
                message: 'File size too large',
                type: 'error'
            });
            clearFile();
            return;
        }
        if (!files[0].type.match(/image.png/)) {
            $app.$message({
                message: 'File isn\'t a png',
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
            var signatureSizeInBytes = await $app.genLength(base64SignatureFile);
            var avatarId = $app.avatarDialog.id;
            var { imageUrl } = $app.avatarDialog.ref;
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
                    params
                };
                this.$emit('AVATARIMAGE:INIT', args);
                return args;
            });
        } catch (err) {
            console.error(err);
            this.uploadAvatarFailCleanup(fileId);
        }
    };

    API.uploadAvatarFailCleanup = async function (fileId) {
        var json = await this.call(`file/${fileId}`, {
            method: 'GET'
        }).then((json) => {
            return json;
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
        var fileVersion = args.json.versions[args.json.versions.length - 1].version;
        var params = {
            fileId,
            fileVersion
        };
        this.uploadAvatarImageFileStart(params);
    });

    API.uploadAvatarImageFileStart = async function (params) {
        try {
            return await this.call(`file/${params.fileId}/${params.fileVersion}/file/start`, {
                method: 'PUT'
            }).then((json) => {
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
    };

    API.$on('AVATARIMAGE:FILESTART', function (args) {
        var { url } = args.json;
        var { fileId, fileVersion } = args.params;
        var params = {
            url,
            fileId,
            fileVersion
        };
        this.uploadAvatarImageFileAWS(params);
    });

    API.uploadAvatarImageFileAWS = function (params) {
        return webApiService.execute({
            url: params.url,
            uploadFilePUT: true,
            fileData: $app.avatarImage.base64File,
            fileMIME: 'image/png',
            headers: {
                'Content-MD5': $app.avatarImage.fileMd5
            }
        }).then((json) => {
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
        var { fileId, fileVersion } = args.params;
        var params = {
            fileId,
            fileVersion
        };
        this.uploadAvatarImageFileFinish(params);
    });

    API.uploadAvatarImageFileFinish = function (params) {
        return this.call(`file/${params.fileId}/${params.fileVersion}/file/finish`, {
            method: 'PUT',
            params: {
                maxParts: 0,
                nextPartNumber: 0
            }
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('AVATARIMAGE:FILEFINISH', args);
            return args;
        });
    };

    API.$on('AVATARIMAGE:FILEFINISH', function (args) {
        var { fileId, fileVersion } = args.params;
        var params = {
            fileId,
            fileVersion
        };
        this.uploadAvatarImageSigStart(params);
    });

    API.uploadAvatarImageSigStart = async function (params) {
        try {
            return await this.call(`file/${params.fileId}/${params.fileVersion}/signature/start`, {
                method: 'PUT'
            }).then((json) => {
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
    };

    API.$on('AVATARIMAGE:SIGSTART', function (args) {
        var { url } = args.json;
        var { fileId, fileVersion } = args.params;
        var params = {
            url,
            fileId,
            fileVersion
        };
        this.uploadAvatarImageSigAWS(params);
    });

    API.uploadAvatarImageSigAWS = function (params) {
        return webApiService.execute({
            url: params.url,
            uploadFilePUT: true,
            fileData: $app.avatarImage.base64SignatureFile,
            fileMIME: 'application/x-rsync-signature',
            headers: {
                'Content-MD5': $app.avatarImage.signatureMd5
            }
        }).then((json) => {
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
        var { fileId, fileVersion } = args.params;
        var params = {
            fileId,
            fileVersion
        };
        this.uploadAvatarImageSigFinish(params);
    });

    API.uploadAvatarImageSigFinish = function (params) {
        return this.call(`file/${params.fileId}/${params.fileVersion}/signature/finish`, {
            method: 'PUT',
            params: {
                maxParts: 0,
                nextPartNumber: 0
            }
        }).then((json) => {
            var args = {
                json,
                params
            };
            this.$emit('AVATARIMAGE:SIGFINISH', args);
            return args;
        });
    };

    API.$on('AVATARIMAGE:SIGFINISH', function (args) {
        var { fileId, fileVersion } = args.params;
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
        if (type === 'Avatar') {
            var { imageUrl } = this.avatarDialog.ref;
        } else if (type === 'World') {
            var { imageUrl } = this.worldDialog.ref;
        } else if (type === 'User') {
            var imageUrl = this.userDialog.ref.currentAvatarImageUrl;
        }
        var fileId = extractFileId(imageUrl);
        if (!fileId) {
            return;
        }
        var params = {
            fileId
        };
        if (type === 'Avatar') {
            if (command === 'Display') {
                this.previousImagesDialogVisible = true;
                this.$nextTick(() => adjustDialogZ(this.$refs.previousImagesDialog.$el));
            } else if (command === 'Change') {
                this.changeAvatarImageDialogVisible = true;
                this.$nextTick(() => adjustDialogZ(this.$refs.changeAvatarImageDialog.$el));
            }
            API.getAvatarImages(params).then((args) => {
                this.previousImagesTableFileId = args.json.id;
                var images = args.json.versions;
                var imageArray = [];
                images.forEach((image) => {
                    if (image.file) {
                        imageArray.push(image.file.url);
                    }
                });
                this.previousImagesTable = images;
            });
        } else if (type === 'World') {
            if (command === 'Display') {
                this.previousImagesDialogVisible = true;
                this.$nextTick(() => adjustDialogZ(this.$refs.previousImagesDialog.$el));
            } else if (command === 'Change') {
                this.changeWorldImageDialogVisible = true;
                this.$nextTick(() => adjustDialogZ(this.$refs.changeWorldImageDialog.$el));
            }
            API.getWorldImages(params).then((args) => {
                this.previousImagesTableFileId = args.json.id;
                var images = args.json.versions;
                var imageArray = [];
                images.forEach((image) => {
                if (image.file) {
                        imageArray.push(image.file.url);
                    }
                });
                this.previousImagesTable = images;
            });
        } else if (type === 'User') {
            this.previousImagesDialogVisible = true;
            this.$nextTick(() => adjustDialogZ(this.$refs.previousImagesDialog.$el));
            API.getAvatarImages(params).then((args) => {
                this.previousImagesTableFileId = args.json.id;
                var images = args.json.versions;
                var imageArray = [];
                images.forEach((image) => {
                    if (image.file) {
                        imageArray.push(image.file.url);
                    }
                });
                this.previousImagesTable = images;
            });
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

    API.getAvatarImages = async function (params) {
        return await this.call(`file/${params.fileId}`, {
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

    API.getWorldImages = async function (params) {
        return await this.call(`file/${params.fileId}`, {
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
        var ref = args.json.versions[args.json.versions.length - 1];
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
        if (`https://api.vrchat.cloud/api/1/file/${this.previousImagesTableFileId}/${image.version}/file` === this.avatarDialog.ref.imageUrl) {
            return true;
        }
        return false;
    };

    // Avatar names

    API.cachedAvatarNames = new Map();

    $app.methods.getAvatarName = function (args) {
        var D = this.userDialog;
        D.$avatarInfo = {
            ownerId: '',
            avatarName: '-'
        };
        if (!D.visible) {
            return;
        }
        var imageUrl = D.ref.currentAvatarImageUrl;
        var fileId = extractFileId(imageUrl);
        if (!fileId) {
            return;
        }
        if (API.cachedAvatarNames.has(fileId)) {
            D.$avatarInfo = API.cachedAvatarNames.get(fileId);
            return;
        }
        var params = {
            fileId
        };
        API.getAvatarImages(params).then((args) => {
            var avatarInfo = this.storeAvatarImage(args);
            this.userDialog.$avatarInfo = avatarInfo;
        });
    };

    $app.data.discordNamesDialogVisible = false;
    $app.data.discordNamesContent = '';

    $app.methods.showDiscordNamesDialog = function () {
        var { friends } = API.currentUser;
        if (Array.isArray(friends) === false) {
            return;
        }
        var lines = [
            'DisplayName,DiscordName'
        ];
        var _ = function (str) {
            if (/[\x00-\x1f,"]/.test(str) === true) {
                str = `"${str.replace(/"/g, '""')}"`;
            }
            return str;
        };
        for (var userId of friends) {
            var { ref } = this.friends.get(userId);
            var discord = '';
            if (typeof ref === 'undefined') {
                continue;
            }
            var name = ref.displayName;
            if (ref.statusDescription) {
                var statusRegex = /(?:^|\n*)(?:(?:[^\n:]|\|)*(?::|˸|discord)[\t\v\f\r]*)?([^\n]*(#|＃)(?: )?\d{4})/gi.exec(ref.statusDescription);
                if (statusRegex) {
                    discord = statusRegex[1];
                }
            }
            if ((!discord) && (ref.bio)) {
                var bioRegex = /(?:^|\n*)(?:(?:[^\n:]|\|)*(?::|˸|discord)[\t\v\f\r]*)?([^\n]*(#|＃)(?: )?\d{4})/gi.exec(ref.bio);
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

    $app = new Vue($app);
    window.$app = $app;
}());
