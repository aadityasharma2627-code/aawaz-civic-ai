// Thin promise wrapper around IndexedDB.
// Store: 'pendingComplaints' keyed by localId.

const DB_NAME = 'awaaz-offline'
const DB_VERSION = 1
const STORE = 'pendingComplaints'

function openDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      reject(new Error('IndexedDB is not available in this browser'))
      return
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION)
    req.onupgradeneeded = () => {
      const db = req.result
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'localId' })
        store.createIndex('createdAt', 'createdAt')
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

function run(mode, operation) {
  return openDB().then(
    (db) =>
      new Promise((resolve, reject) => {
        const tx = db.transaction(STORE, mode)
        const store = tx.objectStore(STORE)
        const result = operation(store)
        tx.oncomplete = () => resolve(result?.result !== undefined ? result.result : result)
        tx.onerror = () => reject(tx.error)
      })
  )
}

export const db = {
  put: (value) => run('readwrite', (store) => store.put(value)),
  get: (key) => run('readonly', (store) => store.get(key)),
  delete: (key) => run('readwrite', (store) => store.delete(key)),
  all: () =>
    run('readonly', (store) => store.getAll()).then((rows = []) =>
      rows.sort((a, b) => a.createdAt - b.createdAt)
    ),
}
