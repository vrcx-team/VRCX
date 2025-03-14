<template>
    <div @click="$emit('click')">
        <div class="x-friend-item">
            <template v-if="favorite.ref">
                <div class="avatar" :class="userStatusClass(favorite.ref)">
                    <img v-lazy="userImage(favorite.ref, true)" />
                </div>
                <div class="detail">
                    <span
                        class="name"
                        :style="{ color: favorite.ref.$userColour }"
                        v-text="favorite.ref.displayName"></span>
                    <location
                        class="extra"
                        v-if="favorite.ref.location !== 'offline'"
                        :location="favorite.ref.location"
                        :traveling="favorite.ref.travelingToLocation"
                        :link="false"></location>
                    <span v-else v-text="favorite.ref.statusDescription"></span>
                </div>
                <template v-if="editFavoritesMode">
                    <el-dropdown trigger="click" size="mini" style="margin-left: 5px" @click.native.stop>
                        <el-tooltip
                            placement="left"
                            :content="$t('view.favorite.move_tooltip')"
                            :disabled="hideTooltips">
                            <el-button type="default" icon="el-icon-back" size="mini" circle></el-button>
                        </el-tooltip>
                        <el-dropdown-menu slot="dropdown">
                            <template v-for="groupAPI in API.favoriteFriendGroups">
                                <el-dropdown-item
                                    v-if="groupAPI.name !== group.name"
                                    :key="groupAPI.name"
                                    style="display: block; margin: 10px 0"
                                    :disabled="groupAPI.count >= groupAPI.capacity"
                                    @click.native="moveFavorite(favorite.ref, groupAPI, 'friend')">
                                    {{ groupAPI.displayName }} ({{ groupAPI.count }} / {{ groupAPI.capacity }})
                                </el-dropdown-item>
                            </template>
                        </el-dropdown-menu>
                    </el-dropdown>
                    <el-button type="text" size="mini" style="margin-left: 5px" @click.stop>
                        <el-checkbox v-model="favorite.$selected"></el-checkbox>
                    </el-button>
                </template>
                <template v-else>
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
                            @click.stop="showFavoriteDialog('friend', favorite.id)"></el-button>
                    </el-tooltip>
                </template>
            </template>
            <template v-else>
                <div class="avatar"></div>
                <div class="detail">
                    <span v-text="favorite.name || favorite.id"></span>
                </div>
                <el-button
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
    import Location from '../common/Location.vue';
    import { favoriteRequest } from '../../classes/request';
    export default {
        components: { Location },
        inject: ['showUserDialog', 'userImage', 'userStatusClass', 'API'],
        props: {
            favorite: {
                type: Object,
                required: true
            },
            hideTooltips: {
                type: Boolean,
                default: false
            },
            shiftHeld: {
                type: Boolean,
                default: false
            },
            group: {
                type: Object,
                required: true
            },
            editFavoritesMode: Boolean
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
            showFavoriteDialog(param1, param2) {
                this.$emit('show-favorite-dialog', param1, param2);
            }
        }
    };
</script>
