<template>
    <div v-show="menuActiveIndex === 'friendList'" class="x-container">
        <div style="padding: 0 10px 0 10px">
            <div style="display: flex; align-items: center; justify-content: space-between">
                <span class="header">{{ t('view.friend_list.header') }}</span>
                <div style="font-size: 13px; display: flex; align-items: center">
                    <div v-if="friendsListBulkUnfriendMode" style="display: inline-block; margin-right: 10px">
                        <el-button size="small" @click="showBulkUnfriendSelectionConfirm">
                            {{ t('view.friend_list.bulk_unfriend_selection') }}
                        </el-button>
                        <!-- el-button(size="small" @click="showBulkUnfriendAllConfirm" style="margin-right:5px") Bulk Unfriend All-->
                    </div>
                    <div style="display: flex; align-items: center; margin-right: 10px">
                        <span class="name">{{ t('view.friend_list.bulk_unfriend') }}</span>
                        <el-switch
                            v-model="friendsListBulkUnfriendMode"
                            style="margin-left: 5px"
                            @change="toggleFriendsListBulkUnfriendMode"></el-switch>
                    </div>
                    <span>{{ t('view.friend_list.load') }}</span>
                    <template v-if="friendsListLoading">
                        <span style="margin-left: 5px" v-text="friendsListLoadingProgress"></span>
                        <el-tooltip
                            placement="top"
                            :content="t('view.friend_list.cancel_tooltip')"
                            :disabled="hideTooltips">
                            <el-button
                                size="mini"
                                icon="el-icon-loading"
                                circle
                                style="margin-left: 5px"
                                @click="friendsListLoading = false"></el-button>
                        </el-tooltip>
                    </template>
                    <template v-else>
                        <el-tooltip
                            placement="top"
                            :content="t('view.friend_list.load_tooltip')"
                            :disabled="hideTooltips">
                            <el-button
                                size="mini"
                                icon="el-icon-refresh-left"
                                circle
                                style="margin-left: 5px"
                                @click="friendsListLoadUsers"></el-button>
                        </el-tooltip>
                    </template>
                </div>
            </div>

            <div style="margin: 10px 0 0 10px; display: flex; align-items: center">
                <div style="flex: none; margin-right: 10px; display: flex; align-items: center">
                    <el-tooltip
                        placement="bottom"
                        :content="t('view.friend_list.favorites_only_tooltip')"
                        :disabled="hideTooltips">
                        <el-switch
                            v-model="friendsListSearchFilterVIP"
                            active-color="#13ce66"
                            @change="friendsListSearchChange"></el-switch>
                    </el-tooltip>
                </div>
                <el-input
                    v-model="friendsListSearch"
                    :placeholder="t('view.friend_list.search_placeholder')"
                    clearable
                    style="flex: 1"
                    @change="friendsListSearchChange"></el-input>
                <el-select
                    v-model="friendsListSearchFilters"
                    multiple
                    clearable
                    collapse-tags
                    style="flex: none; width: 200px; margin: 0 10px"
                    :placeholder="t('view.friend_list.filter_placeholder')"
                    @change="friendsListSearchChange">
                    <el-option
                        v-for="type in ['Display Name', 'User Name', 'Rank', 'Status', 'Bio', 'Note', 'Memo']"
                        :key="type"
                        :label="type"
                        :value="type"></el-option>
                </el-select>
                <el-tooltip placement="top" :content="t('view.friend_list.refresh_tooltip')" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        icon="el-icon-refresh"
                        circle
                        style="flex: none"
                        @click="friendsListSearchChange"></el-button>
                </el-tooltip>
            </div>
            <data-tables
                v-loading="friendsListLoading"
                v-bind="friendsListTable"
                :table-props="{ height: 'calc(100vh - 170px)', size: 'mini' }"
                style="margin-top: 10px; cursor: pointer"
                @row-click="selectFriendsListRow">
                <el-table-column
                    v-if="friendsListBulkUnfriendMode"
                    :key="friendsListBulkUnfriendForceUpdate"
                    width="55"
                    prop="$selected">
                    <template slot-scope="scope">
                        <el-button type="text" size="mini" @click.stop>
                            <el-checkbox
                                v-model="scope.row.$selected"
                                @change="friendsListBulkUnfriendForceUpdate++"></el-checkbox>
                        </el-button>
                    </template>
                </el-table-column>
                <el-table-column :label="t('table.friendList.no')" width="70" prop="$friendNumber" sortable="custom">
                    <template slot-scope="scope">
                        <span>{{ scope.row.$friendNumber ? scope.row.$friendNumber : '' }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="t('table.friendList.avatar')" width="70" prop="photo">
                    <template slot-scope="scope">
                        <el-popover placement="right" height="500px" trigger="hover">
                            <img slot="reference" v-lazy="userImage(scope.row, true)" class="friends-list-avatar" />
                            <img
                                v-lazy="userImageFull(scope.row)"
                                class="friends-list-avatar"
                                style="height: 500px; cursor: pointer"
                                @click="showFullscreenImageDialog(userImageFull(scope.row))" />
                        </el-popover>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.friendList.displayName')"
                    min-width="140"
                    prop="displayName"
                    sortable
                    :sort-method="(a, b) => sortAlphabetically(a, b, 'displayName')">
                    <template slot-scope="scope">
                        <span :style="{ color: randomUserColours ? scope.row.$userColour : undefined }" class="name">{{
                            scope.row.displayName
                        }}</span>
                    </template>
                </el-table-column>
                <el-table-column :label="t('table.friendList.rank')" width="110" prop="$trustSortNum" sortable="custom">
                    <template slot-scope="scope">
                        <span
                            v-if="randomUserColours"
                            :class="scope.row.$trustClass"
                            class="name"
                            v-text="scope.row.$trustLevel"></span>
                        <span
                            v-else
                            class="name"
                            :style="{ color: scope.row.$userColour }"
                            v-text="scope.row.$trustLevel"></span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.friendList.status')"
                    min-width="180"
                    prop="status"
                    sortable
                    :sort-method="(a, b) => sortStatus(a.status, b.status)">
                    <template slot-scope="scope">
                        <i
                            v-if="scope.row.status !== 'offline'"
                            :class="statusClass(scope.row.status)"
                            style="margin-right: 3px"
                            class="x-user-status"></i>
                        <span v-text="scope.row.statusDescription"></span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.friendList.language')"
                    width="110"
                    prop="$languages"
                    sortable
                    :sort-method="(a, b) => sortLanguages(a, b)">
                    <template slot-scope="scope">
                        <el-tooltip v-for="item in scope.row.$languages" :key="item.key" placement="top">
                            <template slot="content">
                                <span>{{ item.value }} ({{ item.key }})</span>
                            </template>
                            <span
                                :class="languageClass(item.key)"
                                style="display: inline-block; margin-right: 5px"
                                class="flags"></span>
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column :label="t('table.friendList.bioLink')" width="100" prop="bioLinks">
                    <template slot-scope="scope">
                        <el-tooltip v-for="(link, index) in scope.row.bioLinks" v-if="link" :key="index">
                            <template slot="content">
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
                                @click.stop="openExternalLink(link)" />
                        </el-tooltip>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.friendList.joinCount')"
                    width="120"
                    prop="$joinCount"
                    sortable></el-table-column>
                <el-table-column :label="t('table.friendList.timeTogether')" width="140" prop="$timeSpent" sortable>
                    <template slot-scope="scope">
                        <span v-if="scope.row.$timeSpent">{{ timeToText(scope.row.$timeSpent) }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.friendList.lastSeen')"
                    width="170"
                    prop="$lastSeen"
                    sortable
                    :sort-method="(a, b) => sortAlphabetically(a, b, '$lastSeen')">
                    <template slot-scope="scope">
                        <span>{{ formatDateFilter(scope.row.$lastSeen, 'long') }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.friendList.lastActivity')"
                    width="170"
                    prop="last_activity"
                    sortable
                    :sort-method="(a, b) => sortAlphabetically(a, b, 'last_activity')">
                    <template slot-scope="scope">
                        <span>{{ formatDateFilter(scope.row.last_activity, 'long') }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.friendList.lastLogin')"
                    width="170"
                    prop="last_login"
                    sortable
                    :sort-method="(a, b) => sortAlphabetically(a, b, 'last_login')">
                    <template slot-scope="scope">
                        <span>{{ formatDateFilter(scope.row.last_login, 'long') }}</span>
                    </template>
                </el-table-column>
                <el-table-column
                    :label="t('table.friendList.dateJoined')"
                    width="120"
                    prop="date_joined"
                    sortable
                    :sort-method="(a, b) => sortAlphabetically(a, b, 'date_joined')"></el-table-column>
                <el-table-column :label="t('table.friendList.unfriend')" width="100" align="center">
                    <template slot-scope="scope">
                        <el-button
                            type="text"
                            icon="el-icon-close"
                            style="color: #f56c6c"
                            size="mini"
                            @click.stop="confirmDeleteFriend(scope.row.id)"></el-button>
                    </template>
                </el-table-column>
            </data-tables>
        </div>
    </div>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { getCurrentInstance, nextTick, reactive, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { friendRequest, userRequest } from '../../api';
    import removeConfusables, { removeWhitespace } from '../../service/confusables';
    import {
        getFaviconUrl,
        languageClass,
        localeIncludes,
        openExternalLink,
        sortStatus,
        statusClass,
        timeToText,
        userImage,
        userImageFull,
        formatDateFilter
    } from '../../shared/utils';
    import {
        useAppearanceSettingsStore,
        useFriendStore,
        useGalleryStore,
        useSearchStore,
        useUiStore,
        useUserStore
    } from '../../stores';

    const { t } = useI18n();

    const { proxy } = getCurrentInstance();
    const $confirm = proxy.$confirm;
    const emit = defineEmits(['lookup-user']);

    const { friends } = storeToRefs(useFriendStore());
    const { getAllUserStats, confirmDeleteFriend, handleFriendDelete } = useFriendStore();
    const { hideTooltips, randomUserColours } = storeToRefs(useAppearanceSettingsStore());
    const { showUserDialog } = useUserStore();
    const { menuActiveIndex } = storeToRefs(useUiStore());
    const { stringComparer, friendsListSearch } = storeToRefs(useSearchStore());
    const { showFullscreenImageDialog } = useGalleryStore();

    const friendsListSearchFilters = ref([]);
    const friendsListTable = reactive({
        data: [],
        tableProps: { stripe: true, size: 'mini', defaultSort: { prop: '$friendNumber', order: 'descending' } },
        pageSize: 100,
        paginationProps: { small: true, layout: 'sizes,prev,pager,next,total', pageSizes: [50, 100, 250, 500] }
    });
    const friendsListBulkUnfriendMode = ref(false);
    const friendsListLoading = ref(false);
    const friendsListLoadingProgress = ref('');
    const friendsListSearchFilterVIP = ref(false);
    const friendsListBulkUnfriendForceUpdate = ref(0);

    watch(menuActiveIndex, (val) => {
        if (val === 'friendList') nextTick(friendsListSearchChange);
    });

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
            ctx.ref.$selected = ctx.ref.$selected ?? false;
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
        getAllUserStats();
        nextTick(() => {
            friendsListTable.data = results;
            friendsListLoading.value = false;
        });
    }

    function toggleFriendsListBulkUnfriendMode() {
        if (!friendsListBulkUnfriendMode.value) {
            friendsListTable.data.forEach((item) => (item.$selected = false));
        }
    }

    function showBulkUnfriendSelectionConfirm() {
        const pending = friendsListTable.data.filter((item) => item.$selected).map((item) => item.displayName);
        if (!pending.length) return;
        $confirm(
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
                inputValue: pending.join('\r\n'),
                callback: (action) => action === 'confirm' && bulkUnfriendSelection()
            }
        );
    }

    function bulkUnfriendSelection() {
        friendsListTable.data.forEach((item) => {
            if (item.$selected)
                friendRequest.deleteFriend({ userId: item.id }).then((args) => handleFriendDelete(args));
        });
    }

    async function friendsListLoadUsers() {
        friendsListLoading.value = true;
        let i = 0;
        const toFetch = Array.from(friends.value.values())
            .filter((ctx) => ctx.ref && !ctx.ref.date_joined)
            .map((ctx) => ctx.id);
        const total = toFetch.length;
        for (const userId of toFetch) {
            if (!friendsListLoading.value) {
                friendsListLoadingProgress.value = '';
                return;
            }
            i++;
            friendsListLoadingProgress.value = `${i}/${total}`;
            try {
                await userRequest.getUser({ userId });
            } catch (err) {
                console.error(err);
            }
        }
        friendsListLoadingProgress.value = '';
        friendsListLoading.value = false;
    }

    function selectFriendsListRow(val) {
        if (!val) return;
        if (!val.id) emit('lookup-user', val);
        else showUserDialog(val.id);
    }

    function sortAlphabetically(a, b, field) {
        if (!a[field] || !b[field]) return 0;
        return a[field].toLowerCase().localeCompare(b[field].toLowerCase());
    }

    function sortLanguages(a, b) {
        const as = a.$languages.map((i) => i.value).sort();
        const bs = b.$languages.map((i) => i.value).sort();
        return JSON.stringify(as).localeCompare(JSON.stringify(bs));
    }
</script>
