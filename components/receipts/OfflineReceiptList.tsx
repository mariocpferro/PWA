"use client";

import { useState, useEffect } from "react";
import { getAllOfflineReceipts, type OfflineReceipt } from "@/lib/db/idb";

const categoryLabels: Record<string, { label: string; color: string; emoji: string }> = {
  alimentacao: { label: "Alimentação", color: "bg-orange-100 text-orange-700", emoji: "🍽️" },
  hospedagem: { label: "Hospedagem", color: "bg-blue-100 text-blue-700", emoji: "🏨" },
  combustivel: { label: "Combustível", color: "bg-yellow-100 text-yellow-700", emoji: "⛽" },
  outros: { label: "Outros", color: "bg-purple-100 text-purple-700", emoji: "📦" },
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const statusLabel: Record<string, string> = {
  pending: "⏳ Aguardando sincronização",
  syncing: "🔄 Sincronizando...",
  failed: "❌ Falha ao sincronizar",
};

export function OfflineReceiptList() {
  const [receipts, setReceipts] = useState<OfflineReceipt[]>([]);

  async function load() {
    try {
      const all = await getAllOfflineReceipts();
      setReceipts(all.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    } catch {
      // IndexedDB indisponível (ex: SSR)
    }
  }

  useEffect(() => {
    load();
    window.addEventListener("offlineReceiptSaved", load);
    window.addEventListener("offlineSyncComplete", load);
    return () => {
      window.removeEventListener("offlineReceiptSaved", load);
      window.removeEventListener("offlineSyncComplete", load);
    };
  }, []);

  if (receipts.length === 0) return null;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-semibold text-amber-700 bg-amber-100 px-2.5 py-1 rounded-full">
          Salvos offline — pendentes de envio ({receipts.length})
        </span>
      </div>

      {receipts.map((receipt) => {
        const cat = categoryLabels[receipt.category];
        return (
          <div
            key={receipt.localId}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3"
          >
            <span className="text-2xl">{cat.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.color}`}>
                  {cat.label}
                </span>
                <span className="text-xs text-gray-400">
                  {new Date(receipt.date).toLocaleDateString("pt-BR")}
                </span>
              </div>
              {receipt.fileName && (
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  📎 {receipt.fileName}
                </p>
              )}
              <p className="text-xs text-amber-600 mt-0.5">
                {statusLabel[receipt.status] ?? receipt.status}
              </p>
            </div>
            <span className="font-bold text-gray-800 text-sm flex-shrink-0">
              {formatCurrency(receipt.amount)}
            </span>
          </div>
        );
      })}
    </div>
  );
}
