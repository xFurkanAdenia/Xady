# Xady Framework Documentation

Bu klasör Xady Framework'ün resmi dokümantasyon sitesini içerir.

## 📁 İçerik

- **index.html** - Ana dokümantasyon sayfası
- **style.css** - Sade ve şık GitBook-benzeri tema
- **script.js** - Navigasyon ve interaktif özellikler

## 🚀 Kullanım

### Tarayıcıda Açma

```bash
# Doğrudan index.html'i tarayıcıda aç
start docs/index.html  # Windows
open docs/index.html   # macOS
xdg-open docs/index.html  # Linux
```

### Yerel Sunucu (Önerilen)

```bash
# Python 3
cd docs
python -m http.server 8000

# Node.js (http-server)
npx http-server docs -p 8000

# PHP
cd docs
php -S localhost:8000
```

Ardından http://localhost:8000 adresini aç.

## 📚 İçerik

### Başlangıç
- Giriş ve özellikler
- Kurulum
- Hızlı başlangıç

### Modül Sistemi
- Modül temelleri
- Yaşam döngüsü
- module.yml konfigürasyonu

### Event System
- Event temelleri
- Listener oluşturma
- Priority sistemi

### Command System
- Komut temelleri
- Executor oluşturma

### Chat Patterns
- Pattern matching
- Regex örnekleri
- Gerçek dünya kullanımı

### API Reference
- Module Class
- Event System API
- Command System API

## 🎨 Tasarım

- **Sade ve şık**: Gereksiz süslemeler yok
- **GitBook-benzeri**: Profesyonel dokümantasyon görünümü
- **Responsive**: Mobil uyumlu
- **Kolay navigasyon**: Sol sidebar ile hızlı erişim
- **Kod kopyalama**: Her kod bloğunda kopyala butonu
- **Smooth scroll**: Akıcı geçişler

## 🔧 Özelleştirme

### Renk Teması

`style.css` dosyasındaki CSS değişkenlerini düzenle:

```css
:root {
    --primary: #2563eb;          /* Ana renk */
    --bg: #ffffff;                /* Arka plan */
    --text: #1e293b;              /* Metin */
    --border: #e2e8f0;            /* Kenarlık */
}
```

### İçerik Ekleme

`index.html` içinde yeni `<section>` ekle:

```html
<section id="yeni-bolum">
    <h1>Yeni Bölüm</h1>
    <p>İçerik...</p>
</section>
```

Sidebar'a link ekle:

```html
<a href="#yeni-bolum" class="nav-link">Yeni Bölüm</a>
```

## 📦 Deployment

### GitHub Pages

```bash
# docs klasörünü main branch'e push et
git add docs/
git commit -m "Add documentation"
git push origin main

# GitHub'da Settings > Pages > Source: main branch /docs klasörü
```

### Netlify / Vercel

```bash
# docs klasörünü root olarak ayarla
# Build command: (boş)
# Publish directory: docs
```

## 🔍 Arama Özelliği

Gelişmiş arama için `script.js` içinde search fonksiyonunu genişletebilirsin.

## 📝 Notlar

- **Yapay zeka görünümü YOK**: Sade, profesyonel tasarım
- **Gereksiz animasyon YOK**: Sadece smooth scroll
- **Kod highlight**: Basit ama etkili
- **Sidebar navigation**: Her zaman görünür

## 🛠 Geliştirme

```bash
# HTML/CSS/JS değişikliklerini yap
# Tarayıcıda F5 ile yenile
# Değişiklikleri commit et
```

## 📄 Lisans

Xady Framework © 2026