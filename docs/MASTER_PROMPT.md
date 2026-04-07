# PartyBoard — Master Prompt (Detaylı Referans)

> Bu dosyayı her session'da okumana gerek yok. Sadece ilgili faza başlarken veya detay gerektiğinde oku.
> Genel kurallar ve mevcut durum için: CLAUDE.md dosyasına bak.

---

## PROJE TANIMI

PartyBoard, AirConsole benzeri bir parti oyun platformudur.

**Ana Fikir:** Bir TV veya bilgisayar ekranında oyun görüntüsü gösterilir. Oyuncular telefonlarını kullanarak bu oyuna katılır ve kontrol eder. Telefonlar QR kod tarayarak veya 6 haneli oda kodunu girerek bağlanır.

### Platform Bileşenleri
- **Ana Ekran (screen):** TV veya bilgisayarda çalışan web uygulaması. Oyun görüntüsü, lobi ve QR kod burada.
- **Sunucu (server):** Node.js + Socket.IO. Oda yönetimi, oyun mantığı, gerçek zamanlı iletişim.
- **Kontrolcü (controller):** Telefonda çalışan web uygulaması (PWA). Butonlar, zar atma, seçimler burada.
- **Oyun Modülleri:** Her oyun bağımsız bir modül. Yeni oyunlar kolayca eklenebilir.

### Monorepo Yapısı
```
partyboard/
  packages/server/        (Node.js backend)
  packages/screen/        (Ana ekran React app)
  packages/controller/    (Telefon React app)
  packages/shared/        (Ortak tipler ve yardımcılar)
  packages/games/         (Oyun modülleri)
  docs/                   (Dokümanlar — bu dosya burada)
  CLAUDE.md               (Her session okunan hafıza)
```

---

## FAZ 0: Proje İskeleti ve Kurulum

**Amaç:** Projenin klasör yapısını oluşturmak, tüm bağımlılıkları yüklemek, geliştirme ortamını hazırlamak.

**Yapılacaklar:**
1. Monorepo klasör yapısını oluştur (yukarıdaki yapı)
2. Tüm package.json, tsconfig.json, ESLint/Prettier config dosyalarını oluştur
3. Bağımlılıkları yükle: react, socket.io, express, phaser, prisma, ioredis, qrcode, i18next, jsonwebtoken
4. .env.example dosyası oluştur — kullanıcıdan gerekli bilgileri iste
5. Git repo başlat, ilk commit yap
6. README.md oluştur

**Bağımlılıklar (detaylı):**
- server: express, socket.io, @prisma/client, ioredis, jsonwebtoken, bcrypt, cors, dotenv
- screen: react, react-dom, socket.io-client, phaser, qrcode, i18next, react-i18next
- controller: react, react-dom, socket.io-client, i18next, react-i18next
- shared: typescript (ortak tipler, enum'lar, yardımcılar)
- Dev: typescript, eslint, prettier, ts-node, nodemon, concurrently

**Faz Sonu Kontrol:** `npm run dev` komutuyla tüm paketler hatasız başlatılabilmeli.

---

## FAZ 1: Oda Sistemi ve WebSocket Bağlantısı

**Amaç:** Ana ekranda QR kod göstermek, telefondan tarayıp odaya katılmak, lobide oyuncuları görmek.

**Yapılacaklar:**
1. Sunucuda Socket.IO kurulumu ve oda yönetimi
2. 6 haneli alfanümerik oda kodu üretici (Büyük harf + rakam, örn: AB3K9X)
3. Ana ekran: başlangıç sayfası, "Oda Oluştur" butonu, QR kod + oda kodu gösterimi
4. Telefon kontrolcüsü: oda kodu girme ekranı, QR tarama sonrası otomatik bağlanma
5. Lobi (ana ekran): bağlı oyuncuların listesi (avatar + isim)
6. Lobi (telefon): bekleme ekranı, bağlı olduğunu gösteren UI
7. Oda kapasitesi: oyuna göre 2–12 oyuncu
8. Bağlantı kopma algılama ve yeniden bağlanma
9. Oda 30 dakika işlemsiz kalırsa otomatik kapanma

**Oda Yönetimi Detayları:**
- Oda kodu: 6 haneli alfanümerik (büyük harf + rakam)
- Oda bilgileri Redis'te tutulur
- Oda ömrü: son aktiviteden 30 dakika sonra otomatik kapanma
- Maks oyuncu: oyuna göre değişken (manifest.json'dan okunur)
- Oda sahibi: ilk bağlanan (ana ekran). Oyun seçme ve başlatma yetkisi oda sahibinde.

**Faz Sonu Kontrol:** Bilgisayar tarayıcısında ana ekranı aç, telefon tarayıcısından (aynı WiFi, bilgisayarın IP adresi üzerinden) QR tarayıp lobide görün. En az 2 telefon aynı anda bağlanabilmeli.

---

## FAZ 2: Test Oyunu (Taş-Kağıt-Makas)

**Amaç:** Oyun modülü mimarisini kurmak, basit bir oyunla tüm sistemi uçtan uca test etmek.

### Oyun Modülü Mimarisi
Her oyun bir modül:
```
packages/games/rock-paper-scissors/
  manifest.json    (oyun config: isim, min/max oyuncu, yön, açıklama)
  screen/          (ana ekran görünümü)
  controller/      (telefon kontrolcü görünümü)
  logic/           (oyun kuralları — sunucu tarafında çalışır)
```

### Platform API (her oyun modülü bu API'yi kullanır)
- `onPlayerJoin(player)` — yeni oyuncu katıldığında
- `onPlayerLeave(player)` — oyuncu ayrıldığında
- `onInput(player, data)` — telefondan girdi geldiğinde
- `sendToScreen(data)` — ana ekrana veri gönderme
- `sendToPlayer(player, data)` — belirli oyuncuya özel veri gönderme
- `sendToAll(data)` — tüm oyunculara veri gönderme
- `onGameEnd(results)` — oyun sonuçlarını platforma bildirme

### Taş-Kağıt-Makas Kuralları
- 2 oyuncu
- Telefonda 3 büyük buton: taş, kağıt, makas
- Her iki oyuncu seçim yaptıktan sonra ana ekranda aynı anda açılır
- Tur sayısı: En iyi 3 veya 5 (oda sahibi seçer)
- Skor tablosu ve kazanan animasyonu

**Faz Sonu Kontrol:** 2 telefon (aynı WiFi, localhost üzerinden) bağlanıp taş-kağıt-makas oynayabilmeli. Seçimler ana ekranda görünmeli. Skor doğru hesaplanmalı.

---

## FAZ 3: Hesap Sistemi ve Veritabanı

**Amaç:** Opsiyonel kullanıcı hesabı, profil yönetimi, veritabanı altyapısı.

**Yapılacaklar:**
1. PostgreSQL bağlantısı (Prisma ORM)
2. Kullanıcı tablosu: id, email, username, avatar, password_hash, created_at
3. Kayıt: email + şifre, Google OAuth
4. JWT token ile oturum yönetimi
5. Misafir modu: hesap oluşturmadan rastgele avatar ve isimle oynama
6. Profil sayfası: avatar seçimi, kullanıcı adı değiştirme
7. Redis ile oturum önbelleği

**Misafir vs Kayıtlı:**
| Mod | Özellikler | Veri |
|-----|-----------|------|
| Misafir | Rastgele avatar ve isim, anında oynama | Sadece oturum boyunca |
| Kayıtlı | Profil, avatar seçimi, istatistikler, liderlik | Kalıcı (PostgreSQL) |

⚠️ Google OAuth için kullanıcıdan Google Cloud Console'dan Client ID ve Secret almasını iste. Adım adım nereden alınacağını açıkla.

**Faz Sonu Kontrol:** Misafir olarak oynayabilmeli VE hesap oluşturup giriş yapabilmeli.

---

## FAZ 4: Monopoly MVP

**Amaç:** Monopoly'nin temel mekaniklerini tek bir tema (Klasik) ile çalışır hale getirmek.

**Bu fazda OLACAKLAR:**
1. Oyun tahtası renderı (Phaser.js, 40 karelik klasik tahta)
2. Zar atma: telefonda butona dokunma, animasyonlu zar (telefon + ana ekran)
3. Taş hareketi: zar sonucuna göre otomatik animasyonlu hareket
4. Mülk satın alma: boş arsaya gelince telefonda "Satın Al / Pas Geç"
5. Kira hesaplama: başkasının mülküne gelince otomatik ödeme
6. Sıra yönetimi: sıradaki oyuncuda eylem butonları, diğerlerinde bekleme
7. Para yönetimi: başlangıç parası (1500), kira, başlangıçtan geçince maaş (200)
8. Telefon kontrolcü: mevcut para, sahip olunan mülkler, eylem butonları
9. Oyun sonu: iflas eden elenir, son kalan kazanır

**Bu fazda OLMAYACAKLAR:** Ev/otel, takas, ipotek, şans/topluluk kartları, tema seçimi → Faz 5'te.

**Faz Sonu Kontrol:** 2–6 oyuncu temel Monopoly oynayabilmeli: zar at, ilerle, arsa al, kira öde.

---

## FAZ 5: Monopoly Tam Versiyon

**Amaç:** Tüm mekanikler ve tema sistemi.

### Ek Mekanikler
1. Ev ve otel kurma (tam set tamamlanınca telefon menüsünden)
2. Takas/ticaret (oyuncular arası mülk ve para takası — teklif gönder/onayla/reddet)
3. İpotek sistemi (mülk ipotek etme ve geri alma)
4. Şans ve Topluluk Sandığı kartları (kart çekme, efekt uygulama)
5. Hapishane mekanikleri (girme: "Hapise Git" karesi, kart, 3x çift zar / çıkma: çift zar 3 deneme, kart, 50 birim ödeme)
6. Çift zar kuralı (çift gelince tekrar atma, 3 kez üst üste çift = hapishane)

### Tema Sistemi
Her tema ayrı klasör:
```
packages/games/monopoly/themes/classic/
packages/games/monopoly/themes/ottoman/
  theme.json     (isimler, para birimi, renkler)
  images/        (tahta, taşlar, kartlar)
  sounds/        (temaya özel ses efektleri)
  i18n/          (tema içerikleri çoklu dilde)
```

Temalar: Klasik, Osmanlı. (Antik Mısır, Roma, Türkiye ileride)
Lobide tema seçimi (oda sahibi seçer).

### Monopoly Detaylı Kurallar

**Tahta (40 kare):** 4 köşe + her kenarda 9 kare. Kare tipleri: arsa (22, 8 renk grubu), demiryolu (4), altyapı/şirket (2), vergi (2), şans (3), topluluk sandığı (3).

**Para:** Başlangıç: 1500. Başlangıç noktasından geçince: +200. Temaya göre para birimi değişir.

**Ev/Otel:** Tam renk grubuna sahip olunca ev kurulabilir. 4 evden sonra otel. Evler eşit dağıtılmalı (fark maks 1).

**Kira:** Her arsanın kira tablosu: boş, 1-4 ev, otel. Demiryolu: sahip olunan sayıya göre katlanır. Altyapı: zar × 4 (tek şirket) veya zar × 10 (iki şirket).

**Faz Sonu Kontrol:** Tüm Monopoly mekanikleri çalışmalı. En az 2 tema arasında geçiş yapılabilmeli.

---

## FAZ 6: Cilalama (Ses, Dil, İstatistik, Liderlik)

**Amaç:** Kullanıcı deneyimini profesyonel seviyeye çıkarmak.

**Yapılacaklar:**
1. **Ses efektleri:** Zar (ana ekran), para transferi (ana ekran), kart çekme (ana ekran), sıra bildirimi (telefon titreşim), kazanma (her ikisi). Müzik YOK.
2. **Çoklu dil (i18next):** Türkçe + İngilizce. Tüm UI + oyun içerikleri. Ana ekran sistem diline göre başlar. Oda sahibi ayarlardan değiştirebilir. Odadaki herkes aynı dil.
3. **İstatistik ekranı:** Monopoly: toplam tur, son bakiyeler, kira gelir/gider, en çok kira ödenen mülk, çift zar sayısı, hapishanede geçen tur.
4. **Liderlik tablosu:** Kayıtlı kullanıcılar. Kazanma sayısı, oran, oynama süresi. Oyun bazlı + genel filtreleme.
5. **Animasyonlar:** UI geçişleri, buton efektleri, lobi giriş/çıkış.
6. **Bağlantı kopma UI:** "Oyuncu X bağlantıyı kaybetti" + oda sahibine "Bekle / Ele" butonları.

**Faz Sonu Kontrol:** Ses çalışmalı, dil değiştirilebilmeli, istatistikler ve liderlik tablosu görüntülenmeli.

---

## FAZ 7: Yayına Alma (Render Deploy)

**Amaç:** Projeyi internete yayınlamak.

**Yapılacaklar:**
1. Render üzerinde sunucu deploy
2. PostgreSQL ve Redis'i Render production ortamına taşı
3. Frontend'leri build edip statik hosting'e yükle (Cloudflare Pages veya Vercel)
4. Alan adı bağlama (varsa)
5. SSL sertifikası (HTTPS zorunlu)
6. Environment variable'ları production'a taşı
7. Temel monitoring: hata loglama, uptime
8. Farklı cihazlarda test (iPhone, Android, masaüstü)

⚠️ Deploy için kullanıcıdan Render giriş bilgileri veya token gerekebilir. Adım adım yönlendir.

**Faz Sonu Kontrol:** Platform internette çalışıyor. Telefondan QR tarayıp bağlanabiliyor. Oyun oynanabiliyor.

---

## WEBSOCKET OLAY LİSTESİ

| Olay | Gönderen | Alıcı | Açıklama |
|------|----------|-------|----------|
| room:create | Ana ekran | Sunucu | Yeni oda oluştur, QR ve kod al |
| room:join | Telefon | Sunucu | Oda koduyla odaya katıl |
| player:joined | Sunucu | Ana ekran | Yeni oyuncu bilgisi (avatar, isim) |
| game:select | Ana ekran | Sunucu | Oda sahibi oyun seçti |
| game:start | Ana ekran | Sunucu | Oyunu başlat |
| game:state | Sunucu | Tüm cihazlar | Oyun durumu güncelleme |
| controller:input | Telefon | Sunucu | Oyuncu girdisi (buton, zar vs.) |
| player:private | Sunucu | Tek telefon | Kişiye özel bilgi (para, kartlar) |
| player:disconnect | Sunucu | Ana ekran | Oyuncu bağlantısı koptu |
| game:end | Sunucu | Tüm cihazlar | Oyun sonu + istatistikler |

---

## BAĞLANTI KOPMA YÖNETİMİ

1. Socket.IO otomatik yeniden bağlanma dener (30 saniye)
2. Ana ekranda: "Oyuncu X bağlantıyı kaybetti"
3. Oyun otomatik duraklar
4. Oda sahibine: "Bekle" veya "Oyuncu Elen" seçenekleri
5. Yeniden bağlanan oyuncu kaldığı yerden devam (Redis'ten durum yüklenir)

---

## DİL SİSTEMİ (i18n)

- Tüm metinler i18n anahtar-değer çiftleriyle yönetilir
- Her dil için JSON: tr.json, en.json
- Kod içinde ASLA sabit metin yok. Her metin i18n key'i üzerinden
- Başlangıç dilleri: Türkçe, İngilizce
- Ana ekran cihaz dili = varsayılan. Oda sahibi ayarlardan değiştirebilir
- Odadaki herkes aynı dili görür

---

## SES SİSTEMİ

Müzik YOK. Sadece ses efektleri:

| Efekt | Tetikleyici | Çıkış |
|-------|------------|-------|
| Zar sesi | Zar atıldığında | Ana ekran |
| Para sesi | Alışveriş/kira | Ana ekran |
| Kart sesi | Kart çekildiğinde | Ana ekran |
| Bildirim | Sıra geldiğinde | Telefon (titreşim) |
| Kazanma | Oyun sonu | Ana ekran + telefon |

---

## İLERİDE EKLENECEKLER (şimdi kodlama, mimariyi uygun tasarla)

- Online multiplayer (farklı lokasyonlardan aynı odaya)
- Sesli iletişim (WebRTC)
- Oyun kaydetme / devam etme
- Native uygulama (React Native — iOS + Android)
- Smart TV uygulaması
- Üçüncü parti geliştirici SDK'sı
- Reklam sistemi (sadece lobide)
- Yeni oyunlar (parti, strateji, kart oyunları)

---

## UI HAKKINDA ÖNEMLİ NOT

UI tasarımı şu an basit ve fonksiyonel olsun. Detaylı görsel tasarım (butonlar, renkler, ikonlar, layout) sonradan harici tasarım araçlarıyla yapılıp entegre edilecek. Bu yüzden:
- Temiz, anlaşılır, çalışan bir UI yeterli
- CSS'i kolay değiştirilebilir/override edilebilir şekilde yaz (CSS modules veya Tailwind)
- Komponent yapısını modüler tut ki UI kolayca güncellenebilsin
- Renkleri ve spacing'i CSS değişkenleriyle yönet (sonra toplu değişim kolay olsun)
