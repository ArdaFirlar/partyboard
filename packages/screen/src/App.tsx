// === PartyBoard Ana Ekran (Screen) - Ana Bileşen (Faz 6) ===
// TV veya bilgisayar ekranında gösterilen ana uygulama.
// Akış: Başlangıç -> Lobi -> Oyun -> İstatistik (opsiyonel)

import { useState, useEffect } from 'react';
import './App.css';
import { HomeScreen } from './components/HomeScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { RPSGameScreen } from './components/RPSGameScreen';
import { MonopolyGameScreen } from './components/MonopolyGameScreen';
import { StatsScreen } from './components/StatsScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { DisconnectBanner } from './components/DisconnectBanner';
import { GameManifest, SocketEvents, MonopolyStats } from '@partyboard/shared';
import { socket } from './socket';
import { setLanguage } from './i18n';

// Uygulama durumları
type AppState = 'home' | 'lobby' | 'playing' | 'stats' | 'leaderboard';

// Oyuncu bilgisi
export interface PlayerInfo {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
}

function App() {
  const [appState, setAppState] = useState<AppState>('home');
  const [roomCode, setRoomCode] = useState<string>('');
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [availableGames, setAvailableGames] = useState<GameManifest[]>([]);
  const [currentGameId, setCurrentGameId] = useState<string>('');
  const [lastStats, setLastStats] = useState<MonopolyStats | null>(null);
  // Geçici bağlantı kopan oyuncular — 30s bekle UI için
  const [disconnectedPlayers, setDisconnectedPlayers] = useState<{ id: string; name: string }[]>([]);

  // Dil değişikliğini ve bağlantı kopmayı dinle
  useEffect(() => {
    const handleLangChange = ({ lang }: { lang: 'tr' | 'en' }) => {
      setLanguage(lang);
    };
    const handlePlayerDisconnected = (data: { id: string; name: string }) => {
      setDisconnectedPlayers((prev) => [...prev, data]);
    };
    const handlePlayerReconnected = (data: { id: string }) => {
      setDisconnectedPlayers((prev) => prev.filter((p) => p.id !== data.id));
    };
    const handleGameStats = (stats: MonopolyStats) => {
      setLastStats(stats);
    };

    socket.on(SocketEvents.LANG_CHANGE, handleLangChange);
    socket.on(SocketEvents.PLAYER_DISCONNECTED, handlePlayerDisconnected);
    socket.on(SocketEvents.PLAYER_RECONNECTED, handlePlayerReconnected);
    socket.on('game:stats', handleGameStats);

    return () => {
      socket.off(SocketEvents.LANG_CHANGE, handleLangChange);
      socket.off(SocketEvents.PLAYER_DISCONNECTED, handlePlayerDisconnected);
      socket.off(SocketEvents.PLAYER_RECONNECTED, handlePlayerReconnected);
      socket.off('game:stats', handleGameStats);
    };
  }, []);

  const handleRoomCreated = (code: string, games: GameManifest[]) => {
    setRoomCode(code);
    setAvailableGames(games);
    setAppState('lobby');
  };

  const handlePlayerJoined = (player: PlayerInfo) => {
    setPlayers((prev) => {
      if (prev.some((p) => p.id === player.id)) return prev;
      return [...prev, player];
    });
    // Yeniden bağlandıysa disconnect listesinden çıkar
    setDisconnectedPlayers((prev) => prev.filter((p) => p.id !== player.id));
  };

  const handlePlayerLeft = (playerId: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
  };

  const handleGameStarted = (gameId: string) => {
    setCurrentGameId(gameId);
    setLastStats(null);
    setAppState('playing');
  };

  const handleGameEnded = () => {
    setCurrentGameId('');
    // Monopoly bittiyse istatistiklere git, diğer oyunlar direkt lobiye
    if (currentGameId === 'monopoly' && lastStats) {
      setAppState('stats');
    } else {
      setAppState('lobby');
    }
  };

  const handleStatsClose = () => {
    setAppState('lobby');
  };

  return (
    <div className="app">
      {/* Bağlantı kopma bildirimleri — tüm ekranlarda gösterilir */}
      {disconnectedPlayers.length > 0 && (
        <DisconnectBanner
          disconnected={disconnectedPlayers}
          onDismiss={(id) => setDisconnectedPlayers((prev) => prev.filter((p) => p.id !== id))}
        />
      )}

      {appState === 'home' && <HomeScreen onRoomCreated={handleRoomCreated} />}

      {appState === 'lobby' && (
        <LobbyScreen
          roomCode={roomCode}
          players={players}
          availableGames={availableGames}
          onPlayerJoined={handlePlayerJoined}
          onPlayerLeft={handlePlayerLeft}
          onGameStarted={handleGameStarted}
          onShowLeaderboard={() => setAppState('leaderboard')}
        />
      )}

      {appState === 'playing' && currentGameId === 'rock-paper-scissors' && (
        <RPSGameScreen players={players} onGameEnded={handleGameEnded} />
      )}

      {appState === 'playing' && currentGameId === 'monopoly' && (
        <MonopolyGameScreen onGameEnded={handleGameEnded} />
      )}

      {appState === 'stats' && lastStats && (
        <StatsScreen stats={lastStats} onClose={handleStatsClose} />
      )}

      {appState === 'leaderboard' && (
        <LeaderboardScreen onClose={() => setAppState('lobby')} />
      )}
    </div>
  );
}

export default App;
