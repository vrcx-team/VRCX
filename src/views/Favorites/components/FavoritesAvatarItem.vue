<template>
    <div @click="$emit('click')">
        <div class="x-friend-item">
            <template v-if="isLocalFavorite ? favorite.name : favorite.ref">
                <div class="avatar">
                    <img :src="smallThumbnail" loading="lazy" />
                </div>
                <div class="detail">
                    <span class="name" v-text="localFavFakeRef.name"></span>
                    <span class="extra" v-text="localFavFakeRef.authorName"></span>
                </div>
                <div class="editing">
                    <el-dropdown trigger="click" size="small" style="margin-left: 5px">
                        <div>
                            <el-tooltip placement="top" :content="tooltipContent">
                                <el-button type="default" :icon="Back" size="small" circle></el-button>
                            </el-tooltip>
                        </div>
                        <template #dropdown>
                            <el-dropdown-menu>
                                <template v-for="groupAPI in favoriteAvatarGroups" :key="groupAPI.name">
                                    <el-dropdown-item
                                        v-if="isLocalFavorite || groupAPI.name !== group.name"
                                        style="display: block; margin: 10px 0"
                                        :disabled="groupAPI.count >= groupAPI.capacity"
                                        @click="handleDropdownItemClick(groupAPI)">
                                        {{ groupAPI.displayName }} ({{ groupAPI.count }} / {{ groupAPI.capacity }})
                                    </el-dropdown-item>
                                </template>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                    <el-button v-if="!isLocalFavorite" type="text" size="small" style="margin-left: 5px" @click.stop>
                        <el-checkbox v-model="isSelected"></el-checkbox>
                    </el-button>
                </div>
                <div class="default">
                    <template v-if="!isLocalFavorite">
                        <el-tooltip
                            v-if="favorite.deleted"
                            placement="left"
                            :content="t('view.favorite.unavailable_tooltip')">
                            <el-icon><Warning /></el-icon>
                        </el-tooltip>
                        <el-tooltip
                            v-if="favorite.ref.releaseStatus === 'private'"
                            placement="left"
                            :content="t('view.favorite.private')">
                            <el-icon><Warning /></el-icon>
                        </el-tooltip>
                        <el-tooltip
                            v-if="favorite.ref.releaseStatus !== 'private' && !favorite.deleted"
                            placement="left"
                            :content="t('view.favorite.select_avatar_tooltip')">
                            <el-button
                                :disabled="currentUser.currentAvatar === favorite.id"
                                size="small"
                                :icon="Check"
                                circle
                                style="margin-left: 5px"
                                @click.stop="selectAvatarWithConfirmation(favorite.id)"></el-button>
                        </el-tooltip>
                        <el-tooltip placement="right" :content="t('view.favorite.unfavorite_tooltip')">
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
                        <el-tooltip placement="left" :content="t('view.favorite.select_avatar_tooltip')">
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
                        :content="t('view.favorite.unfavorite_tooltip')">
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
                </div>
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
    import { ElMessage } from 'element-plus';
    import { Warning, Back, Check, Close, Star } from '@element-plus/icons-vue';
    import { storeToRefs } from 'pinia';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { favoriteRequest } from '../../../api';
    import { useAvatarStore, useFavoriteStore, useUiStore, useUserStore } from '../../../stores';

    const props = defineProps({
        favorite: Object,
        group: [Object, String],
        isLocalFavorite: Boolean
    });
    const emit = defineEmits(['click', 'handle-select']);

    const { t } = useI18n();

    const { favoriteAvatarGroups } = storeToRefs(useFavoriteStore());
    const { removeLocalAvatarFavorite, showFavoriteDialog } = useFavoriteStore();
    const { selectAvatarWithConfirmation } = useAvatarStore();
    const { shiftHeld } = storeToRefs(useUiStore());
    const { currentUser } = storeToRefs(useUserStore());

    const isSelected = computed({
        get: () => props.favorite.$selected,
        set: (value) => emit('handle-select', value)
    });
    const localFavFakeRef = computed(() => (props.isLocalFavorite ? props.favorite : props.favorite.ref));
    const tooltipContent = computed(() =>
        t(props.isLocalFavorite ? 'view.favorite.copy_tooltip' : 'view.favorite.move_tooltip')
    );
    const smallThumbnail = computed(
        () => localFavFakeRef.value.thumbnailImageUrl.replace('256', '128') || localFavFakeRef.value.thumbnailImageUrl
    );
    const favoriteGroupName = computed(() => {
        if (typeof props.group === 'string') {
            return props.group;
        } else {
            return props.group?.name;
        }
    });

    function moveFavorite(ref, group, type) {
        favoriteRequest.deleteFavorite({ objectId: ref.id }).then(() => {
            favoriteRequest.addFavorite({
                type,
                favoriteId: ref.id,
                tags: group.name
            });
        });
    }

    function deleteFavorite(objectId) {
        favoriteRequest.deleteFavorite({ objectId });
    }

    function addFavoriteAvatar(groupAPI) {
        return favoriteRequest
            .addFavorite({
                type: 'avatar',
                favoriteId: props.favorite.id,
                tags: groupAPI.name
            })
            .then((args) => {
                ElMessage({
                    message: 'Avatar added to favorites',
                    type: 'success'
                });
                return args;
            });
    }

    function handleDropdownItemClick(groupAPI) {
        if (props.isLocalFavorite) {
            addFavoriteAvatar(groupAPI);
        } else {
            moveFavorite(props.favorite.ref, groupAPI, 'avatar');
        }
    }
</script>
