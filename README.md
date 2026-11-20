# Platinum Atlas — GTA 6 Trophy Guide & Tracker

A static, fully offline trophy guide and tracker for Grand Theft Auto VI (PlayStation 5): all 55 official
trophies — 1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden, 0 online — with a numbered, cited guide for
every trophy, a 7-stage roadmap to the platinum, a missables view, and a tracker that saves progress in the
browser.

## What is inside

- **410 cited steps** across the 55 guides. Every step carries its sources, and every step is backed by
  at least 2 sources. 21 guides cited, 26 read on 2026-11-21 (PowerPyx, GameMapa, sixshore, GTASpotter,
  GTA Zone, Exophase, Beebom, KeenGamer, AlcastHQ, TechWiser, EGamers, Insider Gaming, games.gg, GameTrek,
  CryptoGames, GTADB and the PowerPyx meditation / walkthrough / Strangers & Freaks pages).
- **1 missable trophy** — Positive Mental Attitude (meditate at every spot; the Chapter 1 meditation on
  Lucia's balcony disappears after Chapter 1). There is no mission replay, so the guide tells you to keep a
  manual Chapter 1 save.
- **5 unconfirmed trophies** (still unsolved in the published guides) — marked UNCONFIRMED, kept separate
  from the missable. Unconfirmed is not missable.
- **5 disputes** where the guides genuinely disagree (platinum time, hidden count, whether the Chapter 1
  meditation counts, whether Race Against Yago counts toward Strangers & Freaks, the final mission's
  chapter) — each shown with both versions and an "Our call".
- **7-stage roadmap** following the real chapter structure (Chapters 1–5, then the 100% checklist, then
  Strangers & Freaks + cleanup), with a point of no return marked on every stage.
- **Tracker**: 16 filter chips with live counts (Story, Missable, Collectibles, Activities, Crime, Strands
  & side chains, Money, Feats, Disputed, PSN-hidden, Riddles, Misc, Completion, Online, To-do, All),
  grade and earned filters, search across names, descriptions, guides and steps, a 3-mode spoiler shield
  (show all / hide story names / hide all spoilers), count widgets (e.g. − 9/18 +) on counted trophies,
  and Export / Import progress as JSON. Progress lives in one localStorage key.
- **NEXT UP · ROADMAP ORDER** panel (the next unearned trophies in roadmap order) and a **SOURCES** panel
  (claims per source, computed from the data) on the tracker cover.

## Honesty notes

- Step counts and source counts in the audit strip are computed from `app/data/trophies.json` at runtime;
  nothing is hardcoded.
- Where the guides disagree or a method is not yet verified, the guide says so instead of guessing.
- No step, location or method was invented: every step is traceable to at least two published guides.

## Run it

```sh
node serve.ts        # http://localhost:8080 — works with the network off
```

## Hand it in

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

`main.ts` copies `app/` and `screenshots/` to the output directory and writes `dossier.json` with the
vendored make.fun library (`vendor/makefun-frontend.ts`, unchanged).
