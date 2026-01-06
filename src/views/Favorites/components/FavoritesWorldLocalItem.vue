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
                                <el-button
                                    size="small"
                                    :icon="Message"
                                    class="favorites-search-card__action-btn"
                                    @click.stop="newInstanceSelfInvite(favorite.id)"
                                    circle />
                            </TooltipWrapper>
                        </div>
                        <div class="favorites-search-card__action">
                            <TooltipWrapper
                                v-if="showDangerUnfavorite"
                                side="top"
                                :content="t('view.favorite.unfavorite_tooltip')">
                                <el-button
                                    size="small"
                                    :icon="Close"
                                    circle
                                    class="favorites-search-card__action-btn"
                                    type="danger"
                                    @click.stop="handleDeleteFavorite" />
                            </TooltipWrapper>
                            <TooltipWrapper v-else side="top" :content="t('view.favorite.edit_favorite_tooltip')">
                                <el-button
                                    type="default"
                                    :icon="Star"
                                    size="small"
                                    circle
                                    class="favorites-search-card__action-btn"
                                    @click.stop="showFavoriteDialog('world', favorite.id)" />
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
                    <el-button circle type="default" size="small" @click.stop="handleDeleteFavorite">
                        <i class="ri-delete-bin-line"></i>
                    </el-button>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup>
    import { Close, Message, Star } from '@element-plus/icons-vue';
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
