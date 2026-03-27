<template>
    <div id="chart" class="x-container">
        <div
            class="mt-0 flex min-h-[calc(100vh-140px)] flex-col items-center justify-betweenpt-12"
            ref="mutualGraphRef">
            <div class="flex items-center w-full">
                <div class="options-container flex items-center gap-3 bg-transparent pb-3 shadow-none">
                    <div>
                        <TooltipWrapper
                            v-if="isFetching"
                            :content="t('view.charts.mutual_friend.actions.stop_fetching')"
                            side="top">
                            <Button variant="destructive" :disabled="status.cancelRequested" @click="cancelFetch">
                                <Spinner />
                                {{ t('view.charts.mutual_friend.actions.stop') }}
                            </Button>
                        </TooltipWrapper>

                        <TooltipWrapper v-else :content="fetchButtonLabel" side="top">
                            <Button :disabled="fetchButtonDisabled" @click="startFetch">
                                {{ fetchButtonLabel }}
                            </Button>
                        </TooltipWrapper>
                    </div>
                    <VirtualCombobox
                        v-if="graphReady"
                        class="min-w-60"
                        :model-value="selectedFriendId"
                        @update:modelValue="navigateToFriend"
                        :groups="excludePickerGroups"
                        :placeholder="t('view.charts.mutual_friend.actions.go_to_friend')"
                        :search-placeholder="t('view.charts.mutual_friend.actions.go_to_friend')"
                        :close-on-select="true"
                        :deselect-on-reselect="true">
                        <template #item="{ item, selected }">
                            <div class="flex w-full items-center p-1.5 text-[13px]">
                                <template v-if="item.user">
                                    <div
                                        class="relative inline-block flex-none size-9 mr-2.5"
                                        :class="userStatusClass(item.user)">
                                        <img
                                            class="size-full rounded-full object-cover"
                                            :src="userImage(item.user)"
                                            loading="lazy" />
                                    </div>
                                    <div class="flex-1 overflow-hidden">
                                        <span
                                            class="block truncate font-medium leading-[18px]"
                                            :style="{ color: item.user.$userColour }"
                                            >{{ item.user.displayName }}</span
                                        >
                                    </div>
                                </template>
                                <template v-else>
                                    <span>{{ item.label }}</span>
                                </template>
                                <CheckIcon :class="['ml-auto size-4', selected ? 'opacity-100' : 'opacity-0']" />
                            </div>
                        </template>
                    </VirtualCombobox>
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

                                <Field>
                                    <FieldLabel>{{
                                        t('view.charts.mutual_friend.settings.community_separation')
                                    }}</FieldLabel>
                                    <FieldContent>
                                        <div class="flex items-center gap-3">
                                            <Slider
                                                v-model="communitySeparationModel"
                                                :min="COMMUNITY_SEPARATION_MIN"
                                                :max="COMMUNITY_SEPARATION_MAX"
                                                :step="0.1" />
                                            <span
                                                class="min-w-12 text-right text-sm text-muted-foreground tabular-nums">
                                                {{ communitySeparationLabel }}
                                            </span>
                                        </div>
                                        <p class="mt-1 text-xs text-muted-foreground">
                                            {{ t('view.charts.mutual_friend.settings.community_separation_help') }}
                                        </p>
                                    </FieldContent>
                                </Field>
                            </FieldGroup>

                            <FieldGroup class="gap-4 p-4">
                                <Field>
                                    <FieldLabel>{{
                                        t('view.charts.mutual_friend.settings.exclude_friends')
                                    }}</FieldLabel>
                                    <FieldContent>
                                        <VirtualCombobox
                                            v-model="excludedFriendIds"
                                            :groups="excludePickerGroups"
                                            :placeholder="
                                                t('view.charts.mutual_friend.settings.exclude_friends_placeholder')
                                            "
                                            :search-placeholder="t('view.charts.mutual_friend.actions.go_to_friend')"
                                            :multiple="true">
                                            <template #item="{ item, selected }">
                                                <div class="flex w-full items-center p-1.5 text-[13px]">
                                                    <template v-if="item.user">
                                                        <div
                                                            class="relative inline-block flex-none size-9 mr-2.5"
                                                            :class="userStatusClass(item.user)">
                                                            <img
                                                                class="size-full rounded-full object-cover"
                                                                :src="userImage(item.user)"
                                                                loading="lazy" />
                                                        </div>
                                                        <div class="flex-1 overflow-hidden">
                                                            <span
                                                                class="block truncate font-medium leading-[18px]"
                                                                :style="{ color: item.user.$userColour }"
                                                                >{{ item.user.displayName }}</span
                                                            >
                                                        </div>
                                                    </template>
                                                    <template v-else>
                                                        <span>{{ item.label }}</span>
                                                    </template>
                                                    <CheckIcon
                                                        :class="[
                                                            'ml-auto size-4',
                                                            selected ? 'opacity-100' : 'opacity-0'
                                                        ]" />
                                                </div>
                                            </template>
                                        </VirtualCombobox>
                                        <p class="mt-1 text-xs text-muted-foreground">
                                            {{ t('view.charts.mutual_friend.settings.exclude_friends_help') }}
                                        </p>
                                    </FieldContent>
                                </Field>
                            </FieldGroup>

                            <div class="p-4 pt-0">
                                <Button variant="outline" size="sm" class="w-full" @click="resetLayoutSettings">
                                    {{ t('view.charts.mutual_friend.settings.reset_defaults') }}
                                </Button>
                            </div>
                        </SheetContent>
                    </Sheet>

                    <div
                        v-if="isFetching"
                        class="grid grid-cols-[repeat(auto-fit,minmax(150px,1fr))] items-center rounded-md bg-transparent p-3 w-70">
                        <div class="flex justify-between text-sm mb-1">
                            <span class="mr-1">{{ t('view.charts.mutual_friend.progress.friends_processed') }}</span>
                            <strong>{{ fetchState.processedFriends }} / {{ totalFriends }}</strong>
                        </div>
                        <Progress :model-value="progressPercent" class="h-3" />
                    </div>
                </div>
            </div>

            <ContextMenu @update:open="onNodeMenuOpenChange">
                <ContextMenuTrigger as-child>
                    <div
                        v-show="!(hasFetched && !isFetching && !graphReady)"
                        ref="graphContainerRef"
                        class="mt-3 h-[calc(100vh-260px)] min-h-[520px] w-full flex-1 rounded-lg bg-transparent"
                        :style="{ backgroundColor: canvasBackground }"></div>
                </ContextMenuTrigger>
                <ContextMenuContent v-if="contextMenuNodeId" class="min-w-40">
                    <ContextMenuItem @click="handleNodeMenuViewDetails">
                        <UserIcon class="size-4" />
                        {{ t('view.charts.mutual_friend.context_menu.view_details') }}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem @click="handleNodeMenuRefresh">
                        <RefreshCwIcon class="size-4" />
                        {{ t('view.charts.mutual_friend.context_menu.refresh_mutuals') }}
                    </ContextMenuItem>
                    <ContextMenuSeparator />
                    <ContextMenuItem @click="handleNodeMenuHide">
                        <EyeOffIcon class="size-4" />
                        {{ t('view.charts.mutual_friend.context_menu.hide_friend') }}
                    </ContextMenuItem>
                </ContextMenuContent>
            </ContextMenu>

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

    import { useLocalStorage } from '@vueuse/core';
    import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue';
    import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
    import { Field, FieldContent, FieldGroup, FieldLabel } from '@/components/ui/field';
    import { Empty, EmptyDescription, EmptyHeader } from '@/components/ui/empty';
    import {
        ContextMenu,
        ContextMenuContent,
        ContextMenuItem,
        ContextMenuSeparator,
        ContextMenuTrigger
    } from '@/components/ui/context-menu';
    import {
        Check as CheckIcon,
        EyeOff as EyeOffIcon,
        RefreshCw as RefreshCwIcon,
        Settings,
        User as UserIcon
    } from 'lucide-vue-next';
    import { Button } from '@/components/ui/button';
    import { Progress } from '@/components/ui/progress';
    import { Slider } from '@/components/ui/slider';
    import { Spinner } from '@/components/ui/spinner';
    import { VirtualCombobox } from '@/components/ui/virtual-combobox';
    import { createNodeBorderProgram } from '@sigma/node-border';
    import { storeToRefs } from 'pinia';
    import { toast } from 'vue-sonner';
    import { useI18n } from 'vue-i18n';

    import BackToTop from '@/components/BackToTop.vue';
    import EdgeCurveProgram from '@sigma/edge-curve';
    import Graph from 'graphology';
    import Sigma from 'sigma';
    import louvain from 'graphology-communities-louvain';

    import GraphLayoutWorker from '../graphLayoutWorker.js?worker&inline';

    import {
        useAppearanceSettingsStore,
        useChartsStore,
        useFriendStore,
        useModalStore,
        useUserStore
    } from '../../../stores';
    import { useUserDisplay } from '../../../composables/useUserDisplay';
    import { showUserDialog } from '../../../coordinators/userCoordinator';
    import { database } from '../../../services/database';
    import { watchState } from '../../../services/watchState';

    import configRepository from '../../../services/config';

    const { userImage, userStatusClass } = useUserDisplay();
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
    let lastMutualMap = null;
    let layoutWorker = null;
    let layoutRequestId = 0;
    const layoutResolvers = new Map();
    let layoutQueue = Promise.resolve();

    function getLayoutWorker() {
        if (!layoutWorker) {
            layoutWorker = new GraphLayoutWorker();
            layoutWorker.addEventListener('message', handleLayoutMessage);
            layoutWorker.addEventListener('error', handleLayoutError);
        }
        return layoutWorker;
    }

    function handleLayoutMessage(event) {
        const { requestId, positions, error } = event.data;
        const resolver = layoutResolvers.get(requestId);
        if (!resolver) return;
        layoutResolvers.delete(requestId);
        if (error) {
            resolver.reject(new Error(error));
        } else {
            resolver.resolve(positions);
        }
    }

    function handleLayoutError(err) {
        // Reject all pending requests on worker-level error
        for (const [id, resolver] of layoutResolvers) {
            resolver.reject(err);
            layoutResolvers.delete(id);
        }
    }

    const LAYOUT_ITERATIONS_MIN = 300;
    const LAYOUT_ITERATIONS_MAX = 1500;
    const LAYOUT_SPACING_MIN = 8;
    const LAYOUT_SPACING_MAX = 240;
    const EDGE_CURVATURE_MIN = 0;
    const EDGE_CURVATURE_MAX = 0.2;
    const COMMUNITY_SEPARATION_MIN = 0;
    const COMMUNITY_SEPARATION_MAX = 3;

    const LAYOUT_DEFAULTS = {
        layoutIterations: 800,
        layoutSpacing: 60,
        edgeCurvature: 0.1,
        communitySeparation: 0
    };

    const layoutSettings = reactive({ ...LAYOUT_DEFAULTS });

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
            const next = clampNumber(value?.[0] ?? layoutSettings.edgeCurvature, EDGE_CURVATURE_MIN, EDGE_CURVATURE_MAX);
            layoutSettings.edgeCurvature = Number(next.toFixed(2));
        }
    });

    const edgeCurvatureLabel = computed(() => layoutSettings.edgeCurvature.toFixed(2));

    const communitySeparationModel = computed({
        get: () => [layoutSettings.communitySeparation],
        set: (value) => {
            const next = clampNumber(
                value?.[0] ?? layoutSettings.communitySeparation,
                COMMUNITY_SEPARATION_MIN,
                COMMUNITY_SEPARATION_MAX
            );
            layoutSettings.communitySeparation = Number(next.toFixed(1));
        }
    });
    const communitySeparationLabel = computed(() => layoutSettings.communitySeparation.toFixed(1));

    let lastLayoutSpacing = layoutSettings.layoutSpacing;

    watch(isDarkMode, () => {
        if (!currentGraph) return;
        renderGraph(currentGraph, true);
    });

    watch(
        () => [layoutSettings.layoutIterations, layoutSettings.layoutSpacing],
        () => {
            scheduleLayoutUpdate({ runLayout: true });
            persistLayoutSettings();
        }
    );

    watch(
        () => layoutSettings.edgeCurvature,
        () => {
            scheduleLayoutUpdate({ runLayout: false });
            persistLayoutSettings();
        }
    );

    watch(
        () => layoutSettings.communitySeparation,
        () => {
            scheduleLayoutUpdate({ runLayout: true });
            persistLayoutSettings();
        }
    );

    async function loadLayoutSettings() {
        const [iterations, spacing, curvature, separation] = await Promise.all([
            configRepository.getInt('VRCX_MutualGraphLayoutIterations', LAYOUT_DEFAULTS.layoutIterations),
            configRepository.getInt('VRCX_MutualGraphLayoutSpacing', LAYOUT_DEFAULTS.layoutSpacing),
            configRepository.getFloat('VRCX_MutualGraphEdgeCurvature', LAYOUT_DEFAULTS.edgeCurvature),
            configRepository.getFloat('VRCX_MutualGraphCommunitySeparation', LAYOUT_DEFAULTS.communitySeparation)
        ]);
        layoutSettings.layoutIterations = clampNumber(iterations, LAYOUT_ITERATIONS_MIN, LAYOUT_ITERATIONS_MAX);
        layoutSettings.layoutSpacing = clampNumber(spacing, LAYOUT_SPACING_MIN, LAYOUT_SPACING_MAX);
        layoutSettings.edgeCurvature = clampNumber(curvature, EDGE_CURVATURE_MIN, EDGE_CURVATURE_MAX);
        layoutSettings.communitySeparation = clampNumber(separation, COMMUNITY_SEPARATION_MIN, COMMUNITY_SEPARATION_MAX);
        lastLayoutSpacing = layoutSettings.layoutSpacing;
    }

    function persistLayoutSettings() {
        configRepository.setInt('VRCX_MutualGraphLayoutIterations', layoutSettings.layoutIterations);
        configRepository.setInt('VRCX_MutualGraphLayoutSpacing', layoutSettings.layoutSpacing);
        configRepository.setFloat('VRCX_MutualGraphEdgeCurvature', layoutSettings.edgeCurvature);
        configRepository.setFloat('VRCX_MutualGraphCommunitySeparation', layoutSettings.communitySeparation);
    }

    function resetLayoutSettings() {
        Object.assign(layoutSettings, LAYOUT_DEFAULTS);
        excludedFriendIds.value = [];
        persistLayoutSettings();
    }

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

    const selectedFriendId = ref(null);

    const contextMenuNodeId = ref(null);
    const graphMeta = ref(new Map());
    const isRefreshingNode = ref(false);

    const EXCLUDED_FRIENDS_KEY = 'VRCX_MutualGraphExcludedFriends';
    const excludedFriendIds = useLocalStorage(EXCLUDED_FRIENDS_KEY, []);

    watch(excludedFriendIds, async () => {
        if (lastMutualMap) {
            try {
                await applyGraph(lastMutualMap);
            } catch (err) {
                console.error('[MutualNetworkGraph] Failed to apply graph after exclude change', err);
            }
        }
    });

    const excludePickerGroups = computed(() => {
        if (!lastMutualMap) return [];
        const currentUserId = currentUser.value?.id;
        const seen = new Set();
        const items = [];
        for (const [friendId, { mutuals }] of lastMutualMap.entries()) {
            if (friendId === currentUserId || seen.has(friendId)) continue;
            seen.add(friendId);
            const cached = cachedUsers.get(friendId);
            const displayName = cached?.displayName || friendId;
            items.push({ value: friendId, label: displayName, search: displayName, user: cached || null });
            for (const mutual of mutuals) {
                if (!mutual?.id || mutual.id === currentUserId || seen.has(mutual.id)) continue;
                seen.add(mutual.id);
                const mc = cachedUsers.get(mutual.id);
                const mName = mc?.displayName || mutual.displayName || mutual.id;
                items.push({ value: mutual.id, label: mName, search: mName, user: mc || null });
            }
        }
        items.sort((a, b) => a.label.localeCompare(b.label));
        return [{ key: 'friends', label: t('side_panel.friends'), items }];
    });

    function navigateToFriend(friendId) {
        selectedFriendId.value = friendId;
        if (!friendId || !currentGraph || !sigmaInstance) return;
        if (!currentGraph.hasNode(friendId)) return;
        const nodeDisplayData = sigmaInstance.getNodeDisplayData(friendId);
        if (!nodeDisplayData) return;
        const camera = sigmaInstance.getCamera();
        camera.animate({ x: nodeDisplayData.x, y: nodeDisplayData.y, ratio: 0.15 }, { duration: 300 });
    }
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
        loadLayoutSettings();
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
        if (layoutWorker) {
            for (const [id, resolver] of layoutResolvers) {
                resolver.reject(new Error('Component unmounted'));
                layoutResolvers.delete(id);
            }
            layoutWorker.terminate();
            layoutWorker = null;
        }
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

    function clampNumber(value, min, max) {
        const normalized = Number.isFinite(value) ? value : min;
        return Math.min(max, Math.max(min, normalized));
    }

    /**
     * @param {Graph} graph
     * @returns {{ nodes: Array, edges: Array }}
     */
    function serializeGraph(graph) {
        const nodes = [];
        graph.forEachNode((id, attributes) => {
            nodes.push({ id, attributes: { ...attributes } });
        });
        const edges = [];
        graph.forEachEdge((key, attributes, source, target) => {
            edges.push({ key, source, target, attributes: { ...attributes } });
        });
        return { nodes, edges };
    }

    /**
     * Run ForceAtlas2 + Noverlap layout in a Web Worker.
     * Requests are serialized: a new call waits for the previous one to finish,
     * preventing concurrent callbacks from stepping on each other.
     * @param {Graph} graph
     * @param {object} options
     * @param {boolean} [options.reinitialize]
     * @returns {Promise<void>}
     */
    async function runLayout(graph, { reinitialize } = {}) {
        const spacing = clampNumber(layoutSettings.layoutSpacing, LAYOUT_SPACING_MIN, LAYOUT_SPACING_MAX);
        const deltaSpacing = spacing - lastLayoutSpacing;
        lastLayoutSpacing = spacing;

        const { nodes, edges } = serializeGraph(graph);
        const worker = getLayoutWorker();
        const id = ++layoutRequestId;

        // Serialize: wait for any in-flight layout to finish first
        const task = layoutQueue.then(async () => {
            const positions = await new Promise((resolve, reject) => {
                layoutResolvers.set(id, { resolve, reject });
                worker.postMessage({
                    requestId: id,
                    nodes,
                    edges,
                    settings: {
                        layoutIterations: layoutSettings.layoutIterations,
                        layoutSpacing: spacing,
                        deltaSpacing,
                        reinitialize: reinitialize ?? false
                    }
                });
            });

            for (const [nodeId, pos] of Object.entries(positions)) {
                if (graph.hasNode(nodeId)) {
                    graph.mergeNodeAttributes(nodeId, { x: pos.x, y: pos.y });
                }
            }
        });

        // Keep the queue going even if this request fails
        layoutQueue = task.catch(() => {});
        return task;
    }

    function applyEdgeCurvature(graph) {
        const curvature = clampNumber(layoutSettings.edgeCurvature, EDGE_CURVATURE_MIN, EDGE_CURVATURE_MAX);
        const type = curvature > 0 ? 'curve' : 'line';

        graph.forEachEdge((edge) => {
            graph.mergeEdgeAttributes(edge, { curvature, type });
        });
    }

    function applyCommunitySeparation(graph) {
        const separation = layoutSettings.communitySeparation;
        if (separation <= 0) return;

        const communities = new Map();
        graph.forEachNode((node, attrs) => {
            const cid = attrs.community;
            if (cid === undefined) return;
            if (!communities.has(cid)) communities.set(cid, { nodes: [], cx: 0, cy: 0 });
            communities.get(cid).nodes.push({ node, x: attrs.x, y: attrs.y });
        });

        // compute per-community centroid
        for (const [, data] of communities) {
            let sx = 0,
                sy = 0;
            for (const n of data.nodes) {
                sx += n.x;
                sy += n.y;
            }
            data.cx = sx / data.nodes.length;
            data.cy = sy / data.nodes.length;
        }

        // compute global centroid
        let gcx = 0,
            gcy = 0,
            total = 0;
        for (const [, data] of communities) {
            gcx += data.cx * data.nodes.length;
            gcy += data.cy * data.nodes.length;
            total += data.nodes.length;
        }
        gcx /= total;
        gcy /= total;

        // push each community away from global centroid
        for (const [, data] of communities) {
            const dx = data.cx - gcx;
            const dy = data.cy - gcy;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const pushX = (dx / dist) * separation * 100;
            const pushY = (dy / dist) * separation * 100;
            for (const n of data.nodes) {
                graph.mergeNodeAttributes(n.node, {
                    x: n.x + pushX,
                    y: n.y + pushY
                });
            }
        }
    }

    function scheduleLayoutUpdate({ runLayout: shouldRunLayout }) {
        if (!currentGraph) return;
        if (pendingLayoutUpdate) clearTimeout(pendingLayoutUpdate);
        pendingLayoutUpdate = setTimeout(async () => {
            pendingLayoutUpdate = null;
            try {
                applyEdgeCurvature(currentGraph);
                if (shouldRunLayout) {
                    await runLayout(currentGraph, { reinitialize: false });
                    applyCommunitySeparation(currentGraph);
                }
                renderGraph(currentGraph);
            } catch (err) {
                console.error('[MutualNetworkGraph] Layout update failed', err);
            }
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

    async function buildGraphFromMutualMap(mutualMap, meta = null) {
        const graph = new Graph({
            type: 'undirected',
            multi: false,
            allowSelfLoops: false
        });

        const excludeSet = new Set(excludedFriendIds.value);
        const nodeDegree = new Map();
        const nodeNames = new Map();

        function ensureNode(id, name) {
            if (!id || excludeSet.has(id)) return;
            if (!graph.hasNode(id)) {
                graph.addNode(id);
                nodeDegree.set(id, 0);
            }
            if (name && !nodeNames.get(id)) nodeNames.set(id, name);
        }

        function addEdge(source, target) {
            if (!source || !target || source === target) return;
            if (excludeSet.has(source) || excludeSet.has(target)) return;
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
            const attrs = { label, size, type: 'border' };
            if (meta?.has(id)) {
                const m = meta.get(id);
                attrs.optedOut = m.optedOut;
                attrs.lastFetchedAt = m.lastFetchedAt;
            }
            graph.mergeNodeAttributes(id, attrs);
        });

        if (graph.order > 1) {
            await runLayout(graph, { reinitialize: true });
            assignCommunitiesAndColors(graph);
            applyCommunitySeparation(graph);
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
                // Sentry: VRCX-WEB-2EG
                allowInvalidContainer: true,
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
                    const smallFontSize = Math.max(9, fontSize - 2);

                    ctx.font = `${fontSize}px ${font}`;
                    ctx.textBaseline = 'middle';

                    const paddingX = 6;
                    const paddingY = 4;

                    let subLine = '';
                    if (data.lastFetchedAt) {
                        const d = new Date(data.lastFetchedAt);
                        subLine = `${t('view.charts.mutual_friend.context_menu.last_fetched')}: ${d.toLocaleString()}`;
                    }

                    const labelWidth = ctx.measureText(data.label).width;
                    ctx.font = `${smallFontSize}px ${font}`;
                    const subWidth = subLine ? ctx.measureText(subLine).width : 0;
                    ctx.font = `${fontSize}px ${font}`;

                    const w = Math.max(labelWidth, subWidth) + paddingX * 2;
                    const lineHeight = fontSize + paddingY;
                    const totalLines = subLine ? 2 : 1;
                    const h = lineHeight * totalLines + paddingY;

                    const x = data.x + data.size - 5;
                    const y = data.y - h / 2;

                    ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
                    ctx.shadowBlur = 6;
                    ctx.shadowOffsetX = 0;
                    ctx.shadowOffsetY = 2;

                    ctx.fillStyle = 'rgba(255, 255, 255, 1)';
                    ctx.fillRect(x, y, w, h);

                    ctx.shadowBlur = 0;
                    ctx.shadowColor = 'transparent';

                    ctx.fillStyle = '#111827';
                    ctx.font = `${fontSize}px ${font}`;
                    ctx.fillText(data.label, x + paddingX, y + paddingY + fontSize / 2);

                    if (subLine) {
                        ctx.fillStyle = data.optedOut ? '#dc2626' : '#6b7280';
                        ctx.font = `${smallFontSize}px ${font}`;
                        ctx.fillText(subLine, x + paddingX, y + paddingY + lineHeight + smallFontSize / 2);
                    }
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

            if (data.optedOut) {
                res.borderColor = '#9ca3af';
            }

            if (!hovered) {
                res.color = data.optedOut ? '#d1d5db' : data.color;
                res.zIndex = 1;
                return res;
            }

            const isHover = node === hovered;
            const isNeighbor = neighbors.has(node);

            if (isHover) {
                res.color = '#facc15';
                res.size = (data.size || 4) * 1.6;
                res.label = `${data.label} (${neighbors.size})`;
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

        sigmaInstance.on('rightClickNode', ({ node }) => {
            contextMenuNodeId.value = node || null;
        });

        sigmaInstance.on('rightClickStage', () => {
            contextMenuNodeId.value = null;
        });

        sigmaInstance.refresh();
    }

    async function applyGraph(mutualMap) {
        lastMutualMap = mutualMap;
        const graph = await buildGraphFromMutualMap(mutualMap, graphMeta.value);
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
            const [snapshot, meta] = await Promise.all([database.getMutualGraphSnapshot(), database.getMutualGraphMeta()]);
            graphMeta.value = meta;

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

            await applyGraph(mutualMap);
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
        try {
            await applyGraph(mutualMap);
        } catch (err) {
            console.error('[MutualNetworkGraph] Failed to apply graph after fetch', err);
        }
    }

    function cancelFetch() {
        chartsStore.requestMutualGraphCancel();
    }

    function onNodeMenuOpenChange(open) {
        if (!open) {
            contextMenuNodeId.value = null;
        }
    }

    function handleNodeMenuViewDetails() {
        if (contextMenuNodeId.value) {
            showUserDialog(contextMenuNodeId.value);
        }
        contextMenuNodeId.value = null;
    }

    function handleNodeMenuHide() {
        if (contextMenuNodeId.value) {
            if (!excludedFriendIds.value.includes(contextMenuNodeId.value)) {
                excludedFriendIds.value = [...excludedFriendIds.value, contextMenuNodeId.value];
            }
        }
        contextMenuNodeId.value = null;
    }

    async function handleNodeMenuRefresh() {
        const nodeId = contextMenuNodeId.value;
        contextMenuNodeId.value = null;
        if (!nodeId || isRefreshingNode.value) return;

        const isFriend = friends.value?.has(nodeId);

        if (!isFriend) {
            try {
                const { ok } = await modalStore.confirm({
                    title: t('view.charts.mutual_friend.context_menu.confirm_non_friend_title'),
                    description: t('view.charts.mutual_friend.context_menu.confirm_non_friend_message'),
                    confirmText: t('common.actions.confirm'),
                    cancelText: t('common.actions.cancel')
                });
                if (!ok) return;
            } catch {
                return;
            }
        }

        isRefreshingNode.value = true;
        try {
            const result = await chartsStore.fetchSingleFriendMutuals(nodeId);

            if (result.optedOut) {
                toast.warning(t('view.charts.mutual_friend.context_menu.user_opted_out'), { duration: 5000 });
                graphMeta.value.set(nodeId, {
                    lastFetchedAt: new Date().toISOString(),
                    optedOut: true
                });
            } else if (result.success) {
                const cached = cachedUsers.get(nodeId);
                const name = cached?.displayName || nodeId;
                toast.success(t('view.charts.mutual_friend.context_menu.refresh_success', { name }), { duration: 3000 });
                graphMeta.value.set(nodeId, {
                    lastFetchedAt: new Date().toISOString(),
                    optedOut: false
                });
            } else {
                toast.error(t('view.charts.mutual_friend.context_menu.refresh_error'), { duration: 4000 });
                return;
            }

            const snapshot = await database.getMutualGraphSnapshot();
            if (snapshot && snapshot.size > 0) {
                const mutualMap = new Map();
                snapshot.forEach((mutualIds, fId) => {
                    if (!fId) return;
                    const friendEntry = friends.value?.get ? friends.value.get(fId) : undefined;
                    const fallbackRef = friendEntry?.ref || cachedUsers.get(fId);
                    let normalizedMutuals = Array.isArray(mutualIds) ? mutualIds : [];
                    normalizedMutuals = normalizedMutuals.filter((id) => id != 'usr_00000000-0000-0000-0000-000000000000');
                    mutualMap.set(fId, {
                        friend: friendEntry || (fallbackRef ? { id: fId, ref: fallbackRef } : { id: fId }),
                        mutuals: normalizedMutuals.map((id) => ({ id }))
                    });
                });
                await applyGraph(mutualMap);
            }
        } catch (err) {
            console.error('[MutualNetworkGraph] Refresh node error', err);
            toast.error(t('view.charts.mutual_friend.context_menu.refresh_error'), { duration: 4000 });
        } finally {
            isRefreshingNode.value = false;
        }
    }
</script>
