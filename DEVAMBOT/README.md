# 🎮 DEVAMBOT - Minecraft Bot Yönetim Paneli

## 📋 Proje Hakkında
DEVAMBOT, web tabanlı bir Minecraft bot yönetim panelidir. Railway.app üzerinde kolayca deploy edilebilir.

## ✨ Özellikler
- 👤 Kullanıcı giriş sistemi (10 hazır hesap)
- 🤖 Bot ekleme, silme, başlatma, durdurma
- 💬 Gerçek zamanlı chat görüntüleme
- 🔄 Otomatik mesaj gönderme
- 📊 Bot durumu takibi (sağlık, açlık, konum)
- 🎨 Modern ve responsive arayüz

## 🔐 Hazır Hesaplar

| Kullanıcı Adı | Şifre |
|---------------|-------|
| devam1 | Devam2024! |
| devam2 | Bot2024Tr! |
| devam3 | Panel2024! |
| devam4 | Craft2024! |
| devam5 | Mine2024Tr! |
| devam6 | Server2024! |
| devam7 | Game2024Tr! |
| devam8 | Play2024! |
| devam9 | Admin2024! |
| devam10 | Super2024! |

## 🚀 Railway.app Deploy

### Adım 1: GitHub'a Yükle
```bash
git init
git add .
git commit -m "DEVAMBOT initial commit"
git branch -M main
git remote add origin https://github.com/KULLANICI/devambot.git
git push -u origin main
```

### Adım 2: Railway.app
1. [Railway.app](https://railway.app) sitesine git
2. GitHub ile giriş yap
3. "New Project" → "Deploy from GitHub repo"
4. DEVAMBOT reposunu seç
5. Deploy otomatik başlayacak!

### Adım 3: Domain Al
1. Settings → Networking
2. "Generate Domain" butonuna tıkla
3. Verilen URL ile panele eriş

## 💡 Kullanım

1. Panele giriş yap (yukarıdaki hesaplardan biri ile)
2. "Yeni Bot Ekle" formunu doldur:
   - Bot Adı: İstediğin bir isim
   - Sunucu Adresi: Minecraft sunucusu IP'si
   - Port: Genelde 25565
   - Bot Kullanıcı Adı: Oyunda görünecek isim
   - Versiyon: Sunucu versiyonu (1.21.1)
   - Şifre Komutu: `/login şifre` veya `/register şifre şifre`
   - Ek Komutlar: `/spawn, /warp afk` gibi
3. "Bot Ekle" butonuna tıkla
4. Eklenen botun "Başlat" butonuna tıkla
5. "Chat" butonu ile chat penceresini aç

## ⚠️ Limitler
- Her kullanıcı maksimum 10 bot ekleyebilir
- Railway ücretsiz plan: Ayda 500 saat (~21 gün)
- Önerilen bot sayısı: 10-15 (toplam)

## 🛠️ Teknik Bilgiler
- **Backend:** Node.js + Express
- **Database:** SQLite (better-sqlite3)
- **Bot Engine:** Mineflayer
- **Session:** express-session
- **Şifreleme:** bcrypt

## 📁 Dosya Yapısı
```
DEVAMBOT/
├── server.js          # Ana sunucu dosyası
├── package.json       # Bağımlılıklar
├── public/
│   └── index.html     # Web arayüzü
├── railway.json       # Railway yapılandırması
├── nixpacks.toml      # Build yapılandırması
├── Procfile           # Process dosyası
└── README.md          # Bu dosya
```

## 🔧 Lokal Geliştirme
```bash
npm install
npm start
# http://localhost:3000 adresine git
```

---
**DEVAMBOT** - Minecraft AFK Bot Yönetim Paneli 🎮
