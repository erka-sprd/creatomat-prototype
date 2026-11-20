// Keeps the designer's canvas and the uploads list across a page refresh, as
// create-omat does with its localStorage autosave (LOCAL_STORAGE_KEYS.scene,
// .uploadedImages). The proto's uploads are blob: URLs that die with the page,
// so the files themselves go into IndexedDB (localStorage is too small for
// images); a saved element points at its file as "idb:<key>". Everything stays
// until the user removes it — a file nothing points at any more is dropped.

const DB_NAME = "creatomat-proto"
const STORE = "kv"
const BLOB_PREFIX = "blob:"
const IDB_REF = "idb:"
const FILE_KEY = (key: string) => `file:${key}`
const REFS_KEY = (name: string) => `refs:${name}`

let dbPromise: Promise<IDBDatabase> | null = null
const openDb = () => {
  dbPromise ??= new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => req.result.createObjectStore(STORE)
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
  return dbPromise
}

const run = async <T>(
  mode: IDBTransactionMode,
  op: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await openDb()
  return new Promise((resolve, reject) => {
    const req = op(db.transaction(STORE, mode).objectStore(STORE))
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}
const get = <T>(key: string) => run<T | undefined>("readonly", s => s.get(key))
const put = (key: string, value: unknown) => run("readwrite", s => s.put(value, key))
const del = (key: string) => run("readwrite", s => s.delete(key))
const allKeys = () => run("readonly", s => s.getAllKeys())

// Live blob: URL ↔ stored file key, both ways, for this page's lifetime.
const keyByUrl = new Map<string, string>()
const urlByKey = new Map<string, string>()
const newKey = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

/** Stores an uploaded file under its blob: URL, so the URL can be saved. */
export const rememberBlob = (url: string, blob: Blob) => {
  const key = newKey()
  keyByUrl.set(url, key)
  urlByKey.set(key, url)
  put(FILE_KEY(key), blob).catch(err => console.error("[canvas-persist] store file", err))
}

/** A src as it can be saved: a blob: URL becomes "idb:<key>"; anything else as is. */
export const toSavedSrc = async (src: string): Promise<string> => {
  if (!src.startsWith(BLOB_PREFIX)) return src
  const known = keyByUrl.get(src)
  if (known) return IDB_REF + known
  try {
    // A blob: URL made elsewhere (not an upload): read it while it's alive.
    const blob = await (await fetch(src)).blob()
    rememberBlob(src, blob)
    return IDB_REF + keyByUrl.get(src)
  } catch (err) {
    console.error("[canvas-persist] read blob", err)
    return src
  }
}

/** A saved src back to a live one; null when its file is gone. */
export const fromSavedSrc = async (src: string): Promise<string | null> => {
  if (!src.startsWith(IDB_REF)) return src
  const key = src.slice(IDB_REF.length)
  const live = urlByKey.get(key)
  if (live) return live
  const blob = await get<Blob>(FILE_KEY(key))
  if (!blob) return null
  const url = URL.createObjectURL(blob)
  keyByUrl.set(url, key)
  urlByKey.set(key, url)
  return url
}

const refsIn = (srcs: string[]) =>
  srcs.filter(s => s.startsWith(IDB_REF)).map(s => s.slice(IDB_REF.length))

/**
 * Drops stored files that no saved snapshot points at any more. Files alive on
 * this page are kept: an upload still running isn't in any snapshot yet.
 */
const pruneFiles = async () => {
  const keys = (await allKeys()).map(String)
  const refLists = await Promise.all(
    keys.filter(k => k.startsWith("refs:")).map(k => get<string[]>(k))
  )
  const used = new Set([...refLists.flatMap(list => list ?? []), ...urlByKey.keys()])
  await Promise.all(
    keys
      .filter(k => k.startsWith("file:") && !used.has(k.slice("file:".length)))
      .map(k => del(k))
  )
}

/** Saves a snapshot under `name`; `srcs` are its saved srcs, which keep their files. */
export const saveSnapshot = async (name: string, data: unknown, srcs: string[]) => {
  try {
    await put(name, data)
    await put(REFS_KEY(name), refsIn(srcs))
    await pruneFiles()
  } catch (err) {
    console.error(`[canvas-persist] save ${name}`, err)
  }
}

export const loadSnapshot = async <T>(name: string): Promise<T | null> => {
  try {
    return (await get<T>(name)) ?? null
  } catch (err) {
    console.error(`[canvas-persist] load ${name}`, err)
    return null
  }
}
