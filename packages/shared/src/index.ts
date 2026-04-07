// === PartyBoard Shared (Ortak) Modül ===
// Tüm paketlerin kullanacağı ortak tipler, enum'lar ve yardımcı fonksiyonlar burada.

// --- Oyuncu bilgileri ---
export interface Player {
  id: string; // Benzersiz oyuncu kimliği (unique player ID)
  name: string; // Oyuncu adı
  avatar: string; // Avatar tanımlayıcı (avatar identifier)
  isHost: boolean; // Oda sahibi mi? (is room host?)
}

// --- Oda bilgileri ---
export interface Room {
  code: string; // 6 haneli oda kodu (6-digit room code)
  players: Player[]; // Odadaki oyuncular
  hostId: string; // Oda sahibinin ID'si
  gameId: string | null; // Seçili oyun (null = henüz seçilmedi)
  status: RoomStatus; // Oda durumu
  maxPlayers: number; // Maksimum oyuncu sayısı
  createdAt: number; // Oluşturulma zamanı (timestamp)
  lastActivity: number; // Son aktivite zamanı (timestamp)
}

// --- Oda durumu ---
export enum RoomStatus {
  LOBBY = 'lobby', // Lobide bekleniyor
  PLAYING = 'playing', // Oyun devam ediyor
  FINISHED = 'finished', // Oyun bitti
}

// --- Oyun modülü manifest yapısı ---
export interface GameManifest {
  id: string; // Oyun kimliği (ör: "rock-paper-scissors")
  name: string; // Oyun adı
  description: string; // Oyun açıklaması
  minPlayers: number; // Minimum oyuncu sayısı
  maxPlayers: number; // Maksimum oyuncu sayısı
  version: string; // Oyun versiyonu
}

// --- WebSocket olay isimleri ---
// Tüm socket.io olaylarını tek yerden yönetmek için sabitler (constants)
export const SocketEvents = {
  // Oda olayları
  ROOM_CREATE: 'room:create',
  ROOM_JOIN: 'room:join',
  ROOM_LEAVE: 'room:leave',

  // Oyuncu olayları
  PLAYER_JOINED: 'player:joined',
  PLAYER_LEFT: 'player:left',
  PLAYER_DISCONNECT: 'player:disconnect',
  PLAYER_PRIVATE: 'player:private',

  // Oyun olayları
  GAME_SELECT: 'game:select',
  GAME_START: 'game:start',
  GAME_STATE: 'game:state',
  GAME_END: 'game:end',

  // Kontrolcü olayları
  CONTROLLER_INPUT: 'controller:input',
} as const;

// --- Yardımcı fonksiyonlar ---

/**
 * 6 haneli rastgele oda kodu üretir (büyük harf + rakam)
 * Örnek: "AB3K9X"
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Karışıklık yaratan karakterler çıkarıldı (0/O, 1/I)
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}
