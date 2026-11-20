// Progress store: one localStorage key, read and written the same way.
// State shape: { earned: {id: true}, counts: {id: number} }.
export const KEY = "platinum-atlas-v1";

export function blankState() {
  return { earned: {}, counts: {} };
}

export function loadState() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return blankState();
    const s = JSON.parse(raw);
    if (!s || typeof s !== "object") return blankState();
    return { earned: s.earned || {}, counts: s.counts || {} };
  } catch {
    return blankState();
  }
}

export function saveState(s) {
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function countOf(s, t) {
  return s.counts[t.id] || 0;
}

// A counted trophy counts as earned once its target is reached.
export function isEarned(s, t) {
  if (s.earned[t.id]) return true;
  if (t.count && countOf(s, t) >= t.count) return true;
  return false;
}

export function earnedCount(s, trophies) {
  return trophies.filter((t) => isEarned(s, t)).length;
}

export function earnedPoints(s, trophies) {
  let n = 0;
  for (const t of trophies) if (isEarned(s, t)) n += t.grade === "platinum" ? 180 : t.grade === "gold" ? 90 : t.grade === "silver" ? 30 : 15;
  return n;
}

export function toggleEarned(s, t) {
  if (s.earned[t.id]) delete s.earned[t.id];
  else s.earned[t.id] = true;
  saveState(s);
}

export function setCount(s, t, n) {
  const v = Math.max(0, Math.min(t.count, n | 0));
  if (v === 0) delete s.counts[t.id];
  else s.counts[t.id] = v;
  saveState(s);
}

// Export: download the current progress as a JSON file.
export function exportState(s) {
  const blob = new Blob([JSON.stringify({ app: "platinum-atlas-v1", earned: Object.keys(s.earned).map(Number), counts: s.counts }, null, 2)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = "platinum-atlas-progress.json";
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

// Import: parse progress JSON the app itself exported (or the same shape).
// Returns a state object, or throws with a plain message.
export function importStateText(text) {
  const raw = JSON.parse(text);
  const earned = {};
  const counts = {};
  const ids = Array.isArray(raw.earned) ? raw.earned : Object.keys(raw.earned || {});
  for (const id of ids) {
    const n = Number(id);
    if (Number.isInteger(n) && n >= 1 && n <= 55) earned[n] = true;
  }
  for (const [k, v] of Object.entries(raw.counts || {})) {
    const n = Number(k);
    if (Number.isInteger(n) && n >= 1 && n <= 55 && Number.isFinite(v) && v > 0) counts[n] = v | 0;
  }
  if (!Object.keys(earned).length && !Object.keys(counts).length) throw new Error("no progress found in that file");
  return { earned, counts };
}
