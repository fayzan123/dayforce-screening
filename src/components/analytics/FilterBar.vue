<script setup>
import { computed } from 'vue';
import { X } from '@lucide/vue';

const props = defineProps({
  analytics: {
    type: Object,
    required: true,
  },
  filters: {
    type: Object,
    required: true,
  },
});

defineEmits(['filter', 'clear']);

// Drive the Clear affordance off real state so it only appears when there is
// something to clear, and can name how many filters are active.
const activeCount = computed(
  () => ['department', 'location', 'level'].filter((key) => props.filters[key] != null).length,
);
</script>

<template>
  <!-- The top values are enough to make filtering useful without turning the
    dashboard into a long form. The full dataset still feeds every chart. -->
  <section class="filter-bar" aria-label="Analytics filters">
    <div class="filter-group">
      <span id="filter-department">Department</span>
      <div class="filter-options" role="group" aria-labelledby="filter-department">
        <button
          v-for="row in analytics.departments.slice(0, 7)"
          :key="row.label"
          type="button"
          :class="{ active: filters.department === row.label }"
          :aria-pressed="filters.department === row.label"
          @click="$emit('filter', 'department', row.label)"
        >
          {{ row.label }}
        </button>
      </div>
    </div>

    <div class="filter-group">
      <span id="filter-location">Location</span>
      <div class="filter-options" role="group" aria-labelledby="filter-location">
        <button
          v-for="row in analytics.locations.slice(0, 5)"
          :key="row.label"
          type="button"
          :class="{ active: filters.location === row.label }"
          :aria-pressed="filters.location === row.label"
          @click="$emit('filter', 'location', row.label)"
        >
          {{ row.label }}
        </button>
      </div>
    </div>

    <div class="filter-group">
      <span id="filter-level">Level</span>
      <div class="filter-options levels" role="group" aria-labelledby="filter-level">
        <button
          v-for="row in analytics.levels"
          :key="row.level"
          type="button"
          :class="{ active: filters.level === row.level }"
          :aria-pressed="filters.level === row.level"
          :aria-label="`Level ${row.level}`"
          @click="$emit('filter', 'level', row.level)"
        >
          {{ row.level }}
        </button>
      </div>
    </div>

    <footer v-if="activeCount" class="filter-footer">
      <button class="clear-button" type="button" @click="$emit('clear')">
        <X :size="16" aria-hidden="true" />
        Clear {{ activeCount === 1 ? 'filter' : 'filters' }} ({{ activeCount }})
      </button>
    </footer>
  </section>
</template>

<style scoped>
.filter-bar {
  display: grid;
  gap: 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-strong);
  padding: 12px 14px;
  box-shadow: var(--shadow-sm);
}

.filter-group {
  display: grid;
  grid-template-columns: 92px minmax(0, 1fr);
  gap: 10px;
  align-items: start;
}

.filter-group + .filter-group {
  border-top: 1px solid var(--line);
  padding-top: 10px;
}

.filter-group span {
  padding-top: 8px;
  color: var(--ink-soft);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.filter-options {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.filter-group button,
.clear-button {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  padding: 0 12px;
  color: var(--ink-muted);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 740;
  white-space: nowrap;
  transition:
    background 140ms var(--ease-out),
    border-color 140ms var(--ease-out),
    color 140ms var(--ease-out);
}

.filter-group button:hover,
.clear-button:hover,
.filter-group button.active {
  border-color: color-mix(in oklch, var(--primary) 42%, var(--line));
  background: var(--primary-soft);
  color: var(--primary-ink);
}

.levels button {
  min-width: 44px;
  padding: 0 8px;
  font-variant-numeric: tabular-nums;
}

.filter-footer {
  display: flex;
  justify-content: flex-end;
  border-top: 1px solid var(--line);
  padding-top: 10px;
}

@media (max-width: 600px) {
  .filter-group {
    grid-template-columns: 1fr;
    gap: 6px;
  }

  .filter-group span {
    padding-top: 0;
  }
}
</style>
