import { formatCurrency, formatNumber, formatPercent, slugKey } from './format.js';

export const INSIGHT_CHART_IDS = Object.freeze([
  'department-cost',
  'location-cost',
  'layer-silhouette',
  'cost-stack',
  'span-hist',
]);

const VALID_CHART_IDS = new Set(INSIGHT_CHART_IDS);
const MAX_INSIGHTS = 4;
const MAX_PER_CATEGORY = 2;
const MIN_SHARE_GAP = 0.005;
const DOMINANT_LAYER_MIN_SHARE = 0.2;
const THIN_SPAN_MIN_SHARE = 0.08;
const SINGLE_REPORT_MIN_SHARE = 0.02;

function clamp01(value) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(1, value));
}

function share(value, total) {
  return total > 0 ? value / total : 0;
}

function percentagePoints(value) {
  return `${(value * 100).toFixed(1)} pts`;
}

function hasQuantifiedClaim(headline) {
  return /\d/.test(headline);
}

function isRenderable(insight) {
  return Boolean(
    insight?.headline &&
      hasQuantifiedClaim(insight.headline) &&
      insight.evidence &&
      insight.link?.chart &&
      VALID_CHART_IDS.has(insight.link.chart),
  );
}

function shareEvidence(row, summary) {
  return {
    kind: 'share-bar',
    headcountShare: share(row.headcount, summary.headcount),
    costShare: share(row.salary, summary.salary),
    headcountLabel: 'People',
    costLabel: 'Salary',
  };
}

function concentrationInsight(row, summary, { category, chart, entityKey, labelPrefix }) {
  const headcountShare = share(row.headcount, summary.headcount);
  const costShare = share(row.salary, summary.salary);
  const gap = costShare - headcountShare;
  if (gap < MIN_SHARE_GAP) return null;

  return {
    id: `${category}:${slugKey(row.label)}`,
    category,
    severity: clamp01(gap / 0.02),
    headline: `${row.label} carries ${formatPercent(costShare)} of salary on ${formatPercent(headcountShare)} of people`,
    detail: `${labelPrefix} is ${percentagePoints(gap)} heavier in salary share than headcount share.`,
    evidence: shareEvidence(row, summary),
    link: {
      chart,
      entity: { key: entityKey, value: row.label },
    },
  };
}

function detectDominantLayer(analytics) {
  const rows = analytics.filteredLevelRows ?? [];
  const summary = analytics.summary;
  if (!summary?.headcount || rows.length <= 1) return [];

  const dominant = rows.reduce((top, row) => (row.headcount > top.headcount ? row : top), rows[0]);
  const headcountShare = share(dominant.headcount, summary.headcount);
  if (headcountShare < DOMINANT_LAYER_MIN_SHARE) return [];

  return [
    {
      id: `shape:level-${dominant.level}`,
      category: 'shape',
      severity: clamp01(headcountShare / 0.7),
      headline: `Level ${dominant.level} contains ${formatPercent(headcountShare)} of this workforce`,
      detail: `${formatNumber(dominant.headcount)} people and ${formatCurrency(dominant.salary)} of salary sit in one reporting layer.`,
      evidence: shareEvidence(dominant, summary),
      link: {
        chart: 'layer-silhouette',
        entity: { key: 'level', value: dominant.level },
      },
    },
  ];
}

function detectDepartmentConcentration(analytics) {
  // Detect against the same rows the department chart renders so every insight
  // points at a bar the user can actually see when they open "See the chart".
  const rows = analytics.filteredDepartmentRows ?? [];
  return rows
    .map((row) =>
      concentrationInsight(row, analytics.summary, {
        category: 'department',
        chart: 'department-cost',
        entityKey: 'department',
        labelPrefix: 'Department cost',
      }),
    )
    .filter(Boolean);
}

function detectLocationConcentration(analytics) {
  const rows = analytics.filteredLocationRows ?? [];
  return rows
    .map((row) =>
      concentrationInsight(row, analytics.summary, {
        category: 'location',
        chart: 'location-cost',
        entityKey: 'location',
        labelPrefix: 'Location cost',
      }),
    )
    .filter(Boolean);
}

function detectManagementComposition(analytics) {
  const summary = analytics.summary;
  if (!summary?.headcount || !summary.managers || !Number.isFinite(summary.managerCostShare)) return [];

  const managerHeadcountShare = share(summary.managers, summary.headcount);
  const managerSalaryShare = summary.managerCostShare;
  const gap = Math.abs(managerSalaryShare - managerHeadcountShare);

  return [
    {
      id: 'composition:management-cost',
      category: 'composition',
      severity: clamp01(0.25 + gap / 0.12),
      headline: `Managers represent ${formatPercent(managerSalaryShare)} of salary`,
      detail: `${formatNumber(summary.managers)} managers are ${formatPercent(managerHeadcountShare)} of headcount in this slice.`,
      evidence: {
        kind: 'value',
        label: 'Manager salary share',
        value: formatPercent(managerSalaryShare),
        note: `${formatPercent(managerHeadcountShare)} of people`,
      },
      link: {
        chart: 'cost-stack',
        entity: null,
      },
    },
  ];
}

function detectThinSpan(analytics) {
  const summary = analytics.summary;
  if (!summary?.managers) return [];

  const rows = analytics.spanRows ?? [];
  const singleReportManagers = rows.find((row) => row.span === 1)?.headcount ?? 0;
  const thinManagers = rows
    .filter((row) => row.span <= 2)
    .reduce((total, row) => total + row.headcount, 0);
  const singleShare = share(singleReportManagers, summary.managers);
  const thinShare = share(thinManagers, summary.managers);

  if (singleShare < SINGLE_REPORT_MIN_SHARE && thinShare < THIN_SPAN_MIN_SHARE) return [];

  const useSingleReport = singleShare >= SINGLE_REPORT_MIN_SHARE;
  const count = useSingleReport ? singleReportManagers : thinManagers;
  const countShare = useSingleReport ? singleShare : thinShare;
  const label = useSingleReport ? 'one direct report' : 'one or two direct reports';

  return [
    {
      id: 'span:thin-manager-layer',
      category: 'span',
      severity: clamp01(countShare / 0.3),
      headline: `${formatNumber(count)} managers have ${label}`,
      detail: `${formatPercent(countShare)} of managers sit in a thin reporting span.`,
      evidence: {
        kind: 'value',
        label: 'Thin-span managers',
        value: formatNumber(count),
        note: `${formatPercent(countShare)} of managers`,
      },
      link: {
        chart: 'span-hist',
        entity: null,
      },
    },
  ];
}

function diversify(insights) {
  const categoryCounts = new Map();
  const selected = [];

  for (const insight of insights) {
    const count = categoryCounts.get(insight.category) ?? 0;
    if (count >= MAX_PER_CATEGORY) continue;
    selected.push(insight);
    categoryCounts.set(insight.category, count + 1);
    if (selected.length >= MAX_INSIGHTS) break;
  }

  return selected;
}

export function deriveInsights(analytics) {
  if (!analytics?.summary?.headcount) return [];

  const candidates = [
    ...detectDominantLayer(analytics),
    ...detectDepartmentConcentration(analytics),
    ...detectLocationConcentration(analytics),
    ...detectManagementComposition(analytics),
    ...detectThinSpan(analytics),
  ];

  return diversify(candidates.filter(isRenderable).sort((a, b) => b.severity - a.severity));
}
