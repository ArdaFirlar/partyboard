// === Taş-Kağıt-Makas - Telefon Kontrolcüsü ===
// Telefonda gösterilen 3 büyük buton: Taş, Kağıt, Makas
// Oyuncu seçimini yapar, sonucu bekler.

import { useEffect, useState } from 'react';
import { socket } from '../socket';
import { SocketEvents, RPSChoice, RPSGameState } from '@partyboard/shared';
import { PlayerInfo } from '../App';
import { HostPanel } from './HostPanel';

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
        if (!state.winnerId) {
          setMessage('🤝 Berabere! Kimse kazanamadı.');
        } else if (state.winnerId === playerInfo.id) {
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

    // Oyun bitti — otomatik dönüş yok, oda sahibini bekle
    const handleGameEnd = () => {
      // Lobiye dönüş oda sahibinin kararına bırakıldı
    };

    // Oda sahibi lobiye dönüş verdiğinde telefon da döner
    const handleReturnToLobby = () => {
      onGameEnded();
    };

    // Yeniden başlatma: GAME_START gelince sadece seçim state'ini sıfırla.
    // gameState'i null YAPMA — sunucu zaten yeni GAME_STATE gönderecek.
    const handleGameStart = () => {
      setHasChosen(false);
      setMyChoice(null);
      setMessage('Seçimini yap!');
    };

    socket.on(SocketEvents.GAME_STATE, handleGameState);
    socket.on(SocketEvents.PLAYER_PRIVATE, handlePrivate);
    socket.on(SocketEvents.GAME_END, handleGameEnd);
    socket.on(SocketEvents.GAME_RETURN_LOBBY, handleReturnToLobby);
    socket.on(SocketEvents.GAME_START, handleGameStart);

    // Bileşen açıldığında mevcut oyun durumunu iste
    // (oyun başlangıç state'i bu bileşen mount olmadan önce gönderilmiş olabilir)
    socket.emit(SocketEvents.GAME_REQUEST_STATE);

    return () => {
      socket.off(SocketEvents.GAME_STATE, handleGameState);
      socket.off(SocketEvents.PLAYER_PRIVATE, handlePrivate);
      socket.off(SocketEvents.GAME_END, handleGameEnd);
      socket.off(SocketEvents.GAME_RETURN_LOBBY, handleReturnToLobby);
      socket.off(SocketEvents.GAME_START, handleGameStart);
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
      {/* Oda sahibi kontrol paneli — sadece host görür, oyun boyunca sabit */}
      {playerInfo.isHost && (
        <HostPanel gamePhase={gameState?.phase} onGameEnded={onGameEnded} />
      )}

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
          {!gameState.winnerId ? (
            <span className="rps-ctrl-lose">🤝 Berabere!</span>
          ) : gameState.winnerId === playerInfo.id ? (
            <span className="rps-ctrl-win">🏆 KAZANDIN!</span>
          ) : (
            <span className="rps-ctrl-lose">Kaybettin</span>
          )}

          {/* Oda sahibiyse lobiye dön butonu göster, değilse bekletici mesaj */}
          {playerInfo.isHost ? (
            <button
              className="rps-return-btn"
              onClick={() => {
                socket.emit(SocketEvents.GAME_RETURN_LOBBY);
                onGameEnded();
              }}
            >
              🏠 Lobiye Dön
            </button>
          ) : (
            <p className="hint">Oda sahibi lobiye dönüşü başlatacak...</p>
          )}
        </div>
      )}
    </div>
  );
}
