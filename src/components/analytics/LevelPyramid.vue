<script setup>
import { computed } from 'vue';
import { formatCurrency, formatNumber } from '../../lib/format.js';

const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  activeLevel: {
    type: Number,
    default: null,
  },
});

defineEmits(['select']);

const maxHeadcount = computed(() => Math.max(1, ...props.rows.map((row) => row.headcount)));
</script>

<template>
  <section class="chart-card pyramid-card">
    <header>
      <h2>Layer Pyramid</h2>
      <p>Headcount by level</p>
    </header>

    <div class="pyramid">
      <button
        v-for="row in rows"
        :key="row.level"
        type="button"
        :class="{ active: activeLevel === row.level }"
        @click="$emit('select', row)"
      >
        <span>Level {{ row.level }}</span>
        <div class="pyramid-track" aria-hidden="true">
          <i :style="{ width: `${Math.max(4, (row.headcount / maxHeadcount) * 100)}%` }" />
        </div>
        <strong>{{ formatNumber(row.headcount) }}</strong>
        <em>{{ formatCurrency(row.salary) }}</em>
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

.pyramid {
  display: grid;
  gap: 7px;
}

.pyramid button {
  display: grid;
  grid-template-columns: 64px minmax(110px, 1fr) 72px 82px;
  align-items: center;
  gap: 9px;
  min-height: 36px;
  border: 1px solid transparent;
  border-radius: 7px;
  background: transparent;
  padding: 5px 6px;
  cursor: pointer;
}

.pyramid button:hover,
.pyramid button.active {
  border-color: var(--line);
  background: var(--surface-muted);
}

.pyramid span {
  color: var(--ink-muted);
  font-size: 0.76rem;
  font-weight: 760;
}

.pyramid-track {
  display: flex;
  justify-content: center;
  height: 16px;
}

.pyramid-track i {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: color-mix(in oklch, var(--green) 86%, var(--surface));
}

strong,
em {
  color: var(--ink);
  font-size: 0.76rem;
  font-variant-numeric: tabular-nums;
  font-style: normal;
  font-weight: 780;
  text-align: right;
  white-space: nowrap;
}

em {
  color: var(--ink-muted);
}

@media (max-width: 560px) {
  .pyramid button {
    grid-template-columns: 62px minmax(120px, 1fr) auto;
  }

  em {
    display: none;
  }
}
</style>
