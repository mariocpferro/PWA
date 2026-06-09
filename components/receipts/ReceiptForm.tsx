"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { addOfflineReceipt } from "@/lib/db/idb";
import { FileUploadField } from "./FileUploadField";

const categories = [
  { value: "alimentacao", label: "Alimentação", emoji: "🍽️" },
  { value: "hospedagem", label: "Hospedagem", emoji: "🏨" },
  { value: "combustivel", label: "Combustível", emoji: "⛽" },
  { value: "outros", label: "Outros", emoji: "📦" },
];

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve((reader.result as string).split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export function ReceiptForm() {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const [file, setFile] = useState<File | null>(null);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("alimentacao");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) {
      showToast("Informe um valor válido", "error");
      return;
    }

    setLoading(true);
    try {
      if (isOnline) {
        const formData = new FormData();
        formData.set("amount", amount);
        formData.set("category", category);
        formData.set("date", date);
        if (file) formData.set("file", file);

        const res = await fetch("/api/receipts", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) throw new Error("Erro ao salvar");
        showToast("Comprovante salvo!", "success");
      } else {
        let fileBase64: string | undefined;
        let fileMimeType: string | undefined;

        if (file) {
          fileBase64 = await fileToBase64(file);
          fileMimeType = file.type;
        }

        await addOfflineReceipt({
          localId: generateId(),
          amount: parseFloat(amount),
          category: category as "alimentacao" | "hospedagem" | "combustivel" | "outros",
          date,
          fileName: file?.name,
          fileBase64,
          fileMimeType,
          createdAt: new Date().toISOString(),
        });

        showToast("Salvo localmente (sincroniza ao reconectar)", "success");
      }

      setAmount("");
      setCategory("alimentacao");
      setDate(new Date().toISOString().split("T")[0]);
      setFile(null);
      router.refresh();
    } catch {
      showToast("Erro ao salvar comprovante", "error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm p-5">
      <h2 className="text-lg font-semibold text-gray-800 mb-4">
        Novo comprovante
      </h2>

      {toast && (
        <div
          className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
            toast.type === "success"
              ? "bg-green-50 text-green-700"
              : "bg-red-50 text-red-700"
          }`}
        >
          {toast.msg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Valor (R$)
          </label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            placeholder="0,00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-lg font-semibold focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoria
          </label>
          <div className="grid grid-cols-2 gap-2">
            {categories.map((cat) => (
              <button
                key={cat.value}
                type="button"
                onClick={() => setCategory(cat.value)}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                  category === cat.value
                    ? "border-primary-500 bg-primary-50 text-primary-700"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                }`}
              >
                <span>{cat.emoji}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Data
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            required
            className="w-full border border-gray-300 rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        <FileUploadField onFileChange={setFile} />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-600 text-white font-semibold py-3 rounded-xl hover:bg-primary-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Salvando..." : "Salvar comprovante"}
        </button>
      </form>
    </div>
  );
}
