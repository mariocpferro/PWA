"use client";

import { useEffect, useState } from "react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "other";

function detectPlatform(): Platform {
  const ua = navigator.userAgent;
  if (/iphone|ipad|ipod/i.test(ua)) return "ios";
  if (/android/i.test(ua)) return "android";
  return "other";
}

const steps: Record<Platform, { icon: string; text: string }[]> = {
  ios: [
    { icon: "⬆", text: 'Toque em "Compartilhar" na barra do Safari' },
    { icon: "➕", text: 'Role e toque em "Adicionar à Tela de Início"' },
    { icon: "✓", text: 'Toque em "Adicionar" para confirmar' },
  ],
  android: [
    { icon: "⋮", text: "Toque no menu (três pontos) do navegador" },
    { icon: "➕", text: '"Adicionar à tela inicial" ou "Instalar app"' },
    { icon: "✓", text: "Confirme para instalar" },
  ],
  other: [
    { icon: "⋮", text: "Abra o menu do navegador" },
    { icon: "➕", text: '"Adicionar à tela inicial" ou "Instalar"' },
    { icon: "✓", text: "Confirme para instalar" },
  ],
};

export function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [platform, setPlatform] = useState<Platform>("other");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone ===
        true;

    if (isStandalone) return;

    setPlatform(detectPlatform());
    setShow(true);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!show || dismissed) return null;

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setShow(false);
      setDeferredPrompt(null);
    } else {
      setShowModal(true);
    }
  };

  return (
    <>
      <div className="bg-blue-600 text-white text-sm px-4 py-2 flex items-center justify-between gap-3">
        <span className="font-medium">
          Instale o app para acesso rápido e offline
        </span>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstallClick}
            className="bg-white text-blue-600 font-semibold text-xs px-3 py-1 rounded-full hover:bg-blue-50 transition-colors"
          >
            Instalar
          </button>
          <button
            onClick={() => setDismissed(true)}
            aria-label="Fechar"
            className="text-blue-200 hover:text-white text-xl leading-none"
          >
            ×
          </button>
        </div>
      </div>

      {showModal && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-lg p-6 pb-24"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold text-gray-900">
                Como instalar o app
              </h2>
              <button
                onClick={() => setShowModal(false)}
                aria-label="Fechar"
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                ×
              </button>
            </div>

            <ol className="space-y-4">
              {steps[platform].map((step, i) => (
                <li key={i} className="flex items-start gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-600 font-bold text-base shrink-0">
                    {step.icon}
                  </span>
                  <p className="text-sm text-gray-700 pt-1.5">{step.text}</p>
                </li>
              ))}
            </ol>

            <button
              onClick={() => setShowModal(false)}
              className="mt-6 w-full bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
