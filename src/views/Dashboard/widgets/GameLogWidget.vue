<template>
    <div class="flex h-full min-h-0 flex-col">
        <WidgetHeader
            :title="t('dashboard.widget.game_log')"
            icon="ri-history-line"
            route-name="game-log" />

        <div class="min-h-0 flex-1 overflow-y-auto">
            <template v-if="filteredData.length">
                <div
                    v-for="(item, index) in filteredData"
                    :key="`${item.type}-${item.created_at}-${index}`"
                    class="flex items-center gap-1.5 border-b border-border/30 px-2.5 py-0.75 text-[13px] leading-snug hover:bg-accent/50"
                    :class="{ 'border-l-2 border-l-chart-4': item.isFavorite }">
                    <span class="shrink-0 text-[11px] tabular-nums text-muted-foreground">{{ formatTime(item.created_at) }}</span>

                    <template v-if="item.type === 'Location'">
                        <span class="truncate font-medium text-foreground">🌍 {{ item.worldName || item.location }}</span>
                    </template>
                    <template v-else-if="item.type === 'OnPlayerJoined'">
                        <span class="shrink-0 font-semibold text-chart-2">→</span>
                        <span
                            class="shrink-0 max-w-[140px] cursor-pointer truncate font-medium hover:underline"
                            :style="item.tagColour ? { color: item.tagColour } : null"
                            @click="openUser(item.userId)">{{ item.displayName }}</span>
                    </template>
                    <template v-else-if="item.type === 'OnPlayerLeft'">
                        <span class="shrink-0 font-semibold text-muted-foreground/60">←</span>
                        <span
                            class="shrink-0 max-w-[140px] cursor-pointer truncate font-medium hover:underline"
                            :style="item.tagColour ? { color: item.tagColour } : null"
                            @click="openUser(item.userId)">{{ item.displayName }}</span>
                    </template>
                    <template v-else-if="item.type === 'VideoPlay'">
                        <span class="truncate text-muted-foreground">🎬 {{ item.videoName || item.videoUrl }}</span>
                    </template>
                    <template v-else-if="item.type === 'PortalSpawn'">
                        <span class="shrink-0 max-w-[140px] cursor-pointer truncate font-medium hover:underline" @click="openUser(item.userId)">{{ item.displayName }}</span>
                        <span class="truncate text-muted-foreground">🌀 {{ item.worldName || '' }}</span>
                    </template>
                    <template v-else>
                        <span class="shrink-0 max-w-[140px] truncate font-medium">{{ item.displayName }}</span>
                        <span class="truncate text-muted-foreground">{{ item.type }}</span>
                    </template>
                </div>
            </template>
            <div v-else class="flex h-full items-center justify-center text-[13px] text-muted-foreground">
                {{ t('dashboard.widget.no_data') }}
            </div>
        </div>
    </div>
</template>

<script setup>
    import { computed, onMounted, shallowRef, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { database } from '@/services/database';
    import { showUserDialog } from '@/coordinators/userCoordinator';
    import { useFriendStore, useGameLogStore } from '@/stores';
    import { watchState } from '@/services/watchState';

    import WidgetHeader from './WidgetHeader.vue';

    const GAMELOG_TYPES = ['Location', 'OnPlayerJoined', 'OnPlayerLeft', 'VideoPlay', 'PortalSpawn', 'Event', 'External'];

    const props = defineProps({
        config: {
            type: Object,
            default: () => ({})
        }
    });

    const { t } = useI18n();
    const friendStore = useFriendStore();
    const gameLogStore = useGameLogStore();

    const widgetData = shallowRef([]);
    const maxEntries = 100;

    const activeFilters = computed(() => {
        if (props.config.filters && Array.isArray(props.config.filters) && props.config.filters.length > 0) {
            return props.config.filters;
        }
        return GAMELOG_TYPES;
    });

    const filteredData = computed(() => {
        const filters = activeFilters.value;
        return widgetData.value.filter((item) => filters.includes(item.type));
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
        if (!dateStr) return '';
        const date = new Date(dateStr);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${hours}:${minutes}`;
    }

    function openUser(userId) {
        if (userId) {
            showUserDialog(userId);
        }
    }

    defineExpose({ GAMELOG_TYPES });
</script>
