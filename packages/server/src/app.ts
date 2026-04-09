// === Express Uygulama Fabrikası ===
// Express app'ini oluşturur ve dışa aktarır.
// Bu şekilde index.ts sunucuyu başlatırken, testler sunucuyu başlatmadan app'i kullanabilir.

import express from 'express';
import cors from 'cors';
import { authRouter } from './auth/authRouter';
import { leaderboardRouter } from './leaderboardRouter';
import { roomManager } from './RoomManager';

export function createApp() {
  const app = express();

  // CORS: production'da sadece kendi frontend domain'lerimizden gelen isteklere izin ver.
  // ALLOWED_ORIGINS env değişkeni virgülle ayrılmış URL listesi içerir.
  // Geliştirme ortamında boş bırakılırsa tüm kaynaklara izin verilir.
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
    : '*';
  app.use(cors({ origin: allowedOrigins }));
  app.use(express.json()); // JSON isteklerini anla

  // Auth rotaları — /api/auth/register, /api/auth/login, /api/auth/guest, /api/auth/me
  app.use('/api/auth', authRouter);

  // Liderlik tablosu — /api/leaderboard?gameId=monopoly
  app.use('/api/leaderboard', leaderboardRouter);

  // Sağlık kontrolü (health check) - sunucunun çalıştığını doğrular
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      message: 'PartyBoard sunucusu çalışıyor!',
      activeRooms: roomManager.getActiveRoomCount(),
      timestamp: new Date().toISOString(),
    });
  });

  return app;
}
