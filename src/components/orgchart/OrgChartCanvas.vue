<script setup>
import { hierarchy, tree } from 'd3-hierarchy';
import { select } from 'd3-selection';
import { zoom, zoomIdentity } from 'd3-zoom';
import { computed, nextTick, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue';
import NodeCard from './NodeCard.vue';

/**
 * Org chart renderer.
 *
 * The canonical d3 collapse pattern mutates `children` into `_children`. This
 * app avoids that because search and analytics must always see the full tree.
 * Instead, the immutable full hierarchy is cloned into a visible-only hierarchy
 * for layout, based on the `expandedIds` set.
 */

const NODE_WIDTH = 292;
const NODE_HEIGHT = 222;
const NODE_X = 354;
const NODE_Y = 300;
const PADDING = 110;

const props = defineProps({
  root: {
    type: Object,
    required: true,
  },
  expandedIds: {
    type: Object,
    required: true,
  },
  highlightedNodeId: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(['toggle', 'select']);

const viewport = ref(null);
const transform = shallowRef(zoomIdentity);
let zoomBehavior;
let resizeObserver;
const viewportSize = ref({ width: 1, height: 1 });

function cloneVisible(node) {
  // Only expanded nodes expose children to d3.tree(). Collapsed descendants are
  // still present in the original root and keep all precomputed metrics.
  return {
    source: node,
    children: props.expandedIds.has(node.id) ? (node.children ?? []).map(cloneVisible) : [],
  };
}

const layout = computed(() => {
  // d3.tree handles geometry only. It does not participate in metric rollups.
  const visibleRoot = hierarchy(cloneVisible(props.root), (node) => node.children);
  tree()
    .nodeSize([NODE_X, NODE_Y])
    .separation((a, b) => (a.parent === b.parent ? 1 : 1.14))(visibleRoot);

  const nodes = visibleRoot.descendants();
  // d3 coordinates can be negative depending on expansion shape. Normalize the
  // layout into a positive canvas so HTML cards and SVG connectors share space.
  const minX = Math.min(...nodes.map((node) => node.x - NODE_WIDTH / 2));
  const maxX = Math.max(...nodes.map((node) => node.x + NODE_WIDTH / 2));
  const minY = Math.min(...nodes.map((node) => node.y));
  const maxY = Math.max(...nodes.map((node) => node.y + NODE_HEIGHT));

  const width = maxX - minX + PADDING * 2;
  const height = maxY - minY + PADDING * 2;

  const positioned = nodes.map((node) => {
    const x = node.x - minX + PADDING - NODE_WIDTH / 2;
    const y = node.y - minY + PADDING;
    return {
      id: node.data.source.id,
      source: node.data.source,
      x,
      y,
      cx: x + NODE_WIDTH / 2,
      cy: y + NODE_HEIGHT / 2,
    };
  });

  const byClone = new Map(nodes.map((node, index) => [node, positioned[index]]));
  const links = visibleRoot.links().map((link) => ({
    source: byClone.get(link.source),
    target: byClone.get(link.target),
  }));

  return { width, height, nodes: positioned, links };
});

function linkPath(link) {
  // Orthogonal elbow connectors read better than diagonal curves for dense org
  // charts with fixed-width cards.
  const sx = link.source.cx;
  const sy = link.source.y + NODE_HEIGHT;
  const tx = link.target.cx;
  const ty = link.target.y;
  const mid = sy + Math.max(42, (ty - sy) / 2);
  return `M ${sx} ${sy} V ${mid} H ${tx} V ${ty}`;
}

function applyTransform(nextTransform) {
  if (!viewport.value || !zoomBehavior) return;
  select(viewport.value).call(zoomBehavior.transform, nextTransform);
}

function fitToView() {
  if (!viewport.value) return;
  const { width: viewWidth, height: viewHeight } = viewportSize.value;
  const scale = Math.min(viewWidth / layout.value.width, viewHeight / layout.value.height, 1.12) * 0.9;
  const x = (viewWidth - layout.value.width * scale) / 2;
  const y = (viewHeight - layout.value.height * scale) / 2;
  applyTransform(zoomIdentity.translate(x, y).scale(Math.max(0.2, scale)));
}

function centerNode(id) {
  const target = layout.value.nodes.find((node) => node.id === id);
  if (!target) {
    fitToView();
    return;
  }

  const { width, height } = viewportSize.value;
  const scale = Math.min(Math.max(transform.value.k, 0.78), 1.16);
  const x = width / 2 - target.cx * scale;
  const y = height / 2 - target.cy * scale;
  applyTransform(zoomIdentity.translate(x, y).scale(scale));
}

function zoomIn() {
  if (viewport.value && zoomBehavior) select(viewport.value).call(zoomBehavior.scaleBy, 1.18);
}

function zoomOut() {
  if (viewport.value && zoomBehavior) select(viewport.value).call(zoomBehavior.scaleBy, 0.84);
}

onMounted(async () => {
  // d3-zoom owns pointer/wheel gestures; Vue only stores the current transform
  // so the SVG connector layer and HTML cards move together.
  zoomBehavior = zoom()
    .scaleExtent([0.18, 1.8])
    .filter((event) => !event.ctrlKey || event.type === 'wheel')
    .on('zoom', (event) => {
      transform.value = event.transform;
    });

  select(viewport.value).call(zoomBehavior);

  resizeObserver = new ResizeObserver(([entry]) => {
    viewportSize.value = {
      width: Math.max(1, entry.contentRect.width),
      height: Math.max(1, entry.contentRect.height),
    };
  });
  resizeObserver.observe(viewport.value);

  await nextTick();
  fitToView();
});

onBeforeUnmount(() => {
  resizeObserver?.disconnect();
  if (viewport.value) select(viewport.value).on('.zoom', null);
});

watch(
  () => props.highlightedNodeId,
  async (id) => {
    if (!id) return;
    await nextTick();
    centerNode(id);
  },
);

defineExpose({ zoomIn, zoomOut, fitToView, centerNode });
</script>

<template>
  <div ref="viewport" class="chart-viewport">
    <div
      class="chart-layer"
      :style="{
        width: `${layout.width}px`,
        height: `${layout.height}px`,
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.k})`,
      }"
    >
      <svg class="connector-layer" :width="layout.width" :height="layout.height" aria-hidden="true">
        <path v-for="link in layout.links" :key="`${link.source.id}-${link.target.id}`" :d="linkPath(link)" />
      </svg>

      <NodeCard
        v-for="node in layout.nodes"
        :key="node.id"
        :node="node.source"
        :expanded="expandedIds.has(node.id)"
        :highlighted="highlightedNodeId === node.id"
        :style="{ transform: `translate3d(${node.x}px, ${node.y}px, 0)` }"
        @toggle="emit('toggle', $event)"
        @select="emit('select', $event)"
      />
    </div>
  </div>
</template>

<style scoped>
.chart-viewport {
  position: absolute;
  inset: 0;
  overflow: hidden;
  touch-action: none;
  cursor: grab;
}

.chart-viewport:active {
  cursor: grabbing;
}

.chart-layer {
  position: absolute;
  top: 0;
  left: 0;
  transform-origin: 0 0;
  will-change: transform;
}

.connector-layer {
  position: absolute;
  inset: 0;
  overflow: visible;
}

.connector-layer path {
  fill: none;
  stroke: color-mix(in oklch, var(--primary) 34%, var(--line-strong));
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

@media (max-width: 760px) {
  .chart-viewport {
    position: relative;
    min-height: 720px;
    border-top: 1px solid var(--line);
    touch-action: pan-x pan-y;
  }
}
</style>
