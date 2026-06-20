import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Papa from 'papaparse';
import { describe, expect, it } from 'vitest';
import { buildOrgTree } from '../lib/buildTree.js';

const fixture = [
  row('a', '', 'A Root', 'CEO', 100, 10, 1),
  row('b', 'a', 'B Manager', 'VP', 50, 5, 2),
  row('c', 'a', 'C IC', 'Designer', 20, 2, 2),
  row('d', 'b', 'D IC', 'Engineer', 10, 1, 3),
  row('e', 'b', 'E Manager', 'Lead', 8, 1, 3),
  row('f', 'e', 'F IC', 'Analyst', 5, 1, 4),
];

function row(id, manager, name, title, salary, bonus, level) {
  // Test rows preserve the source CSV's column names so the fixture exercises
  // the same normalization path as the real assessment data.
  return {
    'Employee Id': id,
    Name: name,
    'Job Title': title,
    Manager: manager,
    Department: id === 'c' ? 'Design' : 'Engineering',
    Location: 'Toronto, Canada',
    Salary: String(salary),
    Bonus: String(bonus),
    level: String(level),
  };
}

function readRealCsv() {
  // Real-data invariants catch regressions that a tiny fixture cannot, such as
  // misreading quoted locations or accidentally including the root salary.
  const here = path.dirname(fileURLToPath(import.meta.url));
  const csvPath = path.resolve(here, '../../public/data/giga-corp.csv');
  const csv = fs.readFileSync(csvPath, 'utf8');
  const result = Papa.parse(csv, {
    header: true,
    skipEmptyLines: 'greedy',
  });
  if (result.errors.length) throw new Error(result.errors[0].message);
  return result.data;
}

describe('buildOrgTree', () => {
  it('computes descendant and salary rollups with one stored metrics object per node', () => {
    const { root, nodeById } = buildOrgTree(fixture);

    expect(root.metrics).toEqual({
      descendantCount: 5,
      nonLeafDescendantCount: 2,
      mgmtCost: 58,
      icCost: 35,
      totalCost: 93,
      managerCostShare: 58 / 93,
      managerToIcCostRatio: 58 / 35,
    });

    expect(nodeById.get('b').metrics).toEqual({
      descendantCount: 3,
      nonLeafDescendantCount: 1,
      mgmtCost: 8,
      icCost: 15,
      totalCost: 23,
      managerCostShare: 8 / 23,
      managerToIcCostRatio: 8 / 15,
    });

    expect(nodeById.get('f').metrics).toEqual({
      descendantCount: 0,
      nonLeafDescendantCount: 0,
      mgmtCost: 0,
      icCost: 0,
      totalCost: 0,
      managerCostShare: null,
      managerToIcCostRatio: null,
    });

    expect(Object.isFrozen(root.metrics)).toBe(true);
  });

  it('rejects duplicate employee ids', () => {
    expect(() => buildOrgTree([...fixture, row('f', 'a', 'Duplicate', 'IC', 1, 0, 2)])).toThrow(/Duplicate Employee Id/);
  });

  it('rejects missing managers', () => {
    expect(() => buildOrgTree([...fixture, row('g', 'missing', 'Orphan', 'IC', 1, 0, 2)])).toThrow(/Manager does not exist/);
  });

  it('rejects multiple roots', () => {
    expect(() => buildOrgTree([...fixture, row('g', '', 'Second Root', 'COO', 1, 0, 1)])).toThrow(/exactly one root/);
  });

  it('rejects invalid numeric fields', () => {
    expect(() => buildOrgTree([row('a', '', 'A Root', 'CEO', 'bad', 0, 1)])).toThrow(/Salary must be numeric/);
  });

  it('matches real Giga Corp invariants', () => {
    const rows = readRealCsv();
    const { root, allNodes } = buildOrgTree(rows);
    const totalSalary = allNodes.reduce((acc, node) => acc + node.data.salary, 0);
    const managers = allNodes.filter((node) => node.data.isManager).length;

    expect(rows).toHaveLength(40000);
    expect(root.data.name).toBe('Melody Himes');
    expect(root.metrics.descendantCount).toBe(39999);
    expect(managers).toBe(11453);
    expect(allNodes.length - managers).toBe(28547);
    expect(Math.abs(root.metrics.totalCost - (totalSalary - root.data.salary))).toBeLessThan(0.05);

    for (const node of allNodes) {
      expect(Math.abs(node.metrics.mgmtCost + node.metrics.icCost - node.metrics.totalCost)).toBeLessThan(0.0001);
    }
  });
});
