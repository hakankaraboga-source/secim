"use client";

import { useState, useSyncExternalStore } from "react";

type Durum = "gizli" | "telefon" | "bilgisayar";

function subscribe() {
  return () => {};
}

function getSnapshot(): Durum {
  if (localStorage.getItem("cihaz-banner-gizli") === "1") return "gizli";
  // PWA olarak (ana ekrandan) acildiysa banner gereksiz
  if (window.matchMedia("(display-mode: standalone)").matches) return "gizli";
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent) ? "telefon" : "bilgisayar";
}

function getServerSnapshot(): Durum {
  return "gizli";
}

export function CihazBanner() {
  const durum = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [kapatildi, setKapatildi] = useState(false);

  if (kapatildi || durum === "gizli") return null;

  return (
    <div className="relative rounded-xl bg-blue-50 p-3 pr-10 text-sm text-blue-800">
      {durum === "telefon" ? (
        <p>
          📱 <strong>Telefondan kullanıyorsunuz.</strong> Daha rahat kullanım için tarayıcı
          menüsünden <strong>&quot;Ana Ekrana Ekle&quot;</strong> seçeneğiyle uygulamayı telefonunuza
          ekleyin — uygulama gibi tam ekran açılır.
        </p>
      ) : (
        <p>
          💻 <strong>Bilgisayardan kullanıyorsunuz.</strong> Sahadayken telefonunuzun tarayıcısından{" "}
          <strong>batso.app</strong> adresine girip aynı hesapla kullanabilirsiniz.
        </p>
      )}
      <button
        type="button"
        aria-label="Kapat"
        onClick={() => {
          localStorage.setItem("cihaz-banner-gizli", "1");
          setKapatildi(true);
        }}
        className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-blue-400 hover:bg-blue-100"
      >
        ✕
      </button>
    </div>
  );
}
