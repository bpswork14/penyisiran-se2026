/**
 * Lightweight IndexedDB Cache for SE2026 Monitoring Data
 * Allows caching large datasets (~5-20MB) beyond localStorage 5MB quota.
 */

const DB_NAME = 'se2026_monitoring_db';
const DB_VERSION = 1;
const STORE_NAME = 'monitoring_cache';
const CACHE_KEY = 'latest_data';

function openDB() {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      resolve(null);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (e) => {
      resolve(e.target.result);
    };

    request.onerror = (e) => {
      console.warn('IndexedDB open error:', e);
      resolve(null);
    };
  });
}

/**
 * Get cached monitoring data
 */
export async function getCachedData() {
  try {
    const db = await openDB();
    if (!db) return null;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const request = store.get(CACHE_KEY);

      request.onsuccess = () => {
        resolve(request.result || null);
      };

      request.onerror = () => {
        resolve(null);
      };
    });
  } catch (err) {
    console.warn('Failed to read from cache:', err);
    return null;
  }
}

/**
 * Save monitoring data to cache
 */
export async function setCachedData(data) {
  try {
    const db = await openDB();
    if (!db) return;

    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(data, CACHE_KEY);

      tx.oncomplete = () => resolve(true);
      tx.onerror = () => resolve(false);
    });
  } catch (err) {
    console.warn('Failed to save to cache:', err);
  }
}

/**
 * Clear cached data
 */
export async function clearCache() {
  try {
    const db = await openDB();
    if (!db) return;

    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(CACHE_KEY);
  } catch (err) {
    console.warn('Failed to clear cache:', err);
  }
}
