import { computed, markRaw, ref, shallowRef } from 'vue';
import { buildOrgTree } from '../lib/buildTree.js';
import { createAnalyticsMemo, EMPTY_FILTERS } from '../lib/analytics.js';
import { loadCsvRows } from '../lib/parseCsv.js';

/**
 * Shared application store for the two-tab experience.
 *
 * This stays as a small composable instead of a larger state library because the
 * app has one dataset and one active hierarchy. The important implementation
 * detail is that the 40k-node d3 tree is stored with `markRaw` + `shallowRef`,
 * so Vue does not proxy every node or every descendant link.
 */

let singleton;

function cloneFilters(filters) {
  return {
    department: filters.department ?? null,
    location: filters.location ?? null,
    level: filters.level ?? null,
  };
}

function createStore() {
  const root = shallowRef(null);
  const allNodes = shallowRef([]);
  const nodeById = shallowRef(new Map());
  const loadState = ref('idle');
  const loadMessage = ref('Preparing organization data...');
  const error = ref(null);
  const expandedIds = shallowRef(new Set());
  const selectedNodeId = ref(null);
  // Panning the camera is a separate concern from selection: a plain card click
  // should only update the inspector/highlight, never yank the viewport. Camera
  // moves are driven by bumping focusVersion (search, jump, center-selected).
  const focusNodeId = ref(null);
  const focusVersion = ref(0);
  const filters = ref(cloneFilters(EMPTY_FILTERS));
  const costMode = ref('comp');
  const proportionMode = ref('salary');
  const getAnalytics = shallowRef(null);

  const selectedNode = computed(() => {
    if (!selectedNodeId.value) return null;
    return nodeById.value.get(selectedNodeId.value) ?? null;
  });

  const analytics = computed(() => {
    if (!getAnalytics.value) return null;
    return getAnalytics.value(filters.value, costMode.value, proportionMode.value);
  });

  const hasActiveFilters = computed(() => Boolean(filters.value.department || filters.value.location || filters.value.level));

  const globalSummary = computed(() => analytics.value?.fullSummary ?? null);

  const filteredSummary = computed(() => analytics.value?.summary ?? null);

  async function load() {
    if (loadState.value === 'loaded' || loadState.value === 'loading') return;

    try {
      loadState.value = 'loading';
      loadMessage.value = 'Reading Giga Corp CSV...';
      const rows = await loadCsvRows();

      loadMessage.value = 'Building hierarchy and rolling up cost metrics...';
      const built = buildOrgTree(rows);
      // d3 hierarchy nodes are large, pointer-heavy objects. They are treated as
      // immutable data after rollup; only small refs/sets drive Vue updates.
      root.value = markRaw(built.root);
      allNodes.value = markRaw(built.allNodes);
      nodeById.value = markRaw(built.nodeById);
      getAnalytics.value = markRaw(createAnalyticsMemo(built.allNodes));

      const initialExpanded = new Set([built.root.id]);
      // Start with the CEO and direct executive layer visible so the first view
      // is useful without flooding the canvas.
      for (const child of built.root.children ?? []) {
        initialExpanded.add(child.id);
      }
      expandedIds.value = initialExpanded;
      selectedNodeId.value = built.root.id;
      loadState.value = 'loaded';
    } catch (caught) {
      error.value = caught instanceof Error ? caught : new Error(String(caught));
      loadState.value = 'error';
    }
  }

  function hasChildren(node) {
    return Boolean(node?.children?.length);
  }

  function isExpanded(id) {
    return expandedIds.value.has(id);
  }

  function toggleNode(id) {
    // Replace the Set instead of mutating in place so shallowRef subscribers are
    // notified without making the 40k-node tree reactive.
    const next = new Set(expandedIds.value);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    expandedIds.value = next;
  }

  function collapseAll() {
    expandedIds.value = root.value ? new Set([root.value.id]) : new Set();
  }

  function resetExpansion() {
    if (!root.value) return;
    const next = new Set([root.value.id]);
    for (const child of root.value.children ?? []) {
      next.add(child.id);
    }
    expandedIds.value = next;
    selectedNodeId.value = root.value.id;
  }

  function selectNode(id) {
    // Selection only: drives the inspector and the highlighted card. No camera move.
    selectedNodeId.value = id;
  }

  function clearSelection() {
    selectedNodeId.value = null;
  }

  function expandPathTo(id) {
    const target = nodeById.value.get(id);
    if (!target) return null;

    const next = new Set(expandedIds.value);
    // Expanding every ancestor is what lets search/analytics jump directly to a
    // deep node while preserving the user's existing open branches.
    for (const ancestor of target.ancestors()) {
      if (hasChildren(ancestor)) next.add(ancestor.id);
    }
    expandedIds.value = next;
    selectedNodeId.value = target.id;
    // Bump the focus version so the canvas pans to this node even if it is the
    // same id as a previous focus request.
    focusNodeId.value = target.id;
    focusVersion.value += 1;
    return target;
  }

  function searchNodes(query, limit = 8) {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    const exact = [];
    const fuzzy = [];

    // One linear scan over 40k records is fast enough for typeahead and avoids
    // adding an indexing dependency. Exact name prefixes are ranked first.
    for (const node of allNodes.value) {
      const text = node.data.searchText;
      if (node.data.name.toLowerCase().startsWith(normalized)) {
        exact.push(node);
      } else if (text.includes(normalized)) {
        fuzzy.push(node);
      }
      if (exact.length >= limit) break;
    }

    return [...exact, ...fuzzy].slice(0, limit);
  }

  function setFilter(key, value) {
    filters.value = {
      ...filters.value,
      [key]: filters.value[key] === value ? null : value,
    };
  }

  function clearFilters() {
    filters.value = cloneFilters(EMPTY_FILTERS);
  }

  function setCostMode(mode) {
    costMode.value = mode;
  }

  function setProportionMode(mode) {
    proportionMode.value = mode;
  }

  function viewFirstMatchingNode() {
    // Analytics filters often match thousands of employees; this chooses the
    // first matching node as a deterministic bridge back into the org chart.
    const node = allNodes.value.find((candidate) => {
      const data = candidate.data;
      return (
        (!filters.value.department || data.department === filters.value.department) &&
        (!filters.value.location || data.location === filters.value.location) &&
        (!filters.value.level || data.level === Number(filters.value.level))
      );
    });

    if (node) expandPathTo(node.id);
    return node ?? null;
  }

  return {
    root,
    allNodes,
    nodeById,
    loadState,
    loadMessage,
    error,
    expandedIds,
    selectedNodeId,
    selectedNode,
    focusNodeId,
    focusVersion,
    filters,
    costMode,
    proportionMode,
    analytics,
    hasActiveFilters,
    globalSummary,
    filteredSummary,
    load,
    isExpanded,
    toggleNode,
    collapseAll,
    resetExpansion,
    selectNode,
    clearSelection,
    expandPathTo,
    searchNodes,
    setFilter,
    clearFilters,
    setCostMode,
    setProportionMode,
    viewFirstMatchingNode,
  };
}

export function useOrgTree() {
  if (!singleton) singleton = createStore();
  return singleton;
}
