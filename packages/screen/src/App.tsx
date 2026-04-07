// === PartyBoard Ana Ekran (Screen) - Ana Bileşen ===
// TV veya bilgisayar ekranında gösterilen ana uygulama.
// Akış: Başlangıç -> Lobi -> Oyun

import { useState } from 'react';
import './App.css';
import { HomeScreen } from './components/HomeScreen';
import { LobbyScreen } from './components/LobbyScreen';
import { RPSGameScreen } from './components/RPSGameScreen';
import { GameManifest } from '@partyboard/shared';

// Uygulama durumları
type AppState = 'home' | 'lobby' | 'playing';

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

  // Oda oluşturulduğunda
  const handleRoomCreated = (code: string, games: GameManifest[]) => {
    setRoomCode(code);
    setAvailableGames(games);
    setAppState('lobby');
  };

  // Yeni oyuncu katıldığında
  const handlePlayerJoined = (player: PlayerInfo) => {
    setPlayers((prev) => {
      // Aynı oyuncu zaten varsa ekleme
      if (prev.some((p) => p.id === player.id)) return prev;
      return [...prev, player];
    });
  };

  // Oyuncu ayrıldığında
  const handlePlayerLeft = (playerId: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
  };

  // Oyun başladığında
  const handleGameStarted = (gameId: string) => {
    setCurrentGameId(gameId);
    setAppState('playing');
  };

  // Oyun bittiğinde lobiye dön
  const handleGameEnded = () => {
    setCurrentGameId('');
    setAppState('lobby');
  };

  return (
    <div className="app">
      {appState === 'home' && <HomeScreen onRoomCreated={handleRoomCreated} />}

      {appState === 'lobby' && (
        <LobbyScreen
          roomCode={roomCode}
          players={players}
          availableGames={availableGames}
          onPlayerJoined={handlePlayerJoined}
          onPlayerLeft={handlePlayerLeft}
          onGameStarted={handleGameStarted}
        />
      )}

      {appState === 'playing' && currentGameId === 'rock-paper-scissors' && (
        <RPSGameScreen players={players} onGameEnded={handleGameEnded} />
      )}
    </div>
  );
}

export default App;
