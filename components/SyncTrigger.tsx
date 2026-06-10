"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSync } from "@/hooks/useSync";

export function SyncTrigger() {
  const router = useRouter();
  const onSynced = useCallback(() => router.refresh(), [router]);
  useSync(onSynced);
  return null;
}
