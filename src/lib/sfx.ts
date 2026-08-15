import { useSfxStore } from "./sfx-store";

/**
 * Synthesized UI sounds (Web Audio API). No audio assets: every effect is a
 * short oscillator with an exponential gain envelope, so it works offline.
 */

export type SfxName = "click" | "toggle" | "confirm" | "success" | "cancel";

let ctx: AudioContext | null = null;

type AudioCtor = typeof AudioContext;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    const AC: AudioCtor | undefined =
      window.AudioContext ??
      (window as Window & { webkitAudioContext?: AudioCtor }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function unlock() {
  const c = getCtx();
  if (!c || c.state === "running") {
    window.removeEventListener("pointerdown", unlock);
    window.removeEventListener("keydown", unlock);
  }
}

if (typeof window !== "undefined") {
  // Browsers require a user gesture before audio starts; unlock on first interaction.
  window.addEventListener("pointerdown", unlock);
  window.addEventListener("keydown", unlock);
}

interface ToneOptions {
  at?: number;
  duration?: number;
  type?: OscillatorType;
  volume?: number;
}

function tone(
  freq: number,
  { at = 0, duration = 0.12, type = "sine", volume = 0.05 }: ToneOptions = {},
) {
  const c = getCtx();
  if (!c) return;
  const t0 = c.currentTime + at;
  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  gain.gain.setValueAtTime(0.0001, t0);
  gain.gain.exponentialRampToValueAtTime(volume, t0 + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + duration);
  osc.connect(gain);
  gain.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + duration + 0.05);
}

function click() {
  tone(1500, { duration: 0.06, volume: 0.025 });
}

function toggle() {
  tone(880, { duration: 0.09, volume: 0.035 });
  tone(660, { at: 0.085, duration: 0.09, volume: 0.035 });
}

function confirm() {
  tone(523, { duration: 0.1, volume: 0.04 });
  tone(784, { at: 0.08, duration: 0.13, volume: 0.04 });
}

function success() {
  tone(523, { duration: 0.09, volume: 0.045 });
  tone(659, { at: 0.08, duration: 0.09, volume: 0.045 });
  tone(784, { at: 0.16, duration: 0.18, volume: 0.05 });
}

function cancel() {
  tone(440, { duration: 0.09, volume: 0.04 });
  tone(330, { at: 0.08, duration: 0.12, volume: 0.04 });
}

const EFFECTS: Record<SfxName, () => void> = { click, toggle, confirm, success, cancel };

export const sfx = {
  play(name: SfxName) {
    if (!useSfxStore.getState().enabled) return;
    EFFECTS[name]();
  },
  click: () => sfx.play("click"),
  toggle: () => sfx.play("toggle"),
  confirm: () => sfx.play("confirm"),
  success: () => sfx.play("success"),
  cancel: () => sfx.play("cancel"),
};
