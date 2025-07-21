<template>
    <div @click="$emit('click')">
        <div class="x-friend-item">
            <div class="avatar">
                <img v-lazy="smallThumbnail" />
            </div>
            <div class="detail">
                <span class="name" v-text="favorite.name"></span>
                <span class="extra" v-text="favorite.authorName"></span>
            </div>
            <el-tooltip placement="left" :content="t('view.favorite.select_avatar_tooltip')" :disabled="hideTooltips">
                <el-button
                    :disabled="currentUser.currentAvatar === favorite.id"
                    size="mini"
                    icon="el-icon-check"
                    circle
                    style="margin-left: 5px"
                    @click.stop="selectAvatarWithConfirmation(favorite.id)"></el-button>
            </el-tooltip>
            <template v-if="cachedFavoritesByObjectId.has(favorite.id)">
                <el-tooltip placement="right" content="Unfavorite" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        icon="el-icon-star-on"
                        size="mini"
                        circle
                        style="margin-left: 5px"
                        @click.stop="showFavoriteDialog('avatar', favorite.id)"></el-button>
                </el-tooltip>
            </template>
            <template v-else>
                <el-tooltip placement="right" content="Favorite" :disabled="hideTooltips">
                    <el-button
                        type="default"
                        icon="el-icon-star-off"
                        size="mini"
                        circle
                        style="margin-left: 5px"
                        @click.stop="showFavoriteDialog('avatar', favorite.id)"></el-button>
                </el-tooltip>
            </template>
        </div>
    </div>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { useAppearanceSettingsStore, useAvatarStore, useFavoriteStore, useUserStore } from '../../../stores';

    const { t } = useI18n();

    const { hideTooltips } = storeToRefs(useAppearanceSettingsStore());
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

    const smallThumbnail = computed(() => {
        return props.favorite.thumbnailImageUrl.replace('256', '128') || props.favorite.thumbnailImageUrl;
    });
</script>
