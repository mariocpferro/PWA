import {
  getPendingReceipts,
  updateReceiptStatus,
  deleteOfflineReceipt,
} from "@/lib/db/idb";

export async function syncPendingReceipts(): Promise<{
  synced: number;
  failed: number;
}> {
  const pending = await getPendingReceipts();
  if (pending.length === 0) return { synced: 0, failed: 0 };

  await Promise.all(pending.map((r) => updateReceiptStatus(r.localId, "syncing")));

  try {
    const response = await fetch("/api/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receipts: pending }),
    });

    if (!response.ok) {
      await Promise.all(pending.map((r) => updateReceiptStatus(r.localId, "pending")));
      return { synced: 0, failed: pending.length };
    }

    const { results } = await response.json();
    let synced = 0;
    let failed = 0;

    for (const result of results) {
      if (result.serverId) {
        await deleteOfflineReceipt(result.localId);
        synced++;
      } else {
        await updateReceiptStatus(result.localId, "failed");
        failed++;
      }
    }

    return { synced, failed };
  } catch {
    await Promise.all(pending.map((r) => updateReceiptStatus(r.localId, "pending")));
    return { synced: 0, failed: pending.length };
  }
}
