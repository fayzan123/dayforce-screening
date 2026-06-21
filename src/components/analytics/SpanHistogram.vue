<script setup>
// Column histogram of managers bucketed by direct-report count (1:1 .. 1:4, plus
// a folded 1:5+ tail). Shows whether the org leans toward thin or wide spans.
import { computed } from 'vue';
import { formatCurrency, formatNumber } from '../../lib/format.js';

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
});

// Always render buckets 1..4 (zero-filled when missing) so the axis is stable
// across filters, then append a 5+ bucket only when wider spans actually exist.
const normalizedRows = computed(() => {
  const bySpan = new Map(props.rows.map((row) => [row.span, row]));
  const base = [1, 2, 3, 4].map((span) => bySpan.get(span) ?? { span, label: `1:${span}`, headcount: 0, salary: 0 });

  // Fold any managers with 5+ direct reports into one bucket so the distribution
  // never silently drops the long tail. The current dataset tops out at 4, so no
  // bucket is added then; this only appears if wider spans exist.
  const tail = props.rows.filter((row) => row.span >= 5);
  if (tail.length) {
    base.push({
      span: 5,
      label: '1:5+',
      headcount: tail.reduce((total, row) => total + row.headcount, 0),
      salary: tail.reduce((total, row) => total + row.salary, 0),
    });
  }

  return base;
});

const maxHeadcount = computed(() => Math.max(1, ...normalizedRows.value.map((row) => row.headcount)));
</script>

<template>
  <section class="chart-card">
    <header>
      <h2>Span of Control</h2>
      <p>Managers by direct reports</p>
    </header>

    <div
      class="histogram"
      :style="{ gridTemplateColumns: `repeat(${normalizedRows.length}, minmax(56px, 1fr))` }"
      aria-label="Span of control distribution"
    >
      <div v-for="row in normalizedRows" :key="row.span" class="column">
        <div class="column-plot">
          <span :style="{ height: `${Math.max(2, (row.headcount / maxHeadcount) * 100)}%` }" />
        </div>
        <strong>{{ row.label }}</strong>
        <em>{{ formatNumber(row.headcount) }}</em>
        <small>{{ formatCurrency(row.salary) }}</small>
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

.histogram {
  display: grid;
  grid-template-columns: repeat(4, minmax(64px, 1fr));
  gap: 10px;
  min-height: 230px;
}

.column {
  display: grid;
  grid-template-rows: minmax(110px, 1fr) auto auto auto;
  gap: 5px;
  min-width: 0;
  text-align: center;
}

.column-plot {
  display: flex;
  align-items: end;
  justify-content: center;
  border-radius: 8px;
  background: var(--surface-muted);
  padding: 8px;
}

.column-plot span {
  display: block;
  width: min(64px, 70%);
  border-radius: 3px 3px 0 0;
  background: var(--primary);
}

strong,
em,
small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

strong {
  color: var(--ink);
  font-size: 0.84rem;
  font-weight: 800;
}

em,
small {
  color: var(--ink-muted);
  font-size: 0.73rem;
  font-style: normal;
  font-variant-numeric: tabular-nums;
  font-weight: 720;
}
</style>
