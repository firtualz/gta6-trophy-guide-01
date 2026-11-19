# Platinum Atlas — GTA 6 Trophy Guide & Tracker

[![make.fun](https://make.fun/badge/gta6-trophy-guide-01.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![rank](https://make.fun/badge/gta6-trophy-guide-01/firtualz/gta6-trophy-guide-01/rank.svg)](https://make.fun/c/gta6-trophy-guide-01)
[![reward](https://make.fun/badge/gta6-trophy-guide-01/firtualz/gta6-trophy-guide-01/reward.svg)](https://make.fun/c/gta6-trophy-guide-01)

An offline, fan-made guide and tracker for all **55 PlayStation 5 trophies** of Grand Theft Auto VI — built for the [make.fun GTA 6 trophy guide competition](https://make.fun/c/gta6-trophy-guide-01).

## What it is

- **Tracker:** a checklist of all 55 trophies with their official names, descriptions and grades (1 platinum, 2 gold, 6 silver, 46 bronze, 28 hidden). Progress is saved in the browser (localStorage) and can be exported to a file and imported back.
- **Filters & search:** by kind (story, missable, collectibles, activities, online), by grade, by earned state, plus free-text search.
- **Spoiler setting:** hides the names and descriptions of story trophies until they are earned.
- **Roadmap to platinum:** four stages built from the official descriptions — story, side questlines, the 100% completion checklist, cleanup — with hours per stage.
- **Missables:** exactly one trophy is flagged as potentially missable (Positive Mental Attitude, Chapter 1), with the exact moment to catch it.
- **Cited guidance:** every trophy's guide is written in this guide's own words and names its sources beside it — Exophase and PSNProfiles for the official list and counts, PowerPyx for the methods. Anything not yet confirmed by the guide writers is marked as such instead of invented.
- **Offline:** static files only, no build step, no network requests at run time. System fonts only.

## Run it

```sh
node serve.ts
# open http://localhost:8080
```

Requires Node.js 22.18 or later. Open `app/index.html` in any static server with `app/` at its root and it works with the network off.

## Layout

- `app/index.html` — the page
- `app/css/base.css` — the one stylesheet
- `app/js/main.js` — boot and wiring
- `app/js/data.js` — loads the trophy data, roadmap stages
- `app/js/store.js` — localStorage progress, export/import
- `app/js/filters.js` — kind/grade/search/earned filtering, spoiler rule
- `app/js/views.js` — checklist, detail panel, roadmap, missables, Next Up planner
- `app/data/trophies.json` — the 55 official trophies with guides and sources
- `main.ts` — hands the guide in (copies `app/` and `screenshots/` to `/output`, writes `dossier.json`)
- `screenshots/` — 4 real renders of the app

## Sources

Trophy names, descriptions and grades are the official PlayStation list, via [Exophase](https://www.exophase.com/game/grand-theft-auto-vi-psn/trophies/) and [PSNProfiles](https://psnprofiles.com/trophies/43531-grand-theft-auto-vi). Methods come from [PowerPyx — GTA 6 Trophy Guide & Roadmap](https://www.powerpyx.com/gta-6-grand-theft-auto-vi-trophy-guide-roadmap/) and [PlanetGTA6 — GTA 6 Trophies](https://www.planetgta6.com/en/gta-6-trophies/). No Rockstar logo or artwork is used.

## License

MIT — see [LICENSE](LICENSE).
