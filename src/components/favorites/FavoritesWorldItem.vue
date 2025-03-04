<template>
    <div @click="$emit('click')" :style="{ display: 'inline-block', width: '300px', marginRight: '15px' }">
        <div class="x-friend-item">
            <template v-if="isLocalFavorite ? favorite.name : favorite.ref">
                <div class="avatar">
                    <img v-lazy="localFavFakeRef.thumbnailImageUrl" />
                </div>
                <div class="detail">
                    <span class="name">{{ localFavFakeRef.name }}</span>
                    <span v-if="localFavFakeRef.occupants" class="extra"
                        >{{ localFavFakeRef.authorName }} ({{ localFavFakeRef.occupants }})</span
                    >
                    <span v-else class="extra">{{ localFavFakeRef.authorName }}</span>
                </div>
                <template v-if="editFavoritesMode">
                    <el-dropdown trigger="click" size="mini" style="margin-left: 5px" @click.native.stop>
                        <el-tooltip
                            placement="left"
                            :content="$t(localFavFakeRef ? 'view.favorite.copy_tooltip' : 'view.favorite.move_tooltip')"
                            :disabled="hideTooltips">
                            <el-button type="default" icon="el-icon-back" size="mini" circle></el-button>
                        </el-tooltip>
                        <el-dropdown-menu slot="dropdown">
                            <template v-for="groupAPI in API.favoriteWorldGroups">
                                <el-dropdown-item
                                    v-if="isLocalFavorite || groupAPI.name !== group.name"
                                    :key="groupAPI.name"
                                    style="display: block; margin: 10px 0"
                                    :disabled="groupAPI.count >= groupAPI.capacity"
                                    @click.native="handleDropdownItemClick(groupAPI)">
                                    {{ groupAPI.displayName }} ({{ groupAPI.count }} / {{ groupAPI.capacity }})
                                </el-dropdown-item>
                            </template>
                        </el-dropdown-menu>

                        <el-button v-if="!isLocalFavorite" type="text" size="mini" @click.stop style="margin-left: 5px">
                            <el-checkbox v-model="isSelected"></el-checkbox>
                        </el-button>
                    </el-dropdown>
                </template>
                <template v-else>
                    <el-tooltip
                        v-if="!isLocalFavorite && favorite.deleted"
                        placement="left"
                        :content="$t('view.favorite.unavailable_tooltip')">
                        <i class="el-icon-warning" style="color: #f56c6c; margin-left: 5px"></i>
                    </el-tooltip>
                    <el-tooltip
                        v-if="!isLocalFavorite && favorite.ref.releaseStatus === 'private'"
                        placement="left"
                        :content="$t('view.favorite.private')">
                        <i class="el-icon-warning" style="color: #e6a23c; margin-left: 5px"></i>
                    </el-tooltip>
                    <el-tooltip
                        placement="left"
                        :content="$t('view.favorite.self_invite_tooltip')"
                        :disabled="hideTooltips">
                        <el-button
                            size="mini"
                            icon="el-icon-message"
                            style="margin-left: 5px"
                            @click.stop="$emit('new-instance-self-invite', favorite.id)"
                            circle></el-button>
                    </el-tooltip>
                    <el-tooltip
                        v-if="!isLocalFavorite"
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
                            icon="el-icon-star-on"
                            size="mini"
                            circle
                            style="margin-left: 5px"
                            type="default"
                            @click.stop="showFavoriteDialog(favorite.id)"></el-button>
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
                        @click.stop="$emit('remove-local-world-favorite', favorite.id, group)"></el-button>
                    <el-button
                        v-else
                        icon="el-icon-star-on"
                        size="mini"
                        circle
                        style="margin-left: 5px"
                        type="default"
                        @click.stop="showFavoriteDialog(favorite.id)"></el-button>
                </el-tooltip>
            </template>
            <template v-else>
                <div class="avatar"></div>
                <div class="detail">
                    <span>{{ favorite.name || favorite.id }}</span>
                    <el-tooltip
                        v-if="!isLocalFavorite && favorite.deleted"
                        placement="left"
                        :content="$t('view.favorite.unavailable_tooltip')">
                        <i class="el-icon-warning" style="color: #f56c6c; margin-left: 5px"></i>
                    </el-tooltip>
                    <el-button
                        type="text"
                        icon="el-icon-close"
                        size="mini"
                        style="margin-left: 5px"
                        @click.stop="handleDeleteFavorite"></el-button>
                </div>
            </template>
        </div>
    </div>
</template>

<script>
    export default {
        name: 'FavoritesWorldItem',
        inject: ['API'],
        props: {
            group: [Object, String],
            favorite: Object,
            editFavoritesMode: Boolean,
            hideTooltips: Boolean,
            shiftHeld: Boolean,
            isLocalFavorite: { type: Boolean, required: false }
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
            }
        },
        methods: {
            handleDropdownItemClick(groupAPI) {
                if (this.isLocalFavorite) {
                    this.addFavoriteWorld(this.localFavFakeRef, groupAPI, true);
                } else {
                    this.moveFavorite(this.localFavFakeRef, groupAPI, 'world');
                }
            },
            handleDeleteFavorite() {
                if (this.isLocalFavorite) {
                    this.$emit('remove-local-world-favorite', this.favorite.id, this.group);
                } else {
                    this.deleteFavorite(this.favorite.id);
                }
            },
            moveFavorite(ref, group, type) {
                this.API.deleteFavorite({
                    objectId: ref.id
                }).then(() => {
                    this.API.addFavorite({
                        type,
                        favoriteId: ref.id,
                        tags: group.name
                    });
                });
            },
            deleteFavorite(objectId) {
                this.API.deleteFavorite({
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
            addFavoriteWorld(ref, group, message) {
                // wait API splitting PR Merged
                return this.API.addFavorite({
                    type: 'world',
                    favoriteId: ref.id,
                    tags: group.name
                }).then((args) => {
                    if (message) {
                        this.$message({
                            message: 'World added to favorites',
                            type: 'success'
                        });
                    }
                    return args;
                });
            },
            showFavoriteDialog(favoriteId) {
                this.$emit('show-favorite-dialog', 'world', favoriteId);
            }
        }
    };
</script>
