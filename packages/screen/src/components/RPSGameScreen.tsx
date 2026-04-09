// === Taş-Kağıt-Makas - Ana Ekran Görünümü ===
// TV/bilgisayar ekranında gösterilen oyun arayüzü.
// Oyuncuların seçimlerini, skorları ve sonuçları gösterir.

import { useEffect, useState } from 'react';
import { socket } from '../socket';
import { SocketEvents, RPSGameState, RPSChoice } from '@partyboard/shared';
import { PlayerInfo } from '../App';

interface RPSGameScreenProps {
  players: PlayerInfo[];
  onGameEnded: () => void;
}

// Seçim emojileri
const CHOICE_EMOJI: Record<RPSChoice, string> = {
  rock: '🪨',
  paper: '📄',
  scissors: '✂️',
};

// Seçim Türkçe isimleri
const CHOICE_NAME: Record<RPSChoice, string> = {
  rock: 'Taş',
  paper: 'Kağıt',
  scissors: 'Makas',
};

export function RPSGameScreen({ onGameEnded }: RPSGameScreenProps) {
  const [gameState, setGameState] = useState<RPSGameState | null>(null);
  const [showResult, setShowResult] = useState(false);
  // Oyun duraklatıldı mı?
  const [isPaused, setIsPaused] = useState(false);

  // Oyun durumunu dinle
  useEffect(() => {
    const handleGameState = (state: RPSGameState) => {
      setGameState(state);

      // Reveal aşamasında sonuç animasyonu göster
      if (state.phase === 'reveal') {
        setShowResult(true);
        setTimeout(() => setShowResult(false), 2500);
      }
    };

    // Oyun bitti eventi — sadece state'i günceller, lobiye otomatik dönmez
    const handleGameEnd = () => {
      // Otomatik lobiye dönüş yok — oda sahibi butona basacak
    };

    // Oda sahibi (ekrandan veya telefondan) lobiye dön dediğinde ana ekran da döner
    const handleReturnToLobby = () => {
      onGameEnded();
    };

    // Host duraklatınca ekranda duraklat ekranı göster
    const handlePause = () => {
      setIsPaused(true);
    };

    // Host devam ettirince duraklat ekranını kaldır
    const handleResume = () => {
      setIsPaused(false);
    };

    socket.on(SocketEvents.GAME_STATE, handleGameState);
    socket.on(SocketEvents.GAME_END, handleGameEnd);
    socket.on(SocketEvents.GAME_RETURN_LOBBY, handleReturnToLobby);
    socket.on(SocketEvents.HOST_PAUSE, handlePause);
    socket.on(SocketEvents.HOST_RESUME, handleResume);

    // Bileşen açıldığında mevcut oyun durumunu iste
    // (oyun başlangıç state'i bu bileşen mount olmadan önce gönderilmiş olabilir)
    socket.emit(SocketEvents.GAME_REQUEST_STATE);

    return () => {
      socket.off(SocketEvents.GAME_STATE, handleGameState);
      socket.off(SocketEvents.GAME_END, handleGameEnd);
      socket.off(SocketEvents.GAME_RETURN_LOBBY, handleReturnToLobby);
      socket.off(SocketEvents.HOST_PAUSE, handlePause);
      socket.off(SocketEvents.HOST_RESUME, handleResume);
    };
  }, [onGameEnded]);

  if (!gameState) {
    return (
      <div className="rps-screen">
        <p>Oyun yükleniyor...</p>
      </div>
    );
  }

  const player1 = gameState.players[0];
  const player2 = gameState.players[1];

  // Kazananın adını bul
  const getWinnerName = (winnerId: string) => {
    const winner = gameState.players.find((p) => p.id === winnerId);
    return winner ? winner.name : '';
  };

  return (
    <div className="rps-screen">
      {/* Duraklat ekranı — host telefonu duraklatınca görünür */}
      {isPaused && (
        <div className="rps-pause-overlay">
          <div className="rps-pause-box">
            <span className="rps-pause-icon">⏸</span>
            <span className="rps-pause-text">Oyun Duraklatıldı</span>
            <span className="rps-pause-hint">Oda sahibi devam ettirene kadar bekle...</span>
          </div>
        </div>
      )}

      <h1 className="rps-title">✊ Taş-Kağıt-Makas ✂️</h1>

      {/* Skor tablosu */}
      <div className="rps-scores">
        <div className="rps-score-player">
          <span className="rps-avatar">{player1.avatar}</span>
          <span className="rps-name">{player1.name}</span>
          <span className="rps-score">{gameState.scores[player1.id]}</span>
        </div>
        <div className="rps-vs">
          <span className="rps-round">Tur {gameState.round}/{gameState.bestOf}</span>
          <span className="rps-vs-text">VS</span>
        </div>
        <div className="rps-score-player">
          <span className="rps-avatar">{player2.avatar}</span>
          <span className="rps-name">{player2.name}</span>
          <span className="rps-score">{gameState.scores[player2.id]}</span>
        </div>
      </div>

      {/* Oyun alanı */}
      <div className="rps-arena">
        {/* Seçim aşaması */}
        {gameState.phase === 'choosing' && (
          <div className="rps-choosing">
            <div className={`rps-choice-box ${gameState.choices[player1.id] ? 'chosen' : ''}`}>
              {gameState.choices[player1.id] ? '✅ Seçti!' : '🤔 Seçiyor...'}
            </div>
            <div className="rps-waiting-text">Seçimler bekleniyor...</div>
            <div className={`rps-choice-box ${gameState.choices[player2.id] ? 'chosen' : ''}`}>
              {gameState.choices[player2.id] ? '✅ Seçti!' : '🤔 Seçiyor...'}
            </div>
          </div>
        )}

        {/* Sonuç açılma aşaması */}
        {gameState.phase === 'reveal' && gameState.currentRound && (
          <div className={`rps-reveal ${showResult ? 'animate' : ''}`}>
            <div className="rps-reveal-choice">
              <span className="rps-reveal-emoji">
                {CHOICE_EMOJI[gameState.currentRound.player1Choice]}
              </span>
              <span className="rps-reveal-label">
                {CHOICE_NAME[gameState.currentRound.player1Choice]}
              </span>
            </div>

            <div className="rps-result-text">
              {gameState.currentRound.winnerId === null
                ? '🤝 Berabere!'
                : `🏆 ${getWinnerName(gameState.currentRound.winnerId)} kazandı!`}
            </div>

            <div className="rps-reveal-choice">
              <span className="rps-reveal-emoji">
                {CHOICE_EMOJI[gameState.currentRound.player2Choice]}
              </span>
              <span className="rps-reveal-label">
                {CHOICE_NAME[gameState.currentRound.player2Choice]}
              </span>
            </div>
          </div>
        )}

        {/* Oyun bitti */}
        {gameState.phase === 'finished' && (
          <div className="rps-finished">
            <div className="rps-winner-text">🎉 Oyun Bitti! 🎉</div>
            {gameState.winnerId ? (
              <div className="rps-winner-name">
                {gameState.players.find((p) => p.id === gameState.winnerId)?.avatar}{' '}
                {getWinnerName(gameState.winnerId)} Kazandı!
              </div>
            ) : (
              <div className="rps-winner-name">🤝 Berabere!</div>
            )}
            <div className="rps-final-score">
              {gameState.scores[player1.id]} - {gameState.scores[player2.id]}
            </div>
            <button
              className="rps-return-btn"
              onClick={() => {
                socket.emit(SocketEvents.GAME_RETURN_LOBBY);
                onGameEnded();
              }}
            >
              🏠 Lobiye Dön
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
