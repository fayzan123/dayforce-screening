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
</script>

<template>
  <section class="chart-card heatmap-card">
    <header>
      <h2>Level x Department Heatmap</h2>
      <p>{{ mode === 'salary' ? 'Salary density' : 'Headcount density' }}</p>
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
            {{ cell.headcount ? formatNumber(cell.headcount, { compact: true }) : '' }}
          </span>
        </template>
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
  border-radius: 6px;
  font-size: 0.72rem;
  font-weight: 740;
}

.corner,
.axis {
  display: grid;
  place-items: center;
  background: var(--surface-muted);
  color: var(--ink-soft);
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
</style>
