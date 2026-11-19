// Boot: wires the toolbar, the view tabs, the checklist and the detail panel.
// URL parameters let screenshots open a fixed state: ?view=tracker|roadmap|missables,
// ?spoilers=on|off, ?select=<trophy id>.
import { loadTrophyData, trophyById } from './data.js';
import { loadEarned, saveEarned, loadSpoilers, saveSpoilers, exportProgress, importProgress } from './store.js';
import { filterTrophies } from './filters.js';
import { renderProgress, renderTrophyList, renderTrophyDetail, renderNextUp, renderRoadmap, renderMissableList } from './views.js';

const state = {
  trophies: [],
  earnedSet: new Set(),
  kind: 'all',
  grade: 'all',
  earned: 'all',
  search: '',
  spoilers: false,
  view: 'tracker',
  selectedId: 28,
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
  renderTrophyList(state.trophies, shownTrophies(), state, selectTrophy, toggleEarned);
  renderTrophyDetail(trophyById(state.trophies, state.selectedId), state.earnedSet, state.spoilers, toggleEarned);
  renderNextUp(state.trophies, state.earnedSet);
  renderRoadmap(state.trophies, state.earnedSet);
  renderMissableList(state.trophies, state.earnedSet, toggleEarned);
}

function selectTrophy(id) {
  state.selectedId = id;
  renderTrophyList(state.trophies, shownTrophies(), state, selectTrophy, toggleEarned);
  renderTrophyDetail(trophyById(state.trophies, id), state.earnedSet, state.spoilers, toggleEarned);
}

function toggleEarned(id, checked) {
  if (checked) state.earnedSet.add(id);
  else state.earnedSet.delete(id);
  saveEarned(state.earnedSet);
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

function wireToolbar() {
  document.getElementById('search').addEventListener('input', (event) => {
    state.search = event.target.value;
    renderTrophyList(state.trophies, shownTrophies(), state, selectTrophy, toggleEarned);
  });
  for (const button of document.querySelectorAll('#kindFilters button')) {
    button.addEventListener('click', () => {
      state.kind = button.dataset.kind;
      for (const other of document.querySelectorAll('#kindFilters button')) {
        other.classList.toggle('active', other === button);
      }
      renderTrophyList(state.trophies, shownTrophies(), state, selectTrophy, toggleEarned);
    });
  }
  document.getElementById('gradeFilter').addEventListener('change', (event) => {
    state.grade = event.target.value;
    renderTrophyList(state.trophies, shownTrophies(), state, selectTrophy, toggleEarned);
  });
  document.getElementById('earnedFilter').addEventListener('change', (event) => {
    state.earned = event.target.value;
    renderTrophyList(state.trophies, shownTrophies(), state, selectTrophy, toggleEarned);
  });
  const spoilerToggle = document.getElementById('spoilerToggle');
  spoilerToggle.checked = state.spoilers;
  spoilerToggle.addEventListener('change', () => {
    state.spoilers = spoilerToggle.checked;
    saveSpoilers(state.spoilers);
    renderAll();
  });
  document.getElementById('exportBtn').addEventListener('click', () => {
    exportProgress(state.earnedSet);
  });
  document.getElementById('importFile').addEventListener('change', async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      state.earnedSet = importProgress(await file.text(), state.trophies);
      saveEarned(state.earnedSet);
      renderAll();
    } catch {
      alert('That file is not a Platinum Atlas progress export.');
    }
    event.target.value = '';
  });
  for (const button of document.querySelectorAll('#viewTabs button')) {
    button.addEventListener('click', () => setView(button.dataset.view));
  }
}

export async function bootGuide() {
  state.trophies = await loadTrophyData();
  state.earnedSet = loadEarned();
  state.spoilers = loadSpoilers();
  readParams();
  wireToolbar();
  setView(state.view);
  renderAll();
}

bootGuide();
