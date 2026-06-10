"use client";

import { useState } from "react";
import type { Receipt } from "@prisma/client";

const categoryLabels: Record<string, { label: string; color: string; emoji: string }> = {
  alimentacao: { label: "Alimentação", color: "bg-orange-100 text-orange-700", emoji: "🍽️" },
  hospedagem: { label: "Hospedagem", color: "bg-blue-100 text-blue-700", emoji: "🏨" },
  combustivel: { label: "Combustível", color: "bg-yellow-100 text-yellow-700", emoji: "⛽" },
  outros: { label: "Outros", color: "bg-purple-100 text-purple-700", emoji: "📦" },
};

function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString("pt-BR");
}

function isImage(filePath: string) {
  return /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(filePath);
}

function isPDF(filePath: string) {
  return /\.pdf$/i.test(filePath);
}

function FileModal({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  const { filePath, fileName } = receipt;
  if (!filePath) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
          <p className="text-sm font-medium text-gray-700 truncate">{fileName ?? "Arquivo"}</p>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0 text-lg leading-none"
            aria-label="Fechar"
          >
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-auto flex items-center justify-center bg-gray-50 p-4 min-h-48">
          {isImage(filePath) ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={filePath}
              alt={fileName ?? "Comprovante"}
              className="max-w-full max-h-[70vh] object-contain rounded"
            />
          ) : isPDF(filePath) ? (
            <iframe
              src={filePath}
              title={fileName ?? "PDF"}
              className="w-full h-[70vh] rounded border-0"
            />
          ) : (
            <div className="text-center space-y-3 py-6">
              <p className="text-4xl">📎</p>
              <p className="text-sm text-gray-500">{fileName}</p>
              <a
                href={filePath}
                download={fileName}
                className="inline-block text-sm font-medium text-blue-600 underline"
              >
                Baixar arquivo
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ReceiptList({ receipts }: { receipts: Receipt[] }) {
  const [selected, setSelected] = useState<Receipt | null>(null);

  if (receipts.length === 0) {
    return (
      <p className="text-center text-gray-400 text-sm py-6">
        Nenhum comprovante registrado ainda.
      </p>
    );
  }

  return (
    <>
      <div className="space-y-2">
        {receipts.map((receipt) => {
          const cat = categoryLabels[receipt.category];
          const hasFile = !!receipt.filePath;
          return (
            <div
              key={receipt.id}
              onClick={() => hasFile && setSelected(receipt)}
              className={`bg-white rounded-xl shadow-sm p-4 flex items-center gap-3 transition-colors ${
                hasFile ? "cursor-pointer hover:bg-gray-50 active:bg-gray-100" : ""
              }`}
            >
              <span className="text-2xl">{cat.emoji}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.color}`}>
                    {cat.label}
                  </span>
                  <span className="text-xs text-gray-400">{formatDate(receipt.date)}</span>
                </div>
                {receipt.fileName && (
                  <p className="text-xs text-gray-400 truncate mt-0.5 flex items-center gap-1">
                    {hasFile && <span className="text-blue-400">📎</span>}
                    {receipt.fileName}
                  </p>
                )}
                {receipt.latitude != null && receipt.longitude != null && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    📍 {receipt.latitude.toFixed(4)}, {receipt.longitude.toFixed(4)}
                  </p>
                )}
              </div>
              <span className="font-bold text-gray-800 text-sm flex-shrink-0">
                {formatCurrency(receipt.amount)}
              </span>
            </div>
          );
        })}
      </div>

      {selected && <FileModal receipt={selected} onClose={() => setSelected(null)} />}
    </>
  );
}
