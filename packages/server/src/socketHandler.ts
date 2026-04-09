// === Socket.IO Olay Yöneticisi ===
// Tüm WebSocket olaylarını dinler ve oda/oyun yöneticisiyle koordine eder.

import { Server as SocketIOServer, Socket } from 'socket.io';
import { SocketEvents, RoomStatus } from '@partyboard/shared';
import { roomManager } from './RoomManager';
import { gameEngine } from './GameEngine';
import { verifyToken } from './auth/authService';

/**
 * Socket.IO olaylarını ayarlar.
 * @param io - Socket.IO sunucu örneği
 */
// Duraklatılmış odaları takip eder (oda kodu -> true/false)
const pausedRooms = new Set<string>();

// Her odanın son kullandığı oyun config'ini saklar (yeniden başlatma için)
const roomConfigs = new Map<string, Record<string, unknown>>();

export function setupSocketHandlers(io: SocketIOServer): void {
  // Oyun motoruna Socket.IO referansını ver
  gameEngine.setIO(io);

  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Yeni bağlantı: ${socket.id}`);

    // --- ODA OLUŞTURMA ---
    socket.on(SocketEvents.ROOM_CREATE, (callback: (data: unknown) => void) => {
      const room = roomManager.createRoom(socket.id);

      // Oluşturan kişiyi Socket.IO odasına ekle
      socket.join(room.code);

      // Mevcut oyunların listesini de gönder
      const availableGames = gameEngine.getAvailableGames();

      if (typeof callback === 'function') {
        callback({
          success: true,
          room: {
            code: room.code,
            players: room.players,
            status: room.status,
            maxPlayers: room.maxPlayers,
          },
          availableGames,
        });
      }
    });

    // --- ODAYA KATILMA ---
    socket.on(
      SocketEvents.ROOM_JOIN,
      (data: { roomCode: string; name: string; avatar: string; token?: string }, callback: (data: unknown) => void) => {
        const { roomCode, token } = data;
        let { name, avatar } = data;
        const code = roomCode.toUpperCase().trim();

        // Token varsa doğrula ve kayıtlı kullanıcı kimliğini token'dan al
        // (böylece kullanıcılar başka birinin adıyla giremez)
        if (token) {
          const payload = verifyToken(token);
          if (payload && !payload.isGuest) {
            // Kayıtlı kullanıcılar için isim ve avatar token'dan gelir
            name = payload.username;
            avatar = payload.avatar;
          }
        }

        const result = roomManager.joinRoom(code, socket.id, name, avatar);

        if (!result.success) {
          if (typeof callback === 'function') {
            callback({ success: false, error: result.error });
          }
          return;
        }

        socket.join(code);

        if (typeof callback === 'function') {
          callback({
            success: true,
            player: {
              id: result.player.id,
              name: result.player.name,
              avatar: result.player.avatar,
              isHost: result.player.isHost,
            },
            room: {
              code: result.room.code,
              players: result.room.players.map((p) => ({
                id: p.id,
                name: p.name,
                avatar: p.avatar,
                isHost: p.isHost,
              })),
              status: result.room.status,
            },
            // Mevcut oyun listesi — host telefonda oyun seçebilsin diye
            availableGames: gameEngine.getAvailableGames(),
          });
        }

        // Odadaki herkese yeni oyuncuyu bildir
        socket.to(code).emit(SocketEvents.PLAYER_JOINED, {
          player: {
            id: result.player.id,
            name: result.player.name,
            avatar: result.player.avatar,
            isHost: result.player.isHost,
          },
          playerCount: result.room.players.length,
        });
      },
    );

    // --- OYUN SEÇİMİ ---
    // Ana ekran (oda oluşturan cihaz) bir oyun seçtiğinde
    socket.on(SocketEvents.GAME_SELECT, (data: { gameId: string }, callback: (data: unknown) => void) => {
      // Önce ana ekran socket'i mi kontrol et
      let room = roomManager.getRoomByScreenSocket(socket.id);

      // Ana ekran değilse, oyuncu olarak kontrol et (host oyuncu da seçebilir)
      if (!room) {
        const player = roomManager.getPlayerBySocket(socket.id);
        if (!player) return;
        room = roomManager.getRoom(player.roomCode);
        if (!room) return;
        if (!player.isHost) {
          if (typeof callback === 'function') {
            callback({ success: false, error: 'Sadece oda sahibi oyun seçebilir.' });
          }
          return;
        }
      }

      // Oyun ID'sini kaydet
      room.gameId = data.gameId;

      // Odadaki herkese oyun seçildiğini bildir
      io.to(room.code).emit(SocketEvents.GAME_SELECT, {
        gameId: data.gameId,
      });

      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    // --- OYUN BAŞLATMA ---
    // data: oyuna özel config (ör: { rounds: 5 }), callback: sonuç
    socket.on(SocketEvents.GAME_START, (dataOrCallback: unknown, callbackOrUndefined?: (data: unknown) => void) => {
      // GAME_START iki şekilde çağrılabilir:
      // 1. socket.emit('game:start', config, callback) — host telefondan
      // 2. socket.emit('game:start', callback) — eski stil (ana ekrandan)
      let config: Record<string, unknown> = {};
      let callback: ((data: unknown) => void) | undefined;

      if (typeof dataOrCallback === 'function') {
        callback = dataOrCallback as (data: unknown) => void;
      } else if (dataOrCallback && typeof dataOrCallback === 'object') {
        config = dataOrCallback as Record<string, unknown>;
        callback = callbackOrUndefined;
      } else {
        callback = callbackOrUndefined;
      }

      // Önce ana ekran socket'i mi kontrol et
      let room = roomManager.getRoomByScreenSocket(socket.id);

      // Ana ekran değilse, oyuncu olarak kontrol et (host oyuncu da başlatabilir)
      if (!room) {
        const player = roomManager.getPlayerBySocket(socket.id);
        if (!player) return;
        room = roomManager.getRoom(player.roomCode);
        if (!room) return;
        if (!player.isHost) {
          if (typeof callback === 'function') {
            callback({ success: false, error: 'Sadece oda sahibi oyunu başlatabilir.' });
          }
          return;
        }
      }

      // Oyun seçili mi kontrol et
      if (!room.gameId) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Önce bir oyun seç.' });
        }
        return;
      }

      // Config'i sakla (yeniden başlatma için)
      roomConfigs.set(room.code, config);

      // Oda durumunu güncelle
      room.status = RoomStatus.PLAYING;

      // Oyunu başlat (config ile)
      const started = gameEngine.startGame(room.gameId, room, config);
      if (!started) {
        room.status = RoomStatus.LOBBY;
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Oyun başlatılamadı. Oyuncu sayısını kontrol et.' });
        }
        return;
      }

      // Başarılı
      io.to(room.code).emit(SocketEvents.GAME_START, { gameId: room.gameId });

      if (typeof callback === 'function') {
        callback({ success: true });
      }
    });

    // --- OYUN DURUMU İSTEME ---
    // İstemci bileşeni açıldığında (mount) mevcut oyun durumunu ister.
    // Bu, ekranın "Oyun yükleniyor" da kalmasını ve butonların devre dışı olmasını önler.
    socket.on(SocketEvents.GAME_REQUEST_STATE, () => {
      // Önce ana ekran socket'i mi kontrol et
      let room = roomManager.getRoomByScreenSocket(socket.id);

      // Ana ekran değilse, oyuncu olarak kontrol et
      if (!room) {
        const player = roomManager.getPlayerBySocket(socket.id);
        if (!player) return;
        room = roomManager.getRoom(player.roomCode);
      }

      if (!room) return;

      // Mevcut oyun durumunu bu socket'e gönder
      gameEngine.sendCurrentState(room.code, room);
    });

    // --- KONTROLCÜ GİRDİSİ ---
    // Telefondan gelen oyun girdileri (buton basma, seçim yapma)
    socket.on(SocketEvents.CONTROLLER_INPUT, (data: unknown) => {
      const player = roomManager.getPlayerBySocket(socket.id);
      if (!player) return;

      const room = roomManager.getRoom(player.roomCode);
      if (!room || room.status !== RoomStatus.PLAYING) return;

      // Oyun duraklatıldıysa girdi kabul etme
      if (pausedRooms.has(room.code)) return;

      // Girdiyi oyun motoruna ilet
      gameEngine.handleInput(room.code, player.id, data, room);
    });

    // --- OYUNU YENİDEN BAŞLAT ---
    socket.on(SocketEvents.HOST_RESTART_GAME, () => {
      const player = roomManager.getPlayerBySocket(socket.id);
      if (!player || !player.isHost) return;

      const room = roomManager.getRoom(player.roomCode);
      if (!room || !room.gameId) return;

      // Mevcut oyunu temizle, duraklatma state'ini sıfırla
      pausedRooms.delete(room.code);
      gameEngine.endGame(room.code);

      // Önceki config'i al (tur sayısı vb.)
      const config = roomConfigs.get(room.code) ?? {};

      // Oda durumunu tekrar PLAYING yap ve oyunu başlat
      room.status = RoomStatus.PLAYING;
      const started = gameEngine.startGame(room.gameId, room, config);

      if (!started) {
        console.log(`[Oda ${room.code}] Yeniden başlatma başarısız.`);
        return;
      }

      console.log(`[Oda ${room.code}] Oyun yeniden başlatıldı.`);

      // Herkese GAME_START gönder (controller yeni oyun state'ini alacak)
      io.to(room.code).emit(SocketEvents.GAME_START, { gameId: room.gameId });
    });

    // --- OYUNU DURAKLAT ---
    socket.on(SocketEvents.HOST_PAUSE, () => {
      const player = roomManager.getPlayerBySocket(socket.id);
      if (!player || !player.isHost) return;

      const room = roomManager.getRoom(player.roomCode);
      if (!room || room.status !== RoomStatus.PLAYING) return;

      pausedRooms.add(room.code);
      console.log(`[Oda ${room.code}] Oyun duraklatıldı.`);

      // Odadaki herkese bildir
      io.to(room.code).emit(SocketEvents.HOST_PAUSE, {});
    });

    // --- OYUNA DEVAM ET ---
    socket.on(SocketEvents.HOST_RESUME, () => {
      const player = roomManager.getPlayerBySocket(socket.id);
      if (!player || !player.isHost) return;

      const room = roomManager.getRoom(player.roomCode);
      if (!room) return;

      pausedRooms.delete(room.code);
      console.log(`[Oda ${room.code}] Oyun devam ediyor.`);

      // Odadaki herkese bildir
      io.to(room.code).emit(SocketEvents.HOST_RESUME, {});
    });

    // --- ZORLA ÇIKIŞ (oyun ortasında lobiye dön) ---
    socket.on(SocketEvents.HOST_FORCE_EXIT, () => {
      const player = roomManager.getPlayerBySocket(socket.id);
      if (!player || !player.isHost) return;

      const room = roomManager.getRoom(player.roomCode);
      if (!room) return;

      // Duraklatma durumunu temizle
      pausedRooms.delete(room.code);

      // Oyunu durdur ve odayı lobiye döndür
      gameEngine.endGame(room.code);
      room.status = RoomStatus.LOBBY;
      room.gameId = null;

      console.log(`[Oda ${room.code}] Host oyundan çıktı — lobiye dönüldü.`);

      // Odadaki herkese bildir (GAME_RETURN_LOBBY eventini kullan)
      io.to(room.code).emit(SocketEvents.GAME_RETURN_LOBBY, {});
    });

    // --- LOBİYE DÖNÜŞ ---
    // Oda sahibi oyun bittikten sonra lobiye dönmek istediğinde
    socket.on(SocketEvents.GAME_RETURN_LOBBY, () => {
      // Ana ekran socket'i mi kontrol et
      let room = roomManager.getRoomByScreenSocket(socket.id);

      // Ana ekran değilse, host oyuncu olarak kontrol et
      if (!room) {
        const player = roomManager.getPlayerBySocket(socket.id);
        if (!player) return;
        room = roomManager.getRoom(player.roomCode);
        if (!room) return;
        if (!player.isHost) return; // Sadece host yapabilir
      }

      // Duraklatma durumunu temizle
      pausedRooms.delete(room.code);

      // Oyunu durdur ve oda durumunu lobiye döndür
      gameEngine.endGame(room.code);
      room.status = RoomStatus.LOBBY;
      room.gameId = null;

      console.log(`[Oda ${room.code}] Lobiye dönüldü.`);

      // Odadaki herkese bildir
      io.to(room.code).emit(SocketEvents.GAME_RETURN_LOBBY, {});
    });

    // --- ODADAN AYRILMA ---
    socket.on(SocketEvents.ROOM_LEAVE, () => {
      handlePlayerLeave(socket, io);
    });

    // --- BAĞLANTI KOPMA ---
    socket.on('disconnect', (reason: string) => {
      console.log(`[Socket] Bağlantı koptu: ${socket.id} (${reason})`);

      // Ana ekran bağlantısı koptuysa odayı kapat
      if (roomManager.isScreenSocket(socket.id)) {
        const room = roomManager.getRoomByScreenSocket(socket.id);
        if (room) {
          console.log(`[Oda ${room.code}] Ana ekran bağlantısı koptu — oda kapatılıyor.`);
          // Odadaki herkese bildir
          io.to(room.code).emit(SocketEvents.ROOM_LEAVE, {
            reason: 'Ana ekran bağlantısı koptu. Oda kapatıldı.',
          });
          roomManager.closeRoom(room.code);
        }
        return;
      }

      // Normal oyuncu ayrılması
      handlePlayerLeave(socket, io);
    });
  });
}

/**
 * Oyuncu ayrıldığında veya bağlantısı koptuğunda çağrılır.
 */
function handlePlayerLeave(socket: Socket, io: SocketIOServer): void {
  const player = roomManager.getPlayerBySocket(socket.id);
  if (!player) return;

  const room = roomManager.getRoom(player.roomCode);

  // Oyun devam ediyorsa oyun motoruna bildir
  if (room && room.status === RoomStatus.PLAYING) {
    gameEngine.handlePlayerLeave(room.code, player.id, room);
  }

  const result = roomManager.leaveRoom(socket.id);
  if (!result) return;

  socket.leave(result.room.code);

  io.to(result.room.code).emit(SocketEvents.PLAYER_LEFT, {
    playerId: result.player.id,
    playerName: result.player.name,
    newHost: result.room.players.length > 0
      ? { id: result.room.players[0].id, name: result.room.players[0].name }
      : null,
    playerCount: result.room.players.length,
  });
}
