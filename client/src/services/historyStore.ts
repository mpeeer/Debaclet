import { HistoryEntry } from '../types';

const DB_NAME = 'debalect';
const DB_VERSION = 1;
const STORE_NAME = 'history';
const LEGACY_KEY = 'debalect_history';
let operationQueue: Promise<void> = Promise.resolve();

function isHistoryEntry(value: unknown): value is HistoryEntry {
  if (!value || typeof value !== 'object') return false;
  const entry = value as Partial<HistoryEntry>;
  const result = entry.result as Partial<HistoryEntry['result']> | undefined;
  return Boolean(
    typeof entry.id === 'string' &&
    typeof entry.timestamp === 'number' && Number.isFinite(entry.timestamp) &&
    typeof entry.fileName === 'string' &&
    result && typeof result.originalLength === 'number' && Number.isFinite(result.originalLength) &&
    typeof result.debater === 'string' && typeof result.professor === 'string'
  );
}

function readLegacyHistory(): HistoryEntry[] {
  try {
    const saved = localStorage.getItem(LEGACY_KEY);
    if (!saved) return [];
    const parsed: unknown = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.filter(isHistoryEntry).slice(0, 20) : [];
  } catch {
    return [];
  }
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is unavailable'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error || new Error('Could not open history storage'));
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('by_timestamp', 'timestamp', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
  });
}

function readAll(db: IDBDatabase): Promise<HistoryEntry[]> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const request = tx.objectStore(STORE_NAME).getAll();
    request.onerror = () => reject(request.error || new Error('Could not read history'));
    request.onsuccess = () => {
      const entries = (request.result as unknown[]).filter(isHistoryEntry);
      resolve(entries.sort((a, b) => b.timestamp - a.timestamp).slice(0, 20));
    };
  });
}

function replaceAll(db: IDBDatabase, entries: HistoryEntry[]): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.clear();
    entries.slice(0, 20).forEach((entry) => store.put(entry));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error || new Error('Could not save history'));
    tx.onabort = () => reject(tx.error || new Error('History transaction aborted'));
  });
}

function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const run = operationQueue.then(operation, operation);
  operationQueue = run.then(() => undefined, () => undefined);
  return run;
}

export function loadHistory(): Promise<HistoryEntry[]> {
  return enqueue(async () => {
    try {
      const db = await openDatabase();
      const stored = await readAll(db);
      if (stored.length > 0) return stored;

      const legacy = readLegacyHistory();
      if (legacy.length > 0) {
        await replaceAll(db, legacy);
        localStorage.removeItem(LEGACY_KEY);
      }
      return legacy;
    } catch {
      return readLegacyHistory();
    }
  });
}

export function saveHistory(entries: HistoryEntry[]): Promise<void> {
  const normalized = entries.slice(0, 20);
  return enqueue(async () => {
    try {
      const db = await openDatabase();
      await replaceAll(db, normalized);
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      try {
        localStorage.setItem(LEGACY_KEY, JSON.stringify(normalized));
      } catch {
        // Keep the current session usable when browser storage is unavailable/full.
      }
    }
  });
}

export function clearHistory(): Promise<void> {
  return enqueue(async () => {
    try {
      const db = await openDatabase();
      await replaceAll(db, []);
    } catch {
      // Fall through to legacy cleanup.
    }
    try {
      localStorage.removeItem(LEGACY_KEY);
    } catch {
      // Ignore unavailable localStorage.
    }
  });
}
