/**
 * Minimal typed wrapper over the native IndexedDB API.
 *
 * Kept dependency-free (no external idb library) so the offline layer has a
 * small, auditable footprint. Provides just enough surface for a keyed
 * object-store cache plus one index lookup — everything `journalRepo` needs.
 */

export interface IndexedDbStoreConfig {
  name: string;
  keyPath: string;
  indexes?: Array<{ name: string; keyPath: string; unique?: boolean }>;
}

/** True in any environment with a usable IndexedDB implementation (browsers, not SSR/tests). */
export function isIndexedDbSupported(): boolean {
  return typeof indexedDB !== 'undefined';
}

function openRequest(
  name: string,
  version: number,
  stores: IndexedDbStoreConfig[]
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(name, version);

    req.onupgradeneeded = () => {
      const db = req.result;
      for (const store of stores) {
        if (!db.objectStoreNames.contains(store.name)) {
          const os = db.createObjectStore(store.name, { keyPath: store.keyPath });
          for (const idx of store.indexes ?? []) {
            os.createIndex(idx.name, idx.keyPath, { unique: Boolean(idx.unique) });
          }
        }
      }
    };

    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
    req.onblocked = () => reject(new Error('IndexedDB open blocked by another tab'));
  });
}

/** Opens (or reuses within a session) a typed IndexedDB database handle. */
export class TypedIndexedDb {
  private dbPromise: Promise<IDBDatabase> | null = null;

  constructor(
    private readonly name: string,
    private readonly version: number,
    private readonly stores: IndexedDbStoreConfig[]
  ) {}

  private async db(): Promise<IDBDatabase> {
    if (!isIndexedDbSupported()) {
      throw new Error('IndexedDB is not supported in this environment');
    }
    if (!this.dbPromise) {
      this.dbPromise = openRequest(this.name, this.version, this.stores);
    }
    return this.dbPromise;
  }

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result as T | undefined);
      req.onerror = () => reject(req.error);
    });
  }

  async getAll<T>(storeName: string, indexName?: string, query?: IDBValidKey): Promise<T[]> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const source = indexName ? store.index(indexName) : store;
      const req = query !== undefined ? source.getAll(query) : source.getAll();
      req.onsuccess = () => resolve((req.result as T[]) ?? []);
      req.onerror = () => reject(req.error);
    });
  }

  async put<T>(storeName: string, value: T): Promise<void> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async putMany<T>(storeName: string, values: T[]): Promise<void> {
    if (values.length === 0) return;
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      for (const value of values) store.put(value);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    const db = await this.db();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      tx.objectStore(storeName).clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}
