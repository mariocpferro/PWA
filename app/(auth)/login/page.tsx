"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🧾</div>
          <h1 className="text-2xl font-bold text-gray-900">Comprovantes</h1>
          <p className="text-gray-500 mt-2 text-sm">
            Gerencie seus comprovantes de despesas
          </p>
        </div>

        <button
          onClick={() => signIn("keycloak", { callbackUrl: "/receipts" })}
          className="w-full flex items-center justify-center gap-3 bg-[#003882] text-white font-medium py-3 px-4 rounded-xl hover:bg-[#00286b] transition-all shadow-sm"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path
              d="M12 2a5 5 0 1 0 0 10A5 5 0 0 0 12 2zm0 12c-5.33 0-8 2.67-8 4v2h16v-2c0-1.33-2.67-4-8-4z"
              fill="currentColor"
            />
          </svg>
          Entrar com AMEI (SEBRAE)
        </button>

        <p className="text-center text-xs text-gray-400 mt-6">
          Ao entrar, você concorda com os termos de uso
        </p>
      </div>
    </div>
  );
}
