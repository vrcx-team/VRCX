<template>
    <div class="x-friend-list" style="padding: 10px 5px">
        <template v-for="(group, index) in groupedGroupInstances">
            <div
                :key="getGroupId(group)"
                class="x-friend-group x-link"
                :style="{ paddingTop: index === 0 ? '0px' : '10px' }">
                <div @click="toggleGroupSidebarCollapse(getGroupId(group))" style="display: flex; align-items: center">
                    <i
                        class="el-icon-arrow-right"
                        :style="{
                            transform: groupInstancesCfg[getGroupId(group)].isCollapsed ? '' : 'rotate(90deg)',
                            transition: 'transform 0.3s'
                        }"></i>
                    <span style="margin-left: 5px">{{ group[0].group.name }} – {{ group.length }}</span>
                </div>
            </div>

            <template v-if="!groupInstancesCfg[getGroupId(group)].isCollapsed">
                <div
                    v-for="ref in group"
                    :key="ref.instance.id"
                    class="x-friend-item"
                    @click="showGroupDialog(ref.instance.ownerId)">
                    <template v-if="isAgeGatedInstancesVisible || !(ref.ageGate || ref.location?.includes('~ageGate'))">
                        <div class="avatar">
                            <img v-lazy="getSmallGroupIconUrl(ref.group.iconUrl)" />
                        </div>
                        <div class="detail">
                            <span class="name">
                                <span v-text="ref.group.name"></span>
                                <span style="font-weight: normal; margin-left: 5px"
                                    >({{ ref.instance.userCount }}/{{ ref.instance.capacity }})</span
                                >
                            </span>
                            <Location class="extra" :location="ref.instance.location" :link="false" />
                        </div>
                    </template>
                </div>
            </template>
        </template>
    </div>
</template>

<script setup>
    import { storeToRefs } from 'pinia';
    import { computed, ref } from 'vue';
    import { convertFileUrlToImageUrl } from '../../../shared/utils';
    import { useAppearanceSettingsStore, useGroupStore } from '../../../stores';

    const { isAgeGatedInstancesVisible } = storeToRefs(useAppearanceSettingsStore());
    const { showGroupDialog, sortGroupInstancesByInGame } = useGroupStore();
    const { groupInstances } = storeToRefs(useGroupStore());

    defineProps({
        groupOrder: {
            type: Array,
            default: () => []
        }
    });

    const groupInstancesCfg = ref({});

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

    function getSmallGroupIconUrl(url) {
        return convertFileUrlToImageUrl(url);
    }

    function toggleGroupSidebarCollapse(groupId) {
        groupInstancesCfg.value[groupId].isCollapsed = !groupInstancesCfg.value[groupId].isCollapsed;
    }

    function getGroupId(group) {
        return group[0]?.group?.groupId || '';
    }
</script>

<style scoped>
    .x-link:hover {
        text-decoration: none;
    }
    .x-link:hover span {
        text-decoration: underline;
    }
</style>
