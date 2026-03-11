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
                    <ItemTitle class="truncate max-w-full">
                        {{ displayName }}
                        <AlertTriangle
                            v-if="showUnavailable"
                            :title="t('view.favorite.unavailable_tooltip')"
                            class="h-4 w-4" />
                        <Lock v-if="isPrivateWorld" :title="t('view.favorite.private')" class="h-4 w-4" />
                    </ItemTitle>
                    <ItemDescription class="truncate line-clamp-1 text-xs">
                        {{ authorText }}
                    </ItemDescription>
                </ItemContent>
                <ItemActions v-if="editMode && !isLocalFavorite" @click.stop>
                    <Checkbox v-model="isSelected" />
                </ItemActions>
                <DropdownMenu v-else-if="!editMode">
                    <DropdownMenuTrigger as-child>
                        <Button size="icon-sm" variant="ghost" class="rounded-full" @click.stop>
                            <MoreHorizontal class="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem @click="handleViewDetails">
                            {{ t('common.actions.view_details') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="handleNewInstance">
                            {{ t('dialog.world.actions.new_instance') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="handleSelfInvite">
                            {{ inviteOrLaunchText }}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="showFavoriteDialog('world', favorite.id)">
                            {{ t('view.favorite.edit_favorite_tooltip') }}
                        </DropdownMenuItem>
                        <DropdownMenuItem variant="destructive" @click="handleDeleteFavorite">
                            {{ deleteMenuLabel }}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </Item>
        </ContextMenuTrigger>
        <ContextMenuContent>
            <ContextMenuItem @click="handleViewDetails">{{ t('common.actions.view_details') }}</ContextMenuItem>
            <ContextMenuItem @click="handleNewInstance">{{ t('dialog.world.actions.new_instance') }}</ContextMenuItem>
            <ContextMenuItem @click="handleSelfInvite">{{ inviteOrLaunchText }}</ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem @click="showFavoriteDialog('world', favorite.id)">
                {{ t('view.favorite.edit_favorite_tooltip') }}
            </ContextMenuItem>
            <ContextMenuItem variant="destructive" @click="handleDeleteFavorite">
                {{ deleteMenuLabel }}
            </ContextMenuItem>
        </ContextMenuContent>
    </ContextMenu>
</template>

<script setup>
    import { AlertTriangle, Lock, MoreHorizontal } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
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
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Item, ItemActions, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@/components/ui/item';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { favoriteRequest } from '../../../api';
    import { removeLocalWorldFavorite } from '../../../coordinators/favoriteCoordinator';
    import { runNewInstanceSelfInviteFlow as newInstanceSelfInvite } from '../../../coordinators/inviteCoordinator';
    import { showWorldDialog } from '../../../coordinators/worldCoordinator';
    import { useFavoriteStore, useInstanceStore, useInviteStore } from '../../../stores';

    const props = defineProps({
        group: [Object, String],
        favorite: Object,
        isLocalFavorite: { type: Boolean, default: false },
        editMode: { type: Boolean, default: false },
        selected: { type: Boolean, default: false }
    });

    const emit = defineEmits(['toggle-select']);
    const { showFavoriteDialog } = useFavoriteStore();

    const { t } = useI18n();
    const { canOpenInstanceInGame } = useInviteStore();
    const { createNewInstance } = useInstanceStore();

    const isSelected = computed({
        get: () => props.selected,
        set: (value) => emit('toggle-select', value)
    });

    const localFavRef = computed(() => (props.isLocalFavorite ? props.favorite : props.favorite?.ref));

    const displayName = computed(() => localFavRef.value?.name || props.favorite?.name || props.favorite?.id);

    const avatarFallback = computed(() => displayName.value?.charAt(0)?.toUpperCase() || '?');

    const showUnavailable = computed(() => !props.isLocalFavorite && props.favorite?.deleted);

    const isPrivateWorld = computed(() => localFavRef.value?.releaseStatus === 'private');

    const authorText = computed(() => {
        const author = localFavRef.value?.authorName || '';
        const occupants = localFavRef.value?.occupants;
        return occupants ? `${author} (${occupants})` : author;
    });

    const smallThumbnail = computed(() => {
        const url = localFavRef.value?.thumbnailImageUrl?.replace('256', '128');
        return url || localFavRef.value?.thumbnailImageUrl;
    });

    const inviteOrLaunchText = computed(() => {
        return canOpenInstanceInGame
            ? t('dialog.world.actions.new_instance_and_open_ingame')
            : t('dialog.world.actions.new_instance_and_self_invite');
    });

    const deleteMenuLabel = computed(() =>
        props.isLocalFavorite ? t('view.favorite.delete_tooltip') : t('view.favorite.unfavorite_tooltip')
    );

    const itemStyle = computed(() => ({
        padding: 'var(--favorites-card-padding-y, 8px) var(--favorites-card-padding-x, 10px)',
        gap: 'var(--favorites-card-content-gap, 10px)',
        minWidth: 'var(--favorites-card-min-width, 220px)',
        maxWidth: 'var(--favorites-card-target-width, 220px)',
        width: '100%',
        fontSize: 'calc(0.875rem * var(--favorites-card-scale, 1))'
    }));

    function handleViewDetails() {
        showWorldDialog(props.favorite.id);
    }

    function handleNewInstance() {
        createNewInstance(props.favorite.id);
    }

    function handleSelfInvite() {
        newInstanceSelfInvite(props.favorite.id);
    }

    function handleDeleteFavorite() {
        if (props.isLocalFavorite) {
            removeLocalWorldFavorite(props.favorite.id, props.group);
            return;
        }
        favoriteRequest.deleteFavorite({ objectId: props.favorite.id });
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
