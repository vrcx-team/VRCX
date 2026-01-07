<template>
    <div class="favorites-page x-container" v-loading="isFavoriteLoading">
        <div class="favorites-toolbar">
            <div>
                <el-select v-model="sortFav" class="favorites-toolbar__select">
                    <template #prefix>
                        <i class="ri-sort-asc"></i>
                    </template>
                    <el-option :label="t('view.settings.appearance.appearance.sort_favorite_by_name')" :value="false" />
                    <el-option :label="t('view.settings.appearance.appearance.sort_favorite_by_date')" :value="true" />
                </el-select>
            </div>
            <div class="favorites-toolbar__right">
                <el-input
                    v-model="friendFavoriteSearch"
                    clearable
                    class="favorites-toolbar__search"
                    :placeholder="t('view.favorite.worlds.search')"
                    @input="searchFriendFavorites" />
                <el-dropdown ref="friendToolbarMenuRef" trigger="click" :hide-on-click="false">
                    <el-button :icon="MoreFilled" size="small" circle @click.stop />
                    <template #dropdown>
                        <el-dropdown-menu class="favorites-dropdown">
                            <li class="favorites-dropdown__control" @click.stop>
                                <div class="favorites-dropdown__control-header">
                                    <span>Scale</span>
                                    <span class="favorites-dropdown__control-value">
                                        {{ friendCardScalePercent }}%
                                    </span>
                                </div>
                                <el-slider
                                    v-model="friendCardScale"
                                    class="favorites-dropdown__slider"
                                    :min="friendCardScaleSlider.min"
                                    :max="friendCardScaleSlider.max"
                                    :step="friendCardScaleSlider.step"
                                    :show-tooltip="false" />
                            </li>
                            <li class="favorites-dropdown__control" @click.stop>
                                <div class="favorites-dropdown__control-header">
                                    <span>Spacing</span>
                                    <span class="favorites-dropdown__control-value">
                                        {{ friendCardSpacingPercent }}%
                                    </span>
                                </div>
                                <el-slider
                                    v-model="friendCardSpacing"
                                    class="favorites-dropdown__slider"
                                    :min="friendCardSpacingSlider.min"
                                    :max="friendCardSpacingSlider.max"
                                    :step="friendCardSpacingSlider.step"
                                    :show-tooltip="false" />
                            </li>
                            <el-dropdown-item @click="handleFriendImportClick">
                                {{ t('view.favorite.import') }}
                            </el-dropdown-item>
                            <el-dropdown-item divided @click="handleFriendExportClick">
                                {{ t('view.favorite.export') }}
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </div>
        <el-splitter class="favorites-splitter" @resize-end="handleFriendSplitterResize">
            <el-splitter-panel :size="friendSplitterSize" :min="0" :max="360" collapsible>
                <div class="favorites-groups-panel">
                    <div class="group-section">
                        <div class="group-section__header">
                            <span>{{ t('view.favorite.worlds.vrchat_favorites') }}</span>
                            <TooltipWrapper side="bottom" :content="t('view.favorite.refresh_favorites_tooltip')">
                                <el-button
                                    :loading="isFavoriteLoading"
                                    size="small"
                                    :icon="Refresh"
                                    circle
                                    @click.stop="handleRefreshFavorites" />
                            </TooltipWrapper>
                        </div>
                        <div class="group-section__list">
                            <template v-if="favoriteFriendGroups.length">
                                <div
                                    v-for="group in favoriteFriendGroups"
                                    :key="group.key"
                                    :class="[
                                        'group-item',
                                        { 'is-active': !hasSearchInput && isGroupActive('remote', group.key) }
                                    ]"
                                    @click="handleGroupClick('remote', group.key)">
                                    <div class="group-item__top">
                                        <span class="group-item__name">{{ group.displayName }}</span>
                                        <span class="group-item__count">{{ group.count }}/{{ group.capacity }}</span>
                                    </div>
                                    <div class="group-item__bottom">
                                        <Badge variant="outline">
                                            {{ formatVisibility(group.visibility) }}
                                        </Badge>
                                        <Popover
                                            :open="activeGroupMenu === remoteGroupMenuKey(group.key)"
                                            @update:open="
                                                handleGroupMenuVisible(remoteGroupMenuKey(group.key), $event)
                                            ">
                                            <PopoverTrigger asChild>
                                                <el-button
                                                    text
                                                    size="small"
                                                    :icon="MoreFilled"
                                                    circle
                                                    @click.stop></el-button>
                                            </PopoverTrigger>
                                            <PopoverContent side="right" class="w-[220px] p-1 rounded-lg">
                                                <div class="favorites-group-menu">
                                                    <button
                                                        type="button"
                                                        class="favorites-group-menu__item"
                                                        @click="handleRemoteRename(group)">
                                                        <span>{{ t('view.favorite.rename_tooltip') }}</span>
                                                    </button>
                                                    <el-popover
                                                        placement="right"
                                                        trigger="hover"
                                                        :width="180"
                                                        popper-style="padding: 4px; border-radius: 8px;">
                                                        <div class="group-visibility-menu">
                                                            <button
                                                                v-for="visibility in friendGroupVisibilityOptions"
                                                                :key="visibility"
                                                                type="button"
                                                                :class="[
                                                                    'group-visibility-menu__item',
                                                                    { 'is-active': group.visibility === visibility }
                                                                ]"
                                                                @click="handleVisibilitySelection(group, visibility)">
                                                                <span>{{ formatVisibility(visibility) }}</span>
                                                                <span
                                                                    v-if="group.visibility === visibility"
                                                                    class="group-visibility-menu__check">
                                                                    <i class="ri-check-line"></i>
                                                                </span>
                                                            </button>
                                                        </div>
                                                        <template #reference>
                                                            <button
                                                                type="button"
                                                                class="favorites-group-menu__item favorites-group-menu__item--submenu">
                                                                <span>{{ t('view.favorite.visibility_tooltip') }}</span>
                                                                <span class="favorites-group-menu__arrow">›</span>
                                                            </button>
                                                        </template>
                                                    </el-popover>
                                                    <button
                                                        type="button"
                                                        class="favorites-group-menu__item favorites-group-menu__item--danger"
                                                        @click="handleRemoteClear(group)">
                                                        <span>{{ t('view.favorite.clear') }}</span>
                                                    </button>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>
                            </template>
                            <div v-else class="group-empty">No Data</div>
                        </div>
                    </div>
                </div>
            </el-splitter-panel>
            <el-splitter-panel>
                <div class="favorites-content">
                    <div class="favorites-content__header">
                        <div class="favorites-content__title">
                            <span v-if="isSearchActive">{{ t('view.favorite.worlds.search') }}</span>
                            <template v-else-if="activeRemoteGroup">
                                <span>
                                    {{ activeRemoteGroup.displayName }}
                                    <small>{{ activeRemoteGroup.count }}/{{ activeRemoteGroup.capacity }}</small>
                                </span>
                            </template>
                            <span v-else>No Group Selected</span>
                        </div>
                        <div class="favorites-content__edit">
                            <span>{{ t('view.favorite.edit_mode') }}</span>
                            <Switch v-model="friendEditMode" :disabled="isSearchActive || !activeRemoteGroup" />
                        </div>
                    </div>
                    <div class="favorites-content__edit-actions">
                        <div v-if="friendEditMode && !isSearchActive" class="favorites-content__actions">
                            <el-button size="small" @click="toggleSelectAllFriends">
                                {{
                                    isAllFriendsSelected
                                        ? t('view.favorite.deselect_all')
                                        : t('view.favorite.select_all')
                                }}
                            </el-button>
                            <el-button size="small" :disabled="!hasFriendSelection" @click="clearSelectedFriends">
                                {{ t('view.favorite.clear') }}
                            </el-button>
                            <el-button size="small" :disabled="!hasFriendSelection" @click="copySelectedFriends">
                                {{ t('view.favorite.copy') }}
                            </el-button>
                            <el-button
                                size="small"
                                :disabled="!hasFriendSelection"
                                @click="showFriendBulkUnfavoriteSelectionConfirm">
                                {{ t('view.favorite.bulk_unfavorite') }}
                            </el-button>
                        </div>
                    </div>
                    <div ref="friendFavoritesContainerRef" class="favorites-content__list">
                        <template v-if="activeRemoteGroup && !isSearchActive">
                            <div class="favorites-content__scroll favorites-content__scroll--native">
                                <template v-if="currentFriendFavorites.length">
                                    <div
                                        class="favorites-card-list"
                                        :style="friendFavoritesGridStyle(currentFriendFavorites.length)">
                                        <FavoritesFriendItem
                                            v-for="favorite in currentFriendFavorites"
                                            :key="favorite.id"
                                            :favorite="favorite"
                                            :group="activeRemoteGroup"
                                            :selected="selectedFavoriteFriends.includes(favorite.id)"
                                            :edit-mode="friendEditMode"
                                            @toggle-select="toggleFriendSelection(favorite.id, $event)"
                                            @click="showUserDialog(favorite.id)" />
                                    </div>
                                </template>
                                <div v-else class="favorites-empty">No Data</div>
                            </div>
                        </template>
                        <template v-else-if="!isSearchActive">
                            <div class="favorites-empty">No Group Selected</div>
                        </template>
                        <template v-else>
                            <div class="favorites-content__scroll favorites-content__scroll--native">
                                <div
                                    v-if="friendFavoriteSearchResults.length"
                                    class="favorites-search-grid"
                                    :style="friendFavoritesGridStyle(friendFavoriteSearchResults.length)">
                                    <div
                                        v-for="favorite in friendFavoriteSearchResults"
                                        :key="favorite.id"
                                        class="favorites-search-card"
                                        @click="showUserDialog(favorite.id)">
                                        <div class="favorites-search-card__content">
                                            <div class="favorites-search-card__avatar">
                                                <img :src="userImage(favorite, true)" loading="lazy" />
                                            </div>
                                            <div class="favorites-search-card__detail">
                                                <div class="favorites-search-card__title">
                                                    <span class="name">{{ favorite.displayName }}</span>
                                                </div>
                                                <div
                                                    v-if="favorite.location && favorite.location !== 'offline'"
                                                    class="favorites-search-card__location">
                                                    <Location
                                                        :location="favorite.location"
                                                        :traveling="favorite.travelingToLocation"
                                                        :link="false" />
                                                </div>
                                                <span v-else class="extra">{{ favorite.statusDescription }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="favorites-empty">No Data</div>
                            </div>
                        </template>
                    </div>
                </div>
            </el-splitter-panel>
        </el-splitter>
        <FriendExportDialog v-model:friendExportDialogVisible="friendExportDialogVisible" />
    </div>
</template>

<script setup>
    import { computed, onBeforeMount, ref, watch } from 'vue';
    import { MoreFilled, Refresh } from '@element-plus/icons-vue';
    import { ElMessageBox } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
    import { useAppearanceSettingsStore, useFavoriteStore, useUserStore } from '../../stores';
    import { Badge } from '../../components/ui/badge';
    import { Switch } from '../../components/ui/switch';
    import { favoriteRequest } from '../../api';
    import { useFavoritesCardScaling } from './composables/useFavoritesCardScaling.js';
    import { userImage } from '../../shared/utils';

    import FavoritesFriendItem from './components/FavoritesFriendItem.vue';
    import FriendExportDialog from './dialogs/FriendExportDialog.vue';
    import configRepository from '../../service/config.js';

    const friendGroupVisibilityOptions = ref(['public', 'friends', 'private']);

    const friendSplitterSize = ref(260);

    const { sortFavorites } = storeToRefs(useAppearanceSettingsStore());
    const { setSortFavorites } = useAppearanceSettingsStore();
    const favoriteStore = useFavoriteStore();
    const {
        favoriteFriends,
        favoriteFriendGroups,
        groupedByGroupKeyFavoriteFriends,
        selectedFavoriteFriends,
        friendImportDialogInput,
        isFavoriteLoading
    } = storeToRefs(favoriteStore);
    const { showFriendImportDialog, refreshFavorites, getLocalWorldFavorites, handleFavoriteGroup } = favoriteStore;
    const { showUserDialog } = useUserStore();
    const { t } = useI18n();

    const {
        cardScale: friendCardScale,
        cardSpacing: friendCardSpacing,
        slider: friendCardScaleSlider,
        spacingSlider: friendCardSpacingSlider,
        containerRef: friendFavoritesContainerRef,
        gridStyle: friendFavoritesGridStyle
    } = useFavoritesCardScaling({
        configKey: 'VRCX_FavoritesFriendCardScale',
        spacingConfigKey: 'VRCX_FavoritesFriendCardSpacing',
        min: 0.6,
        max: 1,
        step: 0.01,
        spacingMin: 0.5,
        spacingMax: 1.5,
        spacingStep: 0.05,
        basePaddingY: 8,
        basePaddingX: 10,
        baseContentGap: 10,
        baseActionGap: 8,
        baseActionGroupGap: 6,
        baseActionMargin: 8,
        baseCheckboxMargin: 10
    });

    const friendCardScalePercent = computed(() => Math.round(friendCardScale.value * 100));
    const friendCardSpacingPercent = computed(() => Math.round(friendCardSpacing.value * 100));

    const friendExportDialogVisible = ref(false);
    const friendFavoriteSearch = ref('');
    const friendFavoriteSearchResults = ref([]);
    const friendEditMode = ref(false);
    const selectedGroup = ref(null);
    const activeGroupMenu = ref(null);
    const friendToolbarMenuRef = ref();

    const sortFav = computed({
        get() {
            return sortFavorites.value;
        },
        set() {
            setSortFavorites();
        }
    });

    const hasFriendSelection = computed(() => selectedFavoriteFriends.value.length > 0);
    const hasSearchInput = computed(() => friendFavoriteSearch.value.trim().length > 0);
    const isSearchActive = computed(() => friendFavoriteSearch.value.trim().length >= 3);
    const isRemoteGroupSelected = computed(() => selectedGroup.value?.type === 'remote');

    const closeFriendToolbarMenu = () => {
        friendToolbarMenuRef.value?.handleClose?.();
    };

    function handleFriendImportClick() {
        closeFriendToolbarMenu();
        showFriendImportDialog();
    }

    function handleFriendExportClick() {
        closeFriendToolbarMenu();
        showFriendExportDialog();
    }

    onBeforeMount(() => {
        loadFriendSplitterPreferences();
    });

    async function loadFriendSplitterPreferences() {
        const storedSize = await configRepository.getString('VRCX_FavoritesFriendSplitter', '260');
        if (typeof storedSize === 'string' && !Number.isNaN(Number(storedSize)) && Number(storedSize) > 0) {
            friendSplitterSize.value = Number(storedSize);
        }
    }

    function handleFriendSplitterResize(panelIndex, sizes) {
        if (!Array.isArray(sizes) || !sizes.length) {
            return;
        }
        const nextSize = sizes[0];
        if (nextSize <= 0) {
            return;
        }
        friendSplitterSize.value = nextSize;
        configRepository.setString('VRCX_FavoritesFriendSplitter', nextSize.toString());
    }

    const remoteGroupMenuKey = (key) => `remote:${key}`;

    const searchableFriendEntries = computed(() => {
        const seen = new Set();
        const entries = [];
        favoriteFriends.value.forEach((favorite) => {
            if (!favorite?.ref || !favorite.id || seen.has(favorite.id)) {
                return;
            }
            seen.add(favorite.id);
            entries.push(favorite.ref);
        });
        return entries;
    });

    const activeRemoteGroup = computed(() => {
        if (!isRemoteGroupSelected.value) {
            return null;
        }
        return favoriteFriendGroups.value.find((group) => group.key === selectedGroup.value.key) || null;
    });

    const currentFriendFavorites = computed(() => {
        if (!activeRemoteGroup.value) {
            return [];
        }
        return groupedByGroupKeyFavoriteFriends.value[activeRemoteGroup.value.key] || [];
    });

    const isAllFriendsSelected = computed(() => {
        if (!activeRemoteGroup.value || !currentFriendFavorites.value.length) {
            return false;
        }
        return currentFriendFavorites.value
            .map((fav) => fav.id)
            .every((id) => selectedFavoriteFriends.value.includes(id));
    });

    watch(
        () => favoriteFriendGroups.value.map((group) => `${group.key}:${group.count}`),
        () => {
            ensureSelectedGroup();
        },
        { immediate: true }
    );

    watch(isSearchActive, (active) => {
        if (active && friendEditMode.value) {
            friendEditMode.value = false;
        }
    });

    watch(
        () => friendEditMode.value,
        (value) => {
            if (!value) {
                clearSelectedFriends();
            }
        }
    );

    function showFriendExportDialog() {
        friendExportDialogVisible.value = true;
    }

    function handleRefreshFavorites() {
        refreshFavorites();
        getLocalWorldFavorites();
    }

    function handleGroupMenuVisible(key, visible) {
        if (visible) {
            activeGroupMenu.value = key;
            return;
        }
        if (activeGroupMenu.value === key) {
            activeGroupMenu.value = null;
        }
    }

    function ensureSelectedGroup() {
        if (selectedGroup.value && isGroupAvailable(selectedGroup.value)) {
            return;
        }
        selectDefaultGroup();
    }

    function selectDefaultGroup() {
        if (favoriteFriendGroups.value.length) {
            const nextGroup =
                favoriteFriendGroups.value.find((group) => group.count > 0) || favoriteFriendGroups.value[0];
            if (nextGroup) {
                selectGroup('remote', nextGroup.key);
                return;
            }
        }
        selectedGroup.value = null;
        clearSelectedFriends();
    }

    function isGroupAvailable(group) {
        if (!group) {
            return false;
        }
        if (group.type === 'remote') {
            return favoriteFriendGroups.value.some((item) => item.key === group.key);
        }
        return false;
    }

    function selectGroup(type, key) {
        if (selectedGroup.value?.type === type && selectedGroup.value?.key === key) {
            return;
        }
        selectedGroup.value = { type, key };
        clearSelectedFriends();
    }

    function isGroupActive(type, key) {
        return selectedGroup.value?.type === type && selectedGroup.value?.key === key;
    }

    function handleGroupClick(type, key) {
        if (hasSearchInput.value) {
            friendFavoriteSearch.value = '';
            searchFriendFavorites('');
        }
        selectGroup(type, key);
    }

    function searchFriendFavorites(searchTerm) {
        const search = searchTerm.trim().toLowerCase();
        if (search.length < 3) {
            friendFavoriteSearchResults.value = [];
            return;
        }
        const filtered = searchableFriendEntries.value.filter((ref) => {
            if (!ref || typeof ref.id === 'undefined' || typeof ref.displayName === 'undefined') {
                return false;
            }
            const username = ref.username || '';
            return ref.displayName.toLowerCase().includes(search) || username.toLowerCase().includes(search);
        });
        friendFavoriteSearchResults.value = filtered;
    }

    function toggleFriendSelection(id, value) {
        if (value) {
            if (!selectedFavoriteFriends.value.includes(id)) {
                selectedFavoriteFriends.value.push(id);
            }
        } else {
            selectedFavoriteFriends.value = selectedFavoriteFriends.value.filter((selectedId) => selectedId !== id);
        }
    }

    function clearSelectedFriends() {
        selectedFavoriteFriends.value = [];
    }

    function toggleSelectAllFriends() {
        if (!activeRemoteGroup.value) {
            return;
        }
        if (isAllFriendsSelected.value) {
            selectedFavoriteFriends.value = [];
        } else {
            selectedFavoriteFriends.value = currentFriendFavorites.value.map((fav) => fav.id);
        }
    }

    function copySelectedFriends() {
        if (!selectedFavoriteFriends.value.length) {
            return;
        }
        const idList = selectedFavoriteFriends.value.map((id) => `${id}\n`).join('');
        friendImportDialogInput.value = idList;
        showFriendImportDialog();
    }

    function showFriendBulkUnfavoriteSelectionConfirm() {
        if (!selectedFavoriteFriends.value.length) {
            return;
        }
        const total = selectedFavoriteFriends.value.length;
        ElMessageBox.confirm(
            `Are you sure you want to unfavorite ${total} favorites?\n            This action cannot be undone.`,
            `Delete ${total} favorites?`,
            {
                confirmButtonText: 'Confirm',
                cancelButtonText: 'Cancel',
                type: 'info'
            }
        )
            .then((action) => {
                if (action === 'confirm') {
                    bulkUnfavoriteSelectedFriends([...selectedFavoriteFriends.value]);
                }
            })
            .catch(() => {});
    }

    function bulkUnfavoriteSelectedFriends(ids) {
        ids.forEach((id) => {
            favoriteRequest.deleteFavorite({
                objectId: id
            });
        });
        selectedFavoriteFriends.value = [];
        friendEditMode.value = false;
    }

    function clearFavoriteGroup(ctx) {
        ElMessageBox.confirm('Continue? Clear Group', 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    favoriteRequest.clearFavoriteGroup({
                        type: ctx.type,
                        group: ctx.name
                    });
                }
            })
            .catch(() => {});
    }

    function handleVisibilitySelection(group, visibility) {
        const menuKey = remoteGroupMenuKey(group.key);
        changeFriendGroupVisibility(group.name, visibility, menuKey);
    }

    function handleRemoteRename(group) {
        handleGroupMenuVisible(remoteGroupMenuKey(group.key), false);
        changeFavoriteGroupName(group);
    }

    function handleRemoteClear(group) {
        handleGroupMenuVisible(remoteGroupMenuKey(group.key), false);
        clearFavoriteGroup(group);
    }

    function changeFavoriteGroupName(group) {
        const currentName = group.displayName || group.name;
        ElMessageBox.prompt(
            t('prompt.change_favorite_group_name.description'),
            t('prompt.change_favorite_group_name.header'),
            {
                confirmButtonText: t('prompt.change_favorite_group_name.change'),
                cancelButtonText: t('prompt.change_favorite_group_name.cancel'),
                inputPlaceholder: t('prompt.change_favorite_group_name.input_placeholder'),
                inputPattern: /\S+/,
                inputValue: currentName,
                inputErrorMessage: t('prompt.change_favorite_group_name.input_error')
            }
        )
            .then(({ value }) => {
                const newName = value.trim();
                if (!newName || newName === currentName) {
                    return;
                }
                favoriteRequest
                    .saveFavoriteGroup({
                        type: 'friend',
                        group: group.name,
                        displayName: newName
                    })
                    .then((args) => {
                        handleFavoriteGroup({
                            json: args.json,
                            params: {
                                favoriteGroupId: args.json.id
                            }
                        });
                        toast.success(t('prompt.change_favorite_group_name.message.success'));
                        refreshFavorites();
                    });
            })
            .catch(() => {});
    }

    function changeFriendGroupVisibility(name, visibility, menuKey = null) {
        const params = {
            type: 'friend',
            group: name,
            visibility
        };
        favoriteRequest.saveFavoriteGroup(params).then((args) => {
            handleFavoriteGroup({
                json: args.json,
                params: {
                    favoriteGroupId: args.json.id
                }
            });
            toast.success('Group visibility changed');
            if (menuKey) {
                handleGroupMenuVisible(menuKey, false);
            }
            refreshFavorites();
            return args;
        });
    }

    function formatVisibility(value) {
        if (!value) {
            return '';
        }
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
</script>

<style scoped>
    .favorites-page {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        padding-bottom: 0;
    }

    .favorites-toolbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
        flex-wrap: wrap;
    }

    .favorites-toolbar__select {
        min-width: 200px;
    }

    .favorites-toolbar__right {
        display: flex;
        align-items: center;
        gap: 8px;
        flex: 1;
    }

    .favorites-toolbar__search {
        flex: 1;
    }

    .favorites-splitter {
        flex: 1;
        min-height: 0;
    }

    .favorites-groups-panel {
        height: 100%;
        padding-right: 8px;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    .favorites-dropdown {
        padding: 10px;
    }

    .group-section {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .group-section__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-weight: 600;
        font-size: 14px;
        margin-bottom: 9px;
    }

    .group-section__list {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .group-item {
        border: 1px solid var(--el-border-color);
        border-radius: 8px;
        padding: 8px;
        cursor: pointer;
        box-shadow: 0 0 6px rgba(15, 23, 42, 0.04);
        transition:
            box-shadow 0.2s ease,
            transform 0.2s ease;
    }

    .group-item:hover {
        box-shadow: 0 2px 6px rgba(15, 23, 42, 0.07);
        transform: translateY(-2px);
    }

    .group-item__top {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        margin-bottom: 4px;
        font-size: 13px;
    }

    .group-item__name {
        font-weight: 600;
    }

    .group-item__count {
        font-size: 12px;
        color: var(--el-text-color-secondary);
    }

    .group-item__bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
    }

    .group-item.is-active {
        border-color: var(--el-color-primary);
        background-color: var(--el-color-primary-light-9, rgba(64, 158, 255, 0.12));
    }

    .group-empty {
        text-align: center;
        color: var(--el-text-color-secondary);
        font-size: 12px;
        padding: 12px 0;
    }

    .favorites-group-menu {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .favorites-group-menu__item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border: none;
        background: transparent;
        border-radius: 8px;
        padding: 6px 12px;
        font-size: 13px;
        cursor: pointer;
        color: inherit;
        transition: background-color 0.15s ease;
        min-height: 32px;
        align-self: stretch;
    }

    .favorites-group-menu__item:hover {
        background-color: var(--el-menu-hover-bg-color);
    }

    .favorites-group-menu__item--danger {
        color: var(--el-color-danger);
    }

    .favorites-group-menu__item--submenu {
        padding-right: 8px;
    }

    .favorites-group-menu__arrow {
        margin-left: auto;
        color: var(--el-text-color-secondary);
        font-size: 12px;
    }

    .group-visibility-menu {
        display: flex;
        flex-direction: column;
        gap: 4px;
    }

    .group-visibility-menu__item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        border: none;
        background: transparent;
        padding: 6px 10px;
        border-radius: 8px;
        cursor: pointer;
        color: inherit;
        font-size: 13px;
        transition: background-color 0.15s ease;
        min-height: 32px;
        align-self: stretch;
    }

    .group-visibility-menu__item:hover,
    .group-visibility-menu__item.is-active {
        background-color: var(--el-menu-hover-bg-color);
    }

    .group-visibility-menu__check {
        font-size: 12px;
        color: var(--el-color-primary);
    }

    .favorites-content {
        display: flex;
        flex-direction: column;
        height: 100%;
        min-height: 0;
        padding-left: 26px;
    }

    .favorites-content__header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
        margin-bottom: 12px;
    }

    .favorites-content__title {
        display: flex;
        flex-direction: column;
        gap: 2px;
        font-size: 16px;
        font-weight: 600;
        padding-left: 2px;
    }

    .favorites-content__title small {
        font-size: 12px;
        font-weight: normal;
        color: var(--el-text-color-secondary);
    }

    .favorites-content__edit {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
        color: var(--el-text-color-regular);
    }

    .favorites-content__edit-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
    }

    .favorites-content__actions {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-bottom: 12px;
    }

    .favorites-content__actions .el-button {
        margin: 0;
    }

    .favorites-content__list {
        flex: 1;
        min-height: 0;
    }

    .favorites-content__scroll {
        height: 100%;
        padding-right: 8px;
    }

    .favorites-content__scroll--native {
        overflow: auto;
    }

    .favorites-search-grid {
        display: grid;
        grid-template-columns: repeat(
            var(--favorites-grid-columns, 1),
            minmax(var(--favorites-card-min-width, 240px), var(--favorites-card-target-width, 1fr))
        );
        gap: var(--favorites-card-gap, 12px);
        justify-content: start;
        padding-bottom: 12px;
    }

    .favorites-card-list {
        display: grid;
        grid-template-columns: repeat(
            var(--favorites-grid-columns, 1),
            minmax(var(--favorites-card-min-width, 260px), var(--favorites-card-target-width, 1fr))
        );
        gap: var(--favorites-card-gap, 12px);
        justify-content: start;
        padding: 4px 2px 12px 2px;
    }

    .favorites-card-list::after {
        content: '';
    }

    :deep(.favorites-search-card--friend) {
        min-width: var(--favorites-card-min-width, 240px);
        max-width: var(--favorites-card-target-width, 320px);
    }

    :deep(.favorites-search-card) {
        display: flex;
        align-items: center;
        box-sizing: border-box;
        border: 1px solid var(--el-border-color);
        border-radius: calc(8px * var(--favorites-card-scale, 1));
        padding: var(--favorites-card-padding-y, 8px) var(--favorites-card-padding-x, 10px);
        cursor: pointer;
        background: var(--el-bg-color);
        transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease;
        box-shadow: 0 0 6px rgba(15, 23, 42, 0.04);
        width: 100%;
        min-width: var(--favorites-card-min-width, 240px);
        max-width: var(--favorites-card-target-width, 320px);
    }

    :deep(.favorites-search-card:hover) {
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.07);
        transform: translateY(-2px);
    }

    :deep(.favorites-search-card.is-selected) {
        border-color: var(--el-color-primary);
        box-shadow: 0 0 0 1px var(--el-color-primary-light-3, rgba(64, 158, 255, 0.4));
    }

    :deep(.favorites-search-card__content) {
        display: flex;
        align-items: center;
        gap: var(--favorites-card-content-gap, 10px);
        flex: 1;
        min-width: 0;
    }

    :deep(.favorites-search-card__avatar) {
        width: calc(48px * var(--favorites-card-scale, 1));
        height: calc(48px * var(--favorites-card-scale, 1));
        border-radius: calc(6px * var(--favorites-card-scale, 1));
        overflow: hidden;
        background: var(--el-fill-color-lighter);
        flex-shrink: 0;
    }

    :deep(.favorites-search-card__avatar img) {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    :deep(.favorites-search-card__avatar.is-empty) {
        background: repeating-linear-gradient(
            -45deg,
            rgba(148, 163, 184, 0.25),
            rgba(148, 163, 184, 0.25) 10px,
            rgba(255, 255, 255, 0.35) 10px,
            rgba(255, 255, 255, 0.35) 20px
        );
    }

    :deep(.favorites-search-card__detail) {
        display: flex;
        flex-direction: column;
        gap: 4px;
        font-size: calc(13px * var(--favorites-card-scale, 1));
        min-width: 0;
    }

    :deep(.favorites-search-card__detail .name) {
        font-weight: 600;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    :deep(.favorites-search-card__detail .extra) {
        font-size: calc(12px * var(--favorites-card-scale, 1));
        color: var(--el-text-color-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    :deep(.favorites-search-card__title) {
        display: flex;
        align-items: center;
        gap: 6px;
    }

    :deep(.favorites-search-card__badges) {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: var(--el-text-color-secondary);
        font-size: 14px;
    }

    :deep(.favorites-search-card__actions) {
        display: flex;
        flex-direction: column;
        gap: var(--favorites-card-action-gap, 8px);
        margin-left: var(--favorites-card-action-margin, 8px);
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        min-width: 48px;
    }

    :deep(.favorites-search-card__action) {
        display: flex;
        justify-content: flex-end;
        width: 100%;
    }

    :deep(.favorites-search-card__dropdown) {
        width: 100%;
    }

    :deep(.favorites-search-card__action-group) {
        display: flex;
        gap: var(--favorites-card-action-group-gap, 6px);
        width: 100%;
    }

    :deep(.favorites-search-card__action-group .favorites-search-card__action--full) {
        flex: 1;
    }

    :deep(.favorites-search-card__action--checkbox) {
        align-items: center;
        justify-content: flex-end;
        margin-right: var(--favorites-card-checkbox-margin, 10px);
    }

    :deep(.favorites-search-card__action--checkbox .el-checkbox) {
        margin: 0;
    }

    :deep(.favorites-search-card__actions:empty) {
        display: none;
    }

    :deep(.favorites-search-card__location) {
        font-size: 12px;
        color: var(--el-text-color-secondary);
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .favorites-empty {
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--el-text-color-secondary);
        font-size: 13px;
        height: 100%;
    }

    .favorites-dropdown__control {
        list-style: none;
        padding: 12px 16px 8px;
        min-width: 220px;
        cursor: default;
    }

    .favorites-dropdown__control:not(:last-child) {
        border-bottom: 1px solid var(--el-border-color-lighter);
    }

    .favorites-dropdown__control-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
        font-weight: 600;
        color: var(--el-text-color-primary);
        margin-bottom: 6px;
    }

    .favorites-dropdown__control-value {
        font-size: 12px;
        color: var(--el-text-color-secondary);
    }

    .favorites-dropdown__slider {
        padding: 0 4px 4px;
    }

    .favorites-dropdown__slider :deep(.el-slider__runway) {
        margin: 0;
    }
</style>
