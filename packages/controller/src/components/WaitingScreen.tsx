// === Bekleme Ekranı (Lobi) ===
// Odaya katıldıktan sonra gösterilir. Oyun başlayana kadar bekler.
// Oda sahibi için oyun seçimi ve başlatma butonları da gösterilir.

import { useEffect, useState } from 'react';
import { socket } from '../socket';
import { SocketEvents, GameManifest } from '@partyboard/shared';
import { PlayerInfo } from '../App';

interface WaitingScreenProps {
  playerInfo: PlayerInfo;
  roomCode: string;
  players: PlayerInfo[];
  availableGames: GameManifest[]; // Sunucudan gelen oyun listesi
  onPlayerJoined: (player: PlayerInfo) => void;
  onPlayerLeft: (playerId: string) => void;
  onGameStarted: (gameId: string) => void;
}

export function WaitingScreen({
  playerInfo,
  roomCode,
  players,
  availableGames,
  onPlayerJoined,
  onPlayerLeft,
  onGameStarted,
}: WaitingScreenProps) {
  // Host'un seçtiği oyun ID'si
  const [selectedGameId, setSelectedGameId] = useState<string>('');
  // Seçilen tur sayısı (varsayılan 5)
  const [selectedRounds, setSelectedRounds] = useState<number>(5);
  // Başlatma yükleniyor mu?
  const [starting, setStarting] = useState(false);
  // Hata mesajı
  const [error, setError] = useState('');

  useEffect(() => {
    const handlePlayerJoined = (data: { player: PlayerInfo }) => {
      onPlayerJoined(data.player);
    };

    const handlePlayerLeft = (data: { playerId: string }) => {
      onPlayerLeft(data.playerId);
    };

    // Oyun başladığında (başka biri başlattıysa da buradan haber gelir)
    const handleGameStart = (data: { gameId: string }) => {
      onGameStarted(data.gameId);
    };

    // Başka bir cihazdan oyun seçimi yapıldıysa senkronize et
    const handleGameSelect = (data: { gameId: string }) => {
      setSelectedGameId(data.gameId);
    };

    socket.on(SocketEvents.PLAYER_JOINED, handlePlayerJoined);
    socket.on(SocketEvents.PLAYER_LEFT, handlePlayerLeft);
    socket.on(SocketEvents.GAME_START, handleGameStart);
    socket.on(SocketEvents.GAME_SELECT, handleGameSelect);

    return () => {
      socket.off(SocketEvents.PLAYER_JOINED, handlePlayerJoined);
      socket.off(SocketEvents.PLAYER_LEFT, handlePlayerLeft);
      socket.off(SocketEvents.GAME_START, handleGameStart);
      socket.off(SocketEvents.GAME_SELECT, handleGameSelect);
    };
  }, [onPlayerJoined, onPlayerLeft, onGameStarted]);

  // Oyun seç
  const handleSelectGame = (gameId: string) => {
    setSelectedGameId(gameId);
    setError('');
    socket.emit(SocketEvents.GAME_SELECT, { gameId });
  };

  // Oyunu Başlat
  const handleStartGame = () => {
    if (!selectedGameId) {
      setError('Önce bir oyun seç.');
      return;
    }

    const game = availableGames.find((g) => g.id === selectedGameId);
    if (game && players.length < game.minPlayers) {
      setError(`Bu oyun için en az ${game.minPlayers} oyuncu gerekli.`);
      return;
    }

    setStarting(true);
    setError('');

    // Config olarak tur sayısını gönder
    const config = { rounds: selectedRounds };

    socket.emit(SocketEvents.GAME_START, config, (response: { success: boolean; error?: string }) => {
      if (!response.success) {
        setError(response.error || 'Oyun başlatılamadı.');
        setStarting(false);
      }
      // Başarılıysa handleGameStart tetiklenecek
    });
  };

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

      {/* Oda sahibi oyun seçimi ve başlatma */}
      {playerInfo.isHost && availableGames.length > 0 ? (
        <div className="host-game-controls">
          <h3 className="host-game-title">🎮 Oyun Seç</h3>
          <div className="host-game-list">
            {availableGames.map((game) => (
              <button
                key={game.id}
                className={`host-game-btn ${selectedGameId === game.id ? 'selected' : ''}`}
                onClick={() => handleSelectGame(game.id)}
              >
                <span className="host-game-icon">{game.icon}</span>
                <span className="host-game-name">{game.name}</span>
                <span className="host-game-players">
                  {game.minPlayers}-{game.maxPlayers} oyuncu
                </span>
              </button>
            ))}
          </div>

          {/* Tur sayısı seçici — sadece Taş-Kağıt-Makas için görünür */}
          {selectedGameId === 'rock-paper-scissors' && (
            <div className="host-rounds-selector">
              <span className="host-rounds-label">Kaç tur?</span>
              <div className="host-rounds-buttons">
                {[3, 5, 10, 15].map((n) => (
                  <button
                    key={n}
                    className={`host-rounds-btn ${selectedRounds === n ? 'selected' : ''}`}
                    onClick={() => setSelectedRounds(n)}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && <p className="error-message">{error}</p>}

          <button
            className="btn-start-game"
            onClick={handleStartGame}
            disabled={!selectedGameId || starting}
          >
            {starting
              ? 'Başlatılıyor...'
              : selectedGameId === 'rock-paper-scissors'
              ? `🚀 ${selectedRounds} Turda Başlat`
              : '🚀 Oyunu Başlat'}
          </button>
        </div>
      ) : !playerInfo.isHost ? (
        <div className="waiting-message">
          <p>⏳ Oyun başlaması bekleniyor...</p>
          <p className="hint">Oda sahibi oyunu seçip başlatacak.</p>
        </div>
      ) : null}
    </div>
  );
}
