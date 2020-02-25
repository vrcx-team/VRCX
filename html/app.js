// Copyright(c) 2019-2020 pypy and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

CefSharp.BindObjectAsync(
	'VRCX',
	'VRCXStorage',
	'SQLite',
	'LogWatcher',
	'Discord'
).then(function () {
	document.addEventListener('keyup', function (e) {
		if (e.ctrlKey) {
			if (e.shiftKey && e.code === 'KeyI') {
				VRCX.ShowDevTools();
			} else if (e.code === 'KeyR') {
				location.reload();
			}
		}
	});

	VRCXStorage.GetBool = function (key) {
		return this.Get(key) === 'true';
	};

	VRCXStorage.SetBool = function (key, value) {
		this.Set(key, value
			? 'true'
			: 'false');
	};

	VRCXStorage.GetInt = function (key) {
		return parseInt(this.Get(key), 10) || 0;
	};

	VRCXStorage.SetInt = function (key, value) {
		this.Set(key, String(value));
	};

	VRCXStorage.GetFloat = function (key) {
		return parseFloat(this.Get(key), 10) || 0.0;
	};

	VRCXStorage.SetFloat = function (key, value) {
		this.Set(key, String(value));
	};

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
		/*
		animation: {
			open: 'animated bounceInLeft',
			close: 'animated bounceOutLeft'
		},
		*/
		layout: 'bottomLeft',
		theme: 'mint',
		timeout: 6000
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
		return s.replace(/["&'<>]/gu, (c) => `&#${c.charCodeAt(0)};`);
	};
	Vue.filter('escapeTag', escapeTag);

	var commaNumber = function (num) {
		var s = String(Number(num));
		return s.replace(/(\d)(?=(\d{3})+(?!\d))/gu, '$1,');
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
		return format.replace(/YYYY|MM|DD|HH24|HH|MI|SS|AMPM/gu, (c) => map[c] || c);
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

	Vue.use(DataTables.DataTables);

	ELEMENT.locale(ELEMENT.lang.en);

	var uuidv4 = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/gu, (c) => {
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

	// FIXME : extra를 없애줘
	API.$throw = function (code, error, extra) {
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
		if (extra !== undefined) {
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
		if (options.handle !== undefined) {
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
		} else if (options.done !== undefined) {
			options.done.call(this, true, options);
		}
		return args;
	};

	API.bulk = function (options) {
		this[options.fn](options.params).catch((err) => {
			if (options.done !== undefined) {
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

	Vue.component('location', {
		template: '<span @click="showWorldDialog" :class="{ \'x-link\': link }">{{ text }}<slot></slot></span>',
		props: {
			location: String,
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
		VRCX.DeleteAllCookies();
		this.isLoggedIn = false;
	});

	API.$on('USER:CURRENT', function (args) {
		args.ref = this.applyCurrentUser(args.json);
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
		var auth = `${params.username}:${params.password}`;
		auth = encodeURIComponent(auth);
		auth = auth.replace(/%([0-9A-F]{2})/gu, (_, s) => String.fromCharCode(parseInt(s, 16)));
		auth = auth.replace('%', '%25');
		auth = btoa(auth);
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

	API.applyCurrentUser = function (json) {
		var ref = this.currentUser;
		if (this.isLoggedIn) {
			Object.assign(ref, json);
			if (ref.homeLocation !== ref.$homeLocation.tag) {
				ref.$homeLocation = this.parseLocation(ref.homeLocation);
			}
			this.applyUserTrustLevel(ref);
		} else {
			ref = {
				id: '',
				username: '',
				displayName: '',
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
				allowAvatarCopying: false,
				friendKey: '',
				onlineFriends: [],
				activeFriends: [],
				offlineFriends: [],
				// VRCX
				$homeLocation: {},
				$isModerator: false,
				$isTroll: false,
				$trustLevel: 'Visitor',
				$trustClass: 'x-tag-untrusted',
				//
				...json
			};
			ref.$homeLocation = this.parseLocation(ref.homeLocation);
			this.applyUserTrustLevel(ref);
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
			var { length } = userUpdateQueue;
			for (var i = 0; i < length; ++i) {
				API.$emit('USER:UPDATE', userUpdateQueue[i]);
			}
			userUpdateQueue.length = 0;
		}, 1);
	};

	API.applyUser = function (json) {
		var ref = this.cachedUsers.get(json.id);
		if (ref === undefined) {
			ref = {
				id: '',
				username: '',
				displayName: '',
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
				allowAvatarCopying: false,
				isFriend: false,
				friendKey: '',
				location: '',
				worldId: '',
				instanceId: '',
				// VRCX
				$location: {},
				$location_at: Date.now(),
				$isModerator: false,
				$isTroll: false,
				$trustLevel: 'Visitor',
				$trustClass: 'x-tag-untrusted',
				//
				...json
			};
			ref.$location = this.parseLocation(ref.location);
			this.applyUserTrustLevel(ref);
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
			this.applyUserTrustLevel(ref);
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
			if (has) {
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
			if (ref === undefined) {
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
			if (ref === undefined) {
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
		if (option !== undefined) {
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

	// API: Friend

	API.friends200 = new Set();
	API.friends404 = new Map();
	API.isFriendsLoading = false;

	API.$on('LOGIN', function () {
		this.friends200.clear();
		this.friends404.clear();
		this.isFriendsLoading = false;
	});

	API.$on('FRIEND:LIST', function (args) {
		for (var json of args.json) {
			this.$emit('USER', {
				json,
				params: {
					userId: json.id
				}
			});
			this.friends200.add(json.id);
			this.friends404.delete(json.id);
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
			n: 100,
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

	API.$on('AVATAR:SELECT', function (args) {
		this.$emit('USER:CURRENT', args);
	});

	API.applyAvatar = function (json) {
		var ref = this.cachedAvatars.get(json.id);
		if (ref === undefined) {
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
			if (ref === undefined) {
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
		if (ref === undefined ||
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
		if (ref === undefined &&
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
		if (ref === undefined) {
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
				n: 100,
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
	API.sendNotification = function (params) {
		return this.call(`user/${params.receiverUserId}/notification`, {
			method: 'POST',
			params
		}).then((json) => {
			var args = {
				json,
				params
			};
			this.$emit('NOTIFICATION:SEND', args);
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
		this.isPlayerModerationsLoading = false;
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
		this.$emit('PLAYER-MODERATION', {
			json: args.json,
			params: {
				playerModerationId: args.json.id
			}
		});
	});

	API.$on('PLAYER-MODERATION:DELETE', function (args) {
		var { type, moderated } = args.param;
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
		if (ref === undefined) {
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
			this.getPlayerModerationsAgainstMe()
		]).finally(() => {
			this.isPlayerModerationsLoading = false;
		}).then(() => {
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
		if (ref === undefined) {
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

	API.$on('FAVORITE:FRIEND:LIST', function (args) {
		for (var json of args.json) {
			this.$emit('USER', {
				json,
				params: {
					userId: json.id
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
		if (ref === undefined) {
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
			if (group !== undefined) {
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
			'friend': [0, 'getFavoriteFriends'],
			'world': [0, 'getFavoriteWorlds'],
			'avatar': [0, 'getFavoriteAvatars']
		};
		for (var ref of this.cachedFavorites.values()) {
			if (ref.$isDeleted) {
				continue;
			}
			var type = types[ref.type];
			if (type === undefined) {
				continue;
			}
			++type[0];
		}
		for (var type in types) {
			var [N, fn] = types[type];
			if (N > 0) {
				this.bulk({
					fn,
					N,
					params: {
						n: 100,
						offset: 0
					}
				});
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
				n: 100,
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
		if (ref === undefined) {
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
		// 16 = ['avatars1'] x 16
		this.favoriteAvatarGroups = [];
		for (var i = 0; i < 1; ++i) {
			this.favoriteAvatarGroups.push({
				assign: false,
				key: `avatar:avatars${i + 1}`,
				type: 'avatar',
				name: `avatars${i + 1}`,
				displayName: `Group ${i + 1}`,
				capacity: 16,
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
			if (groups === undefined) {
				continue;
			}
			for (var group of groups) {
				if (group.assign === false &&
					group.name === ref.name) {
					group.assign = true;
					group.displayName = ref.displayName;
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
			if (groups === undefined) {
				continue;
			}
			for (var group of groups) {
				if (group.assign === false) {
					group.assign = true;
					group.key = `${group.type}:${ref.name}`;
					group.name = ref.name;
					group.displayName = ref.displayName;
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
			if (group === undefined) {
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
				n: 100,
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
	API.getFavoriteFriends = function (params) {
		return this.call('auth/user/friends/favorite', {
			method: 'GET',
			params
		}).then((json) => {
			var args = {
				json,
				params
			};
			this.$emit('FAVORITE:FRIEND:LIST', args);
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
				// it seems to only come when a friend is in a private world :/
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
		var match = String(s).match(/file_[0-9A-Za-z-]+/u);
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

	var $app = {
		data: {
			API,
			VRCX,
			nextRefresh: 0,
			isGameRunning: false,
			appVersion: 'VRCX 2020.02.01',
			latestAppVersion: '',
			ossDialog: false
		},
		computed: {},
		methods: {},
		watch: {},
		el: '#x-app',
		mounted() {
			LogWatcher.Reset().then(() => {
				API.$on('SHOW_WORLD_DIALOG', (tag) => this.showWorldDialog(tag));
				API.$on('SHOW_LAUNCH_DIALOG', (tag) => this.showLaunchDialog(tag));
				setInterval(() => this.update(), 1000);
				this.update();
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
			});
			this.checkAppVersion();
		}
	};

	$app.methods.checkAppVersion = function () {
		var url = 'https://api.github.com/repos/pypy-vrc/VRCX/releases/latest';
		fetch(url).then((res) => res.json()).then((json) => {
			if (json === Object(json) &&
				json.name &&
				json.published_at) {
				this.latestAppVersion = `${json.name} (${formatDate(json.published_at, 'YYYY-MM-DD HH24:MI:SS')})`;
				if (json.name > this.appVersion) {
					new Noty({
						type: 'info',
						text: `Update available!!<br>${this.latestAppVersion}`,
						timeout: false,
						callbacks: {
							onClick: () => VRCX.OpenRepository()
						}
					}).show();
					this.notifyMenu('more');
				}
			} else {
				this.latestAppVersion = 'Error occured';
			}
		});
	};

	$app.methods.update = function () {
		if (API.isLoggedIn === false) {
			return;
		}
		if (--this.nextRefresh <= 0) {
			this.nextRefresh = 60;
			API.getCurrentUser().catch((err1) => {
				if (err1.status_code === 401) {
					API.getConfig().then((args) => {
						API.login({
							username: this.loginForm.username,
							password: this.loginForm.password
						}).catch((err2) => {
							if (err2.status_code === 401) {
								API.logout();
							}
							throw err2;
						});
						return args;
					});
				}
				throw err1;
			});
		}
		this.checkActiveFriends();
		this.refreshGameLog();
		VRCX.IsGameRunning().then((running) => {
			if (running !== this.isGameRunning) {
				this.isGameRunning = running;
				Discord.SetTimestamps(Date.now(), 0);
			}
			this.updateDiscord();
			this.updateOpenVR();
		});
	};

	$app.methods.updateSharedFeed = function () {
		var arr = [];
		// FIXME
		// 여러 개 켠다면 gameLogTable의 데이터가 시간순이 아닐 수도 있음
		var { data } = this.gameLogTable;
		var i = data.length;
		var j = 0;
		while (j < 25) {
			if (i <= 0) {
				break;
			}
			var ctx = data[--i];
			// Location, OnPlayerJoined, OnPlayerLeft
			if (ctx.type) {
				// FIXME: 이거 존나 느릴거 같은데
				var isFriend = false;
				var isFavorite = false;
				for (var ref of API.cachedUsers.values()) {
					if (ref.displayName === ctx.data) {
						isFriend = this.friends.has(ref.id);
						isFavorite = API.cachedFavoritesByObjectId.has(ref.id);
						break;
					}
				}
				arr.push({
					...ctx,
					isFriend,
					isFavorite
				});
			} else {
				arr.push(ctx);
			}
			++j;
		}
		var { data } = this.feedTable;
		var i = data.length;
		var j = 0;
		while (j < 25) {
			if (i <= 0) {
				break;
			}
			var ctx = data[--i];
			// GPS, Online, Offline, Status, Avatar
			if (ctx.type !== 'Avatar') {
				arr.push({
					...ctx,
					isFriend: this.friends.has(ctx.userId),
					isFavorite: API.cachedFavoritesByObjectId.has(ctx.userId)
				});
				++j;
			}
		}
		arr.sort(function (a, b) {
			if (a.created_at < b.created_at) {
				return 1;
			}
			if (a.created_at > b.created_at) {
				return -1;
			}
			return 0;
		});
		if (arr.length > 25) {
			arr.length = 25;
		}
		VRCXStorage.SetArray('sharedFeeds', arr);
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
			inputPattern: /^[0-9]{6}$/u,
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
			inputPattern: /^[a-z0-9]{4}-[a-z0-9]{4}$/u,
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
	});

	$app.data.loginForm = {
		loading: true,
		username: '',
		password: '',
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
						password: this.loginForm.password
					}).finally(() => {
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
			VRCX.LoginWithSteam().catch((err) => {
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
	$app.data.orderFriendsGroup0 = VRCXStorage.GetBool('orderFriendGroup0');
	$app.data.orderFriendsGroup1 = VRCXStorage.GetBool('orderFriendGroup1');
	$app.data.orderFriendsGroup2 = VRCXStorage.GetBool('orderFriendGroup2');
	$app.data.orderFriendsGroup3 = VRCXStorage.GetBool('orderFriendGroup3');
	var saveOrderFriendGroup = function () {
		VRCXStorage.SetBool('orderFriendGroup0', this.orderFriendsGroup0);
		VRCXStorage.SetBool('orderFriendGroup1', this.orderFriendsGroup1);
		VRCXStorage.SetBool('orderFriendGroup2', this.orderFriendsGroup2);
		VRCXStorage.SetBool('orderFriendGroup3', this.orderFriendsGroup3);
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

	$app.methods.checkActiveFriends = function () {
		if (Array.isArray(API.currentUser.activeFriends) === false) {
			return;
		}
		for (var userId of API.currentUser.activeFriends) {
			if (API.cachedUsers.has(userId) ||
				this.pendingActiveFriends.has(userId)) {
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
		// called from API.login(), API.loginWithSteam(), API.getCurrentUser()
		if (origin) {
			API.refreshFriends();
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
		if (ref === undefined) {
			ref = this.friendLog[id];
			if (ref !== undefined &&
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
		if (ctx === undefined) {
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

	$app.methods.updateFriend = function (id, state, origin) {
		var ctx = this.friends.get(id);
		if (ctx === undefined) {
			return;
		}
		var ref = API.cachedUsers.get(id);
		var isVIP = API.cachedFavoritesByObjectId.has(id);
		if (state === undefined ||
			ctx.state === state) {
			// this is should be: undefined -> user
			if (ctx.ref !== ref) {
				ctx.ref = ref;
				// NOTE
				// AddFriend (CurrentUser) 이후,
				// 서버에서 오는 순서라고 보면 될 듯.
				if (ctx.state === 'online') {
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
			if (ref !== undefined &&
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
				ref !== undefined &&
				ref.location !== '' &&
				ref.location !== 'offline') {
				API.getUser({
					userId: id
				});
			}
		} else {
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
			if (ref !== undefined) {
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
		}
	};

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
		if (user !== undefined) {
			if (user.location === 'offline') {
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
				if (ctx.ref === undefined) {
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
				this.searchText = value.substr(7);
				this.search();
				this.$refs.menu.activeIndex = 'search';
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
		if (props.currentAvatarThumbnailImageUrl) {
			$app.addFeed('Avatar', ref, {
				avatar: props.currentAvatarThumbnailImageUrl
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

	$app.data.lastLocation = '';
	$app.data.lastLocation$ = {};
	$app.data.discordActive = VRCXStorage.GetBool('discordActive');
	$app.data.discordInstance = VRCXStorage.GetBool('discordInstance');
	var saveDiscordOption = function () {
		VRCXStorage.SetBool('discordActive', this.discordActive);
		VRCXStorage.SetBool('discordInstance', this.discordInstance);
	};
	$app.watch.discordActive = saveDiscordOption;
	$app.watch.discordInstance = saveDiscordOption;

	$app.data.gameLogTable = {
		data: [],
		filters: [
			{
				prop: 'type',
				value: [],
				filterFn: (row, filter) => filter.value.some((v) => v === row.type)
			},
			{
				prop: 'detail',
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

	$app.methods.resetGameLog = function () {
		LogWatcher.Reset().then(() => {
			this.gameLogTable.data = [];
		});
	};

	$app.methods.refreshGameLog = function () {
		LogWatcher.Get().then((logs) => {
			if (logs.length) {
				var { data } = this.gameLogTable;
				for (var log of logs) {
					var ctx = {
						created_at: String(log[0]),
						type: String(log[1]),
						data: String(log[2])
					};
					if (ctx.type === 'Location') {
						var tag = ctx.data;
						if (tag.endsWith(':')) {
							tag = tag.substr(0, tag.length - 1);
							ctx.data = tag;
						}
						this.lastLocation = tag;
					}
					data.push(ctx);
				}
				this.sweepGameLog();
				// sweepGameLog로 기록이 삭제되면
				// 아무 것도 없는데 알림이 떠서 이상함
				if (data.length) {
					this.notifyMenu('gameLog');
				}
			}
			this.updateSharedFeed();
		});
	};

	$app.methods.sweepGameLog = function () {
		var { data } = this.gameLogTable;
		// 로그는 3일까지만 남김
		var limit = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toJSON();
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
		if (this.isGameRunning === false ||
			this.lastLocation === '') {
			Discord.SetActive(false);
			return;
		}
		if (this.lastLocation !== this.lastLocation$.tag) {
			var L = API.parseLocation(this.lastLocation);
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

	$app.methods.lookupUser = function (name) {
		for (var ref of API.cachedUsers.values()) {
			if (ref.displayName === name) {
				this.showUserDialog(ref.id);
				return;
			}
		}
		this.searchText = name;
		this.search();
		this.$refs.menu.activeIndex = 'search';
		this.$refs.searchTab.currentName = '0';
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

	$app.methods.searchUser = function () {
		this.searchUserParams = {
			n: 10,
			offset: 0,
			search: this.searchText
		};
		this.moreSearchUser();
	};

	$app.methods.moreSearchUser = function (go) {
		var params = this.searchUserParams;
		if (go) {
			params.offset += params.n * go;
			if (params.offset < 0) {
				params.offset = 0;
			}
		}
		this.isSearchUserLoading = true;
		API.getUsers(params).finally(() => {
			this.isSearchUserLoading = false;
		}).then((args) => {
			var map = new Map();
			for (var json of args.json) {
				var ref = API.cachedUsers.get(json.id);
				if (ref !== undefined) {
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
				if (ref !== undefined) {
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
				if (ref !== undefined) {
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
		if (favorite !== undefined) {
			var isTypeChanged = false;
			if (ctx === undefined) {
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
					if (ref === undefined) {
						ref = this.friendLog[objectId];
						if (ref !== undefined &&
							ref.displayName) {
							ctx.name = ref.displayName;
						}
					} else {
						ctx.ref = ref;
						ctx.name = ref.displayName;
					}
				} else if (type === 'world') {
					var ref = API.cachedWorlds.get(objectId);
					if (ref !== undefined) {
						ctx.ref = ref;
						ctx.name = ref.name;
					}
				} else if (type === 'avatar') {
					var ref = API.cachedAvatars.get(objectId);
					if (ref !== undefined) {
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
					if (ref !== undefined) {
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
					if (ref !== undefined) {
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
					if (ref !== undefined) {
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
		} else if (ctx !== undefined) {
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
			inputPattern: /\S+/u,
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
		if (ref === undefined) {
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
		if (ref === undefined) {
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
				if (user !== undefined) {
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
		if (this.friendLog[id] !== undefined) {
			return;
		}
		var ctx = {
			id,
			displayName: null,
			trustLevel: null
		};
		Vue.set(this.friendLog, id, ctx);
		var ref = API.cachedUsers.get(id);
		if (ref !== undefined) {
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
		if (ctx === undefined) {
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
		if (ctx === undefined) {
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
			$app.notifyMenu('moderation');
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

	// App: More

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
	$app.data.visits = 0;
	$app.data.openVR = VRCXStorage.GetBool('openVR');
	$app.data.openVRAlways = VRCXStorage.GetBool('openVRAlways');
	var saveOpenVROption = function () {
		VRCXStorage.SetBool('openVR', this.openVR);
		VRCXStorage.SetBool('openVRAlways', this.openVRAlways);
	};
	$app.watch.openVR = saveOpenVROption;
	$app.watch.openVRAlways = saveOpenVROption;
	$app.data.isDarkMode = VRCXStorage.GetBool('isDarkMode');
	$appDarkStyle.disabled = $app.data.isDarkMode === false;
	$app.watch.isDarkMode = function () {
		VRCXStorage.SetBool('isDarkMode', this.isDarkMode);
		$appDarkStyle.disabled = this.isDarkMode === false;
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

	$app.methods.updateOpenVR = function () {
		if (this.openVR &&
			(this.isGameRunning || this.openVRAlways)) {
			VRCX.StartVR();
		} else {
			VRCX.StopVR();
		}
	};

	$app.methods.refreshCurrentUserTreeData = function () {
		this.currentUserTreeData = buildTreeData(API.currentUser);
	};

	$app.methods.promptUserDialog = function () {
		this.$prompt('Enter a User ID (UUID)', 'Direct Access', {
			distinguishCancelAndClose: true,
			confirmButtonText: 'OK',
			cancelButtonText: 'Cancel',
			inputPattern: /\S+/u,
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
			inputPattern: /\S+/u,
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
			inputPattern: /\S+/u,
			inputErrorMessage: 'Avatar ID is required',
			callback: (action, instance) => {
				if (action === 'confirm' &&
					instance.inputValue) {
					this.showAvatarDialog(instance.inputValue);
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

		treeData: [],
		memo: ''
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
			ref === undefined ||
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

	API.$on('PLAYER-MODERATION', function (args) {
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
				worlds.sort(compareByName);
				D.worlds = worlds;
				var avatars = [];
				for (var ref of API.cachedAvatars.values()) {
					if (ref.authorId === D.id) {
						avatars.push(ref);
					}
				}
				avatars.sort(compareByName);
				D.avatars = avatars;
				D.isWorldsLoading = false;
				D.isAvatarsLoading = false;
				API.getFriendStatus({
					userId: D.id
				});
				if (args.cache) {
					API.getUser(args.params);
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
			if (ref === undefined) {
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
		if (L.isOffline === false) {
			for (var { ref } of this.friends.values()) {
				if (ref !== undefined &&
					ref.location === L.tag) {
					users.push(ref);
				}
			}
		}
		users.sort(compareByDisplayName);
		D.users = users;
		D.instance = {};
		if (L.worldId) {
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
			if (ref === undefined) {
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

	$app.methods.refreshUserDialogWorlds = function () {
		var D = this.userDialog;
		if (D.isWorldsLoading) {
			return;
		}
		D.isWorldsLoading = true;
		var params = {
			n: 100,
			offset: 0,
			sort: 'updated',
			order: 'descending',
			user: 'friends',
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
				map.set(ref.id, ref);
			}
		}
		API.bulk({
			fn: 'getWorlds',
			N: -1,
			params,
			handle: (args) => {
				for (var json of args.json) {
					var $ref = API.cachedWorlds.get(json.id);
					if ($ref !== undefined) {
						map.set($ref.id, $ref);
					}
				}
			},
			done: () => {
				var array = Array.from(map.values());
				array.sort(compareByName);
				if (D.id === params.userId) {
					D.worlds = array;
				}
				D.isWorldsLoading = false;
			}
		});
	};

	$app.methods.refreshUserDialogAvatars = function () {
		var D = this.userDialog;
		if (D.isAvatarsLoading) {
			return;
		}
		D.isAvatarsLoading = true;
		var params = {
			n: 100,
			offset: 0,
			sort: 'updated',
			order: 'descending',
			user: 'friends',
			userId: D.id,
			releaseStatus: 'public'
		};
		if (params.userId === API.currentUser.id) {
			params.user = 'me';
			params.releaseStatus = 'all';
		}
		var map = new Map();
		for (var ref of API.cachedAvatars.values()) {
			if (ref.authorId === D.id) {
				map.set(ref.id, ref);
			}
		}
		API.bulk({
			fn: 'getAvatars',
			N: -1,
			params,
			handle: (args) => {
				for (var json of args.json) {
					var $ref = API.cachedAvatars.get(json.id);
					if ($ref !== undefined) {
						map.set($ref.id, $ref);
					}
				}
			},
			done: () => {
				var array = Array.from(map.values());
				array.sort(compareByName);
				if (D.id === params.userId) {
					D.avatars = array;
				}
				D.isAvatarsLoading = false;
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
		} else if (command === 'Message') {
			this.$prompt('Enter a message', 'Send Message', {
				distinguishCancelAndClose: true,
				confirmButtonText: 'Send',
				cancelButtonText: 'Cancel',
				inputPattern: /\S+/u,
				inputErrorMessage: 'Message is required',
				callback: (action, instance) => {
					if (action === 'confirm' &&
						instance.inputValue) {
						API.sendNotification({
							receiverUserId: D.id,
							type: 'message',
							message: instance.inputValue,
							seen: false,
							details: '{}'
						}).then((args) => {
							this.$message('Message sent');
							return args;
						});
					}
				}
			});
		} else if (command === 'Show Avatar Author') {
			var id = extractFileId(D.ref.currentAvatarImageUrl);
			if (id) {
				API.call(`file/${id}`).then((json) => {
					if (json.ownerId === D.id) {
						this.$message({
							message: 'It\'s personal (own) avatar',
							type: 'warning'
						});
					} else {
						this.showUserDialog(json.ownerId);
					}
				});
			} else {
				this.$message({
					message: 'Sorry, the author is unknown',
					type: 'error'
				});
			}
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
			instances[instanceId] === undefined) {
			instances[instanceId] = {
				id: instanceId,
				occupants: 0,
				users: []
			};
		}
		for (var { ref } of this.friends.values()) {
			if (ref === undefined ||
				ref.$location === undefined ||
				ref.$location.worldId !== D.id) {
				continue;
			}
			var { instanceId } = ref.$location;
			var instance = instances[instanceId];
			if (instance === undefined) {
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
				if (ref === undefined) {
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
		if (command === 'New Instance') {
			this.showNewInstanceDialog(D.$location.tag);
		} else if (command === 'Add Favorite') {
			this.showFavoriteDialog('world', D.id);
		} else {
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
						default:
							break;
					}
				}
			});
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
		if (D.fileSize === 'Loading') {
			var id = extractFileId(args.ref.assetUrl);
			if (id) {
				this.call(`file/${id}`).then((json) => {
					var ref = json.versions[json.versions.length - 1];
					D.fileCreatedAt = ref.created_at;
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
		D.fileCreatedAt = '';
		D.fileSize = 'Loading';
		D.visible = true;
		D.loading = true;
		API.getCachedAvatar({
			avatarId
		}).catch((err) => {
			D.loading = false;
			D.visible = false;
			throw err;
		}).then((args) => {
			if (D.id === args.ref.id) {
				D.loading = false;
				D.ref = args.ref;
				D.isFavorite = API.cachedFavoritesByObjectId.has(D.ref.id);
				if (args.cache) {
					API.getAvatar(args.params);
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
		if (command === 'Add Favorite') {
			this.showFavoriteDialog('avatar', D.id);
		} else {
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
							});
							break;
						default:
							break;
					}
				}
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
				D.loading = true;
				var params = {
					receiverUserId: '',
					type: 'invite',
					message: '',
					seen: false,
					details: {
						worldId: D.worldId,
						worldName: D.worldName
					}
				};
				var inviteLoop = () => {
					if (D.userIds.length > 0) {
						params.receiverUserId = D.userIds.shift();
						API.sendNotification(params).finally(inviteLoop);
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

	// App: Launch Dialog

	$app.data.launchDialog = {
		visible: false,
		loading: false,
		desktop: VRCXStorage.GetBool('launchAsDesktop'),
		location: '',
		url: ''
	};

	$app.watch['launchDialog.desktop'] = function () {
		VRCXStorage.SetBool('launchAsDesktop', this.launchDialog.desktop);
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

	$app.methods.launchGame = function () {
		var D = this.launchDialog;
		VRCX.StartGame(D.location, D.desktop);
		D.visible = false;
	};

	$app = new Vue($app);
	window.$app = $app;
});
