<script setup>
import { computed } from 'vue';
import { formatCurrency, formatNumber, formatPercent } from '../../lib/format.js';

// The signature view: the literal shape of the company. Each level is a centered
// band whose width is proportional to its headcount, stacked into the org's true
// silhouette — instantly exposing how bottom-heavy Giga Corp is.
const props = defineProps({
  rows: {
    type: Array,
    required: true,
  },
  activeLevel: {
    type: Number,
    default: null,
  },
});

defineEmits(['select']);

const model = computed(() => {
  const rows = [...props.rows].sort((a, b) => a.level - b.level);
  const maxHead = Math.max(1, ...rows.map((row) => row.headcount));
  const totalHead = rows.reduce((sum, row) => sum + row.headcount, 0) || 1;
  const widest = rows.reduce((top, row) => (row.headcount > top.headcount ? row : top), rows[0] ?? { level: null });
  return {
    totalHead,
    widestLevel: widest?.level ?? null,
    bands: rows.map((row) => ({
      ...row,
      width: Math.max(3.5, (row.headcount / maxHead) * 100),
      share: row.headcount / totalHead,
      // Top layers deep ink, base layers lighter — like strata in a section drawing.
      depth: rows.length > 1 ? (row.level - rows[0].level) / (rows.length - 1) : 0,
    })),
  };
});
</script>

<template>
  <section class="silhouette" aria-label="Organizational silhouette by level">
    <header class="sil-head">
      <div>
        <p class="eyebrow">Organizational silhouette</p>
        <h2>The shape of the company</h2>
      </div>
      <p class="sil-note">
        Every band is one reporting layer, scaled to its headcount. The base dwarfs the
        executive layers — the workforce concentrates near the bottom.
      </p>
    </header>

    <div class="sil-stack" role="list">
      <button
        v-for="(band, index) in model.bands"
        :key="band.level"
        class="sil-band"
        :class="{ active: activeLevel === band.level, widest: band.level === model.widestLevel }"
        :style="{ '--i': index }"
        type="button"
        role="listitem"
        :aria-label="`Level ${band.level}: ${formatNumber(band.headcount)} people, ${formatCurrency(band.salary)}`"
        @click="$emit('select', band)"
      >
        <span class="sil-lvl tnum">L{{ band.level }}</span>
        <span class="sil-bar-wrap">
          <span
            class="sil-bar"
            :style="{
              width: `${band.width}%`,
              background: `color-mix(in oklch, var(--primary) ${86 - band.depth * 46}%, var(--surface-strong))`,
            }"
          />
        </span>
        <span class="sil-readout">
          <span class="sil-count tnum">{{ formatNumber(band.headcount) }}</span>
          <span class="sil-sub tnum">{{ formatPercent(band.share) }} · {{ formatCurrency(band.salary) }}</span>
        </span>
      </button>
    </div>
  </section>
</template>

<style scoped>
.silhouette {
  display: grid;
  gap: var(--space-lg);
  margin-top: var(--space-sm);
  border: 1px solid var(--line-strong);
  border-radius: var(--radius-md);
  background: var(--surface-strong);
  padding: var(--space-lg) var(--space-xl);
  box-shadow: var(--shadow-sm);
}

.sil-head {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: var(--space-xl);
}

.sil-head h2 {
  margin-top: 4px;
  margin-bottom: 0;
  font-family: var(--font-display-x);
  font-size: var(--fs-xl);
  font-weight: 800;
  letter-spacing: -0.02em;
  line-height: 1;
}

.sil-note {
  max-width: 44ch;
  margin: 0;
  color: var(--ink-muted);
  font-size: var(--fs-sm);
  line-height: 1.45;
  text-align: right;
}

.sil-stack {
  display: grid;
  gap: 3px;
}

.sil-band {
  display: grid;
  grid-template-columns: 34px minmax(0, 1fr) 168px;
  align-items: center;
  gap: var(--space-md);
  min-height: 44px;
  border: 0;
  border-radius: var(--radius-xs);
  background: transparent;
  padding: 2px var(--space-xs);
  cursor: pointer;
  text-align: left;
  transition: background 150ms var(--ease-out);
}

.sil-band:hover {
  background: var(--surface-muted);
}

.sil-band.active {
  background: var(--primary-soft);
}

.sil-lvl {
  color: var(--ink-soft);
  font-family: var(--font-display);
  font-size: var(--fs-xs);
  font-weight: 700;
  letter-spacing: 0.04em;
}

/* The bars are centered so the stack forms a true axial silhouette. */
.sil-bar-wrap {
  display: flex;
  justify-content: center;
  border-left: 1px dashed var(--line);
  border-right: 1px dashed var(--line);
}

.sil-bar {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  min-width: 0;
  height: 26px;
  border-radius: 2px;
  padding-right: 8px;
  transform-origin: center;
  transition: filter 150ms var(--ease-out);
  animation: sil-grow 640ms var(--ease-out-quint) backwards;
  animation-delay: calc(var(--i, 0) * 48ms);
}

@keyframes sil-grow {
  from {
    transform: scaleX(0.04);
    opacity: 0;
  }
  to {
    transform: scaleX(1);
    opacity: 1;
  }
}

.sil-band:hover .sil-bar {
  filter: brightness(1.04);
}

.sil-band.widest .sil-bar {
  box-shadow: 0 0 0 1px color-mix(in oklch, var(--accent) 60%, transparent);
}

.sil-readout {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 1px;
  line-height: 1.1;
}

.sil-count {
  color: var(--ink);
  font-family: var(--font-display);
  font-size: var(--fs-md);
  font-variant-numeric: tabular-nums;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.sil-sub {
  color: var(--ink-muted);
  font-size: var(--fs-xs);
  font-variant-numeric: tabular-nums;
  font-weight: 600;
}

@media (max-width: 760px) {
  .silhouette {
    padding: var(--space-md);
  }

  .sil-head {
    flex-direction: column;
    align-items: stretch;
    gap: var(--space-sm);
  }

  .sil-note {
    text-align: left;
  }

  .sil-band {
    grid-template-columns: 28px minmax(0, 1fr) 96px;
    gap: var(--space-xs);
  }

  .sil-readout {
    flex-direction: column;
    gap: 0;
  }
}
</style>
