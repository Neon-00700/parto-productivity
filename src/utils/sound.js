// Pleasant two-tone chime synthesized with WebAudio — no external audio files needed.
let ctx = null;

function getCtx() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

export function playChime() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const notes = [
    { f: 880, t: 0, d: 0.5 },
    { f: 1108.73, t: 0.18, d: 0.5 },
    { f: 1318.51, t: 0.36, d: 0.9 },
  ];
  notes.forEach(({ f, t, d }) => {
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = 'sine';
    osc.frequency.value = f;
    gain.gain.setValueAtTime(0.0001, now + t);
    gain.gain.exponentialRampToValueAtTime(0.25, now + t + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + t + d);
    osc.connect(gain).connect(ac.destination);
    osc.start(now + t);
    osc.stop(now + t + d + 0.05);
  });
}

export function playTick() {
  const ac = getCtx();
  if (!ac) return;
  const now = ac.currentTime;
  const osc = ac.createOscillator();
  const gain = ac.createGain();
  osc.type = 'triangle';
  osc.frequency.value = 660;
  gain.gain.setValueAtTime(0.0001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
  osc.connect(gain).connect(ac.destination);
  osc.start(now);
  osc.stop(now + 0.15);
}
