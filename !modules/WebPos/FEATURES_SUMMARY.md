# WebPos Özellikler Özeti

## ✅ TAMAMLANAN ÖZELLİKLER

### 1. İade Sistemi
- ✅ Tam iade geçmişi takibi (RefundRecord)
- ✅ Kısmi iade desteği
- ✅ Yüzde ve tutar bazlı iade
- ✅ İade sebebi kaydetme
- ✅ Kim iade yaptı takibi
- ✅ İade detay modal'ı
- ✅ UI'da iade bilgisi gösterimi

**Dosyalar:**
- `src/models/PosPayment.ts` - RefundRecord interface
- `src/manager/PosManager.ts` - refundPayment() metodu
- `src/http/PosHttpHandler.ts` - POST /api/pos/payments/:id/refund
- `src/views/pos.js` - UI render fonksiyonları
- `src/views/pos.html` - İade ve detay modal'ları

### 2. Bakiye Sistemi
- ✅ Kullanıcı bazlı bakiye yönetimi
- ✅ Ödeme tamamlandığında ödemeyi açan kullanıcıya bakiye ekleme
- ✅ JSON persistent storage
- ✅ Bakiye API endpoint'i

**Dosyalar:**
- `src/models/PosUser.ts` - PosUser modeli
- `src/storage/PosStorage.ts` - JSON tabanlı storage
- `src/manager/PosManager.ts` - Bakiye ekleme entegrasyonu
- `src/http/PosHttpHandler.ts` - GET /api/pos/balance

**API:**
```
GET /api/pos/balance - Kullanıcının bakiyesini getir
```

### 3. Ürün Sistemi
- ✅ Kullanıcı bazlı ürün yönetimi
- ✅ Ürünlere fonksiyon atama desteği
- ✅ Ürün CRUD API'leri
- ✅ Storage entegrasyonu

**Dosyalar:**
- `src/models/PosUser.ts` - PosProduct interface
- `src/http/PosHttpHandler.ts` - Ürün API'leri

**API:**
```
GET    /api/pos/products     - Kullanıcının ürünlerini listele
POST   /api/pos/products     - Yeni ürün ekle
PUT    /api/pos/products/:id - Ürün güncelle
DELETE /api/pos/products/:id - Ürün sil
```

**Ürün Modeli:**
```typescript
interface PosProduct {
    id: string;
    name: string;
    price: number;
    description?: string;
    functionId?: string; // Bağlı fonksiyon ID'si
    enabled: boolean;
}
```

### 4. Fonksiyon Sistemi
- ✅ Modüllerin TS fonksiyonları kaydetmesi
- ✅ İzin bazlı fonksiyon görünürlüğü
- ✅ Fonksiyon registry
- ✅ API endpoint

**Dosyalar:**
- `src/models/PosFunction.ts` - PosFunction modeli
- `src/manager/PosFunctionRegistry.ts` - Registry yönetimi
- `src/http/PosHttpHandler.ts` - GET /api/pos/functions

**API:**
```
GET /api/pos/functions - Kullanıcının izni olan fonksiyonları listele
```

**Fonksiyon Modeli:**
```typescript
interface PosFunctionData {
    id: string;
    name: string;
    description: string;
    module: string; // Ekleyen modül
    handler: (context: PosFunctionContext) => void | Promise<void>;
    permissions: string[]; // Gerekli izinler
}

interface PosFunctionContext {
    username: string; // WebPanel kullanıcısı
    playerUsername: string; // Minecraft oyuncu adı
    amount: number;
    productId?: string;
    bot?: any;
}
```

**Kullanım Örneği:**
```typescript
// Başka bir modülden fonksiyon kaydetme
const webPos = WebPosModule.getInstance();
webPos.getFunctionRegistry().register({
    id: "my_module_vip_function",
    name: "VIP Ver",
    description: "Oyuncuya 30 günlük VIP verir",
    module: "MyModule",
    handler: async (ctx) => {
        // VIP verme işlemi
        ctx.bot?.chat(`/vip give ${ctx.playerUsername} 30`);
    },
    permissions: ["myplugin.vip.give"]
});
```

### 5. POS Cihazı Tasarımı
- ✅ inPos in590 tarzı gerçekçi POS cihazı simülasyonu
- ✅ Fiziksel tuş takımı (0-9, C, OK)
- ✅ Retro terminal ekran tasarımı
- ✅ Aktif input seçimi ve tuş basışı
- ✅ Saat ve bakiye gösterimi
- ✅ Menü sistemi (Ödeme Al, Ürünler, Aktif, Geçmiş)
- ✅ Real-time SSE entegrasyonu
- ✅ Responsive tasarım

**Dosyalar:**
- `src/views/pos-device.html` - HTML yapısı
- `src/views/pos-device.css` - Cihaz tasarımı
- `src/views/pos-device.js` - JavaScript mantığı
- `src/views/pos-device-compiled.html` - Derlenmiş view
- `src/views/build-device.js` - Build script

**URL:**
```
/pos/device - POS cihazı simülasyonu
```

### 6. Dropdown Menü Sistemi (WebPanel)
- ✅ NavItem'a children desteği
- ✅ onClick handler desteği
- ✅ WebPos menüsü dropdown olarak yapılandırıldı

**Menü Yapısı:**
```
POS Ödemeleri (dropdown)
├─ POS Yönetimi (/pos)
├─ POS Cihazı (/pos/device)
└─ POS Ayarları (/pos/config)
```

**NavItem Modeli:**
```typescript
type NavItem = { 
    id: string; 
    title: string; 
    path: string; 
    permission?: string; 
    scope?: "app" | "admin";
    children?: NavItem[]; // Dropdown için
    onClick?: string; // JS fonksiyon
};
```

## 📊 Persistent Storage

**Dosya:** `<dataFolder>/pos_data.json`

**Yapı:**
```json
{
    "users": {
        "username": {
            "username": "admin",
            "balance": 150000.50,
            "products": [
                {
                    "id": "prod_123",
                    "name": "VIP 30 Gün",
                    "price": 50000,
                    "description": "30 günlük VIP paketi",
                    "functionId": "vip_module_give_vip",
                    "enabled": true
                }
            ],
            "createdAt": 1234567890,
            "updatedAt": 1234567890
        }
    },
    "payments": [
        {
            "id": "uuid",
            "username": "PlayerX",
            "amount": 25000,
            "description": "VIP paketi",
            "createdAt": 1234567890,
            "completedAt": 1234567890,
            "status": "success",
            "sendedMoney": 25000,
            "change": 0,
            "createdBy": "admin",
            "refunds": [
                {
                    "id": "refund_uuid",
                    "amount": 12500,
                    "refundedBy": "admin",
                    "refundedAt": 1234567890,
                    "reason": "Müşteri talebi"
                }
            ],
            "totalRefunded": 12500
        }
    ],
    "version": "1.0.0"
}
```

## 🔐 İzinler

```yaml
pos.view       # POS sayfalarını görüntüleme
pos.create     # Ödeme oluşturma
pos.cancel     # Ödeme iptal/iade etme
pos.config     # Config görüntüleme ve düzenleme
```

## 📡 API Endpoints

### Ödeme Yönetimi
```
GET    /api/pos/payments           - Aktif ödemeler
GET    /api/pos/history             - Tamamlanan ödemeler
POST   /api/pos/payments            - Yeni ödeme oluştur
DELETE /api/pos/payments/:id        - Ödemeyi iptal et
POST   /api/pos/payments/:id/refund - İade işlemi
GET    /api/pos/stream              - SSE event stream
```

### Bakiye ve Kullanıcı
```
GET    /api/pos/balance             - Kullanıcı bakiyesi
```

### Ürün Yönetimi
```
GET    /api/pos/products            - Kullanıcının ürünleri
POST   /api/pos/products            - Yeni ürün
PUT    /api/pos/products/:id        - Ürün güncelle
DELETE /api/pos/products/:id        - Ürün sil
```

### Fonksiyonlar
```
GET    /api/pos/functions           - İzinli fonksiyonlar
```

### Config
```
GET    /api/pos/config              - Config getir
POST   /api/pos/config              - Config güncelle
```

## 🎨 Sayfa URL'leri

```
/pos           - Ana POS yönetim sayfası (tablo görünümü)
/pos/device    - POS cihazı simülasyonu (retro terminal)
/pos/config    - POS ayarları
```

## 🚀 Kullanım Senaryoları

### 1. Ödeme Alma
1. `/pos/device` sayfasını aç
2. "Ödeme Al" menüsüne gir
3. Oyuncu adı ve tutarı gir (tuş takımı ile)
4. "Oluştur" butonuna bas
5. Oyuncu sunucuda parayı gönderince otomatik tamamlanır
6. Bakiyeye eklenir

### 2. Ürün Satışı
1. `/pos` sayfasında ürün oluştur
2. Fonksiyon ata (örn: VIP verme)
3. `/pos/device` cihazından "Ürünler" menüsüne gir
4. Ürüne tıkla (otomatik fiyat doldurulur)
5. Sadece oyuncu adını gir ve oluştur
6. Ödeme tamamlanınca fonksiyon otomatik çalışır

### 3. İade İşlemi
1. `/pos` geçmiş sekmesinden ödemeyi bul
2. "İade" butonuna tıkla
3. Tutar veya yüzde gir
4. Sebep yaz (opsiyonel)
5. İade et
6. Oyuncuya para geri gönderilir

### 4. Modül Entegrasyonu
```typescript
// Kendi modülünüzden fonksiyon kaydetme
export default class MyModule extends Xady.Module {
    onEnable() {
        const webPos = WebPosModule.getInstance();
        if (!webPos) return;

        webPos.getFunctionRegistry().register({
            id: "my_custom_function",
            name: "Özel İşlem",
            description: "Özel bir işlem yapar",
            module: this.getName(),
            handler: async (ctx) => {
                // İşlem mantığı
                console.log(`${ctx.username} kullanıcısı ${ctx.playerUsername} için ${ctx.amount}⛁ işlem yaptı`);
            },
            permissions: ["mymodule.custom.use"]
        });
    }

    onDisable() {
        const webPos = WebPosModule.getInstance();
        if (!webPos) return;
        
        webPos.getFunctionRegistry().unregisterModule(this.getName());
    }
}
```

## ⚙️ Build Komutları

```bash
# POS view'ını derle
cd !modules/WebPos/src/views
node build-view.js

# POS device view'ını derle
node build-device.js

# Modülü derle
cd ../..
xext --compile
```

## 🔄 Sonraki Adımlar (İsteğe Bağlı)

- [ ] WebPanel dropdown menü rendering'i (frontend JavaScript gerekli)
- [ ] Ürün yönetimi UI sayfası
- [ ] Bakiye transfer sistemi
- [ ] İstatistik ve raporlama
- [ ] Ödeme queue sistemi (çoklu kullanıcı çakışmaları)
- [ ] MySQL/PostgreSQL storage desteği

## 📝 Notlar

- Tüm veriler `pos_data.json` dosyasında saklanır
- Bot yeniden başlatılınca veriler korunur
- Son 500 ödeme storage'da tutulur
- Bakiye sınırsızdır (isteğe bağlı limit eklenebilir)
- Fonksiyonlar runtime'da kaydedilir (persistent değil)
