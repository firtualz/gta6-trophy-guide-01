// Filters: every chip is backed by real trophy data, counts computed at runtime.
import { isEarned } from "./store.js";

export const SPOILER_MODES = [
  { v: 0, label: "Spoilers: show all" },
  { v: 1, label: "Spoilers: hide story names" },
  { v: 2, label: "Spoilers: hide all spoilers" },
];

export const FACETS = [
  { key: "all", label: "All", match: () => true },
  { key: "story", label: "Story", match: (t) => (t.facets || []).includes("story") },
  { key: "missable", label: "Missable", match: (t) => (t.facets || []).includes("missable") },
  { key: "collectible", label: "Collectibles", match: (t) => (t.facets || []).includes("collectible") },
  { key: "activity", label: "Activities", match: (t) => (t.facets || []).includes("activity") },
  { key: "crime", label: "Crime", match: (t) => (t.facets || []).includes("crime") },
  { key: "strand", label: "Strands & side chains", match: (t) => (t.facets || []).includes("strand") },
  { key: "money", label: "Money", match: (t) => (t.facets || []).includes("money") },
  { key: "feats", label: "Feats", match: (t) => (t.facets || []).includes("feats") },
  { key: "disputed", label: "Disputed", match: (t) => (t.facets || []).includes("disputed") },
  { key: "hidden", label: "PSN-hidden", match: (t) => !!t.hidden },
  { key: "riddles", label: "Riddles", match: (t) => (t.facets || []).includes("riddles") },
  { key: "misc", label: "Misc", match: (t) => (t.facets || []).includes("misc") },
  { key: "completion", label: "Completion", match: (t) => (t.facets || []).includes("completion") },
  { key: "online", label: "Online", match: () => false },
  { key: "todo", label: "To-do", match: (t, s) => !isEarned(s, t) },
];

export function facetCount(data, state, f) {
  return data.trophies.filter((t) => f.match(t, state)).length;
}

export function spoilerHidden(t, state, mode) {
  if (mode === 0) return false;
  if (isEarned(state, t)) return false;
  if (mode === 1) return t.kind === "story";
  return !!t.hidden;
}

export function applyFilters(data, state, ui) {
  const q = (ui.query || "").trim().toLowerCase();
  const facet = FACETS.find((f) => f.key === ui.facet) || FACETS[0];
  return data.trophies.filter((t) => {
    if (!facet.match(t, state)) return false;
    if (ui.grade !== "all" && t.grade !== ui.grade) return false;
    if (ui.earned === "earned" && !isEarned(state, t)) return false;
    if (ui.earned === "todo" && isEarned(state, t)) return false;
    if (q) {
      const hay = [t.name, t.description, t.guide, ...(t.steps || []).map((s) => s.t)].join(" ").toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
}
