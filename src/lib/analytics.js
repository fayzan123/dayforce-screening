import { extent, group, rollups, sum } from 'd3-array';

/**
 * Aggregations for the bonus analytics view.
 *
 * These functions intentionally work from the pre-built `allNodes` list and the
 * frozen metrics/data written by buildTree. They do not rebuild the hierarchy or
 * walk descendant subtrees, preserving the assessment's "compute once" contract.
 */

export const EMPTY_FILTERS = Object.freeze({
  department: null,
  location: null,
  level: null,
});

function filterKey(filters) {
  // Stable cache key for cross-filter combinations.
  return JSON.stringify({
    department: filters.department ?? null,
    location: filters.location ?? null,
    level: filters.level ?? null,
  });
}

export function nodeMatchesFilters(node, filters) {
  const data = node.data;
  return (
    (!filters.department || data.department === filters.department) &&
    (!filters.location || data.location === filters.location) &&
    (!filters.level || data.level === Number(filters.level))
  );
}

function summarizeNodes(nodes) {
  // This is a flat summary of the currently filtered employee set. It differs
  // from node.metrics, which is recursive and descendant-only for one node.
  const headcount = nodes.length;
  const managers = nodes.filter((node) => node.data.isManager).length;
  const ics = headcount - managers;
  const salary = sum(nodes, (node) => node.data.salary);
  const bonus = sum(nodes, (node) => node.data.bonus);
  const managerSalary = sum(nodes, (node) => (node.data.isManager ? node.data.salary : 0));
  const icSalary = salary - managerSalary;
  const avgSalary = headcount ? salary / headcount : 0;
  const managerCostShare = salary ? managerSalary / salary : null;
  const avgSpan = managers
    ? sum(nodes, (node) => (node.data.isManager ? node.data.directReportCount : 0)) / managers
    : 0;

  return {
    headcount,
    managers,
    ics,
    salary,
    bonus,
    totalComp: salary + bonus,
    managerSalary,
    icSalary,
    avgSalary,
    avgSpan,
    managerCostShare,
  };
}

function dimensionRows(nodes, key, { limit = Infinity } = {}) {
  // Shared helper for department/location slices. Sorting by salary emphasizes
  // cost concentration, which is the PM-oriented purpose of the bonus view.
  return rollups(
    nodes,
    (items) => summarizeNodes(items),
    (node) => node.data[key],
  )
    .map(([label, summary]) => ({ label, ...summary }))
    .sort((a, b) => b.salary - a.salary)
    .slice(0, limit);
}

function levelRows(nodes) {
  return rollups(
    nodes,
    (items) => summarizeNodes(items),
    (node) => node.data.level,
  )
    .map(([level, summary]) => ({ level: Number(level), label: `Level ${level}`, ...summary }))
    .sort((a, b) => a.level - b.level);
}

function spanRows(nodes) {
  // Span of control is only meaningful for managers, so ICs are excluded here.
  const managers = nodes.filter((node) => node.data.isManager);
  return rollups(
    managers,
    (items) => ({
      headcount: items.length,
      salary: sum(items, (node) => node.data.salary),
    }),
    (node) => node.data.directReportCount,
  )
    .map(([span, summary]) => ({ span: Number(span), label: `1:${span}`, ...summary }))
    .sort((a, b) => a.span - b.span);
}

function spanByDepartmentRows(nodes, { limit = 10 } = {}) {
  return rollups(
    nodes.filter((node) => node.data.isManager),
    (items) => ({
      managers: items.length,
      avgSpan: items.length ? sum(items, (node) => node.data.directReportCount) / items.length : 0,
      salary: sum(items, (node) => node.data.salary),
    }),
    (node) => node.data.department,
  )
    .map(([label, summary]) => ({ label, ...summary }))
    .sort((a, b) => b.avgSpan - a.avgSpan || b.managers - a.managers)
    .slice(0, limit);
}

function heatmapRows(nodes) {
  // Limit columns to the top cost departments. Rendering all 20 works, but this
  // keeps the heatmap readable and responsive on narrower screens.
  const topDepartments = dimensionRows(nodes, 'department', { limit: 12 }).map((row) => row.label);
  const byPair = group(
    nodes.filter((node) => topDepartments.includes(node.data.department)),
    (node) => node.data.department,
    (node) => node.data.level,
  );

  const cells = [];
  for (const department of topDepartments) {
    const byLevel = byPair.get(department) ?? new Map();
    for (let level = 1; level <= 10; level += 1) {
      const items = byLevel.get(level) ?? [];
      cells.push({
        department,
        level,
        headcount: items.length,
        salary: sum(items, (node) => node.data.salary),
      });
    }
  }

  const maxHeadcount = Math.max(1, ...cells.map((cell) => cell.headcount));
  const maxSalary = Math.max(1, ...cells.map((cell) => cell.salary));
  return { departments: topDepartments, levels: Array.from({ length: 10 }, (_, index) => index + 1), cells, maxHeadcount, maxSalary };
}

function stackedCostRows(nodes, mode = 'comp') {
  return dimensionRows(nodes, 'department', { limit: 10 }).map((row) => {
    if (mode === 'role') {
      return {
        label: row.label,
        total: row.managerSalary + row.icSalary,
        segments: [
          { key: 'Management', value: row.managerSalary },
          { key: 'IC', value: row.icSalary },
        ],
      };
    }

    return {
      label: row.label,
      total: row.salary + row.bonus,
      segments: [
        { key: 'Salary', value: row.salary },
        { key: 'Bonus', value: row.bonus },
      ],
    };
  });
}

function proportionRows(nodes, mode = 'salary', { limit = 10 } = {}) {
  const valueOf = (row) => (mode === 'headcount' ? row.headcount : row.salary);
  // Share is measured against every department, not just the visible ones, so a
  // shown department's percentage is its true slice of the org rather than its
  // slice of the top N. The long tail is folded into one honest "Other" row.
  const all = [...dimensionRows(nodes, 'department')].sort((a, b) => valueOf(b) - valueOf(a));
  const total = Math.max(1, sum(all, valueOf));

  const rows = all.slice(0, limit).map((row) => ({
    label: row.label,
    value: valueOf(row),
    headcount: row.headcount,
    salary: row.salary,
    share: valueOf(row) / total,
  }));

  const rest = all.slice(limit);
  if (rest.length) {
    const headcount = sum(rest, (row) => row.headcount);
    const salary = sum(rest, (row) => row.salary);
    const value = mode === 'headcount' ? headcount : salary;
    rows.push({
      label: `Other (${rest.length})`,
      value,
      headcount,
      salary,
      share: value / total,
      isOther: true,
    });
  }

  return rows;
}

/**
 * Create a memoized analytics selector bound to the immutable node list.
 *
 * @param {Array<import('d3-hierarchy').HierarchyNode>} allNodes
 * @returns {(filters?: typeof EMPTY_FILTERS, costMode?: 'comp' | 'role') => Object}
 */
export function createAnalyticsMemo(allNodes) {
  const cache = new Map();
  const fullSummary = summarizeNodes(allNodes);
  const departments = dimensionRows(allNodes, 'department');
  const locations = dimensionRows(allNodes, 'location');
  const levels = levelRows(allNodes);
  const salaryRange = extent(allNodes, (node) => node.data.salary);

  return function getAnalytics(filters = EMPTY_FILTERS, costMode = 'comp', proportionMode = 'salary') {
    const key = `${filterKey(filters)}:${costMode}:${proportionMode}`;
    if (cache.has(key)) return cache.get(key);

    const nodes = allNodes.filter((node) => nodeMatchesFilters(node, filters));
    const analytics = {
      filters,
      fullSummary,
      salaryRange,
      summary: summarizeNodes(nodes),
      departments,
      locations,
      levels,
      filteredDepartmentRows: dimensionRows(nodes, 'department', { limit: 10 }),
      filteredLocationRows: dimensionRows(nodes, 'location', { limit: 8 }),
      filteredLevelRows: levelRows(nodes),
      spanRows: spanRows(nodes),
      spanByDepartmentRows: spanByDepartmentRows(nodes),
      heatmap: heatmapRows(nodes),
      stackedCostRows: stackedCostRows(nodes, costMode),
      proportionRows: proportionRows(nodes, proportionMode),
    };

    cache.set(key, analytics);
    return analytics;
  };
}
