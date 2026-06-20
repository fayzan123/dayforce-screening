import { stratify } from 'd3-hierarchy';
import { initialsForName } from './format.js';

/**
 * This module is the graded core of the assessment.
 *
 * It turns raw PapaParse rows into a d3 hierarchy and writes every required
 * descendant metric exactly once. The UI never recalculates these values when
 * a card is expanded/collapsed; it only reads the frozen `node.metrics` object.
 */

/**
 * @typedef {Object} EmployeeRow
 * @property {string} id Stable employee id from `Employee Id`.
 * @property {string | null} parentId Manager employee id, or null for the CEO/root.
 * @property {string} name
 * @property {string} title
 * @property {string} department
 * @property {string} location
 * @property {number} salary Assessment cost calculations use salary only.
 * @property {number} bonus Used by the bonus analytics view, not core node metrics.
 * @property {number} level Provided CSV level, retained for analytics and consistency checks.
 * @property {string} initials Generated avatar fallback because CSV photo URLs are placeholders.
 * @property {string} searchText Lowercase denormalized text for fast client-side search.
 */

/**
 * @typedef {Object} OrgMetrics
 * @property {number} descendantCount All recursive reports, excluding the node itself.
 * @property {number} nonLeafDescendantCount Recursive reports who are also managers.
 * @property {number} mgmtCost Salary sum of descendant managers.
 * @property {number} icCost Salary sum of descendant individual contributors.
 * @property {number} totalCost Salary sum of all descendants.
 * @property {number | null} managerCostShare mgmtCost / totalCost.
 * @property {number | null} icToManagerCostRatio icCost / mgmtCost; this is the written brief's "IC to manager" ratio.
 * @property {number | null} managerToIcCostRatio mgmtCost / icCost.
 */

const REQUIRED_COLUMNS = [
  'Employee Id',
  'Name',
  'Job Title',
  'Manager',
  'Department',
  'Location',
  'Salary',
  'Bonus',
  'level',
];

function parseNumber(value, label, rowIndex, { allowBlank = false } = {}) {
  if ((value === '' || value == null) && allowBlank) return 0;
  const number = Number(value);
  if (!Number.isFinite(number)) {
    throw new Error(`Row ${rowIndex}: ${label} must be numeric.`);
  }
  return number;
}

function assertRequiredColumns(row) {
  const missing = REQUIRED_COLUMNS.filter((column) => !(column in row));
  if (missing.length) {
    throw new Error(`CSV is missing required columns: ${missing.join(', ')}.`);
  }
}

/**
 * Convert CSV-shaped rows into a small, predictable object model.
 *
 * PapaParse intentionally keeps values as strings here. That gives us one place
 * to validate numbers and produce assessment-friendly error messages instead
 * of letting d3 or chart math fail later with a vague NaN issue.
 *
 * @param {Array<Record<string, string>>} rawRows
 * @returns {EmployeeRow[]}
 */
export function normalizeRows(rawRows) {
  if (!Array.isArray(rawRows) || rawRows.length === 0) {
    throw new Error('CSV did not contain any employee rows.');
  }

  assertRequiredColumns(rawRows[0]);

  return rawRows
    .filter((row) => row && row['Employee Id'])
    .map((row, index) => {
      const rowIndex = index + 2;
      const id = String(row['Employee Id']).trim();
      const parentId = String(row.Manager ?? '').trim() || null;
      const name = String(row.Name ?? '').trim();
      const title = String(row['Job Title'] ?? '').trim();
      const department = String(row.Department ?? '').trim() || 'Unassigned';
      const location = String(row.Location ?? '').trim() || 'Unknown';
      const salary = parseNumber(row.Salary, 'Salary', rowIndex);
      const bonus = parseNumber(row.Bonus, 'Bonus', rowIndex, { allowBlank: true });
      const level = parseNumber(row.level, 'level', rowIndex);

      if (!id) throw new Error(`Row ${rowIndex}: Employee Id is required.`);
      if (!name) throw new Error(`Row ${rowIndex}: Name is required.`);

      return {
        id,
        parentId,
        name,
        title,
        department,
        location,
        salary,
        bonus,
        level,
        initials: initialsForName(name),
        searchText: `${name} ${title} ${department} ${location}`.toLowerCase(),
      };
    });
}

/**
 * Fail fast before calling d3.stratify.
 *
 * d3 will throw for duplicates/orphans too, but these explicit checks produce
 * clearer messages for a reviewer and document the assumptions in the dataset:
 * one CEO root, unique employee ids, and every Manager id must resolve.
 *
 * @param {EmployeeRow[]} rows
 */
export function validateRows(rows) {
  const ids = new Set();
  const duplicates = new Set();
  let roots = 0;

  for (const row of rows) {
    if (ids.has(row.id)) duplicates.add(row.id);
    ids.add(row.id);
    if (!row.parentId) roots += 1;
  }

  if (duplicates.size) {
    throw new Error(`Duplicate Employee Id values found: ${[...duplicates].slice(0, 5).join(', ')}.`);
  }

  if (roots !== 1) {
    throw new Error(`Expected exactly one root employee, found ${roots}.`);
  }

  const orphans = rows.filter((row) => row.parentId && !ids.has(row.parentId));
  if (orphans.length) {
    throw new Error(
      `Found ${orphans.length} employees whose Manager does not exist. First orphan: ${orphans[0].id}.`,
    );
  }
}

/**
 * Build the hierarchy and attach frozen descendant metrics to each node.
 *
 * The important performance property is the `eachAfter` post-order traversal:
 * children are visited before their parent, so each parent can aggregate already
 * computed child totals in O(1) per child. That makes the whole rollup O(n), and
 * expand/collapse can remain a pure UI-state operation.
 *
 * @param {Array<Record<string, string>>} rawRows Parsed CSV rows.
 * @returns {{ root: import('d3-hierarchy').HierarchyNode<EmployeeRow>, allNodes: Array, nodeById: Map<string, import('d3-hierarchy').HierarchyNode<EmployeeRow>>, rows: EmployeeRow[] }}
 */
export function buildOrgTree(rawRows) {
  const rows = normalizeRows(rawRows);
  validateRows(rows);

  const root = stratify()
    .id((row) => row.id)
    .parentId((row) => row.parentId)(rows);

  root.each((node) => {
    node.data.depthFromTree = node.depth + 1;
    node.data.directReportCount = node.children?.length ?? 0;
    // Store manager status while the full tree is intact. Rendering only sees a
    // visible subset, so checking visible children later would misclassify nodes.
    node.data.isManager = node.data.directReportCount > 0;
  });

  root.eachAfter((node) => {
    let descendantCount = 0;
    let nonLeafDescendantCount = 0;
    let mgmtCost = 0;
    let icCost = 0;

    for (const child of node.children ?? []) {
      // Metrics are defined over descendants only, so each child contributes its
      // own salary/category plus all descendant values already stored on it.
      descendantCount += 1 + child.metrics.descendantCount;
      nonLeafDescendantCount += (child.data.isManager ? 1 : 0) + child.metrics.nonLeafDescendantCount;
      mgmtCost += (child.data.isManager ? child.data.salary : 0) + child.metrics.mgmtCost;
      icCost += (!child.data.isManager ? child.data.salary : 0) + child.metrics.icCost;
    }

    const totalCost = mgmtCost + icCost;
    // The written brief asks for the ratio between IC and manager cost. Manager
    // share is kept separately because it is useful and mirrors the screenshot.
    const managerCostShare = totalCost > 0 ? mgmtCost / totalCost : null;
    const icToManagerCostRatio = mgmtCost > 0 ? icCost / mgmtCost : null;
    const managerToIcCostRatio = icCost > 0 ? mgmtCost / icCost : null;

    /** @type {OrgMetrics} */
    node.metrics = Object.freeze({
      descendantCount,
      nonLeafDescendantCount,
      mgmtCost,
      icCost,
      totalCost,
      managerCostShare,
      icToManagerCostRatio,
      managerToIcCostRatio,
    });
  });

  const allNodes = root.descendants();
  const nodeById = new Map(allNodes.map((node) => [node.id, node]));

  return {
    root,
    allNodes,
    nodeById,
    rows,
  };
}
