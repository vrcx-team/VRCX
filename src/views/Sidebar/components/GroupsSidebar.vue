<template>
    <div ref="scrollRootRef" class="relative h-full">
        <div ref="scrollViewportRef" class="h-full w-full overflow-auto">
            <div class="x-friend-list px-1.5 py-2.5">
                <div v-if="virtualRows.length" class="relative w-full box-border" :style="virtualContainerStyle">
                    <template v-for="item in virtualItems" :key="String(item.virtualItem.key)">
                        <div
                            v-if="item.row"
                            class="absolute left-0 top-0 w-full box-border"
                            :data-index="item.virtualItem.index"
                            :ref="virtualizer.measureElement"
                            :style="rowStyle(item)">
                            <template v-if="item.row.type === 'group-header'">
                                <div
                                    class="x-friend-group cursor-pointer pt-4 pb-1.5 text-xs"
                                    :style="
                                        item.row.headerPaddingTop
                                            ? { paddingTop: item.row.headerPaddingTop }
                                            : undefined
                                    ">
                                    <div
                                        @click="toggleGroupSidebarCollapse(item.row.groupId)"
                                        class="flex items-center">
                                        <ChevronDown
                                            class="transition-transform duration-200 ease-in-out"
                                            :class="{ '-rotate-90': item.row.isCollapsed }" />
                                        <span class="ml-1.5"> {{ item.row.label }} – {{ item.row.count }} </span>
                                    </div>
                                </div>
                            </template>

                            <template v-else-if="item.row.type === 'group-item'">
                                <div class="x-friend-item" @click="showGroupDialog(item.row.ownerId)">
                                    <template v-if="item.row.isVisible">
                                        <div class="avatar">
                                            <img :src="getSmallGroupIconUrl(item.row.iconUrl)" loading="lazy" />
                                        </div>
                                        <div class="detail">
                                            <span class="name">
                                                <span v-text="item.row.name"></span>
                                                <span class="ml-1.5 font-normal">
                                                    ({{ item.row.userCount }}/{{ item.row.capacity }})
                                                </span>
                                            </span>
                                            <Location class="text-xs" :location="item.row.location" :link="false" />
                                        </div>
                                    </template>
                                </div>
                            </template>
                        </div>
                    </template>
                </div>
            </div>
        </div>
        <BackToTop :virtualizer="virtualizer" :target="scrollViewportRef" :tooltip="false" />
    </div>
</template>

<script setup>
    import { computed, nextTick, onMounted, ref, watch } from 'vue';
    import { ChevronDown } from 'lucide-vue-next';
    import { storeToRefs } from 'pinia';
    import { useVirtualizer } from '@tanstack/vue-virtual';

    import { useAppearanceSettingsStore, useGroupStore } from '../../../stores';
    import { convertFileUrlToImageUrl } from '../../../shared/utils';

    import BackToTop from '../../../components/BackToTop.vue';
    import Location from '../../../components/Location.vue';

    const { isAgeGatedInstancesVisible } = storeToRefs(useAppearanceSettingsStore());
    const { showGroupDialog, sortGroupInstancesByInGame } = useGroupStore();
    const { groupInstances } = storeToRefs(useGroupStore());

    const groupInstancesCfg = ref({});
    const scrollViewportRef = ref(null);
    const scrollRootRef = ref(null);

    const groupedGroupInstances = computed(() => {
        const groupMap = new Map();

        groupInstances.value.forEach((ref) => {
            const groupId = ref.group.groupId;
            if (!groupMap.has(groupId)) {
                groupMap.set(groupId, []);
            }
            groupMap.get(groupId).push(ref);

            if (!groupInstancesCfg.value[ref.group?.groupId]) {
                groupInstancesCfg.value = {
                    [ref.group.groupId]: {
                        isCollapsed: false
                    },
                    ...groupInstancesCfg.value
                };
            }
        });
        return Array.from(groupMap.values()).sort(sortGroupInstancesByInGame);
    });

    const buildGroupHeaderRow = (group, index) => ({
        type: 'group-header',
        key: `group-header:${getGroupId(group)}`,
        groupId: getGroupId(group),
        label: group[0]?.group?.name ?? '',
        count: group.length,
        isCollapsed: Boolean(groupInstancesCfg.value[getGroupId(group)]?.isCollapsed),
        headerPaddingTop: index === 0 ? '0px' : '10px'
    });

    const buildGroupItemRow = (ref, index, groupId) => ({
        type: 'group-item',
        key: `group-item:${groupId}:${ref?.instance?.id ?? index}`,
        ownerId: ref?.instance?.ownerId ?? '',
        iconUrl: ref?.group?.iconUrl ?? '',
        name: ref?.group?.name ?? '',
        userCount: ref?.instance?.userCount ?? 0,
        capacity: ref?.instance?.capacity ?? 0,
        location: ref?.instance?.location ?? '',
        isVisible: Boolean(isAgeGatedInstancesVisible.value || !(ref?.ageGate || ref?.location?.includes('~ageGate')))
    });

    const virtualRows = computed(() => {
        const rows = [];
        groupedGroupInstances.value.forEach((group, index) => {
            if (!group?.length) return;
            const groupId = getGroupId(group);
            rows.push(buildGroupHeaderRow(group, index));
            if (!groupInstancesCfg.value[groupId]?.isCollapsed) {
                group.forEach((ref, idx) => {
                    rows.push(buildGroupItemRow(ref, idx, groupId));
                });
            }
        });
        return rows;
    });

    const estimateRowSize = (row) => {
        if (!row) return 44;
        if (row.type === 'group-header') {
            return 30;
        }
        return 52;
    };

    const virtualizer = useVirtualizer(
        computed(() => ({
            count: virtualRows.value.length,
            getScrollElement: () => scrollViewportRef.value,
            estimateSize: (index) => estimateRowSize(virtualRows.value[index]),
            getItemKey: (index) => virtualRows.value[index]?.key ?? index,
            overscan: 6
        }))
    );

    const virtualItems = computed(() => {
        const items = virtualizer.value?.getVirtualItems?.() ?? [];
        return items.map((virtualItem) => ({
            virtualItem,
            row: virtualRows.value[virtualItem.index]
        }));
    });

    const virtualContainerStyle = computed(() => ({
        height: `${virtualizer.value?.getTotalSize?.() ?? 0}px`,
        width: '100%'
    }));

    const rowStyle = (item) => ({
        transform: `translateY(${item.virtualItem.start}px)`
    });

    function getSmallGroupIconUrl(url) {
        return convertFileUrlToImageUrl(url);
    }

    function toggleGroupSidebarCollapse(groupId) {
        groupInstancesCfg.value[groupId].isCollapsed = !groupInstancesCfg.value[groupId].isCollapsed;
    }

    function getGroupId(group) {
        return group[0]?.group?.groupId || '';
    }

    onMounted(() => {
        nextTick(() => {
            virtualizer.value?.measure?.();
        });
    });

    watch(virtualRows, () => {
        nextTick(() => {
            virtualizer.value?.measure?.();
        });
    });
</script>
