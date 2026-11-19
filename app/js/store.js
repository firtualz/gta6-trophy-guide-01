// Saved progress: earned trophies and the spoiler setting, kept in localStorage only.
// Export writes a JSON file; import reads one back. Nothing leaves the browser.
const EARNED_KEY = 'platinum-atlas-earned-v1';
const SPOILER_KEY = 'platinum-atlas-spoilers-v1';

export function loadEarned() {
  try {
    const raw = localStorage.getItem(EARNED_KEY);
    if (!raw) return new Set();
    const ids = JSON.parse(raw);
    if (!Array.isArray(ids)) return new Set();
    return new Set(ids.filter((n) => Number.isInteger(n)));
  } catch {
    return new Set();
  }
}

export function saveEarned(earned) {
  localStorage.setItem(EARNED_KEY, JSON.stringify([...earned].sort((a, b) => a - b)));
}

export function loadSpoilers() {
  return localStorage.getItem(SPOILER_KEY) === 'on';
}

export function saveSpoilers(on) {
  localStorage.setItem(SPOILER_KEY, on ? 'on' : 'off');
}

export function exportProgress(earned) {
  const payload = {
    app: 'Platinum Atlas — GTA 6 Trophy Guide & Tracker',
    version: 1,
    exported_at: new Date().toISOString(),
    total: 55,
    earned: [...earned].sort((a, b) => a - b),
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = 'platinum-atlas-progress.json';
  link.click();
  URL.revokeObjectURL(link.href);
  return payload.earned.length;
}

export function importProgress(text, trophies) {
  const doc = JSON.parse(text);
  const ids = Array.isArray(doc) ? doc : doc.earned;
  if (!Array.isArray(ids)) throw new Error('not a progress file');
  const known = new Set(trophies.map((t) => t.id));
  const clean = ids.filter((n) => Number.isInteger(n) && known.has(n));
  return new Set(clean);
}
