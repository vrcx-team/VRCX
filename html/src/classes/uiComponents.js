import Vue from 'vue';
import VueMarkdown from 'vue-markdown';
import { baseClass, $app, API, $t, $utils } from './baseClass.js';

export default class extends baseClass {
    constructor(_app, _API, _t) {
        super(_app, _API, _t);
    }

    init() {
        Vue.component('vue-markdown', VueMarkdown);

        Vue.component('launch', {
            template:
                '<el-button @click="confirm" size="mini" icon="el-icon-info" circle></el-button>',
            props: {
                location: String
            },
            methods: {
                parse() {
                    this.$el.style.display = $app.checkCanInviteSelf(
                        this.location
                    )
                        ? ''
                        : 'none';
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
                location: String,
                shortname: String
            },
            methods: {
                parse() {
                    this.$el.style.display = $app.checkCanInviteSelf(
                        this.location
                    )
                        ? ''
                        : 'none';
                },
                confirm() {
                    $app.selfInvite(this.location, this.shortname);
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
                "<span><span @click=\"showWorldDialog\" :class=\"{ 'x-link': link && this.location !== 'private' && this.location !== 'offline'}\">" +
                '<i v-if="isTraveling" class="el-icon el-icon-loading" style="display:inline-block;margin-right:5px"></i>' +
                '<span>{{ text }}</span></span>' +
                '<span v-if="groupName" @click="showGroupDialog" :class="{ \'x-link\': link}">({{ groupName }})</span>' +
                '<span class="flags" :class="region" style="display:inline-block;margin-left:5px"></span>' +
                '<i v-if="strict" class="el-icon el-icon-lock" style="display:inline-block;margin-left:5px"></i></span>',
            props: {
                location: String,
                traveling: String,
                hint: {
                    type: String,
                    default: ''
                },
                grouphint: {
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
                    region: this.region,
                    strict: this.strict,
                    isTraveling: this.isTraveling,
                    groupName: this.groupName
                };
            },
            methods: {
                parse() {
                    this.isTraveling = false;
                    this.groupName = '';
                    var instanceId = this.location;
                    if (
                        typeof this.traveling !== 'undefined' &&
                        this.location === 'traveling'
                    ) {
                        instanceId = this.traveling;
                        this.isTraveling = true;
                    }
                    this.text = instanceId;
                    var L = $utils.parseLocation(instanceId);
                    if (L.isOffline) {
                        this.text = 'Offline';
                    } else if (L.isPrivate) {
                        this.text = 'Private';
                    } else if (L.isTraveling) {
                        this.text = 'Traveling';
                    } else if (
                        typeof this.hint === 'string' &&
                        this.hint !== ''
                    ) {
                        if (L.instanceId) {
                            this.text = `${this.hint} #${L.instanceName} ${L.accessTypeName}`;
                        } else {
                            this.text = this.hint;
                        }
                    } else if (L.worldId) {
                        var ref = API.cachedWorlds.get(L.worldId);
                        if (typeof ref === 'undefined') {
                            $app.getWorldName(L.worldId).then((worldName) => {
                                if (L.tag === instanceId) {
                                    if (L.instanceId) {
                                        this.text = `${worldName} #${L.instanceName} ${L.accessTypeName}`;
                                    } else {
                                        this.text = worldName;
                                    }
                                }
                            });
                        } else if (L.instanceId) {
                            this.text = `${ref.name} #${L.instanceName} ${L.accessTypeName}`;
                        } else {
                            this.text = ref.name;
                        }
                    }
                    if (this.grouphint) {
                        this.groupName = this.grouphint;
                    } else if (L.groupId) {
                        this.groupName = L.groupId;
                        $app.getGroupName(instanceId).then((groupName) => {
                            if (L.tag === instanceId) {
                                this.groupName = groupName;
                            }
                        });
                    }
                    this.region = '';
                    if (!L.isOffline && !L.isPrivate && !L.isTraveling) {
                        this.region = L.region;
                        if (!L.region && L.instanceId) {
                            this.region = 'us';
                        }
                    }
                    this.strict = L.strict;
                },
                showWorldDialog() {
                    if (this.link) {
                        var instanceId = this.location;
                        if (this.traveling && this.location === 'traveling') {
                            instanceId = this.traveling;
                        }
                        if (!instanceId && this.hint.length === 8) {
                            // shortName
                            API.$emit('SHOW_WORLD_DIALOG_SHORTNAME', this.hint);
                            return;
                        }
                        API.$emit('SHOW_WORLD_DIALOG', instanceId);
                    }
                },
                showGroupDialog() {
                    var location = this.location;
                    if (this.isTraveling) {
                        location = this.traveling;
                    }
                    if (!location || !this.link) {
                        return;
                    }
                    var L = $utils.parseLocation(location);
                    if (!L.groupId) {
                        return;
                    }
                    API.$emit('SHOW_GROUP_DIALOG', L.groupId);
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

        Vue.component('location-world', {
            template:
                '<span><span @click="showLaunchDialog" class="x-link">' +
                '<i v-if="isUnlocked" class="el-icon el-icon-unlock" style="display:inline-block;margin-right:5px"></i>' +
                '<span>#{{ instanceName }} {{ accessTypeName }}</span></span>' +
                '<span v-if="groupName" @click="showGroupDialog" class="x-link">({{ groupName }})</span>' +
                '<span class="flags" :class="region" style="display:inline-block;margin-left:5px"></span>' +
                '<i v-if="strict" class="el-icon el-icon-lock" style="display:inline-block;margin-left:5px"></i></span>',
            props: {
                locationobject: Object,
                currentuserid: String,
                worlddialogshortname: String,
                grouphint: {
                    type: String,
                    default: ''
                }
            },
            data() {
                return {
                    location: this.location,
                    instanceName: this.instanceName,
                    accessTypeName: this.accessTypeName,
                    region: this.region,
                    shortName: this.shortName,
                    isUnlocked: this.isUnlocked,
                    strict: this.strict,
                    groupName: this.groupName
                };
            },
            methods: {
                parse() {
                    this.location = this.locationobject.tag;
                    this.instanceName = this.locationobject.instanceName;
                    this.accessTypeName = this.locationobject.accessTypeName;
                    this.strict = this.locationobject.strict;
                    this.shortName = this.locationobject.shortName;

                    this.isUnlocked = false;
                    if (
                        (this.worlddialogshortname &&
                            this.locationobject.shortName &&
                            this.worlddialogshortname ===
                                this.locationobject.shortName) ||
                        this.currentuserid === this.locationobject.userId
                    ) {
                        this.isUnlocked = true;
                    }

                    this.region = this.locationobject.region;
                    if (!this.region) {
                        this.region = 'us';
                    }

                    this.groupName = '';
                    if (this.grouphint) {
                        this.groupName = this.grouphint;
                    } else if (this.locationobject.groupId) {
                        this.groupName = this.locationobject.groupId;
                        $app.getGroupName(this.locationobject.groupId).then(
                            (groupName) => {
                                this.groupName = groupName;
                            }
                        );
                    }
                },
                showLaunchDialog() {
                    API.$emit(
                        'SHOW_LAUNCH_DIALOG',
                        this.location,
                        this.shortName
                    );
                },
                showGroupDialog() {
                    if (!this.location) {
                        return;
                    }
                    var L = $utils.parseLocation(this.location);
                    if (!L.groupId) {
                        return;
                    }
                    API.$emit('SHOW_GROUP_DIALOG', L.groupId);
                }
            },
            watch: {
                locationobject() {
                    this.parse();
                }
            },
            created() {
                this.parse();
            }
        });

        Vue.component('last-join', {
            template:
                '<span>' +
                '<el-tooltip placement="top" style="margin-left:5px" v-if="lastJoin">' +
                '<div slot="content">' +
                '<span>{{ $t("dialog.user.info.last_join") }} <timer :epoch="lastJoin"></timer></span>' +
                '</div>' +
                '<i v-if="lastJoin" class="el-icon el-icon-location-outline" style="display:inline-block"></i>' +
                '</el-tooltip>' +
                '</span>',
            props: {
                location: String,
                currentlocation: String
            },
            data() {
                return {
                    lastJoin: this.lastJoin
                };
            },
            methods: {
                parse() {
                    this.lastJoin = $app.instanceJoinHistory.get(this.location);
                }
            },
            watch: {
                location() {
                    this.parse();
                },
                currentlocation() {
                    this.parse();
                }
            },
            created() {
                this.parse();
            }
        });

        Vue.component('instance-info', {
            template:
                '<div style="display:inline-block;margin-left:5px">' +
                '<el-tooltip v-if="isValidInstance" placement="bottom">' +
                '<div slot="content">' +
                '<template v-if="isClosed"><span>Closed At: {{ closedAt | formatDate(\'long\') }}</span></br></template>' +
                '<template v-if="canCloseInstance"><el-button :disabled="isClosed" size="mini" type="primary" @click="$app.closeInstance(location)">{{ $t("dialog.user.info.close_instance") }}</el-button></br></br></template>' +
                '<span><span style="color:#409eff">PC: </span>{{ platforms.standalonewindows }}</span></br>' +
                '<span><span style="color:#67c23a">Android: </span>{{ platforms.android }}</span></br>' +
                '<span>{{ $t("dialog.user.info.instance_game_version") }} {{ gameServerVersion }}</span></br>' +
                '<span v-if="queueEnabled">{{ $t("dialog.user.info.instance_queuing_enabled") }}</br></span>' +
                '<span v-if="userList.length">{{ $t("dialog.user.info.instance_users") }}</br></span>' +
                '<template v-for="user in userList"><span style="cursor:pointer;margin-right:5px" @click="showUserDialog(user.id)" v-text="user.displayName"></span></template>' +
                '</div>' +
                '<i class="el-icon-caret-bottom"></i>' +
                '</el-tooltip>' +
                '<span v-if="occupants" style="margin-left:5px">{{ occupants }}/{{ capacity }}</span>' +
                '<span v-if="friendcount" style="margin-left:5px">({{ friendcount }})</span>' +
                '<span v-if="isFull" style="margin-left:5px;color:lightcoral">{{ $t("dialog.user.info.instance_full") }}</span>' +
                '<span v-if="isHardClosed" style="margin-left:5px;color:lightcoral">{{ $t("dialog.user.info.instance_hard_closed") }}</span>' +
                '<span v-else-if="isClosed" style="margin-left:5px;color:lightcoral">{{ $t("dialog.user.info.instance_closed") }}</span>' +
                '<span v-if="queueSize" style="margin-left:5px">{{ $t("dialog.user.info.instance_queue") }} {{ queueSize }}</span>' +
                '</div>',
            props: {
                location: String,
                instance: Object,
                friendcount: Number,
                updateelement: Number
            },
            data() {
                return {
                    isValidInstance: this.isValidInstance,
                    isFull: this.isFull,
                    isClosed: this.isClosed,
                    isHardClosed: this.isHardClosed,
                    closedAt: this.closedAt,
                    occupants: this.occupants,
                    capacity: this.capacity,
                    queueSize: this.queueSize,
                    queueEnabled: this.queueEnabled,
                    platforms: this.platforms,
                    userList: this.userList,
                    gameServerVersion: this.gameServerVersion,
                    canCloseInstance: this.canCloseInstance
                };
            },
            methods: {
                parse() {
                    this.isValidInstance = false;
                    this.isFull = false;
                    this.isClosed = false;
                    this.isHardClosed = false;
                    this.closedAt = '';
                    this.occupants = 0;
                    this.capacity = 0;
                    this.queueSize = 0;
                    this.queueEnabled = false;
                    this.platforms = [];
                    this.userList = [];
                    this.gameServerVersion = '';
                    this.canCloseInstance = false;
                    if (
                        !this.location ||
                        !this.instance ||
                        Object.keys(this.instance).length === 0
                    ) {
                        return;
                    }
                    this.isValidInstance = true;
                    this.isFull =
                        typeof this.instance.hasCapacityForYou !==
                            'undefined' && !this.instance.hasCapacityForYou;
                    if (this.instance.closedAt) {
                        this.isClosed = true;
                        this.closedAt = this.instance.closedAt;
                    }
                    this.isHardClosed = this.instance.hardClose === true;
                    this.occupants = this.instance.userCount;
                    if (this.location === $app.lastLocation.location) {
                        // use gameLog for occupants when in same location
                        this.occupants = $app.lastLocation.playerList.size;
                    }
                    this.capacity = this.instance.capacity;
                    this.gameServerVersion = this.instance.gameServerVersion;
                    this.queueSize = this.instance.queueSize;
                    if (this.instance.platforms) {
                        this.platforms = this.instance.platforms;
                    }
                    if (this.instance.users) {
                        this.userList = this.instance.users;
                    }
                    if (this.instance.ownerId === API.currentUser.id) {
                        this.canCloseInstance = true;
                    } else if (this.instance?.ownerId?.startsWith('grp_')) {
                        // check group perms
                        var groupId = this.instance.ownerId;
                        var group = API.cachedGroups.get(groupId);
                        this.canCloseInstance = $app.hasGroupPermission(
                            group,
                            'group-instance-moderate'
                        );
                    }
                },
                showUserDialog(userId) {
                    API.$emit('SHOW_USER_DIALOG', userId);
                }
            },
            watch: {
                updateelement() {
                    this.parse();
                },
                location() {
                    this.parse();
                },
                friendcount() {
                    this.parse();
                }
            },
            created() {
                this.parse();
            }
        });

        Vue.component('avatar-info', {
            template:
                '<div @click="confirm" class="avatar-info">' +
                '<span style="margin-right:5px">{{ avatarName }}</span>' +
                '<span style="margin-right:5px" :class="color">{{ avatarType }}</span>' +
                '<span style="color:#909399;font-family:monospace;font-size:12px;">{{ avatarTags }}</span>' +
                '</div>',
            props: {
                imageurl: String,
                userid: String,
                hintownerid: String,
                hintavatarname: String,
                avatartags: Array
            },
            data() {
                return {
                    avatarName: this.avatarName,
                    avatarType: this.avatarType,
                    avatarTags: this.avatarTags,
                    color: this.color
                };
            },
            methods: {
                async parse() {
                    this.ownerId = '';
                    this.avatarName = '';
                    this.avatarType = '';
                    this.color = '';
                    this.avatarTags = '';
                    if (!this.imageurl) {
                        this.avatarName = '-';
                    } else if (this.hintownerid) {
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
                    if (typeof this.avatartags === 'object') {
                        var tagString = '';
                        for (var i = 0; i < this.avatartags.length; i++) {
                            var tagName = this.avatartags[i].replace(
                                'content_',
                                ''
                            );
                            tagString += tagName;
                            if (i < this.avatartags.length - 1) {
                                tagString += ', ';
                            }
                        }
                        this.avatarTags = tagString;
                    }
                },
                confirm() {
                    if (!this.imageurl) {
                        return;
                    }
                    $app.showAvatarAuthorDialog(
                        this.userid,
                        this.ownerId,
                        this.imageurl
                    );
                }
            },
            watch: {
                imageurl() {
                    this.parse();
                },
                userid() {
                    this.parse();
                },
                avatartags() {
                    this.parse();
                }
            },
            mounted() {
                this.parse();
            }
        });

        Vue.component('display-name', {
            template:
                '<span @click="showUserDialog" class="x-link">{{ username }}</span>',
            props: {
                userid: String,
                location: String,
                key: Number,
                hint: {
                    type: String,
                    default: ''
                }
            },
            data() {
                return {
                    username: this.username
                };
            },
            methods: {
                async parse() {
                    this.username = this.userid;
                    if (this.hint) {
                        this.username = this.hint;
                    } else if (this.userid) {
                        var args = await API.getCachedUser({
                            userId: this.userid
                        });
                    }
                    if (
                        typeof args !== 'undefined' &&
                        typeof args.json !== 'undefined' &&
                        typeof args.json.displayName !== 'undefined'
                    ) {
                        this.username = args.json.displayName;
                    }
                },
                showUserDialog() {
                    $app.showUserDialog(this.userid);
                }
            },
            watch: {
                location() {
                    this.parse();
                },
                key() {
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
    }
}
