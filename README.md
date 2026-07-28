# BATSO Seçim Kampanyası — Saha ve Seçmen Takip Uygulaması

Mobil öncelikli (PWA) web uygulaması. Next.js 16 (App Router) + Supabase (Postgres, e-posta OTP auth, RLS).

## Kurulum

### 1. Supabase projesi oluşturun

1. https://supabase.com adresinde yeni bir proje açın.
2. Proje Settings > API sayfasından `Project URL`, `anon public key` ve `service_role key` değerlerini alın.
3. Authentication > Providers > Email bölümünde **"Confirm email"** açık, **"Enable email OTP"** açık olmalı (Supabase varsayılan email/password akışını da devre dışı bırakabilirsiniz, bu uygulama sadece OTP kullanır).
4. SQL Editor'e girip sırasıyla şu dosyaları çalıştırın:
   - `supabase/migrations/0001_init.sql`
   - `supabase/migrations/0002_raporlar.sql`

### 2. Ortam değişkenleri

```bash
cp .env.local.example .env.local
```

`.env.local` dosyasını Supabase proje bilgilerinizle doldurun. `SUPABASE_SERVICE_ROLE_KEY` sadece "kullanıcı davet et" özelliği için sunucu tarafında kullanılır, asla tarayıcıya gönderilmez.

### 3. İlk admin kullanıcısını oluşturma

Bu uygulamada herkes admin tarafından davet edilir (self-signup yok). İlk admin hesabını oluşturmak için:

1. Supabase Dashboard > Authentication > Users > "Invite user" ile kendi e-postanızı davet edin.
2. Kullanıcı oluşturulduğunda `profiles` tablosuna otomatik bir satır eklenir (varsayılan rol: `saha`).
3. SQL Editor'de bu kullanıcıyı admin yapın:
   ```sql
   update profiles set rol = 'admin' where email = 'sizin-eposta@adresiniz.com';
   ```
4. Artık `/login` sayfasından bu e-posta ile giriş yapıp kod doğrulayarak admin olarak sisteme girebilirsiniz. Sonraki kullanıcıları `/yonetim/kullanicilar` sayfasındaki "Davet Et" formuyla ekleyebilirsiniz.

### 4. Geliştirme sunucusu

```bash
npm install
npm run dev
```

## Mimari notları

- **Barındırma:** Next.js + Supabase (cloud). Sunucu bölgesi Türkiye'de değildir (Supabase'in Türkiye lokasyonu yok) — bu, hız/basitlik için bilinçli bir tercihtir. KVKK açısından veri egemenliği kritikse ileride self-hosted Supabase (Türkiye VPS) geçişi mimariyi değiştirmeden yapılabilir.
- **Neden web (PWA) ve Flutter değil:** App store/Play Store yayınlama ve inceleme süreçleriyle uğraşmamak için mobil öncelikli, ana ekrana eklenebilir bir web uygulaması olarak geliştirildi. Bilinen ödünler: tarayıcıda ekran görüntüsü engelleme güvenilir şekilde yapılamaz; tam offline mod native kadar güçlü değildir.
- **Kimlik doğrulama:** Şifre yok, e-posta OTP (Supabase Auth `signInWithOtp` / `verifyOtp`). Kullanıcılar admin tarafından davet edilir.
- **Yetkilendirme:** Postgres Row Level Security ile. `lib/supabase/client.ts` / `server.ts` bilinçli olarak Supabase'in generic `Database` tipini kullanmıyor (bkz. dosya içi not) — sorgu sonuçları `lib/database.types.ts` içindeki satır tipleriyle elle cast edilir.
- **Next.js 16 notu:** `middleware.ts` bu sürümde `proxy.ts` olarak adlandırıldı; `params`/`searchParams` artık `Promise`.

## Faz 1 (bu sürümde tamamlanan)

- E-posta OTP ile giriş, rol bazlı menü (admin / saha / telefon / grup sorumlusu / seçim günü görevlisi)
- Firma/üye listesi, arama ve filtreleme, firma detay kartı (renkli destek durumu, bağlantılı kişiler)
- Görüşme kaydı ekleme ve geçmişi
- Görev atama (ana sorumlu / ikinci bağlantı / bekleyen görev)
- Meslek grubu raporları (11 grup)
- Yönetici paneli (genel özet, kazanmak için gerekli ilave oy, gecikmiş görevler, 7 günlük destek değişimi)
- Kullanıcı yönetimi (davet etme, rol/meslek grubu atama)
- Seçim günü modu (durum işaretleme, "kesin destek verip oy kullanmayanlar" listesi)
- Excel içe/dışa aktarma

## Faz 2 (henüz yapılmadı)

- Harita sistemi
- Bildirim / SMS entegrasyonu
- "Cihazı hatırla" ile OTP'siz hızlı giriş
- PWA ikonları (`public/manifest.json` şu an placeholder yollara işaret ediyor, `public/icons/icon-192.png` ve `icon-512.png` eklenmeli)
