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
