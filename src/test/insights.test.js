// Exercises the insight engine (lib/insights.js): which insights fire, how they
// are worded, and that every emitted insight links to a known chart. Built on a
// small synthetic analytics slice so each threshold can be probed in isolation.
import { describe, expect, it } from 'vitest';
import { deriveInsights, INSIGHT_CHART_IDS } from '../lib/insights.js';

// Minimal analytics slice with sensible defaults; pass `overrides` to push a
// specific dimension past (or below) a detection threshold for one test.
function analyticsFixture(overrides = {}) {
  return {
    summary: {
      headcount: 100,
      managers: 30,
      ics: 70,
      salary: 1000,
      bonus: 0,
      managerSalary: 350,
      icSalary: 650,
      managerCostShare: 0.35,
      avgSpan: 3,
      ...overrides.summary,
    },
    filteredLevelRows: overrides.filteredLevelRows ?? [
      { level: 1, label: 'Level 1', headcount: 1, salary: 400 },
      { level: 8, label: 'Level 8', headcount: 29, salary: 100 },
      { level: 9, label: 'Level 9', headcount: 70, salary: 500 },
    ],
    filteredDepartmentRows: overrides.filteredDepartmentRows ?? [
      { label: 'Engineering', headcount: 20, salary: 310 },
      { label: 'Finance', headcount: 30, salary: 290 },
      { label: 'Operations', headcount: 50, salary: 400 },
    ],
    filteredLocationRows: overrides.filteredLocationRows ?? [
      { label: 'Toronto, Canada', headcount: 20, salary: 300 },
      { label: 'London, United Kingdom', headcount: 80, salary: 700 },
    ],
    spanRows: overrides.spanRows ?? [
      { span: 1, label: '1:1', headcount: 1, salary: 10 },
      { span: 3, label: '1:3', headcount: 29, salary: 340 },
    ],
  };
}

describe('deriveInsights', () => {
  it('uses dominant layer mass instead of salary-share gap for the shape story', () => {
    const insights = deriveInsights(analyticsFixture());
    const shape = insights.find((insight) => insight.category === 'shape');

    expect(shape).toBeTruthy();
    expect(shape.headline).toContain('Level 9');
    expect(shape.headline).not.toContain('Level 1');
    expect(shape.evidence.headcountShare).toBeCloseTo(0.7);
  });

  it('emits cost concentration only for meaningful department and location gaps', () => {
    const insights = deriveInsights(
      analyticsFixture({
        filteredLevelRows: [{ level: 1, label: 'Level 1', headcount: 100, salary: 1000 }],
        filteredDepartmentRows: [
          { label: 'High Cost', headcount: 10, salary: 180 },
          { label: 'Flat Cost', headcount: 90, salary: 820 },
        ],
        filteredLocationRows: [
          { label: 'Toronto, Canada', headcount: 40, salary: 470 },
          { label: 'London, United Kingdom', headcount: 60, salary: 530 },
        ],
      }),
    );

    expect(insights.some((insight) => insight.id === 'department:high-cost')).toBe(true);
    expect(insights.some((insight) => insight.id === 'department:flat-cost')).toBe(false);
    expect(insights.some((insight) => insight.id === 'location:toronto-canada')).toBe(true);
  });

  it('phrases management composition as quantified context, not advice', () => {
    const composition = deriveInsights(analyticsFixture()).find((insight) => insight.category === 'composition');

    expect(composition).toBeTruthy();
    expect(composition.headline).toMatch(/\d/);
    expect(composition.detail).toMatch(/\d/);
    expect(`${composition.headline} ${composition.detail}`.toLowerCase()).not.toMatch(/cut|reduce|should/);
  });

  it('keeps insignificant thin-span counts silent', () => {
    const insights = deriveInsights(
      analyticsFixture({
        summary: {
          headcount: 1000,
          managers: 1000,
          salary: 1000,
          managerSalary: 350,
          managerCostShare: 0.35,
        },
        spanRows: [
          { span: 1, label: '1:1', headcount: 1, salary: 1 },
          { span: 3, label: '1:3', headcount: 999, salary: 999 },
        ],
      }),
    );

    expect(insights.some((insight) => insight.category === 'span')).toBe(false);
  });

  it('caps results and diversifies repeated categories', () => {
    const insights = deriveInsights(
      analyticsFixture({
        filteredDepartmentRows: [
          { label: 'Dept A', headcount: 5, salary: 200 },
          { label: 'Dept B', headcount: 5, salary: 160 },
          { label: 'Dept C', headcount: 5, salary: 130 },
          { label: 'Dept D', headcount: 85, salary: 510 },
        ],
        filteredLocationRows: [
          { label: 'Toronto, Canada', headcount: 5, salary: 180 },
          { label: 'London, United Kingdom', headcount: 5, salary: 150 },
          { label: 'Tokyo, Japan', headcount: 90, salary: 670 },
        ],
        spanRows: [
          { span: 1, label: '1:1', headcount: 5, salary: 30 },
          { span: 2, label: '1:2', headcount: 5, salary: 30 },
          { span: 3, label: '1:3', headcount: 20, salary: 290 },
        ],
      }),
    );
    const categoryCounts = insights.reduce((counts, insight) => {
      counts.set(insight.category, (counts.get(insight.category) ?? 0) + 1);
      return counts;
    }, new Map());

    expect(insights.length).toBeLessThanOrEqual(4);
    expect(Math.max(...categoryCounts.values())).toBeLessThanOrEqual(2);
  });

  it('emits only chart ids supported by the insight chart id set', () => {
    const validIds = new Set(INSIGHT_CHART_IDS);
    const insights = deriveInsights(analyticsFixture());

    expect(insights.length).toBeGreaterThan(0);
    expect(insights.every((insight) => validIds.has(insight.link.chart))).toBe(true);
  });

  it('returns an empty briefing when rows exist but nothing significant clears the floor', () => {
    const insights = deriveInsights(
      analyticsFixture({
        summary: {
          headcount: 1,
          managers: 0,
          ics: 1,
          salary: 100,
          managerSalary: 0,
          icSalary: 100,
          managerCostShare: null,
        },
        filteredLevelRows: [{ level: 1, label: 'Level 1', headcount: 1, salary: 100 }],
        filteredDepartmentRows: [{ label: 'Engineering', headcount: 1, salary: 100 }],
        filteredLocationRows: [{ label: 'Toronto, Canada', headcount: 1, salary: 100 }],
        spanRows: [],
      }),
    );

    expect(insights).toEqual([]);
  });
});
