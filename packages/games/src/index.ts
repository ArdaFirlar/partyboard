// === PartyBoard Oyun Modülleri ===
// Her oyun bağımsız bir modül olarak bu paket altında yer alır.
// Faz 2'de ilk oyun (taş-kağıt-makas) buraya eklenecek.

import { GameManifest } from '@partyboard/shared';

// Mevcut oyunların listesi (şimdilik boş, Faz 2'de doldurulacak)
export const availableGames: GameManifest[] = [];

// Oyun modülü arayüzü - her oyun bu yapıyı uygulamalı
export interface GameModule {
  manifest: GameManifest;
  // Faz 2'de genişletilecek
}
