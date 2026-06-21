// Content model for the "How it works" page (AboutView.vue). Keeping the copy as
// plain data here keeps the view a thin renderer and makes the prose easy to edit
// without touching markup. `pageSections` ids must match the section anchors in
// the template so the in-page nav scrolls correctly.
export const pageSections = [
  { id: 'overview', label: 'Overview' },
  { id: 'using-the-app', label: 'Using the app' },
  { id: 'metric-rollups', label: 'Metric rollups' },
  { id: 'coverage-map', label: 'Coverage map' },
  { id: 'architecture', label: 'Architecture' },
  { id: 'pm-reasoning', label: 'PM reasoning' },
  { id: 'tradeoffs', label: 'Tradeoffs' },
];

export const usageNotes = [
  'Start in Org Chart to inspect reporting lines. Expand or collapse a manager to control how much of the 40,000-person tree is visible.',
  'Each node card exposes the required descendant, non-leaf, and cost rollups. Selecting a node opens a larger inspector with the same metrics.',
  'Search jumps the camera to a matching employee by expanding that person\'s ancestor path first, then panning to the node.',
  'Cost Analytics is the PM bonus view. Its department, location, and level filters cross-filter the charts, then View Match in Org Chart traces a finding back to a person.',
];

export const metricRows = [
  {
    label: 'Descendant count',
    formula: 'sum(child.metrics.descendantCount + 1)',
    note: 'Every recursive report below the node, excluding the node itself.',
  },
  {
    label: 'Non-leaf descendant count',
    formula: 'sum(child.metrics.nonLeafDescendantCount + child.isManager)',
    note: 'Every descendant who also has direct reports.',
  },
  {
    label: 'Management cost',
    formula: 'sum(child.metrics.mgmtCost + salary when child is a manager)',
    note: 'Salary only, for descendant managers.',
  },
  {
    label: 'IC cost',
    formula: 'sum(child.metrics.icCost + salary when child is not a manager)',
    note: 'Salary only, for descendant individual contributors.',
  },
  {
    label: 'Total cost',
    formula: 'mgmtCost + icCost',
    note: 'This equals the salary sum for all descendants. The tests assert that invariant.',
  },
  {
    label: 'Management cost ratio',
    formula: 'icCost / mgmtCost',
    note: 'I show this as IC:Mgmt because the brief asks for the ratio between individual contributors and managers. Manager share is shown separately.',
  },
];

export const coverageRows = [
  {
    requirement: 'Responsive Vue layout with expandable and collapsible hierarchy nodes',
    metBy: 'Org Chart tab, zoomable canvas, and node controls',
    locations: ['src/App.vue', 'src/components/orgchart/OrgChartCanvas.vue'],
  },
  {
    requirement: 'Descendant count and non-leaf descendant count per node',
    metBy: 'Node cards and selected-node inspector',
    locations: ['src/lib/buildTree.js', 'src/components/orgchart/NodeCard.vue'],
  },
  {
    requirement: 'Management cost, IC cost, total cost, and ratio',
    metBy: 'Frozen node metrics read by every visible card',
    locations: ['src/lib/buildTree.js', 'src/components/orgchart/OrgChartView.vue'],
  },
  {
    requirement: 'Optimal calculation, done per path without repeated research',
    metBy: 'One bottom-up post-order pass with d3-hierarchy eachAfter',
    locations: ['src/lib/buildTree.js', 'Metric rollups section'],
  },
  {
    requirement: 'Clean UI with candidate taste beyond the reference screenshot',
    metBy: 'Org as Architecture visual system, drafting lines, restrained typography, and dark mode tokens',
    locations: ['src/styles.css', 'src/components/orgchart/NodeCard.vue'],
  },
  {
    requirement: 'Bonus view for organization cost analysis',
    metBy: 'Cost Analytics tab with cost concentration, span, layer, proportion, heatmap, and icicle views',
    locations: ['src/components/analytics/AnalyticsView.vue', 'src/lib/analytics.js'],
  },
  {
    requirement: 'Hosted app that opens with code beside preview',
    metBy: 'StackBlitz import of this repository',
    locations: ['README.md', 'package.json'],
  },
];

export const architectureNotes = [
  {
    title: 'The 40k-node tree stays outside deep Vue reactivity.',
    body: 'The d3 hierarchy is treated as immutable after build. The store keeps it in shallow refs and markRaw values so Vue does not proxy every node and child link.',
  },
  {
    title: 'CSV parsing runs through a worker path.',
    body: 'PapaParse reads the 12 MB CSV through the Vite worker setup, with a main-thread fallback for hosted sandboxes that block workers.',
  },
  {
    title: 'Expand and collapse are UI state only.',
    body: 'The full tree remains intact. The canvas derives a visible layout from expandedIds and never asks the metric layer to walk descendants again.',
  },
  {
    title: 'Analytics are flat aggregations, not subtree recalculations.',
    body: 'The bonus tab summarizes already-built nodes by department, location, level, span, and cost mix. It does not mutate the hierarchy.',
  },
];

export const pmReasons = [
  {
    title: 'Cost concentration',
    body: 'A reviewer can see which departments and locations hold the largest salary pools instead of reading thousands of node cards.',
  },
  {
    title: 'Span-of-control outliers',
    body: 'Manager count alone is not enough. The span charts expose where the reporting shape looks thin, overloaded, or uneven.',
  },
  {
    title: 'Org silhouette',
    body: 'Giga Corp is bottom-heavy. I made that shape visible because it explains the company faster than another generic dashboard grid.',
  },
];

export const tradeoffs = [
  {
    title: 'Cost math is salary only.',
    body: 'The assessment defines every cost field on the salary column, so the node rollups use salary and nothing else. Bonus shows up only in the analytics cost mix, where it is labeled as such.',
    next: 'Make compensation a mode the user picks: base, base plus bonus, or fully loaded. A PM could then pressure-test cost under each definition instead of trusting one number.',
  },
  {
    title: 'The ratio reads as IC to manager cost.',
    body: 'The brief asks for the ratio between individual contributors and managers, so I divide IC cost by manager cost and label it directly. Manager cost share sits beside it for the other angle.',
    next: 'Both directions are already computed in buildTree.js, so flipping the convention is a label change, not a recompute.',
  },
  {
    title: 'You can read the org, not reshape it.',
    body: 'Today the views inspect the org as it stands. A PM weighing a reorg, flattening a layer or merging two teams, has to take the numbers elsewhere to model the change.',
    next: 'Add what-if editing: move or cut a subtree, re-run the same O(N) rollup on the clone, and diff cost, span, and layer count against the live org. The build is already cheap enough to do this while you drag.',
  },
  {
    title: 'Automated insight stops at the heuristics I wrote.',
    body: 'The Insight Briefing already does a best-effort pass: it ranks cost concentration, a dominant reporting layer, manager composition, and thin spans by severity, and links each finding back to the chart that proves it. But it can only surface the signals I hard-coded, and a PM\'s actual question often sits just outside that fixed set.',
    next: 'A private, retrieval-augmented model over the same rolled-up metrics would handle the open-ended ask, "which orgs carry the worst span and the highest management cost?", and return a sourced, drill-downable answer. The per-node metrics and flat aggregations are already a clean corpus, and keeping the model local means salary data never leaves the company.',
  },
];
