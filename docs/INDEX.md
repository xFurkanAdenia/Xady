# 📚 Xady Documentation Index

## 📁 Dosya Yapısı

```
docs/
  ├─ index.html       # 🌐 Ana dokümantasyon sitesi (BAŞLANGIÇ NOKTASI)
  ├─ style.css        # 🎨 Sade ve şık GitBook-benzeri tema
  ├─ script.js        # ⚡ Navigasyon ve interaktif özellikler
  ├─ README.md        # 📖 Dokümantasyon kullanım rehberi
  ├─ FEATURES.md      # ✨ Özellik listesi ve teknik detaylar
  ├─ PREVIEW.txt      # 👁️ ASCII preview görsel
  └─ INDEX.md         # 📋 Bu dosya (genel bakış)
```

## 🚀 Hızlı Başlangıç

### Dokümantasyonu Aç

```bash
# Windows
start docs/index.html

# macOS
open docs/index.html

# Linux
xdg-open docs/index.html
```

### Yerel Sunucu (Önerilen)

```bash
cd docs
python -m http.server 8000
# Tarayıcıda: http://localhost:8000
```

## 📋 İçerik Rehberi

### 1. index.html - Ana Dokümantasyon

**15+ bölüm içerir:**

#### Başlangıç
- Giriş ve framework özellikleri
- Kurulum talimatları
- Hızlı başlangıç rehberi

#### Modül Sistemi
- Modül temelleri ve `Xady.Module` kullanımı
- Yaşam döngüsü (onLoad, onEnable, onDisable)
- module.yml konfigürasyonu

#### Event System
- Decorator pattern (`@Xady.EventHandler`)
- Priority sistemi (LOWEST → MONITOR)
- Listener oluşturma ve kaydetme

#### Command System
- module.yml'de komut tanımlama
- CommandExecutor interface
- Komut argümanları ve executor kullanımı

#### Chat Patterns ⭐
- Regex pattern matching
- Sunucu mesajlarını yakalama
- Gerçek dünya örnekleri:
  - Coin tracking
  - Teleport detection
  - Kill/death messages
  - Balance parsing

#### API Reference
- Module Class metodları (12+)
- Event System API
- Command System API

### 2. style.css - Tema

**Sade ve şık tasarım:**
- GitBook-benzeri profesyonel görünüm
- Sabit sol sidebar
- Responsive layout
- Custom scrollbar
- Temiz renk paleti
- Code block stilleri
- Info/success box'ları

### 3. script.js - İnteraktivite

**Özellikler:**
- Smooth scroll navigasyon
- Otomatik active link güncelleme
- Kod kopyalama (copy-to-clipboard)
- Section-based navigation
- Copy feedback ("✓ Kopyalandı")

### 4. README.md - Kullanım Rehberi

**İçerik:**
- Nasıl görüntülenir
- Nasıl deploy edilir (GitHub Pages, Netlify)
- Nasıl özelleştirilir
- Renk teması değiştirme
- Yeni bölüm ekleme

### 5. FEATURES.md - Teknik Detaylar

**İçerik:**
- Tamamlanan özellikler listesi
- İçerik yapısı
- Tasarım ilkeleri
- Kalite kontrol checklist
- Renk paleti
- İstatistikler

### 6. PREVIEW.txt - Görsel

**İçerik:**
- ASCII art preview
- Layout yapısı
- Özellik özeti
- Hızlı komutlar

## 📊 İstatistikler

| Özellik | Değer |
|---------|-------|
| Toplam Bölüm | 15+ |
| Kod Örneği | 25+ |
| API Metodu | 12+ |
| Dosya Sayısı | 6 |
| Toplam Boyut | ~150KB |
| Bağımlılık | 0 |
| Responsive | ✅ |
| Production-Ready | ✅ |

## 🎯 Hedef Kitle

1. **Xady Modül Geliştiricileri**
   - Yeni modül oluşturanlar
   - Mevcut modülleri güncelleyenler

2. **Minecraft Bot Geliştiricileri**
   - Mineflayer kullananlar
   - Bot otomasyon yapanlar

3. **Spigot/Bukkit Geliştiricileri**
   - MC plugin geçmişi olanlar
   - Tanıdık API arayanlar

4. **TypeScript/JavaScript Geliştiricileri**
   - Node.js bilgisi olanlar
   - Modern JS pattern arayanlar

## 🎨 Tasarım Felsefesi

### ✅ YAPILAN

- Sade ve profesyonel
- GitBook-benzeri layout
- Temiz typography
- Minimal distractions
- Code-focused
- Easy navigation
- Fast loading
- Accessible

### ❌ YAPILMAYAN

- Yapay zeka estetiği
- Gereksiz gradient'ler
- Aşırı animasyonlar
- Flash/shiny elements
- Karmaşık navigation
- External dependencies
- Heavy frameworks

## 🔍 Anahtar Özellikler

### Navigation
- ✅ Sabit sidebar (her zaman erişilebilir)
- ✅ Smooth scroll to section
- ✅ Active link highlight
- ✅ Section-based organization

### Code Blocks
- ✅ Syntax highlighting (basit)
- ✅ Copy button (her blokta)
- ✅ Language indicator
- ✅ Clean formatting
- ✅ Copy feedback

### Content
- ✅ 25+ çalışır örnek
- ✅ Her bölümde açıklama
- ✅ Best practices
- ✅ Real-world örnekler
- ✅ API reference

### Design
- ✅ Responsive (mobil uyumlu)
- ✅ Clean color palette
- ✅ Professional typography
- ✅ Info/success boxes
- ✅ Feature grid

## 📝 Kullanım Senaryoları

### 1. Yeni Başlayanlar
```
Giriş → Kurulum → Hızlı Başlangıç → Modül Temelleri
```

### 2. Event System Öğrenmek
```
Event Basics → Listener → Priority → Chat Patterns
```

### 3. Komut Oluşturmak
```
Command Basics → Executor → module.yml → Örnekler
```

### 4. API Reference
```
API Module → Event System → Command System
```

### 5. Chat Pattern Matching
```
Pattern Matching → Regex Örnekleri → Economy Tracker
```

## 🌐 Deployment

### GitHub Pages
```bash
git add docs/
git commit -m "Add documentation"
git push origin main
# Settings > Pages > /docs folder
```

### Netlify
```
Build: (empty)
Publish: docs
```

### Vercel
```
Output: docs
Framework: Other
```

## 🔧 Özelleştirme

### Renkleri Değiştir
`style.css` > `:root` değişkenlerini düzenle

### İçerik Ekle
`index.html` > Yeni `<section>` ekle + sidebar link

### Dil Değiştir
HTML içeriğini çevir (structure aynı kalır)

## ✨ Sonuç

**Xady için kapsamlı, sade ve şık dokümantasyon sitesi hazır!**

- 🎯 Production-ready
- 📚 Eksiksiz içerik
- 🎨 Professional tasarım
- ⚡ Hızlı ve responsive
- 🔍 Kolay navigasyon
- 💻 25+ kod örneği
- 📦 Deploy hazır
- 🌐 Standalone (no deps)

**Şimdi görüntüle:**
```bash
start docs/index.html
```

Veya:
```bash
cd docs && python -m http.server 8000
```