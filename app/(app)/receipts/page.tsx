import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ReceiptForm } from "@/components/receipts/ReceiptForm";
import { ReceiptList } from "@/components/receipts/ReceiptList";
import { OfflineReceiptList } from "@/components/receipts/OfflineReceiptList";

export default async function ReceiptsPage() {
  const session = await auth();
  const receipts = await prisma.receipt.findMany({
    where: { userId: session!.user!.id! },
    orderBy: { date: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Comprovantes</h1>
        <p className="text-sm text-gray-500 mt-1">
          Registre seus comprovantes de despesas
        </p>
      </div>

      <ReceiptForm />

      <div>
        <h2 className="text-lg font-semibold text-gray-700 mb-3">
          Recentes
        </h2>
        <div className="space-y-2">
          <OfflineReceiptList />
          <ReceiptList receipts={receipts} />
        </div>
      </div>
    </div>
  );
}
