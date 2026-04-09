// === Lobi Ekranı ===
// Oda oluşturulduktan sonra gösterilir.
// QR kod, oda kodu, oyuncu listesi, oyun seçme ve başlatma.

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { socket } from '../socket';
import { SocketEvents, GameManifest } from '@partyboard/shared';
import { PlayerInfo } from '../App';
import { setLanguage } from '../i18n';

interface LobbyScreenProps {
  roomCode: string;
  players: PlayerInfo[];
  availableGames: GameManifest[];
  onPlayerJoined: (player: PlayerInfo) => void;
  onPlayerLeft: (playerId: string) => void;
  onGameStarted: (gameId: string) => void;
  onShowLeaderboard: () => void;
}

export function LobbyScreen({
  roomCode,
  players,
  availableGames,
  onPlayerJoined,
  onPlayerLeft,
  onGameStarted,
  onShowLeaderboard,
}: LobbyScreenProps) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [networkUrl, setNetworkUrl] = useState<string>('');
  const [selectedGame, setSelectedGame] = useState<string>('');
  const [error, setError] = useState('');
  const [currentLang, setCurrentLang] = useState<'tr' | 'en'>('tr');

  // Dil değiştirince tüm odaya yayınla
  const handleLangChange = (lang: 'tr' | 'en') => {
    setCurrentLang(lang);
    setLanguage(lang);
    socket.emit(SocketEvents.LANG_CHANGE, { lang });
  };

  // QR kod oluştur
  useEffect(() => {
    const host = window.location.hostname;
    const controllerPort = 3002;
    const url = `http://${host}:${controllerPort}?room=${roomCode}`;
    setNetworkUrl(url);

    QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: { dark: '#FFFFFF', light: '#00000000' },
    }).then(setQrCodeUrl);
  }, [roomCode]);

  // Socket olaylarını dinle
  useEffect(() => {
    const handlePlayerJoined = (data: { player: PlayerInfo }) => {
      onPlayerJoined(data.player);
    };

    const handlePlayerLeft = (data: { playerId: string }) => {
      onPlayerLeft(data.playerId);
    };

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

  // Oyun seç
  const handleSelectGame = (gameId: string) => {
    setSelectedGame(gameId);
    socket.emit(SocketEvents.GAME_SELECT, { gameId }, (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        setError(res.error || 'Oyun seçilemedi.');
      }
    });
  };

  // Oyunu başlat
  const handleStartGame = () => {
    if (!selectedGame) {
      setError('Önce bir oyun seç.');
      return;
    }
    setError('');

    socket.emit(SocketEvents.GAME_START, (res: { success: boolean; error?: string }) => {
      if (!res.success) {
        setError(res.error || 'Oyun başlatılamadı.');
      }
    });
  };

  // Seçili oyunun manifest bilgisi
  const selectedManifest = availableGames.find((g) => g.id === selectedGame);

  return (
    <div className="lobby-screen">
      {/* Üst araç çubuğu — dil seçici ve liderlik tablosu */}
      <div className="lobby-toolbar">
        <h1 className="title">🎮 PartyBoard</h1>
        <div className="lobby-toolbar-actions">
          <button
            className={`lang-btn ${currentLang === 'tr' ? 'lang-active' : ''}`}
            onClick={() => handleLangChange('tr')}
          >TR</button>
          <button
            className={`lang-btn ${currentLang === 'en' ? 'lang-active' : ''}`}
            onClick={() => handleLangChange('en')}
          >EN</button>
          <button className="leaderboard-open-btn" onClick={onShowLeaderboard}>
            🏆 Liderlik
          </button>
        </div>
      </div>

      <div className="lobby-content">
        {/* Sol: QR kod ve oda kodu */}
        <div className="join-section">
          <h2>Odaya Katıl</h2>
          {qrCodeUrl && (
            <div className="qr-container">
              <img src={qrCodeUrl} alt="QR Kod" className="qr-code" />
            </div>
          )}
          <div className="room-code-display">
            <span className="room-code-label">Oda Kodu:</span>
            <span className="room-code">{roomCode}</span>
          </div>
          <p className="join-hint">
            Telefonundan QR kodu tara veya{' '}
            <strong>{networkUrl.replace('http://', '')}</strong> adresine git
          </p>
        </div>

        {/* Orta: Oyun seçimi */}
        <div className="game-section">
          <h2>Oyun Seç</h2>
          <div className="game-list">
            {availableGames.map((game) => (
              <button
                key={game.id}
                className={`game-card ${selectedGame === game.id ? 'selected' : ''}`}
                onClick={() => handleSelectGame(game.id)}
              >
                <span className="game-icon">{game.icon}</span>
                <div className="game-info">
                  <span className="game-name">{game.name}</span>
                  <span className="game-desc">{game.description}</span>
                  <span className="game-players">
                    {game.minPlayers}-{game.maxPlayers} oyuncu
                  </span>
                </div>
              </button>
            ))}
          </div>

          {/* Başlat butonu */}
          {selectedManifest && (
            <div className="start-section">
              <button
                className="btn-start"
                onClick={handleStartGame}
                disabled={players.length < selectedManifest.minPlayers}
              >
                {players.length < selectedManifest.minPlayers
                  ? `En az ${selectedManifest.minPlayers} oyuncu gerekli`
                  : `🚀 ${selectedManifest.name} Başlat!`}
              </button>
            </div>
          )}

          {error && <p className="error-message">{error}</p>}
        </div>

        {/* Sağ: Oyuncu listesi */}
        <div className="players-section">
          <h2>Oyuncular ({players.length})</h2>
          {players.length === 0 ? (
            <div className="waiting-message">
              <p>Oyuncu bekleniyor...</p>
              <p className="hint">Telefonundan QR kodu tara!</p>
            </div>
          ) : (
            <div className="players-list">
              {players.map((player) => (
                <div key={player.id} className="player-card">
                  <span className="player-avatar">{player.avatar}</span>
                  <span className="player-name">{player.name}</span>
                  {player.isHost && <span className="host-badge">👑 Sahip</span>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
