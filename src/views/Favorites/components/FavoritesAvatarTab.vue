<template>
    <div>
        <div style="display: flex; align-items: center; justify-content: space-between">
            <div>
                <el-button size="small" @click="showAvatarExportDialog">
                    {{ $t('view.favorite.export') }}
                </el-button>
                <el-button size="small" style="margin-left: 5px" @click="showAvatarImportDialog">
                    {{ $t('view.favorite.import') }}
                </el-button>
            </div>
            <div style="display: flex; align-items: center; font-size: 13px; margin-right: 10px">
                <span class="name" style="margin-right: 5px; line-height: 10px">
                    {{ $t('view.favorite.sort_by') }}
                </span>
                <el-radio-group v-model="sortFav" style="margin-right: 12px" @change="saveSortFavoritesOption">
                    <el-radio :label="false">
                        {{ $t('view.settings.appearance.appearance.sort_favorite_by_name') }}
                    </el-radio>
                    <el-radio :label="true">
                        {{ $t('view.settings.appearance.appearance.sort_favorite_by_date') }}
                    </el-radio>
                </el-radio-group>
                <el-input
                    v-model="avatarFavoriteSearch"
                    clearable
                    size="mini"
                    :placeholder="$t('view.favorite.avatars.search')"
                    style="width: 200px"
                    @input="searchAvatarFavorites" />
            </div>
        </div>
        <div class="x-friend-list" style="margin-top: 10px">
            <div
                v-for="favorite in avatarFavoriteSearchResults"
                :key="favorite.id"
                style="display: inline-block; width: 300px; margin-right: 15px"
                @click="showAvatarDialog(favorite.id)">
                <div class="x-friend-item">
                    <template v-if="favorite.name">
                        <div class="avatar">
                            <img v-lazy="favorite.thumbnailImageUrl" />
                        </div>
                        <div class="detail">
                            <span class="name" v-text="favorite.name" />
                            <span class="extra" v-text="favorite.authorName" />
                        </div>
                    </template>
                    <template v-else>
                        <div class="avatar"></div>
                        <div class="detail">
                            <span class="name" v-text="favorite.id" />
                        </div>
                    </template>
                </div>
            </div>
        </div>
        <span style="display: block; margin-top: 20px">
            {{ $t('view.favorite.avatars.vrchat_favorites') }}
        </span>
        <el-collapse style="border: 0">
            <el-collapse-item v-for="group in API.favoriteAvatarGroups" :key="group.name">
                <template slot="title">
                    <span style="font-weight: bold; font-size: 14px; margin-left: 10px" v-text="group.displayName" />
                    <span style="color: #909399; font-size: 12px; margin-left: 10px">
                        {{ group.count }}/{{ group.capacity }}
                    </span>
                    <el-tooltip placement="top" :content="$t('view.favorite.rename_tooltip')" :disabled="hideTooltips">
                        <el-button
                            size="mini"
                            icon="el-icon-edit"
                            circle
                            style="margin-left: 10px"
                            @click.stop="changeFavoriteGroupName(group)" />
                    </el-tooltip>
                    <el-tooltip placement="right" :content="$t('view.favorite.clear_tooltip')" :disabled="hideTooltips">
                        <el-button
                            size="mini"
                            icon="el-icon-delete"
                            circle
                            style="margin-left: 5px"
                            @click.stop="clearFavoriteGroup(group)" />
                    </el-tooltip>
                </template>
                <div v-if="group.count" class="x-friend-list" style="margin-top: 10px">
                    <FavoritesAvatarItem
                        v-for="favorite in groupedByGroupKeyFavoriteAvatars[group.key]"
                        :key="favorite.id"
                        :favorite="favorite"
                        :group="group"
                        :hide-tooltips="hideTooltips"
                        :shift-held="shiftHeld"
                        :edit-favorites-mode="editFavoritesMode"
                        style="display: inline-block; width: 300px; margin-right: 15px"
                        @handle-select="favorite.$selected = $event"
                        @remove-local-avatar-favorite="removeLocalAvatarFavorite"
                        @select-avatar-with-confirmation="selectAvatarWithConfirmation"
                        @click="showAvatarDialog(favorite.id)" />
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
            <el-collapse-item>
                <template slot="title">
                    <span style="font-weight: bold; font-size: 14px; margin-left: 10px">Local History</span>
                    <span style="color: #909399; font-size: 12px; margin-left: 10px"
                        >{{ avatarHistoryArray.length }}/100</span
                    >
                    <el-tooltip placement="right" content="Clear" :disabled="hideTooltips">
                        <el-button
                            size="mini"
                            icon="el-icon-delete"
                            circle
                            style="margin-left: 5px"
                            @click.stop="promptClearAvatarHistory"></el-button>
                    </el-tooltip>
                </template>
                <div v-if="avatarHistoryArray.length" class="x-friend-list" style="margin-top: 10px">
                    <FavoritesAvatarLocalHistoryItem
                        v-for="favorite in avatarHistoryArray"
                        :key="favorite.id"
                        style="display: inline-block; width: 300px; margin-right: 15px"
                        :favorite="favorite"
                        :hide-tooltips="hideTooltips"
                        @select-avatar-with-confirmation="selectAvatarWithConfirmation"
                        @click="showAvatarDialog(favorite.id)" />
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
            <span style="display: block; margin-top: 20px">{{ $t('view.favorite.avatars.local_favorites') }}</span>
            <br />
            <el-button size="small" :disabled="!isLocalUserVrcplusSupporter" @click="promptNewLocalAvatarFavoriteGroup">
                {{ $t('view.favorite.avatars.new_group') }}
            </el-button>
            <el-button
                v-if="!refreshingLocalFavorites"
                size="small"
                style="margin-left: 5px"
                @click="refreshLocalAvatarFavorites">
                {{ $t('view.favorite.avatars.refresh') }}
            </el-button>
            <el-button v-else size="small" style="margin-left: 5px" @click="refreshingLocalFavorites = false">
                <i class="el-icon-loading" style="margin-right: 5px"></i>
                <span>{{ $t('view.favorite.avatars.cancel_refresh') }}</span>
            </el-button>
            <el-collapse-item
                v-for="group in localAvatarFavoriteGroups"
                v-if="localAvatarFavorites[group]"
                :key="group">
                <template slot="title">
                    <span :style="{ fontWeight: 'bold', fontSize: '14px', marginLeft: '10px' }">{{ group }}</span>
                    <span :style="{ color: '#909399', fontSize: '12px', marginLeft: '10px' }">{{
                        getLocalAvatarFavoriteGroupLength(group)
                    }}</span>
                    <el-tooltip placement="top" :content="$t('view.favorite.rename_tooltip')" :disabled="hideTooltips">
                        <el-button
                            size="mini"
                            icon="el-icon-edit"
                            circle
                            :style="{ marginLeft: '5px' }"
                            @click.stop="promptLocalAvatarFavoriteGroupRename(group)"></el-button>
                    </el-tooltip>
                    <el-tooltip
                        placement="right"
                        :content="$t('view.favorite.delete_tooltip')"
                        :disabled="hideTooltips">
                        <el-button
                            size="mini"
                            icon="el-icon-delete"
                            circle
                            :style="{ marginLeft: '5px' }"
                            @click.stop="promptLocalAvatarFavoriteGroupDelete(group)"></el-button>
                    </el-tooltip>
                </template>
                <div v-if="localAvatarFavorites[group].length" class="x-friend-list" :style="{ marginTop: '10px' }">
                    <FavoritesAvatarItem
                        v-for="favorite in localAvatarFavorites[group]"
                        :key="favorite.id"
                        is-local-favorite
                        :style="{ display: 'inline-block', width: '300px', marginRight: '15px' }"
                        :favorite="favorite"
                        :group="group"
                        :hide-tooltips="hideTooltips"
                        :shift-held="shiftHeld"
                        :edit-favorites-mode="editFavoritesMode"
                        @handle-select="favorite.$selected = $event"
                        @remove-local-avatar-favorite="removeLocalAvatarFavorite"
                        @select-avatar-with-confirmation="selectAvatarWithConfirmation"
                        @click="showAvatarDialog(favorite.id)" />
                </div>
                <div
                    v-else
                    :style="{
                        paddingTop: '25px',
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'rgb(144, 147, 153)'
                    }">
                    <span>No Data</span>
                </div>
            </el-collapse-item>
        </el-collapse>
        <AvatarExportDialog
            :avatar-export-dialog-visible.sync="avatarExportDialogVisible"
            :favorite-avatars="favoriteAvatars"
            :local-avatar-favorite-groups="localAvatarFavoriteGroups"
            :local-avatar-favorites="localAvatarFavorites"
            :local-avatar-favorites-list="localAvatarFavoritesList" />
    </div>
</template>

<script>
    import FavoritesAvatarItem from './FavoritesAvatarItem.vue';
    import FavoritesAvatarLocalHistoryItem from './FavoritesAvatarLocalHistoryItem.vue';
    import AvatarExportDialog from '../dialogs/AvatarExportDialog.vue';
    import { favoriteRequest } from '../../../api';

    export default {
        name: 'FavoritesAvatarTab',
        components: { FavoritesAvatarItem, FavoritesAvatarLocalHistoryItem, AvatarExportDialog },
        inject: ['API', 'showAvatarDialog'],
        props: {
            sortFavorites: Boolean,
            hideTooltips: Boolean,
            shiftHeld: Boolean,
            editFavoritesMode: Boolean,
            avatarHistoryArray: Array,
            refreshingLocalFavorites: Boolean,
            localAvatarFavoriteGroups: Array,
            localAvatarFavorites: Object,
            favoriteAvatars: Array,
            localAvatarFavoritesList: Array
        },
        data() {
            return {
                avatarExportDialogVisible: false,
                avatarFavoriteSearch: '',
                avatarFavoriteSearchResults: []
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
            },
            groupedByGroupKeyFavoriteAvatars() {
                const groupedByGroupKeyFavoriteAvatars = {};
                this.favoriteAvatars.forEach((avatar) => {
                    if (avatar.groupKey) {
                        if (!groupedByGroupKeyFavoriteAvatars[avatar.groupKey]) {
                            groupedByGroupKeyFavoriteAvatars[avatar.groupKey] = [];
                        }
                        groupedByGroupKeyFavoriteAvatars[avatar.groupKey].push(avatar);
                    }
                });

                return groupedByGroupKeyFavoriteAvatars;
            },
            isLocalUserVrcplusSupporter() {
                return this.API.currentUser.$isVRCPlus;
            }
        },
        methods: {
            getLocalAvatarFavoriteGroupLength(group) {
                const favoriteGroup = this.localAvatarFavorites[group];
                if (!favoriteGroup) {
                    return 0;
                }
                return favoriteGroup.length;
            },
            searchAvatarFavorites() {
                let ref = null;
                const search = this.avatarFavoriteSearch.toLowerCase();
                if (search.length < 3) {
                    this.avatarFavoriteSearchResults = [];
                    return;
                }

                const results = [];
                for (let i = 0; i < this.localAvatarFavoriteGroups.length; ++i) {
                    const group = this.localAvatarFavoriteGroups[i];
                    if (!this.localAvatarFavorites[group]) {
                        continue;
                    }
                    for (let j = 0; j < this.localAvatarFavorites[group].length; ++j) {
                        ref = this.localAvatarFavorites[group][j];
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

                for (let i = 0; i < this.favoriteAvatars.length; ++i) {
                    ref = this.favoriteAvatars[i].ref;
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

                this.avatarFavoriteSearchResults = results;
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
            showAvatarExportDialog() {
                this.avatarExportDialogVisible = true;
            },
            showAvatarImportDialog() {
                this.$emit('show-avatar-import-dialog');
            },
            saveSortFavoritesOption() {
                this.$emit('save-sort-favorites-option');
            },
            changeFavoriteGroupName(group) {
                this.$emit('change-favorite-group-name', group);
            },
            removeLocalAvatarFavorite(id, group) {
                this.$emit('remove-local-avatar-favorite', id, group);
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
            refreshLocalAvatarFavorites() {
                this.$emit('refresh-local-avatar-favorites');
            },
            promptLocalAvatarFavoriteGroupRename(group) {
                this.$emit('prompt-local-avatar-favorite-group-rename', group);
            },
            promptLocalAvatarFavoriteGroupDelete(group) {
                this.$emit('prompt-local-avatar-favorite-group-delete', group);
            }
        }
    };
</script>
