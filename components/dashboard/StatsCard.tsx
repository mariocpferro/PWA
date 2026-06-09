function formatCurrency(value: number) {
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

interface StatsCardProps {
  label: string;
  total: number;
  count: number;
}

export function StatsCard({ label, total, count }: StatsCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-4">
      <p className="text-xs font-medium text-gray-400 uppercase tracking-wide">
        {label}
      </p>
      <p className="text-xl font-bold text-gray-900 mt-1">
        {formatCurrency(total)}
      </p>
      <p className="text-sm text-gray-400 mt-0.5">
        {count} {count === 1 ? "comprovante" : "comprovantes"}
      </p>
    </div>
  );
}
