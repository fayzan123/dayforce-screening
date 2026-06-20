# Giga Corp Org Explorer

Interactive org chart visualizer with hierarchy cost analytics for the Dayforce Product Engineer Intern assessment.

## Stack

- Vue 3 Composition API
- Vite
- Tailwind CSS v4
- PapaParse CSV parsing in an explicit Vite worker
- d3-hierarchy for `stratify`, post-order metric rollups, and the icicle `partition` view
- d3-zoom for the org chart canvas
- Vitest for hierarchy correctness tests

## Local Development

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The CSV is served from `public/data/giga-corp.csv`.

## Verification

```bash
npm run test
npm run build
```

The tests validate the hand-checked rollup fixture and real Giga Corp invariants:

- 40,000 parsed employees
- root descendant count = 39,999
- 11,453 managers and 28,547 ICs
- root total cost = total salary minus CEO salary
- management cost + IC cost = total descendant cost for every node

## Implementation Notes

- Core node metrics are computed once in `src/lib/buildTree.js` with a single bottom-up `eachAfter` pass.
- Expand/collapse keeps the full hierarchy intact and only changes a Vue-held `expandedIds` set.
- The org chart derives a visible-only layout from the immutable tree, so UI interaction does not recompute descendant metrics.
- Cost metrics use salary only, matching the assessment text. Bonus appears only in the analytics cost-mix chart.
- The assessment ratio is shown as `IC:Mgmt` (`icCost / mgmtCost`), with management share shown separately.
- The analytics tab provides department, location, and level cross-filtering plus icicle, proportion, cost, layer, span-of-control, and heatmap views.
- CSV loading uses Vite's `BASE_URL`, so the app works under root and sub-path deployments.

## Code Walkthrough

- `src/lib/parseCsv.js` loads `public/data/giga-corp.csv`, parses it with PapaParse in a Vite worker, and falls back to main-thread parsing if a hosted sandbox blocks workers.
- `src/lib/buildTree.js` normalizes CSV rows, validates root/manager/id integrity, builds the d3 hierarchy, and freezes the required descendant metrics on every node.
- `src/composables/useOrgTree.js` is the app store. It keeps the 40k-node tree out of deep Vue reactivity with `markRaw` and exposes expansion, search, filters, and analytics state.
- `src/components/orgchart/OrgChartCanvas.vue` creates a visible-only d3 layout from `expandedIds`, then renders SVG connectors and HTML cards in one zoomable coordinate space.
- `src/lib/analytics.js` builds memoized flat aggregations for the bonus view without recalculating any descendant subtrees.
- `src/lib/icicle.js` builds the d3 partition row model for the org-shape icicle without mutating the original hierarchy.
- `src/test/buildTree.test.js` documents the expected metric behavior with a small fixture and verifies the real dataset invariants.
- `src/test/analytics.test.js` covers proportion rows, span-by-department rows, heatmap mode data, and icicle partition values.

## Submission

Push the repo to GitHub, import it into StackBlitz or CodeSandbox, and submit the hosted link where the reviewer can see code and live preview side by side.
