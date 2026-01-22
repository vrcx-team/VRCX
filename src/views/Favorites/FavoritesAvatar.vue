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
                    v-model="avatarFavoriteSearch"
                    class="favorites-toolbar__search"
                    :placeholder="t('view.favorite.avatars.search')"
                    @input="searchAvatarFavorites" />
                <DropdownMenu v-model:open="avatarToolbarMenuOpen">
                    <DropdownMenuTrigger as-child>
                        <Button class="rounded-full" size="icon-sm" variant="ghost"> <Ellipsis /> </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent class="favorites-dropdown">
                        <li class="favorites-dropdown__control" @click.stop>
                            <div class="favorites-dropdown__control-header">
                                <span>Scale</span>
                                <span class="favorites-dropdown__control-value">{{ avatarCardScalePercent }}%</span>
                            </div>
                            <Slider
                                v-model="avatarCardScaleValue"
                                class="favorites-dropdown__slider"
                                :min="avatarCardScaleSlider.min"
                                :max="avatarCardScaleSlider.max"
                                :step="avatarCardScaleSlider.step" />
                        </li>
                        <li class="favorites-dropdown__control" @click.stop>
                            <div class="favorites-dropdown__control-header">
                                <span>Spacing</span>
                                <span class="favorites-dropdown__control-value"> {{ avatarCardSpacingPercent }}% </span>
                            </div>
                            <Slider
                                v-model="avatarCardSpacingValue"
                                class="favorites-dropdown__slider"
                                :min="avatarCardSpacingSlider.min"
                                :max="avatarCardSpacingSlider.max"
                                :step="avatarCardSpacingSlider.step" />
                        </li>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="handleAvatarImportClick">
                            {{ t('view.favorite.import') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="handleAvatarExportClick">
                            {{ t('view.favorite.export') }}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
        <ResizablePanelGroup
            ref="avatarSplitterGroupRef"
            direction="horizontal"
            class="favorites-splitter"
            @layout="handleAvatarSplitterLayout">
            <ResizablePanel
                ref="avatarSplitterPanelRef"
                :default-size="avatarSplitterDefaultSize"
                :min-size="avatarSplitterMinSize"
                :max-size="avatarSplitterMaxSize"
                :collapsed-size="0"
                collapsible
                :order="1">
                <div class="favorites-groups-panel">
                    <div class="group-section">
                        <div class="group-section__header">
                            <span>{{ t('view.favorite.avatars.vrchat_favorites') }}</span>
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
                            <template v-if="favoriteAvatarGroups.length">
                                <div
                                    v-for="group in favoriteAvatarGroups"
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
                                                        <DropdownMenuSubContent side="right" align="start" class="w-45">
                                                            <DropdownMenuCheckboxItem
                                                                v-for="visibility in avatarGroupVisibilityOptions"
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
                            <template v-else>
                                <div
                                    v-for="group in avatarGroupPlaceholders"
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
                            <span>{{ t('view.favorite.avatars.local_favorites') }}</span>
                            <template v-if="!refreshingLocalFavorites">
                                <Button
                                    class="rounded-full"
                                    size="icon"
                                    variant="outline"
                                    @click.stop="refreshLocalAvatarFavorites"
                                    ><RefreshCcw
                                /></Button>
                            </template>
                            <Button size="sm" variant="ghost" v-else @click.stop="cancelLocalAvatarRefresh">
                                <Loader />

                                {{ t('view.favorite.avatars.cancel_refresh') }}
                            </Button>
                        </div>
                        <div class="group-section__list">
                            <template v-if="localAvatarFavoriteGroups.length">
                                <div
                                    v-for="group in localAvatarFavoriteGroups"
                                    :key="group"
                                    :class="[
                                        'group-item',
                                        { 'is-active': !hasSearchInput && isGroupActive('local', group) }
                                    ]"
                                    @click="handleGroupClick('local', group)">
                                    <div class="group-item__top">
                                        <span class="group-item__name">{{ group }}</span>
                                        <div class="group-item__right">
                                            <span class="group-item__count">{{
                                                localAvatarFavGroupLength(group)
                                            }}</span>
                                            <DropdownMenu
                                                :open="activeGroupMenu === localGroupMenuKey(group)"
                                                @update:open="handleGroupMenuVisible(localGroupMenuKey(group), $event)">
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
                            <div v-else class="group-empty">
                                <DataTableEmpty type="nodata" />
                            </div>
                            <TooltipWrapper
                                v-if="!isCreatingLocalGroup"
                                :disabled="isLocalUserVrcPlusSupporter"
                                :content="t('view.favorite.avatars.local_favorites')">
                                <div
                                    :class="[
                                        'group-item',
                                        'group-item--new',
                                        { 'is-disabled': !isLocalUserVrcPlusSupporter }
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
                                class="group-item__input"
                                :placeholder="t('view.favorite.avatars.new_group')"
                                @keyup.enter="handleLocalGroupCreationConfirm"
                                @keyup.esc="cancelLocalGroupCreation"
                                @blur="cancelLocalGroupCreation" />
                        </div>
                    </div>
                    <div class="group-section">
                        <div class="group-section__header">
                            <span>Local History</span>
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
                        <div class="group-section__list">
                            <div
                                :class="[
                                    'group-item',
                                    { 'is-active': !hasSearchInput && isGroupActive('history', historyGroupKey) }
                                ]"
                                @click="handleGroupClick('history', historyGroupKey)">
                                <div class="group-item__top">
                                    <span class="group-item__name">Local History</span>
                                    <span class="group-item__count">{{ avatarHistory.length }}/100</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </ResizablePanel>
            <ResizableHandle with-handle @dragging="setAvatarSplitterDragging" />
            <ResizablePanel :order="2">
                <div class="favorites-content">
                    <div class="favorites-content__header">
                        <div class="favorites-content__title">
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
                            <span v-else>No Group Selected</span>
                        </div>
                        <div class="favorites-content__edit">
                            <span>{{ t('view.favorite.edit_mode') }}</span>
                            <Switch v-model="avatarEditMode" :disabled="isSearchActive || !activeRemoteGroup" />
                        </div>
                    </div>
                    <div class="favorites-content__edit-actions">
                        <div
                            v-if="avatarEditMode && !isSearchActive && activeRemoteGroup"
                            class="favorites-content__actions">
                            <Button size="sm" variant="outline" @click="toggleSelectAllAvatars">
                                {{
                                    isAllAvatarsSelected
                                        ? t('view.favorite.deselect_all')
                                        : t('view.favorite.select_all')
                                }}
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                :disabled="!hasAvatarSelection"
                                @click="clearSelectedAvatars">
                                {{ t('view.favorite.clear') }}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                :disabled="!hasAvatarSelection"
                                @click="copySelectedAvatars">
                                {{ t('view.favorite.copy') }}
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                :disabled="!hasAvatarSelection"
                                @click="showAvatarBulkUnfavoriteSelectionConfirm">
                                {{ t('view.favorite.bulk_unfavorite') }}
                            </Button>
                        </div>
                    </div>
                    <div ref="avatarFavoritesContainerRef" class="favorites-content__list">
                        <template v-if="isSearchActive">
                            <div class="favorites-content__scroll favorites-content__scroll--native">
                                <div
                                    v-if="avatarFavoriteSearchResults.length"
                                    class="favorites-search-grid"
                                    :style="avatarFavoritesGridStyle(avatarFavoriteSearchResults.length)">
                                    <div
                                        v-for="favorite in avatarFavoriteSearchResults"
                                        :key="favorite.id"
                                        class="favorites-search-card"
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
                                                <div class="favorites-search-card__title">
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
                            <div class="favorites-content__scroll favorites-content__scroll--native">
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
                                            @toggle-select="toggleAvatarSelection(favorite.id, $event)"
                                            @click="showAvatarDialog(favorite.id)" />
                                    </div>
                                </template>
                                <div v-else class="favorites-empty">
                                    <DataTableEmpty type="nodata" />
                                </div>
                            </div>
                        </template>
                        <template v-else-if="!remoteAvatarGroupsResolved">
                            <div class="favorites-content__scroll favorites-content__scroll--native">
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
                            <ScrollArea class="favorites-content__scroll">
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
                                            :edit-mode="avatarEditMode"
                                            @click="showAvatarDialog(favorite.id)" />
                                    </div>
                                </template>
                                <div v-else class="favorites-empty">
                                    <DataTableEmpty type="nodata" />
                                </div>
                            </ScrollArea>
                        </template>
                        <template v-else-if="isHistorySelected">
                            <div class="favorites-content__scroll favorites-content__scroll--native">
                                <template v-if="avatarHistory.length">
                                    <div
                                        class="favorites-card-list"
                                        :style="avatarFavoritesGridStyle(avatarHistory.length)">
                                        <FavoritesAvatarLocalHistoryItem
                                            v-for="favorite in avatarHistory"
                                            :key="favorite.id"
                                            :favorite="favorite"
                                            @click="showAvatarDialog(favorite.id)" />
                                    </div>
                                </template>
                                <div v-else class="favorites-empty">
                                    <DataTableEmpty type="nodata" />
                                </div>
                            </div>
                        </template>
                        <template v-else>
                            <div class="favorites-empty">No Group Selected</div>
                        </template>
                    </div>
                </div>
            </ResizablePanel>
        </ResizablePanelGroup>
        <AvatarExportDialog v-model:avatarExportDialogVisible="avatarExportDialogVisible" />
    </div>
</template>

<script setup>
    import { computed, markRaw, nextTick, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
    import { ArrowUpDown, Ellipsis, Loader, MoreHorizontal, Plus, RefreshCcw, RefreshCw } from 'lucide-vue-next';
    import { InputGroupField, InputGroupSearch } from '@/components/ui/input-group';
    import { Button } from '@/components/ui/button';
    import { DataTableEmpty } from '@/components/ui/data-table';
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
    import {
        useAppearanceSettingsStore,
        useAvatarStore,
        useFavoriteStore,
        useModalStore,
        useUserStore
    } from '../../stores';
    import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '../../components/ui/resizable';
    import { avatarRequest, favoriteRequest } from '../../api';
    import { Badge } from '../../components/ui/badge';
    import { Slider } from '../../components/ui/slider';
    import { Switch } from '../../components/ui/switch';
    import { useFavoritesCardScaling } from './composables/useFavoritesCardScaling.js';

    import AvatarExportDialog from './dialogs/AvatarExportDialog.vue';
    import FavoritesAvatarItem from './components/FavoritesAvatarItem.vue';
    import FavoritesAvatarLocalHistoryItem from './components/FavoritesAvatarLocalHistoryItem.vue';
    import InvalidAvatarsProgressToast from './components/InvalidAvatarsProgressToast.jsx';
    import configRepository from '../../service/config.js';

    import * as workerTimers from 'worker-timers';

    const AVATAR_GROUP_PLACEHOLDERS = Array.from({ length: 5 }, (_, index) => ({
        key: `avatar:avatars${index + 1}`,
        displayName: `Group ${index + 1}`
    }));

    const avatarGroupVisibilityOptions = ref(['public', 'friends', 'private']);
    const historyGroupKey = 'local-history';
    const avatarSplitterSize = ref(260);
    const avatarSplitterFallbackWidth = typeof window !== 'undefined' && window.innerWidth ? window.innerWidth : 1200;
    const avatarSplitterGroupRef = ref(null);
    const avatarSplitterPanelRef = ref(null);
    const avatarSplitterWidth = ref(avatarSplitterFallbackWidth);
    const avatarSplitterDraggingCount = ref(0);
    let avatarSplitterObserver = null;

    const { sortFavorites } = storeToRefs(useAppearanceSettingsStore());
    const { setSortFavorites } = useAppearanceSettingsStore();
    const favoriteStore = useFavoriteStore();
    const modalStore = useModalStore();
    const {
        favoriteAvatars,
        favoriteAvatarGroups,
        localAvatarFavorites,
        selectedFavoriteAvatars,
        avatarImportDialogInput,
        isFavoriteLoading,
        localAvatarFavoriteGroups
    } = storeToRefs(favoriteStore);
    const {
        showAvatarImportDialog,
        localAvatarFavGroupLength,
        deleteLocalAvatarFavoriteGroup,
        renameLocalAvatarFavoriteGroup,
        newLocalAvatarFavoriteGroup,
        localAvatarFavoritesList,
        refreshFavorites,
        getLocalWorldFavorites,
        handleFavoriteGroup,
        checkInvalidLocalAvatars,
        removeInvalidLocalAvatars
    } = favoriteStore;
    const { avatarHistory } = storeToRefs(useAvatarStore());
    const { promptClearAvatarHistory, showAvatarDialog, applyAvatar } = useAvatarStore();
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
    const selectedGroup = ref(null);
    const activeGroupMenu = ref(null);
    const avatarToolbarMenuOpen = ref(false);
    const isCreatingLocalGroup = ref(false);
    const newLocalGroupName = ref('');
    const newLocalGroupInput = ref(null);
    const refreshingLocalFavorites = ref(false);
    const worker = ref(null);
    const refreshCancelToken = ref(null);
    const avatarGroupPlaceholders = AVATAR_GROUP_PLACEHOLDERS;
    const hasUserSelectedAvatarGroup = ref(false);
    const remoteAvatarGroupsResolved = ref(false);

    function handleSortFavoritesChange(value) {
        const next = Boolean(value);
        if (next !== sortFavorites.value) {
            setSortFavorites();
        }
    }

    const hasAvatarSelection = computed(() => selectedFavoriteAvatars.value.length > 0);
    const hasSearchInput = computed(() => avatarFavoriteSearch.value.trim().length > 0);
    const isSearchActive = computed(() => avatarFavoriteSearch.value.trim().length >= 3);
    const isRemoteGroupSelected = computed(() => selectedGroup.value?.type === 'remote');
    const isLocalGroupSelected = computed(() => selectedGroup.value?.type === 'local');
    const isHistorySelected = computed(() => selectedGroup.value?.type === 'history');

    const remoteGroupMenuKey = (key) => `remote:${key}`;
    const localGroupMenuKey = (key) => `local:${key}`;
    const historyGroupMenuKey = 'history';

    const closeAvatarToolbarMenu = () => {
        avatarToolbarMenuOpen.value = false;
    };

    function handleAvatarImportClick() {
        closeAvatarToolbarMenu();
        showAvatarImportDialog();
    }

    function handleAvatarExportClick() {
        closeAvatarToolbarMenu();
        showAvatarExportDialog();
    }

    onBeforeMount(() => {
        loadAvatarSplitterPreferences();
    });

    async function loadAvatarSplitterPreferences() {
        const storedSize = await configRepository.getString('VRCX_FavoritesAvatarSplitter', '260');
        const parsedSize = Number(storedSize);
        if (Number.isFinite(parsedSize) && parsedSize >= 0) {
            avatarSplitterSize.value = parsedSize;
        }
    }

    const getAvatarSplitterWidthRaw = () => {
        const element = avatarSplitterGroupRef.value?.$el ?? avatarSplitterGroupRef.value;
        const width = element?.getBoundingClientRect?.().width;
        return Number.isFinite(width) ? width : null;
    };

    const getAvatarSplitterWidth = () => {
        const width = getAvatarSplitterWidthRaw();
        return Number.isFinite(width) && width > 0 ? width : avatarSplitterFallbackWidth;
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

    const setAvatarSplitterDragging = (payload) => {
        const isDragging = resolveDraggingPayload(payload);
        const next = avatarSplitterDraggingCount.value + (isDragging ? 1 : -1);
        avatarSplitterDraggingCount.value = Math.max(0, next);
    };

    const pxToPercent = (px, groupWidth, min = 0) => {
        const width = groupWidth ?? getAvatarSplitterWidth();
        return Math.min(100, Math.max(min, (px / width) * 100));
    };

    const percentToPx = (percent, groupWidth) => (percent / 100) * groupWidth;

    const avatarSplitterDefaultSize = computed(() =>
        pxToPercent(avatarSplitterSize.value, avatarSplitterWidth.value, 0)
    );
    const avatarSplitterMinSize = computed(() => pxToPercent(0, avatarSplitterWidth.value, 0));
    const avatarSplitterMaxSize = computed(() => pxToPercent(360, avatarSplitterWidth.value, 0));

    const handleAvatarSplitterLayout = (sizes) => {
        if (!Array.isArray(sizes) || !sizes.length) {
            return;
        }

        if (avatarSplitterDraggingCount.value === 0) {
            return;
        }

        const rawWidth = getAvatarSplitterWidthRaw();
        if (!Number.isFinite(rawWidth) || rawWidth <= 0) {
            return;
        }

        const nextSize = sizes[0];
        if (!Number.isFinite(nextSize)) {
            return;
        }

        const nextPx = Math.round(percentToPx(nextSize, rawWidth));
        const clampedPx = Math.min(360, Math.max(0, nextPx));
        avatarSplitterSize.value = clampedPx;
        configRepository.setString('VRCX_FavoritesAvatarSplitter', clampedPx.toString());
    };

    const updateAvatarSplitterWidth = () => {
        const width = getAvatarSplitterWidth();
        avatarSplitterWidth.value = width;
        const targetSize = pxToPercent(avatarSplitterSize.value, width, 0);
        avatarSplitterPanelRef.value?.resize?.(targetSize);
    };

    onMounted(async () => {
        await nextTick();
        updateAvatarSplitterWidth();
        const element = avatarSplitterGroupRef.value?.$el ?? avatarSplitterGroupRef.value;
        if (element && typeof ResizeObserver !== 'undefined') {
            avatarSplitterObserver = new ResizeObserver(updateAvatarSplitterWidth);
            avatarSplitterObserver.observe(element);
        }
    });

    watch(avatarSplitterSize, (value, previous) => {
        if (value === previous) {
            return;
        }
        if (avatarSplitterDraggingCount.value > 0) {
            return;
        }
        updateAvatarSplitterWidth();
    });

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

    const activeRemoteGroup = computed(() => {
        if (!isRemoteGroupSelected.value) {
            return null;
        }
        return favoriteAvatarGroups.value.find((group) => group.key === selectedGroup.value.key) || null;
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
        const favorites = localAvatarFavorites.value[activeLocalGroupName.value];
        return favorites ? favorites.length : 0;
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
        if (!hasUserSelectedAvatarGroup.value) {
            const remote =
                favoriteAvatarGroups.value.find((group) => group.count > 0) ||
                favoriteAvatarGroups.value[0] ||
                avatarGroupPlaceholders[0];
            if (remote) {
                selectGroup('remote', remote.key);
                return;
            }
        } else if (favoriteAvatarGroups.value.length) {
            const remote = favoriteAvatarGroups.value.find((group) => group.count > 0) || favoriteAvatarGroups.value[0];
            if (remote) {
                selectGroup('remote', remote.key);
                return;
            }
        }
        if (localAvatarFavoriteGroups.value.length) {
            selectGroup('local', localAvatarFavoriteGroups.value[0]);
            return;
        }
        if (avatarHistory.value.length) {
            selectGroup('history', historyGroupKey);
            return;
        }
        selectedGroup.value = null;
        clearSelectedAvatars();
    }

    function isGroupAvailable(group) {
        if (!group) {
            return false;
        }
        if (group.type === 'remote') {
            if (!remoteAvatarGroupsResolved.value) {
                return true;
            }
            return favoriteAvatarGroups.value.some((item) => item.key === group.key);
        }
        if (group.type === 'local') {
            return localAvatarFavoriteGroups.value.includes(group.key);
        }
        if (group.type === 'history') {
            return avatarHistory.value.length > 0;
        }
        return false;
    }

    function selectGroup(type, key, options = {}) {
        if (selectedGroup.value?.type === type && selectedGroup.value?.key === key) {
            return;
        }
        selectedGroup.value = { type, key };
        if (options.userInitiated) {
            hasUserSelectedAvatarGroup.value = true;
        }
        clearSelectedAvatars();
    }

    function clearSelectedAvatars() {
        selectedFavoriteAvatars.value = [];
    }

    function isGroupActive(type, key) {
        return selectedGroup.value?.type === type && selectedGroup.value?.key === key;
    }

    function handleGroupClick(type, key) {
        if (hasSearchInput.value) {
            avatarFavoriteSearch.value = '';
            searchAvatarFavorites('');
        }
        selectGroup(type, key, { userInitiated: true });
    }

    function startLocalGroupCreation() {
        if (!isLocalUserVrcPlusSupporter.value || isCreatingLocalGroup.value) {
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
        newLocalAvatarFavoriteGroup(name);
        cancelLocalGroupCreation();
        nextTick(() => {
            if (localAvatarFavoriteGroups.value.includes(name)) {
                selectGroup('local', name, { userInitiated: true });
            }
        });
    }

    function toggleAvatarSelection(id, value) {
        if (value) {
            if (!selectedFavoriteAvatars.value.includes(id)) {
                selectedFavoriteAvatars.value.push(id);
            }
        } else {
            selectedFavoriteAvatars.value = selectedFavoriteAvatars.value.filter((selectedId) => selectedId !== id);
        }
    }

    function showAvatarExportDialog() {
        avatarExportDialogVisible.value = true;
    }

    function handleRefreshFavorites() {
        refreshFavorites();
        getLocalWorldFavorites();
    }

    function handleVisibilitySelection(group, visibility) {
        const menuKey = remoteGroupMenuKey(group.key);
        changeAvatarGroupVisibility(group.name, visibility, menuKey);
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
        promptLocalAvatarFavoriteGroupRename(groupName);
    }

    function handleLocalDelete(groupName) {
        handleGroupMenuVisible(localGroupMenuKey(groupName), false);
        promptLocalAvatarFavoriteGroupDelete(groupName);
    }

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

    function handleHistoryClear() {
        handleGroupMenuVisible(historyGroupMenuKey, false);
        promptClearAvatarHistory();
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

    function promptLocalAvatarFavoriteGroupDelete(group) {
        modalStore
            .confirm({
                description: `Trash2 Group? ${group}`,
                title: 'Confirm'
            })
            .then(() => deleteLocalAvatarFavoriteGroup(group))
            .catch(() => {});
    }

    function searchAvatarFavorites(value) {
        if (typeof value === 'string') {
            avatarFavoriteSearch.value = value;
        }
        const search = avatarFavoriteSearch.value.trim().toLowerCase();
        if (search.length < 3) {
            avatarFavoriteSearchResults.value = [];
            return;
        }
        const results = [];
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
                    if (!results.some((r) => r.id === ref.id)) {
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
                if (!results.some((r) => r.id === ref.id)) {
                    results.push(ref);
                }
            }
        });
        avatarFavoriteSearchResults.value = results;
    }

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

    onBeforeUnmount(() => {
        cancelLocalAvatarRefresh();
        if (avatarSplitterObserver) {
            avatarSplitterObserver.disconnect();
            avatarSplitterObserver = null;
        }
    });

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

    .group-item__right {
        display: flex;
        align-items: center;
        flex-direction: column;
        gap: 6px;
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

    .group-item--placeholder {
        pointer-events: none;
        opacity: 0.7;
    }

    .group-item__placeholder-tag {
        width: 64px;
        height: 18px;
        border-radius: 999px;
    }

    .group-item--new {
        border-style: dashed;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-size: 14px;
    }

    .group-item--new.is-disabled {
        opacity: 0.5;
        cursor: not-allowed;
    }

    .group-item__input {
        width: 100%;
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

    :deep(.favorites-search-card--avatar) {
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
