import { NUMERIC_FIELDS, STATUS_EXCEPT_OPEN_DRAFT } from '../config';

/**
 * Get a unique key for a row, falling back to higher administrative levels
 * if KODE_SUB_SLS is not populated (e.g. dataset only has kabupaten level data)
 */
export function getRowKey(row) {
  if (!row) return '';
  const subSls = (row.KODE_SUB_SLS != null ? String(row.KODE_SUB_SLS) : '').trim();
  if (subSls) return subSls;

  const kab = (row.KODE_KAB != null ? String(row.KODE_KAB) : '').trim();
  const kec = (row.KODE_KEC != null ? String(row.KODE_KEC) : '').trim();
  const desa = (row.KODE_DESA != null ? String(row.KODE_DESA) : '').trim();
  const sls = (row.SLS != null ? String(row.SLS) : '').trim();

  if (kab && kec && desa && sls) return `${kab}-${kec}-${desa}-${sls}-1`;
  if (kab && kec && desa) return `${kab}-${kec}-${desa}`;
  if (kab && kec) return `${kab}-${kec}`;
  if (kab) return kab;
  return '';
}

/**
 * Build a delta map comparing today vs yesterday data
 * Key: row key (KODE_SUB_SLS or fallback), Value: { field: { value, delta, pct } }
 */
export function buildDeltaMap(hariIniData, kemarinData) {
  const deltaMap = new Map();

  // Index kemarin data by row key
  const kemarinMap = new Map();
  if (kemarinData && kemarinData.length > 0) {
    for (let i = 0; i < kemarinData.length; i++) {
      const row = kemarinData[i];
      const key = getRowKey(row);
      if (key) {
        kemarinMap.set(key, row);
      }
    }
  }

  // Compute delta for each hari ini row
  if (hariIniData && hariIniData.length > 0) {
    for (let i = 0; i < hariIniData.length; i++) {
      const row = hariIniData[i];
      const key = getRowKey(row);
      if (!key) continue;

      const kemarinRow = kemarinMap.get(key);
      const deltas = {};

      for (let j = 0; j < NUMERIC_FIELDS.length; j++) {
        const field = NUMERIC_FIELDS[j];
        const todayVal = row[field] || 0;
        const yesterdayVal = kemarinRow ? kemarinRow[field] || 0 : 0;
        const delta = todayVal - yesterdayVal;
        const pct = yesterdayVal !== 0 ? (delta / yesterdayVal) * 100 : delta !== 0 ? 100 : 0;

        deltas[field] = {
          value: todayVal,
          delta,
          pct: Math.round(pct * 100) / 100,
        };
      }

      // Progres Harian: sum of all statuses except OPEN and DRAFT (today vs yesterday)
      let sumStatusToday = 0;
      let sumStatusYesterday = 0;
      for (let s = 0; s < STATUS_EXCEPT_OPEN_DRAFT.length; s++) {
        const sf = STATUS_EXCEPT_OPEN_DRAFT[s];
        sumStatusToday += row[sf] || 0;
        sumStatusYesterday += kemarinRow ? kemarinRow[sf] || 0 : 0;
      }
      const progresHarian = sumStatusToday - sumStatusYesterday;
      const progresHarianPct = sumStatusYesterday !== 0
        ? (progresHarian / sumStatusYesterday) * 100
        : progresHarian !== 0 ? 100 : 0;
      const totalAssignment = row.TOTAL_ASSIGNMENT || 0;
      const progresHarianPctAssignment = totalAssignment !== 0
        ? (progresHarian / totalAssignment) * 100
        : 0;

      deltas['PROGRES_HARIAN'] = {
        value: progresHarian,
        delta: progresHarian,
        pct: Math.round(progresHarianPct * 100) / 100,
        pctAssignment: Math.round(progresHarianPctAssignment * 100) / 100,
        sumToday: sumStatusToday,
        sumYesterday: sumStatusYesterday,
      };

      deltaMap.set(key, deltas);
    }
  }

  return deltaMap;
}

/**
 * Precompute and attach deltas to every node in the hierarchy bottom-up (O(N))
 * This eliminates recursive tree scans during row render
 */
export function attachDeltasToTree(tree, deltaMap) {
  if (!tree || !deltaMap || deltaMap.size === 0) return tree;

  function processNode(node) {
    if (!node.childrenArray || node.childrenArray.length === 0) {
      node.deltas = deltaMap.get(node.id) || deltaMap.get(node.kode) || null;
      return node.deltas;
    }

    const childDeltas = node.childrenArray.map(processNode);
    const aggregated = {};

    for (let f = 0; f < NUMERIC_FIELDS.length; f++) {
      const field = NUMERIC_FIELDS[f];
      let totalValue = 0;
      let totalDelta = 0;

      for (let i = 0; i < childDeltas.length; i++) {
        const cd = childDeltas[i];
        if (cd && cd[field]) {
          totalValue += cd[field].value;
          totalDelta += cd[field].delta;
        }
      }

      const yesterdayVal = totalValue - totalDelta;
      const pct = yesterdayVal !== 0 ? (totalDelta / yesterdayVal) * 100 : totalDelta !== 0 ? 100 : 0;

      aggregated[field] = {
        value: totalValue,
        delta: totalDelta,
        pct: Math.round(pct * 100) / 100,
      };
    }

    // Aggregate PROGRES_HARIAN bottom-up
    let totalProgresHarian = 0;
    let totalSumStatusToday = 0;
    let totalSumStatusYesterday = 0;
    let totalAssignmentVal = 0;

    for (let i = 0; i < childDeltas.length; i++) {
      const cd = childDeltas[i];
      if (cd && cd.PROGRES_HARIAN) {
        totalProgresHarian += cd.PROGRES_HARIAN.value;
        totalSumStatusToday += cd.PROGRES_HARIAN.sumToday || 0;
        totalSumStatusYesterday += cd.PROGRES_HARIAN.sumYesterday || 0;
      }
      if (cd && cd.TOTAL_ASSIGNMENT) {
        totalAssignmentVal += cd.TOTAL_ASSIGNMENT.value || 0;
      }
    }

    const aggProgresPct = totalSumStatusYesterday !== 0
      ? (totalProgresHarian / totalSumStatusYesterday) * 100
      : totalProgresHarian !== 0 ? 100 : 0;

    const aggProgresPctAssignment = totalAssignmentVal !== 0
      ? (totalProgresHarian / totalAssignmentVal) * 100
      : 0;

    aggregated['PROGRES_HARIAN'] = {
      value: totalProgresHarian,
      delta: totalProgresHarian,
      pct: Math.round(aggProgresPct * 100) / 100,
      pctAssignment: Math.round(aggProgresPctAssignment * 100) / 100,
      sumToday: totalSumStatusToday,
      sumYesterday: totalSumStatusYesterday,
    };

    node.deltas = aggregated;
    return aggregated;
  }

  for (let i = 0; i < tree.length; i++) {
    processNode(tree[i]);
  }

  return tree;
}

/**
 * Fallback: Aggregate deltas for a group of sub SLS codes
 */
export function aggregateDeltas(deltaMap, subSlsCodes) {
  const result = {};

  for (let f = 0; f < NUMERIC_FIELDS.length; f++) {
    const field = NUMERIC_FIELDS[f];
    let totalValue = 0;
    let totalDelta = 0;

    for (let i = 0; i < subSlsCodes.length; i++) {
      const code = subSlsCodes[i];
      const d = deltaMap.get(code);
      if (d && d[field]) {
        totalValue += d[field].value;
        totalDelta += d[field].delta;
      }
    }

    const yesterdayVal = totalValue - totalDelta;
    const pct = yesterdayVal !== 0 ? (totalDelta / yesterdayVal) * 100 : totalDelta !== 0 ? 100 : 0;

    result[field] = {
      value: totalValue,
      delta: totalDelta,
      pct: Math.round(pct * 100) / 100,
    };
  }

  // Aggregate PROGRES_HARIAN
  let totalProgresHarian = 0;
  let totalSumStatusToday = 0;
  let totalSumStatusYesterday = 0;
  let totalAssignmentVal = 0;

  for (let i = 0; i < subSlsCodes.length; i++) {
    const code = subSlsCodes[i];
    const d = deltaMap.get(code);
    if (d && d.PROGRES_HARIAN) {
      totalProgresHarian += d.PROGRES_HARIAN.value;
      totalSumStatusToday += d.PROGRES_HARIAN.sumToday || 0;
      totalSumStatusYesterday += d.PROGRES_HARIAN.sumYesterday || 0;
    }
    if (d && d.TOTAL_ASSIGNMENT) {
      totalAssignmentVal += d.TOTAL_ASSIGNMENT.value || 0;
    }
  }

  const aggProgresPct = totalSumStatusYesterday !== 0
    ? (totalProgresHarian / totalSumStatusYesterday) * 100
    : totalProgresHarian !== 0 ? 100 : 0;

  const aggProgresPctAssignment = totalAssignmentVal !== 0
    ? (totalProgresHarian / totalAssignmentVal) * 100
    : 0;

  result['PROGRES_HARIAN'] = {
    value: totalProgresHarian,
    delta: totalProgresHarian,
    pct: Math.round(aggProgresPct * 100) / 100,
    pctAssignment: Math.round(aggProgresPctAssignment * 100) / 100,
    sumToday: totalSumStatusToday,
    sumYesterday: totalSumStatusYesterday,
  };

  return result;
}

/**
 * Get all KODE_SUB_SLS from a hierarchy node (recursive fallback)
 */
export function getSubSlsCodes(node) {
  if (!node.childrenArray || node.childrenArray.length === 0) {
    return [node.id];
  }
  const codes = [];
  for (let i = 0; i < node.childrenArray.length; i++) {
    codes.push(...getSubSlsCodes(node.childrenArray[i]));
  }
  return codes;
}

/**
 * Calculate total deltas across entire dataset
 */
export function getTotalDeltas(deltaMap) {
  const result = {};

  for (let f = 0; f < NUMERIC_FIELDS.length; f++) {
    const field = NUMERIC_FIELDS[f];
    let totalValue = 0;
    let totalDelta = 0;

    deltaMap.forEach((deltas) => {
      if (deltas[field]) {
        totalValue += deltas[field].value;
        totalDelta += deltas[field].delta;
      }
    });

    const yesterdayVal = totalValue - totalDelta;
    const pct = yesterdayVal !== 0 ? (totalDelta / yesterdayVal) * 100 : totalDelta !== 0 ? 100 : 0;

    result[field] = {
      value: totalValue,
      delta: totalDelta,
      pct: Math.round(pct * 100) / 100,
    };
  }

  // Calculate grand total for PROGRES_HARIAN
  let totalProgresHarian = 0;
  let totalSumStatusToday = 0;
  let totalSumStatusYesterday = 0;
  let grandTotalAssignment = 0;

  deltaMap.forEach((deltas) => {
    if (deltas.PROGRES_HARIAN) {
      totalProgresHarian += deltas.PROGRES_HARIAN.value;
      totalSumStatusToday += deltas.PROGRES_HARIAN.sumToday || 0;
      totalSumStatusYesterday += deltas.PROGRES_HARIAN.sumYesterday || 0;
    }
    if (deltas.TOTAL_ASSIGNMENT) {
      grandTotalAssignment += deltas.TOTAL_ASSIGNMENT.value || 0;
    }
  });

  const grandProgresPct = totalSumStatusYesterday !== 0
    ? (totalProgresHarian / totalSumStatusYesterday) * 100
    : totalProgresHarian !== 0 ? 100 : 0;

  const grandProgresPctAssignment = grandTotalAssignment !== 0
    ? (totalProgresHarian / grandTotalAssignment) * 100
    : 0;

  result['PROGRES_HARIAN'] = {
    value: totalProgresHarian,
    delta: totalProgresHarian,
    pct: Math.round(grandProgresPct * 100) / 100,
    pctAssignment: Math.round(grandProgresPctAssignment * 100) / 100,
    sumToday: totalSumStatusToday,
    sumYesterday: totalSumStatusYesterday,
  };

  return result;
}
