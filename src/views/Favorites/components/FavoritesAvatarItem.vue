<template>
    <div>
        <div class="x-friend-item">
            <template v-if="isLocalFavorite ? favorite.name : favorite.ref">
                <div class="avatar">
                    <img :src="smallThumbnail" loading="lazy" />
                </div>
                <div class="detail">
                    <span class="name" v-text="localFavFakeRef.name"></span>
                    <span class="extra" v-text="localFavFakeRef.authorName"></span>
                </div>
                <div v-if="editFavoritesMode">
                    <FavoritesMoveDropdown
                        :favoriteGroup="favoriteAvatarGroups"
                        :currentFavorite="props.favorite"
                        :currentGroup="group"
                        type="avatar" />
                    <el-button v-if="!isLocalFavorite" type="text" size="small" style="margin-left: 5px" @click.stop>
                        <el-checkbox v-model="isSelected"></el-checkbox>
                    </el-button>
                </div>
                <template v-else-if="!isLocalFavorite">
                    <el-tooltip
                        v-if="favorite.deleted"
                        placement="left"
                        :content="t('view.favorite.unavailable_tooltip')"
                        :teleported="false">
                        <el-icon><Warning /></el-icon>
                    </el-tooltip>
                    <el-tooltip
                        v-if="favorite.ref.releaseStatus === 'private'"
                        placement="left"
                        :content="t('view.favorite.private')"
                        :teleported="false">
                        <el-icon><Warning /></el-icon>
                    </el-tooltip>
                    <el-tooltip
                        v-if="favorite.ref.releaseStatus !== 'private' && !favorite.deleted"
                        placement="left"
                        :content="t('view.favorite.select_avatar_tooltip')"
                        :teleported="false">
                        <el-button
                            :disabled="currentUser.currentAvatar === favorite.id"
                            size="small"
                            :icon="Check"
                            circle
                            style="margin-left: 5px"
                            @click.stop="selectAvatarWithConfirmation(favorite.id)"></el-button>
                    </el-tooltip>
                    <el-tooltip placement="right" :content="t('view.favorite.unfavorite_tooltip')" :teleported="false">
                        <el-button
                            v-if="shiftHeld"
                            size="small"
                            :icon="Close"
                            circle
                            style="color: #f56c6c; margin-left: 5px"
                            @click.stop="deleteFavorite(favorite.id)"></el-button>
                        <el-button
                            v-else
                            type="default"
                            :icon="Star"
                            size="small"
                            circle
                            style="margin-left: 5px"
                            @click.stop="showFavoriteDialog('avatar', favorite.id)"></el-button>
                    </el-tooltip>
                </template>
                <template v-else>
                    <el-tooltip
                        placement="left"
                        :content="t('view.favorite.select_avatar_tooltip')"
                        :teleported="false">
                        <el-button
                            :disabled="currentUser.currentAvatar === favorite.id"
                            size="small"
                            circle
                            style="margin-left: 5px"
                            :icon="Check"
                            @click.stop="selectAvatarWithConfirmation(favorite.id)" />
                    </el-tooltip>
                </template>
                <el-tooltip
                    v-if="isLocalFavorite"
                    placement="right"
                    :content="t('view.favorite.unfavorite_tooltip')"
                    :teleported="false">
                    <el-button
                        v-if="shiftHeld"
                        size="small"
                        :icon="Close"
                        circle
                        style="color: #f56c6c; margin-left: 5px"
                        @click.stop="removeLocalAvatarFavorite(favorite.id, favoriteGroupName)" />
                    <el-button
                        v-else
                        type="default"
                        :icon="Star"
                        size="small"
                        circle
                        style="margin-left: 5px"
                        @click.stop="showFavoriteDialog('avatar', favorite.id)" />
                </el-tooltip>
            </template>
            <template v-else>
                <div class="avatar"></div>
                <div class="detail">
                    <span class="name" v-text="favorite.name || favorite.id"></span>
                </div>
                <el-button
                    v-if="isLocalFavorite"
                    type="text"
                    :icon="Close"
                    size="small"
                    style="margin-left: 5px"
                    @click.stop="removeLocalAvatarFavorite(favorite.id, favoriteGroupName)"></el-button>
                <el-button
                    v-else
                    type="text"
                    :icon="Close"
                    size="small"
                    style="margin-left: 5px"
                    @click.stop="deleteFavorite(favorite.id)"></el-button>
            </template>
        </div>
    </div>
</template>

<script setup>
    import { Check, Close, Star, Warning } from '@element-plus/icons-vue';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAvatarStore, useFavoriteStore, useUiStore, useUserStore } from '../../../stores';
    import { favoriteRequest } from '../../../api';

    import FavoritesMoveDropdown from './FavoritesMoveDropdown.vue';

    const props = defineProps({
        favorite: Object,
        group: [Object, String],
        isLocalFavorite: Boolean
    });
    const emit = defineEmits(['click', 'handle-select']);

    const { t } = useI18n();

    const { favoriteAvatarGroups, editFavoritesMode } = storeToRefs(useFavoriteStore());
    const { removeLocalAvatarFavorite, showFavoriteDialog } = useFavoriteStore();
    const { selectAvatarWithConfirmation } = useAvatarStore();
    const { shiftHeld } = storeToRefs(useUiStore());
    const { currentUser } = storeToRefs(useUserStore());

    const isSelected = computed({
        get: () => props.favorite.$selected,
        set: (value) => emit('handle-select', value)
    });
    const localFavFakeRef = computed(() => (props.isLocalFavorite ? props.favorite : props.favorite.ref));

    const smallThumbnail = computed(
        () => localFavFakeRef.value.thumbnailImageUrl?.replace('256', '128') || localFavFakeRef.value.thumbnailImageUrl
    );
    const favoriteGroupName = computed(() => {
        if (typeof props.group === 'string') {
            return props.group;
        } else {
            return props.group?.name;
        }
    });

    function deleteFavorite(objectId) {
        favoriteRequest.deleteFavorite({ objectId });
    }
</script>
