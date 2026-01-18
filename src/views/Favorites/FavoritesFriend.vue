<template>
    <div class="favorites-page x-container">
        <div class="favorites-toolbar">
            <div>
                <Select :model-value="sortFavorites" @update:modelValue="handleSortFavoritesChange">
                    <SelectTrigger size="sm" class="favorites-toolbar__select">
                        <span class="flex items-center gap-2">
                            <ArrowUpDown class="h-4 w-4" />
                            <SelectValue
                                :placeholder="t('view.settings.appearance.appearance.sort_favorite_by_name')" />
                        </span>
                    </SelectTrigger>
                    <SelectContent>
                        <SelectGroup>
                            <SelectItem
                                :value="false"
                                :text-value="t('view.settings.appearance.appearance.sort_favorite_by_name')">
                                {{ t('view.settings.appearance.appearance.sort_favorite_by_name') }}
                            </SelectItem>
                            <SelectItem
                                :value="true"
                                :text-value="t('view.settings.appearance.appearance.sort_favorite_by_date')">
                                {{ t('view.settings.appearance.appearance.sort_favorite_by_date') }}
                            </SelectItem>
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <div class="favorites-toolbar__right">
                <InputGroupSearch
                    v-model="friendFavoriteSearch"
                    class="favorites-toolbar__search"
                    :placeholder="t('view.favorite.worlds.search')"
                    @input="searchFriendFavorites" />
                <DropdownMenu v-model:open="friendToolbarMenuOpen">
                    <DropdownMenuTrigger as-child>
                        <Button class="rounded-full" size="icon-sm" variant="ghost"><Ellipsis /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent class="favorites-dropdown">
                        <li class="favorites-dropdown__control" @click.stop>
                            <div class="favorites-dropdown__control-header">
                                <span>Scale</span>
                                <span class="favorites-dropdown__control-value"> {{ friendCardScalePercent }}% </span>
                            </div>
                            <Slider
                                v-model="friendCardScaleValue"
                                class="favorites-dropdown__slider"
                                :min="friendCardScaleSlider.min"
                                :max="friendCardScaleSlider.max"
                                :step="friendCardScaleSlider.step" />
                        </li>
                        <li class="favorites-dropdown__control" @click.stop>
                            <div class="favorites-dropdown__control-header">
                                <span>Spacing</span>
                                <span class="favorites-dropdown__control-value"> {{ friendCardSpacingPercent }}% </span>
                            </div>
                            <Slider
                                v-model="friendCardSpacingValue"
                                class="favorites-dropdown__slider"
                                :min="friendCardSpacingSlider.min"
                                :max="friendCardSpacingSlider.max"
                                :step="friendCardSpacingSlider.step" />
                        </li>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="handleFriendImportClick">
                            {{ t('view.favorite.import') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="handleFriendExportClick">
                            {{ t('view.favorite.export') }}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        <ResizablePanelGroup
            ref="friendSplitterGroupRef"
            direction="horizontal"
            class="favorites-splitter"
            @layout="handleFriendSplitterLayout">
            <ResizablePanel
                ref="friendSplitterPanelRef"
                :default-size="friendSplitterDefaultSize"
                :min-size="friendSplitterMinSize"
                :max-size="friendSplitterMaxSize"
                :collapsed-size="0"
                collapsible
                :order="1">
                <div class="favorites-groups-panel">
                    <div class="group-section">
                        <div class="group-section__header">
                            <span>{{ t('view.favorite.worlds.vrchat_favorites') }}</span>
                            <TooltipWrapper side="bottom" :content="t('view.favorite.refresh_favorites_tooltip')">
                                <Button
                                    class="rounded-full"
                                    variant="outline"
                                    size="icon-sm"
                                    :disabled="isFavoriteLoading"
                                    @click.stop="handleRefreshFavorites">
                                    <Spinner v-if="isFavoriteLoading" />
                                    <RefreshCw v-else />
                                </Button>
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
                                        <DropdownMenu
                                            :open="activeGroupMenu === remoteGroupMenuKey(group.key)"
                                            @update:open="
                                                handleGroupMenuVisible(remoteGroupMenuKey(group.key), $event)
                                            ">
                                            <DropdownMenuTrigger asChild>
                                                <Button class="rounded-full" variant="ghost" size="icon-sm" @click.stop>
                                                    <MoreHorizontal />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent side="right" class="w-55">
                                                <DropdownMenuItem @click="handleRemoteRename(group)">
                                                    <span>{{ t('view.favorite.rename_tooltip') }}</span>
                                                </DropdownMenuItem>
                                                <DropdownMenuSub>
                                                    <DropdownMenuSubTrigger>
                                                        <span>{{ t('view.favorite.visibility_tooltip') }}</span>
                                                    </DropdownMenuSubTrigger>
                                                    <DropdownMenuPortal>
                                                        <DropdownMenuSubContent
                                                            side="right"
                                                            align="start"
                                                            class="w-[180px]">
                                                            <DropdownMenuCheckboxItem
                                                                v-for="visibility in friendGroupVisibilityOptions"
                                                                :key="visibility"
                                                                :model-value="group.visibility === visibility"
                                                                indicator-position="right"
                                                                @select="handleVisibilitySelection(group, visibility)">
                                                                <span>{{ formatVisibility(visibility) }}</span>
                                                            </DropdownMenuCheckboxItem>
                                                        </DropdownMenuSubContent>
                                                    </DropdownMenuPortal>
                                                </DropdownMenuSub>
                                                <DropdownMenuItem
                                                    variant="destructive"
                                                    @click="handleRemoteClear(group)">
                                                    <span>{{ t('view.favorite.clear') }}</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </template>
                            <div v-else class="group-empty">No Data</div>
                        </div>
                    </div>
                </div>
            </ResizablePanel>
            <ResizableHandle with-handle @dragging="setFriendSplitterDragging" />
            <ResizablePanel :order="2">
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
                            <Button size="sm" variant="outline" @click="toggleSelectAllFriends">
                                {{
                                    isAllFriendsSelected
                                        ? t('view.favorite.deselect_all')
                                        : t('view.favorite.select_all')
                                }}
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                :disabled="!hasFriendSelection"
                                @click="clearSelectedFriends">
                                {{ t('view.favorite.clear') }}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                :disabled="!hasFriendSelection"
                                @click="copySelectedFriends">
                                {{ t('view.favorite.copy') }}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                :disabled="!hasFriendSelection"
                                @click="showFriendBulkUnfavoriteSelectionConfirm">
                                {{ t('view.favorite.bulk_unfavorite') }}
                            </Button>
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
                                                <span v-else class="text-xs">{{ favorite.statusDescription }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="favorites-empty">No Data</div>
                            </div>
                        </template>
                    </div>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
        <FriendExportDialog v-model:friendExportDialogVisible="friendExportDialogVisible" />
    </div>
</template>

<script setup>
    import { computed, nextTick, onBeforeMount, onMounted, onUnmounted, ref, watch } from 'vue';
    import { ArrowUpDown, Check, Ellipsis, MoreHorizontal, RefreshCw } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { InputGroupSearch } from '@/components/ui/input-group';
    import { Spinner } from '@/components/ui/spinner';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        DropdownMenu,
        DropdownMenuCheckboxItem,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuPortal,
        DropdownMenuSeparator,
        DropdownMenuSub,
        DropdownMenuSubContent,
        DropdownMenuSubTrigger,
        DropdownMenuTrigger
    } from '../../components/ui/dropdown-menu';
    import {
        Select,
        SelectContent,
        SelectGroup,
        SelectItem,
        SelectTrigger,
        SelectValue
    } from '../../components/ui/select';
    import { useAppearanceSettingsStore, useFavoriteStore, useModalStore, useUserStore } from '../../stores';
    import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../components/ui/resizable';
    import { Badge } from '../../components/ui/badge';
    import { Slider } from '../../components/ui/slider';
    import { Switch } from '../../components/ui/switch';
    import { favoriteRequest } from '../../api';
    import { useFavoritesCardScaling } from './composables/useFavoritesCardScaling.js';
    import { userImage } from '../../shared/utils';

    import FavoritesFriendItem from './components/FavoritesFriendItem.vue';
    import FriendExportDialog from './dialogs/FriendExportDialog.vue';
    import configRepository from '../../service/config.js';

    const friendGroupVisibilityOptions = ref(['public', 'friends', 'private']);

    const friendSplitterSize = ref(260);
    const friendSplitterFallbackWidth = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1200;
    const friendSplitterGroupRef = ref(null);
    const friendSplitterPanelRef = ref(null);
    const friendSplitterWidth = ref(friendSplitterFallbackWidth);
    const friendSplitterDraggingCount = ref(0);
    let friendSplitterObserver = null;

    const { sortFavorites } = storeToRefs(useAppearanceSettingsStore());
    const { setSortFavorites } = useAppearanceSettingsStore();
    const favoriteStore = useFavoriteStore();
    const modalStore = useModalStore();
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
    const friendCardScaleValue = computed({
        get: () => [friendCardScale.value],
        set: (value) => {
            const next = value?.[0];
            if (typeof next === 'number') {
                friendCardScale.value = next;
            }
        }
    });
    const friendCardSpacingValue = computed({
        get: () => [friendCardSpacing.value],
        set: (value) => {
            const next = value?.[0];
            if (typeof next === 'number') {
                friendCardSpacing.value = next;
            }
        }
    });

    const friendExportDialogVisible = ref(false);
    const friendFavoriteSearch = ref('');
    const friendFavoriteSearchResults = ref([]);
    const friendEditMode = ref(false);
    const selectedGroup = ref(null);
    const activeGroupMenu = ref(null);
    const friendToolbarMenuOpen = ref(false);

    function handleSortFavoritesChange(value) {
        const next = Boolean(value);
        if (next !== sortFavorites.value) {
            setSortFavorites();
        }
    }

    const hasFriendSelection = computed(() => selectedFavoriteFriends.value.length > 0);
    const hasSearchInput = computed(() => friendFavoriteSearch.value.trim().length > 0);
    const isSearchActive = computed(() => friendFavoriteSearch.value.trim().length >= 3);
    const isRemoteGroupSelected = computed(() => selectedGroup.value?.type === 'remote');

    const closeFriendToolbarMenu = () => {
        friendToolbarMenuOpen.value = false;
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
        const parsedSize = Number(storedSize);
        if (Number.isFinite(parsedSize) && parsedSize >= 0) {
            friendSplitterSize.value = parsedSize;
        }
    }

    const getFriendSplitterWidthRaw = () => {
        const element = friendSplitterGroupRef.value?.$el ?? friendSplitterGroupRef.value;
        const width = element?.getBoundingClientRect?.().width;
        return Number.isFinite(width) ? width : null;
    };

    const getFriendSplitterWidth = () => {
        const width = getFriendSplitterWidthRaw();
        return Number.isFinite(width) && width > 0 ? width : friendSplitterFallbackWidth;
    };

    const resolveDraggingPayload = (payload) => {
        if (typeof payload === 'boolean') {
            return payload;
        }
        if (payload && typeof payload === 'object') {
            if (typeof payload.detail === 'boolean') {
                return payload.detail;
            }
            if (typeof payload.dragging === 'boolean') {
                return payload.dragging;
            }
        }
        return Boolean(payload);
    };

    const setFriendSplitterDragging = (payload) => {
        const isDragging = resolveDraggingPayload(payload);
        const next = friendSplitterDraggingCount.value + (isDragging ? 1 : -1);
        friendSplitterDraggingCount.value = Math.max(0, next);
    };

    const pxToPercent = (px, groupWidth, min = 0) => {
        const width = groupWidth ?? getFriendSplitterWidth();
        return Math.min(100, Math.max(min, (px / width) * 100));
    };

    const percentToPx = (percent, groupWidth) => (percent / 100) * groupWidth;

    const friendSplitterDefaultSize = computed(() =>
        pxToPercent(friendSplitterSize.value, friendSplitterWidth.value, 0)
    );
    const friendSplitterMinSize = computed(() => pxToPercent(0, friendSplitterWidth.value, 0));
    const friendSplitterMaxSize = computed(() => pxToPercent(360, friendSplitterWidth.value, 0));

    const handleFriendSplitterLayout = (sizes) => {
        if (!Array.isArray(sizes) || !sizes.length) {
            return;
        }

        if (friendSplitterDraggingCount.value === 0) {
            return;
        }

        const rawWidth = getFriendSplitterWidthRaw();
        if (!Number.isFinite(rawWidth) || rawWidth <= 0) {
            return;
        }

        const nextSize = sizes[0];
        if (!Number.isFinite(nextSize)) {
            return;
        }

        const nextPx = Math.round(percentToPx(nextSize, rawWidth));
        const clampedPx = Math.min(360, Math.max(0, nextPx));
        friendSplitterSize.value = clampedPx;
        configRepository.setString('VRCX_FavoritesFriendSplitter', clampedPx.toString());
    };

    const updateFriendSplitterWidth = () => {
        const width = getFriendSplitterWidth();
        friendSplitterWidth.value = width;
        const targetSize = pxToPercent(friendSplitterSize.value, width, 0);
        friendSplitterPanelRef.value?.resize?.(targetSize);
    };

    onMounted(async () => {
        await nextTick();
        updateFriendSplitterWidth();
        const element = friendSplitterGroupRef.value?.$el ?? friendSplitterGroupRef.value;
        if (element && typeof ResizeObserver !== 'undefined') {
            friendSplitterObserver = new ResizeObserver(updateFriendSplitterWidth);
            friendSplitterObserver.observe(element);
        }
    });

    onUnmounted(() => {
        if (friendSplitterObserver) {
            friendSplitterObserver.disconnect();
            friendSplitterObserver = null;
        }
    });

    watch(friendSplitterSize, (value, previous) => {
        if (value === previous) {
            return;
        }
        if (friendSplitterDraggingCount.value > 0) {
            return;
        }
        updateFriendSplitterWidth();
    });

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
        modalStore
            .confirm({
                description: `Are you sure you want to unfavorite ${total} favorites?\n            This action cannot be undone.`,
                title: `Trash2 ${total} favorites?`
            })
            .then(({ ok }) => ok && bulkUnfavoriteSelectedFriends([...selectedFavoriteFriends.value]))
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
        modalStore
            .confirm({
                description: 'Continue? Clear Group',
                title: 'Confirm'
            })
            .then(() => {
                favoriteRequest.clearFavoriteGroup({
                    type: ctx.type,
                    group: ctx.name
                });
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
        modalStore
            .prompt({
                title: t('prompt.change_favorite_group_name.header'),
                description: t('prompt.change_favorite_group_name.description'),
                confirmText: t('prompt.change_favorite_group_name.change'),
                cancelText: t('prompt.change_favorite_group_name.cancel'),
                pattern: /\S+/,
                inputValue: currentName,
                errorMessage: t('prompt.change_favorite_group_name.input_error')
            })
            .then(({ ok, value }) => {
                if (!ok) return;
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

    .favorites-splitter :deep([data-slot='resizable-handle']) {
        opacity: 0;
        transition: opacity 0.2s ease;
    }

    .favorites-splitter :deep([data-slot='resizable-handle']:hover),
    .favorites-splitter :deep([data-slot='resizable-handle']:focus-visible) {
        opacity: 1;
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
        border-radius: 8px;
        border: 1px solid var(--border);
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
    }

    .group-item__bottom {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
    }

    .group-item.is-active {
    }

    .group-empty {
        text-align: center;
        font-size: 12px;
        padding: 12px 0;
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
    }

    .favorites-content__edit {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 13px;
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
        border: 1px solid var(--border);
        border-radius: calc(8px * var(--favorites-card-scale, 1));
        padding: var(--favorites-card-padding-y, 8px) var(--favorites-card-padding-x, 10px);
        cursor: pointer;
        transition:
            border-color 0.2s ease,
            box-shadow 0.2s ease,
            transform 0.2s ease;
        box-shadow: 0 0 6px rgba(15, 23, 42, 0.04);
        width: 100%;
        min-width: var(--favorites-card-min-width, 240px);
        max-width: var(--favorites-card-target-width, 320px);
    }

    :deep(.favorites-search-card:hover) {
        box-shadow: 0 4px 14px rgba(15, 23, 42, 0.07);
        transform: translateY(calc(-2px * var(--favorites-card-scale, 1)));
    }

    :deep(.favorites-search-card.is-selected) {
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

    :deep(.favorites-search-card__action--checkbox [data-slot='checkbox']) {
        margin: 0;
    }

    :deep(.favorites-search-card__actions:empty) {
        display: none;
    }

    :deep(.favorites-search-card__location) {
        font-size: 12px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .favorites-empty {
        display: flex;
        align-items: center;
        justify-content: center;
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
    }

    .favorites-dropdown__control-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        font-size: 13px;
        font-weight: 600;
        margin-bottom: 6px;
    }

    .favorites-dropdown__control-value {
        font-size: 12px;
    }

    .favorites-dropdown__slider {
        padding: 0 4px 4px;
    }
</style>
