<template>
    <safe-dialog
        ref="newInstanceDialogRef"
        :visible.sync="newInstanceDialog.visible"
        :title="t('dialog.new_instance.header')"
        width="650px"
        append-to-body>
        <el-tabs v-model="newInstanceDialog.selectedTab" type="card" @tab-click="newInstanceTabClick">
            <el-tab-pane :label="t('dialog.new_instance.normal')">
                <el-form :model="newInstanceDialog" label-width="150px">
                    <el-form-item :label="t('dialog.new_instance.access_type')">
                        <el-radio-group v-model="newInstanceDialog.accessType" size="mini" @change="buildInstance">
                            <el-radio-button label="public">{{
                                t('dialog.new_instance.access_type_public')
                            }}</el-radio-button>
                            <el-radio-button label="group">{{
                                t('dialog.new_instance.access_type_group')
                            }}</el-radio-button>
                            <el-radio-button label="friends+">{{
                                t('dialog.new_instance.access_type_friend_plus')
                            }}</el-radio-button>
                            <el-radio-button label="friends">{{
                                t('dialog.new_instance.access_type_friend')
                            }}</el-radio-button>
                            <el-radio-button label="invite+">{{
                                t('dialog.new_instance.access_type_invite_plus')
                            }}</el-radio-button>
                            <el-radio-button label="invite">{{
                                t('dialog.new_instance.access_type_invite')
                            }}</el-radio-button>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item
                        v-if="newInstanceDialog.accessType === 'group'"
                        :label="t('dialog.new_instance.group_access_type')">
                        <el-radio-group v-model="newInstanceDialog.groupAccessType" size="mini" @change="buildInstance">
                            <el-radio-button
                                label="members"
                                :disabled="
                                    !hasGroupPermission(newInstanceDialog.groupRef, 'group-instance-open-create')
                                "
                                >{{ t('dialog.new_instance.group_access_type_members') }}</el-radio-button
                            >
                            <el-radio-button
                                label="plus"
                                :disabled="
                                    !hasGroupPermission(newInstanceDialog.groupRef, 'group-instance-plus-create')
                                "
                                >{{ t('dialog.new_instance.group_access_type_plus') }}</el-radio-button
                            >
                            <el-radio-button
                                label="public"
                                :disabled="
                                    !hasGroupPermission(newInstanceDialog.groupRef, 'group-instance-public-create') ||
                                    newInstanceDialog.groupRef.privacy === 'private'
                                "
                                >{{ t('dialog.new_instance.group_access_type_public') }}</el-radio-button
                            >
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item :label="t('dialog.new_instance.region')">
                        <el-radio-group v-model="newInstanceDialog.region" size="mini" @change="buildInstance">
                            <el-radio-button label="US West">{{ t('dialog.new_instance.region_usw') }}</el-radio-button>
                            <el-radio-button label="US East">{{ t('dialog.new_instance.region_use') }}</el-radio-button>
                            <el-radio-button label="Europe">{{ t('dialog.new_instance.region_eu') }}</el-radio-button>
                            <el-radio-button label="Japan">{{ t('dialog.new_instance.region_jp') }}</el-radio-button>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item
                        v-if="newInstanceDialog.accessType === 'group'"
                        :label="t('dialog.new_instance.queueEnabled')">
                        <el-checkbox v-model="newInstanceDialog.queueEnabled" @change="buildInstance"></el-checkbox>
                    </el-form-item>
                    <el-form-item
                        v-if="newInstanceDialog.accessType === 'group'"
                        :label="t('dialog.new_instance.ageGate')">
                        <el-checkbox
                            v-model="newInstanceDialog.ageGate"
                            :disabled="
                                !hasGroupPermission(newInstanceDialog.groupRef, 'group-instance-age-gated-create')
                            "
                            @change="buildInstance"></el-checkbox>
                    </el-form-item>
                    <el-form-item :label="t('dialog.new_instance.world_id')">
                        <el-input
                            v-model="newInstanceDialog.worldId"
                            size="mini"
                            @click.native="$event.target.tagName === 'INPUT' && $event.target.select()"
                            @change="buildInstance"></el-input>
                    </el-form-item>
                    <el-form-item
                        v-if="newInstanceDialog.accessType === 'group'"
                        :label="t('dialog.new_instance.group_id')">
                        <el-select
                            v-model="newInstanceDialog.groupId"
                            clearable
                            :placeholder="t('dialog.new_instance.group_placeholder')"
                            filterable
                            style="width: 100%"
                            @change="buildInstance">
                            <el-option-group :label="t('dialog.new_instance.group_placeholder')">
                                <el-option
                                    v-for="group in currentUserGroups.values()"
                                    :key="group.id"
                                    :label="group.name"
                                    :value="group.id"
                                    class="x-friend-item"
                                    style="height: auto; width: 478px">
                                    <template
                                        v-if="
                                            group &&
                                            (hasGroupPermission(group, 'group-instance-public-create') ||
                                                hasGroupPermission(group, 'group-instance-plus-create') ||
                                                hasGroupPermission(group, 'group-instance-open-create'))
                                        ">
                                        <div class="avatar">
                                            <img v-lazy="group.iconUrl" />
                                        </div>
                                        <div class="detail">
                                            <span class="name" v-text="group.name"></span>
                                        </div>
                                    </template>
                                </el-option>
                            </el-option-group>
                        </el-select>
                    </el-form-item>
                    <el-form-item
                        v-if="
                            newInstanceDialog.accessType === 'group' && newInstanceDialog.groupAccessType === 'members'
                        "
                        :label="t('dialog.new_instance.roles')">
                        <el-select
                            v-model="newInstanceDialog.roleIds"
                            multiple
                            clearable
                            :placeholder="t('dialog.new_instance.role_placeholder')"
                            style="width: 100%"
                            @change="buildInstance">
                            <el-option-group :label="t('dialog.new_instance.role_placeholder')">
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
                        <el-form-item :label="t('dialog.new_instance.location')">
                            <el-input
                                v-model="newInstanceDialog.location"
                                size="mini"
                                readonly
                                @click.native="$event.target.tagName === 'INPUT' && $event.target.select()"></el-input>
                        </el-form-item>
                        <el-form-item :label="t('dialog.new_instance.url')">
                            <el-input v-model="newInstanceDialog.url" size="mini" readonly></el-input>
                        </el-form-item>
                    </template>
                </el-form>
            </el-tab-pane>
            <el-tab-pane :label="t('dialog.new_instance.legacy')">
                <el-form :model="newInstanceDialog" label-width="150px">
                    <el-form-item :label="t('dialog.new_instance.access_type')">
                        <el-radio-group
                            v-model="newInstanceDialog.accessType"
                            size="mini"
                            @change="buildLegacyInstance">
                            <el-radio-button label="public">{{
                                t('dialog.new_instance.access_type_public')
                            }}</el-radio-button>
                            <el-radio-button label="group">{{
                                t('dialog.new_instance.access_type_group')
                            }}</el-radio-button>
                            <el-radio-button label="friends+">{{
                                t('dialog.new_instance.access_type_friend_plus')
                            }}</el-radio-button>
                            <el-radio-button label="friends">{{
                                t('dialog.new_instance.access_type_friend')
                            }}</el-radio-button>
                            <el-radio-button label="invite+">{{
                                t('dialog.new_instance.access_type_invite_plus')
                            }}</el-radio-button>
                            <el-radio-button label="invite">{{
                                t('dialog.new_instance.access_type_invite')
                            }}</el-radio-button>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item
                        v-if="newInstanceDialog.accessType === 'group'"
                        :label="t('dialog.new_instance.group_access_type')">
                        <el-radio-group
                            v-model="newInstanceDialog.groupAccessType"
                            size="mini"
                            @change="buildLegacyInstance">
                            <el-radio-button label="members">{{
                                t('dialog.new_instance.group_access_type_members')
                            }}</el-radio-button>
                            <el-radio-button label="plus">{{
                                t('dialog.new_instance.group_access_type_plus')
                            }}</el-radio-button>
                            <el-radio-button label="public">{{
                                t('dialog.new_instance.group_access_type_public')
                            }}</el-radio-button>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item :label="t('dialog.new_instance.region')">
                        <el-radio-group v-model="newInstanceDialog.region" size="mini" @change="buildLegacyInstance">
                            <el-radio-button label="US West">{{ t('dialog.new_instance.region_usw') }}</el-radio-button>
                            <el-radio-button label="US East">{{ t('dialog.new_instance.region_use') }}</el-radio-button>
                            <el-radio-button label="Europe">{{ t('dialog.new_instance.region_eu') }}</el-radio-button>
                            <el-radio-button label="Japan">{{ t('dialog.new_instance.region_jp') }}</el-radio-button>
                        </el-radio-group>
                    </el-form-item>
                    <el-form-item
                        v-if="newInstanceDialog.accessType === 'group'"
                        :label="t('dialog.new_instance.ageGate')">
                        <el-checkbox v-model="newInstanceDialog.ageGate" @change="buildInstance"></el-checkbox>
                    </el-form-item>
                    <el-form-item :label="t('dialog.new_instance.world_id')">
                        <el-input
                            v-model="newInstanceDialog.worldId"
                            size="mini"
                            @click.native="$event.target.tagName === 'INPUT' && $event.target.select()"
                            @change="buildLegacyInstance"></el-input>
                    </el-form-item>
                    <el-form-item :label="t('dialog.new_instance.instance_id')">
                        <el-input
                            v-model="newInstanceDialog.instanceName"
                            :placeholder="t('dialog.new_instance.instance_id_placeholder')"
                            size="mini"
                            @change="buildLegacyInstance"></el-input>
                    </el-form-item>
                    <el-form-item
                        v-if="newInstanceDialog.accessType !== 'public' && newInstanceDialog.accessType !== 'group'"
                        :label="t('dialog.new_instance.instance_creator')">
                        <el-select
                            v-model="newInstanceDialog.userId"
                            clearable
                            :placeholder="t('dialog.new_instance.instance_creator_placeholder')"
                            filterable
                            style="width: 100%"
                            @change="buildLegacyInstance">
                            <el-option-group v-if="currentUser" :label="t('side_panel.me')">
                                <el-option
                                    class="x-friend-item"
                                    :label="currentUser.displayName"
                                    :value="currentUser.id"
                                    style="height: auto">
                                    <div class="avatar" :class="userStatusClass(currentUser)">
                                        <img v-lazy="userImage(currentUser)" />
                                    </div>
                                    <div class="detail">
                                        <span class="name" v-text="currentUser.displayName"></span>
                                    </div>
                                </el-option>
                            </el-option-group>
                            <el-option-group v-if="vipFriends.length" :label="t('side_panel.favorite')">
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
                            <el-option-group v-if="onlineFriends.length" :label="t('side_panel.online')">
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
                            <el-option-group v-if="activeFriends.length" :label="t('side_panel.active')">
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
                            <el-option-group v-if="offlineFriends.length" :label="t('side_panel.offline')">
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
                        :label="t('dialog.new_instance.group_id')">
                        <el-select
                            v-model="newInstanceDialog.groupId"
                            clearable
                            :placeholder="t('dialog.new_instance.group_placeholder')"
                            filterable
                            style="width: 100%"
                            @change="buildLegacyInstance">
                            <el-option-group :label="t('dialog.new_instance.group_placeholder')">
                                <el-option
                                    v-for="group in currentUserGroups.values()"
                                    :key="group.id"
                                    class="x-friend-item"
                                    :label="group.name"
                                    :value="group.id"
                                    style="height: auto; width: 478px">
                                    <template v-if="group">
                                        <div class="avatar">
                                            <img v-lazy="group.iconUrl" />
                                        </div>
                                        <div class="detail">
                                            <span class="name" v-text="group.name"></span></div
                                    ></template>
                                </el-option>
                            </el-option-group>
                        </el-select>
                    </el-form-item>
                    <el-form-item :label="t('dialog.new_instance.location')">
                        <el-input
                            v-model="newInstanceDialog.location"
                            size="mini"
                            readonly
                            @click.native="$event.target.tagName === 'INPUT' && $event.target.select()"></el-input>
                    </el-form-item>
                    <el-form-item :label="t('dialog.new_instance.url')">
                        <el-input v-model="newInstanceDialog.url" size="mini" readonly></el-input>
                    </el-form-item>
                </el-form>
            </el-tab-pane>
        </el-tabs>
        <template v-if="newInstanceDialog.selectedTab === '0'" #footer>
            <template v-if="newInstanceDialog.instanceCreated">
                <el-button size="small" @click="copyInstanceUrl(newInstanceDialog.location)">{{
                    t('dialog.new_instance.copy_url')
                }}</el-button>
                <el-button size="small" @click="selfInvite(newInstanceDialog.location)">{{
                    t('dialog.new_instance.self_invite')
                }}</el-button>
                <el-button
                    size="small"
                    :disabled="
                        (newInstanceDialog.accessType === 'friends' || newInstanceDialog.accessType === 'invite') &&
                        newInstanceDialog.userId !== currentUser.id
                    "
                    @click="showInviteDialog(newInstanceDialog.location)"
                    >{{ t('dialog.new_instance.invite') }}</el-button
                >
                <template v-if="canOpenInstanceInGame()">
                    <el-button
                        type="default"
                        size="small"
                        @click="showLaunchDialog(newInstanceDialog.location, newInstanceDialog.shortName)"
                        >{{ t('dialog.new_instance.launch') }}</el-button
                    >
                    <el-button
                        type="primary"
                        size="small"
                        @click="handleAttachGame(newInstanceDialog.location, newInstanceDialog.shortName)">
                        {{ t('dialog.new_instance.open_ingame') }}
                    </el-button>
                </template>
                <template v-else>
                    <el-button
                        type="primary"
                        size="small"
                        @click="showLaunchDialog(newInstanceDialog.location, newInstanceDialog.shortName)"
                        >{{ t('dialog.new_instance.launch') }}</el-button
                    >
                </template>
            </template>
            <template v-else>
                <el-button type="primary" size="small" @click="handleCreateNewInstance">{{
                    t('dialog.new_instance.create_instance')
                }}</el-button>
            </template>
        </template>
        <template v-else-if="newInstanceDialog.selectedTab === '1'" #footer>
            <el-button size="small" @click="copyInstanceUrl(newInstanceDialog.location)">{{
                t('dialog.new_instance.copy_url')
            }}</el-button>
            <el-button size="small" @click="selfInvite(newInstanceDialog.location)">{{
                t('dialog.new_instance.self_invite')
            }}</el-button>
            <el-button
                size="small"
                :disabled="
                    (newInstanceDialog.accessType === 'friends' || newInstanceDialog.accessType === 'invite') &&
                    newInstanceDialog.userId !== currentUser.id
                "
                @click="showInviteDialog(newInstanceDialog.location)"
                >{{ t('dialog.new_instance.invite') }}</el-button
            >
            <template v-if="canOpenInstanceInGame()">
                <el-button
                    type="default"
                    size="small"
                    @click="showLaunchDialog(newInstanceDialog.location, newInstanceDialog.shortName)"
                    >{{ t('dialog.new_instance.launch') }}</el-button
                >
                <el-button
                    type="primary"
                    size="small"
                    @click="handleAttachGame(newInstanceDialog.location, newInstanceDialog.shortName)">
                    {{ t('dialog.new_instance.open_ingame') }}
                </el-button>
            </template>
            <template v-else>
                <el-button
                    type="primary"
                    size="small"
                    @click="showLaunchDialog(newInstanceDialog.location, newInstanceDialog.shortName)"
                    >{{ t('dialog.new_instance.launch') }}</el-button
                >
            </template>
        </template>
        <InviteDialog :invite-dialog="inviteDialog" @closeInviteDialog="closeInviteDialog" />
    </safe-dialog>
</template>

<script setup>
    import { ref, watch, nextTick, getCurrentInstance } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { storeToRefs } from 'pinia';
    import { groupRequest, instanceRequest, worldRequest } from '../../api';
    import configRepository from '../../service/config';
    import {
        adjustDialogZ,
        copyToClipboard,
        getLaunchURL,
        hasGroupPermission,
        isRealInstance,
        parseLocation,
        userImage,
        userStatusClass
    } from '../../shared/utils';
    import {
        useFriendStore,
        useGroupStore,
        useInstanceStore,
        useLaunchStore,
        useLocationStore,
        useUserStore,
        useInviteStore
    } from '../../stores';
    import InviteDialog from './InviteDialog/InviteDialog.vue';

    const props = defineProps({
        newInstanceDialogLocationTag: {
            type: String,
            required: true
        }
    });

    const { t } = useI18n();

    const { proxy } = getCurrentInstance();

    const { friends, vipFriends, onlineFriends, activeFriends, offlineFriends } = storeToRefs(useFriendStore());
    const { currentUserGroups, cachedGroups } = storeToRefs(useGroupStore());
    const { handleGroupPermissions } = useGroupStore();
    const { lastLocation } = storeToRefs(useLocationStore());
    const { showLaunchDialog } = useLaunchStore();
    const { createNewInstance } = useInstanceStore();
    const { currentUser } = storeToRefs(useUserStore());
    const { tryOpenInstanceInVrc } = useLaunchStore();
    const { canOpenInstanceInGame } = useInviteStore();

    const newInstanceDialogRef = ref(null);

    const newInstanceDialog = ref({
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
        groupRef: {}
    });

    const inviteDialog = ref({
        visible: false,
        loading: false,
        worldId: '',
        worldName: '',
        userIds: [],
        friendsInInstance: []
    });

    watch(
        () => props.newInstanceDialogLocationTag,
        (value) => {
            initNewInstanceDialog(value);
        }
    );

    initializeNewInstanceDialog();

    function closeInviteDialog() {
        inviteDialog.value.visible = false;
    }

    function showInviteDialog(tag) {
        if (!isRealInstance(tag)) {
            return;
        }
        const L = parseLocation(tag);
        worldRequest
            .getCachedWorld({
                worldId: L.worldId
            })
            .then((args) => {
                const D = inviteDialog.value;
                D.userIds = [];
                D.worldId = L.tag;
                D.worldName = args.ref.name;
                D.friendsInInstance = [];
                const friendsInCurrentInstance = lastLocation.value.friendList;
                for (const friend of friendsInCurrentInstance.values()) {
                    const ctx = friends.value.get(friend.userId);
                    if (typeof ctx.ref === 'undefined') {
                        continue;
                    }
                    D.friendsInInstance.push(ctx);
                }
                D.visible = true;
            });
    }

    function handleAttachGame(location, shortName) {
        tryOpenInstanceInVrc(location, shortName);
        closeInviteDialog();
    }

    async function initNewInstanceDialog(tag) {
        if (!isRealInstance(tag)) {
            return;
        }
        nextTick(() => adjustDialogZ(newInstanceDialogRef.value.$el));
        const D = newInstanceDialog.value;
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
        const args = await groupRequest.getGroupPermissions({ userId: currentUser.value.id });
        handleGroupPermissions(args);
        buildInstance();
        buildLegacyInstance();
        updateNewInstanceDialog();
        D.visible = true;
    }
    function initializeNewInstanceDialog() {
        configRepository
            .getBool('instanceDialogQueueEnabled', true)
            .then((value) => (newInstanceDialog.value.queueEnabled = value));

        configRepository
            .getString('instanceDialogInstanceName', '')
            .then((value) => (newInstanceDialog.value.instanceName = value));

        configRepository
            .getString('instanceDialogUserId', '')
            .then((value) => (newInstanceDialog.value.userId = value));

        configRepository
            .getString('instanceDialogAccessType', 'public')
            .then((value) => (newInstanceDialog.value.accessType = value));

        configRepository
            .getString('instanceRegion', 'US West')
            .then((value) => (newInstanceDialog.value.region = value));

        configRepository
            .getString('instanceDialogGroupId', '')
            .then((value) => (newInstanceDialog.value.groupId = value));

        configRepository
            .getString('instanceDialogGroupAccessType', 'plus')
            .then((value) => (newInstanceDialog.value.groupAccessType = value));

        configRepository
            .getBool('instanceDialogAgeGate', false)
            .then((value) => (newInstanceDialog.value.ageGate = value));
    }
    function saveNewInstanceDialog() {
        const { accessType, region, instanceName, userId, groupId, groupAccessType, queueEnabled, ageGate } =
            newInstanceDialog.value;

        configRepository.setString('instanceDialogAccessType', accessType);
        configRepository.setString('instanceRegion', region);
        configRepository.setString('instanceDialogInstanceName', instanceName);
        configRepository.setString('instanceDialogUserId', userId === currentUser.value.id ? '' : userId);
        configRepository.setString('instanceDialogGroupId', groupId);
        configRepository.setString('instanceDialogGroupAccessType', groupAccessType);
        configRepository.setBool('instanceDialogQueueEnabled', queueEnabled);
        configRepository.setBool('instanceDialogAgeGate', ageGate);
    }
    function newInstanceTabClick(tab) {
        if (tab === '1') {
            buildInstance();
        } else {
            buildLegacyInstance();
        }
    }
    function updateNewInstanceDialog(noChanges) {
        const D = newInstanceDialog.value;
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
    }
    function selfInvite(location) {
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
                proxy.$message({
                    message: 'Self invite sent',
                    type: 'success'
                });
                return args;
            });
    }
    async function handleCreateNewInstance() {
        const args = await createNewInstance(newInstanceDialog.value.worldId, newInstanceDialog.value);

        if (args) {
            newInstanceDialog.value.location = args.json.location;
            newInstanceDialog.value.instanceId = args.json.instanceId;
            newInstanceDialog.value.secureOrShortName = args.json.shortName || args.json.secureName;
            newInstanceDialog.value.instanceCreated = true;
            updateNewInstanceDialog();
        }
    }
    function buildInstance() {
        const D = newInstanceDialog.value;
        D.instanceCreated = false;
        D.instanceId = '';
        D.shortName = '';
        D.secureOrShortName = '';
        if (!D.userId) {
            D.userId = currentUser.value.id;
        }
        if (D.groupId && D.groupId !== D.lastSelectedGroupId) {
            D.roleIds = [];
            const ref = cachedGroups.value.get(D.groupId);
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
        saveNewInstanceDialog();
    }
    function buildLegacyInstance() {
        const D = newInstanceDialog.value;
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
            D.userId = currentUser.value.id;
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
            const ref = cachedGroups.value.get(D.groupId);
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
        updateNewInstanceDialog(false);
        saveNewInstanceDialog();
    }
    async function copyInstanceUrl(location) {
        const L = parseLocation(location);
        const args = await instanceRequest.getInstanceShortName({
            worldId: L.worldId,
            instanceId: L.instanceId
        });
        if (args.json) {
            if (args.json.shortName) {
                L.shortName = args.json.shortName;
            }
            const resLocation = `${args.instance.worldId}:${args.instance.instanceId}`;
            if (resLocation === newInstanceDialog.value.location) {
                const shortName = args.json.shortName;
                const secureOrShortName = args.json.shortName || args.json.secureName;
                newInstanceDialog.value.shortName = shortName;
                newInstanceDialog.value.secureOrShortName = secureOrShortName;
                updateNewInstanceDialog(true);
            }
        }
        const newUrl = getLaunchURL(L);
        copyToClipboard(newUrl);
    }
</script>
