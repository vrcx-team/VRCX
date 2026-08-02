<template>
    <!-- <Button
            variant="outline"
            v-if="userFavoriteWorlds && userFavoriteWorlds.length > 0"
            type="default"
            :loading="userDialog.isFavoriteWorldsLoading"
            size="small"
            :icon="RefreshCw"
            circle
            style="position: absolute; right: 15px; bottom: 15px; z-index: 99"
            @click="getUserFavoriteWorlds(userDialog.id)">
        </Button> -->
    <template v-if="userDialog.userFavoriteWorlds && userDialog.userFavoriteWorlds.length > 0">
        <div class="flex h-full min-h-0 flex-col overflow-hidden p-2 rounded-xl bg-(--profile-card)">
            <div class="pb-2">
                <Input v-model="searchQuery" class="h-8 w-40 shrink-0" placeholder="Search worlds" @click.stop />
            </div>
            <template v-if="searchActive">
                <div class="min-h-0 flex-1 overflow-auto">
                    <div class="flex flex-wrap items-start pb-4">
                        <div
                            v-for="world in allFilteredFavoriteWorlds"
                            :key="world.favoriteId"
                            class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                            @click="showWorldDialog(world.id)">
                            <div class="relative inline-block flex-none size-9 mr-2.5">
                                <Avatar class="size-9">
                                    <AvatarImage :src="world.thumbnailImageUrl" class="object-cover" />
                                    <AvatarFallback>
                                        <Image class="size-4 text-muted-foreground" />
                                    </AvatarFallback>
                                </Avatar>
                            </div>
                            <div class="flex-1 overflow-hidden">
                                <span class="block truncate font-medium leading-[18px]" v-text="world.name"></span>
                                <span v-if="world.occupants" class="block truncate text-xs"
                                    >({{ world.occupants }})</span
                                >
                            </div>
                        </div>
                    </div>
                </div>
            </template>
            <TabsUnderline
                v-else
                v-model="favoriteWorldsTab"
                :items="favoriteWorldTabs"
                :tab-color="userDialogTabColor"
                :unmount-on-hide="false"
                variant="equal"
                fill
                class="zero-margin-tabs favorite-worlds-tabs min-h-0 flex-1 overflow-hidden">
                <template
                    v-for="(list, index) in userDialog.userFavoriteWorlds"
                    :key="`favorite-worlds-label-${index}`"
                    v-slot:[`label-${index}`]>
                    <span class="inline-flex min-w-0 max-w-full flex-col items-center text-center leading-tight">
                        <span class="inline-flex min-w-0 max-w-full items-center justify-center">
                            <span class="font-bold text-sm truncate text-center" v-text="list[0]"></span>
                        </span>
                        <span class="text-[10px] text-muted-foreground inline-flex items-center justify-center">
                            <i class="x-status-icon mr-1 shrink-0" :class="userFavoriteWorldsStatus(list[1])"></i>
                            {{ list[2].length }}/{{ favoriteLimits.maxFavoritesPerGroup.world }}</span
                        >
                    </span>
                </template>
                <template
                    v-for="(list, index) in userDialog.userFavoriteWorlds"
                    :key="`favorite-worlds-content-${index}`"
                    v-slot:[String(index)]>
                    <div class="min-h-0 flex-1 overflow-auto">
                        <div class="flex flex-wrap items-start pb-4">
                            <div
                                v-for="world in list[2]"
                                :key="world.favoriteId"
                                class="box-border flex items-center p-1.5 text-[13px] cursor-pointer w-[167px] hover:rounded-[25px_5px_5px_25px]"
                                @click="showWorldDialog(world.id)">
                                <div class="relative inline-block flex-none size-9 mr-2.5">
                                    <Avatar class="size-9">
                                        <AvatarImage :src="world.thumbnailImageUrl" class="object-cover" />
                                        <AvatarFallback>
                                            <Image class="size-4 text-muted-foreground" />
                                        </AvatarFallback>
                                    </Avatar>
                                </div>
                                <div class="flex-1 overflow-hidden">
                                    <span class="block truncate font-medium leading-[18px]" v-text="world.name"></span>
                                    <span v-if="world.occupants" class="block truncate text-xs"
                                        >({{ world.occupants }})</span
                                    >
                                </div>
                            </div>
                        </div>
                    </div>
                </template>
            </TabsUnderline>
        </div>
    </template>
    <template v-else-if="!userDialog.isFavoriteWorldsLoading">
        <div class="flex justify-center items-center h-full p-2 rounded-xl bg-(--profile-card)">
            <DataTableEmpty type="nodata" />
        </div>
    </template>
</template>

<script setup>
    import { computed, ref, watch } from 'vue';
    import { Image } from 'lucide-vue-next';
    import { Input } from '@/components/ui/input';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { TabsUnderline } from '@/components/ui/tabs';
    import { storeToRefs } from 'pinia';

    import { useFavoriteStore, useUserStore } from '../../../stores';
    import { showWorldDialog } from '../../../coordinators/worldCoordinator';
    import { handleFavoriteWorldList } from '../../../coordinators/favoriteCoordinator';
    import { favoriteRequest } from '../../../api';

    const { userDialog } = storeToRefs(useUserStore());
    const { favoriteLimits } = storeToRefs(useFavoriteStore());

    const favoriteWorldsTab = ref('0');
    const userDialogFavoriteWorldsRequestId = ref(0);

    const favoriteWorldTabs = computed(() =>
        (userDialog.value.userFavoriteWorlds || []).map((list, index) => ({
            value: String(index),
            label: list?.[0] ?? ''
        }))
    );

    const searchQuery = ref('');
    const searchActive = computed(() => searchQuery.value.trim().length > 0);
    const allFilteredFavoriteWorlds = computed(() => {
        const query = searchQuery.value.trim().toLowerCase();
        if (!query) return [];
        const lists = userDialog.value.userFavoriteWorlds || [];
        const all = lists.flatMap((list) => list[2] || []);
        return all.filter((w) => (w.name || '').toLowerCase().includes(query));
    });
    watch(
        () => userDialog.value.id,
        () => {
            searchQuery.value = '';
        }
    );

    const userDialogTabColor = computed(() => {
        const color = userDialog.value.theme?.buttonColor;
        if (!color) {
            return 'var(--primary)';
        }
        return color;
    });

    /**
     *
     * @param visibility
     */
    function userFavoriteWorldsStatus(visibility) {
        const style = {};
        if (visibility === 'public') {
            style.green = true;
        } else if (visibility === 'friends') {
            style.blue = true;
        } else {
            style.red = true;
        }
        return style;
    }

    /**
     *
     * @param userId
     */
    async function getUserFavoriteWorlds(userId) {
        const requestId = ++userDialogFavoriteWorldsRequestId.value;
        userDialog.value.isFavoriteWorldsLoading = true;
        favoriteWorldsTab.value = '0';
        userDialog.value.userFavoriteWorlds = [];
        const worldLists = [];
        const groupArgs = await favoriteRequest.getFavoriteGroups({
            ownerId: userId,
            n: 100,
            offset: 0
        });
        if (requestId !== userDialogFavoriteWorldsRequestId.value || userDialog.value.id !== userId) {
            if (requestId === userDialogFavoriteWorldsRequestId.value) {
                userDialog.value.isFavoriteWorldsLoading = false;
            }
            return;
        }
        const worldGroups = groupArgs.json;
        const tasks = worldGroups.map(async (list) => {
            if (list.type !== 'world' && list.type !== 'vrcPlusWorld') {
                return null;
            }
            const params = {
                ownerId: userId,
                n: 100,
                offset: 0,
                userId,
                tag: list.name
            };
            try {
                const args = await favoriteRequest.getFavoriteWorlds(params);
                handleFavoriteWorldList(args);
                return [list.displayName, list.visibility, args.json];
            } catch (err) {
                console.error('getUserFavoriteWorlds', err);
                return null;
            }
        });
        const results = await Promise.all(tasks);
        for (const result of results) {
            if (result) {
                worldLists.push(result);
            }
        }
        if (requestId === userDialogFavoriteWorldsRequestId.value) {
            if (userDialog.value.id === userId) {
                userDialog.value.userFavoriteWorlds = worldLists;
            }
            userDialog.value.isFavoriteWorldsLoading = false;
        }
    }

    defineExpose({ getUserFavoriteWorlds });
</script>

<style scoped>
    .zero-margin-tabs :deep([role='tab']) {
        padding-left: 0;
        padding-right: 0;
        min-width: 0;
        overflow: hidden;
    }

    .zero-margin-tabs :deep([role='tablist']) {
        gap: 0;
    }
</style>
