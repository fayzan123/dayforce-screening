<script setup>
import { computed, ref } from 'vue';
import { LocateFixed } from '@lucide/vue';
import { useOrgTree } from '../../composables/useOrgTree.js';
import { formatCurrency, formatNumber, formatPercent } from '../../lib/format.js';
import FilterBar from './FilterBar.vue';
import HeatmapChart from './HeatmapChart.vue';
import HorizontalBarChart from './HorizontalBarChart.vue';
import IcicleChart from './IcicleChart.vue';
import LevelPyramid from './LevelPyramid.vue';
import MetricTile from './MetricTile.vue';
import ProportionChart from './ProportionChart.vue';
import SpanByDepartmentChart from './SpanByDepartmentChart.vue';
import SpanHistogram from './SpanHistogram.vue';
import StackedCostChart from './StackedCostChart.vue';

const emit = defineEmits(['show-org']);
const store = useOrgTree();
const heatmapMode = ref('headcount');

const analytics = computed(() => store.analytics.value);

function filter(key, value) {
  // Filters toggle off when the user clicks the active chip/bar again. That
  // keeps cross-filtering discoverable without extra reset controls per chart.
  store.setFilter(key, value);
}

function viewInOrgChart() {
  // The bonus view is more useful when findings can be traced back to people in
  // the hierarchy, so this jumps to a deterministic matching employee.
  store.viewFirstMatchingNode();
  emit('show-org');
}

function viewNodeInOrgChart(node) {
  store.expandPathTo(node.id);
  emit('show-org');
}
</script>

<template>
  <section v-if="analytics" class="analytics-view" aria-label="Organization cost analytics">
    <div class="analytics-heading">
      <div>
        <p class="eyebrow">Cost analytics</p>
        <h2>Where Giga Corp’s organization shape creates cost concentration</h2>
        <span v-if="store.hasActiveFilters.value" class="filter-badge">Filtered view</span>
      </div>
      <button type="button" @click="viewInOrgChart">
        <LocateFixed :size="18" aria-hidden="true" />
        View Match in Org Chart
      </button>
    </div>

    <FilterBar :analytics="analytics" :filters="store.filters.value" @filter="filter" @clear="store.clearFilters" />

    <div class="metric-grid">
      <MetricTile label="Filtered headcount" :value="formatNumber(analytics.summary.headcount)" note="Rows matching current filters" />
      <MetricTile label="Salary base" :value="formatCurrency(analytics.summary.salary)" note="Salary only, assessment metric source" />
      <MetricTile label="Bonus pool" :value="formatCurrency(analytics.summary.bonus)" note="Used only in analytics cost mix" />
      <MetricTile label="Manager cost share" :value="formatPercent(analytics.summary.managerCostShare)" note="Manager salary / filtered salary" />
      <MetricTile label="Average span" :value="analytics.summary.avgSpan.toFixed(2)" note="Direct reports per manager" />
    </div>

    <div class="analytics-grid">
      <IcicleChart class="wide" :root="store.root.value" @view-node="viewNodeInOrgChart" />

      <ProportionChart
        :rows="analytics.proportionRows"
        :mode="store.proportionMode.value"
        @mode="store.setProportionMode"
        @select="filter('department', $event.label)"
      />

      <HorizontalBarChart
        title="Department Cost Concentration"
        :rows="analytics.filteredDepartmentRows"
        value-key="salary"
        :active-label="store.filters.value.department"
        @select="filter('department', $event.label)"
      />

      <LevelPyramid :rows="analytics.filteredLevelRows" :active-level="store.filters.value.level" @select="filter('level', $event.level)" />

      <SpanHistogram :rows="analytics.spanRows" />

      <SpanByDepartmentChart :rows="analytics.spanByDepartmentRows" />

      <StackedCostChart
        :rows="analytics.stackedCostRows"
        :mode="store.costMode.value"
        :active-label="store.filters.value.department"
        @mode="store.setCostMode"
        @select="filter('department', $event.label)"
      />

      <HorizontalBarChart
        title="Location Cost Footprint"
        :rows="analytics.filteredLocationRows"
        value-key="salary"
        :active-label="store.filters.value.location"
        @select="filter('location', $event.label)"
      />

      <HeatmapChart class="wide" :heatmap="analytics.heatmap" :mode="heatmapMode" @mode="heatmapMode = $event" />
    </div>
  </section>
</template>

<style scoped>
.analytics-view {
  height: 100%;
  overflow: auto;
  padding: 88px 14px 18px;
}

.analytics-heading {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
}

.analytics-heading h2 {
  max-width: 760px;
  margin-bottom: 0;
  color: var(--ink);
  font-size: clamp(1.45rem, 2vw, 2.15rem);
  font-weight: 820;
  letter-spacing: 0;
  line-height: 1.02;
}

.filter-badge {
  display: inline-flex;
  margin-top: 8px;
  border: 1px solid color-mix(in oklch, var(--primary) 38%, var(--line));
  border-radius: 999px;
  background: var(--primary-soft);
  padding: 4px 9px;
  color: var(--primary-ink);
  font-size: 0.72rem;
  font-weight: 790;
}

.analytics-heading button {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid color-mix(in oklch, var(--primary) 50%, var(--line));
  border-radius: 7px;
  background: var(--primary);
  padding: 0 13px;
  color: var(--surface-strong);
  cursor: pointer;
  font-size: 0.84rem;
  font-weight: 760;
  white-space: nowrap;
}

.analytics-heading button:hover {
  background: color-mix(in oklch, var(--primary) 88%, var(--ink));
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.analytics-grid {
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.analytics-grid > * {
  grid-column: span 6;
}

.analytics-grid > .wide {
  grid-column: 1 / -1;
}

@media (max-width: 1180px) {
  .metric-grid {
    grid-template-columns: repeat(3, minmax(150px, 1fr));
  }
}

@media (max-width: 860px) {
  .analytics-view {
    padding-top: 14px;
  }

  .analytics-heading {
    align-items: stretch;
    flex-direction: column;
  }

  .analytics-heading button {
    width: 100%;
  }

  .metric-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .analytics-grid > * {
    grid-column: 1 / -1;
  }
}

@media (max-width: 520px) {
  .metric-grid {
    grid-template-columns: 1fr;
  }
}
</style>
