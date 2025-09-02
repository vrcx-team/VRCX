<template>
    <div v-show="menuActiveIndex === 'favorite'" class="x-container">
        <div style="font-size: 13px; position: absolute; display: flex; right: 0; z-index: 1; margin-right: 15px">
            <div v-if="editFavoritesMode" style="display: inline-block; margin-right: 10px">
                <el-button size="small" @click="clearBulkFavoriteSelection">{{ t('view.favorite.clear') }}</el-button>
                <el-button size="small" @click="handleBulkCopyFavoriteSelection">{{
                    t('view.favorite.copy')
                }}</el-button>
                <el-button size="small" @click="showBulkUnfavoriteSelectionConfirm">{{
                    t('view.favorite.bulk_unfavorite')
                }}</el-button>
            </div>
            <div style="display: flex; align-items: center; margin-right: 10px">
                <span class="name">{{ t('view.favorite.edit_mode') }}</span>
                <el-switch v-model="editFavoritesMode" style="margin-left: 5px"></el-switch>
            </div>
            <el-tooltip
                placement="bottom"
                :content="t('view.favorite.refresh_favorites_tooltip')"
                :disabled="hideTooltips">
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
            <el-tab-pane name="friend" :label="t('view.favorite.friends.header')">
                <FavoritesFriendTab
                    :hide-tooltips="hideTooltips"
                    :edit-favorites-mode="editFavoritesMode"
                    @change-favorite-group-name="changeFavoriteGroupName" />
            </el-tab-pane>
            <el-tab-pane name="world" :label="t('view.favorite.worlds.header')" lazy>
                <FavoritesWorldTab
                    :hide-tooltips="hideTooltips"
                    :edit-favorites-mode="editFavoritesMode"
                    :refresh-local-world-favorites="refreshLocalWorldFavorites"
                    @change-favorite-group-name="changeFavoriteGroupName"
                    @refresh-local-world-favorite="refreshLocalWorldFavorites" />
            </el-tab-pane>
            <el-tab-pane name="avatar" :label="t('view.favorite.avatars.header')" lazy>
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

<script setup>
    import { ref, getCurrentInstance } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n-bridge';
    import * as workerTimers from 'worker-timers';
    import { avatarRequest, favoriteRequest, worldRequest } from '../../api';
    import { useAppearanceSettingsStore, useFavoriteStore, useUiStore, useAvatarStore } from '../../stores';
    import FavoritesAvatarTab from './components/FavoritesAvatarTab.vue';
    import FavoritesFriendTab from './components/FavoritesFriendTab.vue';
    import FavoritesWorldTab from './components/FavoritesWorldTab.vue';

    const { t } = useI18n();
    const { proxy } = getCurrentInstance();
    const { hideTooltips } = storeToRefs(useAppearanceSettingsStore());
    const {
        favoriteFriends,
        favoriteWorlds,
        favoriteAvatars,
        isFavoriteLoading,
        localAvatarFavoritesList,
        localWorldFavoritesList,
        avatarImportDialogInput,
        worldImportDialogInput,
        friendImportDialogInput
    } = storeToRefs(useFavoriteStore());
    const {
        refreshFavorites,
        refreshFavoriteGroups,
        clearBulkFavoriteSelection,
        getLocalWorldFavorites,
        handleFavoriteGroup,
        showFriendImportDialog,
        showWorldImportDialog,
        showAvatarImportDialog
    } = useFavoriteStore();
    const { menuActiveIndex } = storeToRefs(useUiStore());
    const { applyAvatar } = useAvatarStore();

    const editFavoritesMode = ref(false);
    const refreshingLocalFavorites = ref(false);
    const currentTabName = ref('friend');

    function showBulkUnfavoriteSelectionConfirm() {
        const elementsTicked = [];
        // check favorites type
        for (const ctx of favoriteFriends.value) {
            if (ctx.$selected) {
                elementsTicked.push(ctx.id);
            }
        }
        for (const ctx of favoriteWorlds.value) {
            if (ctx.$selected) {
                elementsTicked.push(ctx.id);
            }
        }
        for (const ctx of favoriteAvatars.value) {
            if (ctx.$selected) {
                elementsTicked.push(ctx.id);
            }
        }
        if (elementsTicked.length === 0) {
            return;
        }
        proxy.$confirm(
            `Are you sure you want to unfavorite ${elementsTicked.length} favorites?
            This action cannot be undone.`,
            `Delete ${elementsTicked.length} favorites?`,
            {
                confirmButtonText: 'Confirm',
                cancelButtonText: 'Cancel',
                type: 'info',
                callback: (action) => {
                    if (action === 'confirm') {
                        bulkUnfavoriteSelection(elementsTicked);
                    }
                }
            }
        );
    }

    function bulkUnfavoriteSelection(elementsTicked) {
        for (const id of elementsTicked) {
            favoriteRequest.deleteFavorite({
                objectId: id
            });
        }
        editFavoritesMode.value = false;
    }
    function changeFavoriteGroupName(ctx) {
        proxy.$prompt(
            t('prompt.change_favorite_group_name.description'),
            t('prompt.change_favorite_group_name.header'),
            {
                distinguishCancelAndClose: true,
                cancelButtonText: t('prompt.change_favorite_group_name.cancel'),
                confirmButtonText: t('prompt.change_favorite_group_name.change'),
                inputPlaceholder: t('prompt.change_favorite_group_name.input_placeholder'),
                inputValue: ctx.displayName,
                inputPattern: /\S+/,
                inputErrorMessage: t('prompt.change_favorite_group_name.input_error'),
                callback: (action, instance) => {
                    if (action === 'confirm') {
                        favoriteRequest
                            .saveFavoriteGroup({
                                type: ctx.type,
                                group: ctx.name,
                                displayName: instance.inputValue
                            })
                            .then((args) => {
                                handleFavoriteGroup({
                                    json: args.json,
                                    params: {
                                        favoriteGroupId: args.json.id
                                    }
                                });
                                proxy.$message({
                                    message: t('prompt.change_favorite_group_name.message.success'),
                                    type: 'success'
                                });
                                // load new group name
                                refreshFavoriteGroups();
                            });
                    }
                }
            }
        );
    }

    function handleBulkCopyFavoriteSelection() {
        let idList = '';
        switch (currentTabName.value) {
            case 'friend':
                for (const ctx of favoriteFriends.value) {
                    if (ctx.$selected) {
                        idList += `${ctx.id}\n`;
                    }
                }
                friendImportDialogInput.value = idList;
                showFriendImportDialog();

                break;

            case 'world':
                for (const ctx of favoriteWorlds.value) {
                    if (ctx.$selected) {
                        idList += `${ctx.id}\n`;
                    }
                }
                worldImportDialogInput.value = idList;
                showWorldImportDialog();

                break;

            case 'avatar':
                for (const ctx of favoriteAvatars.value) {
                    if (ctx.$selected) {
                        idList += `${ctx.id}\n`;
                    }
                }
                avatarImportDialogInput.value = idList;
                showAvatarImportDialog();

                break;

            default:
                break;
        }

        console.log('Favorite selection\n', idList);
    }

    async function refreshLocalAvatarFavorites() {
        if (refreshingLocalFavorites.value) {
            return;
        }
        refreshingLocalFavorites.value = true;
        for (const avatarId of localAvatarFavoritesList.value) {
            if (!refreshingLocalFavorites.value) {
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
            await new Promise((resolve) => {
                workerTimers.setTimeout(resolve, 1000);
            });
        }
        refreshingLocalFavorites.value = false;
    }
    async function refreshLocalWorldFavorites() {
        if (refreshingLocalFavorites.value) {
            return;
        }
        refreshingLocalFavorites.value = true;
        for (const worldId of localWorldFavoritesList.value) {
            if (!refreshingLocalFavorites.value) {
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
        refreshingLocalFavorites.value = false;
    }
</script>
