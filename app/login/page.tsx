"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { girisYap, kodDogrula, type GirisState } from "./actions";
import { CihazBanner } from "@/components/CihazBanner";

const initial: GirisState = { status: "idle", message: "", email: "" };

export default function LoginPage() {
  const router = useRouter();
  const [geriDondu, setGeriDondu] = useState(false);

  const [sifreState, sifreAction, sifrePending] = useActionState(girisYap, initial);
  const [kodState, kodAction, kodPending] = useActionState(kodDogrula, initial);
  const [gorulenSifreState, setGorulenSifreState] = useState(sifreState);

  if (sifreState !== gorulenSifreState) {
    setGorulenSifreState(sifreState);
    if (sifreState.status === "kod_bekleniyor") setGeriDondu(false);
  }

  const adim = !geriDondu && sifreState.status === "kod_bekleniyor" ? "kod" : "sifre";
  const email = sifreState.email;

  useEffect(() => {
    if (kodState.status === "ok") {
      router.replace("/");
      router.refresh();
    }
  }, [kodState, router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm space-y-3">
        <CihazBanner />
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h1 className="mb-1 text-xl font-semibold text-slate-900">BATSO Seçim Kampanyası</h1>
          <p className="mb-6 text-sm text-slate-500">
            {adim === "sifre"
              ? "E-posta ve şifrenizle giriş yapın."
              : `Şifreniz doğrulandı. ${email} adresine gönderilen 6 haneli kodu girin.`}
          </p>

          {adim === "sifre" ? (
            <form action={sifreAction} className="flex flex-col gap-3">
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
              {sifreState.status === "error" && (
                <p className="text-sm text-red-600">{sifreState.message}</p>
              )}
              <button
                type="submit"
                disabled={sifrePending}
                className="h-14 rounded-xl bg-slate-900 text-base font-medium text-white active:bg-slate-700 disabled:opacity-50"
              >
                {sifrePending ? "Kontrol ediliyor..." : "Devam Et"}
              </button>
            </form>
          ) : (
            <form action={kodAction} className="flex flex-col gap-3">
              <input type="hidden" name="email" value={email} />
              <input
                type="text"
                name="token"
                required
                autoFocus
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="6 haneli kod"
                className="h-14 rounded-xl border border-slate-300 px-4 text-center text-2xl tracking-[0.5em] focus:border-slate-500 focus:outline-none"
              />
              {kodState.status === "error" && (
                <p className="text-sm text-red-600">{kodState.message}</p>
              )}
              <button
                type="submit"
                disabled={kodPending}
                className="h-14 rounded-xl bg-slate-900 text-base font-medium text-white active:bg-slate-700 disabled:opacity-50"
              >
                {kodPending ? "Doğrulanıyor..." : "Giriş Yap"}
              </button>
              <button
                type="button"
                onClick={() => setGeriDondu(true)}
                className="h-10 text-sm text-slate-500 underline"
              >
                Baştan başla
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
