/**
 * Web Worker for graph layout computation.
 *
 * Runs ForceAtlas2 and Noverlap layout algorithms off the main thread
 * to prevent UI freezing during heavy graph layout calculations.
 *
 * Protocol:
 *   Main → Worker: { requestId, nodes, edges, settings }
 *   Worker → Main: { requestId, positions } | { requestId, error }
 */
import forceAtlas2 from 'graphology-layout-forceatlas2';
import noverlap from 'graphology-layout-noverlap';
import Graph from 'graphology';

/**
 * Clamp a number between min and max.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function clampNumber(value, min, max) {
    const normalized = Number.isFinite(value) ? value : min;
    return Math.min(max, Math.max(min, normalized));
}

/**
 * Linear interpolation.
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @returns {number}
 */
function lerp(a, b, t) {
    return a + (b - a) * t;
}

/**
 * Add small random offsets to node positions.
 * @param {Graph} graph
 * @param {number} magnitude
 */
function jitterPositions(graph, magnitude) {
    graph.forEachNode((node, attrs) => {
        if (!Number.isFinite(attrs.x) || !Number.isFinite(attrs.y)) return;
        graph.mergeNodeAttributes(node, {
            x: attrs.x + (Math.random() - 0.5) * magnitude,
            y: attrs.y + (Math.random() - 0.5) * magnitude
        });
    });
}

/**
 * Assign random initial positions to graph nodes.
 * @param {Graph} graph
 */
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

const LAYOUT_SPACING_MIN = 8;
const LAYOUT_SPACING_MAX = 240;
const LAYOUT_ITERATIONS_MIN = 300;
const LAYOUT_ITERATIONS_MAX = 1500;

/**
 * Run ForceAtlas2 + Noverlap layout on a serialized graph.
 * @param {object} data - Message data from main thread
 */
function runLayout(data) {
    const { nodes, edges, settings } = data;

    // Reconstruct graph in worker
    const graph = new Graph({
        type: 'undirected',
        multi: false,
        allowSelfLoops: false
    });

    for (const node of nodes) {
        graph.addNode(node.id, node.attributes);
    }
    for (const edge of edges) {
        graph.addEdgeWithKey(edge.key, edge.source, edge.target, edge.attributes);
    }

    const reinitialize = settings.reinitialize ?? false;
    if (reinitialize) {
        initPositions(graph);
    }

    const iterations = clampNumber(
        settings.layoutIterations,
        LAYOUT_ITERATIONS_MIN,
        LAYOUT_ITERATIONS_MAX
    );
    const spacing = clampNumber(
        settings.layoutSpacing,
        LAYOUT_SPACING_MIN,
        LAYOUT_SPACING_MAX
    );
    const t = (spacing - LAYOUT_SPACING_MIN) / (LAYOUT_SPACING_MAX - LAYOUT_SPACING_MIN);
    const clampedT = clampNumber(t, 0, 1);
    const deltaSpacing = settings.deltaSpacing ?? 0;

    // ForceAtlas2
    const inferred = forceAtlas2.inferSettings
        ? forceAtlas2.inferSettings(graph)
        : {};
    const fa2Settings = {
        ...inferred,
        barnesHutOptimize: true,
        barnesHutTheta: 0.8,
        strongGravityMode: true,
        gravity: lerp(1.6, 0.6, clampedT),
        scalingRatio: spacing,
        slowDown: 2
    };

    if (Math.abs(deltaSpacing) >= 8) {
        jitterPositions(graph, lerp(0.5, 2.0, clampedT));
    }

    forceAtlas2.assign(graph, { iterations, settings: fa2Settings });

    // Noverlap
    const noverlapIterations = clampNumber(
        Math.round(Math.sqrt(graph.order) * 6),
        200,
        600
    );
    noverlap.assign(graph, {
        maxIterations: noverlapIterations,
        settings: {
            ratio: lerp(1.05, 1.35, clampedT),
            margin: lerp(1, 8, clampedT)
        }
    });

    // Extract positions
    const positions = {};
    graph.forEachNode((node, attrs) => {
        positions[node] = { x: attrs.x, y: attrs.y };
    });

    return positions;
}

self.addEventListener('message', (event) => {
    const { requestId } = event.data;
    try {
        const positions = runLayout(event.data);
        self.postMessage({ requestId, positions });
    } catch (err) {
        self.postMessage({ requestId, error: err.message });
    }
});
