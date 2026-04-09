// === Ses Efektleri Sistemi (Ana Ekran) ===
// Web Audio API kullanır — harici ses dosyası gerektirmez.
// Müzik YOK. Sadece kısa efektler.

let ctx: AudioContext | null = null;

// AudioContext kullanıcı etkileşiminden sonra başlatılabilir
function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Genel ses çalma yardımcısı
function playTone(
  frequency: number,
  duration: number,
  type: OscillatorType = 'sine',
  volume = 0.3,
  delay = 0,
) {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();

    osc.connect(gain);
    gain.connect(ac.destination);

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ac.currentTime + delay);

    gain.gain.setValueAtTime(0, ac.currentTime + delay);
    gain.gain.linearRampToValueAtTime(volume, ac.currentTime + delay + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + delay + duration);

    osc.start(ac.currentTime + delay);
    osc.stop(ac.currentTime + delay + duration + 0.01);
  } catch {
    // Ses desteklenmiyor — sessizce devam et
  }
}

// ─── Oyuna özel ses efektleri ────────────────────────────────────────────────

/** Zar atılırken çıkan ses (hızlı tıkırtı) */
export function playDiceRoll() {
  for (let i = 0; i < 6; i++) {
    const f = 200 + Math.random() * 300;
    playTone(f, 0.06, 'square', 0.15, i * 0.07);
  }
}

/** Zar sonucu açıklandığında (çift vuruş) */
export function playDiceResult() {
  playTone(300, 0.1, 'square', 0.25);
  playTone(450, 0.15, 'square', 0.2, 0.12);
}

/** Çift zar ses efekti (daha parlak) */
export function playDoubleRoll() {
  playTone(400, 0.1, 'square', 0.3);
  playTone(600, 0.15, 'square', 0.3, 0.12);
  playTone(800, 0.2, 'sine', 0.25, 0.28);
}

/** Para ödeme / kira (düşük iniş sesi) */
export function playPayMoney() {
  playTone(300, 0.12, 'sawtooth', 0.2);
  playTone(200, 0.15, 'sawtooth', 0.2, 0.14);
}

/** Para alma (yükselen ses) */
export function playCollectMoney() {
  playTone(400, 0.1, 'sine', 0.25);
  playTone(600, 0.12, 'sine', 0.25, 0.12);
  playTone(800, 0.15, 'sine', 0.2, 0.25);
}

/** Mülk satın alma */
export function playBuyProperty() {
  playTone(500, 0.1, 'sine', 0.3);
  playTone(700, 0.1, 'sine', 0.3, 0.12);
  playTone(900, 0.2, 'sine', 0.25, 0.25);
}

/** Ev / otel kurma */
export function playBuildHouse() {
  playTone(600, 0.08, 'square', 0.2);
  playTone(750, 0.08, 'square', 0.2, 0.1);
  playTone(900, 0.12, 'square', 0.25, 0.2);
}

/** Kart çekme (hafif "fısıltı" tonu) */
export function playDrawCard() {
  playTone(800, 0.05, 'sine', 0.15);
  playTone(1000, 0.07, 'sine', 0.12, 0.08);
}

/** Hapise gitme (alçalan üçlü) */
export function playGoToJail() {
  playTone(300, 0.15, 'sawtooth', 0.35);
  playTone(250, 0.15, 'sawtooth', 0.3, 0.18);
  playTone(200, 0.25, 'sawtooth', 0.25, 0.36);
}

/** İflas (uzun alçalan ses) */
export function playBankrupt() {
  playTone(300, 0.2, 'sawtooth', 0.4);
  playTone(200, 0.3, 'sawtooth', 0.35, 0.22);
  playTone(100, 0.5, 'sawtooth', 0.3, 0.55);
}

/** Kazanma fanfarı */
export function playWin() {
  const melody = [523, 659, 784, 1047]; // C5 E5 G5 C6
  melody.forEach((f, i) => playTone(f, 0.25, 'sine', 0.35, i * 0.18));
}

/** Taş-Kağıt-Makas — seçim yapıldı (kısa tık) */
export function playRPSChoice() {
  playTone(700, 0.08, 'square', 0.2);
}

/** Taş-Kağıt-Makas — açıklama */
export function playRPSReveal() {
  playTone(500, 0.1, 'square', 0.25);
  playTone(650, 0.15, 'square', 0.25, 0.12);
}
