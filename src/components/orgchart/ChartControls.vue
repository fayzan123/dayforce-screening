<script setup>
import { computed, ref } from 'vue';
import { ChevronsDownUp, LocateFixed, Maximize2, RotateCcw, Search, X, ZoomIn, ZoomOut } from '@lucide/vue';
import { useOrgTree } from '../../composables/useOrgTree.js';
import { formatNumber } from '../../lib/format.js';

const emit = defineEmits(['zoom-in', 'zoom-out', 'fit', 'collapse-all', 'reset', 'jump']);
const store = useOrgTree();
const query = ref('');
const focused = ref(false);

// Search is intentionally backed by the full tree, not the visible layout, so a
// user can jump to deep employees without manually opening every ancestor.
const results = computed(() => store.searchNodes(query.value, 7));

function choose(node) {
  query.value = node.data.name;
  emit('jump', node);
}

function submitSearch() {
  const [first] = results.value;
  if (first) choose(first);
}
</script>

<template>
  <div class="chart-controls" aria-label="Org chart controls">
    <form class="search-box" role="search" @submit.prevent="submitSearch">
      <Search :size="17" aria-hidden="true" />
      <label class="sr-only" for="org-search">Search people</label>
      <input
        id="org-search"
        v-model="query"
        type="search"
        placeholder="Search name, title, team..."
        autocomplete="off"
        @focus="focused = true"
        @blur="focused = false"
      />
      <button v-if="query" type="button" aria-label="Clear search" @click="query = ''">
        <X :size="16" aria-hidden="true" />
      </button>

      <div v-if="query && (focused || results.length)" class="search-results">
        <button v-for="node in results" :key="node.id" type="button" @mousedown.prevent="choose(node)">
          <span>
            <strong>{{ node.data.name }}</strong>
            <small>{{ node.data.title }}</small>
          </span>
          <em>{{ node.data.department }}</em>
        </button>
        <p v-if="!results.length">No people match that search.</p>
      </div>
    </form>

    <div class="control-group">
      <button type="button" aria-label="Zoom in" title="Zoom in" @click="emit('zoom-in')">
        <ZoomIn :size="18" aria-hidden="true" />
      </button>
      <button type="button" aria-label="Zoom out" title="Zoom out" @click="emit('zoom-out')">
        <ZoomOut :size="18" aria-hidden="true" />
      </button>
      <button type="button" aria-label="Fit chart" title="Fit chart" @click="emit('fit')">
        <Maximize2 :size="18" aria-hidden="true" />
      </button>
      <button type="button" aria-label="Center selected node" title="Center selected" @click="emit('jump', store.selectedNode.value)">
        <LocateFixed :size="18" aria-hidden="true" />
      </button>
    </div>

    <div class="control-group">
      <button type="button" title="Collapse all" @click="emit('collapse-all')">
        <ChevronsDownUp :size="18" aria-hidden="true" />
        <span>Collapse</span>
      </button>
      <button type="button" title="Reset" @click="emit('reset')">
        <RotateCcw :size="18" aria-hidden="true" />
        <span>Reset</span>
      </button>
    </div>

    <div class="visible-count">
      {{ formatNumber(store.allNodes.value.length) }} employees
    </div>
  </div>
</template>

<style scoped>
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}

.chart-controls {
  position: absolute;
  z-index: 12;
  top: 86px;
  left: 12px;
  display: flex;
  max-width: calc(100% - 24px);
  align-items: center;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: color-mix(in oklch, var(--surface-strong) 96%, transparent);
  padding: 7px;
  box-shadow: var(--shadow-sm);
}

.search-box {
  position: relative;
  display: flex;
  width: min(360px, 38vw);
  min-width: 220px;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--surface);
  padding: 0 8px;
  color: var(--ink-soft);
}

/* The inner input clears its own outline; surface keyboard focus on the wrapper. */
.search-box:focus-within {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-soft);
}

.search-box input {
  min-width: 0;
  width: 100%;
  height: 38px;
  border: 0;
  background: transparent;
  color: var(--ink);
  outline: none;
}

.search-box input::placeholder {
  color: var(--ink-soft);
}

.search-box > button,
.control-group button {
  display: inline-flex;
  min-width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  gap: 7px;
  border: 1px solid var(--line);
  border-radius: 7px;
  background: var(--surface);
  color: var(--ink-muted);
  cursor: pointer;
  font-size: 0.82rem;
  font-weight: 740;
}

.search-box > button {
  min-width: 28px;
  height: 28px;
  border: 0;
}

.control-group {
  display: flex;
  gap: 5px;
}

/* Labelled buttons (Collapse, Reset) need side padding so the text isn't cramped
   against the border; icon-only buttons stay square. */
.control-group button:has(span) {
  padding: 0 14px;
}

.control-group button:hover,
.search-box > button:hover {
  border-color: var(--line-strong);
  color: var(--primary-ink);
}

.search-results {
  position: absolute;
  z-index: 40;
  top: calc(100% + 8px);
  left: 0;
  width: min(420px, 86vw);
  overflow: hidden;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-strong);
  box-shadow: 0 18px 48px oklch(30% 0.04 220 / 0.18);
}

.search-results button {
  display: grid;
  width: 100%;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 12px;
  border: 0;
  border-bottom: 1px solid var(--line);
  border-radius: 0;
  background: transparent;
  padding: 10px 12px;
  text-align: left;
}

.search-results button:hover {
  background: var(--primary-soft);
}

.search-results span,
.search-results strong,
.search-results small {
  display: block;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.search-results small,
.search-results em {
  color: var(--ink-muted);
  font-size: 0.74rem;
  font-style: normal;
}

.search-results p {
  margin: 0;
  padding: 12px;
  color: var(--ink-muted);
  font-size: 0.84rem;
}

.visible-count {
  padding: 0 8px;
  color: var(--ink-soft);
  font-size: 0.78rem;
  font-variant-numeric: tabular-nums;
  font-weight: 720;
  white-space: nowrap;
}

@media (max-width: 760px) {
  .chart-controls {
    position: sticky;
    top: 10px;
    left: auto;
    flex-wrap: wrap;
    margin: 10px;
  }

  .search-box {
    width: 100%;
  }

  .control-group {
    flex: 1 1 auto;
  }

  .control-group button {
    flex: 1;
  }

  .visible-count {
    display: none;
  }
}
</style>
