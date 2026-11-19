// Boot: wires the toolbar, the view tabs, the checklist and the detail panel.
// URL parameters let screenshots open a fixed state: ?view=tracker|roadmap|missables,
// ?spoilers=on|off, ?select=<trophy id>.
import { loadTrophyData, loadSources, trophyById } from './data.js';
import { loadEarned, saveEarned, loadSpoilers, saveSpoilers, loadCounts, saveCounts, loadRevealed, saveRevealed, exportProgress, importProgress } from './store.js';
import { filterTrophies } from './filters.js';
import { renderProgress, renderAudit, renderFilterCounts, renderTrophyList, renderTrophyDetail, renderNextUp, renderRoadmap, renderMissableList } from './views.js';

const state = {
  trophies: [],
  sources: [],
  earnedSet: new Set(),
  counts: {},
  revealed: new Set(),
  kind: 'all',
  grade: 'all',
  earned: 'all',
  search: '',
  spoilers: false,
  view: 'tracker',
  selectedId: 28,
};

// One handlers object, passed to every view that needs to change state.
const handlers = {
  onSelect: selectTrophy,
  onToggle: toggleEarned,
  onCount: changeCount,
  onReveal: revealTrophy,
};

function readParams() {
  const params = new URLSearchParams(window.location.search);
  const view = params.get('view');
  if (view === 'roadmap' || view === 'missables' || view === 'tracker') state.view = view;
  const spoilers = params.get('spoilers');
  if (spoilers === 'on') state.spoilers = true;
  if (spoilers === 'off') state.spoilers = false;
  const select = Number(params.get('select'));
  if (Number.isInteger(select) && trophyById(state.trophies, select)) state.selectedId = select;
}

function shownTrophies() {
  return filterTrophies(state.trophies, {
    kind: state.kind,
    grade: state.grade,
    earned: state.earned,
    search: state.search,
    earnedSet: state.earnedSet,
  });
}

function renderAll() {
  renderProgress(state.trophies, state.earnedSet);
  renderTrophyList(state.trophies, shownTrophies(), state, handlers);
  renderTrophyDetail(trophyById(state.trophies, state.selectedId), state, handlers);
  renderNextUp(state.trophies, state);
  renderRoadmap(state.trophies, state);
  renderMissableList(state.trophies, state, handlers);
}

function selectTrophy(id) {
  state.selectedId = id;
  renderTrophyList(state.trophies, shownTrophies(), state, handlers);
  renderTrophyDetail(trophyById(state.trophies, id), state, handlers);
}

function toggleEarned(id, checked) {
  if (checked) state.earnedSet.add(id);
  else state.earnedSet.delete(id);
  saveEarned(state.earnedSet);
  renderAll();
}

function changeCount(id, delta) {
  const trophy = trophyById(state.trophies, id);
  if (!trophy || !trophy.count) return;
  const next = Math.max(0, Math.min(trophy.count, (state.counts[id] || 0) + delta));
  if (next === 0) delete state.counts[id];
  else state.counts[id] = next;
  saveCounts(state.counts);
  renderAll();
}

function revealTrophy(id) {
  state.revealed.add(id);
  saveRevealed(state.revealed);
  renderAll();
}

function setView(view) {
  state.view = view;
  document.getElementById('trackerView').hidden = view !== 'tracker';
  document.getElementById('roadmapView').hidden = view !== 'roadmap';
  document.getElementById('missablesView').hidden = view !== 'missables';
  for (const button of document.querySelectorAll('#viewTabs button')) {
    button.classList.toggle('active', button.dataset.view === view);
  }
  document.getElementById('toolbar').style.display = view === 'tracker' ? '' : 'none';
}

function renderList() {
  renderTrophyList(state.trophies, shownTrophies(), state, handlers);
}

function wireToolbar() {
  document.getElementById('search').addEventListener('input', (event) => {
    state.search = event.target.value;
    renderList();
  });
  for (const button of document.querySelectorAll('#kindFilters button')) {
    button.addEventListener('click', () => {
      state.kind = button.dataset.kind;
      for (const other of document.querySelectorAll('#kindFilters button')) {
        other.classList.toggle('active', other === button);
      }
      renderList();
    });
  }
  document.getElementById('gradeFilter').addEventListener('change', (event) => {
    state.grade = event.target.value;
    renderList();
  });
  document.getElementById('earnedFilter').addEventListener('change', (event) => {
    state.earned = event.target.value;
    renderList();
  });
  const spoilerToggle = document.getElementById('spoilerToggle');
  spoilerToggle.checked = state.spoilers;
  spoilerToggle.addEventListener('change', () => {
    state.spoilers = spoilerToggle.checked;
    saveSpoilers(state.spoilers);
    renderAll();
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    exportProgress(state.earnedSet, state.counts);
  });
  document.getElementById('importFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      const imported = importProgress(await file.text(), state.trophies);
      state.earnedSet = imported.earned;
      state.counts = imported.counts;
      saveEarned(state.earnedSet);
      saveCounts(state.counts);
      renderAll();
    } catch {
      alert('That file is not a Platinum Atlas progress export.');
    }
    event.target.value = '';
  });
  document.getElementById('showMissableBtn').addEventListener('click', () => {
    selectTrophy(28);
  });
  for (const button of document.querySelectorAll('#viewTabs button')) {
    button.addEventListener('click', () => setView(button.dataset.view));
  }
}

export async function bootGuide() {
  state.trophies = await loadTrophyData();
  state.sources = await loadSources();
  state.earnedSet = loadEarned();
  state.counts = loadCounts();
  state.revealed = loadRevealed();
  state.spoilers = loadSpoilers();
  readParams();
  wireToolbar();
  setView(state.view);
  renderAudit(state.trophies, state.sources);
  renderFilterCounts(state.trophies);
  renderAll();
}

bootGuide();
