import { baseClass, $app, API, $t, $utils } from './baseClass.js';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    init() {
        API.currentUser = {
            $userColour: ''
        };

        API.getCurrentUser = function () {
            return this.call('auth/user', {
                method: 'GET'
            }).then((json) => {
                var args = {
                    json,
                    fromGetCurrentUser: true
                };
                if (
                    json.requiresTwoFactorAuth &&
                    json.requiresTwoFactorAuth.includes('emailOtp')
                ) {
                    this.$emit('USER:EMAILOTP', args);
                } else if (json.requiresTwoFactorAuth) {
                    this.$emit('USER:2FA', args);
                } else {
                    if ($app.debugCurrentUserDiff) {
                        var ref = args.json;
                        var $ref = this.currentUser;
                        var props = {};
                        for (var prop in $ref) {
                            if ($ref[prop] !== Object($ref[prop])) {
                                props[prop] = true;
                            }
                        }
                        for (var prop in ref) {
                            if (
                                Array.isArray(ref[prop]) &&
                                Array.isArray($ref[prop])
                            ) {
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
                                if (
                                    prop.startsWith('$') ||
                                    prop === 'offlineFriends' ||
                                    prop === 'onlineFriends' ||
                                    prop === 'activeFriends'
                                ) {
                                    delete props[prop];
                                    continue;
                                }
                                props[prop] = [tobe, asis];
                                has = true;
                            }
                        }
                        if (has) {
                            console.log('API.getCurrentUser diff', props);
                        }
                    }
                    $app.nextCurrentUserRefresh = 420; // 7mins
                    this.$emit('USER:CURRENT', args);
                }
                return args;
            });
        };

        API.$on('USER:CURRENT', function (args) {
            var { json } = args;
            args.ref = this.applyCurrentUser(json);

            // when isGameRunning use gameLog instead of API
            var $location = $app.parseLocation($app.lastLocation.location);
            var $travelingLocation = $app.parseLocation(
                $app.lastLocationDestination
            );
            var location = $app.lastLocation.location;
            var instanceId = $location.instanceId;
            var worldId = $location.worldId;
            var travelingToLocation = $app.lastLocationDestination;
            var travelingToWorld = $travelingLocation.worldId;
            var travelingToInstance = $travelingLocation.instanceId;
            if (!$app.isGameRunning && json.presence) {
                if ($app.isRealInstance(json.presence.world)) {
                    location = `${json.presence.world}:${json.presence.instance}`;
                    travelingToLocation = `${json.presence.travelingToWorld}:${json.presence.travelingToInstance}`;
                } else {
                    location = json.presence.world;
                    travelingToLocation = json.presence.travelingToWorld;
                }
                instanceId = json.presence.instance;
                worldId = json.presence.world;
                travelingToInstance = json.presence.travelingToInstance;
                travelingToWorld = json.presence.travelingToWorld;
            }
            this.applyUser({
                allowAvatarCopying: json.allowAvatarCopying,
                badges: json.badges,
                bio: json.bio,
                bioLinks: json.bioLinks,
                currentAvatarImageUrl: json.currentAvatarImageUrl,
                currentAvatarTags: json.currentAvatarTags,
                currentAvatarThumbnailImageUrl:
                    json.currentAvatarThumbnailImageUrl,
                date_joined: json.date_joined,
                developerType: json.developerType,
                displayName: json.displayName,
                friendKey: json.friendKey,
                // json.friendRequestStatus - missing from currentUser
                id: json.id,
                // instanceId - missing from currentUser
                isFriend: json.isFriend,
                last_activity: json.last_activity,
                last_login: json.last_login,
                last_mobile: json.last_mobile,
                last_platform: json.last_platform,
                // location - missing from currentUser
                // platform - missing from currentUser
                // note - missing from currentUser
                profilePicOverride: json.profilePicOverride,
                // profilePicOverrideThumbnail - missing from currentUser
                pronouns: json.pronouns,
                state: json.state,
                status: json.status,
                statusDescription: json.statusDescription,
                tags: json.tags,
                // travelingToInstance - missing from currentUser
                // travelingToLocation - missing from currentUser
                // travelingToWorld - missing from currentUser
                userIcon: json.userIcon,
                // worldId - missing from currentUser
                fallbackAvatar: json.fallbackAvatar,

                // Location from gameLog/presence
                location,
                instanceId,
                worldId,
                travelingToLocation,
                travelingToInstance,
                travelingToWorld,

                // set VRCX online/offline timers
                $online_for: this.currentUser.$online_for,
                $offline_for: this.currentUser.$offline_for,
                $location_at: this.currentUser.$location_at,
                $travelingToTime: this.currentUser.$travelingToTime
            });
        });

        API.applyCurrentUser = function (json) {
            var ref = this.currentUser;
            if (this.isLoggedIn) {
                if (json.currentAvatar !== ref.currentAvatar) {
                    $app.addAvatarToHistory(json.currentAvatar);
                    if ($app.isGameRunning) {
                        $app.addAvatarWearTime(ref.currentAvatar);
                        ref.$previousAvatarSwapTime = Date.now();
                    }
                }
                Object.assign(ref, json);
                if (ref.homeLocation !== ref.$homeLocation.tag) {
                    ref.$homeLocation = $app.parseLocation(ref.homeLocation);
                    // apply home location name to user dialog
                    if (
                        $app.userDialog.visible &&
                        $app.userDialog.id === ref.id
                    ) {
                        $app.getWorldName(API.currentUser.homeLocation).then(
                            (worldName) => {
                                $app.userDialog.$homeLocationName = worldName;
                            }
                        );
                    }
                }
                ref.$isVRCPlus = ref.tags.includes('system_supporter');
                this.applyUserTrustLevel(ref);
                this.applyUserLanguage(ref);
                this.applyPresenceLocation(ref);
                this.applyQueuedInstance(ref.queuedInstance);
                this.applyPresenceGroups(ref);
            } else {
                ref = {
                    acceptedPrivacyVersion: 0,
                    acceptedTOSVersion: 0,
                    accountDeletionDate: null,
                    accountDeletionLog: null,
                    activeFriends: [],
                    ageVerificationStatus: '',
                    ageVerified: false,
                    allowAvatarCopying: false,
                    badges: [],
                    bio: '',
                    bioLinks: [],
                    currentAvatar: '',
                    currentAvatarAssetUrl: '',
                    currentAvatarImageUrl: '',
                    currentAvatarTags: [],
                    currentAvatarThumbnailImageUrl: '',
                    date_joined: '',
                    developerType: '',
                    displayName: '',
                    emailVerified: false,
                    fallbackAvatar: '',
                    friendGroupNames: [],
                    friendKey: '',
                    friends: [],
                    googleId: '',
                    hasBirthday: false,
                    hasEmail: false,
                    hasLoggedInFromClient: false,
                    hasPendingEmail: false,
                    hideContentFilterSettings: false,
                    homeLocation: '',
                    id: '',
                    isBoopingEnabled: false,
                    isFriend: false,
                    last_activity: '',
                    last_login: '',
                    last_mobile: null,
                    last_platform: '',
                    obfuscatedEmail: '',
                    obfuscatedPendingEmail: '',
                    oculusId: '',
                    offlineFriends: [],
                    onlineFriends: [],
                    pastDisplayNames: [],
                    picoId: '',
                    presence: {
                        avatarThumbnail: '',
                        currentAvatarTags: '',
                        displayName: '',
                        groups: [],
                        id: '',
                        instance: '',
                        instanceType: '',
                        platform: '',
                        profilePicOverride: '',
                        status: '',
                        travelingToInstance: '',
                        travelingToWorld: '',
                        userIcon: '',
                        world: '',
                        ...json.presence
                    },
                    profilePicOverride: '',
                    pronouns: '',
                    queuedInstance: '',
                    state: '',
                    status: '',
                    statusDescription: '',
                    statusFirstTime: false,
                    statusHistory: [],
                    steamDetails: {},
                    steamId: '',
                    tags: [],
                    twoFactorAuthEnabled: false,
                    twoFactorAuthEnabledDate: null,
                    unsubscribe: false,
                    updated_at: '',
                    userIcon: '',
                    userLanguage: '',
                    userLanguageCode: '',
                    username: '',
                    viveId: '',
                    // VRCX
                    $online_for: Date.now(),
                    $offline_for: '',
                    $location_at: Date.now(),
                    $travelingToTime: Date.now(),
                    $previousAvatarSwapTime: '',
                    $homeLocation: {},
                    $isVRCPlus: false,
                    $isModerator: false,
                    $isTroll: false,
                    $isProbableTroll: false,
                    $trustLevel: 'Visitor',
                    $trustClass: 'x-tag-untrusted',
                    $userColour: '',
                    $trustSortNum: 1,
                    $languages: [],
                    $locationTag: '',
                    $travelingToLocation: '',
                    $vrchatcredits: null,
                    ...json
                };
                if ($app.isGameRunning) {
                    ref.$previousAvatarSwapTime = Date.now();
                }
                ref.$homeLocation = $app.parseLocation(ref.homeLocation);
                ref.$isVRCPlus = ref.tags.includes('system_supporter');
                this.applyUserTrustLevel(ref);
                this.applyUserLanguage(ref);
                this.applyPresenceLocation(ref);
                this.applyPresenceGroups(ref);
                this.currentUser = ref;
                this.isLoggedIn = true;
                this.$emit('LOGIN', {
                    json,
                    ref
                });
            }
            return ref;
        };

        /**
         * @typedef {{
         *     status: 'active' | 'offline' | 'busy' | 'ask me' | 'join me',
         *     statusDescription: string
         * }} SaveCurrentUserParameters
         */

        /**
         * Updates current user's status.
         * @param params {SaveCurrentUserParameters} new status to be set
         * @returns {Promise<{json: any, params}>}
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
    }

    _data = {};

    _methods = {};
}
