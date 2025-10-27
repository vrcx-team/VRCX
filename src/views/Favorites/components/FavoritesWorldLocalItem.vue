<template>
    <div class="fav-world-item" @click="$emit('click')">
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
                <div class="editing">
                    <el-dropdown trigger="hover" size="small" style="margin-left: 5px" :persistent="false">
                        <div>
                            <el-button type="default" :icon="Back" size="small" circle></el-button>
                        </div>
                        <template #dropdown>
                            <span style="font-weight: bold; display: block; text-align: center">
                                {{ t(tooltipContent) }}
                            </span>
                            <el-dropdown-menu>
                                <template v-for="groupAPI in favoriteWorldGroups" :key="groupAPI.name">
                                    <el-dropdown-item
                                        style="display: block; margin: 10px 0"
                                        :disabled="groupAPI.count >= groupAPI.capacity"
                                        @click="handleDropdownItemClick(groupAPI)">
                                        {{ groupAPI.displayName }} ({{ groupAPI.count }} / {{ groupAPI.capacity }})
                                    </el-dropdown-item>
                                </template>
                            </el-dropdown-menu>
                        </template>
                    </el-dropdown>
                </div>
                <div class="default">
                    <el-tooltip placement="left">
                        <template #content>
                            {{
                                canOpenInstanceInGame()
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
                </div>
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
    import { Back, Close, Message, Star } from '@element-plus/icons-vue';
    import { ElMessage } from 'element-plus';
    import { computed } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useFavoriteStore, useInviteStore, useUiStore } from '../../../stores';
    import { favoriteRequest } from '../../../api';

    const props = defineProps({
        group: [Object, String],
        favorite: Object
    });

    const emit = defineEmits(['handle-select', 'remove-local-world-favorite', 'click']);
    const { favoriteWorldGroups } = storeToRefs(useFavoriteStore());
    const { showFavoriteDialog } = useFavoriteStore();
    const { newInstanceSelfInvite } = useInviteStore();
    const { shiftHeld } = storeToRefs(useUiStore());
    const { t } = useI18n();
    const { canOpenInstanceInGame } = useInviteStore();

    const tooltipContent = computed(() => t('view.favorite.copy_tooltip'));

    const smallThumbnail = computed(() => {
        const url = props.favorite.thumbnailImageUrl?.replace('256', '128');
        return url || props.favorite.thumbnailImageUrl;
    });

    function handleDropdownItemClick(groupAPI) {
        addFavoriteWorld(props.favorite, groupAPI, true);
    }

    function handleDeleteFavorite() {
        emit('remove-local-world-favorite', props.favorite.id, props.group);
    }

    function addFavoriteWorld(refObj, group, message) {
        return favoriteRequest
            .addFavorite({
                type: 'world',
                favoriteId: refObj.id,
                tags: group.name
            })
            .then((args) => {
                if (message) {
                    ElMessage({ message: 'World added to favorites', type: 'success' });
                }
                return args;
            });
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
