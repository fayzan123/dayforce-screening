import { INSIGHT_CHART_IDS } from '../../lib/insights.js';
import HeatmapChart from './HeatmapChart.vue';
import HorizontalBarChart from './HorizontalBarChart.vue';
import IcicleChart from './IcicleChart.vue';
import OrgSilhouette from './OrgSilhouette.vue';
import ProportionChart from './ProportionChart.vue';
import SpanByDepartmentChart from './SpanByDepartmentChart.vue';
import SpanHistogram from './SpanHistogram.vue';
import StackedCostChart from './StackedCostChart.vue';

const insightChartIds = new Set(INSIGHT_CHART_IDS);

/**
 * Single source of truth for the analytics charts. AnalyticsView renders this
 * list rather than hard-coding each chart, so adding or reordering a chart is a
 * one-entry change here.
 *
 * Each entry is:
 * - `id`            stable key, also what insight links target (see insights.js)
 * - `title`         heading shown above the chart
 * - `placement`     'lead' for the hero silhouette, 'explore' for the grid below
 * - `className`     optional layout hint, e.g. 'wide' to span two columns
 * - `supportsInsight` true when an insight can deep-link to this chart, kept in
 *                   sync with INSIGHT_CHART_IDS so the wiring can't drift
 * - `component`     the chart component
 * - `props`         reactive props (filtered rows + current control state)
 * - `listeners`     event handlers, mostly cross-filtering back into the store
 *
 * Receives the already-computed analytics slice and store so this stays pure
 * config with no data logic of its own.
 */
export function createAnalyticsChartRegistry({ analytics, store, root, heatmapMode, setHeatmapMode, filter, viewNodeInOrgChart }) {
  return [
    {
      id: 'layer-silhouette',
      title: 'Organizational Silhouette',
      placement: 'lead',
      supportsInsight: insightChartIds.has('layer-silhouette'),
      component: OrgSilhouette,
      props: {
        rows: analytics.filteredLevelRows,
        activeLevel: store.filters.value.level,
      },
      listeners: {
        select: (row) => filter('level', row.level),
      },
    },
    {
      id: 'icicle',
      title: 'Org Cost Icicle',
      placement: 'explore',
      className: 'wide',
      component: IcicleChart,
      props: {
        root,
      },
      listeners: {
        'view-node': viewNodeInOrgChart,
      },
    },
    {
      id: 'proportion',
      title: 'Department Proportion',
      placement: 'explore',
      component: ProportionChart,
      props: {
        rows: analytics.proportionRows,
        mode: store.proportionMode.value,
      },
      listeners: {
        mode: store.setProportionMode,
        select: (row) => filter('department', row.label),
      },
    },
    {
      id: 'department-cost',
      title: 'Department Cost Concentration',
      placement: 'explore',
      supportsInsight: insightChartIds.has('department-cost'),
      component: HorizontalBarChart,
      props: {
        title: 'Department Cost Concentration',
        rows: analytics.filteredDepartmentRows,
        valueKey: 'salary',
        activeLabel: store.filters.value.department,
      },
      listeners: {
        select: (row) => filter('department', row.label),
      },
    },
    {
      id: 'span-hist',
      title: 'Span of Control',
      placement: 'explore',
      supportsInsight: insightChartIds.has('span-hist'),
      component: SpanHistogram,
      props: {
        rows: analytics.spanRows,
      },
      listeners: {},
    },
    {
      id: 'span-department',
      title: 'Average Span by Department',
      placement: 'explore',
      component: SpanByDepartmentChart,
      props: {
        rows: analytics.spanByDepartmentRows,
      },
      listeners: {},
    },
    {
      id: 'cost-stack',
      title: 'Stacked Cost Mix',
      placement: 'explore',
      supportsInsight: insightChartIds.has('cost-stack'),
      component: StackedCostChart,
      props: {
        rows: analytics.stackedCostRows,
        mode: store.costMode.value,
        activeLabel: store.filters.value.department,
      },
      listeners: {
        mode: store.setCostMode,
        select: (row) => filter('department', row.label),
      },
    },
    {
      id: 'location-cost',
      title: 'Location Cost Footprint',
      placement: 'explore',
      supportsInsight: insightChartIds.has('location-cost'),
      component: HorizontalBarChart,
      props: {
        title: 'Location Cost Footprint',
        rows: analytics.filteredLocationRows,
        valueKey: 'salary',
        activeLabel: store.filters.value.location,
      },
      listeners: {
        select: (row) => filter('location', row.label),
      },
    },
    {
      id: 'heatmap',
      title: 'Level x Department Heatmap',
      placement: 'explore',
      className: 'wide',
      component: HeatmapChart,
      props: {
        heatmap: analytics.heatmap,
        mode: heatmapMode,
      },
      listeners: {
        mode: setHeatmapMode,
      },
    },
  ];
}
