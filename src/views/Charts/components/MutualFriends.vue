<template>
    <div class="mutual-graph pt-12" ref="mutualGraphRef">
        <div class="options-container mutual-graph__toolbar">
            <div class="mutual-graph__actions">
                <TooltipWrapper :content="t('view.charts.mutual_friend.force_dialog.open_label')" side="top">
                    <Button
                        class="rounded-full"
                        size="icon"
                        variant="outline"
                        :disabled="!graphReady"
                        @click="openForceDialog">
                        <Settings />
                    </Button>
                </TooltipWrapper>
                <TooltipWrapper :content="fetchButtonLabel" side="top">
                    <Button :disabled="fetchButtonDisabled" @click="startFetch">
                        <Spinner v-if="isFetching" />
                        {{ fetchButtonLabel }}
                    </Button>
                </TooltipWrapper>
                <TooltipWrapper
                    v-if="isFetching"
                    :content="t('view.charts.mutual_friend.actions.stop_fetching')"
                    side="top">
                    <Button variant="destructive" :disabled="status.cancelRequested" @click="cancelFetch">
                        {{ t('view.charts.mutual_friend.actions.stop') }}
                    </Button>
                </TooltipWrapper>
            </div>
        </div>

        <div v-if="isFetching" class="mutual-graph__status">
            <div class="mutual-graph__status-row">
                <span>{{ t('view.charts.mutual_friend.progress.friends_processed') }}</span>
                <strong>{{ fetchState.processedFriends }} / {{ totalFriends }}</strong>
            </div>

            <Progress :model-value="progressPercent" class="h-3" />
        </div>

        <div ref="chartRef" class="mutual-graph__canvas"></div>

        <div v-if="hasFetched && !isFetching && !graphReady" class="mutual-graph__placeholder">
            <span>{{ t('view.charts.mutual_friend.progress.no_relationships_discovered') }}</span>
        </div>

        <Dialog v-model:open="isForceDialogVisible">
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{{ t('view.charts.mutual_friend.force_dialog.title') }}</DialogTitle>
                </DialogHeader>

                <p class="mutual-graph__force-description">
                    {{ t('view.charts.mutual_friend.force_dialog.description') }}
                </p>
                <FieldGroup class="mutual-graph__force-form">
                    <Field>
                        <FieldLabel>{{ t('view.charts.mutual_friend.force_dialog.repulsion') }}</FieldLabel>
                        <FieldContent>
                            <NumberField
                                v-model="forceForm.repulsion"
                                :step="1"
                                :format-options="{ maximumFractionDigits: 0 }"
                                class="mutual-graph__number-input">
                                <NumberFieldContent>
                                    <NumberFieldInput />
                                </NumberFieldContent>
                            </NumberField>
                            <FieldDescription class="mutual-graph__helper">
                                {{ t('view.charts.mutual_friend.force_dialog.repulsion_help') }}
                            </FieldDescription>
                        </FieldContent>
                    </Field>
                    <Field>
                        <FieldLabel>{{ t('view.charts.mutual_friend.force_dialog.edge_length_min') }}</FieldLabel>
                        <FieldContent>
                            <NumberField
                                v-model="forceForm.edgeLengthMin"
                                :step="1"
                                :format-options="{ maximumFractionDigits: 0 }"
                                class="mutual-graph__number-input">
                                <NumberFieldContent>
                                    <NumberFieldInput />
                                </NumberFieldContent>
                            </NumberField>
                            <FieldDescription class="mutual-graph__helper">
                                {{ t('view.charts.mutual_friend.force_dialog.edge_length_min_help') }}
                            </FieldDescription>
                        </FieldContent>
                    </Field>
                    <Field>
                        <FieldLabel>{{ t('view.charts.mutual_friend.force_dialog.edge_length_max') }}</FieldLabel>
                        <FieldContent>
                            <NumberField
                                v-model="forceForm.edgeLengthMax"
                                :step="1"
                                :format-options="{ maximumFractionDigits: 0 }"
                                class="mutual-graph__number-input">
                                <NumberFieldContent>
                                    <NumberFieldInput />
                                </NumberFieldContent>
                            </NumberField>
                            <FieldDescription class="mutual-graph__helper">
                                {{ t('view.charts.mutual_friend.force_dialog.edge_length_max_help') }}
                            </FieldDescription>
                        </FieldContent>
                    </Field>
                    <Field>
                        <FieldLabel>{{ t('view.charts.mutual_friend.force_dialog.gravity') }}</FieldLabel>
                        <FieldContent>
                            <NumberField
                                v-model="forceForm.gravity"
                                :max="1"
                                :step="0.1"
                                :format-options="{ maximumFractionDigits: 1 }"
                                class="mutual-graph__number-input">
                                <NumberFieldContent>
                                    <NumberFieldInput />
                                </NumberFieldContent>
                            </NumberField>
                            <FieldDescription class="mutual-graph__helper">
                                {{ t('view.charts.mutual_friend.force_dialog.gravity_help') }}
                            </FieldDescription>
                        </FieldContent>
                    </Field>
                </FieldGroup>

                <DialogFooter>
                    <div class="mutual-graph__dialog-footer">
                        <Button variant="secondary" class="mr-2" @click="resetForceSettings">{{
                            t('view.charts.mutual_friend.force_dialog.reset')
                        }}</Button>
                        <Button :disabled="!graphReady" @click="applyForceSettings">
                            {{ t('view.charts.mutual_friend.force_dialog.apply') }}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    </div>
</template>

<script setup>
    import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
    import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
    import { Field, FieldContent, FieldDescription, FieldGroup, FieldLabel } from '@/components/ui/field';
    import { NumberField, NumberFieldContent, NumberFieldInput } from '@/components/ui/number-field';
    import { Button } from '@/components/ui/button';
    import { Progress } from '@/components/ui/progress';
    import { Settings } from 'lucide-vue-next';
    import { Spinner } from '@/components/ui/spinner';
    import { onBeforeRouteLeave } from 'vue-router';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import {
        useAppearanceSettingsStore,
        useChartsStore,
        useFriendStore,
        useModalStore,
        useUserStore
    } from '../../../stores';
    import { applyForceOverrides, computeForceOptions, useMutualGraphChart } from '../composables/useMutualGraphChart';
    import { createRateLimiter, executeWithBackoff } from '../../../shared/utils';
    import { database } from '../../../service/database';
    import { userRequest } from '../../../api';

    import configRepository from '../../../service/config';

    import * as echarts from 'echarts';

    const { t } = useI18n();
    const friendStore = useFriendStore();
    const userStore = useUserStore();
    const modalStore = useModalStore();
    const chartsStore = useChartsStore();
    const appearanceStore = useAppearanceSettingsStore();
    const { friends } = storeToRefs(friendStore);
    const { currentUser } = storeToRefs(userStore);
    const { activeTab, mutualGraphPayload } = storeToRefs(chartsStore);
    const { isDarkMode } = storeToRefs(appearanceStore);
    const cachedUsers = userStore.cachedUsers;
    const showUserDialog = (userId) => userStore.showUserDialog(userId);

    const graphPayload = mutualGraphPayload;
    const fetchState = chartsStore.mutualGraphFetchState;
    const status = chartsStore.mutualGraphStatus;

    const chartTheme = computed(() => (isDarkMode.value ? 'dark' : undefined));

    const { buildGraph, createChartOption } = useMutualGraphChart({
        cachedUsers,
        graphPayload
    });

    const chartRef = ref(null);
    let chartInstance = null;
    let resizeObserver = null;

    const isFetching = computed({
        get: () => status.isFetching,
        set: (val) => {
            status.isFetching = val;
        }
    });
    const hasFetched = computed({
        get: () => status.hasFetched,
        set: (val) => {
            status.hasFetched = val;
        }
    });

    const totalFriends = computed(() => friends.value.size);
    const isOptOut = computed(() => Boolean(currentUser.value?.hasSharedConnectionsOptOut));
    // @ts-ignore
    const graphReady = computed(() => Array.isArray(graphPayload.value?.nodes) && graphPayload.value.nodes.length > 0);
    const fetchButtonDisabled = computed(() => isFetching.value || isOptOut.value || totalFriends.value === 0);
    const fetchButtonLabel = computed(() =>
        hasFetched.value
            ? t('view.charts.mutual_friend.actions.fetch_again')
            : t('view.charts.mutual_friend.actions.start_fetch')
    );
    const progressPercent = computed(() =>
        totalFriends.value ? Math.min(100, Math.round((fetchState.processedFriends / totalFriends.value) * 100)) : 0
    );
    const forceDefaults = computed(() =>
        computeForceOptions(graphPayload.value?.nodes ?? [], graphPayload.value?.links ?? [])
    );
    const hasGraphData = computed(() => graphReady.value && Boolean(graphPayload.value?.nodes?.length));

    const isForceDialogVisible = ref(false);
    const forceOverrides = ref(null);
    const persistedForce = ref(null);
    const forceForm = reactive({
        repulsion: null,
        edgeLengthMin: null,
        edgeLengthMax: null,
        gravity: null
    });
    const forceConfigKey = 'VRCX_MutualGraphForce';

    const parseForceField = (value, { min = 0, max = Infinity, decimals = 0 } = {}) => {
        if (value === '' || value === null || value === undefined) {
            return { value: null, invalid: false };
        }
        const num = Number(value);
        if (Number.isNaN(num) || num < min || num > max) {
            return { value: null, invalid: true };
        }
        const factor = decimals ? 10 ** decimals : 1;
        return { value: Math.round(num * factor) / factor, invalid: false };
    };

    const coerceForceField = (value, options) => {
        const parsed = parseForceField(value, options);
        return parsed.invalid ? null : parsed.value;
    };

    const mutualGraphRef = ref(null);

    const mutualGraphResizeObserver = new ResizeObserver(() => {
        setMutualGraphHeight();
    });

    function setMutualGraphHeight() {
        if (mutualGraphRef.value) {
            const availableHeight = window.innerHeight - 100;
            mutualGraphRef.value.style.height = `${availableHeight}px`;
            mutualGraphRef.value.style.overflowY = 'auto';
        }
    }

    onMounted(() => {
        nextTick(() => {
            if (!chartRef.value) {
                return;
            }
            createChartInstance();
            resizeObserver = new ResizeObserver(() => chartInstance?.resize());
            resizeObserver.observe(chartRef.value);
            mutualGraphResizeObserver.observe(mutualGraphRef.value);
            setMutualGraphHeight();
        });
    });

    onBeforeUnmount(() => {
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
        if (chartInstance) {
            chartInstance.dispose();
            chartInstance = null;
        }
        if (mutualGraphResizeObserver) {
            mutualGraphResizeObserver.disconnect();
        }
    });

    watch(
        chartTheme,
        () => {
            if (!chartRef.value) {
                return;
            }
            if (chartInstance) {
                chartInstance.dispose();
                chartInstance = null;
            }
            nextTick(() => {
                if (!chartRef.value) {
                    return;
                }
                createChartInstance();
            });
        },
        { immediate: false }
    );

    watch(
        activeTab,
        (tab) => {
            if (tab === 'mutual') {
                loadGraphFromDatabase();
                loadForceOverridesFromConfig();
            }
        },
        { immediate: true }
    );

    watch(
        graphReady,
        (ready) => {
            if (ready && forceOverrides.value) {
                updateChart(graphPayload.value);
            }
        },
        { immediate: false }
    );

    function showStatusMessage(message, type = 'info') {
        if (!message) {
            return;
        }
        const toastFn = toast[type] ?? toast;
        toastFn(message, { duration: 4000 });
    }

    function createChartInstance() {
        if (!chartRef.value) {
            return;
        }
        chartInstance = echarts.init(chartRef.value, chartTheme.value, { renderer: 'svg' });
        chartInstance.on('click', handleChartNodeClick);

        if (graphReady.value) {
            // @ts-ignore
            updateChart(graphPayload.value);
        }
    }

    async function loadGraphFromDatabase() {
        if (hasFetched.value || isFetching.value) {
            return;
        }
        try {
            const snapshot = await database.getMutualGraphSnapshot();
            if (!snapshot || snapshot.size === 0) {
                if (isOptOut.value) {
                    promptEnableMutualFriendsSharing();
                    return;
                }
                await promptInitialFetch();
                return;
            }
            const mutualMap = new Map();
            snapshot.forEach((mutualIds, friendId) => {
                if (!friendId) {
                    return;
                }
                const friendEntry = friends.value?.get ? friends.value.get(friendId) : undefined;
                const fallbackRef = friendEntry?.ref || cachedUsers.get(friendId);
                let normalizedMutuals = Array.isArray(mutualIds) ? mutualIds : [];
                normalizedMutuals = normalizedMutuals.filter((id) => id != 'usr_00000000-0000-0000-0000-000000000000');
                mutualMap.set(friendId, {
                    friend: friendEntry || (fallbackRef ? { id: friendId, ref: fallbackRef } : { id: friendId }),
                    mutuals: normalizedMutuals.map((id) => ({ id }))
                });
            });
            if (!mutualMap.size) {
                await promptInitialFetch();
                return;
            }
            buildGraph(mutualMap, updateChart);
            hasFetched.value = true;
            fetchState.processedFriends = Math.min(mutualMap.size, totalFriends.value || mutualMap.size);
            status.friendSignature = totalFriends.value;
            status.needsRefetch = false;
        } catch (err) {
            console.error('[MutualNetworkGraph] Failed to load cached mutual graph', err);
        }
    }

    async function promptInitialFetch() {
        if (isFetching.value || hasFetched.value || !totalFriends.value) {
            return;
        }

        modalStore
            .confirm({
                description: t('view.charts.mutual_friend.prompt.message'),
                title: t('view.charts.mutual_friend.prompt.title'),
                confirmText: t('view.charts.mutual_friend.prompt.confirm'),
                cancelText: t('view.charts.mutual_friend.prompt.cancel')
            })
            .then(async ({ ok }) => {
                if (!ok) return;

                await startFetch();
            });
    }

    function promptEnableMutualFriendsSharing() {
        modalStore
            .confirm({
                description: t('view.charts.mutual_friend.enable_sharing_prompt.message'),
                title: t('view.charts.mutual_friend.enable_sharing_prompt.title'),
                confirmText: t('view.charts.mutual_friend.enable_sharing_prompt.confirm'),
                cancelText: t('view.charts.mutual_friend.enable_sharing_prompt.cancel')
            })
            .then(({ ok }) => {
                if (!ok) return;
                userStore.toggleSharedConnectionsOptOut();
                promptInitialFetch();
            })
            .catch(() => {});
    }

    function cancelFetch() {
        if (isFetching.value) {
            status.cancelRequested = true;
        }
    }

    const isCancelled = () => status.cancelRequested === true;

    async function startFetch() {
        const rateLimiter = createRateLimiter({
            limitPerInterval: 5,
            intervalMs: 1000
        });

        const fetchMutualFriends = async (userId) => {
            const collected = [];
            let offset = 0;
            while (true) {
                if (isCancelled()) {
                    break;
                }
                await rateLimiter.wait();
                if (isCancelled()) {
                    break;
                }
                const args = await executeWithBackoff(
                    () => {
                        if (isCancelled()) {
                            throw new Error('cancelled');
                        }
                        return userRequest.getMutualFriends({ userId, offset, n: 100 });
                    },
                    {
                        maxRetries: 4,
                        baseDelay: 500,
                        shouldRetry: (err) => err?.status === 429 || (err?.message || '').includes('429')
                    }
                ).catch((err) => {
                    if ((err?.message || '') === 'cancelled') {
                        return null;
                    }
                    throw err;
                });
                if (!args || isCancelled()) {
                    break;
                }
                collected.push(...args.json);
                if (args.json.length < 100) {
                    break;
                }
                offset += args.json.length;
            }
            return collected;
        };

        if (isFetching.value || isOptOut.value) {
            return;
        }
        if (!totalFriends.value) {
            showStatusMessage(t('view.charts.mutual_friend.status.no_friends_to_process'), 'info');
            return;
        }

        isFetching.value = true;
        status.completionNotified = false;
        status.needsRefetch = false;
        status.cancelRequested = false;
        hasFetched.value = false;
        Object.assign(fetchState, {
            processedFriends: 0
        });

        const friendSnapshot = Array.from(friends.value.values());
        const mutualMap = new Map();

        let cancelled = false;
        try {
            for (let index = 0; index < friendSnapshot.length; index += 1) {
                const friend = friendSnapshot[index];
                if (!friend?.id) {
                    continue;
                }
                if (isCancelled()) {
                    cancelled = true;
                    break;
                }
                try {
                    const mutuals = await fetchMutualFriends(friend.id);
                    if (isCancelled()) {
                        cancelled = true;
                        break;
                    }
                    mutualMap.set(friend.id, { friend, mutuals });
                } catch (err) {
                    if ((err?.message || '') === 'cancelled' || isCancelled()) {
                        cancelled = true;
                        break;
                    }
                    console.warn('[MutualNetworkGraph] Skipping friend due to fetch error', friend.id, err);
                    continue;
                }
                fetchState.processedFriends = index + 1;
                if (status.cancelRequested) {
                    cancelled = true;
                    break;
                }
            }

            if (cancelled) {
                hasFetched.value = false;
                showStatusMessage(t('view.charts.mutual_friend.messages.fetch_cancelled_graph_not_updated'), 'warning');
                return;
            }

            buildGraph(mutualMap, updateChart);
            status.friendSignature = totalFriends.value;
            status.needsRefetch = false;

            try {
                await persistMutualGraph(mutualMap);
            } catch (persistErr) {
                console.error('[MutualNetworkGraph] Failed to cache data', persistErr);
            }
            hasFetched.value = true;
        } catch (err) {
            console.error('[MutualNetworkGraph] fetch aborted', err);
        } finally {
            isFetching.value = false;
            status.cancelRequested = false;
        }
    }

    async function persistMutualGraph(mutualMap) {
        const snapshot = new Map();
        mutualMap.forEach((value, friendId) => {
            if (!friendId) {
                return;
            }
            const normalizedFriendId = String(friendId);
            const collection = Array.isArray(value?.mutuals) ? value.mutuals : [];
            const ids = [];
            for (const entry of collection) {
                const identifier =
                    typeof entry?.id === 'string'
                        ? entry.id
                        : entry?.id !== undefined && entry?.id !== null
                          ? String(entry.id)
                          : '';
                if (identifier) {
                    ids.push(identifier);
                }
            }
            snapshot.set(normalizedFriendId, ids);
        });
        await database.saveMutualGraphSnapshot(snapshot);
    }

    function updateChart(payload) {
        const nodes = payload?.nodes ?? [];
        if (!nodes.length) {
            if (chartInstance) {
                chartInstance.clear();
            }
            return;
        }
        if (!chartInstance) {
            return;
        }
        const forceOption =
            persistedForce.value ||
            applyForceOverrides(computeForceOptions(nodes, payload?.links ?? []), forceOverrides.value);
        chartInstance.setOption(createChartOption(payload, forceOption));
        nextTick(() => chartInstance?.resize());
    }

    function handleChartNodeClick(params) {
        if (params?.dataType !== 'node') {
            return;
        }
        const nodeId = params.data?.id;
        if (nodeId) {
            showUserDialog(nodeId);
        }
    }

    onBeforeRouteLeave(() => {
        chartsStore.resetMutualGraphState();
    });

    function syncForceForm(source) {
        const base = source || forceDefaults.value || {};
        const edgeLength = Array.isArray(base.edgeLength) ? base.edgeLength : [];
        forceForm.repulsion = coerceForceField(base.repulsion, { min: 0 });
        forceForm.edgeLengthMin = coerceForceField(edgeLength[0], { min: 0 });
        forceForm.edgeLengthMax = coerceForceField(edgeLength[1], { min: 0 });
        forceForm.gravity = coerceForceField(base.gravity, { min: 0, max: 1, decimals: 1 });
    }

    function openForceDialog() {
        syncForceForm(forceOverrides.value);
        isForceDialogVisible.value = true;
    }

    function applyForceSettings() {
        if (!hasGraphData.value) {
            isForceDialogVisible.value = false;
            return;
        }
        const defaults = forceDefaults.value;
        const defaultEdge = Array.isArray(defaults.edgeLength) ? defaults.edgeLength : [null, null];
        const repulsion = parseForceField(forceForm.repulsion, { min: 0 });
        const minEdge = parseForceField(forceForm.edgeLengthMin, { min: 0 });
        const maxEdge = parseForceField(forceForm.edgeLengthMax, { min: 0 });
        const gravity = parseForceField(forceForm.gravity, { min: 0, max: 1, decimals: 1 });

        const hasInvalid = [repulsion, minEdge, maxEdge, gravity].some((entry) => entry.invalid);
        if (hasInvalid) {
            toast.error(t('view.charts.mutual_friend.force_dialog.invalid_input'));
            return;
        }

        const edgeLength = [minEdge.value ?? defaultEdge[0] ?? 0, maxEdge.value ?? defaultEdge[1] ?? 0];
        edgeLength[0] = Math.max(0, edgeLength[0]);
        edgeLength[1] = Math.max(edgeLength[0], edgeLength[1]);

        forceOverrides.value = {
            repulsion: repulsion.value === null ? defaults.repulsion : repulsion.value,
            edgeLength,
            gravity: gravity.value === null ? defaults.gravity : gravity.value,
            layoutAnimation: defaults.layoutAnimation
        };
        persistedForce.value = applyForceOverrides(defaults, forceOverrides.value);
        persistForceOverrides();
        updateChart(graphPayload.value);
        isForceDialogVisible.value = false;
    }

    function resetForceSettings() {
        forceOverrides.value = null;
        persistedForce.value = null;
        syncForceForm(forceDefaults.value);
        if (hasGraphData.value) {
            updateChart(graphPayload.value);
        }
        clearForceOverrides();
    }

    async function loadForceOverridesFromConfig() {
        try {
            const saved = await configRepository.getObject(forceConfigKey, null);
            if (!saved || typeof saved !== 'object') {
                return;
            }
            forceOverrides.value = saved.overrides || null;
            persistedForce.value = saved.force || null;
            if (forceOverrides.value) {
                syncForceForm(forceOverrides.value);
            }
            if (graphReady.value) {
                updateChart(graphPayload.value);
            }
        } catch (err) {
            console.warn('[MutualNetworkGraph] Failed to load force settings', err);
        }
    }

    function persistForceOverrides() {
        if (!forceOverrides.value) {
            clearForceOverrides();
            return;
        }
        const payload = {
            overrides: forceOverrides.value,
            force: persistedForce.value
        };
        configRepository.setObject(forceConfigKey, payload).catch((err) => {
            console.warn('[MutualNetworkGraph] Failed to save force settings', err);
        });
    }

    function clearForceOverrides() {
        configRepository.remove(forceConfigKey).catch((err) => {
            console.warn('[MutualNetworkGraph] Failed to clear force settings', err);
        });
    }
</script>

<style scoped>
    .mutual-graph {
        margin-top: 0;
        display: flex;
        flex-direction: column;
        min-height: calc(100vh - 140px);
    }

    .mutual-graph__toolbar {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        margin-top: 8px;
        margin-bottom: 0;
        background: transparent;
        border: none;
        box-shadow: none;
        padding: 0 0 8px 0;
    }

    .mutual-graph__actions {
        display: flex;
        gap: 8px;
        align-items: center;
    }

    .mutual-graph__status {
        margin-top: 12px;
        padding: 12px 16px;
        border-radius: 6px;
        border: 1px solid var(--el-border-color);
        background: transparent;
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 8px 12px;
        align-items: center;
    }

    .mutual-graph__status-row {
        display: flex;
        justify-content: space-between;
        font-size: 13px;
    }

    .mutual-graph__status-row strong {
        font-weight: 600;
    }

    .mutual-graph__canvas {
        margin-top: 12px;
        width: 100%;
        flex: 1 1 auto;
        height: calc(100vh - 260px);
        min-height: 520px;
    }

    .mutual-graph__placeholder {
        margin-top: 12px;
        padding: 40px;
        text-align: center;
        border: 1px dashed var(--el-border-color);
        border-radius: 8px;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .mutual-graph__force-description {
        margin: 0 0 12px 0;
        color: var(--el-text-color-regular);
        font-size: 13px;
    }

    .mutual-graph__force-form {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
        gap: 8px 16px;
    }

    .mutual-graph__number-input {
        width: 100%;
    }

    .mutual-graph__dialog-footer {
        display: flex;
        justify-content: flex-end;
        gap: 8px;
    }

    .mutual-graph__helper {
        margin-top: 4px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        line-height: 1.4;
    }
</style>
