<template>
    <div :class="cardClasses" @click="$emit('click')">
        <template v-if="favorite.ref">
            <div class="favorites-search-card__content">
                <div
                    class="favorites-search-card__avatar"
                    :class="{ 'is-empty': !favorite.ref.thumbnailImageUrl }"
                    v-once>
                    <img
                        v-if="favorite.ref.thumbnailImageUrl"
                        :src="smallThumbnail"
                        loading="lazy"
                        decoding="async"
                        fetchpriority="low" />
                </div>
                <div class="favorites-search-card__detail" v-once>
                    <div class="favorites-search-card__title">
                        <span class="name">{{ props.favorite.ref.name }}</span>
                        <span
                            v-if="favorite.deleted || favorite.ref.releaseStatus === 'private'"
                            class="favorites-search-card__badges">
                            <i
                                v-if="favorite.deleted"
                                :title="t('view.favorite.unavailable_tooltip')"
                                class="ri-error-warning-line"></i>
                            <i
                                v-if="favorite.ref.releaseStatus === 'private'"
                                :title="t('view.favorite.private')"
                                class="ri-lock-line"></i>
                        </span>
                    </div>
                    <span class="extra">
                        {{ props.favorite.ref.authorName }}
                        <template v-if="props.favorite.ref.occupants"> ({{ props.favorite.ref.occupants }}) </template>
                    </span>
                </div>
            </div>
            <div class="favorites-search-card__actions">
                <template v-if="editMode">
                    <div class="favorites-search-card__action favorites-search-card__action--checkbox" @click.stop>
                        <el-checkbox v-model="isSelected"></el-checkbox>
                    </div>
                    <div class="favorites-search-card__action-group">
                        <div class="favorites-search-card__action favorites-search-card__action--full" @click.stop>
                            <FavoritesMoveDropdown
                                :favoriteGroup="favoriteWorldGroups"
                                :currentFavorite="props.favorite"
                                :currentGroup="group"
                                class="favorites-search-card__dropdown"
                                type="world" />
                        </div>
                        <div class="favorites-search-card__action">
                            <el-button
                                size="small"
                                circle
                                class="favorites-search-card__action-btn"
                                type="default"
                                @click.stop="handleDeleteFavorite">
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
                    <span>{{ favorite.name || favorite.id }}</span>
                    <i
                        v-if="favorite.deleted"
                        :title="t('view.favorite.unavailable_tooltip')"
                        class="ri-error-warning-line"></i>
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
    const { newInstanceSelfInvite } = useInviteStore();
    const { t } = useI18n();
    const { canOpenInstanceInGame } = useInviteStore();
    const { shiftHeld } = storeToRefs(useUiStore());

    const isSelected = computed({
        get: () => props.selected,
        set: (value) => emit('toggle-select', value)
    });

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
        const url = props.favorite.ref.thumbnailImageUrl?.replace('256', '128');
        return url || props.favorite.ref.thumbnailImageUrl;
    });

    const inviteOrLaunchText = computed(() => {
        return canOpenInstanceInGame
            ? t('dialog.world.actions.new_instance_and_open_ingame')
            : t('dialog.world.actions.new_instance_and_self_invite');
    });

    function handleDeleteFavorite() {
        if (props.isLocalFavorite) {
            emit('remove-local-world-favorite', props.favorite.id, props.group);
        } else {
            deleteFavorite(props.favorite.id);
        }
    }

    function deleteFavorite(objectId) {
        favoriteRequest.deleteFavorite({ objectId });
    }
</script>

<style scoped></style>
