<script setup>
import { computed } from 'vue';
import { formatCurrency } from '../../lib/format.js';

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  mode: {
    type: String,
    required: true,
  },
  activeLabel: {
    type: String,
    default: null,
  },
});

defineEmits(['select', 'mode']);

const maxTotal = computed(() => Math.max(1, ...props.rows.map((row) => row.total)));

// Segment colors are semantic: compensation components and role categories keep
// stable colors as the user switches chart modes.
const segmentTone = {
  Salary: 'salary',
  Bonus: 'bonus',
  Management: 'management',
  IC: 'ic',
};

// The legend follows whichever segments the active mode produces, so the colors
// are never left unexplained (and the chart never relies on color alone).
const legend = computed(() => {
  const keys = [];
  for (const row of props.rows) {
    for (const segment of row.segments) {
      if (!keys.includes(segment.key)) keys.push(segment.key);
    }
  }
  return keys;
});
</script>

<template>
  <section class="chart-card">
    <header>
      <div>
        <h2>Stacked Cost Mix</h2>
        <p>{{ mode === 'role' ? 'Management vs IC salary' : 'Salary plus bonus' }}</p>
      </div>
      <div class="mode-toggle" aria-label="Cost mode">
        <button type="button" :class="{ active: mode === 'comp' }" @click="$emit('mode', 'comp')">Comp</button>
        <button type="button" :class="{ active: mode === 'role' }" @click="$emit('mode', 'role')">Role</button>
      </div>
    </header>

    <ul class="legend">
      <li v-for="key in legend" :key="key">
        <i :class="segmentTone[key]" aria-hidden="true" />
        {{ key }}
      </li>
    </ul>

    <div class="stack-list">
      <button
        v-for="row in rows"
        :key="row.label"
        type="button"
        :class="{ active: activeLabel === row.label }"
        @click="$emit('select', row)"
      >
        <span class="label">{{ row.label }}</span>
        <span class="stack-track" aria-hidden="true">
          <i
            v-for="segment in row.segments"
            :key="segment.key"
            :class="segmentTone[segment.key]"
            :style="{ width: `${Math.max(0, (segment.value / maxTotal) * 100)}%` }"
          />
        </span>
        <strong>{{ formatCurrency(row.total) }}</strong>
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

.stack-list {
  display: grid;
  gap: 8px;
}

.stack-list > button {
  display: grid;
  grid-template-columns: minmax(110px, 0.8fr) minmax(140px, 1.3fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  padding: 5px 7px;
  cursor: pointer;
}

.stack-list > button:hover,
.stack-list > button.active {
  border-color: var(--line);
  background: var(--surface-muted);
}

.label {
  overflow: hidden;
  color: var(--ink-muted);
  font-size: 0.78rem;
  font-weight: 740;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.legend {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.legend li {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: var(--ink-muted);
  font-size: 0.72rem;
  font-weight: 720;
}

.legend i {
  width: 10px;
  height: 10px;
  border-radius: 2px;
}

.stack-track {
  display: flex;
  height: 12px;
  overflow: hidden;
  border-radius: 2px;
  background: var(--surface-muted);
}

.stack-track i {
  display: block;
  height: 100%;
}

.salary {
  background: var(--primary);
}

.bonus {
  background: var(--amber);
}

.management {
  background: var(--coral);
}

.ic {
  background: var(--green);
}

strong {
  color: var(--ink);
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
  font-weight: 790;
  white-space: nowrap;
}

@media (max-width: 620px) {
  header {
    align-items: start;
    flex-direction: column;
  }

  .stack-list > button {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .stack-track {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
</style>
