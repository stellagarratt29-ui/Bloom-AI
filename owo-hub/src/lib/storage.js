const PREFIX = 'owo:';

export function loadJSON(key, fallback) {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    if (raw == null) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveJSON(key, value) {
  window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
}
