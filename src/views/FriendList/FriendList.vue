<template>
    <div class="x-container" ref="friendsListRef">
        <div>
            <div style="display: flex; align-items: center; justify-content: space-between">
                <div style="flex: none; margin-right: 10px; display: flex; align-items: center">
                    <TooltipWrapper side="bottom" :content="t('view.friend_list.favorites_only_tooltip')">
                        <Switch v-model="friendsListSearchFilterVIP" @update:modelValue="friendsListSearchChange" />
                    </TooltipWrapper>
                    <el-select
                        v-model="friendsListSearchFilters"
                        multiple
                        clearable
                        collapse-tags
                        style="margin: 0 10px; width: 150px"
                        :placeholder="t('view.friend_list.filter_placeholder')"
                        @change="friendsListSearchChange">
                        <el-option
                            v-for="type in ['Display Name', 'User Name', 'Rank', 'Status', 'Bio', 'Note', 'Memo']"
                            :key="type"
                            :label="type"
                            :value="type"></el-option>
                    </el-select>
                    <el-input
                        v-model="friendsListSearch"
                        :placeholder="t('view.friend_list.search_placeholder')"
                        clearable
                        style="width: 250px"
                        @change="friendsListSearchChange"></el-input>
                </div>
                <div class="flex items-center">
                    <div v-if="friendsListBulkUnfriendMode" class="inline-block mr-10">
                        <el-button @click="showBulkUnfriendSelectionConfirm">
                            {{ t('view.friend_list.bulk_unfriend_selection') }}
                        </el-button>
                        <!-- el-button(size="small" @click="showBulkUnfriendAllConfirm" style="margin-right:5px") Bulk Unfriend All-->
                    </div>
                    <div class="flex items-center mr-3">
                        <span class="name mr-2 text-xs">{{ t('view.friend_list.bulk_unfriend') }}</span>
                        <Switch
                            v-model="friendsListBulkUnfriendMode"
                            @update:modelValue="toggleFriendsListBulkUnfriendMode" />
                    </div>
                    <div class="flex items-center">
                        <el-button @click="openChartsTab">
                            {{ t('view.friend_list.load_mutual_friends') }}
                        </el-button>

                        <el-button @click="friendsListLoadUsers">{{ t('view.friend_list.load') }}</el-button>
                    </div>
                </div>
            </div>
            <DataTable
                v-bind="friendsListTable"
                style="margin-top: 10px; cursor: pointer"
                @sort-change="handleSortChange"
                @row-click="selectFriendsListRow">
                <el-table-column v-if="friendsListBulkUnfriendMode" width="55">
                    <template #default="{ row }">
                        <div class="flex items-center justify-center" @click.stop>
                            <Checkbox
                                :model-value="selectedFriends.has(row.id)"
                                @update:modelValue="toggleFriendSelection(row.id)" />
                        </div>
                    </template>
                </el-table-column>
                <el-table-column width="20"></el-table-column>
                <el-table-column
                    :label="t('table.friendList.no')"
                    width="100"
                    prop="$friendNumber"
                    :sortable="'custom'"
                    fixed="left">
                    <template #default="{ row }">
                        <span>{{ row.$friendNumber ? row.$friendNumber : '' }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="t('table.friendList.avatar')" width="90" prop="photo">
                    <template #default="{ row }">
                        <div class="flex items-center">
                            <img :src="userImage(row, true)" class="friends-list-avatar" loading="lazy" />
                        </div>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.friendList.displayName')"
                    min-width="200"
                    prop="displayName"
                    sortable="'custom'"
                    fixed="left">
                    <template #default="{ row }">
                        <span :style="{ color: randomUserColours ? row.$userColour : undefined }" class="name">{{
                            row.displayName
                        }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.friendList.rank')"
                    width="140"
                    prop="$trustSortNum"
                    :sortable="'custom'">
                    <template #default="{ row }">
                        <span
                            v-if="randomUserColours"
                            :class="row.$trustClass"
                            class="name"
                            v-text="row.$trustLevel"></span>
                        <span v-else class="name" :style="{ color: row.$userColour }" v-text="row.$trustLevel"></span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.friendList.status')"
                    min-width="200"
                    prop="status"
                    sortable="'custom'">
                    <template #default="{ row }">
                        <i
                            v-if="row.status !== 'offline'"
                            :class="statusClass(row.status)"
                            style="margin-right: 3px"
                            class="x-user-status"></i>
                        <span v-text="row.statusDescription"></span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.friendList.language')"
                    width="130"
                    prop="$languages"
                    sortable="'custom'">
                    <template #default="{ row }">
                        <TooltipWrapper v-for="item in row.$languages" :key="item.key" side="top">
                            <template #content>
                                <span>{{ item.value }} ({{ item.key }})</span>
                            </template>
                            <span
                                :class="languageClass(item.key)"
                                style="display: inline-block; margin-right: 5px"
                                class="flags"></span>
                        </TooltipWrapper>
                    </template>
                </el-table-column>
                <el-table-column :label="t('table.friendList.bioLink')" width="130" prop="bioLinks">
                    <template #default="{ row }">
                        <div class="flex items-center">
                            <TooltipWrapper v-for="(link, index) in row.bioLinks.filter(Boolean)" :key="index">
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
                            </TooltipWrapper>
                        </div>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.friendList.joinCount')"
                    width="120"
                    prop="$joinCount"
                    sortable="'custom'"
                    align="right"></el-table-column>
                <el-table-column
                    :label="t('table.friendList.timeTogether')"
                    width="140"
                    prop="$timeSpent"
                    sortable="'custom'"
                    align="right">
                    <template #default="{ row }">
                        <span v-if="row.$timeSpent">{{ timeToText(row.$timeSpent) }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.friendList.lastSeen')"
                    width="170"
                    prop="$lastSeen"
                    sortable="'custom'">
                    <template #default="{ row }">
                        <span>{{
                            formatDateFilter(row.$lastSeen, 'long') === '-'
                                ? ''
                                : formatDateFilter(row.$lastSeen, 'long')
                        }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.friendList.mutualFriends')"
                    width="120"
                    prop="$mutualCount"
                    sortable="'custom'"
                    align="right">
                    <template #default="{ row }">
                        <span v-if="row.$mutualCount">{{ row.$mutualCount }}</span>
                        <span v-else></span> </template
                ></el-table-column>
                <el-table-column
                    :label="t('table.friendList.lastActivity')"
                    width="200"
                    prop="last_activity"
                    sortable="'custom'">
                    <template #default="{ row }">
                        <span>{{ formatDateFilter(row.last_activity, 'long') }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.friendList.lastLogin')"
                    width="200"
                    prop="last_login"
                    sortable="'custom'">
                    <template #default="{ row }">
                        <span>{{ formatDateFilter(row.last_login, 'long') }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.friendList.dateJoined')"
                    width="120"
                    prop="date_joined"
                    sortable="'custom'"></el-table-column>
                <el-table-column :label="t('table.friendList.unfriend')" width="100" align="center">
                    <template #default="{ row }">
                        <i
                            class="ri-user-unfollow-line"
                            style="color: #f56c6c"
                            @click.stop="confirmDeleteFriend(row.id)"></i>
                    </template>
                </el-table-column>
            </DataTable>
            <el-dialog
                v-model="friendsListLoadDialogVisible"
                :title="t('view.friend_list.load_dialog_title')"
                width="420px"
                :close-on-click-modal="false"
                :close-on-press-escape="false"
                :show-close="false"
                align-center>
                <div style="margin-bottom: 10px" v-text="t('view.friend_list.load_dialog_message')"></div>
                <el-progress
                    :percentage="friendsListLoadingPercent"
                    :text-inside="true"
                    :stroke-width="16"></el-progress>
                <div style="margin-top: 10px; text-align: right">
                    <span>{{ friendsListLoadingCurrent }} / {{ friendsListLoadingTotal }}</span>
                </div>
                <template #footer>
                    <el-button @click="cancelFriendsListLoad">
                        {{ t('view.friend_list.load_cancel') }}
                    </el-button>
                </template>
            </el-dialog>
        </div>
    </div>
</template>

<script setup>
    import { computed, nextTick, reactive, ref, watch } from 'vue';
    import { ElMessageBox } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';
    import { useRoute } from 'vue-router';

    import {
        formatDateFilter,
        getFaviconUrl,
        languageClass,
        localeIncludes,
        openExternalLink,
        sortStatus,
        statusClass,
        timeToText,
        userImage
    } from '../../shared/utils';
    import { useAppearanceSettingsStore, useFriendStore, useSearchStore, useUserStore } from '../../stores';
    import { friendRequest, userRequest } from '../../api';
    import { Checkbox } from '../../components/ui/checkbox';
    import { Switch } from '../../components/ui/switch';
    import removeConfusables, { removeWhitespace } from '../../service/confusables';
    import { router } from '../../plugin/router';
    import { useTableHeight } from '../../composables/useTableHeight';

    const { t } = useI18n();

    const emit = defineEmits(['lookup-user']);

    const { friends } = storeToRefs(useFriendStore());
    const { getAllUserStats, getAllUserMutualCount, confirmDeleteFriend, handleFriendDelete } = useFriendStore();
    const { randomUserColours } = storeToRefs(useAppearanceSettingsStore());
    const { showUserDialog } = useUserStore();
    const { stringComparer, friendsListSearch } = storeToRefs(useSearchStore());

    const friendsListSearchFilters = ref([]);
    const friendsListTable = reactive({
        data: [],
        tableProps: {
            stripe: true,
            size: 'small',
            defaultSort: { prop: '$friendNumber', order: 'descending' },
            scrollbarAlwaysOn: true
        },
        pageSize: 100,
        paginationProps: { layout: 'sizes,prev,pager,next,total', pageSizes: [50, 100, 250, 500] }
    });
    const friendsListBulkUnfriendMode = ref(false);
    const friendsListLoading = ref(false);
    const friendsListLoadingCurrent = ref(0);
    const friendsListLoadingTotal = ref(0);
    const friendsListLoadDialogVisible = ref(false);
    const friendsListSearchFilterVIP = ref(false);
    const selectedFriends = ref(new Set());
    const allFilteredData = ref([]);

    const friendsListLoadingPercent = computed(() => {
        if (!friendsListLoadingTotal.value) return 0;
        return Math.min(100, Math.round((friendsListLoadingCurrent.value / friendsListLoadingTotal.value) * 100));
    });

    const { containerRef: friendsListRef } = useTableHeight(ref(friendsListTable));

    const route = useRoute();

    watch(
        () => route.path,
        () => {
            nextTick(() => friendsListSearchChange());
        },
        { immediate: true }
    );

    function friendsListSearchChange() {
        friendsListLoading.value = true;
        let query = '';
        let cleanedQuery = '';
        friendsListTable.data = [];
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
        allFilteredData.value = results;
        getAllUserStats();
        getAllUserMutualCount();
        applySortAndPagination(
            friendsListTable.tableProps.defaultSort.prop,
            friendsListTable.tableProps.defaultSort.order
        );
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
        const pending = friendsListTable.data
            .filter((item) => selectedFriends.value.has(item.id))
            .map((item) => item.displayName);
        if (!pending.length) return;
        ElMessageBox.confirm(
            `Are you sure you want to delete ${pending.length} friends?
            This can negatively affect your trust rank,
            This action cannot be undone.`,
            `Delete ${pending.length} friends?`,
            {
                confirmButtonText: 'Confirm',
                cancelButtonText: 'Cancel',
                type: 'info',
                showInput: true,
                inputType: 'textarea',
                inputValue: pending.join('\r\n')
            }
        )
            .then(({ action }) => {
                if (action === 'confirm') {
                    bulkUnfriendSelection();
                }
            })
            .catch(() => {});
    }

    async function bulkUnfriendSelection() {
        if (!selectedFriends.value.size) return;
        for (const item of friendsListTable.data) {
            if (selectedFriends.value.has(item.id)) {
                console.log(`Unfriending ${item.displayName} (${item.id})`);
                await friendRequest.deleteFriend({ userId: item.id }).then((args) => handleFriendDelete(args));
                selectedFriends.value.delete(item.id);
            }
        }
        ElMessageBox.alert(`Unfriended ${selectedFriends.value.size} friends.`, 'Bulk Unfriend Complete', {
            confirmButtonText: 'OK',
            type: 'success'
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

    function compareWithFriendNumber(a, b, primaryComparison, primarySelector = (x) => x) {
        const primaryComparisonResult = primaryComparison(primarySelector(a), primarySelector(b));
        if (primaryComparisonResult === 0) {
            return (a.$friendNumber || 0) - (b.$friendNumber || 0);
        }
        return primaryComparisonResult;
    }

    function sortAlphabetically(a, b) {
        if (!a || !b) {
            if (!a && !b) return 0;
            return !a ? -1 : 1;
        }
        return a.toLowerCase().localeCompare(b.toLowerCase());
    }

    function sortLanguages(a, b) {
        const as = a.map((i) => i.value).sort();
        const bs = b.map((i) => i.value).sort();
        return JSON.stringify(as).localeCompare(JSON.stringify(bs));
    }

    function openChartsTab() {
        router.push({ name: 'charts' });
    }

    function handleSortChange({ prop, order }) {
        applySortAndPagination(prop, order);
    }

    function resolveSortFunction(prop) {
        const numberComparison = (a, b) => (a || 0) - (b || 0);
        switch (prop) {
            case '$friendNumber':
                return [numberComparison, (item) => item.$friendNumber || 0];
            case 'displayName':
                return [sortAlphabetically, (item) => item.displayName || ''];
            case '$trustSortNum':
                return [numberComparison, (item) => item.$trustSortNum || 0];
            case 'status':
                return [sortStatus, (item) => item.status || 'offline'];
            case '$languages':
                return [sortLanguages, (item) => item.$languages || []];
            case '$joinCount':
                return [numberComparison, (item) => item.$joinCount || 0];
            case '$timeSpent':
                return [numberComparison, (item) => item.$timeSpent || 0];
            case '$lastSeen':
                return [sortAlphabetically, (item) => item.$lastSeen || ''];
            case '$mutualCount':
                return [numberComparison, (item) => item.$mutualCount || 0];
            case 'last_activity':
                return [sortAlphabetically, (item) => item.last_activity || ''];
            case 'last_login':
                return [sortAlphabetically, (item) => item.last_login || ''];
            case 'date_joined':
                return [sortAlphabetically, (item) => item.date_joined || ''];
            default:
                return [sortAlphabetically, (item) => item[prop] || ''];
        }
    }

    function applySortAndPagination(prop, order) {
        let sortedData = [...allFilteredData.value];

        if (prop && order !== null) {
            const [comparison, selector] = resolveSortFunction(prop);
            sortedData.sort((a, b) => {
                const result = compareWithFriendNumber(a, b, comparison, selector);
                return order === 'ascending' ? result : -result;
            });
        }

        friendsListTable.data = sortedData;
    }
</script>

<style scoped>
    .friends-list-avatar {
        object-fit: cover;
        height: 22px;
        width: 22px;
    }
</style>
