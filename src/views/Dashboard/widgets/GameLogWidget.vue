<template>
    <div class="flex h-full min-h-0 flex-col">
        <WidgetHeader :title="t('dashboard.widget.game_log')" icon="ri-history-line" route-name="game-log">
            <DropdownMenu v-if="configUpdater">
                <DropdownMenuTrigger as-child>
                    <Button variant="ghost" size="icon-sm">
                        <Settings class="size-3.5" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" class="w-48">
                    <DropdownMenuCheckboxItem
                        v-for="filterType in GAMELOG_TYPES"
                        :key="filterType"
                        :model-value="isFilterActive(filterType)"
                        @select.prevent
                        @update:modelValue="toggleFilter(filterType)">
                        {{ t(`view.game_log.filters.${filterType}`) }}
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                        :model-value="config.showDetail || false"
                        @select.prevent
                        @update:modelValue="toggleBooleanConfig('showDetail')">
                        {{ t('dashboard.widget.config.detail') }}
                    </DropdownMenuCheckboxItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </WidgetHeader>

        <div class="min-h-0 flex-1 overflow-y-auto">
            <Table v-if="filteredData.length" class="is-compact-table">
                <TableBody>
                    <TableRow
                        v-for="(item, index) in filteredData"
                        :key="`${item.type}-${item.created_at}-${index}`"
                        class="cursor-default hover:bg-transparent"
                        :class="{ 'border-l-2 border-l-chart-4': item.isFavorite }">
                        <TableCell class="w-28 text-[11px] tabular-nums text-muted-foreground">
                            <TooltipWrapper :content="formatExactTime(item.created_at)" side="top">
                                <span>{{ formatTime(item.created_at) }}</span>
                            </TooltipWrapper>
                        </TableCell>
                        <TableCell class="truncate">
                            <template v-if="item.type === 'Location'">
                                <MapPin class="mr-1 inline-block h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <Location
                                    class="inline [&>div]:inline-flex"
                                    :location="item.location"
                                    :hint="item.worldName"
                                    :grouphint="item.groupName"
                                    disable-tooltip />
                            </template>
                            <template v-else-if="item.type === 'OnPlayerJoined'">
                                <LogIn class="mr-1 inline-block h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span
                                    class="cursor-pointer"
                                    :style="item.tagColour ? { color: item.tagColour } : null"
                                    @click="openUser(item.userId)"
                                    >{{ item.displayName }}</span
                                >
                                <span v-if="item.isFriend">{{ item.isFavorite ? '⭐' : '💚' }}</span>
                            </template>
                            <template v-else-if="item.type === 'OnPlayerLeft'">
                                <LogOut class="mr-1 inline-block h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span
                                    class="cursor-pointer text-muted-foreground/70 hover:underline"
                                    :style="item.tagColour ? { color: item.tagColour } : null"
                                    @click="openUser(item.userId)"
                                    >{{ item.displayName }}</span
                                >
                                <span v-if="item.isFriend">{{ item.isFavorite ? '⭐' : '💚' }}</span>
                            </template>
                            <template v-else-if="item.type === 'VideoPlay'">
                                <Video class="mr-1 inline-block h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <TooltipWrapper
                                    :content="
                                        item.videoId
                                            ? `${item.videoId}: ${item.videoName || item.videoUrl}`
                                            : item.videoName || item.videoUrl
                                    "
                                    side="top">
                                    <span>
                                        <span v-if="item.videoId" class="mr-1 text-muted-foreground"
                                            >{{ item.videoId }}:</span
                                        >
                                        <span
                                            v-if="item.videoId !== 'LSMedia' && item.videoId !== 'PopcornPalace'"
                                            class="cursor-pointer text-muted-foreground hover:underline"
                                            @click="openExternalLink(item.videoUrl)"
                                            >{{ item.videoName || item.videoUrl }}</span
                                        >
                                        <span v-else class="text-muted-foreground">{{ item.videoName }}</span>
                                    </span>
                                </TooltipWrapper>
                            </template>
                            <template v-else-if="item.type === 'PortalSpawn'">
                                <Waypoints class="mr-1 inline-block h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                                <span class="cursor-pointer hover:underline" @click="openUser(item.userId)">{{
                                    item.displayName
                                }}</span>
                                <span class="text-muted-foreground"> → </span>
                                <Location
                                    v-if="item.location"
                                    class="inline [&>div]:inline-flex"
                                    :location="item.location"
                                    :hint="item.worldName"
                                    disable-tooltip />
                                <span v-else class="text-muted-foreground">{{ item.worldName || '' }}</span>
                            </template>
                            <template v-else>
                                <TooltipWrapper
                                    v-if="!showDetail"
                                    :content="item.data || item.message || ''"
                                    side="top">
                                    <span>
                                        <span>{{ item.displayName }}</span>
                                        <span class="text-muted-foreground"> {{ item.type }}</span>
                                    </span>
                                </TooltipWrapper>
                                <template v-else>
                                    <span>{{ item.displayName }}</span>
                                    <span class="text-muted-foreground"> {{ item.type }}</span>
                                    <span v-if="item.data || item.message" class="ml-1 text-muted-foreground"
                                        >— {{ item.data || item.message }}</span
                                    >
                                </template>
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
    import { computed, onMounted, shallowRef, watch } from 'vue';
    import { useI18n } from 'vue-i18n';
    import { LogIn, LogOut, MapPin, Settings, Video, Waypoints } from 'lucide-vue-next';

    import { database } from '@/services/database';
    import { showUserDialog } from '@/coordinators/userCoordinator';
    import { useFriendStore, useGameLogStore } from '@/stores';
    import { formatDateFilter, openExternalLink } from '@/shared/utils';
    import { watchState } from '@/services/watchState';

    import { Button } from '@/components/ui/button';
    import {
        DropdownMenu,
        DropdownMenuCheckboxItem,
        DropdownMenuContent,
        DropdownMenuSeparator,
        DropdownMenuTrigger
    } from '@/components/ui/dropdown-menu';
    import Location from '@/components/Location.vue';
    import { TooltipWrapper } from '@/components/ui/tooltip';
    import WidgetHeader from './WidgetHeader.vue';
    import { Table, TableBody, TableRow, TableCell } from '@/components/ui/table';

    const GAMELOG_TYPES = ['Location', 'OnPlayerJoined', 'OnPlayerLeft', 'VideoPlay', 'PortalSpawn', 'Event', 'External'];

    const props = defineProps({
        config: {
            type: Object,
            default: () => ({})
        },
        configUpdater: {
            type: Function,
            default: null
        }
    });

    const { t } = useI18n();
    const friendStore = useFriendStore();
    const gameLogStore = useGameLogStore();

    const widgetData = shallowRef([]);
    const maxEntries = 200;

    const activeFilters = computed(() => {
        if (props.config.filters && Array.isArray(props.config.filters) && props.config.filters.length > 0) {
            return props.config.filters;
        }
        return GAMELOG_TYPES;
    });

    function isFilterActive(filterType) {
        const filters = props.config.filters;
        if (!filters || !Array.isArray(filters) || filters.length === 0) return true;
        return filters.includes(filterType);
    }

    function toggleFilter(filterType) {
        if (!props.configUpdater) return;
        const currentFilters = props.config.filters;
        let filters;
        if (!currentFilters || !Array.isArray(currentFilters) || currentFilters.length === 0) {
            filters = GAMELOG_TYPES.filter((f) => f !== filterType);
        } else if (currentFilters.includes(filterType)) {
            filters = currentFilters.filter((f) => f !== filterType);
            if (filters.length === 0) filters = [];
        } else {
            filters = [...currentFilters, filterType];
            if (filters.length === GAMELOG_TYPES.length) filters = [];
        }
        props.configUpdater({ ...props.config, filters });
    }

    function toggleBooleanConfig(key) {
        if (!props.configUpdater) return;
        props.configUpdater({ ...props.config, [key]: !props.config[key] });
    }

    const showDetail = computed(() => {
        return props.config.showDetail || false;
    });

    const filteredData = computed(() => {
        const filters = activeFilters.value;
        return widgetData.value.filter((item) => filters.includes(item.type)).slice(0, maxEntries);
    });

    async function loadInitialData() {
        try {
            const rows = await database.lookupGameLogDatabase([], []);
            for (const row of rows) {
                row.isFriend = row.userId ? friendStore.friends.has(row.userId) : false;
                row.isFavorite = row.userId ? friendStore.localFavoriteFriends.has(row.userId) : false;
            }
            widgetData.value = rows;
        } catch {
            widgetData.value = [];
        }
    }

    watch(
        () => gameLogStore.latestGameLogEntry,
        (entry) => {
            if (!entry) return;
            const newEntry = { ...entry };
            newEntry.isFriend = newEntry.userId ? friendStore.friends.has(newEntry.userId) : false;
            newEntry.isFavorite = newEntry.userId ? friendStore.localFavoriteFriends.has(newEntry.userId) : false;
            widgetData.value = [newEntry, ...widgetData.value];
            if (widgetData.value.length > maxEntries) {
                widgetData.value = widgetData.value.slice(0, maxEntries);
            }
        }
    );

    watch(
        () => watchState.isLoggedIn,
        (isLoggedIn) => {
            if (isLoggedIn) {
                loadInitialData();
            } else {
                widgetData.value = [];
            }
        },
        { flush: 'sync' }
    );

    onMounted(() => {
        if (watchState.isLoggedIn) {
            loadInitialData();
        }
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

    defineExpose({ GAMELOG_TYPES });
</script>
