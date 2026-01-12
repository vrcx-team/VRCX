<template>
    <el-dialog :z-index="favoriteDialogIndex" v-model="isVisible" :title="t('dialog.favorite.header')" width="300px">
        <div v-loading="loading">
            <span style="display: block; text-align: center">{{ t('dialog.favorite.vrchat_favorites') }}</span>
            <template v-if="favoriteDialog.currentGroup && favoriteDialog.currentGroup.key">
                <Button
                    variant="outline"
                    style="width: 100%; white-space: initial"
                    class="my-1"
                    @click="deleteFavoriteNoConfirm(favoriteDialog.objectId)">
                    <Check />{{ favoriteDialog.currentGroup.displayName }} ({{ favoriteDialog.currentGroup.count }} /
                    {{ favoriteDialog.currentGroup.capacity }})
                </Button>
            </template>
            <template v-else>
                <Button
                    variant="outline"
                    v-for="group in groups"
                    :key="group.key"
                    style="width: 100%; white-space: initial"
                    class="my-1"
                    @click="addFavorite(group)">
                    {{ group.displayName }} ({{ group.count }} / {{ group.capacity }})
                </Button>
            </template>
        </div>
        <div v-if="favoriteDialog.type === 'world'" style="margin-top: 20px">
            <span style="display: block; text-align: center">{{ t('dialog.favorite.local_favorites') }}</span>
            <template v-for="group in localWorldFavoriteGroups" :key="group">
                <Button
                    variant="outline"
                    v-if="hasLocalWorldFavorite(favoriteDialog.objectId, group)"
                    style="width: 100%; white-space: initial"
                    class="my-1"
                    @click="removeLocalWorldFavorite(favoriteDialog.objectId, group)">
                    <Check />{{ group }} ({{ localWorldFavGroupLength(group) }})
                </Button>
                <Button
                    variant="outline"
                    v-else
                    style="width: 100%; white-space: initial"
                    class="my-1"
                    @click="addLocalWorldFavorite(favoriteDialog.objectId, group)">
                    {{ group }} ({{ localWorldFavGroupLength(group) }})
                </Button>
            </template>
        </div>
        <div v-if="favoriteDialog.type === 'avatar'" style="margin-top: 20px">
            <span style="text-align: center">{{ t('dialog.favorite.local_avatar_favorites') }}</span>
            <template v-for="group in localAvatarFavoriteGroups" :key="group">
                <Button
                    variant="outline"
                    v-if="hasLocalAvatarFavorite(favoriteDialog.objectId, group)"
                    style="width: 100%; white-space: initial"
                    class="my-1"
                    @click="removeLocalAvatarFavorite(favoriteDialog.objectId, group)">
                    <Check />{{ group }} ({{ localAvatarFavGroupLength(group) }})
                </Button>
                <Button
                    variant="outline"
                    v-else
                    style="width: 100%; white-space: initial"
                    class="my-1"
                    :disabled="!isLocalUserVrcPlusSupporter"
                    @click="addLocalAvatarFavorite(favoriteDialog.objectId, group)">
                    {{ group }} ({{ localAvatarFavGroupLength(group) }})
                </Button>
            </template>
        </div>
    </el-dialog>
</template>

<script setup>
    import { computed, nextTick, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Check } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import Noty from 'noty';

    import { useFavoriteStore, useUserStore } from '../../stores';
    import { favoriteRequest } from '../../api';
    import { getNextDialogIndex } from '../../shared/utils/base/ui';

    const { t } = useI18n();

    const favoriteStore = useFavoriteStore();
    const {
        favoriteFriendGroups,
        favoriteAvatarGroups,
        favoriteWorldGroups,
        favoriteDialog,
        localWorldFavoriteGroups,
        localAvatarFavoriteGroups
    } = storeToRefs(favoriteStore);
    const {
        localWorldFavGroupLength,
        addLocalWorldFavorite,
        hasLocalWorldFavorite,
        hasLocalAvatarFavorite,
        addLocalAvatarFavorite,
        localAvatarFavGroupLength,
        removeLocalAvatarFavorite,
        removeLocalWorldFavorite,
        deleteFavoriteNoConfirm
    } = favoriteStore;
    const { isLocalUserVrcPlusSupporter } = storeToRefs(useUserStore());

    const favoriteDialogIndex = ref(2000);
    const groups = ref([]);
    const loading = ref(false);

    const isVisible = computed({
        get: () => favoriteDialog.value.visible,
        set: (v) => {
            favoriteDialog.value.visible = v;
        }
    });

    watch(
        () => favoriteDialog.value.visible,
        (value) => {
            if (value) {
                initFavoriteDialog();
                nextTick(() => {
                    favoriteDialogIndex.value = getNextDialogIndex();
                });
            }
        }
    );

    function initFavoriteDialog() {
        if (favoriteDialog.value.type === 'friend') {
            groups.value = favoriteFriendGroups.value;
        } else if (favoriteDialog.value.type === 'world') {
            groups.value = favoriteWorldGroups.value;
        } else if (favoriteDialog.value.type === 'avatar') {
            groups.value = favoriteAvatarGroups.value;
        }
    }

    function addFavorite(group) {
        const D = favoriteDialog.value;
        loading.value = true;
        favoriteRequest
            .addFavorite({
                type: group.type,
                favoriteId: D.objectId,
                tags: group.name
            })
            .then(() => {
                isVisible.value = false;
                new Noty({ type: 'success', text: 'Favorite added!' }).show();
            })
            .finally(() => {
                loading.value = false;
            });
    }
</script>
