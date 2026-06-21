// Covers the analytics rollups (lib/analytics.js) and the icicle partition
// (lib/icicle.js): filtered summaries, per-dimension rows, and cost/headcount
// aggregation. Uses a six-person tree small enough to assert exact numbers by hand.
import { describe, expect, it } from 'vitest';
import { createAnalyticsMemo, EMPTY_FILTERS } from '../lib/analytics.js';
import { buildOrgTree } from '../lib/buildTree.js';
import { buildIciclePartition } from '../lib/icicle.js';

// Rows mirror the source CSV column names so the fixture runs the same
// normalization path as the real data. Args: id, manager, name, title, salary,
// bonus, level, department.
const fixture = [
  row('a', '', 'A Root', 'CEO', 100, 10, 1, 'Engineering'),
  row('b', 'a', 'B Manager', 'VP', 50, 5, 2, 'Engineering'),
  row('c', 'a', 'C IC', 'Designer', 20, 2, 2, 'Design'),
  row('d', 'b', 'D IC', 'Engineer', 10, 1, 3, 'Engineering'),
  row('e', 'b', 'E Manager', 'Lead', 8, 1, 3, 'Engineering'),
  row('f', 'e', 'F IC', 'Analyst', 5, 1, 4, 'Engineering'),
];

function row(id, manager, name, title, salary, bonus, level, department) {
  return {
    'Employee Id': id,
    Name: name,
    'Job Title': title,
    Manager: manager,
    Department: department,
    Location: 'Toronto, Canada',
    Salary: String(salary),
    Bonus: String(bonus),
    level: String(level),
  };
}

describe('analytics selectors', () => {
  it('builds department proportion rows for salary and headcount modes', () => {
    const { allNodes } = buildOrgTree(fixture);
    const getAnalytics = createAnalyticsMemo(allNodes);

    const salaryAnalytics = getAnalytics(EMPTY_FILTERS, 'comp', 'salary');
    const headcountAnalytics = getAnalytics(EMPTY_FILTERS, 'comp', 'headcount');

    expect(salaryAnalytics.proportionRows[0]).toMatchObject({
      label: 'Engineering',
      salary: 173,
      headcount: 5,
    });
    expect(salaryAnalytics.proportionRows[0].share).toBeCloseTo(173 / 193);
    expect(headcountAnalytics.proportionRows[0].share).toBeCloseTo(5 / 6);
  });

  it('measures department proportion against the whole org and folds the tail into Other', () => {
    const rows = [row('r', '', 'Root', 'CEO', 100, 0, 1, 'D0')];
    for (let i = 1; i <= 13; i += 1) {
      rows.push(row(`c${i}`, 'r', `C${i}`, 'IC', 100 + i, 0, 2, `D${i}`));
    }

    const { allNodes } = buildOrgTree(rows);
    const analytics = createAnalyticsMemo(allNodes)(EMPTY_FILTERS, 'comp', 'salary');
    const prop = analytics.proportionRows;
    const totalSalary = allNodes.reduce((sum, node) => sum + node.data.salary, 0);

    // 14 departments, so the top 10 show and the remaining 4 collapse into Other.
    const other = prop[prop.length - 1];
    expect(other.isOther).toBe(true);
    expect(other.label).toBe('Other (4)');
    // Every share is a slice of the org, so the rows (incl. Other) sum to 1.
    expect(prop.reduce((sum, r) => sum + r.share, 0)).toBeCloseTo(1, 10);
    expect(prop[0].share).toBeCloseTo(prop[0].salary / totalSalary, 10);
  });

  it('builds average span by department rows from manager direct-report spans', () => {
    const { allNodes } = buildOrgTree(fixture);
    const analytics = createAnalyticsMemo(allNodes)();

    expect(analytics.spanByDepartmentRows[0]).toMatchObject({
      label: 'Engineering',
      managers: 3,
    });
    expect(analytics.spanByDepartmentRows[0].avgSpan).toBeCloseTo(5 / 3);
  });

  it('keeps both headcount and salary values for heatmap mode switching', () => {
    const { allNodes } = buildOrgTree(fixture);
    const analytics = createAnalyticsMemo(allNodes)();
    const engineeringLevelOne = analytics.heatmap.cells.find(
      (cell) => cell.department === 'Engineering' && cell.level === 1,
    );

    expect(engineeringLevelOne).toMatchObject({
      headcount: 1,
      salary: 100,
    });
    expect(analytics.heatmap.maxHeadcount).toBeGreaterThan(0);
    expect(analytics.heatmap.maxSalary).toBeGreaterThan(0);
  });
});

describe('icicle partition helper', () => {
  it('derives bounded partition rows from the existing hierarchy', () => {
    const { root } = buildOrgTree(fixture);
    const partition = buildIciclePartition(root, { mode: 'headcount', depthLimit: 2 });

    expect(partition.nodes[0]).toMatchObject({
      id: 'a',
      value: 6,
      depth: 0,
      share: 1,
    });
    expect(partition.nodes.every((node) => node.depth <= 2)).toBe(true);
    expect(partition.nodes.some((node) => node.id === 'b')).toBe(true);
  });

  it('uses salary footprint for cost mode without mutating original metrics', () => {
    const { root } = buildOrgTree(fixture);
    const originalMetrics = root.metrics;
    const partition = buildIciclePartition(root, { mode: 'cost', depthLimit: 4 });

    expect(partition.nodes[0].value).toBe(193);
    expect(root.metrics).toBe(originalMetrics);
  });
});
