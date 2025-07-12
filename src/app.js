// Copyright(c) 2019-2025 pypy, Natsumi and individual contributors.
// All rights reserved.
//
// This work is licensed under the terms of the MIT license.
// For a copy, see <https://opensource.org/licenses/MIT>.

// #region | Imports
import '@fontsource/noto-sans-kr';
import '@fontsource/noto-sans-jp';
import '@fontsource/noto-sans-sc';
import '@fontsource/noto-sans-tc';
import '@infolektuell/noto-color-emoji';
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';
import isSameOrAfter from 'dayjs/plugin/isSameOrAfter';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import ElementUI from 'element-ui';
import Noty from 'noty';
import Vue from 'vue';
import { DataTables } from 'vue-data-tables';
import VueI18n from 'vue-i18n';
import { createI18n } from 'vue-i18n-bridge';
import VueLazyload from 'vue-lazyload';
import * as workerTimers from 'worker-timers';
import 'default-passive-events';
import {
    avatarModerationRequest,
    avatarRequest,
    favoriteRequest,
    friendRequest,
    groupRequest,
    imageRequest,
    instanceRequest,
    inventoryRequest,
    inviteMessagesRequest,
    miscRequest,
    notificationRequest,
    playerModerationRequest,
    userRequest,
    vrcPlusIconRequest,
    vrcPlusImageRequest,
    worldRequest
} from './api';

import pugTemplate from './app.pug';

// API classes
import _config from './classes/API/config.js';
import _apiInit from './classes/apiInit.js';
import _apiLogin from './classes/apiLogin.js';
import _apiRequestHandler from './classes/apiRequestHandler.js';
import _currentUser from './classes/currentUser.js';
import _discordRpc from './classes/discordRpc.js';
import _feed from './classes/feed.js';
import _gameLog from './classes/gameLog.js';
import _gameRealtimeLogging from './classes/gameRealtimeLogging.js';
import _groups from './classes/groups.js';
import _inventory from './classes/inventory.js';
import _languages from './classes/languages.js';
import _memos from './classes/memos.js';
import _prompts from './classes/prompts.js';
import _restoreFriendOrder from './classes/restoreFriendOrder.js';

// main app classes
import _sharedFeed from './classes/sharedFeed.js';
import _uiComponents from './classes/uiComponents.js';
import _updateLoop from './classes/updateLoop.js';

import { userNotes } from './classes/userNotes.js';
import $utils from './classes/utils.js';
import _vrcRegistry from './classes/vrcRegistry.js';
import _vrcxJsonStorage from './classes/vrcxJsonStorage.js';
import _vrcxNotifications from './classes/vrcxNotifications.js';
import _vrcxUpdater from './classes/vrcxUpdater.js';
import _websocket from './classes/websocket.js';
import AvatarDialog from './components/dialogs/AvatarDialog/AvatarDialog.vue';
import ChooseFavoriteGroupDialog from './components/dialogs/ChooseFavoriteGroupDialog.vue';
import FullscreenImageDialog from './components/dialogs/FullscreenImageDialog.vue';
import GalleryDialog from './components/dialogs/GalleryDialog.vue';
import GroupDialog from './components/dialogs/GroupDialog/GroupDialog.vue';
import InviteGroupDialog from './components/dialogs/InviteGroupDialog.vue';
import BanGroupDialog from './components/dialogs/BanGroupDialog.vue';
import LaunchDialog from './components/dialogs/LaunchDialog.vue';
import PreviousInstancesInfoDialog from './components/dialogs/PreviousInstancesDialog/PreviousInstancesInfoDialog.vue';

import SafeDialog from './components/dialogs/SafeDialog.vue';
import UserDialog from './components/dialogs/UserDialog/UserDialog.vue';
import VRCXUpdateDialog from './components/dialogs/VRCXUpdateDialog.vue';

// dialogs
import WorldDialog from './components/dialogs/WorldDialog/WorldDialog.vue';
import Location from './components/Location.vue';
import NavMenu from './components/NavMenu.vue';

// components
import SimpleSwitch from './components/SimpleSwitch.vue';
import {
    compareUnityVersion,
    getPlatformInfo,
    storeAvatarImage
} from './composables/avatar/utils';

import { hasGroupPermission } from './composables/group/utils';

import {
    displayLocation,
    isRealInstance,
    parseLocation
} from './composables/instance/utils';
import {
    _utils,
    checkVRChatCache,
    convertFileUrlToImageUrl,
    deleteVRChatCache,
    extractFileId,
    extractFileVersion,
    getAvailablePlatforms
} from './composables/shared/utils';
import { userDialogGroupSortingOptions } from './composables/user/constants/userDialogGroupSortingOptions';
import {
    getPrintFileName,
    getPrintLocalDate,
    getEmojiFileName,
    languageClass
} from './composables/user/utils';
import InteropApi from './ipc-electron/interopApi.js';
import * as localizedStrings from './localization/localizedStrings.js';

// util classes
import configRepository from './service/config.js';
import removeConfusables, { removeWhitespace } from './service/confusables.js';
import database from './service/database.js';
import security from './service/security.js';
import webApiService from './service/webapi.js';
import ChartsTab from './views/Charts/Charts.vue';
import AvatarImportDialog from './views/Favorites/dialogs/AvatarImportDialog.vue';
import FriendImportDialog from './views/Favorites/dialogs/FriendImportDialog.vue';
import WorldImportDialog from './views/Favorites/dialogs/WorldImportDialog.vue';
import FavoritesTab from './views/Favorites/Favorites.vue';
import FeedTab from './views/Feed/Feed.vue';
import FriendListTab from './views/FriendList/FriendList.vue';
import FriendLogTab from './views/FriendLog/FriendLog.vue';
import GameLogTab from './views/GameLog/GameLog.vue';

import LoginPage from './views/Login/Login.vue';

// tabs
import ModerationTab from './views/Moderation/Moderation.vue';
import NotificationTab from './views/Notifications/Notification.vue';
import ChatboxBlacklistDialog from './views/PlayerList/dialogs/ChatboxBlacklistDialog.vue';
import PlayerListTab from './views/PlayerList/PlayerList.vue';
import DiscordNamesDialog from './views/Profile/dialogs/DiscordNamesDialog.vue';
import EditInviteMessageDialog from './views/Profile/dialogs/EditInviteMessageDialog.vue';
import ExportAvatarsListDialog from './views/Profile/dialogs/ExportAvatarsListDialog.vue';
import ExportFriendsListDialog from './views/Profile/dialogs/ExportFriendsListDialog.vue';
import ProfileTab from './views/Profile/Profile.vue';
import SearchTab from './views/Search/Search.vue';
import AvatarProviderDialog from './views/Settings/dialogs/AvatarProviderDialog.vue';
import ChangelogDialog from './views/Settings/dialogs/ChangelogDialog.vue';
import FeedFiltersDialog from './views/Settings/dialogs/FeedFiltersDialog.vue';
import LaunchOptionsDialog from './views/Settings/dialogs/LaunchOptionsDialog.vue';
import NoteExportDialog from './views/Settings/dialogs/NoteExportDialog.vue';
import NotificationPositionDialog from './views/Settings/dialogs/NotificationPositionDialog.vue';
import OpenSourceSoftwareNoticeDialog from './views/Settings/dialogs/OpenSourceSoftwareNoticeDialog.vue';
import PrimaryPasswordDialog from './views/Settings/dialogs/PrimaryPasswordDialog.vue';
import RegistryBackupDialog from './views/Settings/dialogs/RegistryBackupDialog.vue';
import ScreenshotMetadataDialog from './views/Settings/dialogs/ScreenshotMetadataDialog.vue';
import VRChatConfigDialog from './views/Settings/dialogs/VRChatConfigDialog.vue';
import YouTubeApiDialog from './views/Settings/dialogs/YouTubeApiDialog.vue';
import SideBar from './views/SideBar/SideBar.vue';

// #endregion

// some workaround for failing to get voice list first run
speechSynthesis.getVoices();

console.log(`isLinux: ${LINUX}`);

// #region | Hey look it's most of VRCX!
(async function () {
    // #region | Init Cef C# bindings
    if (WINDOWS) {
        await CefSharp.BindObjectAsync(
            'AppApi',
            'WebApi',
            'SharedVariable',
            'VRCXStorage',
            'SQLite',
            'LogWatcher',
            'Discord',
            'AssetBundleManager'
        );
    } else {
        window.AppApi = InteropApi.AppApiElectron;
        window.WebApi = InteropApi.WebApi;
        window.SharedVariable = InteropApi.SharedVariable;
        window.VRCXStorage = InteropApi.VRCXStorage;
        window.SQLite = InteropApi.SQLiteLegacy;
        window.LogWatcher = InteropApi.LogWatcher;
        window.Discord = InteropApi.Discord;
        window.AssetBundleManager = InteropApi.AssetBundleManager;
    }

    // #region | localization
    Vue.use(VueI18n, { bridge: true });
    const i18n = createI18n(
        {
            locale: 'en',
            fallbackLocale: 'en',
            messages: localizedStrings,
            legacy: false,
            globalInjection: true,
            missingWarn: false,
            warnHtmlMessage: false,
            fallbackWarn: false
        },
        VueI18n
    );
    const $t = i18n.global.t;
    Vue.use(i18n);
    Vue.use(ElementUI, {
        i18n: (key, value) => i18n.global.t(key, value)
    });
    // #endregion

    // everything in this program is global stored in $app, I hate it, it is what it is
    let $app = {};
    const API = new _apiInit($app);
    const vrcxJsonStorage = new _vrcxJsonStorage(VRCXStorage);

    let vrcxClasses = {
        // other classes
        API,
        apiRequestHandler: new _apiRequestHandler($app, API, $t, webApiService),
        uiComponents: new _uiComponents($app, API, $t),
        webSocket: new _websocket($app, API, $t),
        // main classes
        sharedFeed: new _sharedFeed($app, API, $t),
        prompts: new _prompts($app, API, $t),
        vrcxNotifications: new _vrcxNotifications($app, API, $t),
        apiLogin: new _apiLogin($app, API, $t, webApiService),
        currentUser: new _currentUser($app, API, $t),
        updateLoop: new _updateLoop($app, API, $t),
        discordRpc: new _discordRpc($app, API, $t),
        vrcxUpdater: new _vrcxUpdater($app, API, $t),
        gameLog: new _gameLog($app, API, $t),
        gameRealtimeLogging: new _gameRealtimeLogging($app, API, $t),
        feed: new _feed($app, API, $t),
        memos: new _memos($app, API, $t),
        config: new _config($app, API, $t),
        languages: new _languages($app, API, $t),
        groups: new _groups($app, API, $t),
        vrcRegistry: new _vrcRegistry($app, API, $t),
        restoreFriendOrder: new _restoreFriendOrder($app, API, $t),
        inventory: new _inventory($app, API, $t)
    };

    await configRepository.init();

    const app = {
        template: pugTemplate,
        data: {
            API,
            isGameRunning: false,
            isGameNoVR: true,
            isSteamVRRunning: false,
            isHmdAfk: false,
            isRunningUnderWine: false,
            appVersion: '',
            latestAppVersion: '',
            shiftHeld: false
        },
        i18n,
        computed: {},
        methods: {
            ...$utils
        },
        watch: {},
        components: {
            LoginPage,
            // tabs
            ModerationTab,
            ChartsTab,
            FriendListTab,
            FavoritesTab,
            NotificationTab,
            SearchTab,
            // - others
            SideBar,
            NavMenu,
            FriendLogTab,
            GameLogTab,
            FeedTab,
            ProfileTab,
            PlayerListTab,

            // components
            // - common
            Location,

            // - settings
            SimpleSwitch,

            // - dialogs
            //  - previous instances
            PreviousInstancesInfoDialog,
            UserDialog,
            //  - world
            WorldDialog,
            //  - group
            GroupDialog,
            InviteGroupDialog,
            BanGroupDialog,
            //  - avatar
            AvatarDialog,
            //  - favorites
            FriendImportDialog,
            WorldImportDialog,
            AvatarImportDialog,
            //  - favorites dialog
            ChooseFavoriteGroupDialog,
            ExportFriendsListDialog,
            ExportAvatarsListDialog,
            //  - launch
            LaunchDialog,
            //  - player list
            ChatboxBlacklistDialog,
            //  - profile
            DiscordNamesDialog,
            //  - settings
            FeedFiltersDialog,
            LaunchOptionsDialog,
            OpenSourceSoftwareNoticeDialog,
            ChangelogDialog,
            VRCXUpdateDialog,
            ScreenshotMetadataDialog,
            EditInviteMessageDialog,
            NoteExportDialog,
            VRChatConfigDialog,
            YouTubeApiDialog,
            NotificationPositionDialog,
            AvatarProviderDialog,
            RegistryBackupDialog,
            PrimaryPasswordDialog,
            FullscreenImageDialog,
            GalleryDialog
        },
        provide() {
            return {
                API,
                friends: this.friends,
                showUserDialog: this.showUserDialog,
                adjustDialogZ: this.adjustDialogZ,
                getWorldName: this.getWorldName,
                userImage: this.userImage,
                userStatusClass: this.userStatusClass,
                getGroupName: this.getGroupName,
                userImageFull: this.userImageFull,
                showFullscreenImageDialog: this.showFullscreenImageDialog,
                statusClass: this.statusClass,
                openExternalLink: this.openExternalLink,
                showWorldDialog: this.showWorldDialog,
                showAvatarDialog: this.showAvatarDialog,
                showPreviousInstancesInfoDialog:
                    this.showPreviousInstancesInfoDialog,
                showLaunchDialog: this.showLaunchDialog,
                showFavoriteDialog: this.showFavoriteDialog,
                displayPreviousImages: this.displayPreviousImages,
                languageClass: this.languageClass,
                showGroupDialog: this.showGroupDialog,
                showGallerySelectDialog: this.showGallerySelectDialog,
                showGalleryDialog: this.showGalleryDialog,
                getImageUrlFromImageId: this.getImageUrlFromImageId,
                getAvatarGallery: this.getAvatarGallery,
                inviteImageUpload: this.inviteImageUpload,
                clearInviteImageUpload: this.clearInviteImageUpload,
                isLinux: this.isLinux,
                openFolderGeneric: this.openFolderGeneric,
                deleteVRChatCache: this.deleteVRChatCache
            };
        },
        el: '#root',
        beforeMount() {
            this.changeThemeMode();
        },
        async mounted() {
            await this.initLanguage();
            try {
                this.isRunningUnderWine = await AppApi.IsRunningUnderWine();
            } catch (err) {
                console.error(err);
            }
            await AppApi.SetUserAgent();
            await this.loadVrcxId();
            this.appVersion = await AppApi.GetVersion();
            await this.compareAppVersion();
            await this.setBranch();
            if (this.autoUpdateVRCX !== 'Off') {
                this.checkForVRCXUpdate();
            }
            await AppApi.CheckGameRunning();
            this.isGameNoVR = await configRepository.getBool('isGameNoVR');
            await AppApi.SetAppLauncherSettings(
                this.enableAppLauncher,
                this.enableAppLauncherAutoClose
            );
            API.$on('SHOW_WORLD_DIALOG_SHORTNAME', (tag) =>
                this.verifyShortName('', tag)
            );
            this.updateLoop();
            this.getGameLogTable();
            this.refreshCustomCss();
            this.refreshCustomScript();
            this.checkVRChatDebugLogging();
            this.checkAutoBackupRestoreVrcRegistry();
            await this.migrateStoredUsers();
            this.loginForm.savedCredentials =
                (await configRepository.getString('savedCredentials')) !== null
                    ? JSON.parse(
                          await configRepository.getString('savedCredentials')
                      )
                    : {};
            this.loginForm.lastUserLoggedIn =
                await configRepository.getString('lastUserLoggedIn');
            this.$nextTick(async function () {
                this.$el.style.display = '';
                if (
                    !this.enablePrimaryPassword &&
                    (await configRepository.getString('lastUserLoggedIn')) !==
                        null
                ) {
                    var user =
                        this.loginForm.savedCredentials[
                            this.loginForm.lastUserLoggedIn
                        ];
                    if (user?.loginParmas?.endpoint) {
                        API.endpointDomain = user.loginParmas.endpoint;
                        API.websocketDomain = user.loginParmas.websocket;
                    }
                    // login at startup
                    this.loginForm.loading = true;
                    API.getConfig()
                        .catch((err) => {
                            this.loginForm.loading = false;
                            throw err;
                        })
                        .then((args) => {
                            API.getCurrentUser()
                                .finally(() => {
                                    this.loginForm.loading = false;
                                })
                                .catch((err) => {
                                    this.nextCurrentUserRefresh = 60; // 1min
                                    console.error(err);
                                });
                            return args;
                        });
                } else {
                    this.loginForm.loading = false;
                }
            });
            if (LINUX) {
                setTimeout(() => {
                    this.updateTTSVoices();
                }, 5000);
            }
        }
    };
    for (let value of Object.values(vrcxClasses)) {
        app.methods = { ...app.methods, ...value._methods };
        app.data = { ...app.data, ...value._data };
    }
    app.methods = { ...app.methods, ..._utils };
    Object.assign($app, app);

    // #endregion
    // #region | Init: drop/keyup event listeners
    // Make sure file drops outside of the screenshot manager don't navigate to the file path dropped.
    // This issue persists on prompts created with prompt(), unfortunately. Not sure how to fix that.
    document.body.addEventListener('drop', function (e) {
        e.preventDefault();
    });

    document.addEventListener('keydown', function (e) {
        if (e.shiftKey) {
            $app.shiftHeld = true;
        }
    });

    document.addEventListener('keyup', function (e) {
        if (e.ctrlKey) {
            if (e.key === 'I') {
                $app.showConsole();
            } else if (e.key === 'r') {
                location.reload();
            }
        } else if (e.altKey && e.key === 'R') {
            $app.refreshCustomCss();
        }

        if (!e.shiftKey) {
            $app.shiftHeld = false;
        }
    });

    addEventListener('wheel', (event) => {
        if (event.ctrlKey) {
            $app.getZoomLevel();
        }
    });

    // #endregion

    // #region | Init: Noty, Vue, Vue-Markdown, ElementUI, VueI18n, VueLazyLoad, Vue filters, dark stylesheet, dayjs

    Noty.overrideDefaults({
        animation: {
            open: 'animate__animated animate__bounceInLeft',
            close: 'animate__animated animate__bounceOutLeft'
        },
        layout: 'bottomLeft',
        theme: 'mint',
        timeout: 6000
    });

    Vue.filter('commaNumber', $utils.commaNumber);
    Vue.filter('textToHex', $utils.textToHex);

    Vue.use(VueLazyload, {
        preLoad: 1,
        observer: true,
        observerOptions: {
            rootMargin: '0px',
            threshold: 0
        },
        attempt: 3
    });

    Vue.use(DataTables);

    Vue.component('safe-dialog', SafeDialog);

    dayjs.extend(duration);
    dayjs.extend(utc);
    dayjs.extend(timezone);
    dayjs.extend(isSameOrAfter);

    // #endregion

    // #endregion
    // #region | API: This is NOT all the api functions, not even close :(

    // #region | API: User

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

    API.cachedUsers = new Map();
    API.currentTravelers = new Map();

    API.$on('USER:CURRENT:SAVE', function (args) {
        this.$emit('USER:CURRENT', args);
    });

    API.$on('USER', function (args) {
        if (!args?.json?.id) {
            console.error('API.$on(USER) invalid args', args);
            return;
        }
        if (args.json.state === 'online') {
            args.ref = this.applyUser(args.json); // GPS
            $app.updateFriend({ id: args.json.id, state: args.json.state }); // online/offline
        } else {
            $app.updateFriend({ id: args.json.id, state: args.json.state }); // online/offline
            args.ref = this.applyUser(args.json); // GPS
        }
    });

    API.$on('USER:LIST', function (args) {
        for (var json of args.json) {
            if (!json.displayName) {
                console.error('getUsers gave us garbage', json);
                continue;
            }
            this.$emit('USER', {
                json,
                params: {
                    userId: json.id
                }
            });
        }
    });

    API.applyUserTrustLevel = function (ref) {
        ref.$isModerator = ref.developerType && ref.developerType !== 'none';
        ref.$isTroll = false;
        ref.$isProbableTroll = false;
        var trustColor = '';
        var { tags } = ref;
        if (tags.includes('admin_moderator')) {
            ref.$isModerator = true;
        }
        if (tags.includes('system_troll')) {
            ref.$isTroll = true;
        }
        if (tags.includes('system_probable_troll') && !ref.$isTroll) {
            ref.$isProbableTroll = true;
        }
        if (tags.includes('system_trust_veteran')) {
            ref.$trustLevel = 'Trusted User';
            ref.$trustClass = 'x-tag-veteran';
            trustColor = 'veteran';
            ref.$trustSortNum = 5;
        } else if (tags.includes('system_trust_trusted')) {
            ref.$trustLevel = 'Known User';
            ref.$trustClass = 'x-tag-trusted';
            trustColor = 'trusted';
            ref.$trustSortNum = 4;
        } else if (tags.includes('system_trust_known')) {
            ref.$trustLevel = 'User';
            ref.$trustClass = 'x-tag-known';
            trustColor = 'known';
            ref.$trustSortNum = 3;
        } else if (tags.includes('system_trust_basic')) {
            ref.$trustLevel = 'New User';
            ref.$trustClass = 'x-tag-basic';
            trustColor = 'basic';
            ref.$trustSortNum = 2;
        } else {
            ref.$trustLevel = 'Visitor';
            ref.$trustClass = 'x-tag-untrusted';
            trustColor = 'untrusted';
            ref.$trustSortNum = 1;
        }
        if (ref.$isTroll || ref.$isProbableTroll) {
            trustColor = 'troll';
            ref.$trustSortNum += 0.1;
        }
        if (ref.$isModerator) {
            trustColor = 'vip';
            ref.$trustSortNum += 0.3;
        }
        if ($app.randomUserColours && $app.friendLogInitStatus) {
            if (!ref.$userColour) {
                $app.getNameColour(ref.id).then((colour) => {
                    ref.$userColour = colour;
                });
            }
        } else {
            ref.$userColour = $app.trustColor[trustColor];
        }
    };

    API.applyUserLanguage = function (ref) {
        if (!ref || !ref.tags || !$app.subsetOfLanguages) {
            return;
        }

        ref.$languages = [];
        const languagePrefix = 'language_';
        const prefixLength = languagePrefix.length;

        for (const tag of ref.tags) {
            if (tag.startsWith(languagePrefix)) {
                const key = tag.substring(prefixLength);
                const value = $app.subsetOfLanguages[key];

                if (value !== undefined) {
                    ref.$languages.push({ key, value });
                }
            }
        }
    };

    API.applyPresenceLocation = function (ref) {
        var presence = ref.presence;
        if (isRealInstance(presence.world)) {
            ref.$locationTag = `${presence.world}:${presence.instance}`;
        } else {
            ref.$locationTag = presence.world;
        }
        if (isRealInstance(presence.travelingToWorld)) {
            ref.$travelingToLocation = `${presence.travelingToWorld}:${presence.travelingToInstance}`;
        } else {
            ref.$travelingToLocation = presence.travelingToWorld;
        }
        $app.updateCurrentUserLocation();
    };

    API.applyPresenceGroups = function (ref) {
        if (!this.currentUserGroupsInit) {
            // wait for init before diffing
            return;
        }
        var groups = ref.presence?.groups;
        if (!groups) {
            console.error('API.applyPresenceGroups: invalid groups', ref);
            return;
        }
        if (groups.length === 0) {
            // as it turns out, this is not the most trust worthly source of info
            return;
        }

        // update group list
        for (var groupId of groups) {
            if (!this.currentUserGroups.has(groupId)) {
                $app.onGroupJoined(groupId);
            }
        }
        for (var groupId of this.currentUserGroups.keys()) {
            if (!groups.includes(groupId)) {
                $app.onGroupLeft(groupId);
            }
        }
    };

    API.applyUser = function (json) {
        var ref = this.cachedUsers.get(json.id);
        if (json.statusDescription) {
            json.statusDescription = $utils.replaceBioSymbols(
                json.statusDescription
            );
            json.statusDescription = $app.removeEmojis(json.statusDescription);
        }
        if (json.bio) {
            json.bio = $utils.replaceBioSymbols(json.bio);
        }
        if (json.note) {
            json.note = $utils.replaceBioSymbols(json.note);
        }
        if (json.currentAvatarImageUrl === $app.robotUrl) {
            delete json.currentAvatarImageUrl;
            delete json.currentAvatarThumbnailImageUrl;
        }
        if (typeof ref === 'undefined') {
            ref = {
                ageVerificationStatus: '',
                ageVerified: false,
                allowAvatarCopying: false,
                badges: [],
                bio: '',
                bioLinks: [],
                currentAvatarImageUrl: '',
                currentAvatarTags: [],
                currentAvatarThumbnailImageUrl: '',
                date_joined: '',
                developerType: '',
                displayName: '',
                friendKey: '',
                friendRequestStatus: '',
                id: '',
                instanceId: '',
                isFriend: false,
                last_activity: '',
                last_login: '',
                last_mobile: null,
                last_platform: '',
                location: '',
                platform: '',
                note: null, // keep as null, to detect deleted notes
                profilePicOverride: '',
                profilePicOverrideThumbnail: '',
                pronouns: '',
                state: '',
                status: '',
                statusDescription: '',
                tags: [],
                travelingToInstance: '',
                travelingToLocation: '',
                travelingToWorld: '',
                userIcon: '',
                worldId: '',
                // only in bulk request
                fallbackAvatar: '',
                // VRCX
                $location: {},
                $location_at: Date.now(),
                $online_for: Date.now(),
                $travelingToTime: Date.now(),
                $offline_for: '',
                $active_for: Date.now(),
                $isVRCPlus: false,
                $isModerator: false,
                $isTroll: false,
                $isProbableTroll: false,
                $trustLevel: 'Visitor',
                $trustClass: 'x-tag-untrusted',
                $userColour: '',
                $trustSortNum: 1,
                $languages: [],
                $joinCount: 0,
                $timeSpent: 0,
                $lastSeen: '',
                $nickName: '',
                $previousLocation: '',
                $customTag: '',
                $customTagColour: '',
                $friendNumber: 0,
                //
                ...json
            };
            if ($app.lastLocation.playerList.has(json.id)) {
                // update $location_at from instance join time
                var player = $app.lastLocation.playerList.get(json.id);
                ref.$location_at = player.joinTime;
                ref.$online_for = player.joinTime;
            }
            if (ref.location === 'traveling') {
                ref.$location = parseLocation(ref.travelingToLocation);
                if (
                    !this.currentTravelers.has(ref.id) &&
                    ref.travelingToLocation
                ) {
                    var travelRef = {
                        created_at: new Date().toJSON(),
                        ...ref
                    };
                    this.currentTravelers.set(ref.id, travelRef);
                    $app.sharedFeed.pendingUpdate = true;
                    $app.updateSharedFeed(false);
                    $app.onPlayerTraveling(travelRef);
                }
            } else {
                ref.$location = parseLocation(ref.location);
                if (this.currentTravelers.has(ref.id)) {
                    this.currentTravelers.delete(ref.id);
                    $app.sharedFeed.pendingUpdate = true;
                    $app.updateSharedFeed(false);
                }
            }
            if (ref.isFriend || ref.id === this.currentUser.id) {
                // update instancePlayerCount
                var newCount = $app.instancePlayerCount.get(ref.location);
                if (typeof newCount === 'undefined') {
                    newCount = 0;
                }
                newCount++;
                $app.instancePlayerCount.set(ref.location, newCount);
            }
            if ($app.customUserTags.has(json.id)) {
                var tag = $app.customUserTags.get(json.id);
                ref.$customTag = tag.tag;
                ref.$customTagColour = tag.colour;
            } else if (ref.$customTag) {
                ref.$customTag = '';
                ref.$customTagColour = '';
            }
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
            ref.$isVRCPlus = ref.tags.includes('system_supporter');
            this.applyUserTrustLevel(ref);
            this.applyUserLanguage(ref);
            // traveling
            if (ref.location === 'traveling') {
                ref.$location = parseLocation(ref.travelingToLocation);
                if (!this.currentTravelers.has(ref.id)) {
                    var travelRef = {
                        created_at: new Date().toJSON(),
                        ...ref
                    };
                    this.currentTravelers.set(ref.id, travelRef);
                    $app.sharedFeed.pendingUpdate = true;
                    $app.updateSharedFeed(false);
                    $app.onPlayerTraveling(travelRef);
                }
            } else {
                ref.$location = parseLocation(ref.location);
                if (this.currentTravelers.has(ref.id)) {
                    this.currentTravelers.delete(ref.id);
                    $app.sharedFeed.pendingUpdate = true;
                    $app.updateSharedFeed(false);
                }
            }
            for (var prop in ref) {
                if (Array.isArray(ref[prop]) && Array.isArray($ref[prop])) {
                    if (!$app.arraysMatch(ref[prop], $ref[prop])) {
                        props[prop] = true;
                    }
                } else if (ref[prop] !== Object(ref[prop])) {
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
            if ($ref.note !== null && $ref.note !== ref.note) {
                userNotes.checkNote(ref.id, ref.note);
            }
            // FIXME
            // if the status is offline, just ignore status and statusDescription only.
            if (has && ref.status !== 'offline' && $ref.status !== 'offline') {
                if (props.location && props.location[0] !== 'traveling') {
                    var ts = Date.now();
                    props.location.push(ts - ref.$location_at);
                    ref.$location_at = ts;
                }
                API.$emit('USER:UPDATE', {
                    ref,
                    props
                });
                if ($app.debugUserDiff) {
                    delete props.last_login;
                    delete props.last_activity;
                    if (Object.keys(props).length !== 0) {
                        console.log('>', ref.displayName, props);
                    }
                }
            }
        }
        if (
            ref.$isVRCPlus &&
            ref.badges &&
            ref.badges.every(
                (x) => x.badgeId !== 'bdg_754f9935-0f97-49d8-b857-95afb9b673fa'
            )
        ) {
            // I doubt this will last long
            ref.badges.unshift({
                badgeId: 'bdg_754f9935-0f97-49d8-b857-95afb9b673fa',
                badgeName: 'Supporter',
                badgeDescription: 'Supports VRChat through VRC+',
                badgeImageUrl:
                    'https://assets.vrchat.com/badges/fa/bdgai_8c9cf371-ffd2-4177-9894-1093e2e34bf7.png',
                hidden: true,
                showcased: false
            });
        }
        var friendCtx = $app.friends.get(ref.id);
        if (friendCtx) {
            friendCtx.ref = ref;
            friendCtx.name = ref.displayName;
        }
        if (ref.id === this.currentUser.id) {
            if (ref.status) {
                this.currentUser.status = ref.status;
            }
            $app.updateCurrentUserLocation();
        }
        this.$emit('USER:APPLY', ref);
        return ref;
    };

    // #endregion
    // #region | API: World

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
            $app.userDialog.worlds = array;
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

    API.getUserApiCurrentLocation = function () {
        return this.currentUser?.presence?.world;
    };

    API.actuallyGetCurrentLocation = async function () {
        let gameLogLocation = $app.lastLocation.location;
        if (gameLogLocation.startsWith('local')) {
            console.warn('PWI: local test mode', 'test_world');
            return 'test_world';
        }
        if (gameLogLocation === 'traveling') {
            gameLogLocation = $app.lastLocationDestination;
        }

        let presenceLocation = this.currentUser.$locationTag;
        if (presenceLocation === 'traveling') {
            presenceLocation = this.currentUser.$travelingToLocation;
        }

        // We want to use presence if it's valid to avoid extra API calls, but its prone to being outdated when this function is called.
        // So we check if the presence location is the same as the gameLog location; If it is, the presence is (probably) valid and we can use it.
        // If it's not, we need to get the user manually to get the correct location.
        // If the user happens to be offline or the api is just being dumb, we assume that the user logged into VRCX is different than the one in-game and return the gameLog location.
        // This is really dumb.
        if (presenceLocation === gameLogLocation) {
            const L = parseLocation(presenceLocation);
            return L.worldId;
        }

        const args = await userRequest.getUser({ userId: this.currentUser.id });
        const user = args.json;
        let userLocation = user.location;
        if (userLocation === 'traveling') {
            userLocation = user.travelingToLocation;
        }
        console.warn(
            "PWI: location didn't match, fetched user location",
            userLocation
        );

        if (isRealInstance(userLocation)) {
            console.warn('PWI: returning user location', userLocation);
            const L = parseLocation(userLocation);
            return L.worldId;
        }

        if (isRealInstance(gameLogLocation)) {
            console.warn(`PWI: returning gamelog location: `, gameLogLocation);
            const L = parseLocation(gameLogLocation);
            return L.worldId;
        }

        console.error(
            `PWI: all locations invalid: `,
            gameLogLocation,
            userLocation
        );
        return 'test_world';
    };

    API.applyWorld = function (json) {
        var ref = this.cachedWorlds.get(json.id);
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                name: '',
                description: '',
                defaultContentSettings: {},
                authorId: '',
                authorName: '',
                capacity: 0,
                recommendedCapacity: 0,
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
                featured: false,
                organization: '',
                previewYoutubeId: '',
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
        ref.name = $utils.replaceBioSymbols(ref.name);
        ref.description = $utils.replaceBioSymbols(ref.description);
        return ref;
    };

    // #endregion
    // #region | API: Instance

    API.cachedInstances = new Map();

    API.applyInstance = function (json) {
        var ref = this.cachedInstances.get(json.id);
        if (typeof ref === 'undefined') {
            ref = {
                id: '',
                location: '',
                instanceId: '',
                name: '',
                worldId: '',
                type: '',
                ownerId: '',
                tags: [],
                active: false,
                full: false,
                n_users: 0,
                hasCapacityForYou: true, // not present depending on endpoint
                capacity: 0,
                recommendedCapacity: 0,
                userCount: 0,
                queueEnabled: false, // only present with group instance type
                queueSize: 0, // only present when queuing is enabled
                platforms: {},
                gameServerVersion: 0,
                hardClose: null, // boolean or null
                closedAt: null, // string or null
                secureName: '',
                shortName: '',
                world: {},
                users: [], // only present when you're the owner
                clientNumber: '',
                contentSettings: {},
                photonRegion: '',
                region: '',
                canRequestInvite: false,
                permanent: false,
                private: '', // part of instance tag
                hidden: '', // part of instance tag
                nonce: '', // only present when you're the owner
                strict: false, // deprecated
                displayName: null,
                groupAccessType: null, // only present with group instance type
                roleRestricted: false, // only present with group instance type
                instancePersistenceEnabled: null,
                playerPersistenceEnabled: null,
                ageGate: null,
                // VRCX
                $fetchedAt: '',
                $disabledContentSettings: [],
                ...json
            };
            this.cachedInstances.set(ref.id, ref);
        } else {
            Object.assign(ref, json);
        }
        ref.$location = parseLocation(ref.location);
        if (json.world?.id) {
            worldRequest
                .getCachedWorld({
                    worldId: json.world.id
                })
                .then((args) => {
                    ref.world = args.ref;
                    return args;
                });
        }
        if (!json.$fetchedAt) {
            ref.$fetchedAt = new Date().toJSON();
        }
        ref.$disabledContentSettings = [];
        if (json.contentSettings && Object.keys(json.contentSettings).length) {
            for (var setting of $app.instanceContentSettings) {
                if (
                    typeof json.contentSettings[setting] === 'undefined' ||
                    json.contentSettings[setting] === true
                ) {
                    continue;
                }
                ref.$disabledContentSettings.push(setting);
            }
        }
        return ref;
    };

    API.$on('INSTANCE', function (args) {
        var { json } = args;
        if (!json) {
            return;
        }
        args.ref = this.applyInstance(args.json);
    });

    API.$on('INSTANCE', function (args) {
        if (!args.json?.id) {
            return;
        }
        if (
            $app.userDialog.visible &&
            $app.userDialog.ref.$location.tag === args.json.id
        ) {
            $app.applyUserDialogLocation();
        }
        if (
            $app.worldDialog.visible &&
            $app.worldDialog.id === args.json.worldId
        ) {
            $app.applyWorldDialogInstances();
        }
        if (
            $app.groupDialog.visible &&
            $app.groupDialog.id === args.json.ownerId
        ) {
            $app.applyGroupDialogInstances();
        }

        // FIXME:
        // because use $refs to update data, can not trigger vue's reactivity system, so view will not update
        // will fix this when refactor the core code, maybe
        // old comment: hacky workaround to force update instance info
        $app.updateInstanceInfo++;
    });

    // #endregion
    // #region | API: Friend

    API.$on('FRIEND:LIST', function (args) {
        for (var json of args.json) {
            if (!json.displayName) {
                console.error('/friends gave us garbage', json);
                continue;
            }
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
        try {
            var onlineFriends = await this.bulkRefreshFriends({
                offline: false
            });
            var offlineFriends = await this.bulkRefreshFriends({
                offline: true
            });
            var friends = onlineFriends.concat(offlineFriends);
            friends = await this.refetchBrokenFriends(friends);
            if (!$app.friendLogInitStatus) {
                friends = await this.refreshRemainingFriends(friends);
            }

            this.isRefreshFriendsLoading = false;
            return friends;
        } catch (err) {
            this.isRefreshFriendsLoading = false;
            throw err;
        }
    };

    API.bulkRefreshFriends = async function (params) {
        var friends = [];
        var params = {
            ...params,
            n: 50,
            offset: 0
        };
        // API offset limit *was* 5000
        // it is now 7500
        mainLoop: for (var i = 150; i > -1; i--) {
            retryLoop: for (var j = 0; j < 10; j++) {
                // handle 429 ratelimit error, retry 10 times
                try {
                    var args = await friendRequest.getFriends(params);
                    if (!args.json || args.json.length === 0) {
                        break mainLoop;
                    }
                    friends = friends.concat(args.json);
                    break retryLoop;
                } catch (err) {
                    console.error(err);
                    if (!API.currentUser.isLoggedIn) {
                        console.error(`User isn't logged in`);
                        break mainLoop;
                    }
                    if (err?.message?.includes('Not Found')) {
                        console.error('Awful workaround for awful VRC API bug');
                        break retryLoop;
                    }
                    await new Promise((resolve) => {
                        workerTimers.setTimeout(resolve, 5000);
                    });
                }
            }
            params.offset += 50;
        }
        return friends;
    };

    API.refreshRemainingFriends = async function (friends) {
        for (var userId of this.currentUser.friends) {
            if (!friends.some((x) => x.id === userId)) {
                try {
                    if (!API.isLoggedIn) {
                        console.error(`User isn't logged in`);
                        return friends;
                    }
                    console.log('Fetching remaining friend', userId);
                    var args = await userRequest.getUser({ userId });
                    friends.push(args.json);
                } catch (err) {
                    console.error(err);
                }
            }
        }
        return friends;
    };

    API.refetchBrokenFriends = async function (friends) {
        // attempt to fix broken data from bulk friend fetch
        for (var i = 0; i < friends.length; i++) {
            var friend = friends[i];
            try {
                // we don't update friend state here, it's not reliable
                var state = 'offline';
                if (friend.platform === 'web') {
                    state = 'active';
                } else if (friend.platform) {
                    state = 'online';
                }
                var ref = $app.friends.get(friend.id);
                if (ref?.state !== state) {
                    if ($app.debugFriendState) {
                        console.log(
                            `Refetching friend state it does not match ${friend.displayName} from ${ref?.state} to ${state}`,
                            friend
                        );
                    }
                    var args = await userRequest.getUser({
                        userId: friend.id
                    });
                    friends[i] = args.json;
                } else if (friend.location === 'traveling') {
                    if ($app.debugFriendState) {
                        console.log(
                            'Refetching traveling friend',
                            friend.displayName
                        );
                    }
                    var args = await userRequest.getUser({
                        userId: friend.id
                    });
                    friends[i] = args.json;
                }
            } catch (err) {
                console.error(err);
            }
        }
        return friends;
    };

    // #endregion
    // #region | API: Avatar

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
            $app.sortUserDialogAvatars(array);
        }
    });

    API.applyAvatar = function (json) {
        var ref = this.cachedAvatars.get(json.id);
        if (typeof ref === 'undefined') {
            ref = {
                acknowledgements: '',
                authorId: '',
                authorName: '',
                created_at: '',
                description: '',
                featured: false,
                highestPrice: null,
                id: '',
                imageUrl: '',
                lock: false,
                lowestPrice: null,
                name: '',
                productId: null,
                publishedListings: [],
                releaseStatus: '',
                searchable: false,
                styles: [],
                tags: [],
                thumbnailImageUrl: '',
                unityPackageUrl: '',
                unityPackageUrlObject: {},
                unityPackages: [],
                updated_at: '',
                version: 0,
                ...json
            };
            this.cachedAvatars.set(ref.id, ref);
        } else {
            var { unityPackages } = ref;
            Object.assign(ref, json);
            if (
                json.unityPackages?.length > 0 &&
                unityPackages.length > 0 &&
                !json.unityPackages[0].assetUrl
            ) {
                ref.unityPackages = unityPackages;
            }
        }
        for (const listing of ref?.publishedListings) {
            listing.displayName = $utils.replaceBioSymbols(listing.displayName);
            listing.description = $utils.replaceBioSymbols(listing.description);
        }
        ref.name = $utils.replaceBioSymbols(ref.name);
        ref.description = $utils.replaceBioSymbols(ref.description);
        return ref;
    };

    // API.$on('AVATAR:IMPOSTER:DELETE', function (args) {
    //     if (
    //         $app.avatarDialog.visible &&
    //         args.params.avatarId === $app.avatarDialog.id
    //     ) {
    //         $app.showAvatarDialog($app.avatarDialog.id);
    //     }
    // });

    // #endregion
    // #region | API: Notification

    API.isNotificationsLoading = false;

    API.$on('LOGIN', function () {
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
            json.type = 'ignoredFriendRequest';
            this.$emit('NOTIFICATION', {
                json,
                params: {
                    notificationId: json.id
                }
            });
        }
    });

    API.$on('NOTIFICATION:ACCEPT', function (args) {
        var array = $app.notificationTable.data;
        for (var i = array.length - 1; i >= 0; i--) {
            if (array[i].id === args.params.notificationId) {
                var ref = array[i];
                break;
            }
        }
        if (typeof ref === 'undefined') {
            return;
        }
        ref.$isExpired = true;
        args.ref = ref;
        this.$emit('NOTIFICATION:EXPIRE', {
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
        var array = $app.notificationTable.data;
        for (var i = array.length - 1; i >= 0; i--) {
            if (array[i].id === args.params.notificationId) {
                var ref = array[i];
                break;
            }
        }
        if (typeof ref === 'undefined') {
            return;
        }
        args.ref = ref;
        if (
            ref.type === 'friendRequest' ||
            ref.type === 'ignoredFriendRequest' ||
            ref.type.includes('.')
        ) {
            for (var i = array.length - 1; i >= 0; i--) {
                if (array[i].id === ref.id) {
                    array.splice(i, 1);
                    break;
                }
            }
        } else {
            ref.$isExpired = true;
            database.updateNotificationExpired(ref);
        }
        this.$emit('NOTIFICATION:EXPIRE', {
            ref,
            params: {
                notificationId: ref.id
            }
        });
    });

    API.applyNotification = function (json) {
        var array = $app.notificationTable.data;
        for (var i = array.length - 1; i >= 0; i--) {
            if (array[i].id === json.id) {
                var ref = array[i];
                break;
            }
        }
        // delete any null in json
        for (var key in json) {
            if (json[key] === null) {
                delete json[key];
            }
        }
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
                $isExpired: false,
                //
                ...json
            };
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

    API.expireFriendRequestNotifications = function () {
        var array = $app.notificationTable.data;
        for (var i = array.length - 1; i >= 0; i--) {
            if (
                array[i].type === 'friendRequest' ||
                array[i].type === 'ignoredFriendRequest' ||
                array[i].type.includes('.')
            ) {
                array.splice(i, 1);
            }
        }
    };

    API.expireNotification = function (notificationId) {
        var array = $app.notificationTable.data;
        for (var i = array.length - 1; i >= 0; i--) {
            if (array[i].id === notificationId) {
                var ref = array[i];
                break;
            }
        }
        if (typeof ref === 'undefined') {
            return;
        }
        ref.$isExpired = true;
        database.updateNotificationExpired(ref);
        this.$emit('NOTIFICATION:EXPIRE', {
            ref,
            params: {
                notificationId: ref.id
            }
        });
    };

    API.refreshNotifications = async function () {
        this.isNotificationsLoading = true;
        try {
            this.expireFriendRequestNotifications();
            var params = {
                n: 100,
                offset: 0
            };
            var count = 50; // 5000 max
            for (var i = 0; i < count; i++) {
                var args = await notificationRequest.getNotifications(params);
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
                var args = await notificationRequest.getNotificationsV2(params);
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
                var args =
                    await notificationRequest.getHiddenFriendRequests(params);
                $app.unseenNotifications = [];
                params.offset += 100;
                if (args.json.length < 100) {
                    break;
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            this.isNotificationsLoading = false;
            $app.notificationInitStatus = true;
        }
    };

    API.$on('NOTIFICATION:V2:LIST', function (args) {
        for (var json of args.json) {
            this.$emit('NOTIFICATION:V2', { json });
        }
    });

    API.$on('NOTIFICATION:V2', function (args) {
        var json = args.json;
        json.created_at = json.createdAt;
        if (json.title && json.message) {
            json.message = `${json.title}, ${json.message}`;
        } else if (json.title) {
            json.message = json.title;
        }
        this.$emit('NOTIFICATION', {
            json,
            params: {
                notificationId: json.id
            }
        });
    });

    API.$on('NOTIFICATION:V2:UPDATE', function (args) {
        var notificationId = args.params.notificationId;
        var json = args.json;
        if (!json) {
            return;
        }
        json.id = notificationId;
        this.$emit('NOTIFICATION', {
            json,
            params: {
                notificationId
            }
        });
        if (json.seen) {
            this.$emit('NOTIFICATION:SEE', {
                params: {
                    notificationId
                }
            });
        }
    });

    API.$on('NOTIFICATION:RESPONSE', function (args) {
        this.$emit('NOTIFICATION:HIDE', args);
        new Noty({
            type: 'success',
            text: $app.escapeTag(args.json)
        }).show();
        console.log('NOTIFICATION:RESPONSE', args);
    });

    API.getFriendRequest = function (userId) {
        var array = $app.notificationTable.data;
        for (var i = array.length - 1; i >= 0; i--) {
            if (
                array[i].type === 'friendRequest' &&
                array[i].senderUserId === userId
            ) {
                return array[i].id;
            }
        }
        return '';
    };

    // #endregion
    // #region | API: PlayerModeration

    API.cachedPlayerModerations = new Map();
    API.cachedPlayerModerationsUserIds = new Set();
    API.isPlayerModerationsLoading = false;

    API.$on('LOGIN', function () {
        this.cachedPlayerModerations.clear();
        this.cachedPlayerModerationsUserIds.clear();
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
            if (
                ref.type === type &&
                ref.targetUserId === moderated &&
                ref.sourceUserId === userId
            ) {
                this.cachedPlayerModerations.delete(ref.id);
                this.$emit('PLAYER-MODERATION:@DELETE', {
                    ref,
                    params: {
                        playerModerationId: ref.id
                    }
                });
            }
        }
        this.cachedPlayerModerationsUserIds.delete(moderated);
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
                $isExpired: false,
                //
                ...json
            };
            this.cachedPlayerModerations.set(ref.id, ref);
        } else {
            Object.assign(ref, json);
            ref.$isExpired = false;
        }
        if (json.targetUserId) {
            this.cachedPlayerModerationsUserIds.add(json.targetUserId);
        }
        return ref;
    };

    API.expirePlayerModerations = function () {
        this.cachedPlayerModerationsUserIds.clear();
        for (var ref of this.cachedPlayerModerations.values()) {
            ref.$isExpired = true;
        }
    };

    API.deleteExpiredPlayerModerations = function () {
        for (var ref of this.cachedPlayerModerations.values()) {
            if (!ref.$isExpired) {
                continue;
            }
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
            playerModerationRequest.getPlayerModerations(),
            avatarModerationRequest.getAvatarModerations()
        ])
            .finally(() => {
                this.isPlayerModerationsLoading = false;
            })
            .then((res) => {
                // 'AVATAR-MODERATION:LIST';
                // TODO: compare with cachedAvatarModerations
                this.cachedAvatarModerations = new Map();
                for (var json of res[1]?.json) {
                    this.applyAvatarModeration(json);
                }
                this.deleteExpiredPlayerModerations();
            });
    };

    // #endregion
    // #region | API: AvatarModeration

    API.cachedAvatarModerations = new Map();

    API.applyAvatarModeration = function (json) {
        // fix inconsistent Unix time response
        if (typeof json.created === 'number') {
            json.created = new Date(json.created).toJSON();
        }

        var ref = this.cachedAvatarModerations.get(json.targetAvatarId);
        if (typeof ref === 'undefined') {
            ref = {
                avatarModerationType: '',
                created: '',
                targetAvatarId: '',
                ...json
            };
            this.cachedAvatarModerations.set(ref.targetAvatarId, ref);
        } else {
            Object.assign(ref, json);
        }

        // update avatar dialog
        var D = $app.avatarDialog;
        if (
            D.visible &&
            ref.avatarModerationType === 'block' &&
            D.id === ref.targetAvatarId
        ) {
            D.isBlocked = true;
        }

        return ref;
    };

    // #endregion
    // #region | API: Favorite

    API.cachedFavorites = new Map();
    API.cachedFavoritesByObjectId = new Map();
    API.cachedFavoriteGroups = new Map();
    API.cachedFavoriteGroupsByTypeName = new Map();
    API.favoriteFriendGroups = [];
    API.favoriteWorldGroups = [];
    API.favoriteAvatarGroups = [];
    API.isFavoriteLoading = false;
    API.isFavoriteGroupLoading = false;
    API.favoriteLimits = {
        maxFavoriteGroups: {
            avatar: 6,
            friend: 3,
            world: 4
        },
        maxFavoritesPerGroup: {
            avatar: 50,
            friend: 150,
            world: 100
        }
    };

    API.$on('LOGIN', function () {
        $app.localFavoriteFriends.clear();
        $app.currentUserGroupsInit = false;
        this.cachedGroups.clear();
        this.cachedAvatars.clear();
        this.cachedWorlds.clear();
        this.cachedUsers.clear();
        this.cachedInstances.clear();
        this.cachedAvatarNames.clear();
        this.cachedAvatarModerations.clear();
        this.cachedPlayerModerations.clear();
        this.cachedFavorites.clear();
        this.cachedFavoritesByObjectId.clear();
        this.cachedFavoriteGroups.clear();
        this.cachedFavoriteGroupsByTypeName.clear();
        this.currentUserGroups.clear();
        this.currentUserInventory.clear();
        this.queuedInstances.clear();
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
                },
                sortTop: false
            });
        }
    });

    API.$on('FAVORITE:ADD', function (args) {
        this.$emit('FAVORITE', {
            json: args.json,
            params: {
                favoriteId: args.json.id
            },
            sortTop: true
        });
    });

    API.$on('FAVORITE:ADD', function (args) {
        if (
            args.params.type === 'avatar' &&
            !API.cachedAvatars.has(args.params.favoriteId)
        ) {
            this.refreshFavoriteAvatars(args.params.tags);
        }

        if (
            args.params.type === 'friend' &&
            $app.localFavoriteFriendsGroups.includes(
                'friend:' + args.params.tags
            )
        ) {
            $app.updateLocalFavoriteFriends();
        }
    });

    API.$on('FAVORITE:DELETE', function (args) {
        var ref = this.cachedFavoritesByObjectId.get(args.params.objectId);
        if (typeof ref === 'undefined') {
            return;
        }
        // 애초에 $isDeleted인데 여기로 올 수 가 있나..?
        this.cachedFavoritesByObjectId.delete(args.params.objectId);
        $app.localFavoriteFriends.delete(args.params.objectId);
        $app.updateSidebarFriendsList();
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
            $app.localFavoriteFriends.delete(ref.favoriteId);
            $app.updateSidebarFriendsList();
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
            if (
                ref.type === 'friend' &&
                ($app.localFavoriteFriendsGroups.length === 0 ||
                    $app.localFavoriteFriendsGroups.includes(ref.groupKey))
            ) {
                $app.localFavoriteFriends.add(ref.favoriteId);
                $app.updateSidebarFriendsList();
            }
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
        $app.localFavoriteFriends.clear();
        this.cachedFavorites.clear();
        this.cachedFavoritesByObjectId.clear();
        $app.favoriteObjects.clear();
        $app.favoriteFriends_ = [];
        $app.favoriteFriendsSorted = [];
        $app.favoriteWorlds_ = [];
        $app.favoriteWorldsSorted = [];
        $app.favoriteAvatars_ = [];
        $app.favoriteAvatarsSorted = [];
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
        var n = Math.floor(Math.random() * (50 + 1)) + 50;
        var params = {
            n,
            offset: 0,
            tag
        };
        favoriteRequest.getFavoriteAvatars(params);
    };

    API.refreshFavoriteItems = function () {
        var types = {
            world: [0, favoriteRequest.getFavoriteWorlds],
            avatar: [0, favoriteRequest.getFavoriteAvatars]
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
                        var n = Math.floor(Math.random() * (50 + 1)) + 50;
                        this.bulk({
                            fn,
                            N,
                            params: {
                                n,
                                offset: 0,
                                tag
                            }
                        });
                    }
                } else {
                    var n = Math.floor(Math.random() * (36 + 1)) + 64;
                    this.bulk({
                        fn,
                        N,
                        params: {
                            n,
                            offset: 0
                        }
                    });
                }
            }
        }
    };

    API.refreshFavorites = async function () {
        if (this.isFavoriteLoading) {
            return;
        }
        this.isFavoriteLoading = true;
        try {
            await favoriteRequest.getFavoriteLimits();
        } catch (err) {
            console.error(err);
        }
        this.expireFavorites();
        this.cachedFavoriteGroupsByTypeName.clear();
        this.bulk({
            fn: favoriteRequest.getFavorites,
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
                $app.updateLocalFavoriteFriends();
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
        // 450 = ['group_0', 'group_1', 'group_2'] x 150
        this.favoriteFriendGroups = [];
        for (var i = 0; i < this.favoriteLimits.maxFavoriteGroups.friend; ++i) {
            this.favoriteFriendGroups.push({
                assign: false,
                key: `friend:group_${i}`,
                type: 'friend',
                name: `group_${i}`,
                displayName: `Group ${i + 1}`,
                capacity: this.favoriteLimits.maxFavoritesPerGroup.friend,
                count: 0,
                visibility: 'private'
            });
        }
        // 400 = ['worlds1', 'worlds2', 'worlds3', 'worlds4'] x 100
        this.favoriteWorldGroups = [];
        for (var i = 0; i < this.favoriteLimits.maxFavoriteGroups.world; ++i) {
            this.favoriteWorldGroups.push({
                assign: false,
                key: `world:worlds${i + 1}`,
                type: 'world',
                name: `worlds${i + 1}`,
                displayName: `Group ${i + 1}`,
                capacity: this.favoriteLimits.maxFavoritesPerGroup.world,
                count: 0,
                visibility: 'private'
            });
        }
        // 350 = ['avatars1', ...] x 50
        // Favorite Avatars (0/50)
        // VRC+ Group 1..5 (0/50)
        this.favoriteAvatarGroups = [];
        for (var i = 0; i < this.favoriteLimits.maxFavoriteGroups.avatar; ++i) {
            this.favoriteAvatarGroups.push({
                assign: false,
                key: `avatar:avatars${i + 1}`,
                type: 'avatar',
                name: `avatars${i + 1}`,
                displayName: `Group ${i + 1}`,
                capacity: this.favoriteLimits.maxFavoritesPerGroup.avatar,
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
                    if (ref.displayName) {
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

    API.$on('FAVORITE:LIMITS', function (args) {
        this.favoriteLimits = {
            ...this.favoriteLimits,
            ...args.json
        };
    });

    API.refreshFavoriteGroups = function () {
        if (this.isFavoriteGroupLoading) {
            return;
        }
        this.isFavoriteGroupLoading = true;
        this.expireFavoriteGroups();
        this.bulk({
            fn: favoriteRequest.getFavoriteGroups,
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

    // #endregion
    // #region | Misc

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
                if (!this.epoch) {
                    this.text = '-';
                    return;
                }
                this.text = $app.timeToText(Date.now() - this.epoch);
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
            $app.removeFromArray($timers, this);
        }
    });

    workerTimers.setInterval(function () {
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
                    this.text = $app.timeToText(epoch);
                } else {
                    this.text = '-';
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
            $app.removeFromArray($countDownTimers, this);
        }
    });

    workerTimers.setInterval(function () {
        for (var $countDownTimer of $countDownTimers) {
            $countDownTimer.update();
        }
    }, 5000);

    // #endregion
    // #region | initialise

    $app.methods.refreshCustomCss = function () {
        if (document.contains(document.getElementById('app-custom-style'))) {
            document.getElementById('app-custom-style').remove();
        }
        AppApi.CustomCssPath().then((customCss) => {
            var head = document.head;
            if (customCss) {
                var $appCustomStyle = document.createElement('link');
                $appCustomStyle.setAttribute('id', 'app-custom-style');
                $appCustomStyle.rel = 'stylesheet';
                $appCustomStyle.href = `file://${customCss}?_=${Date.now()}`;
                head.appendChild($appCustomStyle);
            }
        });
    };

    $app.methods.refreshCustomScript = function () {
        if (document.contains(document.getElementById('app-custom-script'))) {
            document.getElementById('app-custom-script').remove();
        }
        AppApi.CustomScriptPath().then((customScript) => {
            var head = document.head;
            if (customScript) {
                var $appCustomScript = document.createElement('script');
                $appCustomScript.setAttribute('id', 'app-custom-script');
                $appCustomScript.src = `file://${customScript}?_=${Date.now()}`;
                head.appendChild($appCustomScript);
            }
        });
    };

    $app.methods.openExternalLink = function (link) {
        this.$confirm(`${link}`, 'Open External Link', {
            distinguishCancelAndClose: true,
            confirmButtonText: 'Open',
            cancelButtonText: 'Copy',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    AppApi.OpenLink(link);
                } else if (action === 'cancel') {
                    this.copyLink(link);
                }
            }
        });
    };

    $app.methods.compareAppVersion = async function () {
        if (!this.appVersion) {
            return;
        }
        var currentVersion = this.appVersion.replace(' (Linux)', '');
        var lastVersion = await configRepository.getString(
            'VRCX_lastVRCXVersion',
            ''
        );
        if (!lastVersion) {
            await configRepository.setString(
                'VRCX_lastVRCXVersion',
                currentVersion
            );
            return;
        }
        if (lastVersion !== currentVersion) {
            await configRepository.setString(
                'VRCX_lastVRCXVersion',
                currentVersion
            );
            if (
                (await configRepository.getString('VRCX_branch')) === 'Stable'
            ) {
                this.showChangeLogDialog();
            }
        }
    };

    $app.methods.setBranch = async function () {
        if (!this.appVersion) {
            return;
        }
        var currentVersion = this.appVersion.replace(' (Linux)', '');
        if (currentVersion.includes('VRCX Nightly')) {
            this.branch = 'Nightly';
        } else {
            this.branch = 'Stable';
        }
        await configRepository.setString('VRCX_branch', this.branch);
    };

    $app.data.vrcxId = '';
    $app.methods.loadVrcxId = async function () {
        this.vrcxId = await configRepository.getString('VRCX_id', '');
        if (!this.vrcxId) {
            this.vrcxId = crypto.randomUUID();
            await configRepository.setString('VRCX_id', this.vrcxId);
        }
    };

    $app.methods.updateIsGameRunning = async function (
        isGameRunning,
        isSteamVRRunning,
        isHmdAfk
    ) {
        if (this.gameLogDisabled) {
            return;
        }
        if (isGameRunning !== this.isGameRunning) {
            this.isGameRunning = isGameRunning;
            if (isGameRunning) {
                API.currentUser.$online_for = Date.now();
                API.currentUser.$offline_for = '';
                API.currentUser.$previousAvatarSwapTime = Date.now();
            } else {
                await configRepository.setBool('isGameNoVR', this.isGameNoVR);
                API.currentUser.$online_for = '';
                API.currentUser.$offline_for = Date.now();
                this.removeAllQueuedInstances();
                this.autoVRChatCacheManagement();
                this.checkIfGameCrashed();
                this.ipcTimeout = 0;
                this.addAvatarWearTime(API.currentUser.currentAvatar);
                API.currentUser.$previousAvatarSwapTime = '';
            }
            this.lastLocationReset();
            this.clearNowPlaying();
            this.updateVRLastLocation();
            workerTimers.setTimeout(
                () => this.checkVRChatDebugLogging(),
                60000
            );
            this.nextDiscordUpdate = 0;
            console.log(new Date(), 'isGameRunning', isGameRunning);
        }

        if (isSteamVRRunning !== this.isSteamVRRunning) {
            this.isSteamVRRunning = isSteamVRRunning;
            console.log('isSteamVRRunning:', isSteamVRRunning);
        }
        if (isHmdAfk !== this.isHmdAfk) {
            this.isHmdAfk = isHmdAfk;
            console.log('isHmdAfk:', isHmdAfk);
        }
        this.updateOpenVR();
    };

    $app.data.debug = false;
    $app.data.debugWebRequests = false;
    $app.data.debugWebSocket = false;
    $app.data.debugUserDiff = false;
    $app.data.debugCurrentUserDiff = false;
    $app.data.debugPhotonLogging = false;
    $app.data.debugGameLog = false;
    $app.data.debugFriendState = false;

    $app.data.menuActiveIndex = 'feed';

    $app.methods.notifyMenu = function (index) {
        const navRef = this.$refs.menu.$children[0];
        if (this.menuActiveIndex !== index) {
            const item = navRef.items[index];
            if (item) {
                item.$el.classList.add('notify');
            }
        }
    };

    $app.methods.selectMenu = function (index) {
        this.menuActiveIndex = index;
        const item = this.$refs.menu.$children[0]?.items[index];
        if (item) {
            item.$el.classList.remove('notify');
        }
        if (index === 'notification') {
            this.unseenNotifications = [];
        }
    };

    $app.data.twoFactorAuthDialogVisible = false;

    API.$on('LOGIN', function () {
        $app.twoFactorAuthDialogVisible = false;
    });

    $app.methods.clearCookiesTryLogin = async function () {
        await webApiService.clearCookies();
        if (this.loginForm.lastUserLoggedIn) {
            var user =
                this.loginForm.savedCredentials[
                    this.loginForm.lastUserLoggedIn
                ];
            if (typeof user !== 'undefined') {
                delete user.cookies;
                await this.relogin(user);
                return;
            }
        }
    };

    $app.methods.resendEmail2fa = async function () {
        if (this.loginForm.lastUserLoggedIn) {
            var user =
                this.loginForm.savedCredentials[
                    this.loginForm.lastUserLoggedIn
                ];
            if (typeof user !== 'undefined') {
                await webApiService.clearCookies();
                delete user.cookies;
                this.relogin(user).then(() => {
                    new Noty({
                        type: 'success',
                        text: 'Email 2FA resent.'
                    }).show();
                });
                return;
            }
        }
        new Noty({
            type: 'error',
            text: 'Cannot send 2FA email without saved credentials. Please login again.'
        }).show();
    };

    API.$on('USER:2FA', function () {
        AppApi.FocusWindow();
        $app.promptTOTP();
    });

    API.$on('USER:EMAILOTP', function () {
        AppApi.FocusWindow();
        $app.promptEmailOTP();
    });

    API.$on('LOGOUT', function () {
        if (this.isLoggedIn) {
            new Noty({
                type: 'success',
                text: `See you again, <strong>${$app.escapeTag(
                    this.currentUser.displayName
                )}</strong>!`
            }).show();
        }
        this.isLoggedIn = false;
        $app.friendLogInitStatus = false;
        $app.notificationInitStatus = false;
    });

    API.$on('LOGIN', function (args) {
        new Noty({
            type: 'success',
            text: `Hello there, <strong>${$app.escapeTag(
                args.ref.displayName
            )}</strong>!`
        }).show();
        $app.updateStoredUser(this.currentUser);
    });

    API.$on('LOGOUT', async function () {
        await $app.updateStoredUser(this.currentUser);
        webApiService.clearCookies();
        // eslint-disable-next-line require-atomic-updates
        $app.loginForm.lastUserLoggedIn = '';
        await configRepository.remove('lastUserLoggedIn');
        // workerTimers.setTimeout(() => location.reload(), 500);
    });

    $app.methods.checkPrimaryPassword = function (args) {
        return new Promise((resolve, reject) => {
            if (!this.enablePrimaryPassword) {
                resolve(args.password);
            }
            $app.$prompt(
                $t('prompt.primary_password.description'),
                $t('prompt.primary_password.header'),
                {
                    inputType: 'password',
                    inputPattern: /[\s\S]{1,32}/
                }
            )
                .then(({ value }) => {
                    security
                        .decrypt(args.password, value)
                        .then(resolve)
                        .catch(reject);
                })
                .catch(reject);
        });
    };

    $app.data.enablePrimaryPassword = await configRepository.getBool(
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
        // The function is only called in adv settings
        this.enablePrimaryPassword = !this.enablePrimaryPassword;

        this.enablePrimaryPasswordDialog.password = '';
        this.enablePrimaryPasswordDialog.rePassword = '';
        if (this.enablePrimaryPassword) {
            this.enablePrimaryPasswordDialog.visible = true;
        } else {
            this.$prompt(
                $t('prompt.primary_password.description'),
                $t('prompt.primary_password.header'),
                {
                    inputType: 'password',
                    inputPattern: /[\s\S]{1,32}/
                }
            )
                .then(({ value }) => {
                    for (let userId in this.loginForm.savedCredentials) {
                        security
                            .decrypt(
                                this.loginForm.savedCredentials[userId]
                                    .loginParmas.password,
                                value
                            )
                            .then(async (pt) => {
                                this.saveCredentials = {
                                    username:
                                        this.loginForm.savedCredentials[userId]
                                            .loginParmas.username,
                                    password: pt
                                };
                                await this.updateStoredUser(
                                    this.loginForm.savedCredentials[userId].user
                                );
                                await configRepository.setBool(
                                    'enablePrimaryPassword',
                                    false
                                );
                            })
                            .catch(async () => {
                                this.enablePrimaryPassword = true;
                                await configRepository.setBool(
                                    'enablePrimaryPassword',
                                    true
                                );
                            });
                    }
                })
                .catch(async () => {
                    this.enablePrimaryPassword = true;
                    await configRepository.setBool(
                        'enablePrimaryPassword',
                        true
                    );
                });
        }
    };
    $app.methods.setPrimaryPassword = async function () {
        await configRepository.setBool(
            'enablePrimaryPassword',
            this.enablePrimaryPassword
        );
        this.enablePrimaryPasswordDialog.visible = false;
        if (this.enablePrimaryPassword) {
            let key = this.enablePrimaryPasswordDialog.password;
            for (let userId in this.loginForm.savedCredentials) {
                security
                    .encrypt(
                        this.loginForm.savedCredentials[userId].loginParmas
                            .password,
                        key
                    )
                    .then((ct) => {
                        this.saveCredentials = {
                            username:
                                this.loginForm.savedCredentials[userId]
                                    .loginParmas.username,
                            password: ct
                        };
                        this.updateStoredUser(
                            this.loginForm.savedCredentials[userId].user
                        );
                    });
            }
        }
    };

    $app.methods.updateStoredUser = async function (user) {
        var savedCredentials = {};
        if ((await configRepository.getString('savedCredentials')) !== null) {
            savedCredentials = JSON.parse(
                await configRepository.getString('savedCredentials')
            );
        }
        if (this.saveCredentials) {
            var credentialsToSave = {
                user,
                loginParmas: this.saveCredentials
            };
            savedCredentials[user.id] = credentialsToSave;
            delete this.saveCredentials;
        } else if (typeof savedCredentials[user.id] !== 'undefined') {
            savedCredentials[user.id].user = user;
            savedCredentials[user.id].cookies =
                await webApiService.getCookies();
        }
        this.loginForm.savedCredentials = savedCredentials;
        var jsonCredentialsArray = JSON.stringify(savedCredentials);
        await configRepository.setString(
            'savedCredentials',
            jsonCredentialsArray
        );
        this.loginForm.lastUserLoggedIn = user.id;
        await configRepository.setString('lastUserLoggedIn', user.id);
    };

    $app.methods.migrateStoredUsers = async function () {
        var savedCredentials = {};
        if ((await configRepository.getString('savedCredentials')) !== null) {
            savedCredentials = JSON.parse(
                await configRepository.getString('savedCredentials')
            );
        }
        for (let name in savedCredentials) {
            var userId = savedCredentials[name]?.user?.id;
            if (userId && userId !== name) {
                savedCredentials[userId] = savedCredentials[name];
                delete savedCredentials[name];
            }
        }
        await configRepository.setString(
            'savedCredentials',
            JSON.stringify(savedCredentials)
        );
    };

    // #endregion
    // #region | App: Friends

    $app.data.friends = new Map();
    $app.data.pendingActiveFriends = new Set();
    $app.data.friendNumber = 0;
    $app.data.isFriendsGroupMe = true;
    $app.data.isVIPFriends = true;
    $app.data.isOnlineFriends = true;
    $app.data.isActiveFriends = true;
    $app.data.isOfflineFriends = false;
    $app.data.isGroupInstances = false;
    $app.data.groupInstances = [];
    $app.data.vipFriends_ = [];
    $app.data.onlineFriends_ = [];
    $app.data.activeFriends_ = [];
    $app.data.offlineFriends_ = [];
    $app.data.sortVIPFriends = false;
    $app.data.sortOnlineFriends = false;
    $app.data.sortActiveFriends = false;
    $app.data.sortOfflineFriends = false;

    $app.methods.fetchActiveFriend = function (userId) {
        this.pendingActiveFriends.add(userId);
        // FIXME: handle error
        return userRequest
            .getUser({
                userId
            })
            .then((args) => {
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
        $app.friendNumber = 0;
        $app.isGroupInstances = false;
        $app.groupInstances = [];
        $app.vipFriends_ = [];
        $app.onlineFriends_ = [];
        $app.activeFriends_ = [];
        $app.offlineFriends_ = [];
        $app.sortVIPFriends = false;
        $app.sortOnlineFriends = false;
        $app.sortActiveFriends = false;
        $app.sortOfflineFriends = false;
        $app.updateInGameGroupOrder();
    });

    API.$on('USER:CURRENT', function (args) {
        // USER:CURRENT에서 처리를 함
        if ($app.friendLogInitStatus) {
            $app.refreshFriends(args.ref, args.fromGetCurrentUser);
        }
        $app.updateOnlineFriendCoutner();

        if ($app.randomUserColours) {
            $app.getNameColour(this.currentUser.id).then((colour) => {
                this.currentUser.$userColour = colour;
            });
        }
    });

    API.$on('FRIEND:ADD', function (args) {
        $app.addFriend(args.params.userId);
    });

    API.$on('FRIEND:DELETE', function (args) {
        $app.deleteFriend(args.params.userId);
    });

    API.$on('FRIEND:STATE', function (args) {
        $app.updateFriend({
            id: args.params.userId,
            state: args.json.state
        });
    });

    API.$on('FAVORITE', function (args) {
        $app.updateFriend({ id: args.ref.favoriteId });
    });

    API.$on('FAVORITE:@DELETE', function (args) {
        $app.updateFriend({ id: args.ref.favoriteId });
    });

    $app.methods.refreshFriendsList = async function () {
        // If we just got user less then 2 min before code call, don't call it again
        if (this.nextCurrentUserRefresh < 300) {
            await API.getCurrentUser().catch((err) => {
                console.error(err);
            });
        }
        await API.refreshFriends().catch((err) => {
            console.error(err);
        });
        API.reconnectWebSocket();
    };

    $app.methods.refreshFriends = function (ref, fromGetCurrentUser) {
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
                this.updateFriend({ id, state, fromGetCurrentUser });
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
        var isVIP = this.localFavoriteFriends.has(id);
        var name = '';
        var friend = this.friendLog.get(id);
        if (friend) {
            name = friend.displayName;
        }
        var ctx = {
            id,
            state: state || 'offline',
            isVIP,
            ref,
            name,
            memo: '',
            pendingOffline: false,
            pendingOfflineTime: '',
            pendingState: '',
            $nickName: ''
        };
        if (this.friendLogInitStatus) {
            this.getUserMemo(id).then((memo) => {
                if (memo.userId === id) {
                    ctx.memo = memo.memo;
                    ctx.$nickName = '';
                    if (memo.memo) {
                        var array = memo.memo.split('\n');
                        ctx.$nickName = array[0];
                    }
                }
            });
        }
        if (typeof ref === 'undefined') {
            var friendLogRef = this.friendLog.get(id);
            if (friendLogRef?.displayName) {
                ctx.name = friendLogRef.displayName;
            }
        } else {
            ctx.name = ref.name;
        }
        this.friends.set(id, ctx);
        if (ctx.state === 'online') {
            if (ctx.isVIP) {
                this.vipFriends_.push(ctx);
                this.sortVIPFriends = true;
            } else {
                this.onlineFriends_.push(ctx);
                this.sortOnlineFriends = true;
            }
        } else if (ctx.state === 'active') {
            this.activeFriends_.push(ctx);
            this.sortActiveFriends = true;
        } else {
            this.offlineFriends_.push(ctx);
            this.sortOfflineFriends = true;
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
                $app.removeFromArray(this.vipFriends_, ctx);
            } else {
                $app.removeFromArray(this.onlineFriends_, ctx);
            }
        } else if (ctx.state === 'active') {
            $app.removeFromArray(this.activeFriends_, ctx);
        } else {
            $app.removeFromArray(this.offlineFriends_, ctx);
        }
    };

    $app.methods.updateFriend = function (ctx) {
        var { id, state, fromGetCurrentUser } = ctx;
        var stateInput = state;
        var ctx = this.friends.get(id);
        if (typeof ctx === 'undefined') {
            return;
        }
        var ref = API.cachedUsers.get(id);
        if (stateInput) {
            ctx.pendingState = stateInput;
            if (typeof ref !== 'undefined') {
                ctx.ref.state = stateInput;
            }
        }
        if (stateInput === 'online') {
            if (this.debugFriendState && ctx.pendingOffline) {
                var time = (Date.now() - ctx.pendingOfflineTime) / 1000;
                console.log(`${ctx.name} pendingOfflineCancelTime ${time}`);
            }
            ctx.pendingOffline = false;
            ctx.pendingOfflineTime = '';
        }
        var isVIP = this.localFavoriteFriends.has(id);
        var location = '';
        var $location_at = '';
        if (typeof ref !== 'undefined') {
            var { location, $location_at } = ref;
        }
        if (typeof stateInput === 'undefined' || ctx.state === stateInput) {
            // this is should be: undefined -> user
            if (ctx.ref !== ref) {
                ctx.ref = ref;
                // NOTE
                // AddFriend (CurrentUser) 이후,
                // 서버에서 오는 순서라고 보면 될 듯.
                if (ctx.state === 'online') {
                    if (this.friendLogInitStatus) {
                        userRequest.getUser({
                            userId: id
                        });
                    }
                    if (ctx.isVIP) {
                        this.sortVIPFriends = true;
                    } else {
                        this.sortOnlineFriends = true;
                    }
                }
            }
            if (ctx.isVIP !== isVIP) {
                ctx.isVIP = isVIP;
                if (ctx.state === 'online') {
                    if (ctx.isVIP) {
                        $app.removeFromArray(this.onlineFriends_, ctx);
                        this.vipFriends_.push(ctx);
                        this.sortVIPFriends = true;
                    } else {
                        $app.removeFromArray(this.vipFriends_, ctx);
                        this.onlineFriends_.push(ctx);
                        this.sortOnlineFriends = true;
                    }
                }
            }
            if (typeof ref !== 'undefined' && ctx.name !== ref.displayName) {
                ctx.name = ref.displayName;
                if (ctx.state === 'online') {
                    if (ctx.isVIP) {
                        this.sortVIPFriends = true;
                    } else {
                        this.sortOnlineFriends = true;
                    }
                } else if (ctx.state === 'active') {
                    this.sortActiveFriends = true;
                } else {
                    this.sortOfflineFriends = true;
                }
            }
            // from getCurrentUser only, fetch user if offline in an instance
            if (
                fromGetCurrentUser &&
                ctx.state !== 'online' &&
                typeof ref !== 'undefined' &&
                isRealInstance(ref.location)
            ) {
                if (this.debugFriendState) {
                    console.log(
                        `Fetching offline friend in an instance from getCurrentUser ${ctx.name}`
                    );
                }
                userRequest.getUser({
                    userId: id
                });
            }
        } else if (
            ctx.state === 'online' &&
            (stateInput === 'active' || stateInput === 'offline')
        ) {
            ctx.ref = ref;
            ctx.isVIP = isVIP;
            if (typeof ref !== 'undefined') {
                ctx.name = ref.displayName;
            }
            if (!this.friendLogInitStatus) {
                this.updateFriendDelayedCheck(ctx, location, $location_at);
                return;
            }
            // prevent status flapping
            if (ctx.pendingOffline) {
                if (this.debugFriendState) {
                    console.log(ctx.name, 'pendingOfflineAlreadyWaiting');
                }
                return;
            }
            if (this.debugFriendState) {
                console.log(ctx.name, 'pendingOfflineBegin');
            }
            ctx.pendingOffline = true;
            ctx.pendingOfflineTime = Date.now();
            // wait 2minutes then check if user came back online
            workerTimers.setTimeout(() => {
                if (!ctx.pendingOffline) {
                    if (this.debugFriendState) {
                        console.log(ctx.name, 'pendingOfflineAlreadyCancelled');
                    }
                    return;
                }
                ctx.pendingOffline = false;
                ctx.pendingOfflineTime = '';
                if (ctx.pendingState === ctx.state) {
                    if (this.debugFriendState) {
                        console.log(
                            ctx.name,
                            'pendingOfflineCancelledStateMatched'
                        );
                    }
                    return;
                }
                if (this.debugFriendState) {
                    console.log(ctx.name, 'pendingOfflineEnd');
                }
                this.updateFriendDelayedCheck(ctx, location, $location_at);
            }, this.pendingOfflineDelay);
        } else {
            ctx.ref = ref;
            ctx.isVIP = isVIP;
            if (typeof ref !== 'undefined') {
                ctx.name = ref.displayName;

                // wtf, from getCurrentUser only, fetch user if online in offline location
                if (fromGetCurrentUser && stateInput === 'online') {
                    if (this.debugFriendState) {
                        console.log(
                            `Fetching friend coming online from getCurrentUser ${ctx.name}`
                        );
                    }
                    userRequest.getUser({
                        userId: id
                    });
                    return;
                }
            }

            this.updateFriendDelayedCheck(ctx, location, $location_at);
        }
    };

    $app.methods.updateFriendDelayedCheck = async function (
        ctx,
        location,
        $location_at
    ) {
        var id = ctx.id;
        var newState = ctx.pendingState;
        if (this.debugFriendState) {
            console.log(
                `${ctx.name} updateFriendState ${ctx.state} -> ${newState}`
            );
            if (
                typeof ctx.ref !== 'undefined' &&
                location !== ctx.ref.location
            ) {
                console.log(
                    `${ctx.name} pendingOfflineLocation ${location} -> ${ctx.ref.location}`
                );
            }
        }
        if (!this.friends.has(id)) {
            console.log('Friend not found', id);
            return;
        }
        var isVIP = this.localFavoriteFriends.has(id);
        var ref = ctx.ref;
        if (ctx.state !== newState && typeof ctx.ref !== 'undefined') {
            if (
                (newState === 'offline' || newState === 'active') &&
                ctx.state === 'online'
            ) {
                ctx.ref.$online_for = '';
                ctx.ref.$offline_for = Date.now();
                ctx.ref.$active_for = '';
                if (newState === 'active') {
                    ctx.ref.$active_for = Date.now();
                }
                var ts = Date.now();
                var time = ts - $location_at;
                var worldName = await this.getWorldName(location);
                var groupName = await this.getGroupName(location);
                var feed = {
                    created_at: new Date().toJSON(),
                    type: 'Offline',
                    userId: ref.id,
                    displayName: ref.displayName,
                    location,
                    worldName,
                    groupName,
                    time
                };
                this.addFeed(feed);
                database.addOnlineOfflineToDatabase(feed);
            } else if (
                newState === 'online' &&
                (ctx.state === 'offline' || ctx.state === 'active')
            ) {
                ctx.ref.$previousLocation = '';
                ctx.ref.$travelingToTime = Date.now();
                ctx.ref.$location_at = Date.now();
                ctx.ref.$online_for = Date.now();
                ctx.ref.$offline_for = '';
                ctx.ref.$active_for = '';
                var worldName = await this.getWorldName(location);
                var groupName = await this.getGroupName(location);
                var feed = {
                    created_at: new Date().toJSON(),
                    type: 'Online',
                    userId: id,
                    displayName: ctx.name,
                    location,
                    worldName,
                    groupName,
                    time: ''
                };
                this.addFeed(feed);
                database.addOnlineOfflineToDatabase(feed);
            }
            if (newState === 'active') {
                ctx.ref.$active_for = Date.now();
            }
        }
        if (ctx.state === 'online') {
            if (ctx.isVIP) {
                $app.removeFromArray(this.vipFriends_, ctx);
            } else {
                $app.removeFromArray(this.onlineFriends_, ctx);
            }
        } else if (ctx.state === 'active') {
            $app.removeFromArray(this.activeFriends_, ctx);
        } else {
            $app.removeFromArray(this.offlineFriends_, ctx);
        }
        if (newState === 'online') {
            if (isVIP) {
                this.vipFriends_.push(ctx);
                this.sortVIPFriends = true;
            } else {
                this.onlineFriends_.push(ctx);
                this.sortOnlineFriends = true;
            }
        } else if (newState === 'active') {
            this.activeFriends_.push(ctx);
            this.sortActiveFriends = true;
        } else {
            this.offlineFriends_.push(ctx);
            this.sortOfflineFriends = true;
        }
        if (ctx.state !== newState) {
            this.updateOnlineFriendCoutner();
        }
        ctx.state = newState;
        if (ref?.displayName) {
            ctx.name = ref.displayName;
        }
        ctx.isVIP = isVIP;
    };

    $app.methods.getWorldName = async function (location) {
        var worldName = '';
        try {
            var L = parseLocation(location);
            if (L.isRealInstance && L.worldId) {
                var args = await worldRequest.getCachedWorld({
                    worldId: L.worldId
                });
                worldName = args.ref.name;
            }
        } catch (e) {
            throw e;
        }
        return worldName;
    };

    $app.methods.getGroupName = async function (data) {
        if (!data) {
            return '';
        }
        var groupName = '';
        var groupId = data;
        if (!data.startsWith('grp_')) {
            var L = parseLocation(data);
            groupId = L.groupId;
            if (!L.groupId) {
                return '';
            }
        }
        try {
            var args = await API.getCachedGroup({
                groupId
            });
            groupName = args.ref.name;
        } catch (err) {}
        return groupName;
    };

    $app.methods.updateFriendGPS = function (userId) {
        var ctx = this.friends.get(userId);
        if (ctx.isVIP) {
            this.sortVIPFriends = true;
        } else {
            this.sortOnlineFriends = true;
        }
    };

    $app.data.onlineFriendCount = 0;
    $app.methods.updateOnlineFriendCoutner = function () {
        var onlineFriendCount =
            this.vipFriends.length + this.onlineFriends.length;
        if (onlineFriendCount !== this.onlineFriendCount) {
            AppApi.ExecuteVrFeedFunction(
                'updateOnlineFriendCount',
                `${onlineFriendCount}`
            );
            this.onlineFriendCount = onlineFriendCount;
        }
    };

    // ascending
    var compareByDisplayName = function (a, b) {
        if (
            typeof a.displayName !== 'string' ||
            typeof b.displayName !== 'string'
        ) {
            return 0;
        }
        return a.displayName.localeCompare(b.displayName);
    };

    var compareByMemberCount = function (a, b) {
        if (
            typeof a.memberCount !== 'number' ||
            typeof b.memberCount !== 'number'
        ) {
            return 0;
        }
        return a.memberCount - b.memberCount;
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

    var compareByStatus = function (a, b) {
        if (typeof a.ref === 'undefined' || typeof b.ref === 'undefined') {
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
        if (a.location === 'traveling' && b.location === 'traveling') {
            return 0;
        }
        if (a.location === 'traveling') {
            return 1;
        }
        if (b.location === 'traveling') {
            return -1;
        }
        if (a.$location_at < b.$location_at) {
            return -1;
        }
        if (a.$location_at > b.$location_at) {
            return 1;
        }
        return 0;
    };

    // location at but for the sidebar
    var compareByLocation = function (a, b) {
        if (typeof a.ref === 'undefined' || typeof b.ref === 'undefined') {
            return 0;
        }
        if (a.state !== 'online' || b.state !== 'online') {
            return 0;
        }

        return a.ref.location.localeCompare(b.ref.location);
    };

    var compareByActivityField = function (a, b, field) {
        if (typeof a.ref === 'undefined' || typeof b.ref === 'undefined') {
            return 0;
        }

        // When the field is just and empty string, it means they've been
        // in whatever active state for the longest
        if (
            a.ref[field] < b.ref[field] ||
            (a.ref[field] !== '' && b.ref[field] === '')
        ) {
            return 1;
        }
        if (
            a.ref[field] > b.ref[field] ||
            (a.ref[field] === '' && b.ref[field] !== '')
        ) {
            return -1;
        }
        return 0;
    };

    // last active
    var compareByLastActive = function (a, b) {
        if (a.state === 'online' && b.state === 'online') {
            if (
                a.ref?.$online_for &&
                b.ref?.$online_for &&
                a.ref.$online_for === b.ref.$online_for
            ) {
                compareByActivityField(a, b, 'last_login');
            }
            return compareByActivityField(a, b, '$online_for');
        }

        return compareByActivityField(a, b, 'last_activity');
    };

    // last seen
    var compareByLastSeen = function (a, b) {
        return compareByActivityField(a, b, '$lastSeen');
    };

    var getFriendsSortFunction = function (sortMethods) {
        const sorts = [];
        for (const sortMethod of sortMethods) {
            switch (sortMethod) {
                case 'Sort Alphabetically':
                    sorts.push($utils.compareByName);
                    break;
                case 'Sort Private to Bottom':
                    sorts.push(compareByPrivate);
                    break;
                case 'Sort by Status':
                    sorts.push(compareByStatus);
                    break;
                case 'Sort by Last Active':
                    sorts.push(compareByLastActive);
                    break;
                case 'Sort by Last Seen':
                    sorts.push(compareByLastSeen);
                    break;
                case 'Sort by Time in Instance':
                    sorts.push((a, b) => {
                        if (
                            typeof a.ref === 'undefined' ||
                            typeof b.ref === 'undefined'
                        ) {
                            return 0;
                        }
                        if (a.state !== 'online' || b.state !== 'online') {
                            return 0;
                        }

                        return compareByLocationAt(b.ref, a.ref);
                    });
                    break;
                case 'Sort by Location':
                    sorts.push(compareByLocation);
                    break;
                case 'None':
                    sorts.push(() => 0);
                    break;
            }
        }

        return (a, b) => {
            let res;
            for (const sort of sorts) {
                res = sort(a, b);
                if (res !== 0) {
                    return res;
                }
            }
            return res;
        };
    };

    // VIP friends
    $app.computed.vipFriends = function () {
        if (!this.sortVIPFriends) {
            return this.vipFriends_;
        }
        this.sortVIPFriends = false;

        this.vipFriends_.sort(getFriendsSortFunction(this.sidebarSortMethods));
        return this.vipFriends_;
    };

    // Online friends
    $app.computed.onlineFriends = function () {
        if (!this.sortOnlineFriends) {
            return this.onlineFriends_;
        }
        this.sortOnlineFriends = false;

        this.onlineFriends_.sort(
            getFriendsSortFunction(this.sidebarSortMethods)
        );

        return this.onlineFriends_;
    };

    // Active friends
    $app.computed.activeFriends = function () {
        if (!this.sortActiveFriends) {
            return this.activeFriends_;
        }
        this.sortActiveFriends = false;

        this.activeFriends_.sort(
            getFriendsSortFunction(this.sidebarSortMethods)
        );

        return this.activeFriends_;
    };

    // Offline friends
    $app.computed.offlineFriends = function () {
        if (!this.sortOfflineFriends) {
            return this.offlineFriends_;
        }
        this.sortOfflineFriends = false;

        this.offlineFriends_.sort(
            getFriendsSortFunction(this.sidebarSortMethods)
        );

        return this.offlineFriends_;
    };

    $app.methods.userStatusClass = function (user, pendingOffline) {
        var style = {};
        if (typeof user === 'undefined') {
            return style;
        }
        var id = '';
        if (user.id) {
            id = user.id;
        } else if (user.userId) {
            id = user.userId;
        }
        if (id === API.currentUser.id) {
            return this.statusClass(user.status);
        }
        if (!user.isFriend) {
            return style;
        }
        if (pendingOffline) {
            // Pending offline
            style.offline = true;
        } else if (
            user.status !== 'active' &&
            user.location === 'private' &&
            user.state === '' &&
            id &&
            !API.currentUser.onlineFriends.includes(id)
        ) {
            // temp fix
            if (API.currentUser.activeFriends.includes(id)) {
                // Active
                style.active = true;
            } else {
                // Offline
                style.offline = true;
            }
        } else if (user.state === 'active') {
            // Active
            style.active = true;
        } else if (user.location === 'offline') {
            // Offline
            style.offline = true;
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
        if (
            user.platform &&
            user.platform !== 'standalonewindows' &&
            user.platform !== 'web'
        ) {
            style.mobile = true;
        }
        if (
            user.last_platform &&
            user.last_platform !== 'standalonewindows' &&
            user.platform === 'web'
        ) {
            style.mobile = true;
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
                    friendRequest.deleteFriend({
                        userId: id
                    });
                }
            }
        });
    };

    // #endregion
    // #region | App: Quick Search

    $app.data.quickSearchItems = [];

    // Making a persistent comparer increases perf by like 10x lmao
    $app.data._stringComparer = undefined;
    $app.computed.stringComparer = function () {
        if (typeof this._stringComparer === 'undefined') {
            this._stringComparer = Intl.Collator(
                this.appLanguage.replace('_', '-'),
                { usage: 'search', sensitivity: 'base' }
            );
        }
        return this._stringComparer;
    };

    $app.methods.quickSearchRemoteMethod = function (query) {
        if (!query) {
            this.quickSearchItems = this.quickSearchUserHistory();
            return;
        }

        const results = [];
        const cleanQuery = removeWhitespace(query);

        for (let ctx of this.friends.values()) {
            if (typeof ctx.ref === 'undefined') {
                continue;
            }

            const cleanName = removeConfusables(ctx.name);
            let match = $utils.localeIncludes(
                cleanName,
                cleanQuery,
                this.stringComparer
            );
            if (!match) {
                // Also check regular name in case search is with special characters
                match = $utils.localeIncludes(
                    ctx.name,
                    cleanQuery,
                    this.stringComparer
                );
            }
            // Use query with whitespace for notes and memos as people are more
            // likely to include spaces in memos and notes
            if (!match && ctx.memo) {
                match = $utils.localeIncludes(
                    ctx.memo,
                    query,
                    this.stringComparer
                );
            }
            if (!match && ctx.ref.note) {
                match = $utils.localeIncludes(
                    ctx.ref.note,
                    query,
                    this.stringComparer
                );
            }

            if (match) {
                results.push({
                    value: ctx.id,
                    label: ctx.name,
                    ref: ctx.ref,
                    name: ctx.name
                });
            }
        }

        results.sort(function (a, b) {
            var A =
                $app.stringComparer.compare(
                    a.name.substring(0, cleanQuery.length),
                    cleanQuery
                ) === 0;
            var B =
                $app.stringComparer.compare(
                    b.name.substring(0, cleanQuery.length),
                    cleanQuery
                ) === 0;
            if (A && !B) {
                return -1;
            } else if (B && !A) {
                return 1;
            }
            return $utils.compareByName(a, b);
        });
        if (results.length > 4) {
            results.length = 4;
        }
        results.push({
            value: `search:${query}`,
            label: query
        });

        this.quickSearchItems = results;
    };

    $app.methods.quickSearchChange = function (value) {
        if (value) {
            if (value.startsWith('search:')) {
                const searchText = value.substr(7);
                if (this.quickSearchItems.length > 1 && searchText.length) {
                    this.friendsListSearch = searchText;
                    this.menuActiveIndex = 'friendList';
                } else {
                    this.menuActiveIndex = 'search';
                    this.searchText = searchText;
                    this.lookupUser({ displayName: searchText });
                }
            } else {
                this.showUserDialog(value);
            }
        }
    };

    // #endregion
    // #region | App: Quick Search User History

    $app.data.showUserDialogHistory = new Set();

    $app.methods.quickSearchUserHistory = function () {
        var userHistory = Array.from(this.showUserDialogHistory.values())
            .reverse()
            .slice(0, 5);
        var results = [];
        userHistory.forEach((userId) => {
            var ref = API.cachedUsers.get(userId);
            if (typeof ref !== 'undefined') {
                results.push({
                    value: ref.id,
                    label: ref.name,
                    ref
                });
            }
        });
        return results;
    };

    // #endregion
    // #region | App: Feed

    $app.data.tablePageSize = await configRepository.getInt(
        'VRCX_tablePageSize',
        15
    );

    $app.data.gameLogTable.pageSize = $app.data.tablePageSize;
    $app.data.feedTable.pageSize = $app.data.tablePageSize;

    $app.data.dontLogMeOut = false;

    API.$on('LOGIN', async function (args) {
        // early loading indicator
        this.isRefreshFriendsLoading = true;
        $app.feedTable.loading = true;

        $app.friendLog = new Map();
        $app.feedTable.data = [];
        $app.feedSessionTable = [];
        $app.friendLogInitStatus = false;
        $app.notificationInitStatus = false;
        await database.initUserTables(args.json.id);
        $app.menuActiveIndex = 'feed';
        await $app.updateDatabaseVersion();
        // eslint-disable-next-line require-atomic-updates
        $app.gameLogTable.data = await database.lookupGameLogDatabase(
            $app.gameLogTable.search,
            $app.gameLogTable.filter
        );
        // eslint-disable-next-line require-atomic-updates
        $app.feedSessionTable = await database.getFeedDatabase();
        await $app.feedTableLookup();
        // eslint-disable-next-line require-atomic-updates
        $app.notificationTable.data = await database.getNotifications();
        this.refreshNotifications();
        $app.loadCurrentUserGroups(args.json.id, args.json?.presence?.groups);
        try {
            if (
                await configRepository.getBool(`friendLogInit_${args.json.id}`)
            ) {
                await $app.getFriendLog(args.ref);
            } else {
                await $app.initFriendLog(args.ref);
            }
        } catch (err) {
            if (!$app.dontLogMeOut) {
                $app.$message({
                    message: $t('message.friend.load_failed'),
                    type: 'error'
                });
                this.logout();
                throw err;
            }
        }
        await $app.getAvatarHistory();
        await $app.getAllUserMemos();
        userNotes.init();
        if ($app.randomUserColours) {
            $app.getNameColour(this.currentUser.id).then((colour) => {
                this.currentUser.$userColour = colour;
            });
            await $app.userColourInit();
        }
        await $app.getAllUserStats();
        $app.sortVIPFriends = true;
        $app.sortOnlineFriends = true;
        $app.sortActiveFriends = true;
        $app.sortOfflineFriends = true;
        this.getAuth();
        $app.updateSharedFeed(true);
        if ($app.isGameRunning) {
            $app.loadPlayerList();
        }
        $app.vrInit();
        // remove old data from json file and migrate to SQLite
        if (await VRCXStorage.Get(`${args.json.id}_friendLogUpdatedAt`)) {
            VRCXStorage.Remove(`${args.json.id}_feedTable`);
            $app.migrateMemos();
            $app.migrateFriendLog(args.json.id);
        }
        await AppApi.IPCAnnounceStart();
    });

    $app.methods.loadPlayerList = function () {
        var data = this.gameLogSessionTable;
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
                        joinTime: Date.parse(ctx.created_at),
                        lastAvatar: ''
                    };
                    this.lastLocation.playerList.set(ctx.userId, userMap);
                    if (this.friends.has(ctx.userId)) {
                        this.lastLocation.friendList.set(ctx.userId, userMap);
                    }
                }
                if (ctx.type === 'OnPlayerLeft') {
                    this.lastLocation.playerList.delete(ctx.userId);
                    this.lastLocation.friendList.delete(ctx.userId);
                }
            }
            this.lastLocation.playerList.forEach((ref1) => {
                if (
                    ref1.userId &&
                    typeof ref1.userId === 'string' &&
                    !API.cachedUsers.has(ref1.userId)
                ) {
                    userRequest.getUser({ userId: ref1.userId });
                }
            });

            this.updateCurrentUserLocation();
            this.updateCurrentInstanceWorld();
            this.updateVRLastLocation();
            this.getCurrentInstanceUserList();
            this.applyUserDialogLocation();
            this.applyWorldDialogInstances();
            this.applyGroupDialogInstances();
        }
    };

    $app.data.instancePlayerCount = new Map();
    $app.data.robotUrl = `${API.endpointDomain}/file/file_0e8c4e32-7444-44ea-ade4-313c010d4bae/1/file`;

    API.$on('USER:UPDATE', async function (args) {
        var { ref, props } = args;
        var friend = $app.friends.get(ref.id);
        if (typeof friend === 'undefined') {
            return;
        }
        if (props.location) {
            // update instancePlayerCount
            var previousLocation = props.location[1];
            var newLocation = props.location[0];
            var oldCount = $app.instancePlayerCount.get(previousLocation);
            if (typeof oldCount !== 'undefined') {
                oldCount--;
                if (oldCount <= 0) {
                    $app.instancePlayerCount.delete(previousLocation);
                } else {
                    $app.instancePlayerCount.set(previousLocation, oldCount);
                }
            }
            var newCount = $app.instancePlayerCount.get(newLocation);
            if (typeof newCount === 'undefined') {
                newCount = 0;
            }
            newCount++;
            $app.instancePlayerCount.set(newLocation, newCount);
        }
        if (props.location && ref.id === $app.userDialog.id) {
            // update user dialog instance occupants
            $app.applyUserDialogLocation(true);
        }
        if (props.location && ref.$location.worldId === $app.worldDialog.id) {
            $app.applyWorldDialogInstances();
        }
        if (props.location && ref.$location.groupId === $app.groupDialog.id) {
            $app.applyGroupDialogInstances();
        }
        if (
            !props.state &&
            props.location &&
            props.location[0] !== 'offline' &&
            props.location[0] !== '' &&
            props.location[1] !== 'offline' &&
            props.location[1] !== '' &&
            props.location[0] !== 'traveling'
        ) {
            // skip GPS if user is offline or traveling
            var previousLocation = props.location[1];
            var newLocation = props.location[0];
            var time = props.location[2];
            if (previousLocation === 'traveling' && ref.$previousLocation) {
                previousLocation = ref.$previousLocation;
                var travelTime = Date.now() - ref.$travelingToTime;
                time -= travelTime;
                if (time < 0) {
                    time = 0;
                }
            }
            if ($app.debugFriendState && previousLocation) {
                console.log(
                    `${ref.displayName} GPS ${previousLocation} -> ${newLocation}`
                );
            }
            if (previousLocation === 'offline') {
                previousLocation = '';
            }
            if (!previousLocation) {
                // no previous location
                if ($app.debugFriendState) {
                    console.log(
                        ref.displayName,
                        'Ignoring GPS, no previous location',
                        newLocation
                    );
                }
            } else if (ref.$previousLocation === newLocation) {
                // location traveled to is the same
                ref.$location_at = Date.now() - time;
            } else {
                var worldName = await $app.getWorldName(newLocation);
                var groupName = await $app.getGroupName(newLocation);
                var feed = {
                    created_at: new Date().toJSON(),
                    type: 'GPS',
                    userId: ref.id,
                    displayName: ref.displayName,
                    location: newLocation,
                    worldName,
                    groupName,
                    previousLocation,
                    time
                };
                $app.addFeed(feed);
                database.addGPSToDatabase(feed);
                $app.updateFriendGPS(ref.id);
                // clear previousLocation after GPS
                ref.$previousLocation = '';
                ref.$travelingToTime = Date.now();
            }
        }
        if (
            props.location &&
            props.location[0] === 'traveling' &&
            props.location[1] !== 'traveling'
        ) {
            // store previous location when user is traveling
            ref.$previousLocation = props.location[1];
            ref.$travelingToTime = Date.now();
            $app.updateFriendGPS(ref.id);
        }
        var imageMatches = false;
        if (
            props.currentAvatarThumbnailImageUrl &&
            props.currentAvatarThumbnailImageUrl[0] &&
            props.currentAvatarThumbnailImageUrl[1] &&
            props.currentAvatarThumbnailImageUrl[0] ===
                props.currentAvatarThumbnailImageUrl[1]
        ) {
            imageMatches = true;
        }
        if (
            (((props.currentAvatarImageUrl ||
                props.currentAvatarThumbnailImageUrl) &&
                !ref.profilePicOverride) ||
                props.currentAvatarTags) &&
            !imageMatches
        ) {
            var currentAvatarImageUrl = '';
            var previousCurrentAvatarImageUrl = '';
            var currentAvatarThumbnailImageUrl = '';
            var previousCurrentAvatarThumbnailImageUrl = '';
            var currentAvatarTags = '';
            var previousCurrentAvatarTags = '';
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
            if (props.currentAvatarTags) {
                currentAvatarTags = props.currentAvatarTags[0];
                previousCurrentAvatarTags = props.currentAvatarTags[1];
                if (
                    ref.profilePicOverride &&
                    !props.currentAvatarThumbnailImageUrl
                ) {
                    // forget last seen avatar
                    ref.currentAvatarImageUrl = '';
                    ref.currentAvatarThumbnailImageUrl = '';
                }
            } else {
                currentAvatarTags = ref.currentAvatarTags;
                previousCurrentAvatarTags = ref.currentAvatarTags;
            }
            if (this.logEmptyAvatars || ref.currentAvatarImageUrl) {
                var avatarInfo = {
                    ownerId: '',
                    avatarName: ''
                };
                try {
                    avatarInfo = await $app.getAvatarName(
                        currentAvatarImageUrl
                    );
                } catch (err) {}
                var previousAvatarInfo = {
                    ownerId: '',
                    avatarName: ''
                };
                try {
                    previousAvatarInfo = await $app.getAvatarName(
                        previousCurrentAvatarImageUrl
                    );
                } catch (err) {}
                var feed = {
                    created_at: new Date().toJSON(),
                    type: 'Avatar',
                    userId: ref.id,
                    displayName: ref.displayName,
                    ownerId: avatarInfo.ownerId,
                    previousOwnerId: previousAvatarInfo.ownerId,
                    avatarName: avatarInfo.avatarName,
                    previousAvatarName: previousAvatarInfo.avatarName,
                    currentAvatarImageUrl,
                    currentAvatarThumbnailImageUrl,
                    previousCurrentAvatarImageUrl,
                    previousCurrentAvatarThumbnailImageUrl,
                    currentAvatarTags,
                    previousCurrentAvatarTags
                };
                $app.addFeed(feed);
                database.addAvatarToDatabase(feed);
            }
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
        if (props.bio && props.bio[0] && props.bio[1]) {
            var bio = '';
            var previousBio = '';
            if (props.bio[0]) {
                bio = props.bio[0];
            }
            if (props.bio[1]) {
                previousBio = props.bio[1];
            }
            var feed = {
                created_at: new Date().toJSON(),
                type: 'Bio',
                userId: ref.id,
                displayName: ref.displayName,
                bio,
                previousBio
            };
            $app.addFeed(feed);
            database.addBioToDatabase(feed);
        }
    });

    /**
     * Function that prepare the Longest Common Subsequence (LCS) scores matrix
     * @param {*} s1 String 1
     * @param {*} s2 String 2
     * @returns
     */
    $app.methods.lcsMatrix = function (s1, s2) {
        const m = s1.length;
        const n = s2.length;
        const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

        // Fill the matrix for LCS
        for (let i = 1; i <= m; i++) {
            for (let j = 1; j <= n; j++) {
                if (s1[i - 1] === s2[j - 1]) {
                    dp[i][j] = dp[i - 1][j - 1] + 1;
                } else {
                    dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
                }
            }
        }

        return dp;
    };

    /**
     * Function to find the longest common subsequence between two strings
     * @param {string} str1
     * @param {string} str2
     * @returns {number[][]} A matrix that contains the longest common subsequence between both strings
     */
    $app.methods.longestCommonSubsequence = function longestCommonSubsequence(
        str1,
        str2
    ) {
        let lcs = [];
        for (let i = 0; i <= str1.length; i++) {
            lcs.push(new Array(str2.length + 1).fill(0));
        }
        for (let i = str1.length - 1; i >= 0; i--) {
            for (let j = str2.length - 1; j >= 0; j--) {
                if (str1[i] == str2[j]) {
                    lcs[i][j] = lcs[i + 1][j + 1] + 1;
                } else {
                    lcs[i][j] = Math.max(lcs[i + 1][j], lcs[i][j + 1]);
                }
            }
        }
        return lcs;
    };

    /**
     * Merge differences in both strings to get the longest common subsequence
     * @param {{text: string, type: "add" | "remove" | "same"}[]} res
     * @returns {{text: string, type: "add" | "remove" | "same"}[]} An array that contains the differences between both strings
     */
    $app.methods.regoupDifferences = function regoupDifferences(res) {
        let regrouped = [];
        let text = '';
        let type = '';
        for (let i = 0; i < res.length; i++) {
            if (i == 0) {
                text = res[i].text;
                type = res[i].type;
            } else if (res[i].type == type) {
                text += res[i].text;
            } else {
                regrouped.push({ text: text, type: type });
                text = res[i].text;
                type = res[i].type;
            }
        }
        regrouped.push({ text: text, type: type });
        return regrouped;
    };

    // #endregion
    // #region | App: gameLog

    $app.data.lastLocation = {
        date: 0,
        location: '',
        name: '',
        playerList: new Map(),
        friendList: new Map()
    };

    $app.methods.lastLocationReset = function (gameLogDate) {
        var dateTime = gameLogDate;
        if (!gameLogDate) {
            dateTime = new Date().toJSON();
        }
        var dateTimeStamp = Date.parse(dateTime);
        this.photonLobby = new Map();
        this.photonLobbyCurrent = new Map();
        this.photonLobbyMaster = 0;
        this.photonLobbyCurrentUser = 0;
        this.photonLobbyUserData = new Map();
        this.photonLobbyWatcherLoopStop();
        this.photonLobbyAvatars = new Map();
        this.photonLobbyLastModeration = new Map();
        this.photonLobbyJointime = new Map();
        this.photonLobbyActivePortals = new Map();
        this.photonEvent7List = new Map();
        this.photonLastEvent7List = '';
        this.photonLastChatBoxMsg = new Map();
        this.moderationEventQueue = new Map();
        if (this.photonEventTable.data.length > 0) {
            this.photonEventTablePrevious.data = this.photonEventTable.data;
            this.photonEventTable.data = [];
        }
        var playerList = Array.from(this.lastLocation.playerList.values());
        var dataBaseEntries = [];
        for (var ref of playerList) {
            var entry = {
                created_at: dateTime,
                type: 'OnPlayerLeft',
                displayName: ref.displayName,
                location: this.lastLocation.location,
                userId: ref.userId,
                time: dateTimeStamp - ref.joinTime
            };
            dataBaseEntries.unshift(entry);
            this.addGameLog(entry);
        }
        database.addGamelogJoinLeaveBulk(dataBaseEntries);
        if (this.lastLocation.date !== 0) {
            var update = {
                time: dateTimeStamp - this.lastLocation.date,
                created_at: new Date(this.lastLocation.date).toJSON()
            };
            database.updateGamelogLocationTimeToDatabase(update);
        }
        this.lastLocationDestination = '';
        this.lastLocationDestinationTime = 0;
        this.lastLocation = {
            date: 0,
            location: '',
            name: '',
            playerList: new Map(),
            friendList: new Map()
        };
        this.updateCurrentUserLocation();
        this.updateCurrentInstanceWorld();
        this.updateVRLastLocation();
        this.getCurrentInstanceUserList();
        this.lastVideoUrl = '';
        this.lastResourceloadUrl = '';
        this.applyUserDialogLocation();
        this.applyWorldDialogInstances();
        this.applyGroupDialogInstances();
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

    $app.data.lastLocationDestination = '';
    $app.data.lastLocationDestinationTime = 0;

    // It's like he's going to be used somewhere, and commenting it out would be an error or something.
    $app.methods.silentSearchUser = function (displayName) {
        console.log('Searching for userId for:', displayName);
        var params = {
            n: 5,
            offset: 0,
            fuzzy: false,
            search: displayName
        };
        userRequest.getUsers(params).then((args) => {
            var map = new Map();
            var nameFound = false;
            for (var json of args.json) {
                var ref = API.cachedUsers.get(json.id);
                if (typeof ref !== 'undefined') {
                    map.set(ref.id, ref);
                }
                if (json.displayName === displayName) {
                    nameFound = true;
                }
            }
            if (!nameFound) {
                console.error('userId not found for', displayName);
            }
            return args;
        });
    };

    $app.methods.lookupYouTubeVideo = async function (videoId) {
        var data = null;
        var apiKey = 'AIzaSyA-iUQCpWf5afEL3NanEOSxbzziPMU3bxY';
        if (this.youTubeApiKey) {
            apiKey = this.youTubeApiKey;
        }
        try {
            var response = await webApiService.execute({
                url: `https://www.googleapis.com/youtube/v3/videos?id=${encodeURIComponent(
                    videoId
                )}&part=snippet,contentDetails&key=${apiKey}`,
                method: 'GET',
                headers: {
                    Referer: 'https://vrcx.app'
                }
            });
            var json = JSON.parse(response.data);
            if (this.debugWebRequests) {
                console.log(json, response);
            }
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
        offset: 0,
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
            offset: 0,
            elapsed: 0,
            percentage: 0,
            remainingText: '',
            playing: false
        };
        this.updateVrNowPlaying();
    };

    $app.methods.setNowPlaying = function (ctx) {
        if (this.nowPlaying.url !== ctx.videoUrl) {
            if (!ctx.userId && ctx.displayName) {
                for (var ref of API.cachedUsers.values()) {
                    if (ref.displayName === ctx.displayName) {
                        ctx.userId = ref.id;
                        break;
                    }
                }
            }
            this.queueGameLogNoty(ctx);
            this.addGameLog(ctx);
            database.addGamelogVideoPlayToDatabase(ctx);

            var displayName = '';
            if (ctx.displayName) {
                displayName = ` (${ctx.displayName})`;
            }
            var name = `${ctx.videoName}${displayName}`;
            this.nowPlaying = {
                url: ctx.videoUrl,
                name,
                length: ctx.videoLength,
                startTime: Date.parse(ctx.created_at) / 1000,
                offset: ctx.videoPos,
                elapsed: 0,
                percentage: 0,
                remainingText: ''
            };
        } else {
            this.nowPlaying = {
                ...this.nowPlaying,
                length: ctx.videoLength,
                startTime: Date.parse(ctx.created_at) / 1000,
                offset: ctx.videoPos,
                elapsed: 0,
                percentage: 0,
                remainingText: ''
            };
        }
        this.updateVrNowPlaying();
        if (!this.nowPlaying.playing && ctx.videoLength > 0) {
            this.nowPlaying.playing = true;
            this.updateNowPlaying();
        }
    };

    $app.methods.updateNowPlaying = function () {
        var np = this.nowPlaying;
        if (!this.nowPlaying.playing) {
            return;
        }
        var now = Date.now() / 1000;
        np.elapsed = Math.round((now - np.startTime + np.offset) * 10) / 10;
        if (np.elapsed >= np.length) {
            this.clearNowPlaying();
            return;
        }
        np.remainingText = this.formatSeconds(np.length - np.elapsed);
        np.percentage = Math.round(((np.elapsed * 100) / np.length) * 10) / 10;
        this.updateVrNowPlaying();
        workerTimers.setTimeout(() => this.updateNowPlaying(), 1000);
    };

    $app.methods.updateVrNowPlaying = function () {
        var json = JSON.stringify(this.nowPlaying);
        AppApi.ExecuteVrFeedFunction('nowPlayingUpdate', json);
        AppApi.ExecuteVrOverlayFunction('nowPlayingUpdate', json);
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

    $app.data.instanceTypes = [
        'invite',
        'invite+',
        'friends',
        'friends+',
        'public',
        'groupPublic',
        'groupPlus',
        'groupOnly'
    ];

    $app.methods.updateAutoStateChange = function () {
        if (
            !this.autoStateChangeEnabled ||
            !this.isGameRunning ||
            !this.lastLocation.playerList.size ||
            this.lastLocation.location === '' ||
            this.lastLocation.location === 'traveling'
        ) {
            return;
        }

        var $location = parseLocation(this.lastLocation.location);
        var instanceType = $location.accessType;
        if (instanceType === 'group') {
            if ($location.groupAccessType === 'members') {
                instanceType = 'groupOnly';
            } else if ($location.groupAccessType === 'plus') {
                instanceType = 'groupPlus';
            } else {
                instanceType = 'groupPublic';
            }
        }
        if (
            this.autoStateChangeInstanceTypes.length > 0 &&
            !this.autoStateChangeInstanceTypes.includes(instanceType)
        ) {
            return;
        }

        var withCompany = this.lastLocation.playerList.size > 1;
        if (this.autoStateChangeNoFriends) {
            withCompany = this.lastLocation.friendList.size >= 1;
        }

        var currentStatus = API.currentUser.status;
        var newStatus = withCompany
            ? this.autoStateChangeCompanyStatus
            : this.autoStateChangeAloneStatus;

        if (currentStatus === newStatus) {
            return;
        }

        userRequest
            .saveCurrentUser({
                status: newStatus
            })
            .then(() => {
                var text = `Status automaticly changed to ${newStatus}`;
                if (this.errorNoty) {
                    this.errorNoty.close();
                }
                this.errorNoty = new Noty({
                    type: 'info',
                    text
                }).show();
                console.log(text);
            });
    };

    $app.methods.lookupUser = async function (ref) {
        if (ref.userId) {
            this.showUserDialog(ref.userId);
            return;
        }
        if (!ref.displayName || ref.displayName.substring(0, 3) === 'ID:') {
            return;
        }
        for (var ctx of API.cachedUsers.values()) {
            if (ctx.displayName === ref.displayName) {
                this.showUserDialog(ctx.id);
                return;
            }
        }
        this.searchText = ref.displayName;
        await this.searchUserByDisplayName(ref.displayName);
        for (var ctx of this.searchUserResults) {
            if (ctx.displayName === ref.displayName) {
                this.searchText = '';
                this.clearSearch();
                this.showUserDialog(ctx.id);
                return;
            }
        }
        // this.$refs.searchTab.currentName = '0';
        // this.menuActiveIndex = 'search';
    };

    // #endregion
    // #region | App: Search

    $app.data.searchText = '';
    $app.data.searchUserResults = [];

    API.$on('LOGIN', function () {
        $app.searchText = '';
        $app.searchUserResults = [];
    });

    $app.methods.clearSearch = function () {
        this.searchText = '';
        this.searchUserResults = [];
    };

    $app.methods.searchUserByDisplayName = async function (displayName) {
        const params = {
            n: 10,
            offset: 0,
            fuzzy: false,
            search: displayName
        };
        await this.moreSearchUser(null, params);
    };

    $app.methods.moreSearchUser = async function (go, params) {
        // var params = this.searchUserParams;
        if (go) {
            params.offset += params.n * go;
            if (params.offset < 0) {
                params.offset = 0;
            }
        }
        this.isSearchUserLoading = true;
        await userRequest
            .getUsers(params)
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

    // #endregion
    // #region | App: Favorite

    $app.data.favoriteObjects = new Map();
    $app.data.favoriteFriends_ = [];
    $app.data.favoriteFriendsSorted = [];
    $app.data.favoriteWorlds_ = [];
    $app.data.favoriteWorldsSorted = [];
    $app.data.favoriteAvatars_ = [];
    $app.data.favoriteAvatarsSorted = [];
    $app.data.sortFavoriteFriends = false;
    $app.data.sortFavoriteWorlds = false;
    $app.data.sortFavoriteAvatars = false;

    API.$on('LOGIN', function () {
        $app.favoriteObjects.clear();
        $app.favoriteFriends_ = [];
        $app.favoriteFriendsSorted = [];
        $app.favoriteWorlds_ = [];
        $app.favoriteWorldsSorted = [];
        $app.favoriteAvatars_ = [];
        $app.favoriteAvatarsSorted = [];
        $app.sortFavoriteFriends = false;
        $app.sortFavoriteWorlds = false;
        $app.sortFavoriteAvatars = false;
    });

    API.$on('FAVORITE', function (args) {
        $app.applyFavorite(args.ref.type, args.ref.favoriteId, args.sortTop);
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

    $app.methods.applyFavorite = async function (type, objectId, sortTop) {
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
                    name: '',
                    $selected: false
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
                        $app.removeFromArray(this.favoriteFriends_, ctx);
                        $app.removeFromArray(this.favoriteFriendsSorted, ctx);
                    } else if (type === 'world') {
                        $app.removeFromArray(this.favoriteWorlds_, ctx);
                        $app.removeFromArray(this.favoriteWorldsSorted, ctx);
                    } else if (type === 'avatar') {
                        $app.removeFromArray(this.favoriteAvatars_, ctx);
                        $app.removeFromArray(this.favoriteAvatarsSorted, ctx);
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
                    // else too bad
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
                    } else {
                        // try fetch from local world favorites
                        var world = await database.getCachedWorldById(objectId);
                        if (world) {
                            ctx.ref = world;
                            ctx.name = world.name;
                            ctx.deleted = true;
                            this.sortFavoriteWorlds = true;
                        }
                        if (!world) {
                            // try fetch from local world history
                            var worldName =
                                await database.getGameLogWorldNameByWorldId(
                                    objectId
                                );
                            if (worldName) {
                                ctx.name = worldName;
                                ctx.deleted = true;
                                this.sortFavoriteWorlds = true;
                            }
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
                    } else {
                        // try fetch from local avatar history
                        var avatar =
                            await database.getCachedAvatarById(objectId);
                        if (avatar) {
                            ctx.ref = avatar;
                            ctx.name = avatar.name;
                            ctx.deleted = true;
                            this.sortFavoriteAvatars = true;
                        }
                    }
                }
            }
            if (isTypeChanged) {
                if (sortTop) {
                    if (type === 'friend') {
                        this.favoriteFriends_.unshift(ctx);
                        this.favoriteFriendsSorted.push(ctx);
                        this.sortFavoriteFriends = true;
                    } else if (type === 'world') {
                        this.favoriteWorlds_.unshift(ctx);
                        this.favoriteWorldsSorted.push(ctx);
                        this.sortFavoriteWorlds = true;
                    } else if (type === 'avatar') {
                        this.favoriteAvatars_.unshift(ctx);
                        this.favoriteAvatarsSorted.push(ctx);
                        this.sortFavoriteAvatars = true;
                    }
                } else if (type === 'friend') {
                    this.favoriteFriends_.push(ctx);
                    this.favoriteFriendsSorted.push(ctx);
                    this.sortFavoriteFriends = true;
                } else if (type === 'world') {
                    this.favoriteWorlds_.push(ctx);
                    this.favoriteWorldsSorted.push(ctx);
                    this.sortFavoriteWorlds = true;
                } else if (type === 'avatar') {
                    this.favoriteAvatars_.push(ctx);
                    this.favoriteAvatarsSorted.push(ctx);
                    this.sortFavoriteAvatars = true;
                }
            }
        } else if (typeof ctx !== 'undefined') {
            this.favoriteObjects.delete(objectId);
            if (type === 'friend') {
                $app.removeFromArray(this.favoriteFriends_, ctx);
                $app.removeFromArray(this.favoriteFriendsSorted, ctx);
            } else if (type === 'world') {
                $app.removeFromArray(this.favoriteWorlds_, ctx);
                $app.removeFromArray(this.favoriteWorldsSorted, ctx);
            } else if (type === 'avatar') {
                $app.removeFromArray(this.favoriteAvatars_, ctx);
                $app.removeFromArray(this.favoriteAvatarsSorted, ctx);
            }
        }
    };

    $app.methods.deleteFavoriteNoConfirm = function (objectId) {
        if (!objectId) {
            return;
        }
        this.favoriteDialog.visible = true;
        favoriteRequest
            .deleteFavorite({
                objectId
            })
            .then(() => {
                this.favoriteDialog.visible = false;
            })
            .finally(() => {
                this.favoriteDialog.loading = false;
            });
    };

    $app.computed.favoriteFriends = function () {
        if (this.sortFavoriteFriends) {
            this.sortFavoriteFriends = false;
            this.favoriteFriendsSorted.sort($utils.compareByName);
        }
        if (this.sortFavorites) {
            return this.favoriteFriends_;
        }
        return this.favoriteFriendsSorted;
    };

    $app.computed.groupedByGroupKeyFavoriteFriends = function () {
        const groupedByGroupKeyFavoriteFriends = {};

        this.favoriteFriends.forEach((friend) => {
            if (friend.groupKey) {
                if (!groupedByGroupKeyFavoriteFriends[friend.groupKey]) {
                    groupedByGroupKeyFavoriteFriends[friend.groupKey] = [];
                }
                groupedByGroupKeyFavoriteFriends[friend.groupKey].push(friend);
            }
        });

        return groupedByGroupKeyFavoriteFriends;
    };

    $app.computed.favoriteWorlds = function () {
        if (this.sortFavoriteWorlds) {
            this.sortFavoriteWorlds = false;
            this.favoriteWorldsSorted.sort($utils.compareByName);
        }
        if (this.sortFavorites) {
            return this.favoriteWorlds_;
        }
        return this.favoriteWorldsSorted;
    };

    $app.computed.favoriteAvatars = function () {
        if (this.sortFavoriteAvatars) {
            this.sortFavoriteAvatars = false;
            this.favoriteAvatarsSorted.sort($utils.compareByName);
        }
        if (this.sortFavorites) {
            return this.favoriteAvatars_;
        }
        return this.favoriteAvatarsSorted;
    };

    // #endregion
    // #region | App: friendLog

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
            },
            {
                prop: 'type',
                value: false,
                filterFn: (row, filter) =>
                    !(filter.value && row.type === 'Unfriend')
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
        pageSize: $app.data.tablePageSize,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 15, 20, 25, 50, 100]
        }
    };

    API.$on('USER:CURRENT', function (args) {
        $app.updateFriendships(args.ref);
    });

    API.$on('USER', function (args) {
        $app.updateFriendship(args.ref);
        if (
            $app.friendLogInitStatus &&
            args.json.isFriend &&
            !$app.friendLog.has(args.ref.id) &&
            args.json.id !== this.currentUser.id
        ) {
            $app.addFriendship(args.ref.id);
        }
    });

    API.$on('FRIEND:ADD', function (args) {
        $app.addFriendship(args.params.userId);
    });

    API.$on('FRIEND:DELETE', function (args) {
        $app.deleteFriendship(args.params.userId);
    });

    $app.data.friendLogInitStatus = false;
    $app.data.notificationInitStatus = false;

    $app.methods.initFriendLog = async function (currentUser) {
        this.refreshFriends(currentUser, true);
        var sqlValues = [];
        var friends = await API.refreshFriends();
        for (var friend of friends) {
            var ref = API.applyUser(friend);
            var row = {
                userId: ref.id,
                displayName: ref.displayName,
                trustLevel: ref.$trustLevel,
                friendNumber: 0
            };
            this.friendLog.set(friend.id, row);
            sqlValues.unshift(row);
        }
        database.setFriendLogCurrentArray(sqlValues);
        await configRepository.setBool(`friendLogInit_${currentUser.id}`, true);
        this.friendLogInitStatus = true;
    };

    $app.methods.migrateFriendLog = async function (userId) {
        VRCXStorage.Remove(`${userId}_friendLogUpdatedAt`);
        VRCXStorage.Remove(`${userId}_friendLog`);
        this.friendLogTable.data = await VRCXStorage.GetArray(
            `${userId}_friendLogTable`
        );
        database.addFriendLogHistoryArray(this.friendLogTable.data);
        VRCXStorage.Remove(`${userId}_friendLogTable`);
        await configRepository.setBool(`friendLogInit_${userId}`, true);
    };

    $app.methods.getFriendLog = async function (currentUser) {
        this.friendNumber = await configRepository.getInt(
            `VRCX_friendNumber_${currentUser.id}`,
            0
        );
        var maxFriendLogNumber = await database.getMaxFriendLogNumber();
        if (this.friendNumber < maxFriendLogNumber) {
            this.friendNumber = maxFriendLogNumber;
        }

        var friendLogCurrentArray = await database.getFriendLogCurrent();
        for (var friend of friendLogCurrentArray) {
            this.friendLog.set(friend.userId, friend);
        }
        this.friendLogTable.data = [];
        this.friendLogTable.data = await database.getFriendLogHistory();
        this.refreshFriends(currentUser, true);
        await API.refreshFriends();
        await this.tryRestoreFriendNumber();
        this.friendLogInitStatus = true;

        // check for friend/name/rank change AFTER friendLogInitStatus is set
        for (var friend of friendLogCurrentArray) {
            var ref = API.cachedUsers.get(friend.userId);
            if (typeof ref !== 'undefined') {
                this.updateFriendship(ref);
            }
        }
        if (typeof currentUser.friends !== 'undefined') {
            this.updateFriendships(currentUser);
        }
    };

    $app.methods.addFriendship = function (id) {
        if (
            !this.friendLogInitStatus ||
            this.friendLog.has(id) ||
            id === API.currentUser.id
        ) {
            return;
        }
        var ref = API.cachedUsers.get(id);
        if (typeof ref === 'undefined') {
            try {
                userRequest.getUser({
                    userId: id
                });
            } catch (err) {
                console.error('Fetch user on add as friend', err);
            }
            return;
        }
        friendRequest
            .getFriendStatus({
                userId: id
            })
            .then((args) => {
                if (args.json.isFriend && !this.friendLog.has(id)) {
                    if (this.friendNumber === 0) {
                        this.friendNumber = this.friends.size;
                    }
                    ref.$friendNumber = ++this.friendNumber;
                    configRepository.setInt(
                        `VRCX_friendNumber_${API.currentUser.id}`,
                        this.friendNumber
                    );
                    this.addFriend(id, ref.state);
                    var friendLogHistory = {
                        created_at: new Date().toJSON(),
                        type: 'Friend',
                        userId: id,
                        displayName: ref.displayName,
                        friendNumber: ref.$friendNumber
                    };
                    this.friendLogTable.data.push(friendLogHistory);
                    database.addFriendLogHistory(friendLogHistory);
                    this.queueFriendLogNoty(friendLogHistory);
                    var friendLogCurrent = {
                        userId: id,
                        displayName: ref.displayName,
                        trustLevel: ref.$trustLevel,
                        friendNumber: ref.$friendNumber
                    };
                    this.friendLog.set(id, friendLogCurrent);
                    database.setFriendLogCurrent(friendLogCurrent);
                    this.notifyMenu('friendLog');
                    this.deleteFriendRequest(id);
                    this.updateSharedFeed(true);
                    userRequest
                        .getUser({
                            userId: id
                        })
                        .then(() => {
                            if (
                                this.userDialog.visible &&
                                id === this.userDialog.id
                            ) {
                                this.applyUserDialogLocation(true);
                            }
                        });
                }
            });
    };

    $app.methods.deleteFriendRequest = function (userId) {
        var array = $app.notificationTable.data;
        for (var i = array.length - 1; i >= 0; i--) {
            if (
                array[i].type === 'friendRequest' &&
                array[i].senderUserId === userId
            ) {
                array.splice(i, 1);
                return;
            }
        }
    };

    $app.methods.deleteFriendship = function (id) {
        var ctx = this.friendLog.get(id);
        if (typeof ctx === 'undefined') {
            return;
        }
        friendRequest
            .getFriendStatus({
                userId: id
            })
            .then((args) => {
                if (!args.json.isFriend && this.friendLog.has(id)) {
                    var friendLogHistory = {
                        created_at: new Date().toJSON(),
                        type: 'Unfriend',
                        userId: id,
                        displayName: ctx.displayName || id
                    };
                    this.friendLogTable.data.push(friendLogHistory);
                    database.addFriendLogHistory(friendLogHistory);
                    this.queueFriendLogNoty(friendLogHistory);
                    this.friendLog.delete(id);
                    database.deleteFriendLogCurrent(id);
                    if (!this.hideUnfriends) {
                        this.notifyMenu('friendLog');
                    }
                    this.updateSharedFeed(true);
                    this.deleteFriend(id);
                }
            });
    };

    $app.methods.updateFriendships = function (ref) {
        var set = new Set();
        for (var id of ref.friends) {
            set.add(id);
            this.addFriendship(id);
        }
        for (var id of this.friendLog.keys()) {
            if (id === API.currentUser.id) {
                this.friendLog.delete(id);
                database.deleteFriendLogCurrent(id);
            } else if (!set.has(id)) {
                this.deleteFriendship(id);
            }
        }
    };

    $app.methods.updateFriendship = function (ref) {
        var ctx = this.friendLog.get(ref.id);
        if (!this.friendLogInitStatus || typeof ctx === 'undefined') {
            return;
        }
        if (ctx.friendNumber) {
            ref.$friendNumber = ctx.friendNumber;
        }
        if (!ref.$friendNumber) {
            ref.$friendNumber = 0; // no null
        }
        if (ctx.displayName !== ref.displayName) {
            if (ctx.displayName) {
                var friendLogHistoryDisplayName = {
                    created_at: new Date().toJSON(),
                    type: 'DisplayName',
                    userId: ref.id,
                    displayName: ref.displayName,
                    previousDisplayName: ctx.displayName,
                    friendNumber: ref.$friendNumber
                };
                this.friendLogTable.data.push(friendLogHistoryDisplayName);
                database.addFriendLogHistory(friendLogHistoryDisplayName);
                this.queueFriendLogNoty(friendLogHistoryDisplayName);
                var friendLogCurrent = {
                    userId: ref.id,
                    displayName: ref.displayName,
                    trustLevel: ref.$trustLevel,
                    friendNumber: ref.$friendNumber
                };
                this.friendLog.set(ref.id, friendLogCurrent);
                database.setFriendLogCurrent(friendLogCurrent);
                ctx.displayName = ref.displayName;
                this.notifyMenu('friendLog');
                this.updateSharedFeed(true);
            }
        }
        if (
            ref.$trustLevel &&
            ctx.trustLevel &&
            ctx.trustLevel !== ref.$trustLevel
        ) {
            if (
                (ctx.trustLevel === 'Trusted User' &&
                    ref.$trustLevel === 'Veteran User') ||
                (ctx.trustLevel === 'Veteran User' &&
                    ref.$trustLevel === 'Trusted User')
            ) {
                var friendLogCurrent3 = {
                    userId: ref.id,
                    displayName: ref.displayName,
                    trustLevel: ref.$trustLevel,
                    friendNumber: ref.$friendNumber
                };
                this.friendLog.set(ref.id, friendLogCurrent3);
                database.setFriendLogCurrent(friendLogCurrent3);
                return;
            }
            var friendLogHistoryTrustLevel = {
                created_at: new Date().toJSON(),
                type: 'TrustLevel',
                userId: ref.id,
                displayName: ref.displayName,
                trustLevel: ref.$trustLevel,
                previousTrustLevel: ctx.trustLevel,
                friendNumber: ref.$friendNumber
            };
            this.friendLogTable.data.push(friendLogHistoryTrustLevel);
            database.addFriendLogHistory(friendLogHistoryTrustLevel);
            this.queueFriendLogNoty(friendLogHistoryTrustLevel);
            var friendLogCurrent2 = {
                userId: ref.id,
                displayName: ref.displayName,
                trustLevel: ref.$trustLevel,
                friendNumber: ref.$friendNumber
            };
            this.friendLog.set(ref.id, friendLogCurrent2);
            database.setFriendLogCurrent(friendLogCurrent2);
            this.notifyMenu('friendLog');
            this.updateSharedFeed(true);
        }
        ctx.trustLevel = ref.$trustLevel;
    };

    // #endregion
    // #region | App: Moderation

    $app.data.playerModerationTable = {
        data: [],
        pageSize: $app.data.tablePageSize
    };

    API.$on('LOGIN', function () {
        $app.playerModerationTable.data = [];
    });

    API.$on('PLAYER-MODERATION', function (args) {
        let { ref } = args;
        let array = $app.playerModerationTable.data;
        let { length } = array;
        for (let i = 0; i < length; ++i) {
            if (array[i].id === ref.id) {
                Vue.set(array, i, ref);
                return;
            }
        }
        $app.playerModerationTable.data.push(ref);
    });

    API.$on('PLAYER-MODERATION:@DELETE', function (args) {
        let { ref } = args;
        let array = $app.playerModerationTable.data;
        let { length } = array;
        for (let i = 0; i < length; ++i) {
            if (array[i].id === ref.id) {
                array.splice(i, 1);
                return;
            }
        }
    });

    // #endregion
    // #region | App: Notification

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
                prop: ['senderUsername', 'message'],
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
        pageSize: $app.data.tablePageSize,
        paginationProps: {
            small: true,
            layout: 'sizes,prev,pager,next,total',
            pageSizes: [10, 15, 20, 25, 50, 100]
        }
    };

    API.$on('LOGIN', function () {
        $app.notificationTable.data = [];
    });

    API.$on('PIPELINE:NOTIFICATION', function (args) {
        var ref = args.json;
        if (
            ref.type !== 'requestInvite' ||
            $app.autoAcceptInviteRequests === 'Off'
        ) {
            return;
        }

        var currentLocation = $app.lastLocation.location;
        if ($app.lastLocation.location === 'traveling') {
            currentLocation = $app.lastLocationDestination;
        }
        if (!currentLocation) {
            return;
        }
        if (
            $app.autoAcceptInviteRequests === 'All Favorites' &&
            !$app.favoriteFriends.some((x) => x.id === ref.senderUserId)
        ) {
            return;
        }
        if (
            $app.autoAcceptInviteRequests === 'Selected Favorites' &&
            !$app.localFavoriteFriends.has(ref.senderUserId)
        ) {
            return;
        }
        if (!$app.checkCanInvite(currentLocation)) {
            return;
        }

        var L = parseLocation(currentLocation);
        worldRequest
            .getCachedWorld({
                worldId: L.worldId
            })
            .then((args1) => {
                notificationRequest
                    .sendInvite(
                        {
                            instanceId: L.tag,
                            worldId: L.tag,
                            worldName: args1.ref.name,
                            rsvp: true
                        },
                        ref.senderUserId
                    )
                    .then((_args) => {
                        var text = `Auto invite sent to ${ref.senderUsername}`;
                        if (this.errorNoty) {
                            this.errorNoty.close();
                        }
                        this.errorNoty = new Noty({
                            type: 'info',
                            text
                        }).show();
                        console.log(text);
                        notificationRequest.hideNotification({
                            notificationId: ref.id
                        });
                        return _args;
                    })
                    .catch((err) => {
                        console.error(err);
                    });
            });
    });

    $app.data.unseenNotifications = [];

    API.$on('NOTIFICATION', function (args) {
        var { ref } = args;
        var array = $app.notificationTable.data;
        var { length } = array;
        for (var i = 0; i < length; ++i) {
            if (array[i].id === ref.id) {
                Vue.set(array, i, ref);
                return;
            }
        }
        if (ref.senderUserId !== this.currentUser.id) {
            if (
                ref.type !== 'friendRequest' &&
                ref.type !== 'ignoredFriendRequest' &&
                !ref.type.includes('.')
            ) {
                database.addNotificationToDatabase(ref);
            }
            if ($app.friendLogInitStatus && $app.notificationInitStatus) {
                if (
                    $app.notificationTable.filters[0].value.length === 0 ||
                    $app.notificationTable.filters[0].value.includes(ref.type)
                ) {
                    $app.notifyMenu('notification');
                }
                $app.unseenNotifications.push(ref.id);
                $app.queueNotificationNoty(ref);
            }
        }
        $app.notificationTable.data.push(ref);
        $app.updateSharedFeed(true);
    });

    API.$on('NOTIFICATION:SEE', function (args) {
        var { notificationId } = args.params;
        $app.removeFromArray($app.unseenNotifications, notificationId);
        if ($app.unseenNotifications.length === 0) {
            const item = $app.$refs.menu.$children[0]?.items['notification'];
            if (item) {
                item.$el.classList.remove('notify');
            }
        }
    });

    $app.data.feedTable.filter = JSON.parse(
        await configRepository.getString('VRCX_feedTableFilters', '[]')
    );
    $app.data.feedTable.vip = await configRepository.getBool(
        'VRCX_feedTableVIPFilter',
        false
    );
    $app.data.gameLogTable.vip = false;
    // gameLog loads before favorites
    // await configRepository.getBool(
    //     'VRCX_gameLogTableVIPFilter',
    //     false
    // );
    $app.data.gameLogTable.filter = JSON.parse(
        await configRepository.getString('VRCX_gameLogTableFilters', '[]')
    );
    $app.data.friendLogTable.filters[0].value = JSON.parse(
        await configRepository.getString('VRCX_friendLogTableFilters', '[]')
    );
    $app.data.notificationTable.filters[0].value = JSON.parse(
        await configRepository.getString('VRCX_notificationTableFilters', '[]')
    );
    $app.data.photonEventTableTypeFilter = JSON.parse(
        await configRepository.getString('VRCX_photonEventTypeFilter', '[]')
    );
    $app.data.photonEventTable.filters[1].value =
        $app.data.photonEventTableTypeFilter;
    $app.data.photonEventTablePrevious.filters[1].value =
        $app.data.photonEventTableTypeFilter;
    $app.data.photonEventTableTypeOverlayFilter = JSON.parse(
        await configRepository.getString(
            'VRCX_photonEventTypeOverlayFilter',
            '[]'
        )
    );

    // #endregion
    // #region | App: Profile + Settings

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
    $app.data.printTable = [];
    $app.data.stickerTable = [];
    $app.data.emojiTable = [];
    $app.data.VRCPlusIconsTable = [];
    $app.data.galleryTable = [];
    $app.data.inviteMessageTable = {
        data: [],
        tableProps: {
            stripe: true,
            size: 'mini'
        },
        layout: 'table',
        visible: false
    };
    $app.data.inviteResponseMessageTable = {
        data: [],
        tableProps: {
            stripe: true,
            size: 'mini'
        },
        layout: 'table',
        visible: false
    };
    $app.data.inviteRequestMessageTable = {
        data: [],
        tableProps: {
            stripe: true,
            size: 'mini'
        },
        layout: 'table',
        visible: false
    };
    $app.data.inviteRequestResponseMessageTable = {
        data: [],
        tableProps: {
            stripe: true,
            size: 'mini'
        },
        layout: 'table',
        visible: false
    };
    $app.data.currentInstanceUserList = {
        data: [],
        tableProps: {
            stripe: true,
            size: 'mini',
            defaultSort: {
                prop: 'timer',
                order: 'descending'
            }
        },
        layout: 'table'
    };
    $app.data.visits = 0;
    $app.data.openVR = await configRepository.getBool('openVR', false);
    $app.data.openVRAlways = await configRepository.getBool(
        'openVRAlways',
        false
    );
    $app.data.overlaybutton = await configRepository.getBool(
        'VRCX_overlaybutton',
        false
    );
    $app.data.overlayHand = await configRepository.getInt(
        'VRCX_overlayHand',
        0
    );
    $app.data.hidePrivateFromFeed = await configRepository.getBool(
        'VRCX_hidePrivateFromFeed',
        false
    );
    $app.data.hideDevicesFromFeed = await configRepository.getBool(
        'VRCX_hideDevicesFromFeed',
        false
    );
    $app.data.vrOverlayCpuUsage = await configRepository.getBool(
        'VRCX_vrOverlayCpuUsage',
        false
    );
    $app.data.hideUptimeFromFeed = await configRepository.getBool(
        'VRCX_hideUptimeFromFeed',
        false
    );
    $app.data.pcUptimeOnFeed = await configRepository.getBool(
        'VRCX_pcUptimeOnFeed',
        false
    );
    $app.data.overlayNotifications = await configRepository.getBool(
        'VRCX_overlayNotifications',
        true
    );
    $app.data.overlayWrist = await configRepository.getBool(
        'VRCX_overlayWrist',
        false
    );
    $app.data.xsNotifications = await configRepository.getBool(
        'VRCX_xsNotifications',
        true
    );
    $app.data.ovrtHudNotifications = await configRepository.getBool(
        'VRCX_ovrtHudNotifications',
        true
    );
    $app.data.ovrtWristNotifications = await configRepository.getBool(
        'VRCX_ovrtWristNotifications',
        false
    );
    $app.data.imageNotifications = await configRepository.getBool(
        'VRCX_imageNotifications',
        true
    );
    $app.data.desktopToast = await configRepository.getString(
        'VRCX_desktopToast',
        'Never'
    );
    $app.data.afkDesktopToast = await configRepository.getBool(
        'VRCX_afkDesktopToast',
        false
    );
    $app.data.overlayToast = await configRepository.getString(
        'VRCX_overlayToast',
        'Game Running'
    );
    $app.data.minimalFeed = await configRepository.getBool(
        'VRCX_minimalFeed',
        false
    );
    $app.data.displayVRCPlusIconsAsAvatar = await configRepository.getBool(
        'displayVRCPlusIconsAsAvatar',
        true
    );
    $app.data.hideTooltips = await configRepository.getBool(
        'VRCX_hideTooltips',
        false
    );
    $app.data.hideNicknames = await configRepository.getBool(
        'VRCX_hideNicknames',
        false
    );
    $app.data.notificationTTS = await configRepository.getString(
        'VRCX_notificationTTS',
        'Never'
    );
    $app.data.notificationTTSNickName = await configRepository.getBool(
        'VRCX_notificationTTSNickName',
        false
    );
    $app.data.notificationOpacity = await configRepository.getFloat(
        'VRCX_notificationOpacity',
        100
    );

    // It's not necessary to store it in configRepo because it's rarely used.
    $app.data.isTestTTSVisible = false;

    $app.data.notificationTTSVoice = await configRepository.getString(
        'VRCX_notificationTTSVoice',
        '0'
    );
    $app.data.notificationTimeout = await configRepository.getString(
        'VRCX_notificationTimeout',
        '3000'
    );
    $app.data.autoSweepVRChatCache = await configRepository.getBool(
        'VRCX_autoSweepVRChatCache',
        false
    );
    $app.data.relaunchVRChatAfterCrash = await configRepository.getBool(
        'VRCX_relaunchVRChatAfterCrash',
        false
    );
    $app.data.vrcQuitFix = await configRepository.getBool(
        'VRCX_vrcQuitFix',
        true
    );
    $app.data.vrBackgroundEnabled = await configRepository.getBool(
        'VRCX_vrBackgroundEnabled',
        false
    );
    $app.data.asideWidth = await configRepository.getInt(
        'VRCX_sidePanelWidth',
        300
    );
    $app.data.autoUpdateVRCX = await configRepository.getString(
        'VRCX_autoUpdateVRCX',
        'Auto Download'
    );
    if ($app.data.autoUpdateVRCX === 'Auto Install') {
        $app.data.autoUpdateVRCX = 'Auto Download';
    }
    $app.data.branch = await configRepository.getString(
        'VRCX_branch',
        'Stable'
    );
    $app.data.maxTableSize = await configRepository.getInt(
        'VRCX_maxTableSize',
        1000
    );
    if ($app.data.maxTableSize > 10000) {
        $app.data.maxTableSize = 1000;
    }
    database.setmaxTableSize($app.data.maxTableSize);
    $app.data.photonLobbyTimeoutThreshold = await configRepository.getInt(
        'VRCX_photonLobbyTimeoutThreshold',
        6000
    );
    $app.data.clearVRCXCacheFrequency = await configRepository.getInt(
        'VRCX_clearVRCXCacheFrequency',
        172800
    );
    $app.data.avatarRemoteDatabase = await configRepository.getBool(
        'VRCX_avatarRemoteDatabase',
        true
    );
    $app.data.avatarRemoteDatabaseProvider = '';
    $app.data.avatarRemoteDatabaseProviderList = JSON.parse(
        await configRepository.getString(
            'VRCX_avatarRemoteDatabaseProviderList',
            '[ "https://api.avtrdb.com/v2/avatar/search/vrcx", "https://avtr.just-h.party/vrcx_search.php" ]'
        )
    );
    if (
        $app.data.avatarRemoteDatabaseProviderList.length === 1 &&
        $app.data.avatarRemoteDatabaseProviderList[0] ===
            'https://avtr.just-h.party/vrcx_search.php'
    ) {
        $app.data.avatarRemoteDatabaseProviderList.unshift(
            'https://api.avtrdb.com/v2/avatar/search/vrcx'
        );
        await configRepository.setString(
            'VRCX_avatarRemoteDatabaseProviderList',
            JSON.stringify($app.data.avatarRemoteDatabaseProviderList)
        );
    }
    $app.data.pendingOfflineDelay = 180000;

    // It's a mess, but it'll be fine afterward with the state manager
    $app.data.isAgeGatedInstancesVisible = await configRepository.getBool(
        'VRCX_isAgeGatedInstancesVisible',
        true
    );

    $app.methods.toggleIsAgeGatedInstancesVisible = function () {
        this.isAgeGatedInstancesVisible = !this.isAgeGatedInstancesVisible;
        configRepository.setBool(
            'VRCX_isAgeGatedInstancesVisible',
            this.isAgeGatedInstancesVisible
        );
    };

    if (await configRepository.getString('VRCX_avatarRemoteDatabaseProvider')) {
        // move existing provider to new list
        var avatarRemoteDatabaseProvider = await configRepository.getString(
            'VRCX_avatarRemoteDatabaseProvider'
        );
        if (
            !$app.data.avatarRemoteDatabaseProviderList.includes(
                avatarRemoteDatabaseProvider
            )
        ) {
            $app.data.avatarRemoteDatabaseProviderList.push(
                avatarRemoteDatabaseProvider
            );
        }
        await configRepository.remove('VRCX_avatarRemoteDatabaseProvider');
        await configRepository.setString(
            'VRCX_avatarRemoteDatabaseProviderList',
            JSON.stringify($app.data.avatarRemoteDatabaseProviderList)
        );
    }
    if ($app.data.avatarRemoteDatabaseProviderList.length > 0) {
        $app.data.avatarRemoteDatabaseProvider =
            $app.data.avatarRemoteDatabaseProviderList[0];
    }
    $app.data.sortFavorites = await configRepository.getBool(
        'VRCX_sortFavorites',
        true
    );
    $app.data.randomUserColours = await configRepository.getBool(
        'VRCX_randomUserColours',
        false
    );
    $app.data.hideUserNotes = await configRepository.getBool(
        'VRCX_hideUserNotes',
        false
    );
    $app.data.hideUserMemos = await configRepository.getBool(
        'VRCX_hideUserMemos',
        false
    );
    $app.data.hideUnfriends = await configRepository.getBool(
        'VRCX_hideUnfriends',
        false
    );
    $app.data.friendLogTable.filters[2].value = $app.data.hideUnfriends;
    $app.methods.saveOpenVROption = async function (configKey = '') {
        switch (configKey) {
            case 'openVR':
                this.openVR = !this.openVR;
                break;
            case 'VRCX_hidePrivateFromFeed':
                this.hidePrivateFromFeed = !this.hidePrivateFromFeed;
                break;
            case 'VRCX_hideDevicesFromFeed':
                this.hideDevicesFromFeed = !this.hideDevicesFromFeed;
                break;
            case 'VRCX_vrOverlayCpuUsage':
                this.vrOverlayCpuUsage = !this.vrOverlayCpuUsage;
                break;
            case 'VRCX_hideUptimeFromFeed':
                this.hideUptimeFromFeed = !this.hideUptimeFromFeed;
                break;
            case 'VRCX_pcUptimeOnFeed':
                this.pcUptimeOnFeed = !this.pcUptimeOnFeed;
                break;
            case 'VRCX_overlayNotifications':
                this.overlayNotifications = !this.overlayNotifications;
                break;
            case 'VRCX_overlayWrist':
                this.overlayWrist = !this.overlayWrist;
                break;
            case 'VRCX_xsNotifications':
                this.xsNotifications = !this.xsNotifications;
                break;
            case 'VRCX_ovrtHudNotifications':
                this.ovrtHudNotifications = !this.ovrtHudNotifications;
                break;
            case 'VRCX_ovrtWristNotifications':
                this.ovrtWristNotifications = !this.ovrtWristNotifications;
                break;
            case 'VRCX_imageNotifications':
                this.imageNotifications = !this.imageNotifications;
                break;
            case 'VRCX_afkDesktopToast':
                this.afkDesktopToast = !this.afkDesktopToast;
                break;
            case 'VRCX_notificationTTSNickName':
                this.notificationTTSNickName = !this.notificationTTSNickName;
                break;
            case 'VRCX_minimalFeed':
                this.minimalFeed = !this.minimalFeed;
                break;
            case 'displayVRCPlusIconsAsAvatar':
                this.displayVRCPlusIconsAsAvatar =
                    !this.displayVRCPlusIconsAsAvatar;
                break;
            case 'VRCX_hideTooltips':
                this.hideTooltips = !this.hideTooltips;
                break;
            case 'VRCX_hideNicknames':
                this.hideNicknames = !this.hideNicknames;
                break;
            case 'VRCX_autoSweepVRChatCache':
                this.autoSweepVRChatCache = !this.autoSweepVRChatCache;
                break;
            case 'VRCX_relaunchVRChatAfterCrash':
                this.relaunchVRChatAfterCrash = !this.relaunchVRChatAfterCrash;
                break;
            case 'VRCX_vrcQuitFix':
                this.vrcQuitFix = !this.vrcQuitFix;
                break;
            case 'VRCX_vrBackgroundEnabled':
                this.vrBackgroundEnabled = !this.vrBackgroundEnabled;
                break;
            case 'VRCX_avatarRemoteDatabase':
                this.avatarRemoteDatabase = !this.avatarRemoteDatabase;
                break;
            case 'VRCX_udonExceptionLogging':
                this.udonExceptionLogging = !this.udonExceptionLogging;
                break;
            case 'VRCX_autoDeleteOldPrints':
                this.autoDeleteOldPrints = !this.autoDeleteOldPrints;
                break;
            default:
                break;
        }

        await configRepository.setBool('openVR', this.openVR);

        await configRepository.setBool('openVRAlways', this.openVRAlways);
        await configRepository.setBool(
            'VRCX_overlaybutton',
            this.overlaybutton
        );
        this.overlayHand = parseInt(this.overlayHand, 10);
        if (isNaN(this.overlayHand)) {
            this.overlayHand = 0;
        }
        await configRepository.setInt('VRCX_overlayHand', this.overlayHand);

        await configRepository.setBool(
            'VRCX_hidePrivateFromFeed',
            this.hidePrivateFromFeed
        );

        await configRepository.setBool(
            'VRCX_hideDevicesFromFeed',
            this.hideDevicesFromFeed
        );

        await configRepository.setBool(
            'VRCX_vrOverlayCpuUsage',
            this.vrOverlayCpuUsage
        );

        await configRepository.setBool(
            'VRCX_hideUptimeFromFeed',
            this.hideUptimeFromFeed
        );

        await configRepository.setBool(
            'VRCX_pcUptimeOnFeed',
            this.pcUptimeOnFeed
        );

        await configRepository.setBool(
            'VRCX_overlayNotifications',
            this.overlayNotifications
        );

        await configRepository.setBool('VRCX_overlayWrist', this.overlayWrist);

        await configRepository.setBool(
            'VRCX_xsNotifications',
            this.xsNotifications
        );

        await configRepository.setBool(
            'VRCX_ovrtHudNotifications',
            this.ovrtHudNotifications
        );

        await configRepository.setBool(
            'VRCX_ovrtWristNotifications',
            this.ovrtWristNotifications
        );

        await configRepository.setBool(
            'VRCX_imageNotifications',
            this.imageNotifications
        );

        await configRepository.setString(
            'VRCX_desktopToast',
            this.desktopToast
        );

        await configRepository.setBool(
            'VRCX_afkDesktopToast',
            this.afkDesktopToast
        );

        await configRepository.setString(
            'VRCX_overlayToast',
            this.overlayToast
        );

        await configRepository.setBool(
            'VRCX_notificationTTSNickName',
            this.notificationTTSNickName
        );

        await configRepository.setBool('VRCX_minimalFeed', this.minimalFeed);

        await configRepository.setBool(
            'displayVRCPlusIconsAsAvatar',
            this.displayVRCPlusIconsAsAvatar
        );

        await configRepository.setBool('VRCX_hideTooltips', this.hideTooltips);

        await configRepository.setBool(
            'VRCX_hideNicknames',
            this.hideNicknames
        );

        await configRepository.setBool(
            'VRCX_autoSweepVRChatCache',
            this.autoSweepVRChatCache
        );

        await configRepository.setBool(
            'VRCX_relaunchVRChatAfterCrash',
            this.relaunchVRChatAfterCrash
        );

        await configRepository.setBool('VRCX_vrcQuitFix', this.vrcQuitFix);

        await configRepository.setBool(
            'VRCX_vrBackgroundEnabled',
            this.vrBackgroundEnabled
        );

        await configRepository.setBool(
            'VRCX_avatarRemoteDatabase',
            this.avatarRemoteDatabase
        );

        await configRepository.setBool(
            'VRCX_instanceUsersSortAlphabetical',
            this.instanceUsersSortAlphabetical
        );

        await configRepository.setBool(
            'VRCX_randomUserColours',
            this.randomUserColours
        );

        await configRepository.setBool(
            'VRCX_udonExceptionLogging',
            this.udonExceptionLogging
        );

        await configRepository.setBool(
            'VRCX_autoDeleteOldPrints',
            this.autoDeleteOldPrints
        );

        await configRepository.setInt(
            'VRCX_notificationOpacity',
            this.notificationOpacity
        );

        this.updateSharedFeed(true);
        this.updateVRConfigVars();
        this.updateVRLastLocation();
        AppApi.ExecuteVrOverlayFunction('notyClear', '');
        this.updateOpenVR();
    };

    $app.methods.saveSortFavoritesOption = async function () {
        this.getLocalWorldFavorites();
        await configRepository.setBool(
            'VRCX_sortFavorites',
            this.sortFavorites
        );
    };

    $app.methods.saveUserDialogOption = async function (configKey = '') {
        if (configKey === 'VRCX_hideUserNotes') {
            this.hideUserNotes = !this.hideUserNotes;
        } else {
            this.hideUserMemos = !this.hideUserMemos;
        }

        await configRepository.setBool(
            'VRCX_hideUserNotes',
            this.hideUserNotes
        );
        await configRepository.setBool(
            'VRCX_hideUserMemos',
            this.hideUserMemos
        );
    };

    $app.methods.saveFriendLogOptions = async function () {
        // The function is only called in adv settings
        this.hideUnfriends = !this.hideUnfriends;
        await configRepository.setBool(
            'VRCX_hideUnfriends',
            this.hideUnfriends
        );
        this.friendLogTable.filters[2].value = this.hideUnfriends;
    };
    $app.data.notificationTTSTest = '';
    $app.data.TTSvoices = speechSynthesis.getVoices();
    $app.methods.updateTTSVoices = function () {
        this.TTSvoices = speechSynthesis.getVoices();
        if (LINUX) {
            let voices = speechSynthesis.getVoices();
            let uniqueVoices = [];
            voices.forEach((voice) => {
                if (!uniqueVoices.some((v) => v.lang === voice.lang)) {
                    uniqueVoices.push(voice);
                }
            });
            uniqueVoices = uniqueVoices.filter((v) => v.lang.startsWith('en'));
            this.TTSvoices = uniqueVoices;
        }
    };
    $app.methods.saveNotificationTTS = async function () {
        speechSynthesis.cancel();
        if (
            (await configRepository.getString('VRCX_notificationTTS')) ===
                'Never' &&
            this.notificationTTS !== 'Never'
        ) {
            this.speak('Notification text-to-speech enabled');
        }
        await configRepository.setString(
            'VRCX_notificationTTS',
            this.notificationTTS
        );
        this.updateVRConfigVars();
    };
    $app.methods.testNotificationTTS = function () {
        speechSynthesis.cancel();
        this.speak(this.notificationTTSTest);
    };
    $app.data.themeMode = await configRepository.getString(
        'VRCX_ThemeMode',
        'system'
    );

    $app.data.isDarkMode = false;

    $app.methods.systemIsDarkMode = function () {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    };

    window
        .matchMedia('(prefers-color-scheme: dark)')
        .addEventListener('change', async () => {
            if ($app.themeMode === 'system') {
                await $app.changeThemeMode();
            }
        });

    $app.methods.saveThemeMode = async function (newThemeMode) {
        this.themeMode = newThemeMode;
        await configRepository.setString('VRCX_ThemeMode', this.themeMode);
        await this.changeThemeMode();
    };

    $app.methods.changeThemeMode = async function () {
        if (
            document.contains(document.getElementById('app-theme-dark-style'))
        ) {
            document.getElementById('app-theme-dark-style').remove();
        }
        if (document.contains(document.getElementById('app-theme-style'))) {
            document.getElementById('app-theme-style').remove();
        }
        var $appThemeStyle = document.createElement('link');
        $appThemeStyle.setAttribute('id', 'app-theme-style');
        $appThemeStyle.rel = 'stylesheet';
        switch (this.themeMode) {
            case 'light':
                $appThemeStyle.href = '';
                this.isDarkMode = false;
                break;
            case 'dark':
                $appThemeStyle.href = '';
                this.isDarkMode = true;
                break;
            case 'darkvanillaold':
                $appThemeStyle.href = 'theme.darkvanillaold.css';
                this.isDarkMode = true;
                break;
            case 'darkvanilla':
                $appThemeStyle.href = 'theme.darkvanilla.css';
                this.isDarkMode = true;
                break;
            case 'pink':
                $appThemeStyle.href = 'theme.pink.css';
                this.isDarkMode = true;
                break;
            case 'material3':
                $appThemeStyle.href = 'theme.material3.css';
                this.isDarkMode = true;
                break;
            case 'system':
                this.isDarkMode = this.systemIsDarkMode();
                break;
        }
        if (this.isDarkMode) {
            AppApi.ChangeTheme(1);
            var $appThemeDarkStyle = document.createElement('link');
            $appThemeDarkStyle.setAttribute('id', 'app-theme-dark-style');
            $appThemeDarkStyle.rel = 'stylesheet';
            $appThemeDarkStyle.href = 'theme.dark.css';
            document.head.appendChild($appThemeDarkStyle);
        } else {
            AppApi.ChangeTheme(0);
        }
        if ($appThemeStyle.href) {
            document.head.appendChild($appThemeStyle);
        }
        this.updateVRConfigVars();
        await this.updateTrustColor();
        await this.applyWineEmojis();
    };

    $app.methods.applyWineEmojis = async function () {
        if (document.contains(document.getElementById('app-emoji-font'))) {
            document.getElementById('app-emoji-font').remove();
        }
        if (this.isRunningUnderWine) {
            var $appEmojiFont = document.createElement('link');
            $appEmojiFont.setAttribute('id', 'app-emoji-font');
            $appEmojiFont.rel = 'stylesheet';
            $appEmojiFont.href = 'emoji.font.css';
            document.head.appendChild($appEmojiFont);
        }
    };

    $app.data.isStartAtWindowsStartup = await configRepository.getBool(
        'VRCX_StartAtWindowsStartup',
        false
    );
    $app.data.isStartAsMinimizedState =
        (await VRCXStorage.Get('VRCX_StartAsMinimizedState')) === 'true';
    $app.data.isCloseToTray =
        (await VRCXStorage.Get('VRCX_CloseToTray')) === 'true';
    if (await configRepository.getBool('VRCX_CloseToTray')) {
        // move back to JSON
        $app.data.isCloseToTray =
            await configRepository.getBool('VRCX_CloseToTray');
        VRCXStorage.Set('VRCX_CloseToTray', $app.data.isCloseToTray.toString());
        await configRepository.remove('VRCX_CloseToTray');
    }
    if (!(await VRCXStorage.Get('VRCX_DatabaseLocation'))) {
        await VRCXStorage.Set('VRCX_DatabaseLocation', '');
    }
    if (!(await VRCXStorage.Get('VRCX_ProxyServer'))) {
        await VRCXStorage.Set('VRCX_ProxyServer', '');
    }
    if ((await VRCXStorage.Get('VRCX_DisableGpuAcceleration')) === '') {
        await VRCXStorage.Set('VRCX_DisableGpuAcceleration', 'false');
    }
    if (
        (await VRCXStorage.Get('VRCX_DisableVrOverlayGpuAcceleration')) === ''
    ) {
        await VRCXStorage.Set('VRCX_DisableVrOverlayGpuAcceleration', 'false');
    }
    $app.data.proxyServer = await VRCXStorage.Get('VRCX_ProxyServer');
    $app.data.disableGpuAcceleration =
        (await VRCXStorage.Get('VRCX_DisableGpuAcceleration')) === 'true';
    $app.data.locationX = await VRCXStorage.Get('VRCX_LocationX');
    $app.data.locationY = await VRCXStorage.Get('VRCX_LocationY');
    $app.data.sizeWidth = await VRCXStorage.Get('VRCX_SizeWidth');
    $app.data.sizeHeight = await VRCXStorage.Get('VRCX_SizeHeight');
    $app.data.windowState = await VRCXStorage.Get('VRCX_WindowState');
    $app.data.disableVrOverlayGpuAcceleration =
        (await VRCXStorage.Get('VRCX_DisableVrOverlayGpuAcceleration')) ===
        'true';
    $app.data.disableWorldDatabase =
        (await VRCXStorage.Get('VRCX_DisableWorldDatabase')) === 'true';

    $app.methods.saveVRCXWindowOption = async function (configKey = '') {
        switch (configKey) {
            case 'VRCX_StartAtWindowsStartup':
                this.isStartAtWindowsStartup = !this.isStartAtWindowsStartup;
                break;
            case 'VRCX_saveInstancePrints':
                this.saveInstancePrints = !this.saveInstancePrints;
                break;
            case 'VRCX_cropInstancePrints':
                this.cropInstancePrints = !this.cropInstancePrints;
                this.cropPrintsChanged();
                break;
            case 'VRCX_saveInstanceStickers':
                this.saveInstanceStickers = !this.saveInstanceStickers;
                break;
            case 'VRCX_saveInstanceEmoji':
                this.saveInstanceEmoji = !this.saveInstanceEmoji;
                break;
            case 'VRCX_StartAsMinimizedState':
                this.isStartAsMinimizedState = !this.isStartAsMinimizedState;
                break;
            case 'VRCX_CloseToTray':
                this.isCloseToTray = !this.isCloseToTray;
                break;
            case 'VRCX_DisableWorldDatabase':
                this.disableWorldDatabase = !this.disableWorldDatabase;
                break;
            case 'VRCX_DisableGpuAcceleration':
                this.disableGpuAcceleration = !this.disableGpuAcceleration;
                break;
            case 'VRCX_DisableVrOverlayGpuAcceleration':
                this.disableVrOverlayGpuAcceleration =
                    !this.disableVrOverlayGpuAcceleration;
                break;
            default:
                break;
        }

        await configRepository.setBool(
            'VRCX_StartAtWindowsStartup',
            this.isStartAtWindowsStartup
        );

        await configRepository.setBool(
            'VRCX_saveInstancePrints',
            this.saveInstancePrints
        );

        await configRepository.setBool(
            'VRCX_cropInstancePrints',
            this.cropInstancePrints
        );

        await configRepository.setBool(
            'VRCX_saveInstanceStickers',
            this.saveInstanceStickers
        );

        await configRepository.setBool(
            'VRCX_saveInstanceEmoji',
            this.saveInstanceEmoji
        );

        VRCXStorage.Set(
            'VRCX_StartAsMinimizedState',
            this.isStartAsMinimizedState.toString()
        );

        VRCXStorage.Set('VRCX_CloseToTray', this.isCloseToTray.toString());

        VRCXStorage.Set(
            'VRCX_DisableWorldDatabase',
            this.disableWorldDatabase.toString()
        );

        VRCXStorage.Set(
            'VRCX_DisableGpuAcceleration',
            this.disableGpuAcceleration.toString()
        );
        VRCXStorage.Set(
            'VRCX_DisableVrOverlayGpuAcceleration',
            this.disableVrOverlayGpuAcceleration.toString()
        );

        if (LINUX) {
            VRCXStorage.Set('VRCX_LocationX', this.locationX);
            VRCXStorage.Set('VRCX_LocationY', this.locationY);
            VRCXStorage.Set('VRCX_SizeWidth', this.sizeWidth);
            VRCXStorage.Set('VRCX_SizeHeight', this.sizeHeight);
            VRCXStorage.Set('VRCX_WindowState', this.windowState);
            VRCXStorage.Flush();
        } else {
            AppApi.SetStartup(this.isStartAtWindowsStartup);
        }
    };

    $app.data.photonEventOverlay = await configRepository.getBool(
        'VRCX_PhotonEventOverlay',
        false
    );
    $app.data.timeoutHudOverlay = await configRepository.getBool(
        'VRCX_TimeoutHudOverlay',
        false
    );
    $app.data.timeoutHudOverlayFilter = await configRepository.getString(
        'VRCX_TimeoutHudOverlayFilter',
        'Everyone'
    );
    $app.data.photonEventOverlayFilter = await configRepository.getString(
        'VRCX_PhotonEventOverlayFilter',
        'Everyone'
    );
    $app.data.photonOverlayMessageTimeout = Number(
        await configRepository.getString(
            'VRCX_photonOverlayMessageTimeout',
            6000
        )
    );
    $app.data.gameLogDisabled = await configRepository.getBool(
        'VRCX_gameLogDisabled',
        false
    );
    $app.data.udonExceptionLogging = await configRepository.getBool(
        'VRCX_udonExceptionLogging',
        false
    );
    $app.data.instanceUsersSortAlphabetical = await configRepository.getBool(
        'VRCX_instanceUsersSortAlphabetical',
        false
    );
    $app.methods.saveEventOverlay = async function (configKey = '') {
        if (configKey === 'VRCX_PhotonEventOverlay') {
            this.photonEventOverlay = !this.photonEventOverlay;
        } else if (configKey === 'VRCX_TimeoutHudOverlay') {
            this.timeoutHudOverlay = !this.timeoutHudOverlay;
        }
        await configRepository.setBool(
            'VRCX_PhotonEventOverlay',
            this.photonEventOverlay
        );
        await configRepository.setBool(
            'VRCX_TimeoutHudOverlay',
            this.timeoutHudOverlay
        );
        await configRepository.setString(
            'VRCX_TimeoutHudOverlayFilter',
            this.timeoutHudOverlayFilter
        );
        await configRepository.setString(
            'VRCX_PhotonEventOverlayFilter',
            this.photonEventOverlayFilter
        );
        if (!this.timeoutHudOverlay) {
            AppApi.ExecuteVrOverlayFunction('updateHudTimeout', '[]');
        }
        this.updateOpenVR();
        this.updateVRConfigVars();
    };
    $app.data.logResourceLoad = await configRepository.getBool(
        'VRCX_logResourceLoad',
        false
    );
    $app.data.logEmptyAvatars = await configRepository.getBool(
        'VRCX_logEmptyAvatars',
        false
    );
    $app.methods.saveLoggingOptions = async function (configKey = '') {
        if (configKey === 'VRCX_logResourceLoad') {
            this.logResourceLoad = !this.logResourceLoad;
        } else {
            this.logEmptyAvatars = !this.logEmptyAvatars;
        }

        await configRepository.setBool(
            'VRCX_logResourceLoad',
            this.logResourceLoad
        );
        await configRepository.setBool(
            'VRCX_logEmptyAvatars',
            this.logEmptyAvatars
        );
    };
    $app.data.autoStateChangeEnabled = await configRepository.getBool(
        'VRCX_autoStateChangeEnabled',
        false
    );
    $app.data.autoStateChangeNoFriends = await configRepository.getBool(
        'VRCX_autoStateChangeNoFriends',
        false
    );
    $app.data.autoStateChangeInstanceTypes = JSON.parse(
        await configRepository.getString(
            'VRCX_autoStateChangeInstanceTypes',
            '[]'
        )
    );
    $app.data.autoStateChangeAloneStatus = await configRepository.getString(
        'VRCX_autoStateChangeAloneStatus',
        'join me'
    );
    $app.data.autoStateChangeCompanyStatus = await configRepository.getString(
        'VRCX_autoStateChangeCompanyStatus',
        'busy'
    );
    $app.data.autoAcceptInviteRequests = await configRepository.getString(
        'VRCX_autoAcceptInviteRequests',
        'Off'
    );
    $app.methods.saveAutomationOptions = async function (configKey = '') {
        if (configKey === 'VRCX_autoStateChangeEnabled') {
            this.autoStateChangeEnabled = !this.autoStateChangeEnabled;
            await configRepository.setBool(
                'VRCX_autoStateChangeEnabled',
                this.autoStateChangeEnabled
            );
        }
        await configRepository.setBool(
            'VRCX_autoStateChangeNoFriends',
            this.autoStateChangeNoFriends
        );
        await configRepository.setString(
            'VRCX_autoStateChangeInstanceTypes',
            JSON.stringify(this.autoStateChangeInstanceTypes)
        );
        await configRepository.setString(
            'VRCX_autoStateChangeAloneStatus',
            this.autoStateChangeAloneStatus
        );
        await configRepository.setString(
            'VRCX_autoStateChangeCompanyStatus',
            this.autoStateChangeCompanyStatus
        );
        await configRepository.setString(
            'VRCX_autoAcceptInviteRequests',
            this.autoAcceptInviteRequests
        );
    };

    $app.data.isRegistryBackupDialogVisible = false;

    $app.methods.showRegistryBackupDialog = function () {
        this.isRegistryBackupDialogVisible = true;
    };

    $app.data.sidebarSortMethod1 = '';
    $app.data.sidebarSortMethod2 = '';
    $app.data.sidebarSortMethod3 = '';
    $app.data.sidebarSortMethods = JSON.parse(
        await configRepository.getString(
            'VRCX_sidebarSortMethods',
            JSON.stringify([
                'Sort Private to Bottom',
                'Sort by Time in Instance',
                'Sort by Last Active'
            ])
        )
    );
    if ($app.data.sidebarSortMethods?.length === 3) {
        $app.data.sidebarSortMethod1 = $app.data.sidebarSortMethods[0];
        $app.data.sidebarSortMethod2 = $app.data.sidebarSortMethods[1];
        $app.data.sidebarSortMethod3 = $app.data.sidebarSortMethods[2];
    }

    // Migrate old settings
    // Assume all exist if one does
    const orderFriendsGroupPrivate = await configRepository.getBool(
        'orderFriendGroupPrivate'
    );
    if (orderFriendsGroupPrivate !== null) {
        await configRepository.remove('orderFriendGroupPrivate');

        const orderFriendsGroupStatus = await configRepository.getBool(
            'orderFriendsGroupStatus'
        );
        await configRepository.remove('orderFriendsGroupStatus');

        const orderFriendsGroupGPS = await configRepository.getBool(
            'orderFriendGroupGPS'
        );
        await configRepository.remove('orderFriendGroupGPS');

        const orderOnlineFor =
            await configRepository.getBool('orderFriendGroup0');
        await configRepository.remove('orderFriendGroup0');
        await configRepository.remove('orderFriendGroup1');
        await configRepository.remove('orderFriendGroup2');
        await configRepository.remove('orderFriendGroup3');

        var sortOrder = [];
        if (orderFriendsGroupPrivate) {
            sortOrder.push('Sort Private to Bottom');
        }
        if (orderFriendsGroupStatus) {
            sortOrder.push('Sort by Status');
        }
        if (orderOnlineFor && orderFriendsGroupGPS) {
            sortOrder.push('Sort by Time in Instance');
        }
        if (!orderOnlineFor) {
            sortOrder.push('Sort Alphabetically');
        }

        if (sortOrder.length > 0) {
            while (sortOrder.length < 3) {
                sortOrder.push('');
            }
            $app.data.sidebarSortMethods = sortOrder;
            $app.data.sidebarSortMethod1 = sortOrder[0];
            $app.data.sidebarSortMethod2 = sortOrder[1];
            $app.data.sidebarSortMethod3 = sortOrder[2];
        }
        await configRepository.setString(
            'VRCX_sidebarSortMethods',
            JSON.stringify(sortOrder)
        );
    }

    $app.methods.saveSidebarSortOrder = async function () {
        if (this.sidebarSortMethod1 === this.sidebarSortMethod2) {
            this.sidebarSortMethod2 = '';
        }
        if (this.sidebarSortMethod1 === this.sidebarSortMethod3) {
            this.sidebarSortMethod3 = '';
        }
        if (this.sidebarSortMethod2 === this.sidebarSortMethod3) {
            this.sidebarSortMethod3 = '';
        }
        if (!this.sidebarSortMethod1) {
            this.sidebarSortMethod2 = '';
        }
        if (!this.sidebarSortMethod2) {
            this.sidebarSortMethod3 = '';
        }
        this.sidebarSortMethods = [
            this.sidebarSortMethod1,
            this.sidebarSortMethod2,
            this.sidebarSortMethod3
        ];
        await configRepository.setString(
            'VRCX_sidebarSortMethods',
            JSON.stringify(this.sidebarSortMethods)
        );
        this.sortVIPFriends = true;
        this.sortOnlineFriends = true;
        this.sortActiveFriends = true;
        this.sortOfflineFriends = true;
    };
    $app.data.discordActive = await configRepository.getBool(
        'discordActive',
        false
    );
    $app.data.discordInstance = await configRepository.getBool(
        'discordInstance',
        true
    );
    $app.data.discordJoinButton = await configRepository.getBool(
        'discordJoinButton',
        false
    );
    $app.data.discordHideInvite = await configRepository.getBool(
        'discordHideInvite',
        true
    );
    $app.data.discordHideImage = await configRepository.getBool(
        'discordHideImage',
        false
    );

    // setting defaults
    $app.data.sharedFeedFiltersDefaults = {
        noty: {
            Location: 'Off',
            OnPlayerJoined: 'VIP',
            OnPlayerLeft: 'VIP',
            OnPlayerJoining: 'VIP',
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
            boop: 'Off',
            groupChange: 'On',
            'group.announcement': 'On',
            'group.informative': 'On',
            'group.invite': 'On',
            'group.joinRequest': 'Off',
            'group.transfer': 'On',
            'group.queueReady': 'On',
            'instance.closed': 'On',
            PortalSpawn: 'Everyone',
            Event: 'On',
            External: 'On',
            VideoPlay: 'Off',
            BlockedOnPlayerJoined: 'Off',
            BlockedOnPlayerLeft: 'Off',
            MutedOnPlayerJoined: 'Off',
            MutedOnPlayerLeft: 'Off',
            AvatarChange: 'Off',
            ChatBoxMessage: 'Off',
            Blocked: 'Off',
            Unblocked: 'Off',
            Muted: 'Off',
            Unmuted: 'Off'
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
            boop: 'On',
            groupChange: 'On',
            'group.announcement': 'On',
            'group.informative': 'On',
            'group.invite': 'On',
            'group.joinRequest': 'On',
            'group.transfer': 'On',
            'group.queueReady': 'On',
            'instance.closed': 'On',
            PortalSpawn: 'Everyone',
            Event: 'On',
            External: 'On',
            VideoPlay: 'On',
            BlockedOnPlayerJoined: 'Off',
            BlockedOnPlayerLeft: 'Off',
            MutedOnPlayerJoined: 'Off',
            MutedOnPlayerLeft: 'Off',
            AvatarChange: 'Everyone',
            ChatBoxMessage: 'Off',
            Blocked: 'On',
            Unblocked: 'On',
            Muted: 'On',
            Unmuted: 'On'
        }
    };
    $app.data.sharedFeedFilters = $app.data.sharedFeedFiltersDefaults;
    if (await configRepository.getString('sharedFeedFilters')) {
        $app.data.sharedFeedFilters = JSON.parse(
            await configRepository.getString(
                'sharedFeedFilters',
                JSON.stringify($app.data.sharedFeedFiltersDefaults)
            )
        );
    }
    if (!$app.data.sharedFeedFilters.noty.Blocked) {
        $app.data.sharedFeedFilters.noty.Blocked = 'Off';
        $app.data.sharedFeedFilters.noty.Unblocked = 'Off';
        $app.data.sharedFeedFilters.noty.Muted = 'Off';
        $app.data.sharedFeedFilters.noty.Unmuted = 'Off';
        $app.data.sharedFeedFilters.wrist.Blocked = 'On';
        $app.data.sharedFeedFilters.wrist.Unblocked = 'On';
        $app.data.sharedFeedFilters.wrist.Muted = 'On';
        $app.data.sharedFeedFilters.wrist.Unmuted = 'On';
    }
    if (!$app.data.sharedFeedFilters.noty['group.announcement']) {
        $app.data.sharedFeedFilters.noty['group.announcement'] = 'On';
        $app.data.sharedFeedFilters.noty['group.informative'] = 'On';
        $app.data.sharedFeedFilters.noty['group.invite'] = 'On';
        $app.data.sharedFeedFilters.noty['group.joinRequest'] = 'Off';
        $app.data.sharedFeedFilters.wrist['group.announcement'] = 'On';
        $app.data.sharedFeedFilters.wrist['group.informative'] = 'On';
        $app.data.sharedFeedFilters.wrist['group.invite'] = 'On';
        $app.data.sharedFeedFilters.wrist['group.joinRequest'] = 'On';
    }
    if (!$app.data.sharedFeedFilters.noty['group.queueReady']) {
        $app.data.sharedFeedFilters.noty['group.queueReady'] = 'On';
        $app.data.sharedFeedFilters.wrist['group.queueReady'] = 'On';
    }
    if (!$app.data.sharedFeedFilters.noty['instance.closed']) {
        $app.data.sharedFeedFilters.noty['instance.closed'] = 'On';
        $app.data.sharedFeedFilters.wrist['instance.closed'] = 'On';
    }
    if (!$app.data.sharedFeedFilters.noty.External) {
        $app.data.sharedFeedFilters.noty.External = 'On';
        $app.data.sharedFeedFilters.wrist.External = 'On';
    }
    if (!$app.data.sharedFeedFilters.noty.groupChange) {
        $app.data.sharedFeedFilters.noty.groupChange = 'On';
        $app.data.sharedFeedFilters.wrist.groupChange = 'On';
    }
    if (!$app.data.sharedFeedFilters.noty['group.transfer']) {
        $app.data.sharedFeedFilters.noty['group.transfer'] = 'On';
        $app.data.sharedFeedFilters.wrist['group.transfer'] = 'On';
    }
    if (!$app.data.sharedFeedFilters.noty.boop) {
        $app.data.sharedFeedFilters.noty.boop = 'Off';
        $app.data.sharedFeedFilters.wrist.boop = 'On';
    }

    $app.data.trustColor = JSON.parse(
        await configRepository.getString(
            'VRCX_trustColor',
            JSON.stringify({
                untrusted: '#CCCCCC',
                basic: '#1778FF',
                known: '#2BCF5C',
                trusted: '#FF7B42',
                veteran: '#B18FFF',
                vip: '#FF2626',
                troll: '#782F2F'
            })
        )
    );

    $app.methods.updateTrustColor = async function (setRandomColor = false) {
        if (setRandomColor) {
            this.randomUserColours = !this.randomUserColours;
        }
        if (typeof API.currentUser?.id === 'undefined') {
            return;
        }
        await configRepository.setBool(
            'VRCX_randomUserColours',
            this.randomUserColours
        );
        await configRepository.setString(
            'VRCX_trustColor',
            JSON.stringify(this.trustColor)
        );
        if (this.randomUserColours) {
            this.getNameColour(API.currentUser.id).then((colour) => {
                API.currentUser.$userColour = colour;
            });
            this.userColourInit();
        } else {
            API.applyUserTrustLevel(API.currentUser);
            API.cachedUsers.forEach((ref) => {
                API.applyUserTrustLevel(ref);
            });
        }
        await this.updateTrustColorClasses();
    };

    $app.methods.updateTrustColorClasses = async function () {
        var trustColor = JSON.parse(
            await configRepository.getString(
                'VRCX_trustColor',
                JSON.stringify({
                    untrusted: '#CCCCCC',
                    basic: '#1778FF',
                    known: '#2BCF5C',
                    trusted: '#FF7B42',
                    veteran: '#B18FFF',
                    vip: '#FF2626',
                    troll: '#782F2F'
                })
            )
        );
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
    await $app.methods.updateTrustColorClasses();

    $app.data.notificationPosition = await configRepository.getString(
        'VRCX_notificationPosition',
        'topCenter'
    );
    $app.methods.changeNotificationPosition = async function (value) {
        this.notificationPosition = value;
        await configRepository.setString(
            'VRCX_notificationPosition',
            this.notificationPosition
        );
        this.updateVRConfigVars();
    };

    $app.data.youTubeApi = await configRepository.getBool(
        'VRCX_youtubeAPI',
        false
    );
    $app.data.youTubeApiKey = await configRepository.getString(
        'VRCX_youtubeAPIKey',
        ''
    );

    $app.data.progressPie = await configRepository.getBool(
        'VRCX_progressPie',
        false
    );
    $app.data.progressPieFilter = await configRepository.getBool(
        'VRCX_progressPieFilter',
        true
    );

    $app.data.screenshotHelper = await configRepository.getBool(
        'VRCX_screenshotHelper',
        true
    );

    $app.data.screenshotHelperModifyFilename = await configRepository.getBool(
        'VRCX_screenshotHelperModifyFilename',
        false
    );

    $app.data.screenshotHelperCopyToClipboard = await configRepository.getBool(
        'VRCX_screenshotHelperCopyToClipboard',
        false
    );

    $app.data.enableAppLauncher = await configRepository.getBool(
        'VRCX_enableAppLauncher',
        true
    );

    $app.data.enableAppLauncherAutoClose = await configRepository.getBool(
        'VRCX_enableAppLauncherAutoClose',
        true
    );

    $app.data.showConfirmationOnSwitchAvatar = await configRepository.getBool(
        'VRCX_showConfirmationOnSwitchAvatar',
        false
    );

    $app.methods.updateVRConfigVars = function () {
        var notificationTheme = 'relax';
        if (this.isDarkMode) {
            notificationTheme = 'sunset';
        }
        var VRConfigVars = {
            overlayNotifications: this.overlayNotifications,
            hideDevicesFromFeed: this.hideDevicesFromFeed,
            vrOverlayCpuUsage: this.vrOverlayCpuUsage,
            minimalFeed: this.minimalFeed,
            notificationPosition: this.notificationPosition,
            notificationTimeout: this.notificationTimeout,
            photonOverlayMessageTimeout: this.photonOverlayMessageTimeout,
            notificationTheme,
            backgroundEnabled: this.vrBackgroundEnabled,
            dtHour12: this.dtHour12,
            pcUptimeOnFeed: this.pcUptimeOnFeed,
            appLanguage: this.appLanguage,
            notificationOpacity: this.notificationOpacity
        };
        var json = JSON.stringify(VRConfigVars);
        AppApi.ExecuteVrFeedFunction('configUpdate', json);
        AppApi.ExecuteVrOverlayFunction('configUpdate', json);
    };

    $app.methods.isRpcWorld = function (location) {
        var rpcWorlds = [
            'wrld_f20326da-f1ac-45fc-a062-609723b097b1',
            'wrld_42377cf1-c54f-45ed-8996-5875b0573a83',
            'wrld_dd6d2888-dbdc-47c2-bc98-3d631b2acd7c',
            'wrld_52bdcdab-11cd-4325-9655-0fb120846945',
            'wrld_2d40da63-8f1f-4011-8a9e-414eb8530acd',
            'wrld_10e5e467-fc65-42ed-8957-f02cace1398c',
            'wrld_04899f23-e182-4a8d-b2c7-2c74c7c15534',
            'wrld_435bbf25-f34f-4b8b-82c6-cd809057eb8e',
            'wrld_db9d878f-6e76-4776-8bf2-15bcdd7fc445',
            'wrld_f767d1c8-b249-4ecc-a56f-614e433682c8',
            'wrld_74970324-58e8-4239-a17b-2c59dfdf00db',
            'wrld_266523e8-9161-40da-acd0-6bd82e075833'
        ];
        var L = parseLocation(location);
        if (rpcWorlds.includes(L.worldId)) {
            return true;
        }
        return false;
    };

    $app.methods.updateVRLastLocation = function () {
        var progressPie = false;
        if (this.progressPie) {
            progressPie = true;
            if (this.progressPieFilter) {
                if (!this.isRpcWorld(this.lastLocation.location)) {
                    progressPie = false;
                }
            }
        }
        var onlineFor = '';
        if (!this.hideUptimeFromFeed) {
            onlineFor = API.currentUser.$online_for;
        }
        var lastLocation = {
            date: this.lastLocation.date,
            location: this.lastLocation.location,
            name: this.lastLocation.name,
            playerList: Array.from(this.lastLocation.playerList.values()),
            friendList: Array.from(this.lastLocation.friendList.values()),
            progressPie,
            onlineFor
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
        this.onlineFriendCount = 0;
        this.updateOnlineFriendCoutner();
    };

    API.$on('LOGIN', function () {
        $app.pastDisplayNameTable.data = [];
    });

    API.$on('USER:CURRENT', function (args) {
        if (args.ref.pastDisplayNames) {
            $app.pastDisplayNameTable.data = args.ref.pastDisplayNames;
        }
    });

    $app.methods.updateOpenVR = function () {
        if (
            this.openVR &&
            this.isSteamVRRunning &&
            ((this.isGameRunning && !this.isGameNoVR) || this.openVRAlways)
        ) {
            var hmdOverlay = false;
            if (
                this.overlayNotifications ||
                this.progressPie ||
                this.photonEventOverlay ||
                this.timeoutHudOverlay
            ) {
                hmdOverlay = true;
            }
            // active, hmdOverlay, wristOverlay, menuButton, overlayHand
            AppApi.SetVR(
                true,
                hmdOverlay,
                this.overlayWrist,
                this.overlaybutton,
                this.overlayHand
            );
        } else {
            AppApi.SetVR(false, false, false, false, 0);
        }
    };

    $app.methods.getTTSVoiceName = function () {
        var voices;
        if (LINUX) {
            voices = this.TTSvoices;
        } else {
            voices = speechSynthesis.getVoices();
        }
        if (voices.length === 0) {
            return '';
        }
        if (this.notificationTTSVoice >= voices.length) {
            this.notificationTTSVoice = 0;
            configRepository.setString(
                'VRCX_notificationTTSVoice',
                this.notificationTTSVoice
            );
        }
        return voices[this.notificationTTSVoice].name;
    };

    $app.methods.changeTTSVoice = async function (index) {
        this.notificationTTSVoice = index;
        await configRepository.setString(
            'VRCX_notificationTTSVoice',
            this.notificationTTSVoice
        );
        var voices;
        if (LINUX) {
            voices = this.TTSvoices;
        } else {
            voices = speechSynthesis.getVoices();
        }
        if (voices.length === 0) {
            return;
        }
        var voiceName = voices[index].name;
        speechSynthesis.cancel();
        this.speak(voiceName);
    };

    $app.methods.speak = function (text) {
        var tts = new SpeechSynthesisUtterance();
        var voices = speechSynthesis.getVoices();
        if (voices.length === 0) {
            return;
        }
        var index = 0;
        if (this.notificationTTSVoice < voices.length) {
            index = this.notificationTTSVoice;
        }
        tts.voice = voices[index];
        tts.text = text;
        speechSynthesis.speak(tts);
    };

    $app.methods.directAccessPaste = function () {
        AppApi.GetClipboard().then((clipboard) => {
            if (!this.directAccessParse(clipboard.trim())) {
                this.promptOmniDirectDialog();
            }
        });
    };

    $app.methods.directAccessWorld = function (textBoxInput) {
        var input = textBoxInput;
        if (input.startsWith('/home/')) {
            input = `https://vrchat.com${input}`;
        }
        if (input.length === 8) {
            return this.verifyShortName('', input);
        } else if (input.startsWith('https://vrch.at/')) {
            var shortName = input.substring(16, 24);
            return this.verifyShortName('', shortName);
        } else if (
            input.startsWith('https://vrchat.') ||
            input.startsWith('/home/')
        ) {
            var url = new URL(input);
            var urlPath = url.pathname;
            var urlPathSplit = urlPath.split('/');
            if (urlPathSplit.length >= 4 && urlPathSplit[2] === 'world') {
                var worldId = urlPathSplit[3];
                this.showWorldDialog(worldId);
                return true;
            } else if (urlPath.substring(5, 12) === '/launch') {
                var urlParams = new URLSearchParams(url.search);
                var worldId = urlParams.get('worldId');
                var instanceId = urlParams.get('instanceId');
                if (instanceId) {
                    var shortName = urlParams.get('shortName');
                    var location = `${worldId}:${instanceId}`;
                    if (shortName) {
                        return this.verifyShortName(location, shortName);
                    }
                    this.showWorldDialog(location);
                    return true;
                } else if (worldId) {
                    this.showWorldDialog(worldId);
                    return true;
                }
            }
        } else if (input.substring(0, 5) === 'wrld_') {
            // a bit hacky, but supports weird malformed inputs cut out from url, why not
            if (input.indexOf('&instanceId=') >= 0) {
                input = `https://vrchat.com/home/launch?worldId=${input}`;
                return this.directAccessWorld(input);
            }
            this.showWorldDialog(input.trim());
            return true;
        }
        return false;
    };

    $app.methods.verifyShortName = function (location, shortName) {
        return instanceRequest
            .getInstanceFromShortName({ shortName })
            .then((args) => {
                var newLocation = args.json.location;
                var newShortName = args.json.shortName;
                if (newShortName) {
                    this.showWorldDialog(newLocation, newShortName);
                } else if (newLocation) {
                    this.showWorldDialog(newLocation);
                } else {
                    this.showWorldDialog(location);
                }
                return args;
            });
    };

    $app.methods.showGroupDialogShortCode = function (shortCode) {
        groupRequest.groupStrictsearch({ query: shortCode }).then((args) => {
            for (const group of args.json) {
                if (`${group.shortCode}.${group.discriminator}` === shortCode) {
                    this.showGroupDialog(group.id);
                    break;
                }
            }
            return args;
        });
    };

    $app.methods.directAccessParse = function (input) {
        if (!input) {
            return false;
        }
        if (this.directAccessWorld(input)) {
            return true;
        }
        if (input.startsWith('https://vrchat.')) {
            var url = new URL(input);
            var urlPath = url.pathname;
            var urlPathSplit = urlPath.split('/');
            if (urlPathSplit.length < 4) {
                return false;
            }
            var type = urlPathSplit[2];
            if (type === 'user') {
                var userId = urlPathSplit[3];
                this.showUserDialog(userId);
                return true;
            } else if (type === 'avatar') {
                var avatarId = urlPathSplit[3];
                this.showAvatarDialog(avatarId);
                return true;
            } else if (type === 'group') {
                var groupId = urlPathSplit[3];
                this.showGroupDialog(groupId);
                return true;
            }
        } else if (input.startsWith('https://vrc.group/')) {
            var shortCode = input.substring(18);
            this.showGroupDialogShortCode(shortCode);
            return true;
        } else if (/^[A-Za-z0-9]{3,6}\.[0-9]{4}$/g.test(input)) {
            this.showGroupDialogShortCode(input);
            return true;
        } else if (
            input.substring(0, 4) === 'usr_' ||
            /^[A-Za-z0-9]{10}$/g.test(input)
        ) {
            this.showUserDialog(input);
            return true;
        } else if (input.substring(0, 5) === 'avtr_') {
            this.showAvatarDialog(input);
            return true;
        } else if (input.substring(0, 4) === 'grp_') {
            this.showGroupDialog(input);
            return true;
        }
        return false;
    };

    $app.methods.setTablePageSize = async function (pageSize) {
        this.tablePageSize = pageSize;
        this.feedTable.pageSize = pageSize;
        this.gameLogTable.pageSize = pageSize;
        this.friendLogTable.pageSize = pageSize;
        this.playerModerationTable.pageSize = pageSize;
        this.notificationTable.pageSize = pageSize;
        await configRepository.setInt('VRCX_tablePageSize', pageSize);
    };

    // #endregion
    // #region | App: Dialog

    $app.methods.adjustDialogZ = function (el) {
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

    // #endregion
    // #region | App: User Dialog

    $app.data.userDialog = {
        visible: false,
        loading: false,
        id: '',
        ref: {},
        friend: {},
        isFriend: false,
        note: '',
        noteSaving: false,
        incomingRequest: false,
        outgoingRequest: false,
        isBlock: false,
        isMute: false,
        isHideAvatar: false,
        isShowAvatar: false,
        isInteractOff: false,
        isMuteChat: false,
        isFavorite: false,

        $location: {},
        $homeLocationName: '',
        users: [],
        instance: {},

        worlds: [],
        avatars: [],
        isWorldsLoading: false,
        isFavoriteWorldsLoading: false,
        isAvatarsLoading: false,
        isGroupsLoading: false,

        worldSorting: {
            name: $t('dialog.user.worlds.sorting.updated'),
            value: 'updated'
        },
        worldOrder: {
            name: $t('dialog.user.worlds.order.descending'),
            value: 'descending'
        },
        // because userDialogGroupSortingOptions, just i18n key
        groupSorting: {
            name: 'dialog.user.groups.sorting.alphabetical',
            value: 'alphabetical'
        },
        avatarSorting: 'update',
        avatarReleaseStatus: 'all',

        treeData: [],
        memo: '',
        $avatarInfo: {
            ownerId: '',
            avatarName: '',
            fileCreatedAt: ''
        },
        representedGroup: {
            bannerUrl: '',
            description: '',
            discriminator: '',
            groupId: '',
            iconUrl: '',
            isRepresenting: false,
            memberCount: 0,
            memberVisibility: '',
            name: '',
            ownerId: '',
            privacy: '',
            shortCode: '',
            $thumbnailUrl: ''
        },
        isRepresentedGroupLoading: false,
        joinCount: 0,
        timeSpent: 0,
        lastSeen: '',
        avatarModeration: 0,
        previousDisplayNames: [],
        dateFriended: '',
        unFriended: false,
        dateFriendedInfo: []
    };

    API.$on('LOGOUT', function () {
        $app.userDialog.visible = false;
    });

    API.$on('USER', function (args) {
        var { ref } = args;
        var D = $app.userDialog;
        if (D.visible === false || D.id !== ref.id) {
            return;
        }
        D.ref = ref;
        D.note = String(ref.note || '');
        D.noteSaving = false;
        D.incomingRequest = false;
        D.outgoingRequest = false;
        if (D.ref.friendRequestStatus === 'incoming') {
            D.incomingRequest = true;
        } else if (D.ref.friendRequestStatus === 'outgoing') {
            D.outgoingRequest = true;
        }
    });

    API.$on('USER', function (args) {
        // refresh user dialog JSON tab
        if (
            !$app.userDialog.visible ||
            $app.userDialog.id !== args.ref.id ||
            $app.$refs.userDialogTabs?.currentName !== '5'
        ) {
            return;
        }
        $app.refreshUserDialogTreeData();
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
        var { json } = args;
        D.isFriend = json.isFriend;
        D.incomingRequest = json.incomingRequest;
        D.outgoingRequest = json.outgoingRequest;
    });

    API.$on('FRIEND:REQUEST:CANCEL', function (args) {
        var D = $app.userDialog;
        if (D.visible === false || D.id !== args.params.userId) {
            return;
        }
        D.outgoingRequest = false;
    });

    API.$on('NOTIFICATION', function (args) {
        var { ref } = args;
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
        var { ref } = args;
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

    API.$on('NOTIFICATION:EXPIRE', function (args) {
        var { ref } = args;
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
        var { ref } = args;
        var D = $app.userDialog;
        if (
            D.visible === false ||
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
        } else if (ref.type === 'interactOff') {
            D.isInteractOff = true;
        } else if (ref.type === 'muteChat') {
            D.isMuteChat = true;
        }
        $app.$message({
            message: $t('message.user.moderated'),
            type: 'success'
        });
    });

    API.$on('PLAYER-MODERATION:@DELETE', function (args) {
        var { ref } = args;
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
        } else if (ref.type === 'interactOff') {
            D.isInteractOff = false;
        } else if (ref.type === 'muteChat') {
            D.isMuteChat = false;
        }
    });

    API.$on('FAVORITE', function (args) {
        var { ref } = args;
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
        if (!userId) {
            return;
        }
        const D = this.userDialog;
        D.id = userId;
        D.treeData = [];
        D.memo = '';
        D.note = '';
        D.noteSaving = false;
        this.getUserMemo(userId).then((memo) => {
            if (memo.userId === userId) {
                D.memo = memo.memo;
                const ref = this.friends.get(userId);
                if (ref) {
                    ref.memo = String(memo.memo || '');
                    if (memo.memo) {
                        ref.$nickName = memo.memo.split('\n')[0];
                    } else {
                        ref.$nickName = '';
                    }
                }
            }
        });
        D.visible = true;
        D.loading = true;
        D.avatars = [];
        D.worlds = [];
        D.instance = {
            id: '',
            tag: '',
            $location: {},
            friendCount: 0,
            users: [],
            shortName: '',
            ref: {}
        };
        D.isRepresentedGroupLoading = true;
        D.representedGroup = {
            bannerUrl: '',
            description: '',
            discriminator: '',
            groupId: '',
            iconUrl: '',
            isRepresenting: false,
            memberCount: 0,
            memberVisibility: '',
            name: '',
            ownerId: '',
            privacy: '',
            shortCode: '',
            $thumbnailUrl: ''
        };
        D.lastSeen = '';
        D.joinCount = 0;
        D.timeSpent = 0;
        D.avatarModeration = 0;
        D.isHideAvatar = false;
        D.isShowAvatar = false;
        D.previousDisplayNames = [];
        D.dateFriended = '';
        D.unFriended = false;
        D.dateFriendedInfo = [];
        if (userId === API.currentUser.id) {
            this.getWorldName(API.currentUser.homeLocation).then(
                (worldName) => {
                    D.$homeLocationName = worldName;
                }
            );
        }
        AppApi.SendIpc('ShowUserDialog', userId);
        userRequest
            .getCachedUser({
                userId
            })
            .catch((err) => {
                D.loading = false;
                D.visible = false;
                this.$message({
                    message: 'Failed to load user',
                    type: 'error'
                });
                throw err;
            })
            .then((args) => {
                if (args.ref.id === D.id) {
                    requestAnimationFrame(() => {
                        D.ref = args.ref;
                        D.friend = this.friends.get(D.id);
                        D.isFriend = Boolean(D.friend);
                        D.note = String(D.ref.note || '');
                        D.incomingRequest = false;
                        D.outgoingRequest = false;
                        D.isBlock = false;
                        D.isMute = false;
                        D.isInteractOff = false;
                        D.isMuteChat = false;
                        for (const ref of API.cachedPlayerModerations.values()) {
                            if (
                                ref.targetUserId === D.id &&
                                ref.sourceUserId === API.currentUser.id
                            ) {
                                if (ref.type === 'block') {
                                    D.isBlock = true;
                                } else if (ref.type === 'mute') {
                                    D.isMute = true;
                                } else if (ref.type === 'hideAvatar') {
                                    D.isHideAvatar = true;
                                } else if (ref.type === 'interactOff') {
                                    D.isInteractOff = true;
                                } else if (ref.type === 'muteChat') {
                                    D.isMuteChat = true;
                                }
                            }
                        }
                        D.isFavorite = API.cachedFavoritesByObjectId.has(D.id);
                        if (D.ref.friendRequestStatus === 'incoming') {
                            D.incomingRequest = true;
                        } else if (D.ref.friendRequestStatus === 'outgoing') {
                            D.outgoingRequest = true;
                        }
                        this.applyUserDialogLocation(true);

                        if (args.cache) {
                            userRequest.getUser(args.params);
                        }
                        let inCurrentWorld = false;
                        if (this.lastLocation.playerList.has(D.ref.id)) {
                            inCurrentWorld = true;
                        }
                        if (userId !== API.currentUser.id) {
                            database
                                .getUserStats(D.ref, inCurrentWorld)
                                .then((ref1) => {
                                    if (ref1.userId === D.id) {
                                        D.lastSeen = ref1.lastSeen;
                                        D.joinCount = ref1.joinCount;
                                        D.timeSpent = ref1.timeSpent;
                                    }
                                    let displayNameMap =
                                        ref1.previousDisplayNames;
                                    this.friendLogTable.data.forEach((ref2) => {
                                        if (ref2.userId === D.id) {
                                            if (ref2.type === 'DisplayName') {
                                                displayNameMap.set(
                                                    ref2.previousDisplayName,
                                                    ref2.created_at
                                                );
                                            }
                                            if (!D.dateFriended) {
                                                if (ref2.type === 'Unfriend') {
                                                    D.unFriended = true;
                                                    if (!this.hideUnfriends) {
                                                        D.dateFriended =
                                                            ref2.created_at;
                                                    }
                                                }
                                                if (ref2.type === 'Friend') {
                                                    D.unFriended = false;
                                                    D.dateFriended =
                                                        ref2.created_at;
                                                }
                                            }
                                            if (
                                                ref2.type === 'Friend' ||
                                                (ref2.type === 'Unfriend' &&
                                                    !this.hideUnfriends)
                                            ) {
                                                D.dateFriendedInfo.push(ref2);
                                            }
                                        }
                                    });
                                    const displayNameMapSorted = new Map(
                                        [...displayNameMap.entries()].sort(
                                            (a, b) => b[1] - a[1]
                                        )
                                    );
                                    D.previousDisplayNames = Array.from(
                                        displayNameMapSorted.keys()
                                    );
                                });
                            AppApi.GetVRChatUserModeration(
                                API.currentUser.id,
                                userId
                            ).then((result) => {
                                D.avatarModeration = result;
                                if (result === 4) {
                                    D.isHideAvatar = true;
                                } else if (result === 5) {
                                    D.isShowAvatar = true;
                                }
                            });
                        } else {
                            database
                                .getUserStats(D.ref, inCurrentWorld)
                                .then((ref1) => {
                                    if (ref1.userId === D.id) {
                                        D.lastSeen = ref1.lastSeen;
                                        D.joinCount = ref1.joinCount;
                                        D.timeSpent = ref1.timeSpent;
                                    }
                                });
                        }
                        groupRequest
                            .getRepresentedGroup({ userId })
                            .then((args1) => {
                                D.representedGroup = args1.json;
                                D.representedGroup.$thumbnailUrl =
                                    convertFileUrlToImageUrl(
                                        args1.json.iconUrl
                                    );
                                if (!args1.json || !args1.json.isRepresenting) {
                                    D.isRepresentedGroupLoading = false;
                                }
                            });
                        D.loading = false;
                    });
                }
            });
        this.showUserDialogHistory.delete(userId);
        this.showUserDialogHistory.add(userId);
        this.quickSearchItems = this.quickSearchUserHistory();
    };

    $app.methods.applyUserDialogLocation = function (updateInstanceOccupants) {
        var D = this.userDialog;
        if (!D.visible) {
            return;
        }
        var L = parseLocation(D.ref.$location.tag);
        if (updateInstanceOccupants && L.isRealInstance) {
            instanceRequest.getInstance({
                worldId: L.worldId,
                instanceId: L.instanceId
            });
        }
        D.$location = L;
        if (L.userId) {
            var ref = API.cachedUsers.get(L.userId);
            if (typeof ref === 'undefined') {
                userRequest
                    .getUser({
                        userId: L.userId
                    })
                    .then((args) => {
                        Vue.set(L, 'user', args.ref);
                        return args;
                    });
            } else {
                L.user = ref;
            }
        }
        var users = [];
        var friendCount = 0;
        var playersInInstance = this.lastLocation.playerList;
        var cachedCurrentUser = API.cachedUsers.get(API.currentUser.id);
        var currentLocation = cachedCurrentUser.$location.tag;
        if (!L.isOffline && currentLocation === L.tag) {
            var ref = API.cachedUsers.get(API.currentUser.id);
            if (typeof ref !== 'undefined') {
                users.push(ref); // add self
            }
        }
        // dont use gamelog when using api location
        if (
            this.lastLocation.location === L.tag &&
            playersInInstance.size > 0
        ) {
            var friendsInInstance = this.lastLocation.friendList;
            for (var friend of friendsInInstance.values()) {
                // if friend isn't in instance add them
                var addUser = !users.some(function (user) {
                    return friend.userId === user.id;
                });
                if (addUser) {
                    var ref = API.cachedUsers.get(friend.userId);
                    if (typeof ref !== 'undefined') {
                        users.push(ref);
                    }
                }
            }
            friendCount = users.length - 1;
        }
        if (!L.isOffline) {
            for (var friend of this.friends.values()) {
                if (typeof friend.ref === 'undefined') {
                    continue;
                }
                if (friend.ref.location === this.lastLocation.location) {
                    // don't add friends to currentUser gameLog instance (except when traveling)
                    continue;
                }
                if (friend.ref.$location.tag === L.tag) {
                    if (
                        friend.state !== 'online' &&
                        friend.ref.location === 'private'
                    ) {
                        // don't add offline friends to private instances
                        continue;
                    }
                    // if friend isn't in instance add them
                    var addUser = !users.some(function (user) {
                        return friend.name === user.displayName;
                    });
                    if (addUser) {
                        users.push(friend.ref);
                    }
                }
            }
            friendCount = users.length;
        }
        if (this.instanceUsersSortAlphabetical) {
            users.sort(compareByDisplayName);
        } else {
            users.sort(compareByLocationAt);
        }
        D.users = users;
        if (
            L.worldId &&
            currentLocation === L.tag &&
            playersInInstance.size > 0
        ) {
            D.instance = {
                id: L.instanceId,
                tag: L.tag,
                $location: L,
                friendCount: 0,
                users: [],
                shortName: '',
                ref: {}
            };
        }
        if (!L.isRealInstance) {
            D.instance = {
                id: L.instanceId,
                tag: L.tag,
                $location: L,
                friendCount: 0,
                users: [],
                shortName: '',
                ref: {}
            };
        }
        var instanceRef = API.cachedInstances.get(L.tag);
        if (typeof instanceRef !== 'undefined') {
            D.instance.ref = instanceRef;
        }
        D.instance.friendCount = friendCount;
        this.updateTimers();
    };

    // #endregion
    // #region | App: player list

    API.$on('LOGIN', function () {
        $app.currentInstanceUserList.data = [];
    });

    API.$on('USER:APPLY', function (ref) {
        // add user ref to playerList, friendList, photonLobby, photonLobbyCurrent
        var playerListRef = $app.lastLocation.playerList.get(ref.id);
        if (playerListRef) {
            // add/remove friends from lastLocation.friendList
            if (
                !$app.lastLocation.friendList.has(ref.id) &&
                $app.friends.has(ref.id)
            ) {
                var userMap = {
                    displayName: ref.displayName,
                    userId: ref.id,
                    joinTime: playerListRef.joinTime
                };
                $app.lastLocation.friendList.set(ref.id, userMap);
            }
            if (
                $app.lastLocation.friendList.has(ref.id) &&
                !$app.friends.has(ref.id)
            ) {
                $app.lastLocation.friendList.delete(ref.id);
            }
            $app.photonLobby.forEach((ref1, id) => {
                if (
                    typeof ref1 !== 'undefined' &&
                    ref1.displayName === ref.displayName &&
                    ref1 !== ref
                ) {
                    $app.photonLobby.set(id, ref);
                    if ($app.photonLobbyCurrent.has(id)) {
                        $app.photonLobbyCurrent.set(id, ref);
                    }
                }
            });
            $app.getCurrentInstanceUserList();
        }
    });

    $app.data.updatePlayerListTimer = null;
    $app.data.updatePlayerListPending = false;
    $app.methods.getCurrentInstanceUserList = function () {
        if (!this.friendLogInitStatus) {
            return;
        }
        if (this.updatePlayerListTimer) {
            this.updatePlayerListPending = true;
        } else {
            this.updatePlayerListExecute();
            this.updatePlayerListTimer = setTimeout(() => {
                if (this.updatePlayerListPending) {
                    this.updatePlayerListExecute();
                }
                this.updatePlayerListTimer = null;
            }, 150);
        }
    };

    $app.methods.updatePlayerListExecute = function () {
        try {
            this.updatePlayerListDebounce();
        } catch (err) {
            console.error(err);
        }
        this.updatePlayerListTimer = null;
        this.updatePlayerListPending = false;
    };

    $app.methods.updatePlayerListDebounce = function () {
        var users = [];
        var pushUser = function (ref) {
            var photonId = '';
            var isFriend = false;
            $app.photonLobbyCurrent.forEach((ref1, id) => {
                if (typeof ref1 !== 'undefined') {
                    if (
                        (typeof ref.id !== 'undefined' &&
                            typeof ref1.id !== 'undefined' &&
                            ref1.id === ref.id) ||
                        (typeof ref.displayName !== 'undefined' &&
                            typeof ref1.displayName !== 'undefined' &&
                            ref1.displayName === ref.displayName)
                    ) {
                        photonId = id;
                    }
                }
            });
            var isMaster = false;
            if (
                $app.photonLobbyMaster !== 0 &&
                photonId === $app.photonLobbyMaster
            ) {
                isMaster = true;
            }
            var isModerator = false;
            var lobbyJointime = $app.photonLobbyJointime.get(photonId);
            var inVRMode = null;
            var groupOnNameplate = '';
            if (typeof lobbyJointime !== 'undefined') {
                inVRMode = lobbyJointime.inVRMode;
                groupOnNameplate = lobbyJointime.groupOnNameplate;
                isModerator = lobbyJointime.canModerateInstance;
            }
            // if (groupOnNameplate) {
            //     API.getCachedGroup({
            //         groupId: groupOnNameplate
            //     }).then((args) => {
            //         groupOnNameplate = args.ref.name;
            //     });
            // }
            var timeoutTime = 0;
            if (typeof ref.id !== 'undefined') {
                isFriend = ref.isFriend;
                if (
                    $app.timeoutHudOverlayFilter === 'VIP' ||
                    $app.timeoutHudOverlayFilter === 'Friends'
                ) {
                    $app.photonLobbyTimeout.forEach((ref1) => {
                        if (ref1.userId === ref.id) {
                            timeoutTime = ref1.time;
                        }
                    });
                } else {
                    $app.photonLobbyTimeout.forEach((ref1) => {
                        if (ref1.displayName === ref.displayName) {
                            timeoutTime = ref1.time;
                        }
                    });
                }
            }
            users.push({
                ref,
                displayName: ref.displayName,
                timer: ref.$location_at,
                $trustSortNum: ref.$trustSortNum ?? 0,
                photonId,
                isMaster,
                isModerator,
                inVRMode,
                groupOnNameplate,
                isFriend,
                timeoutTime
            });
            // get block, mute
        };

        var playersInInstance = this.lastLocation.playerList;
        if (playersInInstance.size > 0) {
            var ref = API.cachedUsers.get(API.currentUser.id);
            if (typeof ref !== 'undefined' && playersInInstance.has(ref.id)) {
                pushUser(ref);
            }
            for (var player of playersInInstance.values()) {
                // if friend isn't in instance add them
                if (player.displayName === API.currentUser.displayName) {
                    continue;
                }
                var addUser = !users.some(function (user) {
                    return player.displayName === user.displayName;
                });
                if (addUser) {
                    var ref = API.cachedUsers.get(player.userId);
                    if (typeof ref !== 'undefined') {
                        pushUser(ref);
                    } else {
                        var { joinTime } = this.lastLocation.playerList.get(
                            player.userId
                        );
                        if (!joinTime) {
                            joinTime = Date.now();
                        }
                        var ref = {
                            // if userId is missing just push displayName
                            displayName: player.displayName,
                            $location_at: joinTime,
                            $online_for: joinTime
                        };
                        pushUser(ref);
                    }
                }
            }
        }
        this.currentInstanceUserList.data = users;
        this.updateTimers();
    };

    $app.data.updateInstanceInfo = 0;

    $app.data.currentInstanceWorld = {
        ref: {},
        instance: {},
        isPC: false,
        isQuest: false,
        isIos: false,
        avatarScalingDisabled: false,
        focusViewDisabled: false,
        inCache: false,
        cacheSize: '',
        bundleSizes: [],
        lastUpdated: ''
    };

    $app.data.currentInstanceWorldDescriptionExpanded = false;
    $app.data.currentInstanceLocation = {};

    $app.methods.updateCurrentInstanceWorld = function () {
        var instanceId = this.lastLocation.location;
        if (this.lastLocation.location === 'traveling') {
            instanceId = this.lastLocationDestination;
        }
        if (!instanceId) {
            this.currentInstanceWorld = {
                ref: {},
                instance: {},
                isPC: false,
                isQuest: false,
                isIos: false,
                avatarScalingDisabled: false,
                focusViewDisabled: false,
                inCache: false,
                cacheSize: '',
                bundleSizes: [],
                lastUpdated: ''
            };
            this.currentInstanceLocation = {};
        } else if (instanceId !== this.currentInstanceLocation.tag) {
            this.currentInstanceWorld = {
                ref: {},
                instance: {},
                isPC: false,
                isQuest: false,
                isIos: false,
                avatarScalingDisabled: false,
                focusViewDisabled: false,
                inCache: false,
                cacheSize: '',
                bundleSizes: [],
                lastUpdated: ''
            };
            var L = parseLocation(instanceId);
            this.currentInstanceLocation = L;
            worldRequest
                .getWorld({
                    worldId: L.worldId
                })
                .then((args) => {
                    this.currentInstanceWorld.ref = args.ref;
                    var { isPC, isQuest, isIos } = getAvailablePlatforms(
                        args.ref.unityPackages
                    );
                    this.currentInstanceWorld.isPC = isPC;
                    this.currentInstanceWorld.isQuest = isQuest;
                    this.currentInstanceWorld.isIos = isIos;
                    this.currentInstanceWorld.avatarScalingDisabled =
                        args.ref?.tags.includes(
                            'feature_avatar_scaling_disabled'
                        );
                    this.currentInstanceWorld.focusViewDisabled =
                        args.ref?.tags.includes('feature_focus_view_disabled');
                    checkVRChatCache(args.ref).then((cacheInfo) => {
                        if (cacheInfo.Item1 > 0) {
                            this.currentInstanceWorld.inCache = true;
                            this.currentInstanceWorld.cacheSize = `${(
                                cacheInfo.Item1 / 1048576
                            ).toFixed(2)} MB`;
                        }
                    });
                    this.getBundleDateSize(args.ref).then((bundleSizes) => {
                        this.currentInstanceWorld.bundleSizes = bundleSizes;
                    });
                    return args;
                });
        } else {
            worldRequest
                .getCachedWorld({
                    worldId: this.currentInstanceLocation.worldId
                })
                .then((args) => {
                    this.currentInstanceWorld.ref = args.ref;
                    var { isPC, isQuest, isIos } = getAvailablePlatforms(
                        args.ref.unityPackages
                    );
                    this.currentInstanceWorld.isPC = isPC;
                    this.currentInstanceWorld.isQuest = isQuest;
                    this.currentInstanceWorld.isIos = isIos;
                    checkVRChatCache(args.ref).then((cacheInfo) => {
                        if (cacheInfo.Item1 > 0) {
                            this.currentInstanceWorld.inCache = true;
                            this.currentInstanceWorld.cacheSize = `${(
                                cacheInfo.Item1 / 1048576
                            ).toFixed(2)} MB`;
                        }
                    });
                });
        }
        if (isRealInstance(instanceId)) {
            var ref = API.cachedInstances.get(instanceId);
            if (typeof ref !== 'undefined') {
                this.currentInstanceWorld.instance = ref;
            } else {
                var L = parseLocation(instanceId);
                if (L.isRealInstance) {
                    instanceRequest
                        .getInstance({
                            worldId: L.worldId,
                            instanceId: L.instanceId
                        })
                        .then((args) => {
                            this.currentInstanceWorld.instance = args.ref;
                        });
                }
            }
        }
    };

    $app.methods.updateTimers = function () {
        for (var $timer of $timers) {
            $timer.update();
        }
    };

    $app.methods.lookupAvatars = async function (type, search) {
        var avatars = new Map();
        if (type === 'search') {
            try {
                var response = await webApiService.execute({
                    url: `${
                        this.avatarRemoteDatabaseProvider
                    }?${type}=${encodeURIComponent(search)}&n=5000`,
                    method: 'GET',
                    headers: {
                        Referer: 'https://vrcx.app',
                        'VRCX-ID': this.vrcxId
                    }
                });
                var json = JSON.parse(response.data);
                if (this.debugWebRequests) {
                    console.log(json, response);
                }
                if (response.status === 200 && typeof json === 'object') {
                    json.forEach((avatar) => {
                        if (!avatars.has(avatar.Id)) {
                            var ref = {
                                authorId: '',
                                authorName: '',
                                name: '',
                                description: '',
                                id: '',
                                imageUrl: '',
                                thumbnailImageUrl: '',
                                created_at: '0001-01-01T00:00:00.0000000Z',
                                updated_at: '0001-01-01T00:00:00.0000000Z',
                                releaseStatus: 'public',
                                ...avatar
                            };
                            avatars.set(ref.id, ref);
                        }
                    });
                } else {
                    throw new Error(`Error: ${response.data}`);
                }
            } catch (err) {
                var msg = `Avatar search failed for ${search} with ${this.avatarRemoteDatabaseProvider}\n${err}`;
                console.error(msg);
                this.$message({
                    message: msg,
                    type: 'error'
                });
            }
        } else if (type === 'authorId') {
            var length = this.avatarRemoteDatabaseProviderList.length;
            for (var i = 0; i < length; ++i) {
                var url = this.avatarRemoteDatabaseProviderList[i];
                var avatarArray = await this.lookupAvatarsByAuthor(url, search);
                avatarArray.forEach((avatar) => {
                    if (!avatars.has(avatar.id)) {
                        avatars.set(avatar.id, avatar);
                    }
                });
            }
        }
        return avatars;
    };

    $app.methods.lookupAvatarByImageFileId = async function (authorId, fileId) {
        var length = this.avatarRemoteDatabaseProviderList.length;
        for (var i = 0; i < length; ++i) {
            var url = this.avatarRemoteDatabaseProviderList[i];
            var avatarArray = await this.lookupAvatarsByAuthor(url, authorId);
            for (var avatar of avatarArray) {
                if (extractFileId(avatar.imageUrl) === fileId) {
                    return avatar.id;
                }
            }
        }
        return null;
    };

    $app.methods.lookupAvatarsByAuthor = async function (url, authorId) {
        var avatars = [];
        if (!url) {
            return avatars;
        }
        try {
            var response = await webApiService.execute({
                url: `${url}?authorId=${encodeURIComponent(authorId)}`,
                method: 'GET',
                headers: {
                    Referer: 'https://vrcx.app',
                    'VRCX-ID': this.vrcxId
                }
            });
            var json = JSON.parse(response.data);
            if (this.debugWebRequests) {
                console.log(json, response);
            }
            if (response.status === 200 && typeof json === 'object') {
                json.forEach((avatar) => {
                    var ref = {
                        authorId: '',
                        authorName: '',
                        name: '',
                        description: '',
                        id: '',
                        imageUrl: '',
                        thumbnailImageUrl: '',
                        created_at: '0001-01-01T00:00:00.0000000Z',
                        updated_at: '0001-01-01T00:00:00.0000000Z',
                        releaseStatus: 'public',
                        ...avatar
                    };
                    avatars.push(ref);
                });
            } else {
                throw new Error(`Error: ${response.data}`);
            }
        } catch (err) {
            var msg = `Avatar lookup failed for ${authorId} with ${url}\n${err}`;
            console.error(msg);
            this.$message({
                message: msg,
                type: 'error'
            });
        }
        return avatars;
    };

    $app.methods.sortUserDialogAvatars = function (array) {
        var D = this.userDialog;
        if (D.avatarSorting === 'update') {
            array.sort($utils.compareByUpdatedAt);
        } else {
            array.sort($utils.compareByName);
        }
        D.avatars = array;
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
        D.avatarSorting = 'update';
        D.avatarReleaseStatus = 'all';
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
            fn: avatarRequest.getAvatars,
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

    $app.methods.refreshUserDialogTreeData = function () {
        var D = this.userDialog;
        if (D.id === API.currentUser.id) {
            var treeData = {
                ...API.currentUser,
                ...D.ref
            };
            D.treeData = $utils.buildTreeData(treeData);
            return;
        }
        D.treeData = $utils.buildTreeData(D.ref);
    };

    // #endregion
    // #region | App: World Dialog

    $app.data.worldDialog = {
        visible: false,
        loading: false,
        id: '',
        memo: '',
        $location: {},
        ref: {},
        isFavorite: false,
        avatarScalingDisabled: false,
        focusViewDisabled: false,
        rooms: [],
        treeData: [],
        bundleSizes: [],
        lastUpdated: '',
        inCache: false,
        cacheSize: 0,
        cacheLocked: false,
        cachePath: '',
        lastVisit: '',
        visitCount: 0,
        timeSpent: 0,
        isPC: false,
        isQuest: false,
        isIos: false,
        hasPersistData: false
    };

    API.$on('LOGOUT', function () {
        $app.worldDialog.visible = false;
    });

    API.$on('WORLD', function (args) {
        var { ref } = args;
        var D = $app.worldDialog;
        if (D.visible === false || D.id !== ref.id) {
            return;
        }
        D.ref = ref;
        D.avatarScalingDisabled = ref.tags?.includes(
            'feature_avatar_scaling_disabled'
        );
        D.focusViewDisabled = ref.tags?.includes('feature_focus_view_disabled');
        $app.applyWorldDialogInstances();
        for (var room of D.rooms) {
            if (isRealInstance(room.tag)) {
                instanceRequest.getInstance({
                    worldId: D.id,
                    instanceId: room.id
                });
            }
        }
        if (D.bundleSizes.length === 0) {
            $app.getBundleDateSize(ref).then((bundleSizes) => {
                D.bundleSizes = bundleSizes;
            });
        }
    });

    $app.methods.getBundleDateSize = async function (ref) {
        var bundleSizes = [];
        for (let i = ref.unityPackages.length - 1; i > -1; i--) {
            var unityPackage = ref.unityPackages[i];
            if (
                unityPackage.variant &&
                unityPackage.variant !== 'standard' &&
                unityPackage.variant !== 'security'
            ) {
                continue;
            }
            if (!compareUnityVersion(unityPackage.unitySortNumber)) {
                continue;
            }

            var platform = unityPackage.platform;
            if (bundleSizes[platform]) {
                continue;
            }
            var assetUrl = unityPackage.assetUrl;
            var fileId = extractFileId(assetUrl);
            var fileVersion = parseInt(extractFileVersion(assetUrl), 10);
            if (!fileId) {
                continue;
            }
            var args = await miscRequest.getBundles(fileId);
            if (!args?.json?.versions) {
                continue;
            }

            var { versions } = args.json;
            for (let j = versions.length - 1; j > -1; j--) {
                var version = versions[j];
                if (version.version === fileVersion) {
                    var createdAt = version.created_at;
                    var fileSize = `${(
                        version.file.sizeInBytes / 1048576
                    ).toFixed(2)} MB`;
                    bundleSizes[platform] = {
                        createdAt,
                        fileSize
                    };

                    // update avatar dialog
                    if (this.avatarDialog.id === ref.id) {
                        this.avatarDialog.bundleSizes[platform] =
                            bundleSizes[platform];
                        if (
                            this.avatarDialog.lastUpdated < version.created_at
                        ) {
                            this.avatarDialog.lastUpdated = version.created_at;
                        }
                    }
                    // update world dialog
                    if (this.worldDialog.id === ref.id) {
                        this.worldDialog.bundleSizes[platform] =
                            bundleSizes[platform];
                        if (this.worldDialog.lastUpdated < version.created_at) {
                            this.worldDialog.lastUpdated = version.created_at;
                        }
                    }
                    // update player list
                    if (this.currentInstanceLocation.worldId === ref.id) {
                        this.currentInstanceWorld.bundleSizes[platform] =
                            bundleSizes[platform];

                        if (
                            this.currentInstanceWorld.lastUpdated <
                            version.created_at
                        ) {
                            this.currentInstanceWorld.lastUpdated =
                                version.created_at;
                        }
                    }
                    break;
                }
            }
        }

        return bundleSizes;
    };

    API.$on('FAVORITE', function (args) {
        var { ref } = args;
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
        D.isFavorite = $app.localWorldFavoritesList.includes(D.id);
    });

    $app.methods.showWorldDialog = function (tag, shortName) {
        const D = this.worldDialog;
        const L = parseLocation(tag);
        if (L.worldId === '') {
            return;
        }
        L.shortName = shortName;
        D.id = L.worldId;
        D.$location = L;
        D.treeData = [];
        D.bundleSizes = [];
        D.lastUpdated = '';
        D.visible = true;
        D.loading = true;
        D.inCache = false;
        D.cacheSize = 0;
        D.cacheLocked = false;
        D.rooms = [];
        D.lastVisit = '';
        D.visitCount = '';
        D.timeSpent = 0;
        D.isFavorite = false;
        D.avatarScalingDisabled = false;
        D.focusViewDisabled = false;
        D.isPC = false;
        D.isQuest = false;
        D.isIos = false;
        D.hasPersistData = false;
        D.memo = '';
        var LL = parseLocation(this.lastLocation.location);
        var currentWorldMatch = false;
        if (LL.worldId === D.id) {
            currentWorldMatch = true;
        }
        this.getWorldMemo(D.id).then((memo) => {
            if (memo.worldId === D.id) {
                D.memo = memo.memo;
            }
        });
        database.getLastVisit(D.id, currentWorldMatch).then((ref) => {
            if (ref.worldId === D.id) {
                D.lastVisit = ref.created_at;
            }
        });
        database.getVisitCount(D.id).then((ref) => {
            if (ref.worldId === D.id) {
                D.visitCount = ref.visitCount;
            }
        });
        database.getTimeSpentInWorld(D.id).then((ref) => {
            if (ref.worldId === D.id) {
                D.timeSpent = ref.timeSpent;
            }
        });
        worldRequest
            .getCachedWorld({
                worldId: L.worldId
            })
            .catch((err) => {
                D.loading = false;
                D.visible = false;
                this.$message({
                    message: 'Failed to load world',
                    type: 'error'
                });
                throw err;
            })
            .then((args) => {
                if (D.id === args.ref.id) {
                    D.loading = false;
                    D.ref = args.ref;
                    D.isFavorite = API.cachedFavoritesByObjectId.has(D.id);
                    if (!D.isFavorite) {
                        D.isFavorite = this.localWorldFavoritesList.includes(
                            D.id
                        );
                    }
                    var { isPC, isQuest, isIos } = getAvailablePlatforms(
                        args.ref.unityPackages
                    );
                    D.avatarScalingDisabled = args.ref?.tags.includes(
                        'feature_avatar_scaling_disabled'
                    );
                    D.focusViewDisabled = args.ref?.tags.includes(
                        'feature_focus_view_disabled'
                    );
                    D.isPC = isPC;
                    D.isQuest = isQuest;
                    D.isIos = isIos;
                    this.updateVRChatWorldCache();
                    miscRequest.hasWorldPersistData({ worldId: D.id });
                    if (args.cache) {
                        worldRequest
                            .getWorld(args.params)
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
        if (!D.visible) {
            return;
        }
        var instances = {};
        if (D.ref.instances) {
            for (var instance of D.ref.instances) {
                // instance = [ instanceId, occupants ]
                var instanceId = instance[0];
                instances[instanceId] = {
                    id: instanceId,
                    tag: `${D.id}:${instanceId}`,
                    $location: {},
                    friendCount: 0,
                    users: [],
                    shortName: '',
                    ref: {}
                };
            }
        }
        var { instanceId, shortName } = D.$location;
        if (instanceId && typeof instances[instanceId] === 'undefined') {
            instances[instanceId] = {
                id: instanceId,
                tag: `${D.id}:${instanceId}`,
                $location: {},
                friendCount: 0,
                users: [],
                shortName,
                ref: {}
            };
        }
        var cachedCurrentUser = API.cachedUsers.get(API.currentUser.id);
        var lastLocation$ = cachedCurrentUser.$location;
        var playersInInstance = this.lastLocation.playerList;
        if (lastLocation$.worldId === D.id && playersInInstance.size > 0) {
            // pull instance json from cache
            var friendsInInstance = this.lastLocation.friendList;
            var instance = {
                id: lastLocation$.instanceId,
                tag: lastLocation$.tag,
                $location: {},
                friendCount: friendsInInstance.size,
                users: [],
                shortName: '',
                ref: {}
            };
            instances[instance.id] = instance;
            for (var friend of friendsInInstance.values()) {
                // if friend isn't in instance add them
                var addUser = !instance.users.some(function (user) {
                    return friend.userId === user.id;
                });
                if (addUser) {
                    var ref = API.cachedUsers.get(friend.userId);
                    if (typeof ref !== 'undefined') {
                        instance.users.push(ref);
                    }
                }
            }
        }
        for (var { ref } of this.friends.values()) {
            if (
                typeof ref === 'undefined' ||
                typeof ref.$location === 'undefined' ||
                ref.$location.worldId !== D.id ||
                (ref.$location.instanceId === lastLocation$.instanceId &&
                    playersInInstance.size > 0 &&
                    ref.location !== 'traveling')
            ) {
                continue;
            }
            if (ref.location === this.lastLocation.location) {
                // don't add friends to currentUser gameLog instance (except when traveling)
                continue;
            }
            var { instanceId } = ref.$location;
            var instance = instances[instanceId];
            if (typeof instance === 'undefined') {
                instance = {
                    id: instanceId,
                    tag: `${D.id}:${instanceId}`,
                    $location: {},
                    friendCount: 0,
                    users: [],
                    shortName: '',
                    ref: {}
                };
                instances[instanceId] = instance;
            }
            instance.users.push(ref);
        }
        var ref = API.cachedUsers.get(API.currentUser.id);
        if (typeof ref !== 'undefined' && ref.$location.worldId === D.id) {
            var { instanceId } = ref.$location;
            var instance = instances[instanceId];
            if (typeof instance === 'undefined') {
                instance = {
                    id: instanceId,
                    tag: `${D.id}:${instanceId}`,
                    $location: {},
                    friendCount: 0,
                    users: [],
                    shortName: '',
                    ref: {}
                };
                instances[instanceId] = instance;
            }
            instance.users.push(ref); // add self
        }
        var rooms = [];
        for (var instance of Object.values(instances)) {
            // due to references on callback of API.getUser()
            // this should be block scope variable
            const L = parseLocation(`${D.id}:${instance.id}`);
            instance.location = L.tag;
            if (!L.shortName) {
                L.shortName = instance.shortName;
            }
            instance.$location = L;
            if (L.userId) {
                var ref = API.cachedUsers.get(L.userId);
                if (typeof ref === 'undefined') {
                    userRequest
                        .getUser({
                            userId: L.userId
                        })
                        .then((args) => {
                            Vue.set(L, 'user', args.ref);
                            return args;
                        });
                } else {
                    L.user = ref;
                }
            }
            if (instance.friendCount === 0) {
                instance.friendCount = instance.users.length;
            }
            if (this.instanceUsersSortAlphabetical) {
                instance.users.sort(compareByDisplayName);
            } else {
                instance.users.sort(compareByLocationAt);
            }
            rooms.push(instance);
        }
        // get instance from cache
        for (var room of rooms) {
            var ref = API.cachedInstances.get(room.tag);
            if (typeof ref !== 'undefined') {
                room.ref = ref;
            }
        }
        rooms.sort(function (a, b) {
            // sort selected and current instance to top
            if (
                b.location === D.$location.tag ||
                b.location === lastLocation$.tag
            ) {
                // sort selected instance above current instance
                if (a.location === D.$location.tag) {
                    return -1;
                }
                return 1;
            }
            if (
                a.location === D.$location.tag ||
                a.location === lastLocation$.tag
            ) {
                // sort selected instance above current instance
                if (b.location === D.$location.tag) {
                    return 1;
                }
                return -1;
            }
            // sort by number of users when no friends in instance
            if (a.users.length === 0 && b.users.length === 0) {
                if (a.ref?.userCount < b.ref?.userCount) {
                    return 1;
                }
                return -1;
            }
            // sort by number of friends in instance
            if (a.users.length < b.users.length) {
                return 1;
            }
            return -1;
        });
        D.rooms = rooms;
        this.updateTimers();
    };

    $app.methods.applyGroupDialogInstances = function (inputInstances) {
        var D = this.groupDialog;
        if (!D.visible) {
            return;
        }
        var instances = {};
        for (var instance of D.instances) {
            instances[instance.tag] = {
                ...instance,
                friendCount: 0,
                users: []
            };
        }
        if (typeof inputInstances !== 'undefined') {
            for (var instance of inputInstances) {
                instances[instance.location] = {
                    id: instance.instanceId,
                    tag: instance.location,
                    $location: {},
                    friendCount: 0,
                    users: [],
                    shortName: instance.shortName,
                    ref: instance
                };
            }
        }
        var cachedCurrentUser = API.cachedUsers.get(API.currentUser.id);
        var lastLocation$ = cachedCurrentUser.$location;
        var currentLocation = lastLocation$.tag;
        var playersInInstance = this.lastLocation.playerList;
        if (lastLocation$.groupId === D.id && playersInInstance.size > 0) {
            var friendsInInstance = this.lastLocation.friendList;
            var instance = {
                id: lastLocation$.instanceId,
                tag: currentLocation,
                $location: {},
                friendCount: friendsInInstance.size,
                users: [],
                shortName: '',
                ref: {}
            };
            instances[currentLocation] = instance;
            for (var friend of friendsInInstance.values()) {
                // if friend isn't in instance add them
                var addUser = !instance.users.some(function (user) {
                    return friend.userId === user.id;
                });
                if (addUser) {
                    var ref = API.cachedUsers.get(friend.userId);
                    if (typeof ref !== 'undefined') {
                        instance.users.push(ref);
                    }
                }
            }
        }
        for (var { ref } of this.friends.values()) {
            if (
                typeof ref === 'undefined' ||
                typeof ref.$location === 'undefined' ||
                ref.$location.groupId !== D.id ||
                (ref.$location.instanceId === lastLocation$.instanceId &&
                    playersInInstance.size > 0 &&
                    ref.location !== 'traveling')
            ) {
                continue;
            }
            if (ref.location === this.lastLocation.location) {
                // don't add friends to currentUser gameLog instance (except when traveling)
                continue;
            }
            var { instanceId, tag } = ref.$location;
            var instance = instances[tag];
            if (typeof instance === 'undefined') {
                instance = {
                    id: instanceId,
                    tag,
                    $location: {},
                    friendCount: 0,
                    users: [],
                    shortName: '',
                    ref: {}
                };
                instances[tag] = instance;
            }
            instance.users.push(ref);
        }
        var ref = API.cachedUsers.get(API.currentUser.id);
        if (typeof ref !== 'undefined' && ref.$location.groupId === D.id) {
            var { instanceId, tag } = ref.$location;
            var instance = instances[tag];
            if (typeof instance === 'undefined') {
                instance = {
                    id: instanceId,
                    tag,
                    $location: {},
                    friendCount: 0,
                    users: [],
                    shortName: '',
                    ref: {}
                };
                instances[tag] = instance;
            }
            instance.users.push(ref); // add self
        }
        var rooms = [];
        for (var instance of Object.values(instances)) {
            // due to references on callback of API.getUser()
            // this should be block scope variable
            const L = parseLocation(instance.tag);
            instance.location = instance.tag;
            instance.$location = L;
            if (instance.friendCount === 0) {
                instance.friendCount = instance.users.length;
            }
            if (this.instanceUsersSortAlphabetical) {
                instance.users.sort(compareByDisplayName);
            } else {
                instance.users.sort(compareByLocationAt);
            }
            rooms.push(instance);
        }
        // get instance
        for (var room of rooms) {
            var ref = API.cachedInstances.get(room.tag);
            if (typeof ref !== 'undefined') {
                room.ref = ref;
            } else if (isRealInstance(room.tag)) {
                instanceRequest.getInstance({
                    worldId: room.$location.worldId,
                    instanceId: room.$location.instanceId
                });
            }
        }
        rooms.sort(function (a, b) {
            // sort current instance to top
            if (b.location === currentLocation) {
                return 1;
            }
            if (a.location === currentLocation) {
                return -1;
            }
            // sort by number of users when no friends in instance
            if (a.users.length === 0 && b.users.length === 0) {
                if (a.ref?.userCount < b.ref?.userCount) {
                    return 1;
                }
                return -1;
            }
            // sort by number of friends in instance
            if (a.users.length < b.users.length) {
                return 1;
            }
            return -1;
        });
        D.instances = rooms;
        this.updateTimers();
    };

    $app.methods.worldDialogCommand = function (command) {
        var D = this.worldDialog;
        if (D.visible === false) {
            return;
        }
        switch (command) {
            case 'New Instance and Self Invite':
                this.newInstanceSelfInvite(D.id);
                break;
            case 'Rename':
                this.promptRenameWorld(D);
                break;
            case 'Change Description':
                this.promptChangeWorldDescription(D);
                break;
            case 'Change Capacity':
                this.promptChangeWorldCapacity(D);
                break;
            case 'Change Recommended Capacity':
                this.promptChangeWorldRecommendedCapacity(D);
                break;
            case 'Change YouTube Preview':
                this.promptChangeWorldYouTubePreview(D);
                break;
        }
    };

    $app.methods.newInstanceSelfInvite = function (worldId) {
        this.createNewInstance(worldId).then((args) => {
            const location = args?.json?.location;
            if (!location) {
                this.$message({
                    message: 'Failed to create instance',
                    type: 'error'
                });
                return;
            }
            // self invite
            var L = parseLocation(location);
            if (!L.isRealInstance) {
                return;
            }
            instanceRequest
                .selfInvite({
                    instanceId: L.instanceId,
                    worldId: L.worldId
                })
                .then((args) => {
                    this.$message({
                        message: 'Self invite sent',
                        type: 'success'
                    });
                    return args;
                });
        });
    };

    // #endregion
    // #region | App: Avatar Dialog

    $app.data.avatarDialog = {
        visible: false,
        loading: false,
        id: '',
        memo: '',
        ref: {},
        isFavorite: false,
        isBlocked: false,
        isQuestFallback: false,
        hasImposter: false,
        imposterVersion: '',
        isPC: false,
        isQuest: false,
        isIos: false,
        bundleSizes: [],
        platformInfo: {},
        galleryImages: [],
        galleryLoading: false,
        lastUpdated: '',
        inCache: false,
        cacheSize: 0,
        cacheLocked: false,
        cachePath: ''
    };

    API.$on('FAVORITE', function (args) {
        var { ref } = args;
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
        var D = this.avatarDialog;
        D.visible = true;
        D.loading = true;
        D.id = avatarId;
        D.inCache = false;
        D.cacheSize = 0;
        D.cacheLocked = false;
        D.cachePath = '';
        D.isQuestFallback = false;
        D.isPC = false;
        D.isQuest = false;
        D.isIos = false;
        D.hasImposter = false;
        D.imposterVersion = '';
        D.lastUpdated = '';
        D.bundleSizes = [];
        D.platformInfo = {};
        D.galleryImages = [];
        D.galleryLoading = true;
        D.isFavorite =
            API.cachedFavoritesByObjectId.has(avatarId) ||
            (API.currentUser.$isVRCPlus &&
                this.localAvatarFavoritesList.includes(avatarId));
        D.isBlocked = API.cachedAvatarModerations.has(avatarId);
        var ref2 = API.cachedAvatars.get(avatarId);
        if (typeof ref2 !== 'undefined') {
            D.ref = ref2;
            this.updateVRChatAvatarCache();
            if (
                ref2.releaseStatus !== 'public' &&
                ref2.authorId !== API.currentUser.id
            ) {
                D.loading = false;
                return;
            }
        }
        avatarRequest
            .getAvatar({ avatarId })
            .then((args) => {
                var { ref } = args;
                D.ref = ref;
                this.getAvatarGallery(avatarId);
                this.updateVRChatAvatarCache();
                if (/quest/.test(ref.tags)) {
                    D.isQuestFallback = true;
                }
                var { isPC, isQuest, isIos } = getAvailablePlatforms(
                    args.ref.unityPackages
                );
                D.isPC = isPC;
                D.isQuest = isQuest;
                D.isIos = isIos;
                D.platformInfo = getPlatformInfo(args.ref.unityPackages);
                for (let i = ref.unityPackages.length - 1; i > -1; i--) {
                    var unityPackage = ref.unityPackages[i];
                    if (unityPackage.variant === 'impostor') {
                        D.hasImposter = true;
                        D.imposterVersion = unityPackage.impostorizerVersion;
                        break;
                    }
                }
                if (D.bundleSizes.length === 0) {
                    this.getBundleDateSize(ref).then((bundleSizes) => {
                        D.bundleSizes = bundleSizes;
                    });
                }
            })
            .catch((err) => {
                D.visible = false;
                throw err;
            })
            .finally(() => {
                this.$nextTick(() => (D.loading = false));
            });
    };

    $app.methods.getAvatarGallery = async function (avatarId) {
        var D = this.avatarDialog;
        const args = await avatarRequest
            .getAvatarGallery(avatarId)
            .finally(() => {
                D.galleryLoading = false;
            });
        if (args.params.galleryId !== D.id) {
            return;
        }
        D.galleryImages = [];
        // wtf is this? why is order sorting only needed if it's your own avatar?
        const sortedGallery = args.json.sort((a, b) => {
            if (!a.order && !b.order) {
                return 0;
            }
            return a.order - b.order;
        });
        for (const file of sortedGallery) {
            const url = file.versions[file.versions.length - 1].file.url;
            D.galleryImages.push(url);
        }

        // for JSON tab treeData
        D.ref.gallery = args.json;
        return D.galleryImages;
    };

    $app.methods.selectAvatarWithConfirmation = function (id) {
        this.$confirm(`Continue? Select Avatar`, 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action !== 'confirm') {
                    return;
                }
                $app.selectAvatarWithoutConfirmation(id);
            }
        });
    };

    $app.methods.selectAvatarWithoutConfirmation = function (id) {
        if (API.currentUser.currentAvatar === id) {
            this.$message({
                message: 'Avatar already selected',
                type: 'info'
            });
            return;
        }
        avatarRequest
            .selectAvatar({
                avatarId: id
            })
            .then((args) => {
                new Noty({
                    type: 'success',
                    text: 'Avatar changed via launch command'
                }).show();
                return args;
            });
    };

    $app.methods.checkAvatarCache = function (fileId) {
        var avatarId = '';
        for (var ref of API.cachedAvatars.values()) {
            if (extractFileId(ref.imageUrl) === fileId) {
                avatarId = ref.id;
            }
        }
        return avatarId;
    };

    $app.methods.checkAvatarCacheRemote = async function (fileId, ownerUserId) {
        if (this.avatarRemoteDatabase) {
            var avatarId = await this.lookupAvatarByImageFileId(
                ownerUserId,
                fileId
            );
            return avatarId;
        }
        return null;
    };

    $app.methods.showAvatarAuthorDialog = async function (
        refUserId,
        ownerUserId,
        currentAvatarImageUrl
    ) {
        var fileId = extractFileId(currentAvatarImageUrl);
        if (!fileId) {
            this.$message({
                message: 'Sorry, the author is unknown',
                type: 'error'
            });
        } else if (refUserId === API.currentUser.id) {
            this.showAvatarDialog(API.currentUser.currentAvatar);
        } else {
            var avatarId = await this.checkAvatarCache(fileId);
            if (!avatarId) {
                var avatarInfo = await this.getAvatarName(
                    currentAvatarImageUrl
                );
                if (avatarInfo.ownerId === API.currentUser.id) {
                    this.refreshUserDialogAvatars(fileId);
                }
            }
            if (!avatarId) {
                avatarId = await this.checkAvatarCacheRemote(
                    fileId,
                    avatarInfo.ownerId
                );
            }
            if (!avatarId) {
                if (avatarInfo.ownerId === refUserId) {
                    this.$message({
                        message:
                            "It's personal (own) avatar or not found in avatar database",
                        type: 'warning'
                    });
                } else {
                    this.$message({
                        message: 'Avatar not found in avatar database',
                        type: 'warning'
                    });
                    this.showUserDialog(avatarInfo.ownerId);
                }
            }
            if (avatarId) {
                this.showAvatarDialog(avatarId);
            }
        }
    };

    // #endregion
    // #region | App: Favorite Dialog

    $app.data.favoriteDialog = {
        visible: false,
        loading: false,
        type: '',
        objectId: '',
        currentGroup: {}
    };

    $app.methods.showFavoriteDialog = function (type, objectId) {
        const D = this.favoriteDialog;
        D.type = type;
        D.objectId = objectId;
        D.visible = true;
        this.updateFavoriteDialog(objectId);
    };

    $app.methods.updateFavoriteDialog = function (objectId) {
        var D = this.favoriteDialog;
        if (!D.visible || D.objectId !== objectId) {
            return;
        }
        D.currentGroup = {};
        var favorite = this.favoriteObjects.get(objectId);
        if (favorite) {
            for (var group of API.favoriteWorldGroups) {
                if (favorite.groupKey === group.key) {
                    D.currentGroup = group;
                    return;
                }
            }
            for (var group of API.favoriteAvatarGroups) {
                if (favorite.groupKey === group.key) {
                    D.currentGroup = group;
                    return;
                }
            }
            for (var group of API.favoriteFriendGroups) {
                if (favorite.groupKey === group.key) {
                    D.currentGroup = group;
                    return;
                }
            }
        }
    };

    API.$on('FAVORITE:ADD', function (args) {
        $app.updateFavoriteDialog(args.params.favoriteId);
    });

    API.$on('FAVORITE:DELETE', function (args) {
        $app.updateFavoriteDialog(args.params.objectId);
    });

    // #endregion
    // #region | App: New Instance Dialog

    $app.data.instanceContentSettings = [
        'emoji',
        'stickers',
        'pedestals',
        'prints',
        'drones',
        'props'
    ];

    $app.methods.createNewInstance = async function (worldId = '', options) {
        let D = options;

        if (!D) {
            D = {
                loading: false,
                accessType: await configRepository.getString(
                    'instanceDialogAccessType',
                    'public'
                ),
                region: await configRepository.getString(
                    'instanceRegion',
                    'US West'
                ),
                worldId: worldId,
                groupId: await configRepository.getString(
                    'instanceDialogGroupId',
                    ''
                ),
                groupAccessType: await configRepository.getString(
                    'instanceDialogGroupAccessType',
                    'plus'
                ),
                ageGate: await configRepository.getBool(
                    'instanceDialogAgeGate',
                    false
                ),
                queueEnabled: await configRepository.getBool(
                    'instanceDialogQueueEnabled',
                    true
                ),
                roleIds: [],
                groupRef: {}
            };
        }

        var type = 'public';
        var canRequestInvite = false;
        switch (D.accessType) {
            case 'friends':
                type = 'friends';
                break;
            case 'friends+':
                type = 'hidden';
                break;
            case 'invite':
                type = 'private';
                break;
            case 'invite+':
                type = 'private';
                canRequestInvite = true;
                break;
            case 'group':
                type = 'group';
                break;
        }
        var region = 'us';
        if (D.region === 'US East') {
            region = 'use';
        } else if (D.region === 'Europe') {
            region = 'eu';
        } else if (D.region === 'Japan') {
            region = 'jp';
        }
        var params = {
            type,
            canRequestInvite,
            worldId: D.worldId,
            ownerId: API.currentUser.id,
            region
        };
        if (type === 'group') {
            params.groupAccessType = D.groupAccessType;
            params.ownerId = D.groupId;
            params.queueEnabled = D.queueEnabled;
            if (D.groupAccessType === 'members') {
                params.roleIds = D.roleIds;
            }
        }
        if (
            D.ageGate &&
            type === 'group' &&
            hasGroupPermission(D.groupRef, 'group-instance-age-gated-create')
        ) {
            params.ageGate = true;
        }
        try {
            var args = await instanceRequest.createInstance(params);
            return args;
        } catch (err) {
            console.error(err);
            return null;
        }
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
                userRequest
                    .saveCurrentUser({
                        homeLocation: tag
                    })
                    .then((args) => {
                        this.$message({
                            message: 'Home world updated',
                            type: 'success'
                        });
                        return args;
                    });
            }
        });
    };

    // #endregion
    // #region | App: Launch Options Dialog

    $app.data.isLaunchOptionsDialogVisible = false;

    $app.methods.showLaunchOptions = function () {
        this.isLaunchOptionsDialogVisible = true;
    };

    // #endregion
    // #region | App: Notification position

    $app.data.isNotificationPositionDialogVisible = false;

    $app.methods.showNotificationPositionDialog = function () {
        this.isNotificationPositionDialogVisible = true;
    };

    // #endregion
    // #region | App: Noty feed filters
    // #region | App: Wrist feed filters

    $app.data.feedFiltersDialogMode = '';

    $app.methods.showNotyFeedFiltersDialog = function () {
        this.feedFiltersDialogMode = 'noty';
    };
    $app.methods.showWristFeedFiltersDialog = function () {
        this.feedFiltersDialogMode = 'wrist';
    };

    // #endregion
    // #region | App: Launch Dialog

    $app.data.launchDialogData = {
        visible: false,
        loading: false,
        tag: '',
        shortName: ''
    };

    $app.methods.showLaunchDialog = async function (tag, shortName) {
        this.launchDialogData = {
            visible: true,
            // flag, use for trigger adjustDialogZ
            loading: true,
            tag,
            shortName
        };
        this.$nextTick(() => (this.launchDialogData.loading = false));
    };

    $app.methods.launchGame = async function (
        location,
        shortName,
        desktopMode
    ) {
        var L = parseLocation(location);
        var args = [];
        if (
            shortName &&
            L.instanceType !== 'public' &&
            L.groupAccessType !== 'public'
        ) {
            args.push(
                `vrchat://launch?ref=vrcx.app&id=${location}&shortName=${shortName}`
            );
        } else {
            // fetch shortName
            var newShortName = '';
            var response = await instanceRequest.getInstanceShortName({
                worldId: L.worldId,
                instanceId: L.instanceId
            });
            if (response.json) {
                if (response.json.shortName) {
                    newShortName = response.json.shortName;
                } else {
                    newShortName = response.json.secureName;
                }
            }
            if (newShortName) {
                args.push(
                    `vrchat://launch?ref=vrcx.app&id=${location}&shortName=${newShortName}`
                );
            } else {
                args.push(`vrchat://launch?ref=vrcx.app&id=${location}`);
            }
        }

        const launchArguments =
            await configRepository.getString('launchArguments');

        const vrcLaunchPathOverride = await configRepository.getString(
            'vrcLaunchPathOverride'
        );

        if (launchArguments) {
            args.push(launchArguments);
        }
        if (desktopMode) {
            args.push('--no-vr');
        }
        if (vrcLaunchPathOverride && !LINUX) {
            AppApi.StartGameFromPath(
                vrcLaunchPathOverride,
                args.join(' ')
            ).then((result) => {
                if (!result) {
                    this.$message({
                        message:
                            'Failed to launch VRChat, invalid custom path set',
                        type: 'error'
                    });
                } else {
                    this.$message({
                        message: 'VRChat launched',
                        type: 'success'
                    });
                }
            });
        } else {
            AppApi.StartGame(args.join(' ')).then((result) => {
                if (!result) {
                    this.$message({
                        message:
                            'Failed to find VRChat, set a custom path in launch options',
                        type: 'error'
                    });
                } else {
                    this.$message({
                        message: 'VRChat launched',
                        type: 'success'
                    });
                }
            });
        }
        console.log('Launch Game', args.join(' '), desktopMode);
    };

    // #endregion
    // #region | App: Copy To Clipboard

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

    $app.methods.copyLink = function (text) {
        this.$message({
            message: 'Link copied to clipboard',
            type: 'success'
        });
        this.copyToClipboard(text);
    };

    // #endregion
    // #region | App: VRCPlus Icons

    API.$on('LOGIN', function () {
        $app.VRCPlusIconsTable = [];
    });

    $app.methods.refreshVRCPlusIconsTable = function () {
        this.galleryDialogIconsLoading = true;
        var params = {
            n: 100,
            tag: 'icon'
        };
        vrcPlusIconRequest.getFileList(params).finally(() => {
            this.galleryDialogIconsLoading = false;
        });
    };

    API.$on('FILES:LIST', function (args) {
        if (args.params.tag === 'icon') {
            $app.VRCPlusIconsTable = args.json.reverse();
        }
    });

    API.$on('VRCPLUSICON:ADD', function (args) {
        if (Object.keys($app.VRCPlusIconsTable).length !== 0) {
            $app.VRCPlusIconsTable.unshift(args.json);
        }
    });

    $app.data.uploadImage = '';

    $app.methods.inviteImageUpload = function (e) {
        var files = e.target.files || e.dataTransfer.files;
        if (!files.length) {
            return;
        }
        if (files[0].size >= 100000000) {
            // 100MB
            $app.$message({
                message: $t('message.file.too_large'),
                type: 'error'
            });
            this.clearInviteImageUpload();
            return;
        }
        if (!files[0].type.match(/image.*/)) {
            $app.$message({
                message: $t('message.file.not_image'),
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
            return $utils.timeToText(Date.now() - ctx.ref.$online_for);
        } else if (ctx.ref.state === 'active' && ctx.ref.$active_for) {
            return $utils.timeToText(Date.now() - ctx.ref.$active_for);
        } else if (ctx.ref.$offline_for) {
            return $utils.timeToText(Date.now() - ctx.ref.$offline_for);
        }
        return '-';
    };

    // #endregion
    // #region | App: Invite Messages

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

    // temp, invites.pug
    API.refreshInviteMessageTableData =
        inviteMessagesRequest.refreshInviteMessageTableData;

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

    // #endregion
    // #region | App: Edit Invite Message Dialog

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
        var D = this.editInviteMessageDialog;
        D.newMessage = inviteMessage.message;
        D.visible = true;
        D.inviteMessage = inviteMessage;
        D.messageType = messageType;
    };

    // #endregion
    // #region | App: Friends List

    $app.data.friendsListSearch = '';
    // $app.data.friendsListSelectAllCheckbox = false;

    // $app.methods.showBulkUnfriendAllConfirm = function () {
    //     this.$confirm(
    //         `Are you sure you want to delete all your friends?
    //         This can negatively affect your trust rank,
    //         This action cannot be undone.`,
    //         'Delete all friends?',
    //         {
    //             confirmButtonText: 'Confirm',
    //             cancelButtonText: 'Cancel',
    //             type: 'info',
    //             callback: (action) => {
    //                 if (action === 'confirm') {
    //                     this.bulkUnfriendAll();
    //                 }
    //             }
    //         }
    //     );
    // };

    // $app.methods.bulkUnfriendAll = function () {
    //     for (var ctx of this.friendsListTable.data) {
    //         API.deleteFriend({
    //             userId: ctx.id
    //         });
    //     }
    // };

    $app.methods.getAllUserStats = async function () {
        var userIds = [];
        var displayNames = [];
        for (var ctx of this.friends.values()) {
            userIds.push(ctx.id);
            if (ctx.ref?.displayName) {
                displayNames.push(ctx.ref.displayName);
            }
        }

        var data = await database.getAllUserStats(userIds, displayNames);
        var friendListMap = new Map();
        for (var item of data) {
            if (!item.userId) {
                // find userId from previous data with matching displayName
                for (var ref of data) {
                    if (ref.displayName === item.displayName && ref.userId) {
                        item.userId = ref.userId;
                    }
                }
                // if still no userId, find userId from friends list
                if (!item.userId) {
                    for (var ref of this.friends.values()) {
                        if (
                            ref?.ref?.id &&
                            ref.ref.displayName === item.displayName
                        ) {
                            item.userId = ref.id;
                        }
                    }
                }
                // if still no userId, skip
                if (!item.userId) {
                    continue;
                }
            }

            var friend = friendListMap.get(item.userId);
            if (!friend) {
                friendListMap.set(item.userId, item);
                continue;
            }
            if (Date.parse(item.lastSeen) > Date.parse(friend.lastSeen)) {
                friend.lastSeen = item.lastSeen;
            }
            friend.timeSpent += item.timeSpent;
            friend.joinCount += item.joinCount;
            friend.displayName = item.displayName;
            friendListMap.set(item.userId, friend);
        }
        for (var item of friendListMap.values()) {
            var ref = this.friends.get(item.userId);
            if (ref?.ref) {
                ref.ref.$joinCount = item.joinCount;
                ref.ref.$lastSeen = item.lastSeen;
                ref.ref.$timeSpent = item.timeSpent;
            }
        }
    };

    $app.methods.getUserStats = async function (ctx) {
        var ref = await database.getUserStats(ctx);
        /* eslint-disable require-atomic-updates */
        ctx.$joinCount = ref.joinCount;
        ctx.$lastSeen = ref.lastSeen;
        ctx.$timeSpent = ref.timeSpent;
        /* eslint-enable require-atomic-updates */
    };

    // Set avatar/world image

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

    // todo: userdialog
    $app.data.previousImagesDialogVisible = false;
    $app.data.previousImagesTable = [];

    API.$on('LOGIN', function () {
        $app.previousImagesTable = [];
    });

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
        var args = await imageRequest.getAvatarImages({ fileId });
        return storeAvatarImage(args);
    };

    // VRChat Config JSON

    $app.data.isVRChatConfigDialogVisible = false;

    $app.methods.showVRChatConfig = async function () {
        this.isVRChatConfigDialogVisible = true;
        if (!this.VRChatUsedCacheSize) {
            this.getVRChatCacheSize();
        }
    };

    // Auto Launch Shortcuts

    $app.methods.openShortcutFolder = function () {
        AppApi.OpenShortcutFolder();
    };

    $app.methods.updateAppLauncherSettings = async function (configKey = '') {
        if (configKey === 'VRCX_enableAppLauncher') {
            this.enableAppLauncher = !this.enableAppLauncher;
            await configRepository.setBool(
                'VRCX_enableAppLauncher',
                this.enableAppLauncher
            );
        } else {
            this.enableAppLauncherAutoClose = !this.enableAppLauncherAutoClose;
            await configRepository.setBool(
                'VRCX_enableAppLauncherAutoClose',
                this.enableAppLauncherAutoClose
            );
        }

        await AppApi.SetAppLauncherSettings(
            this.enableAppLauncher,
            this.enableAppLauncherAutoClose
        );
    };

    // Screenshot Helper

    $app.methods.saveScreenshotHelper = async function (configKey = '') {
        if (configKey === 'VRCX_screenshotHelper') {
            this.screenshotHelper = !this.screenshotHelper;
        } else if (configKey === 'VRCX_screenshotHelperModifyFilename') {
            this.screenshotHelperModifyFilename =
                !this.screenshotHelperModifyFilename;
        } else if (configKey === 'VRCX_screenshotHelperCopyToClipboard') {
            this.screenshotHelperCopyToClipboard =
                !this.screenshotHelperCopyToClipboard;
        }
        await configRepository.setBool(
            'VRCX_screenshotHelper',
            this.screenshotHelper
        );
        await configRepository.setBool(
            'VRCX_screenshotHelperModifyFilename',
            this.screenshotHelperModifyFilename
        );
        await configRepository.setBool(
            'VRCX_screenshotHelperCopyToClipboard',
            this.screenshotHelperCopyToClipboard
        );
    };

    $app.methods.processScreenshot = async function (path) {
        var newPath = path;
        if (this.screenshotHelper) {
            var location = parseLocation(this.lastLocation.location);
            var metadata = {
                application: 'VRCX',
                version: 1,
                author: {
                    id: API.currentUser.id,
                    displayName: API.currentUser.displayName
                },
                world: {
                    name: this.lastLocation.name,
                    id: location.worldId,
                    instanceId: this.lastLocation.location
                },
                players: []
            };
            for (var user of this.lastLocation.playerList.values()) {
                metadata.players.push({
                    id: user.userId,
                    displayName: user.displayName
                });
            }
            newPath = await AppApi.AddScreenshotMetadata(
                path,
                JSON.stringify(metadata),
                location.worldId,
                this.screenshotHelperModifyFilename
            );
            console.log('Screenshot metadata added', newPath);
        }
        if (this.screenshotHelperCopyToClipboard) {
            await AppApi.CopyImageToClipboard(newPath);
            console.log('Screenshot copied to clipboard', newPath);
        }
    };

    $app.data.screenshotMetadataDialog = {
        visible: false,
        loading: false,
        search: '',
        searchType: 'Player Name',
        searchTypes: ['Player Name', 'Player ID', 'World  Name', 'World  ID'],
        metadata: {},
        isUploading: false
    };

    $app.methods.showScreenshotMetadataDialog = function () {
        this.screenshotMetadataDialog.visible = true;
    };

    $app.data.currentlyDroppingFile = null;
    /**
     * This function is called by .NET(CefCustomDragHandler#CefCustomDragHandler) when a file is dragged over a drop zone in the app window.
     * @param {string} filePath - The full path to the file being dragged into the window
     */
    $app.methods.dragEnterCef = function (filePath) {
        this.currentlyDroppingFile = filePath;
    };

    // YouTube API

    $app.data.isYouTubeApiDialogVisible = false;

    $app.methods.changeYouTubeApi = async function (configKey = '') {
        if (configKey === 'VRCX_youtubeAPI') {
            this.youTubeApi = !this.youTubeApi;
        } else if (configKey === 'VRCX_progressPie') {
            this.progressPie = !this.progressPie;
        } else if (configKey === 'VRCX_progressPieFilter') {
            this.progressPieFilter = !this.progressPieFilter;
        }

        await configRepository.setBool('VRCX_youtubeAPI', this.youTubeApi);
        await configRepository.setBool('VRCX_progressPie', this.progressPie);
        await configRepository.setBool(
            'VRCX_progressPieFilter',
            this.progressPieFilter
        );
        this.updateVRLastLocation();
        this.updateOpenVR();
    };

    $app.methods.showYouTubeApiDialog = function () {
        this.isYouTubeApiDialogVisible = true;
    };

    // Launch Command Settings handling

    $app.methods.toggleLaunchCommandSetting = async function (configKey = '') {
        switch (configKey) {
            case 'VRCX_showConfirmationOnSwitchAvatar':
                this.showConfirmationOnSwitchAvatar =
                    !this.showConfirmationOnSwitchAvatar;
                await configRepository.setBool(
                    'VRCX_showConfirmationOnSwitchAvatar',
                    this.showConfirmationOnSwitchAvatar
                );
                break;
            default:
                throw new Error(
                    'toggleLaunchCommandSetting: Unknown configKey'
                );
        }
    };

    // Asset Bundle Cacher

    $app.methods.updateVRChatWorldCache = function () {
        var D = this.worldDialog;
        if (D.visible) {
            D.inCache = false;
            D.cacheSize = 0;
            D.cacheLocked = false;
            D.cachePath = '';
            checkVRChatCache(D.ref).then((cacheInfo) => {
                if (cacheInfo.Item1 > 0) {
                    D.inCache = true;
                    D.cacheSize = `${(cacheInfo.Item1 / 1048576).toFixed(
                        2
                    )} MB`;
                    D.cachePath = cacheInfo.Item3;
                }
                D.cacheLocked = cacheInfo.Item2;
            });
        }
    };

    $app.methods.updateVRChatAvatarCache = function () {
        var D = this.avatarDialog;
        if (D.visible) {
            D.inCache = false;
            D.cacheSize = 0;
            D.cacheLocked = false;
            D.cachePath = '';
            checkVRChatCache(D.ref).then((cacheInfo) => {
                if (cacheInfo.Item1 > 0) {
                    D.inCache = true;
                    D.cacheSize = `${(cacheInfo.Item1 / 1048576).toFixed(
                        2
                    )} MB`;
                    D.cachePath = cacheInfo.Item3;
                }
                D.cacheLocked = cacheInfo.Item2;
            });
        }
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
        await deleteVRChatCache(ref);
        this.getVRChatCacheSize();
        this.updateVRChatWorldCache();
        this.updateVRChatAvatarCache();
    };

    $app.methods.autoVRChatCacheManagement = function () {
        if (this.autoSweepVRChatCache) {
            this.sweepVRChatCache();
        }
    };

    $app.methods.sweepVRChatCache = async function () {
        var output = await AssetBundleManager.SweepCache();
        console.log('SweepCache', output);
        if (this.isVRChatConfigDialogVisible) {
            this.getVRChatCacheSize();
        }
    };

    $app.data.lastCrashedTime = null;
    $app.methods.checkIfGameCrashed = function () {
        if (!this.relaunchVRChatAfterCrash) {
            return;
        }
        var { location } = this.lastLocation;
        AppApi.VrcClosedGracefully().then((result) => {
            if (result || !isRealInstance(location)) {
                return;
            }
            // check if relaunched less than 2mins ago (prvent crash loop)
            if (
                this.lastCrashedTime &&
                new Date() - this.lastCrashedTime < 120_000
            ) {
                console.log('VRChat was recently crashed, not relaunching');
                return;
            }
            this.lastCrashedTime = new Date();
            // wait a bit for SteamVR to potentially close before deciding to relaunch
            var restartDelay = 8000;
            if (this.isGameNoVR) {
                // wait for game to close before relaunching
                restartDelay = 2000;
            }
            workerTimers.setTimeout(
                () => this.restartCrashedGame(location),
                restartDelay
            );
        });
    };

    $app.methods.restartCrashedGame = function (location) {
        if (!this.isGameNoVR && !this.isSteamVRRunning) {
            console.log("SteamVR isn't running, not relaunching VRChat");
            return;
        }
        AppApi.FocusWindow();
        var message = 'VRChat crashed, attempting to rejoin last instance';
        this.$message({
            message,
            type: 'info'
        });
        var entry = {
            created_at: new Date().toJSON(),
            type: 'Event',
            data: message
        };
        database.addGamelogEventToDatabase(entry);
        this.queueGameLogNoty(entry);
        this.addGameLog(entry);
        this.launchGame(location, '', this.isGameNoVR);
    };

    $app.data.VRChatUsedCacheSize = '';
    $app.data.VRChatTotalCacheSize = '';
    $app.data.VRChatCacheSizeLoading = false;

    $app.methods.getVRChatCacheSize = async function () {
        this.VRChatCacheSizeLoading = true;
        var totalCacheSize = 30;
        this.VRChatTotalCacheSize = totalCacheSize;
        var usedCacheSize = await AssetBundleManager.GetCacheSize();
        this.VRChatUsedCacheSize = (usedCacheSize / 1073741824).toFixed(2);
        this.VRChatCacheSizeLoading = false;
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

    // userDialog Groups

    $app.data.inGameGroupOrder = [];

    $app.methods.getVRChatRegistryKey = async function (key) {
        if (LINUX) {
            return AppApi.GetVRChatRegistryKeyString(key);
        }
        return AppApi.GetVRChatRegistryKey(key);
    };

    $app.methods.updateInGameGroupOrder = async function () {
        this.inGameGroupOrder = [];
        try {
            var json = await this.getVRChatRegistryKey(
                `VRC_GROUP_ORDER_${API.currentUser.id}`
            );
            if (!json) {
                return;
            }
            this.inGameGroupOrder = JSON.parse(json);
        } catch (err) {
            console.error(err);
        }
    };

    $app.methods.sortGroupInstancesByInGame = function (a, b) {
        var aIndex = this.inGameGroupOrder.indexOf(a?.group?.id);
        var bIndex = this.inGameGroupOrder.indexOf(b?.group?.id);
        if (aIndex === -1 && bIndex === -1) {
            return 0;
        }
        if (aIndex === -1) {
            return 1;
        }
        if (bIndex === -1) {
            return -1;
        }
        return aIndex - bIndex;
    };

    // #endregion
    // #region | Gallery

    $app.data.galleryDialog = {};
    $app.data.galleryDialogVisible = false;
    $app.data.galleryDialogGalleryLoading = false;
    $app.data.galleryDialogIconsLoading = false;
    $app.data.galleryDialogEmojisLoading = false;
    $app.data.galleryDialogStickersLoading = false;
    $app.data.galleryDialogPrintsLoading = false;
    $app.data.galleryDialogInventoryLoading = false;

    API.$on('LOGIN', function () {
        $app.galleryTable = [];
    });

    $app.methods.closeGalleryDialog = function () {
        this.galleryDialogVisible = false;
    };

    $app.methods.showGalleryDialog = function (pageNum) {
        this.galleryDialogVisible = true;
        this.refreshGalleryTable();
        this.refreshVRCPlusIconsTable();
        this.refreshEmojiTable();
        this.refreshStickerTable();
        this.refreshPrintTable();
        this.getInventory();
        workerTimers.setTimeout(() => this.setGalleryTab(pageNum), 100);
    };

    $app.methods.setGalleryTab = function (pageNum) {
        if (
            typeof pageNum !== 'undefined' &&
            typeof this.$refs.galleryTabs !== 'undefined'
        ) {
            this.$refs.galleryTabs.setCurrentName(`${pageNum}`);
        }
    };

    $app.methods.refreshGalleryTable = function () {
        this.galleryDialogGalleryLoading = true;
        var params = {
            n: 100,
            tag: 'gallery'
        };
        vrcPlusIconRequest.getFileList(params).finally(() => {
            this.galleryDialogGalleryLoading = false;
        });
    };

    API.$on('FILES:LIST', function (args) {
        if (args.params.tag === 'gallery') {
            $app.galleryTable = args.json.reverse();
        }
    });

    API.$on('GALLERYIMAGE:ADD', function (args) {
        if (Object.keys($app.galleryTable).length !== 0) {
            $app.galleryTable.unshift(args.json);
        }
    });

    // #endregion
    // #region | Sticker
    API.$on('LOGIN', function () {
        $app.stickerTable = [];
    });

    $app.methods.refreshStickerTable = function () {
        this.galleryDialogStickersLoading = true;
        var params = {
            n: 100,
            tag: 'sticker'
        };
        vrcPlusIconRequest.getFileList(params).finally(() => {
            this.galleryDialogStickersLoading = false;
        });
    };

    API.$on('FILES:LIST', function (args) {
        if (args.params.tag === 'sticker') {
            $app.stickerTable = args.json.reverse();
        }
    });

    $app.methods.displayStickerUpload = function () {
        document.getElementById('StickerUploadButton').click();
    };

    API.$on('STICKER:ADD', function (args) {
        if (Object.keys($app.stickerTable).length !== 0) {
            $app.stickerTable.unshift(args.json);
        }
    });

    $app.data.instanceStickersCache = [];

    $app.methods.trySaveStickerToFile = async function (
        displayName,
        userId,
        inventoryId
    ) {
        if (this.instanceStickersCache.includes(inventoryId)) {
            return;
        }
        this.instanceStickersCache.push(inventoryId);
        if (this.instanceStickersCache.size > 100) {
            this.instanceStickersCache.shift();
        }
        var args = await inventoryRequest.getUserInventoryItem({
            inventoryId,
            userId
        });

        if (
            args.json.itemType !== 'sticker' ||
            !args.json.flags.includes('ugc')
        ) {
            // Not a sticker or ugc, skipping
            return;
        }

        var imageUrl = args.json.metadata?.imageUrl ?? args.json.imageUrl;
        var createdAt = args.json.created_at;
        var monthFolder = createdAt.slice(0, 7);
        var fileNameDate = createdAt
            .replace(/:/g, '-')
            .replace(/T/g, '_')
            .replace(/Z/g, '');
        var fileName = `${displayName}_${fileNameDate}_${inventoryId}.png`;
        var filePath = await AppApi.SaveStickerToFile(
            imageUrl,
            this.ugcFolderPath,
            monthFolder,
            fileName
        );
        if (filePath) {
            console.log(`Sticker saved to file: ${monthFolder}\\${fileName}`);
        }
    };

    // #endregion
    // #region | Emoji

    $app.data.instanceInventoryCache = [];
    $app.data.instanceInventoryQueue = [];
    $app.data.instanceInventoryQueueWorker = null;

    $app.methods.queueCheckInstanceInventory = function (inventoryId, userId) {
        if (
            this.instanceInventoryCache.includes(inventoryId) ||
            this.instanceStickersCache.includes(inventoryId)
        ) {
            return;
        }
        this.instanceInventoryCache.push(inventoryId);
        if (this.instanceInventoryCache.length > 100) {
            this.instanceInventoryCache.shift();
        }

        this.instanceInventoryQueue.push({ inventoryId, userId });

        if (!this.instanceInventoryQueueWorker) {
            this.instanceInventoryQueueWorker = workerTimers.setInterval(() => {
                const item = this.instanceInventoryQueue.shift();
                if (item?.inventoryId) {
                    this.trySaveEmojiToFile(item.inventoryId, item.userId);
                }
            }, 2_500);
        }
    };

    $app.methods.trySaveEmojiToFile = async function (inventoryId, userId) {
        const args = await inventoryRequest.getUserInventoryItem({
            inventoryId,
            userId
        });

        if (
            args.json.itemType !== 'emoji' ||
            !args.json.flags.includes('ugc')
        ) {
            // Not an emoji or ugc, skipping
            return;
        }

        const userArgs = await userRequest.getCachedUser({
            userId: args.json.holderId
        });
        const displayName = userArgs.json?.displayName ?? '';

        let emoji = args.json.metadata;
        emoji.name = `${displayName}_${inventoryId}`;

        const emojiFileName = getEmojiFileName(emoji);
        const imageUrl = args.json.metadata?.imageUrl ?? args.json.imageUrl;
        const createdAt = args.json.created_at;
        const monthFolder = createdAt.slice(0, 7);

        const filePath = await AppApi.SaveEmojiToFile(
            imageUrl,
            this.ugcFolderPath,
            monthFolder,
            emojiFileName
        );
        if (filePath) {
            console.log(
                `Emoji saved to file: ${monthFolder}\\${emojiFileName}`
            );
        }

        if (this.instanceInventoryQueue.length === 0) {
            workerTimers.clearInterval(this.instanceInventoryQueueWorker);
            this.instanceInventoryQueueWorker = null;
        }
    };

    // #endregion
    // #region | Prints
    $app.methods.cropPrintsChanged = function () {
        if (!this.cropInstancePrints) return;
        this.$confirm(
            $t(
                'view.settings.advanced.advanced.save_instance_prints_to_file.crop_convert_old'
            ),
            {
                confirmButtonText: $t(
                    'view.settings.advanced.advanced.save_instance_prints_to_file.crop_convert_old_confirm'
                ),
                cancelButtonText: $t(
                    'view.settings.advanced.advanced.save_instance_prints_to_file.crop_convert_old_cancel'
                ),
                type: 'info',
                showInput: false,
                callback: async (action) => {
                    if (action === 'confirm') {
                        var msgBox = this.$message({
                            message: 'Batch print cropping in progress...',
                            type: 'warning',
                            duration: 0
                        });
                        try {
                            await AppApi.CropAllPrints(this.ugcFolderPath);
                            this.$message({
                                message: 'Batch print cropping complete',
                                type: 'success'
                            });
                        } catch (err) {
                            console.error(err);
                            this.$message({
                                message: `Batch print cropping failed: ${err}`,
                                type: 'error'
                            });
                        } finally {
                            msgBox.close();
                        }
                    }
                }
            }
        );
    };

    API.$on('LOGIN', function () {
        $app.printTable = [];
        if ($app.autoDeleteOldPrints) {
            $app.tryDeleteOldPrints();
        }
    });

    $app.methods.refreshPrintTable = async function () {
        this.galleryDialogPrintsLoading = true;
        var params = {
            n: 100
        };
        const args = await vrcPlusImageRequest.getPrints(params).finally(() => {
            this.galleryDialogPrintsLoading = false;
        });
        args.json.sort((a, b) => {
            return new Date(b.timestamp) - new Date(a.timestamp);
        });
        $app.printTable = args.json;
    };

    $app.data.printUploadNote = '';
    $app.data.printCropBorder = true;

    $app.data.saveInstancePrints = await configRepository.getBool(
        'VRCX_saveInstancePrints',
        false
    );

    $app.data.cropInstancePrints = await configRepository.getBool(
        'VRCX_cropInstancePrints',
        false
    );

    $app.data.saveInstanceStickers = await configRepository.getBool(
        'VRCX_saveInstanceStickers',
        false
    );

    $app.data.saveInstanceEmoji = await configRepository.getBool(
        'VRCX_saveInstanceEmoji',
        false
    );

    $app.data.printCache = [];
    $app.data.printQueue = [];
    $app.data.printQueueWorker = null;

    $app.methods.queueSavePrintToFile = function (printId) {
        if (this.printCache.includes(printId)) {
            return;
        }
        this.printCache.push(printId);
        if (this.printCache.length > 100) {
            this.printCache.shift();
        }

        this.printQueue.push(printId);

        if (!this.printQueueWorker) {
            this.printQueueWorker = workerTimers.setInterval(() => {
                let printId = this.printQueue.shift();
                if (printId) {
                    this.trySavePrintToFile(printId);
                }
            }, 2_500);
        }
    };

    $app.methods.trySavePrintToFile = async function (printId) {
        var args = await vrcPlusImageRequest.getPrint({ printId });
        var imageUrl = args.json?.files?.image;
        if (!imageUrl) {
            console.error('Print image URL is missing', args);
            return;
        }
        var print = args.json;
        var createdAt = getPrintLocalDate(print);
        try {
            var owner = await userRequest.getCachedUser({
                userId: print.ownerId
            });
            console.log(
                `Print spawned by ${owner?.json?.displayName} id:${print.id} note:${print.note} authorName:${print.authorName} at:${new Date().toISOString()}`
            );
        } catch (err) {
            console.error(err);
        }
        var monthFolder = createdAt.toISOString().slice(0, 7);
        var fileName = getPrintFileName(print);
        var filePath = await AppApi.SavePrintToFile(
            imageUrl,
            this.ugcFolderPath,
            monthFolder,
            fileName
        );
        if (filePath) {
            console.log(`Print saved to file: ${monthFolder}\\${fileName}`);
            if (this.cropInstancePrints) {
                if (!(await AppApi.CropPrintImage(filePath))) {
                    console.error('Failed to crop print image');
                }
            }
        }

        if (this.printQueue.length === 0) {
            workerTimers.clearInterval(this.printQueueWorker);
            this.printQueueWorker = null;
        }
    };

    // #endregion
    // #region | Emoji

    API.$on('LOGIN', function () {
        $app.emojiTable = [];
    });

    $app.methods.refreshEmojiTable = function () {
        this.galleryDialogEmojisLoading = true;
        var params = {
            n: 100,
            tag: 'emoji'
        };
        vrcPlusIconRequest.getFileList(params).finally(() => {
            this.galleryDialogEmojisLoading = false;
        });
    };

    API.$on('FILES:LIST', function (args) {
        if (args.params.tag === 'emoji') {
            $app.emojiTable = args.json.reverse();
        }
    });

    API.$on('EMOJI:ADD', function (args) {
        if (Object.keys($app.emojiTable).length !== 0) {
            $app.emojiTable.unshift(args.json);
        }
    });

    // #endregion
    // #region Misc

    $app.methods.removeEmojis = function (text) {
        if (!text) {
            return '';
        }
        return text
            .replace(
                /([\u2700-\u27BF]|[\uE000-\uF8FF]|\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDFFF]|[\u2011-\u26FF]|\uD83E[\uDD10-\uDDFF])/g,
                ''
            )
            .replace(/\s+/g, ' ')
            .trim();
    };

    $app.methods.checkCanInvite = function (location) {
        var L = parseLocation(location);
        var instance = API.cachedInstances.get(location);
        if (instance?.closedAt) {
            return false;
        }
        if (
            L.accessType === 'public' ||
            L.accessType === 'group' ||
            L.userId === API.currentUser.id
        ) {
            return true;
        }
        if (L.accessType === 'invite' || L.accessType === 'friends') {
            return false;
        }
        if (this.lastLocation.location === location) {
            return true;
        }
        return false;
    };

    $app.methods.checkCanInviteSelf = function (location) {
        var L = parseLocation(location);
        var instance = API.cachedInstances.get(location);
        if (instance?.closedAt) {
            return false;
        }
        if (L.userId === API.currentUser.id) {
            return true;
        }
        if (L.accessType === 'friends' && !this.friends.has(L.userId)) {
            return false;
        }
        return true;
    };

    $app.methods.setAsideWidth = async function () {
        await configRepository.setInt('VRCX_sidePanelWidth', this.asideWidth);
    };

    /**
     * @param {object} user - User Ref Object
     * @param {boolean} isIcon - is use for icon (about 40x40)
     * @param {string} resolution - requested icon resolution (default 128),
     * @param {boolean} isUserDialogIcon - is use for user dialog icon
     * @returns {string} - img url
     *
     * VRC's 64 scaling doesn't look good, 128 is better, but some images might be overly sharp.
     * 128 is smaller than 256 or the original image size, making it a good choice.
     *
     * TODO: code is messy cause I haven't figured out the img field, maybe refactor it later
     */
    $app.methods.userImage = function (
        user,
        isIcon,
        resolution = '128',
        isUserDialogIcon = false
    ) {
        if (!user) {
            return '';
        }
        if (
            (isUserDialogIcon && user.userIcon) ||
            (this.displayVRCPlusIconsAsAvatar && user.userIcon)
        ) {
            if (isIcon) {
                return convertFileUrlToImageUrl(user.userIcon);
            }
            return user.userIcon;
        }

        if (user.profilePicOverrideThumbnail) {
            if (isIcon) {
                return user.profilePicOverrideThumbnail.replace(
                    '/256',
                    `/${resolution}`
                );
            }
            return user.profilePicOverrideThumbnail;
        }
        if (user.profilePicOverride) {
            return user.profilePicOverride;
        }
        if (user.thumbnailUrl) {
            return user.thumbnailUrl;
        }
        if (user.currentAvatarThumbnailImageUrl) {
            if (isIcon) {
                return user.currentAvatarThumbnailImageUrl.replace(
                    '/256',
                    `/${resolution}`
                );
            }
            return user.currentAvatarThumbnailImageUrl;
        }
        if (user.currentAvatarImageUrl) {
            if (isIcon) {
                return convertFileUrlToImageUrl(user.currentAvatarImageUrl);
            }
            return user.currentAvatarImageUrl;
        }
        return '';
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

    $app.methods.getImageUrlFromImageId = function (imageId) {
        return `https://api.vrchat.cloud/api/1/file/${imageId}/1/`;
    };

    $app.methods.showConsole = function () {
        AppApi.ShowDevTools();
        if (
            this.debug ||
            this.debugWebRequests ||
            this.debugWebSocket ||
            this.debugUserDiff
        ) {
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

    $app.methods.clearVRCXCache = function () {
        API.failedGetRequests = new Map();
        API.cachedUsers.forEach((ref, id) => {
            if (
                !this.friends.has(id) &&
                !this.lastLocation.playerList.has(ref.id) &&
                id !== API.currentUser.id
            ) {
                API.cachedUsers.delete(id);
            }
        });
        API.cachedWorlds.forEach((ref, id) => {
            if (
                !API.cachedFavoritesByObjectId.has(id) &&
                ref.authorId !== API.currentUser.id &&
                !this.localWorldFavoritesList.includes(id)
            ) {
                API.cachedWorlds.delete(id);
            }
        });
        API.cachedAvatars.forEach((ref, id) => {
            if (
                !API.cachedFavoritesByObjectId.has(id) &&
                ref.authorId !== API.currentUser.id &&
                !this.localAvatarFavoritesList.includes(id) &&
                !$app.avatarHistory.has(id)
            ) {
                API.cachedAvatars.delete(id);
            }
        });
        API.cachedGroups.forEach((ref, id) => {
            if (!API.currentUserGroups.has(id)) {
                API.cachedGroups.delete(id);
            }
        });
        API.cachedInstances.forEach((ref, id) => {
            // delete instances over an hour old
            if (Date.parse(ref.$fetchedAt) < Date.now() - 3600000) {
                API.cachedInstances.delete(id);
            }
        });
        API.cachedAvatarNames = new Map();
        this.customUserTags = new Map();
        this.updateInstanceInfo = 0;
    };

    $app.data.sqliteTableSizes = {};

    $app.methods.getSqliteTableSizes = async function () {
        this.sqliteTableSizes = {
            gps: await database.getGpsTableSize(),
            status: await database.getStatusTableSize(),
            bio: await database.getBioTableSize(),
            avatar: await database.getAvatarTableSize(),
            onlineOffline: await database.getOnlineOfflineTableSize(),
            friendLogHistory: await database.getFriendLogHistoryTableSize(),
            notification: await database.getNotificationTableSize(),
            location: await database.getLocationTableSize(),
            joinLeave: await database.getJoinLeaveTableSize(),
            portalSpawn: await database.getPortalSpawnTableSize(),
            videoPlay: await database.getVideoPlayTableSize(),
            event: await database.getEventTableSize(),
            external: await database.getExternalTableSize()
        };
    };

    $app.data.ipcEnabled = false;
    $app.methods.ipcEvent = function (json) {
        if (!API.isLoggedIn) {
            return;
        }
        try {
            var data = JSON.parse(json);
        } catch {
            console.log(`IPC invalid JSON, ${json}`);
            return;
        }
        switch (data.type) {
            case 'OnEvent':
                if (!this.isGameRunning) {
                    console.log('Game closed, skipped event', data);
                    return;
                }
                if (this.debugPhotonLogging) {
                    console.log(
                        'OnEvent',
                        data.OnEventData.Code,
                        data.OnEventData
                    );
                }
                this.parsePhotonEvent(data.OnEventData, data.dt);
                this.photonEventPulse();
                break;
            case 'OnOperationResponse':
                if (!this.isGameRunning) {
                    console.log('Game closed, skipped event', data);
                    return;
                }
                if (this.debugPhotonLogging) {
                    console.log(
                        'OnOperationResponse',
                        data.OnOperationResponseData.OperationCode,
                        data.OnOperationResponseData
                    );
                }
                this.parseOperationResponse(
                    data.OnOperationResponseData,
                    data.dt
                );
                this.photonEventPulse();
                break;
            case 'OnOperationRequest':
                if (!this.isGameRunning) {
                    console.log('Game closed, skipped event', data);
                    return;
                }
                if (this.debugPhotonLogging) {
                    console.log(
                        'OnOperationRequest',
                        data.OnOperationRequestData.OperationCode,
                        data.OnOperationRequestData
                    );
                }
                break;
            case 'VRCEvent':
                if (!this.isGameRunning) {
                    console.log('Game closed, skipped event', data);
                    return;
                }
                this.parseVRCEvent(data);
                this.photonEventPulse();
                break;
            case 'Event7List':
                this.photonEvent7List.clear();
                for (var [id, dt] of Object.entries(data.Event7List)) {
                    this.photonEvent7List.set(parseInt(id, 10), dt);
                }
                this.photonLastEvent7List = Date.parse(data.dt);
                break;
            case 'VrcxMessage':
                if (this.debugPhotonLogging) {
                    console.log('VrcxMessage:', data);
                }
                this.eventVrcxMessage(data);
                break;
            case 'Ping':
                if (!this.photonLoggingEnabled) {
                    this.photonLoggingEnabled = true;
                    configRepository.setBool('VRCX_photonLoggingEnabled', true);
                }
                this.ipcEnabled = true;
                this.ipcTimeout = 60; // 30secs
                break;
            case 'MsgPing':
                this.externalNotifierVersion = data.version;
                break;
            case 'LaunchCommand':
                this.eventLaunchCommand(data.command);
                break;
            case 'VRCXLaunch':
                console.log('VRCXLaunch:', data);
                break;
            default:
                console.log('IPC:', data);
        }
    };

    $app.data.externalNotifierVersion = 0;
    $app.data.photonEventCount = 0;
    $app.data.photonEventIcon = false;
    $app.data.customUserTags = new Map();

    $app.methods.addCustomTag = function (data) {
        if (data.Tag) {
            this.customUserTags.set(data.UserId, {
                tag: data.Tag,
                colour: data.TagColour
            });
        } else {
            this.customUserTags.delete(data.UserId);
        }
        var feedUpdate = {
            userId: data.UserId,
            colour: data.TagColour
        };
        AppApi.ExecuteVrOverlayFunction(
            'updateHudFeedTag',
            JSON.stringify(feedUpdate)
        );
        var ref = API.cachedUsers.get(data.UserId);
        if (typeof ref !== 'undefined') {
            ref.$customTag = data.Tag;
            ref.$customTagColour = data.TagColour;
        }
        this.updateSharedFeed(true);
    };

    $app.methods.eventVrcxMessage = function (data) {
        switch (data.MsgType) {
            case 'CustomTag':
                this.addCustomTag(data);
                break;
            case 'ClearCustomTags':
                this.customUserTags.forEach((value, key) => {
                    this.customUserTags.delete(key);
                    var ref = API.cachedUsers.get(key);
                    if (typeof ref !== 'undefined') {
                        ref.$customTag = '';
                        ref.$customTagColour = '';
                    }
                });
                break;
            case 'Noty':
                if (
                    this.photonLoggingEnabled ||
                    (this.externalNotifierVersion &&
                        this.externalNotifierVersion > 21)
                ) {
                    return;
                }
                var entry = {
                    created_at: new Date().toJSON(),
                    type: 'Event',
                    data: data.Data
                };
                database.addGamelogEventToDatabase(entry);
                this.queueGameLogNoty(entry);
                this.addGameLog(entry);
                break;
            case 'External':
                var displayName = data.DisplayName ?? '';
                var entry = {
                    created_at: new Date().toJSON(),
                    type: 'External',
                    message: data.Data,
                    displayName,
                    userId: data.UserId,
                    location: this.lastLocation.location
                };
                database.addGamelogExternalToDatabase(entry);
                this.queueGameLogNoty(entry);
                this.addGameLog(entry);
                break;
            default:
                console.log('VRCXMessage:', data);
                break;
        }
    };

    $app.methods.photonEventPulse = function () {
        this.photonEventCount++;
        this.photonEventIcon = true;
        workerTimers.setTimeout(() => (this.photonEventIcon = false), 150);
    };

    $app.methods.parseOperationResponse = function (data, dateTime) {
        switch (data.OperationCode) {
            case 226:
                if (
                    typeof data.Parameters[248] !== 'undefined' &&
                    typeof data.Parameters[248][248] !== 'undefined'
                ) {
                    this.setPhotonLobbyMaster(data.Parameters[248][248]);
                }
                if (typeof data.Parameters[254] !== 'undefined') {
                    this.photonLobbyCurrentUser = data.Parameters[254];
                }
                if (typeof data.Parameters[249] !== 'undefined') {
                    for (var i in data.Parameters[249]) {
                        var id = parseInt(i, 10);
                        var user = data.Parameters[249][i];
                        this.parsePhotonUser(id, user.user, dateTime);
                        this.parsePhotonAvatarChange(
                            id,
                            user.user,
                            user.avatarDict,
                            dateTime
                        );
                        this.parsePhotonGroupChange(
                            id,
                            user.user,
                            user.groupOnNameplate,
                            dateTime
                        );
                        this.parsePhotonAvatar(user.avatarDict);
                        this.parsePhotonAvatar(user.favatarDict);
                        var hasInstantiated = false;
                        var lobbyJointime = this.photonLobbyJointime.get(id);
                        if (typeof lobbyJointime !== 'undefined') {
                            hasInstantiated = lobbyJointime.hasInstantiated;
                        }
                        this.photonLobbyJointime.set(id, {
                            joinTime: Date.parse(dateTime),
                            hasInstantiated,
                            inVRMode: user.inVRMode,
                            avatarEyeHeight: user.avatarEyeHeight,
                            canModerateInstance: user.canModerateInstance,
                            groupOnNameplate: user.groupOnNameplate,
                            showGroupBadgeToOthers: user.showGroupBadgeToOthers,
                            showSocialRank: user.showSocialRank,
                            useImpostorAsFallback: user.useImpostorAsFallback,
                            platform: user.platform
                        });
                    }
                }
                if (typeof data.Parameters[252] !== 'undefined') {
                    this.parsePhotonLobbyIds(data.Parameters[252]);
                }
                this.photonEvent7List = new Map();
                break;
        }
    };

    API.$on('LOGIN', async function () {
        var command = await AppApi.GetLaunchCommand();
        if (command) {
            $app.eventLaunchCommand(command);
        }
    });

    $app.methods.eventLaunchCommand = function (input) {
        if (!API.isLoggedIn) {
            return;
        }
        console.log('LaunchCommand:', input);
        var args = input.split('/');
        var command = args[0];
        var commandArg = args[1]?.trim();
        var shouldFocusWindow = true;
        switch (command) {
            case 'world':
                this.directAccessWorld(input.replace('world/', ''));
                break;
            case 'avatar':
                this.showAvatarDialog(commandArg);
                break;
            case 'user':
                this.showUserDialog(commandArg);
                break;
            case 'group':
                this.showGroupDialog(commandArg);
                break;
            case 'local-favorite-world':
                console.log('local-favorite-world', commandArg);
                var [id, group] = commandArg.split(':');
                worldRequest.getCachedWorld({ worldId: id }).then((args1) => {
                    this.directAccessWorld(id);
                    this.addLocalWorldFavorite(id, group);
                    return args1;
                });
                break;
            case 'addavatardb':
                this.addAvatarProvider(input.replace('addavatardb/', ''));
                break;
            case 'switchavatar':
                var avatarId = commandArg;
                var regexAvatarId =
                    /avtr_[0-9A-Fa-f]{8}-([0-9A-Fa-f]{4}-){3}[0-9A-Fa-f]{12}/g;
                if (!avatarId.match(regexAvatarId) || avatarId.length !== 41) {
                    this.$message({
                        message: 'Invalid Avatar ID',
                        type: 'error'
                    });
                    break;
                }
                if (this.showConfirmationOnSwitchAvatar) {
                    this.selectAvatarWithConfirmation(avatarId);
                    // Makes sure the window is focused
                    shouldFocusWindow = true;
                } else {
                    this.selectAvatarWithoutConfirmation(avatarId);
                    shouldFocusWindow = false;
                }
                break;
            case 'import':
                var type = args[1];
                if (!type) break;
                var data = input.replace(`import/${type}/`, '');
                if (type === 'avatar') {
                    this.avatarImportDialogInput = data;
                    this.showAvatarImportDialog();
                } else if (type === 'world') {
                    this.worldImportDialogInput = data;
                    this.showWorldImportDialog();
                } else if (type === 'friend') {
                    this.friendImportDialogInput = data;
                    this.showFriendImportDialog();
                }
                break;
        }
        if (shouldFocusWindow) {
            AppApi.FocusWindow();
        }
    };

    $app.methods.toggleAllowBooping = function () {
        userRequest
            .saveCurrentUser({
                isBoopingEnabled: !API.currentUser.isBoopingEnabled
            })
            .then((args) => {
                return args;
            });
    };

    // #endregion
    // #region | App: Previous Instances Info Dialog

    $app.data.previousInstancesInfoDialogVisible = false;
    $app.data.previousInstancesInfoDialogInstanceId = '';

    $app.methods.showPreviousInstancesInfoDialog = function (instanceId) {
        this.previousInstancesInfoDialogVisible = true;
        this.previousInstancesInfoDialogInstanceId = instanceId;
    };

    $app.data.dtHour12 = await configRepository.getBool('VRCX_dtHour12', false);
    $app.data.dtIsoFormat = await configRepository.getBool(
        'VRCX_dtIsoFormat',
        false
    );
    $app.methods.setDatetimeFormat = async function (setIsoFormat = false) {
        if (setIsoFormat) {
            this.dtIsoFormat = !this.dtIsoFormat;
        }
        var currentCulture = await AppApi.CurrentCulture();
        var hour12 = await configRepository.getBool('VRCX_dtHour12');
        var isoFormat = await configRepository.getBool('VRCX_dtIsoFormat');
        if (typeof this.dtHour12 !== 'undefined') {
            if (hour12 !== this.dtHour12) {
                await configRepository.setBool('VRCX_dtHour12', this.dtHour12);
                this.updateVRConfigVars();
            }
            var hour12 = this.dtHour12;
        }
        if (typeof this.dtIsoFormat !== 'undefined') {
            if (isoFormat !== this.dtIsoFormat) {
                await configRepository.setBool(
                    'VRCX_dtIsoFormat',
                    this.dtIsoFormat
                );
            }
            var isoFormat = this.dtIsoFormat;
        }
        var formatDate1 = function (date, format) {
            if (!date) {
                return '-';
            }
            var dt = new Date(date);
            if (format === 'long') {
                return dt.toLocaleDateString(currentCulture, {
                    month: '2-digit',
                    day: '2-digit',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: 'numeric',
                    second: 'numeric',
                    hourCycle: hour12 ? 'h12' : 'h23'
                });
            } else if (format === 'short') {
                return dt
                    .toLocaleDateString(currentCulture, {
                        month: '2-digit',
                        day: '2-digit',
                        hour: 'numeric',
                        minute: 'numeric',
                        hourCycle: hour12 ? 'h12' : 'h23'
                    })
                    .replace(' AM', 'am')
                    .replace(' PM', 'pm')
                    .replace(',', '');
            }
            return '-';
        };
        if (isoFormat) {
            formatDate1 = function (date, format) {
                if (!date) {
                    return '-';
                }
                const dt = new Date(date);
                if (format === 'long') {
                    const formatDate = (date) => {
                        const padZero = (num) => String(num).padStart(2, '0');

                        const year = date.getFullYear();
                        const month = padZero(date.getMonth() + 1);
                        const day = padZero(date.getDate());
                        const hours = padZero(date.getHours());
                        const minutes = padZero(date.getMinutes());
                        const seconds = padZero(date.getSeconds());

                        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
                    };

                    return formatDate(dt);
                } else if (format === 'short') {
                    return dt
                        .toLocaleDateString('en-nz', {
                            month: '2-digit',
                            day: '2-digit',
                            hour: 'numeric',
                            minute: 'numeric',
                            hourCycle: hour12 ? 'h12' : 'h23'
                        })
                        .replace(' AM', 'am')
                        .replace(' PM', 'pm')
                        .replace(',', '');
                }
                return '-';
            };
        }
        Vue.filter('formatDate', formatDate1);
    };
    $app.methods.setDatetimeFormat();

    $app.data.enableCustomEndpoint = await configRepository.getBool(
        'VRCX_enableCustomEndpoint',
        false
    );
    $app.methods.toggleCustomEndpoint = async function () {
        await configRepository.setBool(
            'VRCX_enableCustomEndpoint',
            this.enableCustomEndpoint
        );
        this.loginForm.endpoint = '';
        this.loginForm.websocket = '';
    };

    $app.methods.getNameColour = async function (userId) {
        var hue = await AppApi.GetColourFromUserID(userId);
        return this.HueToHex(hue);
    };

    $app.methods.userColourInit = async function () {
        var dictObject = await AppApi.GetColourBulk(
            Array.from(API.cachedUsers.keys())
        );
        if (LINUX) {
            dictObject = Object.fromEntries(dictObject);
        }
        for (var [userId, hue] of Object.entries(dictObject)) {
            var ref = API.cachedUsers.get(userId);
            if (typeof ref !== 'undefined') {
                ref.$userColour = this.HueToHex(hue);
            }
        }
    };

    $app.methods.HueToHex = function (hue) {
        // this.HSVtoRGB(hue / 65535, .8, .8);
        if (this.isDarkMode) {
            return this.HSVtoRGB(hue / 65535, 0.6, 1);
        }
        return this.HSVtoRGB(hue / 65535, 1, 0.7);
    };

    $app.methods.HSVtoRGB = function (h, s, v) {
        var r = 0;
        var g = 0;
        var b = 0;
        if (arguments.length === 1) {
            var s = h.s;
            var v = h.v;
            var h = h.h;
        }
        var i = Math.floor(h * 6);
        var f = h * 6 - i;
        var p = v * (1 - s);
        var q = v * (1 - f * s);
        var t = v * (1 - (1 - f) * s);
        switch (i % 6) {
            case 0:
                r = v;
                g = t;
                b = p;
                break;
            case 1:
                r = q;
                g = v;
                b = p;
                break;
            case 2:
                r = p;
                g = v;
                b = t;
                break;
            case 3:
                r = p;
                g = q;
                b = v;
                break;
            case 4:
                r = t;
                g = p;
                b = v;
                break;
            case 5:
                r = v;
                g = p;
                b = q;
                break;
        }
        var red = Math.round(r * 255);
        var green = Math.round(g * 255);
        var blue = Math.round(b * 255);
        var decColor = 0x1000000 + blue + 0x100 * green + 0x10000 * red;
        return `#${decColor.toString(16).substr(1)}`;
    };

    $app.methods.onPlayerTraveling = function (ref) {
        if (
            !this.isGameRunning ||
            !this.lastLocation.location ||
            this.lastLocation.location !== ref.travelingToLocation ||
            ref.id === API.currentUser.id ||
            this.lastLocation.playerList.has(ref.id)
        ) {
            return;
        }

        var onPlayerJoining = {
            created_at: new Date(ref.created_at).toJSON(),
            userId: ref.id,
            displayName: ref.displayName,
            type: 'OnPlayerJoining'
        };
        this.queueFeedNoty(onPlayerJoining);
    };

    $app.methods.updateCurrentUserLocation = function () {
        var ref = API.cachedUsers.get(API.currentUser.id);
        if (typeof ref === 'undefined') {
            return;
        }

        // update cached user with both gameLog and API locations
        var currentLocation = API.currentUser.$locationTag;
        var L = parseLocation(currentLocation);
        if (L.isTraveling) {
            currentLocation = API.currentUser.$travelingToLocation;
        }
        ref.location = API.currentUser.$locationTag;
        ref.travelingToLocation = API.currentUser.$travelingToLocation;

        if (
            this.isGameRunning &&
            !this.gameLogDisabled &&
            this.lastLocation.location !== ''
        ) {
            // use gameLog instead of API when game is running
            currentLocation = this.lastLocation.location;
            if (this.lastLocation.location === 'traveling') {
                currentLocation = this.lastLocationDestination;
            }
            ref.location = this.lastLocation.location;
            ref.travelingToLocation = this.lastLocationDestination;
        }

        ref.$online_for = API.currentUser.$online_for;
        ref.$offline_for = API.currentUser.$offline_for;
        ref.$location = parseLocation(currentLocation);
        if (!this.isGameRunning || this.gameLogDisabled) {
            ref.$location_at = API.currentUser.$location_at;
            ref.$travelingToTime = API.currentUser.$travelingToTime;
            this.applyUserDialogLocation();
            this.applyWorldDialogInstances();
            this.applyGroupDialogInstances();
        } else {
            ref.$location_at = this.lastLocation.date;
            ref.$travelingToTime = this.lastLocationDestinationTime;
            API.currentUser.$travelingToTime = this.lastLocationDestinationTime;
        }
    };

    $app.methods.setCurrentUserLocation = async function (
        location,
        travelingToLocation
    ) {
        API.currentUser.$location_at = Date.now();
        API.currentUser.$travelingToTime = Date.now();
        API.currentUser.$locationTag = location;
        API.currentUser.$travelingToLocation = travelingToLocation;
        this.updateCurrentUserLocation();

        // janky gameLog support for Quest
        if (this.isGameRunning) {
            // with the current state of things, lets not run this if we don't need to
            return;
        }
        var lastLocation = '';
        for (var i = this.gameLogSessionTable.length - 1; i > -1; i--) {
            var item = this.gameLogSessionTable[i];
            if (item.type === 'Location') {
                lastLocation = item.location;
                break;
            }
        }
        if (lastLocation === location) {
            return;
        }
        this.lastLocationDestination = '';
        this.lastLocationDestinationTime = 0;

        if (isRealInstance(location)) {
            var dt = new Date().toJSON();
            var L = parseLocation(location);

            this.lastLocation.location = location;
            this.lastLocation.date = dt;

            var entry = {
                created_at: dt,
                type: 'Location',
                location,
                worldId: L.worldId,
                worldName: await this.getWorldName(L.worldId),
                groupName: await this.getGroupName(L.groupId),
                time: 0
            };
            database.addGamelogLocationToDatabase(entry);
            this.queueGameLogNoty(entry);
            this.addGameLog(entry);
            this.addInstanceJoinHistory(location, dt);

            this.applyUserDialogLocation();
            this.applyWorldDialogInstances();
            this.applyGroupDialogInstances();
        } else {
            this.lastLocation.location = '';
            this.lastLocation.date = '';
        }
    };

    $app.data.avatarHistory = new Set();
    $app.data.avatarHistoryArray = [];

    $app.methods.getAvatarHistory = async function () {
        this.avatarHistory = new Set();
        var historyArray = await database.getAvatarHistory(API.currentUser.id);
        this.avatarHistoryArray = historyArray;
        for (var i = 0; i < historyArray.length; i++) {
            var avatar = historyArray[i];
            if (avatar.authorId === API.currentUser.id) {
                continue;
            }
            this.avatarHistory.add(avatar.id);
            API.applyAvatar(avatar);
        }
    };

    $app.methods.addAvatarToHistory = function (avatarId) {
        avatarRequest.getAvatar({ avatarId }).then((args) => {
            var { ref } = args;

            database.addAvatarToCache(ref);
            database.addAvatarToHistory(ref.id);

            if (ref.authorId === API.currentUser.id) {
                return;
            }

            var historyArray = this.avatarHistoryArray;
            for (var i = 0; i < historyArray.length; ++i) {
                if (historyArray[i].id === ref.id) {
                    historyArray.splice(i, 1);
                }
            }

            this.avatarHistoryArray.unshift(ref);
            this.avatarHistory.delete(ref.id);
            this.avatarHistory.add(ref.id);
        });
    };

    $app.methods.addAvatarWearTime = function (avatarId) {
        if (!API.currentUser.$previousAvatarSwapTime || !avatarId) {
            return;
        }
        const timeSpent = Date.now() - API.currentUser.$previousAvatarSwapTime;
        database.addAvatarTimeSpent(avatarId, timeSpent);
    };

    $app.methods.promptClearAvatarHistory = function () {
        this.$confirm('Continue? Clear Avatar History', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    this.clearAvatarHistory();
                }
            }
        });
    };

    $app.methods.clearAvatarHistory = function () {
        this.avatarHistory = new Set();
        this.avatarHistoryArray = [];
        database.clearAvatarHistory();
    };

    $app.data.databaseVersion = await configRepository.getInt(
        'VRCX_databaseVersion',
        0
    );

    $app.methods.updateDatabaseVersion = async function () {
        var databaseVersion = 12;
        if (this.databaseVersion < databaseVersion) {
            if (this.databaseVersion) {
                var msgBox = this.$message({
                    message:
                        'DO NOT CLOSE VRCX, database upgrade in progress...',
                    type: 'warning',
                    duration: 0
                });
            }
            console.log(
                `Updating database from ${this.databaseVersion} to ${databaseVersion}...`
            );
            try {
                await database.cleanLegendFromFriendLog(); // fix friendLog spammed with crap
                await database.fixGameLogTraveling(); // fix bug with gameLog location being set as traveling
                await database.fixNegativeGPS(); // fix GPS being a negative value due to VRCX bug with traveling
                await database.fixBrokenLeaveEntries(); // fix user instance timer being higher than current user location timer
                await database.fixBrokenGroupInvites(); // fix notification v2 in wrong table
                await database.fixBrokenNotifications(); // fix notifications being null
                await database.fixBrokenGroupChange(); // fix spam group left & name change
                await database.fixCancelFriendRequestTypo(); // fix CancelFriendRequst typo
                await database.fixBrokenGameLogDisplayNames(); // fix gameLog display names "DisplayName (userId)"
                await database.upgradeDatabaseVersion(); // update database version
                await database.vacuum(); // succ
                await database.optimize();
                await configRepository.setInt(
                    'VRCX_databaseVersion',
                    databaseVersion
                );
                console.log('Database update complete.');
                msgBox?.close();
                if (this.databaseVersion) {
                    // only display when database exists
                    this.$message({
                        message: 'Database upgrade complete',
                        type: 'success'
                    });
                }
                this.databaseVersion = databaseVersion;
            } catch (err) {
                console.error(err);
                msgBox?.close();
                this.$message({
                    message:
                        'Database upgrade failed, check console for details',
                    type: 'error',
                    duration: 120000
                });
                AppApi.ShowDevTools();
            }
        }
    };

    // #endregion
    // #region | App: world favorite import

    $app.data.worldImportDialogVisible = false;
    $app.data.worldImportDialogInput = '';
    $app.methods.showWorldImportDialog = function () {
        this.worldImportDialogVisible = true;
    };

    // #endregion
    // #region | App: avatar favorite import

    $app.data.avatarImportDialogVisible = false;
    $app.data.avatarImportDialogInput = '';
    $app.methods.showAvatarImportDialog = function () {
        this.avatarImportDialogVisible = true;
    };

    // #endregion
    // #region | App: friend favorite import
    $app.data.friendImportDialogVisible = false;
    $app.data.friendImportDialogInput = '';
    $app.methods.showFriendImportDialog = function () {
        this.friendImportDialogVisible = true;
    };

    // #endregion
    // #region | App: note export

    $app.data.isNoteExportDialogVisible = false;

    $app.methods.showNoteExportDialog = function () {
        this.isNoteExportDialogVisible = true;
    };

    // user generated content
    $app.data.ugcFolderPath = await configRepository.getString(
        'VRCX_userGeneratedContentPath',
        ''
    );

    $app.data.folderSelectorDialogVisible = false;

    $app.methods.setUGCFolderPath = async function (path) {
        if (typeof path !== 'string') {
            path = '';
        }
        await configRepository.setString('VRCX_userGeneratedContentPath', path);
        this.ugcFolderPath = path;
    };

    $app.methods.resetUGCFolder = function () {
        this.setUGCFolderPath('');
    };

    $app.methods.openUGCFolder = async function () {
        if (LINUX && this.ugcFolderPath == null) {
            this.resetUGCFolder();
        }
        await AppApi.OpenUGCPhotosFolder(this.ugcFolderPath);
    };

    $app.methods.folderSelectorDialog = async function (oldPath) {
        if (this.folderSelectorDialogVisible) return;
        if (!oldPath) {
            oldPath = '';
        }

        this.folderSelectorDialogVisible = true;
        var newFolder = '';
        if (LINUX) {
            newFolder = await window.electron.openDirectoryDialog();
        } else {
            newFolder = await AppApi.OpenFolderSelectorDialog(oldPath);
        }

        this.folderSelectorDialogVisible = false;
        return newFolder;
    };

    $app.methods.openUGCFolderSelector = async function () {
        var path = await this.folderSelectorDialog(this.ugcFolderPath);
        await this.setUGCFolderPath(path);
    };

    // auto delete old prints

    $app.data.autoDeleteOldPrints = await configRepository.getBool(
        'VRCX_autoDeleteOldPrints',
        false
    );

    $app.methods.tryDeleteOldPrints = async function () {
        await this.refreshPrintTable();
        const printLimit = 64 - 2; // 2 reserved for new prints
        const printCount = $app.printTable.length;
        if (printCount <= printLimit) {
            return;
        }
        const deleteCount = printCount - printLimit;
        if (deleteCount <= 0) {
            return;
        }
        let idList = [];
        for (let i = 0; i < deleteCount; i++) {
            const print = $app.printTable[printCount - 1 - i];
            idList.push(print.id);
        }
        console.log(`Deleting ${deleteCount} old prints`, idList);
        try {
            for (const printId of idList) {
                await vrcPlusImageRequest.deletePrint(printId);
                var text = `Old print automaticly deleted: ${printId}`;
                if (this.errorNoty) {
                    this.errorNoty.close();
                }
                this.errorNoty = new Noty({
                    type: 'info',
                    text
                }).show();
            }
        } catch (err) {
            console.error('Failed to delete old print:', err);
        }
        await this.refreshPrintTable();
    };

    // avatar database provider

    $app.data.isAvatarProviderDialogVisible = false;

    $app.methods.showAvatarProviderDialog = function () {
        this.isAvatarProviderDialogVisible = true;
    };

    $app.methods.addAvatarProvider = function (url) {
        if (!url) {
            return;
        }
        this.showAvatarProviderDialog();
        if (!this.avatarRemoteDatabaseProviderList.includes(url)) {
            this.avatarRemoteDatabaseProviderList.push(url);
        }
        this.saveAvatarProviderList();
    };

    $app.methods.removeAvatarProvider = function (url) {
        var length = this.avatarRemoteDatabaseProviderList.length;
        for (var i = 0; i < length; ++i) {
            if (this.avatarRemoteDatabaseProviderList[i] === url) {
                this.avatarRemoteDatabaseProviderList.splice(i, 1);
            }
        }
        this.saveAvatarProviderList();
    };

    $app.methods.saveAvatarProviderList = async function () {
        var length = this.avatarRemoteDatabaseProviderList.length;
        for (var i = 0; i < length; ++i) {
            if (!this.avatarRemoteDatabaseProviderList[i]) {
                this.avatarRemoteDatabaseProviderList.splice(i, 1);
            }
        }
        await configRepository.setString(
            'VRCX_avatarRemoteDatabaseProviderList',
            JSON.stringify(this.avatarRemoteDatabaseProviderList)
        );
        if (this.avatarRemoteDatabaseProviderList.length > 0) {
            this.avatarRemoteDatabaseProvider =
                this.avatarRemoteDatabaseProviderList[0];
            this.avatarRemoteDatabase = true;
        } else {
            this.avatarRemoteDatabaseProvider = '';
            this.avatarRemoteDatabase = false;
        }
        await configRepository.setBool(
            'VRCX_avatarRemoteDatabase',
            this.avatarRemoteDatabase
        );
    };

    $app.methods.setAvatarProvider = function (provider) {
        this.avatarRemoteDatabaseProvider = provider;
    };

    // #endregion
    // #region | App: bulk unfavorite

    $app.methods.bulkCopyFavoriteSelection = function (type) {
        let idList = '';
        switch (type) {
            case 'friend':
                for (let ctx of this.favoriteFriends) {
                    if (ctx.$selected) {
                        idList += `${ctx.id}\n`;
                    }
                }
                this.friendImportDialogInput = idList;
                this.showFriendImportDialog();
                break;

            case 'world':
                for (let ctx of this.favoriteWorlds) {
                    if (ctx.$selected) {
                        idList += `${ctx.id}\n`;
                    }
                }
                this.worldImportDialogInput = idList;
                this.showWorldImportDialog();
                break;

            case 'avatar':
                for (let ctx of this.favoriteAvatars) {
                    if (ctx.$selected) {
                        idList += `${ctx.id}\n`;
                    }
                }
                this.avatarImportDialogInput = idList;
                this.showAvatarImportDialog();
                break;

            default:
                break;
        }
        console.log('Favorite selection\n', idList);
    };

    $app.methods.clearBulkFavoriteSelection = function () {
        for (var ctx of this.favoriteFriends) {
            ctx.$selected = false;
        }
        for (var ctx of this.favoriteWorlds) {
            ctx.$selected = false;
        }
        for (var ctx of this.favoriteAvatars) {
            ctx.$selected = false;
        }
    };

    // #endregion
    // #region | App: local world favorites

    $app.data.localWorldFavoriteGroups = [];
    $app.data.localWorldFavoritesList = [];
    $app.data.localWorldFavorites = {};

    $app.methods.addLocalWorldFavorite = function (worldId, group) {
        if (this.hasLocalWorldFavorite(worldId, group)) {
            return;
        }
        var ref = API.cachedWorlds.get(worldId);
        if (typeof ref === 'undefined') {
            return;
        }
        if (!this.localWorldFavoritesList.includes(worldId)) {
            this.localWorldFavoritesList.push(worldId);
        }
        if (!this.localWorldFavorites[group]) {
            this.localWorldFavorites[group] = [];
        }
        if (!this.localWorldFavoriteGroups.includes(group)) {
            this.localWorldFavoriteGroups.push(group);
        }
        this.localWorldFavorites[group].unshift(ref);
        database.addWorldToCache(ref);
        database.addWorldToFavorites(worldId, group);
        if (
            this.favoriteDialog.visible &&
            this.favoriteDialog.objectId === worldId
        ) {
            this.updateFavoriteDialog(worldId);
        }
        if (this.worldDialog.visible && this.worldDialog.id === worldId) {
            this.worldDialog.isFavorite = true;
        }

        // update UI
        this.sortLocalWorldFavorites();
    };

    $app.methods.removeLocalWorldFavorite = function (worldId, group) {
        var favoriteGroup = this.localWorldFavorites[group];
        for (var i = 0; i < favoriteGroup.length; ++i) {
            if (favoriteGroup[i].id === worldId) {
                favoriteGroup.splice(i, 1);
            }
        }

        // remove from cache if no longer in favorites
        var worldInFavorites = false;
        for (var i = 0; i < this.localWorldFavoriteGroups.length; ++i) {
            var groupName = this.localWorldFavoriteGroups[i];
            if (!this.localWorldFavorites[groupName] || group === groupName) {
                continue;
            }
            for (
                var j = 0;
                j < this.localWorldFavorites[groupName].length;
                ++j
            ) {
                var id = this.localWorldFavorites[groupName][j].id;
                if (id === worldId) {
                    worldInFavorites = true;
                    break;
                }
            }
        }
        if (!worldInFavorites) {
            $app.removeFromArray(this.localWorldFavoritesList, worldId);
            database.removeWorldFromCache(worldId);
        }
        database.removeWorldFromFavorites(worldId, group);
        if (
            this.favoriteDialog.visible &&
            this.favoriteDialog.objectId === worldId
        ) {
            this.updateFavoriteDialog(worldId);
        }
        if (this.worldDialog.visible && this.worldDialog.id === worldId) {
            this.worldDialog.isFavorite =
                API.cachedFavoritesByObjectId.has(worldId);
        }

        // update UI
        this.sortLocalWorldFavorites();
    };

    $app.methods.getLocalWorldFavorites = async function () {
        this.localWorldFavoriteGroups = [];
        this.localWorldFavoritesList = [];
        this.localWorldFavorites = {};
        var worldCache = await database.getWorldCache();
        for (var i = 0; i < worldCache.length; ++i) {
            var ref = worldCache[i];
            if (!API.cachedWorlds.has(ref.id)) {
                API.applyWorld(ref);
            }
        }
        var favorites = await database.getWorldFavorites();
        for (var i = 0; i < favorites.length; ++i) {
            var favorite = favorites[i];
            if (!this.localWorldFavoritesList.includes(favorite.worldId)) {
                this.localWorldFavoritesList.push(favorite.worldId);
            }
            if (!this.localWorldFavorites[favorite.groupName]) {
                this.localWorldFavorites[favorite.groupName] = [];
            }
            if (!this.localWorldFavoriteGroups.includes(favorite.groupName)) {
                this.localWorldFavoriteGroups.push(favorite.groupName);
            }
            var ref = API.cachedWorlds.get(favorite.worldId);
            if (typeof ref === 'undefined') {
                ref = {
                    id: favorite.worldId
                };
            }
            this.localWorldFavorites[favorite.groupName].unshift(ref);
        }
        if (this.localWorldFavoriteGroups.length === 0) {
            // default group
            this.localWorldFavorites.Favorites = [];
            this.localWorldFavoriteGroups.push('Favorites');
        }
        this.sortLocalWorldFavorites();
    };

    $app.methods.hasLocalWorldFavorite = function (worldId, group) {
        var favoriteGroup = this.localWorldFavorites[group];
        if (!favoriteGroup) {
            return false;
        }
        for (var i = 0; i < favoriteGroup.length; ++i) {
            if (favoriteGroup[i].id === worldId) {
                return true;
            }
        }
        return false;
    };

    $app.methods.getLocalWorldFavoriteGroupLength = function (group) {
        var favoriteGroup = this.localWorldFavorites[group];
        if (!favoriteGroup) {
            return 0;
        }
        return favoriteGroup.length;
    };

    $app.methods.newLocalWorldFavoriteGroup = function (group) {
        if (this.localWorldFavoriteGroups.includes(group)) {
            $app.$message({
                message: $t('prompt.new_local_favorite_group.message.error', {
                    name: group
                }),
                type: 'error'
            });
            return;
        }
        if (!this.localWorldFavorites[group]) {
            this.localWorldFavorites[group] = [];
        }
        if (!this.localWorldFavoriteGroups.includes(group)) {
            this.localWorldFavoriteGroups.push(group);
        }
        this.sortLocalWorldFavorites();
    };

    $app.methods.renameLocalWorldFavoriteGroup = function (newName, group) {
        if (this.localWorldFavoriteGroups.includes(newName)) {
            $app.$message({
                message: $t(
                    'prompt.local_favorite_group_rename.message.error',
                    { name: newName }
                ),
                type: 'error'
            });
            return;
        }
        this.localWorldFavoriteGroups.push(newName);
        this.localWorldFavorites[newName] = this.localWorldFavorites[group];

        $app.removeFromArray(this.localWorldFavoriteGroups, group);
        delete this.localWorldFavorites[group];
        database.renameWorldFavoriteGroup(newName, group);
        this.sortLocalWorldFavorites();
    };

    $app.methods.sortLocalWorldFavorites = function () {
        this.localWorldFavoriteGroups.sort();
        if (!this.sortFavorites) {
            for (var i = 0; i < this.localWorldFavoriteGroups.length; ++i) {
                var group = this.localWorldFavoriteGroups[i];
                if (this.localWorldFavorites[group]) {
                    this.localWorldFavorites[group].sort($utils.compareByName);
                }
            }
        }
    };

    $app.methods.deleteLocalWorldFavoriteGroup = function (group) {
        // remove from cache if no longer in favorites
        var worldIdRemoveList = new Set();
        var favoriteGroup = this.localWorldFavorites[group];
        for (var i = 0; i < favoriteGroup.length; ++i) {
            worldIdRemoveList.add(favoriteGroup[i].id);
        }

        $app.removeFromArray(this.localWorldFavoriteGroups, group);
        delete this.localWorldFavorites[group];
        database.deleteWorldFavoriteGroup(group);

        for (var i = 0; i < this.localWorldFavoriteGroups.length; ++i) {
            var groupName = this.localWorldFavoriteGroups[i];
            if (!this.localWorldFavorites[groupName]) {
                continue;
            }
            for (
                var j = 0;
                j < this.localWorldFavorites[groupName].length;
                ++j
            ) {
                var worldId = this.localWorldFavorites[groupName][j].id;
                if (worldIdRemoveList.has(worldId)) {
                    worldIdRemoveList.delete(worldId);
                    break;
                }
            }
        }

        worldIdRemoveList.forEach((id) => {
            $app.removeFromArray(this.localWorldFavoritesList, id);
            database.removeWorldFromCache(id);
        });
    };

    API.$on('WORLD', function (args) {
        if ($app.localWorldFavoritesList.includes(args.ref.id)) {
            // update db cache
            database.addWorldToCache(args.ref);
        }
    });

    API.$on('LOGIN', function () {
        $app.getLocalWorldFavorites();
    });

    // #endregion
    // #region | App: Local Avatar Favorites

    $app.data.localAvatarFavoriteGroups = [];
    $app.data.localAvatarFavoritesList = [];
    $app.data.localAvatarFavorites = {};

    $app.methods.addLocalAvatarFavorite = function (avatarId, group) {
        if (this.hasLocalAvatarFavorite(avatarId, group)) {
            return;
        }
        var ref = API.cachedAvatars.get(avatarId);
        if (typeof ref === 'undefined') {
            return;
        }
        if (!this.localAvatarFavoritesList.includes(avatarId)) {
            this.localAvatarFavoritesList.push(avatarId);
        }
        if (!this.localAvatarFavorites[group]) {
            this.localAvatarFavorites[group] = [];
        }
        if (!this.localAvatarFavoriteGroups.includes(group)) {
            this.localAvatarFavoriteGroups.push(group);
        }
        this.localAvatarFavorites[group].unshift(ref);
        database.addAvatarToCache(ref);
        database.addAvatarToFavorites(avatarId, group);
        if (
            this.favoriteDialog.visible &&
            this.favoriteDialog.objectId === avatarId
        ) {
            this.updateFavoriteDialog(avatarId);
        }
        if (this.avatarDialog.visible && this.avatarDialog.id === avatarId) {
            this.avatarDialog.isFavorite = true;
        }

        // update UI
        this.sortLocalAvatarFavorites();
    };

    $app.methods.removeLocalAvatarFavorite = function (avatarId, group) {
        var favoriteGroup = this.localAvatarFavorites[group];
        for (var i = 0; i < favoriteGroup.length; ++i) {
            if (favoriteGroup[i].id === avatarId) {
                favoriteGroup.splice(i, 1);
            }
        }

        // remove from cache if no longer in favorites
        var avatarInFavorites = false;
        for (var i = 0; i < this.localAvatarFavoriteGroups.length; ++i) {
            var groupName = this.localAvatarFavoriteGroups[i];
            if (!this.localAvatarFavorites[groupName] || group === groupName) {
                continue;
            }
            for (
                var j = 0;
                j < this.localAvatarFavorites[groupName].length;
                ++j
            ) {
                var id = this.localAvatarFavorites[groupName][j].id;
                if (id === avatarId) {
                    avatarInFavorites = true;
                    break;
                }
            }
        }
        if (!avatarInFavorites) {
            $app.removeFromArray(this.localAvatarFavoritesList, avatarId);
            if (!this.avatarHistory.has(avatarId)) {
                database.removeAvatarFromCache(avatarId);
            }
        }
        database.removeAvatarFromFavorites(avatarId, group);
        if (
            this.favoriteDialog.visible &&
            this.favoriteDialog.objectId === avatarId
        ) {
            this.updateFavoriteDialog(avatarId);
        }
        if (this.avatarDialog.visible && this.avatarDialog.id === avatarId) {
            this.avatarDialog.isFavorite =
                API.cachedFavoritesByObjectId.has(avatarId);
        }

        // update UI
        this.sortLocalAvatarFavorites();
    };

    API.$on('AVATAR', function (args) {
        if ($app.localAvatarFavoritesList.includes(args.ref.id)) {
            for (var i = 0; i < $app.localAvatarFavoriteGroups.length; ++i) {
                var groupName = $app.localAvatarFavoriteGroups[i];
                if (!$app.localAvatarFavorites[groupName]) {
                    continue;
                }
                for (
                    var j = 0;
                    j < $app.localAvatarFavorites[groupName].length;
                    ++j
                ) {
                    var ref = $app.localAvatarFavorites[groupName][j];
                    if (ref.id === args.ref.id) {
                        $app.localAvatarFavorites[groupName][j] = args.ref;
                    }
                }
            }

            // update db cache
            database.addAvatarToCache(args.ref);
        }
    });

    API.$on('LOGIN', function () {
        $app.localAvatarFavoriteGroups = [];
        $app.localAvatarFavoritesList = [];
        $app.localAvatarFavorites = {};
        workerTimers.setTimeout(() => $app.getLocalAvatarFavorites(), 100);
    });

    $app.methods.getLocalAvatarFavorites = async function () {
        this.localAvatarFavoriteGroups = [];
        this.localAvatarFavoritesList = [];
        this.localAvatarFavorites = {};
        var avatarCache = await database.getAvatarCache();
        for (var i = 0; i < avatarCache.length; ++i) {
            var ref = avatarCache[i];
            if (!API.cachedAvatars.has(ref.id)) {
                API.applyAvatar(ref);
            }
        }
        var favorites = await database.getAvatarFavorites();
        for (var i = 0; i < favorites.length; ++i) {
            var favorite = favorites[i];
            if (!this.localAvatarFavoritesList.includes(favorite.avatarId)) {
                this.localAvatarFavoritesList.push(favorite.avatarId);
            }
            if (!this.localAvatarFavorites[favorite.groupName]) {
                this.localAvatarFavorites[favorite.groupName] = [];
            }
            if (!this.localAvatarFavoriteGroups.includes(favorite.groupName)) {
                this.localAvatarFavoriteGroups.push(favorite.groupName);
            }
            var ref = API.cachedAvatars.get(favorite.avatarId);
            if (typeof ref === 'undefined') {
                ref = {
                    id: favorite.avatarId
                };
            }
            this.localAvatarFavorites[favorite.groupName].unshift(ref);
        }
        if (this.localAvatarFavoriteGroups.length === 0) {
            // default group
            this.localAvatarFavorites.Favorites = [];
            this.localAvatarFavoriteGroups.push('Favorites');
        }
        this.sortLocalAvatarFavorites();
    };

    $app.methods.hasLocalAvatarFavorite = function (avatarId, group) {
        var favoriteGroup = this.localAvatarFavorites[group];
        if (!favoriteGroup) {
            return false;
        }
        for (var i = 0; i < favoriteGroup.length; ++i) {
            if (favoriteGroup[i].id === avatarId) {
                return true;
            }
        }
        return false;
    };

    $app.methods.promptNewLocalAvatarFavoriteGroup = function () {
        this.$prompt(
            $t('prompt.new_local_favorite_group.description'),
            $t('prompt.new_local_favorite_group.header'),
            {
                distinguishCancelAndClose: true,
                confirmButtonText: $t('prompt.new_local_favorite_group.ok'),
                cancelButtonText: $t('prompt.new_local_favorite_group.cancel'),
                inputPattern: /\S+/,
                inputErrorMessage: $t(
                    'prompt.new_local_favorite_group.input_error'
                ),
                callback: (action, instance) => {
                    if (action === 'confirm' && instance.inputValue) {
                        this.newLocalAvatarFavoriteGroup(instance.inputValue);
                    }
                }
            }
        );
    };

    $app.methods.newLocalAvatarFavoriteGroup = function (group) {
        if (this.localAvatarFavoriteGroups.includes(group)) {
            $app.$message({
                message: $t('prompt.new_local_favorite_group.message.error', {
                    name: group
                }),
                type: 'error'
            });
            return;
        }
        if (!this.localAvatarFavorites[group]) {
            this.localAvatarFavorites[group] = [];
        }
        if (!this.localAvatarFavoriteGroups.includes(group)) {
            this.localAvatarFavoriteGroups.push(group);
        }
        this.sortLocalAvatarFavorites();
    };

    $app.methods.promptLocalAvatarFavoriteGroupRename = function (group) {
        this.$prompt(
            $t('prompt.local_favorite_group_rename.description'),
            $t('prompt.local_favorite_group_rename.header'),
            {
                distinguishCancelAndClose: true,
                confirmButtonText: $t(
                    'prompt.local_favorite_group_rename.save'
                ),
                cancelButtonText: $t(
                    'prompt.local_favorite_group_rename.cancel'
                ),
                inputPattern: /\S+/,
                inputErrorMessage: $t(
                    'prompt.local_favorite_group_rename.input_error'
                ),
                inputValue: group,
                callback: (action, instance) => {
                    if (action === 'confirm' && instance.inputValue) {
                        this.renameLocalAvatarFavoriteGroup(
                            instance.inputValue,
                            group
                        );
                    }
                }
            }
        );
    };

    $app.methods.renameLocalAvatarFavoriteGroup = function (newName, group) {
        if (this.localAvatarFavoriteGroups.includes(newName)) {
            $app.$message({
                message: $t(
                    'prompt.local_favorite_group_rename.message.error',
                    { name: newName }
                ),
                type: 'error'
            });
            return;
        }
        this.localAvatarFavoriteGroups.push(newName);
        this.localAvatarFavorites[newName] = this.localAvatarFavorites[group];

        $app.removeFromArray(this.localAvatarFavoriteGroups, group);
        delete this.localAvatarFavorites[group];
        database.renameAvatarFavoriteGroup(newName, group);
        this.sortLocalAvatarFavorites();
    };

    $app.methods.promptLocalAvatarFavoriteGroupDelete = function (group) {
        this.$confirm(`Delete Group? ${group}`, 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info',
            callback: (action) => {
                if (action === 'confirm') {
                    this.deleteLocalAvatarFavoriteGroup(group);
                }
            }
        });
    };

    $app.methods.sortLocalAvatarFavorites = function () {
        this.localAvatarFavoriteGroups.sort();
        if (!this.sortFavorites) {
            for (var i = 0; i < this.localAvatarFavoriteGroups.length; ++i) {
                var group = this.localAvatarFavoriteGroups[i];
                if (this.localAvatarFavorites[group]) {
                    this.localAvatarFavorites[group].sort($utils.compareByName);
                }
            }
        }
    };

    $app.methods.deleteLocalAvatarFavoriteGroup = function (group) {
        // remove from cache if no longer in favorites
        var avatarIdRemoveList = new Set();
        var favoriteGroup = this.localAvatarFavorites[group];
        for (var i = 0; i < favoriteGroup.length; ++i) {
            avatarIdRemoveList.add(favoriteGroup[i].id);
        }

        $app.removeFromArray(this.localAvatarFavoriteGroups, group);
        delete this.localAvatarFavorites[group];
        database.deleteAvatarFavoriteGroup(group);

        for (var i = 0; i < this.localAvatarFavoriteGroups.length; ++i) {
            var groupName = this.localAvatarFavoriteGroups[i];
            if (!this.localAvatarFavorites[groupName]) {
                continue;
            }
            for (
                var j = 0;
                j < this.localAvatarFavorites[groupName].length;
                ++j
            ) {
                var avatarId = this.localAvatarFavorites[groupName][j].id;
                if (avatarIdRemoveList.has(avatarId)) {
                    avatarIdRemoveList.delete(avatarId);
                    break;
                }
            }
        }

        avatarIdRemoveList.forEach((id) => {
            // remove from cache if no longer in favorites
            var avatarInFavorites = false;
            loop: for (
                var i = 0;
                i < this.localAvatarFavoriteGroups.length;
                ++i
            ) {
                var groupName = this.localAvatarFavoriteGroups[i];
                if (
                    !this.localAvatarFavorites[groupName] ||
                    group === groupName
                ) {
                    continue loop;
                }
                for (
                    var j = 0;
                    j < this.localAvatarFavorites[groupName].length;
                    ++j
                ) {
                    var avatarId = this.localAvatarFavorites[groupName][j].id;
                    if (id === avatarId) {
                        avatarInFavorites = true;
                        break loop;
                    }
                }
            }
            if (!avatarInFavorites) {
                $app.removeFromArray(this.localAvatarFavoritesList, id);
                if (!this.avatarHistory.has(id)) {
                    database.removeAvatarFromCache(id);
                }
            }
        });
    };

    // #endregion
    // #region | Local Favorite Friends

    $app.data.localFavoriteFriends = new Set();
    $app.data.localFavoriteFriendsGroups = JSON.parse(
        await configRepository.getString(
            'VRCX_localFavoriteFriendsGroups',
            '[]'
        )
    );
    $app.methods.updateLocalFavoriteFriends = function () {
        this.localFavoriteFriends.clear();
        for (const ref of API.cachedFavorites.values()) {
            if (
                !ref.$isDeleted &&
                ref.type === 'friend' &&
                (this.localFavoriteFriendsGroups.includes(ref.$groupKey) ||
                    this.localFavoriteFriendsGroups.length === 0)
            ) {
                this.localFavoriteFriends.add(ref.favoriteId);
            }
        }
        this.updateSidebarFriendsList();

        configRepository.setString(
            'VRCX_localFavoriteFriendsGroups',
            JSON.stringify(this.localFavoriteFriendsGroups)
        );
    };

    $app.methods.updateSidebarFriendsList = function () {
        for (var ctx of this.friends.values()) {
            var isVIP = this.localFavoriteFriends.has(ctx.id);
            if (ctx.isVIP === isVIP) {
                continue;
            }
            ctx.isVIP = isVIP;
            if (ctx.state !== 'online') {
                continue;
            }
            if (ctx.isVIP) {
                $app.removeFromArray(this.onlineFriends_, ctx);
                this.vipFriends_.push(ctx);
                this.sortVIPFriends = true;
            } else {
                $app.removeFromArray(this.vipFriends_, ctx);
                this.onlineFriends_.push(ctx);
                this.sortOnlineFriends = true;
            }
        }
    };

    // #endregion
    // #region | App: ChatBox Blacklist

    $app.methods.checkChatboxBlacklist = function (msg) {
        for (var i = 0; i < this.chatboxBlacklist.length; ++i) {
            if (msg.includes(this.chatboxBlacklist[i])) {
                return true;
            }
        }
        return false;
    };

    // #endregion
    // #region | App: ChatBox User Blacklist
    $app.data.chatboxUserBlacklist = new Map();
    if (await configRepository.getString('VRCX_chatboxUserBlacklist')) {
        $app.data.chatboxUserBlacklist = new Map(
            Object.entries(
                JSON.parse(
                    await configRepository.getString(
                        'VRCX_chatboxUserBlacklist'
                    )
                )
            )
        );
    }

    $app.methods.getLocalAvatarFavoriteGroupLength = function (group) {
        var favoriteGroup = this.localAvatarFavorites[group];
        if (!favoriteGroup) {
            return 0;
        }
        return favoriteGroup.length;
    };

    $app.methods.saveChatboxUserBlacklist = async function () {
        await configRepository.setString(
            'VRCX_chatboxUserBlacklist',
            JSON.stringify(Object.fromEntries(this.chatboxUserBlacklist))
        );
    };

    // #endregion
    // #region | App: Instance queuing

    API.queuedInstances = new Map();

    $app.methods.removeAllQueuedInstances = function () {
        API.queuedInstances.forEach((ref) => {
            this.$message({
                message: `Removed instance ${ref.$worldName} from queue`,
                type: 'info'
            });
            ref.$msgBox?.close();
        });
        API.queuedInstances.clear();
    };

    $app.methods.removeQueuedInstance = function (instanceId) {
        var ref = API.queuedInstances.get(instanceId);
        if (typeof ref !== 'undefined') {
            ref.$msgBox.close();
            API.queuedInstances.delete(instanceId);
        }
    };

    API.applyQueuedInstance = function (instanceId) {
        API.queuedInstances.forEach((ref) => {
            if (ref.location !== instanceId) {
                $app.$message({
                    message: $t('message.instance.removed_form_queue', {
                        worldName: ref.$worldName
                    }),
                    type: 'info'
                });
                ref.$msgBox?.close();
                API.queuedInstances.delete(ref.location);
            }
        });
        if (!instanceId) {
            return;
        }
        if (!API.queuedInstances.has(instanceId)) {
            var L = parseLocation(instanceId);
            if (L.isRealInstance) {
                instanceRequest
                    .getInstance({
                        worldId: L.worldId,
                        instanceId: L.instanceId
                    })
                    .then((args) => {
                        if (args.json?.queueSize) {
                            $app.instanceQueueUpdate(
                                instanceId,
                                args.json?.queueSize,
                                args.json?.queueSize
                            );
                        }
                    });
            }
            $app.instanceQueueUpdate(instanceId, 0, 0);
        }
    };

    $app.methods.instanceQueueReady = function (instanceId) {
        var ref = API.queuedInstances.get(instanceId);
        if (typeof ref !== 'undefined') {
            ref.$msgBox.close();
            API.queuedInstances.delete(instanceId);
        }
        var L = parseLocation(instanceId);
        var group = API.cachedGroups.get(L.groupId);
        var groupName = group?.name ?? '';
        var worldName = ref?.$worldName ?? '';
        const location = displayLocation(instanceId, worldName, groupName);
        this.$message({
            message: `Instance ready to join ${location}`,
            type: 'success'
        });
        var noty = {
            created_at: new Date().toJSON(),
            type: 'group.queueReady',
            imageUrl: group?.iconUrl,
            message: `Instance ready to join ${location}`,
            location: instanceId,
            groupName,
            worldName
        };
        if (
            this.notificationTable.filters[0].value.length === 0 ||
            this.notificationTable.filters[0].value.includes(noty.type)
        ) {
            this.notifyMenu('notification');
        }
        this.queueNotificationNoty(noty);
        this.notificationTable.data.push(noty);
        this.updateSharedFeed(true);
    };

    $app.methods.instanceQueueUpdate = async function (
        instanceId,
        position,
        queueSize
    ) {
        var ref = API.queuedInstances.get(instanceId);
        if (typeof ref === 'undefined') {
            ref = {
                $msgBox: null,
                $groupName: '',
                $worldName: '',
                location: instanceId,
                position: 0,
                queueSize: 0,
                updatedAt: 0
            };
        }
        ref.position = position;
        ref.queueSize = queueSize;
        ref.updatedAt = Date.now();
        if (!ref.$msgBox || ref.$msgBox.closed) {
            ref.$msgBox = this.$message({
                message: '',
                type: 'info',
                duration: 0,
                showClose: true,
                customClass: 'vrc-instance-queue-message'
            });
        }
        if (!ref.$groupName) {
            ref.$groupName = await this.getGroupName(instanceId);
        }
        if (!ref.$worldName) {
            ref.$worldName = await this.getWorldName(instanceId);
        }
        const location = displayLocation(
            instanceId,
            ref.$worldName,
            ref.$groupName
        );
        ref.$msgBox.message = `You are in position ${ref.position} of ${ref.queueSize} in the queue for ${location} `;
        API.queuedInstances.set(instanceId, ref);
        // workerTimers.setTimeout(this.instanceQueueTimeout, 3600000);
    };

    $app.methods.instanceQueueClear = function () {
        // remove all instances from queue
        API.queuedInstances.forEach((ref) => {
            ref.$msgBox.close();
            API.queuedInstances.delete(ref.location);
        });
    };

    // #endregion

    $app.methods.checkVRChatDebugLogging = async function () {
        if (this.gameLogDisabled) {
            return;
        }
        try {
            var loggingEnabled =
                await this.getVRChatRegistryKey('LOGGING_ENABLED');
            if (
                loggingEnabled === null ||
                typeof loggingEnabled === 'undefined'
            ) {
                // key not found
                return;
            }
            if (parseInt(loggingEnabled, 10) === 1) {
                // already enabled
                return;
            }
            var result = await AppApi.SetVRChatRegistryKey(
                'LOGGING_ENABLED',
                '1',
                4
            );
            if (!result) {
                // failed to set key
                this.$alert(
                    'VRCX has noticed VRChat debug logging is disabled. VRCX requires debug logging in order to function correctly. Please enable debug logging in VRChat quick menu settings > debug > enable debug logging, then rejoin the instance or restart VRChat.',
                    'Enable debug logging'
                );
                console.error('Failed to enable debug logging', result);
                return;
            }
            this.$alert(
                'VRCX has noticed VRChat debug logging is disabled and automatically re-enabled it. VRCX requires debug logging in order to function correctly.',
                'Enabled debug logging'
            );
            console.log('Enabled debug logging');
        } catch (e) {
            console.error(e);
        }
    };

    // #endregion
    // #region | App: Language

    $app.data.userDialogWorldSortingOptions = {};
    $app.data.userDialogWorldOrderOptions = {};

    $app.methods.applyUserDialogSortingStrings = function () {
        this.userDialogWorldSortingOptions = {
            name: {
                name: $t('dialog.user.worlds.sorting.name'),
                value: 'name'
            },
            updated: {
                name: $t('dialog.user.worlds.sorting.updated'),
                value: 'updated'
            },
            created: {
                name: $t('dialog.user.worlds.sorting.created'),
                value: 'created'
            },
            favorites: {
                name: $t('dialog.user.worlds.sorting.favorites'),
                value: 'favorites'
            },
            popularity: {
                name: $t('dialog.user.worlds.sorting.popularity'),
                value: 'popularity'
            }
        };

        this.userDialogWorldOrderOptions = {
            descending: {
                name: $t('dialog.user.worlds.order.descending'),
                value: 'descending'
            },
            ascending: {
                name: $t('dialog.user.worlds.order.ascending'),
                value: 'ascending'
            }
        };
    };

    $app.data.groupDialogSortingOptions = {};
    $app.data.groupDialogFilterOptions = {};

    $app.methods.applyGroupDialogSortingStrings = function () {
        this.groupDialogSortingOptions = {
            joinedAtDesc: {
                name: $t('dialog.group.members.sorting.joined_at_desc'),
                value: 'joinedAt:desc'
            },
            joinedAtAsc: {
                name: $t('dialog.group.members.sorting.joined_at_asc'),
                value: 'joinedAt:asc'
            },
            userId: {
                name: $t('dialog.group.members.sorting.user_id'),
                value: ''
            }
        };

        this.groupDialogFilterOptions = {
            everyone: {
                name: $t('dialog.group.members.filters.everyone'),
                id: null
            },
            usersWithNoRole: {
                name: $t('dialog.group.members.filters.users_with_no_role'),
                id: ''
            }
        };
    };

    $app.methods.applyLanguageStrings = function () {
        // repply sorting strings
        this.applyUserDialogSortingStrings();
        this.applyGroupDialogSortingStrings();
        this.userDialog.worldSorting =
            this.userDialogWorldSortingOptions.updated;
        this.userDialog.worldOrder =
            this.userDialogWorldOrderOptions.descending;
        this.userDialog.groupSorting =
            userDialogGroupSortingOptions.alphabetical;

        this.groupDialog.memberFilter = this.groupDialogFilterOptions.everyone;
        this.groupDialog.memberSortOrder =
            this.groupDialogSortingOptions.joinedAtDesc;
    };

    $app.data.appLanguage =
        (await configRepository.getString('VRCX_appLanguage')) ?? 'en';
    $utils.changeCJKorder($app.data.appLanguage);
    i18n.locale = $app.data.appLanguage;
    $app.methods.initLanguage = async function () {
        if (!(await configRepository.getString('VRCX_appLanguage'))) {
            var result = await AppApi.CurrentLanguage();
            if (!result) {
                console.error('Failed to get current language');
                this.changeAppLanguage('en');
                return;
            }
            var lang = result.split('-')[0];
            i18n.availableLocales.forEach((ref) => {
                var refLang = ref.split('_')[0];
                if (refLang === lang) {
                    this.changeAppLanguage(ref);
                }
            });
        }

        $app.applyLanguageStrings();
    };

    $app.methods.changeAppLanguage = function (language) {
        console.log('Language changed:', language);
        this.appLanguage = language;
        $utils.changeCJKorder(language);
        i18n.locale = language;
        configRepository.setString('VRCX_appLanguage', language);
        this.applyLanguageStrings();
        this.updateVRConfigVars();
        this._stringComparer = undefined;
    };

    // #endregion
    // #region | App: Random unsorted app methods, data structs, API functions, and an API feedback/file analysis event

    $app.data.changeLogDialog = {
        visible: false,
        buildName: '',
        changeLog: ''
    };

    $app.methods.showChangeLogDialog = function () {
        this.changeLogDialog.visible = true;
        this.checkForVRCXUpdate();
    };

    $app.methods.changeLogRemoveLinks = function (text) {
        return text.replace(/([^!])\[[^\]]+\]\([^)]+\)/g, '$1');
    };

    $app.methods.openFolderGeneric = function (path) {
        AppApi.OpenFolderAndSelectItem(path, true);
    };

    // #endregion
    // #region | Dialog: fullscreen image

    $app.data.fullscreenImageDialog = {
        visible: false,
        imageUrl: '',
        fileName: ''
    };

    $app.methods.showFullscreenImageDialog = function (imageUrl, fileName) {
        if (!imageUrl) {
            return;
        }
        const D = this.fullscreenImageDialog;
        D.imageUrl = imageUrl;
        D.fileName = fileName;
        D.visible = true;
    };

    // #endregion
    // #region | Open common folders

    $app.methods.openVrcxAppDataFolder = function () {
        AppApi.OpenVrcxAppDataFolder().then((result) => {
            if (result) {
                this.$message({
                    message: 'Folder opened',
                    type: 'success'
                });
            } else {
                this.$message({
                    message: "Folder dosn't exist",
                    type: 'error'
                });
            }
        });
    };

    $app.methods.openVrcAppDataFolder = function () {
        AppApi.OpenVrcAppDataFolder().then((result) => {
            if (result) {
                this.$message({
                    message: 'Folder opened',
                    type: 'success'
                });
            } else {
                this.$message({
                    message: "Folder dosn't exist",
                    type: 'error'
                });
            }
        });
    };

    $app.methods.openVrcPhotosFolder = function () {
        AppApi.OpenVrcPhotosFolder().then((result) => {
            if (result) {
                this.$message({
                    message: 'Folder opened',
                    type: 'success'
                });
            } else {
                this.$message({
                    message: "Folder dosn't exist",
                    type: 'error'
                });
            }
        });
    };

    $app.methods.openVrcScreenshotsFolder = function () {
        AppApi.OpenVrcScreenshotsFolder().then((result) => {
            if (result) {
                this.$message({
                    message: 'Folder opened',
                    type: 'success'
                });
            } else {
                this.$message({
                    message: "Folder dosn't exist",
                    type: 'error'
                });
            }
        });
    };

    $app.methods.openCrashVrcCrashDumps = function () {
        AppApi.OpenCrashVrcCrashDumps().then((result) => {
            if (result) {
                this.$message({
                    message: 'Folder opened',
                    type: 'success'
                });
            } else {
                this.$message({
                    message: "Folder dosn't exist",
                    type: 'error'
                });
            }
        });
    };

    // #endregion
    // #region | Close instance

    $app.methods.closeInstance = function (location) {
        this.$confirm(
            'Continue? Close Instance, nobody will be able to join',
            'Confirm',
            {
                confirmButtonText: 'Confirm',
                cancelButtonText: 'Cancel',
                type: 'warning',
                callback: (action) => {
                    if (action !== 'confirm') {
                        return;
                    }
                    miscRequest.closeInstance({ location, hardClose: false });
                }
            }
        );
    };

    API.$on('INSTANCE:CLOSE', function (args) {
        if (args.json) {
            $app.$message({
                message: $t('message.instance.closed'),
                type: 'success'
            });

            this.$emit('INSTANCE', {
                json: args.json
            });
        }
    });

    // #endregion
    // #region | Settings: Zoom

    $app.data.zoomLevel = ((await AppApi.GetZoom()) + 10) * 10;

    $app.methods.getZoomLevel = async function () {
        this.zoomLevel = ((await AppApi.GetZoom()) + 10) * 10;
    };

    $app.methods.setZoomLevel = function () {
        AppApi.SetZoom(this.zoomLevel / 10 - 10);
    };

    // #endregion

    // #region instance join history

    $app.data.instanceJoinHistory = new Map();

    API.$on('LOGIN', function () {
        $app.instanceJoinHistory = new Map();
        $app.getInstanceJoinHistory();
    });

    $app.methods.getInstanceJoinHistory = async function () {
        this.instanceJoinHistory = await database.getInstanceJoinHistory();
    };

    $app.methods.addInstanceJoinHistory = function (location, dateTime) {
        if (!location || !dateTime) {
            return;
        }

        if (this.instanceJoinHistory.has(location)) {
            this.instanceJoinHistory.delete(location);
        }

        var epoch = new Date(dateTime).getTime();
        this.instanceJoinHistory.set(location, epoch);
    };

    // #endregion

    // #region persistent data

    API.$on('WORLD:PERSIST:HAS', function (args) {
        if (
            args.params.worldId === $app.worldDialog.id &&
            $app.worldDialog.visible
        ) {
            $app.worldDialog.hasPersistData = args.json !== false;
        }
    });

    API.$on('WORLD:PERSIST:DELETE', function (args) {
        if (
            args.params.worldId === $app.worldDialog.id &&
            $app.worldDialog.visible
        ) {
            $app.worldDialog.hasPersistData = false;
        }
    });

    // #endregion

    $app.data.ossDialog = false;

    $app.computed.isLinux = function () {
        return LINUX;
    };

    // friendsListSidebar

    //  - DivideByFriendGroup

    $app.data.isSidebarDivideByFriendGroup = await configRepository.getBool(
        'VRCX_sidebarDivideByFriendGroup',
        true
    );

    $app.methods.handleSwitchDivideByFriendGroup = async function () {
        this.isSidebarDivideByFriendGroup = !this.isSidebarDivideByFriendGroup;
        await configRepository.setBool(
            'VRCX_sidebarDivideByFriendGroup',
            this.isSidebarDivideByFriendGroup
        );
    };

    //  - SidebarGroupByInstance

    $app.data.isSidebarGroupByInstance = await configRepository.getBool(
        'VRCX_sidebarGroupByInstance',
        true
    );

    $app.methods.toggleGroupByInstance = function () {
        this.isSidebarGroupByInstance = !this.isSidebarGroupByInstance;
        configRepository.setBool(
            'VRCX_sidebarGroupByInstance',
            this.isSidebarGroupByInstance
        );
    };

    $app.data.isHideFriendsInSameInstance = await configRepository.getBool(
        'VRCX_hideFriendsInSameInstance',
        false
    );

    $app.methods.toggleHideFriendsInSameInstance = function () {
        this.isHideFriendsInSameInstance = !this.isHideFriendsInSameInstance;
        configRepository.setBool(
            'VRCX_hideFriendsInSameInstance',
            this.isHideFriendsInSameInstance
        );
    };

    // #endregion
    // #region | Tab Props

    $app.computed.moderationTabBind = function () {
        return {
            menuActiveIndex: this.menuActiveIndex,
            tableData: this.playerModerationTable,
            shiftHeld: this.shiftHeld,
            hideTooltips: this.hideTooltips
        };
    };

    $app.computed.friendsListTabBind = function () {
        return {
            menuActiveIndex: this.menuActiveIndex,
            friends: this.friends,
            hideTooltips: this.hideTooltips,
            randomUserColours: this.randomUserColours,
            sortStatus: this.sortStatus,
            confirmDeleteFriend: this.confirmDeleteFriend,
            friendsListSearch: this.friendsListSearch,
            stringComparer: this.stringComparer
        };
    };
    $app.computed.friendsListTabEvent = function () {
        return {
            'get-all-user-stats': this.getAllUserStats,
            'lookup-user': this.lookupUser,
            'update:friends-list-search': (value) =>
                (this.friendsListSearch = value)
        };
    };

    $app.computed.sideBarTabBind = function () {
        return {
            isSideBarTabShow: this.isSideBarTabShow,
            style: { width: `${this.asideWidth}px` },
            vipFriends: this.vipFriends,
            onlineFriends: this.onlineFriends,
            quickSearchRemoteMethod: this.quickSearchRemoteMethod,
            quickSearchItems: this.quickSearchItems,
            hideTooltips: this.hideTooltips,
            onlineFriendCount: this.onlineFriendCount,
            friends: this.friends,
            isGameRunning: this.isGameRunning,
            isSidebarDivideByFriendGroup: this.isSidebarDivideByFriendGroup,
            isSidebarGroupByInstance: this.isSidebarGroupByInstance,
            isHideFriendsInSameInstance: this.isHideFriendsInSameInstance,
            gameLogDisabled: this.gameLogDisabled,
            lastLocation: this.lastLocation,
            lastLocationDestination: this.lastLocationDestination,
            hideNicknames: this.hideNicknames,
            activeFriends: this.activeFriends,
            offlineFriends: this.offlineFriends,
            groupInstances: this.groupInstances,
            inGameGroupOrder: this.inGameGroupOrder,
            groupedByGroupKeyFavoriteFriends:
                this.groupedByGroupKeyFavoriteFriends,
            isAgeGatedInstancesVisible: this.isAgeGatedInstancesVisible
        };
    };

    $app.computed.sideBarTabEvent = function () {
        return {
            'show-group-dialog': this.showGroupDialog,
            'quick-search-change': this.quickSearchChange,
            'direct-access-paste': this.directAccessPaste,
            'refresh-friends-list': this.refreshFriendsList,
            'confirm-delete-friend': this.confirmDeleteFriend
        };
    };

    $app.computed.isSideBarTabShow = function () {
        return !(
            this.menuActiveIndex === 'friendList' ||
            this.menuActiveIndex === 'charts'
        );
    };

    $app.computed.favoritesTabBind = function () {
        return {
            menuActiveIndex: this.menuActiveIndex,
            hideTooltips: this.hideTooltips,
            shiftHeld: this.shiftHeld,
            favoriteFriends: this.favoriteFriends,
            sortFavorites: this.sortFavorites,
            groupedByGroupKeyFavoriteFriends:
                this.groupedByGroupKeyFavoriteFriends,
            favoriteWorlds: this.favoriteWorlds,
            localWorldFavoriteGroups: this.localWorldFavoriteGroups,
            localWorldFavorites: this.localWorldFavorites,
            avatarHistoryArray: this.avatarHistoryArray,
            localAvatarFavoriteGroups: this.localAvatarFavoriteGroups,
            localAvatarFavorites: this.localAvatarFavorites,
            favoriteAvatars: this.favoriteAvatars,
            localAvatarFavoritesList: this.localAvatarFavoritesList,
            localWorldFavoritesList: this.localWorldFavoritesList
        };
    };

    $app.computed.favoritesTabEvent = function () {
        return {
            'update:sort-favorites': (value) => (this.sortFavorites = value),
            'clear-bulk-favorite-selection': this.clearBulkFavoriteSelection,
            'bulk-copy-favorite-selection': this.bulkCopyFavoriteSelection,
            'get-local-world-favorites': this.getLocalWorldFavorites,
            'show-friend-import-dialog': this.showFriendImportDialog,
            'save-sort-favorites-option': this.saveSortFavoritesOption,
            'show-world-import-dialog': this.showWorldImportDialog,
            'show-world-dialog': this.showWorldDialog,
            'new-instance-self-invite': this.newInstanceSelfInvite,
            'delete-local-world-favorite-group':
                this.deleteLocalWorldFavoriteGroup,
            'remove-local-world-favorite': this.removeLocalWorldFavorite,
            'show-avatar-import-dialog': this.showAvatarImportDialog,
            'show-avatar-dialog': this.showAvatarDialog,
            'remove-local-avatar-favorite': this.removeLocalAvatarFavorite,
            'select-avatar-with-confirmation':
                this.selectAvatarWithConfirmation,
            'prompt-clear-avatar-history': this.promptClearAvatarHistory,
            'prompt-new-local-avatar-favorite-group':
                this.promptNewLocalAvatarFavoriteGroup,
            'prompt-local-avatar-favorite-group-rename':
                this.promptLocalAvatarFavoriteGroupRename,
            'prompt-local-avatar-favorite-group-delete':
                this.promptLocalAvatarFavoriteGroupDelete,
            'new-local-world-favorite-group': this.newLocalWorldFavoriteGroup,
            'rename-local-world-favorite-group':
                this.renameLocalWorldFavoriteGroup
        };
    };

    $app.computed.chartsTabBind = function () {
        return {
            getWorldName: this.getWorldName,
            isDarkMode: this.isDarkMode,
            dtHour12: this.dtHour12,
            friendsMap: this.friends,
            localFavoriteFriends: this.localFavoriteFriends
        };
    };
    $app.computed.chartsTabEvent = function () {
        return {
            'open-previous-instance-info-dialog':
                this.showPreviousInstancesInfoDialog
        };
    };

    $app.computed.friendLogTabBind = function () {
        return {
            menuActiveIndex: this.menuActiveIndex,
            friendLogTable: this.friendLogTable,
            shiftHeld: this.shiftHeld
        };
    };

    $app.computed.gameLogTabBind = function () {
        return {
            menuActiveIndex: this.menuActiveIndex,
            gameLogTable: this.gameLogTable,
            shiftHeld: this.shiftHeld,
            hideTooltips: this.hideTooltips,
            gameLogIsFriend: this.gameLogIsFriend,
            gameLogIsFavorite: this.gameLogIsFavorite
        };
    };

    $app.computed.gameLogTabEvent = function () {
        return {
            gameLogTableLookup: this.gameLogTableLookup,
            lookupUser: this.lookupUser,
            updateGameLogSessionTable: (val) =>
                (this.gameLogSessionTable = val),
            updateSharedFeed: this.updateSharedFeed
        };
    };

    $app.computed.notificationTabBind = function () {
        return {
            menuActiveIndex: this.menuActiveIndex,
            notificationTable: this.notificationTable,
            shiftHeld: this.shiftHeld,
            hideTooltips: this.hideTooltips,
            lastLocation: this.lastLocation,
            lastLocationDestination: this.lastLocationDestination,
            isGameRunning: this.isGameRunning,
            inviteResponseMessageTable: this.inviteResponseMessageTable,
            uploadImage: this.uploadImage,
            checkCanInvite: this.checkCanInvite,
            inviteRequestResponseMessageTable:
                this.inviteRequestResponseMessageTable
        };
    };

    $app.computed.notificationTabEvent = function () {
        return {
            inviteImageUpload: this.inviteImageUpload,
            clearInviteImageUpload: this.clearInviteImageUpload
        };
    };

    $app.computed.feedTabBind = function () {
        return {
            menuActiveIndex: this.menuActiveIndex,
            hideTooltips: this.hideTooltips,
            feedTable: this.feedTable
        };
    };

    $app.computed.feedTabEvent = function () {
        return {
            feedTableLookup: this.feedTableLookup
        };
    };

    $app.computed.searchTabBind = function () {
        return {
            menuActiveIndex: this.menuActiveIndex,
            searchText: this.searchText,
            searchUserResults: this.searchUserResults,
            randomUserColours: this.randomUserColours,
            avatarRemoteDatabaseProviderList:
                this.avatarRemoteDatabaseProviderList,
            avatarRemoteDatabaseProvider: this.avatarRemoteDatabaseProvider,
            hideTooltips: this.hideTooltips,
            userDialog: this.userDialog,
            lookupAvatars: this.lookupAvatars,
            avatarRemoteDatabase: this.avatarRemoteDatabase
        };
    };

    $app.computed.searchTabEvent = function () {
        return {
            clearSearch: this.clearSearch,
            setAvatarProvider: this.setAvatarProvider,
            refreshUserDialogAvatars: this.refreshUserDialogAvatars,
            moreSearchUser: this.moreSearchUser,
            'update:searchText': (value) => (this.searchText = value)
        };
    };

    $app.computed.profileTabBind = function () {
        return {
            menuActiveIndex: this.menuActiveIndex,
            hideTooltips: this.hideTooltips,
            inviteMessageTable: this.inviteMessageTable,
            inviteResponseMessageTable: this.inviteResponseMessageTable,
            inviteRequestMessageTable: this.inviteRequestMessageTable,
            inviteRequestResponseMessageTable:
                this.inviteRequestResponseMessageTable,
            pastDisplayNameTable: this.pastDisplayNameTable,
            friends: this.friends,
            directAccessWorld: this.directAccessWorld,
            parseUserUrl: this.parseUserUrl
        };
    };

    $app.computed.profileTabEvent = function () {
        return {
            logout: this.logout,
            lookupUser: this.lookupUser,
            showEditInviteMessageDialog: this.showEditInviteMessageDialog
        };
    };

    $app.computed.playerListTabBind = function () {
        return {
            menuActiveIndex: this.menuActiveIndex,
            currentInstanceWorld: this.currentInstanceWorld,
            currentInstanceLocation: this.currentInstanceLocation,
            currentInstanceWorldDescriptionExpanded:
                this.currentInstanceWorldDescriptionExpanded,
            photonLoggingEnabled: this.photonLoggingEnabled,
            photonEventTableTypeFilter: this.photonEventTableTypeFilter,
            photonEventTableTypeFilterList: this.photonEventTableTypeFilterList,
            photonEventTableFilter: this.photonEventTableFilter,
            hideTooltips: this.hideTooltips,
            ipcEnabled: this.ipcEnabled,
            photonEventIcon: this.photonEventIcon,
            photonEventTable: this.photonEventTable,
            photonEventTablePrevious: this.photonEventTablePrevious,
            currentInstanceUserList: this.currentInstanceUserList,
            chatboxUserBlacklist: this.chatboxUserBlacklist,
            randomUserColours: this.randomUserColours,
            lastLocation: this.lastLocation
        };
    };

    $app.computed.playerListTabEvent = function () {
        return {
            photonEventTableFilterChange: this.photonEventTableFilterChange,
            getCurrentInstanceUserList: this.getCurrentInstanceUserList,
            showUserFromPhotonId: this.showUserFromPhotonId,
            lookupUser: this.lookupUser
        };
    };

    $app.computed.loginPageBind = function () {
        return {
            hideTooltips: this.hideTooltips,
            loginForm: this.loginForm,
            enableCustomEndpoint: this.enableCustomEndpoint
        };
    };

    $app.computed.loginPageEvent = function () {
        return {
            showVRCXUpdateDialog: this.showVRCXUpdateDialog,
            promptProxySettings: this.promptProxySettings,
            toggleCustomEndpoint: this.toggleCustomEndpoint,
            deleteSavedLogin: this.deleteSavedLogin,
            login: this.login,
            relogin: this.relogin
        };
    };

    $app.computed.vrcxUpdateDialogBind = function () {
        return {
            VRCXUpdateDialog: this.VRCXUpdateDialog,
            appVersion: this.appVersion,
            checkingForVRCXUpdate: this.checkingForVRCXUpdate,
            updateInProgress: this.updateInProgress,
            updateProgress: this.updateProgress,
            updateProgressText: this.updateProgressText,
            pendingVRCXInstall: this.pendingVRCXInstall,
            branch: this.branch,
            branches: this.branches
        };
    };

    $app.computed.vrcxUpdateDialogEvent = function () {
        return {
            'update:branch': (value) => (this.branch = value),
            loadBranchVersions: this.loadBranchVersions,
            cancelUpdate: this.cancelUpdate,
            installVRCXUpdate: this.installVRCXUpdate,
            restartVRCX: this.restartVRCX
        };
    };

    $app.methods.languageClass = function (key) {
        return languageClass(key);
    };

    // #endregion
    // #region | Electron

    if (LINUX) {
        window.electron.onWindowPositionChanged((event, position) => {
            window.$app.locationX = position.x;
            window.$app.locationY = position.y;
            window.$app.saveVRCXWindowOption();
        });

        window.electron.onWindowSizeChanged((event, size) => {
            window.$app.sizeWidth = size.width;
            window.$app.sizeHeight = size.height;
            window.$app.saveVRCXWindowOption();
        });

        window.electron.onWindowStateChange((event, state) => {
            window.$app.windowState = state;
            window.$app.saveVRCXWindowOption();
        });

        // window.electron.onWindowClosed((event) => {
        //    window.$app.saveVRCXWindowOption();
        // });
    }

    // #endregion

    // "$app" is being replaced by Vue, update references inside all the classes
    $app = new Vue($app);
    window.$app = $app;
    window.API = API;
    window.$t = $t;
    for (let value of Object.values(vrcxClasses)) {
        value.updateRef($app);
    }
})();
// #endregion

// // #endregion
// // #region | Dialog: templateDialog

// $app.data.templateDialog = {
//     visible: false,
// };

// $app.methods.showTemplateDialog = function () {
//     this.$nextTick(() => $app.adjustDialogZ(this.$refs.templateDialog.$el));
//     var D = this.templateDialog;
//     D.visible = true;
// };

// // #endregion
