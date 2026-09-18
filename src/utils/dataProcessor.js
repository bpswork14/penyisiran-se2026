import { NUMERIC_FIELDS, COLUMN_GROUPS, SUMMARY_FIELDS } from '../config';

/**
 * Get all status fields from column groups + summary fields
 */
function getAllNumericFieldKeys() {
  return NUMERIC_FIELDS;
}

/**
 * Create a zero-filled numeric object
 */
function createEmptyNumeric() {
  const obj = {};
  getAllNumericFieldKeys().forEach((key) => {
    obj[key] = 0;
  });
  return obj;
}

/**
 * Aggregate (sum) numeric fields from an array of data rows
 */
function aggregateRows(rows) {
  const result = createEmptyNumeric();
  rows.forEach((row) => {
    getAllNumericFieldKeys().forEach((key) => {
      result[key] += row[key] || 0;
    });
  });
  return result;
}

/**
 * Build a hierarchical tree from flat data
 *
 * Hierarchy: Kab → Kec → Desa → SLS → Sub SLS
 *
 * Returns array of Kab nodes, each with children arrays
 */
export function buildHierarchy(data) {
  if (!data || data.length === 0) return [];

  // Group by Kab
  const kabMap = new Map();

  data.forEach((row) => {
    const kabKey = (row.KODE_KAB || '').toString().trim();
    if (!kabKey) return;

    if (!kabMap.has(kabKey)) {
      kabMap.set(kabKey, {
        id: kabKey,
        level: 0,
        kode: kabKey,
        nama: row.KAB || `Kabupaten ${kabKey}`,
        children: new Map(),
        kabOnlyRows: [],
        rows: [],
      });
    }
    const kabNode = kabMap.get(kabKey);
    kabNode.rows.push(row);

    const hasKec = row.KODE_KEC && row.KODE_KEC.toString().trim() !== '';
    if (!hasKec) {
      // Row stops at Kabupaten level
      kabNode.kabOnlyRows.push(row);
      return;
    }

    // Group by Kec
    const kecKode = row.KODE_KEC.toString().trim();
    const kecKey = `${kabKey}-${kecKode}`;
    if (!kabNode.children.has(kecKey)) {
      kabNode.children.set(kecKey, {
        id: kecKey,
        level: 1,
        kode: kecKode,
        nama: row.KEC || `Kecamatan ${kecKode}`,
        children: new Map(),
        rows: [],
      });
    }
    const kecNode = kabNode.children.get(kecKey);
    kecNode.rows.push(row);

    const hasDesa = row.KODE_DESA && row.KODE_DESA.toString().trim() !== '';
    if (!hasDesa) return;

    // Group by Desa
    const desaKode = row.KODE_DESA.toString().trim();
    const desaKey = `${kecKey}-${desaKode}`;
    if (!kecNode.children.has(desaKey)) {
      kecNode.children.set(desaKey, {
        id: desaKey,
        level: 2,
        kode: desaKode,
        nama: row.DESA || `Desa ${desaKode}`,
        children: new Map(),
        rows: [],
      });
    }
    const desaNode = kecNode.children.get(desaKey);
    desaNode.rows.push(row);

    const hasSls =
      (row.SLS && row.SLS.toString().trim() !== '') ||
      (row.KODE_SUB_SLS && row.KODE_SUB_SLS.toString().trim() !== '');
    if (!hasSls) return;

    // Group by SLS
    const slsNama = row.SLS ? row.SLS.toString().trim() : 'SLS';
    const slsKey = `${desaKey}-${slsNama}`;
    if (!desaNode.children.has(slsKey)) {
      desaNode.children.set(slsKey, {
        id: slsKey,
        level: 3,
        kode: '',
        nama: slsNama,
        children: new Map(),
        rows: [],
      });
    }
    const slsNode = desaNode.children.get(slsKey);
    slsNode.rows.push(row);

    // Sub SLS (leaf)
    const subSlsKey = row.KODE_SUB_SLS
      ? row.KODE_SUB_SLS.toString().trim()
      : `${slsKey}-1`;
    slsNode.children.set(subSlsKey, {
      id: subSlsKey,
      level: 4,
      kode: row.KODE_SUB_SLS || '',
      nama: slsNama,
      children: null,
      rows: [row],
    });
  });

  // Convert Maps to arrays and compute aggregates
  function processNode(node) {
    node.data = aggregateRows(node.rows);

    const hasChildren = node.children instanceof Map && node.children.size > 0;
    const hasKabOnly = node.kabOnlyRows && node.kabOnlyRows.length > 0;

    if (hasChildren) {
      const childList = Array.from(node.children.values()).map(processNode);

      // If this Kabupaten has both kecamatan children AND direct kabupaten-level rows
      if (hasKabOnly) {
        childList.unshift({
          id: `${node.id}-khusus-kab`,
          level: 1,
          kode: node.kode,
          nama: `[Data Level ${node.nama}]`,
          childrenArray: null,
          childCount: 0,
          data: aggregateRows(node.kabOnlyRows),
        });
      }

      node.childrenArray = childList;
      node.childCount = node.rows.filter(
        (r) => r.KODE_SUB_SLS && r.KODE_SUB_SLS.toString().trim()
      ).length;
    } else {
      // Leaf node (e.g. Kabupaten only, or Sub SLS)
      node.childrenArray = null;
      node.childCount = 0;
      if (node.rows && node.rows.length === 1) {
        node.data = { ...node.rows[0] };
      }
    }

    delete node.children;
    delete node.kabOnlyRows;
    delete node.rows;
    return node;
  }

  const tree = Array.from(kabMap.values())
    .map(processNode)
    .sort((a, b) => a.kode.localeCompare(b.kode));

  return tree;
}

/**
 * Get totals for entire dataset
 */
export function getTotals(data) {
  if (!data || data.length === 0) return createEmptyNumeric();
  return aggregateRows(data);
}

/**
 * Count entities at each level
 */
export function countEntities(data) {
  if (!data || data.length === 0) {
    return { kab: 0, kec: 0, desa: 0, sls: 0, subSls: 0 };
  }

  const kabSet = new Set();
  const kecSet = new Set();
  const desaSet = new Set();
  const slsSet = new Set();
  let subSlsCount = 0;

  data.forEach((row) => {
    const kab = (row.KODE_KAB || '').toString().trim();
    const kec = (row.KODE_KEC || '').toString().trim();
    const desa = (row.KODE_DESA || '').toString().trim();
    const sls = (row.SLS || '').toString().trim();
    const subSls = (row.KODE_SUB_SLS || '').toString().trim();

    if (kab) kabSet.add(kab);
    if (kab && kec) kecSet.add(`${kab}-${kec}`);
    if (kab && kec && desa) desaSet.add(`${kab}-${kec}-${desa}`);
    if (kab && kec && desa && sls) slsSet.add(`${kab}-${kec}-${desa}-${sls}`);
    if (subSls) subSlsCount++;
  });

  return {
    kab: kabSet.size,
    kec: kecSet.size,
    desa: desaSet.size,
    sls: slsSet.size,
    subSls: subSlsCount,
  };
}
