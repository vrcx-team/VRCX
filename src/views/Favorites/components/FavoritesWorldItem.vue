<template>
    <ContextMenu>
        <ContextMenuTrigger as-child>
            <div :class="cardClasses" @click="$emit('click')">
                <template v-if="localFavRef?.name">
                    <div class="favorites-search-card__content">
                        <div
                            class="favorites-search-card__avatar"
                            :class="{ 'is-empty': !localFavRef.thumbnailImageUrl }"
                            v-once>
                            <img
                                v-if="localFavRef.thumbnailImageUrl"
                                :src="smallThumbnail"
                                loading="lazy"
                                decoding="async"
                                fetchpriority="low" />
                        </div>
                        <div class="favorites-search-card__detail">
                            <div class="flex items-center gap-2">
                                <span class="name text-sm">{{ localFavRef.name }}</span>
                                <span
                                    v-if="
                                        !isLocalFavorite &&
                                        (favorite.deleted || localFavRef.releaseStatus === 'private')
                                    "
                                    class="inline-flex items-center gap-1 text-sm">
                                    <AlertTriangle
                                        v-if="favorite.deleted"
                                        :title="t('view.favorite.unavailable_tooltip')"
                                        class="h-4 w-4" />
                                    <Lock
                                        v-if="localFavRef.releaseStatus === 'private'"
                                        :title="t('view.favorite.private')"
                                        class="h-4 w-4" />
                                </span>
                            </div>
                            <span class="text-xs text-muted-foreground">
                                {{ localFavRef.authorName }}
                                <template v-if="localFavRef.occupants"> ({{ localFavRef.occupants }}) </template>
                            </span>
                        </div>
                    </div>
                    <div class="favorites-search-card__actions">
                        <template v-if="editMode">
                            <div
                                v-if="!isLocalFavorite"
                                class="flex justify-end w-full favorites-search-card__action--checkbox"
                                @click.stop>
                                <Checkbox v-model="isSelected" />
                            </div>
                            <div class="flex gap-[var(--favorites-card-action-group-gap,8px)] w-full">
                                <div class="flex justify-end w-full flex-1" @click.stop>
                                    <FavoritesMoveDropdown
                                        :favoriteGroup="favoriteWorldGroups"
                                        :currentFavorite="props.favorite"
                                        :currentGroup="group"
                                        class="w-full"
                                        :is-local-favorite="isLocalFavorite"
                                        type="world" />
                                </div>
                                <div class="flex justify-end w-full">
                                    <Button
                                        size="icon-sm"
                                        :variant="
                                            isLocalFavorite && shiftHeld
                                                ? 'destructive'
                                                : isLocalFavorite
                                                  ? 'outline'
                                                  : 'ghost'
                                        "
                                        class="rounded-full text-xs h-6 w-6"
                                        @click.stop="handlePrimaryDeleteAction">
                                        <Trash2 class="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </template>
                        <template v-else>
                            <div class="flex gap-[var(--favorites-card-action-group-gap,8px)] w-full">
                                <div class="flex justify-end w-full">
                                    <TooltipWrapper side="top" :content="inviteOrLaunchText">
                                        <Button
                                            size="icon-sm"
                                            variant="ghost"
                                            class="rounded-full text-xs h-6 w-6"
                                            @click.stop="newInstanceSelfInvite(favorite.id)"
                                            ><Mail class="h-4 w-4"
                                        /></Button>
                                    </TooltipWrapper>
                                </div>
                                <div class="flex justify-end w-full">
                                    <TooltipWrapper
                                        v-if="showDangerUnfavorite"
                                        side="top"
                                        :content="t('view.favorite.unfavorite_tooltip')">
                                        <Button
                                            size="icon-sm"
                                            variant="destructive"
                                            class="rounded-full text-xs h-6 w-6"
                                            @click.stop="handleDeleteFavorite"
                                            ><Trash2 class="h-4 w-4"
                                        /></Button>
                                    </TooltipWrapper>
                                    <TooltipWrapper
                                        v-else
                                        side="top"
                                        :content="t('view.favorite.edit_favorite_tooltip')">
                                        <Button
                                            size="icon-sm"
                                            variant="ghost"
                                            class="rounded-full text-xs h-6 w-6"
                                            @click.stop="showFavoriteDialog('world', favorite.id)"
                                            ><Star class="h-4 w-4"
                                        /></Button>
                                    </TooltipWrapper>
                                </div>
                            </div>
                        </template>
                    </div>
                </template>
                <template v-else>
                    <div class="favorites-search-card__content">
                        <div class="favorites-search-card__avatar is-empty"></div>
                        <div class="favorites-search-card__detail" v-once>
                            <span>{{ favorite.name || favorite.id }}</span>
                            <AlertTriangle
                                v-if="!isLocalFavorite && favorite.deleted"
                                :title="t('view.favorite.unavailable_tooltip')"
                                class="h-4 w-4" />
                        </div>
                    </div>
                    <div class="favorites-search-card__actions">
                        <div class="flex justify-end w-full">
                            <Button
                                class="rounded-full text-xs h-6 w-6"
                                size="icon-sm"
                                :variant="isLocalFavorite ? 'outline' : 'ghost'"
                                @click.stop="handleDeleteFavorite">
                                <Trash2 class="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </template>
            </div>
        </ContextMenuTrigger>
        <ContextMenuContent>
            <ContextMenuItem @click="handleNewInstance">
                <Plus class="size-4" />
                {{ t('dialog.world.actions.new_instance') }}
            </ContextMenuItem>
            <ContextMenuItem @click="newInstanceSelfInvite(favorite.id)">
                <Mail class="size-4" />
                {{ inviteOrLaunchText }}
            </ContextMenuItem>
        </ContextMenuContent>
    </ContextMenu>
</template>

<script setup>
    import { AlertTriangle, Lock, Mail, Plus, Star, Trash2 } from 'lucide-vue-next';
    import { ContextMenu, ContextMenuContent, ContextMenuItem, ContextMenuTrigger } from '@/components/ui/context-menu';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useFavoriteStore, useInstanceStore, useInviteStore, useUiStore } from '../../../stores';
    import { runNewInstanceSelfInviteFlow as newInstanceSelfInvite } from '../../../coordinators/inviteCoordinator';
    import { favoriteRequest } from '../../../api';

    import FavoritesMoveDropdown from './FavoritesMoveDropdown.vue';

    const props = defineProps({
        group: [Object, String],
        favorite: Object,
        isLocalFavorite: { type: Boolean, default: false },
        editMode: { type: Boolean, default: false },
        selected: { type: Boolean, default: false }
    });

    const emit = defineEmits(['toggle-select', 'remove-local-world-favorite', 'click']);
    const { favoriteWorldGroups } = storeToRefs(useFavoriteStore());
    const { showFavoriteDialog } = useFavoriteStore();

    const { t } = useI18n();
    const { canOpenInstanceInGame } = useInviteStore();
    const { shiftHeld } = storeToRefs(useUiStore());

    const isSelected = computed({
        get: () => props.selected,
        set: (value) => emit('toggle-select', value)
    });

    const localFavRef = computed(() => (props.isLocalFavorite ? props.favorite : props.favorite?.ref));

    const showDangerUnfavorite = computed(() => {
        return shiftHeld.value;
    });

    const cardClasses = computed(() => [
        'favorites-search-card',
        'favorites-search-card--world',
        {
            'is-selected': props.selected,
            'is-edit-mode': props.editMode
        }
    ]);

    const smallThumbnail = computed(() => {
        const url = localFavRef.value?.thumbnailImageUrl?.replace('256', '128');
        return url || localFavRef.value?.thumbnailImageUrl;
    });

    const inviteOrLaunchText = computed(() => {
        return canOpenInstanceInGame
            ? t('dialog.world.actions.new_instance_and_open_ingame')
            : t('dialog.world.actions.new_instance_and_self_invite');
    });

    /**
     * @returns {void}
     */
    function handlePrimaryDeleteAction() {
        if (props.isLocalFavorite) {
            if (shiftHeld.value) {
                emit('remove-local-world-favorite', props.favorite.id, props.group);
                return;
            }
            showFavoriteDialog('world', props.favorite.id);
            return;
        }
        deleteFavorite(props.favorite.id);
    }

    /**
     *
     */
    function handleDeleteFavorite() {
        if (props.isLocalFavorite) {
            emit('remove-local-world-favorite', props.favorite.id, props.group);
        } else {
            deleteFavorite(props.favorite.id);
        }
    }

    /**
     *
     * @param objectId
     */
    function deleteFavorite(objectId) {
        favoriteRequest.deleteFavorite({ objectId });
    }

    const { createNewInstance } = useInstanceStore();

    /**
     *
     */
    function handleNewInstance() {
        createNewInstance(props.favorite.id);
    }
</script>

<style>
    @import './favorites-card.css';
</style>
