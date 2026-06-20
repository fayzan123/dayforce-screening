# Org Hierarchy Explorer — Dayforce Product Engineer Intern Assessment

## Objective

Build a responsive web app (Vue.js + Tailwind) that visualizes an organization's reporting hierarchy from a CSV of 40,000 employees. Nodes must be expandable/collapsible and each node must display its descendant count and non-leaf descendant count, along with several derived cost metrics.

Bonus: a second view for organization-wide cost analytics (treat this like a product manager scoping a new feature, not just a chart).

## Source Files (in this repo)

- `assets/example-org-chart.png` — reference screenshot from the assessment showing the expected node card layout, field labels, and visual hierarchy. Use this as the design baseline, not a strict spec.
- `data/giga-corp-40k.csv` — the assessment's provided dataset, "Giga Corp (40k)". 40,000 rows, single root (CEO, no Manager value), `level` field already present (1–10). Key columns: `Employee Id`, `Name`, `Job Title`, `Manager` (parent's Employee Id), `Department`, `Location`, `Salary`, `Bonus`, `level`. Several columns (`Photo`, `Performance`, `Project`, `Entity`, `Skill`, `Role`, `Utilization`, `Source`) are mostly sparse/decorative — confirm which are worth surfacing before building UI around them.

## Required Node Data (per the assessment)

For each node, calculate and display:
- **Descendant count** (all reports, recursive)
- **Non-leaf descendant count** (descendants who themselves have reports)
- **Management cost** — recursive sum of salary for descendants who have subordinates
- **IC cost** — recursive sum of salary for descendants with no subordinates
- **Total cost** — sum of salary across all descendants
- **Management cost ratio** — ratio between IC and manager cost

## Performance Constraint (explicit ask from the assessment)

This is the part they're actually grading. Don't recompute descendant trees on every expand/collapse. Roll the metrics up once via a single post-order traversal (bottom-up) when the hierarchy is built, store the computed values on each node, then expand/collapse is just a UI state toggle with zero recomputation. `d3-hierarchy` (`d3.stratify` + `.sum()` / `.eachAfter()`) is built for exactly this and is referenced directly in the assessment doc: https://d3js.org/d3-hierarchy

## Bonus View — Cost Analytics

Reference: https://docs.agentnoon.com/hub/chart-library

Brief is intentionally open: "imagine you're a PM, come up with your own feature set." Don't just reskin the org chart as a bar chart — think about what a PM analyzing 40k headcount would actually want to know (cost concentration by department/location, manager-to-IC ratio outliers, span-of-control distribution, cost per layer, etc).

## What They're Grading On (stated directly in the assessment)

- Efficient calculation of the values, done per path — this is the Performance Constraint above.
- Clean UI. They provide the example screenshot as a starting point only, not a spec to replicate — they explicitly want to see your own visual taste, not a copy of their layout.

## Stack

- Vue 3 (Composition API)
- Tailwind CSS
- d3-hierarchy for tree construction and rollups
- Vite for scaffolding

## Deliverable

A live hosted link (CodeSandbox, CodePen, or similar) — needs to be something a reviewer can click open and have it just run, with the code visible alongside the live preview. That's the literal submission format requested, so don't let the final step become an afterthought.

## Deadline

Tuesday, June 23, 12:00 PM EST.

## Assessment Source

"Engineering role — Coding test" (v2024.06.22), authored by Saahil Jaffer, Dave Kim, Oskar Szulc.

