<script setup>
// Department proportion: a single proportional band plus a ranked list, toggled
// between salary share and headcount share. Rows flagged `isOther` are the
// rolled-up long tail and are rendered as non-interactive (no useful filter).
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

// Drives the per-segment tint: the largest share maps to the strongest fill.
// Floor avoids divide-by-zero when every share rounds to zero.
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
        :class="{ other: row.isOther }"
        :style="row.isOther
          ? { flexGrow: Math.max(0.02, row.share) }
          : { flexGrow: Math.max(0.02, row.share), background: `color-mix(in oklch, var(--primary) ${24 + row.share / maxShare * 58}%, var(--surface-muted))` }"
      />
    </div>

    <div class="proportion-list">
      <component
        :is="row.isOther ? 'div' : 'button'"
        v-for="row in rows"
        :key="row.label"
        :type="row.isOther ? undefined : 'button'"
        :class="{ other: row.isOther }"
        @click="row.isOther ? null : emit('select', row)"
      >
        <span>
          <strong>{{ row.label }}</strong>
          <i>{{ formatValue(row) }}</i>
        </span>
        <em>{{ formatPercent(row.share) }}</em>
      </component>
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
  min-height: 44px;
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
  border-radius: 3px;
  background: var(--surface-muted);
}

.proportion-band span {
  min-width: 5px;
}

/* The remainder segment reads as an aggregate, not a single department. */
.proportion-band span.other {
  background: repeating-linear-gradient(
    45deg,
    var(--surface-muted),
    var(--surface-muted) 4px,
    color-mix(in oklch, var(--ink) 9%, var(--surface-muted)) 4px,
    color-mix(in oklch, var(--ink) 9%, var(--surface-muted)) 8px
  );
}

.proportion-list {
  display: grid;
  gap: 6px;
}

.proportion-list > * {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 44px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  padding: 6px 7px;
  text-align: left;
}

.proportion-list button {
  cursor: pointer;
}

.proportion-list button:hover {
  border-color: var(--line);
  background: var(--surface-muted);
}

.proportion-list .other {
  margin-top: 2px;
  border-top: 1px solid var(--line);
  border-radius: 0;
  cursor: default;
}

.proportion-list .other strong {
  color: var(--ink-soft);
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
