// ─────────────────────────────────────────────────────
//  Bloom — Text-to-speech using Web Speech API
//  Free, built into every modern browser. No API key needed.
// ─────────────────────────────────────────────────────

let _voicesLoaded = false;

function loadVoices() {
  return new Promise((resolve) => {
    const voices = window.speechSynthesis.getVoices();
    if (voices.length > 0) { resolve(voices); return; }
    window.speechSynthesis.addEventListener('voiceschanged', () => {
      resolve(window.speechSynthesis.getVoices());
    }, { once: true });
  });
}

function pickVoice(voices) {
  // Prefer high-quality English voices in order
  const prefs = [
    'Samantha',            // macOS – warm, natural
    'Karen',               // macOS AU
    'Moira',               // macOS Irish
    'Google US English',   // Chrome – solid
    'Google UK English Female',
    'Microsoft Aria',      // Edge
    'Microsoft Zira',      // Windows
  ];
  for (const name of prefs) {
    const match = voices.find(v => v.name === name);
    if (match) return match;
  }
  // Fallback: first local English voice
  return (
    voices.find(v => v.lang.startsWith('en') && v.localService) ||
    voices.find(v => v.lang.startsWith('en')) ||
    null
  );
}

/**
 * Speak text aloud. Safe to call on web only — no-ops elsewhere.
 * Returns a promise that resolves when speech ends (or immediately on error).
 */
export function speak(text) {
  if (
    typeof window === 'undefined' ||
    !window.speechSynthesis ||
    !text?.trim()
  ) return Promise.resolve();

  return new Promise(async (resolve) => {
    window.speechSynthesis.cancel();

    // Strip markdown-ish symbols that would be read aloud awkwardly
    const clean = text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/\*(.*?)\*/g, '$1')
      .replace(/`{1,3}(.*?)`{1,3}/g, '$1')
      .replace(/#{1,6}\s/g, '')
      .replace(/[-•]\s/g, '')
      .trim();

    const voices = await loadVoices();
    const voice  = pickVoice(voices);

    const utterance = new SpeechSynthesisUtterance(clean);
    utterance.rate   = 0.92;   // slightly slower than default — easier to follow
    utterance.pitch  = 1.05;   // just a touch warmer
    utterance.volume = 1;
    if (voice) utterance.voice = voice;

    utterance.onend   = () => resolve();
    utterance.onerror = () => resolve();

    window.speechSynthesis.speak(utterance);
  });
}

/** Stop any currently playing speech immediately. */
export function stopSpeaking() {
  if (typeof window !== 'undefined' && window.speechSynthesis) {
    window.speechSynthesis.cancel();
  }
}

/** True if the browser supports TTS. */
export function hasTTS() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
