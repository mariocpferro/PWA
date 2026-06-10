"use client";

import { useEffect, useRef, useCallback } from "react";
import { useOnlineStatus } from "./useOnlineStatus";
import { syncPendingReceipts } from "@/lib/sync/syncReceipts";

export function useSync(onSynced?: () => void) {
  const isOnline = useOnlineStatus();
  const prevOnline = useRef(isOnline);
  const syncingRef = useRef(false);

  const runSync = useCallback(async () => {
    if (syncingRef.current || !navigator.onLine) return;
    syncingRef.current = true;
    try {
      const { synced, failed } = await syncPendingReceipts();
      if (synced > 0) {
        console.info(`[Sync] ${synced} comprovante(s) sincronizado(s)`);
        window.dispatchEvent(new CustomEvent("offlineSyncComplete"));
        onSynced?.();
      }
      if (failed > 0) console.warn(`[Sync] ${failed} comprovante(s) falharam`);
    } finally {
      syncingRef.current = false;
    }
  }, [onSynced]);

  // Sync on mount (covers initial load with pending items + online)
  useEffect(() => {
    runSync();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync when connection is restored (offline → online transition)
  useEffect(() => {
    if (!prevOnline.current && isOnline) {
      runSync();
    }
    prevOnline.current = isOnline;
  }, [isOnline, runSync]);

  // Sync when app returns to foreground — critical for Android PWA
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") runSync();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [runSync]);
}
