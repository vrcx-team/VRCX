<template>
    <div class="x-container x-container--auto-height" ref="friendsListRef">
        <div class="flex-1 min-h-0 flex flex-col">
            <DataTableLayout
                class="min-w-0 w-full"
                :table="table"
                :loading="friendsListLoading"
                auto-height
                :page-sizes="pageSizes"
                :total-items="totalItems"
                table-class="min-w-max w-max [&_tbody_tr]:cursor-pointer"
                :on-page-size-change="handlePageSizeChange"
                :on-row-click="handleRowClick">
                <template #toolbar>
                    <div class="mb-2 flex items-center justify-between">
                        <div class="flex flex-none mr-2 items-center">
                            <TooltipWrapper side="bottom" :content="t('view.friend_list.favorites_only_tooltip')">
                                <div>
                                    <Toggle
                                        variant="outline"
                                        size="sm"
                                        :model-value="friendsListSearchFilterVIP"
                                        @update:modelValue="
                                            (v) => {
                                                friendsListSearchFilterVIP = v;
                                                friendsListSearchChange();
                                            }
                                        ">
                                        <Star />
                                    </Toggle>
                                </div>
                            </TooltipWrapper>
                            <Select
                                multiple
                                :model-value="Array.isArray(friendsListSearchFilters) ? friendsListSearchFilters : []"
                                @update:modelValue="handleFriendListFilterChange">
                                <SelectTrigger class="mx-2 w-37.5">
                                    <SelectValue :placeholder="t('view.friend_list.filter_placeholder')" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectGroup>
                                        <SelectItem
                                            v-for="type in [
                                                'Display Name',
                                                'User Name',
                                                'Rank',
                                                'Status',
                                                'Bio',
                                                'Note',
                                                'Memo'
                                            ]"
                                            :key="type"
                                            :value="type">
                                            {{ type }}
                                        </SelectItem>
                                    </SelectGroup>
                                </SelectContent>
                            </Select>
                            <InputGroupField
                                v-model="friendsListSearch"
                                :placeholder="t('view.friend_list.search_placeholder')"
                                clearable
                                class="w-[250px]"
                                @input="scheduleFriendsListSearchChange"
                                @change="friendsListSearchChange" />
                        </div>
                        <div class="flex items-center">
                            <div v-if="friendsListBulkUnfriendMode" class="inline-block mr-2">
                                <Button variant="outline" @click="showBulkUnfriendSelectionConfirm">
                                    {{ t('view.friend_list.bulk_unfriend_selection') }}
                                </Button>
                                <!-- el-button(size="small" @click="showBulkUnfriendAllConfirm") Bulk Unfriend All-->
                            </div>
                            <div class="flex items-center mr-2">
                                <span class="name mr-2 text-xs">{{ t('view.friend_list.bulk_unfriend') }}</span>
                                <Switch
                                    v-model="friendsListBulkUnfriendMode"
                                    @update:modelValue="toggleFriendsListBulkUnfriendMode" />
                            </div>
                            <div class="flex items-center">
                                <TooltipWrapper
                                    v-if="isMutualFetching"
                                    :content="t('view.friend_list.mutual_loading_hint')">
                                    <span>
                                        <Button variant="outline" class="mr-2" disabled>
                                            <Loader2 class="h-4 w-4 animate-spin" />
                                            {{ t('view.friend_list.load_mutual_friends') }}
                                        </Button>
                                    </span>
                                </TooltipWrapper>
                                <Button
                                    v-else
                                    variant="outline"
                                    class="mr-2"
                                    :disabled="isMutualOptOut"
                                    @click="loadMutualFriends">
                                    {{ t('view.friend_list.load_mutual_friends') }}
                                </Button>

                                <Button variant="outline" @click="friendsListLoadUsers">{{
                                    t('view.friend_list.load')
                                }}</Button>
                            </div>
                        </div>
                    </div>
                </template>
            </DataTableLayout>
            <Dialog v-model:open="friendsListLoadDialogVisible">
                <DialogContent
                    :show-close-button="false"
                    @interact-outside.prevent
                    @escape-key-down.prevent
                    class="sm:max-w-[420px]">
                    <DialogHeader>
                        <DialogTitle>{{ t('view.friend_list.load_dialog_title') }}</DialogTitle>
                    </DialogHeader>
                    <div style="margin-bottom: 8px" v-text="t('view.friend_list.load_dialog_message')"></div>
                    <div class="flex items-center gap-2">
                        <Progress :model-value="friendsListLoadingPercent" class="h-4 w-full" />
                        <span class="text-xs w-10 text-right">{{ friendsListLoadingPercent }}%</span>
                    </div>
                    <div style="margin-top: 8px; text-align: right">
                        <span>{{ friendsListLoadingCurrent }} / {{ friendsListLoadingTotal }}</span>
                    </div>
                    <DialogFooter>
                        <Button variant="secondary" @click="cancelFriendsListLoad">
                            {{ t('view.friend_list.load_cancel') }}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    </div>
</template>

<script setup>
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { InputGroupField } from '@/components/ui/input-group';
    import { Progress } from '@/components/ui/progress';
    import { Star } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';
    import { useRoute } from 'vue-router';
    import { Loader2 } from 'lucide-vue-next';

    import {
        useAppearanceSettingsStore,
        useChartsStore,
        useFriendStore,
        useModalStore,
        useSearchStore,
        useUserStore
    } from '../../stores';
    import { friendRequest, userRequest } from '../../api';
    import { DataTableLayout } from '../../components/ui/data-table';
    import { Switch } from '../../components/ui/switch';
    import { Toggle } from '../../components/ui/toggle';
    import { TooltipWrapper } from '../../components/ui/tooltip';
    import { createColumns } from './columns.jsx';
    import { localeIncludes } from '../../shared/utils';
    import removeConfusables, { removeWhitespace } from '../../services/confusables';
    import { useVrcxVueTable } from '../../lib/table/useVrcxVueTable';
    import { showUserDialog } from '../../coordinators/userCoordinator';
    import { confirmDeleteFriend, handleFriendDelete } from '../../coordinators/friendRelationshipCoordinator';
    import { useUserDisplay } from '../../composables/useUserDisplay';

    const { t } = useI18n();

    const emit = defineEmits(['lookup-user']);

    const { friends, allFavoriteFriendIds } = storeToRefs(useFriendStore());
    const modalStore = useModalStore();
    const { getAllUserStats, getAllUserMutualCount, getAllUserMutualOptedOut } = useFriendStore();
    const chartsStore = useChartsStore();
    const isMutualFetching = computed(() => chartsStore.mutualGraphStatus.isFetching);
    const isMutualOptOut = computed(() => Boolean(useUserStore().currentUser?.hasSharedConnectionsOptOut));
    const appearanceSettingsStore = useAppearanceSettingsStore();
    const { randomUserColours } = storeToRefs(appearanceSettingsStore);
    const { userImage } = useUserDisplay();

    const { stringComparer, friendsListSearch } = storeToRefs(useSearchStore());

    const friendsListSearchFilters = ref([]);
    const friendsListBulkUnfriendMode = ref(false);
    const friendsListLoading = ref(false);
    const friendsListLoadingCurrent = ref(0);
    const friendsListLoadingTotal = ref(0);
    const friendsListLoadDialogVisible = ref(false);
    const friendsListSearchFilterVIP = ref(false);
    const selectedFriends = ref(new Set());
    const friendsListDisplayData = ref([]);
    const pageSizes = computed(() => appearanceSettingsStore.tablePageSizes);
    const defaultSorting = [{ id: 'friendNumber', desc: true }];

    // const initialColumnPinning = {
    //     left: ['displayName'],
    //     right: []
    // };

    const friendsListLoadingPercent = computed(() => {
        if (!friendsListLoadingTotal.value) return 0;
        return Math.min(100, Math.round((friendsListLoadingCurrent.value / friendsListLoadingTotal.value) * 100));
    });

    const friendsListRef = ref(null);
    const friendSearchCache = new Map();
    const FRIEND_LIST_SEARCH_DEBOUNCE_MS = 150;
    const FRIEND_STATS_REFRESH_INTERVAL_MS = 30000;
    let friendsListSearchTimer = 0;
    let friendStatsRefreshInFlight = null;
    let lastFriendStatsRefreshAt = 0;
    let lastFriendStatsRefreshKey = '';

    const friendsListColumns = computed(() =>
        createColumns({
            randomUserColours,
            selectedFriends,
            onToggleFriendSelection: toggleFriendSelection,
            onConfirmDeleteFriend: confirmDeleteFriend,
            userImage
        })
    );

    const { table, sorting, pagination } = useVrcxVueTable({
        persistKey: 'friendList',
        get data() {
            return friendsListDisplayData.value;
        },
        columns: friendsListColumns.value,
        getRowId: (row) => row?.id ?? row?.displayName ?? '',
        enablePinning: true,
        // initialColumnPinning,
        initialSorting: defaultSorting,
        initialPagination: {
            pageIndex: 0,
            pageSize: appearanceSettingsStore.tablePageSize
        }
    });

    const totalItems = computed(() => {
        return table.getFilteredRowModel().rows.length;
    });

    const handlePageSizeChange = (size) => {
        pagination.value = {
            ...pagination.value,
            pageIndex: 0,
            pageSize: size
        };
    };

    const handleRowClick = (row) => {
        selectFriendsListRow(row?.original ?? null);
    };

    watch(
        friendsListColumns,
        (next) => {
            table.setOptions((prev) => ({
                ...prev,
                columns: /** @type {any} */ (next)
            }));
        },
        { immediate: true }
    );

    watch(
        friendsListBulkUnfriendMode,
        (enabled) => {
            const column = table?.getColumn?.('bulkSelect');
            if (!column) {
                return;
            }
            column.toggleVisibility(Boolean(enabled));
        },
        { immediate: true }
    );

    const route = useRoute();

    watch(
        () => route.path,
        () => {
            refreshFriendStats();
            nextTick(() => applyFriendsListSearchChange());
        },
        { immediate: true }
    );

    watch(
        () => friends.value.size,
        () => {
            friendSearchCache.clear();
            refreshFriendStats({ force: true });
            applyFriendsListSearchChange();
        }
    );

    onBeforeUnmount(() => {
        if (friendsListSearchTimer) {
            clearTimeout(friendsListSearchTimer);
        }
    });

    function getFriendStatsRefreshKey() {
        return Array.from(friends.value.keys()).sort().join('\u0000');
    }

    async function refreshFriendStats({ force = false } = {}) {
        const friendStatsRefreshKey = getFriendStatsRefreshKey();
        if (!friendStatsRefreshKey) {
            return;
        }
        const now = Date.now();
        const isStillFresh =
            friendStatsRefreshKey === lastFriendStatsRefreshKey &&
            now - lastFriendStatsRefreshAt < FRIEND_STATS_REFRESH_INTERVAL_MS;
        if (!force && (friendStatsRefreshInFlight || isStillFresh)) {
            return friendStatsRefreshInFlight;
        }
        friendStatsRefreshInFlight = Promise.allSettled([
            getAllUserStats(),
            getAllUserMutualCount(),
            getAllUserMutualOptedOut()
        ])
            .then((results) => {
                if (results.every((result) => result.status === 'fulfilled')) {
                    lastFriendStatsRefreshAt = Date.now();
                    lastFriendStatsRefreshKey = friendStatsRefreshKey;
                }
                return results;
            })
            .finally(() => {
                friendStatsRefreshInFlight = null;
            });
        return friendStatsRefreshInFlight;
    }

    /**
     *
     */
    function scheduleFriendsListSearchChange() {
        if (friendsListSearchTimer) {
            clearTimeout(friendsListSearchTimer);
        }
        friendsListSearchTimer = setTimeout(() => {
            friendsListSearchTimer = 0;
            applyFriendsListSearchChange();
        }, FRIEND_LIST_SEARCH_DEBOUNCE_MS);
    }

    /**
     *
     */
    function friendsListSearchChange() {
        if (friendsListSearchTimer) {
            clearTimeout(friendsListSearchTimer);
            friendsListSearchTimer = 0;
        }
        applyFriendsListSearchChange();
    }

    /**
     *
     * @param {object} ctx
     * @returns {object | null}
     */
    function getFriendSearchEntry(ctx) {
        if (!ctx?.ref?.id) {
            return null;
        }
        const signature = [
            ctx.memo ?? '',
            ctx.ref.displayName ?? '',
            ctx.ref.note ?? '',
            ctx.ref.bio ?? '',
            ctx.ref.statusDescription ?? '',
            ctx.ref.$trustLevel ?? ''
        ].join('\u0000');
        const cached = friendSearchCache.get(ctx.id);
        if (cached?.signature === signature) {
            return cached;
        }
        const entry = {
            signature,
            bio: ctx.ref.bio ?? '',
            displayName: ctx.ref.displayName ?? '',
            memo: ctx.memo ?? '',
            normalizedDisplayName: removeConfusables(ctx.ref.displayName ?? ''),
            note: ctx.ref.note ?? '',
            rank: String(ctx.ref.$trustLevel ?? '').toUpperCase(),
            status: ctx.ref.statusDescription ?? ''
        };
        friendSearchCache.set(ctx.id, entry);
        return entry;
    }

    /**
     *
     */
    function applyFriendsListSearchChange() {
        friendsListLoading.value = true;
        let query = '';
        let cleanedQuery = '';
        let upperQuery = '';
        friendsListDisplayData.value = [];
        let filters = friendsListSearchFilters.value.length
            ? [...friendsListSearchFilters.value]
            : ['Display Name', 'Rank', 'Status', 'Bio', 'Note', 'Memo'];
        const results = [];
        if (friendsListSearch.value) {
            query = friendsListSearch.value;
            cleanedQuery = removeWhitespace(query);
            upperQuery = query.toUpperCase();
        }
        for (const ctx of friends.value.values()) {
            if (!ctx.ref) continue;
            if (friendsListSearchFilterVIP.value && !allFavoriteFriendIds.value.has(ctx.id)) continue;
            if (query) {
                let match = false;
                const searchEntry = getFriendSearchEntry(ctx);
                if (!searchEntry) continue;
                if (!match && filters.includes('Display Name') && searchEntry.displayName) {
                    match =
                        localeIncludes(searchEntry.displayName, cleanedQuery, stringComparer.value) ||
                        localeIncludes(searchEntry.normalizedDisplayName, cleanedQuery, stringComparer.value);
                }
                if (!match && filters.includes('Memo') && searchEntry.memo) {
                    match = localeIncludes(searchEntry.memo, query, stringComparer.value);
                }
                if (!match && filters.includes('Note') && searchEntry.note) {
                    match = localeIncludes(searchEntry.note, query, stringComparer.value);
                }
                if (!match && filters.includes('Bio') && searchEntry.bio) {
                    match = localeIncludes(searchEntry.bio, query, stringComparer.value);
                }
                if (!match && filters.includes('Status') && searchEntry.status) {
                    match = localeIncludes(searchEntry.status, query, stringComparer.value);
                }
                if (!match && filters.includes('Rank')) {
                    match = searchEntry.rank.includes(upperQuery);
                }
                if (!match) continue;
            }
            results.push(ctx.ref);
        }
        friendsListDisplayData.value = results;
        table.setPageIndex(0);
        table.setSorting([...defaultSorting]);
        sorting.value = [...defaultSorting];
        nextTick(() => {
            friendsListLoading.value = false;
        });
    }

    /**
     *
     * @param id
     */
    function toggleFriendSelection(id) {
        if (selectedFriends.value.has(id)) {
            selectedFriends.value.delete(id);
        } else {
            selectedFriends.value.add(id);
        }
    }

    /**
     *
     */
    function toggleFriendsListBulkUnfriendMode() {
        if (!friendsListBulkUnfriendMode.value) {
            selectedFriends.value.clear();
        }
    }

    /**
     *
     */
    function showBulkUnfriendSelectionConfirm() {
        const pending = friendsListDisplayData.value
            .filter((item) => selectedFriends.value.has(item.id))
            .map((item) => item.displayName);
        if (!pending.length) return;
        const description =
            `Are you sure you want to delete ${pending.length} friends?\n` +
            'This can negatively affect your trust rank,\n' +
            'This action cannot be undone.\n\n' +
            pending.join('\n');

        modalStore
            .confirm({
                description,
                title: `Delete ${pending.length} friends?`
            })
            .then(({ ok }) => ok && bulkUnfriendSelection())
            .catch(() => {});
    }

    /**
     *
     */
    async function bulkUnfriendSelection() {
        if (!selectedFriends.value.size) return;
        const selectedFriendsCount = selectedFriends.value.size;
        for (const item of friendsListDisplayData.value) {
            if (selectedFriends.value.has(item.id)) {
                console.log(`Unfriending ${item.displayName} (${item.id})`);
                await friendRequest.deleteFriend({ userId: item.id }).then((args) => handleFriendDelete(args));
                selectedFriends.value.delete(item.id);
            }
        }
        modalStore.alert({
            description: `Unfriended ${selectedFriendsCount} friends.`,
            title: 'Bulk Unfriend Complete'
        });
        selectedFriends.value.clear();
    }

    /**
     *
     */
    async function friendsListLoadUsers() {
        const toFetch = Array.from(friends.value.values())
            .filter((ctx) => ctx.ref && !ctx.ref.date_joined)
            .map((ctx) => ctx.id);
        const total = toFetch.length;
        friendsListLoadingTotal.value = total;
        friendsListLoadingCurrent.value = 0;
        if (!total) {
            toast.success(t('view.friend_list.load_complete'));
            return;
        }
        friendsListLoading.value = true;
        friendsListLoadDialogVisible.value = true;
        let cancelled = false;
        for (const userId of toFetch) {
            if (!friendsListLoading.value) {
                cancelled = true;
                break;
            }
            friendsListLoadingCurrent.value += 1;
            try {
                await userRequest.getUser({ userId });
            } catch (err) {
                console.error(err);
            }
        }
        friendsListLoading.value = false;
        friendsListLoadDialogVisible.value = false;
        friendsListLoadingCurrent.value = 0;
        friendsListLoadingTotal.value = 0;
        if (!cancelled) {
            toast.success(t('view.friend_list.load_complete'));
        }
    }

    /**
     *
     */
    function cancelFriendsListLoad() {
        friendsListLoading.value = false;
        friendsListLoadDialogVisible.value = false;
    }

    /**
     *
     * @param val
     */
    function selectFriendsListRow(val) {
        if (!val) return;
        if (!val.id) emit('lookup-user', val);
        else showUserDialog(val.id);
    }

    /**
     *
     */
    async function loadMutualFriends() {
        if (isMutualFetching.value) return;
        await chartsStore.fetchMutualGraph();
        await Promise.allSettled([getAllUserMutualCount(), getAllUserMutualOptedOut()]);
    }

    /**
     *
     * @param value
     */
    function handleFriendListFilterChange(value) {
        friendsListSearchFilters.value = Array.isArray(value) ? value : [];
        friendsListSearchChange();
    }
</script>
