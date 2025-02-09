<template>
    <div class="x-friend-list" style="padding: 10px 5px">
        <template v-for="(group, index) in groupedGroupInstances">
            <div
                :key="getGroupId(group)"
                class="x-friend-group x-link"
                :style="{ paddingTop: index === 0 ? '0px' : '10px' }"
            >
                <div @click="toggleGroupSidebarCollapse(getGroupId(group))" style="display: flex; align-items: center">
                    <i
                        class="el-icon-arrow-right"
                        :style="{
                            transform: groupInstancesCfg[getGroupId(group)].isCollapsed ? '' : 'rotate(90deg)',
                            transition: 'transform 0.3s'
                        }"
                    ></i>
                    <span style="margin-left: 5px">{{ group[0].group.name }} – {{ group.length }}</span>
                </div>
            </div>

            <div
                v-if="!groupInstancesCfg[getGroupId(group)].isCollapsed"
                v-for="ref in group"
                :key="ref.instance.id"
                class="x-friend-item"
                @click="showGroupDialog(ref.instance.ownerId)"
            >
                <div class="avatar">
                    <img v-lazy="ref.group.iconUrl" />
                </div>
                <div class="detail">
                    <span class="name">
                        <span v-text="ref.group.name"></span>
                        <span style="font-weight: normal; margin-left: 5px"
                            >({{ ref.instance.userCount }}/{{ ref.instance.capacity }})</span
                        >
                    </span>
                    <location class="extra" :location="ref.instance.location" :link="false" />
                </div>
            </div>
        </template>
    </div>
</template>

<script>
    export default {
        name: 'GroupsSidebar',
        props: {
            groupInstances: {
                type: Array,
                default: () => []
            },
            groupOrder: {
                type: Array,
                default: () => []
            }
        },
        data() {
            return {
                // temporary, sort feat not yet done
                // may be the data structure to be changed
                groupInstancesCfg: []
            };
        },
        computed: {
            groupedGroupInstances() {
                const groupMap = new Map();

                this.groupInstances.forEach((ref) => {
                    const groupId = ref.group.groupId;
                    if (!groupMap.has(groupId)) {
                        groupMap.set(groupId, []);
                    }
                    groupMap.get(groupId).push(ref);

                    if (!this.groupInstancesCfg[ref.group?.groupId]) {
                        this.groupInstancesCfg = {
                            [ref.group.groupId]: {
                                isCollapsed: false
                            },
                            ...this.groupInstancesCfg
                        };
                    }
                });
                return Array.from(groupMap.values()).sort(this.sortGroupInstancesByInGame);
            }
        },
        methods: {
            toggleGroupSidebarCollapse(groupId) {
                this.groupInstancesCfg[groupId].isCollapsed = !this.groupInstancesCfg[groupId].isCollapsed;
            },
            showGroupDialog(ownerId) {
                this.$emit('show-group-dialog', ownerId);
            },
            getGroupId(group) {
                return group[0]?.group?.groupId || '';
            },
            sortGroupInstancesByInGame(a, b) {
                var aIndex = this.groupOrder.indexOf(a[0]?.group?.id);
                var bIndex = this.groupOrder.indexOf(b[0]?.group?.id);
                if (aIndex === -1 && bIndex === -1) {
                    return 0;
                }
                if (aIndex === -1) {
                    return 1;
                }
                if (bIndex === -1) {
                    return -1;
                }
                return aIndex - bIndex;
            }
        }
    };
</script>

<style scoped>
    .x-link:hover {
        text-decoration: none;
    }
    .x-link:hover span {
        text-decoration: underline;
    }
</style>
