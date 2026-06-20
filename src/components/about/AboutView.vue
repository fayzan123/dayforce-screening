<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import {
  architectureNotes,
  coverageRows,
  metricRows,
  pageSections,
  pmReasons,
  tradeoffs,
  usageNotes,
} from './aboutContent.js';

// Scroll-spy for the "On this page" nav. The page scrolls inside .about-view
// (not the window), so the active section is derived from rects relative to that
// container. Reads are batched into a rAF frame so scrolling stays cheap.
const scrollRoot = ref(null);
const activeId = ref(pageSections[0].id);
let frame = 0;

function syncActiveSection() {
  frame = 0;
  const root = scrollRoot.value;
  if (!root) return;

  // A section becomes active once its heading crosses into the top of the
  // viewport. The bottom guard pins the final section when scrolled to the end,
  // since a short last section never reaches the trigger line on its own.
  const rootTop = root.getBoundingClientRect().top;
  const triggerLine = rootTop + root.clientHeight * 0.28;
  const atBottom = root.scrollTop + root.clientHeight >= root.scrollHeight - 4;

  let current = pageSections[0].id;
  for (const section of pageSections) {
    const el = document.getElementById(section.id);
    if (el && el.getBoundingClientRect().top <= triggerLine) current = section.id;
  }

  activeId.value = atBottom ? pageSections[pageSections.length - 1].id : current;
}

function onScroll() {
  if (!frame) frame = requestAnimationFrame(syncActiveSection);
}

onMounted(() => {
  const root = scrollRoot.value;
  if (!root) return;
  // The page scrolls inside .about-view on wide screens and on the window once the
  // layout collapses to a single column, so listen to both. syncActiveSection reads
  // viewport-relative rects, so it works regardless of which one actually scrolls.
  root.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scroll', onScroll, { passive: true });
  syncActiveSection();
});

onBeforeUnmount(() => {
  scrollRoot.value?.removeEventListener('scroll', onScroll);
  window.removeEventListener('scroll', onScroll);
  if (frame) cancelAnimationFrame(frame);
});
</script>

<template>
  <section ref="scrollRoot" class="about-view" aria-labelledby="about-title">
    <aside class="about-toc" aria-label="How it works sections">
      <p class="eyebrow">On this page</p>
      <nav>
        <a
          v-for="section in pageSections"
          :key="section.id"
          :href="`#${section.id}`"
          :class="{ active: activeId === section.id }"
          :aria-current="activeId === section.id ? 'true' : undefined"
        >
          {{ section.label }}
        </a>
      </nav>
    </aside>

    <article class="about-document">
      <header id="overview" class="about-hero">
        <p class="eyebrow">How it works</p>
        <h2 id="about-title">Why this app is built this way</h2>
        <p class="lede">
          This page is for the reviewer. Giga Corp Org Explorer has two working views: a zoomable
          org chart for person-level inspection and a cost analytics view for PM-style analysis.
          The design language is intentionally structural and quiet, because the product is about
          hierarchy, span, and cost clarity.
        </p>

        <dl class="hero-facts" aria-label="Implementation summary">
          <div>
            <dt>Dataset</dt>
            <dd>40,000 employees</dd>
          </div>
          <div>
            <dt>Core rollup</dt>
            <dd>One post-order pass</dd>
          </div>
          <div>
            <dt>Interaction cost</dt>
            <dd>Expand toggles state only</dd>
          </div>
        </dl>
      </header>

      <section id="using-the-app" class="about-section">
        <p class="eyebrow">Orientation</p>
        <h3>Using the app</h3>
        <ol class="usage-list">
          <li v-for="note in usageNotes" :key="note">{{ note }}</li>
        </ol>
      </section>

      <section id="metric-rollups" class="about-section metric-callout">
        <div class="section-heading">
          <p class="eyebrow">Performance choice</p>
          <h3>The metrics are computed once, then read from the node.</h3>
        </div>

        <div class="callout-columns">
          <div>
            <span class="kicker">Naive trap</span>
            <p>
              Recomputing a node's whole subtree every time a reviewer expands a branch would make
              the interface pay for the same descendants again and again. That is the expensive path
              the brief warns about.
            </p>
          </div>
          <div>
            <span class="kicker">Chosen path</span>
            <p>
              <code>buildTree.js</code> uses d3-hierarchy and <code>eachAfter</code>. Children are
              visited before their parent, so each node reads its children's frozen rollups and writes
              its own metrics once. The whole tree is O(N).
            </p>
          </div>
        </div>

        <dl class="metric-formulas">
          <div v-for="row in metricRows" :key="row.label" class="formula-row">
            <dt>{{ row.label }}</dt>
            <dd>
              <code>{{ row.formula }}</code>
              <span>{{ row.note }}</span>
            </dd>
          </div>
        </dl>

        <p class="payoff">
          After that build step, expand and collapse never recompute descendant metrics. The UI only
          replaces <code>expandedIds</code> and derives the visible layout.
        </p>
      </section>

      <section id="coverage-map" class="about-section">
        <p class="eyebrow">Assessment proof</p>
        <h3>Requirements coverage map</h3>
        <p class="section-copy">
          This table maps the assessment requirements to the visible app behavior and the code that
          supports it.
        </p>

        <div class="coverage-table-wrap">
          <table>
            <thead>
              <tr>
                <th scope="col">Requirement</th>
                <th scope="col">Where it is met</th>
                <th scope="col">Proof</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in coverageRows" :key="row.requirement">
                <th scope="row" data-label="Requirement">{{ row.requirement }}</th>
                <td data-label="Where it is met">{{ row.metBy }}</td>
                <td data-label="Proof">
                  <code v-for="location in row.locations" :key="location">{{ location }}</code>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section id="architecture" class="about-section">
        <p class="eyebrow">Implementation shape</p>
        <h3>Architecture choices</h3>
        <dl class="decision-list">
          <div v-for="note in architectureNotes" :key="note.title">
            <dt>{{ note.title }}</dt>
            <dd>{{ note.body }}</dd>
          </div>
        </dl>
      </section>

      <section id="pm-reasoning" class="about-section">
        <p class="eyebrow">Bonus view rationale</p>
        <h3>Why the analytics tab exists</h3>
        <p class="section-copy">
          The bonus prompt asks for product judgment, not a second rendering of the same tree. I
          used the analytics view to answer questions a people-analytics PM would ask first.
        </p>
        <dl class="decision-list compact">
          <div v-for="reason in pmReasons" :key="reason.title">
            <dt>{{ reason.title }}</dt>
            <dd>{{ reason.body }}</dd>
          </div>
        </dl>
      </section>

      <section id="tradeoffs" class="about-section">
        <p class="eyebrow">Honest constraints</p>
        <h3>Tradeoffs and next steps</h3>
        <ul class="tradeoff-list">
          <li v-for="item in tradeoffs" :key="item.title">
            <strong>{{ item.title }}</strong>
            <span>{{ item.body }}</span>
            <em>{{ item.next }}</em>
          </li>
        </ul>
      </section>
    </article>
  </section>
</template>

<style scoped>
.about-view {
  display: grid;
  grid-template-columns: minmax(156px, 216px) minmax(0, 1fr);
  gap: var(--space-2xl);
  height: 100%;
  overflow: auto;
  scroll-behavior: smooth;
  scroll-padding-top: var(--space-xl);
  padding: var(--space-2xl);
}

.about-toc {
  position: sticky;
  top: var(--space-xl);
  align-self: start;
  border-top: 1px solid var(--line-strong);
  border-bottom: 1px solid var(--line-strong);
  padding: var(--space-md) 0;
}

.about-toc nav {
  display: grid;
  gap: var(--space-2xs);
  margin-top: var(--space-sm);
}

.about-toc a {
  display: block;
  min-height: 44px;
  border-radius: var(--radius-xs);
  padding: var(--space-xs) var(--space-sm);
  color: var(--ink-muted);
  font-size: var(--fs-sm);
  font-weight: 680;
  text-decoration: none;
  transition:
    background 140ms var(--ease-out),
    box-shadow 140ms var(--ease-out),
    color 140ms var(--ease-out);
}

.about-toc a:hover {
  background: var(--surface-muted);
  color: var(--primary-ink);
}

.about-toc a.active {
  background: var(--surface-muted);
  color: var(--primary-ink);
  font-weight: 760;
  box-shadow: inset 2px 0 0 var(--primary);
}

.about-toc a:focus-visible {
  outline: 2px solid var(--primary);
  outline-offset: 2px;
}

.about-document {
  width: min(100%, 980px);
  padding-bottom: var(--space-3xl);
}

.about-hero,
.about-section {
  scroll-margin-top: var(--space-xl);
}

.about-hero {
  padding-bottom: var(--space-2xl);
  border-bottom: 1px solid var(--line-strong);
}

.about-hero h2 {
  max-width: 11ch;
  margin: var(--space-xs) 0 var(--space-lg);
  color: var(--ink);
  font-family: var(--font-display-x);
  font-size: var(--fs-3xl);
  font-weight: 800;
  letter-spacing: 0;
  line-height: 0.98;
}

.lede,
.section-copy {
  max-width: 68ch;
  margin-bottom: 0;
  color: var(--ink-muted);
  font-size: var(--fs-md);
  line-height: 1.62;
}

.hero-facts {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 1px;
  max-width: 760px;
  overflow: hidden;
  margin: var(--space-xl) 0 0;
  border: 1px solid var(--line);
  border-radius: var(--radius-md);
  background: var(--line);
}

.hero-facts div {
  min-width: 0;
  background: var(--surface-strong);
  padding: var(--space-md);
}

.hero-facts dt,
.kicker,
.formula-row dt {
  color: var(--ink-soft);
  font-family: var(--font-display);
  font-size: var(--fs-2xs);
  font-weight: 760;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

.hero-facts dd {
  margin: var(--space-2xs) 0 0;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: var(--fs-md);
  font-weight: 760;
  line-height: 1.15;
}

.about-section {
  padding: var(--space-2xl) 0;
  border-bottom: 1px solid var(--line);
}

.about-section h3 {
  max-width: 18ch;
  margin: var(--space-xs) 0 var(--space-lg);
  color: var(--ink);
  font-size: var(--fs-xl);
  font-weight: 800;
  letter-spacing: 0;
  line-height: 1.06;
}

.usage-list {
  display: grid;
  gap: var(--space-md);
  max-width: 68ch;
  margin: 0;
  padding-left: 1.3rem;
  color: var(--ink-muted);
  font-size: var(--fs-md);
  line-height: 1.58;
}

.usage-list li::marker {
  color: var(--primary);
  font-family: var(--font-display);
  font-weight: 800;
}

.metric-callout {
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-md);
  background:
    linear-gradient(90deg, color-mix(in oklch, var(--line) 58%, transparent) 1px, transparent 1px),
    var(--surface-strong);
  background-size: 28px 28px;
  padding: var(--space-xl);
}

.section-heading h3 {
  max-width: 19ch;
}

.callout-columns {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: var(--space-xl);
  max-width: 860px;
  margin-top: var(--space-lg);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--line);
}

.callout-columns p {
  margin: var(--space-xs) 0 0;
  color: var(--ink-muted);
  font-size: var(--fs-base);
  line-height: 1.58;
}

.metric-formulas {
  display: grid;
  max-width: 880px;
  margin: var(--space-xl) 0 0;
  border-top: 1px solid var(--line-strong);
}

.formula-row {
  display: grid;
  grid-template-columns: minmax(168px, 0.42fr) minmax(0, 1fr);
  gap: var(--space-lg);
  padding: var(--space-md) 0;
  border-bottom: 1px solid var(--line);
}

.formula-row dd {
  display: grid;
  gap: var(--space-xs);
  min-width: 0;
  margin: 0;
}

.formula-row code {
  width: fit-content;
  max-width: 100%;
  overflow-wrap: anywhere;
  font-size: var(--fs-sm);
}

.formula-row span {
  color: var(--ink-muted);
  font-size: var(--fs-sm);
  line-height: 1.5;
}

.payoff {
  max-width: 68ch;
  margin: var(--space-xl) 0 0;
  border-top: 2px solid var(--primary);
  padding-top: var(--space-md);
  color: var(--primary-ink);
  font-size: var(--fs-md);
  font-weight: 680;
  line-height: 1.5;
}

.coverage-table-wrap {
  max-width: 100%;
  margin-top: var(--space-lg);
  overflow-x: auto;
  border-top: 1px solid var(--line-strong);
  border-bottom: 1px solid var(--line-strong);
}

table {
  width: 100%;
  min-width: 780px;
  border-collapse: collapse;
  font-size: var(--fs-sm);
}

th,
td {
  border-bottom: 1px solid var(--line);
  padding: var(--space-md) var(--space-sm);
  text-align: left;
  vertical-align: top;
}

thead th {
  color: var(--ink-soft);
  font-family: var(--font-display);
  font-size: var(--fs-2xs);
  font-weight: 780;
  letter-spacing: 0.12em;
  text-transform: uppercase;
}

tbody th {
  width: 34%;
  color: var(--ink);
  font-weight: 760;
}

td {
  color: var(--ink-muted);
  line-height: 1.45;
}

td code {
  display: inline-block;
  margin: 0 var(--space-xs) var(--space-xs) 0;
  white-space: nowrap;
}

tr:last-child th,
tr:last-child td {
  border-bottom: 0;
}

.decision-list {
  display: grid;
  max-width: 78ch;
  margin: 0;
  border-top: 1px solid var(--line-strong);
}

.decision-list div {
  display: grid;
  grid-template-columns: minmax(210px, 0.44fr) minmax(0, 1fr);
  gap: var(--space-xl);
  padding: var(--space-lg) 0;
  border-bottom: 1px solid var(--line);
}

.decision-list dt {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: var(--fs-md);
  font-weight: 760;
  line-height: 1.2;
}

.decision-list dd {
  margin: 0;
  color: var(--ink-muted);
  font-size: var(--fs-base);
  line-height: 1.58;
}

.decision-list.compact {
  margin-top: var(--space-lg);
}

.tradeoff-list {
  display: grid;
  max-width: 78ch;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--line-strong);
  list-style: none;
}

.tradeoff-list li {
  display: grid;
  grid-template-columns: minmax(190px, 0.38fr) minmax(0, 1fr);
  gap: var(--space-md) var(--space-xl);
  padding: var(--space-lg) 0;
  border-bottom: 1px solid var(--line);
}

.tradeoff-list strong {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: var(--fs-md);
  line-height: 1.2;
}

.tradeoff-list span,
.tradeoff-list em {
  color: var(--ink-muted);
  font-size: var(--fs-base);
  font-style: normal;
  line-height: 1.58;
}

.tradeoff-list em {
  grid-column: 2;
  color: var(--primary-ink);
  font-weight: 680;
}

@media (max-width: 900px) {
  .about-view {
    grid-template-columns: 1fr;
    gap: var(--space-lg);
    padding: var(--space-lg);
  }

  .about-toc {
    position: relative;
    top: auto;
    z-index: 1;
    background: var(--surface);
  }

  .about-toc nav {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-xs);
  }

  .about-toc a {
    min-height: 44px;
    border: 1px solid var(--line);
    background: var(--surface-strong);
  }

  .about-toc a.active {
    border-color: var(--primary);
    box-shadow: none;
  }

  .about-hero h2 {
    max-width: 12ch;
    font-size: var(--fs-2xl);
    line-height: 1.02;
  }

  .hero-facts,
  .callout-columns,
  .formula-row,
  .decision-list div,
  .tradeoff-list li {
    grid-template-columns: 1fr;
  }

  .tradeoff-list em {
    grid-column: auto;
  }
}

@media (max-width: 720px) {
  .about-view {
    padding: var(--space-md);
  }

  .about-section {
    padding: var(--space-xl) 0;
  }

  .metric-callout {
    padding: var(--space-lg);
  }

  .hero-facts {
    grid-template-columns: 1fr;
  }

  table {
    min-width: 0;
  }

  thead {
    display: none;
  }

  table,
  tbody,
  tr,
  th,
  td {
    display: block;
    width: 100%;
  }

  tr {
    border-bottom: 1px solid var(--line-strong);
    padding: var(--space-md) 0;
  }

  tr:last-child {
    border-bottom: 0;
  }

  tbody th,
  td {
    border-bottom: 0;
    padding: var(--space-xs) 0;
  }

  tbody th::before,
  td::before {
    content: attr(data-label);
    display: block;
    margin-bottom: var(--space-2xs);
    color: var(--ink-soft);
    font-family: var(--font-display);
    font-size: var(--fs-2xs);
    font-weight: 760;
    letter-spacing: 0.1em;
    text-transform: uppercase;
  }

  td code {
    white-space: normal;
  }
}
</style>
