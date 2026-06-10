import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { PeriodChart } from "@/components/dashboard/PeriodChart";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";

function getStartOf(unit: "day" | "week" | "month" | "year"): Date {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const d = now.getDate();
  switch (unit) {
    case "day":
      return new Date(Date.UTC(y, m, d));
    case "week":
      return new Date(Date.UTC(y, m, d - now.getDay()));
    case "month":
      return new Date(Date.UTC(y, m, 1));
    case "year":
      return new Date(Date.UTC(y, 0, 1));
  }
}

async function getStats(userId: string) {
  const periods = ["day", "week", "month", "year"] as const;

  return Promise.all(
    periods.map(async (period) => {
      const since = getStartOf(period);
      const receipts = await prisma.receipt.findMany({
        where: { userId, date: { gte: since } },
        select: { amount: true, category: true },
      });

      const total = receipts.reduce((sum, r) => sum + r.amount, 0);
      const count = receipts.length;
      const byCategory = receipts.reduce<Record<string, number>>((acc, r) => {
        acc[r.category] = (acc[r.category] ?? 0) + r.amount;
        return acc;
      }, {});

      return { period, total, count, byCategory };
    })
  );
}

const periodLabels = {
  day: "Hoje",
  week: "Esta semana",
  month: "Este mês",
  year: "Este ano",
};

export default async function DashboardPage() {
  const session = await auth();
  const stats = await getStats(session!.user!.id!);

  const chartData = stats.map((s) => ({
    name: periodLabels[s.period],
    total: s.total,
    count: s.count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-500 mt-1">Resumo de suas despesas</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {stats.map((s) => (
          <StatsCard
            key={s.period}
            label={periodLabels[s.period]}
            total={s.total}
            count={s.count}
          />
        ))}
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-base font-semibold text-gray-700 mb-4">
          Total por período (R$)
        </h2>
        <PeriodChart data={chartData} />
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4">
        <h2 className="text-base font-semibold text-gray-700 mb-4">
          Por categoria — Este mês
        </h2>
        <CategoryBreakdown byCategory={stats[2].byCategory} />
      </div>
    </div>
  );
}
