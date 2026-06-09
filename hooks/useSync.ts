"use client";

import { useEffect, useRef } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { syncPendingReceipts } from "@/lib/sync/syncReceipts";

export function useSync() {
  const isOnline = useOnlineStatus();
  const prevOnline = useRef(isOnline);

  useEffect(() => {
    if (!prevOnline.current && isOnline) {
      syncPendingReceipts().then(({ synced, failed }) => {
        if (synced > 0) console.info(`[Sync] ${synced} comprovante(s) sincronizado(s)`);
        if (failed > 0) console.warn(`[Sync] ${failed} comprovante(s) falharam`);
      });
    }
    prevOnline.current = isOnline;
  }, [isOnline]);
}
