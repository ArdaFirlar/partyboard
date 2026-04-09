// === Ana Ekran — Dil Sistemi (i18next) ===
// Cihaz dilini algılar, TR veya EN yükler.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Türkçe çeviriler
const tr = {
  common: {
    loading: 'Yükleniyor...', returnLobby: 'Lobiye Dön', players: 'Oyuncular',
    winner: 'Kazandı!', bankrupt: 'İFLAS', jail: 'Hapishanede',
    disconnected: 'Bağlantı Kesildi', waiting: 'Bekleniyor...',
  },
  lobby: {
    title: 'PartyBoard', subtitle: 'Telefonunu al, oyunu aç!',
    createRoom: 'Oda Oluştur', qrScan: 'QR Tara', roomCode: 'Oda Kodu',
    joinWith: 'veya gir:', waitingPlayers: 'Oyuncular bağlanıyor...',
    connectedPlayers: '{{count}} oyuncu bağlandı', selectGame: 'Oyun Seç',
    startGame: 'Oyunu Başlat', minPlayers: 'Minimum {{min}} oyuncu gerekli',
  },
  monopoly: {
    title: 'Monopoly', rollDice: 'Zar At!', rolling: 'Atılıyor...',
    buyProperty: 'Satın Al', skip: 'Geç', double: 'ÇİFT!',
    goToJail: 'HAPİSE GİTTİ!', passedGo: "Başlangıç'tan geçti! +$200",
    rentPaid: 'kira ödedi', bankrupt: 'İFLAS ETTİ! 💸', won: 'kazandı! 🏆',
    properties: 'mülk', mortgage: 'İPOTEK',
    card: { chance: 'ŞANS', community: 'TOPLULUK SANDIĞI' },
    stats: {
      title: 'Oyun İstatistikleri', totalTurns: 'Toplam Tur', doubles: 'Çift Zar',
      jailVisits: 'Hapis Ziyareti', mostVisited: 'En Çok Ziyaret',
      rentCollected: 'Kira Geliri', rentPaid: 'Kira Gideri',
      finalMoney: 'Son Para', rank: 'Sıralama',
    },
  },
  rps: {
    title: 'Taş-Kağıt-Makas', waiting: 'Rakip bekleniyor...',
    choosing: 'Seçim yapılıyor...', reveal: 'Seçimler açıklanıyor!',
    rock: 'Taş', paper: 'Kağıt', scissors: 'Makas',
    draw: 'Berabere!', round: 'Tur {{n}}', score: 'Skor',
  },
  leaderboard: {
    title: 'Liderlik Tablosu', rank: 'Sıra', player: 'Oyuncu',
    wins: 'Kazanma', played: 'Oynanan', winRate: 'Oran',
    noData: 'Henüz kayıt yok.', allGames: 'Tüm Oyunlar',
    monopoly: 'Monopoly', rps: 'Taş-Kağıt-Makas',
  },
  disconnect: {
    playerLeft: '{{name}} bağlantıyı kaybetti.',
    waitBtn: 'Bekle (30s)', elimBtn: 'Oyuncu Elen',
    reconnected: '{{name}} yeniden bağlandı!',
  },
};

// İngilizce çeviriler
const en = {
  common: {
    loading: 'Loading...', returnLobby: 'Return to Lobby', players: 'Players',
    winner: 'Wins!', bankrupt: 'BANKRUPT', jail: 'In Jail',
    disconnected: 'Disconnected', waiting: 'Waiting...',
  },
  lobby: {
    title: 'PartyBoard', subtitle: 'Grab your phone, join the game!',
    createRoom: 'Create Room', qrScan: 'Scan QR', roomCode: 'Room Code',
    joinWith: 'or enter:', waitingPlayers: 'Waiting for players...',
    connectedPlayers: '{{count}} player(s) connected', selectGame: 'Select Game',
    startGame: 'Start Game', minPlayers: 'Minimum {{min}} players required',
  },
  monopoly: {
    title: 'Monopoly', rollDice: 'Roll Dice!', rolling: 'Rolling...',
    buyProperty: 'Buy', skip: 'Skip', double: 'DOUBLE!',
    goToJail: 'GOES TO JAIL!', passedGo: 'Passed Go! +$200',
    rentPaid: 'paid rent', bankrupt: 'WENT BANKRUPT! 💸', won: 'wins! 🏆',
    properties: 'properties', mortgage: 'MORTGAGED',
    card: { chance: 'CHANCE', community: 'COMMUNITY CHEST' },
    stats: {
      title: 'Game Statistics', totalTurns: 'Total Turns', doubles: 'Doubles Rolled',
      jailVisits: 'Jail Visits', mostVisited: 'Most Visited',
      rentCollected: 'Rent Collected', rentPaid: 'Rent Paid',
      finalMoney: 'Final Balance', rank: 'Rank',
    },
  },
  rps: {
    title: 'Rock-Paper-Scissors', waiting: 'Waiting for opponent...',
    choosing: 'Choosing...', reveal: 'Revealing choices!',
    rock: 'Rock', paper: 'Paper', scissors: 'Scissors',
    draw: 'Draw!', round: 'Round {{n}}', score: 'Score',
  },
  leaderboard: {
    title: 'Leaderboard', rank: 'Rank', player: 'Player',
    wins: 'Wins', played: 'Played', winRate: 'Win Rate',
    noData: 'No records yet.', allGames: 'All Games',
    monopoly: 'Monopoly', rps: 'Rock-Paper-Scissors',
  },
  disconnect: {
    playerLeft: '{{name}} lost connection.',
    waitBtn: 'Wait (30s)', elimBtn: 'Eliminate Player',
    reconnected: '{{name}} reconnected!',
  },
};

const browserLang = navigator.language.split('-')[0];
const defaultLang = browserLang === 'tr' ? 'tr' : 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      tr: { translation: tr },
      en: { translation: en },
    },
    lng: defaultLang,
    fallbackLng: 'tr',
    interpolation: { escapeValue: false },
  });

export default i18n;

export function setLanguage(lang: 'tr' | 'en') {
  i18n.changeLanguage(lang);
}
