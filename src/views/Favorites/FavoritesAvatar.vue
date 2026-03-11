<template>
    <div class="x-container">
        <div class="flex flex-col h-full min-h-0 pb-0">
            <FavoritesToolbar
                :sort-favorites="sortFavorites"
                v-model:search-query="avatarFavoriteSearch"
                :search-placeholder="t('view.favorite.avatars.search')"
                v-model:toolbar-menu-open="avatarToolbarMenuOpen"
                v-model:card-scale-value="avatarCardScaleValue"
                :card-scale-percent="avatarCardScalePercent"
                :card-scale-slider="avatarCardScaleSlider"
                v-model:card-spacing-value="avatarCardSpacingValue"
                :card-spacing-percent="avatarCardSpacingPercent"
                :card-spacing-slider="avatarCardSpacingSlider"
                @update:sort-favorites="handleSortFavoritesChange"
                @search="searchAvatarFavorites"
                @import="handleAvatarImportClick"
                @export="handleAvatarExportClick" />
            <ResizablePanelGroup
                ref="splitterGroupRef"
                direction="horizontal"
                class="flex-1 min-h-0 favorites-splitter"
                @layout="handleLayout">
                <ResizablePanel
                    ref="splitterPanelRef"
                    :default-size="splitterDefaultSize"
                    :min-size="splitterMinSize"
                    :max-size="splitterMaxSize"
                    :collapsed-size="0"
                    collapsible
                    :order="1">
                    <div class="h-full pr-2 overflow-auto flex flex-col gap-3">
                        <div class="flex flex-col gap-2">
                            <div class="flex items-center justify-between font-semibold text-sm mb-[9px]">
                                <span>{{ t('view.favorite.avatars.vrchat_favorites') }}</span>
                                <TooltipWrapper side="bottom" :content="t('view.favorite.refresh_favorites_tooltip')">
                                    <Button
                                        class="rounded-full"
                                        variant="ghost"
                                        size="icon-sm"
                                        :disabled="isFavoriteLoading"
                                        @click.stop="handleRefreshFavorites">
                                        <Spinner v-if="isFavoriteLoading" />
                                        <RefreshCw v-else />
                                    </Button>
                                </TooltipWrapper>
                            </div>
                            <div class="flex flex-col gap-2">
                                <template v-if="favoriteAvatarGroups.length">
                                    <div
                                        v-for="group in favoriteAvatarGroups"
                                        :key="group.key"
                                        :class="[
                                            'group-item x-hover-card hover:shadow-sm',
                                            `group-item--${group.visibility}`,
                                            { 'is-active': !hasSearchInput && isGroupActive('remote', group.key) }
                                        ]"
                                        @click="handleGroupClick('remote', group.key)">
                                        <div class="flex items-start justify-between mb-1 text-[13px]">
                                            <span class="font-semibold">{{ group.displayName }}</span>
                                            <span class="text-xs">{{ group.count }}/{{ group.capacity }}</span>
                                        </div>
                                        <div class="flex items-center justify-between gap-2">
                                            <span class="flex items-center gap-1.5">
                                                <span class="text-[11px] text-muted-foreground">{{
                                                    t(`view.favorite.visibility.${group.visibility}`)
                                                }}</span>
                                            </span>
                                            <DropdownMenu
                                                :open="activeGroupMenu === remoteGroupMenuKey(group.key)"
                                                @update:open="
                                                    handleGroupMenuVisible(remoteGroupMenuKey(group.key), $event)
                                                ">
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        class="rounded-full"
                                                        variant="ghost"
                                                        size="icon-sm"
                                                        @click.stop>
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
                                                                class="w-45">
                                                                <DropdownMenuCheckboxItem
                                                                    v-for="visibility in avatarGroupVisibilityOptions"
                                                                    :key="visibility"
                                                                    :model-value="group.visibility === visibility"
                                                                    indicator-position="right"
                                                                    @select="
                                                                        handleVisibilitySelection(group, visibility)
                                                                    ">
                                                                    <span>{{
                                                                        t(`view.favorite.visibility.${visibility}`)
                                                                    }}</span>
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
                                <template v-else>
                                    <div
                                        v-for="group in avatarGroupPlaceholders"
                                        :key="group.key"
                                        :class="[
                                            'group-item x-hover-card hover:shadow-sm',
                                            'pointer-events-none opacity-70',
                                            { 'is-active': !hasSearchInput && isGroupActive('remote', group.key) }
                                        ]">
                                        <div class="flex items-start justify-between mb-1 text-[13px]">
                                            <span class="font-semibold">{{ group.displayName }}</span>
                                            <span class="text-xs">--/--</span>
                                        </div>
                                        <div class="flex items-center justify-between gap-2">
                                            <div class="w-16 h-[18px] rounded-full"></div>
                                        </div>
                                    </div>
                                </template>
                            </div>
                        </div>
                        <div class="flex flex-col gap-2">
                            <div class="flex items-center justify-between font-semibold text-sm mb-[9px]">
                                <span>{{ t('view.favorite.avatars.local_favorites') }}</span>
                                <template v-if="!refreshingLocalFavorites">
                                    <Button
                                        class="rounded-full"
                                        size="icon"
                                        variant="ghost"
                                        @click.stop="refreshLocalAvatarFavorites"
                                        ><RefreshCcw
                                    /></Button>
                                </template>
                                <Button size="sm" variant="ghost" v-else @click.stop="cancelLocalAvatarRefresh">
                                    <Loader />

                                    {{ t('view.favorite.avatars.cancel_refresh') }}
                                </Button>
                            </div>
                            <div class="flex flex-col gap-2">
                                <template v-if="localAvatarFavoriteGroups.length">
                                    <div
                                        v-for="group in localAvatarFavoriteGroups"
                                        :key="group"
                                        :class="[
                                            'group-item x-hover-card hover:shadow-sm',
                                            { 'is-active': !hasSearchInput && isGroupActive('local', group) }
                                        ]"
                                        @click="handleGroupClick('local', group)">
                                        <div class="flex items-start justify-between mb-1 text-[13px]">
                                            <span class="font-semibold">{{ group }}</span>
                                            <div class="flex items-center flex-col">
                                                <span class="text-xs">{{ localAvatarFavGroupLength(group) }}</span>
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
                                                    <DropdownMenuContent side="right" class="w-50">
                                                        <DropdownMenuItem @click="handleLocalRename(group)">
                                                            <span>{{ t('view.favorite.rename_tooltip') }}</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem @click="handleCheckInvalidAvatars(group)">
                                                            <span>{{ t('view.favorite.avatars.check_invalid') }}</span>
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            variant="destructive"
                                                            @click="handleLocalDelete(group)">
                                                            <span>{{ t('view.favorite.delete_tooltip') }}</span>
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                    </div>
                                </template>
                                <div v-else class="text-center text-xs py-3">
                                    <DataTableEmpty type="nodata" />
                                </div>
                                <TooltipWrapper
                                    v-if="!isCreatingLocalGroup"
                                    :disabled="isLocalUserVrcPlusSupporter"
                                    :content="t('view.favorite.avatars.local_favorites')">
                                    <div
                                        :class="[
                                            'group-item x-hover-card hover:shadow-sm',
                                            'border-dashed flex items-center justify-center gap-2 text-sm',
                                            { 'opacity-50 cursor-not-allowed': !isLocalUserVrcPlusSupporter }
                                        ]"
                                        @click="startLocalGroupCreation">
                                        <Plus />
                                        <span>{{ t('view.favorite.avatars.new_group') }}</span>
                                    </div>
                                </TooltipWrapper>
                                <InputGroupField
                                    v-else
                                    ref="newLocalGroupInput"
                                    v-model="newLocalGroupName"
                                    size="sm"
                                    class="w-full"
                                    :placeholder="t('view.favorite.avatars.new_group')"
                                    @keyup.enter="handleLocalGroupCreationConfirm"
                                    @keyup.esc="cancelLocalGroupCreation"
                                    @blur="cancelLocalGroupCreation" />
                            </div>
                        </div>
                        <div class="flex flex-col gap-2">
                            <div class="flex items-center justify-between font-semibold text-sm mb-[9px]">
                                <span>{{ t('view.favorite.avatars.local_history') }}</span>
                                <DropdownMenu
                                    :open="activeGroupMenu === historyGroupMenuKey"
                                    @update:open="handleGroupMenuVisible(historyGroupMenuKey, $event)">
                                    <DropdownMenuTrigger asChild>
                                        <Button class="rounded-full" size="icon-sm" variant="ghost" @click.stop
                                            ><Ellipsis
                                        /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent side="right" class="w-45">
                                        <DropdownMenuItem variant="destructive" @click="handleHistoryClear">
                                            <span>{{ t('view.favorite.clear_tooltip') }}</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <div class="flex flex-col gap-2">
                                <div
                                    :class="[
                                        'group-item x-hover-card hover:shadow-sm',
                                        { 'is-active': !hasSearchInput && isGroupActive('history', historyGroupKey) }
                                    ]"
                                    @click="handleGroupClick('history', historyGroupKey)">
                                    <div class="flex items-start justify-between mb-1 text-[13px]">
                                        <span class="font-semibold">{{
                                            t('view.favorite.avatars.local_history')
                                        }}</span>
                                        <span class="text-xs">{{ avatarHistory.length }}/100</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </ResizablePanel>
                <ResizableHandle @dragging="splitterSetDragging" />
                <ResizablePanel :order="2">
                    <div class="flex flex-col h-full min-h-0 pl-[26px]">
                        <FavoritesContentHeader
                            v-model:edit-mode="avatarEditMode"
                            :edit-mode-disabled="isSearchActive || !activeRemoteGroup"
                            :edit-mode-visible="avatarEditMode && !isSearchActive && activeRemoteGroup"
                            :is-all-selected="isAllAvatarsSelected"
                            :has-selection="hasAvatarSelection"
                            @toggle-select-all="toggleSelectAllAvatars"
                            @clear-selection="clearSelectedAvatars"
                            @copy-selection="copySelectedAvatars"
                            @bulk-unfavorite="showAvatarBulkUnfavoriteSelectionConfirm">
                            <template #title>
                                <span v-if="isSearchActive">{{ t('view.favorite.avatars.search') }}</span>
                                <template v-else-if="activeRemoteGroup">
                                    <span>
                                        {{ activeRemoteGroup.displayName }}
                                        <small>{{ activeRemoteGroup.count }}/{{ activeRemoteGroup.capacity }}</small>
                                    </span>
                                </template>
                                <template v-else-if="activeLocalGroupName">
                                    <span>
                                        {{ activeLocalGroupName }}
                                        <small>{{ activeLocalGroupCount }}</small>
                                    </span>
                                </template>
                                <template v-else-if="isHistorySelected">
                                    <span>
                                        Local History
                                        <small>{{ avatarHistory.length }}/100</small>
                                    </span>
                                </template>
                                <span v-else>{{ t('view.favorite.avatars.no_group_selected') }}</span>
                            </template>
                        </FavoritesContentHeader>
                        <div ref="avatarFavoritesContainerRef" class="flex-1 min-h-0">
                            <template v-if="isSearchActive">
                                <div class="favorites-content__scroll favorites-content__scroll--native">
                                    <div
                                        v-if="avatarFavoriteSearchResults.length"
                                        class="favorites-search-grid"
                                        :style="avatarFavoritesGridStyle(avatarFavoriteSearchResults.length)">
                                        <div
                                            v-for="favorite in avatarFavoriteSearchResults"
                                            :key="favorite.id"
                                            class="favorites-search-card x-hover-card hover:shadow-sm"
                                            @click="showAvatarDialog(favorite.id)">
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
                                                    <div class="flex items-center gap-2">
                                                        <span class="name">{{ favorite.name }}</span>
                                                    </div>
                                                    <span class="text-xs">{{ favorite.authorName }}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div v-else class="favorites-empty">
                                        <DataTableEmpty type="nomatch" />
                                    </div>
                                </div>
                            </template>
                            <template v-else-if="activeRemoteGroup">
                                <div class="h-full pr-2 overflow-auto">
                                    <template v-if="currentRemoteFavorites.length">
                                        <div
                                            class="favorites-card-list"
                                            :style="avatarFavoritesGridStyle(currentRemoteFavorites.length)">
                                            <FavoritesAvatarItem
                                                v-for="favorite in currentRemoteFavorites"
                                                :key="favorite.id"
                                                :favorite="favorite"
                                                :group="activeRemoteGroup"
                                                :selected="selectedFavoriteAvatars.includes(favorite.id)"
                                                :edit-mode="avatarEditMode"
                                                @toggle-select="toggleAvatarSelection(favorite.id, $event)" />
                                        </div>
                                    </template>
                                    <div v-else class="flex items-center justify-center text-[13px] h-full">
                                        <DataTableEmpty type="nodata" />
                                    </div>
                                </div>
                            </template>
                            <template v-else-if="!remoteAvatarGroupsResolved">
                                <div class="h-full pr-2 overflow-auto">
                                    <div
                                        class="favorites-card-list"
                                        :style="avatarFavoritesGridStyle(avatarGroupPlaceholders.length)">
                                        <div
                                            v-for="group in avatarGroupPlaceholders"
                                            :key="group.key"
                                            class="favorites-card-placeholder-box"></div>
                                    </div>
                                </div>
                            </template>
                            <template v-else-if="activeLocalGroupName">
                                <ScrollArea class="h-full pr-2">
                                    <template v-if="currentLocalFavorites.length">
                                        <div
                                            class="favorites-card-list"
                                            :style="avatarFavoritesGridStyle(currentLocalFavorites.length)">
                                            <FavoritesAvatarItem
                                                v-for="favorite in currentLocalFavorites"
                                                :key="favorite.id"
                                                :favorite="favorite"
                                                :group="activeLocalGroupName"
                                                is-local-favorite
                                                :edit-mode="avatarEditMode" />
                                        </div>
                                    </template>
                                    <div v-else class="flex items-center justify-center text-[13px] h-full">
                                        <DataTableEmpty type="nodata" />
                                    </div>
                                </ScrollArea>
                            </template>
                            <template v-else-if="isHistorySelected">
                                <div class="h-full pr-2 overflow-auto">
                                    <template v-if="avatarHistory.length">
                                        <div
                                            class="favorites-card-list"
                                            :style="avatarFavoritesGridStyle(avatarHistory.length)">
                                            <FavoritesAvatarLocalHistoryItem
                                                v-for="favorite in avatarHistory"
                                                :key="favorite.id"
                                                :favorite="favorite" />
                                        </div>
                                    </template>
                                    <div v-else class="flex items-center justify-center text-[13px] h-full">
                                        <DataTableEmpty type="nodata" />
                                    </div>
                                </div>
                            </template>
                            <template v-else>
                                <div class="flex items-center justify-center text-[13px] h-full">
                                    {{ t('view.favorite.avatars.no_group_selected') }}
                                </div>
                            </template>
                        </div>
                    </div>
                </ResizablePanel>
            </ResizablePanelGroup>
        </div>
        <AvatarExportDialog v-model:avatarExportDialogVisible="avatarExportDialogVisible" />
    </div>
</template>

<script setup>
    import { computed, markRaw, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue';
    import { Ellipsis, Loader, MoreHorizontal, Plus, RefreshCcw, RefreshCw } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { InputGroupField } from '@/components/ui/input-group';
    import { ScrollArea } from '@/components/ui/scroll-area';
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
        DropdownMenuSub,
        DropdownMenuSubContent,
        DropdownMenuSubTrigger,
        DropdownMenuTrigger
    } from '../../components/ui/dropdown-menu';
    import {
        useAppearanceSettingsStore,
        useAvatarStore,
        useFavoriteStore,
        useModalStore,
        useUserStore
    } from '../../stores';
    import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../components/ui/resizable';
    import { avatarRequest, favoriteRequest } from '../../api';
    import { debounce } from '../../shared/utils';
    import { useFavoritesCardScaling } from './composables/useFavoritesCardScaling.js';
    import { useFavoritesGroupPanel } from './composables/useFavoritesGroupPanel.js';
    import { useFavoritesLocalGroups } from './composables/useFavoritesLocalGroups.js';
    import { useFavoritesSplitter } from './composables/useFavoritesSplitter.js';
    import {
        deleteLocalAvatarFavoriteGroup,
        renameLocalAvatarFavoriteGroup,
        newLocalAvatarFavoriteGroup,
        refreshFavorites,
        getLocalAvatarFavorites,
        checkInvalidLocalAvatars,
        removeInvalidLocalAvatars
    } from '../../coordinators/favoriteCoordinator';

    import AvatarExportDialog from './dialogs/AvatarExportDialog.vue';
    import FavoritesAvatarItem from './components/FavoritesAvatarItem.vue';
    import FavoritesAvatarLocalHistoryItem from './components/FavoritesAvatarLocalHistoryItem.vue';
    import FavoritesContentHeader from './components/FavoritesContentHeader.vue';
    import FavoritesToolbar from './components/FavoritesToolbar.vue';
    import InvalidAvatarsProgressToast from './components/InvalidAvatarsProgressToast.jsx';

    import * as workerTimers from 'worker-timers';

    const AVATAR_GROUP_PLACEHOLDERS = Array.from({ length: 5 }, (_, index) => ({
        key: `avatar:avatars${index + 1}`,
        displayName: `Group ${index + 1}`
    }));

    const avatarGroupVisibilityOptions = ref(['public', 'friends', 'private']);
    const historyGroupKey = 'local-history';
    const {
        splitterGroupRef,
        splitterPanelRef,
        defaultSize: splitterDefaultSize,
        minSize: splitterMinSize,
        maxSize: splitterMaxSize,
        handleLayout,
        setDragging: splitterSetDragging
    } = useFavoritesSplitter({ configKey: 'VRCX_FavoritesAvatarSplitter' });

    const { sortFavorites } = storeToRefs(useAppearanceSettingsStore());
    const { setSortFavorites } = useAppearanceSettingsStore();
    const favoriteStore = useFavoriteStore();
    const modalStore = useModalStore();
    const {
        favoriteAvatars,
        favoriteAvatarGroups,
        localAvatarFavorites,
        selectedFavoriteAvatars,
        isFavoriteLoading,
        localAvatarFavoriteGroups,
        avatarImportDialogInput
    } = storeToRefs(favoriteStore);
    const { showAvatarImportDialog, localAvatarFavGroupLength, localAvatarFavoritesList, handleFavoriteGroup } =
        favoriteStore;
    const { avatarHistory } = storeToRefs(useAvatarStore());
    import { promptClearAvatarHistory, showAvatarDialog, applyAvatar } from '../../coordinators/avatarCoordinator';
    const { isLocalUserVrcPlusSupporter } = storeToRefs(useUserStore());
    const { t } = useI18n();

    const {
        cardScale: avatarCardScale,
        cardSpacing: avatarCardSpacing,
        slider: avatarCardScaleSlider,
        spacingSlider: avatarCardSpacingSlider,
        containerRef: avatarFavoritesContainerRef,
        gridStyle: avatarFavoritesGridStyle
    } = useFavoritesCardScaling({
        configKey: 'VRCX_FavoritesAvatarCardScale',
        spacingConfigKey: 'VRCX_FavoritesAvatarCardSpacing',
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

    const avatarCardScalePercent = computed(() => Math.round(avatarCardScale.value * 100));
    const avatarCardSpacingPercent = computed(() => Math.round(avatarCardSpacing.value * 100));
    const avatarCardScaleValue = computed({
        get: () => [avatarCardScale.value],
        set: (value) => {
            const next = value?.[0];
            if (typeof next === 'number') {
                avatarCardScale.value = next;
            }
        }
    });
    const avatarCardSpacingValue = computed({
        get: () => [avatarCardSpacing.value],
        set: (value) => {
            const next = value?.[0];
            if (typeof next === 'number') {
                avatarCardSpacing.value = next;
            }
        }
    });

    const avatarExportDialogVisible = ref(false);
    const avatarFavoriteSearch = ref('');
    const avatarFavoriteSearchResults = ref([]);
    const avatarEditMode = ref(false);
    const avatarToolbarMenuOpen = ref(false);
    const refreshingLocalFavorites = ref(false);
    const worker = ref(null);
    const refreshCancelToken = ref(null);
    const avatarGroupPlaceholders = AVATAR_GROUP_PLACEHOLDERS;

    const {
        activeGroupMenu,
        hasUserSelectedGroup: hasUserSelectedAvatarGroup,
        remoteGroupsResolved: remoteAvatarGroupsResolved,

        isHistorySelected,
        remoteGroupMenuKey,
        localGroupMenuKey,
        activeRemoteGroup,
        activeLocalGroupName,
        activeLocalGroupCount,
        handleGroupMenuVisible,
        selectGroup,
        isGroupActive,
        ensureSelectedGroup
    } = useFavoritesGroupPanel({
        remoteGroups: favoriteAvatarGroups,
        localGroups: localAvatarFavoriteGroups,
        localFavorites: localAvatarFavorites,
        clearSelection: () => {
            selectedFavoriteAvatars.value = [];
        },
        placeholders: AVATAR_GROUP_PLACEHOLDERS,
        hasHistory: true,
        historyItems: avatarHistory
    });

    const historyGroupMenuKey = 'history';

    /**
     *
     * @param value
     */
    function handleSortFavoritesChange(value) {
        const next = Boolean(value);
        if (next !== sortFavorites.value) {
            setSortFavorites();
        }
    }

    const hasAvatarSelection = computed(() => selectedFavoriteAvatars.value.length > 0);
    const hasSearchInput = computed(() => avatarFavoriteSearch.value.trim().length > 0);
    const isSearchActive = computed(() => avatarFavoriteSearch.value.trim().length >= 3);

    const closeAvatarToolbarMenu = () => {
        avatarToolbarMenuOpen.value = false;
    };

    /**
     *
     */
    function handleAvatarImportClick() {
        closeAvatarToolbarMenu();
        showAvatarImportDialog();
    }

    /**
     *
     */
    function handleAvatarExportClick() {
        closeAvatarToolbarMenu();
        showAvatarExportDialog();
    }

    const groupedAvatarFavorites = computed(() => {
        const grouped = {};
        favoriteAvatars.value.forEach((avatar) => {
            if (!avatar.groupKey) {
                return;
            }
            if (!grouped[avatar.groupKey]) {
                grouped[avatar.groupKey] = [];
            }
            grouped[avatar.groupKey].push(avatar);
        });
        return grouped;
    });

    const currentRemoteFavorites = computed(() => {
        if (!activeRemoteGroup.value) {
            return [];
        }
        return groupedAvatarFavorites.value[activeRemoteGroup.value.key] || [];
    });

    const currentLocalFavorites = computed(() => {
        if (!activeLocalGroupName.value) {
            return [];
        }
        return localAvatarFavorites.value[activeLocalGroupName.value] || [];
    });

    const isAllAvatarsSelected = computed(() => {
        if (!activeRemoteGroup.value || !currentRemoteFavorites.value.length) {
            return false;
        }
        return currentRemoteFavorites.value
            .map((fav) => fav.id)
            .every((id) => selectedFavoriteAvatars.value.includes(id));
    });

    watch(
        () => ({
            remote: favoriteAvatarGroups.value.map((group) => group.key),
            local: [...localAvatarFavoriteGroups.value],
            history: avatarHistory.value.length
        }),
        () => {
            remoteAvatarGroupsResolved.value = favoriteAvatarGroups.value.length > 0;
            if (!hasUserSelectedAvatarGroup.value) {
                const preferred =
                    favoriteAvatarGroups.value.find((group) => group.count > 0) ||
                    favoriteAvatarGroups.value[0] ||
                    avatarGroupPlaceholders[0];
                if (preferred) {
                    selectGroup('remote', preferred.key);
                }
            }
            ensureSelectedGroup();
        },
        { immediate: true }
    );

    watch(isSearchActive, (active) => {
        if (active && avatarEditMode.value) {
            avatarEditMode.value = false;
        }
    });

    watch(
        () => avatarEditMode.value,
        (value) => {
            if (!value) {
                clearSelectedAvatars();
            }
        }
    );

    /**
     *
     * @param type
     * @param key
     */
    function handleGroupClick(type, key) {
        if (hasSearchInput.value) {
            avatarFavoriteSearch.value = '';
            doSearchAvatarFavorites('');
        }
        selectGroup(type, key, { userInitiated: true });
    }

    /**
     *
     */
    const {
        isCreatingLocalGroup,
        newLocalGroupName,
        newLocalGroupInput,
        startLocalGroupCreation,
        cancelLocalGroupCreation,
        handleLocalGroupCreationConfirm
    } = useFavoritesLocalGroups({
        createGroup: newLocalAvatarFavoriteGroup,
        selectGroup,
        canCreate: () => isLocalUserVrcPlusSupporter.value
    });

    /**
     *
     * @param id
     * @param value
     */
    function toggleAvatarSelection(id, value) {
        if (value) {
            if (!selectedFavoriteAvatars.value.includes(id)) {
                selectedFavoriteAvatars.value.push(id);
            }
        } else {
            selectedFavoriteAvatars.value = selectedFavoriteAvatars.value.filter((selectedId) => selectedId !== id);
        }
    }

    /**
     *
     */
    function clearSelectedAvatars() {
        selectedFavoriteAvatars.value = [];
    }

    /**
     *
     */
    function showAvatarExportDialog() {
        avatarExportDialogVisible.value = true;
    }

    /**
     *
     */
    function handleRefreshFavorites() {
        refreshFavorites();
        getLocalAvatarFavorites();
    }

    /**
     *
     * @param group
     * @param visibility
     */
    function handleVisibilitySelection(group, visibility) {
        const menuKey = remoteGroupMenuKey(group.key);
        changeAvatarGroupVisibility(group.name, visibility, menuKey);
    }

    /**
     *
     * @param group
     */
    function handleRemoteRename(group) {
        handleGroupMenuVisible(remoteGroupMenuKey(group.key), false);
        changeFavoriteGroupName(group);
    }

    /**
     *
     * @param group
     */
    function handleRemoteClear(group) {
        handleGroupMenuVisible(remoteGroupMenuKey(group.key), false);
        clearFavoriteGroup(group);
    }

    /**
     *
     * @param groupName
     */
    function handleLocalRename(groupName) {
        handleGroupMenuVisible(localGroupMenuKey(groupName), false);
        promptLocalAvatarFavoriteGroupRename(groupName);
    }

    /**
     *
     * @param groupName
     */
    function handleLocalDelete(groupName) {
        handleGroupMenuVisible(localGroupMenuKey(groupName), false);
        promptLocalAvatarFavoriteGroupDelete(groupName);
    }

    /**
     *
     * @param groupName
     */
    async function handleCheckInvalidAvatars(groupName) {
        handleGroupMenuVisible(localGroupMenuKey(groupName), false);

        const startCheckResult = await modalStore.confirm({
            description: t('view.favorite.avatars.check_description'),
            title: t('view.favorite.avatars.check_invalid'),
            confirmText: t('confirm.confirm_button'),
            cancelText: t('confirm.cancel_button')
        });

        if (!startCheckResult.ok) {
            return;
        }

        const progressState = reactive({
            current: 0,
            total: 0,
            percentage: 0
        });

        let progressToastId;

        try {
            progressToastId = toast(markRaw(InvalidAvatarsProgressToast), {
                duration: Infinity,
                componentProps: {
                    t,
                    progress: progressState,
                    onDismiss: () => progressToastId && toast.dismiss(progressToastId)
                }
            });

            const result = await checkInvalidLocalAvatars(groupName, (current, total) => {
                progressState.current = current;
                progressState.total = total;
                progressState.percentage = total ? Math.floor((current / total) * 100) : 0;
            });

            if (progressToastId) {
                toast.dismiss(progressToastId);
            }

            if (result.invalid === 0) {
                toast.success(t('view.favorite.avatars.no_invalid_found'));
                return;
            }

            const invalidIdsText = result.invalidIds.join('\n');

            const confirmDeleteResult = await modalStore.confirm({
                description:
                    `${t('view.favorite.avatars.confirm_delete_description', { count: result.invalid })}` +
                    `\n\n${t('view.favorite.avatars.removed_list_header')}\n` +
                    invalidIdsText,
                title: t('view.favorite.avatars.confirm_delete_invalid'),
                confirmText: t('confirm.confirm_button'),
                cancelText: t('view.favorite.avatars.copy_removed_ids')
            });

            if (!confirmDeleteResult.ok) {
                if (confirmDeleteResult.reason === 'cancel') {
                    navigator.clipboard
                        .writeText(invalidIdsText)
                        .then(() => {
                            toast.success(t('view.favorite.avatars.copied_ids'));
                        })
                        .catch(() => {
                            toast.error(t('view.favorite.avatars.copy_failed'));
                        });
                }
                toast.info(t('view.favorite.avatars.delete_cancelled'));
                return;
            }

            const removeResult = await removeInvalidLocalAvatars(result.invalidIds, groupName);

            toast.success(
                t('view.favorite.avatars.delete_summary', {
                    removed: removeResult.removed
                })
            );
        } catch (err) {
            if (progressToastId) {
                toast.dismiss(progressToastId);
            }
            console.error(err);
            toast.error(String(err.message || err));
        }
    }

    /**
     *
     */
    function handleHistoryClear() {
        handleGroupMenuVisible(historyGroupMenuKey, false);
        promptClearAvatarHistory();
    }

    /**
     *
     * @param group
     */
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
                        type: 'avatar',
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

    /**
     *
     * @param name
     * @param visibility
     * @param menuKey
     */
    function changeAvatarGroupVisibility(name, visibility, menuKey = null) {
        const params = {
            type: 'avatar',
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

    /**
     *
     * @param ctx
     */
    function clearFavoriteGroup(ctx) {
        modalStore
            .confirm({
                description: t('confirm.clear_group'),
                title: t('confirm.title')
            })
            .then(({ ok }) => {
                if (ok) {
                    favoriteRequest.clearFavoriteGroup({
                        type: ctx.type,
                        group: ctx.name
                    });
                }
            })
            .catch(() => {});
    }

    /**
     *
     * @param group
     */
    function promptLocalAvatarFavoriteGroupRename(group) {
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
                    renameLocalAvatarFavoriteGroup(value, group);
                    nextTick(() => {
                        if (localAvatarFavoriteGroups.value.includes(value)) {
                            selectGroup('local', value);
                        }
                    });
                }
            })
            .catch(() => {});
    }

    /**
     *
     * @param group
     */
    function promptLocalAvatarFavoriteGroupDelete(group) {
        modalStore
            .confirm({
                description: t('confirm.delete_group', { name: group }),
                title: t('confirm.title')
            })
            .then(({ ok }) => {
                if (ok) {
                    deleteLocalAvatarFavoriteGroup(group);
                }
            })
            .catch(() => {});
    }

    /**
     *
     * @param value
     */
    function doSearchAvatarFavorites(value) {
        if (typeof value === 'string') {
            avatarFavoriteSearch.value = value;
        }
        const search = avatarFavoriteSearch.value.trim().toLowerCase();
        if (search.length < 3) {
            avatarFavoriteSearchResults.value = [];
            return;
        }
        const results = [];
        const seen = new Set();
        localAvatarFavoriteGroups.value.forEach((group) => {
            const favorites = localAvatarFavorites.value[group];
            if (!favorites) {
                return;
            }
            favorites.forEach((ref) => {
                if (
                    !ref ||
                    typeof ref.id === 'undefined' ||
                    typeof ref.name === 'undefined' ||
                    typeof ref.authorName === 'undefined'
                ) {
                    return;
                }
                if (ref.name.toLowerCase().includes(search) || ref.authorName.toLowerCase().includes(search)) {
                    if (!seen.has(ref.id)) {
                        seen.add(ref.id);
                        results.push(ref);
                    }
                }
            });
        });
        favoriteAvatars.value.forEach((favorite) => {
            const ref = favorite.ref;
            if (
                !ref ||
                typeof ref.id === 'undefined' ||
                typeof ref.name === 'undefined' ||
                typeof ref.authorName === 'undefined'
            ) {
                return;
            }
            if (ref.name.toLowerCase().includes(search) || ref.authorName.toLowerCase().includes(search)) {
                if (!seen.has(ref.id)) {
                    seen.add(ref.id);
                    results.push(ref);
                }
            }
        });
        avatarFavoriteSearchResults.value = results;
    }
    const searchAvatarFavorites = debounce(doSearchAvatarFavorites, 200);

    /**
     *
     */
    async function refreshLocalAvatarFavorites() {
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
            for (const avatarId of localAvatarFavoritesList) {
                if (token.cancelled) {
                    break;
                }
                try {
                    const args = await avatarRequest.getAvatar({
                        avatarId
                    });
                    applyAvatar(args.json);
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

    /**
     *
     */
    function cancelLocalAvatarRefresh() {
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

    /**
     *
     */
    function toggleSelectAllAvatars() {
        if (!activeRemoteGroup.value) {
            return;
        }
        if (isAllAvatarsSelected.value) {
            selectedFavoriteAvatars.value = [];
        } else {
            selectedFavoriteAvatars.value = currentRemoteFavorites.value.map((fav) => fav.id);
        }
    }

    /**
     *
     */
    function copySelectedAvatars() {
        if (!selectedFavoriteAvatars.value.length) {
            return;
        }
        const idList = selectedFavoriteAvatars.value.map((id) => `${id}\n`).join('');
        avatarImportDialogInput.value = idList;
        showAvatarImportDialog();
    }

    /**
     *
     */
    function showAvatarBulkUnfavoriteSelectionConfirm() {
        if (!selectedFavoriteAvatars.value.length) {
            return;
        }
        const total = selectedFavoriteAvatars.value.length;
        modalStore
            .confirm({
                description: `Are you sure you want to unfavorite ${total} favorites?
            This action cannot be undone.`,
                title: `Delete ${total} favorites?`
            })
            .then(({ ok }) => {
                if (ok) {
                    bulkUnfavoriteSelectedAvatars(selectedFavoriteAvatars.value);
                }
            })
            .catch(() => {});
    }

    /**
     *
     * @param ids
     */
    function bulkUnfavoriteSelectedAvatars(ids) {
        ids.forEach((id) => {
            favoriteRequest.deleteFavorite({
                objectId: id
            });
        });
        selectedFavoriteAvatars.value = [];
        avatarEditMode.value = false;
    }

    onBeforeUnmount(() => {
        cancelLocalAvatarRefresh();
    });

    /**
     *
     * @param value
     */
    function formatVisibility(value) {
        if (!value) {
            return '';
        }
        return value.charAt(0).toUpperCase() + value.slice(1);
    }
</script>

<style>
    @import './favorites-layout.css';
</style>
