<script setup>
import { computed, onMounted, ref } from 'vue';
import { AlertTriangle, BarChart3, GitBranch } from '@lucide/vue';
import AnalyticsView from './components/analytics/AnalyticsView.vue';
import OrgChartView from './components/orgchart/OrgChartView.vue';
import { useOrgTree } from './composables/useOrgTree.js';
import { formatCurrency, formatNumber } from './lib/format.js';

const store = useOrgTree();
const activeTab = ref('org');

const summary = computed(() => {
  if (activeTab.value === 'org') return store.globalSummary.value ?? store.filteredSummary.value;
  return store.filteredSummary.value ?? store.globalSummary.value;
});

// Loading at the shell level ensures both tabs share the same parsed hierarchy,
// rollup metrics, filters, and error state.
onMounted(() => {
  store.load();
});
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <div class="brand-block">
        <div class="brand-mark" aria-hidden="true">GC</div>
        <div>
          <p class="eyebrow">Dayforce assessment</p>
          <h1>Giga Corp Org Explorer</h1>
        </div>
      </div>

      <nav class="tab-nav" aria-label="Primary views">
        <button :class="{ active: activeTab === 'org' }" type="button" @click="activeTab = 'org'">
          <GitBranch :size="18" aria-hidden="true" />
          <span>Org Chart</span>
        </button>
        <button :class="{ active: activeTab === 'analytics' }" type="button" @click="activeTab = 'analytics'">
          <BarChart3 :size="18" aria-hidden="true" />
          <span>Cost Analytics</span>
        </button>
      </nav>
    </header>

    <main id="main-content" class="main-surface">
      <section v-if="store.loadState.value === 'loading' || store.loadState.value === 'idle'" class="loading-state">
        <div class="loading-rail" aria-hidden="true">
          <span />
        </div>
        <div>
          <p class="eyebrow">Loading hierarchy</p>
          <h2>{{ store.loadMessage.value }}</h2>
          <p>Parsing 40,000 employees, validating reporting lines, and computing descendant cost metrics once.</p>
        </div>
      </section>

      <section v-else-if="store.loadState.value === 'error'" class="error-state" role="alert">
        <AlertTriangle :size="28" aria-hidden="true" />
        <div>
          <p class="eyebrow">Data load failed</p>
          <h2>{{ store.error.value?.message }}</h2>
          <p>Check that <code>public/data/giga-corp.csv</code> exists and that the CSV headers match the assessment data.</p>
        </div>
      </section>

      <template v-else>
        <!-- The org chart keeps global totals so analytics filters do not make the
          hierarchy tab look smaller than it is. Analytics keeps filtered totals. -->
        <section class="summary-strip" aria-label="Organization summary">
          <div>
            <span>Headcount <em v-if="activeTab === 'analytics' && store.hasActiveFilters.value">Filtered</em></span>
            <strong>{{ formatNumber(summary.headcount) }}</strong>
          </div>
          <div>
            <span>Managers</span>
            <strong>{{ formatNumber(summary.managers) }}</strong>
          </div>
          <div>
            <span>ICs</span>
            <strong>{{ formatNumber(summary.ics) }}</strong>
          </div>
          <div>
            <span>Salary Base</span>
            <strong>{{ formatCurrency(summary.salary) }}</strong>
          </div>
        </section>

        <OrgChartView v-if="activeTab === 'org'" />
        <AnalyticsView v-else @show-org="activeTab = 'org'" />
      </template>
    </main>
  </div>
</template>
