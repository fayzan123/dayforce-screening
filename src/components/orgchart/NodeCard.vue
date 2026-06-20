<script setup>
import { ChevronDown, ChevronRight } from '@lucide/vue';
import { formatCurrency, formatNumber, formatPercent, formatRatio, slugKey } from '../../lib/format.js';

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

// A small deterministic tone map gives departments visual distinction while
// preserving the restrained enterprise palette requested for the assessment.
const departmentTone = {
  'Software Development': 'green',
  'Digital Marketing': 'violet',
  'Finance and Accounting': 'amber',
  'Customer Support and Success': 'blue',
  'Human Resources': 'coral',
  'Network Operations': 'blue',
};
</script>

<template>
  <article
    class="node-card"
    :class="[
      node.data.isManager ? 'manager' : 'leaf',
      highlighted ? 'highlighted' : '',
      departmentTone[node.data.department] || `tone-${slugKey(node.data.department).slice(0, 1) || 'x'}`,
    ]"
    tabindex="0"
    @click="$emit('select', node)"
    @keydown.enter="$emit('select', node)"
  >
    <header class="node-header">
      <div class="avatar" aria-hidden="true">{{ node.data.initials }}</div>
      <button
        v-if="node.data.isManager"
        class="expand-button"
        type="button"
        :aria-label="expanded ? `Collapse ${node.data.name}` : `Expand ${node.data.name}`"
        @click.stop="$emit('toggle', node.id)"
      >
        <ChevronDown v-if="expanded" :size="16" aria-hidden="true" />
        <ChevronRight v-else :size="16" aria-hidden="true" />
      </button>
    </header>

    <div class="identity">
      <h3>{{ node.data.name }}</h3>
      <p>{{ node.data.title }}</p>
    </div>

    <div class="meta-line">
      <span>{{ node.data.department }}</span>
      <span>{{ node.data.location }}</span>
      <span>Level {{ node.data.level }}</span>
    </div>

    <dl class="metric-grid">
      <div>
        <dt>Reports</dt>
        <dd>{{ formatNumber(node.metrics.descendantCount, { compact: true }) }}</dd>
      </div>
      <div>
        <dt>Sub-mgrs</dt>
        <dd>{{ formatNumber(node.metrics.nonLeafDescendantCount, { compact: true }) }}</dd>
      </div>
      <div>
        <dt>Total</dt>
        <dd>{{ formatCurrency(node.metrics.totalCost) }}</dd>
      </div>
      <div>
        <dt>Mgmt</dt>
        <dd>{{ formatCurrency(node.metrics.mgmtCost) }}</dd>
      </div>
      <div>
        <dt>IC</dt>
        <dd>{{ formatCurrency(node.metrics.icCost) }}</dd>
      </div>
      <div>
        <dt>Share</dt>
        <dd>{{ formatPercent(node.metrics.managerCostShare) }}</dd>
      </div>
    </dl>

    <footer class="node-footer">
      <span>IC:Mgmt {{ formatRatio(node.metrics.icToManagerCostRatio) }}</span>
      <strong>{{ formatNumber(node.data.directReportCount) }} direct</strong>
    </footer>
  </article>
</template>

<style scoped>
.node-card {
  position: absolute;
  width: 292px;
  min-height: 222px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-strong);
  box-shadow: var(--shadow-sm);
  cursor: pointer;
  transform: translateZ(0);
  transition: border-color 180ms var(--ease-out), box-shadow 180ms var(--ease-out), background 180ms var(--ease-out);
}

.node-card::before {
  position: absolute;
  inset: 0 auto 0 0;
  width: 4px;
  border-radius: 8px 0 0 8px;
  background: var(--primary);
  content: "";
}

.node-card:hover,
.node-card:focus-visible {
  border-color: color-mix(in oklch, var(--primary) 48%, var(--line));
  box-shadow: 0 12px 34px oklch(30% 0.04 220 / 0.14);
}

.node-card.highlighted {
  border-color: var(--primary);
  box-shadow: 0 0 0 3px color-mix(in oklch, var(--primary) 18%, transparent), 0 18px 46px oklch(30% 0.04 220 / 0.16);
}

.node-card.leaf {
  min-height: 202px;
  background: color-mix(in oklch, var(--surface-strong) 94%, var(--surface-muted));
}

.green::before {
  background: var(--green);
}

.violet::before {
  background: var(--violet);
}

.amber::before {
  background: var(--amber);
}

.blue::before {
  background: var(--blue);
}

.coral::before {
  background: var(--coral);
}

.tone-d::before,
.tone-m::before {
  background: var(--violet);
}

.tone-c::before,
.tone-s::before {
  background: var(--green);
}

.tone-f::before,
.tone-o::before {
  background: var(--amber);
}

.tone-h::before,
.tone-n::before {
  background: var(--blue);
}

.node-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 12px 12px 0 16px;
}

.avatar {
  display: grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 8px;
  background: var(--primary-soft);
  color: var(--primary-ink);
  font-size: 0.88rem;
  font-weight: 820;
}

.expand-button {
  display: grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--surface);
  color: var(--ink-muted);
  cursor: pointer;
}

.expand-button:hover {
  border-color: var(--line-strong);
  color: var(--primary-ink);
}

.identity {
  padding: 9px 16px 0;
}

.identity h3 {
  margin-bottom: 2px;
  overflow: hidden;
  color: var(--ink);
  font-size: 1rem;
  font-weight: 780;
  letter-spacing: 0;
  line-height: 1.18;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.identity p {
  margin-bottom: 0;
  overflow: hidden;
  color: var(--ink-muted);
  font-size: 0.82rem;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.meta-line {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 16px 0;
}

.meta-line span {
  max-width: 100%;
  overflow: hidden;
  border: 1px solid color-mix(in oklch, var(--line) 70%, transparent);
  border-radius: 999px;
  background: var(--surface-muted);
  padding: 3px 7px;
  color: var(--ink-muted);
  font-size: 0.68rem;
  font-weight: 720;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  overflow: hidden;
  margin: 12px 16px 0;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--line);
}

.metric-grid div {
  min-width: 0;
  background: color-mix(in oklch, var(--surface) 94%, var(--surface-muted));
  padding: 7px;
}

.metric-grid dt {
  overflow: hidden;
  margin-bottom: 3px;
  color: var(--ink-soft);
  font-size: 0.62rem;
  font-weight: 780;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;
}

.metric-grid dd {
  overflow: hidden;
  margin: 0;
  color: var(--ink);
  font-size: 0.79rem;
  font-variant-numeric: tabular-nums;
  font-weight: 780;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.node-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  padding: 11px 16px 14px;
  color: var(--ink-muted);
  font-size: 0.72rem;
  font-weight: 720;
}

.node-footer strong {
  border-radius: 999px;
  background: var(--ink);
  padding: 3px 7px;
  color: var(--surface-strong);
  font-size: 0.68rem;
  font-weight: 780;
  white-space: nowrap;
}
</style>
