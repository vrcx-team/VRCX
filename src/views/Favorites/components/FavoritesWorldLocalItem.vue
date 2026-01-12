<template>
    <div :class="cardClasses" @click="$emit('click')">
        <template v-if="favorite.name">
            <div class="favorites-search-card__content">
                <div class="favorites-search-card__avatar" :class="{ 'is-empty': !favorite.thumbnailImageUrl }" v-once>
                    <img
                        v-if="favorite.thumbnailImageUrl"
                        :src="smallThumbnail"
                        loading="lazy"
                        decoding="async"
                        fetchpriority="low" />
                </div>
                <div class="favorites-search-card__detail" v-once>
                    <div class="favorites-search-card__title">
                        <span class="name">{{ props.favorite.name }}</span>
                    </div>
                    <span class="extra">
                        {{ props.favorite.authorName }}
                        <template v-if="props.favorite.occupants"> ({{ props.favorite.occupants }}) </template>
                    </span>
                </div>
            </div>
            <div class="favorites-search-card__actions">
                <template v-if="editMode">
                    <div class="favorites-search-card__action-group">
                        <div class="favorites-search-card__action favorites-search-card__action--full" @click.stop>
                            <FavoritesMoveDropdown
                                :favoriteGroup="favoriteWorldGroups"
                                :currentFavorite="props.favorite"
                                class="favorites-search-card__dropdown"
                                isLocalFavorite
                                type="world" />
                        </div>
                        <div class="favorites-search-card__action">
                            <el-button
                                size="small"
                                circle
                                class="favorites-search-card__action-btn"
                                :type="deleteButtonType"
                                @click.stop="handlePrimaryDeleteAction">
                                <i class="ri-delete-bin-line"></i>
                            </el-button>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div class="favorites-search-card__action-group">
                        <div class="favorites-search-card__action">
                            <TooltipWrapper side="top" :content="inviteOrLaunchText">
                                <Button
                                    size="icon-sm"
                                    variant="outline"
                                    class="favorites-search-card__action-btn rounded-full text-xs h-6 w-6"
                                    @click.stop="newInstanceSelfInvite(favorite.id)"
                                    ><i class="ri-mail-line"></i
                                ></Button>
                            </TooltipWrapper>
                        </div>
                        <div class="favorites-search-card__action">
                            <TooltipWrapper
                                v-if="showDangerUnfavorite"
                                side="top"
                                :content="t('view.favorite.unfavorite_tooltip')">
                                <Button
                                    size="icon-sm"
                                    variant="destructive"
                                    class="favorites-search-card__action-btn rounded-full text-xs h-6 w-6"
                                    @click.stop="handleDeleteFavorite"
                                    ><i class="ri-delete-bin-line"></i
                                ></Button>
                            </TooltipWrapper>
                            <TooltipWrapper v-else side="top" :content="t('view.favorite.edit_favorite_tooltip')">
                                <Button
                                    size="icon-sm"
                                    variant="outline"
                                    class="favorites-search-card__action-btn rounded-full text-xs h-6 w-6"
                                    @click.stop="showFavoriteDialog('world', favorite.id)"
                                    ><i class="ri-star-line"></i
                                ></Button>
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
                    <span class="name">{{ favorite.name || favorite.id }}</span>
                </div>
            </div>
            <div class="favorites-search-card__actions">
                <div class="favorites-search-card__action">
                    <Button
                        class="rounded-full text-xs h-6 w-6"
                        size="icon-sm"
                        variant="outline"
                        @click.stop="handleDeleteFavorite">
                        <i class="ri-delete-bin-line"></i>
                    </Button>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
    import { Button } from '@/components/ui/button';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useFavoriteStore, useInviteStore, useUiStore } from '../../../stores';

    import FavoritesMoveDropdown from './FavoritesMoveDropdown.vue';

    const props = defineProps({
        group: [Object, String],
        favorite: Object,
        editMode: { type: Boolean, default: false }
    });

    const emit = defineEmits(['remove-local-world-favorite', 'click']);
    const { favoriteWorldGroups } = storeToRefs(useFavoriteStore());
    const { showFavoriteDialog } = useFavoriteStore();
    const { newInstanceSelfInvite } = useInviteStore();
    const { shiftHeld } = storeToRefs(useUiStore());
    const { t } = useI18n();
    const { canOpenInstanceInGame } = useInviteStore();

    const cardClasses = computed(() => [
        'favorites-search-card',
        'favorites-search-card--world',
        {
            'is-edit-mode': props.editMode
        }
    ]);

    const smallThumbnail = computed(() => {
        const url = props.favorite.thumbnailImageUrl?.replace('256', '128');
        return url || props.favorite.thumbnailImageUrl;
    });

    const deleteButtonType = computed(() => (shiftHeld.value ? 'danger' : 'default'));

    const inviteOrLaunchText = computed(() => {
        return canOpenInstanceInGame
            ? t('dialog.world.actions.new_instance_and_open_ingame')
            : t('dialog.world.actions.new_instance_and_self_invite');
    });

    const showDangerUnfavorite = computed(() => {
        return shiftHeld.value;
    });

    function handlePrimaryDeleteAction() {
        if (shiftHeld.value) {
            emit('remove-local-world-favorite', props.favorite.id, props.group);
            return;
        }
        showFavoriteDialog('world', props.favorite.id);
    }

    function handleDeleteFavorite() {
        emit('remove-local-world-favorite', props.favorite.id, props.group);
    }
</script>

<style scoped></style>
