"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => console.log("[SW] Registrado:", reg.scope))
        .catch((err) => console.error("[SW] Falha no registro:", err));
    }
  }, []);

  return null;
}
