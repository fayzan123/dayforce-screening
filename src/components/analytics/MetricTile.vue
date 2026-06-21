<script setup>
// Presentational tile for a single headline metric: a label, a large tabular
// value, and an optional supporting note. Pure display, no logic.
defineProps({
  label: {
    type: String,
    required: true,
  },
  value: {
    type: String,
    required: true,
  },
  note: {
    type: String,
    default: '',
  },
});
</script>

<template>
  <div class="metric-tile">
    <span>{{ label }}</span>
    <strong>{{ value }}</strong>
    <small v-if="note">{{ note }}</small>
  </div>
</template>

<style scoped>
.metric-tile {
  display: grid;
  gap: 5px;
  min-width: 0;
  border: 1px solid var(--line);
  border-radius: 8px;
  background: var(--surface-strong);
  padding: 14px;
  box-shadow: var(--shadow-sm);
}

.metric-tile span,
.metric-tile small {
  overflow: hidden;
  color: var(--ink-soft);
  font-size: 0.75rem;
  font-weight: 750;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-tile strong {
  overflow: hidden;
  color: var(--ink);
  font-size: clamp(1.35rem, 2.2vw, 2rem);
  font-variant-numeric: tabular-nums;
  font-weight: 820;
  letter-spacing: 0;
  line-height: 1;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.metric-tile small {
  color: var(--ink-muted);
  font-size: 0.72rem;
}
</style>
