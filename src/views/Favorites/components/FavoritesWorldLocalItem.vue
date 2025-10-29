<template>
    <div class="fav-world-item">
        <div class="x-friend-item">
            <template v-if="favorite.name">
                <div class="avatar" v-once>
                    <img :src="smallThumbnail" loading="lazy" decoding="async" fetchpriority="low" />
                </div>
                <div class="detail" v-once>
                    <span class="name">{{ props.favorite.name }}</span>
                    <span v-if="props.favorite.occupants" class="extra">
                        {{ props.favorite.authorName }} ({{ props.favorite.occupants }})
                    </span>
                    <span v-else class="extra">{{ props.favorite.authorName }}</span>
                </div>
                <FavoritesMoveDropdown
                    v-if="editFavoritesMode"
                    :favoriteGroup="favoriteWorldGroups"
                    :currentFavorite="props.favorite"
                    isLocalFavorite
                    type="world" />
                <template v-else>
                    <el-tooltip placement="left">
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
                            @click.stop="$emit('remove-local-world-favorite', favorite.id, group)"></el-button>
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
    import { Close, Message, Star } from '@element-plus/icons-vue';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useFavoriteStore, useInviteStore, useUiStore } from '../../../stores';

    import FavoritesMoveDropdown from './FavoritesMoveDropdown.vue';

    const props = defineProps({
        group: [Object, String],
        favorite: Object
    });

    const emit = defineEmits(['handle-select', 'remove-local-world-favorite', 'click']);
    const { favoriteWorldGroups, editFavoritesMode } = storeToRefs(useFavoriteStore());
    const { showFavoriteDialog } = useFavoriteStore();
    const { newInstanceSelfInvite } = useInviteStore();
    const { shiftHeld } = storeToRefs(useUiStore());
    const { t } = useI18n();
    const { canOpenInstanceInGame } = useInviteStore();

    const smallThumbnail = computed(() => {
        const url = props.favorite.thumbnailImageUrl?.replace('256', '128');
        return url || props.favorite.thumbnailImageUrl;
    });

    function handleDeleteFavorite() {
        emit('remove-local-world-favorite', props.favorite.id, props.group);
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
