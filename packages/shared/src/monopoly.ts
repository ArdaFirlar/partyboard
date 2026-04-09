// === Monopoly — Ortak Tipler ve Sabitler (Faz 5) ===
// Ev/otel, takas, ipotek, kart sistemi, tema ve çift zar desteği.

// ─── Kare Tipleri ────────────────────────────────────────────────────────────

export type SquareType =
  | 'go'
  | 'property'
  | 'railroad'
  | 'utility'
  | 'tax'
  | 'chance'
  | 'community'
  | 'jail'
  | 'go-to-jail'
  | 'free-parking';

// ─── Renk Grupları ───────────────────────────────────────────────────────────

export type PropertyGroup =
  | 'brown'
  | 'light-blue'
  | 'pink'
  | 'orange'
  | 'red'
  | 'yellow'
  | 'green'
  | 'dark-blue'
  | 'railroad'
  | 'utility';

// ─── Tahta Karesi ────────────────────────────────────────────────────────────

export interface BoardSquare {
  index: number;
  name: string;          // Kısa isim (tahta gösterimi)
  fullName: string;      // Tam isim
  type: SquareType;
  price?: number;        // Satın alma fiyatı
  baseRent?: number;     // Temel kira (iyileştirme yok, tam grup yok)
  rentTable?: [number, number, number, number, number, number];
  // rentTable: [boş, 1 ev, 2 ev, 3 ev, 4 ev, otel]
  houseCost?: number;    // Ev kurma maliyeti (grup başına sabit)
  mortgageValue?: number; // İpotek değeri (fiyat / 2)
  group?: PropertyGroup;
  taxAmount?: number;    // Sabit vergi miktarı
}

// ─── Oyuncu ──────────────────────────────────────────────────────────────────

export interface MonopolyPlayer {
  id: string;
  name: string;
  avatar: string;
  color: string;             // CSS taş rengi
  money: number;
  position: number;          // 0-39 kare numarası
  properties: number[];      // Sahip olunan kare indeksleri
  isBankrupt: boolean;
  inJail: boolean;
  jailTurns: number;         // Hapishanede geçirilen tur sayısı (0-2)
  getOutOfJailCards: number; // Hapishaneden çıkış kartı sayısı
}

// ─── Oyun Fazı ───────────────────────────────────────────────────────────────

export type MonopolyPhase =
  | 'rolling'   // Sıradaki oyuncu zar atmayı bekliyor (ev kurma/takas da burada)
  | 'buying'    // Oyuncu mülk satın alabilir
  | 'finished'; // Oyun bitti

// ─── Kart Tipleri ────────────────────────────────────────────────────────────

export type CardType = 'chance' | 'community';

export type CardEffectKind =
  | 'advance-to'                  // Belirli kareye ilerle
  | 'advance-to-nearest-railroad' // En yakın demiryoluna ilerle (kira x2)
  | 'advance-to-nearest-utility'  // En yakın şirkete ilerle
  | 'go-back'                     // Geri git (kaç kare)
  | 'pay'                         // Para öde (bankaya)
  | 'collect'                     // Para al (bankadan)
  | 'collect-from-each'           // Her oyuncudan para al
  | 'pay-to-each'                 // Her oyuncuya para öde
  | 'repairs'                     // Her ev/otel için onarım öde
  | 'go-to-jail'                  // Hapise git
  | 'get-out-of-jail-card';       // Hapishaneden çıkış kartı al

export interface ChanceCard {
  id: string;
  type: CardType;
  text: string;               // Kart metni (oyuncuya gösterilir)
  effect: {
    kind: CardEffectKind;
    position?: number;        // advance-to için hedef kare
    spaces?: number;          // go-back için kaç kare
    amount?: number;          // pay/collect için miktar
    perHouse?: number;        // repairs için ev başına maliyet
    perHotel?: number;        // repairs için otel başına maliyet
    railroadMultiplier?: number; // railroad için kira çarpanı
  };
}

// ─── Takas Teklifi ───────────────────────────────────────────────────────────

export interface TradeOffer {
  id: string;
  fromPlayerId: string;
  toPlayerId: string;
  fromProperties: number[];  // Teklif eden oyuncunun verdiği mülkler
  toProperties: number[];    // Teklif eden oyuncunun istediği mülkler
  fromMoney: number;         // Teklif edenin eklediği para
  toMoney: number;           // Karşı tarafın ödemesi gereken para
}

// ─── Tema Bilgisi ────────────────────────────────────────────────────────────

export interface MonopolyThemeInfo {
  id: string;
  name: string;                           // "Klasik" veya "Osmanlı"
  currencySymbol: string;                 // "$" veya "Ak" (Akçe)
  boardNameOverrides: Record<number, string>; // Kare index → özel isim
}

// ─── Oyun Durumu ─────────────────────────────────────────────────────────────

export interface MonopolyGameState {
  phase: MonopolyPhase;
  players: MonopolyPlayer[];
  currentPlayerIndex: number;
  currentPlayerId: string;
  dice: [number, number] | null;
  doubleCount: number;                // Ardışık çift zar sayısı (0-2)
  message: string;
  landedSquare: number | null;
  canBuy: boolean;
  board: BoardSquare[];
  improvements: Record<number, number>; // kare index → iyileştirme sayısı (1-4=ev, 5=otel)
  mortgaged: number[];                  // İpotek edilen kare indeksleri
  pendingTrade: TradeOffer | null;      // Bekleyen takas teklifi
  currentCard: ChanceCard | null;       // Son çekilen kart
  buildableSquares: number[];           // Şu an ev kurulabilecek kare indeksleri
  sellableSquares: number[];            // Şu an ev satılabilecek kare indeksleri
  theme: MonopolyThemeInfo;             // Aktif tema
  winnerId?: string;
  winnerName?: string;
}

// ─── Eylem Sabitleri ─────────────────────────────────────────────────────────

export const MonopolyActions = {
  ROLL_DICE:      'monopoly:rollDice',
  BUY_PROPERTY:   'monopoly:buy',
  SKIP_BUY:       'monopoly:skip',
  BUILD_HOUSE:    'monopoly:buildHouse',    // { squareIndex: number }
  SELL_HOUSE:     'monopoly:sellHouse',     // { squareIndex: number }
  MORTGAGE:       'monopoly:mortgage',      // { squareIndex: number }
  UNMORTGAGE:     'monopoly:unmortgage',    // { squareIndex: number }
  SEND_TRADE:     'monopoly:sendTrade',     // { toPlayerId, fromProps, toProps, fromMoney, toMoney }
  ACCEPT_TRADE:   'monopoly:acceptTrade',
  REJECT_TRADE:   'monopoly:rejectTrade',
  PAY_BAIL:       'monopoly:payBail',       // $50 ödeyerek hapisten çık
  USE_JAIL_CARD:  'monopoly:useJailCard',   // Kart kullanarak çık
} as const;

// ─── Sabitler ────────────────────────────────────────────────────────────────

// Taş renkleri
export const PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];

// Renk grubu CSS renkleri
export const GROUP_COLORS: Record<PropertyGroup, string> = {
  brown: '#8B4513',
  'light-blue': '#87CEEB',
  pink: '#FF69B4',
  orange: '#FFA500',
  red: '#FF0000',
  yellow: '#FFD700',
  green: '#228B22',
  'dark-blue': '#00008B',
  railroad: '#333333',
  utility: '#888888',
};

// Grup başına ev kurma maliyeti
export const HOUSE_COSTS: Partial<Record<PropertyGroup, number>> = {
  brown: 50,
  'light-blue': 50,
  pink: 100,
  orange: 100,
  red: 150,
  yellow: 150,
  green: 200,
  'dark-blue': 200,
};
