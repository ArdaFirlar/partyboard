// === Lobi Ekranı ===
// Oda oluşturulduktan sonra gösterilir.
// QR kod, oda kodu ve bağlı oyuncuların listesini gösterir.

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { socket } from '../socket';
import { SocketEvents } from '@partyboard/shared';
import { PlayerInfo } from '../App';

interface LobbyScreenProps {
  roomCode: string;
  players: PlayerInfo[];
  onPlayerJoined: (player: PlayerInfo) => void;
  onPlayerLeft: (playerId: string) => void;
}

export function LobbyScreen({ roomCode, players, onPlayerJoined, onPlayerLeft }: LobbyScreenProps) {
  // QR kod resmi (base64 formatında)
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');

  // Bilgisayarın yerel ağ IP adresi (telefon buraya bağlanacak)
  const [networkUrl, setNetworkUrl] = useState<string>('');

  // QR kod ve bağlantı URL'sini oluştur
  useEffect(() => {
    // Kontrolcü URL'si: telefon bu adrese gidecek
    // Aynı WiFi ağındaki cihazlar bu IP üzerinden bağlanabilir
    const host = window.location.hostname;
    const controllerPort = 3002;
    const url = `http://${host}:${controllerPort}?room=${roomCode}`;
    setNetworkUrl(url);

    // QR kod oluştur
    QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: {
        dark: '#FFFFFF', // QR kod rengi (beyaz, koyu arka plan için)
        light: '#00000000', // Arka plan rengi (şeffaf)
      },
    }).then(setQrCodeUrl);
  }, [roomCode]);

  // Socket.IO olaylarını dinle
  useEffect(() => {
    // Yeni oyuncu katıldığında
    const handlePlayerJoined = (data: { player: PlayerInfo }) => {
      onPlayerJoined(data.player);
    };

    // Oyuncu ayrıldığında
    const handlePlayerLeft = (data: { playerId: string }) => {
      onPlayerLeft(data.playerId);
    };

    socket.on(SocketEvents.PLAYER_JOINED, handlePlayerJoined);
    socket.on(SocketEvents.PLAYER_LEFT, handlePlayerLeft);

    // Temizlik: bileşen kaldırılınca dinleyicileri kaldır
    return () => {
      socket.off(SocketEvents.PLAYER_JOINED, handlePlayerJoined);
      socket.off(SocketEvents.PLAYER_LEFT, handlePlayerLeft);
    };
  }, [onPlayerJoined, onPlayerLeft]);

  return (
    <div className="lobby-screen">
      <h1 className="title">🎮 PartyBoard</h1>

      <div className="lobby-content">
        {/* Sol taraf: QR kod ve oda kodu */}
        <div className="join-section">
          <h2>Odaya Katıl</h2>

          {/* QR Kod */}
          {qrCodeUrl && (
            <div className="qr-container">
              <img src={qrCodeUrl} alt="QR Kod" className="qr-code" />
            </div>
          )}

          {/* Oda Kodu */}
          <div className="room-code-display">
            <span className="room-code-label">Oda Kodu:</span>
            <span className="room-code">{roomCode}</span>
          </div>

          <p className="join-hint">
            Telefonundan QR kodu tara veya{' '}
            <strong>
              {networkUrl.replace('http://', '')}
            </strong>{' '}
            adresine git
          </p>
        </div>

        {/* Sağ taraf: Oyuncu listesi */}
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
