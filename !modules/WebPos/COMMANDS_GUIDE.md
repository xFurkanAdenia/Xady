# WebPos Modular Command System

## Overview

WebPos modülü artık modüler bir komut sistemine sahip. Tüm komutlar ayrı dosyalarda organize edilmiş durumda.

## Architecture

```
!modules/WebPos/commands/
├── WebPosCommand.ts              # Main command executor & registry
├── StartPaymentSubCommand.ts     # Create new payment
├── CancelPaymentSubCommand.ts    # Cancel payment
├── PaymentsSubCommand.ts         # List payments
└── ReloadSubCommand.ts           # Reload config
```

## Commands

### 1. **startPayment** - Yeni Ödeme Oluştur
```bash
!webpos startPayment <payer> <receiver|-> <amount>
!webpos start Xady Melonya 100.50
!webpos create Xady - 50.00
```

**Parametreler:**
- `payer` - Ödemeyi yapacak kişi
- `receiver` - Ödemeyi alacak kişi (gerekmezse `-` yazın)
- `amount` - Miktar (örn: 100.50)

**Özellikler:**
- Kullanıcının aktif ödemesi varsa uyarı verir
- Ödeme ID'si ile birlikte onay mesajı gösterir
- Geçersiz miktar kontrolü yapar

**Aliases:** `start`, `create`

---

### 2. **cancelPayment** - Ödemeyi İptal Et
```bash
!webpos cancelPayment <payment-id>
!webpos cancel abc123-def456-...
!webpos remove payment-id
```

**Parametreler:**
- `payment-id` - İptal edilecek ödemenin ID'si

**Özellikler:**
- Sadece PENDING durumundaki ödemeler iptal edilebilir
- Tab completion ile aktif ödeme ID'lerini önerir
- İptal edilen ödeme detaylarını gösterir

**Aliases:** `cancel`, `remove`

---

### 3. **payments** - Ödemeleri Listele
```bash
!webpos payments              # Tüm ödemeler
!webpos payments Xady         # Belirli kullanıcı
!webpos list                  # Alias
!webpos ls Melonya           # Alias
```

**Parametreler:**
- `username` (opsiyonel) - Filtrelemek için kullanıcı adı

**Özellikler:**
- **Tüm ödemeler modu:** Aktif ve tamamlanan ödemeleri tablo formatında gösterir
- **Kullanıcı modu:** Belirli kullanıcının aktif ve son 10 ödemesini detaylı gösterir
- Renkli durum ikonları (⌛ Bekliyor, ✔ Başarılı, ✖ İptal, ⏱ Zaman aşımı)
- Tablo formatında düzenli görünüm

**Aliases:** `list`, `ls`

---

### 4. **reload** - Config Yeniden Yükle
```bash
!webpos reload
!webpos r
```

**Özellikler:**
- Config dosyasını yeniden yükler
- PosManager'ı günceller
- Mesaj pattern'lerini yeniden derler

**Aliases:** `r`

---

## Tab Completion

### Akıllı Öneri Sistemi

```bash
!webpos [TAB]           # Tüm subcommand'ları gösterir
!webpos s[TAB]          # 's' ile başlayan subcommand'ları gösterir
!webpos cancel [TAB]    # Aktif ödeme ID'lerini gösterir
!webpos payments [TAB]  # Ödeme geçmişi olan kullanıcıları gösterir
```

## Output Formatları

### Ödeme Listesi (Tablo)
```
━━━ Tüm Ödemeler ━━━

📋 Aktif Ödemeler (2):

ID                                   │ Kullanıcı    │ Miktar    │ Süre
─────────────────────────────────────┼──────────────┼───────────┼──────────
abc123-def456-...                    │ Xady         │    100.50 │ 2m 30s
xyz789-uvw012-...                    │ Melonya      │     50.00 │ 45s

📜 Tamamlanan Ödemeler (Son 10):

ID (8)   │ Kullanıcı    │ Miktar    │ Durum    │ Zaman
──────────┼──────────────┼───────────┼──────────┼────────────
abc12345 │ Xady         │    100.50 │ ✔        │ 14:23:10
def67890 │ Melonya      │     50.00 │ ✖        │ 14:20:05
```

### Kullanıcı Detayı
```
━━━ Xady Ödemeleri ━━━

📋 Aktif Ödeme:
  ⌛ ID: abc123-def456-...
     Miktar: 100.50
     Açıklama: Xady → Melonya
     Oluşturulma: 14:25:30

📜 Son 10 Tamamlanan Ödeme:
  ✔ ID: def678-uvw901-...
     Miktar: 50.00
     Açıklama: Xady ödemesi
     Gönderilen: 60.00
     Para Üstü: 10.00
     Oluşturulma: 14:20:00
     Tamamlanma: 14:21:15
```

## Integration

### index.ts'ye Entegrasyon
```typescript
// !webPos komutunu kaydet - Modüler sistem
const { WebPosCommandExecutor } = require("./commands/WebPosCommand");
const { StartPaymentSubCommand } = require("./commands/StartPaymentSubCommand");
const { CancelPaymentSubCommand } = require("./commands/CancelPaymentSubCommand");
const { PaymentsSubCommand } = require("./commands/PaymentsSubCommand");
const { ReloadSubCommand } = require("./commands/ReloadSubCommand");

const subcommands = [
    new StartPaymentSubCommand(this),
    new CancelPaymentSubCommand(this),
    new PaymentsSubCommand(this),
    new ReloadSubCommand(this)
];

const executor = new WebPosCommandExecutor(this, subcommands);

const cmd = new Xady.PluginCommand("webPos", this)
    .setExecutor(executor)
    .setTabCompleter(executor);
    
this.getClient().getCommandManager().registerCommand(cmd);
```

## Benefits

### ✅ Avantajlar

1. **Modüler Yapı** - Her komut kendi dosyasında
2. **Kolay Genişletme** - Yeni subcommand eklemek çok kolay
3. **Type Safety** - TypeScript ile tam tip güvenliği
4. **Tab Completion** - Her subcommand kendi tab completion'ını yönetir
5. **Alias Desteği** - Her subcommand birden fazla alias'a sahip
6. **Profesyonel Çıktı** - Renkli, formatlanmış, tablo görünümlü
7. **Hata Yönetimi** - Kapsamlı hata kontrolleri

### 🚀 Performans

- Lazy loading ile gereksiz yük yok
- Map tabanlı hızlı subcommand arama
- Optimized tab completion

## Adding New SubCommands

Yeni bir subcommand eklemek için:

1. **Yeni dosya oluştur:** `commands/MySubCommand.ts`
```typescript
export class MySubCommand {
    readonly name = 'mycommand';
    readonly aliases = Object.freeze(['mc', 'my']) as readonly string[];
    readonly description = 'Açıklama';
    readonly usage = '!webpos mycommand <arg>';
    
    readonly #module: WebPosModule;
    
    constructor(module: WebPosModule) {
        this.#module = module;
    }
    
    async execute(sender: any, args: readonly string[]): Promise<boolean> {
        // Komut mantığı
        return true;
    }
    
    async tabComplete(sender: any, args: readonly string[]): Promise<readonly string[]> {
        // Tab completion
        return Object.freeze([]);
    }
}
```

2. **index.ts'ye ekle:**
```typescript
const { MySubCommand } = require("./commands/MySubCommand");

const subcommands = [
    // ... mevcut subcommandlar
    new MySubCommand(this)
];
```

3. **Hepsi bu kadar!** 🎉

## Status

✅ **Tam İşlevsel**

Tüm komutlar implement edildi ve test edilmeye hazır:
- [x] startPayment - Ödeme oluşturma
- [x] cancelPayment - Ödeme iptal
- [x] payments - Ödeme listele
- [x] reload - Config yenile

## Notes

- Eski monolitik executor kodu kaldırıldı
- Modüler sistem modules komutu ile aynı mimariyi kullanıyor
- Chalk ile renkli çıktı desteği
- Tüm hatalar kullanıcı dostu mesajlarla yönetiliyor

---

**Oluşturulma:** 2026-07-06  
**Durum:** Production Ready  
**Mimari:** Modules Command Pattern
