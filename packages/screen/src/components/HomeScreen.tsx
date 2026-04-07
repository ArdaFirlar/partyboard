// === Başlangıç Ekranı ===
// "Oda Oluştur" butonu olan ana sayfa.
// Butona basıldığında sunucuya oda oluşturma isteği gönderir.

import { useState } from 'react';
import { socket } from '../socket';
import { SocketEvents } from '@partyboard/shared';

interface HomeScreenProps {
  onRoomCreated: (code: string) => void; // Oda oluşturulunca çağrılacak fonksiyon
}

export function HomeScreen({ onRoomCreated }: HomeScreenProps) {
  // Butonun yükleniyor durumu
  const [loading, setLoading] = useState(false);
  // Hata mesajı
  const [error, setError] = useState<string>('');

  // "Oda Oluştur" butonuna basıldığında
  const handleCreateRoom = () => {
    setLoading(true);
    setError('');

    // Sunucuya bağlan (henüz bağlı değilse)
    if (!socket.connected) {
      socket.connect();
    }

    // Bağlantı kurulduğunda oda oluştur
    socket.on('connect', () => {
      sendCreateRoom();
    });

    // Zaten bağlıysa direkt oda oluştur
    if (socket.connected) {
      sendCreateRoom();
    }

    // Bağlantı hatası
    socket.on('connect_error', () => {
      setError('Sunucuya bağlanılamadı. Sunucu çalışıyor mu?');
      setLoading(false);
    });
  };

  // Sunucuya oda oluşturma isteği gönder
  const sendCreateRoom = () => {
    socket.emit(
      SocketEvents.ROOM_CREATE,
      (response: { success: boolean; room?: { code: string }; error?: string }) => {
        if (response.success && response.room) {
          onRoomCreated(response.room.code);
        } else {
          setError(response.error || 'Oda oluşturulamadı.');
        }
        setLoading(false);
      },
    );
  };

  return (
    <div className="home-screen">
      <h1 className="title">🎮 PartyBoard</h1>
      <p className="subtitle">Parti oyun platformu</p>

      <button className="btn-create" onClick={handleCreateRoom} disabled={loading}>
        {loading ? 'Oda Oluşturuluyor...' : '🎲 Oda Oluştur'}
      </button>

      {/* Hata mesajı */}
      {error && <p className="error-message">{error}</p>}

      <p className="hint">Oda oluştur, sonra telefonundan QR kodu tara veya oda kodunu gir!</p>
    </div>
  );
}
