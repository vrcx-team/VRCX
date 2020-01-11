// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

if (window.CefSharp) {
	Promise.all([
		CefSharp.BindObjectAsync('VRCX'),
		CefSharp.BindObjectAsync('VRCXStorage'),
		CefSharp.BindObjectAsync('SQLite'),
		CefSharp.BindObjectAsync('LogWatcher'),
		CefSharp.BindObjectAsync('Discord')
	]).catch(() => {
		location = 'https://github.com/pypy-vrc/vrcx';
	}).then(() => {

		var $nameColorStyle = document.createElement('style');
		$nameColorStyle.appendChild(document.createTextNode('.x-friend-item>.detail>.name { color: #303133 !important; }'));
		document.head.appendChild($nameColorStyle);

		document.addEventListener('keyup', (e) => {
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
				var json = this.Get(key);
				if (json) {
					var array = JSON.parse(json);
					if (Array.isArray(array)) {
						return array;
					}
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
				var json = this.Get(key);
				if (json) {
					return JSON.parse(json);
				}
			} catch (err) {
				console.error(err);
			}
			return {};
		};

		VRCXStorage.SetObject = function (key, value) {
			this.Set(key, JSON.stringify(value));
		};

		setInterval(() => VRCXStorage.Flush(), 5 * 60 * 1000);

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

		var isObject = (any) => any === Object(any);

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

		//
		// API
		//

		var API = {};

		API.$eventHandlers = new Map();

		API.$emit = function (name, ...args) {
			// console.log(name, ...args);
			var handlers = this.$eventHandlers.get(name);
			if (handlers === undefined) {
				return;
			}
			try {
				var { length } = handlers;
				for (var i = 0; i < length; ++i) {
					handlers[i].apply(this, args);
				}
			} catch (err) {
				console.error(err);
			}
		};

		API.$on = function (name, fx) {
			var handlers = this.$eventHandlers.get(name);
			if (handlers === undefined) {
				handlers = [];
				this.$eventHandlers.set(name, handlers);
			}
			handlers.push(fx);
		};

		API.$off = function (name, fx) {
			var handlers = this.$eventHandlers.get(name);
			if (handlers === undefined) {
				return;
			}
			var { length } = handlers;
			for (var i = 0; i < length; ++i) {
				if (handlers[i] === fx) {
					if (length > 1) {
						handlers.splice(i, 1);
					} else {
						this.$eventHandlers.delete(name);
					}
					break;
				}
			}
		};

		API.$pendingGetRequests = new Map();

		API.call = function (endpoint, options) {
			var input = `https://api.vrchat.cloud/api/1/${endpoint}`;
			var init = {
				method: 'GET',
				mode: 'cors',
				credentials: 'include',
				cache: 'no-cache',
				referrerPolicy: 'no-referrer',
				...options
			};
			var isGetRequest = init.method === 'GET';

			if (isGetRequest) {
				// transform body to url
				if (isObject(init.body)) {
					var url = new URL(input);
					for (var key in init.body) {
						url.searchParams.set(key, init.body[key]);
					}
					input = url.toString();
				}
				delete init.body;
				// merge requests
				var request = this.$pendingGetRequests.get(input);
				if (request) {
					return request;
				}
			} else {
				init.headers = {
					'Content-Type': 'application/json;charset=utf-8',
					...init.headers
				};
				init.body = isObject(init.body)
					? JSON.stringify(init.body)
					: '{}';
			}

			var req = fetch(input, init).catch((err) => {
				this.$throw(0, err);
			}).then((res) => res.json().catch(() => {
				if (!res.ok) {
					this.$throw(res.status);
				}
				this.$throw(0, 'Invalid JSON');
			}).then((json) => {
				if (res.ok) {
					if (json.success) {
						new Noty({
							type: 'success',
							text: escapeTag(json.success.message)
						}).show();
					}
				} else if (typeof json.error === 'object') {
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
				} else {
					this.$throw(res.status, json);
				}
				return json;
			}));

			if (isGetRequest) {
				req.finally(() => {
					this.$pendingGetRequests.delete(input);
				});
				this.$pendingGetRequests.set(input, req);
			}

			return req;
		};

		API.$status = {
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

		API.$throw = function (code, error, extra) {
			var text = [];
			if (code) {
				var status = this.$status[code];
				if (status) {
					text.push(`${code} ${status}`);
				} else {
					text.push(`${code}`);
				}
			}
			if (error !== undefined) {
				text.push(error);
			}
			if (extra !== undefined) {
				text.push(extra);
			}
			if (text.length) {
				new Noty({
					type: 'error',
					text: text.map((s) => escapeTag(s)).join('<br>')
				}).show();
			}
			throw {
				'status_code': code,
				error
			};
		};

		API.bulk = function (options) {
			var handle = (args) => {
				if (typeof options.handle === 'function') {
					options.handle(args, options);
				}
				if (args.json.length &&
					(options.param.offset += args.json.length,
						options.N > 0
							? options.N > options.param.offset
							: options.N < 0
								? args.json.length
								: options.param.n === args.json.length)) {
					this[options.fn](options.param).catch((err) => {
						if (typeof options.done === 'function') {
							options.done(false, options);
						}
						throw err;
					}).then(handle);
				} else if (typeof options.done === 'function') {
					options.done(true, options);
				}
				return args;
			};
			this[options.fn](options.param).catch((err) => {
				if (typeof options.done === 'function') {
					options.done(false, options);
				}
				throw err;
			}).then(handle);
		};

		// API: Config

		API.config = {};

		API.$on('CONFIG', (args) => {
			args.ref = API.updateConfig(args.json);
		});

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

		API.updateConfig = function (ref) {
			var ctx = {
				clientApiKey: '',
				...ref
			};
			this.config = ctx;
			return ctx;
		};

		// API: Location

		API.parseLocation = function (tag) {
			var L = {
				tag: String(tag || ''),
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
			if (L.tag === 'offline') {
				L.isOffline = true;
			} else if (L.tag === 'private') {
				L.isPrivate = true;
			} else if (!L.tag.startsWith('local')) {
				var sep = L.tag.indexOf(':');
				if (sep >= 0) {
					L.worldId = L.tag.substr(0, sep);
					L.instanceId = L.tag.substr(sep + 1);
					L.instanceId.split('~').forEach((s, i) => {
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
								L.hiddenId = value;
							} else if (key === 'private') {
								L.privateId = value;
							} else if (key === 'friends') {
								L.friendsId = value;
							} else if (key === 'canRequestInvite') {
								L.canRequestInvite = true;
							}
						} else {
							L.instanceName = s;
						}
					});
					L.accessType = 'public';
					if (L.privateId !== null) {
						if (L.canRequestInvite) {
							// InvitePlus
							L.accessType = 'invite+';
						} else {
							// InviteOnly
							L.accessType = 'invite';
						}
						L.userId = L.privateId;
					} else if (L.friendsId !== null) {
						// FriendsOnly
						L.accessType = 'friends';
						L.userId = L.friendsId;
					} else if (L.hiddenId !== null) {
						// FriendsOfGuests
						L.accessType = 'friends+';
						L.userId = L.hiddenId;
					}
				} else {
					L.worldId = L.tag;
				}
			}
			return L;
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
						var ref = API.world[L.worldId];
						if (ref) {
							if (L.instanceId) {
								this.text = `${ref.name} #${L.instanceName} ${L.accessType}`;
							} else {
								this.text = ref.name;
							}
						} else {
							API.getWorld({
								worldId: L.worldId
							}).then((args) => {
								if (L.tag === this.location) {
									if (L.instanceId) {
										this.text = `${args.ref.name} #${L.instanceName} ${L.accessType}`;
									} else {
										this.text = args.ref.name;
									}
								}
								return args;
							});
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
		API.currentUser = {};
		API.user = {};

		API.$on('LOGOUT', () => {
			API.isLoggedIn = false;
			VRCX.DeleteAllCookies();
		});

		API.$on('USER:CURRENT', (args) => {
			args.ref = API.updateCurrentUser(args.json);
		});

		API.$on('USER:CURRENT:SAVE', (args) => {
			API.$emit('USER:CURRENT', args);
		});

		API.$on('USER', (args) => {
			args.ref = API.updateUser(args.json);
		});

		API.$on('USER:LIST', (args) => {
			args.json.forEach((json) => {
				API.$emit('USER', {
					param: {
						userId: json.id
					},
					json
				});
			});
		});

		API.logout = function () {
			return this.call('logout', {
				method: 'PUT'
			}).finally(() => {
				this.$emit('LOGOUT');
			});
		};

		/*
			param: {
				username: string,
				password: string
			}
		*/
		API.login = function (param) {
			return this.call(`auth/user?apiKey=${this.config.clientApiKey}`, {
				method: 'GET',
				headers: {
					Authorization: `Basic ${btoa(encodeURIComponent(`${param.username}:${param.password}`).replace(/%([0-9A-F]{2})/gu, (_, s) => String.fromCharCode(parseInt(s, 16))).replace('%', '%25'))}`
				}
			}).then((json) => {
				var args = {
					param,
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

		/*
			param: {
				steamTicket: string
			}
		*/
		API.loginWithSteam = function (param) {
			return this.call(`auth/steam?apiKey=${this.config.clientApiKey}`, {
				method: 'POST',
				body: param
			}).then((json) => {
				var args = {
					param,
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

		/*
			param: {
				code: string
			}
		*/
		API.verifyOTP = function (param) {
			return this.call('auth/twofactorauth/otp/verify', {
				method: 'POST',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('OTP', args);
				return args;
			});
		};

		/*
			param: {
				code: string
			}
		*/
		API.verifyTOTP = function (param) {
			return this.call('auth/twofactorauth/totp/verify', {
				method: 'POST',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('TOTP', args);
				return args;
			});
		};

		API.getCurrentUser = function () {
			return this.call(`auth/user?apiKey=${this.config.clientApiKey}`, {
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

		API.updateCurrentUser = function (ref) {
			var ctx = null;
			if (this.isLoggedIn) {
				ctx = this.currentUser;
				Object.assign(ctx, ref);
				if (ctx.homeLocation_.tag !== ctx.homeLocation) {
					ctx.homeLocation_ = this.parseLocation(ctx.homeLocation);
				}
			} else {
				this.isLoggedIn = true;
				ctx = {
					id: ref.id,
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
					// custom
					homeLocation_: {},
					//
					...ref
				};
				ctx.homeLocation_ = this.parseLocation(ctx.homeLocation);
				this.currentUser = ctx;
				this.$emit('LOGIN', {
					json: ref,
					ref: ctx
				});
			}
			return ctx;
		};

		/*
			param: {
				userId: string
			}
		*/
		API.getUser = function (param) {
			return this.call(`users/${param.userId}`, {
				method: 'GET'
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('USER', args);
				return args;
			});
		};

		var userUpdateQueue = [];
		var userUpdateTimer = false;
		var queueUserUpdate = (args) => {
			userUpdateQueue.push(args);
			if (userUpdateTimer === false) {
				userUpdateTimer = setTimeout(() => {
					userUpdateTimer = false;
					userUpdateQueue.forEach((v) => API.$emit('USER:UPDATE', v));
					userUpdateQueue.length = 0;
				}, 1);
			}
		};

		API.updateUser = function (ref) {
			var ctx = this.user[ref.id];
			if (ctx) {
				var prop = {};
				var key = null;
				for (key in ctx) {
					if (typeof ctx[key] !== 'object') {
						prop[key] = true;
					}
				}
				var _ctx = { ...ctx };
				Object.assign(ctx, ref);
				if (ctx.location_.tag !== ctx.location) {
					ctx.location_ = this.parseLocation(ctx.location);
				}
				for (key in ctx) {
					if (typeof ctx[key] !== 'object') {
						prop[key] = true;
					}
				}
				var has = false;
				for (key in prop) {
					if (ctx[key] === _ctx[key]) {
						delete prop[key];
					} else {
						has = true;
						prop[key] = [
							ctx[key],
							_ctx[key]
						];
					}
				}
				if (has) {
					if (prop.location) {
						var now = Date.now();
						prop.location.push(now - ctx.location_at_);
						ctx.location_at_ = now;
					}
					queueUserUpdate({
						ref: ctx,
						prop
					});
				}
			} else {
				ctx = {
					id: ref.id,
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
					// custom
					location_: {},
					location_at_: Date.now(),
					admin_: false,
					troll_: false,
					trustLevel_: 'Visitor',
					trustClass_: 'x-tag-untrusted',
					//
					...ref
				};
				ctx.location_ = this.parseLocation(ctx.location);
				this.user[ctx.id] = ctx;
			}
			ctx.admin_ = ctx.developerType &&
				ctx.developerType !== 'none';
			if (ctx.tags) {
				ctx.admin_ = ctx.admin_ || ctx.tags.includes('admin_moderator');
				ctx.troll_ = ctx.tags.includes('system_probable_troll') ||
					ctx.tags.includes('system_troll');
				if (ctx.troll_) {
					ctx.trustLevel_ = 'Nuisance';
					ctx.trustClass_ = 'x-tag-troll';
				} else if (ctx.tags.includes('system_legend')) {
					ctx.trustLevel_ = 'Legendary User';
					ctx.trustClass_ = 'x-tag-legendary';
				} else if (ctx.tags.includes('system_trust_legend')) {
					ctx.trustLevel_ = 'Veteran User';
					ctx.trustClass_ = 'x-tag-legend';
				} else if (ctx.tags.includes('system_trust_veteran')) {
					ctx.trustLevel_ = 'Trusted User';
					ctx.trustClass_ = 'x-tag-veteran';
				} else if (ctx.tags.includes('system_trust_trusted')) {
					ctx.trustLevel_ = 'Known User';
					ctx.trustClass_ = 'x-tag-trusted';
				} else if (ctx.tags.includes('system_trust_known')) {
					ctx.trustLevel_ = 'User';
					ctx.trustClass_ = 'x-tag-known';
				} else if (ctx.tags.includes('system_trust_basic')) {
					ctx.trustLevel_ = 'New User';
					ctx.trustClass_ = 'x-tag-basic';
				} else {
					ctx.trustLevel_ = 'Visitor';
					ctx.trustClass_ = 'x-tag-untrusted';
				}
			}
			if (ctx.admin_) {
				ctx.trustLevel_ = 'VRChat Team';
				ctx.trustClass_ = 'x-tag-vip';
			}
			return ctx;
		};

		/*
			param: {
				userId: string
			}
		*/
		API.getCachedUser = function (param) {
			return new Promise((resolve, reject) => {
				var ctx = this.user[param.userId];
				if (ctx) {
					resolve({
						cache: true,
						ref: ctx,
						param
					});
				} else {
					this.getUser(param).catch(reject).then(resolve);
				}
			});
		};

		/*
			param: {
				n: number,
				offset: number,
				search: string,
				sort: string ('nuisanceFactor', 'created', '_created_at', 'last_login'),
				order: string ('ascending', 'descending')
			}
		*/
		API.getUsers = function (param) {
			return this.call('users', {
				method: 'GET',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('USER:LIST', args);
				return args;
			});
		};

		/*
			param: {
				status: string ('active', 'join me', 'busy', 'offline'),
				statusDescription: string
			}
		*/
		API.saveCurrentUser = function (param) {
			return this.call(`users/${this.currentUser.id}`, {
				method: 'PUT',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				// FIXME: handle this
				this.$emit('USER:CURRENT:SAVE', args);
				return args;
			});
		};

		// API: World

		API.world = {};

		API.$on('WORLD', (args) => {
			args.ref = API.updateWorld(args.json);
		});

		API.$on('WORLD:LIST', (args) => {
			args.json.forEach((json) => {
				API.$emit('WORLD', {
					param: {
						worldId: json.id
					},
					json
				});
			});
		});

		/*
			param: {
				worldId: string
			}
		*/
		API.getWorld = function (param) {
			return this.call(`worlds/${param.worldId}`, {
				method: 'GET'
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('WORLD', args);
				return args;
			});
		};

		API.updateWorld = function (ref) {
			var ctx = this.world[ref.id];
			if (ctx) {
				Object.assign(ctx, ref);
			} else {
				ctx = {
					id: ref.id,
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
					previewYoutubeId: '',
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
					// custom
					labs_: false,
					//
					...ref
				};
				this.world[ctx.id] = ctx;
			}
			if (ctx.tags) {
				ctx.labs_ = ctx.tags.includes('system_labs');
			}
			return ctx;
		};

		/*
			param: {
				worldId: string
			}
		*/
		API.getCachedWorld = function (param) {
			return new Promise((resolve, reject) => {
				var ctx = this.world[param.worldId];
				if (ctx) {
					resolve({
						cache: true,
						ref: ctx,
						param
					});
				} else {
					this.getWorld(param).catch(reject).then(resolve);
				}
			});
		};

		/*
			param: {
				n: number,
				offset: number,
				search: string,
				userId: string,
				user: string ('me','friend')
				sort: string ('popularity','heat','trust','shuffle','favorites','reportScore','reportCount','publicationDate','labsPublicationDate','created','_created_at','updated','_updated_at','order'),
				order: string ('ascending','descending'),
				releaseStatus: string ('public','private','hidden','all'),
				featured: boolean
			}
		*/
		API.getWorlds = function (param, option) {
			var endpoint = 'worlds';
			if (option) {
				endpoint = `worlds/${option}`;
			}
			return this.call(endpoint, {
				method: 'GET',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('WORLD:LIST', args);
				return args;
			});
		};

		// API: Friend

		API.friend404 = {};
		API.isFriendLoading = false;

		API.$on('LOGIN', () => {
			API.friend404 = {};
			API.isFriendLoading = false;
		});

		API.$on('FRIEND:LIST', (args) => {
			args.json.forEach((json) => {
				API.$emit('USER', {
					param: {
						userId: json.id
					},
					json
				});
				API.user[json.id].friend_ = true;
				delete API.friend404[json.id];
			});
		});

		API.checkFriends = function (mark) {
			if (!mark) {
				return this.currentUser.friends.every((id) => {
					var ctx = this.user[id];
					if (ctx &&
						ctx.friend_) {
						return true;
					}
					// NOTE: NaN이면 false라서 괜찮음
					return this.friend404[id] >= 2;
				});
			}
			this.currentUser.friends.forEach((id) => {
				var ctx = this.user[id];
				if (!(ctx &&
					ctx.friend_)) {
					var hit = Number(this.friend404[id]) || 0;
					if (hit < 2) {
						this.friend404[id] = hit + 1;
					}
				}
			});
			return true;
		};

		API.refreshFriend = function () {
			var param = {
				n: 100,
				offset: 0,
				offline: false
			};
			var N = this.currentUser.onlineFriends.length;
			if (!N) {
				N = this.currentUser.friends.length;
				if (!N ||
					this.checkFriends(false)) {
					return;
				}
				param.offline = true;
			}
			if (!this.isFriendLoading) {
				this.isFriendLoading = true;
				this.bulk({
					fn: 'getFriends',
					N,
					param,
					done: (ok, options) => {
						if (this.checkFriends(param.offline)) {
							this.isFriendLoading = false;
						} else {
							N = this.currentUser.friends.length - param.offset;
							if (N <= 0) {
								N = this.currentUser.friends.length;
							}
							options.N = N;
							param.offset = 0;
							param.offline = true;
							this.bulk(options);
						}
					}
				});
			}
		};

		/*
			param: {
				n: number,
				offset: number,
				offline: boolean
			}
		*/
		API.getFriends = function (param) {
			return this.call('auth/user/friends', {
				method: 'GET',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('FRIEND:LIST', args);
				return args;
			});
		};

		/*
			param: {
				userId: string
			}
		*/
		API.sendFriendRequest = function (param) {
			return this.call(`user/${param.userId}/friendRequest`, {
				method: 'POST'
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('FRIEND:REQUEST', args);
				return args;
			});
		};

		/*
			param: {
				userId: string
			}
		*/
		API.cancelFriendRequest = function (param) {
			return this.call(`user/${param.userId}/friendRequest`, {
				method: 'DELETE'
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('FRIEND:REQUEST:CANCEL', args);
				return args;
			});
		};

		/*
			param: {
				userId: string
			}
		*/
		API.deleteFriend = function (param) {
			return this.call(`auth/user/friends/${param.userId}`, {
				method: 'DELETE'
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('FRIEND:DELETE', args);
				return args;
			});
		};

		/*
			param: {
				userId: string
			}
		*/
		API.getFriendStatus = function (param) {
			return this.call(`user/${param.userId}/friendStatus`, {
				method: 'GET'
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('FRIEND:STATUS', args);
				return args;
			});
		};

		// API: Avatar

		API.avatar = {};

		API.$on('AVATAR', (args) => {
			args.ref = API.updateAvatar(args.json);
		});

		API.$on('AVATAR:LIST', (args) => {
			args.json.forEach((json) => {
				API.$emit('AVATAR', {
					param: {
						avatarId: json.id
					},
					json
				});
			});
		});

		API.$on('AVATAR:SELECT', (args) => {
			API.$emit('USER:CURRENT', args);
		});

		/*
			param: {
				avatarId: string
			}
		*/
		API.getAvatar = function (param) {
			return this.call(`avatars/${param.avatarId}`, {
				method: 'GET'
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('AVATAR', args);
				return args;
			});
		};

		API.updateAvatar = function (ref) {
			var ctx = this.avatar[ref.id];
			if (ctx) {
				Object.assign(ctx, ref);
			} else {
				ctx = {
					id: ref.id,
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
					...ref
				};
				this.avatar[ctx.id] = ctx;
			}
			return ctx;
		};

		/*
			param: {
				avatarId: string
			}
		*/
		API.getCachedAvatar = function (param) {
			return new Promise((resolve, reject) => {
				var ctx = this.avatar[param.avatarId];
				if (ctx) {
					resolve({
						cache: true,
						ref: ctx,
						param
					});
				} else {
					this.getAvatar(param).catch(reject).then(resolve);
				}
			});
		};

		/*
			param: {
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
		API.getAvatars = function (param) {
			return this.call('avatars', {
				method: 'GET',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('AVATAR:LIST', args);
				return args;
			});
		};

		/*
			param: {
				avatarId: string
			}
		*/
		API.selectAvatar = function (param) {
			return this.call(`avatars/${param.avatarId}/select`, {
				method: 'PUT',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('AVATAR:SELECT', args);
				return args;
			});
		};

		// API: Notification

		API.notification = {};
		API.isNotificationLoading = false;

		API.$on('LOGIN', () => {
			API.notification = {};
			API.isNotificationLoading = false;
		});

		API.$on('NOTIFICATION', (args) => {
			args.ref = API.updateNotification(args.json);
		});

		API.$on('NOTIFICATION:LIST', (args) => {
			args.json.forEach((json) => {
				API.$emit('NOTIFICATION', {
					param: {
						notificationId: json.id
					},
					json
				});
			});
		});

		API.$on('NOTIFICATION:ACCEPT', (args) => {
			var ctx = API.notification[args.param.notificationId];
			if (ctx &&
				!ctx.hide_) {
				ctx.hide_ = true;
				args.ref = ctx;
				API.$emit('NOTIFICATION:@DELETE', {
					param: {
						notificationId: ctx.id
					},
					ref: ctx
				});
				API.$emit('FRIEND:ADD', {
					param: {
						userId: ctx.senderUserId
					}
				});
			}
		});

		API.$on('NOTIFICATION:HIDE', (args) => {
			var ctx = API.notification[args.param.notificationId];
			if (ctx &&
				!ctx.hide_) {
				ctx.hide_ = true;
				args.ref = ctx;
				API.$emit('NOTIFICATION:@DELETE', {
					param: {
						notificationId: ctx.id
					},
					ref: ctx
				});
			}
		});

		API.markAllNotificationsAsExpired = function () {
			for (var key in this.notification) {
				var ctx = this.notification[key];
				if (!ctx.hide_) {
					ctx.expired_ = true;
				}
			}
		};

		API.checkExpiredNotifcations = function () {
			for (var key in this.notification) {
				var ctx = this.notification[key];
				if (ctx.expired_ &&
					!ctx.hide_) {
					ctx.hide_ = true;
					this.$emit('NOTIFICATION:@DELETE', {
						param: {
							notificationId: ctx.id
						},
						ref: ctx
					});
				}
			}
		};

		API.refreshNotification = function () {
			// NOTE : 캐시 때문에 after=~ 로는 갱신이 안됨. 그래서 첨부터 불러옴
			if (!this.isNotificationLoading) {
				this.isNotificationLoading = true;
				this.markAllNotificationsAsExpired();
				this.bulk({
					fn: 'getNotifications',
					N: -1,
					param: {
						n: 100,
						offset: 0
					},
					done: (ok) => {
						if (ok) {
							this.checkExpiredNotifcations();
						}
						this.isNotificationLoading = false;
					}
				});
			}
		};

		API.updateNotification = function (ref) {
			var ctx = this.notification[ref.id];
			if (ctx) {
				Object.assign(ctx, ref);
			} else {
				ctx = {
					id: ref.id,
					senderUserId: '',
					senderUsername: '',
					type: '',
					message: '',
					details: {},
					seen: false,
					created_at: '',
					...ref
				};
				this.notification[ctx.id] = ctx;
			}
			if (typeof ctx.details !== 'object') {
				var details = {};
				try {
					var json = JSON.parse(ctx.details);
					if (typeof json === 'object') {
						details = json;
					}
				} catch (err) {
					console.error(err);
				}
				ctx.details = details;
			}
			ctx.expired_ = false;
			return ctx;
		};

		/*
			param: {
				n: number,
				offset: number,
				sent: boolean,
				type: string,
				after: string (ISO8601 or 'five_minutes_ago')
			}
		*/
		API.getNotifications = function (param) {
			return this.call('auth/user/notifications', {
				method: 'GET',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('NOTIFICATION:LIST', args);
				return args;
			});
		};

		API.clearNotification = function () {
			return this.call('auth/user/notifications/clear', {
				method: 'PUT'
			}).then((json) => {
				var args = {
					json
				};
				// FIXME: 고쳐줘
				this.$emit('NOTIFICATION:CLEAR', args);
				return args;
			});
		};

		/*
			param: {
				receiverUserId: string,
				type: string,
				message: string,
				seen: boolean,
				details: json-string
			}
		*/
		API.sendNotification = function (param) {
			return this.call(`user/${param.receiverUserId}/notification`, {
				method: 'POST',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('NOTIFICATION:SEND', args);
				return args;
			});
		};

		/*
			param: {
				notificationId: string
			}
		*/
		API.acceptNotification = function (param) {
			return this.call(`auth/user/notifications/${param.notificationId}/accept`, {
				method: 'PUT'
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('NOTIFICATION:ACCEPT', args);
				return args;
			});
		};

		/*
			param: {
				notificationId: string
			}
		*/
		API.hideNotification = function (param) {
			return this.call(`auth/user/notifications/${param.notificationId}/hide`, {
				method: 'PUT'
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('NOTIFICATION:HIDE', args);
				return args;
			});
		};

		API.getFriendRequest = function (userId) {
			for (var key in this.notification) {
				var ctx = this.notification[key];
				if (ctx.type === 'friendRequest' &&
					ctx.senderUserId === userId &&
					!ctx.hide_) {
					return key;
				}
			}
			return '';
		};

		// API: PlayerModeration

		API.playerModeration = {};
		API.isPlayerModerationLoading = false;

		API.$on('LOGIN', () => {
			API.playerModeration = {};
			API.isPlayerModerationLoading = false;
		});

		API.$on('PLAYER-MODERATION', (args) => {
			args.ref = API.updatePlayerModeration(args.json);
		});

		API.$on('PLAYER-MODERATION:LIST', (args) => {
			args.json.forEach((json) => {
				API.$emit('PLAYER-MODERATION', {
					param: {
						playerModerationId: json.id
					},
					json
				});
			});
		});

		API.$on('PLAYER-MODERATION:SEND', (args) => {
			API.$emit('PLAYER-MODERATION', {
				param: {
					playerModerationId: args.json.id
				},
				json: args.json
			});
		});

		API.$on('PLAYER-MODERATION:DELETE', (args) => {
			API.handleDeletePlayerModeration(args.param.type, args.param.moderated);
		});

		API.markAllPlayerModerationsAsExpired = function () {
			for (var key in this.playerModeration) {
				var ctx = this.playerModeration[key];
				if (!ctx.hide_) {
					ctx.expired_ = true;
				}
			}
		};

		API.checkExpiredPlayerModerations = function () {
			for (var key in this.playerModeration) {
				var ctx = this.playerModeration[key];
				if (ctx.expired_ &&
					!ctx.hide_) {
					ctx.hide_ = true;
					this.$emit('PLAYER-MODERATION:@DELETE', {
						param: {
							playerModerationId: ctx.id
						},
						ref: ctx
					});
				}
			}
		};

		API.refreshPlayerModeration = function () {
			if (!this.isPlayerModerationLoading) {
				this.isPlayerModerationLoading = true;
				this.markAllPlayerModerationsAsExpired();
				Promise.all([
					this.getPlayerModerations(),
					this.getPlayerModerationsAgainstMe()
				]).finally(() => {
					this.isPlayerModerationLoading = false;
				}).then(() => {
					this.checkExpiredPlayerModerations();
				});
			}
		};

		API.handleDeletePlayerModeration = function (type, moderated) {
			var cuid = this.currentUser.id;
			for (var key in this.playerModeration) {
				var ctx = this.playerModeration[key];
				if (ctx.type === type &&
					ctx.targetUserId === moderated &&
					ctx.sourceUserId === cuid &&
					!ctx.hide_) {
					ctx.hide_ = true;
					this.$emit('PLAYER-MODERATION:@DELETE', {
						param: {
							playerModerationId: ctx.id
						},
						ref: ctx
					});
				}
			}
		};

		API.updatePlayerModeration = function (ref) {
			var ctx = this.playerModeration[ref.id];
			if (ctx) {
				Object.assign(ctx, ref);
			} else {
				ctx = {
					id: ref.id,
					type: '',
					sourceUserId: '',
					sourceDisplayName: '',
					targetUserId: '',
					targetDisplayName: '',
					created: '',
					...ref
				};
				this.playerModeration[ctx.id] = ctx;
			}
			ctx.expired_ = false;
			return ctx;
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
			param: {
				moderated: string,
				type: string
			}
		*/
		// old-way: POST auth/user/blocks {blocked:userId}
		API.sendPlayerModeration = function (param) {
			return this.call('auth/user/playermoderations', {
				method: 'POST',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('PLAYER-MODERATION:SEND', args);
				return args;
			});
		};

		/*
			param: {
				moderated: string,
				type: string
			}
		*/
		// old-way: PUT auth/user/unblocks {blocked:userId}
		API.deletePlayerModeration = function (param) {
			return this.call('auth/user/unplayermoderate', {
				method: 'PUT',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('PLAYER-MODERATION:DELETE', args);
				return args;
			});
		};

		// API: Favorite

		API.favorite = {};
		API.favoriteGroup = {};
		API.favoriteObject = {};
		API.favoriteFriendGroups = [];
		API.favoriteWorldGroups = [];
		API.favoriteAvatarGroups = [];
		API.isFavoriteLoading = false;
		API.isFavoriteGroupLoading = false;

		API.$on('LOGIN', () => {
			API.favorite = {};
			API.favoriteGroup = {};
			API.favoriteObject = {};
			API.favoriteFriendGroups = [];
			API.favoriteWorldGroups = [];
			API.favoriteAvatarGroups = [];
			API.isFavoriteLoading = false;
			API.isFavoriteGroupLoading = false;
			API.refreshFavorite();
		});

		API.$on('FAVORITE', (args) => {
			var ref = API.updateFavorite(args.json);
			args.ref = ref;
			if (!ref.hide_ &&
				API.favoriteObject[ref.favoriteId] !== ref) {
				API.favoriteObject[ref.favoriteId] = ref;
				if (ref.type === 'friend') {
					API.favoriteFriendGroups.find((ctx) => {
						if (ctx.name === ref.group_) {
							++ctx.count;
							return true;
						}
						return false;
					});
				} else if (ref.type === 'world') {
					API.favoriteWorldGroups.find((ctx) => {
						if (ctx.name === ref.group_) {
							++ctx.count;
							return true;
						}
						return false;
					});
				} else if (ref.type === 'avatar') {
					API.favoriteAvatarGroups.find((ctx) => {
						if (ctx.name === ref.group_) {
							++ctx.count;
							return true;
						}
						return false;
					});
				}
			}
		});

		API.$on('FAVORITE:@DELETE', (args) => {
			var { ref } = args;
			if (API.favoriteObject[ref.favoriteId]) {
				delete API.favoriteObject[ref.favoriteId];
				if (ref.type === 'friend') {
					API.favoriteFriendGroups.find((ctx) => {
						if (ctx.name === ref.group_) {
							--ctx.count;
							return true;
						}
						return false;
					});
				} else if (ref.type === 'world') {
					API.favoriteWorldGroups.find((ctx) => {
						if (ctx.name === ref.group_) {
							--ctx.count;
							return true;
						}
						return false;
					});
				} else if (ref.type === 'avatar') {
					API.favoriteAvatarGroups.find((ctx) => {
						if (ctx.name === ref.group_) {
							--ctx.count;
							return true;
						}
						return false;
					});
				}
			}
		});

		API.$on('FAVORITE:LIST', (args) => {
			args.json.forEach((json) => {
				API.$emit('FAVORITE', {
					param: {
						favoriteId: json.id
					},
					json
				});
			});
		});

		API.$on('FAVORITE:ADD', (args) => {
			API.$emit('FAVORITE', {
				param: {
					favoriteId: args.json.id
				},
				json: args.json
			});
		});

		API.$on('FAVORITE:DELETE', (args) => {
			API.handleDeleteFavorite(args.param.objectId);
		});

		API.$on('FAVORITE:GROUP', (args) => {
			var ref = API.updateFavoriteGroup(args.json);
			args.ref = ref;
			if (!ref.hide_) {
				if (ref.type === 'friend') {
					API.favoriteFriendGroups.find((ctx) => {
						if (ctx.name === ref.name) {
							ctx.displayName = ref.displayName;
							return true;
						}
						return false;
					});
				} else if (ref.type === 'world') {
					API.favoriteWorldGroups.find((ctx) => {
						if (ctx.name === ref.name) {
							ctx.displayName = ref.displayName;
							return true;
						}
						return false;
					});
				} else if (ref.type === 'avatar') {
					API.favoriteAvatarGroups.find((ctx) => {
						if (ctx.name === ref.name) {
							ctx.displayName = ref.displayName;
							return true;
						}
						return false;
					});
				}
			}
		});

		API.$on('FAVORITE:GROUP:LIST', (args) => {
			args.json.forEach((json) => {
				API.$emit('FAVORITE:GROUP', {
					param: {
						favoriteGroupId: json.id
					},
					json
				});
			});
		});

		API.$on('FAVORITE:GROUP:SAVE', (args) => {
			API.$emit('FAVORITE:GROUP', {
				param: {
					favoriteGroupId: args.json.id
				},
				json: args.json
			});
		});

		API.$on('FAVORITE:GROUP:CLEAR', (args) => {
			API.handleClearFavoriteGroup(args.param.group);
		});

		API.$on('FAVORITE:FRIEND:LIST', (args) => {
			args.json.forEach((json) => {
				API.$emit('USER', {
					param: {
						userId: json.id
					},
					json
				});
			});
		});

		API.$on('FAVORITE:WORLD:LIST', (args) => {
			args.json.forEach((json) => {
				if (json.id !== '???') {
					// FIXME
					// json.favoriteId로 따로 불러와야 하나?
					// 근데 ???가 많으면 과다 요청이 될듯
					API.$emit('WORLD', {
						param: {
							worldId: json.id
						},
						json
					});
				}
			});
		});

		API.$on('FAVORITE:AVATAR:LIST', (args) => {
			args.json.forEach((json) => {
				if (json.releaseStatus !== 'hidden') {
					// NOTE: 얘는 또 더미 데이터로 옴
					API.$emit('AVATAR', {
						param: {
							avatarId: json.id
						},
						json
					});
				}
			});
		});

		API.markAllFavoritesAsExpired = function () {
			for (var key in this.favorite) {
				var ctx = this.favorite[key];
				if (!ctx.hide_) {
					ctx.expired_ = true;
				}
			}
		};

		API.checkExpiredFavorites = function () {
			for (var key in this.favorite) {
				var ctx = this.favorite[key];
				if (ctx.expired_ &&
					!ctx.hide_) {
					ctx.hide_ = true;
					this.$emit('FAVORITE:@DELETE', {
						param: {
							favoriteId: ctx.id
						},
						ref: ctx
					});
				}
			}
		};

		API.refreshFavorite = function () {
			if (!this.isFavoriteLoading) {
				this.isFavoriteLoading = true;
				this.markAllFavoritesAsExpired();
				this.bulk({
					fn: 'getFavorites',
					N: -1,
					param: {
						n: 100,
						offset: 0
					},
					done: (ok) => {
						if (ok) {
							this.checkExpiredFavorites();
						}
						this.refreshFavoriteGroup();
						this.refreshFavoriteFriends();
						this.refreshFavoriteWorlds();
						this.refreshFavoriteAvatars();
						this.isFavoriteLoading = false;
					}
				});
			}
		};

		API.refreshFavoriteFriends = function () {
			var N = 0;
			for (var key in this.favorite) {
				var ctx = this.favorite[key];
				if (ctx.type === 'friend' &&
					!ctx.hide_) {
					++N;
				}
			}
			if (N) {
				this.bulk({
					fn: 'getFavoriteFriends',
					N,
					param: {
						n: 100,
						offset: 0
					}
				});
			}
		};

		API.refreshFavoriteWorlds = function () {
			var N = 0;
			for (var key in this.favorite) {
				var ctx = this.favorite[key];
				if (ctx.type === 'world' &&
					!ctx.hide_) {
					++N;
				}
			}
			if (N) {
				this.bulk({
					fn: 'getFavoriteWorlds',
					N,
					param: {
						n: 100,
						offset: 0
					}
				});
			}
		};

		API.refreshFavoriteAvatars = function () {
			var N = 0;
			for (var key in this.favorite) {
				var ctx = this.favorite[key];
				if (ctx.type === 'avatar' &&
					!ctx.hide_) {
					++N;
				}
			}
			if (N) {
				this.bulk({
					fn: 'getFavoriteAvatars',
					N,
					param: {
						n: 100,
						offset: 0
					}
				});
			}
		};

		API.markAllFavoriteGroupsAsExpired = function () {
			for (var key in this.favoriteGroup) {
				var ctx = this.favoriteGroup[key];
				if (!ctx.hide_) {
					ctx.expired_ = true;
				}
			}
		};

		API.checkExpiredFavoriteGroups = function () {
			for (var key in this.favoriteGroup) {
				var ctx = this.favoriteGroup[key];
				if (ctx.expired_ &&
					!ctx.hide_) {
					ctx.hide_ = true;
					this.$emit('FAVORITE:GROUP:@DELETE', {
						param: {
							favoriteGroupId: ctx.id
						},
						ref: ctx
					});
				}
			}
		};

		API.resetFavoriteGroup = function () {
			// 96 = ['group_0', 'group_1', 'group_2'] x 32
			this.favoriteFriendGroups = [];
			for (var i = 0; i < 3; ++i) {
				this.favoriteFriendGroups.push({
					type: 'friend',
					name: `group_${i}`,
					displayName: `Group ${i + 1}`,
					capacity: 32,
					count: 0
				});
			}
			// 128 = ['worlds1', 'worlds2', 'worlds3', 'worlds4'] x 32
			this.favoriteWorldGroups = [];
			for (var j = 0; j < 4; ++j) {
				this.favoriteWorldGroups.push({
					type: 'world',
					name: `worlds${j + 1}`,
					displayName: `Group ${j + 1}`,
					capacity: 32,
					count: 0
				});
			}
			// 16 = ['avatars1'] x 16
			this.favoriteAvatarGroups = [];
			for (var k = 0; k < 1; ++k) {
				this.favoriteAvatarGroups.push({
					type: 'avatar',
					name: `avatars${k + 1}`,
					displayName: `Group ${k + 1}`,
					capacity: 16,
					count: 0
				});
			}
		};

		API.assignFavoriteGroup = function () {
			var assign = [];
			var set1 = function (array, ref) {
				if (!assign[ref.id]) {
					array.find((ctx) => {
						if (ctx.name === ref.name &&
							!ctx.assign_) {
							ctx.assign_ = true;
							ctx.displayName = ref.displayName;
							assign[ref.id] = true;
							return true;
						}
						return false;
					});
				}
			};
			var set2 = function (array, ref) {
				if (!assign[ref.id]) {
					array.find((ctx) => {
						if (!ctx.assign_) {
							ctx.assign_ = true;
							ctx.name = ref.name;
							ctx.displayName = ref.displayName;
							assign[ref.id] = true;
							return true;
						}
						return false;
					});
				}
			};
			var key = null;
			var ctx = null;
			for (key in this.favoriteGroup) {
				ctx = this.favoriteGroup[key];
				if (!ctx.hide_) {
					if (ctx.type === 'friend') {
						set1(this.favoriteFriendGroups, ctx);
					} else if (ctx.type === 'world') {
						set1(this.favoriteWorldGroups, ctx);
					} else if (ctx.type === 'avatar') {
						set1(this.favoriteAvatarGroups, ctx);
					}
				}
			}
			for (key in this.favoriteGroup) {
				ctx = this.favoriteGroup[key];
				if (!ctx.hide_) {
					if (ctx.type === 'friend') {
						set2(this.favoriteFriendGroups, ctx);
					} else if (ctx.type === 'world') {
						set2(this.favoriteWorldGroups, ctx);
					} else if (ctx.type === 'avatar') {
						set2(this.favoriteAvatarGroups, ctx);
					}
				}
			}
			for (key in this.favorite) {
				ctx = this.favorite[key];
				if (!ctx.hide_) {
					if (ctx.type === 'friend') {
						// eslint-disable-next-line no-loop-func
						this.favoriteFriendGroups.find((ref) => {
							if (ref.name === ctx.group_) {
								++ref.count;
								return true;
							}
							return false;
						});
					} else if (ctx.type === 'world') {
						// eslint-disable-next-line no-loop-func
						this.favoriteWorldGroups.find((ref) => {
							if (ref.name === ctx.group_) {
								++ref.count;
								return true;
							}
							return false;
						});
					} else if (ctx.type === 'avatar') {
						// eslint-disable-next-line no-loop-func
						this.favoriteAvatarGroups.find((ref) => {
							if (ref.name === ctx.group_) {
								++ref.count;
								return true;
							}
							return false;
						});
					}
				}
			}
		};

		API.refreshFavoriteGroup = function () {
			if (!this.isFavoriteGroupLoading) {
				this.isFavoriteGroupLoading = true;
				this.markAllFavoriteGroupsAsExpired();
				this.bulk({
					fn: 'getFavoriteGroups',
					N: -1,
					param: {
						n: 100,
						offset: 0
					},
					done: (ok) => {
						if (ok) {
							this.checkExpiredFavoriteGroups();
							this.resetFavoriteGroup();
							this.assignFavoriteGroup();
						}
						this.isFavoriteGroupLoading = false;
					}
				});
			}
		};

		API.handleDeleteFavorite = function (objectId) {
			for (var key in this.favorite) {
				var ctx = this.favorite[key];
				if (ctx.favoriteId === objectId &&
					!ctx.hide_) {
					ctx.hide_ = true;
					API.$emit('FAVORITE:@DELETE', {
						param: {
							favoriteId: ctx.id
						},
						ref: ctx
					});
				}
			}
		};

		API.updateFavorite = function (ref) {
			var ctx = this.favorite[ref.id];
			if (ctx) {
				Object.assign(ctx, ref);
			} else {
				ctx = {
					id: ref.id,
					type: '',
					favoriteId: '',
					tags: [],
					// custom
					group_: '',
					//
					...ref
				};
				this.favorite[ctx.id] = ctx;
			}
			ctx.expired_ = false;
			if (ctx.tags) {
				[ctx.group_] = ctx.tags;
			}
			return ctx;
		};

		/*
			param: {
				n: number,
				offset: number,
				type: string,
				tag: string
			}
		*/
		API.getFavorites = function (param) {
			return this.call('favorites', {
				method: 'GET',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('FAVORITE:LIST', args);
				return args;
			});
		};

		/*
			param: {
				type: string,
				favoriteId: string (objectId),
				tags: string
			}
		*/
		API.addFavorite = function (param) {
			return this.call('favorites', {
				method: 'POST',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('FAVORITE:ADD', args);
				return args;
			});
		};

		/*
			param: {
				objectId: string
			}
		*/
		API.deleteFavorite = function (param) {
			return this.call(`favorites/${param.objectId}`, {
				method: 'DELETE'
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('FAVORITE:DELETE', args);
				return args;
			});
		};

		API.updateFavoriteGroup = function (ref) {
			var ctx = this.favoriteGroup[ref.id];
			if (ctx) {
				Object.assign(ctx, ref);
			} else {
				ctx = {
					id: ref.id,
					ownerId: '',
					ownerDisplayName: '',
					name: '',
					displayName: '',
					type: '',
					visibility: '',
					tags: [],
					...ref
				};
				this.favoriteGroup[ctx.id] = ctx;
			}
			ctx.expired_ = false;
			return ctx;
		};

		/*
			param: {
				n: number,
				offset: number,
				type: string
			}
		*/
		API.getFavoriteGroups = function (param) {
			return this.call('favorite/groups', {
				method: 'GET',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('FAVORITE:GROUP:LIST', args);
				return args;
			});
		};

		/*
			param: {
				type: string,
				group: string (name),
				displayName: string,
				visibility: string
			}
		*/
		API.saveFavoriteGroup = function (param) {
			return this.call(`favorite/group/${param.type}/${param.group}/${this.currentUser.id}`, {
				method: 'PUT',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('FAVORITE:GROUP:SAVE', args);
				return args;
			});
		};

		/*
			param: {
				type: string,
				group: string (name)
			}
		*/
		API.clearFavoriteGroup = function (param) {
			return this.call(`favorite/group/${param.type}/${param.group}/${this.currentUser.id}`, {
				method: 'DELETE',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('FAVORITE:GROUP:CLEAR', args);
				return args;
			});
		};

		API.handleClearFavoriteGroup = function (name) {
			for (var key in this.favorite) {
				var ctx = this.favorite[key];
				if (ctx.group_ === name &&
					!ctx.hide_) {
					ctx.hide_ = true;
					API.$emit('FAVORITE:@DELETE', {
						param: {
							favoriteId: ctx.id
						},
						ref: ctx
					});
				}
			}
		};

		/*
			param: {
				n: number,
				offset: number
			}
		*/
		API.getFavoriteFriends = function (param) {
			return this.call('auth/user/friends/favorite', {
				method: 'GET',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('FAVORITE:FRIEND:LIST', args);
				return args;
			});
		};

		/*
			param: {
				n: number,
				offset: number
			}
		*/
		API.getFavoriteWorlds = function (param) {
			return this.call('worlds/favorites', {
				method: 'GET',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('FAVORITE:WORLD:LIST', args);
				return args;
			});
		};

		/*
			param: {
				n: number,
				offset: number
			}
		*/
		API.getFavoriteAvatars = function (param) {
			return this.call('avatars/favorites', {
				method: 'GET',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('FAVORITE:AVATAR:LIST', args);
				return args;
			});
		};

		// API: Feedback

		API.feedback = {};
		API.isFeedbackLoading = false;

		API.$on('LOGIN', () => {
			API.feedback = {};
			API.isFeedbackLoading = false;
		});

		API.$on('FEEDBACK', (args) => {
			args.ref = API.updateFeedback(args.json);
		});

		API.$on('FEEDBACK:LIST', (args) => {
			args.json.forEach((json) => {
				API.$emit('FEEDBACK', {
					param: {
						feedbackId: json.id
					},
					json
				});
			});
		});

		API.$on('FEEDBACK:DELETE', (args) => {
			var ctx = API.feedback[args.param.feedbackId];
			if (ctx &&
				!ctx.hide_) {
				ctx.hide_ = true;
				args.ref = ctx;
				API.$emit('FEEDBACK:@DELETE', {
					param: {
						feedbackId: ctx.id
					},
					ref: ctx
				});
			}
		});

		API.markAllFeedbacksAsExpired = function () {
			for (var key in this.feedback) {
				var ctx = this.feedback[key];
				if (!ctx.hide_) {
					ctx.expired_ = true;
				}
			}
		};

		API.checkExpiredFeedbacks = function () {
			for (var key in this.feedback) {
				var ctx = this.feedback[key];
				if (ctx.expired_ &&
					!ctx.hide_) {
					ctx.hide_ = true;
					this.$emit('FEEDBACK:@DELETE', {
						param: {
							feedbackId: ctx.id
						},
						ref: ctx
					});
				}
			}
		};

		API.refreshFeedback = function () {
			if (!this.isFeedbackLoading) {
				this.isFeedbackLoading = true;
				this.markAllFeedbacksAsExpired();
				this.bulk({
					fn: 'getFeedbacks',
					N: -1,
					param: {
						n: 100,
						offset: 0
					},
					done: (ok) => {
						if (ok) {
							this.checkExpiredFeedbacks();
						}
						this.isFeedbackLoading = false;
					}
				});
			}
		};

		API.updateFeedback = function (ref) {
			var ctx = this.feedback[ref.id];
			if (ctx) {
				Object.assign(ctx, ref);
			} else {
				ctx = {
					id: ref.id,
					type: '',
					reason: '',
					commenterId: '',
					commenterName: '',
					contentId: '',
					contentType: '',
					contentVersion: '',
					contentName: '',
					contentAuthorId: '',
					contentAuthorName: '',
					tags: [],
					...ref
				};
				this.feedback[ctx.id] = ctx;
			}
			ctx.expired_ = false;
			return ctx;
		};

		/*
			param: {
				n: number,
				offset: number
			}
		*/
		API.getFeedbacks = function (param) {
			return this.call(`users/${this.currentUser.id}/feedback`, {
				method: 'GET',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('FEEDBACK:LIST', args);
				return args;
			});
		};

		/*
			param: {
				feedbackId: string
			}
		*/
		API.deleteFeedback = function (param) {
			return this.call(`feedback/${param.feedbackId}`, {
				method: 'DELETE',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('FEEDBACK:DELETE', args);
				return args;
			});
		};

		// API: Thing

		API.thing = {};
		API.isThingLoading = false;

		API.$on('LOGIN', () => {
			API.thing = {};
			API.isThingLoading = false;
		});

		API.$on('THING', (args) => {
			args.ref = API.updateThing(args.json);
		});

		API.$on('THING:LIST', (args) => {
			args.json.forEach((json) => {
				API.$emit('THING', {
					param: {
						thingId: json.id
					},
					json
				});
			});
		});

		API.$on('THING:ADD', (args) => {
			API.$emit('THING', {
				param: {
					thingId: args.json.id
				},
				json: args.json
			});
		});

		API.$on('THING:SAVE', (args) => {
			API.$emit('THING', {
				param: {
					thingId: args.json.id
				},
				json: args.json
			});
		});

		API.$on('THING:DELETE', (args) => {
			var ctx = API.thing[args.param.thingId];
			if (ctx &&
				!ctx.hide_) {
				ctx.hide_ = true;
				args.ref = ctx;
				API.$emit('THING:@DELETE', {
					param: {
						thingId: ctx.id
					},
					ref: ctx
				});
			}
		});

		API.markAllThingsAsExpired = function () {
			for (var key in this.thing) {
				var ctx = this.thing[key];
				if (!ctx.hide_) {
					ctx.expired_ = true;
				}
			}
		};

		API.checkExpiredThings = function () {
			for (var key in this.thing) {
				var ctx = this.thing[key];
				if (ctx.expired_ &&
					!ctx.hide_) {
					ctx.hide_ = true;
					this.$emit('THING:@DELETE', {
						param: {
							thingId: ctx.id
						},
						ref: ctx
					});
				}
			}
		};

		API.refreshThing = function () {
			if (!this.isThingLoading) {
				this.isThingLoading = true;
				this.markAllThingsAsExpired();
				this.bulk({
					fn: 'getThings',
					N: -1,
					param: {
						n: 100,
						offset: 0
					},
					done: (ok) => {
						if (ok) {
							this.checkExpiredThings();
						}
						this.isThingLoading = false;
					}
				});
			}
		};

		API.updateThing = function (ref) {
			var ctx = this.thing[ref.id];
			if (ctx) {
				Object.assign(ctx, ref);
			} else {
				ctx = {
					id: ref.id,
					ownerId: '',
					ownerDisplayName: '',
					thingProperty: '',
					otherThingProperty: '',
					tags: [],
					...ref
				};
				this.thing[ctx.id] = ctx;
			}
			ctx.expired_ = false;
		};

		/*
			param: {
				n: number,
				offset: number
			}
		*/
		API.getThings = function (param) {
			return this.call('things', {
				method: 'GET',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('THING:LIST', args);
				return args;
			});
		};

		/*
			param: {
				thingId: string,
				thingProperty: string,
				tags: string
			}
		*/
		API.addThing = function (param) {
			return this.call('things', {
				method: 'POST',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('THING:ADD', args);
				return args;
			});
		};

		/*
			param: {
				thingId: string,
				thingProperty: string,
				tags: string
			}
		*/
		API.saveThing = function (param) {
			return this.call(`things/${param.thingId}`, {
				method: 'PUT',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('THING:SAVE', args);
				return args;
			});
		};

		/*
			param: {
				thingId: string
			}
		*/
		API.deleteThing = function (param) {
			return this.call(`things/${param.thingId}`, {
				method: 'DELETE',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('THING:DELETE', args);
				return args;
			});
		};

		// API: WebSocket

		API.webSocket = false;

		API.$on('LOGOUT', () => {
			API.closeWebSocket();
		});

		API.$on('USER:CURRENT', () => {
			if (API.webSocket === false) {
				API.getAuth();
			}
		});

		API.$on('AUTH', (args) => {
			if (args.json.ok) {
				API.connectWebSocket(args.json.token);
			}
		});

		API.$on('PIPELINE', (args) => {
			var { type, content } = args.json;
			switch (type) {
				case 'notification':
					API.$emit('NOTIFICATION', {
						param: {
							notificationId: content.id
						},
						json: content
					});
					break;

				case 'friend-add':
					API.$emit('USER', {
						param: {
							userId: content.userId
						},
						json: content.user
					});
					API.$emit('FRIEND:ADD', {
						param: {
							userId: content.userId
						}
					});
					break;

				case 'friend-delete':
					API.$emit('FRIEND:DELETE', {
						param: {
							userId: content.userId
						}
					});
					break;

				case 'friend-online':
					API.$emit('USER', {
						param: {
							userId: content.userId
						},
						json: {
							location: content.location,
							...content.user
						}
					});
					API.$emit('FRIEND:STATE', {
						param: {
							userId: content.userId
						},
						json: {
							state: 'online'
						}
					});
					break;

				case 'friend-active':
					API.$emit('USER', {
						param: {
							userId: content.userId
						},
						json: content.user
					});
					API.$emit('FRIEND:STATE', {
						param: {
							userId: content.userId
						},
						json: {
							state: 'active'
						}
					});
					break;

				case 'friend-offline':
					API.$emit('FRIEND:STATE', {
						param: {
							userId: content.userId
						},
						json: {
							state: 'offline'
						}
					});
					break;

				case 'friend-update':
					API.$emit('USER', {
						param: {
							userId: content.userId
						},
						json: content.user
					});
					break;

				case 'friend-location':
					if (content.world) {
						API.$emit('WORLD', {
							param: {
								worldId: content.world.id
							},
							json: content.world
						});
					}
					if (content.userId === API.currentUser.id) {
						API.$emit('USER', {
							param: {
								userId: content.userId
							},
							json: content.user
						});
					} else {
						API.$emit('USER', {
							param: {
								userId: content.userId
							},
							json: {
								location: content.location,
								...content.user
							}
						});
					}
					break;

				case 'user-update':
					API.$emit('USER:CURRENT', {
						param: {
							userId: content.userId
						},
						json: content.user
					});
					break;

				case 'user-location':
					if (content.world) {
						API.$emit('WORLD', {
							param: {
								worldId: content.world.id
							},
							json: content.world
						});
					}
					API.$emit('USER', {
						param: {
							userId: content.userId
						},
						json: {
							id: content.userId,
							location: content.location
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
			if (this.webSocket === false) {
				var socket = new WebSocket(`wss://pipeline.vrchat.cloud/?auth=${token}`);
				socket.onclose = () => {
					if (this.webSocket === socket) {
						this.webSocket = false;
					}
					try {
						socket.close();
					} catch (err) {
						console.error(err);
					}
				};
				socket.onerror = socket.onclose;
				socket.onmessage = (e) => {
					try {
						var json = JSON.parse(e.data);
						if (json.content) {
							json.content = JSON.parse(json.content);
						}
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
			if (this.webSocket !== false) {
				var socket = this.webSocket;
				this.webSocket = false;
				try {
					socket.close();
				} catch (err) {
					console.error(err);
				}
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

		// API: Time

		API.getServerTime = function () {
			return this.call('time', {
				method: 'GET'
			}).then((json) => {
				var args = {
					json
				};
				this.$emit('TIME', args);
				return args;
			});
		};

		// API: Youtube

		/*
			param = {
				q: string,
				type: string ('video'),
				safeSearch: string ('strict'),
				maxResults: number (25),
				part: string ('snippet')
			}
		*/
		API.youtube = function (param) {
			return this.call('youtube', {
				method: 'GET',
				body: param
			}).then((json) => {
				var args = {
					param,
					json
				};
				this.$emit('YOUTUBE', args);
				return args;
			});
		};

		// API: Events

		// deprecated: moved to user's property
		API.getEvents = function () {
			return this.call('events', {
				method: 'GET'
			}).then((json) => {
				var args = {
					json
				};
				this.$emit('EVENTS', args);
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
				if (typeof value === 'object') {
					if (Array.isArray(value)) {
						node.push({
							children: value.map((val, idx) => {
								if (typeof val === 'object') {
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
					} else {
						node.push({
							children: buildTreeData(value),
							key
						});
					}
				} else {
					node.push({
						key,
						value: String(value)
					});
				}
			}
			node.sort((a, b) => {
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

		setInterval(() => {
			$timers.forEach((v) => v.update());
		}, 5000);

		var $app = {
			data: {
				API,
				VRCX,
				nextRefresh: 0,
				isGameRunning: false,
				appVersion: 'VRCX 2019.11.18',
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
					this.$nextTick(() => {
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
				if (json.name &&
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

		var insertOrUpdateArrayById = (array, json) => {
			var insertOrUpdate = array.some((val, idx, arr) => {
				if (val.id === json.id) {
					$app.$set(arr, idx, json);
					return true;
				}
				return false;
			});
			if (!insertOrUpdate) {
				array.push(json);
			}
		};

		$app.methods.update = function () {
			if (API.isLoggedIn) {
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
				this.refreshGameLog();
				VRCX.IsGameRunning().then((running) => {
					if (this.isGameRunning !== running) {
						this.isGameRunning = running;
						Discord.SetTimestamps(Date.now(), 0);
					}
					this.updateDiscord();
					this.updateOpenVR();
				});
			}
		};

		$app.methods.updateSharedFeed = function () {
			var arr = [];
			var ref = null;
			// FIXME
			// 여러 개 켠다면 gameLogTable의 데이터가 시간순이 아닐 수도 있음
			var i = this.gameLogTable.data.length;
			var j = 0;
			while (j < 25) {
				if (i <= 0) {
					break;
				}
				ref = this.gameLogTable.data[--i];
				// Location, OnPlayerJoined, OnPlayerLeft
				if (ref.type) {
					// FIXME: 이거 존나 느릴거 같은데
					var isFriend = false;
					var isFavorite = false;
					for (var key in API.user) {
						var ctx = API.user[key];
						if (ctx.displayName === ref.data) {
							isFriend = Boolean(this.friend[ctx.id]);
							isFavorite = Boolean(API.favoriteObject[ctx.id]);
							break;
						}
					}
					arr.push({
						...ref,
						isFriend,
						isFavorite
					});
				} else {
					arr.push(ref);
				}
				++j;
			}
			i = this.feedTable.data.length;
			j = 0;
			while (j < 25) {
				if (i <= 0) {
					break;
				}
				ref = this.feedTable.data[--i];
				// GPS, Online, Offline, Status, Avatar
				if (ref.type !== 'Avatar') {
					arr.push({
						...ref,
						isFriend: Boolean(this.friend[ref.userId]),
						isFavorite: Boolean(API.favoriteObject[ref.userId])
					});
					++j;
				}
			}
			arr.sort((a, b) => {
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
			if (this.$refs.menu.activeIndex !== index) {
				var item = this.$refs.menu.items[index];
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
							if (err.status_code === 400) {
								this.promptTOTP();
							}
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
							if (err.status_code === 400) {
								this.promptOTP();
							}
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

		API.$on('USER:2FA', () => {
			$app.promptTOTP();
		});

		API.$on('LOGOUT', () => {
			new Noty({
				type: 'success',
				text: `See you again, <strong>${escapeTag(API.currentUser.displayName)}</strong>!`
			}).show();
		});

		API.$on('LOGIN', (args) => {
			$app.$refs.menu.activeIndex = 'feed';
			new Noty({
				type: 'success',
				text: `Hello there, <strong>${escapeTag(args.ref.displayName)}</strong>!`
			}).show();
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
			return VRCXStorage.Get(`memo_${id}`);
		};

		$app.methods.saveMemo = function (id, memo) {
			var key = `memo_${id}`;
			if (memo) {
				VRCXStorage.Set(key, String(memo));
			} else {
				VRCXStorage.Remove(key);
			}
			var ref = this.friend[id];
			if (ref) {
				ref.memo = String(memo || '');
			}
		};

		// App: Friends

		$app.data.friend = {};
		$app.data.friendNo = 0;
		$app.data.isFriendGroup0 = true;
		$app.data.isFriendGroup1 = true;
		$app.data.isFriendGroup2 = true;
		$app.data.isFriendGroup3 = false;
		$app.data.friendGroup0_ = [];
		$app.data.friendGroup1_ = [];
		$app.data.friendGroup2_ = [];
		$app.data.friendGroup3_ = [];
		$app.data.friendGroupA_ = [];
		$app.data.friendGroupB_ = [];
		$app.data.friendGroupC_ = [];
		$app.data.friendGroupD_ = [];
		$app.data.sortFriendGroup0 = false;
		$app.data.sortFriendGroup1 = false;
		$app.data.sortFriendGroup2 = false;
		$app.data.sortFriendGroup3 = false;
		$app.data.orderFriendGroup0 = VRCXStorage.GetBool('orderFriendGroup0');
		$app.data.orderFriendGroup1 = VRCXStorage.GetBool('orderFriendGroup1');
		$app.data.orderFriendGroup2 = VRCXStorage.GetBool('orderFriendGroup2');
		$app.data.orderFriendGroup3 = VRCXStorage.GetBool('orderFriendGroup3');
		var saveOrderFriendGroup = function () {
			VRCXStorage.SetBool('orderFriendGroup0', this.orderFriendGroup0);
			VRCXStorage.SetBool('orderFriendGroup1', this.orderFriendGroup1);
			VRCXStorage.SetBool('orderFriendGroup2', this.orderFriendGroup2);
			VRCXStorage.SetBool('orderFriendGroup3', this.orderFriendGroup3);
		};
		$app.watch.orderFriendGroup0 = saveOrderFriendGroup;
		$app.watch.orderFriendGroup1 = saveOrderFriendGroup;
		$app.watch.orderFriendGroup2 = saveOrderFriendGroup;
		$app.watch.orderFriendGroup3 = saveOrderFriendGroup;

		API.$on('LOGIN', () => {
			$app.friend = {};
			$app.friendNo = 0;
			$app.isFriendGroup0 = true;
			$app.isFriendGroup1 = true;
			$app.isFriendGroup2 = true;
			$app.isFriendGroup3 = false;
			$app.friendGroup0_ = [];
			$app.friendGroup1_ = [];
			$app.friendGroup2_ = [];
			$app.friendGroup3_ = [];
			$app.friendGroupA_ = [];
			$app.friendGroupB_ = [];
			$app.friendGroupC_ = [];
			$app.friendGroupD_ = [];
			$app.sortFriendGroup0 = false;
			$app.sortFriendGroup1 = false;
			$app.sortFriendGroup2 = false;
			$app.sortFriendGroup3 = false;
		});

		API.$on('USER:CURRENT', (args) => {
			// initFriendship()이 LOGIN에서 처리되기 때문에
			// USER:CURRENT에서 처리를 함
			$app.refreshFriend(args.ref, args.origin);
		});

		API.$on('USER', (args) => {
			$app.updateFriend(args.ref.id);
		});

		API.$on('FRIEND:ADD', (args) => {
			$app.addFriend(args.param.userId);
		});

		API.$on('FRIEND:DELETE', (args) => {
			$app.removeFriend(args.param.userId);
		});

		API.$on('FRIEND:STATE', (args) => {
			$app.updateFriend(args.param.userId, args.json.state);
		});

		API.$on('FAVORITE', (args) => {
			$app.updateFriend(args.ref.favoriteId);
		});

		API.$on('FAVORITE:@DELETE', (args) => {
			$app.updateFriend(args.ref.favoriteId);
		});

		$app.methods.refreshFriend = function (ref, origin) {
			var map = {};
			ref.friends.forEach((id) => {
				map[id] = 'offline';
			});
			ref.offlineFriends.forEach((id) => {
				map[id] = 'offline';
			});
			ref.activeFriends.forEach((id) => {
				map[id] = 'active';
			});
			ref.onlineFriends.forEach((id) => {
				map[id] = 'online';
			});
			var key = null;
			for (key in map) {
				if (this.friend[key]) {
					this.updateFriend(key, map[key], origin);
				} else {
					this.addFriend(key, map[key]);
				}
			}
			for (key in this.friend) {
				if (!map[key]) {
					this.removeFriend(key);
				}
			}
			if (origin) {
				API.refreshFriend();
			}
		};

		$app.methods.addFriend = function (id, state) {
			if (!this.friend[id]) {
				var ref = API.user[id];
				var ctx = {
					id,
					state: state || 'offline',
					ref,
					vip: Boolean(API.favoriteObject[id]),
					name: '',
					no: ++this.friendNo,
					memo: this.loadMemo(id)
				};
				if (ref) {
					ctx.name = ref.name;
				} else {
					ref = this.friendLog[id];
					if (ref &&
						ref.displayName) {
						ctx.name = ref.displayName;
					}
				}
				this.$set(this.friend, id, ctx);
				if (ctx.state === 'online') {
					if (ctx.vip) {
						this.sortFriendGroup0 = true;
						this.friendGroup0_.push(ctx);
						this.friendGroupA_.unshift(ctx);
					} else {
						this.sortFriendGroup1 = true;
						this.friendGroup1_.push(ctx);
						this.friendGroupB_.unshift(ctx);
					}
				} else if (ctx.state === 'active') {
					this.sortFriendGroup2 = true;
					this.friendGroup2_.push(ctx);
					this.friendGroupC_.unshift(ctx);
				} else {
					this.sortFriendGroup3 = true;
					this.friendGroup3_.push(ctx);
					this.friendGroupD_.unshift(ctx);
				}
			}
		};

		$app.methods.removeFriend = function (id) {
			var ctx = this.friend[id];
			if (ctx) {
				this.$delete(this.friend, id);
				if (ctx.state === 'online') {
					if (ctx.vip) {
						removeFromArray(this.friendGroup0_, ctx);
						removeFromArray(this.friendGroupA_, ctx);
					} else {
						removeFromArray(this.friendGroup1_, ctx);
						removeFromArray(this.friendGroupB_, ctx);
					}
				} else if (ctx.state === 'active') {
					removeFromArray(this.friendGroup2_, ctx);
					removeFromArray(this.friendGroupC_, ctx);
				} else {
					removeFromArray(this.friendGroup3_, ctx);
					removeFromArray(this.friendGroupD_, ctx);
				}
			}
		};

		$app.methods.updateFriend = function (id, state, origin) {
			var ctx = this.friend[id];
			if (ctx) {
				var ref = API.user[id];
				var vip = Boolean(API.favoriteObject[id]);
				if (state === undefined ||
					ctx.state === state) {
					if (ctx.ref !== ref) {
						ctx.ref = ref;
						// NOTE
						// AddFriend (CurrentUser) 이후,
						// 서버에서 오는 순서라고 보면 될 듯.
						if (ctx.state === 'online') {
							if (ctx.vip) {
								removeFromArray(this.friendGroupA_, ctx);
								this.friendGroupA_.push(ctx);
							} else {
								removeFromArray(this.friendGroupB_, ctx);
								this.friendGroupB_.push(ctx);
							}
						} else if (ctx.state === 'active') {
							removeFromArray(this.friendGroupC_, ctx);
							this.friendGroupC_.push(ctx);
						} else {
							removeFromArray(this.friendGroupD_, ctx);
							this.friendGroupD_.push(ctx);
						}
					}
					if (ctx.vip !== vip) {
						ctx.vip = vip;
						if (ctx.state === 'online') {
							if (ctx.vip) {
								removeFromArray(this.friendGroup1_, ctx);
								removeFromArray(this.friendGroupB_, ctx);
								this.sortFriendGroup0 = true;
								this.friendGroup0_.push(ctx);
								this.friendGroupA_.unshift(ctx);
							} else {
								removeFromArray(this.friendGroup0_, ctx);
								removeFromArray(this.friendGroupA_, ctx);
								this.sortFriendGroup1 = true;
								this.friendGroup1_.push(ctx);
								this.friendGroupB_.unshift(ctx);
							}
						}
					}
					if (ctx.ref &&
						ctx.name !== ctx.ref.displayName) {
						ctx.name = ctx.ref.displayName;
						if (ctx.state === 'online') {
							if (ctx.vip) {
								this.sortFriendGroup0 = true;
							} else {
								this.sortFriendGroup1 = true;
							}
						} else if (ctx.state === 'active') {
							this.sortFriendGroup2 = true;
						} else {
							this.sortFriendGroup3 = true;
						}
					}
					// FIXME: 도배 가능성 있음
					if (origin &&
						ctx.state !== 'online' &&
						ctx.ref &&
						ctx.ref.location !== '' &&
						ctx.ref.location !== 'offline') {
						API.getUser({
							userId: id
						});
					}
				} else {
					if (ctx.state === 'online') {
						if (ctx.vip) {
							removeFromArray(this.friendGroup0_, ctx);
							removeFromArray(this.friendGroupA_, ctx);
						} else {
							removeFromArray(this.friendGroup1_, ctx);
							removeFromArray(this.friendGroupB_, ctx);
						}
					} else if (ctx.state === 'active') {
						removeFromArray(this.friendGroup2_, ctx);
						removeFromArray(this.friendGroupC_, ctx);
					} else {
						removeFromArray(this.friendGroup3_, ctx);
						removeFromArray(this.friendGroupD_, ctx);
					}
					ctx.state = state;
					if (ctx.ref !== ref) {
						ctx.ref = ref;
					}
					if (ctx.vip !== vip) {
						ctx.vip = vip;
					}
					if (ctx.ref &&
						ctx.name !== ctx.ref.displayName) {
						ctx.name = ctx.ref.displayName;
					}
					if (ctx.state === 'online') {
						if (ctx.vip) {
							this.sortFriendGroup0 = true;
							this.friendGroup0_.push(ctx);
							this.friendGroupA_.unshift(ctx);
						} else {
							this.sortFriendGroup1 = true;
							this.friendGroup1_.push(ctx);
							this.friendGroupB_.unshift(ctx);
						}
					} else if (ctx.state === 'active') {
						this.sortFriendGroup2 = true;
						this.friendGroup2_.push(ctx);
						this.friendGroupC_.unshift(ctx);
					} else {
						this.sortFriendGroup3 = true;
						this.friendGroup3_.push(ctx);
						this.friendGroupD_.unshift(ctx);
					}
				}
			}
		};

		var sortFriendByName = (a, b) => {
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

		$app.computed.friendGroup0 = function () {
			if (this.orderFriendGroup0) {
				return this.friendGroupA_;
			}
			if (this.sortFriendGroup0) {
				this.sortFriendGroup0 = false;
				this.friendGroup0_.sort(sortFriendByName);
			}
			return this.friendGroup0_;
		};

		$app.computed.friendGroup1 = function () {
			if (this.orderFriendGroup1) {
				return this.friendGroupB_;
			}
			if (this.sortFriendGroup1) {
				this.sortFriendGroup1 = false;
				this.friendGroup1_.sort(sortFriendByName);
			}
			return this.friendGroup1_;
		};

		$app.computed.friendGroup2 = function () {
			if (this.orderFriendGroup2) {
				return this.friendGroupC_;
			}
			if (this.sortFriendGroup2) {
				this.sortFriendGroup2 = false;
				this.friendGroup2_.sort(sortFriendByName);
			}
			return this.friendGroup2_;
		};

		$app.computed.friendGroup3 = function () {
			if (this.orderFriendGroup3) {
				return this.friendGroupD_;
			}
			if (this.sortFriendGroup3) {
				this.sortFriendGroup3 = false;
				this.friendGroup3_.sort(sortFriendByName);
			}
			return this.friendGroup3_;
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

		$app.methods.deleteFriend = function (id) {
			// FIXME: 메시지 수정
			this.$confirm('Continue? Delete Friend', 'Confirm', {
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
			this.quickSearchItems = [];
			if (query) {
				var QUERY = query.toUpperCase();
				for (var key in this.friend) {
					var ctx = this.friend[key];
					if (ctx.ref) {
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
							this.quickSearchItems.push({
								value: ctx.id,
								label: ctx.name,
								ref: ctx.ref,
								NAME
							});
						}
					}
				}
				this.quickSearchItems.sort((a, b) => {
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
				if (this.quickSearchItems.length > 4) {
					this.quickSearchItems.length = 4;
				}
				this.quickSearchItems.push({
					value: `search:${query}`,
					label: query
				});
			}
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
					filterFn: (row, filter) => !filter.value || Boolean(API.favoriteObject[row.userId])
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

		API.$on('LOGIN', (args) => {
			$app.feedTable.data = VRCXStorage.GetArray(`${args.ref.id}_feedTable`);
			$app.sweepFeed();
		});

		API.$on('USER:UPDATE', (args) => {
			var { ref, prop } = args;
			if ($app.friend[ref.id]) {
				if (prop.location) {
					if (prop.location[0] === 'offline') {
						$app.addFeed('Offline', ref, {
							location: prop.location[1],
							time: prop.location[2]
						});
					} else if (prop.location[1] === 'offline') {
						$app.addFeed('Online', ref, {
							location: prop.location[0]
						});
					} else {
						$app.addFeed('GPS', ref, {
							location: [
								prop.location[0],
								prop.location[1]
							],
							time: prop.location[2]
						});
					}
				}
				if (prop.currentAvatarThumbnailImageUrl) {
					$app.addFeed('Avatar', ref, {
						avatar: prop.currentAvatarThumbnailImageUrl
					});
				}
				if (prop.status ||
					prop.statusDescription) {
					$app.addFeed('Status', ref, {
						status: [
							{
								status: prop.status
									? prop.status[0]
									: ref.status,
								statusDescription: prop.statusDescription
									? prop.statusDescription[0]
									: ref.statusDescription
							},
							{
								status: prop.status
									? prop.status[1]
									: ref.status,
								statusDescription: prop.statusDescription
									? prop.statusDescription[1]
									: ref.statusDescription
							}
						]
					});
				}
			}
		});

		var saveFeedTimer = false;
		$app.methods.saveFeed = function () {
			if (saveFeedTimer === false) {
				saveFeedTimer = setTimeout(() => {
					saveFeedTimer = false;
					VRCXStorage.SetArray(`${API.currentUser.id}_feedTable`, this.feedTable.data);
				}, 1);
			}
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
			var array = this.feedTable.data;
			// 로그는 3일까지만 남김
			var limit = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toJSON();
			var i = 0;
			var j = array.length;
			while (i < j &&
				array[i].created_at < limit) {
				++i;
			}
			if (i === j) {
				this.feedTable.data = [];
			} else if (i) {
				array.splice(0, i);
			}
		};

		// App: gameLog

		$app.data.lastLocation = '';
		$app.data.lastLocation_ = {};
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
					logs.forEach((log) => {
						var ctx = {
							created_at: log[0],
							type: log[1],
							data: log[2]
						};
						this.gameLogTable.data.push(ctx);
						if (ctx.type === 'Location') {
							this.lastLocation = ctx.data;
						}
					});
					this.sweepGameLog();
					// sweepGameLog로 기록이 삭제되면
					// 아무 것도 없는데 알림이 떠서 이상함
					if (this.gameLogTable.data.length) {
						this.notifyMenu('gameLog');
					}
				}
				this.updateSharedFeed();
			});
		};

		$app.methods.sweepGameLog = function () {
			var array = this.gameLogTable.data;
			// 로그는 3일까지만 남김
			var limit = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toJSON();
			var i = 0;
			var j = array.length;
			while (i < j &&
				array[i].created_at < limit) {
				++i;
			}
			if (i === j) {
				this.gameLogTable.data = [];
			} else if (i) {
				array.splice(0, i);
			}
		};

		$app.methods.updateDiscord = function () {
			if (this.isGameRunning &&
				this.lastLocation) {
				if (this.lastLocation !== this.lastLocation_.tag) {
					var L = API.parseLocation(this.lastLocation);
					L.worldName = L.worldId;
					this.lastLocation_ = L;
					if (L.worldId) {
						var ref = API.world[L.worldId];
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
				var LL = this.lastLocation_;
				if (LL.worldName.length < 2) {
					LL.worldName += '\uFFA0'.repeat(2 - LL.worldName.length);
				}
				if (this.discordInstance) {
					Discord.SetText(LL.worldName, `#${LL.instanceName} ${LL.accessType}`);
				} else {
					Discord.SetText(LL.worldName, '');
				}
				Discord.SetActive(this.discordActive);
			} else {
				Discord.SetActive(false);
			}
		};

		$app.methods.lookupUser = function (name) {
			for (var key in API.user) {
				var ctx = API.user[key];
				if (ctx.displayName === name) {
					this.showUserDialog(ctx.id);
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
		$app.data.searchUsers = [];
		$app.data.searchUserParam = {};
		$app.data.searchWorlds = [];
		$app.data.searchWorldOption = '';
		$app.data.searchWorldParam = {};
		$app.data.searchAvatars = [];
		$app.data.searchAvatarParam = {};
		$app.data.isSearchUserLoading = false;
		$app.data.isSearchWorldLoading = false;
		$app.data.isSearchAvatarLoading = false;

		API.$on('LOGIN', () => {
			$app.searchText = '';
			$app.searchUsers = [];
			$app.searchUserParam = {};
			$app.searchWorlds = [];
			$app.searchWorldOption = '';
			$app.searchWorldParam = {};
			$app.searchAvatars = [];
			$app.searchAvatarParam = {};
			$app.isSearchUserLoading = false;
			$app.isSearchWorldLoading = false;
			$app.isSearchAvatarLoading = false;
		});

		$app.methods.clearSearch = function () {
			this.searchUsers = [];
			this.searchWorlds = [];
			this.searchAvatars = [];
		};

		$app.methods.search = function () {
			this.searchUser();
			this.searchWorld({});
		};

		$app.methods.searchUser = function () {
			this.searchUserParam = {
				n: 10,
				offset: 0,
				search: this.searchText
			};
			this.moreSearchUser();
		};

		$app.methods.moreSearchUser = function (go) {
			var param = this.searchUserParam;
			if (go) {
				param.offset += param.n * go;
				if (param.offset < 0) {
					param.offset = 0;
				}
			}
			this.isSearchUserLoading = true;
			API.getUsers(param).finally(() => {
				this.isSearchUserLoading = false;
			}).then((args) => {
				this.searchUsers = [];
				args.json.forEach((json) => {
					insertOrUpdateArrayById(this.searchUsers, json);
				});
				return args;
			});
		};

		$app.methods.searchWorld = function (ref) {
			this.searchWorldOption = '';
			var param = {
				n: 10,
				offset: 0
			};
			switch (ref.sortHeading) {
				case 'featured':
					param.sort = 'order';
					param.featured = 'true';
					break;
				case 'trending':
					param.sort = 'popularity';
					param.featured = 'false';
					break;
				case 'updated':
					param.sort = 'updated';
					break;
				case 'created':
					param.sort = 'created';
					break;
				case 'publication':
					param.sort = 'publicationDate';
					break;
				case 'shuffle':
					param.sort = 'shuffle';
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
					param.sort = 'labsPublicationDate';
					break;
				case 'heat':
					param.sort = 'heat';
					param.featured = 'false';
					break;
				default:
					param.sort = 'popularity';
					param.search = this.searchText;
					break;
			}
			param.order = ref.sortOrder || 'descending';
			if (ref.sortOwnership === 'mine') {
				param.user = 'me';
				param.releaseStatus = 'all';
			}
			if (ref.tag) {
				param.tag = ref.tag;
			}
			// TODO: option.platform
			this.searchWorldParam = param;
			this.moreSearchWorld();
		};

		$app.methods.moreSearchWorld = function (go) {
			var param = this.searchWorldParam;
			if (go) {
				param.offset += param.n * go;
				if (param.offset < 0) {
					param.offset = 0;
				}
			}
			this.isSearchWorldLoading = true;
			API.getWorlds(param, this.searchWorldOption).finally(() => {
				this.isSearchWorldLoading = false;
			}).then((args) => {
				this.searchWorlds = [];
				args.json.forEach((json) => {
					insertOrUpdateArrayById(this.searchWorlds, json);
				});
				return args;
			});
		};

		$app.methods.searchAvatar = function (option) {
			var param = {
				n: 10,
				offset: 0
			};
			switch (option) {
				case 'updated':
					param.sort = 'updated';
					break;
				case 'created':
					param.sort = 'created';
					break;
				case 'mine':
					param.user = 'me';
					param.releaseStatus = 'all';
					break;
				default:
					param.sort = 'popularity';
					param.search = this.searchText;
					break;
			}
			param.order = 'descending';
			// TODO: option.platform
			this.searchAvatarParam = param;
			this.moreSearchAvatar();
		};

		$app.methods.moreSearchAvatar = function (go) {
			var param = this.searchAvatarParam;
			if (go) {
				param.offset += param.n * go;
				if (param.offset < 0) {
					param.offset = 0;
				}
			}
			this.isSearchAvatarLoading = true;
			API.getAvatars(param).finally(() => {
				this.isSearchAvatarLoading = false;
			}).then((args) => {
				this.searchAvatars = [];
				args.json.forEach((json) => {
					insertOrUpdateArrayById(this.searchAvatars, json);
				});
				return args;
			});
		};

		// App: Favorite

		$app.data.favoriteFriend = {};
		$app.data.favoriteWorld = {};
		$app.data.favoriteAvatar = {};
		$app.data.favoriteFriends_ = [];
		$app.data.favoriteWorlds_ = [];
		$app.data.favoriteAvatars_ = [];
		$app.data.sortFavoriteFriends = false;
		$app.data.sortFavoriteWorlds = false;
		$app.data.sortFavoriteAvatars = false;

		API.$on('LOGIN', () => {
			$app.favoriteFriend = {};
			$app.favoriteWorld = {};
			$app.favoriteAvatar = {};
			$app.favoriteFriends_ = [];
			$app.favoriteWorlds_ = [];
			$app.favoriteAvatars_ = [];
			$app.sortFavoriteFriends = false;
			$app.sortFavoriteWorlds = false;
			$app.sortFavoriteAvatars = false;
		});

		API.$on('FAVORITE', (args) => {
			$app.updateFavorite(args.ref.type, args.ref.favoriteId);
		});

		API.$on('FAVORITE:@DELETE', (args) => {
			$app.updateFavorite(args.ref.type, args.ref.favoriteId);
		});

		API.$on('USER', (args) => {
			$app.updateFavorite('friend', args.ref.id);
		});

		API.$on('WORLD', (args) => {
			$app.updateFavorite('world', args.ref.id);
		});

		API.$on('AVATAR', (args) => {
			$app.updateFavorite('avatar', args.ref.id);
		});

		$app.methods.updateFavorite = function (type, objectId) {
			var favorite = API.favoriteObject[objectId];
			var ctx = null;
			var ref = null;
			if (type === 'friend') {
				ctx = this.favoriteFriend[objectId];
				if (favorite) {
					ref = API.user[objectId];
					if (ctx) {
						if (ctx.ref !== ref) {
							ctx.ref = ref;
						}
						if (ref &&
							ctx.name !== ref.displayName) {
							ctx.name = ref.displayName;
							this.sortFavoriteFriends = true;
						}
					} else {
						ctx = {
							id: objectId,
							group: favorite.group_,
							ref,
							name: ''
						};
						if (ref) {
							ctx.name = ref.displayName;
						} else {
							ref = this.friendLog[objectId];
							if (ref &&
								ref.displayName) {
								ctx.name = ref.displayName;
							}
						}
						this.$set(this.favoriteFriend, objectId, ctx);
						this.favoriteFriends_.push(ctx);
						this.sortFavoriteFriends = true;
					}
				} else if (ctx) {
					this.$delete(this.favoriteFriend, objectId);
					removeFromArray(this.favoriteFriends_, ctx);
				}
			} else if (type === 'world') {
				ctx = this.favoriteWorld[objectId];
				if (favorite) {
					ref = API.world[objectId];
					if (ctx) {
						if (ctx.ref !== ref) {
							ctx.ref = ref;
						}
						if (ref &&
							ctx.name !== ref.name) {
							ctx.name = ref.name;
							this.sortFavoriteWorlds = true;
						}
					} else {
						ctx = {
							id: objectId,
							group: favorite.group_,
							ref,
							name: ''
						};
						if (ref) {
							ctx.name = ref.name;
						}
						this.$set(this.favoriteWorld, objectId, ctx);
						this.favoriteWorlds_.push(ctx);
						this.sortFavoriteWorlds = true;
					}
				} else {
					this.$delete(this.favoriteWorld, objectId);
					removeFromArray(this.favoriteWorlds_, ctx);
				}
			} else if (type === 'avatar') {
				ctx = this.favoriteAvatar[objectId];
				if (favorite) {
					ref = API.avatar[objectId];
					if (ctx) {
						if (ctx.ref !== ref) {
							ctx.ref = ref;
						}
						if (ref &&
							ctx.name !== ref.name) {
							ctx.name = ref.name;
							this.sortFavoriteAvatars = true;
						}
					} else {
						ctx = {
							id: objectId,
							group: favorite.group_,
							ref,
							name: ''
						};
						if (ref) {
							ctx.name = ref.name;
						}
						this.$set(this.favoriteAvatar, objectId, ctx);
						this.favoriteAvatars_.push(ctx);
						this.sortFavoriteAvatars = true;
					}
				} else {
					this.$delete(this.favoriteAvatar, objectId);
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

		var sortFavoriteByName = (a, b) => {
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

		$app.computed.favoriteFriends = function () {
			if (this.sortFavoriteFriends) {
				this.sortFavoriteFriends = false;
				this.favoriteFriends_.sort(sortFavoriteByName);
			}
			return this.favoriteFriends_;
		};

		$app.computed.favoriteWorlds = function () {
			if (this.sortFavoriteWorlds) {
				this.sortFavoriteWorlds = false;
				this.favoriteWorlds_.sort(sortFavoriteByName);
			}
			return this.favoriteWorlds_;
		};

		$app.computed.favoriteAvatars = function () {
			if (this.sortFavoriteAvatars) {
				this.sortFavoriteAvatars = false;
				this.favoriteAvatars_.sort(sortFavoriteByName);
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

		API.$on('LOGIN', (args) => {
			$app.initFriendship(args.ref);
		});

		API.$on('USER:CURRENT', (args) => {
			$app.updateFriendships(args.ref);
		});

		API.$on('USER', (args) => {
			$app.updateFriendship(args.ref);
		});

		API.$on('FRIEND:ADD', (args) => {
			$app.addFriendship(args.param.userId);
		});

		API.$on('FRIEND:DELETE', (args) => {
			$app.deleteFriendship(args.param.userId);
		});

		API.$on('FRIEND:REQUEST', (args) => {
			var ref = API.user[args.param.userId];
			if (ref) {
				$app.friendLogTable.data.push({
					created_at: new Date().toJSON(),
					type: 'FriendRequest',
					userId: ref.id,
					displayName: ref.displayName
				});
				$app.saveFriendLog();
			}
		});

		API.$on('FRIEND:REQUEST:CANCEL', (args) => {
			var ref = API.user[args.param.userId];
			if (ref) {
				$app.friendLogTable.data.push({
					created_at: new Date().toJSON(),
					type: 'CancelFriendRequst',
					userId: ref.id,
					displayName: ref.displayName
				});
				$app.saveFriendLog();
			}
		});

		var saveFriendLogTimer = false;
		$app.methods.saveFriendLog = function () {
			if (saveFriendLogTimer === false) {
				saveFriendLogTimer = setTimeout(() => {
					saveFriendLogTimer = false;
					VRCXStorage.SetObject(`${API.currentUser.id}_friendLog`, this.friendLog);
					VRCXStorage.SetArray(`${API.currentUser.id}_friendLogTable`, this.friendLogTable.data);
					VRCXStorage.Set(`${API.currentUser.id}_friendLogUpdatedAt`, new Date().toJSON());
				}, 1);
			}
		};

		$app.methods.initFriendship = function (ref) {
			if (VRCXStorage.Get(`${ref.id}_friendLogUpdatedAt`)) {
				this.friendLog = VRCXStorage.GetObject(`${ref.id}_friendLog`);
				this.friendLogTable.data = VRCXStorage.GetArray(`${ref.id}_friendLogTable`);
			} else {
				this.friendLog = {};
				ref.friends.forEach((id) => {
					var ctx = {
						id
					};
					var user = API.user[id];
					if (user) {
						ctx.displayName = user.displayName;
						ctx.trustLevel = user.trustLevel_;
					}
					this.friendLog[id] = ctx;
				});
				this.friendLogTable.data = [];
				this.saveFriendLog();
			}
		};

		$app.methods.addFriendship = function (id) {
			if (!this.friendLog[id]) {
				var ctx = {
					id,
					displayName: null,
					trustLevel: null
				};
				this.$set(this.friendLog, id, ctx);
				var ref = API.user[id];
				if (ref) {
					ctx.displayName = ref.displayName;
					ctx.trustLevel = ref.trustLevel_;
					this.friendLogTable.data.push({
						created_at: new Date().toJSON(),
						type: 'Friend',
						userId: ref.id,
						displayName: ctx.displayName
					});
				}
				this.saveFriendLog();
				this.notifyMenu('friendLog');
			}
		};

		$app.methods.deleteFriendship = function (id) {
			var ctx = this.friendLog[id];
			if (ctx) {
				this.$delete(this.friendLog, id);
				this.friendLogTable.data.push({
					created_at: new Date().toJSON(),
					type: 'Unfriend',
					userId: id,
					displayName: ctx.displayName
				});
				this.saveFriendLog();
				this.notifyMenu('friendLog');
			}
		};

		$app.methods.updateFriendships = function (ref) {
			var map = {};
			ref.friends.forEach((id) => {
				map[id] = true;
				this.addFriendship(id);
			});
			for (var key in this.friendLog) {
				if (!map[key]) {
					this.deleteFriendship(key);
				}
			}
		};

		$app.methods.updateFriendship = function (ref) {
			var ctx = this.friendLog[ref.id];
			if (ctx) {
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
				if (ref.trustLevel_ &&
					ctx.trustLevel !== ref.trustLevel_) {
					if (ctx.trustLevel) {
						this.friendLogTable.data.push({
							created_at: new Date().toJSON(),
							type: 'TrustLevel',
							userId: ref.id,
							displayName: ref.displayName,
							trustLevel: ref.trustLevel_,
							previousTrustLevel: ctx.trustLevel
						});
					}
					ctx.trustLevel = ref.trustLevel_;
					this.saveFriendLog();
					this.notifyMenu('friendLog');
				}
			}
		};

		$app.methods.deleteFriendLog = function (row) {
			// FIXME: 메시지 수정
			this.$confirm('Continue? Delete Log', 'Confirm', {
				confirmButtonText: 'Confirm',
				cancelButtonText: 'Cancel',
				type: 'info',
				callback: (action) => {
					if (action === 'confirm') {
						if (removeFromArray(this.friendLogTable.data, row)) {
							this.saveFriendLog();
						}
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

		API.$on('LOGIN', () => {
			$app.playerModerationTable.data = [];
		});

		API.$on('PLAYER-MODERATION', (args) => {
			var insertOrUpdate = $app.playerModerationTable.data.some((val, idx, arr) => {
				if (val.id === args.ref.id) {
					if (args.ref.hide_) {
						$app.$delete(arr, idx);
					} else {
						$app.$set(arr, idx, args.ref);
					}
					return true;
				}
				return false;
			});
			if (!insertOrUpdate &&
				!args.ref.hide_) {
				$app.playerModerationTable.data.push(args.ref);
				$app.notifyMenu('moderation');
			}
		});

		API.$on('PLAYER-MODERATION:@DELETE', (args) => {
			$app.playerModerationTable.data.find((val, idx, arr) => {
				if (val.id === args.ref.id) {
					$app.$delete(arr, idx);
					return true;
				}
				return false;
			});
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

		API.$on('LOGIN', () => {
			$app.notificationTable.data = [];
		});

		API.$on('NOTIFICATION', (args) => {
			var insertOrUpdate = $app.notificationTable.data.some((val, idx, arr) => {
				if (val.id === args.ref.id) {
					if (args.ref.hide_) {
						$app.$delete(arr, idx);
					} else {
						$app.$set(arr, idx, args.ref);
					}
					return true;
				}
				return false;
			});
			if (!insertOrUpdate &&
				!args.ref.hide_) {
				$app.notificationTable.data.push(args.ref);
				$app.notifyMenu('notification');
			}
		});

		API.$on('NOTIFICATION:@DELETE', (args) => {
			$app.notificationTable.data.find((val, idx, arr) => {
				if (val.id === args.ref.id) {
					$app.$delete(arr, idx);
					return true;
				}
				return false;
			});
		});

		$app.methods.parseInviteLocation = function (row) {
			try {
				var L = API.parseLocation(row.details.worldId);
				return `${row.details.worldName} #${L.instanceName} ${L.accessType}`;
			} catch (err) {
				console.error(err);
				return '';
			}
		};

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
		$app.data.showNameColor = VRCXStorage.GetBool('showNameColor');
		$nameColorStyle.disabled = VRCXStorage.GetBool('showNameColor');
		$app.watch.showNameColor = function () {
			VRCXStorage.SetBool('showNameColor', this.showNameColor);
			$nameColorStyle.disabled = this.showNameColor;
		};

		API.$on('LOGIN', () => {
			$app.currentUserTreeData = [];
			$app.pastDisplayNameTable.data = [];
		});

		API.$on('USER:CURRENT', (args) => {
			if (args.ref.pastDisplayNames) {
				$app.pastDisplayNameTable.data = args.ref.pastDisplayNames;
			}
		});

		API.$on('VISITS', (args) => {
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

			location_: {},
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

		API.$on('LOGOUT', () => {
			$app.userDialog.visible = false;
		});

		API.$on('USER', (args) => {
			var D = $app.userDialog;
			if (D.visible &&
				args.ref.id === D.id) {
				D.ref = args.ref;
				$app.updateUserDialogLocation();
			}
		});

		API.$on('WORLD', (args) => {
			var D = $app.userDialog;
			if (D.visible &&
				args.ref.id === D.location_.worldId) {
				$app.updateUserDialogLocation();
			}
		});

		API.$on('FRIEND:STATUS', (args) => {
			var D = $app.userDialog;
			if (D.visible &&
				args.param.userId === D.id) {
				D.isFriend = args.json.isFriend;
				D.incomingRequest = args.json.incomingRequest;
				D.outgoingRequest = args.json.outgoingRequest;
			}
		});

		API.$on('FRIEND:REQUEST', (args) => {
			var D = $app.userDialog;
			if (D.visible &&
				args.param.userId === D.id) {
				if (args.json.success) {
					D.isFriend = true;
				} else {
					D.outgoingRequest = true;
				}
			}
		});

		API.$on('FRIEND:REQUEST:CANCEL', (args) => {
			var D = $app.userDialog;
			if (D.visible &&
				args.param.userId === D.id) {
				D.outgoingRequest = false;
			}
		});

		API.$on('NOTIFICATION', (args) => {
			var D = $app.userDialog;
			if (D.visible &&
				args.ref &&
				args.ref.senderUserId === D.id &&
				args.ref.type === 'friendRequest') {
				D.incomingRequest = true;
			}
		});

		API.$on('NOTIFICATION:ACCEPT', (args) => {
			var D = $app.userDialog;
			if (D.visible &&
				args.ref &&
				args.ref.senderUserId === D.id &&
				args.ref.type === 'friendRequest') {
				D.isFriend = true;
			}
		});

		API.$on('NOTIFICATION:@DELETE', (args) => {
			var D = $app.userDialog;
			if (D.visible &&
				args.ref.senderUserId === D.id &&
				args.ref.type === 'friendRequest') {
				D.incomingRequest = false;
			}
		});

		API.$on('FRIEND:DELETE', (args) => {
			var D = $app.userDialog;
			if (D.visible &&
				args.param.userId === D.id) {
				D.isFriend = false;
			}
		});

		API.$on('PLAYER-MODERATION', (args) => {
			var D = $app.userDialog;
			if (D.visible &&
				args.ref.targetUserId === D.id &&
				args.ref.sourceUserId === API.currentUser.id &&
				!args.ref.hide_) {
				if (args.ref.type === 'block') {
					D.isBlock = true;
				} else if (args.ref.type === 'mute') {
					D.isMute = true;
				} else if (args.ref.type === 'hideAvatar') {
					D.isHideAvatar = true;
				}
			}
		});

		API.$on('PLAYER-MODERATION:@DELETE', (args) => {
			var D = $app.userDialog;
			if (D.visible &&
				args.ref.targetUserId === D.id &&
				args.ref.sourceUserId === API.currentUser.id) {
				if (args.ref.type === 'block') {
					D.isBlock = false;
				} else if (args.ref.type === 'mute') {
					D.isMute = false;
				} else if (args.ref.type === 'hideAvatar') {
					D.isHideAvatar = false;
				}
			}
		});

		API.$on('FAVORITE', (args) => {
			var D = $app.userDialog;
			if (D.visible &&
				args.ref.favoriteId === D.id &&
				!args.ref.hide_) {
				D.isFavorite = true;
			}
		});

		API.$on('FAVORITE:@DELETE', (args) => {
			var D = $app.userDialog;
			if (D.visible &&
				args.ref.favoriteId === D.id) {
				D.isFavorite = false;
			}
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
					D.friend = this.friend[D.id];
					D.isFriend = Boolean(D.friend);
					D.incomingRequest = false;
					D.outgoingRequest = false;
					D.isBlock = false;
					D.isMute = false;
					D.isHideAvatar = false;
					var key = null;
					var ref = null;
					for (key in API.playerModeration) {
						ref = API.playerModeration[key];
						if (ref.targetUserId === D.id &&
							ref.sourceUserId === API.currentUser.id &&
							!ref.hide_) {
							if (ref.type === 'block') {
								D.isBlock = true;
							} else if (ref.type === 'mute') {
								D.isMute = true;
							} else if (ref.type === 'hideAvatar') {
								D.isHideAvatar = true;
							}
						}
					}
					D.isFavorite = Boolean(API.favoriteObject[D.id]);
					this.updateUserDialogLocation();
					D.worlds = [];
					D.avatars = [];
					D.isWorldsLoading = false;
					D.isAvatarsLoading = false;
					for (key in API.world) {
						ref = API.world[key];
						if (ref.authorId === D.id) {
							D.worlds.push(ref);
						}
					}
					for (key in API.avatar) {
						ref = API.avatar[key];
						if (ref.authorId === D.id) {
							D.avatars.push(ref);
						}
					}
					this.sortUserDialogWorlds();
					this.sortUserDialogAvatars();
					API.getFriendStatus({
						userId: D.id
					});
					if (args.cache) {
						API.getUser(args.param);
					}
				}
				return args;
			});
		};

		$app.methods.updateUserDialogLocation = function () {
			var ref = null;
			var D = this.userDialog;
			var L = API.parseLocation(D.ref.location);
			D.location_ = L;
			if (L.userId) {
				ref = API.user[L.userId];
				if (ref) {
					L.user = ref;
				} else {
					API.getUser({
						userId: L.userId
					}).then((args) => {
						this.$set(L, 'user', args.ref);
						return args;
					});
				}
			}
			D.users = [];
			if (!L.isOffline) {
				for (var key in this.friend) {
					ref = API.user[key];
					if (ref &&
						ref.location === D.ref.location) {
						D.users.push(ref);
					}
				}
				D.users.sort((a, b) => {
					var A = String(a.displayName).toUpperCase();
					var B = String(b.displayName).toUpperCase();
					if (A < B) {
						return -1;
					}
					if (A > B) {
						return 1;
					}
					return 0;
				});
			}
			D.instance = {};
			if (L.worldId) {
				var handle = (instances) => {
					if (instances) {
						instances.find((v) => {
							if (v[0] === L.instanceId) {
								D.instance = {
									id: v[0],
									occupants: v[1]
								};
								return true;
							}
							return false;
						});
					}
				};
				ref = API.world[L.worldId];
				if (ref) {
					handle(ref.instances);
				} else {
					API.getWorld({
						worldId: L.worldId
					}).then((args) => {
						if (L.tag === D.location_.tag) {
							handle(args.ref.instances);
						}
						return true;
					});
				}
			}
		};

		$app.methods.sortUserDialogWorlds = function () {
			this.userDialog.worlds.sort((a, b) => {
				var A = String(a.name).toUpperCase();
				var B = String(b.name).toUpperCase();
				if (A < B) {
					return -1;
				}
				if (A > B) {
					return 1;
				}
				return 0;
			});
		};

		$app.methods.refreshUserDialogWorlds = function () {
			var D = this.userDialog;
			if (!D.isWorldsLoading) {
				D.isWorldsLoading = true;
				var param = {
					n: 100,
					offset: 0,
					sort: 'updated',
					order: 'descending',
					user: 'friends',
					userId: D.id,
					releaseStatus: 'public'
				};
				if (param.userId === API.currentUser.id) {
					param.user = 'me';
					param.releaseStatus = 'all';
				}
				API.bulk({
					fn: 'getWorlds',
					N: -1,
					param,
					handle: (args) => {
						args.json.forEach((json) => {
							insertOrUpdateArrayById(D.worlds, json);
						});
					},
					done: () => {
						this.sortUserDialogWorlds();
						D.isWorldsLoading = false;
					}
				});
			}
		};

		$app.methods.sortUserDialogAvatars = function () {
			this.userDialog.avatars.sort((a, b) => {
				var A = String(a.name).toUpperCase();
				var B = String(b.name).toUpperCase();
				if (A < B) {
					return -1;
				}
				if (A > B) {
					return 1;
				}
				return 0;
			});
		};

		$app.methods.refreshUserDialogAvatars = function () {
			var D = this.userDialog;
			if (!D.isAvatarsLoading) {
				D.isAvatarsLoading = true;
				var param = {
					n: 100,
					offset: 0,
					sort: 'updated',
					order: 'descending',
					user: 'friends',
					userId: D.id,
					releaseStatus: 'public'
				};
				if (param.userId === API.currentUser.id) {
					param.user = 'me';
					param.releaseStatus = 'all';
				}
				API.bulk({
					fn: 'getAvatars',
					N: -1,
					param,
					handle: (args) => {
						args.json.forEach((json) => {
							insertOrUpdateArrayById(D.avatars, json);
						});
					},
					done: () => {
						this.sortUserDialogAvatars();
						D.isAvatarsLoading = false;
					}
				});
			}
		};

		var performUserDialogCommand = (command, userId) => {
			var key = null;
			switch (command) {
				case 'Delete Favorite':
					API.deleteFavorite({
						objectId: userId
					});
					break;
				case 'Unfriend':
					API.deleteFriend({
						userId
					});
					break;
				case 'Accept Friend Request':
					key = API.getFriendRequest(userId);
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
					key = API.getFriendRequest(userId);
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
				default:
					break;
			}
		};

		$app.methods.userDialogCommand = function (command) {
			var D = this.userDialog;
			if (D.visible) {
				if (command === 'Add Favorite') {
					this.showFavoriteDialog('friend', D.id);
				} else if (command === 'Show Avatar Author') {
					var id = extractFileId(D.ref.currentAvatarImageUrl);
					if (id) {
						API.call(`file/${id}`).then((json) => {
							if (D.id === json.ownerId) {
								this.$message({
									message: 'It is own avatar',
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
			location_: {},
			ref: {},
			isFavorite: false,
			rooms: [],
			treeData: [],
			fileCreatedAt: '',
			fileSize: ''
		};

		API.$on('LOGOUT', () => {
			$app.worldDialog.visible = false;
		});

		API.$on('WORLD', (args) => {
			var D = $app.worldDialog;
			if (D.visible &&
				args.ref.id === D.id) {
				D.ref = args.ref;
				var id = extractFileId(args.ref.assetUrl);
				if (id) {
					API.call(`file/${id}`).then((json) => {
						var ref = json.versions[json.versions.length - 1];
						D.fileCreatedAt = ref.created_at;
						D.fileSize = `${(ref.file.sizeInBytes / 1048576).toFixed(2)} MiB`;
					});
				}
				$app.updateWorldDialogInstances();
			}
		});

		API.$on('FAVORITE', (args) => {
			var D = $app.worldDialog;
			if (D.visible &&
				args.ref.favoriteId === D.id &&
				!args.ref.hide_) {
				D.isFavorite = true;
			}
		});

		API.$on('FAVORITE:@DELETE', (args) => {
			var D = $app.worldDialog;
			if (D.visible &&
				args.ref.favoriteId === D.id) {
				D.isFavorite = false;
			}
		});

		$app.methods.showWorldDialog = function (tag) {
			this.$nextTick(() => adjustDialogZ(this.$refs.worldDialog.$el));
			var D = this.worldDialog;
			var L = API.parseLocation(tag);
			if (L.worldId) {
				D.id = L.worldId;
				D.location_ = L;
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
						D.isFavorite = Boolean(API.favoriteObject[D.id]);
						D.rooms = [];
						this.updateWorldDialogInstances();
						if (args.cache) {
							API.getWorld(args.param);
						}
					}
					return args;
				});
			}
		};

		$app.methods.updateWorldDialogInstances = function () {
			var ref = null;
			var D = this.worldDialog;
			if (D.ref.instances) {
				var map = {};
				D.ref.instances.forEach((v) => {
					map[v[0]] = {
						id: v[0],
						occupants: v[1],
						users: []
					};
				});
				var { instanceId } = D.location_;
				if (instanceId &&
					!map[instanceId]) {
					map[instanceId] = {
						id: instanceId,
						occupants: 0,
						users: []
					};
				}
				for (var key in this.friend) {
					ref = API.user[key];
					if (ref &&
						ref.location_.worldId === D.id) {
						({ instanceId } = ref.location_);
						if (map[instanceId]) {
							map[instanceId].users.push(ref);
						} else {
							map[instanceId] = {
								id: instanceId,
								occupants: 0,
								users: [ref]
							};
						}
					}
				}
				D.rooms = [];
				Object.values(map).sort((a, b) => b.users.length - a.users.length ||
					b.occupants - a.occupants).forEach((v) => {
						var L = API.parseLocation(`${D.id}:${v.id}`);
						v.location_ = L;
						v.location = L.tag;
						if (L.userId) {
							ref = API.user[L.userId];
							if (ref) {
								L.user = ref;
							} else {
								API.getUser({
									userId: L.userId
								}).then((args) => {
									this.$set(L, 'user', args.ref);
									return args;
								});
							}
						}
						v.users.sort((a, b) => {
							var A = String(a.displayName).toUpperCase();
							var B = String(b.displayName).toUpperCase();
							if (A < B) {
								return -1;
							}
							if (A > B) {
								return 1;
							}
							return 0;
						});
						D.rooms.push(v);
					});
			}
		};

		$app.methods.worldDialogCommand = function (command) {
			var D = this.worldDialog;
			if (D.visible) {
				if (command === 'New Instance') {
					this.showNewInstanceDialog(D.location_.tag);
				} else if (command === 'Add Favorite') {
					this.showFavoriteDialog('world', D.id);
				} else {
					this.$confirm(`Continue? ${command}`, 'Confirm', {
						confirmButtonText: 'Confirm',
						cancelButtonText: 'Cancel',
						type: 'info',
						callback: (action) => {
							if (action === 'confirm') {
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
						}
					});
				}
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
				ref.unityPackages.forEach((v) => {
					var platform = 'PC';
					if (v.platform === 'standalonewindows') {
						platform = 'PC';
					} else if (v.platform === 'android') {
						platform = 'Quest';
					} else if (v.platform) {
						({ platform } = v);
					}
					platforms.push(`${platform}/${v.unityVersion}`);
				});
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

		API.$on('LOGOUT', () => {
			$app.avatarDialog.visible = false;
		});

		API.$on('AVATAR', (args) => {
			var D = $app.avatarDialog;
			if (D.visible &&
				args.ref.id === D.id) {
				D.ref = args.ref;
				var id = extractFileId(args.ref.assetUrl);
				if (id) {
					API.call(`file/${id}`).then((json) => {
						var ref = json.versions[json.versions.length - 1];
						D.fileCreatedAt = ref.created_at;
						D.fileSize = `${(ref.file.sizeInBytes / 1048576).toFixed(2)} MiB`;
					});
				}
			}
		});

		API.$on('FAVORITE', (args) => {
			var D = $app.avatarDialog;
			if (D.visible &&
				args.ref.favoriteId === D.id &&
				!args.ref.hide_) {
				D.isFavorite = true;
			}
		});

		API.$on('FAVORITE:@DELETE', (args) => {
			var D = $app.avatarDialog;
			if (D.visible &&
				args.ref.favoriteId === D.id) {
				D.isFavorite = false;
			}
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
					D.isFavorite = Boolean(API.favoriteObject[D.ref.id]);
					if (args.cache) {
						API.getAvatar(args.param);
					}
				}
				return args;
			});
		};

		$app.methods.avatarDialogCommand = function (command) {
			var D = this.avatarDialog;
			if (D.visible) {
				if (command === 'Add Favorite') {
					this.showFavoriteDialog('avatar', D.id);
				} else {
					this.$confirm(`Continue? ${command}`, 'Confirm', {
						confirmButtonText: 'Confirm',
						cancelButtonText: 'Cancel',
						type: 'info',
						callback: (action) => {
							if (action === 'confirm') {
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
						}
					});
				}
			}
		};

		$app.methods.refreshAvatarDialogTreeData = function () {
			var D = this.avatarDialog;
			D.treeData = buildTreeData(D.ref);
		};

		$app.computed.avatarDialogLastUpdate = function () {
			var at = '';
			var { ref } = this.avatarDialog;
			if (ref.unityPackages) {
				ref.unityPackages.forEach((v) => {
					if (at < v.created_at) {
						at = v.created_at;
					}
				});
			}
			return at || ref.updated_at || '';
		};

		$app.computed.avatarDialogPlatform = function () {
			var { ref } = this.avatarDialog;
			var platforms = [];
			if (ref.unityPackages) {
				ref.unityPackages.forEach((v) => {
					var platform = 'PC';
					if (v.platform === 'standalonewindows') {
						platform = 'PC';
					} else if (v.platform === 'android') {
						platform = 'Quest';
					} else if (v.platform) {
						({ platform } = v);
					}
					platforms.push(`${platform}/${v.unityVersion}`);
				});
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

		API.$on('LOGOUT', () => {
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

		API.$on('LOGOUT', () => {
			$app.inviteDialog.visible = false;
		});

		$app.methods.sendInvite = function () {
			this.$confirm('Continue? Invite', 'Confirm', {
				confirmButtonText: 'Confirm',
				cancelButtonText: 'Cancel',
				type: 'info',
				callback: (action) => {
					if (action === 'confirm') {
						var D = this.inviteDialog;
						if (!D.loading) {
							D.loading = true;
							var param = {
								receiverUserId: '',
								type: 'invite',
								message: '',
								seen: false,
								details: {
									worldId: D.worldId,
									worldName: D.worldName
								}
							};
							var invite = () => {
								if (D.userIds.length) {
									param.receiverUserId = D.userIds.shift();
									API.sendNotification(param).finally(invite);
								} else {
									D.loading = false;
									D.visible = false;
									this.$message({
										message: 'Invite sent',
										type: 'success'
									});
								}
							};
							invite();
						}

					}
				}
			});
		};

		$app.methods.showInviteDialog = function (tag) {
			this.$nextTick(() => adjustDialogZ(this.$refs.inviteDialog.$el));
			var L = API.parseLocation(tag);
			if (!(L.isOffline || L.isPrivate) &&
				L.worldId) {
				var handle = (ref) => {
					var D = this.inviteDialog;
					D.userIds = [];
					D.worldId = L.tag;
					D.worldName = ref.name;
					D.visible = true;
				};
				var ref = API.world[L.worldId];
				if (ref) {
					handle(ref);
				} else {
					API.getWorld({
						worldId: L.worldId
					}).then((args) => {
						handle(args.ref);
						return args;
					});
				}
			}
		};

		// App: Social Status Dialog

		$app.data.socialStatusDialog = {
			visible: false,
			loading: false,
			status: '',
			statusDescription: ''
		};

		API.$on('LOGOUT', () => {
			$app.socialStatusDialog.visible = false;
		});

		$app.methods.saveSocialStatus = function () {
			var D = this.socialStatusDialog;
			if (!D.loading) {
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
			}
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

		API.$on('LOGOUT', () => {
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

		var updateLocationURL = function () {
			var D = this.newInstanceDialog;
			if (D.instanceId) {
				D.location = `${D.worldId}:${D.instanceId}`;
				D.url = `https://vrchat.net/launch?worldId=${encodeURIComponent(D.worldId)}&instanceId=${encodeURIComponent(D.instanceId)}`;
			} else {
				D.location = D.worldId;
				D.url = `https://vrchat.net/launch?worldId=${encodeURIComponent(D.worldId)}`;
			}
		};
		$app.watch['newInstanceDialog.worldId'] = updateLocationURL;
		$app.watch['newInstanceDialog.instanceId'] = updateLocationURL;

		$app.methods.showNewInstanceDialog = function (tag) {
			this.$nextTick(() => adjustDialogZ(this.$refs.newInstanceDialog.$el));
			var L = API.parseLocation(tag);
			if (!(L.isOffline || L.isPrivate) &&
				L.worldId) {
				var D = this.newInstanceDialog;
				D.worldId = L.worldId;
				D.accessType = 'public';
				this.buildInstance();
				D.visible = true;
			}
		};

		$app.methods.makeHome = function (tag) {
			this.$confirm('Continue? Make Home', 'Confirm', {
				confirmButtonText: 'Confirm',
				cancelButtonText: 'Cancel',
				type: 'info',
				callback: (action) => {
					if (action === 'confirm') {
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

		API.$on('LOGOUT', () => {
			$app.launchDialog.visible = false;
		});

		$app.methods.showLaunchDialog = function (tag) {
			this.$nextTick(() => adjustDialogZ(this.$refs.launchDialog.$el));
			var L = API.parseLocation(tag);
			if (!(L.isOffline || L.isPrivate) &&
				L.worldId) {
				var D = this.launchDialog;
				if (L.instanceId) {
					D.location = `${L.worldId}:${L.instanceId}`;
					D.url = `https://vrchat.net/launch?worldId=${encodeURIComponent(L.worldId)}&instanceId=${encodeURIComponent(L.instanceId)}`;
				} else {
					D.location = L.worldId;
					D.url = `https://vrchat.net/launch?worldId=${encodeURIComponent(L.worldId)}`;
				}
				D.visible = true;
			}
		};

		$app.methods.launchGame = function () {
			var D = this.launchDialog;
			VRCX.StartGame(D.location, D.desktop);
			D.visible = false;
		};

		$app = new Vue($app);
		window.$app = $app;
	});
} else {
	location = 'https://github.com/pypy-vrc/vrcx';
}
