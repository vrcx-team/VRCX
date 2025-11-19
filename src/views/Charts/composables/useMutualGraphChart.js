import { i18n } from '../../../plugin/i18n';

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

function truncateLabelText(text) {
    if (!text) {
        return 'Unknown';
    }
    return text.length > MAX_LABEL_NAME_LENGTH
        ? `${text.slice(0, MAX_LABEL_NAME_LENGTH)}…`
        : text;
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
}

function computeForceOptions(nodes, links) {
    const nodeCount = nodes.length || 1;
    const degreeSum = nodes.reduce((sum, node) => sum + (node.degree || 0), 0);
    const maxSymbol = nodes.reduce(
        (max, node) => Math.max(max, node.symbolSize || 0),
        0
    );
    const avgDegree = degreeSum / nodeCount || 0;
    const density = links.length ? links.length / nodeCount : 0;

    const repulsionBase = 140 + maxSymbol * 4 + avgDegree * 6;
    const repulsion = clamp(repulsionBase, 180, 720);

    const minEdge = clamp(48 + avgDegree * 1.2, 48, 90);
    const maxEdge = clamp(
        minEdge + 60 + Math.max(0, 140 - density * 18),
        90,
        200
    );

    return {
        repulsion,
        edgeLength: [minEdge, maxEdge],
        gravity: 0.3,
        layoutAnimation: false
    };
}

const t = i18n.global.t;

export function useMutualGraphChart({ cachedUsers, graphPayload }) {
    function buildGraph(mutualMap, updateChart) {
        const nodes = new Map();
        const links = [];
        const linkKeys = new Set();

        function ensureNode(id, name, rawUser) {
            if (!id) {
                return null;
            }
            const existing = nodes.get(id);
            if (existing) {
                if (!existing.rawUser && rawUser) {
                    existing.rawUser = rawUser;
                }
                return existing;
            }
            const node = {
                id,
                name: name || id,
                value: name || id
            };
            nodes.set(id, node);
            return node;
        }

        function incrementDegree(nodeId) {
            const node = nodes.get(nodeId);
            if (!node) {
                return;
            }
            node.degree = (node.degree || 0) + 1;
        }

        function addLink(source, target) {
            if (!source || !target || source === target) {
                return;
            }
            const key = [source, target].sort().join('__');
            if (linkKeys.has(key)) {
                return;
            }
            linkKeys.add(key);
            links.push({ source, target });
            incrementDegree(source);
            incrementDegree(target);
        }

        for (const [friendId, { friend, mutuals }] of mutualMap.entries()) {
            const friendRef = friend?.ref || cachedUsers.get(friendId);
            const friendName = friendRef?.displayName;
            ensureNode(friendId, friendName, friendRef);

            for (const mutual of mutuals) {
                if (!mutual?.id) {
                    continue;
                }
                const cached = cachedUsers.get(mutual.id);
                const label =
                    cached?.displayName || mutual.displayName || mutual.id;
                ensureNode(mutual.id, label);
                addLink(friendId, mutual.id);
            }
        }

        const nodeList = Array.from(nodes.values());
        const maxDegree = nodeList.reduce(
            (acc, node) => Math.max(acc, node.degree || 0),
            0
        );

        nodeList.forEach((node, index) => {
            const normalized = maxDegree ? (node.degree || 0) / maxDegree : 0;
            const size = Math.round(26 + normalized * 52);
            const color = COLORS_PALETTE[index % COLORS_PALETTE.length];
            const displayName = truncateLabelText(node.name || node.id);

            node.symbolSize = size;
            node.label = {
                show: true,
                formatter: `${displayName}`
            };
            node.itemStyle = {
                ...(node.itemStyle || {}),
                color
            };
        });

        graphPayload.value = {
            nodes: nodeList,
            links
        };

        updateChart?.(graphPayload.value);
    }

    function createChartOption(payload) {
        const nodes = payload?.nodes ?? [];
        const links = payload?.links ?? [];
        const force = computeForceOptions(nodes, links);
        const labelMap = Object.create(null);
        nodes.forEach((node) => {
            if (node?.id) {
                labelMap[node.id] = node.name || node.id;
            }
        });
        return {
            color: COLORS_PALETTE,
            backgroundColor: 'transparent',
            tooltip: {
                trigger: 'item',
                formatter: (params) => {
                    if (params.dataType === 'node') {
                        const name =
                            params.data?.name || params.data?.id || 'Unknown';
                        const mutualCount = Number.isFinite(params.data?.degree)
                            ? params.data.degree
                            : 0;
                        const mutualLabel = t(
                            'view.charts.mutual_friend.tooltip.mutual_friends_count',
                            {
                                count: mutualCount
                            }
                        );
                        return `${name}\n${mutualLabel}`;
                    }
                    if (params.dataType === 'edge') {
                        const sourceLabel =
                            labelMap[params.data.source] || params.data.source;
                        const targetLabel =
                            labelMap[params.data.target] || params.data.target;
                        return t('view.charts.mutual_friend.tooltip.edge', {
                            source: sourceLabel,
                            target: targetLabel
                        });
                    }
                    return '';
                }
            },
            series: [
                {
                    type: 'graph',
                    layout: 'force',
                    legendHoverLink: false,
                    roam: true,
                    roamTrigger: 'global',
                    data: nodes,
                    links,
                    animationThreshold: 1000,
                    label: {
                        position: 'right',
                        formatter: '{b}'
                    },
                    symbol: 'circle',
                    emphasis: {
                        focus: 'adjacency',
                        lineStyle: {
                            width: 5,
                            opacity: 0.5
                        }
                    },
                    force,
                    itemStyle: {
                        borderColor: '#ffffff',
                        borderWidth: 1,
                        shadowBlur: 16,
                        shadowColor: 'rgba(0,0,0,0.35)'
                    },
                    lineStyle: {
                        curveness: 0.18,
                        width: 0.5,
                        opacity: 0.4
                    },
                    labelLayout: {
                        hideOverlap: true
                    }
                }
            ]
        };
    }

    return {
        buildGraph,
        createChartOption
    };
}
