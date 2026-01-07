<template>
    <div class="x-container" ref="playerListRef">
        <div class="flex h-full min-h-0 flex-col">
            <div
                v-if="currentInstanceWorld.ref.id"
                ref="playerListHeaderRef"
                style="display: flex; height: 120px"
                class="mb-7">
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
                        <TooltipWrapper v-if="currentInstanceWorld.isPC" side="top" content="PC">
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
                        </TooltipWrapper>
                        <TooltipWrapper v-if="currentInstanceWorld.isQuest" side="top" content="Android">
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
                        </TooltipWrapper>
                        <TooltipWrapper v-if="currentInstanceWorld.isIos" side="top" content="iOS">
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
                        </TooltipWrapper>
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

            <div v-if="photonLoggingEnabled" ref="playerListPhotonRef" style="margin-bottom: 10px">
                <PhotonEventTable @show-chatbox-blacklist="showChatboxBlacklistDialog" />
            </div>

            <div class="current-instance-table flex min-h-0 flex-1">
                <DataTableLayout
                    class="[&_th]:px-2.5! [&_th]:py-0.75! [&_td]:px-2.5! [&_td]:py-0.75! [&_tr]:h-7!"
                    :table="playerListTable"
                    :table-style="playerListTableStyle"
                    :loading="false"
                    :total-items="playerListTotalItems"
                    :show-pagination="false"
                    :on-row-click="handlePlayerListRowClick" />
            </div>
        </div>
        <ChatboxBlacklistDialog
            :chatbox-blacklist-dialog="chatboxBlacklistDialog"
            @delete-chatbox-user-blacklist="deleteChatboxUserBlacklist" />
    </div>
</template>

<script setup>
    import { computed, defineAsyncComponent, onActivated, onMounted, ref, watch } from 'vue';
    import { getCoreRowModel, getPaginationRowModel, getSortedRowModel, useVueTable } from '@tanstack/vue-table';
    import { HomeFilled } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import {
        useAppearanceSettingsStore,
        useGalleryStore,
        useInstanceStore,
        useLocationStore,
        usePhotonStore,
        useUserStore,
        useWorldStore
    } from '../../stores';
    import { commaNumber, formatDateFilter } from '../../shared/utils';
    import { DataTableLayout } from '../../components/ui/data-table';
    import { createColumns } from './columns.jsx';
    import { useDataTableScrollHeight } from '../../composables/useDataTableScrollHeight';
    import { valueUpdater } from '../../components/ui/table/utils';
    import { watchState } from '../../service/watchState';

    import ChatboxBlacklistDialog from './dialogs/ChatboxBlacklistDialog.vue';
    import Timer from '../../components/Timer.vue';

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
    const { currentInstanceUsersData } = storeToRefs(useInstanceStore());
    const { showFullscreenImageDialog } = useGalleryStore();
    const { currentUser } = storeToRefs(useUserStore());

    const playerListRef = ref(null);
    const playerListHeaderRef = ref(null);
    const playerListPhotonRef = ref(null);

    const { tableStyle: playerListTableStyle } = useDataTableScrollHeight(playerListRef, {
        offset: 30,
        paginationHeight: 0,
        subtractContainerPadding: true,
        extraOffsetRefs: [playerListHeaderRef, playerListPhotonRef]
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

    function sortAlphabetically(a, b, field) {
        if (!a[field] || !b[field]) return 0;
        return a[field].toLowerCase().localeCompare(b[field].toLowerCase());
    }

    const sorting = ref([]);
    const pagination = ref({
        pageIndex: 0,
        pageSize: 500
    });

    const columnPinning = ref({
        left: ['avatar', 'timer', 'displayName'],
        right: []
    });

    const playerListColumns = computed(() =>
        createColumns({
            randomUserColours,
            photonLoggingEnabled,
            chatboxUserBlacklist,
            onBlockChatbox: addChatboxUserBlacklist,
            onUnblockChatbox: deleteChatboxUserBlacklist,
            sortAlphabetically
        })
    );

    const playerListTable = useVueTable({
        data: currentInstanceUsersData.value,
        columns: playerListColumns.value,
        getRowId: (row) => `${row?.ref?.id ?? ''}:${row?.displayName ?? ''}`,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onSortingChange: (updaterOrValue) => valueUpdater(updaterOrValue, sorting),
        onPaginationChange: (updaterOrValue) => valueUpdater(updaterOrValue, pagination),
        onColumnPinningChange: (updaterOrValue) => valueUpdater(updaterOrValue, columnPinning),
        state: {
            get sorting() {
                return sorting.value;
            },
            get pagination() {
                return pagination.value;
            },
            get columnPinning() {
                return columnPinning.value;
            }
        },
        initialState: {
            columnPinning: columnPinning.value,
            pagination: pagination.value
        }
    });

    const playerListTotalItems = computed(() => playerListTable.getRowModel().rows.length);

    const handlePlayerListRowClick = (row) => {
        selectCurrentInstanceRow(row?.original ?? null);
    };
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
</style>
