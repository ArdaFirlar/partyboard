// === Katılma Ekranı ===
// Telefonda gösterilen ilk ekran.
// Oyuncu oda kodunu ve ismini girerek odaya katılır.

import { useState, useEffect } from 'react';
import { socket } from '../socket';
import { SocketEvents } from '@partyboard/shared';
import { PlayerInfo } from '../App';

// Kullanılabilir avatarlar (emoji)
const AVATARS = ['🐱', '🐶', '🐸', '🐵', '🐰', '🦊', '🐼', '🐨', '🦁', '🐯', '🐮', '🐷'];

interface JoinScreenProps {
  onJoined: (player: PlayerInfo, roomCode: string, players: PlayerInfo[]) => void;
}

export function JoinScreen({ onJoined }: JoinScreenProps) {
  // Oda kodu girişi
  const [roomCode, setRoomCode] = useState('');
  // Oyuncu adı
  const [name, setName] = useState('');
  // Seçili avatar
  const [avatar, setAvatar] = useState(AVATARS[Math.floor(Math.random() * AVATARS.length)]);
  // Yükleniyor durumu
  const [loading, setLoading] = useState(false);
  // Hata mesajı
  const [error, setError] = useState('');

  // URL'den oda kodunu al (QR koddan geliyorsa)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room = params.get('room');
    if (room) {
      setRoomCode(room.toUpperCase());
    }
  }, []);

  // "Katıl" butonuna basıldığında
  const handleJoin = () => {
    // Girişleri kontrol et
    if (!roomCode.trim()) {
      setError('Oda kodunu gir.');
      return;
    }
    if (!name.trim()) {
      setError('İsmini gir.');
      return;
    }

    setLoading(true);
    setError('');

    // Sunucuya bağlan
    if (!socket.connected) {
      socket.connect();
    }

    const doJoin = () => {
      // Odaya katılma isteği gönder
      socket.emit(
        SocketEvents.ROOM_JOIN,
        { roomCode: roomCode.trim(), name: name.trim(), avatar },
        (response: {
          success: boolean;
          player?: PlayerInfo;
          room?: { code: string; players: PlayerInfo[] };
          error?: string;
        }) => {
          if (response.success && response.player && response.room) {
            onJoined(response.player, response.room.code, response.room.players);
          } else {
            setError(response.error || 'Odaya katılınamadı.');
          }
          setLoading(false);
        },
      );
    };

    // Bağlantı zaten varsa direkt katıl
    if (socket.connected) {
      doJoin();
    } else {
      socket.once('connect', doJoin);
    }

    // Bağlantı hatası
    socket.once('connect_error', () => {
      setError('Sunucuya bağlanılamadı. Aynı WiFi ağında mısın?');
      setLoading(false);
    });
  };

  return (
    <div className="join-screen">
      <h1>🎮 PartyBoard</h1>
      <p className="subtitle">Odaya Katıl</p>

      {/* Oda kodu girişi */}
      <div className="input-group">
        <label>Oda Kodu</label>
        <input
          type="text"
          value={roomCode}
          onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
          placeholder="ABC123"
          maxLength={6}
          className="input-code"
          autoComplete="off"
        />
      </div>

      {/* İsim girişi */}
      <div className="input-group">
        <label>İsmin</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="İsmini yaz..."
          maxLength={20}
          className="input-name"
          autoComplete="off"
        />
      </div>

      {/* Avatar seçimi */}
      <div className="input-group">
        <label>Avatar Seç</label>
        <div className="avatar-grid">
          {AVATARS.map((a) => (
            <button
              key={a}
              className={`avatar-btn ${avatar === a ? 'selected' : ''}`}
              onClick={() => setAvatar(a)}
            >
              {a}
            </button>
          ))}
        </div>
      </div>

      {/* Katıl butonu */}
      <button className="btn-join" onClick={handleJoin} disabled={loading}>
        {loading ? 'Bağlanıyor...' : '🚀 Katıl'}
      </button>

      {/* Hata mesajı */}
      {error && <p className="error-message">{error}</p>}
    </div>
  );
}
