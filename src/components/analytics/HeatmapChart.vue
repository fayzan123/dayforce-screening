<script setup>
import { computed } from 'vue';
import { formatCurrency, formatNumber } from '../../lib/format.js';

const props = defineProps({
  heatmap: {
    type: Object,
    required: true,
  },
  mode: {
    type: String,
    default: 'headcount',
  },
});

const emit = defineEmits(['mode']);

const cellsByDepartment = computed(() => {
  const map = new Map();
  for (const department of props.heatmap.departments) map.set(department, []);
  for (const cell of props.heatmap.cells) {
    map.get(cell.department)?.push(cell);
  }
  return map;
});

function cellAlpha(cell) {
  // The heatmap color uses a normalized alpha so filtered views remain legible
  // even when the absolute headcount/cost scale changes dramatically.
  const max = props.mode === 'salary' ? props.heatmap.maxSalary : props.heatmap.maxHeadcount;
  const value = props.mode === 'salary' ? cell.salary : cell.headcount;
  return Math.max(0.08, value / Math.max(1, max));
}

function labelFor(cell) {
  return props.mode === 'salary' ? formatCurrency(cell.salary) : formatNumber(cell.headcount);
}

// The number rendered inside each cell follows the active mode, compact so it
// fits the fixed cell width. Empty cells (no people) stay blank in both modes.
function cellText(cell) {
  if (!cell.headcount) return '';
  return props.mode === 'salary'
    ? formatCurrency(cell.salary)
    : formatNumber(cell.headcount, { compact: true });
}
</script>

<template>
  <section class="chart-card heatmap-card">
    <header>
      <div>
        <h2>Level x Department Heatmap</h2>
        <p>{{ mode === 'salary' ? 'Salary density' : 'Headcount density' }}</p>
      </div>
      <div class="mode-toggle" aria-label="Heatmap mode">
        <button type="button" :class="{ active: mode === 'headcount' }" @click="emit('mode', 'headcount')">Headcount</button>
        <button type="button" :class="{ active: mode === 'salary' }" @click="emit('mode', 'salary')">Cost</button>
      </div>
    </header>

    <div class="heatmap-scroll">
      <div class="heatmap-grid" :style="{ gridTemplateColumns: `180px repeat(${heatmap.levels.length}, 58px)` }">
        <span class="corner">Department</span>
        <span v-for="level in heatmap.levels" :key="level" class="axis">L{{ level }}</span>

        <template v-for="department in heatmap.departments" :key="department">
          <span class="dept-label">{{ department }}</span>
          <span
            v-for="cell in cellsByDepartment.get(department)"
            :key="`${cell.department}-${cell.level}`"
            class="heat-cell"
            :title="`${department}, level ${cell.level}: ${labelFor(cell)}`"
            :style="{ '--alpha': cellAlpha(cell) }"
          >
            {{ cellText(cell) }}
          </span>
        </template>
      </div>
    </div>

    <div class="heat-legend">
      <span>Fewer</span>
      <span class="heat-ramp" aria-hidden="true" />
      <span>{{ mode === 'salary' ? 'More cost' : 'More people' }}</span>
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

.heatmap-scroll {
  overflow-x: auto;
  padding-bottom: 2px;
}

.heatmap-grid {
  display: grid;
  min-width: max-content;
  gap: 4px;
  align-items: stretch;
}

.corner,
.axis,
.dept-label,
.heat-cell {
  min-height: 32px;
  border-radius: 3px;
  font-size: 0.72rem;
  font-weight: 740;
}

.corner,
.axis {
  display: grid;
  place-items: center;
  background: var(--surface-muted);
  color: var(--ink-muted);
}

.dept-label {
  display: flex;
  align-items: center;
  overflow: hidden;
  padding: 0 8px;
  color: var(--ink-muted);
  text-overflow: ellipsis;
  white-space: nowrap;
}

.heat-cell {
  display: grid;
  place-items: center;
  background: color-mix(in oklch, var(--blue) calc(var(--alpha) * 86%), var(--surface-muted));
  color: color-mix(in oklch, var(--ink) 86%, var(--primary-ink));
  font-variant-numeric: tabular-nums;
}

.heat-legend {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--ink-soft);
  font-size: 0.7rem;
  font-weight: 720;
}

.heat-ramp {
  flex: 0 0 132px;
  height: 8px;
  border-radius: 2px;
  background: linear-gradient(
    90deg,
    color-mix(in oklch, var(--blue) 8%, var(--surface-muted)),
    color-mix(in oklch, var(--blue) 86%, var(--surface-muted))
  );
}

@media (max-width: 620px) {
  header {
    align-items: start;
    flex-direction: column;
  }
}
</style>
