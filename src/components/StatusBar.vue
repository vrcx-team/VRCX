<template>
    <div class="status-bar" @contextmenu.prevent>
        <ContextMenu>
            <ContextMenuTrigger as-child>
                <div class="status-bar-inner">
                    <!-- Left section -->
                    <div class="status-bar-left">
                        <TooltipWrapper
                            v-if="visibility.proxy"
                            :content="
                                vrcxStore.proxyServer
                                    ? `${t('status_bar.proxy')}: ${vrcxStore.proxyServer}`
                                    : t('status_bar.proxy')
                            "
                            side="top">
                            <div class="status-bar-item status-bar-clickable" @click="handleProxyClick">
                                <span class="status-dot" :class="vrcxStore.proxyServer ? 'dot-green' : 'dot-gray'" />
                                <span class="status-label">{{ vrcxStore.proxyServer || t('status_bar.proxy') }}</span>
                            </div>
                        </TooltipWrapper>

                        <TooltipWrapper
                            v-if="!isMacOS && visibility.vrchat"
                            :content="
                                gameStore.isGameRunning
                                    ? t('status_bar.vrchat_running')
                                    : t('status_bar.vrchat_stopped')
                            "
                            side="top">
                            <div class="status-bar-item">
                                <span class="status-dot" :class="gameStore.isGameRunning ? 'dot-green' : 'dot-gray'" />
                                <span class="status-label">{{ t('status_bar.vrchat') }}</span>
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
                            <div class="status-bar-item">
                                <span
                                    class="status-dot"
                                    :class="gameStore.isSteamVRRunning ? 'dot-green' : 'dot-gray'" />
                                <span class="status-label">{{ t('status_bar.steamvr') }}</span>
                            </div>
                        </TooltipWrapper>

                        <TooltipWrapper v-if="visibility.ws" :content="wsTooltip" side="top">
                            <div class="status-bar-item status-bar-ws">
                                <span class="status-dot" :class="wsState.connected ? 'dot-green' : 'dot-gray'" />
                                <span class="status-label">WebSocket</span>
                                <canvas ref="wsCanvasRef" class="ws-sparkline" />
                                <span class="status-label-mono">{{
                                    t('status_bar.ws_avg_per_minute', { count: msgsPerMinuteAvg })
                                }}</span>
                            </div>
                        </TooltipWrapper>
                    </div>

                    <!-- Right section -->
                    <div class="status-bar-right">
                        <template v-if="visibility.clocks">
                            <Popover
                                v-for="(clock, idx) in visibleClocks"
                                :key="idx"
                                v-model:open="clockPopoverOpen[idx]">
                                <PopoverTrigger as-child>
                                    <div class="status-bar-item status-bar-clickable">
                                        <span class="status-label-mono">{{ formatClock(clock) }}</span>
                                    </div>
                                </PopoverTrigger>
                                <PopoverContent class="status-bar-clock-popover" side="top" align="center">
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
                            <div class="status-bar-item status-bar-clickable" @click="toggleZoomEdit">
                                <template v-if="zoomEditing">
                                    <span class="status-label-mono">{{ t('status_bar.zoom') }}</span>
                                    <NumberField
                                        v-model="zoomLevel"
                                        :step="1"
                                        :format-options="{ maximumFractionDigits: 0 }"
                                        class="status-bar-zoom-field"
                                        @update:modelValue="setZoomLevel">
                                        <NumberFieldContent>
                                            <NumberFieldDecrement />
                                            <NumberFieldInput
                                                ref="zoomInputRef"
                                                class="status-bar-zoom-input"
                                                @blur="zoomEditing = false"
                                                @keydown.enter="zoomEditing = false"
                                                @keydown.escape="zoomEditing = false" />
                                            <NumberFieldIncrement />
                                        </NumberFieldContent>
                                    </NumberField>
                                </template>
                                <template v-else>
                                    <span class="status-label-mono">{{ t('status_bar.zoom') }}</span>
                                    <span class="status-label-mono">{{ zoomLevel }}%</span>
                                </template>
                            </div>
                        </TooltipWrapper>

                        <TooltipWrapper v-if="visibility.uptime" :content="t('status_bar.app_uptime')" side="top">
                            <div class="status-bar-item">
                                <span class="status-label-mono">{{ t('status_bar.app_uptime_short') }}</span>
                                <span class="status-label-mono">{{ appUptimeText }}</span>
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
                    {{ t('status_bar.vrchat') }}
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
    import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
    import { computed, nextTick, onMounted, reactive, ref, watch } from 'vue';
    import {
        NumberField,
        NumberFieldContent,
        NumberFieldDecrement,
        NumberFieldIncrement,
        NumberFieldInput
    } from '@/components/ui/number-field';
    import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
    import { useGameStore, useGeneralSettingsStore, useVrcxStore } from '@/stores';
    import { useIntervalFn, useNow } from '@vueuse/core';
    import { TooltipWrapper } from '@/components/ui/tooltip';
    import { useI18n } from 'vue-i18n';
    import { wsState } from '@/service/websocket';

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

    import configRepository from '../service/config';

    dayjs.extend(utc);
    dayjs.extend(timezone);

    const { t } = useI18n();

    const isMacOS = computed(() => navigator.platform.includes('Mac'));

    const gameStore = useGameStore();
    const vrcxStore = useVrcxStore();
    const generalSettingsStore = useGeneralSettingsStore();

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

<style scoped>
    .status-bar {
        flex-shrink: 0;
        height: 22px;
        display: flex;
        align-items: center;
        background: var(--sidebar);
        border-top: 1px solid var(--border);
        font-family: 'Consolas', 'Courier New', monospace;
        font-size: 12px;
        user-select: none;
        overflow: hidden;
    }

    .status-bar-inner {
        display: flex;
        align-items: center;
        width: 100%;
        height: 100%;
        padding: 0 8px;
    }

    .status-bar-left {
        display: flex;
        align-items: center;
        gap: 0;
        flex: 1;
        min-width: 0;
    }

    .status-bar-right {
        display: flex;
        align-items: center;
        gap: 0;
        margin-left: auto;
    }

    .status-bar-item {
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 0 8px;
        height: 22px;
        white-space: nowrap;
        border-right: 1px solid var(--border);
    }

    .status-bar-left .status-bar-item:first-child {
        padding-left: 2px;
    }

    .status-bar-right .status-bar-item:last-child {
        border-right: none;
        padding-right: 2px;
    }

    .status-bar-clickable {
        cursor: pointer;
    }

    .status-bar-clickable:hover {
        background: var(--accent);
    }

    .status-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        flex-shrink: 0;
    }

    .dot-green {
        background: var(--status-online);
    }

    .dot-gray {
        background: var(--status-offline-alt);
    }

    .status-label {
        color: hsl(var(--foreground));
        font-size: 11px;
    }

    .status-label-mono {
        font-size: 10px;
        color: hsl(var(--foreground));
    }

    .status-bar-ws {
        gap: 4px;
    }

    .ws-sparkline {
        flex-shrink: 0;
        border-radius: var(--radius-sm);
    }

    .status-bar-zoom-field {
        width: 80px;
    }

    .status-bar-zoom-input {
        height: 18px;
        font-size: 11px;
        padding: 0 2px;
        text-align: center;
    }

    .status-bar-clock-popover {
        width: 280px;
    }
</style>
