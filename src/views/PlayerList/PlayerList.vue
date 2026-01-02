<template>
    <div class="x-container" ref="playerListRef">
        <div style="display: flex; flex-direction: column; height: 100%">
            <div v-if="currentInstanceWorld.ref.id" style="display: flex; height: 120px">
                <img
                    :src="currentInstanceWorld.ref.thumbnailImageUrl"
                    class="x-link"
                    style="flex: none; width: 160px; height: 120px; border-radius: 4px"
                    @click="showFullscreenImageDialog(currentInstanceWorld.ref.imageUrl)"
                    loading="lazy" />
                <div style="margin-left: 10px; display: flex; flex-direction: column; min-width: 320px; width: 100%">
                    <div>
                        <span
                            class="x-link"
                            style="
                                font-weight: bold;
                                overflow: hidden;
                                text-overflow: ellipsis;
                                display: -webkit-box;
                                -webkit-box-orient: vertical;
                                line-clamp: 1;
                            "
                            @click="showWorldDialog(currentInstanceWorld.ref.id)">
                            <el-icon
                                v-if="
                                    currentUser.$homeLocation &&
                                    currentUser.$homeLocation.worldId === currentInstanceWorld.ref.id
                                "
                                style="margin-right: 5px"
                                ><HomeFilled
                            /></el-icon>
                            {{ currentInstanceWorld.ref.name }}
                        </span>
                    </div>
                    <div>
                        <span
                            class="x-link x-grey"
                            style="font-family: monospace"
                            @click="showUserDialog(currentInstanceWorld.ref.authorId)"
                            v-text="currentInstanceWorld.ref.authorName"></span>
                    </div>
                    <div style="margin-top: 5px">
                        <el-tag
                            v-if="currentInstanceWorld.ref.$isLabs"
                            type="primary"
                            effect="plain"
                            size="small"
                            style="margin-right: 5px"
                            >{{ t('dialog.world.tags.labs') }}</el-tag
                        >
                        <el-tag
                            v-else-if="currentInstanceWorld.ref.releaseStatus === 'public'"
                            type="success"
                            effect="plain"
                            size="small"
                            style="margin-right: 5px"
                            >{{ t('dialog.world.tags.public') }}</el-tag
                        >
                        <el-tag
                            v-else-if="currentInstanceWorld.ref.releaseStatus === 'private'"
                            type="danger"
                            effect="plain"
                            size="small"
                            style="margin-right: 5px"
                            >{{ t('dialog.world.tags.private') }}</el-tag
                        >
                        <el-tooltip v-if="currentInstanceWorld.isPC" placement="top" content="PC">
                            <el-tag
                                class="x-tag-platform-pc"
                                type="info"
                                effect="plain"
                                size="small"
                                style="margin-right: 5px"
                                ><i class="ri-computer-line"></i>
                                <span
                                    v-if="currentInstanceWorld.bundleSizes['standalonewindows']"
                                    :class="['x-grey', 'x-tag-platform-pc', 'x-tag-border-left']"
                                    >{{ currentInstanceWorld.bundleSizes['standalonewindows'].fileSize }}</span
                                >
                            </el-tag>
                        </el-tooltip>
                        <el-tooltip v-if="currentInstanceWorld.isQuest" placement="top" content="Android">
                            <el-tag
                                class="x-tag-platform-quest"
                                type="info"
                                effect="plain"
                                size="small"
                                style="margin-right: 5px"
                                ><i class="ri-android-line"></i>
                                <span
                                    v-if="currentInstanceWorld.bundleSizes['android']"
                                    :class="['x-grey', 'x-tag-platform-quest', 'x-tag-border-left']"
                                    >{{ currentInstanceWorld.bundleSizes['android'].fileSize }}</span
                                >
                            </el-tag>
                        </el-tooltip>
                        <el-tooltip v-if="currentInstanceWorld.isIos" placement="top" content="iOS">
                            <el-tag
                                class="x-tag-platform-ios"
                                type="info"
                                effect="plain"
                                size="small"
                                style="margin-right: 5px"
                                ><i class="ri-apple-line"></i>
                                <span
                                    v-if="currentInstanceWorld.bundleSizes['ios']"
                                    :class="['x-grey', 'x-tag-platform-ios', 'x-tag-border-left']"
                                    >{{ currentInstanceWorld.bundleSizes['ios'].fileSize }}</span
                                >
                            </el-tag>
                        </el-tooltip>
                        <el-tag
                            v-if="currentInstanceWorld.avatarScalingDisabled"
                            type="warning"
                            effect="plain"
                            size="small"
                            style="margin-right: 5px; margin-top: 5px"
                            >{{ t('dialog.world.tags.avatar_scaling_disabled') }}</el-tag
                        >
                        <el-tag
                            v-if="currentInstanceWorld.inCache"
                            type="info"
                            effect="plain"
                            size="small"
                            style="margin-right: 5px">
                            <span>{{ currentInstanceWorld.cacheSize }} {{ t('dialog.world.tags.cache') }}</span>
                        </el-tag>
                    </div>
                    <div style="margin-top: 5px">
                        <LocationWorld :locationobject="currentInstanceLocation" :currentuserid="currentUser.id" />
                        <span v-if="lastLocation.playerList.size > 0" style="margin-left: 5px">
                            {{ lastLocation.playerList.size }}
                            <template v-if="lastLocation.friendList.size > 0"
                                >({{ lastLocation.friendList.size }})</template
                            >
                            &nbsp;&horbar; <Timer v-if="lastLocation.date" :epoch="lastLocation.date" />
                        </span>
                    </div>
                    <div style="margin-top: 5px">
                        <span
                            v-show="currentInstanceWorld.ref.name !== currentInstanceWorld.ref.description"
                            class="description"
                            v-text="currentInstanceWorld.ref.description"></span>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; margin-left: 20px">
                    <div class="x-friend-item" style="cursor: default">
                        <div class="detail">
                            <span class="name">{{ t('dialog.world.info.capacity') }}</span>
                            <span class="extra"
                                >{{ commaNumber(currentInstanceWorld.ref.recommendedCapacity) }} ({{
                                    commaNumber(currentInstanceWorld.ref.capacity)
                                }})</span
                            >
                        </div>
                    </div>
                    <div class="x-friend-item" style="cursor: default">
                        <div class="detail">
                            <span class="name">{{ t('dialog.world.info.last_updated') }}</span>
                            <span class="extra">{{ formatDateFilter(currentInstanceWorld.lastUpdated, 'long') }}</span>
                        </div>
                    </div>
                    <div class="x-friend-item" style="cursor: default">
                        <div class="detail">
                            <span class="name">{{ t('dialog.world.info.created_at') }}</span>
                            <span class="extra">{{
                                formatDateFilter(currentInstanceWorld.ref.created_at, 'long')
                            }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="photonLoggingEnabled" style="margin-bottom: 10px">
                <PhotonEventTable @show-chatbox-blacklist="showChatboxBlacklistDialog" />
            </div>

            <div class="current-instance-table">
                <DataTable
                    v-bind="currentInstanceUsersTable"
                    layout="table"
                    style="margin-top: 10px; cursor: pointer"
                    @row-click="selectCurrentInstanceRow">
                    <el-table-column :label="t('table.playerList.avatar')" width="70" prop="photo" fixed>
                        <template #default="scope">
                            <div v-if="userImage(scope.row.ref)" class="flex items-center pl-2">
                                <img :src="userImage(scope.row.ref)" class="friends-list-avatar" loading="lazy" />
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column :label="t('table.playerList.timer')" width="90" prop="timer" sortable fixed>
                        <template #default="scope">
                            <Timer :epoch="scope.row.timer" />
                        </template>
                    </el-table-column>
                    <el-table-column
                        class="table-user"
                        :label="t('table.playerList.displayName')"
                        width="200"
                        prop="displayName"
                        sortable
                        :sort-method="(a, b) => sortAlphabetically(a, b, 'displayName')"
                        fixed>
                        <template #default="scope">
                            <span
                                v-if="randomUserColours"
                                :style="{ color: scope.row.ref.$userColour }"
                                v-text="scope.row.ref.displayName"></span>
                            <span v-else v-text="scope.row.ref.displayName"></span>
                        </template>
                    </el-table-column>

                    <el-table-column
                        :label="t('table.playerList.rank')"
                        width="110"
                        prop="$trustSortNum"
                        :sortable="true">
                        <template #default="scope">
                            <span
                                class="name"
                                :class="scope.row.ref.$trustClass"
                                v-text="scope.row.ref.$trustLevel"></span>
                        </template>
                    </el-table-column>
                    <el-table-column :label="t('table.playerList.status')" min-width="200" prop="ref.status">
                        <template #default="scope">
                            <template v-if="scope.row.ref.status">
                                <i
                                    class="x-user-status"
                                    :class="statusClass(scope.row.ref.status)"
                                    style="margin-right: 3px"></i>
                                <span v-text="scope.row.ref.statusDescription"></span>
                                <!--//- el-table-column(label="Group" min-width="180" prop="groupOnNameplate" sortable)-->
                                <!--//-     template(v-once #default="scope")-->
                                <!--//-         span(v-text="scope.row.groupOnNameplate")-->
                            </template>
                        </template>
                    </el-table-column>
                    <el-table-column
                        v-if="photonLoggingEnabled"
                        :label="t('table.playerList.photonId')"
                        width="110"
                        prop="photonId"
                        sortable>
                        <template #default="scope">
                            <template v-if="chatboxUserBlacklist.has(scope.row.ref.id)">
                                <el-tooltip placement="left" content="Unblock chatbox messages">
                                    <el-button
                                        text
                                        :icon="Mute"
                                        size="small"
                                        style="color: red; margin-right: 5px"
                                        @click.stop="deleteChatboxUserBlacklist(scope.row.ref.id)"></el-button>
                                </el-tooltip>
                            </template>
                            <template v-else>
                                <el-tooltip placement="left" content="Block chatbox messages">
                                    <el-button
                                        text
                                        :icon="Microphone"
                                        size="small"
                                        style="margin-right: 5px"
                                        @click.stop="addChatboxUserBlacklist(scope.row.ref)"></el-button>
                                </el-tooltip>
                            </template>
                            <span v-text="scope.row.photonId"></span>
                        </template>
                    </el-table-column>
                    <el-table-column
                        :label="t('table.playerList.icon')"
                        prop="isMaster"
                        width="90"
                        align="center"
                        sortable
                        :sort-method="sortInstanceIcon">
                        <template #default="scope">
                            <span></span>
                            <el-tooltip v-if="scope.row.isMaster" placement="left" content="Instance Master">
                                <span>👑</span>
                            </el-tooltip>
                            <el-tooltip v-if="scope.row.isModerator" placement="left" content="Moderator">
                                <span>⚔️</span>
                            </el-tooltip>
                            <el-tooltip v-if="scope.row.isFriend" placement="left" content="Friend">
                                <span>💚</span>
                            </el-tooltip>
                            <el-tooltip v-if="scope.row.isBlocked" placement="left" content="Blocked">
                                <el-icon style="color: red"><CircleClose /></el-icon>
                            </el-tooltip>
                            <el-tooltip v-if="scope.row.isMuted" placement="left" content="Muted">
                                <el-icon style="color: var(--el-color-warning)"><Mute /></el-icon>
                            </el-tooltip>
                            <el-tooltip
                                v-if="scope.row.isAvatarInteractionDisabled"
                                placement="left"
                                content="Avatar Interaction Disabled
                                    ">
                                <el-icon style="color: var(--el-color-warning)"><Pointer /></el-icon>
                            </el-tooltip>
                            <el-tooltip v-if="scope.row.isChatBoxMuted" placement="left" content="Chatbox Muted">
                                <el-icon style="color: var(--el-color-warning)"><ChatLineRound /></el-icon>
                            </el-tooltip>
                            <el-tooltip v-if="scope.row.timeoutTime" placement="left" content="Timeout">
                                <span style="color: var(--el-color-danger)">🔴{{ scope.row.timeoutTime }}s</span>
                            </el-tooltip>
                            <el-tooltip v-if="scope.row.ageVerified" placement="left" content="18+ Verified">
                                <i class="ri-id-card-line"></i>
                            </el-tooltip>
                        </template>
                    </el-table-column>
                    <el-table-column :label="t('table.playerList.platform')" prop="inVRMode" width="90">
                        <template #default="scope">
                            <template v-if="scope.row.ref.$platform">
                                <span
                                    v-if="scope.row.ref.$platform === 'standalonewindows'"
                                    style="color: var(--el-color-primary)"
                                    ><i class="ri-computer-line"></i
                                ></span>
                                <span
                                    v-else-if="scope.row.ref.$platform === 'android'"
                                    style="color: var(--el-color-success)"
                                    ><i class="ri-android-line"></i
                                ></span>
                                <span v-else-if="scope.row.ref.$platform === 'ios'" style="color: var(--el-color-info)"
                                    ><i class="ri-apple-line"></i
                                ></span>
                                <span v-else>{{ scope.row.ref.$platform }}</span>
                            </template>
                            <template v-if="scope.row.inVRMode !== null">
                                <span v-if="scope.row.inVRMode">VR</span>
                                <span
                                    v-else-if="
                                        scope.row.ref.last_platform === 'android' ||
                                        scope.row.ref.last_platform === 'ios'
                                    "
                                    >M</span
                                >
                                <span v-else>D</span>
                            </template>
                        </template>
                    </el-table-column>
                    <el-table-column :label="t('table.playerList.language')" width="100" prop="ref.$languages">
                        <template #default="scope">
                            <el-tooltip v-for="item in scope.row.ref.$languages" :key="item.key" placement="top">
                                <template #content>
                                    <span>{{ item.value }} ({{ item.key }})</span>
                                </template>
                                <span
                                    class="flags"
                                    :class="languageClass(item.key)"
                                    style="display: inline-block; margin-right: 5px"></span>
                            </el-tooltip>
                        </template>
                    </el-table-column>
                    <el-table-column :label="t('table.playerList.bioLink')" width="100" prop="ref.bioLinks">
                        <template #default="scope">
                            <div style="display: flex; align-items: center">
                                <el-tooltip
                                    v-for="(link, index) in scope.row.ref.bioLinks?.filter(Boolean)"
                                    :key="index">
                                    <template #content>
                                        <span v-text="link"></span>
                                    </template>
                                    <img
                                        :src="getFaviconUrl(link)"
                                        style="
                                            width: 16px;
                                            height: 16px;
                                            vertical-align: middle;
                                            margin-right: 5px;
                                            cursor: pointer;
                                        "
                                        @click.stop="openExternalLink(link)"
                                        loading="lazy" />
                                </el-tooltip>
                            </div>
                        </template>
                    </el-table-column>
                    <el-table-column :label="t('table.playerList.note')" width="400" prop="ref.note">
                        <template #default="scope">
                            <span v-text="scope.row.ref.note"></span>
                        </template>
                    </el-table-column>
                </DataTable>
            </div>
        </div>
        <ChatboxBlacklistDialog
            :chatbox-blacklist-dialog="chatboxBlacklistDialog"
            @delete-chatbox-user-blacklist="deleteChatboxUserBlacklist" />
    </div>
</template>

<script setup>
    import { ChatLineRound, CircleClose, HomeFilled, Microphone, Mute, Pointer } from '@element-plus/icons-vue';
    import { computed, defineAsyncComponent, onMounted, onUnmounted, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        commaNumber,
        formatDateFilter,
        getFaviconUrl,
        languageClass,
        openExternalLink,
        statusClass,
        userImage
    } from '../../shared/utils';
    import {
        useAppearanceSettingsStore,
        useGalleryStore,
        useInstanceStore,
        useLocationStore,
        usePhotonStore,
        useUserStore,
        useWorldStore
    } from '../../stores';

    import ChatboxBlacklistDialog from './dialogs/ChatboxBlacklistDialog.vue';

    const PhotonEventTable = defineAsyncComponent(() => import('./components/PhotonEventTable.vue'));

    const { randomUserColours } = storeToRefs(useAppearanceSettingsStore());
    const photonStore = usePhotonStore();
    const { photonLoggingEnabled, chatboxUserBlacklist } = storeToRefs(photonStore);
    const { saveChatboxUserBlacklist } = photonStore;
    const { showUserDialog, lookupUser } = useUserStore();
    const { showWorldDialog } = useWorldStore();
    const { lastLocation } = storeToRefs(useLocationStore());
    const { currentInstanceLocation, currentInstanceWorld } = storeToRefs(useInstanceStore());
    const { getCurrentInstanceUserList } = useInstanceStore();
    const { currentInstanceUsersTable } = storeToRefs(useInstanceStore());
    const { showFullscreenImageDialog } = useGalleryStore();
    const { currentUser } = storeToRefs(useUserStore());

    const playerListRef = ref(null);
    const tableHeight = ref(0);

    onMounted(() => {
        if (playerListRef.value) {
            resizeObserver.observe(playerListRef.value);
        }
    });

    const resizeObserver = new ResizeObserver(() => {
        setPlayerListTableHeight();
    });

    function setPlayerListTableHeight() {
        if (currentInstanceWorld.value.ref.id) {
            tableHeight.value = playerListRef.value.clientHeight - 110;
            return;
        }
        if (currentInstanceUsersTable.value.data.length === 0) {
            tableHeight.value = playerListRef.value.clientHeight;
            return;
        }
        if (playerListRef.value) {
            tableHeight.value = playerListRef.value.clientHeight - 110;
        }
    }

    watch(
        () => currentInstanceWorld.value.ref.id,
        () => {
            setPlayerListTableHeight();
        }
    );

    onUnmounted(() => {
        resizeObserver.disconnect();
    });

    const compactCellStyle = () => ({
        padding: '4px 10px'
    });

    const compactInstanceUsersTable = computed(() => {
        const baseTableConfig = currentInstanceUsersTable.value;
        const tableProps = baseTableConfig.tableProps || {};

        return {
            ...baseTableConfig,
            tableProps: {
                ...tableProps,
                cellStyle: compactCellStyle,
                headerCellStyle: compactCellStyle,
                height: tableHeight.value
            }
        };
    });

    const { t } = useI18n();

    const chatboxBlacklistDialog = ref({
        visible: false,
        loading: false
    });

    function showChatboxBlacklistDialog() {
        const D = chatboxBlacklistDialog.value;
        D.visible = true;
    }

    function selectCurrentInstanceRow(val) {
        if (val === null) {
            return;
        }
        const ref = val.ref;
        if (ref.id) {
            showUserDialog(ref.id);
        } else {
            lookupUser(ref);
        }
    }

    async function deleteChatboxUserBlacklist(userId) {
        chatboxUserBlacklist.value.delete(userId);
        await saveChatboxUserBlacklist();
        getCurrentInstanceUserList();
    }

    async function addChatboxUserBlacklist(user) {
        chatboxUserBlacklist.value.set(user.id, user.displayName);
        await saveChatboxUserBlacklist();
        getCurrentInstanceUserList();
    }

    function sortInstanceIcon(a, b) {
        const getValue = (item) => {
            let value = 0;
            if (item.isMaster) value += 1000;
            if (item.isModerator) value += 500;
            if (item.isFriend) value += 200;
            if (item.isBlocked) value -= 100;
            if (item.isMuted) value -= 50;
            if (item.isAvatarInteractionDisabled) value -= 20;
            if (item.isChatBoxMuted) value -= 10;
            return value;
        };
        return getValue(b) - getValue(a);
    }

    function sortAlphabetically(a, b, field) {
        if (!a[field] || !b[field]) return 0;
        return a[field].toLowerCase().localeCompare(b[field].toLowerCase());
    }
</script>

<style>
    .description {
        font-size: 12px;
        display: inline-block;
        max-width: 100%;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        vertical-align: middle;
    }
    #x-app .current-instance-table .el-table .el-table__cell {
        padding: 3px 10px !important;
    }
    .table-user {
        color: var(--x-table-user-text-color);
    }
    .friends-list-avatar {
        width: 16px !important;
        height: 16px !important;
        object-fit: cover;
    }
</style>
