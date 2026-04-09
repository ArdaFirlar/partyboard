// === Kontrolcü — Dil Sistemi (i18next) ===
// Oda sahibinin seçtiği dile uyar; sunucudan LANG_CHANGE gelince güncellenir.

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const tr = {
  common: {
    loading: 'Yükleniyor...', returnLobby: 'Lobiye Dön', waiting: 'Bekleniyor...', you: 'Sen',
  },
  join: {
    title: "PartyBoard'a Katıl", enterCode: 'Oda Kodunu Gir', enterName: 'Adını Gir',
    join: 'Katıl', invalidCode: 'Geçersiz kod.', roomFull: 'Oda dolu.', roomNotFound: 'Oda bulunamadı.',
  },
  lobby: {
    waiting: 'Oyun başlaması bekleniyor...', playerCount: '{{count}} oyuncu bağlandı', host: 'Host',
  },
  monopoly: {
    rollDice: 'Zar At!', rolling: 'Atılıyor...', buy: 'Satın Al', skip: 'Geç',
    buildHouse: 'Ev Kur', sellHouse: 'Ev Sat', mortgage: 'İpoteğe Ver',
    unmortgage: 'İpotek Kaldır', trade: 'Takas Teklif Et', payBail: '$50 Ödeyerek Çık',
    useCard: 'Kartla Çık', accept: 'Kabul', reject: 'Reddet',
    myTurn: 'Sıra Sende!', waitTurn: '{{name}} oynuyor...', inJail: 'Hapishanede ({{turns}}/3)',
    won: 'KAZANDIN! 🏆', lost: 'Oyun bitti. {{name}} kazandı.',
    myProperties: 'Mülklerim', scoreboard: 'Skor Tablosu', jailCard: 'çıkış kartı',
    sendTrade: 'Teklif Gönder', cancelTrade: 'İptal', tradeWith: 'Kime?',
    youGive: 'Sen veriyorsun', theyGive: 'Onlar veriyor', money: 'Para',
  },
  rps: {
    rock: 'Taş', paper: 'Kağıt', scissors: 'Makas', choose: 'Seçimini Yap!',
    waiting: 'Rakip seçiyor...', you_won: 'Turu Kazandın!', you_lost: 'Turu Kaybettin.',
    draw: 'Berabere!', game_won: '🏆 OYUNU KAZANDIN!', game_lost: 'Oyunu Kaybettin.',
  },
  settings: { language: 'Dil', turkish: 'Türkçe', english: 'English' },
};

const en = {
  common: {
    loading: 'Loading...', returnLobby: 'Return to Lobby', waiting: 'Waiting...', you: 'You',
  },
  join: {
    title: 'Join PartyBoard', enterCode: 'Enter Room Code', enterName: 'Enter Your Name',
    join: 'Join', invalidCode: 'Invalid code.', roomFull: 'Room is full.', roomNotFound: 'Room not found.',
  },
  lobby: {
    waiting: 'Waiting for game to start...', playerCount: '{{count}} player(s) connected', host: 'Host',
  },
  monopoly: {
    rollDice: 'Roll Dice!', rolling: 'Rolling...', buy: 'Buy', skip: 'Skip',
    buildHouse: 'Build House', sellHouse: 'Sell House', mortgage: 'Mortgage',
    unmortgage: 'Lift Mortgage', trade: 'Offer Trade', payBail: 'Pay $50 to Leave',
    useCard: 'Use Card to Leave', accept: 'Accept', reject: 'Reject',
    myTurn: 'Your Turn!', waitTurn: '{{name}} is playing...', inJail: 'In Jail ({{turns}}/3)',
    won: 'YOU WIN! 🏆', lost: 'Game over. {{name}} wins.',
    myProperties: 'My Properties', scoreboard: 'Scoreboard', jailCard: 'jail card',
    sendTrade: 'Send Offer', cancelTrade: 'Cancel', tradeWith: 'Trade with?',
    youGive: 'You give', theyGive: 'They give', money: 'Money',
  },
  rps: {
    rock: 'Rock', paper: 'Paper', scissors: 'Scissors', choose: 'Make Your Choice!',
    waiting: 'Opponent is choosing...', you_won: 'You Won the Round!', you_lost: 'You Lost the Round.',
    draw: 'Draw!', game_won: '🏆 YOU WIN THE GAME!', game_lost: 'You lost the game.',
  },
  settings: { language: 'Language', turkish: 'Türkçe', english: 'English' },
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
