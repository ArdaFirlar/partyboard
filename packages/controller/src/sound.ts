// === Ses Efektleri Sistemi (Kontrolcü / Telefon) ===
// Telefon için sadece sıra bildirimi tonu ve titreşim.

let ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!ctx) ctx = new AudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

function playTone(frequency: number, duration: number, type: OscillatorType = 'sine', volume = 0.3) {
  try {
    const ac = getCtx();
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(frequency, ac.currentTime);
    gain.gain.setValueAtTime(0, ac.currentTime);
    gain.gain.linearRampToValueAtTime(volume, ac.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + duration);
    osc.start(ac.currentTime);
    osc.stop(ac.currentTime + duration + 0.01);
  } catch {
    // Sessizce devam et
  }
}

/** Sıra geldiğinde — titreşim + ses uyarısı */
export function playMyTurn() {
  // Titreşim (destekleyen cihazlarda)
  if (navigator.vibrate) {
    navigator.vibrate([100, 50, 100]);
  }
  // Kısa uyarı tonu
  playTone(880, 0.1, 'sine', 0.3);
  playTone(1100, 0.15, 'sine', 0.25);
}

/** Buton basma geri bildirimi */
export function playButtonTap() {
  if (navigator.vibrate) navigator.vibrate(30);
  playTone(600, 0.05, 'square', 0.15);
}

/** Kazanma tonu */
export function playWin() {
  if (navigator.vibrate) navigator.vibrate([200, 100, 200, 100, 400]);
  const melody = [523, 659, 784, 1047];
  melody.forEach((f, i) => {
    setTimeout(() => playTone(f, 0.2, 'sine', 0.3), i * 160);
  });
}

/** Kaybetme tonu */
export function playLose() {
  if (navigator.vibrate) navigator.vibrate([400]);
  playTone(300, 0.2, 'sawtooth', 0.3);
  setTimeout(() => playTone(200, 0.3, 'sawtooth', 0.25), 220);
}
