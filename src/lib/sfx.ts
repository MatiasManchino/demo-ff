// Sonidos de UI generados en runtime con WebAudio — sin assets.
// Respetan el toggle de sonido del store (soundEnabled).
import { useGameStore } from '@/store/gameStore';

let ctx: AudioContext | null = null;

function beep(freq: number, dur: number, delay = 0, type: OscillatorType = 'sine', vol = 0.05) {
  if (!useGameStore.getState().soundEnabled) return;
  try {
    ctx ??= new AudioContext();
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + dur);
  } catch { /* audio bloqueado: no pasa nada */ }
}

export const sfxSuccess = () => { beep(523, 0.12); beep(784, 0.18, 0.09); };            // trato cerrado
export const sfxFail    = () => { beep(330, 0.15, 0, 'sawtooth', 0.03); beep(220, 0.2, 0.1, 'sawtooth', 0.03); };
export const sfxCoin    = () => { beep(988, 0.08); beep(1319, 0.12, 0.06); };           // cobro
export const sfxAlert   = () => { beep(196, 0.22, 0, 'square', 0.025); beep(165, 0.25, 0.12, 'square', 0.025); };
export const sfxClick   = () => beep(600, 0.05, 0, 'triangle', 0.03);
