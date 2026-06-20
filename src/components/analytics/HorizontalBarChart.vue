<script setup>
import { computed } from 'vue';
import { formatCurrency, formatNumber } from '../../lib/format.js';

const props = defineProps({
  title: {
    type: String,
    required: true,
  },
  rows: {
    type: Array,
    required: true,
  },
  valueKey: {
    type: String,
    default: 'salary',
  },
  activeLabel: {
    type: String,
    default: null,
  },
  valueType: {
    type: String,
    default: 'currency',
  },
});

defineEmits(['select']);

const maxValue = computed(() => Math.max(1, ...props.rows.map((row) => row[props.valueKey] ?? 0)));

function formatValue(value) {
  return props.valueType === 'number' ? formatNumber(value, { compact: true }) : formatCurrency(value);
}
</script>

<template>
  <section class="chart-card">
    <header>
      <h2>{{ title }}</h2>
      <p>{{ rows.length }} groups</p>
    </header>

    <div class="bar-list">
      <button
        v-for="row in rows"
        :key="row.label"
        type="button"
        :class="{ active: activeLabel === row.label }"
        @click="$emit('select', row)"
      >
        <span class="bar-label">{{ row.label }}</span>
        <span class="bar-track" aria-hidden="true">
          <span :style="{ width: `${Math.max(3, ((row[valueKey] ?? 0) / maxValue) * 100)}%` }" />
        </span>
        <strong>{{ formatValue(row[valueKey] ?? 0) }}</strong>
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
  align-items: baseline;
  justify-content: space-between;
  gap: 12px;
}

h2 {
  margin-bottom: 0;
  color: var(--ink);
  font-size: 1rem;
  font-weight: 790;
}

p {
  margin-bottom: 0;
  color: var(--ink-soft);
  font-size: 0.75rem;
  font-weight: 720;
}

.bar-list {
  display: grid;
  gap: 8px;
}

.bar-list button {
  display: grid;
  grid-template-columns: minmax(120px, 0.8fr) minmax(120px, 1.4fr) auto;
  align-items: center;
  gap: 10px;
  min-height: 38px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  padding: 5px 7px;
  cursor: pointer;
}

.bar-list button:hover,
.bar-list button.active {
  border-color: var(--line);
  background: var(--surface-muted);
}

.bar-label {
  overflow: hidden;
  color: var(--ink-muted);
  font-size: 0.78rem;
  font-weight: 740;
  text-align: left;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.bar-track {
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: var(--surface-muted);
}

.bar-track span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: var(--primary);
}

strong {
  color: var(--ink);
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
  font-weight: 790;
  white-space: nowrap;
}

@media (max-width: 620px) {
  .bar-list button {
    grid-template-columns: minmax(0, 1fr) auto;
  }

  .bar-track {
    grid-column: 1 / -1;
    grid-row: 2;
  }
}
</style>
