<script setup>
import { computed, onMounted, ref } from 'vue';
import { AlertTriangle, BarChart3, BookOpen, GitBranch, Moon, RotateCcw, Sun } from '@lucide/vue';
import AboutView from './components/about/AboutView.vue';
import AnalyticsView from './components/analytics/AnalyticsView.vue';
import OrgChartView from './components/orgchart/OrgChartView.vue';
import { useOrgTree } from './composables/useOrgTree.js';
import { formatCurrency, formatNumber } from './lib/format.js';

const store = useOrgTree();
const activeTab = ref('org');
const EMPTY_SUMMARY = Object.freeze({ headcount: 0, managers: 0, ics: 0, salary: 0 });

const summary = computed(() => {
  if (activeTab.value === 'org') return store.globalSummary.value ?? store.filteredSummary.value ?? EMPTY_SUMMARY;
  return store.filteredSummary.value ?? store.globalSummary.value ?? EMPTY_SUMMARY;
});

// Theme. An inline script in index.html sets data-theme before paint to avoid a
// flash; this ref just mirrors that so the toggle icon and persistence stay in sync.
const theme = ref('light');

function applyTheme(next) {
  document.documentElement.setAttribute('data-theme', next);
}

function toggleTheme() {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  applyTheme(theme.value);
  localStorage.setItem('theme', theme.value);
}

// Loading at the shell level ensures both tabs share the same parsed hierarchy,
// rollup metrics, filters, and error state.
onMounted(() => {
  theme.value = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
  store.load();
});
</script>

<template>
  <div class="app-shell">
    <a class="skip-link" href="#main-content">Skip to content</a>

    <header class="topbar">
      <div class="brand-block">
        <div class="brand-mark" aria-hidden="true">GC</div>
        <div>
          <p class="eyebrow">Dayforce assessment</p>
          <h1>Giga Corp Org Explorer</h1>
        </div>
      </div>

      <div class="topbar-end">
        <nav class="tab-nav" aria-label="Primary views">
          <button :class="{ active: activeTab === 'org' }" type="button" @click="activeTab = 'org'">
            <GitBranch :size="18" aria-hidden="true" />
            <span>Org Chart</span>
          </button>
          <button :class="{ active: activeTab === 'analytics' }" type="button" @click="activeTab = 'analytics'">
            <BarChart3 :size="18" aria-hidden="true" />
            <span>Cost Analytics</span>
          </button>
          <button :class="{ active: activeTab === 'about' }" type="button" @click="activeTab = 'about'">
            <BookOpen :size="18" aria-hidden="true" />
            <span>How it works</span>
          </button>
        </nav>
        <button
          class="theme-toggle"
          type="button"
          :aria-label="theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'"
          @click="toggleTheme"
        >
          <Sun v-if="theme === 'dark'" :size="18" aria-hidden="true" />
          <Moon v-else :size="18" aria-hidden="true" />
        </button>
      </div>
    </header>

    <main id="main-content" class="main-surface">
      <Transition name="view-fade" mode="out-in">
      <AboutView v-if="activeTab === 'about'" key="about" />

      <section v-else-if="store.loadState.value === 'loading' || store.loadState.value === 'idle'" key="loading" class="loading-state">
        <div class="loading-rail" aria-hidden="true">
          <span />
        </div>
        <div>
          <p class="eyebrow">Loading hierarchy</p>
          <h2>{{ store.loadMessage.value }}</h2>
          <p>Parsing 40,000 employees, validating reporting lines, and computing descendant cost metrics once.</p>
        </div>
      </section>

      <section v-else-if="store.loadState.value === 'error'" key="error" class="error-state" role="alert">
        <div class="status-card">
          <span class="status-icon" aria-hidden="true"><AlertTriangle :size="22" /></span>
          <p class="eyebrow">Data load failed</p>
          <h2>{{ store.error.value?.message }}</h2>
          <p>
            The dataset is fetched from a hosted CSV. Check your network connection and that the
            CSV headers match the assessment data.
          </p>
          <button type="button" class="status-action" @click="store.load()">
            <RotateCcw :size="16" aria-hidden="true" />
            Try again
          </button>
        </div>
      </section>

      <div v-else key="loaded" class="loaded-view">
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

        <Transition name="view-fade" mode="out-in">
          <OrgChartView v-if="activeTab === 'org'" key="org" />
          <AnalyticsView v-else key="analytics" @show-org="activeTab = 'org'" />
        </Transition>
      </div>
      </Transition>
    </main>
  </div>
</template>
