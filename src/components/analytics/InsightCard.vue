<script setup>
import { BarChart3, LocateFixed } from '@lucide/vue';
import { formatPercent } from '../../lib/format.js';

defineProps({
  insight: {
    type: Object,
    required: true,
  },
  chartOpen: {
    type: Boolean,
    default: false,
  },
  hasChart: {
    type: Boolean,
    default: false,
  },
  controlsId: {
    type: String,
    default: null,
  },
});

defineEmits(['toggle-chart', 'find']);

const categoryLabels = {
  shape: 'Org shape',
  department: 'Department cost',
  location: 'Location cost',
  composition: 'Management line',
  span: 'Span of control',
};
</script>

<template>
  <article class="insight-card">
    <div class="insight-copy">
      <span class="category-tag">{{ categoryLabels[insight.category] ?? insight.category }}</span>
      <h3>{{ insight.headline }}</h3>
      <p>{{ insight.detail }}</p>
    </div>

    <div v-if="insight.evidence.kind === 'share-bar'" class="share-proof" aria-label="Insight evidence">
      <div
        class="proof-row"
        :aria-label="`${insight.evidence.headcountLabel}: ${formatPercent(insight.evidence.headcountShare)}`"
      >
        <span>{{ insight.evidence.headcountLabel }}</span>
        <i aria-hidden="true"><b :style="{ width: `${Math.max(3, insight.evidence.headcountShare * 100)}%` }" /></i>
        <strong>{{ formatPercent(insight.evidence.headcountShare) }}</strong>
      </div>
      <div
        class="proof-row cost"
        :aria-label="`${insight.evidence.costLabel}: ${formatPercent(insight.evidence.costShare)}`"
      >
        <span>{{ insight.evidence.costLabel }}</span>
        <i aria-hidden="true"><b :style="{ width: `${Math.max(3, insight.evidence.costShare * 100)}%` }" /></i>
        <strong>{{ formatPercent(insight.evidence.costShare) }}</strong>
      </div>
    </div>

    <div v-else class="value-proof" aria-label="Insight evidence">
      <span>{{ insight.evidence.label }}</span>
      <strong>{{ insight.evidence.value }}</strong>
      <em>{{ insight.evidence.note }}</em>
    </div>

    <div class="insight-actions">
      <button
        v-if="hasChart"
        type="button"
        :aria-expanded="String(chartOpen)"
        :aria-controls="controlsId"
        @click="$emit('toggle-chart')"
      >
        <BarChart3 :size="16" aria-hidden="true" />
        {{ chartOpen ? 'Hide chart' : 'See the chart' }}
      </button>
      <button v-if="insight.link.entity" type="button" @click="$emit('find')">
        <LocateFixed :size="16" aria-hidden="true" />
        Find in org chart
      </button>
    </div>
  </article>
</template>

<style scoped>
.insight-card {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(220px, 0.8fr);
  gap: var(--space-md);
  align-items: start;
  padding: var(--space-md) 0;
}

.insight-copy {
  min-width: 0;
}

.category-tag {
  display: inline-flex;
  color: var(--ink-soft);
  font-size: var(--fs-2xs);
  font-weight: 790;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

h3 {
  margin: 5px 0 0;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: var(--fs-md);
  font-weight: 790;
  letter-spacing: 0;
  line-height: 1.15;
}

p {
  margin: var(--space-xs) 0 0;
  color: var(--ink-muted);
  font-size: var(--fs-sm);
  line-height: 1.42;
}

.share-proof,
.value-proof {
  min-width: 0;
  border-left: 1px solid var(--line);
  padding-left: var(--space-md);
}

.share-proof {
  display: grid;
  gap: var(--space-xs);
}

.proof-row {
  display: grid;
  grid-template-columns: 54px minmax(70px, 1fr) 48px;
  gap: var(--space-xs);
  align-items: center;
}

.proof-row span,
.proof-row strong,
.value-proof span,
.value-proof em {
  color: var(--ink-soft);
  font-size: var(--fs-2xs);
  font-weight: 760;
}

.proof-row i {
  display: block;
  height: 9px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--surface-muted);
}

.proof-row b {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--primary);
}

.proof-row.cost b {
  background: var(--accent);
}

.proof-row strong {
  color: var(--ink);
  font-variant-numeric: tabular-nums;
  text-align: right;
}

.value-proof {
  display: grid;
  gap: 2px;
}

.value-proof strong {
  color: var(--ink);
  font-size: var(--fs-lg);
  font-variant-numeric: tabular-nums;
  font-weight: 820;
  letter-spacing: 0;
  line-height: 1;
}

.value-proof em {
  font-style: normal;
}

.insight-actions {
  display: flex;
  flex-wrap: wrap;
  grid-column: 1 / -1;
  gap: var(--space-xs);
}

.insight-actions button {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid var(--line);
  border-radius: var(--radius-sm);
  background: var(--surface);
  padding: 0 var(--space-sm);
  color: var(--ink-muted);
  cursor: pointer;
  font-size: var(--fs-xs);
  font-weight: 760;
  transition:
    background 140ms var(--ease-out),
    border-color 140ms var(--ease-out),
    color 140ms var(--ease-out);
}

.insight-actions button:hover {
  border-color: var(--primary-line);
  background: var(--primary-soft);
  color: var(--primary-ink);
}

@media (max-width: 720px) {
  .insight-card {
    grid-template-columns: 1fr;
  }

  .share-proof,
  .value-proof {
    border-left: 0;
    border-top: 1px solid var(--line);
    padding-top: var(--space-sm);
    padding-left: 0;
  }
}
</style>
