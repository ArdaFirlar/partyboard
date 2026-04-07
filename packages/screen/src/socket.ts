// === Ana Ekran Socket.IO Bağlantısı ===
// Sunucuya WebSocket bağlantısı kurar.

import { io, Socket } from 'socket.io-client';

// Sunucu adresi — geliştirme ortamında localhost:3001
const SERVER_URL = 'http://localhost:3001';

// Socket.IO istemcisi oluştur
export const socket: Socket = io(SERVER_URL, {
  autoConnect: false, // Sayfa açılınca otomatik bağlanmasın, biz kontrol edelim
  reconnection: true, // Bağlantı koparsa tekrar dene
  reconnectionAttempts: 10, // En fazla 10 kere dene
  reconnectionDelay: 1000, // Her deneme arasında 1 saniye bekle
});
