<template>
    <DropdownMenu v-model:open="moveDropdownOpen" style="margin-left: 5px">
        <DropdownMenuTrigger as-child>
            <Button class="rounded-full w-6 h-6 text-xs" size="icon-sm" variant="ghost"
                ><i class="ri-arrow-left-line"></i
            ></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="favorites-dropdown">
            <span style="font-weight: bold; display: block; text-align: center">
                {{ t(tooltipContent) }}
            </span>
            <DropdownMenuSeparator />
            <DropdownMenuItem
                v-for="groupAPI in favoriteGroupList"
                :key="groupAPI.name"
                v-if="isLocalFavorite || groupAPI?.name !== currentGroup?.name"
                style="display: block; margin: 10px 0"
                :disabled="groupAPI.count >= groupAPI.capacity"
                @click="handleDropdownItemClick(groupAPI)">
                {{ groupAPI.displayName }} ({{ groupAPI.count }} / {{ groupAPI.capacity }})
            </DropdownMenuItem>
        </DropdownMenuContent>
    </DropdownMenu>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { Button } from '@/components/ui/button';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        DropdownMenu,
        DropdownMenuContent,
        DropdownMenuItem,
        DropdownMenuSeparator,
        DropdownMenuTrigger
    } from '../../../components/ui/dropdown-menu';
    import { favoriteRequest } from '../../../api';

    const { t } = useI18n();

    const props = defineProps({
        favoriteGroup: {
            type: [Array, Object],
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
    const favoriteGroupList = computed(() => {
        const rawGroup = props.favoriteGroup;
        const source = Array.isArray(rawGroup) ? rawGroup : Array.isArray(rawGroup?.value) ? rawGroup.value : [];
        return source.filter((entry) => entry && typeof entry === 'object' && typeof entry.name === 'string');
    });
    const moveDropdownOpen = ref(false);

    function handleDropdownItemClick(groupAPI) {
        moveDropdownOpen.value = false;
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
                type: groupAPI.type,
                favoriteId: props.currentFavorite.id,
                tags: groupAPI.name
            })
            .then((args) => {
                toast.success('World added to favorites');
                return args;
            });
    }
</script>
