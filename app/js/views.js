// Views: pure HTML strings from data + state. No network, no framework.
import { audit, claimsBySource, fmt, pointsOf, sourceName, sourceById } from "./data.js";
import { earnedCount, earnedPoints, isEarned, countOf } from "./store.js";
import { FACETS, facetCount, spoilerHidden } from "./filters.js";

export function esc(s) {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function gradeBadge(t) {
  return `<span class="badge g-${t.grade}">${t.grade[0].toUpperCase()} · ${pointsOf(t)} pts</span>`;
}

function trophyName(t, state, ui) {
  if (spoilerHidden(t, state, ui.spoilers)) return `<span class="spoiled">Hidden trophy — earn it to reveal</span>`;
  return esc(t.name);
}

function trophyDesc(t, state, ui) {
  if (spoilerHidden(t, state, ui.spoilers)) return "Name and description hidden by the spoiler shield.";
  return esc(t.description);
}

export function headerHTML(data, state) {
  const n = earnedCount(state, data.trophies);
  const pts = earnedPoints(state, data.trophies);
  const g = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of data.trophies) if (isEarned(state, t)) g[t.grade]++;
  const pct = Math.round((n / data.trophies.length) * 100);
  return `<div class="h-left"><h1>Platinum Atlas</h1>
  <p class="sub">55 trophies · 1 platinum · 2 gold · 6 silver · 46 bronze · 28 hidden · 0 online · ~200 h to platinum</p></div>
  <div class="h-right"><div class="prog-num">${n}<span>/55</span></div>
  <div class="prog-mid"><div class="bar"><i style="width:${pct}%"></i></div>
  <div class="prog-sub">P ${g.platinum} · G ${g.gold} · S ${g.silver} · B ${g.bronze} &nbsp;·&nbsp; ${fmt(pts)} / 1,230 PSN pts</div></div></div>`;
}

export function auditHTML(data) {
  const a = audit(data);
  return `<strong>AUDIT</strong> · 55 official trophies · ${a.grades.platinum}P ${a.grades.gold}G ${a.grades.silver}S ${a.grades.bronze}B · ${a.hidden} hidden · ` +
    `${a.cited}/${a.steps} steps cited · ${a.twoPlus} with 2+ sources · ${a.sourcesCited} sources cited of ${a.sourcesRead} read (${a.readDate}) · ` +
    `${a.missable} missable · ${a.unconfirmed} unconfirmed · every claim cited — nothing invented.`;
}

export function bannerHTML(data) {
  const m = data.trophies.find((t) => t.missable);
  if (!m) return "";
  return `<span class="warn-dot">!</span><strong>MISSABLE — ${esc(m.name)}:</strong>&nbsp;meditate on Lucia&rsquo;s balcony at Jason&rsquo;s house in Chapter 1, before the chapter ends. ` +
    `There is no mission replay, so keep a manual Chapter 1 save. <button class="btn small" data-act="show" data-id="${m.id}">Show it</button>`;
}

export function tabsHTML(ui) {
  const tabs = [["tracker", "Tracker"], ["roadmap", "Roadmap to Platinum"], ["missables", "Missables"]];
  return tabs.map(([k, label]) => `<button class="tab${ui.view === k ? " on" : ""}" data-act="tab" data-view="${k}">${label}</button>`).join("");
}

export function toolbarHTML(data, state, ui) {
  const chips = FACETS.map((f) => {
    const n = facetCount(data, state, f);
    return `<button class="chip${ui.facet === f.key ? " on" : ""}" data-act="facet" data-facet="${f.key}">${f.label} <b>${n}</b></button>`;
  }).join("");
  return `<div class="chips">${chips}</div>
  <div class="tools">
    <select id="gradeSel" aria-label="Grade"><option value="all">All grades</option>
      <option value="platinum"${ui.grade === "platinum" ? " selected" : ""}>Platinum</option>
      <option value="gold"${ui.grade === "gold" ? " selected" : ""}>Gold</option>
      <option value="silver"${ui.grade === "silver" ? " selected" : ""}>Silver</option>
      <option value="bronze"${ui.grade === "bronze" ? " selected" : ""}>Bronze</option></select>
    <select id="earnedSel" aria-label="Earned"><option value="all">All trophies</option>
      <option value="earned"${ui.earned === "earned" ? " selected" : ""}>Earned only</option>
      <option value="todo"${ui.earned === "todo" ? " selected" : ""}>To-do only</option></select>
    <select id="spoilerSel" aria-label="Spoiler shield">
      <option value="0"${ui.spoilers === 0 ? " selected" : ""}>Spoilers: show all</option>
      <option value="1"${ui.spoilers === 1 ? " selected" : ""}>Spoilers: hide story names</option>
      <option value="2"${ui.spoilers === 2 ? " selected" : ""}>Spoilers: hide all spoilers</option></select>
    <input id="searchBox" type="search" placeholder="Search name, description, guide, steps…" value="${esc(ui.query)}">
    <button class="btn" data-act="export">Export progress</button>
    <button class="btn" data-act="import">Import progress</button>
  </div>`;
}

function countWidget(t, state) {
  if (!t.count) return "";
  const n = countOf(state, t);
  return `<span class="counter"><button data-act="minus" data-id="${t.id}" aria-label="decrease">−</button><b>${fmt(n)}/${fmt(t.count)}</b><button data-act="plus" data-id="${t.id}" aria-label="increase">+</button></span>`;
}

function trophyRow(t, state, ui, selected) {
  const earned = isEarned(state, t);
  return `<div class="row${earned ? " earned" : ""}${selected === t.id ? " sel" : ""}" data-act="select" data-id="${t.id}">
    <input type="checkbox" ${earned ? "checked" : ""} data-act="check" data-id="${t.id}" tabindex="-1">
    <span class="r-name">${trophyName(t, state, ui)}</span>
    <span class="r-desc">${trophyDesc(t, state, ui)}</span>
    ${gradeBadge(t)}${t.hidden ? `<span class="tag">hidden</span>` : ""}${t.missable ? `<span class="tag miss">MISSABLE</span>` : ""}${t.unconfirmed ? `<span class="tag unc">unconfirmed</span>` : ""}
    ${countWidget(t, state)}</div>`;
}

export function trackerHTML(data, state, ui, filtered) {
  const stages = data.roadmap;
  let list = "";
  for (const st of stages) {
    const items = filtered.filter((t) => t.stage === st.stage);
    if (!items.length) continue;
    const got = items.filter((t) => isEarned(state, t)).length;
    list += `<div class="stage-h">${esc(st.title)} <span>${got}/${items.length} earned</span></div>` +
      items.map((t) => trophyRow(t, state, ui, ui.select)).join("");
  }
  if (!list) list = `<div class="empty">No trophies match this filter. <b>Online: 0</b> — all 55 trophies are offline single-player, so the Online filter is honestly empty.</div>`;
  const sel = data.trophies.find((t) => t.id === ui.select) || data.trophies[0];
  return `<section class="list-col"><div class="list">${list}</div></section>
  <section class="detail-col">${detailHTML(data, state, ui, sel)}</section>
  <aside class="rail-col">${nextUpHTML(data, state, ui)}${sourcesHTML(data)}</aside>`;
}

function stepCites(s) {
  return (s.s || []).map((id) => `<span class="cite">${esc(sourceName(id))}</span>`).join("");
}

export function detailHTML(data, state, ui, t) {
  if (!t) return `<div class="panel"><p>Pick a trophy to see its guide.</p></div>`;
  const steps = t.steps || [];
  const hidden = spoilerHidden(t, state, ui.spoilers);
  const showAll = ui.showAllSteps;
  const shown = showAll ? steps : steps.slice(0, 5);
  const usedIds = [...new Set(steps.flatMap((s) => s.s || []))];
  const sourcesLine = usedIds.map((id) => {
    const s = sourceById(id);
    return s ? `<a href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.name)}</a>` : esc(id);
  }).join(" · ");
  const guideBlock = hidden
    ? `<div class="flag disp">Guide hidden by the spoiler shield — earn this trophy to reveal its steps.</div>`
    : `<h3>Guide — ${steps.length} steps</h3>
    <ol class="steps">${shown.map((s) => `<li>${esc(s.t)} ${stepCites(s)}</li>`).join("")}</ol>
    ${steps.length > 5 ? `<button class="btn small" data-act="steps">${showAll ? "Show fewer steps" : `Show all ${steps.length} steps`}</button>` : ""}
    <div class="guide-line"><strong>Guide:</strong> ${esc(t.guide)}</div>`;
  let flags = "";
  if (t.missable) flags += `<div class="flag miss">MISSABLE — do the Chapter 1 meditation before the chapter ends. No mission replay: keep a manual Chapter 1 save.</div>`;
  if (t.unconfirmed) flags += `<div class="flag unc">UNCONFIRMED — the guides list this method as not yet verified. It is unconfirmed, not missable: nothing here can lock you out.</div>`;
  if ((t.facets || []).includes("disputed")) flags += `<div class="flag disp">DISPUTED — guides disagree on this one. See the Missables tab for both versions and our call.</div>`;
  return `<div class="panel detail">
    <h2>${trophyName(t, state, ui)}</h2>
    <p class="desc">${trophyDesc(t, state, ui)}</p>
    <div class="badges">${gradeBadge(t)}${t.hidden ? `<span class="tag">hidden</span>` : ""}${t.missable ? `<span class="tag miss">MISSABLE</span>` : ""}${t.unconfirmed ? `<span class="tag unc">unconfirmed</span>` : ""}<span class="tag">${esc(t.kind)}</span><span class="tag">Stage ${t.stage}</span></div>
    <div class="meta">Target: ${t.count ? fmt(t.count) + " — " : ""}${pointsOf(t)} PSN pts · ${esc((data.roadmap.find((r) => r.stage === t.stage) || {}).title || "")}</div>
    ${t.count ? `<div class="counter-line">Progress ${countWidget(t, state)}</div>` : ""}
    ${guideBlock}
    <div class="sources"><strong>Sources:</strong> ${sourcesLine}</div>
    ${flags}</div>`;
}

export function nextUpHTML(data, state, ui) {
  const order = [...data.trophies].sort((a, b) => a.stage - b.stage || a.id - b.id);
  const next = order.filter((t) => !isEarned(state, t)).slice(0, 6);
  const items = next.map((t, i) => {
    const nm = spoilerHidden(t, state, ui.spoilers) ? "Hidden trophy" : `#${t.id} ${esc(t.name)}`;
    return `<li><span class="n">${i + 1}</span><span><b>${nm}</b><small>Stage ${t.stage} · ${esc(t.grade)}</small></span></li>`;
  }).join("");
  return `<div class="panel"><h3>NEXT UP · ROADMAP ORDER</h3><ol class="nextup">${items || "<li>All 55 earned — platinum is yours.</li>"}</ol></div>`;
}

export function sourcesHTML(data) {
  const rows = claimsBySource(data);
  const top = rows.slice(0, 8);
  const a = audit(data);
  return `<div class="panel"><h3>SOURCES · ${a.cited} CLAIMS</h3>
  <ul class="srclist">${top.map((r) => `<li><span>${esc(r.name)}</span><b>${r.n}</b></li>`).join("")}</ul>
  <div class="src-foot">${rows.length} sources cited of ${a.sourcesRead} read (${a.readDate})${rows.length > 8 ? ` · +${rows.length - 8} more` : ""}</div></div>`;
}

export function roadmapHTML(data, state, ui) {
  const cards = data.roadmap.map((st) => {
    const items = data.trophies.filter((t) => t.stage === st.stage);
    const got = items.filter((t) => isEarned(state, t)).length;
    const shown = items.slice(0, 12);
    const names = shown.map((t) => {
      const mark = isEarned(state, t) ? "✓" : "○";
      const nm = spoilerHidden(t, state, ui.spoilers) ? "Hidden trophy" : esc(t.name);
      return `<span class="${isEarned(state, t) ? "done" : ""}">${mark} ${nm}</span>`;
    }).join(" · ");
    const more = items.length > 12 ? ` <span>… +${items.length - 12} more in the Tracker</span>` : "";
    const points = (st.points || []).map((p) => `<div class="ponr">⚠ POINT OF NO RETURN — ${esc(p)}</div>`).join("");
    return `<article class="stage-card"><h3>Stage ${st.stage} — ${esc(st.title)}</h3>
    <div class="sc-meta">${esc(st.hours)} · ${got}/${items.length} earned</div>
    <p>${esc(st.text)}</p>${points}<div class="sc-names">${names}${more}</div></article>`;
  }).join("");
  return `<section class="roadmap-intro"><p><strong>Difficulty 4/10 · ~200 hours to platinum · 60–80 hours of story in 5 chapters.</strong>
  Cheats disable trophies and saving, so keep them off for the whole run. There is no mission replay: save manually at the start and end of every chapter,
  and keep a separate Chapter 1 save for the one missable trophy. Finish the story first (Stages 1–5), then the 100% checklist (Stage 6, ~100 hours),
  then Strangers &amp; Freaks and cleanup (Stage 7, ~10 hours). One playthrough is enough — no online trophies, no New Game+.</p></section>
  <section class="stage-grid">${cards}</section>`;
}

export function missablesHTML(data, state) {
  const m = data.trophies.find((t) => t.missable);
  const chapters = data.roadmap.slice(0, 5).map((st) => {
    const items = data.trophies.filter((t) => t.stage === st.stage);
    const miss = items.filter((t) => t.missable);
    return `<article class="ch-card"><h3>${esc(st.title)}</h3><div class="sc-meta">${items.length} trophies</div>
    ${miss.length ? `<p class="miss-line">MISSABLE: <b>${esc(miss[0].name)}</b> — ${esc(miss[0].guide)}</p>` : `<p>No missable trophy in this chapter. Story trophies pop as you play; nothing here can lock you out.</p>`}</article>`;
  }).join("");
  const disputes = data.disputes.map((d) => `<article class="disp-card"><h3>${esc(d.title)}</h3>
    <p><b>A — ${esc(sourceName(d.aSource))}:</b> ${esc(d.a)}</p>
    <p><b>B — ${esc(sourceName(d.bSource))}:</b> ${esc(d.b)}</p>
    <p class="call"><b>Our call:</b> ${esc(d.call)}</p></article>`).join("");
  const unc = data.trophies.filter((t) => t.unconfirmed).map((t) =>
    `<li><b>#${t.id} ${esc(t.name)}</b> — ${esc(t.description)} <span class="tag unc">unconfirmed</span><br><small>${esc(t.guide)}</small></li>`).join("");
  return `<section class="miss-grid">${chapters}
    <article class="ch-card"><h3>Stages 6–7 — Checklist &amp; cleanup</h3><div class="sc-meta">42 trophies</div>
    <p>No missable trophy here. The 100% checklist and Strangers &amp; Freaks can all be finished in free-roam after the story.</p></article></section>
  <h2 class="sec-h">Where the guides disagree</h2><section class="disp-grid">${disputes}</section>
  <h2 class="sec-h">Unconfirmed methods — not missable</h2>
  <p class="note">Five trophies are still unsolved in the published guides. Their methods are unconfirmed, which is not the same as missable: none of them can lock you out of the platinum.</p>
  <ul class="unc-list">${unc}</ul>`;
}
