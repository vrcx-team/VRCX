<template>
    <div>
        <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
                <el-button size="small" @click="showExportDialog">{{ $t('view.favorite.export') }}</el-button>
                <el-button size="small" style="margin-left: 5px" @click="$emit('show-world-import-dialog')">{{
                    $t('view.favorite.import')
                }}</el-button>
            </div>
            <div style="display: flex; align-items: center; font-size: 13px; margin-right: 10px">
                <span class="name" style="margin-right: 5px; line-height: 10px">{{ $t('view.favorite.sort_by') }}</span>
                <el-radio-group
                    v-model="sortFav"
                    style="margin-right: 12px"
                    @change="$emit('save-sort-favorites-option')">
                    <el-radio :label="false">{{
                        $t('view.settings.appearance.appearance.sort_favorite_by_name')
                    }}</el-radio>
                    <el-radio :label="true">{{
                        $t('view.settings.appearance.appearance.sort_favorite_by_date')
                    }}</el-radio>
                </el-radio-group>
                <el-input
                    v-model="worldFavoriteSearch"
                    clearable
                    size="mini"
                    :placeholder="$t('view.favorite.worlds.search')"
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
                            <img v-lazy="favorite.thumbnailImageUrl" />
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
        <span style="display: block; margin-top: 20px">{{ $t('view.favorite.worlds.vrchat_favorites') }}</span>
        <el-collapse style="border: 0">
            <el-collapse-item v-for="group in API.favoriteWorldGroups" :key="group.name">
                <template slot="title">
                    <div style="display: flex; align-items: center">
                        <span
                            style="font-weight: bold; font-size: 14px; margin-left: 10px"
                            v-text="group.displayName" />
                        <el-tag
                            style="margin: 1px 0 0 5px"
                            size="mini"
                            :type="userFavoriteWorldsStatusForFavTab(group.visibility)"
                            effect="plain"
                            >{{ group.visibility.charAt(0).toUpperCase() + group.visibility.slice(1) }}</el-tag
                        >
                        <span style="color: #909399; font-size: 12px; margin-left: 10px"
                            >{{ group.count }}/{{ group.capacity }}</span
                        >
                        <el-dropdown trigger="click" size="mini" style="margin-left: 10px" @click.native.stop>
                            <el-tooltip
                                placement="top"
                                :content="$t('view.favorite.visibility_tooltip')"
                                :disabled="hideTooltips">
                                <el-button type="default" icon="el-icon-view" size="mini" circle />
                            </el-tooltip>
                            <el-dropdown-menu slot="dropdown">
                                <el-dropdown-item
                                    v-for="visibility in worldGroupVisibilityOptions"
                                    v-if="group.visibility !== visibility"
                                    :key="visibility"
                                    style="display: block; margin: 10px 0"
                                    @click.native="changeWorldGroupVisibility(group.name, visibility)"
                                    >{{ visibility.charAt(0).toUpperCase() + visibility.slice(1) }}</el-dropdown-item
                                >
                            </el-dropdown-menu>
                            <el-tooltip
                                placement="top"
                                :content="$t('view.favorite.rename_tooltip')"
                                :disabled="hideTooltips">
                                <el-button
                                    size="mini"
                                    icon="el-icon-edit"
                                    circle
                                    style="margin-left: 5px"
                                    @click.stop="changeFavoriteGroupName(group)" />
                            </el-tooltip>
                            <el-tooltip
                                placement="right"
                                :content="$t('view.favorite.clear_tooltip')"
                                :disabled="hideTooltips">
                                <el-button
                                    size="mini"
                                    icon="el-icon-delete"
                                    circle
                                    style="margin-left: 5px"
                                    @click.stop="clearFavoriteGroup(group)" />
                            </el-tooltip>
                        </el-dropdown>
                    </div>
                </template>
                <div v-if="group.count" class="x-friend-list" style="margin-top: 10px">
                    <favorites-world-item
                        v-for="favorite in groupedByGroupKeyFavoriteWorlds[group.key]"
                        :key="favorite.id"
                        :group="group"
                        :favorite="favorite"
                        :edit-favorites-mode="editFavoritesMode"
                        :hide-tooltips="hideTooltips"
                        :shift-held="shiftHeld"
                        @click="showWorldDialog(favorite.id)"
                        @handle-select="favorite.$selected = $event"
                        @new-instance-self-invite="newInstanceSelfInvite" />
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
        <span style="display: block; margin-top: 20px">{{ $t('view.favorite.worlds.local_favorites') }}</span>
        <br />
        <el-button size="small" @click="promptNewLocalWorldFavoriteGroup">{{
            $t('view.favorite.worlds.new_group')
        }}</el-button>
        <el-button
            v-if="!refreshingLocalFavorites"
            size="small"
            style="margin-left: 5px"
            @click="$emit('refresh-local-world-favorite')"
            >{{ $t('view.favorite.worlds.refresh') }}</el-button
        >
        <el-button v-else size="small" style="margin-left: 5px" @click="refreshingLocalFavorites = false">
            <i class="el-icon-loading" style="margin-right: 5px" />
            <span>{{ $t('view.favorite.worlds.cancel_refresh') }}</span>
        </el-button>
        <el-collapse style="border: 0">
            <el-collapse-item v-for="group in localWorldFavoriteGroups" v-if="localWorldFavorites[group]" :key="group">
                <template slot="title">
                    <span style="font-weight: bold; font-size: 14px; margin-left: 10px" v-text="group" />
                    <span style="color: #909399; font-size: 12px; margin-left: 10px">{{
                        getLocalWorldFavoriteGroupLength(group)
                    }}</span>
                    <el-tooltip placement="top" :content="$t('view.favorite.rename_tooltip')" :disabled="hideTooltips">
                        <el-button
                            size="mini"
                            icon="el-icon-edit"
                            circle
                            style="margin-left: 10px"
                            @click.stop="promptLocalWorldFavoriteGroupRename(group)" />
                    </el-tooltip>
                    <el-tooltip
                        placement="right"
                        :content="$t('view.favorite.delete_tooltip')"
                        :disabled="hideTooltips">
                        <el-button
                            size="mini"
                            icon="el-icon-delete"
                            circle
                            style="margin-left: 5px"
                            @click.stop="promptLocalWorldFavoriteGroupDelete(group)" />
                    </el-tooltip>
                </template>
                <div v-if="localWorldFavorites[group].length" class="x-friend-list" style="margin-top: 10px">
                    <favorites-world-item
                        v-for="favorite in localWorldFavorites[group]"
                        :key="favorite.id"
                        is-local-favorite
                        :group="group"
                        :favorite="favorite"
                        :edit-favorites-mode="editFavoritesMode"
                        :hide-tooltips="hideTooltips"
                        :shift-held="shiftHeld"
                        @click="showWorldDialog(favorite.id)"
                        @new-instance-self-invite="newInstanceSelfInvite"
                        @remove-local-world-favorite="removeLocalWorldFavorite" />
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
        <world-export-dialog
            :favorite-worlds="favoriteWorlds"
            :world-export-dialog-visible.sync="worldExportDialogVisible"
            :local-world-favorites="localWorldFavorites"
            :local-world-favorite-groups="localWorldFavoriteGroups"
            :local-world-favorites-list="localWorldFavoritesList" />
    </div>
</template>

<script>
    import FavoritesWorldItem from './FavoritesWorldItem.vue';
    import WorldExportDialog from '../../views/dialogs/favorites/WorldExportDialog.vue';
    import { favoriteRequest } from '../../classes/request';

    export default {
        name: 'FavoritesWorldTab',
        components: {
            FavoritesWorldItem,
            WorldExportDialog
        },
        inject: ['API', 'showWorldDialog'],
        props: {
            sortFavorites: Boolean,
            hideTooltips: Boolean,
            favoriteWorlds: Array,
            editFavoritesMode: Boolean,
            shiftHeld: Boolean,
            refreshingLocalFavorites: Boolean,
            localWorldFavoriteGroups: Array,
            localWorldFavorites: Object,
            localWorldFavoritesList: Array
        },
        data() {
            return {
                worldGroupVisibilityOptions: ['private', 'friends', 'public'],
                worldFavoriteSearch: '',
                worldExportDialogVisible: false,
                worldFavoriteSearchResults: []
            };
        },
        computed: {
            groupedByGroupKeyFavoriteWorlds() {
                const groupedByGroupKeyFavoriteWorlds = {};

                this.favoriteWorlds.forEach((world) => {
                    if (world.groupKey) {
                        if (!groupedByGroupKeyFavoriteWorlds[world.groupKey]) {
                            groupedByGroupKeyFavoriteWorlds[world.groupKey] = [];
                        }
                        groupedByGroupKeyFavoriteWorlds[world.groupKey].push(world);
                    }
                });

                return groupedByGroupKeyFavoriteWorlds;
            },
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
            showExportDialog() {
                this.worldExportDialogVisible = true;
            },

            userFavoriteWorldsStatusForFavTab(visibility) {
                let style = '';
                if (visibility === 'public') {
                    style = '';
                } else if (visibility === 'friends') {
                    style = 'success';
                } else {
                    style = 'info';
                }
                return style;
            },
            changeWorldGroupVisibility(name, visibility) {
                const params = {
                    type: 'world',
                    group: name,
                    visibility
                };
                favoriteRequest.saveFavoriteGroup(params).then((args) => {
                    this.$message({
                        message: 'Group visibility changed',
                        type: 'success'
                    });
                    return args;
                });
            },
            promptNewLocalWorldFavoriteGroup() {
                this.$prompt(
                    $t('prompt.new_local_favorite_group.description'),
                    $t('prompt.new_local_favorite_group.header'),
                    {
                        distinguishCancelAndClose: true,
                        confirmButtonText: $t('prompt.new_local_favorite_group.ok'),
                        cancelButtonText: $t('prompt.new_local_favorite_group.cancel'),
                        inputPattern: /\S+/,
                        inputErrorMessage: $t('prompt.new_local_favorite_group.input_error'),
                        callback: (action, instance) => {
                            if (action === 'confirm' && instance.inputValue) {
                                this.$emit('new-local-world-favorite-group', instance.inputValue);
                            }
                        }
                    }
                );
            },
            promptLocalWorldFavoriteGroupRename(group) {
                this.$prompt(
                    $t('prompt.local_favorite_group_rename.description'),
                    $t('prompt.local_favorite_group_rename.header'),
                    {
                        distinguishCancelAndClose: true,
                        confirmButtonText: $t('prompt.local_favorite_group_rename.save'),
                        cancelButtonText: $t('prompt.local_favorite_group_rename.cancel'),
                        inputPattern: /\S+/,
                        inputErrorMessage: $t('prompt.local_favorite_group_rename.input_error'),
                        inputValue: group,
                        callback: (action, instance) => {
                            if (action === 'confirm' && instance.inputValue) {
                                this.$emit('rename-local-world-favorite-group', instance.inputValue, group);
                            }
                        }
                    }
                );
            },
            promptLocalWorldFavoriteGroupDelete(group) {
                this.$confirm(`Delete Group? ${group}`, 'Confirm', {
                    confirmButtonText: 'Confirm',
                    cancelButtonText: 'Cancel',
                    type: 'info',
                    callback: (action) => {
                        if (action === 'confirm') {
                            this.deleteLocalWorldFavoriteGroup(group);
                        }
                    }
                });
            },
            getLocalWorldFavoriteGroupLength(group) {
                const favoriteGroup = this.localWorldFavorites[group];
                if (!favoriteGroup) {
                    return 0;
                }
                return favoriteGroup.length;
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
            searchWorldFavorites(worldFavoriteSearch) {
                let ref = null;
                const search = worldFavoriteSearch.toLowerCase();
                if (search.length < 3) {
                    this.worldFavoriteSearchResults = [];
                    return;
                }

                const results = [];
                for (let i = 0; i < this.localWorldFavoriteGroups.length; ++i) {
                    const group = this.localWorldFavoriteGroups[i];
                    if (!this.localWorldFavorites[group]) {
                        continue;
                    }
                    for (let j = 0; j < this.localWorldFavorites[group].length; ++j) {
                        ref = this.localWorldFavorites[group][j];
                        if (!ref || !ref.id) {
                            continue;
                        }
                        if (ref.name.toLowerCase().includes(search) || ref.authorName.toLowerCase().includes(search)) {
                            if (!results.some((r) => r.id === ref.id)) {
                                results.push(ref);
                            }
                        }
                    }
                }

                for (let i = 0; i < this.favoriteWorlds.length; ++i) {
                    ref = this.favoriteWorlds[i].ref;
                    if (!ref) {
                        continue;
                    }
                    if (ref.name.toLowerCase().includes(search) || ref.authorName.toLowerCase().includes(search)) {
                        if (!results.some((r) => r.id === ref.id)) {
                            results.push(ref);
                        }
                    }
                }

                this.worldFavoriteSearchResults = results;
            },
            changeFavoriteGroupName(group) {
                this.$emit('change-favorite-group-name', group);
            },
            newInstanceSelfInvite(event) {
                this.$emit('new-instance-self-invite', event);
            },

            removeLocalWorldFavorite(param1, param2) {
                this.$emit('remove-local-world-favorite', param1, param2);
            }
        }
    };
</script>

<style scoped></style>
