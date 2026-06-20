<script setup>
import { X } from '@lucide/vue';

defineProps({
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
</script>

<template>
  <!-- The top values are enough to make filtering useful without turning the
    dashboard into a long form. The full dataset still feeds every chart. -->
  <section class="filter-bar" aria-label="Analytics filters">
    <div class="filter-group">
      <span>Department</span>
      <button
        v-for="row in analytics.departments.slice(0, 7)"
        :key="row.label"
        type="button"
        :class="{ active: filters.department === row.label }"
        @click="$emit('filter', 'department', row.label)"
      >
        {{ row.label }}
      </button>
    </div>

    <div class="filter-group compact">
      <span>Location</span>
      <button
        v-for="row in analytics.locations.slice(0, 5)"
        :key="row.label"
        type="button"
        :class="{ active: filters.location === row.label }"
        @click="$emit('filter', 'location', row.label)"
      >
        {{ row.label }}
      </button>
    </div>

    <div class="filter-group levels">
      <span>Level</span>
      <button
        v-for="row in analytics.levels"
        :key="row.level"
        type="button"
        :class="{ active: filters.level === row.level }"
        @click="$emit('filter', 'level', row.level)"
      >
        {{ row.level }}
      </button>
    </div>

    <button class="clear-button" type="button" @click="$emit('clear')">
      <X :size="16" aria-hidden="true" />
      Clear
    </button>
  </section>
</template>

<style scoped>
.filter-bar {
  display: grid;
  gap: 10px;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-strong);
  padding: 12px;
  box-shadow: var(--shadow-sm);
}

.filter-group {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: thin;
}

.filter-group span {
  flex: 0 0 auto;
  color: var(--ink-soft);
  font-size: 0.72rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.filter-group button,
.clear-button {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid var(--line);
  border-radius: 999px;
  background: var(--surface);
  padding: 0 10px;
  color: var(--ink-muted);
  cursor: pointer;
  font-size: 0.78rem;
  font-weight: 740;
  white-space: nowrap;
}

.filter-group button:hover,
.clear-button:hover,
.filter-group button.active {
  border-color: color-mix(in oklch, var(--primary) 42%, var(--line));
  background: var(--primary-soft);
  color: var(--primary-ink);
}

.levels button {
  min-width: 34px;
  padding: 0 8px;
}

.clear-button {
  justify-self: start;
}

@media (min-width: 980px) {
  .filter-bar {
    grid-template-columns: minmax(0, 1.4fr) minmax(0, 1fr) auto auto;
    align-items: center;
  }

  .clear-button {
    justify-self: end;
  }
}
</style>
