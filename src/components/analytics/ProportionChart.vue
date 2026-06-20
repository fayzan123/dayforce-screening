<script setup>
import { computed } from 'vue';
import { formatCurrency, formatNumber, formatPercent } from '../../lib/format.js';

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  mode: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(['mode', 'select']);

const maxShare = computed(() => Math.max(0.01, ...props.rows.map((row) => row.share)));

function formatValue(row) {
  return props.mode === 'headcount' ? formatNumber(row.headcount) : formatCurrency(row.salary);
}
</script>

<template>
  <section class="chart-card">
    <header>
      <div>
        <h2>Department Proportion</h2>
        <p>{{ mode === 'headcount' ? 'Headcount share' : 'Salary share' }}</p>
      </div>
      <div class="mode-toggle" aria-label="Proportion mode">
        <button type="button" :class="{ active: mode === 'salary' }" @click="emit('mode', 'salary')">Salary</button>
        <button type="button" :class="{ active: mode === 'headcount' }" @click="emit('mode', 'headcount')">Headcount</button>
      </div>
    </header>

    <div class="proportion-band" aria-hidden="true">
      <span
        v-for="row in rows"
        :key="row.label"
        :style="{ flexGrow: Math.max(0.02, row.share), background: `color-mix(in oklch, var(--primary) ${24 + row.share / maxShare * 58}%, var(--surface-muted))` }"
      />
    </div>

    <div class="proportion-list">
      <button v-for="row in rows" :key="row.label" type="button" @click="emit('select', row)">
        <span>
          <strong>{{ row.label }}</strong>
          <i>{{ formatValue(row) }}</i>
        </span>
        <em>{{ formatPercent(row.share) }}</em>
      </button>
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
  align-items: center;
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

.mode-toggle {
  display: flex;
  gap: 3px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface-muted);
  padding: 3px;
}

.mode-toggle button {
  min-height: 30px;
  border: 0;
  border-radius: 999px;
  background: transparent;
  padding: 0 10px;
  color: var(--ink-muted);
  cursor: pointer;
  font-size: 0.74rem;
  font-weight: 780;
}

.mode-toggle button.active {
  background: var(--surface-strong);
  color: var(--primary-ink);
}

.proportion-band {
  display: flex;
  gap: 3px;
  height: 34px;
  overflow: hidden;
  border-radius: 7px;
  background: var(--surface-muted);
}

.proportion-band span {
  min-width: 5px;
}

.proportion-list {
  display: grid;
  gap: 6px;
}

.proportion-list button {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  padding: 6px 7px;
  cursor: pointer;
  text-align: left;
}

.proportion-list button:hover {
  border-color: var(--line);
  background: var(--surface-muted);
}

.proportion-list span,
strong,
i {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

strong {
  display: block;
  color: var(--ink-muted);
  font-size: 0.78rem;
  font-weight: 760;
}

i,
em {
  color: var(--ink-soft);
  font-size: 0.72rem;
  font-style: normal;
  font-variant-numeric: tabular-nums;
  font-weight: 720;
}

em {
  color: var(--ink);
  font-weight: 800;
}

@media (max-width: 620px) {
  header {
    align-items: start;
    flex-direction: column;
  }
}
</style>
