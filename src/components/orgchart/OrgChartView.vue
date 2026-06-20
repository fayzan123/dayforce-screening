<script setup>
import { nextTick, ref } from 'vue';
import { Users } from '@lucide/vue';
import { useOrgTree } from '../../composables/useOrgTree.js';
import { formatCurrency, formatNumber, formatPercent, formatRatio } from '../../lib/format.js';
import ChartControls from './ChartControls.vue';
import OrgChartCanvas from './OrgChartCanvas.vue';

const store = useOrgTree();
const canvas = ref(null);

async function jumpTo(node) {
  // Search and selection both expand the ancestor path before panning, which
  // guarantees the target exists in the visible-only layout.
  if (!node) return;
  store.expandPathTo(node.id);
  await nextTick();
  canvas.value?.centerNode(node.id);
}

function collapseAll() {
  store.collapseAll();
  nextTick(() => canvas.value?.fitToView());
}

function reset() {
  store.resetExpansion();
  nextTick(() => canvas.value?.fitToView());
}
</script>

<template>
  <section class="org-view" aria-label="Interactive organization hierarchy">
    <ChartControls
      @zoom-in="canvas?.zoomIn()"
      @zoom-out="canvas?.zoomOut()"
      @fit="canvas?.fitToView()"
      @collapse-all="collapseAll"
      @reset="reset"
      @jump="jumpTo"
    />

    <OrgChartCanvas
      ref="canvas"
      :root="store.root.value"
      :expanded-ids="store.expandedIds.value"
      :highlighted-node-id="store.highlightedNodeId.value"
      @toggle="store.toggleNode"
      @select="jumpTo"
    />

    <aside v-if="store.selectedNode.value" class="node-inspector" aria-label="Selected employee metrics">
      <div class="inspector-heading">
        <div class="inspector-avatar" aria-hidden="true">{{ store.selectedNode.value.data.initials }}</div>
        <div>
          <p class="eyebrow">Selected node</p>
          <h2>{{ store.selectedNode.value.data.name }}</h2>
          <p>{{ store.selectedNode.value.data.title }}</p>
        </div>
      </div>

      <div class="inspector-meta">
        <span>{{ store.selectedNode.value.data.department }}</span>
        <span>{{ store.selectedNode.value.data.location }}</span>
        <span>Level {{ store.selectedNode.value.data.level }}</span>
      </div>

      <dl class="inspector-grid">
        <div>
          <dt><Users :size="15" aria-hidden="true" /> Descendants</dt>
          <dd>{{ formatNumber(store.selectedNode.value.metrics.descendantCount) }}</dd>
        </div>
        <div>
          <dt>Non-leaf</dt>
          <dd>{{ formatNumber(store.selectedNode.value.metrics.nonLeafDescendantCount) }}</dd>
        </div>
        <div>
          <dt>Total cost</dt>
          <dd>{{ formatCurrency(store.selectedNode.value.metrics.totalCost, { compact: false }) }}</dd>
        </div>
        <div>
          <dt>Management cost</dt>
          <dd>{{ formatCurrency(store.selectedNode.value.metrics.mgmtCost, { compact: false }) }}</dd>
        </div>
        <div>
          <dt>IC cost</dt>
          <dd>{{ formatCurrency(store.selectedNode.value.metrics.icCost, { compact: false }) }}</dd>
        </div>
        <div>
          <dt>Mgmt share</dt>
          <dd>{{ formatPercent(store.selectedNode.value.metrics.managerCostShare) }}</dd>
        </div>
        <div>
          <dt>Mgmt:IC</dt>
          <dd>{{ formatRatio(store.selectedNode.value.metrics.managerToIcCostRatio) }}</dd>
        </div>
      </dl>
    </aside>
  </section>
</template>

<style scoped>
.org-view {
  position: absolute;
  inset: 0;
  overflow: hidden;
}

.node-inspector {
  position: absolute;
  z-index: 11;
  right: 12px;
  bottom: 12px;
  width: min(390px, calc(100% - 24px));
  border: 1px solid var(--line);
  border-radius: 8px;
  background: color-mix(in oklch, var(--surface-strong) 96%, transparent);
  padding: 14px;
  box-shadow: var(--shadow-sm);
}

.inspector-heading {
  display: grid;
  grid-template-columns: 44px minmax(0, 1fr);
  gap: 10px;
  align-items: center;
}

.inspector-avatar {
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 8px;
  background: var(--primary-soft);
  color: var(--primary-ink);
  font-weight: 820;
}

.inspector-heading h2 {
  margin-bottom: 2px;
  overflow: hidden;
  font-size: 1rem;
  font-weight: 780;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inspector-heading p:last-child {
  margin-bottom: 0;
  overflow: hidden;
  color: var(--ink-muted);
  font-size: 0.82rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inspector-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 12px;
}

.inspector-meta span {
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-muted);
  padding: 4px 8px;
  color: var(--ink-muted);
  font-size: 0.72rem;
  font-weight: 730;
}

.inspector-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  margin: 12px 0 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--line);
}

.inspector-grid div {
  min-width: 0;
  background: var(--surface);
  padding: 10px;
}

.inspector-grid dt {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 3px;
  color: var(--ink-soft);
  font-size: 0.7rem;
  font-weight: 780;
}

.inspector-grid dd {
  margin: 0;
  overflow: hidden;
  color: var(--ink);
  font-size: 0.92rem;
  font-variant-numeric: tabular-nums;
  font-weight: 790;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .org-view {
    position: relative;
    min-height: 920px;
  }

  .node-inspector {
    position: sticky;
    right: auto;
    bottom: auto;
    margin: 10px;
    width: auto;
  }
}
</style>
