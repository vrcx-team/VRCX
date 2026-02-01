<template>
    <div class="mutual-graph pt-12" ref="mutualGraphRef">
        <div class="options-container mutual-graph__toolbar">
            <div class="mutual-graph__actions">
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

        <div ref="graphContainerRef" class="mutual-graph__canvas" :style="{ backgroundColor: canvasBackground }"></div>

        <div v-if="hasFetched && !isFetching && !graphReady" class="mutual-graph__placeholder">
            <span>{{ t('view.charts.mutual_friend.progress.no_relationships_discovered') }}</span>
        </div>
    </div>
</template>

<script setup>
    import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { Button } from '@/components/ui/button';
    import { Progress } from '@/components/ui/progress';
    import { Spinner } from '@/components/ui/spinner';
    import { onBeforeRouteLeave } from 'vue-router';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import Graph from 'graphology';
    import Sigma from 'sigma';
    import forceAtlas2 from 'graphology-layout-forceatlas2';

    import {
        useAppearanceSettingsStore,
        useChartsStore,
        useFriendStore,
        useModalStore,
        useUserStore
    } from '../../../stores';
    import { createRateLimiter, executeWithBackoff } from '../../../shared/utils';
    import { userRequest } from '../../../api';

    const { t } = useI18n();
    const friendStore = useFriendStore();
    const userStore = useUserStore();
    const modalStore = useModalStore();
    const chartsStore = useChartsStore();
    const appearanceStore = useAppearanceSettingsStore();
    const { friends } = storeToRefs(friendStore);
    const { currentUser } = storeToRefs(userStore);
    const { activeTab } = storeToRefs(chartsStore);
    const { isDarkMode } = storeToRefs(appearanceStore);
    const cachedUsers = userStore.cachedUsers;
    const showUserDialog = (userId) => userStore.showUserDialog(userId);

    const fetchState = chartsStore.mutualGraphFetchState;
    const status = chartsStore.mutualGraphStatus;

    const LOCAL_STORAGE_KEY = 'VRCX_MutualGraphSnapshot';
    const COLORS_PALETTE = [
        '#5470c6',
        '#91cc75',
        '#fac858',
        '#ee6666',
        '#73c0de',
        '#3ba272',
        '#fc8452',
        '#9a60b4',
        '#ea7ccc'
    ];
    const MAX_LABEL_NAME_LENGTH = 22;

    const graphContainerRef = ref(null);
    const mutualGraphRef = ref(null);
    let sigmaInstance = null;
    let currentGraph = null;
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

    const graphNodeCount = ref(0);
    const isLoadingSnapshot = ref(false);
    const loadingToastId = ref(null);
    const totalFriends = computed(() => friends.value.size);
    const isOptOut = computed(() => Boolean(currentUser.value?.hasSharedConnectionsOptOut));
    const graphReady = computed(() => graphNodeCount.value > 0);
    const fetchButtonDisabled = computed(
        () => isFetching.value || isOptOut.value || totalFriends.value === 0 || isLoadingSnapshot.value
    );
    const fetchButtonLabel = computed(() =>
        hasFetched.value
            ? t('view.charts.mutual_friend.actions.fetch_again')
            : t('view.charts.mutual_friend.actions.start_fetch')
    );
    const progressPercent = computed(() =>
        totalFriends.value ? Math.min(100, Math.round((fetchState.processedFriends / totalFriends.value) * 100)) : 0
    );
    const canvasBackground = computed(() => (isDarkMode.value ? 'rgba(15, 23, 42, 0.35)' : 'rgba(15, 23, 42, 0.02)'));
    const edgeColor = computed(() => (isDarkMode.value ? 'rgba(226,232,240,0.2)' : 'rgba(15,23,42,0.2)'));

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
            if (!graphContainerRef.value) {
                return;
            }
            resizeObserver = new ResizeObserver(() => {
                if (sigmaInstance?.refresh) {
                    sigmaInstance.refresh();
                }
            });
            resizeObserver.observe(graphContainerRef.value);
            mutualGraphResizeObserver.observe(mutualGraphRef.value);
            setMutualGraphHeight();

            if (currentGraph) {
                renderGraph(currentGraph);
            }
        });
    });

    onBeforeUnmount(() => {
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver = null;
        }
        if (sigmaInstance) {
            sigmaInstance.kill();
            sigmaInstance = null;
        }
        currentGraph = null;
        if (mutualGraphResizeObserver) {
            mutualGraphResizeObserver.disconnect();
        }
    });

    watch(
        activeTab,
        (tab) => {
            if (tab === 'mutual') {
                loadGraphFromLocalStorage();
            }
        },
        { immediate: true }
    );

    watch(isDarkMode, () => {
        if (!currentGraph) {
            return;
        }
        applyThemeToGraph(currentGraph);
        renderGraph(currentGraph);
    });

    function showStatusMessage(message, type = 'info') {
        if (!message) {
            return;
        }
        const toastFn = toast[type] ?? toast;
        toastFn(message, { duration: 4000 });
    }

    function truncateLabelText(text) {
        if (!text) {
            return 'Unknown';
        }
        return text.length > MAX_LABEL_NAME_LENGTH ? `${text.slice(0, MAX_LABEL_NAME_LENGTH)}…` : text;
    }

    function hashToUnit(value) {
        let hash = 0;
        for (let i = 0; i < value.length; i += 1) {
            hash = (hash * 31 + value.charCodeAt(i)) % 1000;
        }
        return hash / 1000 - 0.5;
    }

    function applyThemeToGraph(graph) {
        const color = edgeColor.value;
        graph.forEachEdge((edge) => {
            graph.setEdgeAttribute(edge, 'color', color);
        });
    }

    function buildGraphFromMutualMap(mutualMap) {
        const graph = new Graph({
            type: 'undirected',
            multi: false,
            allowSelfLoops: false
        });
        const nodeDegree = new Map();
        const nodeNames = new Map();

        function ensureNode(id, name) {
            if (!id) {
                return;
            }
            if (!graph.hasNode(id)) {
                graph.addNode(id);
                nodeDegree.set(id, 0);
            }
            if (name && !nodeNames.get(id)) {
                nodeNames.set(id, name);
            }
        }

        function addEdge(source, target) {
            if (!source || !target || source === target) {
                return;
            }
            const [a, b] = [source, target].sort();
            const key = `${a}__${b}`;
            if (graph.hasEdge(key)) {
                return;
            }
            graph.addEdgeWithKey(key, a, b, { color: edgeColor.value });
            nodeDegree.set(a, (nodeDegree.get(a) || 0) + 1);
            nodeDegree.set(b, (nodeDegree.get(b) || 0) + 1);
        }

        for (const [friendId, { friend, mutuals }] of mutualMap.entries()) {
            const friendRef = friend?.ref || cachedUsers.get(friendId);
            const friendName = friendRef?.displayName;
            ensureNode(friendId, friendName || friendId);

            for (const mutual of mutuals) {
                if (!mutual?.id) {
                    continue;
                }
                const cached = cachedUsers.get(mutual.id);
                const label = cached?.displayName || mutual.displayName || mutual.id;
                ensureNode(mutual.id, label);
                addEdge(friendId, mutual.id);
            }
        }

        const nodeIds = graph.nodes();
        const maxDegree = nodeIds.reduce((max, id) => Math.max(max, nodeDegree.get(id) || 0), 0);
        const radius = Math.max(80, Math.sqrt(Math.max(nodeIds.length, 1)) * 60);

        nodeIds.forEach((id, index) => {
            const baseX = hashToUnit(id) * radius;
            const baseY = hashToUnit(`${id}-y`) * radius;
            const jitterX = hashToUnit(id + id) * radius * 0.15;
            const jitterY = hashToUnit(id + 'z') * radius * 0.15;
            const degree = nodeDegree.get(id) || 0;
            const size = 6 + (maxDegree ? (degree / maxDegree) * 16 : 0);
            const label = truncateLabelText(nodeNames.get(id) || id);
            const color = COLORS_PALETTE[index % COLORS_PALETTE.length];

            graph.mergeNodeAttributes(id, {
                label,
                size,
                color,
                x: baseX + jitterX,
                y: baseY + jitterY
            });
        });

        if (graph.order > 1) {
            const iterations = Math.min(200, Math.max(90, Math.round(Math.sqrt(graph.order)) * 12));
            const inferred = forceAtlas2.inferSettings ? forceAtlas2.inferSettings(graph) : {};
            const settings = {
                ...inferred,
                gravity: 0.7,
                scalingRatio: 14,
                slowDown: 1,
                barnesHutOptimize: true,
                strongGravityMode: false
            };
            forceAtlas2.assign(graph, {
                iterations,
                settings
            });
        }

        applyThemeToGraph(graph);

        graphNodeCount.value = graph.order;
        return graph;
    }

    function renderGraph(graph) {
        if (!graphContainerRef.value) {
            return;
        }
        if (sigmaInstance) {
            sigmaInstance.kill();
            sigmaInstance = null;
        }
        const labelColor = isDarkMode.value ? '#e2e8f0' : '#111827';
        sigmaInstance = new Sigma(graph, graphContainerRef.value, {
            renderLabels: true,
            labelRenderedSizeThreshold: 8,
            labelColor: { color: labelColor }
        });
        sigmaInstance.on('clickNode', ({ node }) => {
            if (node) {
                showUserDialog(node);
            }
        });
    }

    function applyGraph(mutualMap) {
        const graph = buildGraphFromMutualMap(mutualMap);
        currentGraph = graph;
        renderGraph(graph);
    }

    async function loadGraphFromLocalStorage() {
        if (hasFetched.value || isFetching.value || isLoadingSnapshot.value) {
            return;
        }
        isLoadingSnapshot.value = true;
        loadingToastId.value = toast.loading(t('view.charts.mutual_friend.status.loading_cache'));
        try {
            const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
            if (!raw) {
                if (isOptOut.value) {
                    promptEnableMutualFriendsSharing();
                    return;
                }
                await promptInitialFetch();
                return;
            }

            const parsed = JSON.parse(raw);
            const snapshot = parsed?.data;
            if (!snapshot || typeof snapshot !== 'object' || Array.isArray(snapshot)) {
                await promptInitialFetch();
                return;
            }

            const mutualMap = new Map();
            Object.entries(snapshot).forEach(([friendId, mutualIds]) => {
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

            applyGraph(mutualMap);
            hasFetched.value = true;
            fetchState.processedFriends = Math.min(mutualMap.size, totalFriends.value || mutualMap.size);
            status.friendSignature = totalFriends.value;
            status.needsRefetch = false;
        } catch (err) {
            console.error('[MutualNetworkGraph] Failed to load cached mutual graph', err);
        } finally {
            isLoadingSnapshot.value = false;
            if (loadingToastId.value !== null && loadingToastId.value !== undefined) {
                toast.dismiss(loadingToastId.value);
                loadingToastId.value = null;
            }
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

            applyGraph(mutualMap);
            status.friendSignature = totalFriends.value;
            status.needsRefetch = false;

            try {
                persistMutualGraphToLocalStorage(mutualMap);
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

    function persistMutualGraphToLocalStorage(mutualMap) {
        const snapshot = {};
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
            snapshot[normalizedFriendId] = ids;
        });

        const payload = {
            version: 1,
            savedAt: Date.now(),
            data: snapshot
        };
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(payload));
    }

    onBeforeRouteLeave(() => {
        chartsStore.resetMutualGraphState();
    });
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
        justify-content: space-between;
        align-items: center;
        margin-top: 8px;
        margin-bottom: 0;
        background: transparent;
        border: none;
        box-shadow: none;
        padding: 0 0 8px 0;
        gap: 12px;
        flex-wrap: wrap;
    }

    .mutual-graph__actions {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
    }

    .mutual-graph__docs-button {
        text-decoration: none;
    }

    .mutual-graph__status {
        margin-top: 12px;
        padding: 12px 16px;
        border-radius: 6px;
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
        border-radius: 8px;
        background: rgba(15, 23, 42, 0.02);
    }

    .mutual-graph__placeholder {
        margin-top: 12px;
        padding: 40px;
        text-align: center;
        border-radius: 8px;
        flex: 1;
        display: flex;
        align-items: center;
        justify-content: center;
    }
</style>
