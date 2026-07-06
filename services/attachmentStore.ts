// IndexedDB Attachment Store for large files up to 300 MB
const DB_NAME = 'qlipto_attachments_db';
const STORE_NAME = 'attachments';
const DB_VERSION = 1;

let dbInstance: IDBDatabase | null = null;

const getDB = (): Promise<IDBDatabase> => {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = (event.target as IDBOpenDBRequest).result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      reject(new Error('Failed to open IndexedDB for attachments'));
    };
  });
};

export interface AttachmentFile {
  id: string; // matches clipId or a unique attachment ID
  name: string;
  size: number;
  type: string;
  data: Blob;
  timestamp: number;
}

export const saveAttachment = async (attachment: AttachmentFile): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(attachment);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to save attachment to IndexedDB'));
  });
};

export const getAttachment = async (id: string): Promise<AttachmentFile | null> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(id);

    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject(new Error('Failed to retrieve attachment from IndexedDB'));
  });
};

export const deleteAttachment = async (id: string): Promise<void> => {
  const db = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(new Error('Failed to delete attachment from IndexedDB'));
  });
};
