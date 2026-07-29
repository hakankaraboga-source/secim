import { requireProfile } from "@/lib/auth";
import { Header } from "@/components/Header";

export default async function KilavuzPage() {
  const profile = await requireProfile();
  const yonetici = profile.rol === "admin" || profile.rol === "yonetici";

  return (
    <div className="flex flex-1 flex-col">
      <Header profile={profile} title="Kullanma Kılavuzu" />
      <div className="mx-auto w-full max-w-2xl md:max-w-4xl flex-1 space-y-4 p-4 pb-8">
        <Bolum baslik="🚪 Giriş ve Kurulum">
          <Madde>
            Uygulamaya <strong>www.batso.app</strong> adresinden girilir. Telefonunuzda tarayıcı
            menüsünden <strong>&quot;Ana Ekrana Ekle&quot;</strong> derseniz normal bir uygulama gibi
            tam ekran açılır.
          </Madde>
          <Madde>
            Giriş iki adımlıdır: önce <strong>e-posta + şifrenizi</strong> girersiniz, ardından
            e-postanıza gelen <strong>6 haneli kodu</strong> yazarsınız. Kod 10 dakika geçerlidir.
          </Madde>
          <Madde>
            Şifrenizi yöneticiniz belirler; kod e-postası gelmezse spam klasörünü kontrol edin,
            birkaç dakika bekleyip &quot;Baştan başla&quot; ile yeniden deneyin.
          </Madde>
        </Bolum>

        <Bolum baslik="👤 Roller">
          <Madde><strong>Admin:</strong> Tüm sistemi ve ayarları yönetir.</Madde>
          <Madde><strong>Yönetici:</strong> Tüm firmaları, raporları ve ekip panosunu görür.</Madde>
          <Madde>
            <strong>Temsilci:</strong> Yalnızca kendisine atanan firmaları ve yetkili olduğu meslek
            grubu / mahalledeki firmaları görür.
          </Madde>
          <Madde><strong>Seçim Günü Görevlisi:</strong> Yalnızca seçim günü ekranını kullanır.</Madde>
        </Bolum>

        <Bolum baslik="📞 Günlük Çalışma Akışı (Temsilciler)">
          <Madde>
            <strong>1.</strong> Ana sayfadaki <strong>&quot;Bugün Aranacaklar&quot;</strong>{" "}
            listesinden başlayın — kararsız firmalar otomatik olarak en üsttedir. Yeşil 📞 tuşu
            telefonu doğrudan arar.
          </Madde>
          <Madde>
            <strong>2.</strong> Görüşmeden sonra firmanın sayfasında{" "}
            <strong>&quot;Yeni Görüşme Ekle&quot;</strong> bölümünü doldurun: görüşme tipi, sonuç,
            varsa talep/problem.
          </Madde>
          <Madde>
            <strong>3.</strong> <strong>Destek durumunu güncelleyin:</strong> 🟢 Kesin destekliyor ·
            🟡 Kararsız · 🔴 Rakip adaya yakın · 🔵 Görüşülmedi · ⚪ Oy kullanamaz. Bu, kampanyanın
            en önemli verisidir — görüşme kaydedilmezse yapılmamış sayılır.
          </Madde>
          <Madde>
            <strong>4.</strong> Tekrar aranması gerekiyorsa <strong>tekrar arama tarihi</strong>{" "}
            girin; sistem o gün size hatırlatır ve her sabah 08:00&apos;de e-postanıza günün listesi
            gelir.
          </Madde>
        </Bolum>

        <Bolum baslik="🏢 Firmalar (Genel Takip)">
          <Madde>
            Firma, yetkili adı veya sicil numarasıyla arama yapabilir; destek durumu, meslek grubu,
            referans ve mahalleye göre filtreleyebilirsiniz.
          </Madde>
          <Madde>
            Firma kartında tüm bilgiler, bağlantılı kişiler, aynı soyisimli diğer firmalar ve
            görüşme geçmişi bulunur.
          </Madde>
        </Bolum>

        <Bolum baslik="👥 Kişiler">
          <Madde>
            Tüm firma yetkilileri kişi kaydı olarak tutulur. Bir kişinin kartında bağlı olduğu tüm
            firmaları ve <strong>referansı olduğu firmaları</strong> görürsünüz — ikna turlarında
            &quot;bu firmayı kim tanıyor?&quot; sorusunun cevabı buradadır.
          </Madde>
        </Bolum>

        <Bolum baslik="✅ Görevler">
          <Madde>
            Bekleyen görevleriniz ve tekrar arama tarihi gelen/geciken firmalar burada listelenir.
            Gecikenler kırmızı görünür.
          </Madde>
        </Bolum>

        {yonetici && (
          <>
            <Bolum baslik="📊 Yönetici Panosu (Ana Sayfa)">
              <Madde>
                <strong>Aksiyon Gerekiyor</strong> kartları günlük öncelikleri gösterir: sorumsuz
                firma, geciken takip, bekleyen görev, kararsız firma. Karta dokununca ilgili listeye
                gidersiniz.
              </Madde>
              <Madde>
                <strong>Hedef çubuğu</strong> kesin destek sayısını oy hedefiyle karşılaştırır
                (hedef: Yönetim → Seçim Ayarları). <strong>Ekip Takibi</strong> tablosu her
                temsilcinin atanan firma, kesin destek, haftalık görüşme ve geciken sayısını
                gösterir.
              </Madde>
            </Bolum>

            <Bolum baslik="🎯 Atamalar (Yönetim → Atamalar)">
              <Madde>
                Filtre seçin (meslek grubu, durum, mahalle, referans, adet) + sorumlu seçin →
                &quot;Firmaları Ata&quot;. Atanan kişiye e-posta (ve telefonu kayıtlıysa SMS)
                bildirimi gider.
              </Madde>
            </Bolum>

            <Bolum baslik="⚙️ Kullanıcı Yönetimi">
              <Madde>
                Yönetim → Kullanıcılar&apos;dan yeni kullanıcı tanımlanır (e-posta + geçici şifre).
                Temsilcilerin yetkili olduğu meslek grupları ve mahalleler buradan seçilir.
              </Madde>
              <Madde>
                Sanal grup temsilcilerine gerçek kişiler atandığında yalnızca ad, e-posta ve
                telefonu değiştirin — atanmış firmalar korunur.
              </Madde>
            </Bolum>

            <Bolum baslik="📄 Excel">
              <Madde>
                Yönetim → Excel&apos;den tüm veriyi indirebilir veya toplu firma yükleyebilirsiniz.
                Sicil numarası kayıtlı satırlar atlanır, mükerrer oluşmaz.
              </Madde>
            </Bolum>
          </>
        )}

        <Bolum baslik="🗳️ Seçim Günü">
          <Madde>
            Seçim günü ekranında her firma için durum işaretlenir: Oy kullandı / Yolda / Henüz
            gelmedi / Ulaşılamıyor / Araç gönderilecek / Yetki belgesi sorunu.
          </Madde>
          <Madde>
            Kırmızı kart, <strong>kesin destek verip henüz oy kullanmayanları</strong> gösterir —
            günün kritik takip listesi budur.
          </Madde>
        </Bolum>

        <Bolum baslik="🔔 Bildirimler">
          <Madde>
            Her sabah 08:00&apos;de: temsilcilere günün görev listesi, yöneticilere günlük kampanya
            raporu e-postası gider. Telefonu kayıtlı kullanıcılara (SMS yapılandırıldıysa) kısa SMS
            de gönderilir.
          </Madde>
        </Bolum>

        <p className="text-center text-xs text-slate-400">
          BATSO Seçim Kampanyası · Ferdi Kurt · Sorularınız için kampanya yönetimine ulaşın.
        </p>
      </div>
    </div>
  );
}

function Bolum({ baslik, children }: { baslik: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm">
      <h2 className="mb-2 text-sm font-semibold text-slate-800">{baslik}</h2>
      <div className="space-y-2">{children}</div>
    </section>
  );
}

function Madde({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-slate-600">{children}</p>;
}
