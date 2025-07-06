<template>
    <div v-show="menuActiveIndex === 'favorite'" class="x-container">
        <div style="font-size: 13px; position: absolute; display: flex; right: 0; z-index: 1; margin-right: 15px">
            <div v-if="editFavoritesMode" style="display: inline-block; margin-right: 10px">
                <el-button size="small" @click="clearBulkFavoriteSelection">{{ $t('view.favorite.clear') }}</el-button>
                <el-button size="small" @click="bulkCopyFavoriteSelection">{{ $t('view.favorite.copy') }}</el-button>
                <el-button size="small" @click="showBulkUnfavoriteSelectionConfirm">{{
                    $t('view.favorite.bulk_unfavorite')
                }}</el-button>
            </div>
            <div style="display: flex; align-items: center; margin-right: 10px">
                <span class="name">{{ $t('view.favorite.edit_mode') }}</span>
                <el-switch v-model="editFavoritesMode" style="margin-left: 5px"></el-switch>
            </div>
            <el-tooltip placement="bottom" :content="$t('view.favorite.refresh_tooltip')" :disabled="hideTooltips">
                <el-button
                    type="default"
                    :loading="isFavoriteLoading"
                    size="small"
                    icon="el-icon-refresh"
                    circle
                    @click="
                        refreshFavorites();
                        getLocalWorldFavorites();
                    "></el-button>
            </el-tooltip>
        </div>
        <el-tabs v-model="currentTabName" v-loading="isFavoriteLoading" type="card" style="height: 100%">
            <el-tab-pane name="friend" :label="$t('view.favorite.friends.header')">
                <FavoritesFriendTab
                    :hide-tooltips="hideTooltips"
                    :edit-favorites-mode="editFavoritesMode"
                    @change-favorite-group-name="changeFavoriteGroupName" />
            </el-tab-pane>
            <el-tab-pane name="world" :label="$t('view.favorite.worlds.header')" lazy>
                <FavoritesWorldTab
                    :hide-tooltips="hideTooltips"
                    :edit-favorites-mode="editFavoritesMode"
                    :refresh-local-world-favorites="refreshLocalWorldFavorites"
                    @change-favorite-group-name="changeFavoriteGroupName"
                    @refresh-local-world-favorite="refreshLocalWorldFavorites" />
            </el-tab-pane>
            <el-tab-pane name="avatar" :label="$t('view.favorite.avatars.header')" lazy>
                <FavoritesAvatarTab
                    :hide-tooltips="hideTooltips"
                    :edit-favorites-mode="editFavoritesMode"
                    :refreshing-local-favorites="refreshingLocalFavorites"
                    @change-favorite-group-name="changeFavoriteGroupName"
                    @refresh-local-avatar-favorites="refreshLocalAvatarFavorites" />
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script>
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n-bridge';
    import * as workerTimers from 'worker-timers';
    import { avatarRequest, favoriteRequest, worldRequest } from '../../api';
    import { API } from '../../service/eventBus';
    import { useAppearanceSettingsStore, useFavoriteStore, useUiStore } from '../../stores';
    import FavoritesAvatarTab from './components/FavoritesAvatarTab.vue';
    import FavoritesFriendTab from './components/FavoritesFriendTab.vue';
    import FavoritesWorldTab from './components/FavoritesWorldTab.vue';

    export default {
        name: 'FavoritesTab',
        components: {
            FavoritesFriendTab,
            FavoritesWorldTab,
            FavoritesAvatarTab
        },
        setup() {
            const { t } = useI18n();
            const { hideTooltips } = storeToRefs(useAppearanceSettingsStore());
            const {
                favoriteFriends,
                favoriteWorlds,
                favoriteAvatars,
                isFavoriteLoading,
                localAvatarFavoritesList,
                localWorldFavoritesList
            } = storeToRefs(useFavoriteStore());
            const {
                refreshFavorites,
                refreshFavoriteGroups,
                clearBulkFavoriteSelection,
                bulkCopyFavoriteSelection,
                getLocalWorldFavorites
            } = useFavoriteStore();
            const { menuActiveIndex } = storeToRefs(useUiStore());
            return {
                hideTooltips,
                favoriteFriends,
                favoriteWorlds,
                favoriteAvatars,
                API,
                refreshFavorites,
                refreshFavoriteGroups,
                isFavoriteLoading,
                clearBulkFavoriteSelection,
                bulkCopyFavoriteSelection,
                localAvatarFavoritesList,
                localWorldFavoritesList,
                getLocalWorldFavorites,
                menuActiveIndex,
                t
            };
        },
        data() {
            return {
                editFavoritesMode: false,
                refreshingLocalFavorites: false,
                currentTabName: 'friend'
            };
        },
        methods: {
            showBulkUnfavoriteSelectionConfirm() {
                const elementsTicked = [];
                // check favorites type
                for (const ctx of this.favoriteFriends) {
                    if (ctx.$selected) {
                        elementsTicked.push(ctx.id);
                    }
                }
                for (const ctx of this.favoriteWorlds) {
                    if (ctx.$selected) {
                        elementsTicked.push(ctx.id);
                    }
                }
                for (const ctx of this.favoriteAvatars) {
                    if (ctx.$selected) {
                        elementsTicked.push(ctx.id);
                    }
                }
                if (elementsTicked.length === 0) {
                    return;
                }
                this.$confirm(
                    `Are you sure you want to unfavorite ${elementsTicked.length} favorites?
            This action cannot be undone.`,
                    `Delete ${elementsTicked.length} favorites?`,
                    {
                        confirmButtonText: 'Confirm',
                        cancelButtonText: 'Cancel',
                        type: 'info',
                        callback: (action) => {
                            if (action === 'confirm') {
                                this.bulkUnfavoriteSelection(elementsTicked);
                            }
                        }
                    }
                );
            },

            bulkUnfavoriteSelection(elementsTicked) {
                for (const id of elementsTicked) {
                    favoriteRequest.deleteFavorite({
                        objectId: id
                    });
                }
                this.editFavoritesMode = false;
            },
            changeFavoriteGroupName(ctx) {
                this.$prompt(
                    this.t('prompt.change_favorite_group_name.description'),
                    this.t('prompt.change_favorite_group_name.header'),
                    {
                        distinguishCancelAndClose: true,
                        cancelButtonText: this.t('prompt.change_favorite_group_name.cancel'),
                        confirmButtonText: this.t('prompt.change_favorite_group_name.change'),
                        inputPlaceholder: this.t('prompt.change_favorite_group_name.input_placeholder'),
                        inputValue: ctx.displayName,
                        inputPattern: /\S+/,
                        inputErrorMessage: this.t('prompt.change_favorite_group_name.input_error'),
                        callback: (action, instance) => {
                            if (action === 'confirm') {
                                favoriteRequest
                                    .saveFavoriteGroup({
                                        type: ctx.type,
                                        group: ctx.name,
                                        displayName: instance.inputValue
                                    })
                                    .then(() => {
                                        this.$message({
                                            message: this.t('prompt.change_favorite_group_name.message.success'),
                                            type: 'success'
                                        });
                                        // load new group name
                                        this.refreshFavoriteGroups();
                                    });
                            }
                        }
                    }
                );
            },

            async refreshLocalAvatarFavorites() {
                if (this.refreshingLocalFavorites) {
                    return;
                }
                this.refreshingLocalFavorites = true;
                for (const avatarId of this.localAvatarFavoritesList) {
                    if (!this.refreshingLocalFavorites) {
                        break;
                    }
                    try {
                        await avatarRequest.getAvatar({
                            avatarId
                        });
                    } catch (err) {
                        console.error(err);
                    }
                    await new Promise((resolve) => {
                        workerTimers.setTimeout(resolve, 1000);
                    });
                }
                this.refreshingLocalFavorites = false;
            },
            async refreshLocalWorldFavorites() {
                if (this.refreshingLocalFavorites) {
                    return;
                }
                this.refreshingLocalFavorites = true;
                for (const worldId of this.localWorldFavoritesList) {
                    if (!this.refreshingLocalFavorites) {
                        break;
                    }
                    try {
                        await worldRequest.getWorld({
                            worldId
                        });
                    } catch (err) {
                        console.error(err);
                    }
                    await new Promise((resolve) => {
                        workerTimers.setTimeout(resolve, 1000);
                    });
                }
                this.refreshingLocalFavorites = false;
            }
        }
    };
</script>
