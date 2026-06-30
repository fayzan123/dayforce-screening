# AGENTS.md

Durable guidance for AI agents working in this repository. Keep this file as the
single source of project instructions; `CLAUDE.md` imports it.

## Project Overview

Giga Corp Org Explorer is a Vue 3 + Vite app for visualizing a 40,000-person org
chart and cost analytics for the Dayforce screening assessment.

- App shell and tab routing live in `src/App.vue`.
- Shared org state lives in `src/composables/useOrgTree.js`.
- CSV loading lives in `src/lib/parseCsv.js` and uses a Vite worker at
  `src/workers/csvParser.worker.js`, with a main-thread fallback.
- The graded hierarchy and descendant metric logic lives in `src/lib/buildTree.js`.
- Analytics aggregation lives in `src/lib/analytics.js`; icicle row generation
  lives in `src/lib/icicle.js`.
- Tests live in `src/test`.

## Commands

Use Node 22, or any Node version supported by `package.json` (`>=20.19.0`).

```bash
nvm use
npm install
npm run dev
npm run test
npm run build
```

For GitHub Pages or another `/dayforce-screening/` sub-path deployment, use:

```bash
npm run build:github
```

## Implementation Rules

- Keep descendant org metrics in `src/lib/buildTree.js`. They are computed once
  with a bottom-up d3 `eachAfter` pass and then read by the UI.
- Do not recompute descendant metrics during expand/collapse, search, filtering,
  or rendering. Expand/collapse should only affect visible UI state.
- Treat the d3 hierarchy as immutable after load. The store intentionally uses
  `markRaw` and `shallowRef` to keep the 40k-node tree out of deep Vue reactivity.
- When changing reactive `Set` state such as `expandedIds`, replace the `Set`
  rather than mutating it in place so shallow refs notify subscribers.
- Assessment cost metrics use salary only. Bonus is only for analytics views that
  explicitly include compensation mix.
- Preserve the CSV validation assumptions: one root employee, unique employee
  ids, and every manager id must resolve.
- Avoid adding dependencies unless they materially simplify the feature or match
  the existing stack. Prefer Vue Composition API, d3 helpers, and local utilities.
- Do not commit large local CSV data files unless the task explicitly requires it;
  the app normally fetches the hosted dataset at runtime.

## UI And Accessibility

- Preserve the current "Org as Architecture" visual direction from `README.md`:
  drafting precision, editorial confidence, paper/ink tokens, ochre cost emphasis,
  and tabular figures.
- Use existing component patterns in `src/components/orgchart` and
  `src/components/analytics` before introducing new abstractions.
- Keep dark mode support through the existing `[data-theme="dark"]` token system.
- Respect `prefers-reduced-motion`; existing camera and view transitions should
  not become mandatory motion.
- Maintain visible focus states, semantic controls, and charts that do not rely on
  color alone.

## Verification

- Run `npm run test` after changing hierarchy, analytics, parsing, or formatting
  logic.
- Run `npm run build` after changing app wiring, imports, component structure,
  styling, Vite config, or dependencies.
- Add or update focused Vitest coverage under `src/test` when changing
  `buildTree`, `analytics`, `insights`, parsing behavior, or shared data contracts.
