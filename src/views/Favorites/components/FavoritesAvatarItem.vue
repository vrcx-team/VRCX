<template>
    <div @click="$emit('click')">
        <div class="x-friend-item">
            <template v-if="isLocalFavorite ? favorite.name : favorite.ref">
                <div class="avatar">
                    <img v-lazy="smallThumbnail" />
                </div>
                <div class="detail">
                    <span class="name" v-text="localFavFakeRef.name"></span>
                    <span class="extra" v-text="localFavFakeRef.authorName"></span>
                </div>
                <template v-if="editFavoritesMode">
                    <el-dropdown trigger="click" size="mini" style="margin-left: 5px" @click.native.stop>
                        <el-tooltip placement="top" :content="tooltipContent" :disabled="hideTooltips">
                            <el-button type="default" icon="el-icon-back" size="mini" circle></el-button>
                        </el-tooltip>
                        <el-dropdown-menu slot="dropdown">
                            <template
                                v-for="groupAPI in favoriteAvatarGroups"
                                v-if="isLocalFavorite || groupAPI.name !== group.name">
                                <el-dropdown-item
                                    :key="groupAPI.name"
                                    style="display: block; margin: 10px 0"
                                    :disabled="groupAPI.count >= groupAPI.capacity"
                                    @click.native="handleDropdownItemClick(groupAPI)">
                                    {{ groupAPI.displayName }} ({{ groupAPI.count }} / {{ groupAPI.capacity }})
                                </el-dropdown-item>
                            </template>
                        </el-dropdown-menu>
                    </el-dropdown>
                    <el-button v-if="!isLocalFavorite" type="text" size="mini" style="margin-left: 5px" @click.stop>
                        <el-checkbox v-model="isSelected"></el-checkbox>
                    </el-button>
                </template>
                <template v-else-if="!isLocalFavorite">
                    <el-tooltip
                        v-if="favorite.deleted"
                        placement="left"
                        :content="t('view.favorite.unavailable_tooltip')">
                        <i class="el-icon-warning" style="color: #f56c6c; margin-left: 5px"></i>
                    </el-tooltip>
                    <el-tooltip
                        v-if="favorite.ref.releaseStatus === 'private'"
                        placement="left"
                        :content="t('view.favorite.private')">
                        <i class="el-icon-warning" style="color: #e6a23c; margin-left: 5px"></i>
                    </el-tooltip>
                    <el-tooltip
                        v-if="favorite.ref.releaseStatus !== 'private' && !favorite.deleted"
                        placement="left"
                        :content="t('view.favorite.select_avatar_tooltip')"
                        :disabled="hideTooltips">
                        <el-button
                            :disabled="currentUser.currentAvatar === favorite.id"
                            size="mini"
                            icon="el-icon-check"
                            circle
                            style="margin-left: 5px"
                            @click.stop="selectAvatarWithConfirmation(favorite.id)"></el-button>
                    </el-tooltip>
                    <el-tooltip
                        placement="right"
                        :content="t('view.favorite.unfavorite_tooltip')"
                        :disabled="hideTooltips">
                        <el-button
                            v-if="shiftHeld"
                            size="mini"
                            icon="el-icon-close"
                            circle
                            style="color: #f56c6c; margin-left: 5px"
                            @click.stop="deleteFavorite(favorite.id)"></el-button>
                        <el-button
                            v-else
                            type="default"
                            icon="el-icon-star-on"
                            size="mini"
                            circle
                            style="margin-left: 5px"
                            @click.stop="showFavoriteDialog('avatar', favorite.id)"></el-button>
                    </el-tooltip>
                </template>
                <template v-else>
                    <el-tooltip
                        placement="left"
                        :content="t('view.favorite.select_avatar_tooltip')"
                        :disabled="hideTooltips">
                        <el-button
                            :disabled="currentUser.currentAvatar === favorite.id"
                            size="mini"
                            circle
                            style="margin-left: 5px"
                            icon="el-icon-check"
                            @click.stop="selectAvatarWithConfirmation(favorite.id)" />
                    </el-tooltip>
                </template>
                <el-tooltip
                    v-if="isLocalFavorite"
                    placement="right"
                    :content="t('view.favorite.unfavorite_tooltip')"
                    :disabled="hideTooltips">
                    <el-button
                        v-if="shiftHeld"
                        size="mini"
                        icon="el-icon-close"
                        circle
                        style="color: #f56c6c; margin-left: 5px"
                        @click.stop="removeLocalAvatarFavorite(favorite.id, favoriteGroupName)" />
                    <el-button
                        v-else
                        type="default"
                        icon="el-icon-star-on"
                        size="mini"
                        circle
                        style="margin-left: 5px"
                        @click.stop="showFavoriteDialog('avatar', favorite.id)"
                /></el-tooltip>
            </template>
            <template v-else>
                <div class="avatar"></div>
                <div class="detail">
                    <span class="name" v-text="favorite.name || favorite.id"></span>
                </div>
                <el-button
                    v-if="isLocalFavorite"
                    type="text"
                    icon="el-icon-close"
                    size="mini"
                    style="margin-left: 5px"
                    @click.stop="removeLocalAvatarFavorite(favorite.id, favoriteGroupName)"></el-button>
                <el-button
                    v-else
                    type="text"
                    icon="el-icon-close"
                    size="mini"
                    style="margin-left: 5px"
                    @click.stop="deleteFavorite(favorite.id)"></el-button>
            </template>
        </div>
    </div>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { computed } from 'vue';
    import { useI18n } from 'vue-i18n-bridge';
    import { favoriteRequest } from '../../../api';
    import { $app } from '../../../app';
    import {
        useAppearanceSettingsStore,
        useAvatarStore,
        useFavoriteStore,
        useUiStore,
        useUserStore
    } from '../../../stores';

    const props = defineProps({
        favorite: Object,
        group: [Object, String],
        editFavoritesMode: Boolean,
        isLocalFavorite: Boolean
    });
    const emit = defineEmits(['click', 'handle-select']);

    const { t } = useI18n();

    const { hideTooltips } = storeToRefs(useAppearanceSettingsStore());
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
                $app.$message({
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
