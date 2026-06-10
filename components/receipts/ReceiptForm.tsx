"use client";

import { useState, useEffect } from "react";
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

type LocationState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "denied" }
  | { status: "ok"; latitude: number; longitude: number };

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

function requestLocation(): Promise<GeolocationCoordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation not supported"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(pos.coords),
      reject,
      { enableHighAccuracy: true, timeout: 10000 }
    );
  });
}

export function ReceiptForm() {
  const router = useRouter();
  const isOnline = useOnlineStatus();
  const [file, setFile] = useState<File | null>(null);
  const [fileResetKey, setFileResetKey] = useState(0);
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("alimentacao");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading, setLoading] = useState(false);
  const [location, setLocation] = useState<LocationState>({ status: "idle" });
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    handleGetLocation();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function showToast(msg: string, type: "success" | "error") {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 5000);
  }

  async function handleGetLocation() {
    setLocation({ status: "loading" });
    try {
      const coords = await requestLocation();
      setLocation({ status: "ok", latitude: coords.latitude, longitude: coords.longitude });
    } catch {
      setLocation({ status: "denied" });
    }
  }

  function handleAmountChange(e: React.ChangeEvent<HTMLInputElement>) {
    // Allow only digits and comma/dot as decimal separator
    const raw = e.target.value.replace(/[^0-9,]/g, "");
    // Prevent more than one comma
    const parts = raw.split(",");
    if (parts.length > 2) return;
    setAmount(raw);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (!amount || isNaN(parsedAmount) || parsedAmount <= 0) {
      showToast("Informe um valor válido", "error");
      return;
    }

    const lat = location.status === "ok" ? location.latitude : undefined;
    const lng = location.status === "ok" ? location.longitude : undefined;

    setLoading(true);
    try {
      if (isOnline) {
        const formData = new FormData();
        formData.set("amount", parsedAmount.toString());
        formData.set("category", category);
        formData.set("date", date);
        if (file) formData.set("file", file);
        if (lat !== undefined) formData.set("latitude", String(lat));
        if (lng !== undefined) formData.set("longitude", String(lng));

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
          amount: parsedAmount,
          category: category as "alimentacao" | "hospedagem" | "combustivel" | "outros",
          date,
          fileName: file?.name,
          fileBase64,
          fileMimeType,
          latitude: lat,
          longitude: lng,
          createdAt: new Date().toISOString(),
        });

        window.dispatchEvent(new CustomEvent("offlineReceiptSaved"));
        showToast("Comprovante salvo! Será enviado ao reconectar.", "success");
      }

      setAmount("");
      setCategory("alimentacao");
      setDate(new Date().toISOString().split("T")[0]);
      setFile(null);
      setFileResetKey((k) => k + 1);
      if (isOnline) router.refresh();
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
            type="text"
            inputMode="decimal"
            placeholder="0,00"
            value={amount}
            onChange={handleAmountChange}
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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Localização
          </label>
          <div className="flex items-center gap-2">
            {location.status === "loading" && (
              <span className="text-xs text-gray-400">Obtendo localização...</span>
            )}
            {location.status === "ok" && (
              <span className="text-xs text-green-600 font-medium">
                📍 {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
              </span>
            )}
            {(location.status === "denied" || location.status === "idle") && (
              <span className="text-xs text-gray-400">Localização não disponível</span>
            )}
            {location.status !== "loading" && (
              <button
                type="button"
                onClick={handleGetLocation}
                className="text-xs text-primary-600 underline"
              >
                {location.status === "ok" ? "Atualizar" : "Tentar novamente"}
              </button>
            )}
          </div>
        </div>

        <FileUploadField onFileChange={setFile} resetKey={fileResetKey} />

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
