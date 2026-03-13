<template>
    <div
        class="shrink-0 h-[22px] flex items-center bg-sidebar border-t border-border text-xs select-none overflow-hidden"
        style="font-family: var(--font-mono-cjk)"
        @contextmenu.prevent>
        <ContextMenu>
            <ContextMenuTrigger as-child>
                <div class="flex items-center w-full h-full px-2">
                    <!-- Left section -->
                    <div
                        class="flex items-center flex-1 min-w-0 overflow-hidden [&>*:first-child]:pl-0.5"
                        style="
                            mask-image: linear-gradient(to right, black calc(100% - 20px), transparent 100%);
                            -webkit-mask-image: linear-gradient(to right, black calc(100% - 20px), transparent 100%);
                        ">
                        <TooltipWrapper
                            v-if="visibility.proxy"
                            :content="
                                vrcxStore.proxyServer
                                    ? `${t('status_bar.proxy')}: ${vrcxStore.proxyServer}`
                                    : t('status_bar.proxy')
                            "
                            side="top">
                            <div
                                class="flex items-center gap-1 px-2 h-[22px] whitespace-nowrap border-r border-border cursor-pointer hover:bg-accent"
                                @click="handleProxyClick">
                                <span
                                    class="inline-block size-2 rounded-full shrink-0"
                                    :class="vrcxStore.proxyServer ? 'bg-status-online' : 'bg-status-offline-alt'" />
                                <span class="text-foreground text-[11px]">{{
                                    vrcxStore.proxyServer || t('status_bar.proxy')
                                }}</span>
                            </div>
                        </TooltipWrapper>

                        <TooltipWrapper
                            v-if="!isMacOS && visibility.steamvr"
                            :content="
                                gameStore.isSteamVRRunning
                                    ? t('status_bar.steamvr_running')
                                    : t('status_bar.steamvr_stopped')
                            "
                            side="top">
                            <div class="flex items-center gap-1 px-2 h-[22px] whitespace-nowrap border-r border-border">
                                <span
                                    class="inline-block size-2 rounded-full shrink-0"
                                    :class="
                                        gameStore.isSteamVRRunning ? 'bg-status-online' : 'bg-status-offline-alt'
                                    " />
                                <span class="text-foreground text-[11px]">{{ t('status_bar.steamvr') }}</span>
                            </div>
                        </TooltipWrapper>

                        <HoverCard v-if="!isMacOS && visibility.vrchat" v-model:open="gameHoverOpen" :open-delay="50" :close-delay="50">
                            <HoverCardTrigger as-child>
                                <div class="flex items-center gap-1 px-2 h-[22px] whitespace-nowrap border-r border-border">
                                    <span
                                        class="inline-block size-2 rounded-full shrink-0"
                                        :class="gameStore.isGameRunning ? 'bg-status-online' : 'bg-status-offline-alt'" />
                                    <span class="text-foreground text-[11px]">{{ t('status_bar.game') }}</span>
                                    <span v-if="gameStore.isGameRunning" class="text-[10px] text-foreground">{{
                                        gameSessionText
                                    }}</span>
                                </div>
                            </HoverCardTrigger>
                            <HoverCardContent
                                v-if="gameStore.isGameRunning && userStore.currentUser.$online_for"
                                class="w-auto min-w-[160px] px-3 py-2"
                                side="top"
                                align="start"
                                :side-offset="4">
                                <div class="flex flex-col gap-1">
                                    <div class="flex items-center justify-between gap-3">
                                        <span class="text-[11px] text-muted-foreground">{{ t('status_bar.game_started_at') }}</span>
                                        <span class="text-[11px] text-foreground">{{ gameStartedAtText }}</span>
                                    </div>
                                    <div class="flex items-center justify-between gap-3">
                                        <span class="text-[11px] text-muted-foreground">{{ t('status_bar.game_session_duration') }}</span>
                                        <span class="text-[11px] text-foreground">{{ gameSessionDetailText }}</span>
                                    </div>
                                </div>
                            </HoverCardContent>
                            <HoverCardContent
                                v-else-if="!gameStore.isGameRunning && gameStore.lastSessionDurationMs > 0"
                                class="w-auto min-w-[160px] px-3 py-2"
                                side="top"
                                align="start"
                                :side-offset="4">
                                <div class="flex flex-col gap-1">
                                    <div class="flex items-center justify-between gap-3">
                                        <span class="text-[11px] text-muted-foreground">{{ t('status_bar.game_last_session') }}</span>
                                        <span class="text-[11px] text-foreground">{{ lastSessionText }}</span>
                                    </div>
                                    <div class="flex items-center justify-between gap-3">
                                        <span class="text-[11px] text-muted-foreground">{{ t('status_bar.game_last_offline') }}</span>
                                        <span class="text-[11px] text-foreground">{{ lastOfflineTimeText }}</span>
                                    </div>
                                </div>
                            </HoverCardContent>
                        </HoverCard>

                        <HoverCard v-if="visibility.servers" v-model:open="serversHoverOpen">
                            <HoverCardTrigger as-child>
                                <TooltipWrapper
                                    v-if="!vrcStatusStore.hasIssue"
                                    :content="t('status_bar.servers_ok')"
                                    side="top">
                                    <div
                                        class="flex items-center gap-1 px-2 h-[22px] whitespace-nowrap border-r border-border cursor-pointer hover:bg-accent"
                                        @click="vrcStatusStore.openStatusPage()">
                                        <span class="inline-block size-2 rounded-full shrink-0 bg-status-online" />
                                        <span class="text-foreground text-[11px]">{{ t('status_bar.servers') }}</span>
                                    </div>
                                </TooltipWrapper>
                                <div
                                    v-else
                                    class="flex items-center gap-1 px-2 h-[22px] whitespace-nowrap border-r border-border cursor-pointer hover:bg-accent"
                                    @click="vrcStatusStore.openStatusPage()">
                                    <span class="inline-block size-2 rounded-full shrink-0 bg-[#e6a23c]" />
                                    <span class="text-foreground text-[11px]">{{ t('status_bar.servers') }}</span>
                                </div>
                            </HoverCardTrigger>
                            <HoverCardContent
                                v-if="vrcStatusStore.hasIssue"
                                class="w-[280px] px-3 py-2.5"
                                side="top"
                                align="start"
                                :side-offset="4">
                                <div class="flex items-center gap-1.5 mb-1.5">
                                    <span class="inline-block size-2 rounded-full shrink-0 bg-[#e6a23c]" />
                                    <span class="font-semibold text-xs text-foreground">{{
                                        t('status_bar.servers_issue')
                                    }}</span>
                                </div>
                                <p class="text-[11px] text-muted-foreground m-0 leading-[1.4]">
                                    {{ vrcStatusStore.statusText }}
                                </p>
                            </HoverCardContent>
                        </HoverCard>

                        <TooltipWrapper v-if="visibility.ws" :content="wsTooltip" side="top">
                            <div class="flex items-center gap-1 px-2 h-[22px] whitespace-nowrap border-r border-border">
                                <span
                                    class="inline-block size-2 rounded-full shrink-0"
                                    :class="wsState.connected ? 'bg-status-online' : 'bg-status-offline-alt'" />
                                <span class="text-foreground text-[11px]">WebSocket</span>
                                <canvas ref="wsCanvasRef" class="shrink-0 rounded-sm" />
                                <span class="text-[10px] text-foreground">{{
                                    t('status_bar.ws_avg_per_minute', { count: msgsPerMinuteAvg })
                                }}</span>
                            </div>
                        </TooltipWrapper>
                    </div>

                    <!-- Right section -->
                    <div class="flex items-center shrink-0 ml-auto [&>*:last-child]:border-r-0 [&>*:last-child]:pr-0.5">
                        <template v-if="visibility.clocks">
                            <Popover
                                v-for="(clock, idx) in visibleClocks"
                                :key="idx"
                                v-model:open="clockPopoverOpen[idx]">
                                <PopoverTrigger as-child>
                                    <div
                                        class="flex items-center gap-1 px-2 h-[22px] whitespace-nowrap border-r border-border cursor-pointer hover:bg-accent">
                                        <span class="text-[10px] text-foreground">{{ formatClock(clock) }}</span>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent class="w-[280px]" side="top" align="center">
                                    <div class="flex flex-col gap-2 p-1">
                                        <label class="text-xs font-medium">{{ t('status_bar.timezone') }}</label>
                                        <Select
                                            :model-value="String(clock.offset)"
                                            @update:modelValue="(offset) => updateClockTimezone(idx, offset)">
                                            <SelectTrigger size="sm">
                                                <SelectValue :placeholder="t('status_bar.timezone')" />
                                            </SelectTrigger>
                                            <SelectContent class="max-h-60">
                                                <SelectGroup>
                                                    <SelectItem
                                                        v-for="opt in timezoneOptions"
                                                        :key="opt.value"
                                                        :value="String(opt.value)">
                                                        <div class="flex w-full items-center justify-end font-mono">
                                                            {{ opt.label }}
                                                        </div>
                                                    </SelectItem>
                                                </SelectGroup>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </PopoverContent>
                            </Popover>
                        </template>

                        <TooltipWrapper
                            v-if="visibility.zoom"
                            :content="t('status_bar.zoom_tooltip')"
                            side="top"
                            :disabled="zoomEditing">
                            <div
                                class="flex items-center gap-1 px-2 h-[22px] whitespace-nowrap border-r border-border cursor-pointer hover:bg-accent"
                                @click="toggleZoomEdit">
                                <template v-if="zoomEditing">
                                    <span class="text-[10px] text-foreground">{{ t('status_bar.zoom') }}</span>
                                    <NumberField
                                        v-model="zoomLevel"
                                        :step="1"
                                        :format-options="{ maximumFractionDigits: 0 }"
                                        class="w-20"
                                        @update:modelValue="setZoomLevel">
                                        <NumberFieldContent>
                                            <NumberFieldDecrement />
                                            <NumberFieldInput
                                                ref="zoomInputRef"
                                                class="h-[18px] text-[11px] px-0.5 text-center"
                                                @blur="zoomEditing = false"
                                                @keydown.enter="zoomEditing = false"
                                                @keydown.escape="zoomEditing = false" />
                                            <NumberFieldIncrement />
                                        </NumberFieldContent>
                                    </NumberField>
                                </template>
                                <template v-else>
                                    <span class="text-[10px] text-foreground">{{ t('status_bar.zoom') }}</span>
                                    <span class="text-[10px] text-foreground">{{ zoomLevel }}%</span>
                                </template>
                            </div>
                        </TooltipWrapper>

                        <TooltipWrapper v-if="visibility.uptime" :content="t('status_bar.app_uptime')" side="top">
                            <div class="flex items-center gap-1 px-2 h-[22px] whitespace-nowrap border-r border-border">
                                <span class="text-[10px] text-foreground">{{ t('status_bar.app_uptime_short') }}</span>
                                <span class="text-[10px] text-foreground">{{ appUptimeText }}</span>
                            </div>
                        </TooltipWrapper>
                    </div>
                </div>
            </ContextMenuTrigger>

            <ContextMenuContent>
                <ContextMenuCheckboxItem
                    v-if="!isMacOS"
                    :model-value="visibility.vrchat"
                    @update:model-value="toggleVisibility('vrchat')">
                    {{ t('status_bar.game') }}
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem
                    :model-value="visibility.servers"
                    @update:model-value="toggleVisibility('servers')">
                    {{ t('status_bar.servers') }}
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem
                    v-if="!isMacOS"
                    :model-value="visibility.steamvr"
                    @update:model-value="toggleVisibility('steamvr')">
                    {{ t('status_bar.steamvr') }}
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem
                    :model-value="visibility.proxy"
                    @update:model-value="toggleVisibility('proxy')">
                    {{ t('status_bar.proxy') }}
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem :model-value="visibility.ws" @update:model-value="toggleVisibility('ws')">
                    WebSocket
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem
                    :model-value="visibility.uptime"
                    @update:model-value="toggleVisibility('uptime')">
                    {{ t('status_bar.app_uptime_short') }}
                </ContextMenuCheckboxItem>
                <ContextMenuCheckboxItem
                    v-if="!isMacOS"
                    :model-value="visibility.zoom"
                    @update:model-value="toggleVisibility('zoom')">
                    {{ t('status_bar.zoom') }}
                </ContextMenuCheckboxItem>
                <ContextMenuSeparator />
                <ContextMenuSub>
                    <ContextMenuSubTrigger>{{ t('status_bar.clocks') }}</ContextMenuSubTrigger>
                    <ContextMenuSubContent>
                        <ContextMenuRadioGroup :model-value="String(clockCount)" @update:modelValue="setClockCount">
                            <ContextMenuRadioItem value="0">
                                {{ t('status_bar.clocks_none') }}
                            </ContextMenuRadioItem>
                            <ContextMenuRadioItem value="1"> 1 {{ t('status_bar.clock') }} </ContextMenuRadioItem>
                            <ContextMenuRadioItem value="2">
                                2 {{ t('status_bar.clocks_label') }}
                            </ContextMenuRadioItem>
                            <ContextMenuRadioItem value="3">
                                3 {{ t('status_bar.clocks_label') }}
                            </ContextMenuRadioItem>
                        </ContextMenuRadioGroup>
                    </ContextMenuSubContent>
                </ContextMenuSub>
            </ContextMenuContent>
        </ContextMenu>
    </div>
</template>

<script setup>
    import {
        ContextMenu,
        ContextMenuCheckboxItem,
        ContextMenuContent,
        ContextMenuRadioGroup,
        ContextMenuRadioItem,
        ContextMenuSeparator,
        ContextMenuSub,
        ContextMenuSubContent,
        ContextMenuSubTrigger,
        ContextMenuTrigger
    } from '@/components/ui/context-menu';
    import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import {
        NumberField,
        NumberFieldContent,
        NumberFieldDecrement,
        NumberFieldIncrement,
        NumberFieldInput
    } from '@/components/ui/number-field';
    import { useGameStore, useGeneralSettingsStore, useUserStore, useVrcStatusStore, useVrcxStore } from '@/stores';
    import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';
    import { timeToText } from '@/shared/utils';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { useIntervalFn, useNow } from '@vueuse/core';
    import { TooltipWrapper } from '@/components/ui/tooltip';
    import { useI18n } from 'vue-i18n';
    import { wsState } from '@/services/websocket';

    import dayjs from 'dayjs';
    import timezone from 'dayjs/plugin/timezone';
    import utc from 'dayjs/plugin/utc';

    import {
        defaultVisibility,
        formatAppUptime,
        formatUtcHour,
        normalizeClock,
        normalizeUtcHour,
        parseClockOffset
    } from './statusBarUtils';

    import configRepository from '../services/config';

    dayjs.extend(utc);
    dayjs.extend(timezone);

    const { t } = useI18n();

    const isMacOS = computed(() => navigator.platform.includes('Mac'));

    const gameStore = useGameStore();
    const userStore = useUserStore();
    const vrcxStore = useVrcxStore();
    const vrcStatusStore = useVrcStatusStore();
    const generalSettingsStore = useGeneralSettingsStore();

    // --- Game session timer ---
    const gameHoverOpen = ref(false);

    const gameSessionText = computed(() => {
        if (!gameStore.isGameRunning || !userStore.currentUser.$online_for) return '';
        const elapsed = now.value - userStore.currentUser.$online_for;
        return elapsed > 0 ? timeToText(elapsed) : '';
    });

    const gameStartedAtText = computed(() => {
        if (!userStore.currentUser.$online_for) return '-';
        return dayjs(userStore.currentUser.$online_for).format('MM/DD HH:mm');
    });

    const gameSessionDetailText = computed(() => {
        if (!gameStore.isGameRunning || !userStore.currentUser.$online_for) return '-';
        const elapsed = now.value - userStore.currentUser.$online_for;
        return elapsed > 0 ? timeToText(elapsed, true) : '-';
    });

    const lastSessionText = computed(() => {
        if (gameStore.lastSessionDurationMs <= 0) return '-';
        return timeToText(gameStore.lastSessionDurationMs);
    });

    const lastOfflineTimeText = computed(() => {
        if (gameStore.lastOfflineAt <= 0) return '-';
        return dayjs(gameStore.lastOfflineAt).format('MM/DD HH:mm');
    });

    // --- Servers status HoverCard ---
    const serversHoverOpen = ref(false);
    let serversHoverTimer = null;

    watch(
        () => vrcStatusStore.hasIssue,
        (hasIssue) => {
            if (hasIssue && visibility.servers) {
                serversHoverOpen.value = true;
                clearTimeout(serversHoverTimer);
                serversHoverTimer = setTimeout(() => {
                    serversHoverOpen.value = false;
                }, 5000);
            } else {
                serversHoverOpen.value = false;
                clearTimeout(serversHoverTimer);
            }
        }
    );

    const VISIBILITY_KEY = 'VRCX_statusBarVisibility';

    const visibility = reactive({ ...defaultVisibility });

    /**
     *
     * @param key
     */
    function toggleVisibility(key) {
        visibility[key] = !visibility[key];
        configRepository.setString(VISIBILITY_KEY, JSON.stringify(visibility));
    }

    // --- WebSocket message rate + sparkline ---

    const GRAPH_POINTS = 60;
    const WS_CANVAS_WIDTH = 48;
    const WS_CANVAS_HEIGHT = 12;
    const msgHistory = ref(new Array(GRAPH_POINTS).fill(0));
    const msgsLastMinute = ref(0);
    let lastMsgCount = wsState.messageCount;

    const wsCanvasRef = ref(null);
    const now = useNow({ interval: 1000 });

    useIntervalFn(() => {
        const delta = wsState.messageCount - lastMsgCount;
        lastMsgCount = wsState.messageCount;

        const arr = msgHistory.value;
        arr.shift();
        arr.push(delta);
        msgHistory.value = arr;

        // Sum of messages in the last 60 seconds
        msgsLastMinute.value = arr.reduce((a, b) => a + b, 0);

        drawSparkline();
    }, 1000);

    const msgsPerMinuteAvg = computed(() => Math.round(msgsLastMinute.value));

    /**
     *
     */
    function drawSparkline() {
        const canvas = wsCanvasRef.value;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = Math.floor(WS_CANVAS_WIDTH * dpr);
        canvas.height = Math.floor(WS_CANVAS_HEIGHT * dpr);
        canvas.style.width = `${WS_CANVAS_WIDTH}px`;
        canvas.style.height = `${WS_CANVAS_HEIGHT}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        const w = WS_CANVAS_WIDTH;
        const h = WS_CANVAS_HEIGHT;
        const data = msgHistory.value;

        const fg = resolveCssColor('--foreground', '#cfd3dc');
        ctx.clearRect(0, 0, w, h);

        const max = Math.max(...data, 1);
        const step = w / (data.length - 1);

        // Only draw the sparkline stroke (no background, grid, or fill area)
        ctx.globalAlpha = 0.75;
        ctx.strokeStyle = fg;
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let i = 0; i < data.length; i++) {
            const x = i * step;
            const y = h - (data[i] / max) * (h - 2);
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
    }

    /**
     *
     * @param variableName
     * @param fallback
     */
    function resolveCssColor(variableName, fallback) {
        const value = getComputedStyle(document.documentElement).getPropertyValue(variableName).trim();
        if (!value) return fallback;
        if (value.startsWith('#') || value.startsWith('rgb') || value.startsWith('hsl') || value.startsWith('oklch')) {
            return value;
        }
        return `hsl(${value})`;
    }

    const wsTooltip = computed(() => {
        const state = wsState.connected ? t('status_bar.ws_connected') : t('status_bar.ws_disconnected');
        return `WebSocket: ${state}`;
    });

    const appUptimeText = computed(() => {
        const elapsedSeconds = Math.floor((now.value - vrcxStore.appStartAt) / 1000);
        return formatAppUptime(elapsedSeconds);
    });

    const CLOCKS_KEY = 'VRCX_statusBarClocks';
    const CLOCK_COUNT_KEY = 'VRCX_statusBarClockCount';
    const localOffset = normalizeUtcHour(dayjs().utcOffset() / 60);
    const defaultClocks = [{ offset: localOffset }, { offset: 0 }, { offset: localOffset < 0 ? 9 : -5 }];

    const clocks = ref(defaultClocks.map((c) => ({ ...c })));
    const clockCount = ref(3);
    const clockPopoverOpen = reactive([false, false, false]);

    const visibleClocks = computed(() => clocks.value.slice(0, clockCount.value));

    /**
     *
     */
    function saveClocks() {
        configRepository.setString(CLOCKS_KEY, JSON.stringify(clocks.value));
    }

    /**
     *
     * @param val
     */
    function setClockCount(val) {
        clockCount.value = Number(val);
        configRepository.setString(CLOCK_COUNT_KEY, String(clockCount.value));
        if (clockCount.value > 0) {
            visibility.clocks = true;
            configRepository.setString(VISIBILITY_KEY, JSON.stringify(visibility));
        }
    }

    /**
     *
     * @param clock
     * @returns {string}
     */
    function formatClock(clock) {
        try {
            const current = dayjs(now.value).utcOffset(normalizeUtcHour(clock.offset) * 60);
            const time = current.format('HH:mm');
            return `${time} ${formatUtcHour(clock.offset)}`;
        } catch {
            return '??:?? UTC+0';
        }
    }

    /**
     *
     * @param idx
     * @param offsetValue
     */
    function updateClockTimezone(idx, offsetValue) {
        clocks.value[idx].offset = parseClockOffset(offsetValue);
        saveClocks();
        clockPopoverOpen[idx] = false;
    }

    const timezoneOptions = computed(() => {
        return Array.from({ length: 27 }, (_, i) => {
            const value = i - 12;
            return { value, label: formatUtcHour(value) };
        });
    });

    onMounted(async () => {
        const [savedVis, savedClocks, savedClockCount] = await Promise.all([
            configRepository.getString(VISIBILITY_KEY, null),
            configRepository.getString(CLOCKS_KEY, null),
            configRepository.getString(CLOCK_COUNT_KEY, null)
        ]);
        if (savedVis) {
            try {
                Object.assign(visibility, JSON.parse(savedVis));
            } catch {
                // ignore
            }
        }
        if (savedClocks) {
            try {
                const parsed = JSON.parse(savedClocks);
                if (Array.isArray(parsed) && parsed.length === 3) {
                    clocks.value = parsed.map(normalizeClock);
                }
            } catch {
                // ignore
            }
        }
        if (savedClockCount !== null) {
            const n = Number(savedClockCount);
            if (n >= 0 && n <= 3) clockCount.value = n;
        }

        drawSparkline();
    });

    onBeforeUnmount(() => {
        clearTimeout(serversHoverTimer);
    });

    watch(
        () => visibility.ws,
        (enabled) => {
            if (enabled) {
                nextTick(() => {
                    drawSparkline();
                });
            }
        }
    );

    const zoomLevel = ref(100);
    const zoomEditing = ref(false);
    const zoomInputRef = ref(null);

    if (!isMacOS.value) {
        initZoom();
    }

    /**
     *
     */
    async function initZoom() {
        try {
            zoomLevel.value = ((await AppApi.GetZoom()) + 10) * 10;
        } catch {
            // AppApi not available
        }
    }

    /**
     *
     */
    function setZoomLevel() {
        try {
            AppApi.SetZoom(zoomLevel.value / 10 - 10);
        } catch {
            // AppApi not available
        }
    }

    /**
     *
     */
    async function toggleZoomEdit() {
        if (zoomEditing.value) {
            zoomEditing.value = false;
            return;
        }
        await initZoom();
        zoomEditing.value = true;
        await nextTick();
        zoomInputRef.value?.$el?.focus?.();
    }

    /**
     *
     */
    function handleProxyClick() {
        generalSettingsStore.promptProxySettings();
    }
</script>
