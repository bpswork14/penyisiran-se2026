import { CONFIG, COLUMN_MAPPING } from '../config';
import { getCachedData, setCachedData } from './cache';

/**
 * Convert 2D array row to row object efficiently
 */
function convert2DToObjects(headers, rows) {
  if (!rows || rows.length === 0) return [];
  
  // If rows are already objects, return as is
  if (!Array.isArray(rows[0])) {
    return rows;
  }

  const headerKeys = headers && headers.length > 0 ? headers : Object.keys(COLUMN_MAPPING);
  const rowCount = rows.length;
  const colCount = headerKeys.length;
  const result = new Array(rowCount);

  for (let i = 0; i < rowCount; i++) {
    const rawRow = rows[i];
    const obj = {};
    for (let j = 0; j < colCount; j++) {
      const key = headerKeys[j];
      let val = rawRow[j];
      if (j >= 11 && typeof val === 'string') {
        val = val === '' ? 0 : Number(val);
      }
      obj[key] = val;
    }
    result[i] = obj;
  }

  return result;
}

/**
 * Parse Target Wilayah (KODE_SUB_SLS, Keluarga, UB, UM, UMK, Target_Prelist)
 */
function parseTargetWilayah(headers, rows) {
  if (!rows || rows.length === 0) return new Map();

  const cleanHeader = (h) => (h != null ? String(h).toLowerCase().replace(/[\s_]/g, '') : '');
  const headerKeys = (headers && headers.length > 0 ? headers : []).map(cleanHeader);

  const kodeSubSlsIdx = headerKeys.findIndex((h) => h === 'kodesubsls' || h === 'subsls');
  const targetPrelistIdx = headerKeys.findIndex((h) => h === 'targetprelist' || h === 'prelist');
  const keluargaIdx = headerKeys.findIndex((h) => h === 'keluarga');
  const ubIdx = headerKeys.findIndex((h) => h === 'ub');
  const umIdx = headerKeys.findIndex((h) => h === 'um');
  const umkIdx = headerKeys.findIndex((h) => h === 'umk');

  const map = new Map();

  for (let i = 0; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;

    let kode = '';
    let targetPrelist = 0;
    let keluarga = 0;
    let ub = 0;
    let um = 0;
    let umk = 0;

    if (Array.isArray(r)) {
      if (kodeSubSlsIdx !== -1 && r[kodeSubSlsIdx] != null) {
        kode = String(r[kodeSubSlsIdx]).trim();
      }
      if (targetPrelistIdx !== -1 && r[targetPrelistIdx] != null) {
        targetPrelist = Number(r[targetPrelistIdx]) || 0;
      }
      if (keluargaIdx !== -1 && r[keluargaIdx] != null) {
        keluarga = Number(r[keluargaIdx]) || 0;
      }
      if (ubIdx !== -1 && r[ubIdx] != null) {
        ub = Number(r[ubIdx]) || 0;
      }
      if (umIdx !== -1 && r[umIdx] != null) {
        um = Number(r[umIdx]) || 0;
      }
      if (umkIdx !== -1 && r[umkIdx] != null) {
        umk = Number(r[umkIdx]) || 0;
      }
    } else if (typeof r === 'object') {
      kode = (r.KODE_SUB_SLS || r.kode_sub_sls || '').toString().trim();
      targetPrelist = Number(r.Target_Prelist || r.TARGET_PRELIST || r.Prelist || r.prelist || 0);
      keluarga = Number(r.Keluarga || r.KELUARGA || 0);
      ub = Number(r.UB || 0);
      um = Number(r.UM || 0);
      umk = Number(r.UMK || 0);
    }

    if (kode) {
      map.set(kode, {
        TARGET_PRELIST: targetPrelist,
        TARGET_KELUARGA: keluarga,
        TARGET_UB: ub,
        TARGET_UM: um,
        TARGET_UMK: umk,
      });
    }
  }

  return map;
}

/**
 * Merge Target Wilayah into rows by KODE_SUB_SLS
 */
function mergeTargetData(rows, targetMap) {
  if (!rows || rows.length === 0) return;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const subSlsKey = (row.KODE_SUB_SLS != null ? String(row.KODE_SUB_SLS) : '').trim();
    const target = targetMap ? targetMap.get(subSlsKey) : null;
    if (target) {
      row.TARGET_PRELIST = target.TARGET_PRELIST;
      row.TARGET_KELUARGA = target.TARGET_KELUARGA;
      row.TARGET_UB = target.TARGET_UB;
      row.TARGET_UM = target.TARGET_UM;
      row.TARGET_UMK = target.TARGET_UMK;
    } else {
      row.TARGET_PRELIST = Number(row.TARGET_PRELIST || row.Target_Prelist || row.Prelist || 0);
      row.TARGET_KELUARGA = Number(row.TARGET_KELUARGA || row.Keluarga || 0);
      row.TARGET_UB = Number(row.TARGET_UB || row.UB || 0);
      row.TARGET_UM = Number(row.TARGET_UM || row.UM || 0);
      row.TARGET_UMK = Number(row.TARGET_UMK || row.UMK || 0);
    }
  }
}

/**
 * Fetch data from Google Apps Script Web App with smart caching
 * @param {boolean} forceRefresh - If true, bypass cache and fetch directly from server
 */
export async function fetchAllData(forceRefresh = false) {
  const { WEBAPP_URL } = CONFIG;

  // 1. Try cache if not forcing refresh
  if (!forceRefresh) {
    const cached = await getCachedData();
    if (cached && cached.hariIni && cached.hariIni.length > 0) {
      return {
        ...cached,
        fromCache: true,
      };
    }
  }

  if (!WEBAPP_URL) {
    throw new Error('Web App URL belum dikonfigurasi. Set VITE_WEBAPP_URL di .env');
  }

  const url = `${WEBAPP_URL}?sheet=both`;

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Gagal fetch data: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Error dari server: ${data.error || 'Unknown error'}`);
  }

  const headers = data.headers || null;
  const hariIni = convert2DToObjects(headers, data.hariIni || []);
  const kemarin = convert2DToObjects(headers, data.kemarin || []);

  // Parse and merge Target Wilayah
  const targetMap = parseTargetWilayah(data.targetHeaders || [], data.targetWilayah || []);
  mergeTargetData(hariIni, targetMap);
  mergeTargetData(kemarin, targetMap);

  const result = {
    hariIni,
    kemarin,
    targetHeaders: data.targetHeaders || [],
    targetWilayah: data.targetWilayah || [],
    timestamp: data.timestamp || new Date().toISOString(),
    fromCache: false,
  };

  // Save to IndexedDB cache
  setCachedData(result).catch((e) => console.warn('Cache write failed', e));

  return result;
}
