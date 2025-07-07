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
            <el-collapse-item v-for="group in favoriteFriendGroups" :key="group.name">
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
        <FriendExportDialog :friend-export-dialog-visible.sync="friendExportDialogVisible" />
    </div>
</template>

<script setup>
    import { ref, getCurrentInstance, computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { favoriteRequest } from '../../../api';
    import { useAppearanceSettingsStore, useFavoriteStore, useUserStore } from '../../../stores';
    import FriendExportDialog from '../dialogs/FriendExportDialog.vue';
    import FavoritesFriendItem from './FavoritesFriendItem.vue';

    defineProps({
        editFavoritesMode: {
            type: Boolean,
            default: false
        }
    });

    const emit = defineEmits(['change-favorite-group-name']);

    const { proxy } = getCurrentInstance();

    const { hideTooltips, sortFavorites } = storeToRefs(useAppearanceSettingsStore());
    const { setSortFavorites } = useAppearanceSettingsStore();
    const { showUserDialog } = useUserStore();
    const { favoriteFriendGroups, groupedByGroupKeyFavoriteFriends } = storeToRefs(useFavoriteStore());
    const { showFriendImportDialog, saveSortFavoritesOption } = useFavoriteStore();

    const friendExportDialogVisible = ref(false);

    const sortFav = computed({
        get() {
            return sortFavorites.value;
        },
        set(value) {
            setSortFavorites(value);
        }
    });

    function showFriendExportDialog() {
        friendExportDialogVisible.value = true;
    }

    function clearFavoriteGroup(ctx) {
        proxy.$confirm('Continue? Clear Group', 'Confirm', {
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
    }

    function changeFavoriteGroupName(group) {
        emit('change-favorite-group-name', group);
    }
</script>
