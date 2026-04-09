// === Taş-Kağıt-Makas Oyun Modülü (Sunucu Tarafı) ===
// 2 oyuncu. Her iki oyuncu seçim yaptıktan sonra sonuç açılır.
// En iyi 3 veya 5 tur (varsayılan: 3).

import { GameManifest, RPSChoice, RPSGameState, RPSRoundResult } from '@partyboard/shared';
import { IGameModule, GameContext } from '../GameEngine';

// Oyun kuralları: neyin neyi yendiği
// rock (taş) -> scissors (makas) yener
// scissors (makas) -> paper (kağıt) yener
// paper (kağıt) -> rock (taş) yener
const BEATS: Record<RPSChoice, RPSChoice> = {
  rock: 'scissors',
  scissors: 'paper',
  paper: 'rock',
};

export class RockPaperScissorsGame implements IGameModule {
  // Oyun bilgileri (manifest)
  manifest: GameManifest = {
    id: 'rock-paper-scissors',
    name: 'Taş-Kağıt-Makas',
    description: 'Klasik taş-kağıt-makas oyunu. 2 oyuncu.',
    minPlayers: 2,
    maxPlayers: 2,
    version: '1.0.0',
    icon: '✊',
  };

  // Oyun durumu
  private state!: RPSGameState;

  // Oyuncuların gizli seçimleri (diğer oyuncu görmesin diye ayrı tutuluyor)
  private choices: Map<string, RPSChoice> = new Map();

  /**
   * Oyun başlatıldığında çağrılır.
   * config.rounds: kaç tur oynanacak (varsayılan: 5)
   */
  onStart(context: GameContext, config?: Record<string, unknown>): void {
    const players = context.room.players.slice(0, 2); // İlk 2 oyuncu

    // Tur sayısını config'den al, yoksa varsayılan 5
    const totalRounds = typeof config?.rounds === 'number' && config.rounds > 0
      ? config.rounds
      : 5;

    // Başlangıç durumunu oluştur
    this.state = {
      phase: 'choosing',
      round: 1,
      bestOf: totalRounds, // totalRounds olarak kullanıyoruz
      scores: {
        [players[0].id]: 0,
        [players[1].id]: 0,
      },
      players: players.map((p) => ({
        id: p.id,
        name: p.name,
        avatar: p.avatar,
      })),
      choices: {},
    };

    this.choices.clear();

    // Oyun durumunu tüm cihazlara gönder
    context.sendGameState(this.state);

    // Her oyuncuya özel bilgi gönder (seçim yapmasını söyle)
    for (const player of players) {
      context.sendToPlayer(player.id, {
        type: 'rps:your-turn',
        message: 'Seçimini yap!',
      });
    }
  }

  /**
   * Oyuncudan girdi geldiğinde çağrılır.
   */
  onInput(playerId: string, data: unknown, context: GameContext): void {
    const input = data as { action: string; choice?: RPSChoice };

    // Sadece seçim aşamasında kabul et
    if (this.state.phase !== 'choosing') return;

    // Seçim aksiyonu
    if (input.action === 'choose' && input.choice) {
      // Geçerli bir seçim mi kontrol et
      if (!['rock', 'paper', 'scissors'].includes(input.choice)) return;

      // Zaten seçim yaptıysa tekrar yapmasın
      if (this.choices.has(playerId)) return;

      // Seçimi kaydet
      this.choices.set(playerId, input.choice);

      // Durumu güncelle (seçim yaptığını göster ama seçimin kendisini gösterme)
      this.state.choices[playerId] = true;
      context.sendGameState(this.state);

      // Oyuncuya seçiminin alındığını bildir
      context.sendToPlayer(playerId, {
        type: 'rps:choice-confirmed',
        choice: input.choice,
      });

      // Her iki oyuncu da seçim yaptıysa sonucu aç
      if (this.choices.size === 2) {
        this.revealChoices(context);
      }
    }
  }

  /**
   * Her iki oyuncu da seçim yaptıktan sonra sonucu açar.
   */
  private revealChoices(context: GameContext): void {
    const player1 = this.state.players[0];
    const player2 = this.state.players[1];
    const choice1 = this.choices.get(player1.id)!;
    const choice2 = this.choices.get(player2.id)!;

    // Kazananı belirle
    let winnerId: string | null = null;
    if (choice1 !== choice2) {
      // Birinin seçimi diğerini yeniyorsa o kazanır
      winnerId = BEATS[choice1] === choice2 ? player1.id : player2.id;
    }

    // Tur sonucu
    const roundResult: RPSRoundResult = {
      player1Id: player1.id,
      player1Choice: choice1,
      player2Id: player2.id,
      player2Choice: choice2,
      winnerId,
    };

    // Skoru güncelle
    if (winnerId) {
      this.state.scores[winnerId]++;
    }

    // Durumu "reveal" (açılma) aşamasına geçir
    this.state.phase = 'reveal';
    this.state.currentRound = roundResult;
    context.sendGameState(this.state);

    // 3 saniye sonra bir sonraki tura geç veya oyunu bitir
    setTimeout(() => {
      this.nextRoundOrEnd(context);
    }, 3000);
  }

  /**
   * Bir sonraki tura geçer veya oyunu bitirir.
   * Tüm turlar tamamlandığında en çok kazanan oyuncu oyunu kazanır.
   */
  private nextRoundOrEnd(context: GameContext): void {
    const player1 = this.state.players[0];
    const player2 = this.state.players[1];
    const score1 = this.state.scores[player1.id];
    const score2 = this.state.scores[player2.id];
    const totalRounds = this.state.bestOf;

    // Tüm turlar tamamlandı mı?
    if (this.state.round >= totalRounds) {
      // Oyun bitti — en çok kazanan kazanır, beraberlik mümkün
      this.state.phase = 'finished';

      if (score1 > score2) {
        this.state.winnerId = player1.id;
      } else if (score2 > score1) {
        this.state.winnerId = player2.id;
      } else {
        // Berabere — kazanan yok (winnerId undefined kalır)
        this.state.winnerId = undefined;
      }

      context.sendGameState(this.state);

      // Oyun sonucu bildir
      context.endGame({
        gameId: this.manifest.id,
        winnerId: this.state.winnerId ?? null,
        scores: this.state.scores,
        rounds: this.state.round,
      });
      return;
    }

    // Sonraki tura geç
    this.state.round++;
    this.state.phase = 'choosing';
    this.state.currentRound = undefined;
    this.state.choices = {};
    this.choices.clear();
    context.sendGameState(this.state);

    // Oyunculara seçim yapmasını söyle
    for (const player of this.state.players) {
      context.sendToPlayer(player.id, {
        type: 'rps:your-turn',
        message: `Tur ${this.state.round}: Seçimini yap!`,
      });
    }
  }

  /**
   * Mevcut oyun durumunu döndürür.
   * İstemci bileşeni açıldığında (mount) sunucudan durumu istediğinde kullanılır.
   */
  getState(): RPSGameState {
    return this.state;
  }

  /**
   * Oyuncu ayrıldığında çağrılır.
   */
  onPlayerLeave(playerId: string, context: GameContext): void {
    // Oyuncu ayrıldıysa diğer oyuncu kazanır
    const otherId = this.state.players.find((p) => p.id !== playerId)?.id;
    if (otherId) {
      this.state.phase = 'finished';
      this.state.winnerId = otherId;
      context.sendGameState(this.state);
      context.endGame({
        gameId: this.manifest.id,
        winnerId: otherId,
        reason: 'opponent-left',
      });
    }
  }
}
