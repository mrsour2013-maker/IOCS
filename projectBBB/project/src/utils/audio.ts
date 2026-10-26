/**
 * Shared Web Audio helpers for notification and typing sounds.
 * Lazily creates a single AudioContext; safe to call repeatedly.
 */

let sharedCtx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!sharedCtx) {
    const Ctor = window.AudioContext || (window as any).webkitAudioContext;
    if (!Ctor) return null;
    sharedCtx = new Ctor();
  }
  if (sharedCtx && sharedCtx.state === "suspended") sharedCtx.resume().catch(() => {});
  return sharedCtx;
}

/** Resume the audio context (call from a user gesture if autoplay blocked). */
export function resumeAudio(): void {
  getCtx();
}

/** Play a short tone. */
export function playTone(freq: number, durationMs: number, volume = 0.08): void {
  const ctx = getCtx();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = freq;
  osc.connect(gain).connect(ctx.destination);
  const now = ctx.currentTime;
  gain.gain.setValueAtTime(volume, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + durationMs / 1000);
  osc.start(now);
  osc.stop(now + durationMs / 1000);
}

/** A gentle two-note notification chime (LINE-like). */
export function playNotificationSound(): void {
  playTone(880, 180, 0.06);
  window.setTimeout(() => playTone(1320, 220, 0.05), 160);
}

/** A soft keyboard tap sound. */
export function playKeyTap(): void {
  playTone(520 + Math.random() * 80, 28, 0.025);
}

/** Try a short haptic; silently no-op if unsupported. */
export function haptic(pattern: number | number[]): void {
  try {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(pattern);
    }
  } catch {
    // unsupported
  }
}
