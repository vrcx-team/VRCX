<template>
    <ContextMenu>
        <ContextMenuTrigger as-child>
            <div :class="cardClasses" @click="$emit('click')">
                <div class="favorites-search-card__content">
                    <div class="favorites-search-card__avatar" :class="{ 'is-empty': !favorite.thumbnailImageUrl }">
                        <img v-if="favorite.thumbnailImageUrl" :src="smallThumbnail" loading="lazy" />
                    </div>
                    <div class="favorites-search-card__detail">
                        <div class="flex items-center gap-2">
                            <span class="name text-sm">{{ favorite.name }}</span>
                        </div>
                        <span class="text-xs">{{ favorite.authorName }}</span>
                    </div>
                </div>
                <div class="favorites-search-card__actions">
                    <div class="flex gap-(--favorites-card-action-group-gap,8px) w-full">
                        <div class="flex justify-end w-full">
                            <TooltipWrapper side="top" :content="t('view.favorite.select_avatar_tooltip')">
                                <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    :disabled="currentUser.currentAvatar === favorite.id"
                                    class="rounded-full text-xs h-6 w-6"
                                    @click.stop="selectAvatarWithConfirmation(favorite.id)">
                                    <Check class="h-4 w-4" />
                                    ></Button
                                >
                            </TooltipWrapper>
                        </div>
                        <div class="flex justify-end w-full">
                            <TooltipWrapper side="bottom" :content="t('view.favorite.edit_favorite_tooltip')">
                                <Button
                                    v-if="favoriteExists"
                                    size="icon-sm"
                                    variant="ghost"
                                    class="rounded-full text-xs h-6 w-6"
                                    @click.stop="showFavoriteDialog('avatar', favorite.id)">
                                    <Star class="h-4 w-4" />
                                </Button>
                                <Button
                                    v-else
                                    size="icon-sm"
                                    variant="ghost"
                                    class="rounded-full text-xs h-6 w-6"
                                    @click.stop="showFavoriteDialog('avatar', favorite.id)">
                                    <Star class="h-4 w-4" />
                                </Button>
                            </TooltipWrapper>
                        </div>
                    </div>
                </div>
            </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
            <ContextMenuItem
                :disabled="currentUser.currentAvatar === favorite.id"
                @click="selectAvatarWithConfirmation(favorite.id)">
                {{ t('view.favorite.select_avatar_tooltip') }}
            </ContextMenuItem>
        </ContextMenuContent>
    </ContextMenu>
</template>

<script setup>
    import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
    import { Check, Star } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAvatarStore, useFavoriteStore, useUserStore } from '../../../stores';

    const { t } = useI18n();

    const { showFavoriteDialog, getCachedFavoritesByObjectId } = useFavoriteStore();
    import { selectAvatarWithConfirmation } from '../../../coordinators/avatarCoordinator';
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

<style>
    @import './favorites-card.css';
</style>
