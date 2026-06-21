<script setup>
// Bars ranking departments by their average span of control (mean direct reports
// per manager). Read-only — there is no useful cross-filter on an average.
import { computed } from 'vue';
import { formatCurrency, formatNumber } from '../../lib/format.js';

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
});

// Scale bars against the widest span; floor at 1 to avoid divide-by-zero.
const maxSpan = computed(() => Math.max(1, ...props.rows.map((row) => row.avgSpan)));
</script>

<template>
  <section class="chart-card">
    <header>
      <h2>Average Span by Department</h2>
      <p>Intrinsic direct-report span</p>
    </header>

    <div class="span-list">
      <div v-for="row in rows" :key="row.label" class="span-row">
        <span class="label">{{ row.label }}</span>
        <span class="track" aria-hidden="true">
          <i :style="{ width: `${Math.max(4, (row.avgSpan / maxSpan) * 100)}%` }" />
        </span>
        <strong>{{ row.avgSpan.toFixed(2) }}</strong>
        <em>{{ formatNumber(row.managers) }} mgrs · {{ formatCurrency(row.salary) }}</em>
      </div>
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
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
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

.span-list {
  display: grid;
  gap: 8px;
}

.span-row {
  display: grid;
  grid-template-columns: minmax(120px, 0.8fr) minmax(120px, 1.2fr) 48px minmax(118px, auto);
  align-items: center;
  gap: 10px;
  min-height: 36px;
}

.label {
  overflow: hidden;
  color: var(--ink-muted);
  font-size: 0.78rem;
  font-weight: 740;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.track {
  height: 10px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--surface-muted);
}

.track i {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--primary);
}

strong,
em {
  color: var(--ink);
  font-size: 0.76rem;
  font-variant-numeric: tabular-nums;
  font-style: normal;
  font-weight: 790;
  white-space: nowrap;
}

em {
  overflow: hidden;
  color: var(--ink-soft);
  text-overflow: ellipsis;
}

@media (max-width: 660px) {
  .span-row {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .track {
    grid-column: 1 / -1;
    grid-row: 2;
  }

  em {
    display: none;
  }
}
</style>
