// === Kontrolcü Socket.IO Bağlantısı ===
// Sunucuya WebSocket bağlantısı kurar (telefon tarafı).

import { io, Socket } from 'socket.io-client';

// Sunucu adresi — aynı bilgisayarın IP adresi, port 3001
// Telefon tarayıcısından bağlanırken bilgisayarın yerel ağ IP'si kullanılır
const getServerUrl = (): string => {
  // Production: VITE_SERVER_URL env değişkeni Render'da build sırasında ayarlanır
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }
  // Geliştirme ortamı: telefon aynı WiFi'dan bilgisayarın IP'siyle erişir,
  // dinamik olarak aynı host üzerinden sunucuya bağlanır
  const host = window.location.hostname;
  return `http://${host}:3001`;
};

// Socket.IO istemcisi oluştur
export const socket: Socket = io(getServerUrl(), {
  autoConnect: false, // Oda kodunu girdikten sonra bağlanacak
  reconnection: true, // Bağlantı koparsa tekrar dene
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
});
