<template>
    <div style="display: inline-block; margin-left: 5px">
        <el-tooltip v-if="state.isValidInstance" placement="bottom">
            <template #content>
                <div>
                    <span v-if="state.isClosed">Closed At: {{ formatDateFilter(state.closedAt, 'long') }}<br /></span>
                    <template v-if="state.canCloseInstance">
                        <el-button
                            :disabled="state.isClosed"
                            size="mini"
                            type="primary"
                            @click="closeInstance(props.location)">
                            {{ t('dialog.user.info.close_instance') }} </el-button
                        ><br /><br />
                    </template>
                    <span><span style="color: #409eff">PC: </span>{{ state.platforms.standalonewindows }}</span
                    ><br />
                    <span><span style="color: #67c23a">Android: </span>{{ state.platforms.android }}</span
                    ><br />
                    <span>{{ t('dialog.user.info.instance_game_version') }} {{ state.gameServerVersion }}</span
                    ><br />
                    <span v-if="state.queueEnabled">{{ t('dialog.user.info.instance_queuing_enabled') }}<br /></span>
                    <span v-if="state.disabledContentSettings"
                        >{{ t('dialog.user.info.instance_disabled_content') }} {{ state.disabledContentSettings }}<br
                    /></span>
                    <span v-if="state.userList.length">{{ t('dialog.user.info.instance_users') }}<br /></span>
                    <template v-for="user in state.userList">
                        <span
                            style="cursor: pointer; margin-right: 5px"
                            @click="showUserDialog(user.id)"
                            :key="user.id"
                            >{{ user.displayName }}</span
                        >
                    </template>
                </div>
            </template>
            <i class="el-icon-caret-bottom"></i>
        </el-tooltip>
        <span v-if="state.occupants" style="margin-left: 5px">{{ state.occupants }}/{{ state.capacity }}</span>
        <span v-if="props.friendcount" style="margin-left: 5px">({{ props.friendcount }})</span>
        <span v-if="state.isFull" style="margin-left: 5px; color: lightcoral">{{
            t('dialog.user.info.instance_full')
        }}</span>
        <span v-if="state.isHardClosed" style="margin-left: 5px; color: lightcoral">{{
            t('dialog.user.info.instance_hard_closed')
        }}</span>
        <span v-else-if="state.isClosed" style="margin-left: 5px; color: lightcoral">{{
            t('dialog.user.info.instance_closed')
        }}</span>
        <span v-if="state.queueSize" style="margin-left: 5px"
            >{{ t('dialog.user.info.instance_queue') }} {{ state.queueSize }}</span
        >
        <span v-if="state.isAgeGated" style="margin-left: 5px; color: lightcoral">{{
            t('dialog.user.info.instance_age_gated')
        }}</span>
    </div>
</template>

<script setup>
    import { getCurrentInstance, reactive, watch } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { miscRequest } from '../api';
    import { formatDateFilter, hasGroupPermission } from '../shared/utils';
    import { useGroupStore, useInstanceStore, useLocationStore, useUserStore } from '../stores';

    const { t } = useI18n();

    const locationStore = useLocationStore();
    const userStore = useUserStore();
    const groupStore = useGroupStore();
    const instanceStore = useInstanceStore();

    const props = defineProps({
        location: String,
        instance: Object,
        friendcount: Number
    });

    const state = reactive({
        isValidInstance: false,
        isFull: false,
        isClosed: false,
        isHardClosed: false,
        closedAt: '',
        occupants: 0,
        capacity: 0,
        queueSize: 0,
        queueEnabled: false,
        platforms: {},
        userList: [],
        gameServerVersion: '',
        canCloseInstance: false,
        isAgeGated: false,
        disabledContentSettings: ''
    });

    const { proxy } = getCurrentInstance();

    function parse() {
        Object.assign(state, {
            isValidInstance: false,
            isFull: false,
            isClosed: false,
            isHardClosed: false,
            closedAt: '',
            occupants: 0,
            capacity: 0,
            queueSize: 0,
            queueEnabled: false,
            platforms: [],
            userList: [],
            gameServerVersion: '',
            canCloseInstance: false,
            isAgeGated: false,
            disabledContentSettings: ''
        });

        if (!props.location || !props.instance || Object.keys(props.instance).length === 0) return;

        state.isValidInstance = true;
        state.isFull = props.instance.hasCapacityForYou === false;
        if (props.instance.closedAt) {
            state.isClosed = true;
            state.closedAt = props.instance.closedAt;
        }
        state.isHardClosed = props.instance.hardClose === true;
        state.occupants = props.instance.userCount;
        if (props.location === locationStore.lastLocation.location) {
            state.occupants = locationStore.lastLocation.playerList.size;
        }
        state.capacity = props.instance.capacity;
        state.gameServerVersion = props.instance.gameServerVersion;
        state.queueSize = props.instance.queueSize;
        if (props.instance.platforms) state.platforms = props.instance.platforms;
        if (props.instance.users) state.userList = props.instance.users;
        if (props.instance.ownerId === userStore.currentUser.id) {
            state.canCloseInstance = true;
        } else if (props.instance.ownerId?.startsWith('grp_')) {
            const group = groupStore.cachedGroups.get(props.instance.ownerId);
            state.canCloseInstance = hasGroupPermission(group, 'group-instance-moderate');
        }
        state.isAgeGated = props.instance.ageGate === true;
        if (props.location?.includes('~ageGate')) state.isAgeGated = true;
        if (props.instance.$disabledContentSettings?.length) {
            state.disabledContentSettings = props.instance.$disabledContentSettings.join(', ');
        }
    }

    watch([() => props.location, () => props.instance, () => props.friendcount], parse, { immediate: true });

    function showUserDialog(userId) {
        userStore.showUserDialog(userId);
    }

    function closeInstance(location) {
        proxy.$confirm('Continue? Close Instance, nobody will be able to join', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'warning',
            callback: async (action) => {
                if (action !== 'confirm') return;
                const args = await miscRequest.closeInstance({ location, hardClose: false });
                if (args.json) {
                    proxy.$message({ message: t('message.instance.closed'), type: 'success' });
                    instanceStore.applyInstance(args.json);
                }
            }
        });
    }
</script>
