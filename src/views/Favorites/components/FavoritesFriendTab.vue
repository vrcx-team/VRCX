<template>
    <div>
        <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
                <el-button size="small" @click="showFriendExportDialog">{{ $t('view.favorite.export') }}</el-button>
                <el-button size="small" style="margin-left: 5px" @click="showFriendImportDialog">{{
                    $t('view.favorite.import')
                }}</el-button>
            </div>
            <div style="display: flex; align-items: center; font-size: 13px; margin-right: 10px">
                <span class="name" style="margin-right: 5px; line-height: 10px">{{ $t('view.favorite.sort_by') }}</span>
                <el-radio-group v-model="sortFav" @change="saveSortFavoritesOption">
                    <el-radio :label="false">{{
                        $t('view.settings.appearance.appearance.sort_favorite_by_name')
                    }}</el-radio>
                    <el-radio :label="true">{{
                        $t('view.settings.appearance.appearance.sort_favorite_by_date')
                    }}</el-radio>
                </el-radio-group>
            </div>
        </div>
        <span style="display: block; margin-top: 30px">{{ $t('view.favorite.avatars.vrchat_favorites') }}</span>
        <el-collapse style="border: 0">
            <el-collapse-item v-for="group in API.favoriteFriendGroups" :key="group.name">
                <template slot="title">
                    <span
                        style="font-weight: bold; font-size: 14px; margin-left: 10px"
                        v-text="group.displayName"></span>
                    <span style="color: #909399; font-size: 12px; margin-left: 10px"
                        >{{ group.count }}/{{ group.capacity }}</span
                    >
                    <el-tooltip placement="top" :content="$t('view.favorite.rename_tooltip')" :disabled="hideTooltips">
                        <el-button
                            size="mini"
                            icon="el-icon-edit"
                            circle
                            style="margin-left: 10px"
                            @click.stop="changeFavoriteGroupName(group)"></el-button>
                    </el-tooltip>
                    <el-tooltip placement="right" :content="$t('view.favorite.clear_tooltip')" :disabled="hideTooltips">
                        <el-button
                            size="mini"
                            icon="el-icon-delete"
                            circle
                            style="margin-left: 5px"
                            @click.stop="clearFavoriteGroup(group)"></el-button>
                    </el-tooltip>
                </template>
                <div v-if="group.count" class="x-friend-list" style="margin-top: 10px">
                    <FavoritesFriendItem
                        v-for="favorite in groupedByGroupKeyFavoriteFriends[group.key]"
                        :key="favorite.id"
                        style="display: inline-block; width: 300px; margin-right: 15px"
                        :favorite="favorite"
                        :edit-favorites-mode="editFavoritesMode"
                        :group="group"
                        @click="showUserDialog(favorite.id)" />
                </div>
                <div
                    v-else
                    style="
                        padding-top: 25px;
                        width: 100%;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        color: rgb(144, 147, 153);
                    ">
                    <span>No Data</span>
                </div>
            </el-collapse-item>
        </el-collapse>
        <FriendExportDialog
            :friend-export-dialog-visible.sync="friendExportDialogVisible"
            :favorite-friends="favoriteFriends" />
    </div>
</template>

<script>
    import FavoritesFriendItem from './FavoritesFriendItem.vue';
    import FriendExportDialog from '../dialogs/FriendExportDialog.vue';
    import { favoriteRequest } from '../../../api';

    export default {
        name: 'FavoritesFriendTab',
        components: { FriendExportDialog, FavoritesFriendItem },
        inject: ['showUserDialog', 'API'],
        props: {
            favoriteFriends: Array,
            sortFavorites: Boolean,
            hideTooltips: Boolean,
            groupedByGroupKeyFavoriteFriends: Object,
            editFavoritesMode: Boolean
        },
        data() {
            return {
                friendExportDialogVisible: false
            };
        },
        computed: {
            sortFav: {
                get() {
                    return this.sortFavorites;
                },
                set(value) {
                    this.$emit('update:sort-favorites', value);
                }
            }
        },
        methods: {
            showFriendExportDialog() {
                this.friendExportDialogVisible = true;
            },
            showFriendImportDialog() {
                this.$emit('show-friend-import-dialog');
            },
            saveSortFavoritesOption() {
                this.$emit('save-sort-favorites-option');
            },

            clearFavoriteGroup(ctx) {
                // FIXME: 메시지 수정
                this.$confirm('Continue? Clear Group', 'Confirm', {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info',
                    callback: (action) => {
                        if (action === 'confirm') {
                            favoriteRequest.clearFavoriteGroup({
                                type: ctx.type,
                                group: ctx.name
                            });
                        }
                    }
                });
            },
            changeFavoriteGroupName(group) {
                this.$emit('change-favorite-group-name', group);
            }
        }
    };
</script>
