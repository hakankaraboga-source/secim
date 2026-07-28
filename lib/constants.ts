export const MESLEK_GRUPLARI = [
  "1. Grup",
  "2. Grup",
  "3. Grup",
  "4. Grup",
  "5. Grup",
  "6. Grup",
  "7. Grup",
  "8. Grup",
  "9. Grup",
  "10. Grup",
  "11. Grup",
] as const;

export const DESTEK_DURUMLARI = {
  kesin_destek: { label: "Kesin destekliyor", color: "#16a34a", bg: "#dcfce7", dot: "🟢" },
  kararsiz: { label: "Kararsız", color: "#ca8a04", bg: "#fef9c3", dot: "🟡" },
  rakip: { label: "Rakip adaya yakın", color: "#dc2626", bg: "#fee2e2", dot: "🔴" },
  gorusulmedi: { label: "Görüşülmedi", color: "#2563eb", bg: "#dbeafe", dot: "🔵" },
  oy_kullanamaz: { label: "Oy kullanamaz / kapalı", color: "#6b7280", bg: "#f3f4f6", dot: "⚪" },
} as const;

export type DestekDurumu = keyof typeof DESTEK_DURUMLARI;

export const KULLANICI_ROLLERI = {
  admin: "Admin (Genel Yönetici)",
  saha: "Saha Kullanıcısı",
  telefon: "Telefon Ekibi Kullanıcısı",
  grup_sorumlusu: "Grup Sorumlusu",
  secim_gunu: "Seçim Günü Görevlisi",
} as const;

export type KullaniciRolu = keyof typeof KULLANICI_ROLLERI;

export const SECIM_GUNU_DURUMLARI = {
  bekleniyor: { label: "Henüz gelmedi", color: "#6b7280" },
  yolda: { label: "Yolda", color: "#2563eb" },
  oy_kullandi: { label: "Oy kullandı", color: "#16a34a" },
  ulasilamiyor: { label: "Ulaşılamıyor", color: "#dc2626" },
  arac_gonderilecek: { label: "Araç gönderilecek", color: "#9333ea" },
  yetki_sorunu: { label: "Yetki belgesi sorunu var", color: "#ca8a04" },
} as const;

export type SecimGunuDurumu = keyof typeof SECIM_GUNU_DURUMLARI;

export const GORUSME_TIPI = {
  telefon: "Telefon",
  yuz_yuze: "Yüz yüze",
} as const;
