import { BottomNav } from "@/components/nav/BottomNav";
import { SyncTrigger } from "@/components/SyncTrigger";
import { OfflineBadge } from "@/components/receipts/OfflineBadge";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <SyncTrigger />
      <OfflineBadge />
      <main className="flex-1 pb-24 max-w-lg mx-auto w-full px-4 py-6">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
