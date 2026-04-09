// === PartyBoard Kontrolcü (Controller) - Ana Bileşen ===
// Telefonda gösterilen kontrolcü uygulaması.
// Akış: Katılma -> Lobi Bekleme -> Oyun

import { useState, useEffect } from 'react';
import './App.css';
import { AuthScreen, AuthResult } from './components/AuthScreen';
import { JoinScreen } from './components/JoinScreen';
import { WaitingScreen } from './components/WaitingScreen';
import { RPSController } from './components/RPSController';
import { MonopolyController } from './components/MonopolyController';
import { GameManifest, SocketEvents } from '@partyboard/shared';
import { socket } from './socket';
import { setLanguage } from './i18n';

// Uygulama durumları
// auth → kimlik belirleme, join → oda katılma, waiting → lobi bekleme, playing → oyun
type AppState = 'auth' | 'join' | 'waiting' | 'playing';

// Oyuncu bilgisi
export interface PlayerInfo {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
}

function App() {
  const [appState, setAppState] = useState<AppState>('auth');

  // Oda sahibinin dil değişikliğini dinle
  useEffect(() => {
    const handleLangChange = ({ lang }: { lang: 'tr' | 'en' }) => setLanguage(lang);
    socket.on(SocketEvents.LANG_CHANGE, handleLangChange);
    return () => { socket.off(SocketEvents.LANG_CHANGE, handleLangChange); };
  }, []);
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);
  const [roomCode, setRoomCode] = useState<string>('');
  const [players, setPlayers] = useState<PlayerInfo[]>([]);
  const [currentGameId, setCurrentGameId] = useState<string>('');
  // Sunucudan gelen oyun listesi (host seçim için kullanır)
  const [availableGames, setAvailableGames] = useState<GameManifest[]>([]);

  // Giriş adı ve avatarı — auth ekranından geliyor, join ekranında gösterilecek
  const [defaultName, setDefaultName] = useState('');
  const [defaultAvatar, setDefaultAvatar] = useState('🎮');

  // Auth tamamlandığında
  const handleAuth = (result: AuthResult) => {
    setDefaultName(result.username);
    setDefaultAvatar(result.avatar);
    setAppState('join');
  };

  // Odaya katıldığında
  const handleJoined = (player: PlayerInfo, code: string, allPlayers: PlayerInfo[], games: GameManifest[]) => {
    setPlayerInfo(player);
    setRoomCode(code);
    setPlayers(allPlayers);
    setAvailableGames(games);
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
      {appState === 'auth' && <AuthScreen onAuth={handleAuth} />}

      {appState === 'join' && (
        <JoinScreen
          onJoined={handleJoined}
          defaultName={defaultName}
          defaultAvatar={defaultAvatar}
        />
      )}

      {appState === 'waiting' && playerInfo && (
        <WaitingScreen
          playerInfo={playerInfo}
          roomCode={roomCode}
          players={players}
          availableGames={availableGames}
          onPlayerJoined={handlePlayerJoined}
          onPlayerLeft={handlePlayerLeft}
          onGameStarted={handleGameStarted}
        />
      )}

      {appState === 'playing' && currentGameId === 'rock-paper-scissors' && playerInfo && (
        <RPSController playerInfo={playerInfo} onGameEnded={handleGameEnded} />
      )}

      {appState === 'playing' && currentGameId === 'monopoly' && playerInfo && (
        <MonopolyController playerInfo={playerInfo} onGameEnded={handleGameEnded} />
      )}
    </div>
  );
}

export default App;
