"use strict";
// === Monopoly — Ortak Tipler ve Sabitler (Faz 5) ===
// Ev/otel, takas, ipotek, kart sistemi, tema ve çift zar desteği.
Object.defineProperty(exports, "__esModule", { value: true });
exports.HOUSE_COSTS = exports.GROUP_COLORS = exports.PLAYER_COLORS = exports.MonopolyActions = void 0;
// ─── Eylem Sabitleri ─────────────────────────────────────────────────────────
exports.MonopolyActions = {
    ROLL_DICE: 'monopoly:rollDice',
    BUY_PROPERTY: 'monopoly:buy',
    SKIP_BUY: 'monopoly:skip',
    BUILD_HOUSE: 'monopoly:buildHouse', // { squareIndex: number }
    SELL_HOUSE: 'monopoly:sellHouse', // { squareIndex: number }
    MORTGAGE: 'monopoly:mortgage', // { squareIndex: number }
    UNMORTGAGE: 'monopoly:unmortgage', // { squareIndex: number }
    SEND_TRADE: 'monopoly:sendTrade', // { toPlayerId, fromProps, toProps, fromMoney, toMoney }
    ACCEPT_TRADE: 'monopoly:acceptTrade',
    REJECT_TRADE: 'monopoly:rejectTrade',
    PAY_BAIL: 'monopoly:payBail', // $50 ödeyerek hapisten çık
    USE_JAIL_CARD: 'monopoly:useJailCard', // Kart kullanarak çık
};
// ─── Sabitler ────────────────────────────────────────────────────────────────
// Taş renkleri
exports.PLAYER_COLORS = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c'];
// Renk grubu CSS renkleri
exports.GROUP_COLORS = {
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
exports.HOUSE_COSTS = {
    brown: 50,
    'light-blue': 50,
    pink: 100,
    orange: 100,
    red: 150,
    yellow: 150,
    green: 200,
    'dark-blue': 200,
};
//# sourceMappingURL=monopoly.js.map