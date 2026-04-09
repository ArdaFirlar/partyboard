// === Monopoly Kart Desteleri ===
// Şans (16 kart) ve Topluluk Sandığı (16 kart).
// Her deste karıştırılarak sırayla kullanılır, biten deste yeniden karıştırılır.

import { ChanceCard } from '@partyboard/shared';

// ─── Şans Kartları ───────────────────────────────────────────────────────────

export const CHANCE_CARDS: ChanceCard[] = [
  {
    id: 'ch1',
    type: 'chance',
    text: 'Başlangıç\'a ilerle. $200 maaş al.',
    effect: { kind: 'advance-to', position: 0 },
  },
  {
    id: 'ch2',
    type: 'chance',
    text: 'Bosphorus Kulesi\'ne ilerle. Kira öde, eğer geçerliyse.',
    effect: { kind: 'advance-to', position: 37 },
  },
  {
    id: 'ch3',
    type: 'chance',
    text: 'Çırağan Sarayı\'na ilerle. Kira öde, eğer geçerliyse.',
    effect: { kind: 'advance-to', position: 39 },
  },
  {
    id: 'ch4',
    type: 'chance',
    text: 'En yakın demiryoluna ilerle. İki katı kira öde.',
    effect: { kind: 'advance-to-nearest-railroad', railroadMultiplier: 2 },
  },
  {
    id: 'ch5',
    type: 'chance',
    text: 'En yakın demiryoluna ilerle. İki katı kira öde.',
    effect: { kind: 'advance-to-nearest-railroad', railroadMultiplier: 2 },
  },
  {
    id: 'ch6',
    type: 'chance',
    text: 'En yakın şirkete ilerle. 10 kat zar bedeli öde.',
    effect: { kind: 'advance-to-nearest-utility' },
  },
  {
    id: 'ch7',
    type: 'chance',
    text: 'Banka hatası — lehinize. $200 al.',
    effect: { kind: 'collect', amount: 200 },
  },
  {
    id: 'ch8',
    type: 'chance',
    text: 'Kart başına $50 onarım: Ev başına $25, Otel başına $100.',
    effect: { kind: 'repairs', perHouse: 25, perHotel: 100 },
  },
  {
    id: 'ch9',
    type: 'chance',
    text: 'Hız cezası: $15 öde.',
    effect: { kind: 'pay', amount: 15 },
  },
  {
    id: 'ch10',
    type: 'chance',
    text: 'Taksim\'e git.',
    effect: { kind: 'advance-to', position: 16 },
  },
  {
    id: 'ch11',
    type: 'chance',
    text: 'Hapise git. Doğrudan git. Başlangıç\'tan geçme, $200 alma.',
    effect: { kind: 'go-to-jail' },
  },
  {
    id: 'ch12',
    type: 'chance',
    text: 'Genel onarım fonu: Ev başına $40, Otel başına $115.',
    effect: { kind: 'repairs', perHouse: 40, perHotel: 115 },
  },
  {
    id: 'ch13',
    type: 'chance',
    text: 'Yoksul vergi: $15 öde.',
    effect: { kind: 'pay', amount: 15 },
  },
  {
    id: 'ch14',
    type: 'chance',
    text: 'Tatil gezisi: Başlangıç\'a dön. $200 maaş al.',
    effect: { kind: 'advance-to', position: 0 },
  },
  {
    id: 'ch15',
    type: 'chance',
    text: 'Bankanın seçkin müşterisisin: $150 al.',
    effect: { kind: 'collect', amount: 150 },
  },
  {
    id: 'ch16',
    type: 'chance',
    text: 'Hapishaneden çıkış kartı. Bu kartı sakla veya sat.',
    effect: { kind: 'get-out-of-jail-card' },
  },
];

// ─── Topluluk Sandığı Kartları ───────────────────────────────────────────────

export const COMMUNITY_CARDS: ChanceCard[] = [
  {
    id: 'cc1',
    type: 'community',
    text: 'Başlangıç\'a ilerle. $200 maaş al.',
    effect: { kind: 'advance-to', position: 0 },
  },
  {
    id: 'cc2',
    type: 'community',
    text: 'Banka hatası — lehinize. $200 al.',
    effect: { kind: 'collect', amount: 200 },
  },
  {
    id: 'cc3',
    type: 'community',
    text: 'Doktor ücreti: $50 öde.',
    effect: { kind: 'pay', amount: 50 },
  },
  {
    id: 'cc4',
    type: 'community',
    text: 'Hisse senedi satışı: $50 al.',
    effect: { kind: 'collect', amount: 50 },
  },
  {
    id: 'cc5',
    type: 'community',
    text: 'Hapise git. Doğrudan git. Başlangıç\'tan geçme, $200 alma.',
    effect: { kind: 'go-to-jail' },
  },
  {
    id: 'cc6',
    type: 'community',
    text: 'Okul vergisi: $150 öde.',
    effect: { kind: 'pay', amount: 150 },
  },
  {
    id: 'cc7',
    type: 'community',
    text: 'Hastane ücreti: $100 öde.',
    effect: { kind: 'pay', amount: 100 },
  },
  {
    id: 'cc8',
    type: 'community',
    text: 'Sağlık fonu: $100 al.',
    effect: { kind: 'collect', amount: 100 },
  },
  {
    id: 'cc9',
    type: 'community',
    text: 'Miras: $100 al.',
    effect: { kind: 'collect', amount: 100 },
  },
  {
    id: 'cc10',
    type: 'community',
    text: 'Vergi iadesi: $20 al.',
    effect: { kind: 'collect', amount: 20 },
  },
  {
    id: 'cc11',
    type: 'community',
    text: 'Doğum günün: Her oyuncu sana $10 öder.',
    effect: { kind: 'collect-from-each', amount: 10 },
  },
  {
    id: 'cc12',
    type: 'community',
    text: 'Sigorta iadesi: $25 al.',
    effect: { kind: 'collect', amount: 25 },
  },
  {
    id: 'cc13',
    type: 'community',
    text: 'Konsültasyon ücreti: $25 öde.',
    effect: { kind: 'pay', amount: 25 },
  },
  {
    id: 'cc14',
    type: 'community',
    text: 'Güzellik yarışması kazandın: $10 al.',
    effect: { kind: 'collect', amount: 10 },
  },
  {
    id: 'cc15',
    type: 'community',
    text: 'Tatil fonu olgunlaştı: $100 al.',
    effect: { kind: 'collect', amount: 100 },
  },
  {
    id: 'cc16',
    type: 'community',
    text: 'Hapishaneden çıkış kartı. Bu kartı sakla veya sat.',
    effect: { kind: 'get-out-of-jail-card' },
  },
];

// ─── Deste Karıştırma Yardımcısı ─────────────────────────────────────────────

export function shuffleDeck<T>(deck: T[]): T[] {
  const copy = [...deck];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}
