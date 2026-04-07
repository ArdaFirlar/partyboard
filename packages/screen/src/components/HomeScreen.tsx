// === Başlangıç Ekranı ===
// "Oda Oluştur" butonu olan ana sayfa.

import { useState } from 'react';
import { socket } from '../socket';
import { SocketEvents, GameManifest } from '@partyboard/shared';

interface HomeScreenProps {
  onRoomCreated: (code: string, games: GameManifest[]) => void;
}

export function HomeScreen({ onRoomCreated }: HomeScreenProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  const handleCreateRoom = () => {
    setLoading(true);
    setError('');

    if (!socket.connected) {
      socket.connect();
    }

    const sendCreateRoom = () => {
      socket.emit(
        SocketEvents.ROOM_CREATE,
        (response: {
          success: boolean;
          room?: { code: string };
          availableGames?: GameManifest[];
          error?: string;
        }) => {
          if (response.success && response.room) {
            onRoomCreated(response.room.code, response.availableGames || []);
          } else {
            setError(response.error || 'Oda oluşturulamadı.');
          }
          setLoading(false);
        },
      );
    };

    if (socket.connected) {
      sendCreateRoom();
    } else {
      socket.once('connect', sendCreateRoom);
    }

    socket.once('connect_error', () => {
      setError('Sunucuya bağlanılamadı. Sunucu çalışıyor mu?');
      setLoading(false);
    });
  };

  return (
    <div className="home-screen">
      <h1 className="title">🎮 PartyBoard</h1>
      <p className="subtitle">Parti oyun platformu</p>

      <button className="btn-create" onClick={handleCreateRoom} disabled={loading}>
        {loading ? 'Oda Oluşturuluyor...' : '🎲 Oda Oluştur'}
      </button>

      {error && <p className="error-message">{error}</p>}

      <p className="hint">Oda oluştur, sonra telefonundan QR kodu tara veya oda kodunu gir!</p>
    </div>
  );
}
