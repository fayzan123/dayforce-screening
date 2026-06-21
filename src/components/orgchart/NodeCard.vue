<script setup>
// One employee card in the org canvas: identity, department tone, level/role
// tags, and (for managers) an expand/collapse toggle and rollup metrics. Purely
// presentational — selection and expansion are emitted up to the canvas/store.
import { computed } from 'vue';
import { ChevronDown, ChevronRight } from '@lucide/vue';
import { formatCurrency, formatMultiple, formatNumber, formatPercent } from '../../lib/format.js';

const props = defineProps({
  node: {
    type: Object,
    required: true,
  },
  expanded: {
    type: Boolean,
    default: false,
  },
  highlighted: {
    type: Boolean,
    default: false,
  },
});

defineEmits(['toggle', 'select']);

// Department gets a single quiet swatch, never a side stripe. A small fixed map
// keeps the biggest departments stable; everything else hashes deterministically
// into the same editorial chart ramp.
const PALETTE = ['--c-blue', '--c-ochre', '--c-teal', '--c-clay', '--c-sage', '--c-plum'];
const NAMED = {
  'Software Development': '--c-blue',
  'Digital Marketing': '--c-plum',
  'Finance and Accounting': '--c-ochre',
  'Customer Support and Success': '--c-teal',
  'Human Resources': '--c-clay',
  'Network Operations': '--c-blue',
  'Data Analytics': '--c-sage',
  'Cloud Computing': '--c-teal',
};

const toneVar = computed(() => {
  const dept = props.node.data.department ?? '';
  if (NAMED[dept]) return `var(${NAMED[dept]})`;
  let hash = 0;
  for (let i = 0; i < dept.length; i += 1) hash = (hash * 31 + dept.charCodeAt(i)) % 997;
  return `var(${PALETTE[hash % PALETTE.length]})`;
});
</script>

<template>
  <article
    class="node-card"
    :class="[node.data.isManager ? 'manager' : 'leaf', highlighted ? 'is-highlighted' : '']"
    :style="{ '--tone': toneVar }"
  >
    <button
      class="nc-select"
      type="button"
      :aria-label="`Select ${node.data.name}, ${node.data.title}, ${node.data.department}`"
      :aria-pressed="highlighted"
      @click="$emit('select', node)"
    />

    <header class="nc-head">
      <span class="nc-avatar" aria-hidden="true">{{ node.data.initials }}</span>
      <div class="nc-id">
        <h3>{{ node.data.name }}</h3>
        <p>{{ node.data.title }}</p>
      </div>
      <button
        v-if="node.data.isManager"
        class="nc-toggle"
        type="button"
        :aria-label="expanded ? `Collapse ${node.data.name}` : `Expand ${node.data.name}`"
        @click.stop="$emit('toggle', node.id)"
      >
        <ChevronDown v-if="expanded" :size="15" aria-hidden="true" />
        <ChevronRight v-else :size="15" aria-hidden="true" />
      </button>
      <span v-else class="nc-leaf-tag">IC</span>
    </header>

    <div class="nc-meta">
      <span class="nc-dept"><i class="nc-dot" aria-hidden="true" />{{ node.data.department }}</span>
      <span class="nc-tags">
        <span class="nc-lvl" :title="`Layer ${node.data.level}`">L{{ node.data.level }}</span>
        <span
          v-if="node.data.isManager"
          class="nc-lvl nc-lvl-sub"
          :title="`${node.data.reportingLayers} reporting layers below`"
        >{{ node.data.reportingLayers }}<span aria-hidden="true">↓</span></span>
      </span>
    </div>
    <div class="nc-loc">{{ node.data.location }}</div>

    <template v-if="node.data.isManager">
      <dl class="nc-schedule">
        <div>
          <dt>Reports</dt>
          <dd class="tnum">{{ formatNumber(node.metrics.descendantCount, { compact: true }) }}</dd>
        </div>
        <div>
          <dt>Managers</dt>
          <dd class="tnum">{{ formatNumber(node.metrics.nonLeafDescendantCount, { compact: true }) }}</dd>
        </div>
        <div>
          <dt>ICs</dt>
          <dd class="tnum nc-accent">{{ formatNumber(node.metrics.icDescendantCount, { compact: true }) }}</dd>
        </div>
      </dl>

      <dl class="nc-schedule nc-cost">
        <div>
          <dt>Total</dt>
          <dd class="tnum">{{ formatCurrency(node.metrics.totalCost) }}</dd>
        </div>
        <div>
          <dt>Mgmt</dt>
          <dd class="tnum">{{ formatCurrency(node.metrics.mgmtCost) }}</dd>
        </div>
        <div>
          <dt>IC</dt>
          <dd class="tnum nc-accent">{{ formatCurrency(node.metrics.icCost) }}</dd>
        </div>
      </dl>

      <footer class="nc-foot">
        <span class="nc-ratio" title="Manager to IC headcount ratio">
          Mgr:IC <strong class="tnum">{{ formatMultiple(node.metrics.managerToIcCountRatio, '') }}</strong>
        </span>
        <span class="nc-foot-tags">
          <span class="nc-share tnum" title="Direct reports">{{ formatNumber(node.data.directReportCount) }} direct</span>
          <span class="nc-share tnum" title="Share of cost spent on management">{{ formatPercent(node.metrics.managerCostShare) }} mgmt</span>
        </span>
      </footer>
    </template>

    <footer v-else class="nc-foot nc-foot-leaf">
      <span class="nc-ratio">Individual contributor</span>
      <span class="nc-share tnum">{{ formatCurrency(node.data.salary) }}</span>
    </footer>
  </article>
</template>

<style scoped>
.node-card {
  position: absolute;
  display: flex;
  flex-direction: column;
  width: 292px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-sm);
  background: var(--surface-strong);
  box-shadow: var(--shadow-xs);
  cursor: pointer;
  transform: translateZ(0);
  transition: border-color 180ms var(--ease-out), box-shadow 200ms var(--ease-out), transform 260ms var(--ease-out-quint);
  animation: card-in 300ms var(--ease-out) backwards;
}

@keyframes card-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.node-card:hover {
  border-color: var(--primary-line);
  box-shadow: var(--shadow-sm);
}

.node-card:focus-within {
  border-color: var(--primary);
  box-shadow: var(--shadow-sm);
}

.node-card.is-highlighted {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px var(--primary-soft), var(--shadow-md);
}

.nc-select {
  position: absolute;
  z-index: 1;
  inset: 0;
  border: 0;
  border-radius: inherit;
  background: transparent;
  padding: 0;
  cursor: pointer;
}

.nc-select:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.node-card.leaf {
  background: color-mix(in oklch, var(--surface-strong) 88%, var(--surface-muted));
}

/* — header — */
.nc-head {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm) var(--space-sm) var(--space-sm) var(--space-md);
}

.nc-avatar {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border: 1px solid color-mix(in oklch, var(--tone) 40%, var(--line));
  border-radius: var(--radius-sm);
  background: color-mix(in oklch, var(--tone) 14%, var(--surface));
  color: color-mix(in oklch, var(--tone) 72%, var(--ink));
  font-family: var(--font-display);
  font-size: 0.82rem;
  font-weight: 800;
}

.nc-id {
  min-width: 0;
}

.nc-id h3 {
  margin-bottom: 1px;
  overflow: hidden;
  font-family: var(--font-display);
  font-size: 0.95rem;
  font-weight: 700;
  letter-spacing: -0.01em;
  line-height: 1.15;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nc-id p {
  margin-bottom: 0;
  overflow: hidden;
  color: var(--ink-muted);
  font-size: 0.78rem;
  font-weight: 500;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nc-toggle {
  position: relative;
  z-index: 2;
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-xs);
  background: var(--surface);
  color: var(--ink-muted);
  cursor: pointer;
  transition: border-color 150ms var(--ease-out), color 150ms var(--ease-out), background 150ms var(--ease-out);
}

.nc-toggle:hover {
  border-color: var(--primary-line);
  background: var(--primary-soft);
  color: var(--primary-ink);
}

.nc-leaf-tag {
  align-self: start;
  border: 1px solid var(--line);
  border-radius: var(--radius-xs);
  padding: 2px 6px;
  color: var(--ink-soft);
  font-family: var(--font-display);
  font-size: var(--fs-2xs);
  font-weight: 700;
  letter-spacing: 0.08em;
}

/* — meta — */
.nc-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
  padding: 0 var(--space-md);
}

.nc-dept {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  min-width: 0;
  overflow: hidden;
  color: var(--ink-muted);
  font-size: 0.72rem;
  font-weight: 650;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nc-dot {
  flex: 0 0 auto;
  width: 7px;
  height: 7px;
  border-radius: 2px;
  background: var(--tone);
}

.nc-tags {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
}

.nc-lvl {
  flex: 0 0 auto;
  color: var(--ink-soft);
  font-family: var(--font-display);
  font-size: var(--fs-2xs);
  font-weight: 700;
  letter-spacing: 0.06em;
}

/* Reporting layers nested below this node — quieter than the node's own layer. */
.nc-lvl-sub {
  display: inline-flex;
  align-items: center;
  gap: 1px;
  border-radius: var(--radius-xs);
  background: var(--surface-muted);
  padding: 1px 5px;
  color: var(--ink-soft);
  letter-spacing: 0.02em;
}

.nc-loc {
  overflow: hidden;
  margin-top: 2px;
  padding: 0 var(--space-md);
  color: var(--ink-soft);
  font-size: 0.72rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* — metric schedule (architect's spec table) — */
.nc-schedule {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  margin: var(--space-sm) var(--space-md) 0;
  border-top: 1px solid var(--line);
}

.nc-schedule.nc-cost {
  margin-top: 0;
}

.nc-schedule > div {
  min-width: 0;
  padding: 7px 0;
}

.nc-schedule > div + div {
  padding-left: var(--space-sm);
  border-left: 1px solid var(--line);
}

.nc-schedule dt {
  overflow: hidden;
  margin-bottom: 2px;
  color: var(--ink-soft);
  font-family: var(--font-display);
  font-size: 0.6rem;
  font-weight: 700;
  letter-spacing: 0.06em;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.nc-schedule dd {
  overflow: hidden;
  margin: 0;
  color: var(--ink);
  font-size: 0.82rem;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  letter-spacing: -0.01em;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.nc-accent {
  color: var(--accent-ink);
}

/* — footer — */
.nc-foot {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-xs);
  margin-top: var(--space-sm);
  border-top: 1px solid var(--line);
  padding: 9px var(--space-md) 11px;
}

.nc-foot-leaf {
  margin-top: auto;
}

.nc-ratio {
  color: var(--ink-muted);
  font-size: 0.72rem;
  font-weight: 600;
}

.nc-ratio strong {
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  font-weight: 800;
}

.nc-foot-tags {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
}

.nc-share {
  border-radius: var(--radius-xs);
  background: var(--surface-muted);
  padding: 2px 7px;
  color: var(--ink-muted);
  font-size: 0.7rem;
  font-variant-numeric: tabular-nums;
  font-weight: 700;
}
</style>
