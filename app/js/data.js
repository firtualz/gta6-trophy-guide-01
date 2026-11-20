// Data layer: loads the trophy list (app/data/trophies.json) once, offline.
export let DATA = null;

export async function loadData() {
  if (DATA) return DATA;
  const res = await fetch("data/trophies.json");
  if (!res.ok) throw new Error("trophies.json failed to load");
  DATA = await res.json();
  return DATA;
}

export const POINTS = { platinum: 180, gold: 90, silver: 30, bronze: 15 };
export const TOTAL_POINTS = 1230;

export function pointsOf(t) {
  return POINTS[t.grade] || 0;
}

export function sourceById(id) {
  return (DATA && DATA.sources.find((s) => s.id === id)) || null;
}

export function sourceName(id) {
  const s = sourceById(id);
  return s ? s.name : id;
}

// Honest audit numbers, computed from the data at runtime.
export function audit(data) {
  const trophies = data.trophies;
  const grades = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  let hidden = 0;
  let steps = 0;
  let cited = 0;
  let twoPlus = 0;
  let missable = 0;
  let unconfirmed = 0;
  const used = {};
  for (const t of trophies) {
    grades[t.grade] = (grades[t.grade] || 0) + 1;
    if (t.hidden) hidden++;
    if (t.missable) missable++;
    if (t.unconfirmed) unconfirmed++;
    for (const s of t.steps || []) {
      steps++;
      const n = (s.s || []).length;
      if (n > 0) cited++;
      if (n >= 2) twoPlus++;
      for (const id of s.s || []) used[id] = (used[id] || 0) + 1;
    }
  }
  return {
    total: trophies.length,
    grades,
    hidden,
    steps,
    cited,
    twoPlus,
    missable,
    unconfirmed,
    sourcesCited: Object.keys(used).length,
    sourcesRead: (data.sourcesRead || []).length,
    readDate: "2026-11-21",
    claimsBySource: used,
  };
}

// Claims per source, most-cited first, for the SOURCES panel.
export function claimsBySource(data) {
  const a = audit(data);
  return Object.entries(a.claimsBySource)
    .map(([id, n]) => ({ id, name: sourceName(id), url: (sourceById(id) || {}).url || "#", n }))
    .sort((x, y) => y.n - x.n);
}

export function fmt(n) {
  return Number(n).toLocaleString("en-US");
}
