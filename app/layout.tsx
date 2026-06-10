import type { Metadata, Viewport } from "next";
import "./globals.css";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { auth } from "@/auth";

export const metadata: Metadata = {
  title: "Comprovantes",
  description: "Gerenciamento de comprovantes de despesas",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Comprovantes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  themeColor: "#2563eb",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  return (
    <html lang="pt-BR">
      <body>
        <ServiceWorkerRegister />
        <SessionProvider session={session}>{children}</SessionProvider>
      </body>
    </html>
  );
}
