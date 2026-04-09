// === Monopoly - Ana Ekran (Faz 5) ===
// Tahta, oyuncu pozisyonları, ev/otel gösterimi, kart popup, skor tablosu.

import { useEffect, useState, useCallback, useRef } from 'react';
import { socket } from '../socket';
import { SocketEvents, MonopolyGameState, BoardSquare, GROUP_COLORS, MonopolyPlayer } from '@partyboard/shared';
import {
  playDiceRoll, playDiceResult, playDoubleRoll,
  playPayMoney, playCollectMoney, playBuyProperty,
  playBuildHouse, playDrawCard, playGoToJail,
  playBankrupt, playWin,
} from '../sound';

interface MonopolyGameScreenProps {
  onGameEnded: () => void;
}

// Kare için CSS grid pozisyonu (row/col, 1-indexed)
function getGridPos(index: number): { row: number; col: number } {
  if (index <= 10) return { row: 11, col: 11 - index };        // Alt sıra
  if (index <= 20) return { row: 11 - (index - 10), col: 1 };  // Sol sütun
  if (index <= 30) return { row: 1, col: index - 19 };         // Üst sıra
  return { row: index - 29, col: 11 };                         // Sağ sütun
}

// Bir karede hangi oyuncular var?
function playersOnSquare(players: MonopolyPlayer[], squareIndex: number) {
  return players.filter((p) => !p.isBankrupt && p.position === squareIndex);
}

// Ev/otel emoji (1-4 ev = 🏠×n, 5 = otel 🏨)
function houseLabel(level: number): string {
  if (level === 0) return '';
  if (level === 5) return '🏨';
  return '🏠'.repeat(level);
}

export function MonopolyGameScreen({ onGameEnded }: MonopolyGameScreenProps) {
  const [gameState, setGameState] = useState<MonopolyGameState | null>(null);
  const prevStateRef = useRef<MonopolyGameState | null>(null);

  const handleReturnToLobby = useCallback(() => onGameEnded(), [onGameEnded]);

  useEffect(() => {
    const handleGameState = (state: MonopolyGameState) => {
      const prev = prevStateRef.current;

      // Önceki durumla karşılaştırarak uygun sesi çal
      if (prev) {
        // Zar atıldı
        if (!prev.dice && state.dice) {
          playDiceRoll();
          setTimeout(() => {
            if (state.dice && state.dice[0] === state.dice[1]) playDoubleRoll();
            else playDiceResult();
          }, 500);
        }
        // Kart çekildi
        if (!prev.currentCard && state.currentCard) playDrawCard();
        // Hapise gidiş
        if (state.message.includes('HAPİSE') && !prev.message.includes('HAPİSE')) playGoToJail();
        // İflas
        if (state.message.includes('İFLAS') && !prev.message.includes('İFLAS')) playBankrupt();
        // Kazanma
        if (state.phase === 'finished' && prev.phase !== 'finished') playWin();
        // Para ödeme (mesajda "kira ödedi" geçiyor)
        if (state.message.includes('kira ödedi') && !prev.message.includes('kira ödedi')) playPayMoney();
        // Satın alma
        if (state.message.includes("satın aldı") && !prev.message.includes("satın aldı")) playBuyProperty();
        // Ev kurma
        if (state.message.includes("ev kurdu") || state.message.includes("OTEL")) playBuildHouse();
        // Para alma (kart, maaş)
        if ((state.message.includes('+$') || state.message.includes('maaş')) && !prev.message.includes('+$')) playCollectMoney();
      }

      prevStateRef.current = state;
      setGameState(state);
    };
    const handleGameEnd = () => {};

    socket.on(SocketEvents.GAME_STATE, handleGameState);
    socket.on(SocketEvents.GAME_END, handleGameEnd);
    socket.on(SocketEvents.GAME_RETURN_LOBBY, handleReturnToLobby);
    socket.on(SocketEvents.HOST_PAUSE, () => {});
    socket.on(SocketEvents.HOST_RESUME, () => {});
    socket.emit(SocketEvents.GAME_REQUEST_STATE);

    return () => {
      socket.off(SocketEvents.GAME_STATE, handleGameState);
      socket.off(SocketEvents.GAME_END, handleGameEnd);
      socket.off(SocketEvents.GAME_RETURN_LOBBY, handleReturnToLobby);
    };
  }, [handleReturnToLobby]);

  if (!gameState) {
    return <div className="mono-screen"><p>Monopoly yükleniyor...</p></div>;
  }

  const isDouble = gameState.dice ? gameState.dice[0] === gameState.dice[1] : false;

  return (
    <div className="mono-screen">
      {/* Üst bilgi şeridi */}
      <div className="mono-header">
        <span className="mono-title">🏠 Monopoly</span>
        <span className="mono-message">{gameState.message}</span>
        {gameState.dice && (
          <span className={`mono-dice ${isDouble ? 'mono-dice-double' : ''}`}>
            🎲 {gameState.dice[0]} + {gameState.dice[1]} = {gameState.dice[0] + gameState.dice[1]}
            {isDouble && ' ✨ ÇİFT!'}
          </span>
        )}
      </div>

      {/* Kart popup — şans veya topluluk kartı çekilince gösterilir */}
      {gameState.currentCard && (
        <div className="mono-card-popup">
          <div className="mono-card-inner">
            <div className="mono-card-type">
              {gameState.currentCard.type === 'chance' ? '🃏 ŞANS' : '📦 TOPLULUK SANDIĞI'}
            </div>
            <div className="mono-card-text">{gameState.currentCard.text}</div>
          </div>
        </div>
      )}

      <div className="mono-body">
        {/* Tahta */}
        <div className="mono-board">
          {gameState.board.map((sq: BoardSquare) => {
            const pos = getGridPos(sq.index);
            const here = playersOnSquare(gameState.players, sq.index);
            const isCorner = [0, 10, 20, 30].includes(sq.index);
            const ownerPlayer = gameState.players.find((p) => p.properties.includes(sq.index));
            const groupColor = sq.group ? GROUP_COLORS[sq.group] : null;
            const isLanded = gameState.landedSquare === sq.index;
            const improvement = gameState.improvements?.[sq.index] ?? 0;
            const isMortgaged = gameState.mortgaged?.includes(sq.index) ?? false;

            return (
              <div
                key={sq.index}
                className={`mono-sq ${isCorner ? 'mono-sq-corner' : ''} ${isLanded ? 'mono-sq-landed' : ''} ${isMortgaged ? 'mono-sq-mortgaged' : ''}`}
                style={{
                  gridRow: pos.row,
                  gridColumn: pos.col,
                  borderTop: groupColor && !isCorner ? `4px solid ${groupColor}` : undefined,
                  background: ownerPlayer ? `${ownerPlayer.color}22` : undefined,
                }}
              >
                <span className="mono-sq-name">{sq.name}</span>
                {sq.price && !isMortgaged && <span className="mono-sq-price">${sq.price}</span>}
                {isMortgaged && <span className="mono-sq-mortgage">İPOTEK</span>}
                {/* Ev/otel gösterimi */}
                {improvement > 0 && (
                  <span className="mono-sq-houses" title={improvement === 5 ? 'Otel' : `${improvement} Ev`}>
                    {houseLabel(improvement)}
                  </span>
                )}
                {/* Oyuncu taşları */}
                <div className="mono-sq-tokens">
                  {here.map((p) => (
                    <span
                      key={p.id}
                      className="mono-token"
                      style={{ background: p.color }}
                      title={p.name}
                    >
                      {p.avatar}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}

          {/* Merkez panel */}
          <div className="mono-center">
            <div className="mono-center-title">🏠 MONOPOLY</div>
            {gameState.dice && (
              <div className="mono-center-dice">
                <span className={`mono-die ${isDouble ? 'mono-die-double' : ''}`}>{gameState.dice[0]}</span>
                <span className="mono-die-plus">+</span>
                <span className={`mono-die ${isDouble ? 'mono-die-double' : ''}`}>{gameState.dice[1]}</span>
                {isDouble && <span className="mono-double-label">ÇİFT!</span>}
              </div>
            )}
            <div className="mono-center-turn">
              {gameState.phase !== 'finished' && (
                <span style={{ color: gameState.players[gameState.currentPlayerIndex]?.color }}>
                  ▶ {gameState.players[gameState.currentPlayerIndex]?.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Skor tablosu */}
        <div className="mono-scoreboard">
          <h3>Oyuncular</h3>
          {gameState.players.map((p) => {
            // Oyuncunun toplam mülk değerini hesapla
            const propCount = p.properties.length;
            const houseCount = p.properties.reduce((sum, i) => {
              const lvl = gameState.improvements?.[i] ?? 0;
              return sum + (lvl < 5 ? lvl : 0);
            }, 0);
            const hotelCount = p.properties.filter((i) => (gameState.improvements?.[i] ?? 0) === 5).length;

            return (
              <div
                key={p.id}
                className={`mono-player-card ${p.isBankrupt ? 'mono-player-bankrupt' : ''} ${p.id === gameState.currentPlayerId ? 'mono-player-active' : ''}`}
                style={{ borderLeft: `4px solid ${p.color}` }}
              >
                <span className="mono-player-avatar">{p.avatar}</span>
                <div className="mono-player-info">
                  <span className="mono-player-name">{p.name}</span>
                  <span className="mono-player-money">${p.money}</span>
                  <span className="mono-player-props">
                    {propCount} mülk
                    {houseCount > 0 && ` · ${houseCount}🏠`}
                    {hotelCount > 0 && ` · ${hotelCount}🏨`}
                    {p.getOutOfJailCards > 0 && ` · ${p.getOutOfJailCards}🃏`}
                  </span>
                </div>
                {p.inJail && <span className="mono-jail-badge">🔒</span>}
                {p.isBankrupt && <span className="mono-bankrupt-badge">💸</span>}
                {p.id === gameState.currentPlayerId && !p.isBankrupt && (
                  <span className="mono-turn-badge">▶</span>
                )}
              </div>
            );
          })}

          {/* Oyun bitti */}
          {gameState.phase === 'finished' && (
            <div className="mono-winner-box">
              <div>🏆 {gameState.winnerName} kazandı!</div>
              <button
                className="mono-return-btn"
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
    </div>
  );
}
