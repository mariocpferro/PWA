"use client";

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

const CATEGORY_CONFIG: Record<string, { label: string; color: string }> = {
  alimentacao: { label: "Alimentação", color: "#f97316" },
  hospedagem: { label: "Hospedagem", color: "#3b82f6" },
  combustivel: { label: "Combustível", color: "#eab308" },
  outros: { label: "Outros", color: "#8b5cf6" },
};

interface CategoryBreakdownProps {
  byCategory: Record<string, number>;
}

function formatCurrency(value: number) {
  return `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
}

export function CategoryBreakdown({ byCategory }: CategoryBreakdownProps) {
  const data = Object.entries(byCategory).map(([key, value]) => ({
    name: CATEGORY_CONFIG[key]?.label ?? key,
    value,
    color: CATEGORY_CONFIG[key]?.color ?? "#6b7280",
  }));

  if (data.length === 0) {
    return (
      <p className="text-center text-gray-400 text-sm py-6">
        Nenhum dado para exibir.
      </p>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={220}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={55}
          outerRadius={80}
          dataKey="value"
          paddingAngle={3}
        >
          {data.map((entry, index) => (
            <Cell key={index} fill={entry.color} />
          ))}
        </Pie>
        <Tooltip
          formatter={(value: number) => [formatCurrency(value), ""]}
          contentStyle={{
            borderRadius: "12px",
            border: "none",
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            fontSize: "13px",
          }}
        />
        <Legend
          iconType="circle"
          iconSize={8}
          formatter={(value) => (
            <span style={{ fontSize: 12, color: "#6b7280" }}>{value}</span>
          )}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
