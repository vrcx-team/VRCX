<template>
    <div class="fav-world-item" @click="$emit('click')">
        <div class="x-friend-item">
            <template v-if="favorite.ref">
                <div class="avatar" v-once>
                    <img :src="smallThumbnail" loading="lazy" decoding="async" fetchpriority="low" />
                </div>
                <div class="detail" v-once>
                    <span class="name">{{ props.favorite.ref.name }}</span>
                    <span v-if="props.favorite.ref.occupants" class="extra">
                        {{ props.favorite.ref.authorName }} ({{ props.favorite.ref.occupants }})
                    </span>
                    <span v-else class="extra">{{ props.favorite.ref.authorName }}</span>
                </div>
                <div v-if="editFavoritesMode">
                    <FavoritesMoveDropdown
                        :favoriteGroup="favoriteWorldGroups"
                        :currentFavorite="props.favorite"
                        :currentGroup="group"
                        type="world" />
                    <el-button type="text" size="small" @click.stop style="margin-left: 5px">
                        <el-checkbox v-model="isSelected"></el-checkbox>
                    </el-button>
                </div>
                <template v-else>
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
                    <el-tooltip placement="left" :teleported="false">
                        <template #content>
                            {{
                                canOpenInstanceInGame
                                    ? t('dialog.world.actions.new_instance_and_open_ingame')
                                    : t('dialog.world.actions.new_instance_and_self_invite')
                            }}
                        </template>
                        <el-button
                            size="small"
                            :icon="Message"
                            style="margin-left: 5px"
                            @click.stop="newInstanceSelfInvite(favorite.id)"
                            circle></el-button>
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
                            :icon="Star"
                            size="small"
                            circle
                            style="margin-left: 5px"
                            type="default"
                            @click.stop="showFavoriteDialog('world', favorite.id)"></el-button>
                    </el-tooltip>
                </template>
            </template>
            <template v-else>
                <div class="avatar"></div>
                <div class="detail" v-once>
                    <span>{{ favorite.name || favorite.id }}</span>
                    <el-tooltip
                        v-if="favorite.deleted"
                        placement="left"
                        :content="t('view.favorite.unavailable_tooltip')"
                        :teleported="false">
                        <el-icon><Warning /></el-icon>
                    </el-tooltip>
                    <el-button
                        type="text"
                        :icon="Close"
                        size="small"
                        style="margin-left: 5px"
                        @click.stop="handleDeleteFavorite"></el-button>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
    import { Close, Message, Star, Warning } from '@element-plus/icons-vue';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useFavoriteStore, useInviteStore, useUiStore } from '../../../stores';
    import { favoriteRequest } from '../../../api';

    import FavoritesMoveDropdown from './FavoritesMoveDropdown.vue';

    const props = defineProps({
        group: [Object, String],
        favorite: Object,
        isLocalFavorite: { type: Boolean, default: false }
    });

    const emit = defineEmits(['handle-select', 'remove-local-world-favorite', 'click']);
    const { favoriteWorldGroups, editFavoritesMode } = storeToRefs(useFavoriteStore());
    const { showFavoriteDialog } = useFavoriteStore();
    const { newInstanceSelfInvite } = useInviteStore();
    const { shiftHeld } = storeToRefs(useUiStore());
    const { t } = useI18n();
    const { canOpenInstanceInGame } = useInviteStore();

    const isSelected = computed({
        get: () => props.favorite.$selected,
        set: (value) => emit('handle-select', value)
    });

    const smallThumbnail = computed(() => {
        const url = props.favorite.ref.thumbnailImageUrl?.replace('256', '128');
        return url || props.favorite.ref.thumbnailImageUrl;
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

<style scoped>
    .fav-world-item {
        display: inline-block;
        width: 300px;
        margin-right: 15px;
        height: 53px;
    }
</style>
