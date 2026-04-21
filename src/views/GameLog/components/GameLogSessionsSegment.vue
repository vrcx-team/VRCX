<template>
    <div class="border-b border-border last:border-b-0" :class="{ 'border-b-0': isLast }">
        <!-- Session header: sticky + clickable to collapse -->
        <button
            type="button"
            class="sticky top-0 z-[5] flex items-center gap-2 px-3 py-2 bg-muted/80 backdrop-blur-sm w-full text-left border-none cursor-pointer hover:bg-muted transition-colors border-b border-border"
            @click="collapsed = !collapsed">
            <ChevronRight
                class="size-3.5 shrink-0 text-muted-foreground transition-transform duration-150"
                :class="{ 'rotate-90': !collapsed }" />
            <Location
                :location="segment.location"
                :hint="segment.worldName"
                :grouphint="segment.groupName"
                class="text-sm min-w-0"
                enable-context-menu
                @click.stop />
            <span class="shrink-0 text-muted-foreground text-[0.6875rem]">
                {{ formatTime(segment.created_at) }}
            </span>
            <Badge v-if="durationText" variant="outline" class="text-[0.625rem] font-tabular-nums h-4 px-1">
                {{ durationText }}
            </Badge>
            <Badge v-else-if="showCurrentBadge" variant="outline" class="text-[0.625rem] h-4 px-1">
                {{ t('common.current_session') }}
            </Badge>
            <div
                v-if="segment.events && segment.events.length > 0"
                class="flex items-center gap-2 text-muted-foreground text-[0.6875rem] ml-auto shrink-0">
                <span
                    v-if="joinCount"
                    class="flex items-center gap-0.5"
                    :title="t('view.game_log.filters.OnPlayerJoined')">
                    <UserPlus class="size-3" /> {{ joinCount }}
                </span>
                <span
                    v-if="leftCount"
                    class="flex items-center gap-0.5"
                    :title="t('view.game_log.filters.OnPlayerLeft')">
                    <UserMinus class="size-3" /> {{ leftCount }}
                </span>
                <span v-if="videoCount" class="flex items-center gap-0.5" :title="t('view.game_log.filters.VideoPlay')">
                    <Play class="size-3" /> {{ videoCount }}
                </span>
            </div>
        </button>

        <!-- Session events list -->
        <div v-if="!collapsed && segment.events && segment.events.length > 0" class="py-1 px-1">
            <GameLogSessionsEvent v-for="(event, idx) in segment.events" :key="idx" :event="event" />
        </div>
    </div>
</template>

<script setup>
    import { computed, ref } from 'vue';
    import { ChevronRight, Play, UserMinus, UserPlus } from 'lucide-vue-next';
    import { useI18n } from 'vue-i18n';

    import { Badge } from '../../../components/ui/badge';
    import { useGameStore } from '../../../stores';
    import { formatDateFilter, timeToText } from '../../../shared/utils';
    import GameLogSessionsEvent from './GameLogSessionsEvent.vue';
    import Location from '../../../components/Location.vue';

    const { t } = useI18n();
    const gameStore = useGameStore();

    const props = defineProps({
        segment: {
            type: Object,
            required: true
        },
        isLast: {
            type: Boolean,
            default: false
        },
        isLatest: {
            type: Boolean,
            default: false
        }
    });

    const collapsed = ref(false);

    const durationText = computed(() => {
        if (!props.segment.duration || props.segment.duration <= 0) {
            return '';
        }
        return timeToText(props.segment.duration);
    });

    const showCurrentBadge = computed(() => props.isLatest && gameStore.isGameRunning && !durationText.value);

    const joinCount = computed(() => {
        if (!props.segment.events) return 0;
        let n = 0;
        for (const e of props.segment.events) {
            if (e.type === 'OnPlayerJoined') n++;
            else if (e.type === 'JoinGroup') n += e.count;
        }
        return n;
    });

    const leftCount = computed(() => {
        if (!props.segment.events) return 0;
        let n = 0;
        for (const e of props.segment.events) {
            if (e.type === 'OnPlayerLeft') n++;
            else if (e.type === 'LeftGroup') n += e.count;
        }
        return n;
    });

    const videoCount = computed(() => {
        if (!props.segment.events) return 0;
        let n = 0;
        for (const e of props.segment.events) {
            if (e.type === 'VideoPlay') n++;
        }
        return n;
    });

    function formatTime(dateStr) {
        return formatDateFilter(dateStr, 'long');
    }
</script>
