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
                <div class="ml-auto flex items-center gap-2">
                    <Sheet>
                        <SheetTrigger as-child>
                            <div>
                                <TooltipWrapper :content="t('view.charts.mutual_friend.settings.title')" side="top">
                                    <Button class="rounded-full" size="icon" variant="ghost">
                                        <Settings />
                                    </Button>
                                </TooltipWrapper>
                            </div>
                        </SheetTrigger>
                        <SheetContent side="right" class="w-90">
                            <SheetHeader>
                                <SheetTitle>{{ t('view.charts.mutual_friend.settings.title') }}</SheetTitle>
                            </SheetHeader>

                            <FieldGroup class="mt-4 gap-4 p-4">
                                <Field>
                                    <FieldLabel>{{
                                        t('view.charts.mutual_friend.settings.layout_iterations')
                                    }}</FieldLabel>
                                    <FieldContent>
                                        <div class="flex items-center gap-3">
                                            <Slider
                                                v-model="layoutIterationsModel"
                                                :min="LAYOUT_ITERATIONS_MIN"
                                                :max="LAYOUT_ITERATIONS_MAX"
                                                :step="100" />
                                            <span
                                                class="min-w-12 text-right text-sm text-muted-foreground tabular-nums">
                                                {{ layoutSettings.layoutIterations }}
                                            </span>
                                        </div>
                                        <p class="mt-1 text-xs text-muted-foreground">
                                            {{ t('view.charts.mutual_friend.settings.layout_iterations_help') }}
                                        </p>
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{{
                                        t('view.charts.mutual_friend.settings.layout_spacing')
                                    }}</FieldLabel>
                                    <FieldContent>
                                        <div class="flex items-center gap-3">
                                            <Slider
                                                v-model="layoutSpacingModel"
                                                :min="LAYOUT_SPACING_MIN"
                                                :max="LAYOUT_SPACING_MAX"
                                                :step="1" />
                                            <span
                                                class="min-w-12 text-right text-sm text-muted-foreground tabular-nums">
                                                {{ layoutSettings.layoutSpacing }}
                                            </span>
                                        </div>
                                        <p class="mt-1 text-xs text-muted-foreground">
                                            {{ t('view.charts.mutual_friend.settings.layout_spacing_help') }}
                                        </p>
                                    </FieldContent>
                                </Field>

                                <Field>
                                    <FieldLabel>{{
                                        t('view.charts.mutual_friend.settings.edge_curvature')
                                    }}</FieldLabel>
                                    <FieldContent>
                                        <div class="flex items-center gap-3">
                                            <Slider
                                                v-model="edgeCurvatureModel"
                                                :min="EDGE_CURVATURE_MIN"
                                                :max="EDGE_CURVATURE_MAX"
                                                :step="0.01" />
                                            <span
                                                class="min-w-12 text-right text-sm text-muted-foreground tabular-nums">
                                                {{ edgeCurvatureLabel }}
                                            </span>
                                        </div>
                                        <p class="mt-1 text-xs text-muted-foreground">
                                            {{ t('view.charts.mutual_friend.settings.edge_curvature_help') }}
                                        </p>
                                    </FieldContent>
                                </Field>
                            </FieldGroup>
                        </SheetContent>
                    </Sheet>

                    <div
                        v-if="isFetching"
                        class="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] items-center rounded-md bg-transparent p-3 w-70">
                        <div class="flex justify-between text-sm mb-1">
                            <span>{{ t('view.charts.mutual_friend.progress.friends_processed') }}</span>
                            <strong>{{ fetchState.processedFriends }} / {{ totalFriends }}</strong>
                        </div>
                        <Progress :model-value="progressPercent" class="h-3" />
                    </div>
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

    import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
    import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
    import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field';
    import { Empty, EmptyDescription, EmptyHeader } from '@/components/ui/empty';
    import { Button } from '@/components/ui/button';
    import { Progress } from '@/components/ui/progress';
    import { Settings } from 'lucide-vue-next';
    import { Slider } from '@/components/ui/slider';
    import { Spinner } from '@/components/ui/spinner';
    import { createNodeBorderProgram } from '@sigma/node-border';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import BackToTop from '@/components/BackToTop.vue';
    import EdgeCurveProgram from '@sigma/edge-curve';
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
    let pendingLayoutUpdate = null;

    const LAYOUT_ITERATIONS_MIN = 300;
    const LAYOUT_ITERATIONS_MAX = 1500;
    const LAYOUT_SPACING_MIN = 8;
    const LAYOUT_SPACING_MAX = 240;
    const EDGE_CURVATURE_MIN = 0;
    const EDGE_CURVATURE_MAX = 0.2;

    const layoutSettings = reactive({
        layoutIterations: 800,
        layoutSpacing: 60,
        edgeCurvature: 0.1
    });

    const layoutIterationsModel = computed({
        get: () => [layoutSettings.layoutIterations],
        set: (value) => {
            layoutSettings.layoutIterations = clampNumber(
                Math.round(value?.[0] ?? layoutSettings.layoutIterations),
                LAYOUT_ITERATIONS_MIN,
                LAYOUT_ITERATIONS_MAX
            );
        }
    });

    const layoutSpacingModel = computed({
        get: () => [layoutSettings.layoutSpacing],
        set: (value) => {
            layoutSettings.layoutSpacing = clampNumber(
                Math.round(value?.[0] ?? layoutSettings.layoutSpacing),
                LAYOUT_SPACING_MIN,
                LAYOUT_SPACING_MAX
            );
        }
    });

    const edgeCurvatureModel = computed({
        get: () => [layoutSettings.edgeCurvature],
        set: (value) => {
            const next = clampNumber(
                value?.[0] ?? layoutSettings.edgeCurvature,
                EDGE_CURVATURE_MIN,
                EDGE_CURVATURE_MAX
            );
            layoutSettings.edgeCurvature = Number(next.toFixed(2));
        }
    });

    const edgeCurvatureLabel = computed(() => layoutSettings.edgeCurvature.toFixed(2));

    let lastLayoutSpacing = layoutSettings.layoutSpacing;

    watch(isDarkMode, () => {
        if (!currentGraph) return;
        renderGraph(currentGraph, true);
    });

    watch(
        () => [layoutSettings.layoutIterations, layoutSettings.layoutSpacing],
        () => scheduleLayoutUpdate({ runLayout: true })
    );

    watch(
        () => layoutSettings.edgeCurvature,
        () => scheduleLayoutUpdate({ runLayout: false })
    );

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

    function clampNumber(value, min, max) {
        const normalized = Number.isFinite(value) ? value : min;
        return Math.min(max, Math.max(min, normalized));
    }

    function lerp(a, b, t) {
        return a + (b - a) * t;
    }

    function jitterPositions(graph, magnitude) {
        graph.forEachNode((node, attrs) => {
            if (!Number.isFinite(attrs.x) || !Number.isFinite(attrs.y)) return;
            graph.mergeNodeAttributes(node, {
                x: attrs.x + (Math.random() - 0.5) * magnitude,
                y: attrs.y + (Math.random() - 0.5) * magnitude
            });
        });
    }

    // @ts-ignore
    function runLayout(graph, { reinitialize } = {}) {
        if (reinitialize) initPositions(graph);

        let iterations = clampNumber(layoutSettings.layoutIterations, LAYOUT_ITERATIONS_MIN, LAYOUT_ITERATIONS_MAX);
        iterations = Math.min(iterations, Math.round(Math.sqrt(graph.order) * 20));
        const spacing = clampNumber(layoutSettings.layoutSpacing, LAYOUT_SPACING_MIN, LAYOUT_SPACING_MAX);
        const t = (spacing - LAYOUT_SPACING_MIN) / (LAYOUT_SPACING_MAX - LAYOUT_SPACING_MIN);
        const clampedT = clampNumber(t, 0, 1);
        const deltaSpacing = spacing - lastLayoutSpacing;
        lastLayoutSpacing = spacing;

        const inferred = forceAtlas2.inferSettings ? forceAtlas2.inferSettings(graph) : {};
        const settings = {
            ...inferred,
            barnesHutOptimize: true,
            barnesHutTheta: 0.8,
            strongGravityMode: true,
            gravity: lerp(1.6, 0.6, clampedT),
            scalingRatio: spacing,
            slowDown: 2
        };

        if (Math.abs(deltaSpacing) >= 8) jitterPositions(graph, lerp(0.5, 2.0, clampedT));

        forceAtlas2.assign(graph, { iterations, settings });
        const noverlapIterations = clampNumber(Math.round(Math.sqrt(graph.order) * 6), 200, 600);
        noverlap.assign(graph, {
            maxIterations: noverlapIterations,
            settings: {
                ratio: lerp(1.05, 1.35, clampedT),
                margin: lerp(1, 8, clampedT)
            }
        });
    }

    function applyEdgeCurvature(graph) {
        const curvature = clampNumber(layoutSettings.edgeCurvature, EDGE_CURVATURE_MIN, EDGE_CURVATURE_MAX);
        const type = curvature > 0 ? 'curve' : 'line';

        graph.forEachEdge((edge) => {
            graph.mergeEdgeAttributes(edge, { curvature, type });
        });
    }

    function scheduleLayoutUpdate({ runLayout: shouldRunLayout }) {
        if (!currentGraph) return;
        if (pendingLayoutUpdate) clearTimeout(pendingLayoutUpdate);
        pendingLayoutUpdate = setTimeout(() => {
            pendingLayoutUpdate = null;
            applyEdgeCurvature(currentGraph);
            if (shouldRunLayout) runLayout(currentGraph, { reinitialize: false });
            renderGraph(currentGraph);
        }, 100);
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
            runLayout(graph, { reinitialize: true });
            assignCommunitiesAndColors(graph);
            applyEdgeCurvature(graph);
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
                edgeProgramClasses: { curve: EdgeCurveProgram },
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
