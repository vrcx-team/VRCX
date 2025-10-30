<template>
    <div @click="$emit('click')">
        <div class="x-friend-item">
            <template v-if="favorite.ref">
                <div class="avatar" :class="userStatusClass(favorite.ref)">
                    <img :src="userImage(favorite.ref, true)" loading="lazy" />
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
                <div v-if="editFavoritesMode">
                    <FavoritesMoveDropdown
                        :favoriteGroup="favoriteFriendGroups"
                        :currentGroup="group"
                        :currentFavorite="favorite"
                        type="friend" />
                    <el-button type="text" size="small" style="margin-left: 5px" @click.stop>
                        <el-checkbox v-model="favorite.$selected"></el-checkbox>
                    </el-button>
                </div>

                <template v-else>
                    <el-tooltip placement="right" :content="t('view.favorite.unfavorite_tooltip')" :teleported="false">
                        <el-button
                            type="default"
                            :icon="Star"
                            size="small"
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
                    :icon="Close"
                    size="small"
                    style="margin-left: 5px"
                    @click.stop="deleteFavorite(favorite.id)"></el-button>
            </template>
        </div>
    </div>
</template>

<script setup>
    import { Close, Star } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { userImage, userStatusClass } from '../../../shared/utils';
    import { favoriteRequest } from '../../../api';
    import { useFavoriteStore } from '../../../stores';

    import FavoritesMoveDropdown from './FavoritesMoveDropdown.vue';

    defineProps({
        favorite: { type: Object, required: true },
        group: { type: Object, required: true }
    });

    defineEmits(['click']);

    const { favoriteFriendGroups, editFavoritesMode } = storeToRefs(useFavoriteStore());
    const { showFavoriteDialog } = useFavoriteStore();
    const { t } = useI18n();

    function deleteFavorite(objectId) {
        favoriteRequest.deleteFavorite({ objectId });
    }
</script>
