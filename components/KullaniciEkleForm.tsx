"use client";

import { useActionState } from "react";
import {
  kullaniciEkle,
  sanalTemsilcileriOlustur,
  type KullaniciEkleState,
  type SanalTemsilciState,
} from "@/app/(app)/yonetim/kullanicilar/actions";
import { KULLANICI_ROLLERI, ROL_SECENEKLERI } from "@/lib/constants";

const EKLE_BASLANGIC: KullaniciEkleState = { status: "idle", message: "" };
const SANAL_BASLANGIC: SanalTemsilciState = { status: "idle", message: "", olusturulan: [] };

export function KullaniciEkleForm() {
  const [state, action, pending] = useActionState(kullaniciEkle, EKLE_BASLANGIC);

  return (
    <form action={action} className="rounded-2xl bg-white p-4 shadow-sm">
      <p className="mb-3 text-sm font-semibold text-slate-700">Yeni Kullanıcı Tanımla</p>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <input
          name="ad_soyad"
          placeholder="Ad Soyad"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
        <input
          type="email"
          name="email"
          required
          placeholder="E-posta *"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
        <input
          type="tel"
          name="telefon"
          placeholder="Telefon (SMS için)"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
        <select name="rol" defaultValue="temsilci" className="h-11 rounded-lg border border-slate-300 px-2 text-sm">
          {ROL_SECENEKLERI.map((rol) => (
            <option key={rol} value={rol}>
              {KULLANICI_ROLLERI[rol]}
            </option>
          ))}
        </select>
        <input
          type="text"
          name="password"
          required
          minLength={6}
          placeholder="Geçici şifre * (en az 6 karakter)"
          className="h-11 rounded-lg border border-slate-300 px-3 text-sm"
        />
        <button
          type="submit"
          disabled={pending}
          className="h-11 rounded-lg bg-slate-900 text-sm font-medium text-white disabled:opacity-50"
        >
          {pending ? "Ekleniyor..." : "Kullanıcı Ekle"}
        </button>
      </div>
      {state.status === "error" && <p className="mt-2 text-sm text-red-600">{state.message}</p>}
      {state.status === "ok" && <p className="mt-2 text-sm text-green-700">{state.message}</p>}
    </form>
  );
}

export function SanalTemsilciForm() {
  const [state, action, pending] = useActionState(sanalTemsilcileriOlustur, SANAL_BASLANGIC);

  return (
    <form action={action} className="rounded-2xl bg-blue-50 p-4">
      <p className="text-sm font-semibold text-blue-900">Sanal Grup Temsilcileri</p>
      <p className="mb-2 text-xs text-blue-800">
        Her meslek grubu için bir temsilci hesabı oluşturur (grup1.temsilci@batso.app ...).
        Gerçek kişiler belli olunca sadece ad, e-posta ve telefonlarını değiştirmeniz yeterli —
        yetkileri ve atanan firmaları korunur.
      </p>
      <button
        type="submit"
        disabled={pending}
        className="h-10 rounded-lg bg-blue-700 px-4 text-sm font-medium text-white disabled:opacity-50"
      >
        {pending ? "Oluşturuluyor..." : "11 Grup Temsilcisini Oluştur"}
      </button>
      {state.status === "ok" && <p className="mt-2 text-sm text-blue-900">{state.message}</p>}
      {state.status === "error" && <p className="mt-2 text-sm text-red-600">{state.message}</p>}
    </form>
  );
}
