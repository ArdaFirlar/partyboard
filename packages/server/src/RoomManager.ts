// === Oda Yöneticisi (Room Manager) ===
// Odaları oluşturma, katılma, ayrılma ve temizleme işlemlerini yönetir.
// Şu an bellekte (memory) tutuluyor. İleride Redis'e geçiş yapılabilir.

import { Room, Player, RoomStatus, generateRoomCode } from '@partyboard/shared';

// Oda sahibinin (host) socket ID'sini de tutmak için genişletilmiş oda tipi
export interface ServerRoom extends Omit<Room, 'players'> {
  hostSocketId: string; // Oda sahibinin socket bağlantı kimliği
  players: ServerPlayer[]; // Oyuncu listesi (socket ID dahil)
}

// Oyuncu bilgisi + socket ID eşleştirmesi
export interface ServerPlayer extends Player {
  socketId: string; // Oyuncunun socket bağlantı kimliği
  roomCode: string; // Hangi odada olduğu
}

// Varsayılan ayarlar
const ROOM_TIMEOUT_MS = 30 * 60 * 1000; // 30 dakika (milisaniye cinsinden)
const DEFAULT_MAX_PLAYERS = 8; // Varsayılan maksimum oyuncu sayısı

class RoomManager {
  // Oda kodu -> Oda bilgisi eşleştirmesi
  private rooms: Map<string, ServerRoom> = new Map();

  // Socket ID -> Oyuncu bilgisi eşleştirmesi (hangi oyuncu hangi socket'e bağlı)
  private playersBySocket: Map<string, ServerPlayer> = new Map();

  // Zamanlayıcılar (30dk timeout için)
  private timeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

  /**
   * Yeni bir oda oluşturur.
   * @param hostSocketId - Oda sahibinin socket ID'si
   * @returns Oluşturulan odanın bilgileri
   */
  createRoom(hostSocketId: string): ServerRoom {
    // Benzersiz oda kodu üret (çakışma olursa tekrar dene)
    let code = generateRoomCode();
    while (this.rooms.has(code)) {
      code = generateRoomCode();
    }

    const now = Date.now();

    // Yeni oda oluştur
    const room: ServerRoom = {
      code,
      players: [],
      hostId: '', // İlk oyuncu katılınca set edilecek
      hostSocketId,
      gameId: null,
      status: RoomStatus.LOBBY,
      maxPlayers: DEFAULT_MAX_PLAYERS,
      createdAt: now,
      lastActivity: now,
    };

    // Odayı kaydet
    this.rooms.set(code, room);

    // 30 dakika sonra otomatik kapanma zamanlayıcısı başlat
    this.resetTimeout(code);

    console.log(`[Oda] Oluşturuldu: ${code}`);
    return room;
  }

  /**
   * Bir oyuncuyu odaya ekler.
   * @param roomCode - Oda kodu
   * @param socketId - Oyuncunun socket ID'si
   * @param name - Oyuncu adı
   * @param avatar - Oyuncu avatarı
   * @returns Eklenen oyuncu bilgisi veya hata mesajı
   */
  joinRoom(
    roomCode: string,
    socketId: string,
    name: string,
    avatar: string,
  ): { success: true; player: ServerPlayer; room: ServerRoom } | { success: false; error: string } {
    const room = this.rooms.get(roomCode);

    // Oda var mı kontrol et
    if (!room) {
      return { success: false, error: 'Oda bulunamadı. Kodu kontrol et.' };
    }

    // Oda lobide mi kontrol et (oyun başlamışsa katılamazsın)
    if (room.status !== RoomStatus.LOBBY) {
      return { success: false, error: 'Oyun zaten başlamış. Lobiye katılamazsın.' };
    }

    // Oda dolu mu kontrol et
    if (room.players.length >= room.maxPlayers) {
      return { success: false, error: 'Oda dolu. Maksimum oyuncu sayısına ulaşıldı.' };
    }

    // Aynı socket zaten odada mı kontrol et
    if (this.playersBySocket.has(socketId)) {
      return { success: false, error: 'Zaten bir odadasın.' };
    }

    // Oyuncu oluştur
    const player: ServerPlayer = {
      id: socketId, // Socket ID'yi oyuncu ID'si olarak kullan
      name,
      avatar,
      isHost: room.players.length === 0, // İlk katılan oyuncu oda sahibi olur
      socketId,
      roomCode,
    };

    // İlk oyuncuysa oda sahibi yap
    if (player.isHost) {
      room.hostId = player.id;
      room.hostSocketId = socketId;
    }

    // Oyuncuyu odaya ve haritaya ekle
    room.players.push(player);
    this.playersBySocket.set(socketId, player);

    // Son aktivite zamanını güncelle
    room.lastActivity = Date.now();
    this.resetTimeout(roomCode);

    console.log(`[Oda ${roomCode}] Oyuncu katıldı: ${name} (${room.players.length} oyuncu)`);
    return { success: true, player, room };
  }

  /**
   * Bir oyuncuyu odadan çıkarır.
   * @param socketId - Çıkan oyuncunun socket ID'si
   * @returns Çıkan oyuncu ve oda bilgisi
   */
  leaveRoom(socketId: string): { player: ServerPlayer; room: ServerRoom } | null {
    const player = this.playersBySocket.get(socketId);
    if (!player) return null;

    const room = this.rooms.get(player.roomCode);
    if (!room) return null;

    // Oyuncuyu odadan ve haritadan çıkar
    room.players = room.players.filter((p) => p.socketId !== socketId);
    this.playersBySocket.delete(socketId);

    console.log(
      `[Oda ${room.code}] Oyuncu ayrıldı: ${player.name} (${room.players.length} oyuncu kaldı)`,
    );

    // Oda boşaldıysa kapat
    if (room.players.length === 0) {
      this.closeRoom(room.code);
      return { player, room };
    }

    // Çıkan kişi oda sahibiyse, yeni sahip ata (sıradaki ilk oyuncu)
    if (player.isHost && room.players.length > 0) {
      const newHost = room.players[0];
      newHost.isHost = true;
      room.hostId = newHost.id;
      room.hostSocketId = newHost.socketId;
      console.log(`[Oda ${room.code}] Yeni oda sahibi: ${newHost.name}`);
    }

    // Son aktivite zamanını güncelle
    room.lastActivity = Date.now();
    this.resetTimeout(room.code);

    return { player, room };
  }

  /**
   * Oda bilgilerini getirir.
   * @param roomCode - Oda kodu
   */
  getRoom(roomCode: string): ServerRoom | undefined {
    return this.rooms.get(roomCode);
  }

  /**
   * Socket ID'ye göre oyuncuyu getirir.
   * @param socketId - Socket ID
   */
  getPlayerBySocket(socketId: string): ServerPlayer | undefined {
    return this.playersBySocket.get(socketId);
  }

  /**
   * Odayı kapatır ve tüm verileri temizler.
   * @param roomCode - Kapatılacak oda kodu
   */
  closeRoom(roomCode: string): void {
    const room = this.rooms.get(roomCode);
    if (!room) return;

    // Odadaki tüm oyuncuları haritadan çıkar
    for (const player of room.players) {
      this.playersBySocket.delete(player.socketId);
    }

    // Zamanlayıcıyı temizle
    const timeout = this.timeouts.get(roomCode);
    if (timeout) {
      clearTimeout(timeout);
      this.timeouts.delete(roomCode);
    }

    // Odayı sil
    this.rooms.delete(roomCode);
    console.log(`[Oda ${roomCode}] Kapatıldı.`);
  }

  /**
   * 30 dakika timeout zamanlayıcısını sıfırlar.
   * Her aktivitede çağrılır — böylece aktif odalar kapanmaz.
   */
  private resetTimeout(roomCode: string): void {
    // Eski zamanlayıcıyı temizle
    const existing = this.timeouts.get(roomCode);
    if (existing) {
      clearTimeout(existing);
    }

    // Yeni zamanlayıcı başlat
    const timeout = setTimeout(() => {
      console.log(`[Oda ${roomCode}] 30 dakika işlemsiz — otomatik kapatılıyor.`);
      this.closeRoom(roomCode);
    }, ROOM_TIMEOUT_MS);

    this.timeouts.set(roomCode, timeout);
  }

  /**
   * Aktif oda sayısını döndürür (debug/monitoring için).
   */
  getActiveRoomCount(): number {
    return this.rooms.size;
  }
}

// Tek bir RoomManager örneği oluştur ve paylaş (Singleton pattern)
export const roomManager = new RoomManager();
