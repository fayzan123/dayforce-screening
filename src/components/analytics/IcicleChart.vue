<script setup>
import { computed, ref, watch } from 'vue';
import { ChevronLeft, LocateFixed } from '@lucide/vue';
import { buildIciclePartition } from '../../lib/icicle.js';
import { formatCurrency, formatNumber, formatPercent } from '../../lib/format.js';

const props = defineProps({
  root: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(['view-node']);

const mode = ref('cost');
const focusId = ref(props.root.id);

const focusNode = computed(() => props.root.descendants().find((node) => node.id === focusId.value) ?? props.root);
const partition = computed(() => buildIciclePartition(focusNode.value, { mode: mode.value, depthLimit: 4 }));
const canGoUp = computed(() => Boolean(focusNode.value.parent));

watch(
  () => props.root.id,
  (id) => {
    focusId.value = id;
  },
);

function focus(node) {
  if (node.hasChildren) focusId.value = node.id;
}

function goUp() {
  if (focusNode.value.parent) focusId.value = focusNode.value.parent.id;
}

function formatValue(value) {
  return mode.value === 'headcount' ? formatNumber(value) : formatCurrency(value);
}
</script>

<template>
  <section class="chart-card icicle-card">
    <header>
      <div>
        <h2>Org Cost Icicle</h2>
        <p>{{ focusNode.data.name }} · {{ mode === 'cost' ? 'salary footprint' : 'headcount footprint' }}</p>
      </div>

      <div class="header-actions">
        <button type="button" :disabled="!canGoUp" @click="goUp">
          <ChevronLeft :size="16" aria-hidden="true" />
          Up
        </button>
        <div class="mode-toggle" aria-label="Icicle sizing mode">
          <button type="button" :class="{ active: mode === 'cost' }" @click="mode = 'cost'">Cost</button>
          <button type="button" :class="{ active: mode === 'headcount' }" @click="mode = 'headcount'">Headcount</button>
        </div>
        <button type="button" @click="emit('view-node', focusNode)">
          <LocateFixed :size="16" aria-hidden="true" />
          View
        </button>
      </div>
    </header>

    <div class="icicle-scroll">
      <svg
        class="icicle-svg"
        :viewBox="`0 0 ${partition.width} ${partition.height}`"
        role="img"
        :aria-label="`Icicle chart focused on ${focusNode.data.name}`"
      >
        <g v-for="node in partition.nodes" :key="node.id">
          <rect
            :class="[`depth-${Math.min(node.depth, 4)}`, { clickable: node.hasChildren }]"
            :x="node.x0"
            :y="node.y0"
            :width="Math.max(0, node.x1 - node.x0 - 2)"
            :height="Math.max(0, node.y1 - node.y0)"
            rx="4"
            @click="focus(node)"
          />
          <text v-if="node.x1 - node.x0 > 74" :x="node.x0 + 8" :y="node.y0 + 17">
            {{ node.source.data.name }}
          </text>
          <text v-if="node.x1 - node.x0 > 116" class="value" :x="node.x0 + 8" :y="node.y0 + 33">
            {{ formatValue(node.value) }} · {{ formatPercent(node.share) }}
          </text>
        </g>
      </svg>
    </div>
  </section>
</template>

<style scoped>
.chart-card {
  display: grid;
  gap: 14px;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-strong);
  padding: 14px;
  box-shadow: var(--shadow-sm);
}

header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 14px;
}

h2,
p {
  margin-bottom: 0;
}

h2 {
  font-size: 1rem;
  font-weight: 790;
}

p {
  color: var(--ink-soft);
  font-size: 0.75rem;
  font-weight: 720;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: end;
  gap: 6px;
}

.header-actions > button,
.mode-toggle button {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--surface);
  padding: 0 10px;
  color: var(--ink-muted);
  cursor: pointer;
  font-size: 0.76rem;
  font-weight: 760;
}

.header-actions > button:disabled {
  cursor: not-allowed;
  opacity: 0.45;
}

.mode-toggle {
  display: flex;
  gap: 3px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-muted);
  padding: 3px;
}

.mode-toggle button {
  min-height: 28px;
  border: 0;
  border-radius: 999px;
  background: transparent;
}

.mode-toggle button.active {
  background: var(--surface-strong);
  color: var(--primary-ink);
}

.icicle-scroll {
  overflow-x: auto;
}

.icicle-svg {
  display: block;
  min-width: 820px;
  width: 100%;
  height: auto;
}

rect {
  stroke: var(--surface-strong);
  stroke-width: 2;
}

rect.clickable {
  cursor: pointer;
}

rect.clickable:hover {
  filter: brightness(0.97);
}

.depth-0 {
  fill: var(--primary);
}

.depth-1 {
  fill: var(--blue);
}

.depth-2 {
  fill: var(--green);
}

.depth-3 {
  fill: var(--amber);
}

.depth-4 {
  fill: var(--violet);
}

text {
  fill: var(--surface-strong);
  font-size: 12px;
  font-weight: 780;
  pointer-events: none;
}

text.value {
  fill: color-mix(in oklch, var(--surface-strong) 84%, var(--ink));
  font-size: 10px;
  font-variant-numeric: tabular-nums;
  font-weight: 680;
}

@media (max-width: 720px) {
  header {
    flex-direction: column;
  }

  .header-actions {
    justify-content: start;
  }
}
</style>
