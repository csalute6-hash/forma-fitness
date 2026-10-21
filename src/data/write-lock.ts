/**
 * Run a synchronous root replacement under cross-tab exclusion.
 * Web Locks is preferred. The fallback uses the exclusive scheduling of an
 * IndexedDB readwrite transaction over one shared store. IndexedDB holds no
 * application data; the only durable app write remains one localStorage setItem.
 * Resolve after the synchronous operation: an eventual empty IDB transaction
 * abort cannot roll back (or invalidate) the already atomic localStorage write.
 */
export function withWriteLock(operation: () => void): Promise<void> {
  if (navigator.locks) return navigator.locks.request("forma-write", operation);
  if (typeof indexedDB === "undefined")
    return Promise.reject(
      Error(
        "This browser needs Web Locks or IndexedDB to safely edit local data. Editing is unavailable.",
      ),
    );
  return new Promise((resolve, reject) => {
    let opened: IDBOpenDBRequest;
    let cancelled = false;
    try {
      opened = indexedDB.open("forma-write-coordination", 1);
    } catch {
      reject(
        Error(
          "Local write coordination is unavailable. Enable browser storage or use another browser.",
        ),
      );
      return;
    }
    opened.onupgradeneeded = () => {
      opened.result.createObjectStore("mutex");
    };
    opened.onerror = () =>
      reject(
        Error(
          "Local write coordination is unavailable. Enable browser storage or use another browser.",
        ),
      );
    opened.onblocked = () => {
      cancelled = true;
      reject(
        Error(
          "Local write coordination is blocked. Close other FORMA tabs and reload.",
        ),
      );
    };
    opened.onsuccess = () => {
      const db = opened.result;
      if (cancelled) {
        db.close();
        return;
      }
      try {
        const transaction = db.transaction("mutex", "readwrite");
        const request = transaction.objectStore("mutex").get("root");
        let settled = false;
        transaction.oncomplete = () => db.close();
        transaction.onabort = () => {
          db.close();
          if (!settled)
            reject(
              Error(
                "Local write coordination failed. Your data has not changed.",
              ),
            );
        };
        request.onerror = () => {
          db.close();
          if (!settled)
            reject(
              Error(
                "Local write coordination failed. Your data has not changed.",
              ),
            );
        };
        request.onsuccess = () => {
          try {
            operation();
            settled = true;
            resolve();
          } catch (error) {
            settled = true;
            reject(error);
          }
        };
      } catch (error) {
        db.close();
        reject(error);
      }
    };
  });
}
