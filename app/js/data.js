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

export async function loadTrophyData() {
  const response = await fetch(DATA_URL);
  if (!response.ok) throw new Error('trophy data did not load');
  const doc = await response.json();
  return doc.trophies;
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
