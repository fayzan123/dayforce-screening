<script setup>
import { nextTick, ref } from 'vue';
import { Users } from '@lucide/vue';
import { useOrgTree } from '../../composables/useOrgTree.js';
import { formatCurrency, formatMultiple, formatNumber, formatPercent } from '../../lib/format.js';
import ChartControls from './ChartControls.vue';
import OrgChartCanvas from './OrgChartCanvas.vue';

const store = useOrgTree();
const canvas = ref(null);

function jumpTo(node) {
  // Explicit jump (search result, center-selected): expand the ancestor path and
  // pan to it. expandPathTo bumps the focus version, which the canvas watches to
  // recenter — so we don't pan here directly.
  if (!node) return;
  store.expandPathTo(node.id);
}

function selectNode(node) {
  // Selecting a card highlights it, fills the inspector, and gently centers it.
  // The eased d3-zoom pan (same move as the Center-selected control) makes this
  // read as intentional focus; reduced-motion users get an instant recenter.
  if (!node) return;
  store.selectNode(node.id);
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
      @fit="canvas?.fitToView({ animate: true })"
      @collapse-all="collapseAll"
      @reset="reset"
      @jump="jumpTo"
    />

    <OrgChartCanvas
      ref="canvas"
      :root="store.root.value"
      :expanded-ids="store.expandedIds.value"
      :selected-node-id="store.selectedNodeId.value"
      :focus-node-id="store.focusNodeId.value"
      :focus-version="store.focusVersion.value"
      @toggle="store.toggleNode"
      @select="selectNode"
      @deselect="store.clearSelection"
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
        <span>Layer {{ store.selectedNode.value.data.level }}</span>
        <span v-if="store.selectedNode.value.data.isManager">
          {{ store.selectedNode.value.data.reportingLayers }} reporting layers
        </span>
      </div>

      <dl class="inspector-grid">
        <div>
          <dt><Users :size="15" aria-hidden="true" /> Descendants</dt>
          <dd>{{ formatNumber(store.selectedNode.value.metrics.descendantCount) }}</dd>
        </div>
        <div>
          <dt>Direct reports</dt>
          <dd>{{ formatNumber(store.selectedNode.value.data.directReportCount) }}</dd>
        </div>
        <div>
          <dt>Managers</dt>
          <dd>{{ formatNumber(store.selectedNode.value.metrics.nonLeafDescendantCount) }}</dd>
        </div>
        <div>
          <dt>ICs</dt>
          <dd>{{ formatNumber(store.selectedNode.value.metrics.icDescendantCount) }}</dd>
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
          <dt>Mgr:IC ratio</dt>
          <dd>{{ formatMultiple(store.selectedNode.value.metrics.managerToIcCountRatio, '') }}</dd>
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
  border-radius: var(--radius-xs);
  background: var(--surface-muted);
  padding: 4px 8px;
  color: var(--ink-muted);
  font-size: 0.72rem;
  font-weight: 650;
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

.inspector-grid div:last-child {
  grid-column: 1 / -1;
}

.inspector-grid dt {
  display: flex;
  align-items: center;
  gap: 5px;
  margin-bottom: 3px;
  color: var(--ink-soft);
  font-family: var(--font-display);
  font-size: 0.62rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-transform: uppercase;
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
