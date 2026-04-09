// === Monopoly Tahta Verisi (Faz 5) ===
// 40 kare, tam kira tablosu (0-5 iyileştirme), ev maliyeti, ipotek değeri.

import { BoardSquare } from '@partyboard/shared';

// rentTable: [temel, 1ev, 2ev, 3ev, 4ev, otel]
export const BOARD: BoardSquare[] = [
  { index: 0,  name: 'Başlangıç', fullName: 'BAŞLANGIÇ',           type: 'go' },

  { index: 1,  name: 'Akdeniz',   fullName: 'Akdeniz Caddesi',
    type: 'property', price: 60,  baseRent: 2,
    rentTable: [2, 10, 30, 90, 160, 250], houseCost: 50, mortgageValue: 30,
    group: 'brown' },

  { index: 2,  name: 'Topluluk',  fullName: 'Topluluk Sandığı',    type: 'community' },

  { index: 3,  name: 'Baltık',    fullName: 'Baltık Caddesi',
    type: 'property', price: 60,  baseRent: 4,
    rentTable: [4, 20, 60, 180, 320, 450], houseCost: 50, mortgageValue: 30,
    group: 'brown' },

  { index: 4,  name: 'Gelir V.',  fullName: 'Gelir Vergisi',       type: 'tax', taxAmount: 200 },

  { index: 5,  name: 'Tren 1',    fullName: 'İstanbul Garı',
    type: 'railroad', price: 200, mortgageValue: 100,
    group: 'railroad' },

  { index: 6,  name: 'Şark',      fullName: 'Şark Caddesi',
    type: 'property', price: 100, baseRent: 6,
    rentTable: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50,
    group: 'light-blue' },

  { index: 7,  name: 'Şans',      fullName: 'Şans',                type: 'chance' },

  { index: 8,  name: 'Vermont',   fullName: 'Vermont Caddesi',
    type: 'property', price: 100, baseRent: 6,
    rentTable: [6, 30, 90, 270, 400, 550], houseCost: 50, mortgageValue: 50,
    group: 'light-blue' },

  { index: 9,  name: 'Boğaz',     fullName: 'Boğaz Caddesi',
    type: 'property', price: 120, baseRent: 8,
    rentTable: [8, 40, 100, 300, 450, 600], houseCost: 50, mortgageValue: 60,
    group: 'light-blue' },

  { index: 10, name: 'Hapis',     fullName: 'Hapis / Ziyaret',     type: 'jail' },

  { index: 11, name: 'Beyazıt',   fullName: 'Beyazıt Meydanı',
    type: 'property', price: 140, baseRent: 10,
    rentTable: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70,
    group: 'pink' },

  { index: 12, name: 'Elektrik',  fullName: 'Elektrik Şirketi',
    type: 'utility',  price: 150, mortgageValue: 75,
    group: 'utility' },

  { index: 13, name: 'Kapalı',    fullName: 'Kapalı Çarşı',
    type: 'property', price: 140, baseRent: 10,
    rentTable: [10, 50, 150, 450, 625, 750], houseCost: 100, mortgageValue: 70,
    group: 'pink' },

  { index: 14, name: 'Galata',    fullName: 'Galata Köprüsü',
    type: 'property', price: 160, baseRent: 12,
    rentTable: [12, 60, 180, 500, 700, 900], houseCost: 100, mortgageValue: 80,
    group: 'pink' },

  { index: 15, name: 'Tren 2',    fullName: 'Ankara Garı',
    type: 'railroad', price: 200, mortgageValue: 100,
    group: 'railroad' },

  { index: 16, name: 'Taksim',    fullName: 'Taksim Meydanı',
    type: 'property', price: 180, baseRent: 14,
    rentTable: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90,
    group: 'orange' },

  { index: 17, name: 'Topluluk',  fullName: 'Topluluk Sandığı',    type: 'community' },

  { index: 18, name: 'Bağdat',    fullName: 'Bağdat Caddesi',
    type: 'property', price: 180, baseRent: 14,
    rentTable: [14, 70, 200, 550, 750, 950], houseCost: 100, mortgageValue: 90,
    group: 'orange' },

  { index: 19, name: 'Nişantaşı', fullName: 'Nişantaşı',
    type: 'property', price: 200, baseRent: 16,
    rentTable: [16, 80, 220, 600, 800, 1000], houseCost: 100, mortgageValue: 100,
    group: 'orange' },

  { index: 20, name: 'Park',      fullName: 'Serbest Park',        type: 'free-parking' },

  { index: 21, name: 'Kadıköy',   fullName: 'Kadıköy',
    type: 'property', price: 220, baseRent: 18,
    rentTable: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110,
    group: 'red' },

  { index: 22, name: 'Şans',      fullName: 'Şans',                type: 'chance' },

  { index: 23, name: 'Üsküdar',   fullName: 'Üsküdar',
    type: 'property', price: 220, baseRent: 18,
    rentTable: [18, 90, 250, 700, 875, 1050], houseCost: 150, mortgageValue: 110,
    group: 'red' },

  { index: 24, name: 'Beşiktaş',  fullName: 'Beşiktaş',
    type: 'property', price: 240, baseRent: 20,
    rentTable: [20, 100, 300, 750, 925, 1100], houseCost: 150, mortgageValue: 120,
    group: 'red' },

  { index: 25, name: 'Tren 3',    fullName: 'İzmir Garı',
    type: 'railroad', price: 200, mortgageValue: 100,
    group: 'railroad' },

  { index: 26, name: 'Şişli',     fullName: 'Şişli',
    type: 'property', price: 260, baseRent: 22,
    rentTable: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130,
    group: 'yellow' },

  { index: 27, name: 'Levent',    fullName: 'Levent',
    type: 'property', price: 260, baseRent: 22,
    rentTable: [22, 110, 330, 800, 975, 1150], houseCost: 150, mortgageValue: 130,
    group: 'yellow' },

  { index: 28, name: 'Su',        fullName: 'Su Şirketi',
    type: 'utility',  price: 150, mortgageValue: 75,
    group: 'utility' },

  { index: 29, name: 'Etiler',    fullName: 'Etiler',
    type: 'property', price: 280, baseRent: 24,
    rentTable: [24, 120, 360, 850, 1025, 1200], houseCost: 150, mortgageValue: 140,
    group: 'yellow' },

  { index: 30, name: 'Hapse Git', fullName: 'HAPİSE GİT',          type: 'go-to-jail' },

  { index: 31, name: 'Maslak',    fullName: 'Maslak',
    type: 'property', price: 300, baseRent: 26,
    rentTable: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150,
    group: 'green' },

  { index: 32, name: 'Sarıyer',   fullName: 'Sarıyer',
    type: 'property', price: 300, baseRent: 26,
    rentTable: [26, 130, 390, 900, 1100, 1275], houseCost: 200, mortgageValue: 150,
    group: 'green' },

  { index: 33, name: 'Topluluk',  fullName: 'Topluluk Sandığı',    type: 'community' },

  { index: 34, name: 'Bebek',     fullName: 'Bebek',
    type: 'property', price: 320, baseRent: 28,
    rentTable: [28, 150, 450, 1000, 1200, 1400], houseCost: 200, mortgageValue: 160,
    group: 'green' },

  { index: 35, name: 'Tren 4',    fullName: 'Bursa Garı',
    type: 'railroad', price: 200, mortgageValue: 100,
    group: 'railroad' },

  { index: 36, name: 'Şans',      fullName: 'Şans',                type: 'chance' },

  { index: 37, name: 'Bosphorus', fullName: 'Bosphorus Kulesi',
    type: 'property', price: 350, baseRent: 35,
    rentTable: [35, 175, 500, 1100, 1300, 1500], houseCost: 200, mortgageValue: 175,
    group: 'dark-blue' },

  { index: 38, name: 'Lüks V.',   fullName: 'Lüks Vergisi',        type: 'tax', taxAmount: 100 },

  { index: 39, name: 'Çırağan',   fullName: 'Çırağan Sarayı',
    type: 'property', price: 400, baseRent: 50,
    rentTable: [50, 200, 600, 1400, 1700, 2000], houseCost: 200, mortgageValue: 200,
    group: 'dark-blue' },
];

// Grup başına kaç mülk var?
export const GROUP_SIZES: Record<string, number> = {
  brown: 2, 'light-blue': 3, pink: 3, orange: 3,
  red: 3, yellow: 3, green: 3, 'dark-blue': 2,
  railroad: 4, utility: 2,
};
