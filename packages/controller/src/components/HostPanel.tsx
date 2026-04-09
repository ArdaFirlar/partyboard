// === Oda Sahibi Kontrol Paneli ===
// Oyun esnasında sadece host'un telefonunda görünen yönetim paneli.
// - Oyun devam ediyorsa: duraklat / devam et / oyundan çık
// - Oyun bittiyse: lobiye dön / yeniden başlat

import { useState } from 'react';
import { socket } from '../socket';
import { SocketEvents } from '@partyboard/shared';

interface HostPanelProps {
  gamePhase: string | undefined; // 'choosing' | 'reveal' | 'finished' | undefined
  onGameEnded: () => void;       // Lobiye dönüldüğünde çağrılır
}

export function HostPanel({ gamePhase, onGameEnded }: HostPanelProps) {
  // Oyun duraklatıldı mı?
  const [isPaused, setIsPaused] = useState(false);
  // Çıkış onay ekranı açık mı?
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Duraklat / Devam Et
  const handlePauseToggle = () => {
    if (isPaused) {
      socket.emit(SocketEvents.HOST_RESUME);
      setIsPaused(false);
    } else {
      socket.emit(SocketEvents.HOST_PAUSE);
      setIsPaused(true);
    }
  };

  // Oyundan Çık (lobiye zorla dön)
  const handleForceExit = () => {
    socket.emit(SocketEvents.HOST_FORCE_EXIT);
    onGameEnded();
  };

  // Lobiye Dön (oyun bittikten sonra)
  const handleReturnToLobby = () => {
    socket.emit(SocketEvents.GAME_RETURN_LOBBY);
    onGameEnded();
  };

  // Yeniden Başlat
  const handleRestart = () => {
    socket.emit(SocketEvents.HOST_RESTART_GAME);
    // State'i sıfırla — yeni oyun başlayacak
    setIsPaused(false);
    setShowExitConfirm(false);
  };

  // Oyun bittiyse farklı butonlar göster
  if (gamePhase === 'finished') {
    return (
      <div className="host-panel host-panel-finished">
        <span className="host-panel-label">👑 Yönetici</span>
        <div className="host-panel-buttons">
          <button className="host-btn host-btn-resume" onClick={handleRestart}>
            🔄 Yeniden Başlat
          </button>
          <button className="host-btn host-btn-exit" onClick={handleReturnToLobby}>
            🏠 Lobiye Dön
          </button>
        </div>
      </div>
    );
  }

  // Oyun devam ediyorsa: duraklat / çık
  return (
    <div className="host-panel">
      <span className="host-panel-label">👑 Yönetici</span>

      <div className="host-panel-buttons">
        {/* Duraklat / Devam Et */}
        <button
          className={`host-btn ${isPaused ? 'host-btn-resume' : 'host-btn-pause'}`}
          onClick={handlePauseToggle}
        >
          {isPaused ? '▶️ Devam Et' : '⏸ Duraklat'}
        </button>

        {/* Oyundan Çık (onay ister) */}
        {!showExitConfirm ? (
          <button
            className="host-btn host-btn-exit"
            onClick={() => setShowExitConfirm(true)}
          >
            🚪 Oyundan Çık
          </button>
        ) : (
          <div className="host-exit-confirm">
            <span className="host-exit-confirm-text">Emin misin?</span>
            <button className="host-btn host-btn-confirm-yes" onClick={handleForceExit}>
              Evet, Çık
            </button>
            <button
              className="host-btn host-btn-confirm-no"
              onClick={() => setShowExitConfirm(false)}
            >
              İptal
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
