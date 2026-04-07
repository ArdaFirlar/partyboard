# PartyBoard — Hızlı Başlangıç Kılavuzu

## Bu klasörde ne var?

```
📁 Bu klasörden aldıkların:
├── CLAUDE.md              ← Proje kök dizinine koy (her session otomatik okunur)
├── docs/
│   └── MASTER_PROMPT.md   ← docs/ klasörüne koy (detaylı referans)
└── QUICK_START.md          ← Bu dosya (okuduktan sonra silebilirsin)
```

## Adım Adım Ne Yapacaksın?

### 1. Ön Hazırlık (bir kere yapılır)
- [ ] Node.js kur (v18+): https://nodejs.org
- [ ] Git kur: https://git-scm.com
- [ ] GitHub hesabı aç: https://github.com
- [ ] Render hesabın zaten var ✅
- [ ] Claude Code kur: `npm install -g @anthropic-ai/claude-code`

### 2. Proje Klasörünü Hazırla
```bash
# Masaüstünde veya istediğin yerde boş klasör oluştur
mkdir partyboard
cd partyboard

# CLAUDE.md dosyasını bu klasöre koy
# docs/MASTER_PROMPT.md dosyasını docs/ klasörüne koy
```

### 3. Claude Code'u Başlat
```bash
# Proje klasöründeyken:
claude
```

### 4. İlk Mesajı Gönder
Claude Code açıldığında şunu yaz:

```
CLAUDE.md ve docs/MASTER_PROMPT.md dosyalarını oku. Bu projeyi sıfırdan geliştireceğiz. Ben kodlama bilmiyorum, her şeyi sen yapacaksın. Faz 0'dan başla. Önce benden gereken bilgileri (API key, hesap bilgileri vs.) toplu olarak iste.
```

### 5. Sonraki Session'larda (kapanıp açıldığında)
```
Projeye devam et. CLAUDE.md'yi oku ve kaldığın yerden devam et.
```

## Token Tasarrufu İpuçları

1. **Kısa komutlar ver:** "Devam et", "Faz 2'ye geç", "Bu hatayı düzelt" gibi.
2. **Gereksiz açıklama isteme:** Zaten anlıyorsan "açıkla" deme.
3. **Hata mesajını doğrudan yapıştır:** Uzun uzun anlatmak yerine terminaldeki hatayı kopyala-yapıştır.
4. **CLAUDE.md güncel tutsun:** Her faz sonunda Claude'a "CLAUDE.md'yi güncelle" de.

## Sık Kullanacağın Komutlar

| Durum | Ne Yazacaksın |
|-------|--------------|
| Devam etmesi için | "Devam et" |
| Faz atlamaya çalışırsa | "Dur, plana geri dön. Hangi fazdaydık?" |
| Anlamadıysan | "Bunu basitçe açıkla" |
| Hata olursa | Hata mesajını yapıştır |
| Faz bitti | "CLAUDE.md'deki durumu güncelle" |
| Session kapandıktan sonra | "CLAUDE.md'yi oku ve kaldığın yerden devam et" |
| Yoldan çıkarsa | "Plan dışına çıkma. docs/MASTER_PROMPT.md'yi oku." |
