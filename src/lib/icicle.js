import { hierarchy, partition } from 'd3-hierarchy';

export const ICICLE_WIDTH = 1000;
export const ICICLE_LAYER_HEIGHT = 44;

function wrapNode(node) {
  return {
    source: node,
    children: (node.children ?? []).map(wrapNode),
  };
}

function valueForMode(node, mode) {
  if (mode === 'headcount') return 1;
  // Partition layouts need leaf-level values. Salary gives the true subtree cost
  // footprint while the node metrics remain descendant-only for the assessment.
  return node.data.salary;
}

/**
 * Build the row model used by the icicle chart.
 *
 * This intentionally copies hierarchy shape before calling d3.partition because
 * layout algorithms mutate x/y fields on their input nodes. The original
 * assessment hierarchy and frozen metrics stay untouched.
 */
export function buildIciclePartition(focusNode, { mode = 'cost', depthLimit = 4, width = ICICLE_WIDTH } = {}) {
  const layoutRoot = hierarchy(wrapNode(focusNode), (node) => node.children)
    .sum((node) => valueForMode(node.source, mode))
    .sort((a, b) => b.value - a.value);

  partition().size([width, Math.max(1, layoutRoot.height + 1)])(layoutRoot);

  const visibleDepth = Math.min(layoutRoot.height, depthLimit);
  const nodes = layoutRoot
    .descendants()
    .filter((node) => node.depth <= depthLimit && node.x1 - node.x0 >= 0.65)
    .map((node) => ({
      id: node.data.source.id,
      source: node.data.source,
      depth: node.depth,
      x0: node.x0,
      x1: node.x1,
      y0: node.depth * ICICLE_LAYER_HEIGHT,
      y1: (node.depth + 1) * ICICLE_LAYER_HEIGHT - 4,
      value: node.value,
      share: node.parent?.value ? node.value / node.parent.value : 1,
      hasChildren: Boolean(node.data.source.children?.length),
    }));

  return {
    focusNode,
    mode,
    width,
    height: (visibleDepth + 1) * ICICLE_LAYER_HEIGHT,
    nodes,
  };
}
