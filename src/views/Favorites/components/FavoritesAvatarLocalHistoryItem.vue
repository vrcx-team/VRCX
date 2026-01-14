<template>
    <div :class="cardClasses" @click="$emit('click')">
        <div class="favorites-search-card__content">
            <div class="favorites-search-card__avatar" :class="{ 'is-empty': !favorite.thumbnailImageUrl }">
                <img v-if="favorite.thumbnailImageUrl" :src="smallThumbnail" loading="lazy" />
            </div>
            <div class="favorites-search-card__detail">
                <div class="favorites-search-card__title">
                    <span class="name">{{ favorite.name }}</span>
                </div>
                <span class="extra">{{ favorite.authorName }}</span>
            </div>
        </div>
        <div class="favorites-search-card__actions">
            <div class="favorites-search-card__action-group">
                <div class="favorites-search-card__action">
                    <TooltipWrapper side="top" :content="t('view.favorite.select_avatar_tooltip')">
                        <Button
                            size="icon-sm"
                            variant="outline"
                            :disabled="currentUser.currentAvatar === favorite.id"
                            class="favorites-search-card__action-btn rounded-full text-xs h-6 w-6"
                            @click.stop="selectAvatarWithConfirmation(favorite.id)">
                            <i class="ri-check-line"></i
                        ></Button>
                    </TooltipWrapper>
                </div>
                <div class="favorites-search-card__action">
                    <TooltipWrapper side="bottom" :content="t('view.favorite.edit_favorite_tooltip')">
                        <Button
                            v-if="favoriteExists"
                            size="icon-sm"
                            variant="outline"
                            class="favorites-search-card__action-btn rounded-full text-xs h-6 w-6"
                            @click.stop="showFavoriteDialog('avatar', favorite.id)">
                            <i class="ri-star-line"></i>
                        </Button>
                        <Button
                            v-else
                            size="icon-sm"
                            class="favorites-search-card__action-btn rounded-full text-xs h-6 w-6"
                            @click.stop="showFavoriteDialog('avatar', favorite.id)">
                            <i class="ri-star-line"></i>
                        </Button>
                    </TooltipWrapper>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { Check, Star } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAvatarStore, useFavoriteStore, useUserStore } from '../../../stores';

    const { t } = useI18n();

    const { showFavoriteDialog, getCachedFavoritesByObjectId } = useFavoriteStore();
    const { selectAvatarWithConfirmation } = useAvatarStore();
    const { currentUser } = storeToRefs(useUserStore());

    const props = defineProps({
        favorite: {
            type: Object,
            required: true
        }
    });

    defineEmits(['click']);

    const favoriteExists = computed(() => Boolean(getCachedFavoritesByObjectId(props.favorite.id)));

    const cardClasses = computed(() => ['favorites-search-card', 'favorites-search-card--avatar']);

    const smallThumbnail = computed(() => {
        if (!props.favorite.thumbnailImageUrl) {
            return '';
        }
        return props.favorite.thumbnailImageUrl.replace('256', '128');
    });
</script>
