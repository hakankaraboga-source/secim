"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { girisYap, type GirisState } from "./actions";

const initial: GirisState = { status: "idle", message: "" };

export default function LoginPage() {
  const router = useRouter();
  const [state, action, pending] = useActionState(girisYap, initial);

  useEffect(() => {
    if (state.status === "ok") {
      router.replace("/");
      router.refresh();
    }
  }, [state, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">BATSO Seçim Kampanyası</h1>
        <p className="mb-6 text-sm text-slate-500">E-posta ve şifrenizle giriş yapın.</p>

        <form action={action} className="flex flex-col gap-3">
          <input
            type="email"
            name="email"
            required
            autoFocus
            autoComplete="email"
            placeholder="ornek@firma.com"
            className="h-14 rounded-xl border border-slate-300 px-4 text-base focus:border-slate-500 focus:outline-none"
          />
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="Şifre"
            className="h-14 rounded-xl border border-slate-300 px-4 text-base focus:border-slate-500 focus:outline-none"
          />
          {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
          <button
            type="submit"
            disabled={pending}
            className="h-14 rounded-xl bg-slate-900 text-base font-medium text-white active:bg-slate-700 disabled:opacity-50"
          >
            {pending ? "Giriş yapılıyor..." : "Giriş Yap"}
          </button>
        </form>
      </div>
    </div>
  );
}
