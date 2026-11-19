// Views: the checklist, the trophy detail panel, the roadmap, the missables page,
// the Next Up planner and the progress header. All DOM building, no network.
import { ROADMAP_STAGES, trophiesForStage, countByGrade } from './data.js';
import { displayName, displayDescription, nextUpTrophies } from './filters.js';

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
}

export function renderTrophyList(trophies, shown, state, onSelect, onToggle) {
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
  for (const trophy of shown) {
    const item = document.createElement('li');
    if (trophy.id === state.selectedId) item.classList.add('selected');
    if (state.earnedSet.has(trophy.id)) item.classList.add('earned');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = state.earnedSet.has(trophy.id);
    box.setAttribute('aria-label', `Mark ${trophy.name} as earned`);
    box.addEventListener('click', (event) => {
      event.stopPropagation();
      onToggle(trophy.id, box.checked);
    });
    const body = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'trophyName';
    name.textContent = displayName(trophy, state.earnedSet, state.spoilers);
    const desc = document.createElement('div');
    desc.className = 'trophyDesc';
    desc.textContent = displayDescription(trophy, state.earnedSet, state.spoilers);
    const meta = document.createElement('div');
    meta.className = 'trophyMeta';
    meta.append(gradeChip(trophy.grade));
    if (trophy.hidden) meta.append(tagChip('hidden', 'hidden'));
    if (trophy.missable) meta.append(tagChip('MISSABLE', 'missable'));
    if (trophy.count) meta.append(tagChip(`0/${trophy.count}`, 'count'));
    meta.append(tagChip(trophy.kind, ''));
    body.append(name, desc, meta);
    item.append(box, body);
    item.addEventListener('click', () => onSelect(trophy.id));
    list.append(item);
  }
}

export function renderTrophyDetail(trophy, earned, spoilersOn, onToggle) {
  const panel = document.getElementById('trophyDetail');
  panel.replaceChildren();
  if (!trophy) {
    panel.textContent = 'Select a trophy to see its guide.';
    return;
  }
  const title = document.createElement('h2');
  title.textContent = displayName(trophy, earned, spoilersOn);
  const official = document.createElement('p');
  official.className = 'official';
  official.textContent = displayDescription(trophy, earned, spoilersOn);
  const meta = document.createElement('div');
  meta.className = 'trophyMeta';
  meta.append(gradeChip(trophy.grade));
  if (trophy.hidden) meta.append(tagChip('hidden on PlayStation until earned', 'hidden'));
  if (trophy.missable) meta.append(tagChip('MISSABLE — do it in Chapter 1', 'missable'));
  if (trophy.count) meta.append(tagChip(`PSN target: ${trophy.count}`, 'count'));
  meta.append(tagChip(`kind: ${trophy.kind}`, ''));
  meta.append(tagChip(`roadmap stage ${trophy.roadmap_stage}`, ''));
  const guideHeading = document.createElement('h3');
  guideHeading.textContent = 'Guide';
  const guide = document.createElement('p');
  guide.className = 'guideText';
  guide.textContent = trophy.guide;
  const sourceHeading = document.createElement('h3');
  sourceHeading.textContent = 'Sources';
  const sources = document.createElement('ul');
  sources.className = 'sources';
  for (const source of trophy.sources) {
    const item = document.createElement('li');
    const link = document.createElement('a');
    link.href = source.url;
    link.textContent = source.name;
    link.target = '_blank';
    link.rel = 'noopener';
    item.append(link);
    sources.append(item);
  }
  const earnRow = document.createElement('div');
  earnRow.className = 'earnRow';
  const label = document.createElement('label');
  const box = document.createElement('input');
  box.type = 'checkbox';
  box.checked = earned.has(trophy.id);
  box.addEventListener('change', () => onToggle(trophy.id, box.checked));
  label.append(box, document.createTextNode(earned.has(trophy.id) ? 'Earned — ticked off' : 'Mark as earned'));
  earnRow.append(label);
  panel.append(title, official, meta, sourceHeading, sources, guideHeading, guide, earnRow);
}

export function renderNextUp(trophies, earned) {
  const box = document.getElementById('nextUp');
  box.replaceChildren();
  const heading = document.createElement('h2');
  heading.textContent = 'Next up';
  const list = document.createElement('ol');
  if (earned.size >= trophies.length) {
    const done = document.createElement('p');
    done.className = 'done';
    done.textContent = 'Platinum done — Vice Got a Price! is yours.';
    box.append(heading, done);
    return;
  }
  for (const trophy of nextUpTrophies(trophies, earned, 3)) {
    const item = document.createElement('li');
    item.textContent = `${trophy.name} — ${trophy.description} (Stage ${trophy.roadmap_stage})`;
    list.append(item);
  }
  box.append(heading, list);
}

function membersList(trophies, stage, earned) {
  return trophiesForStage(trophies, stage.stage)
    .map((t) => `${earned.has(t.id) ? '✓ ' : '○ '}${t.name}`)
    .join(' · ');
}

export function renderRoadmap(trophies, earned) {
  const host = document.getElementById('roadmapStages');
  host.replaceChildren();
  for (const stage of ROADMAP_STAGES) {
    const members = trophiesForStage(trophies, stage.stage);
    const done = members.filter((t) => earned.has(t.id)).length;
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
    memberLine.textContent = membersList(trophies, stage, earned);
    card.append(heading, count, blurb, memberLine);
    host.append(card);
  }
}

export function renderMissableList(trophies, earned, onToggle) {
  const host = document.getElementById('missableList');
  host.replaceChildren();
  const missable = trophies.filter((t) => t.missable);
  for (const trophy of missable) {
    const temp = document.createElement('article');
    temp.className = 'detail';
    host.append(temp);
    const title = document.createElement('h2');
    title.textContent = trophy.name;
    const official = document.createElement('p');
    official.className = 'official';
    official.textContent = trophy.description;
    const guide = document.createElement('p');
    guide.className = 'guideText';
    guide.textContent = trophy.guide;
    const sourceHeading = document.createElement('h3');
    sourceHeading.textContent = 'Sources';
    const sources = document.createElement('ul');
    sources.className = 'sources';
    for (const source of trophy.sources) {
      const item = document.createElement('li');
      const link = document.createElement('a');
      link.href = source.url;
      link.textContent = source.name;
      link.target = '_blank';
      link.rel = 'noopener';
      item.append(link);
      sources.append(item);
    }
    const earnRow = document.createElement('div');
    earnRow.className = 'earnRow';
    const label = document.createElement('label');
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.checked = earned.has(trophy.id);
    box.addEventListener('change', () => onToggle(trophy.id, box.checked));
    label.append(box, document.createTextNode(earned.has(trophy.id) ? 'Earned — ticked off' : 'Mark as earned'));
    earnRow.append(label);
    temp.append(title, official, sourceHeading, sources, guide, earnRow);
  }
}
