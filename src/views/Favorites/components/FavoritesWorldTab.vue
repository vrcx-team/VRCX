<template>
    <div>
        <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
                <el-button size="small" @click="showExportDialog">{{ t('view.favorite.export') }}</el-button>
                <el-button size="small" style="margin-left: 5px" @click="showWorldImportDialog">{{
                    t('view.favorite.import')
                }}</el-button>
            </div>
            <div style="display: flex; align-items: center; font-size: 13px; margin-right: 10px">
                <span class="name" style="margin-right: 5px; line-height: 10px">{{ t('view.favorite.sort_by') }}</span>
                <el-radio-group v-model="sortFav" style="margin-right: 12px">
                    <el-radio :label="false">{{
                        t('view.settings.appearance.appearance.sort_favorite_by_name')
                    }}</el-radio>
                    <el-radio :label="true">{{
                        t('view.settings.appearance.appearance.sort_favorite_by_date')
                    }}</el-radio>
                </el-radio-group>
                <el-input
                    v-model="worldFavoriteSearch"
                    clearable
                    size="small"
                    :placeholder="t('view.favorite.worlds.search')"
                    style="width: 200px"
                    @input="searchWorldFavorites" />
            </div>
        </div>
        <div class="x-friend-list" style="margin-top: 10px">
            <div
                v-for="favorite in worldFavoriteSearchResults"
                :key="favorite.id"
                style="display: inline-block; width: 300px; margin-right: 15px"
                @click="showWorldDialog(favorite.id)">
                <div class="x-friend-item">
                    <template v-if="favorite.name">
                        <div class="avatar">
                            <img :src="favorite.thumbnailImageUrl" loading="lazy" />
                        </div>
                        <div class="detail">
                            <span class="name" v-text="favorite.name"></span>
                            <span v-if="favorite.occupants" class="extra"
                                >{{ favorite.authorName }} ({{ favorite.occupants }})</span
                            >
                            <span v-else class="extra" v-text="favorite.authorName"></span>
                        </div>
                    </template>
                    <template v-else>
                        <div class="avatar"></div>
                        <div class="detail">
                            <span v-text="favorite.id"></span>
                        </div>
                    </template>
                </div>
            </div>
        </div>
        <span style="display: block; margin-top: 20px">{{ t('view.favorite.worlds.vrchat_favorites') }}</span>
        <el-collapse style="border: 0">
            <el-collapse-item v-for="group in favoriteWorldGroups" :key="group.name">
                <template #title>
                    <div style="display: flex; align-items: center">
                        <span
                            style="font-weight: bold; font-size: 14px; margin-left: 10px"
                            v-text="group.displayName" />
                        <el-tag
                            style="margin: 1px 0 0 5px"
                            size="small"
                            :type="userFavoriteWorldsStatusForFavTab(group.visibility)"
                            effect="plain"
                            >{{ group.visibility.charAt(0).toUpperCase() + group.visibility.slice(1) }}</el-tag
                        >
                        <span style="color: #909399; font-size: 12px; margin-left: 10px"
                            >{{ group.count }}/{{ group.capacity }}</span
                        ><el-tooltip
                            placement="top"
                            :content="t('view.favorite.visibility_tooltip')"
                            :teleported="false">
                            <el-dropdown trigger="click" size="small" style="margin-left: 10px" :persistent="false">
                                <el-button type="default" :icon="View" size="small" circle @click.stop />
                                <template #dropdown>
                                    <el-dropdown-menu>
                                        <template v-for="visibility in worldGroupVisibilityOptions" :key="visibility">
                                            <el-dropdown-item
                                                v-if="group.visibility !== visibility"
                                                style="display: block; margin: 10px 0"
                                                @click="changeWorldGroupVisibility(group.name, visibility)"
                                                >{{
                                                    visibility.charAt(0).toUpperCase() + visibility.slice(1)
                                                }}</el-dropdown-item
                                            >
                                        </template>
                                    </el-dropdown-menu>
                                </template>
                            </el-dropdown>
                        </el-tooltip>
                        <el-tooltip placement="top" :content="t('view.favorite.rename_tooltip')" :teleported="false">
                            <el-button
                                size="small"
                                :icon="Edit"
                                circle
                                style="margin-left: 5px"
                                @click.stop="changeFavoriteGroupName(group)" />
                        </el-tooltip>
                        <el-tooltip placement="right" :content="t('view.favorite.clear_tooltip')" :teleported="false">
                            <el-button
                                size="small"
                                :icon="Delete"
                                circle
                                style="margin-left: 5px"
                                @click.stop="clearFavoriteGroup(group)" />
                        </el-tooltip>
                    </div>
                </template>
                <div v-if="group.count" class="x-friend-list" style="margin-top: 10px">
                    <el-scrollbar height="700px" @end-reached="worldFavoritesLoadMore">
                        <FavoritesWorldItem
                            v-for="favorite in sliceWorldFavorites(group.key)"
                            :key="favorite.id"
                            :group="group"
                            :favorite="favorite"
                            @click="showWorldDialog(favorite.id)"
                            @handle-select="favorite.$selected = $event" />
                    </el-scrollbar>
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
        <span style="display: block; margin-top: 20px">{{ t('view.favorite.worlds.local_favorites') }}</span>
        <br />
        <el-button size="small" @click="promptNewLocalWorldFavoriteGroup">{{
            t('view.favorite.worlds.new_group')
        }}</el-button>
        <el-button
            v-if="!refreshingLocalFavorites"
            size="small"
            style="margin-left: 5px"
            @click="refreshLocalWorldFavorites"
            >{{ t('view.favorite.worlds.refresh') }}</el-button
        >
        <el-button v-else size="small" style="margin-left: 5px" @click="cancelLocalWorldRefresh">
            <el-icon style="margin-right: 5px"><Loading /></el-icon>
            <span>{{ t('view.favorite.worlds.cancel_refresh') }}</span>
        </el-button>
        <el-collapse style="border: 0">
            <el-collapse-item v-for="group in localWorldFavoriteGroups" :key="group">
                <template #title>
                    <span style="font-weight: bold; font-size: 14px; margin-left: 10px" v-text="group" />
                    <span style="color: #909399; font-size: 12px; margin-left: 10px">{{
                        localWorldFavGroupLength(group)
                    }}</span>
                    <el-tooltip placement="top" :content="t('view.favorite.rename_tooltip')" :teleported="false">
                        <el-button
                            size="small"
                            :icon="Edit"
                            circle
                            style="margin-left: 10px"
                            @click.stop="promptLocalWorldFavoriteGroupRename(group)" />
                    </el-tooltip>
                    <el-tooltip placement="right" :content="t('view.favorite.delete_tooltip')" :teleported="false">
                        <el-button
                            size="small"
                            :icon="Delete"
                            circle
                            style="margin-left: 5px"
                            @click.stop="promptLocalWorldFavoriteGroupDelete(group)" />
                    </el-tooltip>
                </template>
                <div v-if="localWorldFavorites[group].length" class="x-friend-list" style="margin-top: 10px">
                    <el-scrollbar height="700px" @end-reached="localWorldFavoritesLoadMore">
                        <FavoritesWorldLocalItem
                            v-for="favorite in sliceLocalWorldFavorites(group)"
                            :key="favorite.id"
                            :group="group"
                            :favorite="favorite"
                            @click="showWorldDialog(favorite.id)"
                            @remove-local-world-favorite="removeLocalWorldFavorite"
                    /></el-scrollbar>
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
        <WorldExportDialog v-model:worldExportDialogVisible="worldExportDialogVisible" />
    </div>
</template>

<script setup>
    import { Delete, Edit, Loading, View } from '@element-plus/icons-vue';
    import { computed, onBeforeUnmount, ref } from 'vue';
    import { ElMessage, ElMessageBox } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAppearanceSettingsStore, useFavoriteStore, useWorldStore } from '../../../stores';
    import { favoriteRequest, worldRequest } from '../../../api';

    import FavoritesWorldItem from './FavoritesWorldItem.vue';
    import FavoritesWorldLocalItem from './FavoritesWorldLocalItem.vue';
    import WorldExportDialog from '../dialogs/WorldExportDialog.vue';

    import * as workerTimers from 'worker-timers';

    const emit = defineEmits([
        'change-favorite-group-name',
        'save-sort-favorites-option',
        'refresh-local-world-favorite'
    ]);

    const { t } = useI18n();
    const { sortFavorites } = storeToRefs(useAppearanceSettingsStore());
    const { setSortFavorites } = useAppearanceSettingsStore();
    const { favoriteWorlds, favoriteWorldGroups, localWorldFavorites } = storeToRefs(useFavoriteStore());
    const {
        showWorldImportDialog,
        localWorldFavGroupLength,
        deleteLocalWorldFavoriteGroup,
        renameLocalWorldFavoriteGroup,
        removeLocalWorldFavorite,
        newLocalWorldFavoriteGroup,
        handleFavoriteGroup,
        localWorldFavoritesList,
        localWorldFavoriteGroups
    } = useFavoriteStore();
    const { showWorldDialog } = useWorldStore();

    const worldGroupVisibilityOptions = ref(['private', 'friends', 'public']);
    const worldExportDialogVisible = ref(false);
    const worldFavoriteSearch = ref('');
    const worldFavoriteSearchResults = ref([]);
    const sliceLocalWorldFavoritesLoadMoreNumber = ref(60);
    const sliceWorldFavoritesLoadMoreNumber = ref(60);
    const refreshingLocalFavorites = ref(false);
    const worker = ref(null);
    const refreshCancelToken = ref(null);

    const sliceLocalWorldFavorites = computed(() => {
        return (group) => {
            return localWorldFavorites.value[group].slice(0, sliceLocalWorldFavoritesLoadMoreNumber.value);
        };
    });

    const sliceWorldFavorites = computed(() => {
        return (group) => {
            const groupedByGroupKeyFavoriteWorlds = {};

            favoriteWorlds.value.forEach((world) => {
                if (world.groupKey) {
                    if (!groupedByGroupKeyFavoriteWorlds[world.groupKey]) {
                        groupedByGroupKeyFavoriteWorlds[world.groupKey] = [];
                    }
                    groupedByGroupKeyFavoriteWorlds[world.groupKey].push(world);
                }
            });

            if (groupedByGroupKeyFavoriteWorlds[group]) {
                return groupedByGroupKeyFavoriteWorlds[group].slice(0, sliceWorldFavoritesLoadMoreNumber.value);
            }
            return [];
        };
    });

    const sortFav = computed({
        get() {
            return sortFavorites.value;
        },
        set() {
            setSortFavorites();
        }
    });

    function localWorldFavoritesLoadMore(direction) {
        if (direction === 'bottom') {
            sliceLocalWorldFavoritesLoadMoreNumber.value += 20;
        }
    }

    function worldFavoritesLoadMore(direction) {
        if (direction === 'bottom') {
            sliceWorldFavoritesLoadMoreNumber.value += 20;
        }
    }

    function showExportDialog() {
        worldExportDialogVisible.value = true;
    }

    function userFavoriteWorldsStatusForFavTab(visibility) {
        if (visibility === 'public') {
            return 'primary';
        }
        if (visibility === 'friends') {
            return 'success';
        }
        return 'info';
    }

    function changeWorldGroupVisibility(name, visibility) {
        const params = {
            type: 'world',
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
            ElMessage({
                message: 'Group visibility changed',
                type: 'success'
            });
            return args;
        });
    }

    function promptNewLocalWorldFavoriteGroup() {
        ElMessageBox.prompt(
            t('prompt.new_local_favorite_group.description'),
            t('prompt.new_local_favorite_group.header'),
            {
                distinguishCancelAndClose: true,
                confirmButtonText: t('prompt.new_local_favorite_group.ok'),
                cancelButtonText: t('prompt.new_local_favorite_group.cancel'),
                inputPattern: /\S+/,
                inputErrorMessage: t('prompt.new_local_favorite_group.input_error')
            }
        )
            .then(({ value }) => {
                if (value) {
                    newLocalWorldFavoriteGroup(value);
                }
            })
            .catch(() => {});
    }

    function promptLocalWorldFavoriteGroupRename(group) {
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
                    renameLocalWorldFavoriteGroup(value, group);
                }
            })
            .catch(() => {});
    }

    function promptLocalWorldFavoriteGroupDelete(group) {
        ElMessageBox.confirm(`Delete Group? ${group}`, 'Confirm', {
            confirmButtonText: 'Confirm',
            cancelButtonText: 'Cancel',
            type: 'info'
        })
            .then((action) => {
                if (action === 'confirm') {
                    deleteLocalWorldFavoriteGroup(group);
                }
            })
            .catch(() => {});
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

    function searchWorldFavorites(worldFavoriteSearch) {
        let ref = null;
        const search = worldFavoriteSearch.toLowerCase();
        if (search.length < 3) {
            worldFavoriteSearchResults.value = [];
            return;
        }

        const results = [];
        for (let i = 0; i < localWorldFavoriteGroups.length; ++i) {
            const group = localWorldFavoriteGroups[i];
            if (!localWorldFavorites.value[group]) {
                continue;
            }
            for (let j = 0; j < localWorldFavorites.value[group].length; ++j) {
                ref = localWorldFavorites.value[group][j];
                if (
                    !ref ||
                    typeof ref.id === 'undefined' ||
                    typeof ref.name === 'undefined' ||
                    typeof ref.authorName === 'undefined'
                ) {
                    continue;
                }
                if (ref.name.toLowerCase().includes(search) || ref.authorName.toLowerCase().includes(search)) {
                    if (!results.some((r) => r.id === ref.id)) {
                        results.push(ref);
                    }
                }
            }
        }

        for (let i = 0; i < favoriteWorlds.value.length; ++i) {
            ref = favoriteWorlds.value[i].ref;
            if (
                !ref ||
                typeof ref.id === 'undefined' ||
                typeof ref.name === 'undefined' ||
                typeof ref.authorName === 'undefined'
            ) {
                continue;
            }
            if (ref.name.toLowerCase().includes(search) || ref.authorName.toLowerCase().includes(search)) {
                if (!results.some((r) => r.id === ref.id)) {
                    results.push(ref);
                }
            }
        }

        worldFavoriteSearchResults.value = results;
    }

    function changeFavoriteGroupName(group) {
        emit('change-favorite-group-name', group);
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
    });
</script>
