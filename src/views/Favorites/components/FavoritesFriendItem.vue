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
                    <Location
                        class="extra"
                        v-if="favorite.ref.location !== 'offline'"
                        :location="favorite.ref.location"
                        :traveling="favorite.ref.travelingToLocation"
                        :link="false" />
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
                            <template v-for="groupAPI in favoriteFriendGroups">
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

<script setup>
    import { storeToRefs } from 'pinia';
    import { favoriteRequest } from '../../../api';
    import { userImage, userStatusClass } from '../../../shared/utils';
    import { useAppearanceSettingsStore, useFavoriteStore, useUiStore } from '../../../stores';

    defineProps({
        favorite: { type: Object, required: true },
        group: { type: Object, required: true },
        editFavoritesMode: Boolean
    });

    defineEmits(['click']);

    const { hideTooltips } = storeToRefs(useAppearanceSettingsStore());
    const { favoriteFriendGroups } = storeToRefs(useFavoriteStore());
    const { showFavoriteDialog } = useFavoriteStore();
    const { shiftHeld } = storeToRefs(useUiStore());

    function moveFavorite(ref, group, type) {
        favoriteRequest.deleteFavorite({ objectId: ref.id }).then(() => {
            favoriteRequest.addFavorite({
                type,
                favoriteId: ref.id,
                tags: group.name
            });
        });
    }

    function deleteFavorite(objectId) {
        favoriteRequest.deleteFavorite({ objectId });
    }
</script>
