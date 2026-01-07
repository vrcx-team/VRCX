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
                    v-model="avatarFavoriteSearch"
                    clearable
                    class="favorites-toolbar__search"
                    :placeholder="t('view.favorite.avatars.search')"
                    @input="searchAvatarFavorites" />
                <el-dropdown ref="avatarToolbarMenuRef" trigger="click" :hide-on-click="false">
                    <el-button :icon="MoreFilled" size="small" circle />
                    <template #dropdown>
                        <el-dropdown-menu class="favorites-dropdown">
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
                                    <span class="favorites-dropdown__control-value">
                                        {{ avatarCardSpacingPercent }}%
                                    </span>
                                </div>
                                <Slider
                                    v-model="avatarCardSpacingValue"
                                    class="favorites-dropdown__slider"
                                    :min="avatarCardSpacingSlider.min"
                                    :max="avatarCardSpacingSlider.max"
                                    :step="avatarCardSpacingSlider.step" />
                            </li>
                            <el-dropdown-item @click="handleAvatarImportClick">
                                {{ t('view.favorite.import') }}
                            </el-dropdown-item>
                            <el-dropdown-item divided @click="handleAvatarExportClick">
                                {{ t('view.favorite.export') }}
                            </el-dropdown-item>
                        </el-dropdown-menu>
                    </template>
                </el-dropdown>
            </div>
        </div>
        <el-splitter class="favorites-splitter" @resize-end="handleAvatarSplitterResize">
            <el-splitter-panel :size="avatarSplitterSize" :min="0" :max="360" collapsible>
                <div class="favorites-groups-panel">
                    <div class="group-section">
                        <div class="group-section__header">
                            <span>{{ t('view.favorite.avatars.vrchat_favorites') }}</span>
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
                                            <PopoverContent side="right" class="w-55 p-1 rounded-lg">
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
                                                                v-for="visibility in avatarGroupVisibilityOptions"
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
                                <el-button
                                    size="small"
                                    :icon="Refresh"
                                    circle
                                    @click.stop="refreshLocalAvatarFavorites" />
                            </template>
                            <el-button v-else size="small" text @click.stop="cancelLocalAvatarRefresh">
                                <el-icon class="is-loading"><Loading /></el-icon>
                                {{ t('view.favorite.avatars.cancel_refresh') }}
                            </el-button>
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
                                            <Popover
                                                :open="activeGroupMenu === localGroupMenuKey(group)"
                                                @update:open="handleGroupMenuVisible(localGroupMenuKey(group), $event)">
                                                <PopoverTrigger asChild>
                                                    <el-button
                                                        text
                                                        size="small"
                                                        :icon="MoreFilled"
                                                        circle
                                                        @click.stop></el-button>
                                                </PopoverTrigger>
                                                <PopoverContent side="right" class="w-50 p-1 rounded-lg">
                                                    <div class="favorites-group-menu">
                                                        <button
                                                            type="button"
                                                            class="favorites-group-menu__item"
                                                            @click="handleLocalRename(group)">
                                                            <span>{{ t('view.favorite.rename_tooltip') }}</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            class="favorites-group-menu__item"
                                                            @click="handleCheckInvalidAvatars(group)">
                                                            <span>{{ t('view.favorite.avatars.check_invalid') }}</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            class="favorites-group-menu__item favorites-group-menu__item--danger"
                                                            @click="handleLocalDelete(group)">
                                                            <span>{{ t('view.favorite.delete_tooltip') }}</span>
                                                        </button>
                                                    </div>
                                                </PopoverContent>
                                            </Popover>
                                        </div>
                                    </div>
                                </div>
                            </template>
                            <div v-else class="group-empty">No Data</div>
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
                                    <el-icon><Plus /></el-icon>
                                    <span>{{ t('view.favorite.avatars.new_group') }}</span>
                                </div>
                            </TooltipWrapper>
                            <el-input
                                v-else
                                ref="newLocalGroupInput"
                                v-model="newLocalGroupName"
                                size="small"
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
                            <Popover
                                :open="activeGroupMenu === historyGroupMenuKey"
                                @update:open="handleGroupMenuVisible(historyGroupMenuKey, $event)">
                                <PopoverTrigger asChild>
                                    <el-button text size="small" :icon="MoreFilled" circle @click.stop></el-button>
                                </PopoverTrigger>
                                <PopoverContent side="right" class="w-45 p-1 rounded-lg">
                                    <div class="favorites-group-menu">
                                        <button
                                            type="button"
                                            class="favorites-group-menu__item favorites-group-menu__item--danger"
                                            @click="handleHistoryClear">
                                            <span>{{ t('view.favorite.clear_tooltip') }}</span>
                                        </button>
                                    </div>
                                </PopoverContent>
                            </Popover>
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
            </el-splitter-panel>
            <el-splitter-panel>
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
                            <el-button size="small" @click="toggleSelectAllAvatars">
                                {{
                                    isAllAvatarsSelected
                                        ? t('view.favorite.deselect_all')
                                        : t('view.favorite.select_all')
                                }}
                            </el-button>
                            <el-button size="small" :disabled="!hasAvatarSelection" @click="clearSelectedAvatars">
                                {{ t('view.favorite.clear') }}
                            </el-button>
                            <el-button size="small" :disabled="!hasAvatarSelection" @click="copySelectedAvatars">
                                {{ t('view.favorite.copy') }}
                            </el-button>
                            <el-button
                                size="small"
                                :disabled="!hasAvatarSelection"
                                @click="showAvatarBulkUnfavoriteSelectionConfirm">
                                {{ t('view.favorite.bulk_unfavorite') }}
                            </el-button>
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
                                                <span class="extra">{{ favorite.authorName }}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <div v-else class="favorites-empty">No Data</div>
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
                                <div v-else class="favorites-empty">No Data</div>
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
                            <el-scrollbar
                                ref="localAvatarScrollbarRef"
                                class="favorites-content__scroll"
                                @scroll="handleLocalAvatarScroll">
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
                                <div v-else class="favorites-empty">No Data</div>
                            </el-scrollbar>
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
                                <div v-else class="favorites-empty">No Data</div>
                            </div>
                        </template>
                        <template v-else>
                            <div class="favorites-empty">No Group Selected</div>
                        </template>
                    </div>
                </div>
            </el-splitter-panel>
        </el-splitter>
        <AvatarExportDialog v-model:avatarExportDialogVisible="avatarExportDialogVisible" />
    </div>
</template>

<script setup>
    import { computed, h, nextTick, onBeforeMount, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
    import { Loading, MoreFilled, Plus, Refresh } from '@element-plus/icons-vue';
    import { ElMessageBox, ElNotification, ElProgress } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { useAppearanceSettingsStore, useAvatarStore, useFavoriteStore, useUserStore } from '../../stores';
    import { Popover, PopoverContent, PopoverTrigger } from '../../components/ui/popover';
    import { avatarRequest, favoriteRequest } from '../../api';
    import { Badge } from '../../components/ui/badge';
    import { Slider } from '../../components/ui/slider';
    import { Switch } from '../../components/ui/switch';
    import { useFavoritesCardScaling } from './composables/useFavoritesCardScaling.js';

    import AvatarExportDialog from './dialogs/AvatarExportDialog.vue';
    import FavoritesAvatarItem from './components/FavoritesAvatarItem.vue';
    import FavoritesAvatarLocalHistoryItem from './components/FavoritesAvatarLocalHistoryItem.vue';
    import configRepository from '../../service/config.js';

    import * as workerTimers from 'worker-timers';

    const AVATAR_GROUP_PLACEHOLDERS = Array.from({ length: 5 }, (_, index) => ({
        key: `avatar:avatars${index + 1}`,
        displayName: `Group ${index + 1}`
    }));

    const LOCAL_AVATAR_PAGE_SIZE = 20;
    const LOCAL_AVATAR_SCROLL_THRESHOLD = 120;
    const LOCAL_AVATAR_VIEWPORT_BUFFER = 32;

    const avatarGroupVisibilityOptions = ref(['public', 'friends', 'private']);
    const historyGroupKey = 'local-history';
    const avatarSplitterSize = ref(260);

    const { sortFavorites } = storeToRefs(useAppearanceSettingsStore());
    const { setSortFavorites } = useAppearanceSettingsStore();
    const favoriteStore = useFavoriteStore();
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
    const avatarToolbarMenuRef = ref();
    const isCreatingLocalGroup = ref(false);
    const newLocalGroupName = ref('');
    const newLocalGroupInput = ref(null);
    const sliceLocalAvatarFavoritesLoadMoreNumber = ref(60);
    const refreshingLocalFavorites = ref(false);
    const worker = ref(null);
    const refreshCancelToken = ref(null);
    const localAvatarScrollbarRef = ref(null);
    const localAvatarLoadingMore = ref(false);
    const avatarGroupPlaceholders = AVATAR_GROUP_PLACEHOLDERS;
    const hasUserSelectedAvatarGroup = ref(false);
    const remoteAvatarGroupsResolved = ref(false);

    const sortFav = computed({
        get() {
            return sortFavorites.value;
        },
        set() {
            setSortFavorites();
        }
    });

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
        avatarToolbarMenuRef.value?.handleClose?.();
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
        if (typeof storedSize === 'string' && !Number.isNaN(Number(storedSize)) && Number(storedSize) > 0) {
            avatarSplitterSize.value = Number(storedSize);
        }
    }

    function handleAvatarSplitterResize(panelIndex, sizes) {
        if (!Array.isArray(sizes) || !sizes.length) {
            return;
        }
        const nextSize = sizes[0];
        if (nextSize <= 0) {
            return;
        }
        avatarSplitterSize.value = nextSize;
        configRepository.setString('VRCX_FavoritesAvatarSplitter', nextSize.toString());
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

    const sliceLocalAvatarFavorites = computed(() => {
        return (group) => {
            const favorites = localAvatarFavorites.value[group];
            if (!favorites) {
                return [];
            }
            return favorites.slice(0, sliceLocalAvatarFavoritesLoadMoreNumber.value);
        };
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
        return sliceLocalAvatarFavorites.value(activeLocalGroupName.value);
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
        if (!active) {
            nextTick(() => {
                maybeFillLocalAvatarViewport();
            });
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

    watch(
        () => ({
            group: activeLocalGroupName.value,
            visible: currentLocalFavorites.value.length,
            total: activeLocalGroupCount.value,
            slice: sliceLocalAvatarFavoritesLoadMoreNumber.value,
            isLocal: isLocalGroupSelected.value
        }),
        () => {
            nextTick(() => {
                maybeFillLocalAvatarViewport();
            });
        }
    );

    onMounted(() => {
        if (typeof window !== 'undefined') {
            window.addEventListener('resize', maybeFillLocalAvatarViewport);
        }
        nextTick(() => {
            maybeFillLocalAvatarViewport();
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
        resetLoadMoreCounters();
        clearSelectedAvatars();
        if (type === 'local') {
            nextTick(() => {
                maybeFillLocalAvatarViewport();
            });
        }
    }

    function resetLoadMoreCounters() {
        sliceLocalAvatarFavoritesLoadMoreNumber.value = 60;
        localAvatarLoadingMore.value = false;
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

    function handleLocalAvatarScroll() {
        if (!isLocalGroupSelected.value || isSearchActive.value) {
            return;
        }
        const wrap = localAvatarScrollbarRef.value?.wrapRef;
        if (!wrap) {
            return;
        }
        const { scrollTop, clientHeight, scrollHeight } = wrap;
        if (scrollTop + clientHeight >= scrollHeight - LOCAL_AVATAR_SCROLL_THRESHOLD) {
            if (loadMoreLocalAvatarFavorites()) {
                nextTick(() => {
                    maybeFillLocalAvatarViewport();
                });
            }
        }
    }

    function loadMoreLocalAvatarFavorites() {
        if (localAvatarLoadingMore.value) {
            return false;
        }
        if (sliceLocalAvatarFavoritesLoadMoreNumber.value >= activeLocalGroupCount.value) {
            return false;
        }
        localAvatarLoadingMore.value = true;
        sliceLocalAvatarFavoritesLoadMoreNumber.value += LOCAL_AVATAR_PAGE_SIZE;
        nextTick(() => {
            localAvatarLoadingMore.value = false;
        });
        return true;
    }

    function maybeFillLocalAvatarViewport() {
        nextTick(() => {
            if (!isLocalGroupSelected.value || isSearchActive.value) {
                return;
            }
            const wrap = localAvatarScrollbarRef.value?.wrapRef;
            if (!wrap) {
                return;
            }
            if (wrap.scrollHeight > wrap.clientHeight + LOCAL_AVATAR_VIEWPORT_BUFFER) {
                return;
            }
            if (loadMoreLocalAvatarFavorites()) {
                nextTick(() => {
                    maybeFillLocalAvatarViewport();
                });
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

    function clearSelectedAvatars() {
        selectedFavoriteAvatars.value = [];
    }

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

    function copySelectedAvatars() {
        if (!selectedFavoriteAvatars.value.length) {
            return;
        }
        const idList = selectedFavoriteAvatars.value.map((id) => `${id}\n`).join('');
        avatarImportDialogInput.value = idList;
        showAvatarImportDialog();
    }

    function showAvatarBulkUnfavoriteSelectionConfirm() {
        if (!selectedFavoriteAvatars.value.length) {
            return;
        }
        const total = selectedFavoriteAvatars.value.length;
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
                    bulkUnfavoriteSelectedAvatars([...selectedFavoriteAvatars.value]);
                }
            })
            .catch(() => {});
    }

    function bulkUnfavoriteSelectedAvatars(ids) {
        ids.forEach((id) => {
            favoriteRequest.deleteFavorite({
                objectId: id
            });
        });
        selectedFavoriteAvatars.value = [];
        avatarEditMode.value = false;
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

        try {
            await ElMessageBox.confirm(
                t('view.favorite.avatars.check_description'),
                t('view.favorite.avatars.check_invalid'),
                {
                    confirmButtonText: t('confirm.confirm_button'),
                    cancelButtonText: t('confirm.cancel_button'),
                    type: 'info'
                }
            );
        } catch {
            return;
        }

        const progressState = reactive({
            current: 0,
            total: 0,
            percentage: 0
        });

        const ProgressContent = {
            setup() {
                return () =>
                    h('div', { style: 'padding: 4px 0;' }, [
                        h(
                            'p',
                            {
                                style: 'margin: 0 0 12px 0; font-size: 14px; color: var(--el-text-color-primary);'
                            },
                            t('view.favorite.avatars.checking_progress', {
                                current: progressState.current,
                                total: progressState.total
                            })
                        ),
                        h(ElProgress, {
                            percentage: progressState.percentage,
                            style: 'margin-top: 8px;'
                        })
                    ]);
            }
        };

        let progressNotification = null;

        try {
            progressNotification = ElNotification({
                title: t('view.favorite.avatars.checking'),
                message: h(ProgressContent),
                duration: 0,
                type: 'info',
                position: 'bottom-right'
            });

            const result = await checkInvalidLocalAvatars(groupName, (current, total) => {
                progressState.current = current;
                progressState.total = total;
                progressState.percentage = Math.floor((current / total) * 100);
            });

            if (progressNotification) {
                progressNotification.close();
                progressNotification = null;
            }

            if (result.invalid === 0) {
                ElNotification({
                    title: t('view.favorite.avatars.check_complete'),
                    message: t('view.favorite.avatars.no_invalid_found'),
                    type: 'success',
                    duration: 5000,
                    position: 'bottom-right'
                });
                return;
            }

            const confirmDelete = await ElMessageBox.confirm(
                h('div', [
                    h(
                        'p',
                        { style: 'margin-bottom: 12px;' },
                        t('view.favorite.avatars.confirm_delete_description', { count: result.invalid })
                    ),
                    h(
                        'div',
                        { style: 'margin-top: 12px; margin-bottom: 8px; font-weight: 600;' },
                        t('view.favorite.avatars.removed_list_header')
                    ),
                    h(
                        'div',
                        {
                            style: 'max-height: 200px; overflow-y: auto; background: var(--el-fill-color-lighter); padding: 8px; border-radius: 4px;'
                        },
                        result.invalidIds.map((id) =>
                            h('div', { style: 'font-family: monospace; font-size: 12px; padding: 2px 0;' }, id)
                        )
                    )
                ]),
                t('view.favorite.avatars.confirm_delete_invalid'),
                {
                    confirmButtonText: t('confirm.confirm_button'),
                    cancelButtonText: t('view.favorite.avatars.copy_removed_ids'),
                    distinguishCancelAndClose: true,
                    type: 'warning',
                    beforeClose: (action, instance, done) => {
                        if (action === 'cancel') {
                            navigator.clipboard
                                .writeText(result.invalidIds.join('\n'))
                                .then(() => {
                                    toast.success(t('view.favorite.avatars.copied_ids'));
                                })
                                .catch(() => {
                                    toast.error('Failed to copy');
                                });
                            return;
                        }
                        done();
                    }
                }
            )
                .then(() => true)
                .catch(() => false);

            if (!confirmDelete) {
                ElNotification({
                    title: t('view.favorite.avatars.check_complete'),
                    message: t('view.favorite.avatars.delete_cancelled'),
                    type: 'info',
                    duration: 5000,
                    position: 'bottom-right'
                });
                return;
            }

            const removeResult = await removeInvalidLocalAvatars(result.invalidIds, groupName);

            ElNotification({
                title: t('view.favorite.avatars.check_complete'),
                message: t('view.favorite.avatars.delete_summary', {
                    removed: removeResult.removed
                }),
                type: 'success',
                duration: 5000,
                position: 'bottom-right'
            });
        } catch (err) {
            if (progressNotification) {
                progressNotification.close();
            }
            console.error(err);
            ElNotification({
                title: t('message.api_handler.avatar_private_or_deleted'),
                message: String(err.message || err),
                type: 'error',
                duration: 5000,
                position: 'bottom-right'
            });
        }
    }

    function handleHistoryClear() {
        handleGroupMenuVisible(historyGroupMenuKey, false);
        promptClearAvatarHistory();
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

    function promptLocalAvatarFavoriteGroupRename(group) {
        ElMessageBox.prompt(
            t('prompt.local_favorite_group_rename.description'),
            t('prompt.local_favorite_group_rename.header'),
            {
                distinguishCancelAndClose: true,
                confirmButtonText: t('prompt.local_favorite_group_rename.save'),
                cancelButtonText: t('prompt.local_favorite_group_rename.cancel'),
                inputPattern: /\S+/,
                inputErrorMessage: t('prompt.local_favorite_group_rename.input_error'),
                inputValue: group
            }
        )
            .then(({ value }) => {
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
        ElMessageBox.confirm(`Delete Group? ${group}`, 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    deleteLocalAvatarFavoriteGroup(group);
                }
            })
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
        if (typeof window !== 'undefined') {
            window.removeEventListener('resize', maybeFillLocalAvatarViewport);
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

    .group-item__right {
        display: flex;
        align-items: center;
        flex-direction: column;
        gap: 6px;
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

    .group-item--new.is-disabled {
        opacity: 0.5;
        cursor: not-allowed;
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

    :deep(.favorites-search-card--avatar) {
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
