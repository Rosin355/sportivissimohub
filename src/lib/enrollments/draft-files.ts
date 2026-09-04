// File selezionati nello step Documenti del wizard, salvati in IndexedDB per
// sede: sopravvivono al reload e al giro login/registrazione (la bozza in
// localStorage contiene solo i metadati, non i File). Chiave: `${slug}:${type}`.

const DB_NAME = "sportivissimo-draft-files";
const STORE = "files";

function isBrowser() {
  return typeof window !== "undefined" && typeof indexedDB !== "undefined";
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | undefined> {
  if (!isBrowser()) return Promise.resolve(undefined);
  return openDb()
    .then(
      (db) =>
        new Promise<T | undefined>((resolve, reject) => {
          const t = db.transaction(STORE, mode);
          const req = run(t.objectStore(STORE));
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
          t.oncomplete = () => db.close();
        }),
    )
    .catch(() => undefined); // IndexedDB non disponibile (privato/quota): si degrada
}

const key = (slug: string, type: string) => `${slug}:${type}`;

export async function saveDraftFile(slug: string, type: string, file: File): Promise<void> {
  await tx("readwrite", (s) => s.put(file, key(slug, type)));
}

export async function deleteDraftFile(slug: string, type: string): Promise<void> {
  await tx("readwrite", (s) => s.delete(key(slug, type)));
}

// Tutti i file della sede, per tipo.
export async function loadDraftFiles(slug: string): Promise<Map<string, File>> {
  const prefix = `${slug}:`;
  const keys = (await tx("readonly", (s) => s.getAllKeys())) ?? [];
  const out = new Map<string, File>();
  for (const k of keys) {
    if (typeof k !== "string" || !k.startsWith(prefix)) continue;
    const file = await tx("readonly", (s) => s.get(k) as IDBRequest<File | undefined>);
    if (file instanceof File) out.set(k.slice(prefix.length), file);
  }
  return out;
}

export async function clearDraftFiles(slug: string): Promise<void> {
  const prefix = `${slug}:`;
  const keys = (await tx("readonly", (s) => s.getAllKeys())) ?? [];
  for (const k of keys) {
    if (typeof k === "string" && k.startsWith(prefix)) await tx("readwrite", (s) => s.delete(k));
  }
}
