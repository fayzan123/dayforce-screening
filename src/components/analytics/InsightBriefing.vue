<script setup>
import { computed, ref, watch } from 'vue';
import InsightCard from './InsightCard.vue';

const props = defineProps({
  insights: {
    type: Array,
    required: true,
  },
  filters: {
    type: Object,
    required: true,
  },
  charts: {
    type: Array,
    required: true,
  },
});

defineEmits(['find']);

const openInsightId = ref(null);

const chartById = computed(() => new Map(props.charts.map((chart) => [chart.id, chart])));

const activeScope = computed(() => {
  const parts = [
    props.filters.department,
    props.filters.location,
    props.filters.level ? `Level ${props.filters.level}` : null,
  ].filter(Boolean);
  return parts.join(' / ');
});

const heading = computed(() => (activeScope.value ? `Within ${activeScope.value}, what stands out` : 'What stands out'));

watch(
  () => props.insights.map((insight) => insight.id).join('|'),
  () => {
    if (!props.insights.some((insight) => insight.id === openInsightId.value)) {
      openInsightId.value = null;
    }
  },
);

function chartFor(insight) {
  return chartById.value.get(insight.link.chart) ?? null;
}

function evidenceId(insight) {
  return `insight-evidence-${insight.id.replace(/[^a-z0-9]+/gi, '-')}`;
}

// Focus the inline chart on the insight's subject so "See the chart" highlights
// the exact bar/level the headline is about, not just whatever filter is active.
function inlineProps(insight) {
  const chart = chartFor(insight);
  if (!chart) return {};
  const entity = insight.link.entity;
  if (!entity) return chart.props;
  if (entity.key === 'level') return { ...chart.props, activeLevel: entity.value };
  return { ...chart.props, activeLabel: entity.value };
}

// Inline charts are evidence, not controls. Dropping `select` keeps a bar click
// from re-filtering the whole view and collapsing the card under the cursor.
function inlineListeners(insight) {
  const chart = chartFor(insight);
  if (!chart) return {};
  const { select, ...rest } = chart.listeners;
  return rest;
}

function toggleChart(insight) {
  if (!chartFor(insight)) return;
  openInsightId.value = openInsightId.value === insight.id ? null : insight.id;
}
</script>

<template>
  <section class="insight-briefing" aria-labelledby="insight-heading">
    <header>
      <p class="eyebrow">Briefing</p>
      <h2 id="insight-heading">{{ heading }}</h2>
    </header>

    <p v-if="!insights.length" class="thin-state">Nothing unusual stands out in this slice.</p>

    <ol v-else class="insight-list">
      <li v-for="insight in insights" :key="insight.id" class="insight-row">
        <InsightCard
          :insight="insight"
          :chart-open="openInsightId === insight.id"
          :has-chart="Boolean(chartFor(insight))"
          :controls-id="evidenceId(insight)"
          @toggle-chart="toggleChart(insight)"
          @find="$emit('find', insight)"
        />

        <div
          v-if="openInsightId === insight.id && chartFor(insight)"
          :id="evidenceId(insight)"
          class="inline-evidence"
        >
          <component
            :is="chartFor(insight).component"
            v-bind="inlineProps(insight)"
            v-on="inlineListeners(insight)"
          />
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.insight-briefing {
  min-width: 0;
  border-top: 1px solid var(--line-strong);
  border-bottom: 1px solid var(--line-strong);
  background:
    linear-gradient(90deg, color-mix(in oklch, var(--line) 54%, transparent) 1px, transparent 1px),
    var(--surface-strong);
  background-size: 28px 28px;
  padding: var(--space-lg) var(--space-xl);
}

header {
  display: grid;
  gap: var(--space-2xs);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--line);
}

h2 {
  margin: 0;
  color: var(--ink);
  font-family: var(--font-display);
  font-size: var(--fs-lg);
  font-weight: 820;
  letter-spacing: 0;
  line-height: 1.08;
}

.thin-state {
  margin: 0;
  padding: var(--space-lg) 0;
  color: var(--ink-muted);
  font-size: var(--fs-sm);
  font-weight: 660;
}

.insight-list {
  display: grid;
  margin: 0;
  padding: 0;
  list-style: none;
}

.insight-row {
  border-bottom: 1px solid var(--line);
}

.insight-row:last-child {
  border-bottom: 0;
}

.inline-evidence {
  padding: 0 0 var(--space-md);
}

.inline-evidence :deep(.chart-card),
.inline-evidence :deep(.silhouette) {
  margin-top: 0;
  box-shadow: none;
}

.inline-evidence :deep(.chart-card) {
  border-color: var(--line-strong);
}

@media (max-width: 720px) {
  .insight-briefing {
    padding: var(--space-md);
  }
}
</style>
