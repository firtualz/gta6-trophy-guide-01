// Trophy data: loads the official list with this guide's own-words guides from data/trophies.json.
const DATA_URL = 'data/trophies.json';

export const ROADMAP_STAGES = [
  {
    stage: 1,
    title: 'Stage 1 — Play the story',
    hours: '60–80 hours',
    blurb: 'Finish all five chapters. Story trophies pop as you play, and the one missable moment of the whole list is in Chapter 1 — do the balcony meditation before Chapter 1 ends. Scan vehicles and study animals as you go: that progress counts later.',
  },
  {
    stage: 2,
    title: 'Stage 2 — Side questlines',
    hours: 'about 15 hours',
    blurb: 'Clear the optional questlines: Andy, Kenton, Billy, Randy, Tyrone and Bret, plus 8 Strangers & Freaks strands and Cal’s fishing challenge. All of them stay available after the story, so nothing here can be missed.',
  },
  {
    stage: 3,
    title: 'Stage 3 — 100% completion checklist',
    hours: 'about 100 hours',
    blurb: 'The checklist opens after the story under Progress, Stats, 100% Completion. It is forgiving — about 60% true completion — but a few lines need everything: robberies, underwater discoveries, shooting ranges, drone races and Bret’s quests.',
  },
  {
    stage: 4,
    title: 'Stage 4 — Cleanup & platinum',
    hours: 'about 10 hours',
    blurb: 'Mop up the rest — arcade games, card sets, WAiNK scans, partner tricks, the UFO easter egg and the showroom smash — then the platinum pops.',
  },
];

// The guide data file, loaded once and shared: the trophies, the numbered sources
// every guide cites, and the audit numbers the header strip shows.
let cachedDoc = null;

export async function loadGuideDoc() {
  if (cachedDoc) return cachedDoc;
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error('trophy data did not load');
  cachedDoc = await response.json();
  return cachedDoc;
}

export async function loadTrophyData() {
  const doc = await loadGuideDoc();
  return doc.trophies;
}

export async function loadSources() {
  const doc = await loadGuideDoc();
  return doc.sources || [];
}

// PlayStation trophy points by grade: bronze 15, silver 30, gold 90, platinum 300.
// The list totals 1,350 points.
export const PSN_POINTS = { platinum: 300, gold: 90, silver: 30, bronze: 15 };

export function pointsFor(trophy) {
  return PSN_POINTS[trophy.grade] || 0;
}

export function totalPsnPoints(trophies) {
  return trophies.reduce((sum, t) => sum + pointsFor(t), 0);
}

export function earnedPsnPoints(trophies, earned) {
  return trophies.reduce((sum, t) => sum + (earned.has(t.id) ? pointsFor(t) : 0), 0);
}

export function countByKind(trophies, kind) {
  if (kind === 'missable') return trophies.filter((t) => t.missable).length;
  if (kind === 'online') return 0;
  return trophies.filter((t) => t.kind === kind).length;
}

// The audit strip's numbers, all computed from the data so they cannot drift:
// every guide cites a source, every step carries a citation, and the unconfirmed
// trophies are counted, not hidden.
export function auditStats(trophies, sources) {
  const totalSteps = trophies.reduce((s, t) => s + (t.steps ? t.steps.length : 0), 0);
  const citedSteps = trophies.reduce(
    (s, t) => s + (t.steps ? t.steps.filter((step) => /\[\d+\]/.test(step)).length : 0),
    0,
  );
  return {
    total: trophies.length,
    platinum: countByGrade(trophies, 'platinum'),
    gold: countByGrade(trophies, 'gold'),
    silver: countByGrade(trophies, 'silver'),
    bronze: countByGrade(trophies, 'bronze'),
    hidden: trophies.filter((t) => t.hidden).length,
    citedGuides: trophies.filter((t) => t.sources && t.sources.length > 0).length,
    totalSteps,
    citedSteps,
    missable: trophies.filter((t) => t.missable).length,
    unconfirmed: trophies.filter((t) => t.unconfirmed).length,
    sourceCount: sources.length,
  };
}

// How many guides cite each numbered source, for the source matrix.
export function sourceCoverage(trophies, sources) {
  return sources.map((src) => ({
    ...src,
    citedBy: trophies.filter((t) => (t.steps || []).some((step) => step.includes(`[${src.n}]`))).length,
  }));
}

export function trophyById(trophies, id) {
  return trophies.find((t) => t.id === id) || null;
}

export function trophiesForStage(trophies, stage) {
  return trophies.filter((t) => t.roadmap_stage === stage);
}

export function countByGrade(trophies, grade) {
  return trophies.filter((t) => t.grade === grade).length;
}
