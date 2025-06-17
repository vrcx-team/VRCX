<template>
    <safe-dialog
        ref="newInstanceDialog"
        :visible.sync="newInstanceDialog.visible"
        :title="$t('dialog.new_instance.header')"
        width="650px"
        append-to-body>
        <el-tabs v-model="newInstanceDialog.selectedTab" type="card" @tab-click="newInstanceTabClick">
            <el-tab-pane :label="$t('dialog.new_instance.normal')">
                <el-form :model="newInstanceDialog" label-width="150px">
                    <el-form-item :label="$t('dialog.new_instance.access_type')">
                        <el-radio-group v-model="newInstanceDialog.accessType" size="mini" @change="buildInstance">
                            <el-radio-button label="public">{{
                                $t('dialog.new_instance.access_type_public')
                            }}</el-radio-button>
                            <el-radio-button label="group">{{
                                $t('dialog.new_instance.access_type_group')
                            }}</el-radio-button>
                            <el-radio-button label="friends+">{{
                                $t('dialog.new_instance.access_type_friend_plus')
                            }}</el-radio-button>
                            <el-radio-button label="friends">{{
                                $t('dialog.new_instance.access_type_friend')
                            }}</el-radio-button>
                            <el-radio-button label="invite+">{{
                                $t('dialog.new_instance.access_type_invite_plus')
                            }}</el-radio-button>
                            <el-radio-button label="invite">{{
                                $t('dialog.new_instance.access_type_invite')
                            }}</el-radio-button>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item
                        v-if="newInstanceDialog.accessType === 'group'"
                        :label="$t('dialog.new_instance.group_access_type')">
                        <el-radio-group v-model="newInstanceDialog.groupAccessType" size="mini" @change="buildInstance">
                            <el-radio-button
                                label="members"
                                :disabled="
                                    !hasGroupPermission(newInstanceDialog.groupRef, 'group-instance-open-create')
                                "
                                >{{ $t('dialog.new_instance.group_access_type_members') }}</el-radio-button
                            >
                            <el-radio-button
                                label="plus"
                                :disabled="
                                    !hasGroupPermission(newInstanceDialog.groupRef, 'group-instance-plus-create')
                                "
                                >{{ $t('dialog.new_instance.group_access_type_plus') }}</el-radio-button
                            >
                            <el-radio-button
                                label="public"
                                :disabled="
                                    !hasGroupPermission(newInstanceDialog.groupRef, 'group-instance-public-create') ||
                                    newInstanceDialog.groupRef.privacy === 'private'
                                "
                                >{{ $t('dialog.new_instance.group_access_type_public') }}</el-radio-button
                            >
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item :label="$t('dialog.new_instance.region')">
                        <el-radio-group v-model="newInstanceDialog.region" size="mini" @change="buildInstance">
                            <el-radio-button label="US West">{{
                                $t('dialog.new_instance.region_usw')
                            }}</el-radio-button>
                            <el-radio-button label="US East">{{
                                $t('dialog.new_instance.region_use')
                            }}</el-radio-button>
                            <el-radio-button label="Europe">{{ $t('dialog.new_instance.region_eu') }}</el-radio-button>
                            <el-radio-button label="Japan">{{ $t('dialog.new_instance.region_jp') }}</el-radio-button>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item :label="$t('dialog.new_instance.content_settings')">
                        <el-select
                            v-model="newInstanceDialog.selectedContentSettings"
                            multiple
                            :placeholder="$t('dialog.new_instance.content_placeholder')"
                            style="width: 100%"
                            @change="buildInstance">
                            <el-option-group :label="$t('dialog.new_instance.content_placeholder')">
                                <el-option
                                    class="x-friend-item"
                                    value="emoji"
                                    :label="$t('dialog.new_instance.content_emoji')"></el-option>
                                <el-option
                                    class="x-friend-item"
                                    value="stickers"
                                    :label="$t('dialog.new_instance.content_stickers')"></el-option>
                                <el-option
                                    class="x-friend-item"
                                    value="pedestals"
                                    :label="$t('dialog.new_instance.content_pedestals')"></el-option>
                                <el-option
                                    class="x-friend-item"
                                    value="prints"
                                    :label="$t('dialog.new_instance.content_prints')"></el-option>
                                <el-option
                                    class="x-friend-item"
                                    value="drones"
                                    :label="$t('dialog.new_instance.content_drones')"></el-option>
                                <el-option
                                    class="x-friend-item"
                                    value="props"
                                    :label="$t('dialog.new_instance.content_items')"></el-option>
                            </el-option-group>
                        </el-select>
                    </el-form-item>
                    <el-form-item
                        v-if="newInstanceDialog.accessType === 'group'"
                        :label="$t('dialog.new_instance.queueEnabled')">
                        <el-checkbox v-model="newInstanceDialog.queueEnabled" @change="buildInstance"></el-checkbox>
                    </el-form-item>
                    <el-form-item
                        v-if="newInstanceDialog.accessType === 'group'"
                        :label="$t('dialog.new_instance.ageGate')">
                        <el-checkbox
                            v-model="newInstanceDialog.ageGate"
                            :disabled="
                                !hasGroupPermission(newInstanceDialog.groupRef, 'group-instance-age-gated-create')
                            "
                            @change="buildInstance"></el-checkbox>
                    </el-form-item>
                    <el-form-item :label="$t('dialog.new_instance.world_id')">
                        <el-input
                            v-model="newInstanceDialog.worldId"
                            size="mini"
                            @click.native="$event.target.tagName === 'INPUT' && $event.target.select()"
                            @change="buildInstance"></el-input>
                    </el-form-item>
                    <el-form-item
                        v-if="newInstanceDialog.accessType === 'group'"
                        :label="$t('dialog.new_instance.group_id')">
                        <el-select
                            v-model="newInstanceDialog.groupId"
                            clearable
                            :placeholder="$t('dialog.new_instance.group_placeholder')"
                            filterable
                            style="width: 100%"
                            @change="buildInstance">
                            <el-option-group :label="$t('dialog.new_instance.group_placeholder')">
                                <el-option
                                    v-for="group in API.currentUserGroups.values()"
                                    v-if="
                                        group &&
                                        (hasGroupPermission(group, 'group-instance-public-create') ||
                                            hasGroupPermission(group, 'group-instance-plus-create') ||
                                            hasGroupPermission(group, 'group-instance-open-create'))
                                    "
                                    :key="group.id"
                                    :label="group.name"
                                    :value="group.id"
                                    class="x-friend-item"
                                    style="height: auto; width: 478px">
                                    <div class="avatar">
                                        <img v-lazy="group.iconUrl" />
                                    </div>
                                    <div class="detail">
                                        <span class="name" v-text="group.name"></span>
                                    </div>
                                </el-option>
                            </el-option-group>
                        </el-select>
                    </el-form-item>
                    <el-form-item
                        v-if="
                            newInstanceDialog.accessType === 'group' && newInstanceDialog.groupAccessType === 'members'
                        "
                        :label="$t('dialog.new_instance.roles')">
                        <el-select
                            v-model="newInstanceDialog.roleIds"
                            multiple
                            clearable
                            :placeholder="$t('dialog.new_instance.role_placeholder')"
                            style="width: 100%"
                            @change="buildInstance">
                            <el-option-group :label="$t('dialog.new_instance.role_placeholder')">
                                <el-option
                                    v-for="role in newInstanceDialog.selectedGroupRoles"
                                    :key="role.id"
                                    class="x-friend-item"
                                    :label="role.name"
                                    :value="role.id"
                                    style="height: auto; width: 478px">
                                    <div class="detail">
                                        <span class="name" v-text="role.name"></span>
                                    </div>
                                </el-option>
                            </el-option-group>
                        </el-select>
                    </el-form-item>
                    <template v-if="newInstanceDialog.instanceCreated">
                        <el-form-item :label="$t('dialog.new_instance.location')">
                            <el-input
                                v-model="newInstanceDialog.location"
                                size="mini"
                                readonly
                                @click.native="$event.target.tagName === 'INPUT' && $event.target.select()"></el-input>
                        </el-form-item>
                        <el-form-item :label="$t('dialog.new_instance.url')">
                            <el-input v-model="newInstanceDialog.url" size="mini" readonly></el-input>
                        </el-form-item>
                    </template>
                </el-form>
            </el-tab-pane>
            <el-tab-pane :label="$t('dialog.new_instance.legacy')">
                <el-form :model="newInstanceDialog" label-width="150px">
                    <el-form-item :label="$t('dialog.new_instance.access_type')">
                        <el-radio-group
                            v-model="newInstanceDialog.accessType"
                            size="mini"
                            @change="buildLegacyInstance">
                            <el-radio-button label="public">{{
                                $t('dialog.new_instance.access_type_public')
                            }}</el-radio-button>
                            <el-radio-button label="group">{{
                                $t('dialog.new_instance.access_type_group')
                            }}</el-radio-button>
                            <el-radio-button label="friends+">{{
                                $t('dialog.new_instance.access_type_friend_plus')
                            }}</el-radio-button>
                            <el-radio-button label="friends">{{
                                $t('dialog.new_instance.access_type_friend')
                            }}</el-radio-button>
                            <el-radio-button label="invite+">{{
                                $t('dialog.new_instance.access_type_invite_plus')
                            }}</el-radio-button>
                            <el-radio-button label="invite">{{
                                $t('dialog.new_instance.access_type_invite')
                            }}</el-radio-button>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item
                        v-if="newInstanceDialog.accessType === 'group'"
                        :label="$t('dialog.new_instance.group_access_type')">
                        <el-radio-group
                            v-model="newInstanceDialog.groupAccessType"
                            size="mini"
                            @change="buildLegacyInstance">
                            <el-radio-button label="members">{{
                                $t('dialog.new_instance.group_access_type_members')
                            }}</el-radio-button>
                            <el-radio-button label="plus">{{
                                $t('dialog.new_instance.group_access_type_plus')
                            }}</el-radio-button>
                            <el-radio-button label="public">{{
                                $t('dialog.new_instance.group_access_type_public')
                            }}</el-radio-button>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item :label="$t('dialog.new_instance.region')">
                        <el-radio-group v-model="newInstanceDialog.region" size="mini" @change="buildLegacyInstance">
                            <el-radio-button label="US West">{{
                                $t('dialog.new_instance.region_usw')
                            }}</el-radio-button>
                            <el-radio-button label="US East">{{
                                $t('dialog.new_instance.region_use')
                            }}</el-radio-button>
                            <el-radio-button label="Europe">{{ $t('dialog.new_instance.region_eu') }}</el-radio-button>
                            <el-radio-button label="Japan">{{ $t('dialog.new_instance.region_jp') }}</el-radio-button>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item
                        v-if="newInstanceDialog.accessType === 'group'"
                        :label="$t('dialog.new_instance.ageGate')">
                        <el-checkbox v-model="newInstanceDialog.ageGate" @change="buildInstance"></el-checkbox>
                    </el-form-item>
                    <el-form-item :label="$t('dialog.new_instance.world_id')">
                        <el-input
                            v-model="newInstanceDialog.worldId"
                            size="mini"
                            @click.native="$event.target.tagName === 'INPUT' && $event.target.select()"
                            @change="buildLegacyInstance"></el-input>
                    </el-form-item>
                    <el-form-item :label="$t('dialog.new_instance.instance_id')">
                        <el-input
                            v-model="newInstanceDialog.instanceName"
                            :placeholder="$t('dialog.new_instance.instance_id_placeholder')"
                            size="mini"
                            @change="buildLegacyInstance"></el-input>
                    </el-form-item>
                    <el-form-item
                        v-if="newInstanceDialog.accessType !== 'public' && newInstanceDialog.accessType !== 'group'"
                        :label="$t('dialog.new_instance.instance_creator')">
                        <el-select
                            v-model="newInstanceDialog.userId"
                            clearable
                            :placeholder="$t('dialog.new_instance.instance_creator_placeholder')"
                            filterable
                            style="width: 100%"
                            @change="buildLegacyInstance">
                            <el-option-group v-if="API.currentUser" :label="$t('side_panel.me')">
                                <el-option
                                    class="x-friend-item"
                                    :label="API.currentUser.displayName"
                                    :value="API.currentUser.id"
                                    style="height: auto">
                                    <div class="avatar" :class="userStatusClass(API.currentUser)">
                                        <img v-lazy="userImage(API.currentUser)" />
                                    </div>
                                    <div class="detail">
                                        <span class="name" v-text="API.currentUser.displayName"></span>
                                    </div>
                                </el-option>
                            </el-option-group>
                            <el-option-group v-if="vipFriends.length" :label="$t('side_panel.favorite')">
                                <el-option
                                    v-for="friend in vipFriends"
                                    :key="friend.id"
                                    class="x-friend-item"
                                    :label="friend.name"
                                    :value="friend.id"
                                    style="height: auto">
                                    <template v-if="friend.ref">
                                        <div class="avatar" :class="userStatusClass(friend.ref)">
                                            <img v-lazy="userImage(friend.ref)" />
                                        </div>
                                        <div class="detail">
                                            <span
                                                class="name"
                                                :style="{ color: friend.ref.$userColour }"
                                                v-text="friend.ref.displayName"></span>
                                        </div>
                                    </template>
                                    <span v-else v-text="friend.id"></span>
                                </el-option>
                            </el-option-group>
                            <el-option-group v-if="onlineFriends.length" :label="$t('side_panel.online')">
                                <el-option
                                    v-for="friend in onlineFriends"
                                    :key="friend.id"
                                    class="x-friend-item"
                                    :label="friend.name"
                                    :value="friend.id"
                                    style="height: auto">
                                    <template v-if="friend.ref">
                                        <div class="avatar" :class="userStatusClass(friend.ref)">
                                            <img v-lazy="userImage(friend.ref)" />
                                        </div>
                                        <div class="detail">
                                            <span
                                                class="name"
                                                :style="{ color: friend.ref.$userColour }"
                                                v-text="friend.ref.displayName"></span>
                                        </div>
                                    </template>
                                    <span v-else v-text="friend.id"></span>
                                </el-option>
                            </el-option-group>
                            <el-option-group v-if="activeFriends.length" :label="$t('side_panel.active')">
                                <el-option
                                    v-for="friend in activeFriends"
                                    :key="friend.id"
                                    class="x-friend-item"
                                    :label="friend.name"
                                    :value="friend.id"
                                    style="height: auto">
                                    <template v-if="friend.ref">
                                        <div class="avatar">
                                            <img v-lazy="userImage(friend.ref)" />
                                        </div>
                                        <div class="detail">
                                            <span
                                                class="name"
                                                :style="{ color: friend.ref.$userColour }"
                                                v-text="friend.ref.displayName"></span>
                                        </div>
                                    </template>
                                    <span v-else v-text="friend.id"></span>
                                </el-option>
                            </el-option-group>
                            <el-option-group v-if="offlineFriends.length" :label="$t('side_panel.offline')">
                                <el-option
                                    v-for="friend in offlineFriends"
                                    :key="friend.id"
                                    class="x-friend-item"
                                    :label="friend.name"
                                    :value="friend.id"
                                    style="height: auto">
                                    <template v-if="friend.ref">
                                        <div class="avatar">
                                            <img v-lazy="userImage(friend.ref)" />
                                        </div>
                                        <div class="detail">
                                            <span
                                                class="name"
                                                :style="{ color: friend.ref.$userColour }"
                                                v-text="friend.ref.displayName"></span>
                                        </div>
                                    </template>
                                    <span v-else v-text="friend.id"></span>
                                </el-option>
                            </el-option-group>
                        </el-select>
                    </el-form-item>
                    <el-form-item
                        v-if="newInstanceDialog.accessType === 'group'"
                        :label="$t('dialog.new_instance.group_id')">
                        <el-select
                            v-model="newInstanceDialog.groupId"
                            clearable
                            :placeholder="$t('dialog.new_instance.group_placeholder')"
                            filterable
                            style="width: 100%"
                            @change="buildLegacyInstance">
                            <el-option-group :label="$t('dialog.new_instance.group_placeholder')">
                                <el-option
                                    v-for="group in API.currentUserGroups.values()"
                                    v-if="group"
                                    :key="group.id"
                                    class="x-friend-item"
                                    :label="group.name"
                                    :value="group.id"
                                    style="height: auto; width: 478px">
                                    <div class="avatar">
                                        <img v-lazy="group.iconUrl" />
                                    </div>
                                    <div class="detail">
                                        <span class="name" v-text="group.name"></span>
                                    </div>
                                </el-option>
                            </el-option-group>
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="$t('dialog.new_instance.location')">
                        <el-input
                            v-model="newInstanceDialog.location"
                            size="mini"
                            readonly
                            @click.native="$event.target.tagName === 'INPUT' && $event.target.select()"></el-input>
                    </el-form-item>
                    <el-form-item :label="$t('dialog.new_instance.url')">
                        <el-input v-model="newInstanceDialog.url" size="mini" readonly></el-input>
                    </el-form-item>
                </el-form>
            </el-tab-pane>
        </el-tabs>
        <template v-if="newInstanceDialog.selectedTab === '0'" #footer>
            <template v-if="newInstanceDialog.instanceCreated">
                <el-button size="small" @click="copyInstanceUrl(newInstanceDialog.location)">{{
                    $t('dialog.new_instance.copy_url')
                }}</el-button>
                <el-button size="small" @click="selfInvite(newInstanceDialog.location)">{{
                    $t('dialog.new_instance.self_invite')
                }}</el-button>
                <el-button
                    size="small"
                    :disabled="
                        (newInstanceDialog.accessType === 'friends' || newInstanceDialog.accessType === 'invite') &&
                        newInstanceDialog.userId !== API.currentUser.id
                    "
                    @click="showInviteDialog(newInstanceDialog.location)"
                    >{{ $t('dialog.new_instance.invite') }}</el-button
                >
                <el-button
                    type="primary"
                    size="small"
                    @click="showLaunchDialog(newInstanceDialog.location, newInstanceDialog.shortName)"
                    >{{ $t('dialog.new_instance.launch') }}</el-button
                >
            </template>
            <template v-else>
                <el-button type="primary" size="small" @click="handleCreateNewInstance">{{
                    $t('dialog.new_instance.create_instance')
                }}</el-button>
            </template>
        </template>
        <template v-else-if="newInstanceDialog.selectedTab === '1'" #footer>
            <el-button size="small" @click="copyInstanceUrl(newInstanceDialog.location)">{{
                $t('dialog.new_instance.copy_url')
            }}</el-button>
            <el-button size="small" @click="selfInvite(newInstanceDialog.location)">{{
                $t('dialog.new_instance.self_invite')
            }}</el-button>
            <el-button
                size="small"
                :disabled="
                    (newInstanceDialog.accessType === 'friends' || newInstanceDialog.accessType === 'invite') &&
                    newInstanceDialog.userId !== API.currentUser.id
                "
                @click="showInviteDialog(newInstanceDialog.location)"
                >{{ $t('dialog.new_instance.invite') }}</el-button
            >
            <el-button
                type="primary"
                size="small"
                @click="showLaunchDialog(newInstanceDialog.location, newInstanceDialog.shortName)"
                >{{ $t('dialog.new_instance.launch') }}</el-button
            >
        </template>
        <InviteDialog
            :invite-dialog="inviteDialog"
            :vip-friends="vipFriends"
            :online-friends="onlineFriends"
            :active-friends="activeFriends"
            :invite-message-table="inviteMessageTable"
            :upload-image="uploadImage"
            @closeInviteDialog="closeInviteDialog" />
    </safe-dialog>
</template>

<script>
    import { groupRequest, instanceRequest, worldRequest } from '../../api';
    import utils from '../../classes/utils';
    import { hasGroupPermission as _hasGroupPermission } from '../../composables/group/utils';
    import { isRealInstance, parseLocation } from '../../composables/instance/utils';
    import { getLaunchURL } from '../../composables/shared/utils';
    import configRepository from '../../service/config';
    import InviteDialog from './InviteDialog/InviteDialog.vue';

    export default {
        name: 'NewInstanceDialog',
        components: { InviteDialog },
        inject: ['API', 'friends', 'userImage', 'userStatusClass', 'showLaunchDialog', 'adjustDialogZ'],
        props: {
            vipFriends: {
                type: Array,
                required: true
            },
            onlineFriends: {
                type: Array,
                required: true
            },
            activeFriends: {
                type: Array,
                required: true
            },
            offlineFriends: {
                type: Array,
                required: true
            },
            instanceContentSettings: {
                type: Array,
                required: true
            },
            createNewInstance: {
                type: Function,
                required: true
            },
            newInstanceDialogLocationTag: {
                type: String,
                required: true
            },
            inviteMessageTable: {
                type: Object,
                default: () => ({})
            },
            uploadImage: {
                type: String,
                default: ''
            },
            lastLocation: {
                type: Object,
                default: () => ({})
            }
        },
        data() {
            return {
                newInstanceDialog: {
                    visible: false,
                    // loading: false,
                    selectedTab: '0',
                    instanceCreated: false,
                    queueEnabled: false,
                    worldId: '',
                    instanceId: '',
                    instanceName: '',
                    userId: '',
                    accessType: 'public',
                    region: 'US West',
                    groupRegion: '',
                    groupId: '',
                    groupAccessType: 'plus',
                    ageGate: false,
                    strict: false,
                    location: '',
                    shortName: '',
                    url: '',
                    secureOrShortName: '',
                    lastSelectedGroupId: '',
                    selectedGroupRoles: [],
                    roleIds: [],
                    groupRef: {},
                    contentSettings: this.instanceContentSettings,
                    selectedContentSettings: []
                },
                inviteDialog: {
                    visible: false,
                    loading: false,
                    worldId: '',
                    worldName: '',
                    userIds: [],
                    friendsInInstance: []
                }
            };
        },
        watch: {
            newInstanceDialogLocationTag(value) {
                this.initNewInstanceDialog(value);
            }
        },
        created() {
            this.initializeNewInstanceDialog();
        },
        methods: {
            closeInviteDialog() {
                this.inviteDialog.visible = false;
            },
            showInviteDialog(tag) {
                if (!isRealInstance(tag)) {
                    return;
                }
                const L = parseLocation(tag);
                worldRequest
                    .getCachedWorld({
                        worldId: L.worldId
                    })
                    .then((args) => {
                        const D = this.inviteDialog;
                        D.userIds = [];
                        D.worldId = L.tag;
                        D.worldName = args.ref.name;
                        D.friendsInInstance = [];
                        const friendsInCurrentInstance = this.lastLocation.friendList;
                        for (const friend of friendsInCurrentInstance.values()) {
                            const ctx = this.friends.get(friend.userId);
                            if (typeof ctx.ref === 'undefined') {
                                continue;
                            }
                            D.friendsInInstance.push(ctx);
                        }
                        D.visible = true;
                    });
            },
            initNewInstanceDialog(tag) {
                if (!isRealInstance(tag)) {
                    return;
                }
                this.$nextTick(() => this.adjustDialogZ(this.$refs.newInstanceDialog.$el));
                const D = this.newInstanceDialog;
                const L = parseLocation(tag);
                if (D.worldId === L.worldId) {
                    // reopening dialog, keep last open instance
                    D.visible = true;
                    return;
                }
                D.worldId = L.worldId;
                D.instanceCreated = false;
                D.lastSelectedGroupId = '';
                D.selectedGroupRoles = [];
                D.groupRef = {};
                D.roleIds = [];
                D.strict = false;
                D.shortName = '';
                D.secureOrShortName = '';
                groupRequest.getGroupPermissions({ userId: this.API.currentUser.id });
                this.buildInstance();
                this.buildLegacyInstance();
                this.updateNewInstanceDialog();
                D.visible = true;
            },
            initializeNewInstanceDialog() {
                configRepository
                    .getBool('instanceDialogQueueEnabled', true)
                    .then((value) => (this.newInstanceDialog.queueEnabled = value));

                configRepository
                    .getString('instanceDialogInstanceName', '')
                    .then((value) => (this.newInstanceDialog.instanceName = value));

                configRepository
                    .getString('instanceDialogUserId', '')
                    .then((value) => (this.newInstanceDialog.userId = value));

                configRepository
                    .getString('instanceDialogAccessType', 'public')
                    .then((value) => (this.newInstanceDialog.accessType = value));

                configRepository
                    .getString('instanceRegion', 'US West')
                    .then((value) => (this.newInstanceDialog.region = value));

                configRepository
                    .getString('instanceDialogGroupId', '')
                    .then((value) => (this.newInstanceDialog.groupId = value));

                configRepository
                    .getString('instanceDialogGroupAccessType', 'plus')
                    .then((value) => (this.newInstanceDialog.groupAccessType = value));

                configRepository
                    .getBool('instanceDialogAgeGate', false)
                    .then((value) => (this.newInstanceDialog.ageGate = value));

                configRepository
                    .getString('instanceDialogSelectedContentSettings', JSON.stringify(this.instanceContentSettings))
                    .then((value) => (this.newInstanceDialog.selectedContentSettings = JSON.parse(value)));
            },
            saveNewInstanceDialog() {
                const {
                    accessType,
                    region,
                    instanceName,
                    userId,
                    groupId,
                    groupAccessType,
                    queueEnabled,
                    ageGate,
                    selectedContentSettings
                } = this.newInstanceDialog;

                configRepository.setString('instanceDialogAccessType', accessType);
                configRepository.setString('instanceRegion', region);
                configRepository.setString('instanceDialogInstanceName', instanceName);
                configRepository.setString('instanceDialogUserId', userId === this.API.currentUser.id ? '' : userId);
                configRepository.setString('instanceDialogGroupId', groupId);
                configRepository.setString('instanceDialogGroupAccessType', groupAccessType);
                configRepository.setBool('instanceDialogQueueEnabled', queueEnabled);
                configRepository.setBool('instanceDialogAgeGate', ageGate);
                configRepository.setString(
                    'instanceDialogSelectedContentSettings',
                    JSON.stringify(selectedContentSettings)
                );
            },
            newInstanceTabClick(tab) {
                if (tab === '1') {
                    this.buildInstance();
                } else {
                    this.buildLegacyInstance();
                }
            },
            updateNewInstanceDialog(noChanges) {
                const D = this.newInstanceDialog;
                if (D.instanceId) {
                    D.location = `${D.worldId}:${D.instanceId}`;
                } else {
                    D.location = D.worldId;
                }
                const L = parseLocation(D.location);
                if (noChanges) {
                    L.shortName = D.shortName;
                } else {
                    D.shortName = '';
                }
                D.url = getLaunchURL(L);
            },
            selfInvite(location) {
                const L = parseLocation(location);
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
            },
            async handleCreateNewInstance() {
                const args = await this.createNewInstance(this.newInstanceDialog.worldId, this.newInstanceDialog);

                if (args) {
                    this.newInstanceDialog.location = args.json.location;
                    this.newInstanceDialog.instanceId = args.json.instanceId;
                    this.newInstanceDialog.secureOrShortName = args.json.shortName || args.json.secureName;
                    this.newInstanceDialog.instanceCreated = true;
                    this.updateNewInstanceDialog();
                }
            },
            buildInstance() {
                const D = this.newInstanceDialog;
                D.instanceCreated = false;
                D.instanceId = '';
                D.shortName = '';
                D.secureOrShortName = '';
                if (!D.userId) {
                    D.userId = this.API.currentUser.id;
                }
                if (D.groupId && D.groupId !== D.lastSelectedGroupId) {
                    D.roleIds = [];
                    const ref = this.API.cachedGroups.get(D.groupId);
                    if (typeof ref !== 'undefined') {
                        D.groupRef = ref;
                        D.selectedGroupRoles = ref.roles;
                        groupRequest
                            .getGroupRoles({
                                groupId: D.groupId
                            })
                            .then((args) => {
                                D.lastSelectedGroupId = D.groupId;
                                D.selectedGroupRoles = args.json;
                                ref.roles = args.json;
                            });
                    }
                }
                if (!D.groupId) {
                    D.roleIds = [];
                    D.groupRef = {};
                    D.selectedGroupRoles = [];
                    D.lastSelectedGroupId = '';
                }
                this.saveNewInstanceDialog();
            },
            buildLegacyInstance() {
                const D = this.newInstanceDialog;
                D.instanceCreated = false;
                D.shortName = '';
                D.secureOrShortName = '';
                const tags = [];
                if (D.instanceName) {
                    D.instanceName = D.instanceName.replace(/[^A-Za-z0-9]/g, '');
                    tags.push(D.instanceName);
                } else {
                    const randValue = (99999 * Math.random() + 1).toFixed(0);
                    tags.push(String(randValue).padStart(5, '0'));
                }
                if (!D.userId) {
                    D.userId = this.API.currentUser.id;
                }
                const userId = D.userId;
                if (D.accessType !== 'public') {
                    if (D.accessType === 'friends+') {
                        tags.push(`~hidden(${userId})`);
                    } else if (D.accessType === 'friends') {
                        tags.push(`~friends(${userId})`);
                    } else if (D.accessType === 'group') {
                        tags.push(`~group(${D.groupId})`);
                        tags.push(`~groupAccessType(${D.groupAccessType})`);
                    } else {
                        tags.push(`~private(${userId})`);
                    }
                    if (D.accessType === 'invite+') {
                        tags.push('~canRequestInvite');
                    }
                }
                if (D.accessType === 'group' && D.ageGate) {
                    tags.push('~ageGate');
                }
                if (D.region === 'US West') {
                    tags.push(`~region(us)`);
                } else if (D.region === 'US East') {
                    tags.push(`~region(use)`);
                } else if (D.region === 'Europe') {
                    tags.push(`~region(eu)`);
                } else if (D.region === 'Japan') {
                    tags.push(`~region(jp)`);
                }
                if (D.accessType !== 'invite' && D.accessType !== 'friends') {
                    D.strict = false;
                }
                if (D.strict) {
                    tags.push('~strict');
                }
                if (D.groupId && D.groupId !== D.lastSelectedGroupId) {
                    D.roleIds = [];
                    const ref = this.API.cachedGroups.get(D.groupId);
                    if (typeof ref !== 'undefined') {
                        D.groupRef = ref;
                        D.selectedGroupRoles = ref.roles;
                        groupRequest
                            .getGroupRoles({
                                groupId: D.groupId
                            })
                            .then((args) => {
                                D.lastSelectedGroupId = D.groupId;
                                D.selectedGroupRoles = args.json;
                                ref.roles = args.json;
                            });
                    }
                }
                if (!D.groupId) {
                    D.roleIds = [];
                    D.selectedGroupRoles = [];
                    D.groupRef = {};
                    D.lastSelectedGroupId = '';
                }
                D.instanceId = tags.join('');
                this.updateNewInstanceDialog(false);
                this.saveNewInstanceDialog();
            },
            async copyInstanceUrl(location) {
                const L = parseLocation(location);
                const args = await instanceRequest.getInstanceShortName({
                    worldId: L.worldId,
                    instanceId: L.instanceId
                });
                if (args.json) {
                    if (args.json.shortName) {
                        L.shortName = args.json.shortName;
                    }
                    // NOTE:
                    // splitting the 'INSTANCE:SHORTNAME' event and put code here
                    const resLocation = `${args.instance.worldId}:${args.instance.instanceId}`;
                    if (resLocation === this.newInstanceDialog.location) {
                        const shortName = args.json.shortName;
                        const secureOrShortName = args.json.shortName || args.json.secureName;
                        this.newInstanceDialog.shortName = shortName;
                        this.newInstanceDialog.secureOrShortName = secureOrShortName;
                        this.updateNewInstanceDialog(true);
                    }
                }
                const newUrl = utils.getLaunchURL(L);
                this.copyToClipboard(newUrl);
            },
            async copyToClipboard(newUrl) {
                try {
                    await navigator.clipboard.writeText(newUrl);
                    this.$message({
                        message: 'Instance copied to clipboard',
                        type: 'success'
                    });
                } catch (error) {
                    this.$message({
                        message: 'Instance copied failed',
                        type: 'error'
                    });
                    console.error(error.message);
                }
            },
            hasGroupPermission(ref, permission) {
                return _hasGroupPermission(ref, permission);
            }
        }
    };
</script>
