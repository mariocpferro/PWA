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

export function ReceiptList({ receipts }: { receipts: Receipt[] }) {
  if (receipts.length === 0) {
    return (
      <p className="text-center text-gray-400 text-sm py-6">
        Nenhum comprovante registrado ainda.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {receipts.map((receipt) => {
        const cat = categoryLabels[receipt.category];
        return (
          <div
            key={receipt.id}
            className="bg-white rounded-xl shadow-sm p-4 flex items-center gap-3"
          >
            <span className="text-2xl">{cat.emoji}</span>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${cat.color}`}
                >
                  {cat.label}
                </span>
                <span className="text-xs text-gray-400">
                  {formatDate(receipt.date)}
                </span>
              </div>
              {receipt.fileName && (
                <p className="text-xs text-gray-400 truncate mt-0.5">
                  {receipt.fileName}
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
  );
}
