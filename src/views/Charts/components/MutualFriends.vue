<template>
    <div id="chart" class="x-container">
        <div
            class="mt-0 flex min-h-[calc(100vh-140px)] flex-col items-center justify-betweenpt-12"
            ref="mutualGraphRef">
            <div class="flex items-center w-full">
                <div class="options-container flex flex-wrap items-center gap-3 bg-transparent pb-3 shadow-none">
                    <div class="flex flex-wrap items-center gap-2">
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
                <div
                    v-if="isFetching"
                    class="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] items-center rounded-md bg-transparent p-3 ml-auto w-70">
                    <div class="flex justify-between text-sm mb-1">
                        <span>{{ t('view.charts.mutual_friend.progress.friends_processed') }}</span>
                        <strong>{{ fetchState.processedFriends }} / {{ totalFriends }}</strong>
                    </div>
                    <Progress :model-value="progressPercent" class="h-3" />
                </div>
            </div>

            <div
                v-show="!(hasFetched && !isFetching && !graphReady)"
                ref="graphContainerRef"
                class="mt-3 h-[calc(100vh-260px)] min-h-[520px] w-full flex-1 rounded-lg bg-transparent"
                :style="{ backgroundColor: canvasBackground }"></div>

            <Empty v-if="hasFetched && !isFetching && !graphReady" class="mt-3 w-full flex-1">
                <EmptyHeader>
                    <EmptyDescription>
                        {{ t('view.charts.mutual_friend.progress.no_relationships_discovered') }}
                    </EmptyDescription>
                </EmptyHeader>
            </Empty>
        </div>
        <BackToTop target="#chart" :right="30" :bottom="30" />
    </div>
</template>

<script setup>
    defineOptions({ name: 'ChartsMutual' });

    import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue';
    import { Empty, EmptyDescription, EmptyHeader } from '@/components/ui/empty';
    import { Button } from '@/components/ui/button';
    import { Progress } from '@/components/ui/progress';
    import { Spinner } from '@/components/ui/spinner';
    import { createNodeBorderProgram } from '@sigma/node-border';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import BackToTop from '@/components/BackToTop.vue';
    import Graph from 'graphology';
    import Sigma from 'sigma';
    import forceAtlas2 from 'graphology-layout-forceatlas2';
    import louvain from 'graphology-communities-louvain';
    import noverlap from 'graphology-layout-noverlap';

    import {
        useAppearanceSettingsStore,
        useChartsStore,
        useFriendStore,
        useModalStore,
        useUserStore
    } from '../../../stores';
    import { database } from '../../../service/database';
    import { watchState } from '../../../service/watchState';

    const { t } = useI18n();
    const friendStore = useFriendStore();
    const userStore = useUserStore();
    const modalStore = useModalStore();
    const chartsStore = useChartsStore();
    const appearanceStore = useAppearanceSettingsStore();
    const { friends } = storeToRefs(friendStore);
    const { currentUser } = storeToRefs(userStore);
    const { isDarkMode } = storeToRefs(appearanceStore);
    const cachedUsers = userStore.cachedUsers;
    const showUserDialog = (userId) => userStore.showUserDialog(userId);

    const fetchState = chartsStore.mutualGraphFetchState;
    const status = chartsStore.mutualGraphStatus;

    const MAX_LABEL_NAME_LENGTH = 20;

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

    const NodeBorderProgram = createNodeBorderProgram({
        borders: [
            { size: { value: 0.1 }, color: { value: '#f2f2f2' } },
            { size: { fill: true }, color: { attribute: 'color' } }
        ]
    });

    const graphContainerRef = ref(null);
    const mutualGraphRef = ref(null);

    let sigmaInstance = null;
    let currentGraph = null;
    let resizeObserver = null;
    let pendingRender = null;

    watch(isDarkMode, () => {
        if (!currentGraph) return;
        renderGraph(currentGraph, true);
    });

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

    const canvasBackground = computed(() => 'transparent');

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
            if (!graphContainerRef.value) return;

            resizeObserver = new ResizeObserver(() => {
                if (sigmaInstance?.refresh) sigmaInstance.refresh();
            });
            resizeObserver.observe(graphContainerRef.value);

            mutualGraphResizeObserver.observe(mutualGraphRef.value);
            setMutualGraphHeight();

            if (currentGraph) renderGraph(currentGraph);
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
        if (mutualGraphResizeObserver) mutualGraphResizeObserver.disconnect();
    });

    watch(
        () => watchState.isFriendsLoaded,
        (isFriendsLoaded) => {
            if (isFriendsLoaded) loadGraphFromDatabase();
        },
        { immediate: true }
    );

    function showStatusMessage(message, type = 'info') {
        if (!message) return;
        const toastFn = toast[type] ?? toast;
        toastFn(message, { duration: 4000 });
    }

    function truncateLabelText(text) {
        if (!text) return 'Unknown';
        return text.length > MAX_LABEL_NAME_LENGTH ? `${text.slice(0, MAX_LABEL_NAME_LENGTH)}…` : text;
    }

    function initPositions(graph) {
        const n = graph.order;
        const radius = Math.max(50, Math.sqrt(n) * 30);
        graph.forEachNode((node) => {
            const a = Math.random() * Math.PI * 2;
            const r = Math.sqrt(Math.random()) * radius;
            graph.mergeNodeAttributes(node, {
                x: Math.cos(a) * r,
                y: Math.sin(a) * r
            });
        });
    }

    function runLayout(graph) {
        initPositions(graph);

        const iterations = Math.min(1200, Math.max(400, Math.round(Math.sqrt(graph.order) * 18)));

        const inferred = forceAtlas2.inferSettings ? forceAtlas2.inferSettings(graph) : {};
        const settings = {
            ...inferred,
            barnesHutOptimize: true,
            barnesHutTheta: 0.8,
            strongGravityMode: true,
            gravity: 1.2,
            scalingRatio: 20,
            slowDown: 2
        };

        forceAtlas2.assign(graph, { iterations, settings });
        noverlap.assign(graph, { maxIterations: 200, settings: { ratio: 1.1, margin: 2 } });
    }

    function assignCommunitiesAndColors(graph) {
        const communities = louvain(graph);
        const ids = Array.from(new Set(Object.values(communities)));
        ids.sort((a, b) => String(a).localeCompare(String(b)));
        const idToIndex = new Map(ids.map((id, i) => [id, i]));

        graph.forEachNode((node) => {
            const communityId = communities[node];
            const idx = idToIndex.get(communityId) ?? 0;
            graph.setNodeAttribute(node, 'community', communityId);
            graph.setNodeAttribute(node, 'color', COLORS_PALETTE[idx % COLORS_PALETTE.length]);
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
            if (!id) return;
            if (!graph.hasNode(id)) {
                graph.addNode(id);
                nodeDegree.set(id, 0);
            }
            if (name && !nodeNames.get(id)) nodeNames.set(id, name);
        }

        function addEdge(source, target) {
            if (!source || !target || source === target) return;
            const [a, b] = [source, target].sort();
            const key = `${a}__${b}`;
            if (graph.hasEdge(key)) return;
            graph.addEdgeWithKey(key, a, b, { size: 0.75 });
            nodeDegree.set(a, (nodeDegree.get(a) || 0) + 1);
            nodeDegree.set(b, (nodeDegree.get(b) || 0) + 1);
        }

        for (const [friendId, { friend, mutuals }] of mutualMap.entries()) {
            const friendRef = friend?.ref || cachedUsers.get(friendId);
            const friendName = friendRef?.displayName;
            ensureNode(friendId, friendName || friendId);

            for (const mutual of mutuals) {
                if (!mutual?.id) continue;
                const cached = cachedUsers.get(mutual.id);
                const label = cached?.displayName || mutual.displayName || mutual.id;
                ensureNode(mutual.id, label);
                addEdge(friendId, mutual.id);
            }
        }

        const nodeIds = graph.nodes();
        const maxDegree = nodeIds.reduce((max, id) => Math.max(max, nodeDegree.get(id) || 0), 0);

        nodeIds.forEach((id) => {
            const degree = nodeDegree.get(id) || 0;
            const size = 4 + (maxDegree ? (degree / maxDegree) * 18 : 0);
            const label = truncateLabelText(nodeNames.get(id) || id);
            graph.mergeNodeAttributes(id, { label, size, type: 'border' });
        });

        if (graph.order > 1) {
            runLayout(graph);
            assignCommunitiesAndColors(graph);
        }

        graphNodeCount.value = graph.order;
        return graph;
    }

    function renderGraph(graph, forceRecreate = false) {
        if (!graphContainerRef.value) return;
        const container = graphContainerRef.value;
        const { width, height } = container.getBoundingClientRect();
        if (!width || !height) {
            if (pendingRender) return;
            pendingRender = requestAnimationFrame(() => {
                pendingRender = null;
                renderGraph(graph, forceRecreate);
            });
            return;
        }

        const DEFAULT_LABEL_THRESHOLD = 10;

        const labelColor = isDarkMode.value ? '#e2e8f0' : '#111827';
        const EDGE_BASE = isDarkMode.value ? '#334155' : '#94a3b8';
        const EDGE_ACTIVE = isDarkMode.value ? '#bac1c9' : '#0f172a';

        let cameraState = null;

        if (sigmaInstance && forceRecreate) {
            try {
                const cam = sigmaInstance.getCamera?.();
                cameraState = cam?.getState?.() || null;
            } catch (e) {}
            sigmaInstance.kill();
            sigmaInstance = null;
        }

        if (!sigmaInstance) {
            sigmaInstance = new Sigma(graph, container, {
                renderLabels: true,
                labelRenderedSizeThreshold: DEFAULT_LABEL_THRESHOLD,
                labelColor: { color: labelColor },
                defaultEdgeColor: EDGE_BASE,
                zIndex: true,
                defaultNodeType: 'border',
                nodeProgramClasses: { border: NodeBorderProgram },
                defaultDrawNodeHover: (ctx, data, settings) => {
                    if (!data.label) return;

                    const fontSize = settings.labelSize ?? 12;
                    const font = settings.labelFont ?? 'sans-serif';

                    ctx.font = `${fontSize}px ${font}`;
                    ctx.textBaseline = 'middle';

                    const paddingX = 6;
                    const paddingY = 4;

                    const textWidth = ctx.measureText(data.label).width;
                    const w = textWidth + paddingX * 2;
                    const h = fontSize + paddingY * 2;

                    const x = data.x + data.size - 5;
                    const y = data.y - h / 2;

                    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
                    ctx.shadowBlur = 6;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 2;

                    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
                    ctx.fillRect(x, y, w, h);

                    ctx.fillStyle = '#111827';
                    ctx.fillText(data.label, x + paddingX, y + h / 2);
                }
            });
        } else {
            sigmaInstance.setGraph(graph);
            sigmaInstance.setSetting('labelRenderedSizeThreshold', DEFAULT_LABEL_THRESHOLD);
            sigmaInstance.setSetting('labelColor', { color: labelColor });
            sigmaInstance.setSetting('defaultEdgeColor', EDGE_BASE);
            sigmaInstance.setSetting('zIndex', true);
        }

        if (cameraState) {
            try {
                const cam = sigmaInstance.getCamera?.();
                cam?.setState?.(cameraState);
            } catch (e) {}
        }

        let hovered = null;
        let neighbors = new Set();

        const rebuildNeighbors = (node) => {
            neighbors = node ? new Set(graph.neighbors(node)) : new Set();
        };

        sigmaInstance.setSetting('nodeReducer', (node, data) => {
            const res = { ...data };

            if (!hovered) {
                res.color = data.color;
                res.zIndex = 1;
                return res;
            }

            const isHover = node === hovered;
            const isNeighbor = neighbors.has(node);

            if (isHover) {
                res.color = '#facc15';
                res.size = (data.size || 4) * 1.6;
                res.label = data.label;
                res.labelColor = '#111827';
                res.zIndex = 3;
                return res;
            }

            if (isNeighbor) {
                res.color = data.color;
                res.size = (data.size || 4) * 1.2;
                res.label = data.label;
                res.labelColor = '#111827';
                res.zIndex = 2;
                return res;
            }

            res.color = isDarkMode.value ? 'rgba(148,163,184,0.04)' : 'rgba(100,116,139,0.06)';
            res.size = 0.7;
            res.label = '';
            res.zIndex = 0;
            return res;
        });

        sigmaInstance.setSetting('edgeReducer', (edge, data) => {
            const res = { ...data };

            if (!hovered) {
                res.hidden = false;
                res.color = EDGE_BASE;
                res.size = data.size || 1;
                return res;
            }

            const [s, t] = graph.extremities(edge);
            const active = s === hovered || t === hovered;

            if (active) {
                res.hidden = false;
                res.color = EDGE_ACTIVE;
                res.size = data.size || 1;
                return res;
            }

            res.hidden = true;
            return res;
        });

        sigmaInstance.removeAllListeners?.();

        sigmaInstance.on('enterNode', ({ node }) => {
            hovered = node;
            rebuildNeighbors(node);
            sigmaInstance.setSetting('labelRenderedSizeThreshold', 0);
            sigmaInstance.refresh();
        });

        sigmaInstance.on('leaveNode', () => {
            hovered = null;
            rebuildNeighbors(null);
            sigmaInstance.setSetting('labelRenderedSizeThreshold', DEFAULT_LABEL_THRESHOLD);
            sigmaInstance.refresh();
        });

        sigmaInstance.on('clickNode', ({ node }) => {
            if (node) showUserDialog(node);
        });

        sigmaInstance.refresh();
    }

    function applyGraph(mutualMap) {
        const graph = buildGraphFromMutualMap(mutualMap);
        currentGraph = graph;
        renderGraph(graph);
    }

    async function loadGraphFromDatabase() {
        if (!watchState.isLoggedIn || !currentUser.value?.id) return;
        if (!watchState.isFriendsLoaded) return;
        if (isFetching.value || isLoadingSnapshot.value) return;
        if (hasFetched.value && !status.needsRefetch && currentGraph) return;

        isLoadingSnapshot.value = true;
        // loadingToastId.value = toast.info(t('view.charts.mutual_friend.status.loading_cache'));

        try {
            const snapshot = await database.getMutualGraphSnapshot();
            if (!snapshot || snapshot.size === 0) {
                if (totalFriends.value === 0) {
                    showStatusMessage(t('view.charts.mutual_friend.status.no_friends_to_process'), 'info');
                    return;
                }
                if (isOptOut.value) {
                    promptEnableMutualFriendsSharing();
                    return;
                }
                await promptInitialFetch();
                return;
            }

            const mutualMap = new Map();
            snapshot.forEach((mutualIds, friendId) => {
                if (!friendId) return;
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
            chartsStore.markMutualGraphLoaded({ notify: false });
            fetchState.processedFriends = Math.min(mutualMap.size, totalFriends.value || mutualMap.size);
            status.friendSignature = totalFriends.value;
            status.needsRefetch = false;
        } catch (err) {
            console.error('[MutualNetworkGraph] Failed to load cached mutual graph', err);
        } finally {
            isLoadingSnapshot.value = false;
        }
    }

    async function promptInitialFetch() {
        if (isFetching.value || hasFetched.value || !totalFriends.value) return;

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

    async function startFetch() {
        if (isFetching.value || isOptOut.value) return;
        const mutualMap = await chartsStore.fetchMutualGraph();
        if (!mutualMap) return;
        applyGraph(mutualMap);
    }

    function cancelFetch() {
        chartsStore.requestMutualGraphCancel();
    }
</script>
