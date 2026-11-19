// Views: the checklist, the trophy detail panel, the roadmap, the missables page,
// the Next Up planner and the progress header. All DOM building, no network.
import {
  ROADMAP_STAGES, trophiesForStage, countByGrade, pointsFor, totalPsnPoints,
  earnedPsnPoints, countByKind, auditStats, sourceCoverage,
} from './data.js';
import { displayName, displayDescription, nextUpTrophies, isSpoilerHidden } from './filters.js';

function gradeChip(grade) {
  const chip = document.createElement('span');
  chip.className = `chip ${grade}`;
  chip.textContent = grade;
  return chip;
}

function tagChip(text, kind) {
  const chip = document.createElement('span');
  chip.className = `chip ${kind}`;
  chip.textContent = text;
  return chip;
}

export function renderProgress(trophies, earned) {
  const total = trophies.length;
  document.getElementById('earnedNum').textContent = String(earned.size);
  document.getElementById('progressFill').style.width = `${(earned.size / total) * 100}%`;
  const parts = ['platinum', 'gold', 'silver', 'bronze'].map((grade) => {
    const got = trophies.filter((t) => t.grade === grade && earned.has(t.id)).length;
    const label = grade === 'platinum' ? 'P' : grade === 'gold' ? 'G' : grade === 'silver' ? 'S' : 'B';
    return `${label} ${got}/${countByGrade(trophies, grade)}`;
  });
  document.getElementById('gradeCounts').textContent = parts.join('  ·  ');
  document.getElementById('psnPoints').textContent = `${earnedPsnPoints(trophies, earned)} / ${totalPsnPoints(trophies)} PSN pts`;
}

// The audit strip: one line proving completeness, every number computed from the
// data so it cannot drift from the list it describes.
export function renderAudit(trophies, sources) {
  const stats = auditStats(trophies, sources);
  const readDate = sources.length > 0 ? sources[0].read : '';
  document.getElementById('auditStrip').textContent =
    `AUDIT ${stats.total} official · ${stats.platinum}P ${stats.gold}G ${stats.silver}S ${stats.bronze}B · ${stats.hidden} hidden · ${stats.citedGuides}/${stats.total} guides cite a source · ${stats.citedSteps}/${stats.totalSteps} steps cited · ${stats.sourceCount} sources read ${readDate} · ${stats.missable} missable · ${stats.unconfirmed} unconfirmed · listed honestly`;
}

// Filter chips with real counts, so the list's size is visible at a glance.
export function renderFilterCounts(trophies) {
  for (const button of document.querySelectorAll('#kindFilters button')) {
    const kind = button.dataset.kind;
    const count = kind === 'all' ? trophies.length : countByKind(trophies, kind);
    button.textContent = `${button.dataset.label} ${count}`;
  }
}

function trophyRow(trophy, state, handlers) {
  const item = document.createElement('li');
  if (trophy.id === state.selectedId) item.classList.add('selected');
  if (state.earnedSet.has(trophy.id)) item.classList.add('earned');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earnedSet.has(trophy.id);
  box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
  box.addEventListener('click', (event) => {
    event.stopPropagation();
    handlers.onToggle(trophy.id, box.checked);
  });
  const body = document.createElement('div');
  const name = document.createElement('div');
  name.className = 'trophyName';
  name.textContent = displayName(trophy, state.earnedSet, state.spoilers, state.revealed);
  const desc = document.createElement('div');
  desc.className = 'trophyDesc';
  desc.textContent = displayDescription(trophy, state.earnedSet, state.spoilers, state.revealed);
  const meta = document.createElement('div');
  meta.className = 'trophyMeta';
  meta.append(gradeChip(trophy.grade));
  meta.append(tagChip(`${pointsFor(trophy)} pts`, 'points'));
  if (trophy.hidden) meta.append(tagChip('hidden', 'hidden'));
  if (trophy.missable) meta.append(tagChip('MISSABLE', 'missable'));
  if (trophy.unconfirmed) meta.append(tagChip('unconfirmed', 'unconfirmed'));
  if (trophy.count) {
    const counter = document.createElement('span');
    counter.className = 'counter';
    const minus = document.createElement('button');
    minus.type = 'button';
    minus.textContent = '−';
    minus.setAttribute('aria-label', `One fewer ${trophy.name}`);
    minus.addEventListener('click', (event) => {
      event.stopPropagation();
      handlers.onCount(trophy.id, -1);
    });
    const value = document.createElement('span');
    value.textContent = `${state.counts[trophy.id] || 0}/${trophy.count}`;
    const plus = document.createElement('button');
    plus.type = 'button';
    plus.textContent = '+';
    plus.setAttribute('aria-label', `One more ${trophy.name}`);
    plus.addEventListener('click', (event) => {
      event.stopPropagation();
      handlers.onCount(trophy.id, 1);
    });
    counter.append(minus, value, plus);
    meta.append(counter);
  }
  meta.append(tagChip(trophy.kind, ''));
  body.append(name, desc, meta);
  item.append(box, body);
  item.addEventListener('click', () => handlers.onSelect(trophy.id));
  return item;
}

export function renderTrophyList(trophies, shown, state, handlers) {
  const list = document.getElementById('trophyList');
  list.replaceChildren();
  document.getElementById('shownCount').textContent = `Showing ${shown.length} of ${trophies.length} trophies`;
  const note = document.getElementById('activeFilterNote');
  note.textContent = state.kind === 'online'
    ? '— there are no online trophies: all 55 are single-player and offline.'
    : '';
  if (shown.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'empty';
    empty.textContent = state.kind === 'online'
      ? 'No online trophies. Every trophy in GTA 6 is earned offline, in single-player.'
      : 'No trophies match these filters.';
    list.append(empty);
    return;
  }
  // Group the checklist by roadmap stage, with the earned count per stage.
  const byStage = new Map();
  for (const trophy of shown) {
    if (!byStage.has(trophy.roadmap_stage)) byStage.set(trophy.roadmap_stage, []);
    byStage.get(trophy.roadmap_stage).push(trophy);
  }
  const stages = [...byStage.keys()].sort((a, b) => a - b);
  for (const stageNum of stages) {
    const members = trophiesForStage(trophies, stageNum);
    const done = members.filter((t) => state.earnedSet.has(t.id)).length;
    const stageInfo = ROADMAP_STAGES.find((s) => s.stage === stageNum);
    const label = stageInfo ? stageInfo.title.replace(/^Stage \d+ — /, '') : '';
    const head = document.createElement('li');
    head.className = 'stageHead';
    head.textContent = `STAGE ${stageNum} · ${label.toUpperCase()} — ${done}/${members.length} EARNED`;
    list.append(head);
    for (const trophy of byStage.get(stageNum)) {
      list.append(trophyRow(trophy, state, handlers));
    }
  }
}

// The full detail for one trophy: title, official description, grade/points/counter
// chips, numbered steps each ending in its source citations, and the numbered
// source matrix for the sources those steps cite. For an unearned story trophy
// with spoilers on, the guide is hidden behind a Reveal button — the name,
// description and guide never leak. The missables view reuses this too.
function buildTrophyDetail(trophy, state, handlers) {
  const frag = document.createDocumentFragment();
  const hidden = isSpoilerHidden(trophy, state.earnedSet, state.spoilers, state.revealed);
  const title = document.createElement('h2');
  title.textContent = displayName(trophy, state.earnedSet, state.spoilers, state.revealed);
  frag.append(title);
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = displayDescription(trophy, state.earnedSet, state.spoilers, state.revealed);
  frag.append(official);
  const meta = document.createElement('div');
  meta.className = 'trophyMeta';
  meta.append(gradeChip(trophy.grade));
  meta.append(tagChip(`${pointsFor(trophy)} PSN pts`, 'points'));
  if (trophy.hidden) meta.append(tagChip('hidden on PlayStation until earned', 'hidden'));
  if (trophy.missable) meta.append(tagChip('MISSABLE — do it in Chapter 1', 'missable'));
  if (trophy.unconfirmed) meta.append(tagChip('unconfirmed — no verified method yet', 'unconfirmed'));
  if (trophy.count) meta.append(tagChip(`PSN target: ${trophy.count}`, 'count'));
  meta.append(tagChip(`kind: ${trophy.kind}`, ''));
  meta.append(tagChip(`roadmap stage ${trophy.roadmap_stage}`, ''));
  frag.append(meta);
  if (hidden) {
    const note = document.createElement('p');
    note.className = 'hiddenNote';
    note.textContent = 'Story trophy — hidden until earned. The guide is hidden too, so nothing about this mission is spoiled.';
    const reveal = document.createElement('button');
    reveal.type = 'button';
    reveal.className = 'revealBtn';
    reveal.textContent = 'Reveal this trophy';
    reveal.addEventListener('click', () => handlers.onReveal(trophy.id));
    frag.append(note, reveal);
  } else {
    if (trophy.count) {
      const counter = document.createElement('div');
      counter.className = 'counterRow';
      const minus = document.createElement('button');
      minus.type = 'button';
      minus.textContent = '−';
      minus.setAttribute('aria-label', `One fewer ${trophy.name}`);
      minus.addEventListener('click', () => handlers.onCount(trophy.id, -1));
      const value = document.createElement('span');
      value.textContent = `${state.counts[trophy.id] || 0} / ${trophy.count}`;
      const plus = document.createElement('button');
      plus.type = 'button';
      plus.textContent = '+';
      plus.setAttribute('aria-label', `One more ${trophy.name}`);
      plus.addEventListener('click', () => handlers.onCount(trophy.id, 1));
      counter.append(minus, value, plus);
      frag.append(counter);
    }
    const guideHeading = document.createElement('h3');
    guideHeading.textContent = 'Guide';
    const steps = document.createElement('ol');
    steps.className = 'steps';
    for (const step of trophy.steps || []) {
      const item = document.createElement('li');
      item.textContent = step;
      steps.append(item);
    }
    frag.append(guideHeading, steps);
    const coverage = sourceCoverage(state.trophies, state.sources);
    const cited = new Set();
    for (const step of trophy.steps || []) {
      for (const src of state.sources) {
        if (step.includes(`[${src.n}]`)) cited.add(src.n);
      }
    }
    const citedSources = coverage.filter((src) => cited.has(src.n));
    if (citedSources.length > 0) {
      const sourceHeading = document.createElement('h3');
      sourceHeading.textContent = 'Sources';
      const sources = document.createElement('ol');
      sources.className = 'sourceMatrix';
      for (const src of citedSources) {
        const item = document.createElement('li');
        const link = document.createElement('a');
        link.href = src.url;
        link.textContent = `[${src.n}] ${src.name}`;
        link.target = '_blank';
        link.rel = 'noopener';
        item.append(link, document.createTextNode(` — read ${src.read} · cited by ${src.citedBy} of ${state.trophies.length} guides`));
        sources.append(item);
      }
      frag.append(sourceHeading, sources);
    }
  }
  const earnRow = document.createElement('div');
  earnRow.className = 'earnRow';
  const label = document.createElement('label');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = state.earnedSet.has(trophy.id);
  box.addEventListener('change', () => handlers.onToggle(trophy.id, box.checked));
  label.append(box, document.createTextNode(state.earnedSet.has(trophy.id) ? 'Earned — ticked off' : 'Mark as earned'));
  earnRow.append(label);
  frag.append(earnRow);
  return frag;
}

export function renderTrophyDetail(trophy, state, handlers) {
  const panel = document.getElementById('trophyDetail');
  panel.replaceChildren();
  if (!trophy) {
    panel.textContent = 'Select a trophy to see its guide.';
    return;
  }
  panel.append(buildTrophyDetail(trophy, state, handlers));
}

export function renderNextUp(trophies, state) {
  const box = document.getElementById('nextUp');
  box.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = 'Next up';
  const list = document.createElement('ol');
  if (state.earnedSet.size >= trophies.length) {
    const done = document.createElement('p');
    done.className = 'done';
    done.textContent = 'Platinum done — Vice Got a Price! is yours.';
    box.append(heading, done);
    return;
  }
  for (const trophy of nextUpTrophies(trophies, state.earnedSet, 3)) {
    const item = document.createElement('li');
    item.textContent = `${displayName(trophy, state.earnedSet, state.spoilers, state.revealed)} — ${displayDescription(trophy, state.earnedSet, state.spoilers, state.revealed)} (Stage ${trophy.roadmap_stage})`;
    list.append(item);
  }
  box.append(heading, list);
}

function membersList(trophies, stage, state) {
  return trophiesForStage(trophies, stage.stage)
    .map((t) => `${state.earnedSet.has(t.id) ? '✓ ' : '○ '}${displayName(t, state.earnedSet, state.spoilers, state.revealed)}`)
    .join(' · ');
}

export function renderRoadmap(trophies, state) {
  const host = document.getElementById('roadmapStages');
  host.replaceChildren();
  for (const stage of ROADMAP_STAGES) {
    const members = trophiesForStage(trophies, stage.stage);
    const done = members.filter((t) => state.earnedSet.has(t.id)).length;
    const card = document.createElement('div');
    card.className = 'stage';
    const heading = document.createElement('h2');
    heading.textContent = stage.title;
    const hours = document.createElement('span');
    hours.className = 'hours';
    hours.textContent = ` · ${stage.hours}`;
    heading.append(hours);
    const count = document.createElement('p');
    count.className = 'stageCount';
    count.textContent = `${done} of ${members.length} trophies earned in this stage`;
    const blurb = document.createElement('p');
    blurb.textContent = stage.blurb;
    const memberLine = document.createElement('p');
    memberLine.className = 'stageMembers';
    memberLine.textContent = membersList(trophies, stage, state);
    card.append(heading, count, blurb, memberLine);
    host.append(card);
  }
}

export function renderMissableList(trophies, state, handlers) {
  const host = document.getElementById('missableList');
  host.replaceChildren();
  const missable = trophies.filter((t) => t.missable);
  for (const trophy of missable) {
    const temp = document.createElement('article');
    temp.className = 'detail';
    temp.append(buildTrophyDetail(trophy, state, handlers));
    host.append(temp);
  }
}
