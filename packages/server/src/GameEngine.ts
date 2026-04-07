// === Oyun Motoru (Game Engine) ===
// Her oyun modülünün uygulaması gereken arayüz (interface) ve
// oyunları yöneten ana motor sınıfı.

import { Server as SocketIOServer } from 'socket.io';
import { SocketEvents, GameManifest } from '@partyboard/shared';
import { ServerRoom, ServerPlayer } from './RoomManager';

// --- Oyun Modülü Arayüzü ---
// Her oyun bu arayüzü uygulamalıdır (implements)
export interface IGameModule {
  manifest: GameManifest;

  // Oyun başlatıldığında çağrılır
  onStart(context: GameContext): void;

  // Oyuncudan girdi geldiğinde çağrılır (buton basma, seçim yapma vs.)
  onInput(playerId: string, data: unknown, context: GameContext): void;

  // Oyuncu ayrıldığında çağrılır
  onPlayerLeave(playerId: string, context: GameContext): void;
}

// --- Oyun Bağlamı (Context) ---
// Oyun modülünün sunucuyla iletişim kurması için kullanacağı fonksiyonlar
export interface GameContext {
  room: ServerRoom;

  // Ana ekrana veri gönder (tüm oyuncular da görür)
  sendToScreen(data: unknown): void;

  // Belirli bir oyuncunun telefonuna özel veri gönder
  sendToPlayer(playerId: string, data: unknown): void;

  // Tüm cihazlara (ana ekran + tüm telefonlar) veri gönder
  sendToAll(eventName: string, data: unknown): void;

  // Oyun durumunu güncelle (ana ekran + tüm telefonlar)
  sendGameState(state: unknown): void;

  // Oyunu bitir ve sonuçları bildir
  endGame(results: unknown): void;
}

// --- Oyun Motoru Sınıfı ---
// Aktif oyunları yönetir, oyun modüllerini yükler
class GameEngine {
  // Kayıtlı oyun modülleri (oyun ID -> modül fabrikası)
  private registeredGames: Map<string, () => IGameModule> = new Map();

  // Aktif oyunlar (oda kodu -> çalışan oyun modülü)
  private activeGames: Map<string, IGameModule> = new Map();

  // Socket.IO sunucusu referansı
  private io: SocketIOServer | null = null;

  /**
   * Socket.IO sunucusunu bağlar.
   */
  setIO(io: SocketIOServer): void {
    this.io = io;
  }

  /**
   * Yeni bir oyun modülü kaydeder.
   * @param id - Oyun kimliği (ör: "rock-paper-scissors")
   * @param factory - Oyun modülü oluşturucu fonksiyon
   */
  registerGame(id: string, factory: () => IGameModule): void {
    this.registeredGames.set(id, factory);
    console.log(`[Oyun] Kayıtlı: ${id}`);
  }

  /**
   * Kayıtlı tüm oyunların manifest listesini döndürür.
   */
  getAvailableGames(): GameManifest[] {
    const games: GameManifest[] = [];
    for (const factory of this.registeredGames.values()) {
      const module = factory();
      games.push(module.manifest);
    }
    return games;
  }

  /**
   * Bir odada oyun başlatır.
   * @param gameId - Oyun kimliği
   * @param room - Oda bilgisi
   */
  startGame(gameId: string, room: ServerRoom): boolean {
    const factory = this.registeredGames.get(gameId);
    if (!factory) {
      console.log(`[Oyun] Bulunamadı: ${gameId}`);
      return false;
    }

    // Yeni oyun modülü oluştur
    const gameModule = factory();

    // Oyuncu sayısı kontrolü
    if (room.players.length < gameModule.manifest.minPlayers) {
      console.log(`[Oyun] Yetersiz oyuncu: ${room.players.length}/${gameModule.manifest.minPlayers}`);
      return false;
    }

    // Oyun bağlamını (context) oluştur
    const context = this.createContext(room);

    // Aktif oyunlar listesine ekle
    this.activeGames.set(room.code, gameModule);

    // Oyunu başlat
    gameModule.onStart(context);
    console.log(`[Oyun] Başlatıldı: ${gameId} - Oda: ${room.code}`);
    return true;
  }

  /**
   * Oyuncudan girdi geldiğinde çağrılır.
   */
  handleInput(roomCode: string, playerId: string, data: unknown, room: ServerRoom): void {
    const gameModule = this.activeGames.get(roomCode);
    if (!gameModule) return;

    const context = this.createContext(room);
    gameModule.onInput(playerId, data, context);
  }

  /**
   * Oyuncu ayrıldığında çağrılır.
   */
  handlePlayerLeave(roomCode: string, playerId: string, room: ServerRoom): void {
    const gameModule = this.activeGames.get(roomCode);
    if (!gameModule) return;

    const context = this.createContext(room);
    gameModule.onPlayerLeave(playerId, context);
  }

  /**
   * Oyunu sonlandırır ve temizler.
   */
  endGame(roomCode: string): void {
    this.activeGames.delete(roomCode);
    console.log(`[Oyun] Bitti - Oda: ${roomCode}`);
  }

  /**
   * Oyun bağlamı (context) oluşturur.
   * Bu, oyun modülünün sunucuyla iletişim kurmasını sağlar.
   */
  private createContext(room: ServerRoom): GameContext {
    const io = this.io!;

    return {
      room,

      // Ana ekrana veri gönder
      sendToScreen(data: unknown) {
        io.to(room.code).emit(SocketEvents.GAME_STATE, data);
      },

      // Belirli bir oyuncuya özel veri gönder
      sendToPlayer(playerId: string, data: unknown) {
        const player = room.players.find((p) => p.id === playerId);
        if (player) {
          io.to(player.socketId).emit(SocketEvents.PLAYER_PRIVATE, data);
        }
      },

      // Tüm cihazlara veri gönder
      sendToAll(eventName: string, data: unknown) {
        io.to(room.code).emit(eventName, data);
      },

      // Oyun durumunu güncelle
      sendGameState(state: unknown) {
        io.to(room.code).emit(SocketEvents.GAME_STATE, state);
      },

      // Oyunu bitir
      endGame(results: unknown) {
        io.to(room.code).emit(SocketEvents.GAME_END, results);
        gameEngine.endGame(room.code);
      },
    };
  }
}

// Tek bir GameEngine örneği (Singleton)
export const gameEngine = new GameEngine();
