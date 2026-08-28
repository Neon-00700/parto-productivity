// German TTS helper.
// Uses the best installed de-DE/de-AT/de-CH system voice and never falls back
// to an English voice for German text. This keeps pronunciation much better
// than simply calling SpeechSynthesisUtterance without selecting a voice.
let voices = [];

function loadVoices() {
  try { voices = window.speechSynthesis?.getVoices?.() || []; } catch { voices = []; }
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  loadVoices();
  window.speechSynthesis.onvoiceschanged = loadVoices;
}

export function canSpeak() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

export function getGermanVoices() {
  if (!canSpeak()) return [];
  loadVoices();
  return voices.filter(v => /^(de-DE|de-AT|de-CH|de-LU)(-|$)/i.test(v.lang));
}

function bestGermanVoice() {
  const german = getGermanVoices();
  if (!german.length) return null;
  const preferred = ['Microsoft Conrad', 'Microsoft Katja', 'Google Deutsch', 'Google German', 'Anna'];
  for (const name of preferred) {
    const exact = german.find(v => v.name.toLowerCase().includes(name.toLowerCase()));
    if (exact) return exact;
  }
  return german.find(v => v.localService) || german[0];
}

export function speak(text, lang = 'de-DE', rate = 0.82) {
  if (!canSpeak() || !text) return false;
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = rate;
    u.pitch = 1;
    if (/^de/i.test(lang)) {
      const v = bestGermanVoice();
      if (!v) {
        console.warn('No German system voice is installed. Install a German voice in Windows language/speech settings.');
      } else {
        u.voice = v;
        u.lang = v.lang;
      }
    }
    window.speechSynthesis.speak(u);
    return true;
  } catch (e) {
    console.warn('speech failed', e);
    return false;
  }
}
