// Saved progress: earned trophies and the spoiler setting, kept in localStorage only.
// Export writes a JSON file; import reads one back. Nothing leaves the browser.
const EARNED_KEY = 'platinum-atlas-earned-v1';
const SPOILER_KEY = 'platinum-atlas-spoilers-v1';
const COUNTS_KEY = 'platinum-atlas-counts-v1';
const REVEALED_KEY = 'platinum-atlas-revealed-v1';

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

// Per-trophy progress counters for counted trophies (meditations, races, scans…),
// stored as {trophyId: count}. A count of 0 is dropped so the stored value stays small.
export function loadCounts() {
  try {
    const raw = localStorage.getItem(COUNTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return {};
    const clean = {};
    for (const [key, value] of Object.entries(parsed)) {
      const id = Number(key);
      if (Number.isInteger(id) && Number.isInteger(value) && value > 0) clean[id] = value;
    }
    return clean;
  } catch {
    return {};
  }
}

export function saveCounts(counts) {
  localStorage.setItem(COUNTS_KEY, JSON.stringify(counts));
}

// Story trophies the player chose to reveal with the Reveal button, despite
// spoilers being on. Stored as a sorted array of trophy ids.
export function loadRevealed() {
  try {
    const raw = localStorage.getItem(REVEALED_KEY);
    if (!raw) return new Set();
    const ids = JSON.parse(raw);
    if (!Array.isArray(ids)) return new Set();
    return new Set(ids.filter((n) => Number.isInteger(n)));
  } catch {
    return new Set();
  }
}

export function saveRevealed(revealed) {
  localStorage.setItem(REVEALED_KEY, JSON.stringify([...revealed].sort((a, b) => a - b)));
}

export function loadSpoilers() {
  return localStorage.getItem(SPOILER_KEY) === 'on';
}

export function saveSpoilers(on) {
  localStorage.setItem(SPOILER_KEY, on ? 'on' : 'off');
}

export function exportProgress(earned, counts) {
  const payload = {
    app: 'Platinum Atlas — GTA 6 Trophy Guide & Tracker',
    version: 1,
    exported_at: new Date().toISOString(),
    total: 55,
    earned: [...earned].sort((a, b) => a - b),
    counts: counts || {},
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
  const counts = {};
  if (doc && typeof doc === 'object' && doc.counts && typeof doc.counts === 'object') {
    for (const [key, value] of Object.entries(doc.counts)) {
      const id = Number(key);
      const trophy = trophies.find((t) => t.id === id);
      if (trophy && trophy.count && Number.isInteger(value) && value > 0) {
        counts[id] = Math.min(value, trophy.count);
      }
    }
  }
  return { earned: new Set(clean), counts };
}
