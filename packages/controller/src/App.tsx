// === PartyBoard Kontrolcü (Controller) - Ana Bileşen ===
// Telefonda gösterilen kontrolcü uygulaması.
// Durum: Katılma Ekranı -> Lobi Bekleme

import { useState } from 'react';
import './App.css';
import { JoinScreen } from './components/JoinScreen';
import { WaitingScreen } from './components/WaitingScreen';

// Uygulama durumları
type AppState = 'join' | 'waiting';

// Oyuncu bilgisi
export interface PlayerInfo {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
}

function App() {
  // Hangi ekranda olduğumuz
  const [appState, setAppState] = useState<AppState>('join');

  // Oyuncu bilgisi (odaya katıldıktan sonra)
  const [playerInfo, setPlayerInfo] = useState<PlayerInfo | null>(null);

  // Oda kodu
  const [roomCode, setRoomCode] = useState<string>('');

  // Odadaki tüm oyuncular
  const [players, setPlayers] = useState<PlayerInfo[]>([]);

  // Odaya başarıyla katıldığında
  const handleJoined = (player: PlayerInfo, code: string, allPlayers: PlayerInfo[]) => {
    setPlayerInfo(player);
    setRoomCode(code);
    setPlayers(allPlayers);
    setAppState('waiting');
  };

  // Yeni oyuncu katıldığında
  const handlePlayerJoined = (player: PlayerInfo) => {
    setPlayers((prev) => [...prev, player]);
  };

  // Oyuncu ayrıldığında
  const handlePlayerLeft = (playerId: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
  };

  return (
    <div className="app">
      {/* Katılma ekranı: oda kodu + isim girişi */}
      {appState === 'join' && <JoinScreen onJoined={handleJoined} />}

      {/* Bekleme ekranı: lobide bekleme */}
      {appState === 'waiting' && playerInfo && (
        <WaitingScreen
          playerInfo={playerInfo}
          roomCode={roomCode}
          players={players}
          onPlayerJoined={handlePlayerJoined}
          onPlayerLeft={handlePlayerLeft}
        />
      )}
    </div>
  );
}

export default App;
