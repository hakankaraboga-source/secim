"use client";

import { useActionState } from "react";
import { kullaniciEkle, type KullaniciEkleState } from "@/app/(app)/yonetim/kullanicilar/actions";

const initial: KullaniciEkleState = { status: "idle", message: "" };

export function KullaniciEkleForm() {
  const [state, action, pending] = useActionState(kullaniciEkle, initial);

  return (
    <form action={action} className="flex flex-col gap-2 rounded-xl bg-white p-3 shadow-sm">
      <p className="text-sm font-semibold text-slate-700">Yeni Kullanıcı Ekle</p>
      <input
        type="email"
        name="email"
        required
        placeholder="yeni.kullanici@ornek.com"
        className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
      />
      <input
        type="text"
        name="password"
        required
        minLength={6}
        placeholder="Geçici şifre (en az 6 karakter)"
        className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
      />
      <button
        type="submit"
        disabled={pending}
        className="h-11 rounded-lg bg-slate-900 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Ekleniyor..." : "Kullanıcı Ekle"}
      </button>
      {state.status === "error" && <p className="text-sm text-red-600">{state.message}</p>}
      {state.status === "ok" && <p className="text-sm text-green-700">{state.message}</p>}
    </form>
  );
}
