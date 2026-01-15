<template>
    <div class="favorites-page x-container" v-loading="isFavoriteLoading">
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
                    v-model="worldFavoriteSearch"
                    class="favorites-toolbar__search"
                    :placeholder="t('view.favorite.worlds.search')"
                    @input="searchWorldFavorites" />
                <DropdownMenu v-model:open="worldToolbarMenuOpen">
                    <DropdownMenuTrigger as-child>
                        <Button class="rounded-full" size="icon" variant="outline"><Ellipsis /></Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent class="favorites-dropdown">
                        <li class="favorites-dropdown__control" @click.stop>
                            <div class="favorites-dropdown__control-header">
                                <span>Scale</span>
                                <span class="favorites-dropdown__control-value"> {{ worldCardScalePercent }}% </span>
                            </div>
                            <Slider
                                v-model="worldCardScaleValue"
                                class="favorites-dropdown__slider"
                                :min="worldCardScaleSlider.min"
                                :max="worldCardScaleSlider.max"
                                :step="worldCardScaleSlider.step" />
                        </li>
                        <li class="favorites-dropdown__control" @click.stop>
                            <div class="favorites-dropdown__control-header">
                                <span>Spacing</span>
                                <span class="favorites-dropdown__control-value"> {{ worldCardSpacingPercent }}% </span>
                            </div>
                            <Slider
                                v-model="worldCardSpacingValue"
                                class="favorites-dropdown__slider"
                                :min="worldCardSpacingSlider.min"
                                :max="worldCardSpacingSlider.max"
                                :step="worldCardSpacingSlider.step" />
                        </li>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="handleWorldImportClick">
                            {{ t('view.favorite.import') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="handleWorldExportClick">
                            {{ t('view.favorite.export') }}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        <ResizablePanelGroup
            ref="worldSplitterGroupRef"
            direction="horizontal"
            class="favorites-splitter"
            @layout="handleWorldSplitterLayout">
            <ResizablePanel
                ref="worldSplitterPanelRef"
                :default-size="worldSplitterDefaultSize"
                :min-size="worldSplitterMinSize"
                :max-size="worldSplitterMaxSize"
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
                            <template v-if="favoriteWorldGroups.length">
                                <div
                                    v-for="group in favoriteWorldGroups"
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
                                            <DropdownMenuContent side="right" class="w-50 p-1 rounded-lg">
                                                <div class="favorites-group-menu">
                                                    <button
                                                        type="button"
                                                        class="favorites-group-menu__item"
                                                        @click="handleRemoteRename(group)">
                                                        <span>{{ t('view.favorite.rename_tooltip') }}</span>
                                                    </button>
                                                    <DropdownMenuSub>
                                                        <DropdownMenuSubTrigger
                                                            class="favorites-group-menu__item favorites-group-menu__item--submenu">
                                                            <span>{{ t('view.favorite.visibility_tooltip') }}</span>
                                                        </DropdownMenuSubTrigger>
                                                        <DropdownMenuPortal>
                                                            <DropdownMenuSubContent
                                                                side="right"
                                                                align="start"
                                                                class="w-[200px] p-1 rounded-lg">
                                                                <div class="group-visibility-menu">
                                                                    <button
                                                                        v-for="visibility in worldGroupVisibilityOptions"
                                                                        :key="visibility"
                                                                        type="button"
                                                                        class="group-visibility-menu__item"
                                                                        :class="{
                                                                            'is-active': group.visibility === visibility
                                                                        }"
                                                                        @click="
                                                                            handleVisibilitySelection(group, visibility)
                                                                        ">
                                                                        <span>{{ formatVisibility(visibility) }}</span>
                                                                        <span
                                                                            v-if="group.visibility === visibility"
                                                                            class="group-visibility-menu__check"
                                                                            >✔</span
                                                                        >
                                                                    </button>
                                                                </div>
                                                            </DropdownMenuSubContent>
                                                        </DropdownMenuPortal>
                                                    </DropdownMenuSub>
                                                    <button
                                                        type="button"
                                                        class="favorites-group-menu__item favorites-group-menu__item--danger"
                                                        @click="handleRemoteClear(group)">
                                                        <span>{{ t('view.favorite.clear') }}</span>
                                                    </button>
                                                </div>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            </template>
                            <template v-else>
                                <div
                                    v-for="group in worldGroupPlaceholders"
                                    :key="group.key"
                                    :class="[
                                        'group-item',
                                        'group-item--placeholder',
                                        { 'is-active': !hasSearchInput && isGroupActive('remote', group.key) }
                                    ]">
                                    <div class="group-item__top">
                                        <span class="group-item__name">{{ group.displayName }}</span>
                                        <span class="group-item__count">--/--</span>
                                    </div>
                                    <div class="group-item__bottom">
                                        <div class="group-item__placeholder-tag"></div>
                                    </div>
                                </div>
                            </template>
                        </div>
                    </div>
                    <div class="group-section">
                        <div class="group-section__header">
                            <span>{{ t('view.favorite.worlds.local_favorites') }}</span>
                            <Button
                                class="rounded-full"
                                size="icon-sm"
                                variant="outline"
                                v-if="!refreshingLocalFavorites"
                                @click.stop="refreshLocalWorldFavorites"
                                ><RefreshCcw
                            /></Button>
                            <Button size="icon-sm" variant="ghost" v-else @click.stop="cancelLocalWorldRefresh">
                                <RefreshCcw />
                                {{ t('view.favorite.worlds.cancel_refresh') }}
                            </Button>
                        </div>
                        <div class="group-section__list">
                            <template v-if="localWorldFavoriteGroups.length">
                                <div
                                    v-for="group in localWorldFavoriteGroups"
                                    :key="group"
                                    :class="[
                                        'group-item',
                                        { 'is-active': !hasSearchInput && isGroupActive('local', group) }
                                    ]"
                                    @click="handleGroupClick('local', group)">
                                    <div class="group-item__top">
                                        <span class="group-item__name">{{ group }}</span>
                                        <div class="group-item__right">
                                            <span class="group-item__count">{{ localWorldFavGroupLength(group) }}</span>
                                            <div class="group-item__bottom">
                                                <DropdownMenu
                                                    :open="activeGroupMenu === localGroupMenuKey(group)"
                                                    @update:open="
                                                        handleGroupMenuVisible(localGroupMenuKey(group), $event)
                                                    ">
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            class="rounded-full"
                                                            size="icon-sm"
                                                            variant="ghost"
                                                            @click.stop
                                                            ><Ellipsis
                                                        /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent side="right" class="w-50 p-1 rounded-lg">
                                                        <div class="favorites-group-menu">
                                                            <button
                                                                type="button"
                                                                class="favorites-group-menu__item"
                                                                @click="handleLocalRename(group)">
                                                                <span>{{ t('view.favorite.rename_tooltip') }}</span>
                                                            </button>
                                                            <button
                                                                type="button"
                                                                class="favorites-group-menu__item favorites-group-menu__item--danger"
                                                                @click="handleLocalDelete(group)">
                                                                <span>{{ t('view.favorite.delete_tooltip') }}</span>
                                                            </button>
                                                        </div>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <div v-else class="group-empty">No Data</div>
                            <div
                                v-if="!isCreatingLocalGroup"
                                class="group-item group-item--new"
                                @click="startLocalGroupCreation">
                                <Plus />
                                <span>{{ t('view.favorite.worlds.new_group') }}</span>
                            </div>
                            <InputGroupField
                                v-else
                                ref="newLocalGroupInput"
                                v-model="newLocalGroupName"
                                size="sm"
                                class="group-item__input"
                                :placeholder="t('view.favorite.worlds.new_group')"
                                @keyup.enter="handleLocalGroupCreationConfirm"
                                @keyup.esc="cancelLocalGroupCreation"
                                @blur="cancelLocalGroupCreation" />
                        </div>
                    </div>
                </div>
            </ResizablePanel>
            <ResizableHandle with-handle @dragging="setWorldSplitterDragging" />
            <ResizablePanel :order="2">
                <div class="favorites-content">
                    <div class="favorites-content__header">
                        <div class="favorites-content__title">
                            <span v-if="isSearchActive">{{ t('view.favorite.worlds.search') }}</span>
                            <template v-else-if="activeRemoteGroup">
                                <span
                                    >{{ activeRemoteGroup.displayName }} &nbsp;<small
                                        >{{ activeRemoteGroup.count }}/{{ activeRemoteGroup.capacity }}</small
                                    ></span
                                >
                            </template>
                            <span v-else-if="activeLocalGroupName">
                                {{ activeLocalGroupName }}
                                <small>{{ activeLocalGroupCount }}</small>
                            </span>
                            <span v-else>No Group Selected</span>
                        </div>
                        <div class="favorites-content__edit">
                            <span>{{ t('view.favorite.edit_mode') }}</span>
                            <Switch v-model="worldEditMode" :disabled="isSearchActive" />
                        </div>
                    </div>
                    <div class="favorites-content__edit-actions">
                        <div v-if="worldEditMode && !isSearchActive" class="favorites-content__actions">
                            <Button size="sm" variant="outline" @click="toggleSelectAllWorlds">
                                {{
                                    isAllWorldsSelected
                                        ? t('view.favorite.deselect_all')
                                        : t('view.favorite.select_all')
                                }}
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                :disabled="!hasWorldSelection"
                                @click="clearSelectedWorlds">
                                {{ t('view.favorite.clear') }}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                :disabled="!hasWorldSelection"
                                @click="copySelectedWorlds">
                                {{ t('view.favorite.copy') }}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                :disabled="!hasWorldSelection"
                                @click="showWorldBulkUnfavoriteSelectionConfirm">
                                {{ t('view.favorite.bulk_unfavorite') }}
                            </Button>
                        </div>
                    </div>
                    <div ref="worldFavoritesContainerRef" class="favorites-content__list">
                        <template v-if="isSearchActive">
                            <div class="favorites-content__scroll favorites-content__scroll--native">
                                <div
                                    v-if="worldFavoriteSearchResults.length"
                                    class="favorites-search-grid"
                                    :style="worldFavoritesGridStyle(worldFavoriteSearchResults.length)">
                                    <div
                                        v-for="favorite in worldFavoriteSearchResults"
                                        :key="favorite.id"
                                        class="favorites-search-card"
                                        @click="showWorldDialog(favorite.id)">
                                        <div class="favorites-search-card__content">
                                            <div
                                                class="favorites-search-card__avatar"
                                                :class="{ 'is-empty': !favorite.thumbnailImageUrl }">
                                                <img
                                                    v-if="favorite.thumbnailImageUrl"
                                                    :src="favorite.thumbnailImageUrl"
                                                    loading="lazy" />
                                            </div>
                                            <div class="favorites-search-card__detail">
                                                <span class="name">{{ favorite.name || favorite.id }}</span>
                                                <span class="extra">
                                                    {{ favorite.authorName }}
                                                    <template v-if="favorite.occupants">
                                                        ({{ favorite.occupants }})
                                                    </template>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="favorites-empty">No Data</div>
                            </div>
                        </template>
                        <template v-else>
                            <div
                                v-if="activeRemoteGroup && isRemoteGroupSelected"
                                class="favorites-content__scroll favorites-content__scroll--native">
                                <template v-if="currentRemoteFavorites.length">
                                    <div
                                        class="favorites-card-list"
                                        :style="worldFavoritesGridStyle(currentRemoteFavorites.length)">
                                        <FavoritesWorldItem
                                            v-for="favorite in currentRemoteFavorites"
                                            :key="favorite.id"
                                            :group="activeRemoteGroup"
                                            :favorite="favorite"
                                            :edit-mode="worldEditMode"
                                            :selected="selectedFavoriteWorlds.includes(favorite.id)"
                                            @toggle-select="toggleWorldSelection(favorite.id, $event)"
                                            @click="showWorldDialog(favorite.id)" />
                                    </div>
                                </template>
                                <div v-else class="favorites-empty">No Data</div>
                            </div>
                            <ScrollArea
                                v-else-if="activeLocalGroupName && isLocalGroupSelected"
                                ref="localFavoritesScrollbarRef"
                                class="favorites-content__scroll"
                                @scroll="handleLocalFavoritesScroll">
                                <template v-if="currentLocalFavorites.length">
                                    <div
                                        class="favorites-card-list"
                                        :style="worldFavoritesGridStyle(currentLocalFavorites.length)">
                                        <FavoritesWorldLocalItem
                                            v-for="favorite in currentLocalFavorites"
                                            :key="favorite.id"
                                            :group="activeLocalGroupName"
                                            :favorite="favorite"
                                            :edit-mode="worldEditMode"
                                            @remove-local-world-favorite="removeLocalWorldFavorite"
                                            @click="showWorldDialog(favorite.id)" />
                                    </div>
                                </template>
                                <div v-else class="favorites-empty">No Data</div>
                            </ScrollArea>
                            <div v-else class="favorites-empty">No Data</div>
                        </template>
                    </div>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
        <WorldExportDialog v-model:worldExportDialogVisible="worldExportDialogVisible" />
    </div>
</template>

<script setup>
    import { computed, nextTick, onBeforeMount, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { ArrowUpDown, Ellipsis, MoreHorizontal, Plus, RefreshCcw, RefreshCw } from 'lucide-vue-next';
    import { InputGroupField, InputGroupSearch } from '@/components/ui/input-group';
    import { Button } from '@/components/ui/button';
    import { ScrollArea } from '@/components/ui/scroll-area';
    import { Spinner } from '@/components/ui/spinner';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        DropdownMenu,
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
    import { useAppearanceSettingsStore, useFavoriteStore, useModalStore, useWorldStore } from '../../stores';
    import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../components/ui/resizable';
    import { favoriteRequest, worldRequest } from '../../api';
    import { Badge } from '../../components/ui/badge';
    import { Slider } from '../../components/ui/slider';
    import { Switch } from '../../components/ui/switch';
    import { useFavoritesCardScaling } from './composables/useFavoritesCardScaling.js';

    import FavoritesWorldItem from './components/FavoritesWorldItem.vue';
    import FavoritesWorldLocalItem from './components/FavoritesWorldLocalItem.vue';
    import WorldExportDialog from './dialogs/WorldExportDialog.vue';
    import configRepository from '../../service/config.js';

    import * as workerTimers from 'worker-timers';

    const WORLD_GROUP_PLACEHOLDERS = Array.from({ length: 4 }, (_, index) => ({
        key: `world:worlds${index + 1}`,
        displayName: `Group ${index + 1}`
    }));

    const LOCAL_FAVORITES_PAGE_SIZE = 20;
    const LOCAL_FAVORITES_SCROLL_THRESHOLD = 120;
    const LOCAL_FAVORITES_VIEWPORT_BUFFER = 32;

    const { t } = useI18n();
    const { sortFavorites } = storeToRefs(useAppearanceSettingsStore());
    const { setSortFavorites } = useAppearanceSettingsStore();
    const favoriteStore = useFavoriteStore();
    const modalStore = useModalStore();
    const {
        favoriteWorlds,
        favoriteWorldGroups,
        localWorldFavorites,
        selectedFavoriteWorlds,
        worldImportDialogInput,
        isFavoriteLoading,
        localWorldFavoriteGroups
    } = storeToRefs(favoriteStore);
    const {
        showWorldImportDialog,
        localWorldFavGroupLength,
        deleteLocalWorldFavoriteGroup,
        renameLocalWorldFavoriteGroup,
        removeLocalWorldFavorite,
        newLocalWorldFavoriteGroup,
        handleFavoriteGroup,
        localWorldFavoritesList,
        refreshFavorites,
        getLocalWorldFavorites
    } = favoriteStore;
    const { showWorldDialog } = useWorldStore();

    const {
        cardScale: worldCardScale,
        cardSpacing: worldCardSpacing,
        slider: worldCardScaleSlider,
        spacingSlider: worldCardSpacingSlider,
        containerRef: worldFavoritesContainerRef,
        gridStyle: worldFavoritesGridStyle
    } = useFavoritesCardScaling({
        configKey: 'VRCX_FavoritesWorldCardScale',
        spacingConfigKey: 'VRCX_FavoritesWorldCardSpacing',
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

    const worldCardScalePercent = computed(() => Math.round(worldCardScale.value * 100));
    const worldCardSpacingPercent = computed(() => Math.round(worldCardSpacing.value * 100));
    const worldCardScaleValue = computed({
        get: () => [worldCardScale.value],
        set: (value) => {
            const next = value?.[0];
            if (typeof next === 'number') {
                worldCardScale.value = next;
            }
        }
    });
    const worldCardSpacingValue = computed({
        get: () => [worldCardSpacing.value],
        set: (value) => {
            const next = value?.[0];
            if (typeof next === 'number') {
                worldCardSpacing.value = next;
            }
        }
    });

    const worldGroupVisibilityOptions = ref(['public', 'friends', 'private']);
    const worldSplitterSize = ref(260);
    const worldSplitterFallbackWidth = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1200;
    const worldSplitterGroupRef = ref(null);
    const worldSplitterPanelRef = ref(null);
    const worldSplitterWidth = ref(worldSplitterFallbackWidth);
    const worldSplitterDraggingCount = ref(0);
    let worldSplitterObserver = null;
    const worldExportDialogVisible = ref(false);
    const worldFavoriteSearch = ref('');
    const worldFavoriteSearchResults = ref([]);
    const selectedGroup = ref(null);
    const isCreatingLocalGroup = ref(false);
    const newLocalGroupName = ref('');
    const newLocalGroupInput = ref(null);
    const worldGroupPlaceholders = WORLD_GROUP_PLACEHOLDERS;
    const hasUserSelectedWorldGroup = ref(false);
    const remoteGroupsResolved = ref(false);
    const sliceLocalWorldFavoritesLoadMoreNumber = ref(60);
    const refreshingLocalFavorites = ref(false);
    const worker = ref(null);
    const refreshCancelToken = ref(null);
    const worldEditMode = ref(false);
    const activeGroupMenu = ref(null);
    const localFavoritesScrollbarRef = ref(null);
    const worldToolbarMenuOpen = ref(false);
    const localFavoritesLoadingMore = ref(false);
    const hasWorldSelection = computed(() => selectedFavoriteWorlds.value.length > 0);
    const hasSearchInput = computed(() => worldFavoriteSearch.value.trim().length > 0);
    const isSearchActive = computed(() => worldFavoriteSearch.value.trim().length >= 3);
    const isRemoteGroupSelected = computed(() => selectedGroup.value?.type === 'remote');
    const isLocalGroupSelected = computed(() => selectedGroup.value?.type === 'local');
    const remoteGroupMenuKey = (key) => `remote:${key}`;
    const localGroupMenuKey = (key) => `local:${key}`;

    const closeWorldToolbarMenu = () => {
        worldToolbarMenuOpen.value = false;
    };

    function handleWorldImportClick() {
        closeWorldToolbarMenu();
        showWorldImportDialog();
    }

    function handleWorldExportClick() {
        closeWorldToolbarMenu();
        showExportDialog();
    }

    onBeforeMount(() => {
        loadWorldSplitterPreferences();
    });

    async function loadWorldSplitterPreferences() {
        const storedSize = await configRepository.getString('VRCX_FavoritesWorldSplitter', '260');
        const parsedSize = Number(storedSize);
        if (Number.isFinite(parsedSize) && parsedSize >= 0) {
            worldSplitterSize.value = parsedSize;
        }
    }

    const getWorldSplitterWidthRaw = () => {
        const element = worldSplitterGroupRef.value?.$el ?? worldSplitterGroupRef.value;
        const width = element?.getBoundingClientRect?.().width;
        return Number.isFinite(width) ? width : null;
    };

    const getWorldSplitterWidth = () => {
        const width = getWorldSplitterWidthRaw();
        return Number.isFinite(width) && width > 0 ? width : worldSplitterFallbackWidth;
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

    const setWorldSplitterDragging = (payload) => {
        const isDragging = resolveDraggingPayload(payload);
        const next = worldSplitterDraggingCount.value + (isDragging ? 1 : -1);
        worldSplitterDraggingCount.value = Math.max(0, next);
    };

    const pxToPercent = (px, groupWidth, min = 0) => {
        const width = groupWidth ?? getWorldSplitterWidth();
        return Math.min(100, Math.max(min, (px / width) * 100));
    };

    const percentToPx = (percent, groupWidth) => (percent / 100) * groupWidth;

    const worldSplitterDefaultSize = computed(() => pxToPercent(worldSplitterSize.value, worldSplitterWidth.value, 0));
    const worldSplitterMinSize = computed(() => pxToPercent(0, worldSplitterWidth.value, 0));
    const worldSplitterMaxSize = computed(() => pxToPercent(360, worldSplitterWidth.value, 0));

    const handleWorldSplitterLayout = (sizes) => {
        if (!Array.isArray(sizes) || !sizes.length) {
            return;
        }

        if (worldSplitterDraggingCount.value === 0) {
            return;
        }

        const rawWidth = getWorldSplitterWidthRaw();
        if (!Number.isFinite(rawWidth) || rawWidth <= 0) {
            return;
        }

        const nextSize = sizes[0];
        if (!Number.isFinite(nextSize)) {
            return;
        }

        const nextPx = Math.round(percentToPx(nextSize, rawWidth));
        const clampedPx = Math.min(360, Math.max(0, nextPx));
        worldSplitterSize.value = clampedPx;
        configRepository.setString('VRCX_FavoritesWorldSplitter', clampedPx.toString());
    };

    const updateWorldSplitterWidth = () => {
        const width = getWorldSplitterWidth();
        worldSplitterWidth.value = width;
        const targetSize = pxToPercent(worldSplitterSize.value, width, 0);
        worldSplitterPanelRef.value?.resize?.(targetSize);
    };

    onMounted(async () => {
        await nextTick();
        updateWorldSplitterWidth();
        const element = worldSplitterGroupRef.value?.$el ?? worldSplitterGroupRef.value;
        if (element && typeof ResizeObserver !== 'undefined') {
            worldSplitterObserver = new ResizeObserver(updateWorldSplitterWidth);
            worldSplitterObserver.observe(element);
        }
    });

    watch(worldSplitterSize, (value, previous) => {
        if (value === previous) {
            return;
        }
        if (worldSplitterDraggingCount.value > 0) {
            return;
        }
        updateWorldSplitterWidth();
    });

    const groupedWorldFavorites = computed(() => {
        const grouped = {};
        favoriteWorlds.value.forEach((world) => {
            if (!world.groupKey) {
                return;
            }
            if (!grouped[world.groupKey]) {
                grouped[world.groupKey] = [];
            }
            grouped[world.groupKey].push(world);
        });
        return grouped;
    });

    const flattenedLocalWorldFavorites = computed(() => {
        return Object.values(localWorldFavorites.value).flat();
    });

    const searchableWorldEntries = computed(() => {
        const seen = new Set();
        const entries = [];
        const pushIfNew = (ref) => {
            if (!ref || !ref.id || seen.has(ref.id)) {
                return;
            }
            seen.add(ref.id);
            entries.push(ref);
        };
        flattenedLocalWorldFavorites.value.forEach(pushIfNew);
        favoriteWorlds.value.forEach((favorite) => {
            pushIfNew(favorite.ref);
        });
        return entries;
    });

    const sliceLocalWorldFavorites = computed(() => {
        return (group) => {
            const favorites = localWorldFavorites.value[group];
            if (!favorites) {
                return [];
            }
            return favorites.slice(0, sliceLocalWorldFavoritesLoadMoreNumber.value);
        };
    });

    const activeRemoteGroup = computed(() => {
        if (!isRemoteGroupSelected.value) {
            return null;
        }
        return favoriteWorldGroups.value.find((group) => group.key === selectedGroup.value.key) || null;
    });

    const activeLocalGroupName = computed(() => {
        if (!isLocalGroupSelected.value) {
            return '';
        }
        return selectedGroup.value.key;
    });

    const activeLocalGroupCount = computed(() => {
        if (!activeLocalGroupName.value) {
            return 0;
        }
        const favorites = localWorldFavorites.value[activeLocalGroupName.value];
        return favorites ? favorites.length : 0;
    });

    const currentRemoteFavorites = computed(() => {
        if (!activeRemoteGroup.value) {
            return [];
        }
        return groupedWorldFavorites.value[activeRemoteGroup.value.key] || [];
    });

    const currentLocalFavorites = computed(() => {
        if (!activeLocalGroupName.value) {
            return [];
        }
        return sliceLocalWorldFavorites.value(activeLocalGroupName.value);
    });

    function handleSortFavoritesChange(value) {
        const next = Boolean(value);
        if (next !== sortFavorites.value) {
            setSortFavorites();
        }
    }

    const isAllWorldsSelected = computed(() => {
        if (!activeRemoteGroup.value || !currentRemoteFavorites.value.length) {
            return false;
        }
        return currentRemoteFavorites.value
            .map((fav) => fav.id)
            .every((id) => selectedFavoriteWorlds.value.includes(id));
    });

    watch(
        () => ({
            remote: favoriteWorldGroups.value.map((group) => group.key),
            local: [...localWorldFavoriteGroups.value]
        }),
        () => {
            remoteGroupsResolved.value = favoriteWorldGroups.value.length > 0;
            if (!hasUserSelectedWorldGroup.value) {
                const preferredKey = favoriteWorldGroups.value[0]?.key || worldGroupPlaceholders[0]?.key || null;
                if (preferredKey) {
                    selectGroup('remote', preferredKey);
                }
            }
            ensureSelectedGroup();
        },
        { immediate: true }
    );

    watch(isSearchActive, (active) => {
        if (active && worldEditMode.value) {
            worldEditMode.value = false;
        }
        if (!active) {
            nextTick(() => {
                maybeFillLocalFavoritesViewport();
            });
        }
    });

    watch(
        () => worldEditMode.value,
        (value) => {
            if (!value) {
                clearSelectedWorlds();
            }
        }
    );

    watch(
        () => ({
            group: activeLocalGroupName.value,
            visible: currentLocalFavorites.value.length,
            total: activeLocalGroupCount.value,
            slice: sliceLocalWorldFavoritesLoadMoreNumber.value,
            isLocal: isLocalGroupSelected.value
        }),
        () => {
            nextTick(() => {
                maybeFillLocalFavoritesViewport();
            });
        }
    );

    onMounted(() => {
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', maybeFillLocalFavoritesViewport);
        }
        nextTick(() => {
            maybeFillLocalFavoritesViewport();
        });
    });

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

    function handleGroupClick(type, key) {
        if (hasSearchInput.value) {
            worldFavoriteSearch.value = '';
            searchWorldFavorites('');
        }
        selectGroup(type, key, { userInitiated: true });
    }

    function selectDefaultGroup() {
        if (!hasUserSelectedWorldGroup.value) {
            const remoteKey = favoriteWorldGroups.value[0]?.key || worldGroupPlaceholders[0]?.key || null;
            if (remoteKey) {
                selectGroup('remote', remoteKey);
                return;
            }
        }
        if (favoriteWorldGroups.value.length) {
            selectGroup('remote', favoriteWorldGroups.value[0].key);
            return;
        }
        if (localWorldFavoriteGroups.value.length) {
            selectGroup('local', localWorldFavoriteGroups.value[0]);
            return;
        }
        selectedGroup.value = null;
        clearSelectedWorlds();
    }

    function isGroupAvailable(group) {
        if (!group) {
            return false;
        }
        if (group.type === 'remote') {
            if (!remoteGroupsResolved.value) {
                return true;
            }
            return favoriteWorldGroups.value.some((item) => item.key === group.key);
        }
        if (group.type === 'local') {
            return localWorldFavoriteGroups.value.includes(group.key);
        }
        return false;
    }

    function selectGroup(type, key, options = {}) {
        if (selectedGroup.value?.type === type && selectedGroup.value?.key === key) {
            return;
        }
        selectedGroup.value = { type, key };
        if (options.userInitiated) {
            hasUserSelectedWorldGroup.value = true;
        }
        resetLocalFavoritesLoadMoreCounter();
        clearSelectedWorlds();
        if (type === 'local') {
            nextTick(() => {
                maybeFillLocalFavoritesViewport();
            });
        }
    }

    function resetLocalFavoritesLoadMoreCounter() {
        sliceLocalWorldFavoritesLoadMoreNumber.value = 60;
        localFavoritesLoadingMore.value = false;
    }

    function isGroupActive(type, key) {
        return selectedGroup.value?.type === type && selectedGroup.value?.key === key;
    }

    function formatVisibility(value) {
        if (!value) {
            return '';
        }
        return value.charAt(0).toUpperCase() + value.slice(1);
    }

    function startLocalGroupCreation() {
        if (isCreatingLocalGroup.value) {
            return;
        }
        isCreatingLocalGroup.value = true;
        newLocalGroupName.value = '';
        nextTick(() => {
            newLocalGroupInput.value?.focus?.();
        });
    }

    function cancelLocalGroupCreation() {
        isCreatingLocalGroup.value = false;
        newLocalGroupName.value = '';
    }

    function handleLocalGroupCreationConfirm() {
        const name = newLocalGroupName.value.trim();
        if (!name) {
            cancelLocalGroupCreation();
            return;
        }
        newLocalWorldFavoriteGroup(name);
        cancelLocalGroupCreation();
        nextTick(() => {
            selectGroup('local', name, { userInitiated: true });
        });
    }

    function handleLocalFavoritesScroll() {
        if (!isLocalGroupSelected.value || isSearchActive.value) {
            return;
        }
        const wrap = localFavoritesScrollbarRef.value?.viewportEl?.value;
        if (!wrap) {
            return;
        }
        const { scrollTop, clientHeight, scrollHeight } = wrap;
        if (scrollTop + clientHeight >= scrollHeight - LOCAL_FAVORITES_SCROLL_THRESHOLD) {
            if (loadMoreLocalWorldFavorites()) {
                nextTick(() => {
                    maybeFillLocalFavoritesViewport();
                });
            }
        }
    }

    function toggleWorldSelection(id, value) {
        if (value) {
            if (!selectedFavoriteWorlds.value.includes(id)) {
                selectedFavoriteWorlds.value.push(id);
            }
        } else {
            selectedFavoriteWorlds.value = selectedFavoriteWorlds.value.filter((selectedId) => selectedId !== id);
        }
    }

    function clearSelectedWorlds() {
        selectedFavoriteWorlds.value = [];
    }

    function toggleSelectAllWorlds() {
        if (!activeRemoteGroup.value) {
            return;
        }
        if (isAllWorldsSelected.value) {
            selectedFavoriteWorlds.value = [];
        } else {
            selectedFavoriteWorlds.value = currentRemoteFavorites.value.map((fav) => fav.id);
        }
    }

    function copySelectedWorlds() {
        if (!selectedFavoriteWorlds.value.length) {
            return;
        }
        const idList = selectedFavoriteWorlds.value.map((id) => `${id}\n`).join('');
        worldImportDialogInput.value = idList;
        showWorldImportDialog();
    }

    function showWorldBulkUnfavoriteSelectionConfirm() {
        if (!selectedFavoriteWorlds.value.length) {
            return;
        }
        const total = selectedFavoriteWorlds.value.length;
        modalStore
            .confirm({
                description: `Are you sure you want to unfavorite ${total} favorites?
            This action cannot be undone.`,
                title: `Trash2 ${total} favorites?`
            })
            .then(() => bulkUnfavoriteSelectedWorlds([...selectedFavoriteWorlds.value]))
            .catch(() => {});
    }

    function bulkUnfavoriteSelectedWorlds(ids) {
        ids.forEach((id) => {
            favoriteRequest.deleteFavorite({
                objectId: id
            });
        });
        selectedFavoriteWorlds.value = [];
        worldEditMode.value = false;
    }

    function loadMoreLocalWorldFavorites() {
        if (localFavoritesLoadingMore.value) {
            return false;
        }
        if (sliceLocalWorldFavoritesLoadMoreNumber.value >= activeLocalGroupCount.value) {
            return false;
        }
        localFavoritesLoadingMore.value = true;
        sliceLocalWorldFavoritesLoadMoreNumber.value += LOCAL_FAVORITES_PAGE_SIZE;
        nextTick(() => {
            localFavoritesLoadingMore.value = false;
        });
        return true;
    }

    function maybeFillLocalFavoritesViewport() {
        nextTick(() => {
            if (!isLocalGroupSelected.value || isSearchActive.value) {
                return;
            }
            const wrap = localFavoritesScrollbarRef.value?.viewportEl?.value;
            if (!wrap) {
                return;
            }
            if (wrap.scrollHeight > wrap.clientHeight + LOCAL_FAVORITES_VIEWPORT_BUFFER) {
                return;
            }
            if (loadMoreLocalWorldFavorites()) {
                nextTick(() => {
                    maybeFillLocalFavoritesViewport();
                });
            }
        });
    }

    function showExportDialog() {
        worldExportDialogVisible.value = true;
    }

    function handleRefreshFavorites() {
        refreshFavorites();
        getLocalWorldFavorites();
    }

    function changeWorldGroupVisibility(group, visibility, menuKey = null) {
        const params = {
            type: group.type,
            group: group.name,
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

    function promptLocalWorldFavoriteGroupRename(group) {
        modalStore
            .prompt({
                title: t('prompt.local_favorite_group_rename.header'),
                description: t('prompt.local_favorite_group_rename.description'),
                confirmText: t('prompt.local_favorite_group_rename.save'),
                cancelText: t('prompt.local_favorite_group_rename.cancel'),
                pattern: /\S+/,
                errorMessage: t('prompt.local_favorite_group_rename.input_error'),
                inputValue: group
            })
            .then(({ ok, value }) => {
                if (!ok) return;
                if (value) {
                    renameLocalWorldFavoriteGroup(value, group);
                    nextTick(() => {
                        if (localWorldFavoriteGroups.value.includes(value)) {
                            selectGroup('local', value, { userInitiated: true });
                        }
                    });
                }
            })
            .catch(() => {});
    }

    function promptLocalWorldFavoriteGroupDelete(group) {
        modalStore
            .confirm({
                description: `Trash2 Group? ${group}`,
                title: 'Confirm'
            })
            .then(() => deleteLocalWorldFavoriteGroup(group))
            .catch(() => {});
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

    function searchWorldFavorites(worldFavoriteSearch) {
        const search = worldFavoriteSearch.trim().toLowerCase();
        if (search.length < 3) {
            worldFavoriteSearchResults.value = [];
            return;
        }
        const filtered = searchableWorldEntries.value.filter((ref) => {
            if (!ref || typeof ref.id === 'undefined' || typeof ref.name === 'undefined') {
                return false;
            }
            const authorName = ref.authorName || '';
            return ref.name.toLowerCase().includes(search) || authorName.toLowerCase().includes(search);
        });
        worldFavoriteSearchResults.value = filtered;
    }

    function handleVisibilitySelection(group, visibility) {
        const menuKey = remoteGroupMenuKey(group.key);
        changeWorldGroupVisibility(group, visibility, menuKey);
    }

    function handleRemoteRename(group) {
        handleGroupMenuVisible(remoteGroupMenuKey(group.key), false);
        changeFavoriteGroupName(group);
    }

    function handleRemoteClear(group) {
        handleGroupMenuVisible(remoteGroupMenuKey(group.key), false);
        clearFavoriteGroup(group);
    }

    function handleLocalRename(groupName) {
        handleGroupMenuVisible(localGroupMenuKey(groupName), false);
        promptLocalWorldFavoriteGroupRename(groupName);
    }

    function handleLocalDelete(groupName) {
        handleGroupMenuVisible(localGroupMenuKey(groupName), false);
        promptLocalWorldFavoriteGroupDelete(groupName);
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
                        type: group.type,
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

    async function refreshLocalWorldFavorites() {
        if (refreshingLocalFavorites.value) {
            return;
        }
        refreshingLocalFavorites.value = true;
        const token = {
            cancelled: false,
            resolve: null
        };
        refreshCancelToken.value = token;
        try {
            for (const worldId of localWorldFavoritesList) {
                if (token.cancelled) {
                    break;
                }
                try {
                    await worldRequest.getWorld({
                        worldId
                    });
                } catch (err) {
                    console.error(err);
                }
                if (token.cancelled) {
                    break;
                }
                await new Promise((resolve) => {
                    token.resolve = resolve;
                    worker.value = workerTimers.setTimeout(() => {
                        worker.value = null;
                        resolve();
                    }, 1000);
                });
            }
        } finally {
            if (worker.value) {
                workerTimers.clearTimeout(worker.value);
                worker.value = null;
            }
            if (refreshCancelToken.value === token) {
                refreshCancelToken.value = null;
            }
            refreshingLocalFavorites.value = false;
        }
    }

    function cancelLocalWorldRefresh() {
        if (!refreshingLocalFavorites.value) {
            return;
        }
        if (refreshCancelToken.value) {
            refreshCancelToken.value.cancelled = true;
            if (typeof refreshCancelToken.value.resolve === 'function') {
                refreshCancelToken.value.resolve();
            }
        }
        if (worker.value) {
            workerTimers.clearTimeout(worker.value);
            worker.value = null;
        }
        refreshingLocalFavorites.value = false;
    }

    onBeforeUnmount(() => {
        cancelLocalWorldRefresh();
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', maybeFillLocalFavoritesViewport);
        }
        if (worldSplitterObserver) {
            worldSplitterObserver.disconnect();
            worldSplitterObserver = null;
        }
    });
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

    .favorites-dropdown {
        padding: 10px;
    }

    .favorites-groups-panel {
        height: 100%;
        padding-right: 8px;
        overflow: auto;
        display: flex;
        flex-direction: column;
        gap: 12px;
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

    .group-item__right {
        display: flex;
        align-items: center;
        flex-direction: column;
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

    .group-item--placeholder {
        pointer-events: none;
        opacity: 0.7;
    }

    .group-item__placeholder-tag {
        width: 64px;
        height: 18px;
        border-radius: 999px;
        background-color: var(--el-fill-color);
    }

    .group-item--new {
        border-style: dashed;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        color: var(--el-color-primary);
        font-size: 14px;
    }

    .group-item__input {
        width: 100%;
    }

    .group-item__input :deep(.el-input__wrapper) {
        width: 100%;
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

    :deep(.favorites-search-card--world) {
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

    :deep(.favorites-search-card__action--checkbox [data-slot='checkbox']) {
        margin: 0;
    }

    :deep(.favorites-search-card__actions:empty) {
        display: none;
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
