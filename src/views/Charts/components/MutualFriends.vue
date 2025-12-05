<template>
    <div class="mutual-graph">
        <div class="options-container mutual-graph__toolbar">
            <div class="mutual-graph__actions">
                <el-tooltip :content="fetchButtonLabel" placement="top">
                    <el-button type="primary" :disabled="fetchButtonDisabled" :loading="isFetching" @click="startFetch">
                        {{ fetchButtonLabel }}
                    </el-button>
                </el-tooltip>
                <el-tooltip
                    v-if="isFetching"
                    :content="t('view.charts.mutual_friend.actions.stop_fetching')"
                    placement="top">
                    <el-button type="danger" plain :disabled="status.cancelRequested" @click="cancelFetch">
                        {{ t('view.charts.mutual_friend.actions.stop') }}
                    </el-button>
                </el-tooltip>
            </div>
        </div>

        <div v-if="isFetching" class="mutual-graph__status">
            <div class="mutual-graph__status-row">
                <span>{{ t('view.charts.mutual_friend.progress.friends_processed') }}</span>
                <strong>{{ fetchState.processedFriends }} / {{ totalFriends }}</strong>
            </div>

            <el-progress :percentage="progressPercent" :status="progressStatus" :stroke-width="14"> </el-progress>
        </div>

        <div ref="chartRef" class="mutual-graph__canvas"></div>

        <div v-if="hasFetched && !isFetching && !graphReady" class="mutual-graph__placeholder">
            <span>{{ t('view.charts.mutual_friend.progress.no_relationships_discovered') }}</span>
        </div>
    </div>
</template>

<script setup>
    import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { ElMessage, ElMessageBox } from 'element-plus';
    import { storeToRefs } from 'pinia';
    import { useI18n } from 'vue-i18n';

    import { useAppearanceSettingsStore, useChartsStore, useFriendStore, useUserStore } from '../../../stores';
    import { createRateLimiter, executeWithBackoff } from '../../../shared/utils';
    import { database } from '../../../service/database';
    import { useMutualGraphChart } from '../composables/useMutualGraphChart';
    import { userRequest } from '../../../api';

    import * as echarts from 'echarts';

    const { t } = useI18n();
    const friendStore = useFriendStore();
    const userStore = useUserStore();
    const chartsStore = useChartsStore();
    const appearanceStore = useAppearanceSettingsStore();
    const { friends } = storeToRefs(friendStore);
    const { currentUser } = storeToRefs(userStore);
    const { activeTab } = storeToRefs(chartsStore);
    const { isDarkMode } = storeToRefs(appearanceStore);
    const cachedUsers = userStore.cachedUsers;
    const showUserDialog = (userId) => userStore.showUserDialog(userId);

    const graphPayload = chartsStore.mutualGraphPayload;
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
    const progressStatus = computed(() => (isFetching.value ? 'warning' : undefined));

    onMounted(() => {
        nextTick(() => {
            if (!chartRef.value) {
                return;
            }
            createChartInstance();
            resizeObserver = new ResizeObserver(() => chartInstance?.resize());
            resizeObserver.observe(chartRef.value);
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
            }
        },
        { immediate: true }
    );

    function showStatusMessage(message, type = 'info') {
        if (!message) {
            return;
        }
        ElMessage({
            // @ts-ignore
            message,
            type,
            duration: 4000,
            grouping: true
        });
    }

    function createChartInstance() {
        if (!chartRef.value) {
            return;
        }
        chartInstance = echarts.init(chartRef.value, chartTheme.value, { useDirtyRect: totalFriends.value > 1000 });
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
                const normalizedMutuals = Array.isArray(mutualIds) ? mutualIds : [];
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
        try {
            await ElMessageBox.confirm(
                t('view.charts.mutual_friend.prompt.message'),
                t('view.charts.mutual_friend.prompt.title'),
                {
                    confirmButtonText: t('view.charts.mutual_friend.prompt.confirm'),
                    cancelButtonText: t('view.charts.mutual_friend.prompt.cancel'),
                    type: 'warning'
                }
            );
            await startFetch();
        } catch {
            // cancelled
        }
    }

    function promptEnableMutualFriendsSharing() {
        ElMessageBox.confirm(
            t('view.charts.mutual_friend.enable_sharing_prompt.message'),
            t('view.charts.mutual_friend.enable_sharing_prompt.title'),
            {
                confirmButtonText: t('view.charts.mutual_friend.enable_sharing_prompt.confirm'),
                cancelButtonText: t('view.charts.mutual_friend.enable_sharing_prompt.cancel'),
                type: 'info'
            }
        )
            .then(() => {
                userStore.toggleSharedConnectionsOptOut();
                promptInitialFetch();
            })
            .catch(() => {
                // cancelled
            });
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
        chartInstance.setOption(createChartOption(payload));
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
        margin-top: 0;
        margin-bottom: 8px;
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
</style>
