// === Monopoly - Telefon Kontrolcüsü (Faz 5) ===
// Sıradaki oyuncu: zar at, satın al/geç, ev kur/sat, ipotek, takas, hapisten çıkış.

import { useEffect, useState, useRef } from 'react';
import { socket } from '../socket';
import {
  SocketEvents,
  MonopolyGameState,
  MonopolyActions,
  GROUP_COLORS,
  HOUSE_COSTS,
  TradeOffer,
} from '@partyboard/shared';
import { PlayerInfo } from '../App';
import { HostPanel } from './HostPanel';
import { playMyTurn, playButtonTap, playWin, playLose } from '../sound';

interface MonopolyControllerProps {
  playerInfo: PlayerInfo;
  onGameEnded: () => void;
}

// Takas formu için yerel state tipi
interface TradeForm {
  toPlayerId: string;
  fromProps: number[];
  toProps: number[];
  fromMoney: number;
  toMoney: number;
}

export function MonopolyController({ playerInfo, onGameEnded }: MonopolyControllerProps) {
  const [gameState, setGameState] = useState<MonopolyGameState | null>(null);
  const [rolling, setRolling] = useState(false);
  const [showTrade, setShowTrade] = useState(false);
  const wasMyTurnRef = useRef(false);
  const [tradeForm, setTradeForm] = useState<TradeForm>({
    toPlayerId: '',
    fromProps: [],
    toProps: [],
    fromMoney: 0,
    toMoney: 0,
  });

  useEffect(() => {
    const handleGameState = (state: MonopolyGameState) => {
      const isMyTurnNow = state.currentPlayerId === playerInfo.id && state.phase !== 'finished';
      // Sıra yeni bana geçtiyse bildir
      if (isMyTurnNow && !wasMyTurnRef.current) playMyTurn();
      // Oyun bittiyse kazanma/kaybetme sesi
      if (state.phase === 'finished') {
        if (state.winnerId === playerInfo.id) playWin();
        else playLose();
      }
      wasMyTurnRef.current = isMyTurnNow;
      setGameState(state);
      setRolling(false);
    };

    const handleReturnToLobby = () => onGameEnded();
    const handleGameStart = () => { setRolling(false); };

    socket.on(SocketEvents.GAME_STATE, handleGameState);
    socket.on(SocketEvents.GAME_RETURN_LOBBY, handleReturnToLobby);
    socket.on(SocketEvents.GAME_START, handleGameStart);
    socket.emit(SocketEvents.GAME_REQUEST_STATE);

    return () => {
      socket.off(SocketEvents.GAME_STATE, handleGameState);
      socket.off(SocketEvents.GAME_RETURN_LOBBY, handleReturnToLobby);
      socket.off(SocketEvents.GAME_START, handleGameStart);
    };
  }, [onGameEnded]);

  const sendAction = (action: string, extra?: Record<string, unknown>) => {
    playButtonTap();
    if (action === MonopolyActions.ROLL_DICE) setRolling(true);
    socket.emit(SocketEvents.CONTROLLER_INPUT, { action, ...extra });
  };

  if (!gameState) {
    return <div className="mono-ctrl"><p>Oyun yükleniyor...</p></div>;
  }

  const me = gameState.players.find((p) => p.id === playerInfo.id);
  const isMyTurn = gameState.currentPlayerId === playerInfo.id;
  const isFinished = gameState.phase === 'finished';

  // Mülk detayları
  const myProperties = (me?.properties ?? []).map((i) => gameState.board[i]).filter(Boolean);

  // Takas ekranındaki hedef oyuncunun mülkleri
  const tradeTarget = gameState.players.find((p) => p.id === tradeForm.toPlayerId);
  const targetProperties = (tradeTarget?.properties ?? []).map((i) => gameState.board[i]).filter(Boolean);

  // Gelen takas teklifi (bana geldi mi?)
  const incomingTrade: TradeOffer | null =
    gameState.pendingTrade?.toPlayerId === playerInfo.id ? gameState.pendingTrade : null;
  const incomingTradeFrom = incomingTrade
    ? gameState.players.find((p) => p.id === incomingTrade.fromPlayerId)
    : null;

  // Takas gönder
  const submitTrade = () => {
    sendAction(MonopolyActions.SEND_TRADE, {
      toPlayerId: tradeForm.toPlayerId,
      fromProps: tradeForm.fromProps,
      toProps: tradeForm.toProps,
      fromMoney: tradeForm.fromMoney,
      toMoney: tradeForm.toMoney,
    });
    setShowTrade(false);
    setTradeForm({ toPlayerId: '', fromProps: [], toProps: [], fromMoney: 0, toMoney: 0 });
  };

  return (
    <div className="mono-ctrl">
      {/* Host paneli */}
      {playerInfo.isHost && (
        <HostPanel gamePhase={isFinished ? 'finished' : 'playing'} onGameEnded={onGameEnded} />
      )}

      {/* Kendi bilgisi */}
      {me && (
        <div className="mono-ctrl-me" style={{ borderLeft: `4px solid ${me.color}` }}>
          <span className="mono-ctrl-avatar">{me.avatar}</span>
          <div className="mono-ctrl-info">
            <span className="mono-ctrl-name">{me.name}</span>
            <span className="mono-ctrl-money">${me.money}</span>
            {me.inJail && <span className="mono-ctrl-jail">🔒 Hapishanede ({me.jailTurns}/3)</span>}
            {me.isBankrupt && <span className="mono-ctrl-bankrupt">💸 İFLAS</span>}
            {me.getOutOfJailCards > 0 && <span className="mono-ctrl-jailcard">🃏 ×{me.getOutOfJailCards} çıkış kartı</span>}
          </div>
        </div>
      )}

      {/* Mesaj */}
      <div className="mono-ctrl-message">{gameState.message}</div>

      {/* Zar */}
      {gameState.dice && (
        <div className={`mono-ctrl-dice ${gameState.dice[0] === gameState.dice[1] ? 'mono-ctrl-dice-double' : ''}`}>
          <span className="mono-ctrl-die">{gameState.dice[0]}</span>
          <span>+</span>
          <span className="mono-ctrl-die">{gameState.dice[1]}</span>
          <span>= {gameState.dice[0] + gameState.dice[1]}</span>
          {gameState.dice[0] === gameState.dice[1] && <span>✨ ÇİFT!</span>}
        </div>
      )}

      {/* Gelen takas teklifi */}
      {incomingTrade && incomingTradeFrom && (
        <div className="mono-ctrl-trade-incoming">
          <strong>{incomingTradeFrom.name} sana takas teklif etti!</strong>
          <div className="mono-ctrl-trade-detail">
            <span>Onların verdiği: {incomingTrade.fromProperties.map((i) => gameState.board[i]?.name).join(', ') || 'yok'} {incomingTrade.fromMoney > 0 ? `+$${incomingTrade.fromMoney}` : ''}</span>
            <span>Onların istediği: {incomingTrade.toProperties.map((i) => gameState.board[i]?.name).join(', ') || 'yok'} {incomingTrade.toMoney > 0 ? `+$${incomingTrade.toMoney}` : ''}</span>
          </div>
          <div className="mono-ctrl-trade-btns">
            <button className="mono-accept-btn" onClick={() => sendAction(MonopolyActions.ACCEPT_TRADE)}>✅ Kabul</button>
            <button className="mono-reject-btn" onClick={() => sendAction(MonopolyActions.REJECT_TRADE)}>❌ Reddet</button>
          </div>
        </div>
      )}

      {/* Ana aksiyon butonları */}
      {!isFinished && !me?.isBankrupt && (
        <div className="mono-ctrl-actions">
          {/* Zar atma fazı */}
          {isMyTurn && gameState.phase === 'rolling' && (
            <>
              <button
                className="mono-roll-btn"
                onClick={() => sendAction(MonopolyActions.ROLL_DICE)}
                disabled={rolling}
              >
                {rolling ? '🎲 Atılıyor...' : '🎲 Zar At!'}
              </button>

              {/* Hapisten çıkış seçenekleri */}
              {me?.inJail && (
                <div className="mono-ctrl-jail-options">
                  {(me.money ?? 0) >= 50 && (
                    <button className="mono-bail-btn" onClick={() => sendAction(MonopolyActions.PAY_BAIL)}>
                      💰 $50 Ödeyerek Çık
                    </button>
                  )}
                  {(me.getOutOfJailCards ?? 0) > 0 && (
                    <button className="mono-jailcard-btn" onClick={() => sendAction(MonopolyActions.USE_JAIL_CARD)}>
                      🃏 Kartla Çık
                    </button>
                  )}
                </div>
              )}

              {/* Ev/otel kurma */}
              {(gameState.buildableSquares?.length ?? 0) > 0 && (
                <div className="mono-ctrl-build">
                  <div className="mono-ctrl-section-title">🏠 Ev/Otel Kur</div>
                  {(gameState.buildableSquares ?? []).map((idx) => {
                    const sq = gameState.board[idx];
                    const lvl = gameState.improvements?.[idx] ?? 0;
                    const cost = sq.group ? (HOUSE_COSTS[sq.group as keyof typeof HOUSE_COSTS] ?? 0) : 0;
                    return (
                      <button
                        key={idx}
                        className="mono-build-btn"
                        onClick={() => sendAction(MonopolyActions.BUILD_HOUSE, { squareIndex: idx })}
                      >
                        {sq.name} ({lvl === 4 ? '→🏨 Otel' : `→${lvl + 1}🏠`}) -$${cost}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Ev/otel satma */}
              {(gameState.sellableSquares?.length ?? 0) > 0 && (
                <div className="mono-ctrl-sell-houses">
                  <div className="mono-ctrl-section-title">💰 Ev/Otel Sat</div>
                  {(gameState.sellableSquares ?? []).map((idx) => {
                    const sq = gameState.board[idx];
                    const lvl = gameState.improvements?.[idx] ?? 0;
                    const refund = sq.group ? Math.floor((HOUSE_COSTS[sq.group as keyof typeof HOUSE_COSTS] ?? 0) / 2) : 0;
                    return (
                      <button
                        key={idx}
                        className="mono-sell-btn"
                        onClick={() => sendAction(MonopolyActions.SELL_HOUSE, { squareIndex: idx })}
                      >
                        {sq.name} ({lvl === 5 ? '🏨→4🏠' : `${lvl}🏠→${lvl - 1}🏠`}) +$${refund}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* İpotek ve takas butonları */}
              {myProperties.length > 0 && (
                <div className="mono-ctrl-management">
                  {/* İpotek / İpotek kaldır */}
                  <div className="mono-ctrl-section-title">🏦 İpotek</div>
                  {myProperties.map((sq) => {
                    const isMortgaged = gameState.mortgaged?.includes(sq.index) ?? false;
                    const hasHouses = (gameState.improvements?.[sq.index] ?? 0) > 0;
                    const value = sq.mortgageValue ?? Math.floor((sq.price ?? 0) / 2);
                    const unmortgageCost = Math.floor(value * 1.1);
                    if (isMortgaged) {
                      return (
                        <button
                          key={sq.index}
                          className="mono-unmortgage-btn"
                          onClick={() => sendAction(MonopolyActions.UNMORTGAGE, { squareIndex: sq.index })}
                          disabled={(me?.money ?? 0) < unmortgageCost}
                        >
                          {sq.name}: İpotek Kaldır (-$${unmortgageCost})
                        </button>
                      );
                    }
                    if (!hasHouses) {
                      return (
                        <button
                          key={sq.index}
                          className="mono-mortgage-btn"
                          onClick={() => sendAction(MonopolyActions.MORTGAGE, { squareIndex: sq.index })}
                        >
                          {sq.name}: İpoteğe Ver (+$${value})
                        </button>
                      );
                    }
                    return null;
                  })}

                  {/* Takas */}
                  <button className="mono-trade-open-btn" onClick={() => setShowTrade(true)}>
                    🤝 Takas Teklif Et
                  </button>
                </div>
              )}
            </>
          )}

          {/* Satın alma fazı */}
          {isMyTurn && gameState.phase === 'buying' && (
            <div className="mono-buy-actions">
              {gameState.canBuy && (
                <button
                  className="mono-buy-btn"
                  onClick={() => sendAction(MonopolyActions.BUY_PROPERTY)}
                >
                  🏠 Satın Al
                </button>
              )}
              <button
                className="mono-skip-btn"
                onClick={() => sendAction(MonopolyActions.SKIP_BUY)}
              >
                ⏭ Geç
              </button>
            </div>
          )}

          {/* Bekleme mesajı */}
          {!isMyTurn && (
            <div className="mono-ctrl-waiting">
              ⏳ {gameState.players.find((p) => p.id === gameState.currentPlayerId)?.name} oynuyor...
            </div>
          )}
        </div>
      )}

      {/* Oyun bitti */}
      {isFinished && (
        <div className="mono-ctrl-finished">
          {gameState.winnerId === playerInfo.id ? (
            <span className="mono-ctrl-win">🏆 KAZANDIN!</span>
          ) : (
            <span className="mono-ctrl-lose">Oyun bitti. {gameState.winnerName} kazandı.</span>
          )}
          {playerInfo.isHost && (
            <button
              className="rps-return-btn"
              onClick={() => {
                socket.emit(SocketEvents.GAME_RETURN_LOBBY);
                onGameEnded();
              }}
            >
              🏠 Lobiye Dön
            </button>
          )}
        </div>
      )}

      {/* Takas modal */}
      {showTrade && (
        <div className="mono-trade-modal">
          <div className="mono-trade-modal-inner">
            <h3>🤝 Takas Teklifi</h3>

            {/* Hedef oyuncu seç */}
            <label>Kime teklif ediyorsun?</label>
            <select
              value={tradeForm.toPlayerId}
              onChange={(e) => setTradeForm({ ...tradeForm, toPlayerId: e.target.value, toProps: [] })}
            >
              <option value="">-- Seç --</option>
              {gameState.players
                .filter((p) => p.id !== playerInfo.id && !p.isBankrupt)
                .map((p) => (
                  <option key={p.id} value={p.id}>{p.avatar} {p.name}</option>
                ))}
            </select>

            {/* Benim verdiklerim */}
            <label>Sen veriyorsun (mülkler):</label>
            <div className="mono-trade-props">
              {myProperties.map((sq) => (
                <label key={sq.index} className="mono-trade-prop-check">
                  <input
                    type="checkbox"
                    checked={tradeForm.fromProps.includes(sq.index)}
                    onChange={(e) => {
                      const next = e.target.checked
                        ? [...tradeForm.fromProps, sq.index]
                        : tradeForm.fromProps.filter((i) => i !== sq.index);
                      setTradeForm({ ...tradeForm, fromProps: next });
                    }}
                  />
                  {sq.name}
                </label>
              ))}
            </div>
            <label>Sen veriyorsun (para): $
              <input
                type="number"
                min={0}
                value={tradeForm.fromMoney}
                onChange={(e) => setTradeForm({ ...tradeForm, fromMoney: Number(e.target.value) })}
              />
            </label>

            {/* Onların verdikleri */}
            {tradeTarget && (
              <>
                <label>{tradeTarget.name} veriyor (mülkler):</label>
                <div className="mono-trade-props">
                  {targetProperties.map((sq) => (
                    <label key={sq.index} className="mono-trade-prop-check">
                      <input
                        type="checkbox"
                        checked={tradeForm.toProps.includes(sq.index)}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...tradeForm.toProps, sq.index]
                            : tradeForm.toProps.filter((i) => i !== sq.index);
                          setTradeForm({ ...tradeForm, toProps: next });
                        }}
                      />
                      {sq.name}
                    </label>
                  ))}
                </div>
                <label>{tradeTarget.name} veriyor (para): $
                  <input
                    type="number"
                    min={0}
                    value={tradeForm.toMoney}
                    onChange={(e) => setTradeForm({ ...tradeForm, toMoney: Number(e.target.value) })}
                  />
                </label>
              </>
            )}

            <div className="mono-trade-modal-btns">
              <button
                className="mono-trade-send-btn"
                onClick={submitTrade}
                disabled={!tradeForm.toPlayerId}
              >
                Teklif Gönder
              </button>
              <button className="mono-trade-cancel-btn" onClick={() => setShowTrade(false)}>
                İptal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mülk listesi */}
      {myProperties.length > 0 && (
        <div className="mono-ctrl-props">
          <h4>Mülklerim ({myProperties.length})</h4>
          <div className="mono-ctrl-prop-list">
            {myProperties.map((sq) => {
              const lvl = gameState.improvements?.[sq.index] ?? 0;
              const isMortgaged = gameState.mortgaged?.includes(sq.index) ?? false;
              return (
                <div key={sq.index} className={`mono-ctrl-prop-item ${isMortgaged ? 'mono-ctrl-prop-mortgaged' : ''}`}>
                  {sq.group && (
                    <span
                      className="mono-ctrl-prop-dot"
                      style={{ background: GROUP_COLORS[sq.group] }}
                    />
                  )}
                  <span className="mono-ctrl-prop-name">{sq.fullName}</span>
                  <span className="mono-ctrl-prop-rent">
                    {isMortgaged ? 'İPOTEKLİ' : lvl > 0 ? (lvl === 5 ? '🏨' : `${'🏠'.repeat(lvl)}`) : (sq.baseRent ? `$${sq.baseRent}` : '')}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Diğer oyuncular skoru */}
      <div className="mono-ctrl-others">
        <h4>Skor Tablosu</h4>
        {gameState.players.map((p) => (
          <div
            key={p.id}
            className={`mono-ctrl-other ${p.id === playerInfo.id ? 'mono-ctrl-other-me' : ''} ${p.isBankrupt ? 'mono-ctrl-other-bankrupt' : ''}`}
            style={{ borderLeft: `3px solid ${p.color}` }}
          >
            <span>{p.avatar} {p.name}</span>
            <span>${p.money} · {p.properties.length} mülk</span>
            {p.inJail && <span>🔒</span>}
            {p.getOutOfJailCards > 0 && <span>🃏</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
