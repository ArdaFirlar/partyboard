// === PartyBoard Sunucu (Server) ===
// Express + Socket.IO ile çalışan ana sunucu dosyası.

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';

// .env dosyasındaki değişkenleri yükle
dotenv.config({ path: '../../.env' });

// Express uygulaması oluştur
const app = express();

// HTTP sunucusu oluştur (Socket.IO için gerekli)
const server = http.createServer(app);

// Socket.IO sunucusu oluştur
const io = new SocketIOServer(server, {
  cors: {
    // Geliştirme ortamında tüm kaynaklara izin ver
    origin: ['http://localhost:3000', 'http://localhost:3002'],
    methods: ['GET', 'POST'],
  },
});

// Middleware'ler (ara katmanlar)
app.use(cors()); // Farklı portlardan gelen isteklere izin ver
app.use(express.json()); // JSON isteklerini anla

// Sunucu portu (.env'den veya varsayılan 3001)
const PORT = process.env.PORT || 3001;

// --- API Rotaları ---

// Sağlık kontrolü (health check) - sunucunun çalıştığını doğrular
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    message: 'PartyBoard sunucusu çalışıyor!',
    timestamp: new Date().toISOString(),
  });
});

// --- Socket.IO Bağlantı Yönetimi ---
io.on('connection', (socket) => {
  console.log(`[Socket] Yeni bağlantı: ${socket.id}`);

  // Bağlantı koptuğunda
  socket.on('disconnect', (reason) => {
    console.log(`[Socket] Bağlantı koptu: ${socket.id} (${reason})`);
  });
});

// --- Sunucuyu Başlat ---
server.listen(PORT, () => {
  console.log('');
  console.log('🎮 PartyBoard Sunucusu Başlatıldı!');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log(`❤️  Sağlık kontrolü: http://localhost:${PORT}/api/health`);
  console.log('');
});
