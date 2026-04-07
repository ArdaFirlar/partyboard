// === Bekleme Ekranı (Lobi) ===
// Odaya katıldıktan sonra gösterilir.
// Oyun başlayana kadar bekleme ekranı.

import { useEffect } from 'react';
import { socket } from '../socket';
import { SocketEvents } from '@partyboard/shared';
import { PlayerInfo } from '../App';

interface WaitingScreenProps {
  playerInfo: PlayerInfo;
  roomCode: string;
  players: PlayerInfo[];
  onPlayerJoined: (player: PlayerInfo) => void;
  onPlayerLeft: (playerId: string) => void;
}

export function WaitingScreen({
  playerInfo,
  roomCode,
  players,
  onPlayerJoined,
  onPlayerLeft,
}: WaitingScreenProps) {
  // Socket.IO olaylarını dinle
  useEffect(() => {
    // Yeni oyuncu katıldığında
    const handlePlayerJoined = (data: { player: PlayerInfo }) => {
      onPlayerJoined(data.player);
    };

    // Oyuncu ayrıldığında
    const handlePlayerLeft = (data: { playerId: string }) => {
      onPlayerLeft(data.playerId);
    };

    socket.on(SocketEvents.PLAYER_JOINED, handlePlayerJoined);
    socket.on(SocketEvents.PLAYER_LEFT, handlePlayerLeft);

    return () => {
      socket.off(SocketEvents.PLAYER_JOINED, handlePlayerJoined);
      socket.off(SocketEvents.PLAYER_LEFT, handlePlayerLeft);
    };
  }, [onPlayerJoined, onPlayerLeft]);

  return (
    <div className="waiting-screen">
      {/* Bağlantı durumu */}
      <div className="connection-status">
        <span className="status-dot connected"></span>
        <span>Bağlandı!</span>
      </div>

      {/* Oyuncu bilgisi */}
      <div className="my-info">
        <span className="my-avatar">{playerInfo.avatar}</span>
        <span className="my-name">{playerInfo.name}</span>
        {playerInfo.isHost && <span className="host-badge">👑 Oda Sahibi</span>}
      </div>

      {/* Oda kodu */}
      <div className="room-info">
        <span className="room-label">Oda:</span>
        <span className="room-code">{roomCode}</span>
      </div>

      {/* Odadaki oyuncular */}
      <div className="players-list">
        <h3>Oyuncular ({players.length})</h3>
        {players.map((p) => (
          <div key={p.id} className={`player-item ${p.id === playerInfo.id ? 'me' : ''}`}>
            <span>{p.avatar}</span>
            <span>{p.name}</span>
            {p.isHost && <span className="host-icon">👑</span>}
          </div>
        ))}
      </div>

      {/* Bekleme mesajı */}
      <div className="waiting-message">
        <p>⏳ Oyun başlaması bekleniyor...</p>
        <p className="hint">Oda sahibi oyunu başlatacak.</p>
      </div>
    </div>
  );
}
