// === Socket.IO Olay Yöneticisi ===
// Tüm WebSocket olaylarını dinler ve oda yöneticisiyle koordine eder.

import { Server as SocketIOServer, Socket } from 'socket.io';
import { SocketEvents } from '@partyboard/shared';
import { roomManager } from './RoomManager';

/**
 * Socket.IO olaylarını ayarlar.
 * @param io - Socket.IO sunucu örneği
 */
export function setupSocketHandlers(io: SocketIOServer): void {
  io.on('connection', (socket: Socket) => {
    console.log(`[Socket] Yeni bağlantı: ${socket.id}`);

    // --- ODA OLUŞTURMA ---
    // Ana ekran "Oda Oluştur" butonuna bastığında tetiklenir
    socket.on(SocketEvents.ROOM_CREATE, (callback: (data: unknown) => void) => {
      const room = roomManager.createRoom(socket.id);

      // Oluşturan kişiyi Socket.IO odasına ekle
      socket.join(room.code);

      // Oda bilgilerini geri gönder
      if (typeof callback === 'function') {
        callback({
          success: true,
          room: {
            code: room.code,
            players: room.players,
            status: room.status,
            maxPlayers: room.maxPlayers,
          },
        });
      }
    });

    // --- ODAYA KATILMA ---
    // Telefon kontrolcüsünden oda kodunu girince tetiklenir
    socket.on(
      SocketEvents.ROOM_JOIN,
      (data: { roomCode: string; name: string; avatar: string }, callback: (data: unknown) => void) => {
        const { roomCode, name, avatar } = data;

        // Oda kodunu büyük harfe çevir (kullanıcı küçük harf girmiş olabilir)
        const code = roomCode.toUpperCase().trim();

        const result = roomManager.joinRoom(code, socket.id, name, avatar);

        if (!result.success) {
          // Hata varsa geri bildir
          if (typeof callback === 'function') {
            callback({ success: false, error: result.error });
          }
          return;
        }

        // Oyuncuyu Socket.IO odasına ekle
        socket.join(code);

        // Katılan oyuncuya başarılı yanıt gönder
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

        // Odadaki herkese yeni oyuncunun katıldığını bildir
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

    // --- ODADAN AYRILMA ---
    socket.on(SocketEvents.ROOM_LEAVE, () => {
      handlePlayerLeave(socket, io);
    });

    // --- BAĞLANTI KOPMA ---
    // Oyuncu pencereyi kapatırsa, internet kesilirse vs.
    socket.on('disconnect', (reason: string) => {
      console.log(`[Socket] Bağlantı koptu: ${socket.id} (${reason})`);
      handlePlayerLeave(socket, io);
    });
  });
}

/**
 * Oyuncu ayrıldığında veya bağlantısı koptuğunda çağrılır.
 * Oyuncuyu odadan çıkarır ve diğer oyunculara bildirir.
 */
function handlePlayerLeave(socket: Socket, io: SocketIOServer): void {
  const result = roomManager.leaveRoom(socket.id);
  if (!result) return;

  const { player, room } = result;

  // Socket.IO odasından çıkar
  socket.leave(room.code);

  // Odadaki diğer oyunculara bildir
  io.to(room.code).emit(SocketEvents.PLAYER_LEFT, {
    playerId: player.id,
    playerName: player.name,
    // Yeni oda sahibi varsa bildir
    newHost: room.players.length > 0
      ? {
          id: room.players[0].id,
          name: room.players[0].name,
        }
      : null,
    playerCount: room.players.length,
  });
}
