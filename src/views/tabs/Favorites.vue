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
                    :loading="API.isFavoriteLoading"
                    @click="
                        API.refreshFavorites();
                        getLocalWorldFavorites();
                    "
                    size="small"
                    icon="el-icon-refresh"
                    circle></el-button>
            </el-tooltip>
        </div>
        <el-tabs type="card" v-loading="API.isFavoriteLoading" style="height: 100%">
            <el-tab-pane :label="$t('view.favorite.friends.header')" lazy>
                <favorites-friend-tab
                    :favorite-friends="favoriteFriends"
                    :sort-favorites.sync="isSortByTime"
                    :hide-tooltips="hideTooltips"
                    :grouped-by-group-key-favorite-friends="groupedByGroupKeyFavoriteFriends"
                    :edit-favorites-mode="editFavoritesMode"
                    @show-friend-import-dialog="showFriendImportDialog"
                    @save-sort-favorites-option="saveSortFavoritesOption"
                    @change-favorite-group-name="changeFavoriteGroupName" />
            </el-tab-pane>
            <el-tab-pane :label="$t('view.favorite.worlds.header')" lazy>
                <favorites-world-tab
                    @show-world-import-dialog="showWorldImportDialog"
                    @save-sort-favorites-option="saveSortFavoritesOption"
                    @show-world-dialog="showWorldDialog"
                    @change-favorite-group-name="changeFavoriteGroupName"
                    @new-instance-self-invite="newInstanceSelfInvite"
                    @show-favorite-dialog="showFavoriteDialog"
                    @refresh-local-world-favorite="refreshLocalWorldFavorites"
                    @delete-local-world-favorite-group="deleteLocalWorldFavoriteGroup"
                    @remove-local-world-favorite="removeLocalWorldFavorite"
                    @rename-local-world-favorite-group="renameLocalWorldFavoriteGroup"
                    @new-local-world-favorite-group="newLocalWorldFavoriteGroup"
                    :sort-favorites.sync="isSortByTime"
                    :hide-tooltips="hideTooltips"
                    :favorite-worlds="favoriteWorlds"
                    :edit-favorites-mode="editFavoritesMode"
                    :shift-held="shiftHeld"
                    :refresh-local-world-favorites="refreshLocalWorldFavorites"
                    :local-world-favorite-groups="localWorldFavoriteGroups"
                    :local-world-favorites="localWorldFavorites"
                    :local-world-favorites-list="localWorldFavoritesList" />
            </el-tab-pane>
            <el-tab-pane :label="$t('view.favorite.avatars.header')" lazy>
                <favorites-avatar-tab
                    :sort-favorites.sync="isSortByTime"
                    :hide-tooltips="hideTooltips"
                    :shift-held="shiftHeld"
                    :edit-favorites-mode="editFavoritesMode"
                    :avatar-history-array="avatarHistoryArray"
                    :refreshing-local-favorites="refreshingLocalFavorites"
                    :local-avatar-favorite-groups="localAvatarFavoriteGroups"
                    :local-avatar-favorites="localAvatarFavorites"
                    :favorite-avatars="favoriteAvatars"
                    :local-avatar-favorites-list="localAvatarFavoritesList"
                    @show-avatar-import-dialog="showAvatarImportDialog"
                    @save-sort-favorites-option="saveSortFavoritesOption"
                    @show-avatar-dialog="showAvatarDialog"
                    @show-favorite-dialog="showFavoriteDialog"
                    @change-favorite-group-name="changeFavoriteGroupName"
                    @remove-local-avatar-favorite="removeLocalAvatarFavorite"
                    @select-avatar-with-confirmation="selectAvatarWithConfirmation"
                    @prompt-clear-avatar-history="promptClearAvatarHistory"
                    @prompt-new-local-avatar-favorite-group="promptNewLocalAvatarFavoriteGroup"
                    @refresh-local-avatar-favorites="refreshLocalAvatarFavorites"
                    @prompt-local-avatar-favorite-group-rename="promptLocalAvatarFavoriteGroupRename"
                    @prompt-local-avatar-favorite-group-delete="promptLocalAvatarFavoriteGroupDelete" />
            </el-tab-pane>
        </el-tabs>
    </div>
</template>

<script>
    import FavoritesFriendTab from '../../components/favorites/FavoritesFriendTab.vue';
    import FavoritesWorldTab from '../../components/favorites/FavoritesWorldTab.vue';
    import FavoritesAvatarTab from '../../components/favorites/FavoritesAvatarTab.vue';
    import { avatarRequest, favoriteRequest, worldRequest } from '../../classes/request';
    import * as workerTimers from 'worker-timers';

    export default {
        name: 'FavoritesTab',
        components: {
            FavoritesFriendTab,
            FavoritesWorldTab,
            FavoritesAvatarTab
        },
        inject: ['API'],
        props: {
            menuActiveIndex: String,
            hideTooltips: Boolean,
            shiftHeld: Boolean,
            favoriteFriends: Array,
            sortFavorites: Boolean,
            groupedByGroupKeyFavoriteFriends: Object,
            favoriteWorlds: Array,
            localWorldFavoriteGroups: Array,
            localWorldFavorites: Object,
            avatarHistoryArray: Array,
            localAvatarFavoriteGroups: Array,
            localAvatarFavorites: Object,
            favoriteAvatars: Array,
            localAvatarFavoritesList: Array,
            localWorldFavoritesList: Array
        },
        data() {
            return {
                editFavoritesMode: false,
                refreshingLocalFavorites: false
            };
        },
        computed: {
            isSortByTime: {
                get() {
                    return this.sortFavorites;
                },
                set(value) {
                    this.$emit('update:sort-favorites', value);
                }
            }
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
                    $t('prompt.change_favorite_group_name.description'),
                    $t('prompt.change_favorite_group_name.header'),
                    {
                        distinguishCancelAndClose: true,
                        cancelButtonText: $t('prompt.change_favorite_group_name.cancel'),
                        confirmButtonText: $t('prompt.change_favorite_group_name.change'),
                        inputPlaceholder: $t('prompt.change_favorite_group_name.input_placeholder'),
                        inputValue: ctx.displayName,
                        inputPattern: /\S+/,
                        inputErrorMessage: $t('prompt.change_favorite_group_name.input_error'),
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
                                            message: $t('prompt.change_favorite_group_name.message.success'),
                                            type: 'success'
                                        });
                                        // load new group name
                                        this.API.refreshFavoriteGroups();
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
            },
            clearBulkFavoriteSelection() {
                this.$emit('clear-bulk-favorite-selection');
            },
            bulkCopyFavoriteSelection() {
                this.$emit('bulk-copy-favorite-selection');
            },
            getLocalWorldFavorites() {
                this.$emit('get-local-world-favorites');
            },
            showFriendImportDialog() {
                this.$emit('show-friend-import-dialog');
            },
            saveSortFavoritesOption() {
                this.$emit('save-sort-favorites-option');
            },
            showWorldImportDialog() {
                this.$emit('show-world-import-dialog');
            },
            showWorldDialog(tag, shortName) {
                this.$emit('show-world-dialog', tag, shortName);
            },
            newInstanceSelfInvite(worldId) {
                this.$emit('new-instance-self-invite', worldId);
            },
            showFavoriteDialog(type, objectId) {
                this.$emit('show-favorite-dialog', type, objectId);
            },
            deleteLocalWorldFavoriteGroup(group) {
                this.$emit('delete-local-world-favorite-group', group);
            },
            removeLocalWorldFavorite(worldId, group) {
                this.$emit('remove-local-world-favorite', worldId, group);
            },
            showAvatarImportDialog() {
                this.$emit('show-avatar-import-dialog');
            },
            showAvatarDialog(avatarId) {
                this.$emit('show-avatar-dialog', avatarId);
            },
            removeLocalAvatarFavorite(avatarId, group) {
                this.$emit('remove-local-avatar-favorite', avatarId, group);
            },
            selectAvatarWithConfirmation(id) {
                this.$emit('select-avatar-with-confirmation', id);
            },
            promptClearAvatarHistory() {
                this.$emit('prompt-clear-avatar-history');
            },
            promptNewLocalAvatarFavoriteGroup() {
                this.$emit('prompt-new-local-avatar-favorite-group');
            },
            promptLocalAvatarFavoriteGroupRename(group) {
                this.$emit('prompt-local-avatar-favorite-group-rename', group);
            },
            promptLocalAvatarFavoriteGroupDelete(group) {
                this.$emit('prompt-local-avatar-favorite-group-delete', group);
            },
            renameLocalWorldFavoriteGroup(inputValue, group) {
                this.$emit('rename-local-world-favorite-group', inputValue, group);
            },
            newLocalWorldFavoriteGroup(inputValue) {
                this.$emit('new-local-world-favorite-group', inputValue);
            }
        }
    };
</script>
