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
                    <i
                        v-if="favorite.deleted"
                        :title="t('view.favorite.unavailable_tooltip')"
                        class="ri-error-warning-line"></i>
                    <i
                        v-if="favorite.ref.releaseStatus === 'private'"
                        :title="t('view.favorite.private')"
                        class="ri-lock-line"></i>
                    <el-tooltip placement="left" :teleported="false">
                        <template #content> {{ inviteOrLaunchText }} </template>
                        <el-button
                            size="small"
                            :icon="Message"
                            style="margin-left: 5px"
                            @click.stop="newInstanceSelfInvite(favorite.id)"
                            circle></el-button>
                    </el-tooltip>
                    <el-button
                        size="small"
                        circle
                        style="margin-left: 5px"
                        type="default"
                        @click.stop="showFavoriteDialog('world', favorite.id)"
                        ><i class="ri-delete-bin-line"></i
                    ></el-button>
                </template>
            </template>
            <template v-else>
                <div class="avatar"></div>
                <div class="detail" v-once>
                    <span>{{ favorite.name || favorite.id }}</span>
                    <i
                        v-if="favorite.deleted"
                        :title="t('view.favorite.unavailable_tooltip')"
                        class="ri-error-warning-line"></i>
                    <el-button type="text" size="small" style="margin-left: 5px" @click.stop="handleDeleteFavorite"
                        ><i class="ri-delete-bin-line"></i
                    ></el-button>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
    import { Message } from '@element-plus/icons-vue';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useFavoriteStore, useInviteStore } from '../../../stores';
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

<style scoped>
    .fav-world-item {
        display: inline-block;
        width: 300px;
        margin-right: 15px;
        height: 53px;
    }
</style>
