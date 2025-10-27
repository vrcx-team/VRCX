<template>
    <el-dialog :z-index="favoriteDialogIndex" v-model="isVisible" :title="t('dialog.favorite.header')" width="300px">
        <div v-loading="loading">
            <span style="display: block; text-align: center">{{ t('dialog.favorite.vrchat_favorites') }}</span>
            <template v-if="favoriteDialog.currentGroup && favoriteDialog.currentGroup.key">
                <el-button
                    style="display: block; width: 100%; margin: 10px 0; white-space: initial; height: auto"
                    @click="deleteFavoriteNoConfirm(favoriteDialog.objectId)">
                    <el-icon style="margin-right: 5px"><Check /></el-icon>
                    {{ favoriteDialog.currentGroup.displayName }} ({{ favoriteDialog.currentGroup.count }} /
                    {{ favoriteDialog.currentGroup.capacity }})
                </el-button>
            </template>
            <template v-else>
                <el-button
                    v-for="group in groups"
                    :key="group.key"
                    style="display: block; width: 100%; margin: 10px 0; white-space: initial; height: auto"
                    @click="addFavorite(group)">
                    {{ group.displayName }} ({{ group.count }} / {{ group.capacity }})
                </el-button>
            </template>
        </div>
        <div v-if="favoriteDialog.type === 'world'" style="margin-top: 20px">
            <span style="display: block; text-align: center">{{ t('dialog.favorite.local_favorites') }}</span>
            <template v-for="group in localWorldFavoriteGroups" :key="group">
                <el-button
                    v-if="hasLocalWorldFavorite(favoriteDialog.objectId, group)"
                    style="display: block; width: 100%; margin: 10px 0; white-space: initial; height: auto"
                    @click="removeLocalWorldFavorite(favoriteDialog.objectId, group)">
                    <el-icon style="margin-right: 5px"><Check /></el-icon>
                    {{ group }} ({{ localWorldFavGroupLength(group) }})
                </el-button>
                <el-button
                    v-else
                    style="display: block; width: 100%; margin: 10px 0; white-space: initial; height: auto"
                    @click="addLocalWorldFavorite(favoriteDialog.objectId, group)">
                    {{ group }} ({{ localWorldFavGroupLength(group) }})
                </el-button>
            </template>
        </div>
        <div v-if="favoriteDialog.type === 'avatar'" style="margin-top: 20px">
            <span style="display: block; text-align: center">{{ t('dialog.favorite.local_avatar_favorites') }}</span>
            <template v-for="group in localAvatarFavoriteGroups" :key="group">
                <el-button
                    v-if="hasLocalAvatarFavorite(favoriteDialog.objectId, group)"
                    style="display: block; width: 100%; margin: 10px 0; white-space: initial; height: auto"
                    @click="removeLocalAvatarFavorite(favoriteDialog.objectId, group)">
                    <el-icon style="margin-right: 5px"><Check /></el-icon>
                    {{ group }} ({{ localAvatarFavGroupLength(group) }})
                </el-button>
                <el-button
                    v-else
                    style="display: block; width: 100%; margin: 10px 0; white-space: initial; height: auto"
                    :disabled="!isLocalUserVrcPlusSupporter"
                    @click="addLocalAvatarFavorite(favoriteDialog.objectId, group)">
                    {{ group }} ({{ localAvatarFavGroupLength(group) }})
                </el-button>
            </template>
        </div>
    </el-dialog>
</template>

<script setup>
    import { computed, nextTick, ref, watch } from 'vue';
    import { Check } from '@element-plus/icons-vue';
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
        localAvatarFavoriteGroups,
        favoriteDialog,
        localWorldFavoriteGroups
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
                type: D.type,
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
