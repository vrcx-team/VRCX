<template>
    <div style="display: flex; align-items: center; justify-content: space-between">
        <div style="display: flex; align-items: center">
            <Button
                class="rounded-full"
                variant="ghost"
                size="icon-sm"
                :disabled="userDialog.isWorldsLoading"
                @click="refreshUserDialogWorlds()">
                <Spinner v-if="userDialog.isWorldsLoading" />
                <RefreshCw v-else />
            </Button>
            <span class="ml-1.5 text-sm">{{
                t('dialog.user.worlds.total_count', { count: userDialog.worlds.length })
            }}</span>
        </div>
        <div style="display: flex; align-items: center">
            <Input v-model="searchQuery" class="h-8 w-40 mr-2" placeholder="Search worlds" @click.stop />
            <span class="mr-1">{{ t('dialog.user.worlds.sort_by') }}</span>
            <Select
                :model-value="userDialogWorldSortingKey"
                :disabled="userDialog.isWorldsLoading"
                @update:modelValue="setUserDialogWorldSortingByKey">
                <SelectTrigger size="sm" @click.stop>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem
                        v-for="(item, key) in userDialogWorldSortingOptions"
                        :key="String(key)"
                        :value="String(key)">
                        {{ t(item.name) }}
                    </SelectItem>
                </SelectContent>
            </Select>
            <span class="ml-2 mr-1">{{ t('dialog.user.worlds.order_by') }}</span>
            <Select
                :model-value="userDialogWorldOrderKey"
                :disabled="userDialog.isWorldsLoading"
                @update:modelValue="setUserDialogWorldOrderByKey">
                <SelectTrigger size="sm" @click.stop>
                    <SelectValue />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem
                        v-for="(item, key) in userDialogWorldOrderOptions"
                        :key="String(key)"
                        :value="String(key)">
                        {{ t(item.name) }}
                    </SelectItem>
                </SelectContent>
            </Select>
        </div>
    </div>
    <div class="flex flex-wrap items-start" style="margin-top: 8px; min-height: 60px">
        <template v-if="userDialog.worlds.length">
            <div
                v-for="world in filteredWorlds"
                :key="world.id"
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
                    <span v-if="world.occupants" class="block truncate text-xs">({{ world.occupants }})</span>
                </div>
            </div>
        </template>
        <div
            v-else-if="!userDialog.isWorldsLoading"
            style="display: flex; justify-content: center; align-items: center; min-height: 120px; width: 100%">
            <DataTableEmpty type="nodata" />
        </div>
    </div>
</template>

<script setup>
    import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { Button } from '@/components/ui/button';
    import { DataTableEmpty } from '@/components/ui/data-table';
    import { Image, RefreshCw } from 'lucide-vue-next';
    import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
    import { Spinner } from '@/components/ui/spinner';
    import { Input } from '@/components/ui/input';
    import { computed, ref, watch } from 'vue';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useUserStore, useWorldStore } from '../../../stores';
    import { showWorldDialog } from '../../../coordinators/worldCoordinator';
    import { userDialogWorldOrderOptions, userDialogWorldSortingOptions } from '../../../shared/constants/';
    import { queryRequest } from '../../../api';
    import { useOptionKeySelect } from '../../../composables/useOptionKeySelect';

    const { t } = useI18n();

    const userStore = useUserStore();
    const { userDialog, currentUser } = storeToRefs(userStore);
    const { cachedWorlds } = useWorldStore();

    const userDialogWorldsRequestId = ref(0);

    const searchQuery = ref('');
    const filteredWorlds = computed(() => {
        const worlds = userDialog.value.worlds;
        const query = searchQuery.value.trim().toLowerCase();
        if (!query) return worlds;
        return worlds.filter((w) => (w.name || '').toLowerCase().includes(query));
    });
    watch(() => userDialog.value.id, () => { searchQuery.value = ''; });

    /**
     *
     * @param userId
     */
    function setUserDialogWorlds(userId) {
        const worlds = [];
        for (const ref of cachedWorlds.values()) {
            if (ref.authorId === userId) {
                worlds.push(ref);
            }
        }
        userDialog.value.worlds = worlds;
    }

    /**
     *
     */
    function refreshUserDialogWorlds() {
        const D = userDialog.value;
        if (D.isWorldsLoading) {
            return;
        }
        const requestId = ++userDialogWorldsRequestId.value;
        D.isWorldsLoading = true;
        const params = {
            n: 50,
            offset: 0,
            sort: userDialog.value.worldSorting.value,
            order: userDialog.value.worldOrder.value,
            // user: 'friends',
            userId: D.id,
            releaseStatus: 'public'
        };
        if (params.userId === currentUser.value.id) {
            params.user = 'me';
            params.releaseStatus = 'all';
        }
        const worlds = [];
        const worldIds = new Set();
        (async () => {
            try {
                let offset = 0;
                while (true) {
                    const args = await queryRequest.fetch('worldsByUser', {
                        ...params,
                        offset
                    });
                    if (requestId !== userDialogWorldsRequestId.value || D.id !== params.userId) {
                        return;
                    }
                    for (const world of args.json) {
                        if (!worldIds.has(world.id)) {
                            worldIds.add(world.id);
                            worlds.push(world);
                        }
                    }
                    if (args.json.length < params.n) {
                        break;
                    }
                    offset += params.n;
                }
                if (requestId === userDialogWorldsRequestId.value && D.id === params.userId) {
                    userDialog.value.worlds = worlds;
                }
            } finally {
                if (requestId === userDialogWorldsRequestId.value) {
                    D.isWorldsLoading = false;
                }
            }
        })().catch((err) => {
            console.error('refreshUserDialogWorlds failed', err);
        });
    }

    /**
     *
     * @param sortOrder
     */
    async function setUserDialogWorldSorting(sortOrder) {
        const D = userDialog.value;
        if (D.worldSorting.value === sortOrder.value) {
            return;
        }
        D.worldSorting = sortOrder;
        refreshUserDialogWorlds();
    }

    const { selectedKey: userDialogWorldSortingKey, selectByKey: setUserDialogWorldSortingByKey } = useOptionKeySelect(
        userDialogWorldSortingOptions,
        () => userDialog.value.worldSorting,
        setUserDialogWorldSorting
    );

    /**
     *
     * @param order
     */
    async function setUserDialogWorldOrder(order) {
        const D = userDialog.value;
        if (D.worldOrder.value === order.value) {
            return;
        }
        D.worldOrder = order;
        refreshUserDialogWorlds();
    }

    const { selectedKey: userDialogWorldOrderKey, selectByKey: setUserDialogWorldOrderByKey } = useOptionKeySelect(
        userDialogWorldOrderOptions,
        () => userDialog.value.worldOrder,
        setUserDialogWorldOrder
    );

    defineExpose({ setUserDialogWorlds, refreshUserDialogWorlds });
</script>
