# PARTYBOARD — Claude Code Proje Hafızası

> Bu dosya her session başında otomatik okunur. Kısa ve güncel tut.

## Proje Nedir?
PartyBoard: AirConsole benzeri parti oyun platformu. TV/bilgisayar ekranında oyun, telefonlar kontrolcü. QR kod veya 6 haneli kodla bağlanma.

## Kullanıcı Hakkında
- Kodlama bilmiyor. Her şeyi basitçe açıkla.
- Teknik terim kullanırsan yanına parantezle açıklama ekle.
- %95 emin değilsen varsayımda bulunma, kullanıcıya sor.

## Temel Kurallar
1. Tüm kodu sen yaz. Kullanıcıdan kod yazmasını isteme.
2. Faz sırasını ASLA değiştirme. Plan dışına çıkma.
3. Her fazın sonunda çalışan bir ürün olmalı. Yarım bırakma.
4. Her fazda testleri yaz ve çalıştır. Testler geçmeden sonraki faza geçme.
5. Kod yazarken tüm dosyalara açıklama satırları (comment) ekle.
6. Hata olursa panik yapma — ne olduğunu, neden olduğunu ve nasıl düzelteceğini açıkla.
7. API key, şifre veya dış servis bilgisi gerektiğinde en başta toplu olarak iste.
8. .env dosyasını sen oluştur, kullanıcıdan aldığın keyleri sen yerleştir.

## Teknik Kararlar
- **Frontend:** React + TypeScript (hem ana ekran hem kontrolcü)
- **Backend:** Node.js + Express + Socket.IO + TypeScript
- **Veritabanı:** PostgreSQL (Prisma ORM) + Redis
- **Oyun Motoru:** Phaser.js (2D)
- **Kimlik Doğrulama:** JWT + opsiyonel Google OAuth
- **Hosting:** Render (kullanıcının mevcut hesabı var)
- **Yapı:** Monorepo (packages/ altında server, screen, controller, shared, games)

## Geliştirme Fazları

| Faz | Kapsam | Durum |
|-----|--------|-------|
| 0 | Proje iskeleti, bağımlılıklar, dev ortamı | ✅ Tamamlandı |
| 1 | Oda sistemi, WebSocket, QR kod, lobi | ✅ Tamamlandı |
| 2 | Taş-kağıt-makas (test oyunu + modül mimarisi) | ✅ Tamamlandı |
| 3 | Hesap sistemi, PostgreSQL, JWT, misafir modu | ✅ Tamamlandı |
| 4 | Monopoly MVP (zar, hareket, arsa, kira) | ✅ Tamamlandı |
| 5 | Monopoly tam (ev/otel, takas, kartlar, temalar) | ✅ Tamamlandı |
| 6 | Ses, çoklu dil, istatistik, liderlik tablosu | ✅ Tamamlandı |
| 7 | Render'a deploy, SSL, production ortamı | ✅ Tamamlandı |

> ⬜ Bekliyor | 🔄 Devam Ediyor | ✅ Tamamlandı

## Mevcut Durum
**Aktif Faz:** Tüm fazlar tamamlandı 🎉
**Son Yapılan:** Faz 7 - Render deploy, Supabase PostgreSQL, production CORS, env variables
**Production URL'ler:**
- Ana ekran: https://partyboard-screen.onrender.com
- Kontrolcü: https://partyboard-controller.onrender.com
- Sunucu: https://partyboard-server.onrender.com
**Sonraki Adım:** Yeni oyun ekleme veya UI geliştirme

## Faz Sonu Özet Formatı
Her fazın sonunda şu formatı kullan:
1. **Bu fazda ne yaptım:** (özet)
2. **Test sonuçları:** (ne çalışıyor, ne çalışmıyor)
3. **Sonraki faz:** (ne yapılacak, kullanıcıdan ne gerekiyor)

## Detaylı Bilgi
Oyun kuralları, WebSocket olayları, Monopoly detayları ve tüm teknik gereksinimler için: `docs/MASTER_PROMPT.md` dosyasını oku.

## Sunucu Kapatma
Dev sunucularını kapatmak için kullanıcıya şu adımları söyle (sen çalıştırma):
1. Portları dinleyen PID'leri bul: `netstat -ano | findstr ":3000 :3001 :3002"`
2. Çıkan PID'lerle kapat: `taskkill /PID <pid1> /PID <pid2> /PID <pid3> /F`
PID'ler her başlatmada değişir, sabit değil. Taskkill komutunu sen çalıştırırsan Claude'un kendi process'i de kapanabiliyor.

## Önemli Hatırlatmalar
- Test aşamasında (Faz 7'ye kadar) her şey localhost üzerinde çalışacak. Deploy Faz 7'de.
- Localhost testlerinde kullanıcıya şunu açıkla: aynı WiFi'daki telefonundan bilgisayarın IP adresine girerek test edebilir.
- UI tasarımı şimdilik basit/fonksiyonel olsun. Detaylı tasarım sonradan entegre edilecek.
- İleride eklenecek özellikler (online multiplayer, sesli iletişim, native app, Smart TV, SDK) için mimariyi uygun tasarla ama şu an kodlama.
