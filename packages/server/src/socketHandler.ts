// === Socket.IO Olay Yöneticisi ===
// Tüm WebSocket olaylarını dinler ve oda/oyun yöneticisiyle koordine eder.

import { Server as SocketIOServer, Socket } from 'socket.io';
import { SocketEvents, RoomStatus } from '@partyboard/shared';
import { roomManager } from './RoomManager';
import { gameEngine } from './GameEngine';

/**
 * Socket.IO olaylarını ayarlar.
 * @param io - Socket.IO sunucu örneği
 */
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
      (data: { roomCode: string; name: string; avatar: string }, callback: (data: unknown) => void) => {
        const { roomCode, name, avatar } = data;
        const code = roomCode.toUpperCase().trim();
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
    // Oda sahibi bir oyun seçtiğinde
    socket.on(SocketEvents.GAME_SELECT, (data: { gameId: string }, callback: (data: unknown) => void) => {
      const player = roomManager.getPlayerBySocket(socket.id);
      if (!player) return;

      const room = roomManager.getRoom(player.roomCode);
      if (!room) return;

      // Sadece oda sahibi oyun seçebilir
      if (!player.isHost) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Sadece oda sahibi oyun seçebilir.' });
        }
        return;
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
    socket.on(SocketEvents.GAME_START, (callback: (data: unknown) => void) => {
      const player = roomManager.getPlayerBySocket(socket.id);
      if (!player) return;

      const room = roomManager.getRoom(player.roomCode);
      if (!room) return;

      // Sadece oda sahibi başlatabilir
      if (!player.isHost) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Sadece oda sahibi oyunu başlatabilir.' });
        }
        return;
      }

      // Oyun seçili mi kontrol et
      if (!room.gameId) {
        if (typeof callback === 'function') {
          callback({ success: false, error: 'Önce bir oyun seç.' });
        }
        return;
      }

      // Oda durumunu güncelle
      room.status = RoomStatus.PLAYING;

      // Oyunu başlat
      const started = gameEngine.startGame(room.gameId, room);
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

    // --- KONTROLCÜ GİRDİSİ ---
    // Telefondan gelen oyun girdileri (buton basma, seçim yapma)
    socket.on(SocketEvents.CONTROLLER_INPUT, (data: unknown) => {
      const player = roomManager.getPlayerBySocket(socket.id);
      if (!player) return;

      const room = roomManager.getRoom(player.roomCode);
      if (!room || room.status !== RoomStatus.PLAYING) return;

      // Girdiyi oyun motoruna ilet
      gameEngine.handleInput(room.code, player.id, data, room);
    });

    // --- ODADAN AYRILMA ---
    socket.on(SocketEvents.ROOM_LEAVE, () => {
      handlePlayerLeave(socket, io);
    });

    // --- BAĞLANTI KOPMA ---
    socket.on('disconnect', (reason: string) => {
      console.log(`[Socket] Bağlantı koptu: ${socket.id} (${reason})`);
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
