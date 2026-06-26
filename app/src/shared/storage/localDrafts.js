const dbName = 'notit'
const dbVersion = 1
const storeName = 'drafts'

export async function loadDrafts() {
  const db = await openDb()
  return request(db.transaction(storeName, 'readonly').objectStore(storeName).getAll())
}

export async function saveDraft(note) {
  if (!note?.path) return
  const db = await openDb()
  await request(
    db.transaction(storeName, 'readwrite').objectStore(storeName).put({
      ...note,
      dirty: true,
      savedAt: new Date().toISOString(),
    }),
  )
}

export async function clearDraft(path) {
  if (!path) return
  const db = await openDb()
  await request(db.transaction(storeName, 'readwrite').objectStore(storeName).delete(path))
}

export async function clearAllDrafts() {
  const db = await openDb()
  await request(db.transaction(storeName, 'readwrite').objectStore(storeName).clear())
}

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, dbVersion)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(storeName)) db.createObjectStore(storeName, { keyPath: 'path' })
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
  })
}

function request(operation) {
  return new Promise((resolve, reject) => {
    operation.onsuccess = () => resolve(operation.result)
    operation.onerror = () => reject(operation.error)
  })
}
