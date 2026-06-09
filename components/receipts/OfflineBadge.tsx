"use client";

import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export function OfflineBadge() {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="bg-amber-500 text-white text-sm text-center py-2 px-4 font-medium">
      Modo offline — dados salvos localmente
    </div>
  );
}
