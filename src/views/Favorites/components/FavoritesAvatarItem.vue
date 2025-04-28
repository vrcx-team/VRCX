<template>
    <div @click="$emit('click')">
        <div class="x-friend-item">
            <template v-if="isLocalFavorite ? favorite.name : favorite.ref">
                <div class="avatar">
                    <img v-lazy="smallThumbnail" />
                </div>
                <div class="detail">
                    <span class="name" v-text="localFavFakeRef.name"></span>
                    <span class="extra" v-text="localFavFakeRef.authorName"></span>
                </div>
                <template v-if="editFavoritesMode">
                    <el-dropdown trigger="click" size="mini" style="margin-left: 5px" @click.native.stop>
                        <el-tooltip placement="top" :content="tooltipContent" :disabled="hideTooltips">
                            <el-button type="default" icon="el-icon-back" size="mini" circle></el-button>
                        </el-tooltip>
                        <el-dropdown-menu slot="dropdown">
                            <template
                                v-for="groupAPI in API.favoriteAvatarGroups"
                                v-if="isLocalFavorite || groupAPI.name !== group.name">
                                <el-dropdown-item
                                    :key="groupAPI.name"
                                    style="display: block; margin: 10px 0"
                                    :disabled="groupAPI.count >= groupAPI.capacity"
                                    @click.native="handleDropdownItemClick(groupAPI)">
                                    {{ groupAPI.displayName }} ({{ groupAPI.count }} / {{ groupAPI.capacity }})
                                </el-dropdown-item>
                            </template>
                        </el-dropdown-menu>
                    </el-dropdown>
                    <el-button v-if="!isLocalFavorite" type="text" size="mini" style="margin-left: 5px" @click.stop>
                        <el-checkbox v-model="isSelected"></el-checkbox>
                    </el-button>
                </template>
                <template v-else-if="!isLocalFavorite">
                    <el-tooltip
                        v-if="favorite.deleted"
                        placement="left"
                        :content="$t('view.favorite.unavailable_tooltip')">
                        <i class="el-icon-warning" style="color: #f56c6c; margin-left: 5px"></i>
                    </el-tooltip>
                    <el-tooltip
                        v-if="favorite.ref.releaseStatus === 'private'"
                        placement="left"
                        :content="$t('view.favorite.private')">
                        <i class="el-icon-warning" style="color: #e6a23c; margin-left: 5px"></i>
                    </el-tooltip>
                    <el-tooltip
                        v-if="favorite.ref.releaseStatus !== 'private' && !favorite.deleted"
                        placement="left"
                        :content="$t('view.favorite.select_avatar_tooltip')"
                        :disabled="hideTooltips">
                        <el-button
                            :disabled="API.currentUser.currentAvatar === favorite.id"
                            size="mini"
                            icon="el-icon-check"
                            circle
                            style="margin-left: 5px"
                            @click.stop="selectAvatarWithConfirmation"></el-button>
                    </el-tooltip>
                    <el-tooltip
                        placement="right"
                        :content="$t('view.favorite.unfavorite_tooltip')"
                        :disabled="hideTooltips">
                        <el-button
                            v-if="shiftHeld"
                            size="mini"
                            icon="el-icon-close"
                            circle
                            style="color: #f56c6c; margin-left: 5px"
                            @click.stop="deleteFavorite(favorite.id)"></el-button>
                        <el-button
                            v-else
                            type="default"
                            icon="el-icon-star-on"
                            size="mini"
                            circle
                            style="margin-left: 5px"
                            @click.stop="showFavoriteDialog('avatar', favorite.id)"></el-button>
                    </el-tooltip>
                </template>
                <template v-else>
                    <el-tooltip
                        placement="left"
                        :content="$t('view.favorite.select_avatar_tooltip')"
                        :disabled="hideTooltips">
                        <el-button
                            :disabled="API.currentUser.currentAvatar === favorite.id"
                            size="mini"
                            circle
                            style="margin-left: 5px"
                            icon="el-icon-check"
                            @click.stop="selectAvatarWithConfirmation" />
                    </el-tooltip>
                </template>
                <el-tooltip
                    v-if="isLocalFavorite"
                    placement="right"
                    :content="$t('view.favorite.unfavorite_tooltip')"
                    :disabled="hideTooltips">
                    <el-button
                        v-if="shiftHeld"
                        size="mini"
                        icon="el-icon-close"
                        circle
                        style="color: #f56c6c; margin-left: 5px"
                        @click.stop="removeLocalAvatarFavorite" />
                    <el-button
                        v-else
                        type="default"
                        icon="el-icon-star-on"
                        size="mini"
                        circle
                        style="margin-left: 5px"
                        @click.stop="showFavoriteDialog('avatar', favorite.id)"
                /></el-tooltip>
            </template>
            <template v-else>
                <div class="avatar"></div>
                <div class="detail">
                    <span class="name" v-text="favorite.name || favorite.id"></span>
                </div>
                <el-button
                    v-if="isLocalFavorite"
                    type="text"
                    icon="el-icon-close"
                    size="mini"
                    style="margin-left: 5px"
                    @click.stop="removeLocalAvatarFavorite"></el-button>
                <el-button
                    v-else
                    type="text"
                    icon="el-icon-close"
                    size="mini"
                    style="margin-left: 5px"
                    @click.stop="deleteFavorite(favorite.id)"></el-button>
            </template>
        </div>
    </div>
</template>

<script>
    import { favoriteRequest } from '../../../api';

    export default {
        name: 'FavoritesAvatarItem',
        inject: ['API', 'showFavoriteDialog'],
        props: {
            favorite: Object,
            group: [Object, String],
            editFavoritesMode: Boolean,
            shiftHeld: Boolean,
            hideTooltips: Boolean,
            isLocalFavorite: Boolean
        },
        computed: {
            isSelected: {
                get() {
                    return this.favorite.$selected;
                },
                set(value) {
                    this.$emit('handle-select', value);
                }
            },
            localFavFakeRef() {
                // local favorite no "ref" property
                return this.isLocalFavorite ? this.favorite : this.favorite.ref;
            },
            tooltipContent() {
                return $t(this.isLocalFavorite ? 'view.favorite.copy_tooltip' : 'view.favorite.move_tooltip');
            },
            smallThumbnail() {
                return (
                    this.localFavFakeRef.thumbnailImageUrl.replace('256', '128') ||
                    this.localFavFakeRef.thumbnailImageUrl
                );
            }
        },
        methods: {
            moveFavorite(ref, group, type) {
                favoriteRequest
                    .deleteFavorite({
                        objectId: ref.id
                    })
                    .then(() => {
                        favoriteRequest.addFavorite({
                            type,
                            favoriteId: ref.id,
                            tags: group.name
                        });
                    });
            },
            selectAvatarWithConfirmation() {
                this.$emit('select-avatar-with-confirmation', this.favorite.id);
            },
            deleteFavorite(objectId) {
                favoriteRequest.deleteFavorite({
                    objectId
                });
                // FIXME: 메시지 수정
                // this.$confirm('Continue? Delete Favorite', 'Confirm', {
                //     confirmButtonText: 'Confirm',
                //     cancelButtonText: 'Cancel',
                //     type: 'info',
                //     callback: (action) => {
                //         if (action === 'confirm') {
                //             API.deleteFavorite({
                //                 objectId
                //             });
                //         }
                //     }
                // });
            },
            addFavoriteAvatar(groupAPI) {
                return favoriteRequest
                    .addFavorite({
                        type: 'avatar',
                        favoriteId: this.favorite.id,
                        tags: groupAPI.name
                    })
                    .then((args) => {
                        this.$message({
                            message: 'Avatar added to favorites',
                            type: 'success'
                        });

                        return args;
                    });
            },
            handleDropdownItemClick(groupAPI) {
                if (this.isLocalFavorite) {
                    this.addFavoriteAvatar(groupAPI);
                } else {
                    this.moveFavorite(this.favorite.ref, groupAPI, 'avatar');
                }
            },
            removeLocalAvatarFavorite() {
                this.$emit('remove-local-avatar-favorite', this.favorite.id, this.group);
            }
        }
    };
</script>
