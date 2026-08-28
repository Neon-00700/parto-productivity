// Ambient soundscapes generated 100% offline with WebAudio (no audio files).
let ctx = null;
let current = null; // { nodes: [], gain, id }

function getCtx() {
  try {
    if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  } catch { return null; }
}

function noiseBuffer(ac, type) {
  const len = ac.sampleRate * 4;
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const out = buf.getChannelData(0);
  let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0, last = 0;
  for (let i = 0; i < len; i++) {
    const white = Math.random() * 2 - 1;
    if (type === 'white') {
      out[i] = white * 0.35;
    } else if (type === 'pink') {
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.969 * b2 + white * 0.153852;
      b3 = 0.8665 * b3 + white * 0.3104856;
      b4 = 0.55 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.016898;
      out[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    } else { // brown (rain-like when lowpassed)
      last = (last + 0.02 * white) / 1.02;
      out[i] = last * 3.2;
    }
  }
  return buf;
}

export function startSoundscape(id, volume = 0.5) {
  stopSoundscape();
  if (!id || id === 'off') return;
  const ac = getCtx();
  if (!ac) return;

  const gain = ac.createGain();
  gain.gain.value = volume * 0.6;
  gain.connect(ac.destination);
  const nodes = [gain];

  const type = id === 'white' ? 'white' : id === 'cafe' ? 'pink' : 'brown';
  const src = ac.createBufferSource();
  src.buffer = noiseBuffer(ac, type);
  src.loop = true;

  if (id === 'rain') {
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 900;
    const hp = ac.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 150;
    src.connect(lp).connect(hp).connect(gain);
    nodes.push(lp, hp);
    // gentle volume wobble like rain gusts
    const lfo = ac.createOscillator();
    const lfoGain = ac.createGain();
    lfo.frequency.value = 0.13;
    lfoGain.gain.value = volume * 0.12;
    lfo.connect(lfoGain).connect(gain.gain);
    lfo.start();
    nodes.push(lfo, lfoGain);
  } else if (id === 'cafe') {
    const lp = ac.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1800;
    src.connect(lp).connect(gain);
    nodes.push(lp);
  } else {
    src.connect(gain);
  }

  src.start();
  nodes.push(src);
  current = { nodes, gain, id };
}

export function setSoundscapeVolume(volume) {
  if (current?.gain) current.gain.gain.value = volume * 0.6;
}

export function stopSoundscape() {
  if (!current) return;
  current.nodes.forEach((n) => {
    try { if (n.stop) n.stop(); } catch { /* noop */ }
    try { n.disconnect(); } catch { /* noop */ }
  });
  current = null;
}

export function activeSoundscape() {
  return current?.id || 'off';
}
