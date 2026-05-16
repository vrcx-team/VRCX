<template>
    <div class="x-container x-container--auto-height">
        <div class="flex items-center gap-2 mb-2 shrink-0 flex-wrap border-b border-border pb-2">
            <button
                class="shrink-0 rounded border border-border px-2 py-0.5 text-xs text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                @click="clearLogEntries">
                {{ t('view.api_log.clear') }}
            </button>
            <TooltipWrapper side="bottom" :content="t('view.game_log.aget_tooltip')">
                <span class="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    AGET/H: {{ agetPerHour }}
                </span>
            </TooltipWrapper>
            <span class="shrink-0 rounded border border-border px-1.5 py-0.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                GETs: {{ activityCounters.totalGetCount }}
            </span>
            <span class="ml-auto text-xs text-muted-foreground tabular-nums">
                {{ logEntries.length }} / 2000
            </span>
        </div>

        <div
            ref="scrollRef"
            class="flex-1 overflow-y-auto font-mono text-xs"
            @scroll="handleScroll">
            <div
                v-if="logEntries.length === 0"
                class="flex h-full items-center justify-center text-muted-foreground">
                {{ t('view.api_log.no_entries') }}
            </div>
            <template v-else>
                <div
                    v-for="entry in logEntries"
                    :key="entry.id"
                    class="flex items-center gap-2 px-1 py-px border-b border-border/20 hover:bg-accent/30">
                    <span class="shrink-0 tabular-nums text-muted-foreground">{{ formatTime(entry.ts) }}</span>
                    <span :class="methodClass(entry.method)" class="shrink-0 w-14 rounded px-1 text-center font-bold leading-4">
                        {{ entry.method }}
                    </span>
                    <span class="min-w-0 flex-1 truncate">{{ entry.endpoint }}</span>
                    <span :class="statusClass(entry.status)" class="shrink-0 tabular-nums font-bold">
                        {{ entry.status }}
                    </span>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
    import { computed, nextTick, ref, watch } from 'vue';
    import { useI18n } from 'vue-i18n';

    import { TooltipWrapper } from '../../components/ui/tooltip';
    import {
        activityCounters,
        clearLogEntries,
        logEntries,
        sessionStart
    } from '../../services/activityCounters.js';

    const { t } = useI18n();

    const scrollRef = ref(null);
    const isAtBottom = ref(true);

    const agetPerHour = computed(() => {
        const hours = Math.max((Date.now() - sessionStart) / 3_600_000, 1 / 3600);
        return Math.round(activityCounters.totalGetCount / hours);
    });

    function formatTime(ts) {
        return new Date(ts).toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false
        });
    }

    function methodClass(method) {
        switch (method) {
            case 'GET':
                return 'text-muted-foreground';
            case 'POST':
                return 'text-blue-500';
            case 'PUT':
                return 'text-orange-500';
            case 'DELETE':
                return 'text-red-500';
            case 'PATCH':
                return 'text-yellow-500';
            default:
                return 'text-muted-foreground';
        }
    }

    function statusClass(status) {
        if (status >= 200 && status < 300) return 'text-green-500';
        if (status >= 300 && status < 400) return 'text-yellow-500';
        if (status >= 400 && status < 500) return 'text-orange-500';
        if (status >= 500) return 'text-red-500';
        return 'text-muted-foreground';
    }

    function handleScroll() {
        const el = scrollRef.value;
        if (!el) return;
        isAtBottom.value = el.scrollHeight - el.scrollTop - el.clientHeight < 60;
    }

    watch(
        () => logEntries.length,
        () => {
            if (isAtBottom.value) {
                nextTick(() => {
                    if (scrollRef.value) {
                        scrollRef.value.scrollTop = scrollRef.value.scrollHeight;
                    }
                });
            }
        }
    );
</script>
