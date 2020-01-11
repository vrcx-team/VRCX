// Copyright(c) 2019 pypy. All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

if (window.CefSharp) {
	Promise.all([
		CefSharp.BindObjectAsync('VRCX'),
		CefSharp.BindObjectAsync('VRCXStorage'),
		CefSharp.BindObjectAsync('SQLite')
	]).catch(function () {
		location = 'https://github.com/pypy-vrc/vrcx';
	}).then(function () {

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

		Noty.overrideDefaults({
			animation: {
				open: 'animated fadeIn',
				close: 'animated zoomOut'
			},
			layout: 'topCenter',
			theme: 'relax',
			timeout: 6000
		});

		var isObject = (any) => any === Object(any);

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

		ELEMENT.locale(ELEMENT.lang.en);

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
				var { length } = handlers;
				for (var i = 0; i < length; ++i) {
					handlers[i].apply(this, args);
				}
			} catch (err) {
				console.error(err);
			}
		};

		API.$on = function (name, fx) {
			var handlers = this.eventHandlers.get(name);
			if (handlers === undefined) {
				handlers = [];
				this.eventHandlers.set(name, handlers);
			}
			handlers.push(fx);
		};

		API.$off = function (name, fx) {
			var handlers = this.eventHandlers.get(name);
			if (handlers === undefined) {
				return;
			}
			var { length } = handlers;
			for (var i = 0; i < length; ++i) {
				if (handlers[i] === fx) {
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
				var request = this.pendingGetRequests.get(input);
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
				} else if (isObject(json.error)) {
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
					this.pendingGetRequests.delete(input);
				});
				this.pendingGetRequests.set(input, req);
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
			if (code) {
				var status = this.statusCodes[code];
				if (status) {
					text.push(`${code} ${status}`);
				} else {
					text.push(`${code}`);
				}
			}
			if (error !== undefined) {
				text.push(error);
			}
			text = text.map((s) => escapeTag(s)).join('<br>');
			throw new Error(text);
		};

		// API: Config

		API.cachedConfig = {};

		API.$on('CONFIG', function (args) {
			args.ref = this.updateConfig(args.json);
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
			this.cachedConfig = ctx;
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
			args.ref = this.updateWorld(args.json);
		});

		/*
			param: {
				worldId: string
			}
		*/
		API.getWorld = function (param) {
			return this.call(`worlds/${param.worldId}?apiKey=${this.cachedConfig.clientApiKey}`, {
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
			var ctx = this.cachedWorlds.get(ref.id);
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
					$isLabs: false,
					//
					...ref
				};
				this.cachedWorlds.set(ctx.id, ctx);
			}
			if (ctx.tags) {
				ctx.$isLabs = ctx.tags.includes('system_labs');
			}
			return ctx;
		};

		var $app = {
			data: {
				API,
				VRCX,
				// 1 = 대시보드랑 손목에 보이는거
				// 2 = 항상 화면에 보이는 거
				appType: location.href.substr(-1),
				currentTime: new Date().toJSON(),
				cpuUsage: 0,
				feeds: [],
				devices: []
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
					setInterval(() => this.update(), 1000);
					this.update();
					this.$nextTick(() => {
						if (this.appType === '1') {
							this.$el.style.display = '';
						}
					});
					return args;
				});
			}
		};

		$app.methods.update = function () {
			this.currentTime = new Date().toJSON();
			VRCX.CpuUsage().then((cpuUsage) => {
				this.cpuUsage = cpuUsage.toFixed(2);
			});
			VRCX.GetVRDevices().then((devices) => {
				devices.forEach((device) => {
					device[2] = parseInt(device[2], 10);
				});
				this.devices = devices;
			});
			this.updateSharedFeed();
		};

		$app.methods.updateSharedFeed = function () {
			// TODO: block mute hideAvatar unfriend
			var _feeds = this.feeds;
			this.feeds = VRCXStorage.GetArray('sharedFeeds');
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
				notys.forEach((noty) => {
					if (noty.created_at > bias) {
						if (noty.type === 'OnPlayerJoined') {
							new Noty({
								type: 'alert',
								text: `<strong>${noty.data}</strong> has joined`
							}).show();
						} else if (noty.type === 'OnPlayerLeft') {
							new Noty({
								type: 'alert',
								text: `<strong>${noty.data}</strong> has left`
							}).show();
						} else if (noty.type === 'Online') {
							new Noty({
								type: 'alert',
								text: `<strong>${noty.displayName}</strong> has logged in`
							}).show();
						} else if (noty.type === 'Offline') {
							new Noty({
								type: 'alert',
								text: `<strong>${noty.displayName}</strong> has logged out`
							}).show();
						}
					}
				});
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
	});
} else {
	location = 'https://github.com/pypy-vrc/vrcx';
}
