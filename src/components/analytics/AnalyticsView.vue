<script setup>
import { computed, ref } from 'vue';
import { LocateFixed } from '@lucide/vue';
import { useOrgTree } from '../../composables/useOrgTree.js';
import { formatCurrency, formatNumber, formatPercent } from '../../lib/format.js';
import { deriveInsights } from '../../lib/insights.js';
import { createAnalyticsChartRegistry } from './chartRegistry.js';
import FilterBar from './FilterBar.vue';
import InsightBriefing from './InsightBriefing.vue';
import MetricTile from './MetricTile.vue';

const emit = defineEmits(['show-org']);
const store = useOrgTree();
const heatmapMode = ref('headcount');

const analytics = computed(() => store.analytics.value);
const insights = computed(() => deriveInsights(analytics.value));

// A department + location (or level) combination can match nobody. Rather than
// render a grid of empty charts, show one clear recovery state.
const isEmpty = computed(() => Boolean(analytics.value) && analytics.value.summary.headcount === 0);

const activeFilterSummary = computed(() => {
  const f = store.filters.value;
  return [f.department, f.location, f.level ? `Level ${f.level}` : null].filter(Boolean).join(' · ');
});

const chartRegistry = computed(() => {
  if (!analytics.value || !store.root.value) return [];
  return createAnalyticsChartRegistry({
    analytics: analytics.value,
    store,
    root: store.root.value,
    heatmapMode: heatmapMode.value,
    setHeatmapMode,
    filter,
    viewNodeInOrgChart,
  });
});

const leadSilhouette = computed(() => chartRegistry.value.find((chart) => chart.id === 'layer-silhouette') ?? null);
// The lead silhouette is already shown beside the briefing, so it backs the
// shape insight without offering a redundant inline copy.
const briefingCharts = computed(() => chartRegistry.value.filter((chart) => chart.supportsInsight && chart.placement !== 'lead'));
const exploreCharts = computed(() => chartRegistry.value.filter((chart) => chart.placement === 'explore'));

function filter(key, value) {
  // Filters toggle off when the user clicks the active chip/bar again. That
  // keeps cross-filtering discoverable without extra reset controls per chart.
  store.setFilter(key, value);
}

function setHeatmapMode(mode) {
  heatmapMode.value = mode;
}

function viewInOrgChart() {
  // The bonus view is more useful when findings can be traced back to people in
  // the hierarchy, so this jumps to a deterministic matching employee.
  store.viewFirstMatchingNode();
  emit('show-org');
}

function filterAlreadyMatches(entity) {
  const current = store.filters.value[entity.key];
  return entity.key === 'level' ? Number(current) === Number(entity.value) : current === entity.value;
}

function viewInsightInOrgChart(insight) {
  const entity = insight.link?.entity;
  if (entity && !filterAlreadyMatches(entity)) {
    store.setFilter(entity.key, entity.value);
  }
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
      <button type="button" :disabled="isEmpty" @click="viewInOrgChart">
        <LocateFixed :size="18" aria-hidden="true" />
        View Match in Org Chart
      </button>
    </div>

    <FilterBar :analytics="analytics" :filters="store.filters.value" @filter="filter" @clear="store.clearFilters" />

    <div v-if="isEmpty" class="filtered-empty">
      <p class="eyebrow">No matches</p>
      <h3>No employees fit this filter combination</h3>
      <p><strong>{{ activeFilterSummary }}</strong> returns zero people. Remove a filter to widen the view.</p>
      <button type="button" @click="store.clearFilters">Clear all filters</button>
    </div>

    <template v-else>
    <div class="metric-grid">
      <MetricTile label="Filtered headcount" :value="formatNumber(analytics.summary.headcount)" note="Rows matching current filters" />
      <MetricTile label="Salary base" :value="formatCurrency(analytics.summary.salary)" note="Salary only, assessment metric source" />
      <MetricTile label="Bonus pool" :value="formatCurrency(analytics.summary.bonus)" note="Used only in analytics cost mix" />
      <MetricTile label="Manager cost share" :value="formatPercent(analytics.summary.managerCostShare)" note="Manager salary / filtered salary" />
      <MetricTile label="Average span" :value="analytics.summary.avgSpan.toFixed(2)" note="Direct reports per manager" />
    </div>

    <div class="analytics-lead-grid">
      <InsightBriefing
        :insights="insights"
        :filters="store.filters.value"
        :charts="briefingCharts"
        @find="viewInsightInOrgChart"
      />

      <template v-if="leadSilhouette">
        <component
          :is="leadSilhouette.component"
          class="lead-silhouette"
          v-bind="leadSilhouette.props"
          v-on="leadSilhouette.listeners"
        />
      </template>
    </div>

    <details class="explore-charts">
      <summary>
        <span>Explore all charts</span>
        <em>{{ exploreCharts.length }} views</em>
      </summary>

      <div class="analytics-grid">
        <component
          :is="chart.component"
          v-for="chart in exploreCharts"
          :key="chart.id"
          :class="chart.className"
          v-bind="chart.props"
          v-on="chart.listeners"
        />
      </div>
    </details>
    </template>
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
  color: var(--on-primary);
  cursor: pointer;
  font-size: 0.84rem;
  font-weight: 760;
  white-space: nowrap;
}

.analytics-heading button:hover:not(:disabled) {
  background: color-mix(in oklch, var(--primary) 88%, var(--ink));
}

.analytics-heading button:disabled {
  border-color: var(--line);
  background: var(--surface-muted);
  color: var(--ink-soft);
  cursor: not-allowed;
}

.filtered-empty {
  margin-top: 12px;
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-lg);
  background: var(--surface-strong);
  padding: var(--space-2xl) var(--space-xl);
  box-shadow: var(--shadow-xs);
}

.filtered-empty h3 {
  margin: 0 0 var(--space-xs);
  color: var(--ink);
  font-family: var(--font-display);
  font-size: var(--fs-lg);
  font-weight: 760;
  letter-spacing: -0.01em;
}

.filtered-empty p {
  margin: 0;
  max-width: 56ch;
  color: var(--ink-muted);
  font-size: var(--fs-sm);
}

.filtered-empty strong {
  color: var(--ink);
  font-weight: 760;
}

.filtered-empty button {
  display: inline-flex;
  min-height: 40px;
  align-items: center;
  margin-top: var(--space-lg);
  border: 1px solid color-mix(in oklch, var(--primary) 50%, var(--line));
  border-radius: var(--radius-sm);
  background: var(--primary);
  padding: 0 var(--space-md);
  color: var(--on-primary);
  cursor: pointer;
  font-size: var(--fs-sm);
  font-weight: 760;
  transition: background 140ms var(--ease-out);
}

.filtered-empty button:hover {
  background: color-mix(in oklch, var(--primary) 88%, var(--ink));
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(5, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 12px;
}

.analytics-lead-grid {
  display: grid;
  grid-template-columns: minmax(390px, 0.95fr) minmax(480px, 1.05fr);
  gap: 12px;
  /* Top-align the columns so expanding an inline chart in the briefing grows
     only that column — the silhouette keeps its natural height and stays put. */
  align-items: start;
  margin-top: 12px;
}

.lead-silhouette {
  margin-top: 0;
}

.explore-charts {
  margin-top: 12px;
}

.explore-charts summary {
  position: relative;
  display: flex;
  min-height: 48px;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  border-top: 1px solid var(--line-strong);
  border-bottom: 1px solid var(--line-strong);
  background: var(--surface-strong);
  padding: 0 var(--space-md);
  color: var(--ink);
  cursor: pointer;
  font-size: var(--fs-sm);
  font-weight: 790;
  list-style: none;
}

.explore-charts summary::-webkit-details-marker {
  display: none;
}

.explore-charts summary::after {
  content: '+';
  display: grid;
  width: 24px;
  height: 24px;
  place-items: center;
  border: 1px solid var(--line);
  border-radius: var(--radius-xs);
  color: var(--ink-muted);
  font-size: var(--fs-md);
  line-height: 1;
}

.explore-charts[open] summary::after {
  content: '-';
}

.explore-charts summary em {
  margin-left: auto;
  color: var(--ink-soft);
  font-size: var(--fs-xs);
  font-style: normal;
  font-variant-numeric: tabular-nums;
  font-weight: 730;
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

  .analytics-lead-grid {
    grid-template-columns: 1fr;
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

  .explore-charts summary {
    align-items: start;
    flex-direction: column;
    justify-content: center;
    padding: var(--space-sm) var(--space-md);
  }

  .explore-charts summary::after {
    position: absolute;
    right: var(--space-md);
  }

  .explore-charts summary em {
    margin-left: 0;
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
