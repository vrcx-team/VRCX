import * as workerTimers from 'worker-timers';
import gameLogService from '../service/gamelog.js';
import configRepository from '../repository/config.js';
import database from '../repository/database.js';
import { baseClass, $app, API, $t, $utils } from './baseClass.js';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    _data = {
        gameLogTable: {
            data: [],
            loading: false,
            search: '',
            filter: [],
            tableProps: {
                stripe: true,
                size: 'mini',
                defaultSort: {
                    prop: 'created_at',
                    order: 'descending'
                }
            },
            pageSize: 15,
            paginationProps: {
                small: true,
                layout: 'sizes,prev,pager,next,total',
                pageSizes: [10, 15, 25, 50, 100]
            }
        },
        gameLogSessionTable: [],
        lastVideoUrl: '',
        lastResourceloadUrl: ''
    };

    _methods = {
        addGameLogEntry(gameLog, location) {
            if (this.gameLogDisabled) {
                return;
            }
            var userId = String(gameLog.userId || '');
            if (!userId && gameLog.displayName) {
                for (var ref of API.cachedUsers.values()) {
                    if (ref.displayName === gameLog.displayName) {
                        userId = ref.id;
                        break;
                    }
                }
            }
            switch (gameLog.type) {
                case 'location-destination':
                    if (this.isGameRunning) {
                        // needs to be added before OnPlayerLeft entries from LocationReset
                        this.addGameLog({
                            created_at: gameLog.dt,
                            type: 'LocationDestination',
                            location: gameLog.location
                        });
                        this.lastLocationReset(gameLog.dt);
                        this.lastLocation.location = 'traveling';
                        this.lastLocationDestination = gameLog.location;
                        this.lastLocationDestinationTime = Date.parse(
                            gameLog.dt
                        );
                        this.removeQueuedInstance(gameLog.location);
                        this.updateCurrentUserLocation();
                        this.clearNowPlaying();
                        this.updateCurrentInstanceWorld();
                        this.applyUserDialogLocation();
                        this.applyWorldDialogInstances();
                        this.applyGroupDialogInstances();
                    }
                    break;
                case 'location':
                    this.addInstanceJoinHistory(
                        this.lastLocation.location,
                        gameLog.dt
                    );
                    var worldName = this.replaceBioSymbols(gameLog.worldName);
                    if (this.isGameRunning) {
                        this.lastLocationReset(gameLog.dt);
                        this.clearNowPlaying();
                        this.lastLocation = {
                            date: Date.parse(gameLog.dt),
                            location: gameLog.location,
                            name: worldName,
                            playerList: new Map(),
                            friendList: new Map()
                        };
                        this.removeQueuedInstance(gameLog.location);
                        this.updateCurrentUserLocation();
                        this.updateVRLastLocation();
                        this.updateCurrentInstanceWorld();
                        this.applyUserDialogLocation();
                        this.applyWorldDialogInstances();
                        this.applyGroupDialogInstances();
                    }
                    this.addInstanceJoinHistory(gameLog.location, gameLog.dt);
                    var L = $utils.parseLocation(gameLog.location);
                    var entry = {
                        created_at: gameLog.dt,
                        type: 'Location',
                        location: gameLog.location,
                        worldId: L.worldId,
                        worldName,
                        groupName: '',
                        time: 0
                    };
                    this.getGroupName(gameLog.location).then((groupName) => {
                        entry.groupName = groupName;
                    });
                    this.addGamelogLocationToDatabase(entry);
                    break;
                case 'player-joined':
                    var joinTime = Date.parse(gameLog.dt);
                    var userMap = {
                        displayName: gameLog.displayName,
                        userId,
                        joinTime,
                        lastAvatar: ''
                    };
                    this.lastLocation.playerList.set(userId, userMap);
                    var ref = API.cachedUsers.get(userId);
                    if (!userId) {
                        console.error('Missing userId:', gameLog.displayName);
                    } else if (userId === API.currentUser.id) {
                        // skip
                    } else if (this.friends.has(userId)) {
                        this.lastLocation.friendList.set(userId, userMap);
                        if (
                            ref.location !== this.lastLocation.location &&
                            ref.travelingToLocation !==
                                this.lastLocation.location
                        ) {
                            // fix $location_at with private
                            ref.$location_at = joinTime;
                        }
                    } else if (typeof ref !== 'undefined') {
                        // set $location_at to join time if user isn't a friend
                        ref.$location_at = joinTime;
                    } else {
                        if (this.debugGameLog || this.debugWebRequests) {
                            console.log('Fetching user from gameLog:', userId);
                        }
                        API.getUser({ userId });
                    }
                    this.updateVRLastLocation();
                    this.getCurrentInstanceUserList();
                    var entry = {
                        created_at: gameLog.dt,
                        type: 'OnPlayerJoined',
                        displayName: gameLog.displayName,
                        location,
                        userId,
                        time: 0
                    };
                    database.addGamelogJoinLeaveToDatabase(entry);
                    break;
                case 'player-left':
                    var ref = this.lastLocation.playerList.get(userId);
                    if (typeof ref === 'undefined') {
                        break;
                    }
                    var time = Date.now() - ref.joinTime;
                    this.lastLocation.playerList.delete(userId);
                    this.lastLocation.friendList.delete(userId);
                    this.photonLobbyAvatars.delete(userId);
                    this.updateVRLastLocation();
                    this.getCurrentInstanceUserList();
                    var entry = {
                        created_at: gameLog.dt,
                        type: 'OnPlayerLeft',
                        displayName: gameLog.displayName,
                        location,
                        userId,
                        time
                    };
                    database.addGamelogJoinLeaveToDatabase(entry);
                    break;
                case 'portal-spawn':
                    if (this.ipcEnabled && this.isGameRunning) {
                        break;
                    }
                    var entry = {
                        created_at: gameLog.dt,
                        type: 'PortalSpawn',
                        location,
                        displayName: '',
                        userId: '',
                        instanceId: '',
                        worldName: ''
                    };
                    database.addGamelogPortalSpawnToDatabase(entry);
                    break;
                case 'video-play':
                    gameLog.videoUrl = decodeURI(gameLog.videoUrl);
                    if (this.lastVideoUrl === gameLog.videoUrl) {
                        break;
                    }
                    this.lastVideoUrl = gameLog.videoUrl;
                    this.addGameLogVideo(gameLog, location, userId);
                    break;
                case 'video-sync':
                    var timestamp = gameLog.timestamp.replace(/,/g, '');
                    if (this.nowPlaying.playing) {
                        this.nowPlaying.offset = parseInt(timestamp, 10);
                    }
                    break;
                case 'resource-load-string':
                case 'resource-load-image':
                    if (
                        !this.logResourceLoad ||
                        this.lastResourceloadUrl === gameLog.resourceUrl
                    ) {
                        break;
                    }
                    this.lastResourceloadUrl = gameLog.resourceUrl;
                    var entry = {
                        created_at: gameLog.dt,
                        type:
                            gameLog.type === 'resource-load-string'
                                ? 'StringLoad'
                                : 'ImageLoad',
                        resourceUrl: gameLog.resourceUrl,
                        location
                    };
                    database.addGamelogResourceLoadToDatabase(entry);
                    break;
                case 'screenshot':
                    // var entry = {
                    //     created_at: gameLog.dt,
                    //     type: 'Event',
                    //     data: `Screenshot Processed: ${gameLog.screenshotPath.replace(
                    //         /^.*[\\/]/,
                    //         ''
                    //     )}`
                    // };
                    // database.addGamelogEventToDatabase(entry);

                    this.processScreenshot(gameLog.screenshotPath);
                    break;
                case 'api-request':
                    // var userId = '';
                    // try {
                    //     var url = new URL(gameLog.url);
                    //     var urlParams = new URLSearchParams(gameLog.url);
                    //     if (url.pathname.substring(0, 13) === '/api/1/users/') {
                    //         var pathArray = url.pathname.split('/');
                    //         userId = pathArray[4];
                    //     } else if (urlParams.has('userId')) {
                    //         userId = urlParams.get('userId');
                    //     }
                    // } catch (err) {
                    //     console.error(err);
                    // }
                    // if (!userId) {
                    //     break;
                    // }

                    if (!$app.saveInstancePrints) {
                        break;
                    }
                    try {
                        var printId = '';
                        var url = new URL(gameLog.url);
                        if (
                            url.pathname.substring(0, 14) === '/api/1/prints/'
                        ) {
                            var pathArray = url.pathname.split('/');
                            printId = pathArray[4];
                        }
                        if (printId && printId.length === 41) {
                            $app.trySavePrintToFile(printId);
                        }
                    } catch (err) {
                        console.error(err);
                    }
                    break;
                case 'avatar-change':
                    var ref = this.lastLocation.playerList.get(userId);
                    if (
                        this.photonLoggingEnabled ||
                        typeof ref === 'undefined' ||
                        ref.lastAvatar === gameLog.avatarName
                    ) {
                        break;
                    }
                    if (!ref.lastAvatar) {
                        ref.lastAvatar = gameLog.avatarName;
                        this.lastLocation.playerList.set(userId, ref);
                        break;
                    }
                    ref.lastAvatar = gameLog.avatarName;
                    this.lastLocation.playerList.set(userId, ref);
                    var entry = {
                        created_at: gameLog.dt,
                        type: 'AvatarChange',
                        userId,
                        name: gameLog.avatarName,
                        displayName: gameLog.displayName
                    };
                    break;
                case 'vrcx':
                    // VideoPlay(PyPyDance) "https://jd.pypy.moe/api/v1/videos/jr1NX4Jo8GE.mp4",0.1001,239.606,"0905 : [J-POP] 【まなこ】金曜日のおはよう 踊ってみた (vernities)"
                    var type = gameLog.data.substr(
                        0,
                        gameLog.data.indexOf(' ')
                    );
                    if (type === 'VideoPlay(PyPyDance)') {
                        this.addGameLogPyPyDance(gameLog, location);
                    } else if (type === 'VideoPlay(VRDancing)') {
                        this.addGameLogVRDancing(gameLog, location);
                    } else if (type === 'VideoPlay(ZuwaZuwaDance)') {
                        this.addGameLogZuwaZuwaDance(gameLog, location);
                    } else if (type === 'LSMedia') {
                        this.addGameLogLSMedia(gameLog, location);
                    } else if (type === 'Movie&Chill') {
                        this.addGameLogMovieAndChill(gameLog, location);
                    }
                    break;
                case 'photon-id':
                    if (!this.isGameRunning || !this.friendLogInitStatus) {
                        break;
                    }
                    var photonId = parseInt(gameLog.photonId, 10);
                    var ref = this.photonLobby.get(photonId);
                    if (typeof ref === 'undefined') {
                        for (var ctx of API.cachedUsers.values()) {
                            if (ctx.displayName === gameLog.displayName) {
                                this.photonLobby.set(photonId, ctx);
                                this.photonLobbyCurrent.set(photonId, ctx);
                                break;
                            }
                        }
                        var ctx = {
                            displayName: gameLog.displayName
                        };
                        this.photonLobby.set(photonId, ctx);
                        this.photonLobbyCurrent.set(photonId, ctx);
                        this.getCurrentInstanceUserList();
                    }
                    break;
                case 'notification':
                    // var entry = {
                    //     created_at: gameLog.dt,
                    //     type: 'Notification',
                    //     data: gameLog.json
                    // };
                    break;
                case 'event':
                    var entry = {
                        created_at: gameLog.dt,
                        type: 'Event',
                        data: gameLog.event
                    };
                    database.addGamelogEventToDatabase(entry);
                    break;
                case 'vrc-quit':
                    if (!this.isGameRunning) {
                        break;
                    }
                    if (this.vrcQuitFix) {
                        var bias = Date.parse(gameLog.dt) + 3000;
                        if (bias < Date.now()) {
                            console.log(
                                'QuitFix: Bias too low, not killing VRC'
                            );
                            break;
                        }
                        AppApi.QuitGame().then((processCount) => {
                            if (processCount > 1) {
                                console.log(
                                    'QuitFix: More than 1 process running, not killing VRC'
                                );
                            } else if (processCount === 1) {
                                console.log('QuitFix: Killed VRC');
                            } else {
                                console.log(
                                    'QuitFix: Nothing to kill, no VRC process running'
                                );
                            }
                        });
                    }
                    break;
                case 'openvr-init':
                    this.isGameNoVR = false;
                    configRepository.setBool('isGameNoVR', this.isGameNoVR);
                    this.updateOpenVR();
                    break;
                case 'desktop-mode':
                    this.isGameNoVR = true;
                    configRepository.setBool('isGameNoVR', this.isGameNoVR);
                    this.updateOpenVR();
                    break;
                case 'udon-exception':
                    if (this.udonExceptionLogging) {
                        console.log('UdonException', gameLog.data);
                    }
                    // var entry = {
                    //     created_at: gameLog.dt,
                    //     type: 'Event',
                    //     data: gameLog.data
                    // };
                    // database.addGamelogEventToDatabase(entry);
                    break;
                case 'sticker-spawn':
                    if (!$app.saveInstanceStickers) {
                        break;
                    }

                    $app.trySaveStickerToFile(gameLog.displayName, gameLog.fileId);
                    break;
            }
            if (entry) {
                // add tag colour
                if (entry.userId) {
                    var tagRef = this.customUserTags.get(entry.userId);
                    if (typeof tagRef !== 'undefined') {
                        entry.tagColour = tagRef.colour;
                    }
                }
                this.queueGameLogNoty(entry);
                this.addGameLog(entry);
            }
        },

        addGameLog(entry) {
            this.gameLogSessionTable.push(entry);
            this.updateSharedFeed(false);
            if (entry.type === 'VideoPlay') {
                // event time can be before last gameLog entry
                this.updateSharedFeed(true);
            }
            if (
                entry.type === 'LocationDestination' ||
                entry.type === 'AvatarChange' ||
                entry.type === 'ChatBoxMessage' ||
                (entry.userId === API.currentUser.id &&
                    (entry.type === 'OnPlayerJoined' ||
                        entry.type === 'OnPlayerLeft'))
            ) {
                return;
            }
            if (
                this.gameLogTable.filter.length > 0 &&
                !this.gameLogTable.filter.includes(entry.type)
            ) {
                return;
            }
            if (!this.gameLogSearch(entry)) {
                return;
            }
            this.gameLogTable.data.push(entry);
            this.sweepGameLog();
            this.notifyMenu('gameLog');
        },

        async addGamelogLocationToDatabase(input) {
            var groupName = await this.getGroupName(input.location);
            var entry = {
                ...input,
                groupName
            };
            database.addGamelogLocationToDatabase(entry);
        },

        async addGameLogVideo(gameLog, location, userId) {
            var videoUrl = gameLog.videoUrl;
            var youtubeVideoId = '';
            var videoId = '';
            var videoName = '';
            var videoLength = '';
            var displayName = '';
            var videoPos = 8; // video loading delay
            if (typeof gameLog.displayName !== 'undefined') {
                displayName = gameLog.displayName;
            }
            if (typeof gameLog.videoPos !== 'undefined') {
                videoPos = gameLog.videoPos;
            }
            if (!this.isRpcWorld(location) || gameLog.videoId === 'YouTube') {
                // skip PyPyDance and VRDancing videos
                try {
                    var url = new URL(videoUrl);
                    if (
                        url.origin === 'https://t-ne.x0.to' ||
                        url.origin === 'https://nextnex.com' ||
                        url.origin === 'https://r.0cm.org'
                    ) {
                        url = new URL(url.searchParams.get('url'));
                    }
                    if (videoUrl.startsWith('https://u2b.cx/')) {
                        url = new URL(videoUrl.substring(15));
                    }
                    var id1 = url.pathname;
                    var id2 = url.searchParams.get('v');
                    if (id1 && id1.length === 12) {
                        // https://youtu.be/
                        youtubeVideoId = id1.substring(1, 12);
                    }
                    if (id1 && id1.length === 19) {
                        // https://www.youtube.com/shorts/
                        youtubeVideoId = id1.substring(8, 19);
                    }
                    if (id2 && id2.length === 11) {
                        // https://www.youtube.com/watch?v=
                        // https://music.youtube.com/watch?v=
                        youtubeVideoId = id2;
                    }
                    if (this.youTubeApi && youtubeVideoId) {
                        var data =
                            await this.lookupYouTubeVideo(youtubeVideoId);
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
                this.setNowPlaying(entry);
            }
        },

        addGameLogPyPyDance(gameLog, location) {
            var data =
                /VideoPlay\(PyPyDance\) "(.+?)",([\d.]+),([\d.]+),"(.*)"/g.exec(
                    gameLog.data
                );
            if (!data) {
                console.error('failed to parse', gameLog.data);
                return;
            }
            var videoUrl = data[1];
            var videoPos = Number(data[2]);
            var videoLength = Number(data[3]);
            var title = data[4];
            var bracketArray = title.split('(');
            var text1 = bracketArray.pop();
            var displayName = text1.slice(0, -1);
            var text2 = bracketArray.join('(');
            if (text2 === 'Custom URL') {
                var videoId = 'YouTube';
            } else {
                var videoId = text2.substr(0, text2.indexOf(':') - 1);
                text2 = text2.substr(text2.indexOf(':') + 2);
            }
            var videoName = text2.slice(0, -1);
            if (displayName === 'Random') {
                displayName = '';
            }
            if (videoUrl === this.nowPlaying.url) {
                var entry = {
                    created_at: gameLog.dt,
                    videoUrl,
                    videoLength,
                    videoPos
                };
                this.setNowPlaying(entry);
                return;
            }
            var userId = '';
            if (displayName) {
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
                this.addGameLogVideo(entry, location, userId);
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
                this.setNowPlaying(entry);
            }
        },

        addGameLogVRDancing(gameLog, location) {
            var data =
                /VideoPlay\(VRDancing\) "(.+?)",([\d.]+),([\d.]+),(-?[\d.]+),"(.+?)","(.+?)"/g.exec(
                    gameLog.data
                );
            if (!data) {
                console.error('failed to parse', gameLog.data);
                return;
            }
            var videoUrl = data[1];
            var videoPos = Number(data[2]);
            var videoLength = Number(data[3]);
            var videoId = Number(data[4]);
            var displayName = data[5];
            var videoName = data[6];
            if (videoId === -1) {
                videoId = 'YouTube';
            }
            if (parseInt(videoPos, 10) === parseInt(videoLength, 10)) {
                // ummm okay
                videoPos = 0;
            }
            if (videoUrl === this.nowPlaying.url) {
                var entry = {
                    created_at: gameLog.dt,
                    videoUrl,
                    videoLength,
                    videoPos
                };
                this.setNowPlaying(entry);
                return;
            }
            var userId = '';
            if (displayName) {
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
                this.addGameLogVideo(entry, location, userId);
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
                this.setNowPlaying(entry);
            }
        },

        addGameLogZuwaZuwaDance(gameLog, location) {
            var data =
                /VideoPlay\(ZuwaZuwaDance\) "(.+?)",([\d.]+),([\d.]+),(-?[\d.]+),"(.+?)","(.+?)"/g.exec(
                    gameLog.data
                );
            if (!data) {
                console.error('failed to parse', gameLog.data);
                return;
            }
            var videoUrl = data[1];
            var videoPos = Number(data[2]);
            var videoLength = Number(data[3]);
            var videoId = Number(data[4]);
            var displayName = data[5];
            var videoName = data[6];
            if (displayName === 'Random') {
                displayName = '';
            }
            if (videoId === 9999) {
                videoId = 'YouTube';
            }
            if (videoUrl === this.nowPlaying.url) {
                var entry = {
                    created_at: gameLog.dt,
                    videoUrl,
                    videoLength,
                    videoPos
                };
                this.setNowPlaying(entry);
                return;
            }
            var userId = '';
            if (displayName) {
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
                this.addGameLogVideo(entry, location, userId);
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
                this.setNowPlaying(entry);
            }
        },

        addGameLogLSMedia(gameLog, location) {
            // [VRCX] LSMedia 0,4268.981,Natsumi-sama,,
            // [VRCX] LSMedia 0,6298.292,Natsumi-sama,The Outfit (2022), 1080p
            var data = /LSMedia ([\d.]+),([\d.]+),(.+?),(.+?),(?=[^,]*$)/g.exec(
                gameLog.data
            );
            if (!data) {
                return;
            }
            var videoPos = Number(data[1]);
            var videoLength = Number(data[2]);
            var displayName = data[3];
            var videoName = this.replaceBioSymbols(data[4]);
            var videoUrl = videoName;
            var videoId = 'LSMedia';
            if (videoUrl === this.nowPlaying.url) {
                var entry = {
                    created_at: gameLog.dt,
                    videoUrl,
                    videoLength,
                    videoPos
                };
                this.setNowPlaying(entry);
                return;
            }
            var userId = '';
            if (displayName) {
                for (var ref of API.cachedUsers.values()) {
                    if (ref.displayName === displayName) {
                        userId = ref.id;
                        break;
                    }
                }
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
            this.setNowPlaying(entry);
        },

        addGameLogMovieAndChill(gameLog, location) {
            // [VRCX] Movie&Chill CurrentTime,Length,PlayerName,MovieName
            var data = /Movie&Chill ([\d.]+),([\d.]+),(.+?),(.*)/g.exec(
                gameLog.data
            );
            if (!data) {
                return;
            }
            var videoPos = Number(data[1]);
            var videoLength = Number(data[2]);
            var displayName = data[3];
            var videoName = data[4];
            var videoUrl = videoName;
            var videoId = 'Movie&Chill';
            if (!videoName) {
                return;
            }
            if (videoUrl === this.nowPlaying.url) {
                var entry = {
                    created_at: gameLog.dt,
                    videoUrl,
                    videoLength,
                    videoPos
                };
                this.setNowPlaying(entry);
                return;
            }
            var userId = '';
            if (displayName) {
                for (var ref of API.cachedUsers.values()) {
                    if (ref.displayName === displayName) {
                        userId = ref.id;
                        break;
                    }
                }
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
            this.setNowPlaying(entry);
        },

        async gameLogTableLookup() {
            await configRepository.setString(
                'VRCX_gameLogTableFilters',
                JSON.stringify(this.gameLogTable.filter)
            );
            this.gameLogTable.loading = true;
            this.gameLogTable.data = await database.lookupGameLogDatabase(
                this.gameLogTable.search,
                this.gameLogTable.filter
            );
            this.gameLogTable.loading = false;
        },

        sweepGameLog() {
            var { data } = this.gameLogTable;
            var j = data.length;
            if (j > this.maxTableSize) {
                data.splice(0, j - this.maxTableSize);
            }

            var date = new Date();
            date.setDate(date.getDate() - 1); // 24 hour limit
            var limit = date.toJSON();
            var i = 0;
            var k = this.gameLogSessionTable.length;
            while (i < k && this.gameLogSessionTable[i].created_at < limit) {
                ++i;
            }
            if (i === k) {
                this.gameLogSessionTable = [];
            } else if (i) {
                this.gameLogSessionTable.splice(0, i);
            }
        },

        // async resetGameLog() {
        //     await gameLogService.reset();
        //     this.gameLogTable.data = [];
        //     this.lastLocationReset();
        // },

        // async refreshEntireGameLog() {
        //     await gameLogService.setDateTill('1970-01-01');
        //     await database.initTables();
        //     await this.resetGameLog();
        //     var location = '';
        //     for (var gameLog of await gameLogService.getAll()) {
        //         if (gameLog.type === 'location') {
        //             location = gameLog.location;
        //         }
        //         this.addGameLogEntry(gameLog, location);
        //     }
        //     this.getGameLogTable();
        // },

        async getGameLogTable() {
            await database.initTables();
            this.gameLogSessionTable = await database.getGamelogDatabase();
            var dateTill = await database.getLastDateGameLogDatabase();
            this.updateGameLog(dateTill);
        },

        async updateGameLog(dateTill) {
            await gameLogService.setDateTill(dateTill);
            await gameLogService.reset();
            await new Promise((resolve) => {
                workerTimers.setTimeout(resolve, 10000);
            });
            var location = '';
            for (var gameLog of await gameLogService.getAll()) {
                if (gameLog.type === 'location') {
                    location = gameLog.location;
                }
                this.addGameLogEntry(gameLog, location);
            }
        },

        addGameLogEvent(json) {
            var rawLogs = JSON.parse(json);
            var gameLog = gameLogService.parseRawGameLog(
                rawLogs[1],
                rawLogs[2],
                rawLogs.slice(3)
            );
            if (
                this.debugGameLog &&
                gameLog.type !== 'photon-id' &&
                gameLog.type !== 'api-request' &&
                gameLog.type !== 'udon-exception'
            ) {
                console.log('gameLog:', gameLog);
            }
            this.addGameLogEntry(gameLog, this.lastLocation.location);
        },

        deleteGameLogEntryPrompt(row) {
            this.$confirm('Continue? Delete Log', 'Confirm', {
                confirmButtonText: 'Confirm',
                cancelButtonText: 'Cancel',
                type: 'info',
                callback: (action) => {
                    if (action === 'confirm') {
                        this.deleteGameLogEntry(row);
                    }
                }
            });
        },

        deleteGameLogEntry(row) {
            $app.removeFromArray(this.gameLogTable.data, row);
            database.deleteGameLogEntry(row);
            console.log(row);
            database.getGamelogDatabase().then((data) => {
                this.gameLogSessionTable = data;
                this.updateSharedFeed(true);
            });
        },

        gameLogSearch(row) {
            var value = this.gameLogTable.search.toUpperCase();
            if (!value) {
                return true;
            }
            if (
                value.startsWith('wrld_') &&
                String(row.location).toUpperCase().includes(value)
            ) {
                return true;
            }
            switch (row.type) {
                case 'Location':
                    if (String(row.worldName).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
                case 'OnPlayerJoined':
                    if (String(row.displayName).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
                case 'OnPlayerLeft':
                    if (String(row.displayName).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
                case 'PortalSpawn':
                    if (String(row.displayName).toUpperCase().includes(value)) {
                        return true;
                    }
                    if (String(row.worldName).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
                case 'Event':
                    if (String(row.data).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
                case 'External':
                    if (String(row.message).toUpperCase().includes(value)) {
                        return true;
                    }
                    if (String(row.displayName).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
                case 'VideoPlay':
                    if (String(row.displayName).toUpperCase().includes(value)) {
                        return true;
                    }
                    if (String(row.videoName).toUpperCase().includes(value)) {
                        return true;
                    }
                    if (String(row.videoUrl).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
                case 'StringLoad':
                case 'ImageLoad':
                    if (String(row.resourceUrl).toUpperCase().includes(value)) {
                        return true;
                    }
                    return false;
            }
            return true;
        },

        gameLogIsFriend(row) {
            if (typeof row.isFriend !== 'undefined') {
                return row.isFriend;
            }
            if (!row.userId) {
                return false;
            }
            row.isFriend = this.friends.has(row.userId);
            return row.isFriend;
        },

        gameLogIsFavorite(row) {
            if (typeof row.isFavorite !== 'undefined') {
                return row.isFavorite;
            }
            if (!row.userId) {
                return false;
            }
            row.isFavorite = this.localFavoriteFriends.has(row.userId);
            return row.isFavorite;
        },

        async disableGameLogDialog() {
            if (this.isGameRunning) {
                this.$message({
                    message:
                        'VRChat needs to be closed before this option can be changed',
                    type: 'error'
                });
                this.gameLogDisabled = !this.gameLogDisabled;
                return;
            }
            if (this.gameLogDisabled) {
                this.$confirm('Continue? Disable GameLog', 'Confirm', {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info',
                    callback: async (action) => {
                        if (action !== 'confirm') {
                            this.gameLogDisabled = !this.gameLogDisabled;
                            await configRepository.setBool(
                                'VRCX_gameLogDisabled',
                                this.gameLogDisabled
                            );
                        }
                    }
                });
            } else {
                await configRepository.setBool(
                    'VRCX_gameLogDisabled',
                    this.gameLogDisabled
                );
            }
        }
    };
}
