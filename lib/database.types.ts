export type UserRole = "admin" | "saha" | "telefon" | "grup_sorumlusu" | "secim_gunu";
export type DestekDurumuDb = "kesin_destek" | "kararsiz" | "rakip" | "gorusulmedi" | "oy_kullanamaz";
export type GorusmeTipiDb = "telefon" | "yuz_yuze";
export type SecimGunuDurumuDb =
  | "bekleniyor"
  | "yolda"
  | "oy_kullandi"
  | "ulasilamiyor"
  | "arac_gonderilecek"
  | "yetki_sorunu";

export interface MeslekGrubuRow {
  id: string;
  ad: string;
  sira: number;
  hedef_meclis_uyesi: number;
}

export interface ProfileRow {
  id: string;
  email: string;
  ad_soyad: string | null;
  rol: UserRole;
  meslek_grubu_id: string | null;
  aktif: boolean;
  created_at: string;
}

export interface FirmaRow {
  id: string;
  firma_unvani: string;
  yetkili_kisi: string | null;
  yetkili_telefon: string | null;
  meslek_grubu_id: string | null;
  vergi_no: string | null;
  oda_sicil_no: string | null;
  oy_kullanacak_kisi: string | null;
  yetki_belgesi_durumu: string | null;
  aidat_engel_durumu: string | null;
  adres: string | null;
  soyisim_grubu: string | null;
  notlar: string | null;
  destek_durumu: DestekDurumuDb;
  ana_sorumlu_id: string | null;
  ikinci_baglanti_id: string | null;
  aile_dostluk_notu: string | null;
  son_gorusme_sonucu: string | null;
  bekleyen_gorev: string | null;
  tekrar_arama_tarihi: string | null;
  secim_gunu_durumu: SecimGunuDurumuDb;
  sandik_grup_bilgisi: string | null;
  created_at: string;
  updated_at: string;
}

export interface GorusmeRow {
  id: string;
  firma_id: string;
  gorusen_id: string | null;
  tip: GorusmeTipiDb;
  sonuc: string | null;
  talep_problem: string | null;
  tekrar_arama_tarihi: string | null;
  yonlendirilecek_kisi_id: string | null;
  created_at: string;
}

export interface IslemKaydiRow {
  id: string;
  kullanici_id: string | null;
  eylem: string;
  hedef_tablo: string;
  hedef_id: string | null;
  detay: Record<string, unknown> | null;
  created_at: string;
}

export interface MeslekGrubuOzetRow {
  meslek_grubu_id: string;
  ad: string;
  sira: number;
  hedef_meclis_uyesi: number;
  toplam_uye: number;
  oy_kullanabilecek: number;
  kesin_destek: number;
  kararsiz: number;
  rakip: number;
  gorusulmedi: number;
  oy_kullanamaz: number;
}

export interface GenelOzetRow {
  toplam_firma: number;
  oy_kullanabilecek: number;
  kesin_destek: number;
  kararsiz: number;
  rakip: number;
  gorusulmedi: number;
  oy_kullanamaz: number;
}

export interface SecimGunuOzetRow {
  bekleniyor: number;
  yolda: number;
  oy_kullandi: number;
  ulasilamiyor: number;
  arac_gonderilecek: number;
  yetki_sorunu: number;
  kesin_destek_oy_kullanmadi: number;
}

export interface SecimAyarlariRow {
  id: number;
  gereken_oy_sayisi: number;
}

export interface Database {
  public: {
    Tables: {
      meslek_gruplari: { Row: MeslekGrubuRow; Insert: Partial<MeslekGrubuRow>; Update: Partial<MeslekGrubuRow> };
      profiles: { Row: ProfileRow; Insert: Partial<ProfileRow>; Update: Partial<ProfileRow> };
      firmalar: { Row: FirmaRow; Insert: Partial<FirmaRow>; Update: Partial<FirmaRow> };
      gorusmeler: { Row: GorusmeRow; Insert: Partial<GorusmeRow>; Update: Partial<GorusmeRow> };
      islem_kayitlari: { Row: IslemKaydiRow; Insert: Partial<IslemKaydiRow>; Update: Partial<IslemKaydiRow> };
      secim_ayarlari: { Row: SecimAyarlariRow; Insert: Partial<SecimAyarlariRow>; Update: Partial<SecimAyarlariRow> };
    };
    Views: {
      meslek_grubu_ozet: { Row: MeslekGrubuOzetRow };
      genel_ozet: { Row: GenelOzetRow };
      secim_gunu_ozet: { Row: SecimGunuOzetRow };
    };
  };
}
