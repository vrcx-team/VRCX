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
                            <Home
                                v-if="
                                    currentUser.$homeLocation &&
                                    currentUser.$homeLocation.worldId === currentInstanceWorld.ref.id
                                "
                                style="margin-right: 5px" />
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
                        <Badge v-if="currentInstanceWorld.ref.$isLabs" variant="outline" style="margin-right: 5px">
                            {{ t('dialog.world.tags.labs') }}
                        </Badge>
                        <Badge
                            v-else-if="currentInstanceWorld.ref.releaseStatus === 'public'"
                            variant="outline"
                            style="margin-right: 5px">
                            {{ t('dialog.world.tags.public') }}
                        </Badge>
                        <Badge
                            v-else-if="currentInstanceWorld.ref.releaseStatus === 'private'"
                            variant="outline"
                            style="margin-right: 5px">
                            {{ t('dialog.world.tags.private') }}
                        </Badge>
                        <TooltipWrapper v-if="currentInstanceWorld.isPC" side="top" content="PC">
                            <Badge class="x-tag-platform-pc" variant="outline" style="margin-right: 5px"
                                ><Monitor class="h-4 w-4" />
                                <span
                                    v-if="currentInstanceWorld.bundleSizes['standalonewindows']"
                                    :class="['x-grey', 'x-tag-platform-pc', 'x-tag-border-left']"
                                    >{{ currentInstanceWorld.bundleSizes['standalonewindows'].fileSize }}</span
                                >
                            </Badge>
                        </TooltipWrapper>
                        <TooltipWrapper v-if="currentInstanceWorld.isQuest" side="top" content="Android">
                            <Badge class="x-tag-platform-quest" variant="outline" style="margin-right: 5px"
                                ><Smartphone class="h-4 w-4" />
                                <span
                                    v-if="currentInstanceWorld.bundleSizes['android']"
                                    :class="['x-grey', 'x-tag-platform-quest', 'x-tag-border-left']"
                                    >{{ currentInstanceWorld.bundleSizes['android'].fileSize }}</span
                                >
                            </Badge>
                        </TooltipWrapper>
                        <TooltipWrapper v-if="currentInstanceWorld.isIos" side="top" content="iOS">
                            <Badge class="text-[#8e8e93] border-[#8e8e93]" variant="outline" style="margin-right: 5px"
                                ><Apple class="h-4 w-4 text-[#8e8e93]" />
                                <span
                                    v-if="currentInstanceWorld.bundleSizes['ios']"
                                    :class="['x-grey', 'x-tag-border-left', 'text-[#8e8e93]', 'border-[#8e8e93]']"
                                    >{{ currentInstanceWorld.bundleSizes['ios'].fileSize }}</span
                                >
                            </Badge>
                        </TooltipWrapper>
                        <Badge
                            v-if="currentInstanceWorld.avatarScalingDisabled"
                            variant="outline"
                            style="margin-right: 5px; margin-top: 5px">
                            {{ t('dialog.world.tags.avatar_scaling_disabled') }}
                        </Badge>
                        <Badge v-if="currentInstanceWorld.inCache" variant="outline" style="margin-right: 5px">
                            <span>{{ currentInstanceWorld.cacheSize }} {{ t('dialog.world.tags.cache') }}</span>
                        </Badge>
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
                            class="inline-block max-w-full truncate align-middle text-xs"
                            v-text="currentInstanceWorld.ref.description"></span>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; margin-left: 20px">
                    <div class="x-friend-item" style="cursor: default">
                        <div class="detail">
                            <span class="name">{{ t('dialog.world.info.capacity') }}</span>
                            <span class="block truncate text-xs"
                                >{{ commaNumber(currentInstanceWorld.ref.recommendedCapacity) }} ({{
                                    commaNumber(currentInstanceWorld.ref.capacity)
                                }})</span
                            >
                        </div>
                    </div>
                    <div class="x-friend-item" style="cursor: default">
                        <div class="detail">
                            <span class="name">{{ t('dialog.world.info.last_updated') }}</span>
                            <span class="block truncate text-xs">{{ formatDateFilter(currentInstanceWorld.lastUpdated, 'long') }}</span>
                        </div>
                    </div>
                    <div class="x-friend-item" style="cursor: default">
                        <div class="detail">
                            <span class="name">{{ t('dialog.world.info.created_at') }}</span>
                            <span class="block truncate text-xs">{{
                                formatDateFilter(currentInstanceWorld.ref.created_at, 'long')
                            }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="photonLoggingEnabled" ref="playerListPhotonRef" style="margin-bottom: 10px">
                <PhotonEventTable @show-chatbox-blacklist="showChatboxBlacklistDialog" />
            </div>

            <div class="current-instance-table flex min-h-0 min-w-0 flex-1">
                <DataTableLayout
                    class="min-w-0 w-full [&_th]:px-2.5! [&_th]:py-0.75! [&_td]:px-2.5! [&_td]:py-0.75! [&_tr]:h-7!"
                    :table="playerListTable"
                    table-class="min-w-max w-max"
                    :use-table-min-width="true"
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
    import { Apple, Home, Monitor, Smartphone } from 'lucide-vue-next';
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
    import { Badge } from '../../components/ui/badge';
    import { DataTableLayout } from '../../components/ui/data-table';
    import { createColumns } from './columns.jsx';
    import { useDataTableScrollHeight } from '../../composables/useDataTableScrollHeight';
    import { useVrcxVueTable } from '../../lib/table/useVrcxVueTable';

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
    const { currentInstanceLocation, currentInstanceWorld, currentInstanceUsersData } = storeToRefs(useInstanceStore());
    const { getCurrentInstanceUserList } = useInstanceStore();
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

    const initialColumnPinning = {
        left: ['avatar', 'timer', 'displayName'],
        right: []
    };

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

    const { table: playerListTable } = useVrcxVueTable({
        persistKey: 'playerList',
        data: currentInstanceUsersData,
        columns: playerListColumns.value,
        getRowId: (row) => `${row?.ref?.id ?? ''}:${row?.displayName ?? ''}`,
        enablePinning: true,
        initialColumnPinning,
        initialPagination: {
            pageIndex: 0,
            pageSize: 500
        }
    });

    watch(
        playerListColumns,
        (next) => {
            playerListTable.setOptions((prev) => ({
                ...prev,
                columns: next
            }));
        },
        { immediate: true }
    );

    const playerListTotalItems = computed(() => playerListTable.getRowModel().rows.length);

    const handlePlayerListRowClick = (row) => {
        selectCurrentInstanceRow(row?.original ?? null);
    };

    onMounted(() => {
        getCurrentInstanceUserList();
    });

    onActivated(() => {
        getCurrentInstanceUserList();
    });
</script>
