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
  icon: string; // Oyun ikonu (emoji)
}

// --- Taş-Kağıt-Makas tipleri ---

// Oyuncu seçenekleri
export type RPSChoice = 'rock' | 'paper' | 'scissors';

// Tur sonucu
export interface RPSRoundResult {
  player1Id: string;
  player1Choice: RPSChoice;
  player2Id: string;
  player2Choice: RPSChoice;
  winnerId: string | null; // null = berabere
}

// Oyun durumu (ana ekrana gönderilir)
export interface RPSGameState {
  phase: 'waiting' | 'choosing' | 'reveal' | 'finished'; // Oyun aşaması
  round: number; // Mevcut tur numarası
  bestOf: number; // Kaç turda biter (3 veya 5)
  scores: Record<string, number>; // Oyuncu ID -> skor
  players: { id: string; name: string; avatar: string }[]; // 2 oyuncu
  currentRound?: RPSRoundResult; // Son tur sonucu (reveal aşamasında)
  choices: Record<string, boolean>; // Oyuncu ID -> seçim yaptı mı (seçimin kendisi gizli)
  winnerId?: string; // Oyun kazananı (finished aşamasında)
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

  // Durum isteme (istemci açıldığında mevcut oyun durumunu almak için)
  GAME_REQUEST_STATE: 'game:requestState',

  // Oda sahibi oyun bittikten sonra lobiye dönmek istediğinde
  GAME_RETURN_LOBBY: 'game:returnToLobby',

  // Oda sahibi oyunu duraklatır / devam ettirir
  HOST_PAUSE: 'host:pause',
  HOST_RESUME: 'host:resume',

  // Oda sahibi oyun ortasında çıkıp lobiye döner
  HOST_FORCE_EXIT: 'host:forceExit',

  // Oda sahibi oyunu yeniden başlatır
  HOST_RESTART_GAME: 'host:restartGame',

  // Dil değişikliği (oda sahibi dilini değiştirince herkese yayınlanır)
  LANG_CHANGE: 'lang:change',

  // Bağlantı kopma / yeniden bağlanma
  PLAYER_RECONNECTED: 'player:reconnected',
  PLAYER_DISCONNECTED: 'player:disconnected', // Geçici kopma
  HOST_KICK_PLAYER: 'host:kickPlayer',        // Host oyuncuyu eler
} as const;

// --- Monopoly ---
export * from './monopoly';

// --- Oyun İstatistikleri ---

export interface MonopolyStats {
  totalTurns: number;                         // Toplam tur sayısı
  playerStats: MonopolyPlayerStat[];          // Oyuncu bazlı istatistikler
  mostVisitedSquare: { name: string; count: number }; // En çok ziyaret edilen kare
  totalDoubles: number;                       // Toplam çift zar sayısı
  totalJailVisits: number;                    // Toplam hapis ziyareti
}

export interface MonopolyPlayerStat {
  id: string;
  name: string;
  avatar: string;
  color: string;
  finalMoney: number;         // Oyun sonu parası
  propertiesOwned: number;    // Sahip olunan mülk sayısı
  rentCollected: number;      // Toplam kira geliri
  rentPaid: number;           // Toplam kira gideri
  timesInJail: number;        // Hapishaneye girme sayısı
  doublesRolled: number;      // Çift zar sayısı
  isBankrupt: boolean;
  rank: number;               // Sıralama (para + mülk değerine göre)
}

// Liderlik tablosu satırı
export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatar: string;
  wins: number;
  gamesPlayed: number;
  winRate: number;  // 0-100
  gameId?: string;  // Hangi oyun için (null = genel)
}

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
