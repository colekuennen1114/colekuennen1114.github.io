# FRC 2026 Scouting Template (GitHub Pages)

A lightweight scouting web app for collecting FRC 2026 match data from any phone or laptop.

## Pages

- `index.html` — Home page with navigation options:
  - **Match Scouting** (active)
  - **View Data** (placeholder, coming soon)
- `match-scouting.html` — Main scouting workflow form.

## Features

- Event/team/match metadata fields.
- Auto, teleop, and endgame performance tracking.
- Simple estimated point contribution preview.
- Local storage entry saving.
- CSV export for spreadsheet analysis.

## Run locally

```bash
python3 -m http.server 8000
```

Then open: `http://localhost:8000`

## Deploy on GitHub Pages

Because this repo is a user site (`<username>.github.io`), pushing to `main` publishes this static site automatically.
