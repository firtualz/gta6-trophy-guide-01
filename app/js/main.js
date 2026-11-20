// Boot + wiring: tabs, filters, search, spoiler shield, export/import, detail.
import { loadData } from "./data.js";
import { loadState, saveState, toggleEarned, setCount, exportState, importStateText, isEarned } from "./store.js";
import { applyFilters } from "./filters.js";
import { headerHTML, auditHTML, bannerHTML, tabsHTML, toolbarHTML, trackerHTML, roadmapHTML, missablesHTML } from "./views.js";

const params = new URLSearchParams(location.search);
const state = loadState();
const ui = {
  view: ["tracker", "roadmap", "missables"].includes(params.get("view")) ? params.get("view") : "tracker",
  select: Number(params.get("select")) || 28,
  facet: params.get("facet") || "all",
  grade: params.get("grade") || "all",
  earned: params.get("earned") || "all",
  query: params.get("q") || "",
  spoilers: [0, 1, 2].includes(Number(params.get("spoilers"))) ? Number(params.get("spoilers")) : 0,
  showAllSteps: false,
};

let DATA = null;

function render() {
  document.getElementById("hdr").innerHTML = headerHTML(DATA, state);
  document.getElementById("audit").innerHTML = auditHTML(DATA);
  document.getElementById("banner").innerHTML = bannerHTML(DATA);
  document.getElementById("tabs").innerHTML = tabsHTML(ui);
  const toolbar = document.getElementById("toolbar");
  toolbar.innerHTML = toolbarHTML(DATA, state, ui);
  // The filter toolbar belongs to the tracker; hiding it on the other tabs
  // leaves room for all 7 roadmap stages on one 1280x800 screen.
  toolbar.style.display = ui.view === "tracker" ? "" : "none";
  const main = document.getElementById("main");
  if (ui.view === "roadmap") {
    main.className = "view-roadmap";
    main.innerHTML = roadmapHTML(DATA, state, ui);
  } else if (ui.view === "missables") {
    main.className = "view-missables";
    main.innerHTML = missablesHTML(DATA, state);
  } else {
    main.className = "view-tracker";
    main.innerHTML = trackerHTML(DATA, state, ui, applyFilters(DATA, state, ui));
  }
  const search = document.getElementById("searchBox");
  if (search) {
    search.addEventListener("input", () => { ui.query = search.value; refreshList(); });
  }
  const grade = document.getElementById("gradeSel");
  if (grade) grade.addEventListener("change", () => { ui.grade = grade.value; render(); });
  const earned = document.getElementById("earnedSel");
  if (earned) earned.addEventListener("change", () => { ui.earned = earned.value; render(); });
  const spoil = document.getElementById("spoilerSel");
  if (spoil) spoil.addEventListener("change", () => { ui.spoilers = Number(spoil.value); render(); });
}

// Light refresh for typing: re-render the list column only, keep focus in the box.
function refreshList() {
  const main = document.getElementById("main");
  main.innerHTML = trackerHTML(DATA, state, ui, applyFilters(DATA, state, ui));
  const search = document.getElementById("searchBox");
  if (search) {
    search.focus();
    search.setSelectionRange(search.value.length, search.value.length);
    search.addEventListener("input", () => { ui.query = search.value; refreshList(); });
  }
}

document.addEventListener("click", (ev) => {
  const el = ev.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act;
  const id = Number(el.dataset.id);
  if (act === "tab") { ui.view = el.dataset.view; render(); return; }
  if (act === "facet") { ui.facet = el.dataset.facet; ui.view = "tracker"; render(); return; }
  if (act === "select") { ui.select = id; ui.showAllSteps = false; render(); return; }
  if (act === "show") { ui.select = id; ui.view = "tracker"; ui.showAllSteps = false; render(); return; }
  if (act === "check") {
    ev.preventDefault();
    const t = DATA.trophies.find((x) => x.id === id);
    if (t) toggleEarned(state, t);
    render();
    return;
  }
  if (act === "plus" || act === "minus") {
    ev.stopPropagation();
    const t = DATA.trophies.find((x) => x.id === id);
    if (t) {
      const cur = state.counts[id] || 0;
      setCount(state, t, cur + (act === "plus" ? 1 : -1));
    }
    render();
    return;
  }
  if (act === "steps") { ui.showAllSteps = !ui.showAllSteps; render(); return; }
  if (act === "export") { exportState(state); return; }
  if (act === "import") { document.getElementById("importFile").click(); return; }
});

document.getElementById("importFile").addEventListener("change", async (ev) => {
  const file = ev.target.files && ev.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();
    const next = importStateText(text);
    state.earned = next.earned;
    state.counts = next.counts;
    saveState(state);
    render();
  } catch {
    alert("That file has no Platinum Atlas progress in it.");
  }
  ev.target.value = "";
});

loadData().then((d) => {
  DATA = d;
  if (!DATA.trophies.some((t) => t.id === ui.select)) ui.select = 28;
  render();
}).catch(() => {
  document.getElementById("main").innerHTML = "<p>Could not load trophies.json. Open this app from its own folder (node serve.ts) — it works fully offline.</p>";
});
