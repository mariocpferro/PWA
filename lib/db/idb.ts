import { openDB, DBSchema, IDBPDatabase } from "idb";

export type OfflineReceiptStatus = "pending" | "syncing" | "failed";

export interface OfflineReceipt {
  localId: string;
  amount: number;
  category: "alimentacao" | "hospedagem" | "combustivel" | "outros";
  date: string;
  fileName?: string;
  fileBase64?: string;
  fileMimeType?: string;
  latitude?: number;
  longitude?: number;
  status: OfflineReceiptStatus;
  createdAt: string;
  retryCount: number;
}

interface ReceiptDB extends DBSchema {
  offlineReceipts: {
    key: string;
    value: OfflineReceipt;
    indexes: { "by-status": OfflineReceiptStatus };
  };
}

let dbPromise: Promise<IDBPDatabase<ReceiptDB>> | null = null;

export function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<ReceiptDB>("receipts-offline", 1, {
      upgrade(db) {
        const store = db.createObjectStore("offlineReceipts", { keyPath: "localId" });
        store.createIndex("by-status", "status");
      },
    });
  }
  return dbPromise;
}

export async function addOfflineReceipt(
  receipt: Omit<OfflineReceipt, "status" | "retryCount">
) {
  const db = await getDB();
  await db.put("offlineReceipts", { ...receipt, status: "pending", retryCount: 0 });
}

export async function getPendingReceipts(): Promise<OfflineReceipt[]> {
  const db = await getDB();
  return db.getAllFromIndex("offlineReceipts", "by-status", "pending");
}

export async function updateReceiptStatus(
  localId: string,
  status: OfflineReceiptStatus
) {
  const db = await getDB();
  const existing = await db.get("offlineReceipts", localId);
  if (existing) await db.put("offlineReceipts", { ...existing, status });
}

export async function deleteOfflineReceipt(localId: string) {
  const db = await getDB();
  await db.delete("offlineReceipts", localId);
}

export async function getAllOfflineReceipts(): Promise<OfflineReceipt[]> {
  const db = await getDB();
  return db.getAll("offlineReceipts");
}
