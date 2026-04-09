// === PartyBoard Sunucu (Server) ===
// Express + Socket.IO ile çalışan ana sunucu dosyası.

import http from 'http';
import { Server as SocketIOServer } from 'socket.io';
import dotenv from 'dotenv';
import { setupSocketHandlers } from './socketHandler';
import { gameEngine } from './GameEngine';
import { RockPaperScissorsGame } from './games/RockPaperScissors';
import { MonopolyGame } from './games/Monopoly';
import { createApp } from './app';

// .env dosyasındaki değişkenleri yükle
dotenv.config({ path: '../../.env' });

// Express uygulaması oluştur
const app = createApp();

// HTTP sunucusu oluştur (Socket.IO için gerekli)
const server = http.createServer(app);

// CORS için izin verilen originler — production'da ALLOWED_ORIGINS env değişkeninden gelir
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : '*';

// Socket.IO sunucusu oluştur
const io = new SocketIOServer(server, {
  cors: {
    origin: allowedOrigins,
    methods: ['GET', 'POST'],
  },
  // Bağlantı koparma tespiti: varsayılan 20s yerine 5s
  // Telefon kapandığında oyuncu listesinden hızlıca çıkar
  pingTimeout: 5000,
  pingInterval: 10000,
});

// Sunucu portu (.env'den veya varsayılan 3001)
const PORT = process.env.PORT || 3001;

// --- Oyun Modüllerini Kaydet ---
gameEngine.registerGame('rock-paper-scissors', () => new RockPaperScissorsGame());
gameEngine.registerGame('monopoly', () => new MonopolyGame());

// --- Socket.IO Olaylarını Bağla ---
setupSocketHandlers(io);

// --- Sunucuyu Başlat ---
server.listen(PORT, () => {
  console.log('');
  console.log('🎮 PartyBoard Sunucusu Başlatıldı!');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔗 http://localhost:${PORT}`);
  console.log(`❤️  Sağlık kontrolü: http://localhost:${PORT}/api/health`);
  console.log('');
});
