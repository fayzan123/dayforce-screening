const compactCurrency = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
  style: 'currency',
  currency: 'USD',
});

const fullCurrency = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 0,
  style: 'currency',
  currency: 'USD',
});

const compactNumber = new Intl.NumberFormat('en-US', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const integerNumber = new Intl.NumberFormat('en-US');

const percentNumber = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 1,
  style: 'percent',
});

const ratioNumber = new Intl.NumberFormat('en-US', {
  maximumFractionDigits: 2,
});

/**
 * Shared presentation helpers.
 *
 * Keeping formatting here prevents chart/card components from each inventing
 * their own currency, ratio, and compact-number behavior.
 */

export function formatCurrency(value, { compact = true } = {}) {
  if (!Number.isFinite(value)) return '-';
  return compact ? compactCurrency.format(value) : fullCurrency.format(value);
}

export function formatNumber(value, { compact = false } = {}) {
  if (!Number.isFinite(value)) return '-';
  return compact ? compactNumber.format(value) : integerNumber.format(value);
}

export function formatPercent(value) {
  if (!Number.isFinite(value)) return '-';
  return percentNumber.format(value);
}

export function formatRatio(value) {
  if (!Number.isFinite(value)) return '-';
  return `${ratioNumber.format(value)} : 1`;
}

export function initialsForName(name) {
  // The source Photo column points to placeholder ui-avatar URLs, so the app
  // generates deterministic initials instead of displaying broken-looking photos.
  if (!name) return '??';
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (!parts.length) return '??';
  return parts
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join('');
}

export function slugKey(value) {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
