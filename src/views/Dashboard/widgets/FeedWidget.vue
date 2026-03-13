<template>
    <div class="flex h-full min-h-0 flex-col">
        <WidgetHeader :title="t('dashboard.widget.feed')" icon="ri-rss-line" route-name="feed" />

        <div class="min-h-0 flex-1 overflow-y-auto" ref="listRef">
            <Table v-if="filteredData.length" class="is-compact-table">
                <TableBody>
                    <TableRow
                        v-for="(item, index) in filteredData"
                        :key="`${item.type}-${item.created_at}-${index}`"
                        class="cursor-default"
                        :class="{ 'border-l-2 border-l-chart-4': item.isFavorite }">
                        <TableCell class="w-28 text-[11px] tabular-nums text-muted-foreground">
                            <TooltipWrapper :content="formatExactTime(item.created_at)" side="top">
                                <span>{{ formatTime(item.created_at) }}</span>
                            </TooltipWrapper>
                        </TableCell>
                        <TableCell v-if="showType" class="w-16 text-[11px] text-muted-foreground">
                            {{ item.type }}
                        </TableCell>
                        <TableCell class="truncate">
                            <template v-if="item.type === 'GPS'">
                                <MapPin class="mr-1 inline-block h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span
                                    class="cursor-pointer font-medium hover:underline"
                                    @click="openUser(item.userId)"
                                    >{{ item.displayName }}</span
                                >
                                <span class="text-muted-foreground"> → </span>
                                <Location
                                    class="inline [&>div]:inline-flex"
                                    :location="item.location"
                                    :hint="item.worldName"
                                    :grouphint="item.groupName"
                                    disable-tooltip />
                            </template>
                            <template v-else-if="item.type === 'Online'">
                                <i class="x-user-status online mr-1"></i>
                                <span
                                    class="cursor-pointer font-medium hover:underline"
                                    @click="openUser(item.userId)"
                                    >{{ item.displayName }}</span
                                >
                                <template v-if="item.location">
                                    <span class="text-muted-foreground"> → </span>
                                    <Location
                                        class="inline [&>div]:inline-flex"
                                        :location="item.location"
                                        :hint="item.worldName"
                                        :grouphint="item.groupName"
                                        disable-tooltip />
                                </template>
                            </template>
                            <template v-else-if="item.type === 'Offline'">
                                <i class="x-user-status mr-1"></i>
                                <span
                                    class="cursor-pointer font-medium text-muted-foreground/70 hover:underline"
                                    @click="openUser(item.userId)"
                                    >{{ item.displayName }}</span
                                >
                            </template>
                            <template v-else-if="item.type === 'Status'">
                                <i class="x-user-status mr-1" :class="statusClass(item.status)"></i>
                                <span
                                    class="cursor-pointer font-medium hover:underline"
                                    @click="openUser(item.userId)"
                                    >{{ item.displayName }}</span
                                >
                                <span class="text-muted-foreground"> {{ item.statusDescription }}</span>
                            </template>
                            <template v-else-if="item.type === 'Avatar'">
                                <Box class="mr-1 inline-block h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span
                                    class="cursor-pointer font-medium hover:underline"
                                    @click="openUser(item.userId)"
                                    >{{ item.displayName }}</span
                                >
                                <span class="text-muted-foreground"> → {{ item.avatarName }}</span>
                            </template>
                            <template v-else-if="item.type === 'Bio'">
                                <Pencil class="mr-1 inline-block h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span
                                    class="cursor-pointer font-medium hover:underline"
                                    @click="openUser(item.userId)"
                                    >{{ item.displayName }}</span
                                >
                                <span class="ml-1 text-muted-foreground">{{ t('dashboard.widget.feed_bio') }}</span>
                            </template>
                            <template v-else>
                                <span
                                    class="cursor-pointer font-medium hover:underline"
                                    @click="openUser(item.userId)"
                                    >{{ item.displayName }}</span
                                >
                                <span class="text-muted-foreground"> {{ item.type }}</span>
                            </template>
                        </TableCell>
                    </TableRow>
                </TableBody>
            </Table>
            <div v-else class="flex h-full items-center justify-center text-[13px] text-muted-foreground">
                {{ t('dashboard.widget.no_data') }}
            </div>
        </div>
    </div>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { Box, MapPin, Pencil } from 'lucide-vue-next';

    import { statusClass } from '@/shared/utils/user';
    import { formatDateFilter } from '@/shared/utils';
    import { showUserDialog } from '@/coordinators/userCoordinator';
    import { useFeedStore } from '@/stores';

    import Location from '@/components/Location.vue';
    import { TooltipWrapper } from '@/components/ui/tooltip';
    import WidgetHeader from './WidgetHeader.vue';
    import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table';

    const FEED_TYPES = ['GPS', 'Online', 'Offline', 'Status', 'Avatar', 'Bio'];

    const props = defineProps({
        config: {
            type: Object,
            default: () => ({})
        }
    });

    const { t } = useI18n();
    const feedStore = useFeedStore();
    const listRef = ref(null);

    const activeFilters = computed(() => {
        if (props.config.filters && Array.isArray(props.config.filters) && props.config.filters.length > 0) {
            return props.config.filters;
        }
        return FEED_TYPES;
    });

    const showType = computed(() => {
        return props.config.showType || false;
    });

    const filteredData = computed(() => {
        const filters = activeFilters.value;
        return feedStore.feedTableData.filter((item) => filters.includes(item.type)).slice(0, 100);
    });

    function formatTime(dateStr) {
        return formatDateFilter(dateStr, 'short');
    }

    function formatExactTime(dateStr) {
        return formatDateFilter(dateStr, 'long');
    }

    function openUser(userId) {
        if (userId) {
            showUserDialog(userId);
        }
    }

    defineExpose({ FEED_TYPES });
</script>
