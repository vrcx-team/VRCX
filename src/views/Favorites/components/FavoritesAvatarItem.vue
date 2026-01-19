<template>
    <div :class="cardClasses" @click="$emit('click')">
        <template v-if="localFavFakeRef">
            <div class="favorites-search-card__content">
                <div class="favorites-search-card__avatar" :class="{ 'is-empty': !localFavFakeRef.thumbnailImageUrl }">
                    <img v-if="localFavFakeRef.thumbnailImageUrl" :src="smallThumbnail" loading="lazy" />
                </div>
                <div class="favorites-search-card__detail">
                    <div class="favorites-search-card__title">
                        <span class="name text-sm">{{ localFavFakeRef.name }}</span>
                        <span class="favorites-search-card__badges">
                            <TooltipWrapper
                                v-if="favorite.deleted"
                                side="top"
                                :content="t('view.favorite.unavailable_tooltip')">
                                <AlertTriangle class="h-4 w-4" />
                            </TooltipWrapper>
                            <TooltipWrapper
                                v-if="!isLocalFavorite && favorite.ref?.releaseStatus === 'private'"
                                side="top"
                                :content="t('view.favorite.private')">
                                <Lock class="h-4 w-4" />
                            </TooltipWrapper>
                        </span>
                    </div>
                    <span class="text-xs text-muted-foreground">{{ localFavFakeRef.authorName }}</span>
                </div>
            </div>
            <div class="favorites-search-card__actions">
                <template v-if="editMode">
                    <div
                        v-if="!isLocalFavorite"
                        class="favorites-search-card__action favorites-search-card__action--checkbox"
                        @click.stop>
                        <Checkbox v-model="isSelected" />
                    </div>
                    <div class="favorites-search-card__action-group">
                        <div class="favorites-search-card__action favorites-search-card__action--full" @click.stop>
                            <FavoritesMoveDropdown
                                :favoriteGroup="favoriteAvatarGroups"
                                :currentFavorite="props.favorite"
                                :currentGroup="group"
                                class="favorites-search-card__dropdown"
                                :is-local-favorite="isLocalFavorite"
                                type="avatar" />
                        </div>
                        <div class="favorites-search-card__action">
                            <TooltipWrapper
                                side="left"
                                :content="
                                    isLocalFavorite
                                        ? t('view.favorite.delete_tooltip')
                                        : t('view.favorite.unfavorite_tooltip')
                                ">
                                <Button
                                    size="icon-sm"
                                    variant="outline"
                                    class="rounded-full text-xs h-6 w-6"
                                    @click.stop="handlePrimaryDeleteAction">
                                    <Trash2 class="h-4 w-4" />
                                </Button>
                            </TooltipWrapper>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div class="favorites-search-card__action-group">
                        <div class="favorites-search-card__action" v-if="canSelectAvatar">
                            <TooltipWrapper side="top" :content="t('view.favorite.select_avatar_tooltip')">
                                <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    :disabled="currentUser.currentAvatar === favorite.id"
                                    class="rounded-full text-xs h-6 w-6"
                                    @click.stop="selectAvatarWithConfirmation(favorite.id)"
                                    ><Check class="h-4 w-4"
                                /></Button>
                            </TooltipWrapper>
                        </div>
                        <div class="favorites-search-card__action">
                            <TooltipWrapper
                                v-if="showDangerUnfavorite"
                                side="bottom"
                                :content="t('view.favorite.unfavorite_tooltip')">
                                <Button
                                    size="icon-sm"
                                    variant="destructive"
                                    class="rounded-full text-xs h-6 w-6"
                                    @click.stop="handlePrimaryDeleteAction"
                                    ><Trash2 class="h-4 w-4"
                                /></Button>
                            </TooltipWrapper>
                            <TooltipWrapper v-else side="bottom" :content="t('view.favorite.edit_favorite_tooltip')">
                                <Button
                                    size="icon-sm"
                                    variant="ghost"
                                    class="rounded-full text-xs h-6 w-6"
                                    @click.stop="showFavoriteDialog('avatar', favorite.id)"
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
                <div class="favorites-search-card__detail">
                    <span>{{ favorite.name || favorite.id }}</span>
                </div>
            </div>
            <div class="favorites-search-card__actions">
                <div class="favorites-search-card__action">
                    <Button
                        class="rounded-full text-xs h-6 w-6"
                        size="icon-sm"
                        variant="ghost"
                        @click.stop="handlePrimaryDeleteAction">
                        <Trash2 class="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
    import { AlertTriangle, Check, Lock, Star, Trash2 } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { Checkbox } from '@/components/ui/checkbox';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAvatarStore, useFavoriteStore, useUiStore, useUserStore } from '../../../stores';
    import { favoriteRequest } from '../../../api';

    import FavoritesMoveDropdown from './FavoritesMoveDropdown.vue';

    const props = defineProps({
        favorite: Object,
        group: [Object, String],
        isLocalFavorite: Boolean,
        editMode: { type: Boolean, default: false },
        selected: { type: Boolean, default: false }
    });
    const emit = defineEmits(['click', 'toggle-select']);

    const { t } = useI18n();

    const { favoriteAvatarGroups } = storeToRefs(useFavoriteStore());
    const { removeLocalAvatarFavorite, showFavoriteDialog } = useFavoriteStore();
    const { selectAvatarWithConfirmation } = useAvatarStore();
    const { shiftHeld } = storeToRefs(useUiStore());
    const { currentUser } = storeToRefs(useUserStore());

    const isSelected = computed({
        get: () => props.selected,
        set: (value) => emit('toggle-select', value)
    });
    const localFavFakeRef = computed(() => (props.isLocalFavorite ? props.favorite : props.favorite?.ref));

    const cardClasses = computed(() => [
        'favorites-search-card',
        'favorites-search-card--avatar',
        {
            'is-selected': props.selected,
            'is-edit-mode': props.editMode
        }
    ]);

    const smallThumbnail = computed(() => {
        if (!localFavFakeRef.value?.thumbnailImageUrl) {
            return '';
        }
        return localFavFakeRef.value.thumbnailImageUrl.replace('256', '128');
    });

    const favoriteGroupName = computed(() => {
        if (typeof props.group === 'string') {
            return props.group;
        }
        return props.group?.name;
    });

    const canSelectAvatar = computed(() => {
        if (props.isLocalFavorite) {
            return true;
        }
        if (props.favorite?.deleted) {
            return false;
        }
        return props.favorite?.ref?.releaseStatus !== 'private';
    });

    const showDangerUnfavorite = computed(() => {
        return shiftHeld.value;
    });

    function handlePrimaryDeleteAction() {
        if (props.isLocalFavorite) {
            removeLocalAvatarFavorite(props.favorite.id, favoriteGroupName.value);
            return;
        }
        deleteFavorite(props.favorite.id);
    }

    function deleteFavorite(objectId) {
        favoriteRequest.deleteFavorite({ objectId });
    }
</script>
