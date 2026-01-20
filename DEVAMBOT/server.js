const express = require("express");
const session = require("express-session");
const bcrypt = require("bcrypt");
const Database = require("better-sqlite3");
const mineflayer = require("mineflayer");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// Veritabanı oluştur
const db = new Database("devambot.db");

// Tabloları oluştur
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS bots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    bot_name TEXT NOT NULL,
    host TEXT NOT NULL,
    port INTEGER DEFAULT 25565,
    bot_username TEXT NOT NULL,
    version TEXT DEFAULT '1.21.1',
    password_cmd TEXT,
    extra_commands TEXT,
    auto_message TEXT,
    auto_interval INTEGER DEFAULT 60,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );
`);

// 10 Varsayılan Kullanıcı Oluştur
const defaultUsers = [
  { username: "devam1", password: "Devam2024!" },
  { username: "devam2", password: "Bot2024Tr!" },
  { username: "devam3", password: "Panel2024!" },
  { username: "devam4", password: "Craft2024!" },
  { username: "devam5", password: "Mine2024Tr!" },
  { username: "devam6", password: "Server2024!" },
  { username: "devam7", password: "Game2024Tr!" },
  { username: "devam8", password: "Play2024!" },
  { username: "devam9", password: "Admin2024!" },
  { username: "devam10", password: "Super2024!" }
];

// Kullanıcıları ekle (yoksa)
const insertUser = db.prepare("INSERT OR IGNORE INTO users (username, password) VALUES (?, ?)");
defaultUsers.forEach(user => {
  const hashedPassword = bcrypt.hashSync(user.password, 10);
  insertUser.run(user.username, hashedPassword);
});

console.log("✅ 10 varsayılan kullanıcı hazır!");

// Aktif botları tutacak obje
const activeBots = {};

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));
app.use(session({
  secret: "devambot-super-secret-key-2024",
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    maxAge: 24 * 60 * 60 * 1000 // 24 saat
  }
}));

// Auth middleware
function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ success: false, mesaj: "Giriş yapmalısınız!" });
  }
  next();
}

// ==================== AUTH ROUTES ====================

// Giriş yap
app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ success: false, mesaj: "Kullanıcı adı ve şifre gerekli!" });
    }

    const user = db.prepare("SELECT * FROM users WHERE username = ?").get(username);
    
    if (!user) {
      return res.status(401).json({ success: false, mesaj: "Kullanıcı bulunamadı!" });
    }

    if (!bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ success: false, mesaj: "Şifre yanlış!" });
    }

    req.session.userId = user.id;
    req.session.username = user.username;

    console.log(`✅ ${username} giriş yaptı`);
    res.json({ success: true, mesaj: "Giriş başarılı!", username: user.username });
  } catch (err) {
    console.error("Login hatası:", err);
    res.status(500).json({ success: false, mesaj: "Sunucu hatası!" });
  }
});

// Çıkış yap
app.post("/api/auth/logout", (req, res) => {
  const username = req.session.username;
  req.session.destroy();
  console.log(`👋 ${username} çıkış yaptı`);
  res.json({ success: true, mesaj: "Çıkış yapıldı!" });
});

// Oturum kontrolü
app.get("/api/auth/check", (req, res) => {
  if (req.session.userId) {
    res.json({ 
      success: true, 
      loggedIn: true, 
      username: req.session.username 
    });
  } else {
    res.json({ success: true, loggedIn: false });
  }
});

// ==================== BOT CRUD ROUTES ====================

// Kullanıcının botlarını listele
app.get("/api/bots", requireAuth, (req, res) => {
  try {
    const bots = db.prepare("SELECT * FROM bots WHERE user_id = ?").all(req.session.userId);
    
    // Aktif bot durumlarını ekle
    const botsWithStatus = bots.map(bot => {
      const botKey = `${req.session.userId}_${bot.id}`;
      const activeBot = activeBots[botKey];
      return {
        ...bot,
        isOnline: activeBot ? activeBot.status.bagli : false,
        status: activeBot ? activeBot.status : null
      };
    });

    res.json({ success: true, bots: botsWithStatus });
  } catch (err) {
    console.error("Bot listesi hatası:", err);
    res.status(500).json({ success: false, mesaj: "Botlar alınamadı!" });
  }
});

// Yeni bot ekle
app.post("/api/bots", requireAuth, (req, res) => {
  try {
    const { bot_name, host, port, bot_username, version, password_cmd, extra_commands } = req.body;

    if (!bot_name || !host || !bot_username) {
      return res.status(400).json({ success: false, mesaj: "Bot adı, sunucu ve kullanıcı adı gerekli!" });
    }

    // Kullanıcının bot sayısını kontrol et (max 10)
    const botCount = db.prepare("SELECT COUNT(*) as count FROM bots WHERE user_id = ?").get(req.session.userId);
    if (botCount.count >= 10) {
      return res.status(400).json({ success: false, mesaj: "Maksimum 10 bot ekleyebilirsiniz!" });
    }

    const result = db.prepare(`
      INSERT INTO bots (user_id, bot_name, host, port, bot_username, version, password_cmd, extra_commands)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      req.session.userId,
      bot_name,
      host,
      port || 25565,
      bot_username,
      version || "1.21.1",
      password_cmd || "",
      extra_commands || ""
    );

    console.log(`✅ ${req.session.username} yeni bot ekledi: ${bot_name}`);
    res.json({ success: true, mesaj: "Bot eklendi!", botId: result.lastInsertRowid });
  } catch (err) {
    console.error("Bot ekleme hatası:", err);
    res.status(500).json({ success: false, mesaj: "Bot eklenemedi!" });
  }
});

// Bot sil
app.delete("/api/bots/:id", requireAuth, (req, res) => {
  try {
    const botId = parseInt(req.params.id);
    const botKey = `${req.session.userId}_${botId}`;

    // Aktif botu durdur
    if (activeBots[botKey]) {
      if (activeBots[botKey].bot) {
        activeBots[botKey].bot.end();
      }
      if (activeBots[botKey].autoInterval) {
        clearInterval(activeBots[botKey].autoInterval);
      }
      delete activeBots[botKey];
    }

    const result = db.prepare("DELETE FROM bots WHERE id = ? AND user_id = ?").run(botId, req.session.userId);
    
    if (result.changes === 0) {
      return res.status(404).json({ success: false, mesaj: "Bot bulunamadı!" });
    }

    console.log(`🗑️ ${req.session.username} bot sildi: #${botId}`);
    res.json({ success: true, mesaj: "Bot silindi!" });
  } catch (err) {
    console.error("Bot silme hatası:", err);
    res.status(500).json({ success: false, mesaj: "Bot silinemedi!" });
  }
});

// ==================== BOT CONTROL ROUTES ====================

// Bot başlat
app.post("/api/bots/:id/start", requireAuth, (req, res) => {
  try {
    const botId = parseInt(req.params.id);
    const botKey = `${req.session.userId}_${botId}`;

    // Bot bilgilerini al
    const botData = db.prepare("SELECT * FROM bots WHERE id = ? AND user_id = ?").get(botId, req.session.userId);
    
    if (!botData) {
      return res.status(404).json({ success: false, mesaj: "Bot bulunamadı!" });
    }

    // Zaten aktif mi?
    if (activeBots[botKey] && activeBots[botKey].status.bagli) {
      return res.status(400).json({ success: false, mesaj: "Bot zaten çalışıyor!" });
    }

    // Bot durumu objesi
    const botStatus = {
      bagli: false,
      mesaj: "Bağlanıyor...",
      saglik: 0,
      yemek: 0,
      konum: { x: 0, y: 0, z: 0 },
      chatLog: [],
      otoYazmaAktif: false
    };

    // Mineflayer bot oluştur
    const bot = mineflayer.createBot({
      host: botData.host,
      port: botData.port || 25565,
      username: botData.bot_username,
      version: botData.version || "1.21.1",
      auth: "offline"
    });

    let sifreGonderildi = false;

    bot.once("login", () => {
      console.log(`🔐 [${botData.bot_name}] Login eventi!`);
      if (botData.password_cmd && !sifreGonderildi) {
        setTimeout(() => {
          bot.chat(botData.password_cmd);
          sifreGonderildi = true;
          console.log(`🔑 [${botData.bot_name}] Şifre gönderildi`);
        }, 100);
      }
    });

    bot.on("spawn", () => {
      botStatus.bagli = true;
      botStatus.mesaj = "✅ Bağlandı!";
      console.log(`✅ [${botData.bot_name}] Spawn oldu!`);

      if (botData.password_cmd && !sifreGonderildi) {
        setTimeout(() => {
          bot.chat(botData.password_cmd);
          sifreGonderildi = true;
        }, 500);
      }

      // Ek komutları gönder
      if (botData.extra_commands) {
        const commands = botData.extra_commands.split(",").map(c => c.trim()).filter(c => c);
        commands.forEach((cmd, i) => {
          setTimeout(() => {
            bot.chat(cmd);
            console.log(`📤 [${botData.bot_name}] Komut: ${cmd}`);
          }, 2000 + i * 500);
        });
      }
    });

    bot.on("health", () => {
      botStatus.saglik = Math.round(bot.health);
      botStatus.yemek = Math.round(bot.food);
    });

    bot.on("move", () => {
      if (bot.entity && bot.entity.position) {
        botStatus.konum = {
          x: Math.round(bot.entity.position.x),
          y: Math.round(bot.entity.position.y),
          z: Math.round(bot.entity.position.z)
        };
      }
    });

    bot.on("chat", (username, message) => {
      const chatMsg = `${username}: ${message}`;
      botStatus.chatLog.push(chatMsg);
      if (botStatus.chatLog.length > 50) {
        botStatus.chatLog.shift();
      }
    });

    bot.on("error", (err) => {
      console.error(`❌ [${botData.bot_name}] Hata:`, err.message);
      botStatus.bagli = false;
      botStatus.mesaj = "❌ Bağlantı hatası";
    });

    bot.on("kicked", (reason) => {
      console.log(`⚠️ [${botData.bot_name}] Atıldı:`, reason);
      botStatus.bagli = false;
      botStatus.mesaj = "⚠️ Sunucudan atıldı";
    });

    bot.on("end", () => {
      console.log(`🔴 [${botData.bot_name}] Bağlantı kesildi`);
      botStatus.bagli = false;
      botStatus.mesaj = "🔴 Bağlantı kesildi";
    });

    // Aktif botlar listesine ekle
    activeBots[botKey] = {
      bot: bot,
      status: botStatus,
      autoInterval: null
    };

    console.log(`🚀 ${req.session.username} bot başlattı: ${botData.bot_name}`);
    res.json({ success: true, mesaj: "Bot başlatılıyor..." });
  } catch (err) {
    console.error("Bot başlatma hatası:", err);
    res.status(500).json({ success: false, mesaj: "Bot başlatılamadı!" });
  }
});

// Bot durdur
app.post("/api/bots/:id/stop", requireAuth, (req, res) => {
  try {
    const botId = parseInt(req.params.id);
    const botKey = `${req.session.userId}_${botId}`;

    if (!activeBots[botKey]) {
      return res.status(400).json({ success: false, mesaj: "Bot zaten kapalı!" });
    }

    if (activeBots[botKey].bot) {
      activeBots[botKey].bot.end();
    }
    if (activeBots[botKey].autoInterval) {
      clearInterval(activeBots[botKey].autoInterval);
    }

    activeBots[botKey].status.bagli = false;
    activeBots[botKey].status.mesaj = "Bot durduruldu";

    delete activeBots[botKey];

    console.log(`⏹️ ${req.session.username} bot durdurdu: #${botId}`);
    res.json({ success: true, mesaj: "Bot durduruldu!" });
  } catch (err) {
    console.error("Bot durdurma hatası:", err);
    res.status(500).json({ success: false, mesaj: "Bot durdurulamadı!" });
  }
});

// Bot durumu
app.get("/api/bots/:id/status", requireAuth, (req, res) => {
  try {
    const botId = parseInt(req.params.id);
    const botKey = `${req.session.userId}_${botId}`;

    if (!activeBots[botKey]) {
      return res.json({
        success: true,
        status: {
          bagli: false,
          mesaj: "Bot kapalı",
          saglik: 0,
          yemek: 0,
          konum: { x: 0, y: 0, z: 0 },
          chatLog: [],
          otoYazmaAktif: false
        }
      });
    }

    res.json({ success: true, status: activeBots[botKey].status });
  } catch (err) {
    console.error("Durum hatası:", err);
    res.status(500).json({ success: false, mesaj: "Durum alınamadı!" });
  }
});

// Bot chat gönder
app.post("/api/bots/:id/chat", requireAuth, (req, res) => {
  try {
    const botId = parseInt(req.params.id);
    const botKey = `${req.session.userId}_${botId}`;
    const { mesaj } = req.body;

    if (!activeBots[botKey] || !activeBots[botKey].status.bagli) {
      return res.status(400).json({ success: false, mesaj: "Bot bağlı değil!" });
    }

    activeBots[botKey].bot.chat(mesaj);
    res.json({ success: true, mesaj: "Mesaj gönderildi!" });
  } catch (err) {
    console.error("Chat hatası:", err);
    res.status(500).json({ success: false, mesaj: "Mesaj gönderilemedi!" });
  }
});

// Otomatik mesaj başlat
app.post("/api/bots/:id/auto-chat/start", requireAuth, (req, res) => {
  try {
    const botId = parseInt(req.params.id);
    const botKey = `${req.session.userId}_${botId}`;
    const { metin, saniye } = req.body;

    if (!activeBots[botKey]) {
      return res.status(400).json({ success: false, mesaj: "Bot aktif değil!" });
    }

    // Varsa önceki interval'ı temizle
    if (activeBots[botKey].autoInterval) {
      clearInterval(activeBots[botKey].autoInterval);
    }

    activeBots[botKey].status.otoYazmaAktif = true;
    activeBots[botKey].status.otoYazmaMetin = metin;
    activeBots[botKey].status.otoYazmaSaniye = saniye;

    activeBots[botKey].autoInterval = setInterval(() => {
      if (activeBots[botKey] && activeBots[botKey].status.bagli) {
        activeBots[botKey].bot.chat(metin);
      }
    }, saniye * 1000);

    // Veritabanını güncelle
    db.prepare("UPDATE bots SET auto_message = ?, auto_interval = ? WHERE id = ?").run(metin, saniye, botId);

    res.json({ success: true, mesaj: "Otomatik mesaj başlatıldı!" });
  } catch (err) {
    console.error("Auto-chat hatası:", err);
    res.status(500).json({ success: false, mesaj: "Başlatılamadı!" });
  }
});

// Otomatik mesaj durdur
app.post("/api/bots/:id/auto-chat/stop", requireAuth, (req, res) => {
  try {
    const botId = parseInt(req.params.id);
    const botKey = `${req.session.userId}_${botId}`;

    if (!activeBots[botKey]) {
      return res.status(400).json({ success: false, mesaj: "Bot aktif değil!" });
    }

    if (activeBots[botKey].autoInterval) {
      clearInterval(activeBots[botKey].autoInterval);
      activeBots[botKey].autoInterval = null;
    }

    activeBots[botKey].status.otoYazmaAktif = false;

    res.json({ success: true, mesaj: "Otomatik mesaj durduruldu!" });
  } catch (err) {
    console.error("Auto-chat durdurma hatası:", err);
    res.status(500).json({ success: false, mesaj: "Durdurulamadı!" });
  }
});

// Ana sayfa
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Server başlat
app.listen(PORT, "0.0.0.0", () => {
  console.log("╔════════════════════════════════════════╗");
  console.log("║      🎮 DEVAMBOT - Minecraft Panel     ║");
  console.log("╠════════════════════════════════════════╣");
  console.log(`║  🚀 Server: http://0.0.0.0:${PORT}        ║`);
  console.log("║  📊 10 Kullanıcı Hesabı Hazır!         ║");
  console.log("╚════════════════════════════════════════╝");
});
