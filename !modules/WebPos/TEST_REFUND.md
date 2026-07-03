# WebPos İade Sistemi Test Senaryosu

## Test Adımları

### 1. Modülü Yükle
```bash
# Xady botunu başlat
# WebPos modülünün yüklendiğinden emin ol
```

### 2. Test Ödemesi Oluştur
1. WebPanel'e giriş yap: `http://127.0.0.1:8787/`
2. "POS Ödemeleri" sayfasına git
3. "➕ Ödeme Oluştur" sekmesine tıkla
4. Test verilerini gir:
   - Oyuncu Adı: `TestPlayer`
   - Tutar: `25000`
   - Açıklama: `Test ödeme - İade sistemi testi`
5. "💳 Ödeme Oluştur" butonuna tıkla

### 3. Ödemeyi Tamamla
```
# Minecraft'ta bot olarak şu komutu çalıştır:
/msg XadyBot MELONYA ⇴ TestPlayer adlı oyuncudan 25000⛁ alındı.
```

Veya chat mesajını manuel olarak tetikle (config'deki pattern'e göre)

### 4. Tamamlanan Ödemeyi Kontrol Et
1. "📋 Geçmiş" sekmesine git
2. TestPlayer ödemesini gör:
   - Orijinal tutar: 25,000⛁
   - Durum: ✅ Tamamlandı
   - "↩️ İade" butonu görünür olmalı

### 5. İlk İade İşlemi (%50)
1. "↩️ İade" butonuna tıkla
2. İade modal'ı açılır
3. **İade Tipi**: "📊 Yüzde" butonuna tıkla
4. **İade Miktarı**: `50` gir
5. **İade Nedeni**: `İlk test iadesi - %50` yaz
6. "✓ İade Et" butonuna tıkla

**Beklenen Sonuç:**
- Başarılı mesajı görünür
- Ödeme kartı güncellenir:
  - Net Tutar: 12,500⛁ (yeşil)
  - İade Edilen: 12,500⛁ (kırmızı)
- "📋 Detaylar" butonu görünür

### 6. İkinci İade İşlemi (Tutar Bazlı)
1. Aynı ödemeye tekrar "↩️ İade" butonuna tıkla
2. **İade Tipi**: "💰 Tutar" seçili bırak
3. **İade Miktarı**: `5000` gir
4. **İade Nedeni**: `İkinci test iadesi - 5000⛁` yaz
5. "✓ İade Et" butonuna tıkla

**Beklenen Sonuç:**
- Başarılı mesajı görünür
- Ödeme kartı güncellenir:
  - Net Tutar: 7,500⛁ (yeşil)
  - İade Edilen: 17,500⛁ (kırmızı)

### 7. İade Geçmişini Görüntüle
1. "📋 Detaylar" butonuna tıkla
2. Detay modal'ı açılır

**Beklenen Görünüm:**

```
┌─────────────────────────────────────────────────┐
│         📋 Ödeme Detayları               × │
├─────────────────────────────────────────────────┤
│                                                 │
│  Oyuncu             Orijinal Tutar             │
│  TestPlayer         25,000.00⛁                 │
│                                                 │
│  Toplam İade        Net Tutar                  │
│  17,500.00⛁         7,500.00⛁                  │
│                                                 │
│  İade Geçmişi                                  │
│  ┌─────────────┬──────────┬──────────┬────────┐│
│  │ Tarih       │ Miktar   │ İade Eden│ Sebep  ││
│  ├─────────────┼──────────┼──────────┼────────┤│
│  │ 03.07.2026  │ 12,500⛁  │ admin    │ İlk... ││
│  │ 03.07.2026  │ 5,000⛁   │ admin    │ İkinci.││
│  └─────────────┴──────────┴──────────┴────────┘│
│                                                 │
│                              [Kapat]            │
└─────────────────────────────────────────────────┘
```

### 8. Sınır Testi (Maksimum İade)
1. Aynı ödemeye tekrar "↩️ İade" butonuna tıkla
2. **İade Miktarı**: `10000` gir (kalan: 7,500⛁)
3. "✓ İade Et" butonuna tıkla

**Beklenen Sonuç:**
- ❌ Hata mesajı: "İade miktarı geçersiz. Kalan iade edilebilir miktar: 7,500.00⛁"

### 9. Son İade (Tam Kapama)
1. **İade Miktarı**: `7500` gir
2. **İade Nedeni**: `Son iade - test tamamlandı`
3. "✓ İade Et" butonuna tıkla

**Beklenen Sonuç:**
- Başarılı mesajı görünür
- Ödeme kartı güncellenir:
  - Net Tutar: 0.00⛁
  - İade Edilen: 25,000.00⛁
- "↩️ İade" butonu devre dışı veya "tamamen iade edildi" mesajı

### 10. In-Game Kontrol
Bot'un yaptığı işlemler:
```
# İlk iade (%50 = 12,500⛁):
/pay TestPlayer 12500
/pay TestPlayer 12500
/w TestPlayer İade işleminiz gerçekleştirildi. İade miktarı: 12,500.00

# İkinci iade (5,000⛁):
/pay TestPlayer 5000
/pay TestPlayer 5000
/w TestPlayer İade işleminiz gerçekleştirildi. İade miktarı: 5,000.00

# Son iade (7,500⛁):
/pay TestPlayer 7500
/pay TestPlayer 7500
/w TestPlayer İade işleminiz gerçekleştirildi. İade miktarı: 7,500.00
```

## Kontrol Listesi

- [ ] Ödeme oluşturma çalışıyor
- [ ] Ödeme tamamlama çalışıyor
- [ ] İade butonu sadece başarılı ödemelerde görünüyor
- [ ] Yüzde bazlı iade çalışıyor
- [ ] Tutar bazlı iade çalışıyor
- [ ] İade nedeni kaydediliyor
- [ ] İade eden kişi kaydediliyor (session username)
- [ ] Maksimum iade kontrolü çalışıyor
- [ ] Kısmi iade çalışıyor (birden fazla iade)
- [ ] Net tutar doğru hesaplanıyor
- [ ] İade bilgisi kartlarda gösteriliyor
- [ ] Detaylar modal'ı açılıyor
- [ ] İade geçmişi tablosu doğru gösteriliyor
- [ ] In-game komutlar gönderiliyor
- [ ] Oyuncuya whisper mesajı gidiyor

## Hata Senaryoları

### Yetkisiz Kullanıcı
1. `pos.cancel` yetkisi olmayan kullanıcı ile giriş yap
2. İade butonuna tıkla
**Beklenen:** 403 Forbidden - "İade yapma yetkiniz yok"

### Geçersiz Tutar
1. İade miktarı: `-100` veya `0`
**Beklenen:** "Geçerli bir tutar giriniz"

### Geçersiz Yüzde
1. Yüzde modunda: `150`
**Beklenen:** "Yüzde 100'den fazla olamaz"

### Ödeme Bulunamadı
1. Var olmayan bir ödeme ID'sine API çağrısı yap
**Beklenen:** 404 Not Found - "Ödeme bulunamadı"

### Pending Ödemeye İade
1. Henüz tamamlanmamış ödemeye iade dene
**Beklenen:** "Sadece başarılı ödemeler iade edilebilir"

## Başarı Kriterleri

✅ Tüm test adımları başarıyla tamamlandı
✅ Hata senaryoları beklenen şekilde çalıştı
✅ UI responsive ve kullanıcı dostu
✅ İade geçmişi doğru saklanıyor
✅ In-game işlemler doğru çalışıyor
✅ Yetki kontrolü çalışıyor
✅ Veri bütünlüğü korunuyor

## Notlar

- İade işlemleri kalıcı değil (memory'de tutuluyor)
- Bot yeniden başlatılınca iade geçmişi kaybolur
- Persistent storage için veritabanı entegrasyonu gerekli (sonraki adım)
