"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { kodGonder, koduDogrula, type GonderState, type DogrulaState } from "./actions";

const gonderInitial: GonderState = { status: "idle", message: "", email: "" };
const dogrulaInitial: DogrulaState = { status: "idle", message: "", email: "" };

export default function LoginPage() {
  const router = useRouter();
  const [manuelAdim, setManuelAdim] = useState<"email" | null>(null);
  const [gorulenGonderState, setGorulenGonderState] = useState(gonderInitial);

  const [gonderState, gonderAction, gonderPending] = useActionState(kodGonder, gonderInitial);
  const [dogrulaState, dogrulaAction, dogrulaPending] = useActionState(koduDogrula, dogrulaInitial);

  if (gonderState !== gorulenGonderState) {
    setGorulenGonderState(gonderState);
    if (gonderState.status === "sent") setManuelAdim(null);
  }

  const step = manuelAdim ?? (gonderState.status === "sent" ? "otp" : "email");
  const email = gonderState.email;

  useEffect(() => {
    if (dogrulaState.status === "ok") {
      router.replace("/");
      router.refresh();
    }
  }, [dogrulaState, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-sm">
        <h1 className="mb-1 text-xl font-semibold text-slate-900">BATSO Seçim Kampanyası</h1>
        <p className="mb-6 text-sm text-slate-500">
          {step === "email"
            ? "Devam etmek için e-posta adresinizi girin."
            : `${email} adresine gönderilen kodu girin.`}
        </p>

        {step === "email" ? (
          <form action={gonderAction} className="flex flex-col gap-3">
            <input
              type="email"
              name="email"
              required
              autoFocus
              autoComplete="email"
              placeholder="ornek@firma.com"
              className="h-14 rounded-xl border border-slate-300 px-4 text-base focus:border-slate-500 focus:outline-none"
            />
            {gonderState.status === "error" && (
              <p className="text-sm text-red-600">{gonderState.message}</p>
            )}
            <button
              type="submit"
              disabled={gonderPending}
              className="h-14 rounded-xl bg-slate-900 text-base font-medium text-white active:bg-slate-700 disabled:opacity-50"
            >
              {gonderPending ? "Gönderiliyor..." : "Kod Gönder"}
            </button>
          </form>
        ) : (
          <form action={dogrulaAction} className="flex flex-col gap-3">
            <input type="hidden" name="email" value={email} />
            <input
              type="text"
              name="token"
              required
              autoFocus
              inputMode="numeric"
              placeholder="6 haneli kod"
              className="h-14 rounded-xl border border-slate-300 px-4 text-center text-2xl tracking-[0.5em] focus:border-slate-500 focus:outline-none"
            />
            {dogrulaState.status === "error" && (
              <p className="text-sm text-red-600">{dogrulaState.message}</p>
            )}
            <button
              type="submit"
              disabled={dogrulaPending}
              className="h-14 rounded-xl bg-slate-900 text-base font-medium text-white active:bg-slate-700 disabled:opacity-50"
            >
              {dogrulaPending ? "Doğrulanıyor..." : "Giriş Yap"}
            </button>
            <button
              type="button"
              onClick={() => setManuelAdim("email")}
              className="h-10 text-sm text-slate-500 underline"
            >
              Farklı bir e-posta kullan
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
