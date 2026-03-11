<template>
    <ContextMenu>
        <ContextMenuTrigger as-child>
            <Item
                variant="outline"
                class="favorites-item cursor-pointer hover:bg-muted x-hover-list"
                :style="itemStyle"
                @click="handleViewDetails">
                <ItemMedia variant="image">
                    <Avatar class="rounded-sm size-full">
                        <AvatarImage
                            v-if="smallThumbnail"
                            :src="smallThumbnail"
                            loading="lazy"
                            decoding="async"
                            fetchpriority="low"
                            class="rounded-sm object-cover" />
                        <AvatarFallback class="rounded-sm">{{ avatarFallback }}</AvatarFallback>
                    </Avatar>
                </ItemMedia>
                <ItemContent class="min-w-0">
                    <ItemTitle class="truncate max-w-full">{{ favorite.name }}</ItemTitle>
                    <ItemDescription class="truncate line-clamp-1 text-xs">
                        {{ favorite.authorName }}
                    </ItemDescription>
                </ItemContent>
                <ItemActions>
                    <DropdownMenu>
                        <DropdownMenuTrigger as-child>
                            <Button size="icon-sm" variant="ghost" class="rounded-full" @click.stop>
                                <MoreHorizontal class="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem @click="handleViewDetails">
                                {{ t('common.actions.view_details') }}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                :disabled="currentUser.currentAvatar === favorite.id"
                                @click="selectAvatarWithConfirmation(favorite.id)">
                                {{ t('view.favorite.select_avatar_tooltip') }}
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem @click="showFavoriteDialog('avatar', favorite.id)">
                                {{ t('view.favorite.edit_favorite_tooltip') }}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </ItemActions>
            </Item>
        </ContextMenuTrigger>
        <ContextMenuContent>
            <ContextMenuItem @click="handleViewDetails">{{ t('common.actions.view_details') }}</ContextMenuItem>
            <ContextMenuItem
                :disabled="currentUser.currentAvatar === favorite.id"
                @click="selectAvatarWithConfirmation(favorite.id)">
                {{ t('view.favorite.select_avatar_tooltip') }}
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem @click="showFavoriteDialog('avatar', favorite.id)">
                {{ t('view.favorite.edit_favorite_tooltip') }}
            </ContextMenuItem>
        </ContextMenuContent>
    </ContextMenu>
</template>

<script setup>
    import { MoreHorizontal } from 'lucide-vue-next';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Button } from '@/components/ui/button';
    import {
        ContextMenu,
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSeparator,
        ContextMenuTrigger
    } from '@/components/ui/context-menu';
    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useFavoriteStore, useUserStore } from '../../../stores';
    import { selectAvatarWithConfirmation, showAvatarDialog } from '../../../coordinators/avatarCoordinator';

    const { t } = useI18n();

    const { showFavoriteDialog } = useFavoriteStore();
    const { currentUser } = storeToRefs(useUserStore());

    const props = defineProps({
        favorite: {
            type: Object,
            required: true
        }
    });

    const avatarFallback = computed(() => props.favorite.name?.charAt(0)?.toUpperCase() || '?');

    const itemStyle = computed(() => ({
        padding: 'var(--favorites-card-padding-y, 8px) var(--favorites-card-padding-x, 10px)',
        gap: 'var(--favorites-card-content-gap, 10px)',
        minWidth: 'var(--favorites-card-min-width, 220px)',
        maxWidth: 'var(--favorites-card-target-width, 220px)',
        width: '100%',
        fontSize: 'calc(0.875rem * var(--favorites-card-scale, 1))'
    }));

    const smallThumbnail = computed(() => {
        if (!props.favorite.thumbnailImageUrl) {
            return '';
        }
        return props.favorite.thumbnailImageUrl.replace('256', '128');
    });

    function handleViewDetails() {
        showAvatarDialog(props.favorite.id);
    }
</script>

<style scoped>
    .favorites-item :deep(img) {
        filter: saturate(0.8) contrast(0.8);
        transition: filter 0.2s ease;
    }

    .favorites-item:hover :deep(img) {
        filter: saturate(1) contrast(1);
    }
</style>
