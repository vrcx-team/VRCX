<template>
    <div class="x-container" ref="friendsListRef">
        <div>
            <DataTableLayout
                class="min-w-0 w-full"
                :table="table"
                :loading="friendsListLoading"
                :table-style="tableHeightStyle"
                :page-sizes="pageSizes"
                :total-items="totalItems"
                table-class="min-w-max w-max [&_tbody_tr]:cursor-pointer"
                :on-page-size-change="handlePageSizeChange"
                :on-row-click="handleRowClick">
                <template #toolbar>
                    <div class="flex items-center justify-between">
                        <div class="flex flex-none mr-2 items-center">
                            <TooltipWrapper side="bottom" :content="t('view.friend_list.favorites_only_tooltip')">
                                <span class="inline-flex">
                                    <Switch
                                        v-model="friendsListSearchFilterVIP"
                                        @update:modelValue="friendsListSearchChange" />
                                </span>
                            </TooltipWrapper>
                            <Select
                                multiple
                                :model-value="Array.isArray(friendsListSearchFilters) ? friendsListSearchFilters : []"
                                @update:modelValue="handleFriendListFilterChange">
                                <SelectTrigger class="mx-2 w-[150px]">
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
                                @change="friendsListSearchChange" />
                        </div>
                        <div class="flex items-center">
                            <div v-if="friendsListBulkUnfriendMode" class="inline-block mr-2">
                                <Button variant="outline" @click="showBulkUnfriendSelectionConfirm">
                                    {{ t('view.friend_list.bulk_unfriend_selection') }}
                                </Button>
                                <!-- el-button(size="small" @click="showBulkUnfriendAllConfirm" style="margin-right:5px") Bulk Unfriend All-->
                            </div>
                            <div class="flex items-center mr-2">
                                <span class="name mr-2 text-xs">{{ t('view.friend_list.bulk_unfriend') }}</span>
                                <Switch
                                    v-model="friendsListBulkUnfriendMode"
                                    @update:modelValue="toggleFriendsListBulkUnfriendMode" />
                            </div>
                            <div class="flex items-center">
                                <Button variant="outline" class="mr-2" @click="openChartsTab">
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
                    <div style="margin-bottom: 10px" v-text="t('view.friend_list.load_dialog_message')"></div>
                    <div class="flex items-center gap-2">
                        <Progress :model-value="friendsListLoadingPercent" class="h-4 w-full" />
                        <span class="text-xs w-10 text-right">{{ friendsListLoadingPercent }}%</span>
                    </div>
                    <div style="margin-top: 10px; text-align: right">
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
    import { computed, nextTick, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { InputGroupField } from '@/components/ui/input-group';
    import { Progress } from '@/components/ui/progress';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';
    import { useRoute } from 'vue-router';

    import {
        useAppearanceSettingsStore,
        useFriendStore,
        useModalStore,
        useSearchStore,
        useUserStore,
        useVrcxStore
    } from '../../stores';
    import { friendRequest, userRequest } from '../../api';
    import { DataTableLayout } from '../../components/ui/data-table';
    import { Switch } from '../../components/ui/switch';
    import { createColumns } from './columns.jsx';
    import { localeIncludes } from '../../shared/utils';
    import removeConfusables, { removeWhitespace } from '../../service/confusables';
    import { router } from '../../plugin/router';
    import { useDataTableScrollHeight } from '../../composables/useDataTableScrollHeight';
    import { useVrcxVueTable } from '../../lib/table/useVrcxVueTable';

    const { t } = useI18n();

    const emit = defineEmits(['lookup-user']);

    const { friends } = storeToRefs(useFriendStore());
    const modalStore = useModalStore();
    const { getAllUserStats, getAllUserMutualCount, confirmDeleteFriend, handleFriendDelete } = useFriendStore();
    const { randomUserColours } = storeToRefs(useAppearanceSettingsStore());
    const vrcxStore = useVrcxStore();
    const { showUserDialog } = useUserStore();
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
    const pageSizes = [50, 100, 250, 500];
    const pageSize = ref(100);
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
    const { tableStyle: tableHeightStyle } = useDataTableScrollHeight(friendsListRef, {
        offset: 30,
        toolbarHeight: 54,
        paginationHeight: 52
    });

    const friendsListColumns = computed(() =>
        createColumns({
            randomUserColours,
            selectedFriends,
            onToggleFriendSelection: toggleFriendSelection,
            onConfirmDeleteFriend: confirmDeleteFriend
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
            pageSize: pageSize.value
        }
    });

    const totalItems = computed(() => {
        const length = table.getFilteredRowModel().rows.length;
        const max = vrcxStore.maxTableSize;
        return length > max && length < max + 51 ? max : length;
    });

    const handlePageSizeChange = (size) => {
        pageSize.value = size;
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

    watch(pageSize, (size) => {
        if (pagination.value.pageSize === size) {
            return;
        }
        pagination.value = {
            ...pagination.value,
            pageIndex: 0,
            pageSize: size
        };
        table.setPageSize(size);
    });

    const route = useRoute();

    watch(
        () => route.path,
        () => {
            nextTick(() => friendsListSearchChange());
        },
        { immediate: true }
    );

    watch(
        () => friends.value.size,
        () => {
            friendsListSearchChange();
        }
    );

    function friendsListSearchChange() {
        friendsListLoading.value = true;
        let query = '';
        let cleanedQuery = '';
        friendsListDisplayData.value = [];
        let filters = friendsListSearchFilters.value.length
            ? [...friendsListSearchFilters.value]
            : ['Display Name', 'Rank', 'Status', 'Bio', 'Note', 'Memo'];
        const results = [];
        if (friendsListSearch.value) {
            query = friendsListSearch.value;
            cleanedQuery = removeWhitespace(query);
        }
        for (const ctx of friends.value.values()) {
            if (!ctx.ref) continue;
            if (friendsListSearchFilterVIP.value && !ctx.isVIP) continue;
            if (query) {
                let match = false;
                if (!match && filters.includes('Display Name') && ctx.ref.displayName) {
                    match =
                        localeIncludes(ctx.ref.displayName, cleanedQuery, stringComparer.value) ||
                        localeIncludes(removeConfusables(ctx.ref.displayName), cleanedQuery, stringComparer.value);
                }
                if (!match && filters.includes('Memo') && ctx.memo) {
                    match = localeIncludes(ctx.memo, query, stringComparer.value);
                }
                if (!match && filters.includes('Note') && ctx.ref.note) {
                    match = localeIncludes(ctx.ref.note, query, stringComparer.value);
                }
                if (!match && filters.includes('Bio') && ctx.ref.bio) {
                    match = localeIncludes(ctx.ref.bio, query, stringComparer.value);
                }
                if (!match && filters.includes('Status') && ctx.ref.statusDescription) {
                    match = localeIncludes(ctx.ref.statusDescription, query, stringComparer.value);
                }
                if (!match && filters.includes('Rank')) {
                    match = String(ctx.ref.$trustLevel).toUpperCase().includes(query.toUpperCase());
                }
                if (!match) continue;
            }
            results.push(ctx.ref);
        }
        friendsListDisplayData.value = results;
        getAllUserStats();
        getAllUserMutualCount();
        table.setPageIndex(0);
        table.setSorting([...defaultSorting]);
        sorting.value = [...defaultSorting];
        nextTick(() => {
            friendsListLoading.value = false;
        });
    }

    function toggleFriendSelection(id) {
        if (selectedFriends.value.has(id)) {
            selectedFriends.value.delete(id);
        } else {
            selectedFriends.value.add(id);
        }
    }

    function toggleFriendsListBulkUnfriendMode() {
        if (!friendsListBulkUnfriendMode.value) {
            selectedFriends.value.clear();
        }
    }

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

    async function bulkUnfriendSelection() {
        if (!selectedFriends.value.size) return;
        for (const item of friendsListDisplayData.value) {
            if (selectedFriends.value.has(item.id)) {
                console.log(`Unfriending ${item.displayName} (${item.id})`);
                await friendRequest.deleteFriend({ userId: item.id }).then((args) => handleFriendDelete(args));
                selectedFriends.value.delete(item.id);
            }
        }
        modalStore.alert({
            description: `Unfriended ${selectedFriends.value.size} friends.`,
            title: 'Bulk Unfriend Complete'
        });
        selectedFriends.value.clear();
    }

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

    function cancelFriendsListLoad() {
        friendsListLoading.value = false;
        friendsListLoadDialogVisible.value = false;
    }

    function selectFriendsListRow(val) {
        if (!val) return;
        if (!val.id) emit('lookup-user', val);
        else showUserDialog(val.id);
    }

    function openChartsTab() {
        router.push({ name: 'charts' });
    }

    function handleFriendListFilterChange(value) {
        friendsListSearchFilters.value = Array.isArray(value) ? value : [];
        friendsListSearchChange();
    }
</script>

<style scoped>
    .friends-list-avatar {
        object-fit: cover;
        height: 22px;
        width: 22px;
    }
</style>
