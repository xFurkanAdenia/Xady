# WebPos Hızlı Test Rehberi

## 🚀 Modülü Yükle

1. Xady'yi başlat
2. WebPos modülü otomatik yüklenecek
3. Console'da şu mesajı gör: `[WebPos] Modül başarıyla yüklendi.`

## 🔍 Yeni Özellikleri Test Et

### 1. Bakiye Sistemi

**API Test:**
```bash
# WebPanel'e giriş yaptıktan sonra
curl http://127.0.0.1:8787/api/pos/balance \
  -H "Cookie: xady_session=YOUR_SESSION"
```

**Beklenen Sonuç:**
```json
{
  "ok": true,
  "balance": 0
}
```

**Test Senaryosu:**
1. `/pos` sayfasından ödeme oluştur
2. Minecraft'ta oyuncu parayı gönder
3. Ödeme tamamlanınca bakiyeyi tekrar kontrol et
4. Bakiye artmış olmalı

### 2. POS Cihazı Görünümü

**URL:** `http://127.0.0.1:8787/pos/device`

**Özell

ikler:**
- ✅ Retro terminal ekran
- ✅ Tuş takımı (0-9, C, OK)
- ✅ Menüler: Ödeme Al, Ürünler, Aktif, Geçmiş
- ✅ Saat ve bakiye gösterimi
- ✅ Real-time güncellemeler

**Test Adımları:**
1. Tarayıcıda `/pos/device` aç
2. "Ödeme Al" menüsüne gir
3. Oyuncu adı input'una tıkla
4. Tuş takımından "1", "2", "3" bas
5. "OK" tuşuna bas
6. Tutar gir (tuş takımı ile)
7. "Oluştur" butonuna bas

### 3. Ürün Sistemi

**API Test - Yeni Ürün Ekle:**
```bash
curl -X POST http://127.0.0.1:8787/api/pos/products \
  -H "Cookie: xady_session=YOUR_SESSION" \
  -H "Content-Type: application/json" \
  -H "X-CSRF-Token: YOUR_CSRF" \
  -d '{
    "name": "VIP 30 Gün",
    "price": 50000,
    "description": "30 günlük VIP paketi"
  }'
```

**API Test - Ürünleri Listele:**
```bash
curl http://127.0.0.1:8787/api/pos/products \
  -H "Cookie: xady_session=YOUR_SESSION"
```

**Beklenen Sonuç:**
```json
{
  "ok": true,
  "products": [
    {
      "id": "prod_1234567890_abc",
      "name": "VIP 30 Gün",
      "price": 50000,
      "description": "30 günlük VIP paketi",
      "enabled": true
    }
  ]
}
```

### 4. Fonksiyon Sistemi

**Test Modülü Oluştur:**
`!modules/TestPosFunction/src/index.ts`:
```typescript
import WebPosModule from "WebPos";

export default class TestPosFunction extends Xady.Module {
    onEnable(): void {
        const webPos = WebPosModule.getInstance();
        if (!webPos) {
            console.error("[TestPosFunction] WebPos bulunamadı!");
            return;
        }

        webPos.getFunctionRegistry().register({
            id: "test_vip_function",
            name: "VIP Ver",
            description: "Oyuncuya 30 günlük VIP verir",
            module: this.getName(),
            handler: async (ctx) => {
                console.log(`[TestPosFunction] ${ctx.username} kullanıcısı ${ctx.playerUsername} oyuncusuna VIP verdi`);
                console.log(`[TestPosFunction] Tutar: ${ctx.amount}⛁`);
                
                // VIP verme işlemi
                ctx.bot?.chat(`/vip give ${ctx.playerUsername} 30`);
            },
            permissions: [] // Herkes kullanabilir
        });

        console.log("[TestPosFunction] Fonksiyon kaydedildi!");
    }

    onDisable(): void {
        const webPos = WebPosModule.getInstance();
        if (!webPos) return;
        
        webPos.getFunctionRegistry().unregisterModule(this.getName());
        console.log("[TestPosFunction] Fonksiyon kaydı silindi!");
    }
}
```

**API Test - Fonksiyonları Listele:**
```bash
curl http://127.0.0.1:8787/api/pos/functions \
  -H "Cookie: xady_session=YOUR_SESSION"
```

**Beklenen Sonuç:**
```json
{
  "ok": true,
  "functions": [
    {
      "id": "test_vip_function",
      "name": "VIP Ver",
      "description": "Oyuncuya 30 günlük VIP verir",
      "module": "TestPosFunction",
      "permissions": []
    }
  ]
}
```

### 5. Dropdown Menü

**WebPanel'de Kontrol:**
1. WebPanel'e giriş yap
2. Sidebar'da "POS Ödemeleri" öğesini gör
3. Mouse hover yap
4. Dropdown açılmalı:
   - POS Yönetimi
   - POS Cihazı
   - POS Ayarları

### 6. İade Sistemi (Önceden Eklendi)

**Test:**
1. Bir ödeme oluştur ve tamamla
2. `/pos` sayfasında "Geçmiş" sekmesine git
3. Tamamlanan ödemeyi bul
4. "İade" butonuna tıkla
5. %50 iade yap
6. "Detaylar" butonuna tıkla
7. İade geçmişini gör

## 📂 Data Dosyası

Modül çalıştıktan sonra şurada data dosyası oluşacak:
```
!modules/WebPos/data/pos_data.json
```

**İçerik:**
```json
{
  "users": {
    "admin": {
      "username": "admin",
      "balance": 150000,
      "products": [],
      "createdAt": 1234567890,
      "updatedAt": 1234567890
    }
  },
  "payments": [],
  "version": "1.0.0"
}
```

## ✅ Başarı Kontrol Listesi

- [ ] Modül başarıyla yüklendi
- [ ] `/api/pos/balance` endpoint'i çalışıyor
- [ ] `/api/pos/products` endpoint'i çalışıyor
- [ ] `/api/pos/functions` endpoint'i çalışıyor
- [ ] `/pos/device` sayfası açılıyor
- [ ] POS cihazı tuş takımı çalışıyor
- [ ] Ödeme oluşturulunca bakiye artıyor
- [ ] Dropdown menü görünüyor
- [ ] İade sistemi çalışıyor
- [ ] `pos_data.json` dosyası oluşuyor

## 🐛 Sorun Giderme

**Modül yüklenmiyor:**
- `dist/modules/WebPos.xext` dosyasının var olduğundan emin ol
- Console'da hata mesajlarını kontrol et

**API çalışmıyor:**
- WebPanel'in çalıştığından emin ol
- Session cookie'sini kontrol et
- CSRF token'ı gönderdiğinden emin ol (POST/PUT/DELETE için)

**POS cihazı açılmıyor:**
- `src/views/pos-device-compiled.html` dosyasının var olduğundan emin ol
- Modülü yeniden derle: `xext --compile`

**Bakiye artmıyor:**
- `pos_data.json` dosyasının yazılabilir olduğundan emin ol
- Console'da hata mesajlarını kontrol et

## 📝 Not

Tüm özellikler eklenmiş ve derlenmiş durumda. Test ederken sorun çıkarsa console log'larını kontrol et!
