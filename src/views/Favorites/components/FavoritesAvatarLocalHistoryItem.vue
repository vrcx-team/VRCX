<template>
    <div @click="$emit('click')">
        <div class="x-friend-item">
            <div class="avatar">
                <img :src="smallThumbnail" loading="lazy" />
            </div>
            <div class="detail">
                <span class="name" v-text="favorite.name"></span>
                <span class="extra" v-text="favorite.authorName"></span>
            </div>
            <el-tooltip placement="left" :content="t('view.favorite.select_avatar_tooltip')">
                <el-button
                    :disabled="currentUser.currentAvatar === favorite.id"
                    size="small"
                    :icon="Check"
                    circle
                    style="margin-left: 5px"
                    @click.stop="selectAvatarWithConfirmation(favorite.id)"></el-button>
            </el-tooltip>
            <template v-if="cachedFavoritesByObjectId.has(favorite.id)">
                <el-tooltip placement="right" content="Favorite">
                    <el-button
                        type="default"
                        :icon="Star"
                        size="small"
                        circle
                        style="margin-left: 5px"
                        @click.stop="showFavoriteDialog('avatar', favorite.id)"></el-button>
                </el-tooltip>
            </template>
            <template v-else>
                <el-tooltip placement="right" content="Favorite">
                    <el-button
                        type="default"
                        :icon="StarFilled"
                        size="small"
                        circle
                        style="margin-left: 5px"
                        @click.stop="showFavoriteDialog('avatar', favorite.id)"></el-button>
                </el-tooltip>
            </template>
        </div>
    </div>
</template>

<script setup>
    import { Check, Star, StarFilled } from '@element-plus/icons-vue';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAvatarStore, useFavoriteStore, useUserStore } from '../../../stores';

    const { t } = useI18n();

    const { cachedFavoritesByObjectId } = storeToRefs(useFavoriteStore());
    const { showFavoriteDialog } = useFavoriteStore();
    const { selectAvatarWithConfirmation } = useAvatarStore();
    const { currentUser } = storeToRefs(useUserStore());

    const props = defineProps({
        favorite: {
            type: Object,
            required: true
        }
    });

    defineEmits(['click']);

    const smallThumbnail = computed(() => {
        return props.favorite.thumbnailImageUrl?.replace('256', '128') || props.favorite.thumbnailImageUrl;
    });
</script>
