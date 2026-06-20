# Org Hierarchy Explorer — Design Spec

**Date:** 2026-06-19
**Assessment:** Dayforce / Agentnoon — Product Engineer Intern coding test
**Deliverable:** Live StackBlitz link (code + preview side-by-side), backed by a GitHub repo.

## 1. Goal

A responsive web app that visualizes Giga Corp's 40,000-employee reporting hierarchy as an
interactive, expandable spatial org chart, plus a second interactive cost-analytics view.
The two graded priorities:

1. **Efficient per-path calculation** — all node metrics computed in a single bottom-up
   (post-order) rollup at load time; expand/collapse and analytics never re-traverse the tree.
2. **Clean, original UI** — the provided screenshot is a baseline, not a spec; the visual
   design is our own.

## 2. Data

- **File:** `data/Giga_Corp_(40k)_-_Sheet1_(2).csv` (bundled into `/public` for the app).
- **Shape:** 40,000 employees, single root (Melody Himes, CEO, blank `Manager`). Tree is
  **deep and narrow**: 10 levels, **max span of control = 4**, 11,453 managers, 28,547 ICs.
  Bottom-heavy (~25k employees at level 9). Total salary ≈ $2.42B.
- **Parent link:** `Manager` column holds the parent's `Employee Id`.
- **Columns used:** `Employee Id`, `Name`, `Job Title`, `Manager`, `Department`, `Location`,
  `Salary`, `Bonus`, `level`. (`level` is provided 1–10; we also derive depth from the tree
  and treat the two as a consistency check.)
- **Gotchas:**
  - `Location` contains commas inside quotes (e.g. `"Toronto, Canada"`) → **must use a real
    CSV parser (PapaParse)**, never naive `split(',')`.
  - `Photo` is a placeholder `ui-avatars` URL with `name=0` (no real photos) → use generated
    initials avatars instead.
  - Sparse/decorative columns (`Performance`, `Project`, `Entity`, `Recruiting`, `Skill`,
    `Role`, `Utilization`, `Source`) are **out of scope** for the UI.

## 3. Architecture & data flow

```
CSV in /public
  → PapaParse (streaming, in a Web Worker)            // UI thread never blocks
  → d3.stratify()  builds the hierarchy
  → ONE post-order pass (d3.hierarchy(...).eachAfter) // writes all metrics onto each node
  → Object.freeze the node metric payloads           // Vue won't deep-proxy 40k objects
  → useOrgTree() composable exposes the precomputed tree
       ├── OrgChartView   (spatial, expand/collapse)
       └── AnalyticsView  (interactive dashboard)
```

Parse + stratify + rollup happen **once**, behind a loading screen. Everything after is reads.

### Module boundaries

- `lib/parseCsv.js` — worker wrapper around PapaParse; returns plain row objects.
- `lib/buildTree.js` — `d3.stratify` + the single rollup pass; returns the d3 hierarchy root
  with metrics attached. Pure, unit-testable, no Vue.
- `composables/useOrgTree.js` — loads data once, holds the frozen root, exposes derived
  selectors (search, path-to-node, analytics aggregations).
- `components/orgchart/*` — `OrgChartCanvas`, `NodeCard`, `Connectors`, `ChartControls`.
- `components/analytics/*` — one component per widget + `CrossFilterBar`.
- `App.vue` — two-tab shell (Org Chart / Analytics) + loading screen.

## 4. The rollup engine (graded core)

A single `d3.hierarchy(root).eachAfter(node => …)` post-order pass. Because children are
visited before parents, each parent aggregates already-computed child values in O(1) → the
whole tree is **one O(n) pass, zero recomputation on expand/collapse**.

Metrics stored on every node (all over **descendants only, excluding the node itself**, per
the brief's wording):

| Metric | Definition |
| --- | --- |
| `descendantCount` | recursive count of all reports |
| `nonLeafDescendantCount` | descendants who are themselves managers (have ≥1 report) |
| `mgmtCost` | Σ salary of descendant **managers** (non-leaf) |
| `icCost` | Σ salary of descendant **ICs** (leaf) |
| `totalCost` | `mgmtCost + icCost` (Σ salary of all descendants) |
| `mgmtCostRatio` | `icCost / mgmtCost`, displayed as `X : 1` (IC dollars per management dollar) |

A node is a **manager** iff it has ≥1 child; otherwise a **leaf/IC**. Classification is known
during the same pass (a node is non-leaf iff `node.children?.length`).

**Definitional calls (explicit, easy to flip if a reviewer reads it differently):**
- Costs exclude the node's own salary (brief says "sum of salary for descendants").
- `mgmtCostRatio = icCost / mgmtCost`. Guard divide-by-zero (a subtree of only leaves →
  no managers → show "—" / "all IC").

Expand/collapse only toggles a `node.expanded` boolean; no metric is ever recomputed.

## 5. Org chart view (spatial)

- **Layout:** d3-hierarchy (`d3.tree()` / `d3.hierarchy`) computes x/y for the **currently
  expanded** subtree only. HTML/Tailwind `NodeCard`s are absolutely positioned at those
  coordinates; an SVG layer underneath draws connector elbows. This keeps cards fully
  styleable while d3 does the geometry.
- **Viewport:** pan/zoom canvas via `d3-zoom`. Initial state centered on the CEO with the
  first 1–2 levels expanded.
- **Interaction:** click a card's chevron to expand/collapse, with a smooth transition (cards
  tween to new positions). Because max span = 4, expansion never floods the canvas.
- **Controls (`ChartControls`):** zoom in / out / fit-to-screen, collapse-all, and
  **search-to-node** (find by name/title → auto-expand the path, pan, and highlight).
- **NodeCard content:** initials avatar, Name, Job Title, `Department · Location`, then a
  compact metric grid — Reports (`descendantCount`), Sub-managers (`nonLeafDescendantCount`),
  Total cost, Mgmt cost, IC cost, Mgmt ratio. A colored bottom badge shows `descendantCount`
  (echoing the reference). Leaf cards use a slimmer variant (no expand chevron, costs omitted
  or zeroed).

## 6. Analytics view (mapped to the Agentnoon chart library)

Source: https://docs.agentnoon.com/hub/chart-library — its four categories are each
represented. All widgets derive from the one precomputed tree; aggregations are memoized per
filter key, so nothing re-traverses.

**A. High-level org view**
- **Icicle chart** — from the `d3.hierarchy` root; rectangles sized by `totalCost`
  (toggle: headcount). Cost-weighted analog of Agentnoon's Org Map / Icicle. Click a band →
  drill-down + "view in org chart."
- **Proportion chart** — cost & headcount distribution across the 20 departments (treemap or
  donut).

**B. Span of control**
- **Span-of-control distribution** — histogram grouping managers by span (1:1 … 1:4).
  Surfaces single-report "pass-through" managers (org-efficiency red flag).
- **Average span by department** — bar chart of mean span per department.

**C. Layers & hierarchy**
- **Pyramid chart** — headcount by level (1–10); reveals Giga Corp's bottom-heavy shape. The
  marquee "org shape" visual.
- **Headcount/cost heatmap** — levels (y) × departments (x), cells shaded by headcount or cost.

**D. Cost analysis**
- **Headcount cost chart** — total cost by department/entity (bar).
- **Stacked cost chart** — Agentnoon stacks salary/benefits/other; we stack the components we
  actually have — **base salary + bonus**, and **management vs. IC** cost — per department.
  This is where the `Bonus` column earns its place.

**Interactivity (ambitious layer):** clicking any department / level / location filters every
widget via shared cross-filter state; a "view in org chart" action jumps to that subtree and
auto-expands its path. Cross-view navigation is the connective tissue between the two tabs.

**d3-hierarchy linkage:** the icicle, pyramid, and heatmap are all derived from the same
single rollup that powers the org chart — "efficient calculation per path" holds across both
views because nothing recomputes the tree.

## 7. Performance strategy

- PapaParse in a Web Worker → main thread never blocks during the 40k-row parse.
- Tree built + rolled up once; metric payloads `Object.freeze`d so Vue's reactivity doesn't
  deep-proxy 40,000 objects.
- Only **expanded** nodes are in the render set; collapsed subtrees cost nothing to draw.
- Analytics aggregations memoized per `(filter)` key.
- Target: interactive within ~1–2s of load on a normal laptop; expand/collapse and filtering
  feel instant.

## 8. Stack & deliverable

- **Stack:** Vue 3 (Composition API), Tailwind CSS, `d3-hierarchy` + `d3-zoom` + `d3-scale`,
  PapaParse, Vite.
- **Deliverable:** develop locally → push to GitHub → import to **StackBlitz** (WebContainers
  run the real Vite dev server in-browser) for the requested code-beside-preview live link.
- **Testing:** unit tests on `buildTree.js` (rollup correctness on a small hand-checked
  fixture + invariants on the real data: root `descendantCount` = 39,999; root `totalCost` =
  Σ all salaries minus root salary; mgmt+IC = total at every node). Manual QA of expand/
  collapse, search, zoom, and cross-filtering.

## 9. Out of scope (YAGNI)

- Decorative columns (Performance, Project, Entity, Recruiting, Skill, Role, Utilization,
  Source); real photos.
- Editing the org / persistence / backend / API.
- Routing beyond the two tabs.
- Bonus compensation inside the **core** cost metrics (salary only there); bonus appears only
  in the analytics stacked-cost widget.

## 10. Open questions (resolved)

- Visualization paradigm → **spatial org chart** (HTML cards on d3 coords + SVG connectors).
- Bonus view scope → **ambitious/interactive** (cross-filter + drill-down + heatmap).
- Deliverable host → **StackBlitz**.
- Deadline → comfortable (a few days); optimize for impressiveness, utility, and correctness.
