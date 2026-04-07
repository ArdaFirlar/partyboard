// === PartyBoard Ana Ekran (Screen) - Ana Bileşen ===
// TV veya bilgisayar ekranında gösterilen ana uygulama.
// Durum: Başlangıç -> Lobi (oda oluşturulunca)

import { useState } from 'react';
import './App.css';
import { HomeScreen } from './components/HomeScreen';
import { LobbyScreen } from './components/LobbyScreen';

// Uygulama durumları (hangi ekranın gösterileceğini belirler)
type AppState = 'home' | 'lobby';

// Oyuncu bilgisi (ekranda göstermek için)
export interface PlayerInfo {
  id: string;
  name: string;
  avatar: string;
  isHost: boolean;
}

function App() {
  // Hangi ekranda olduğumuzu tutan durum
  const [appState, setAppState] = useState<AppState>('home');

  // Oda kodu (oda oluşturulunca set edilir)
  const [roomCode, setRoomCode] = useState<string>('');

  // Odadaki oyuncuların listesi
  const [players, setPlayers] = useState<PlayerInfo[]>([]);

  // Oda oluşturulduğunda çağrılır
  const handleRoomCreated = (code: string) => {
    setRoomCode(code);
    setAppState('lobby');
  };

  // Yeni oyuncu katıldığında çağrılır
  const handlePlayerJoined = (player: PlayerInfo) => {
    setPlayers((prev) => [...prev, player]);
  };

  // Oyuncu ayrıldığında çağrılır
  const handlePlayerLeft = (playerId: string) => {
    setPlayers((prev) => prev.filter((p) => p.id !== playerId));
  };

  return (
    <div className="app">
      {/* Başlangıç ekranı - "Oda Oluştur" butonu */}
      {appState === 'home' && <HomeScreen onRoomCreated={handleRoomCreated} />}

      {/* Lobi ekranı - QR kod, oda kodu, oyuncu listesi */}
      {appState === 'lobby' && (
        <LobbyScreen
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
