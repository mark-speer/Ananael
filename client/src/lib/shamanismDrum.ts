/**
 * Client-side journey drum / metronome via Web Audio.
 * Default ~220 bpm (~4 Hz pulse), in the common theta-drumming range.
 */

export interface DrumHandle {
  start: () => void;
  stop: () => void;
  get running(): boolean;
}

export function createJourneyDrum(bpm = 220): DrumHandle {
  let ctx: AudioContext | null = null;
  let timer: ReturnType<typeof setInterval> | null = null;
  let running = false;

  const click = () => {
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.value = 180;
    gain.gain.setValueAtTime(0.18, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.06);
  };

  return {
    start() {
      if (running) return;
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AC) return;
      ctx = ctx ?? new AC();
      void ctx.resume();
      running = true;
      click();
      const intervalMs = Math.max(80, 60_000 / bpm);
      timer = setInterval(click, intervalMs);
    },
    stop() {
      running = false;
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    },
    get running() {
      return running;
    },
  };
}
