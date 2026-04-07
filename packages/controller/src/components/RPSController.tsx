// === Taş-Kağıt-Makas - Telefon Kontrolcüsü ===
// Telefonda gösterilen 3 büyük buton: Taş, Kağıt, Makas
// Oyuncu seçimini yapar, sonucu bekler.

import { useEffect, useState } from 'react';
import { socket } from '../socket';
import { SocketEvents, RPSChoice, RPSGameState } from '@partyboard/shared';
import { PlayerInfo } from '../App';

interface RPSControllerProps {
  playerInfo: PlayerInfo;
  onGameEnded: () => void;
}

// Seçenekler
const CHOICES: { value: RPSChoice; emoji: string; label: string }[] = [
  { value: 'rock', emoji: '🪨', label: 'Taş' },
  { value: 'paper', emoji: '📄', label: 'Kağıt' },
  { value: 'scissors', emoji: '✂️', label: 'Makas' },
];

export function RPSController({ playerInfo, onGameEnded }: RPSControllerProps) {
  // Seçim yaptı mı?
  const [hasChosen, setHasChosen] = useState(false);
  // Seçilen seçenek
  const [myChoice, setMyChoice] = useState<RPSChoice | null>(null);
  // Oyun durumu
  const [gameState, setGameState] = useState<RPSGameState | null>(null);
  // Mesaj
  const [message, setMessage] = useState('Seçimini yap!');

  useEffect(() => {
    // Oyun durumu güncellendiğinde
    const handleGameState = (state: RPSGameState) => {
      setGameState(state);

      if (state.phase === 'choosing') {
        // Yeni tur — seçimleri sıfırla
        setHasChosen(false);
        setMyChoice(null);
        setMessage(`Tur ${state.round}: Seçimini yap!`);
      } else if (state.phase === 'reveal' && state.currentRound) {
        // Sonuç açıldı
        const { winnerId } = state.currentRound;
        if (winnerId === null) {
          setMessage('🤝 Berabere!');
        } else if (winnerId === playerInfo.id) {
          setMessage('🎉 Bu turu kazandın!');
        } else {
          setMessage('😔 Bu turu kaybettin.');
        }
      } else if (state.phase === 'finished') {
        if (state.winnerId === playerInfo.id) {
          setMessage('🏆 Tebrikler! Oyunu kazandın!');
        } else {
          setMessage('Oyun bitti. Rakibin kazandı.');
        }
      }
    };

    // Özel mesajlar (sunucudan sadece bu oyuncuya)
    const handlePrivate = (data: { type: string; choice?: RPSChoice }) => {
      if (data.type === 'rps:choice-confirmed') {
        setMessage('✅ Seçimin alındı! Rakip bekleniyor...');
      }
    };

    // Oyun bitti
    const handleGameEnd = () => {
      setTimeout(() => {
        onGameEnded();
      }, 5000);
    };

    socket.on(SocketEvents.GAME_STATE, handleGameState);
    socket.on(SocketEvents.PLAYER_PRIVATE, handlePrivate);
    socket.on(SocketEvents.GAME_END, handleGameEnd);

    return () => {
      socket.off(SocketEvents.GAME_STATE, handleGameState);
      socket.off(SocketEvents.PLAYER_PRIVATE, handlePrivate);
      socket.off(SocketEvents.GAME_END, handleGameEnd);
    };
  }, [playerInfo.id, onGameEnded]);

  // Seçim yap
  const handleChoose = (choice: RPSChoice) => {
    if (hasChosen) return; // Zaten seçtiyse tekrar seçemez

    setHasChosen(true);
    setMyChoice(choice);
    setMessage('Gönderiliyor...');

    // Sunucuya gönder
    socket.emit(SocketEvents.CONTROLLER_INPUT, {
      action: 'choose',
      choice,
    });
  };

  // Skor bilgisi
  const myScore = gameState ? gameState.scores[playerInfo.id] || 0 : 0;
  const opponentId = gameState?.players.find((p) => p.id !== playerInfo.id)?.id;
  const opponentScore = opponentId && gameState ? gameState.scores[opponentId] || 0 : 0;

  return (
    <div className="rps-controller">
      {/* Üst bilgi */}
      <div className="rps-ctrl-header">
        <span className="rps-ctrl-round">
          {gameState ? `Tur ${gameState.round}/${gameState.bestOf}` : ''}
        </span>
        <div className="rps-ctrl-score">
          <span className="rps-ctrl-my-score">{myScore}</span>
          <span className="rps-ctrl-separator">-</span>
          <span className="rps-ctrl-opp-score">{opponentScore}</span>
        </div>
      </div>

      {/* Mesaj */}
      <div className="rps-ctrl-message">{message}</div>

      {/* Seçim butonları */}
      <div className="rps-ctrl-buttons">
        {CHOICES.map((c) => (
          <button
            key={c.value}
            className={`rps-ctrl-btn ${myChoice === c.value ? 'selected' : ''} ${hasChosen && myChoice !== c.value ? 'disabled' : ''}`}
            onClick={() => handleChoose(c.value)}
            disabled={hasChosen || gameState?.phase !== 'choosing'}
          >
            <span className="rps-ctrl-emoji">{c.emoji}</span>
            <span className="rps-ctrl-label">{c.label}</span>
          </button>
        ))}
      </div>

      {/* Oyun bitti sonucu */}
      {gameState?.phase === 'finished' && (
        <div className="rps-ctrl-result">
          {gameState.winnerId === playerInfo.id ? (
            <span className="rps-ctrl-win">🏆 KAZANDIN!</span>
          ) : (
            <span className="rps-ctrl-lose">Kaybettin</span>
          )}
          <p className="hint">Lobiye dönülüyor...</p>
        </div>
      )}
    </div>
  );
}
