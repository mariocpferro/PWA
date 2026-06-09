import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

function getStartOf(unit: "day" | "week" | "month" | "year"): Date {
  const now = new Date();
  switch (unit) {
    case "day":
      return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    case "week": {
      const d = new Date(now);
      d.setDate(d.getDate() - d.getDay());
      d.setHours(0, 0, 0, 0);
      return d;
    }
    case "month":
      return new Date(now.getFullYear(), now.getMonth(), 1);
    case "year":
      return new Date(now.getFullYear(), 0, 1);
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const periods = ["day", "week", "month", "year"] as const;

  const stats = await Promise.all(
    periods.map(async (period) => {
      const since = getStartOf(period);
      const receipts = await prisma.receipt.findMany({
        where: { userId: session.user!.id!, date: { gte: since } },
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

  return NextResponse.json(stats);
}
