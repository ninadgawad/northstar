let sharedContext: AudioContext | null = null;

function getContext(): AudioContext {
  if (!sharedContext) sharedContext = new AudioContext();
  return sharedContext;
}

function beep(ctx: AudioContext, startTime: number, frequency: number, duration: number): void {
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = "sine";
  oscillator.frequency.value = frequency;

  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.25, startTime + 0.02);
  gain.gain.linearRampToValueAtTime(0, startTime + duration);

  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration);
}

/** Plays a short three-tone alarm chime to announce a completed focus session. */
export function playAlarm(): void {
  try {
    const ctx = getContext();
    if (ctx.state === "suspended") void ctx.resume();
    const now = ctx.currentTime;
    const notes = [880, 1108.73, 1318.51]; // A5, C#6, E6 — bright, upbeat triad
    notes.forEach((freq, i) => beep(ctx, now + i * 0.22, freq, 0.2));
  } catch {
    // Web Audio unavailable — fail silently, the on-screen banner still shows.
  }
}
