// === Bekleme Ekranı (Lobi) ===
// Odaya katıldıktan sonra gösterilir. Oyun başlayana kadar bekler.

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
  onGameStarted: (gameId: string) => void;
}

export function WaitingScreen({
  playerInfo,
  roomCode,
  players,
  onPlayerJoined,
  onPlayerLeft,
  onGameStarted,
}: WaitingScreenProps) {
  useEffect(() => {
    const handlePlayerJoined = (data: { player: PlayerInfo }) => {
      onPlayerJoined(data.player);
    };

    const handlePlayerLeft = (data: { playerId: string }) => {
      onPlayerLeft(data.playerId);
    };

    // Oyun başladığında
    const handleGameStart = (data: { gameId: string }) => {
      onGameStarted(data.gameId);
    };

    socket.on(SocketEvents.PLAYER_JOINED, handlePlayerJoined);
    socket.on(SocketEvents.PLAYER_LEFT, handlePlayerLeft);
    socket.on(SocketEvents.GAME_START, handleGameStart);

    return () => {
      socket.off(SocketEvents.PLAYER_JOINED, handlePlayerJoined);
      socket.off(SocketEvents.PLAYER_LEFT, handlePlayerLeft);
      socket.off(SocketEvents.GAME_START, handleGameStart);
    };
  }, [onPlayerJoined, onPlayerLeft, onGameStarted]);

  return (
    <div className="waiting-screen">
      <div className="connection-status">
        <span className="status-dot connected"></span>
        <span>Bağlandı!</span>
      </div>

      <div className="my-info">
        <span className="my-avatar">{playerInfo.avatar}</span>
        <span className="my-name">{playerInfo.name}</span>
        {playerInfo.isHost && <span className="host-badge">👑 Oda Sahibi</span>}
      </div>

      <div className="room-info">
        <span className="room-label">Oda:</span>
        <span className="room-code">{roomCode}</span>
      </div>

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

      <div className="waiting-message">
        <p>⏳ Oyun başlaması bekleniyor...</p>
        <p className="hint">Oda sahibi oyunu seçip başlatacak.</p>
      </div>
    </div>
  );
}
