// === PartyBoard Kontrolcü (Controller) - Ana Bileşen ===
// Telefonda gösterilen kontrolcü uygulaması.
// Akış: Katılma -> Lobi Bekleme -> Oyun

import { useState } from 'react';
import './App.css';
import { JoinScreen } from './components/JoinScreen';
import { WaitingScreen } from './components/WaitingScreen';
import { RPSController } from './components/RPSController';

// Uygulama durumları
type AppState = 'join' | 'waiting' | 'playing';

// Oyuncu bilgisi
export interface PlayerInfo {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
}

function App() {
  const [appState, setAppState] = useState<AppState>('join');
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [currentGameId, setCurrentGameId] = useState<string>('');

  // Odaya katıldığında
  const handleJoined = (player: PlayerInfo, code: string, allPlayers: PlayerInfo[]) => {
    setPlayerInfo(player);
    setRoomCode(code);
    setPlayers(allPlayers);
    setAppState('waiting');
  };

  const handlePlayerJoined = (player: PlayerInfo) => {
    setPlayers((prev) => {
      if (prev.some((p) => p.id === player.id)) return prev;
      return [...prev, player];
    });
  };

  const handlePlayerLeft = (playerId: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
  };

  // Oyun başladığında
  const handleGameStarted = (gameId: string) => {
    setCurrentGameId(gameId);
    setAppState('playing');
  };

  // Oyun bittiğinde
  const handleGameEnded = () => {
    setCurrentGameId('');
    setAppState('waiting');
  };

  return (
    <div className="app">
      {appState === 'join' && <JoinScreen onJoined={handleJoined} />}

      {appState === 'waiting' && playerInfo && (
        <WaitingScreen
          playerInfo={playerInfo}
          roomCode={roomCode}
          players={players}
          onPlayerJoined={handlePlayerJoined}
          onPlayerLeft={handlePlayerLeft}
          onGameStarted={handleGameStarted}
        />
      )}

      {appState === 'playing' && currentGameId === 'rock-paper-scissors' && playerInfo && (
        <RPSController playerInfo={playerInfo} onGameEnded={handleGameEnded} />
      )}
    </div>
  );
}

export default App;
