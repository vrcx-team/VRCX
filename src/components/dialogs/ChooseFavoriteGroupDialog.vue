<template>
    <safe-dialog ref="favoriteDialog" :visible.sync="isVisible" :title="$t('dialog.favorite.header')" width="300px">
        <div v-loading="loading">
            <span style="display: block; text-align: center">{{ $t('dialog.favorite.vrchat_favorites') }}</span>
            <template v-if="favoriteDialog.currentGroup && favoriteDialog.currentGroup.key">
                <el-button
                    style="display: block; width: 100%; margin: 10px 0"
                    @click="deleteFavoriteNoConfirm(favoriteDialog.objectId)">
                    <i class="el-icon-check"></i>
                    {{ favoriteDialog.currentGroup.displayName }} ({{ favoriteDialog.currentGroup.count }} /
                    {{ favoriteDialog.currentGroup.capacity }})
                </el-button>
            </template>
            <template v-else>
                <el-button
                    v-for="group in groups"
                    :key="group.key"
                    style="display: block; width: 100%; margin: 10px 0"
                    @click="addFavorite(group)">
                    {{ group.displayName }} ({{ group.count }} / {{ group.capacity }})
                </el-button>
            </template>
        </div>
        <div v-if="favoriteDialog.type === 'world'" style="margin-top: 20px">
            <span style="display: block; text-align: center">{{ $t('dialog.favorite.local_favorites') }}</span>
            <template v-for="group in localWorldFavoriteGroups">
                <el-button
                    v-if="hasLocalWorldFavorite(favoriteDialog.objectId, group)"
                    :key="group"
                    style="display: block; width: 100%; margin: 10px 0"
                    @click="removeLocalWorldFavorite(favoriteDialog.objectId, group)">
                    <i class="el-icon-check"></i>
                    {{ group }} ({{ getLocalWorldFavoriteGroupLength(group) }})
                </el-button>
                <el-button
                    v-else
                    :key="group"
                    style="display: block; width: 100%; margin: 10px 0"
                    @click="addLocalWorldFavorite(favoriteDialog.objectId, group)">
                    {{ group }} ({{ getLocalWorldFavoriteGroupLength(group) }})
                </el-button>
            </template>
        </div>
        <div v-if="favoriteDialog.type === 'avatar'" style="margin-top: 20px">
            <span style="display: block; text-align: center">{{ $t('dialog.favorite.local_avatar_favorites') }}</span>
            <template v-for="group in localAvatarFavoriteGroups">
                <el-button
                    v-if="hasLocalAvatarFavorite(favoriteDialog.objectId, group)"
                    :key="group"
                    style="display: block; width: 100%; margin: 10px 0"
                    @click="removeLocalAvatarFavorite(favoriteDialog.objectId, group)">
                    <i class="el-icon-check"></i>
                    {{ group }} ({{ getLocalAvatarFavoriteGroupLength(group) }})
                </el-button>
                <el-button
                    v-else
                    :key="group"
                    style="display: block; width: 100%; margin: 10px 0"
                    :disabled="!isLocalUserVrcplusSupporter"
                    @click="addLocalAvatarFavorite(favoriteDialog.objectId, group)">
                    {{ group }} ({{ getLocalAvatarFavoriteGroupLength(group) }})
                </el-button>
            </template>
        </div>
    </safe-dialog>
</template>

<script>
    import { favoriteRequest } from '../../api';
    import Noty from 'noty';

    export default {
        name: 'ChooseFavoriteGroupDialog',
        inject: ['API', 'adjustDialogZ'],
        props: {
            favoriteDialog: {
                type: Object,
                default: () => ({
                    visible: false,
                    type: '',
                    objectId: '',
                    currentGroup: {}
                })
            },
            localWorldFavoriteGroups: {
                type: Array,
                default: () => []
            },
            localAvatarFavoriteGroups: {
                type: Array,
                default: () => []
            },
            hasLocalWorldFavorite: {
                type: Function,
                default: () => () => false
            },
            getLocalWorldFavoriteGroupLength: {
                type: Function,
                default: () => () => 0
            },
            hasLocalAvatarFavorite: {
                type: Function,
                default: () => () => false
            },
            getLocalAvatarFavoriteGroupLength: {
                type: Function,
                default: () => () => 0
            }
        },
        data() {
            return {
                groups: [],
                loading: false
            };
        },
        computed: {
            isVisible: {
                get() {
                    return this.favoriteDialog.visible;
                },
                set(value) {
                    this.$emit('update:favorite-dialog', { ...this.favoriteDialog, visible: value });
                }
            },
            isLocalUserVrcplusSupporter() {
                return this.API.currentUser.$isVRCPlus;
            }
        },
        watch: {
            'favoriteDialog.visible'(value) {
                if (value) {
                    this.initFavoriteDialog();
                    this.$nextTick(() => {
                        this.adjustDialogZ(this.$refs.favoriteDialog.$el);
                    });
                }
            }
        },
        methods: {
            initFavoriteDialog() {
                if (this.favoriteDialog.type === 'friend') {
                    this.groups = this.API.favoriteFriendGroups;
                } else if (this.favoriteDialog.type === 'world') {
                    this.groups = this.API.favoriteWorldGroups;
                } else if (this.favoriteDialog.type === 'avatar') {
                    this.groups = this.API.favoriteAvatarGroups;
                }
            },
            addFavorite(group) {
                const D = this.favoriteDialog;
                this.loading = true;
                favoriteRequest
                    .addFavorite({
                        type: D.type,
                        favoriteId: D.objectId,
                        tags: group.name
                    })
                    .then(() => {
                        this.isVisible = false;
                        new Noty({
                            type: 'success',
                            text: 'Favorite added'
                        }).show();
                    })
                    .finally(() => {
                        this.loading = false;
                    });
            },
            addLocalWorldFavorite(...args) {
                this.$emit('add-local-world-favorite', ...args);
            },
            removeLocalWorldFavorite(...args) {
                this.$emit('remove-local-world-favorite', ...args);
            },
            addLocalAvatarFavorite(...args) {
                this.$emit('add-local-avatar-favorite', ...args);
            },
            removeLocalAvatarFavorite(...args) {
                this.$emit('remove-local-avatar-favorite', ...args);
            },
            deleteFavoriteNoConfirm(...args) {
                this.$emit('deleteFavoriteNoConfirm', ...args);
            }
        }
    };
</script>
