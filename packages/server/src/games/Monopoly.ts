// === Monopoly Oyun Modülü (Sunucu Tarafı — Faz 5) ===
// Özellikler: Ev/otel, çift zar, tam kart desteleri, ipotek, takas, hapisten ücretli çıkış.

import {
  GameManifest,
  MonopolyGameState,
  MonopolyPlayer,
  MonopolyActions,
  PLAYER_COLORS,
  ChanceCard,
  TradeOffer,
  HOUSE_COSTS,
} from '@partyboard/shared';
import { IGameModule, GameContext } from '../GameEngine';
import { BOARD, GROUP_SIZES } from './MonopolyBoard';
import { CHANCE_CARDS, COMMUNITY_CARDS, shuffleDeck } from './MonopolyCards';

// Türkçe tema
const DEFAULT_THEME = {
  id: 'classic',
  name: 'Klasik',
  currencySymbol: '$',
  boardNameOverrides: {} as Record<number, string>,
};

export class MonopolyGame implements IGameModule {
  manifest: GameManifest = {
    id: 'monopoly',
    name: 'Monopoly',
    description: 'Klasik mülk alıp satma oyunu. 2-6 oyuncu.',
    minPlayers: 2,
    maxPlayers: 6,
    version: '2.0.0',
    icon: '🏠',
  };

  private state!: MonopolyGameState;

  // Kart desteleri (sunucu iç durumu — client'a gönderilmez)
  private chanceDeck: ChanceCard[] = [];
  private communityDeck: ChanceCard[] = [];

  // ─── Başlatma ───────────────────────────────────────────────────────────────

  onStart(context: GameContext): void {
    const players: MonopolyPlayer[] = context.room.players.map((p, i) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      color: PLAYER_COLORS[i % PLAYER_COLORS.length],
      money: 1500,
      position: 0,
      properties: [],
      isBankrupt: false,
      inJail: false,
      jailTurns: 0,
      getOutOfJailCards: 0,
    }));

    // Kart destelerini karıştır
    this.chanceDeck = shuffleDeck(CHANCE_CARDS);
    this.communityDeck = shuffleDeck(COMMUNITY_CARDS);

    this.state = {
      phase: 'rolling',
      players,
      currentPlayerIndex: 0,
      currentPlayerId: players[0].id,
      dice: null,
      doubleCount: 0,
      message: `${players[0].name} zar atacak!`,
      landedSquare: null,
      canBuy: false,
      board: BOARD,
      improvements: {},       // kare index → ev/otel sayısı (1-4 ev, 5 otel)
      mortgaged: [],          // ipotek edilmiş kare indeksleri
      pendingTrade: null,
      currentCard: null,
      buildableSquares: [],
      sellableSquares: [],
      theme: DEFAULT_THEME,
    };

    context.sendGameState(this.state);
  }

  // ─── Girdi İşleme ───────────────────────────────────────────────────────────

  onInput(playerId: string, data: unknown, context: GameContext): void {
    const input = data as { action: string; squareIndex?: number; toPlayerId?: string; fromProps?: number[]; toProps?: number[]; fromMoney?: number; toMoney?: number };
    const current = this.currentPlayer();

    // Takas kabulü/reddi — sıra kontrolü yok (hedef oyuncu da yanıt verebilir)
    if (input.action === MonopolyActions.ACCEPT_TRADE) {
      if (this.state.pendingTrade?.toPlayerId === playerId) {
        this.acceptTrade(context);
      }
      return;
    }
    if (input.action === MonopolyActions.REJECT_TRADE) {
      if (this.state.pendingTrade?.toPlayerId === playerId) {
        this.rejectTrade(context);
      }
      return;
    }

    // Geri kalan eylemler yalnızca sıradaki oyuncuya ait
    if (playerId !== current.id) return;
    if (current.isBankrupt) return;

    switch (input.action) {
      case MonopolyActions.ROLL_DICE:
        if (this.state.phase === 'rolling') this.rollAndMove(context);
        break;

      case MonopolyActions.BUY_PROPERTY:
        if (this.state.phase === 'buying') this.buyProperty(context);
        break;

      case MonopolyActions.SKIP_BUY:
        if (this.state.phase === 'buying') this.endTurn(context);
        break;

      case MonopolyActions.BUILD_HOUSE:
        if (input.squareIndex !== undefined) this.buildHouse(input.squareIndex, context);
        break;

      case MonopolyActions.SELL_HOUSE:
        if (input.squareIndex !== undefined) this.sellHouse(input.squareIndex, context);
        break;

      case MonopolyActions.MORTGAGE:
        if (input.squareIndex !== undefined) this.mortgageProperty(input.squareIndex, context);
        break;

      case MonopolyActions.UNMORTGAGE:
        if (input.squareIndex !== undefined) this.unmortgageProperty(input.squareIndex, context);
        break;

      case MonopolyActions.SEND_TRADE:
        if (input.toPlayerId !== undefined) {
          this.sendTrade({
            fromPlayerId: playerId,
            toPlayerId: input.toPlayerId,
            fromProperties: input.fromProps ?? [],
            toProperties: input.toProps ?? [],
            fromMoney: input.fromMoney ?? 0,
            toMoney: input.toMoney ?? 0,
          }, context);
        }
        break;

      case MonopolyActions.PAY_BAIL:
        if (current.inJail && current.money >= 50) this.payBail(context);
        break;

      case MonopolyActions.USE_JAIL_CARD:
        if (current.inJail && current.getOutOfJailCards > 0) this.useJailCard(context);
        break;
    }
  }

  // ─── Zar At ve Hareket Et ───────────────────────────────────────────────────

  private rollAndMove(context: GameContext): void {
    const die1 = Math.ceil(Math.random() * 6);
    const die2 = Math.ceil(Math.random() * 6);
    const roll = die1 + die2;
    const isDouble = die1 === die2;
    const player = this.currentPlayer();

    this.state.dice = [die1, die2];
    this.state.currentCard = null; // Önceki kartı temizle

    // Hapishane kontrolü
    if (player.inJail) {
      if (isDouble) {
        // Çift zarla hapisten çık
        player.inJail = false;
        player.jailTurns = 0;
        this.state.doubleCount = 0; // Hapishaneden çıkış çifti tur tekrarı vermez
        this.state.message = `${player.name} çift zarla hapishaneden çıktı! (${die1}+${die2})`;
      } else {
        player.jailTurns++;
        if (player.jailTurns >= 3) {
          // 3. turda $50 öde ve çık
          const fine = Math.min(50, player.money);
          player.money -= fine;
          player.inJail = false;
          player.jailTurns = 0;
          this.state.message = `${player.name} $50 ödeyerek hapishaneden çıktı! Zar: ${die1}+${die2}`;
        } else {
          this.state.message = `${player.name} hapishanede (${player.jailTurns}/3 tur). Zar: ${die1}+${die2}`;
          this.updateBuildableSquares();
          this.broadcastAndScheduleNextTurn(context, 2000);
          return;
        }
      }
    }

    // Üst üste 3 kez çift zar → hapise
    if (!player.inJail) {
      if (isDouble) {
        this.state.doubleCount++;
        if (this.state.doubleCount >= 3) {
          player.position = 10;
          player.inJail = true;
          player.jailTurns = 0;
          this.state.doubleCount = 0;
          this.state.landedSquare = 10;
          this.state.message = `${player.name} üst üste 3 çift zar! HAPİSE GİTTİ! 🚔`;
          this.updateBuildableSquares();
          this.broadcastAndScheduleNextTurn(context, 2000);
          return;
        }
      } else {
        this.state.doubleCount = 0;
      }
    }

    // Hareket
    const oldPos = player.position;
    const newPos = (oldPos + roll) % 40;
    player.position = newPos;
    this.state.landedSquare = newPos;

    // Başlangıç'tan geçince +$200
    if (oldPos + roll >= 40 && newPos !== 0) {
      player.money += 200;
    }

    this.handleSquareLanding(player, newPos, [die1, die2], isDouble, context);
  }

  // ─── Kareye İniş Mantığı ────────────────────────────────────────────────────

  private handleSquareLanding(
    player: MonopolyPlayer,
    squareIndex: number,
    dice: [number, number],
    isDouble: boolean,
    context: GameContext,
  ): void {
    const square = BOARD[squareIndex];

    switch (square.type) {
      case 'go':
        player.money += 200; // Başlangıç'a tam gelmek de $200
        this.state.message = `${player.name} Başlangıç'a geldi! +$200 maaş.`;
        this.finishLanding(isDouble, context, 2000);
        break;

      case 'property':
      case 'railroad':
      case 'utility': {
        const isMortgaged = this.state.mortgaged.includes(squareIndex);
        const owner = this.findOwner(squareIndex);

        if (!owner) {
          // Sahipsiz — satın al seçeneği
          this.state.phase = 'buying';
          this.state.canBuy = square.price !== undefined && !isMortgaged && player.money >= (square.price ?? 0);
          this.state.message = `${player.name} ${square.fullName}'e geldi. Fiyat: $${square.price}. Satın al?`;
          this.updateBuildableSquares();
          context.sendGameState(this.state);
        } else if (owner.id === player.id) {
          // Kendi mülkü
          this.state.message = `${player.name} kendi mülkü ${square.fullName}'e geldi.`;
          this.finishLanding(isDouble, context, 1500);
        } else if (isMortgaged) {
          // İpotekli — kira alınmaz
          this.state.message = `${player.name} ${square.fullName}'e geldi. Mülk ipotekli, kira yok.`;
          this.finishLanding(isDouble, context, 1500);
        } else {
          // Başkasının — kira öde
          const rent = this.calculateRent(squareIndex, owner, dice);
          const paid = Math.min(rent, player.money);
          player.money -= paid;
          owner.money += paid;
          this.state.message = `${player.name} ${square.fullName}'e geldi. ${owner.name}'e $${paid} kira ödedi!`;

          if (player.money <= 0) {
            this.declareBankruptcy(player, owner, context);
            return;
          }
          this.finishLanding(isDouble, context, 2500);
        }
        break;
      }

      case 'tax': {
        const tax = square.taxAmount ?? 0;
        const paid = Math.min(tax, player.money);
        player.money -= paid;
        this.state.message = `${player.name} ${square.fullName}'e geldi. $${paid} vergi ödedi!`;
        if (player.money <= 0) {
          this.declareBankruptcy(player, null, context);
          return;
        }
        this.finishLanding(isDouble, context, 2000);
        break;
      }

      case 'go-to-jail':
        player.position = 10;
        player.inJail = true;
        player.jailTurns = 0;
        this.state.doubleCount = 0;
        this.state.landedSquare = 10;
        this.state.message = `${player.name} HAPİSE GİTTİ! 🚔`;
        this.updateBuildableSquares();
        this.broadcastAndScheduleNextTurn(context, 2000);
        break;

      case 'jail':
      case 'free-parking':
        this.state.message = `${player.name} ${square.fullName}'e geldi.`;
        this.finishLanding(isDouble, context, 1500);
        break;

      case 'chance':
        this.drawCard('chance', player, dice, isDouble, context);
        break;

      case 'community':
        this.drawCard('community', player, dice, isDouble, context);
        break;

      default:
        this.state.message = `${player.name} ${square.name}'e geldi.`;
        this.finishLanding(isDouble, context, 1500);
    }
  }

  // ─── Kart Çekme ─────────────────────────────────────────────────────────────

  private drawCard(
    type: 'chance' | 'community',
    player: MonopolyPlayer,
    dice: [number, number],
    isDouble: boolean,
    context: GameContext,
  ): void {
    const deck = type === 'chance' ? this.chanceDeck : this.communityDeck;

    // Deste bittiyse yeniden karıştır
    if (deck.length === 0) {
      const fresh = type === 'chance' ? CHANCE_CARDS : COMMUNITY_CARDS;
      const shuffled = shuffleDeck(fresh);
      if (type === 'chance') this.chanceDeck = shuffled;
      else this.communityDeck = shuffled;
    }

    const card = deck.shift()!;
    this.state.currentCard = card;
    const effect = card.effect;

    switch (effect.kind) {
      case 'collect':
        player.money += effect.amount ?? 0;
        this.state.message = `${player.name} kart çekti: "${card.text}" +$${effect.amount}`;
        this.finishLanding(isDouble, context, 3000);
        break;

      case 'pay': {
        const amt = effect.amount ?? 0;
        const paid = Math.min(amt, player.money);
        player.money -= paid;
        this.state.message = `${player.name} kart çekti: "${card.text}" -$${paid}`;
        if (player.money <= 0) {
          this.declareBankruptcy(player, null, context);
          return;
        }
        this.finishLanding(isDouble, context, 3000);
        break;
      }

      case 'collect-from-each': {
        const amt = effect.amount ?? 0;
        let collected = 0;
        for (const other of this.state.players) {
          if (other.id === player.id || other.isBankrupt) continue;
          const take = Math.min(amt, other.money);
          other.money -= take;
          player.money += take;
          collected += take;
        }
        this.state.message = `${player.name} kart çekti: "${card.text}" +$${collected}`;
        this.finishLanding(isDouble, context, 3000);
        break;
      }

      case 'pay-to-each': {
        const amt = effect.amount ?? 0;
        for (const other of this.state.players) {
          if (other.id === player.id || other.isBankrupt) continue;
          const give = Math.min(amt, player.money);
          player.money -= give;
          other.money += give;
        }
        this.state.message = `${player.name} kart çekti: "${card.text}"`;
        if (player.money <= 0) {
          this.declareBankruptcy(player, null, context);
          return;
        }
        this.finishLanding(isDouble, context, 3000);
        break;
      }

      case 'repairs': {
        const perHouse = effect.perHouse ?? 0;
        const perHotel = effect.perHotel ?? 0;
        let total = 0;
        for (const propIndex of player.properties) {
          const level = this.state.improvements[propIndex] ?? 0;
          if (level === 5) total += perHotel;       // 5 = otel
          else total += level * perHouse;           // 1-4 = ev sayısı
        }
        const paid = Math.min(total, player.money);
        player.money -= paid;
        this.state.message = `${player.name} kart çekti: "${card.text}" -$${paid}`;
        if (player.money <= 0) {
          this.declareBankruptcy(player, null, context);
          return;
        }
        this.finishLanding(isDouble, context, 3000);
        break;
      }

      case 'advance-to': {
        const target = effect.position ?? 0;
        const oldPos = player.position;
        player.position = target;
        this.state.landedSquare = target;
        // Başlangıç'tan geçtiyse maaş
        if (target <= oldPos && target !== 0) {
          player.money += 200;
        }
        this.state.message = `${player.name} kart çekti: "${card.text}"`;
        // Kısa gecikme sonra yeni kareyi işle
        context.sendGameState(this.state);
        setTimeout(() => {
          this.handleSquareLanding(player, target, dice, false, context);
        }, 1500);
        return;
      }

      case 'advance-to-nearest-railroad': {
        const railroads = [5, 15, 25, 35];
        const pos = player.position;
        const nearest = railroads.find((r) => r > pos) ?? railroads[0];
        const oldPos2 = player.position;
        player.position = nearest;
        this.state.landedSquare = nearest;
        if (nearest <= oldPos2) player.money += 200;
        this.state.message = `${player.name} kart çekti: "${card.text}"`;
        context.sendGameState(this.state);
        // Kira çarpanı bilgisini geçici olarak saklıyoruz
        setTimeout(() => {
          this.handleSquareLandingWithMultiplier(player, nearest, dice, false, effect.railroadMultiplier ?? 1, context);
        }, 1500);
        return;
      }

      case 'advance-to-nearest-utility': {
        const utilities = [12, 28];
        const posU = player.position;
        const nearestU = utilities.find((u) => u > posU) ?? utilities[0];
        const oldPosU = player.position;
        player.position = nearestU;
        this.state.landedSquare = nearestU;
        if (nearestU <= oldPosU) player.money += 200;
        this.state.message = `${player.name} kart çekti: "${card.text}"`;
        context.sendGameState(this.state);
        setTimeout(() => {
          this.handleSquareLandingWithMultiplier(player, nearestU, dice, false, 10, context);
        }, 1500);
        return;
      }

      case 'go-back': {
        const spaces = effect.spaces ?? 3;
        const newPos = (player.position - spaces + 40) % 40;
        player.position = newPos;
        this.state.landedSquare = newPos;
        this.state.message = `${player.name} kart çekti: "${card.text}"`;
        context.sendGameState(this.state);
        setTimeout(() => {
          this.handleSquareLanding(player, newPos, dice, false, context);
        }, 1500);
        return;
      }

      case 'go-to-jail':
        player.position = 10;
        player.inJail = true;
        player.jailTurns = 0;
        this.state.doubleCount = 0;
        this.state.landedSquare = 10;
        this.state.message = `${player.name} kart çekti: "${card.text}" 🚔`;
        this.updateBuildableSquares();
        this.broadcastAndScheduleNextTurn(context, 3000);
        break;

      case 'get-out-of-jail-card':
        player.getOutOfJailCards++;
        this.state.message = `${player.name} Hapishaneden Çıkış Kartı aldı!`;
        this.finishLanding(isDouble, context, 3000);
        break;

      default:
        this.finishLanding(isDouble, context, 2000);
    }
  }

  // Çarpanlı kira için özel iniş (demiryolu x2, şirket x10)
  private handleSquareLandingWithMultiplier(
    player: MonopolyPlayer,
    squareIndex: number,
    dice: [number, number],
    isDouble: boolean,
    multiplier: number,
    context: GameContext,
  ): void {
    const owner = this.findOwner(squareIndex);
    if (!owner || owner.id === player.id) {
      this.handleSquareLanding(player, squareIndex, dice, isDouble, context);
      return;
    }

    const square = BOARD[squareIndex];
    let rent = this.calculateRent(squareIndex, owner, dice);
    rent = Math.round(rent * multiplier);
    const paid = Math.min(rent, player.money);
    player.money -= paid;
    owner.money += paid;
    this.state.message = `${player.name} ${square.fullName}'e geldi. ${owner.name}'e $${paid} kira ödedi (x${multiplier})!`;

    if (player.money <= 0) {
      this.declareBankruptcy(player, owner, context);
      return;
    }
    this.finishLanding(isDouble, context, 2500);
  }

  // ─── Mülk Satın Al ──────────────────────────────────────────────────────────

  private buyProperty(context: GameContext): void {
    const player = this.currentPlayer();
    const square = BOARD[player.position];

    if (square.price !== undefined && player.money >= square.price) {
      player.money -= square.price;
      player.properties.push(player.position);
      this.state.message = `${player.name} ${square.fullName}'i $${square.price}'ye satın aldı!`;
    }

    this.endTurn(context);
  }

  // ─── Ev / Otel Kurma ────────────────────────────────────────────────────────

  private buildHouse(squareIndex: number, context: GameContext): void {
    const player = this.currentPlayer();
    const square = BOARD[squareIndex];

    if (
      !player.properties.includes(squareIndex) ||
      square.type !== 'property' ||
      !square.group ||
      !(square.group in HOUSE_COSTS)
    ) return;

    // Tüm grup sahibi olunmalı
    if (!this.ownsFullGroup(player, square.group)) {
      this.state.message = 'Ev kurmak için renk grubunun tamamına sahip olmalısın!';
      context.sendGameState(this.state);
      return;
    }

    const cost = HOUSE_COSTS[square.group as keyof typeof HOUSE_COSTS] ?? 0;
    if (player.money < cost) {
      this.state.message = 'Yeterli para yok!';
      context.sendGameState(this.state);
      return;
    }

    const current = this.state.improvements[squareIndex] ?? 0;
    if (current >= 5) {
      this.state.message = 'Bu mülkte zaten otel var!';
      context.sendGameState(this.state);
      return;
    }

    // İpotekli mülke ev kurulamaz
    if (this.state.mortgaged.includes(squareIndex)) {
      this.state.message = 'İpotekli mülke ev kurulamaz!';
      context.sendGameState(this.state);
      return;
    }

    // Dengeli inşaat kuralı: gruptaki tüm mülklerin en az aynı sayıda evi olmalı
    if (!this.canBuildHere(squareIndex)) {
      this.state.message = 'Dengeli inşaat kuralı: önce diğer mülklere ev kur!';
      context.sendGameState(this.state);
      return;
    }

    player.money -= cost;
    this.state.improvements[squareIndex] = current + 1;
    const level = this.state.improvements[squareIndex];
    const label = level === 5 ? 'OTEL' : `${level} ev`;
    this.state.message = `${player.name} ${square.fullName}'e ${label} kurdu! -$${cost}`;
    this.updateBuildableSquares();
    context.sendGameState(this.state);
  }

  // ─── Ev / Otel Satma ────────────────────────────────────────────────────────

  private sellHouse(squareIndex: number, context: GameContext): void {
    const player = this.currentPlayer();
    const square = BOARD[squareIndex];

    if (!player.properties.includes(squareIndex) || square.type !== 'property' || !square.group) return;

    const current = this.state.improvements[squareIndex] ?? 0;
    if (current === 0) {
      this.state.message = 'Bu mülkte ev yok!';
      context.sendGameState(this.state);
      return;
    }

    // Dengeli satış kuralı: gruptaki en yüksek evden satılır
    if (!this.canSellHere(squareIndex)) {
      this.state.message = 'Dengeli satış kuralı: önce diğer mülklerden sat!';
      context.sendGameState(this.state);
      return;
    }

    const cost = HOUSE_COSTS[square.group as keyof typeof HOUSE_COSTS] ?? 0;
    const refund = Math.floor(cost / 2);
    player.money += refund;
    this.state.improvements[squareIndex] = current - 1;
    const level = this.state.improvements[squareIndex];
    const label = level === 0 ? 'evler kaldırıldı' : `${level} ev kaldı`;
    this.state.message = `${player.name} ${square.fullName}'den ev sattı. +$${refund} (${label})`;
    this.updateBuildableSquares();
    context.sendGameState(this.state);
  }

  // ─── İpotek ─────────────────────────────────────────────────────────────────

  private mortgageProperty(squareIndex: number, context: GameContext): void {
    const player = this.currentPlayer();
    const square = BOARD[squareIndex];

    if (!player.properties.includes(squareIndex)) return;
    if (this.state.mortgaged.includes(squareIndex)) {
      this.state.message = 'Bu mülk zaten ipotekli!';
      context.sendGameState(this.state);
      return;
    }
    // İpotek öncesi tüm evlerin satılmış olması gerekir
    if ((this.state.improvements[squareIndex] ?? 0) > 0) {
      this.state.message = 'İpotek koymak için önce evleri sat!';
      context.sendGameState(this.state);
      return;
    }

    const value = square.mortgageValue ?? Math.floor((square.price ?? 0) / 2);
    player.money += value;
    this.state.mortgaged.push(squareIndex);
    this.state.message = `${player.name} ${square.fullName}'i ipotek etti. +$${value}`;
    this.updateBuildableSquares();
    context.sendGameState(this.state);
  }

  private unmortgageProperty(squareIndex: number, context: GameContext): void {
    const player = this.currentPlayer();
    const square = BOARD[squareIndex];

    if (!player.properties.includes(squareIndex)) return;
    if (!this.state.mortgaged.includes(squareIndex)) {
      this.state.message = 'Bu mülk ipotekli değil!';
      context.sendGameState(this.state);
      return;
    }

    const value = square.mortgageValue ?? Math.floor((square.price ?? 0) / 2);
    const cost = Math.floor(value * 1.1); // %10 faizle geri al
    if (player.money < cost) {
      this.state.message = `Yetersiz para! İpoteği kaldırmak için $${cost} gerekli.`;
      context.sendGameState(this.state);
      return;
    }

    player.money -= cost;
    this.state.mortgaged = this.state.mortgaged.filter((i) => i !== squareIndex);
    this.state.message = `${player.name} ${square.fullName}'in ipoteğini $${cost}'ye kaldırdı.`;
    this.updateBuildableSquares();
    context.sendGameState(this.state);
  }

  // ─── Takas ──────────────────────────────────────────────────────────────────

  private sendTrade(offer: Omit<TradeOffer, 'id'>, context: GameContext): void {
    const from = this.state.players.find((p) => p.id === offer.fromPlayerId);
    const to = this.state.players.find((p) => p.id === offer.toPlayerId);
    if (!from || !to || to.isBankrupt) return;

    // Basit doğrulama
    if (from.money < offer.fromMoney) {
      this.state.message = 'Takas için yeterli paran yok!';
      context.sendGameState(this.state);
      return;
    }

    this.state.pendingTrade = {
      id: `trade_${Date.now()}`,
      ...offer,
    };
    this.state.message = `${from.name}, ${to.name}'e takas teklifi gönderdi!`;
    context.sendGameState(this.state);
  }

  private acceptTrade(context: GameContext): void {
    const trade = this.state.pendingTrade;
    if (!trade) return;

    const from = this.state.players.find((p) => p.id === trade.fromPlayerId);
    const to = this.state.players.find((p) => p.id === trade.toPlayerId);
    if (!from || !to) return;

    // Para transferi
    from.money -= trade.fromMoney;
    to.money += trade.fromMoney;
    to.money -= trade.toMoney;
    from.money += trade.toMoney;

    // Mülk transferi
    for (const prop of trade.fromProperties) {
      from.properties = from.properties.filter((p) => p !== prop);
      to.properties.push(prop);
    }
    for (const prop of trade.toProperties) {
      to.properties = to.properties.filter((p) => p !== prop);
      from.properties.push(prop);
    }

    this.state.pendingTrade = null;
    this.state.message = `Takas kabul edildi! ${from.name} ↔ ${to.name}`;
    this.updateBuildableSquares();
    context.sendGameState(this.state);
  }

  private rejectTrade(context: GameContext): void {
    const trade = this.state.pendingTrade;
    if (!trade) return;

    const from = this.state.players.find((p) => p.id === trade.fromPlayerId);
    this.state.pendingTrade = null;
    this.state.message = `Takas reddedildi! ${from?.name ?? '?'}`;
    context.sendGameState(this.state);
  }

  // ─── Hapishaneden Çıkış ─────────────────────────────────────────────────────

  private payBail(context: GameContext): void {
    const player = this.currentPlayer();
    player.money -= 50;
    player.inJail = false;
    player.jailTurns = 0;
    this.state.message = `${player.name} $50 ödeyerek hapishaneden çıktı!`;
    context.sendGameState(this.state);
  }

  private useJailCard(context: GameContext): void {
    const player = this.currentPlayer();
    player.getOutOfJailCards--;
    player.inJail = false;
    player.jailTurns = 0;
    this.state.message = `${player.name} kart kullanarak hapishaneden çıktı!`;
    context.sendGameState(this.state);
  }

  // ─── Tur Yönetimi ───────────────────────────────────────────────────────────

  private finishLanding(isDouble: boolean, context: GameContext, delay: number): void {
    // Çift zar: tekrar atar (hapishaneden çıkmak hariç yukarıda halledildi)
    if (isDouble && this.state.doubleCount > 0 && !this.currentPlayer().inJail) {
      this.state.phase = 'rolling';
      this.state.canBuy = false;
      this.state.message += ` (ÇİFT ZAR — tekrar at!)`;
      this.updateBuildableSquares();
      context.sendGameState(this.state);
      return; // Oyuncu tekrar zar atana kadar bekle
    }
    this.updateBuildableSquares();
    this.broadcastAndScheduleNextTurn(context, delay);
  }

  private endTurn(context: GameContext): void {
    this.state.phase = 'rolling';
    this.state.canBuy = false;
    this.state.landedSquare = null;
    this.state.dice = null;
    this.state.doubleCount = 0;
    this.state.currentCard = null;
    this.advanceToNextPlayer(context);
  }

  private broadcastAndScheduleNextTurn(context: GameContext, delay: number): void {
    context.sendGameState(this.state);
    setTimeout(() => this.endTurn(context), delay);
  }

  private advanceToNextPlayer(context: GameContext): void {
    const activePlayers = this.state.players.filter((p) => !p.isBankrupt);

    if (activePlayers.length === 1) {
      const winner = activePlayers[0];
      this.state.phase = 'finished';
      this.state.winnerId = winner.id;
      this.state.winnerName = winner.name;
      this.state.message = `🏆 ${winner.name} kazandı!`;
      context.sendGameState(this.state);
      context.endGame({ winnerId: winner.id, winnerName: winner.name });
      return;
    }

    let nextIndex = (this.state.currentPlayerIndex + 1) % this.state.players.length;
    while (this.state.players[nextIndex].isBankrupt) {
      nextIndex = (nextIndex + 1) % this.state.players.length;
    }

    this.state.currentPlayerIndex = nextIndex;
    this.state.currentPlayerId = this.state.players[nextIndex].id;
    this.state.message = `${this.state.players[nextIndex].name} zar atacak!`;
    this.updateBuildableSquares();
    context.sendGameState(this.state);
  }

  // ─── İflas ──────────────────────────────────────────────────────────────────

  private declareBankruptcy(player: MonopolyPlayer, creditor: MonopolyPlayer | null, context: GameContext): void {
    player.isBankrupt = true;
    player.money = 0;

    // Mülkleri alacaklıya veya bankaya devret
    for (const propIndex of player.properties) {
      if (creditor) {
        creditor.properties.push(propIndex);
      } else {
        // Bankaya iade — iyileştirmeleri sıfırla
        this.state.improvements[propIndex] = 0;
        this.state.mortgaged = this.state.mortgaged.filter((i) => i !== propIndex);
      }
    }
    player.properties = [];

    this.state.message = `${player.name} İFLAS ETTİ! 💸`;
    context.sendGameState(this.state);

    setTimeout(() => this.advanceToNextPlayer(context), 2500);
  }

  // ─── Yardımcı Metotlar ──────────────────────────────────────────────────────

  private currentPlayer(): MonopolyPlayer {
    return this.state.players[this.state.currentPlayerIndex];
  }

  private findOwner(squareIndex: number): MonopolyPlayer | null {
    return this.state.players.find((p) => !p.isBankrupt && p.properties.includes(squareIndex)) ?? null;
  }

  private ownsFullGroup(player: MonopolyPlayer, group: string): boolean {
    const groupSquares = BOARD.filter((s) => s.group === group);
    return groupSquares.every((s) => player.properties.includes(s.index));
  }

  private canBuildHere(squareIndex: number): boolean {
    const square = BOARD[squareIndex];
    if (!square.group) return false;
    const groupSquares = BOARD.filter((s) => s.group === square.group);
    const targetLevel = this.state.improvements[squareIndex] ?? 0;
    // Ev kurulacak kare en az diğerleri kadar olmalı (dengeli inşaat)
    return groupSquares.every((s) => {
      if (s.index === squareIndex) return true;
      return (this.state.improvements[s.index] ?? 0) >= targetLevel;
    });
  }

  private canSellHere(squareIndex: number): boolean {
    const square = BOARD[squareIndex];
    if (!square.group) return false;
    const groupSquares = BOARD.filter((s) => s.group === square.group);
    const targetLevel = this.state.improvements[squareIndex] ?? 0;
    // Satılacak kare en yüksek (veya eşit) seviyede olmalı
    return groupSquares.every((s) => {
      if (s.index === squareIndex) return true;
      return (this.state.improvements[s.index] ?? 0) <= targetLevel;
    });
  }

  private updateBuildableSquares(): void {
    const player = this.currentPlayer();
    const buildable: number[] = [];
    const sellable: number[] = [];

    for (const propIndex of player.properties) {
      const square = BOARD[propIndex];
      if (square.type !== 'property' || !square.group || !(square.group in HOUSE_COSTS)) continue;
      if (!this.ownsFullGroup(player, square.group)) continue;
      if (this.state.mortgaged.includes(propIndex)) continue;

      const level = this.state.improvements[propIndex] ?? 0;
      const cost = HOUSE_COSTS[square.group as keyof typeof HOUSE_COSTS] ?? 0;

      if (level < 5 && player.money >= cost && this.canBuildHere(propIndex)) {
        buildable.push(propIndex);
      }
      if (level > 0 && this.canSellHere(propIndex)) {
        sellable.push(propIndex);
      }
    }

    this.state.buildableSquares = buildable;
    this.state.sellableSquares = sellable;
  }

  private calculateRent(squareIndex: number, owner: MonopolyPlayer, dice: [number, number]): number {
    const square = BOARD[squareIndex];

    if (square.type === 'railroad') {
      const ownedRailroads = owner.properties.filter((i) => BOARD[i].type === 'railroad').length;
      return 25 * Math.pow(2, ownedRailroads - 1); // 25, 50, 100, 200
    }

    if (square.type === 'utility') {
      const ownedUtilities = owner.properties.filter((i) => BOARD[i].type === 'utility').length;
      const multiplier = ownedUtilities >= 2 ? 10 : 4;
      return (dice[0] + dice[1]) * multiplier;
    }

    if (square.type === 'property') {
      const level = this.state.improvements[squareIndex] ?? 0;

      if (level > 0 && square.rentTable) {
        return square.rentTable[level]; // 1-5 → rentTable[1..5]
      }

      let rent = square.baseRent ?? 0;
      // Tam renk grubu sahipliği: 2 katı (ev yokken)
      if (square.group && this.ownsFullGroup(owner, square.group)) {
        rent *= 2;
      }
      return rent;
    }

    return 0;
  }

  // ─── Durum Döndürme ─────────────────────────────────────────────────────────

  getState(): MonopolyGameState {
    return this.state;
  }

  onPlayerLeave(playerId: string, context: GameContext): void {
    const player = this.state.players.find((p) => p.id === playerId);
    if (!player) return;

    player.isBankrupt = true;
    player.properties = [];
    this.state.message = `${player.name} oyundan ayrıldı.`;

    if (playerId === this.state.currentPlayerId) {
      this.advanceToNextPlayer(context);
    } else {
      context.sendGameState(this.state);
    }
  }
}
