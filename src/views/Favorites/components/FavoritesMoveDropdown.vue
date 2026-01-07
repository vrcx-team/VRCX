<template>
    <el-dropdown trigger="hover" size="small" style="margin-left: 5px" :persistent="false">
        <div>
            <el-button type="default" :icon="Back" size="small" circle></el-button>
        </div>
        <template #dropdown>
            <span style="font-weight: bold; display: block; text-align: center">
                {{ t(tooltipContent) }}
            </span>
            <el-dropdown-menu>
                <template v-for="groupAPI in favoriteGroup" :key="groupAPI.name">
                    <el-dropdown-item
                        v-if="isLocalFavorite || groupAPI.name !== currentGroup?.name"
                        style="display: block; margin: 10px 0"
                        :disabled="groupAPI.count >= groupAPI.capacity"
                        @click="handleDropdownItemClick(groupAPI)">
                        {{ groupAPI.displayName }} ({{ groupAPI.count }} / {{ groupAPI.capacity }})
                    </el-dropdown-item>
                </template>
            </el-dropdown-menu>
        </template>
    </el-dropdown>
</template>

<script setup>
    import { Back } from '@element-plus/icons-vue';
    import { computed } from 'vue';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import { favoriteRequest } from '../../../api';

    const { t } = useI18n();

    const props = defineProps({
        favoriteGroup: {
            type: Object,
            required: true
        },
        currentGroup: {
            type: [Object, String],
            required: false
        },
        currentFavorite: {
            type: Object,
            required: true
        },
        isLocalFavorite: {
            type: Boolean,
            required: false
        },
        type: {
            type: String,
            required: true
        }
    });

    const tooltipContent = computed(() =>
        props.isLocalFavorite ? t('view.favorite.copy_tooltip') : t('view.favorite.move_tooltip')
    );

    function handleDropdownItemClick(groupAPI) {
        if (props.isLocalFavorite) {
            if (props.type === 'world') {
                addFavoriteWorld(groupAPI);
            } else if (props.type === 'avatar') {
                addFavoriteAvatar(groupAPI);
            }
        } else {
            moveFavorite(props.currentFavorite.ref, groupAPI, props.type);
        }
    }

    function moveFavorite(ref, group, type) {
        favoriteRequest.deleteFavorite({ objectId: ref.id }).then(() => {
            favoriteRequest.addFavorite({
                type,
                favoriteId: ref.id,
                tags: group.name
            });
        });
    }

    function addFavoriteAvatar(groupAPI) {
        return favoriteRequest
            .addFavorite({
                type: 'avatar',
                favoriteId: props.currentFavorite.id,
                tags: groupAPI.name
            })
            .then((args) => {
                toast.success('Avatar added to favorites');
                return args;
            });
    }

    function addFavoriteWorld(groupAPI) {
        return favoriteRequest
            .addFavorite({
                type: 'world',
                favoriteId: props.currentFavorite.id,
                tags: groupAPI.name
            })
            .then((args) => {
                toast.success('World added to favorites');
                return args;
            });
    }
</script>
