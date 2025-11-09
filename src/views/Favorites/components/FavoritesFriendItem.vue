<template>
    <div :class="cardClasses" @click="$emit('click')">
        <template v-if="favorite.ref">
            <div class="favorites-search-card__content">
                <div class="favorites-search-card__avatar">
                    <img :src="userImage(favorite.ref, true)" loading="lazy" />
                </div>
                <div class="favorites-search-card__detail">
                    <div class="favorites-search-card__title">
                        <span class="name" :style="displayNameStyle">{{ favorite.ref.displayName }}</span>
                    </div>
                    <div v-if="favorite.ref.location !== 'offline'" class="favorites-search-card__location">
                        <Location
                            :location="favorite.ref.location"
                            :traveling="favorite.ref.travelingToLocation"
                            :link="false" />
                    </div>
                    <span v-else class="extra">{{ favorite.ref.statusDescription }}</span>
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
                                :favoriteGroup="favoriteFriendGroups"
                                :currentGroup="group"
                                :currentFavorite="favorite"
                                class="favorites-search-card__dropdown"
                                type="friend" />
                        </div>
                        <div class="favorites-search-card__action">
                            <el-tooltip placement="left" :content="t('view.favorite.unfavorite_tooltip')">
                                <el-button
                                    size="small"
                                    circle
                                    class="favorites-search-card__action-btn"
                                    type="default"
                                    @click.stop="handleDeleteFavorite">
                                    <i class="ri-delete-bin-line"></i>
                                </el-button>
                            </el-tooltip>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <div class="favorites-search-card__action">
                        <el-tooltip placement="right" :content="t('view.favorite.unfavorite_tooltip')">
                            <el-button
                                size="small"
                                :icon="Star"
                                circle
                                class="favorites-search-card__action-btn"
                                @click.stop="showFavoriteDialog('friend', favorite.id)" />
                        </el-tooltip>
                    </div>
                </template>
            </div>
        </template>
        <template v-else>
            <div class="favorites-search-card__content">
                <div class="favorites-search-card__avatar is-empty"></div>
                <div class="favorites-search-card__detail">
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
    import { Star } from '@element-plus/icons-vue';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { favoriteRequest } from '../../../api';
    import { useFavoriteStore } from '../../../stores';
    import { userImage } from '../../../shared/utils';

    import FavoritesMoveDropdown from './FavoritesMoveDropdown.vue';

    const props = defineProps({
        favorite: { type: Object, required: true },
        group: { type: Object, default: null },
        editMode: { type: Boolean, default: false },
        selected: { type: Boolean, default: false }
    });

    const emit = defineEmits(['click', 'toggle-select']);

    const { favoriteFriendGroups } = storeToRefs(useFavoriteStore());
    const { showFavoriteDialog } = useFavoriteStore();
    const { t } = useI18n();

    const isSelected = computed({
        get: () => props.selected,
        set: (value) => emit('toggle-select', value)
    });

    const cardClasses = computed(() => [
        'favorites-search-card',
        'favorites-search-card--friend',
        {
            'is-selected': props.selected,
            'is-edit-mode': props.editMode
        }
    ]);

    const displayNameStyle = computed(() => {
        if (props.favorite?.ref?.$userColour) {
            return {
                color: props.favorite.ref.$userColour
            };
        }
        return {};
    });

    function handleDeleteFavorite() {
        favoriteRequest.deleteFavorite({
            objectId: props.favorite.id
        });
    }
</script>
