# FRC 2026 Scouting Template 2 (GitHub Pages)

A lightweight scouting web app for collecting FRC 2026 match data from any phone or laptop.

## Pages

- `index.html` — Home page with navigation options.
- `match-scouting.html` — Main scouting workflow form.
- `view-data.html` — Data viewer page with spreadsheet-style table and CSV preview from saved entries.

## Features

- Event/team/match metadata fields.
- 2026 Rebuilt auto parameters: Auto Start Position, AUTO Shoot Position, AUTO Fuel Scored, AUTO Pass from Neutral Zone, AUTO Climb (L1), AUTO Depot Pickup, AUTO Outpost Pickup, AUTO Neutral Zone Pickup.
- 2026 Rebuilt teleop parameters: TELE Shoot Position, TELE Fuel Scored, TELE Pass from Neutral Zone, TELE Pass from Opponent Zone, TELE Depot Pickup, TELE Outpost Pickup, TELE Floor Pickup.
- Endgame climb levels: L1, L2, L3.
- Quick Fuel Counter section with +1/+3/+5 buttons, editable Fuel Scored total, and a red -1 adjustment button.
- Summary section currently shown as placeholder (contribution calculation temporarily disabled).
- Local storage entry saving.
- CSV export for spreadsheet analysis.
- View Data page for reviewing saved entries as a table and CSV preview.

## Run locally

```bash
python3 -m http.server 8000
```

Then open: `http://localhost:8000`

## Deploy on GitHub Pages

Because this repo is a user site (`<username>.github.io`), pushing to `main` publishes this static site automatically.

If you do not see updates on the live site:

1. Confirm GitHub Pages is configured to deploy from the `main` branch.
2. Hard-refresh the page (`Ctrl+Shift+R` / `Cmd+Shift+R`).
3. Wait 1-2 minutes for GitHub Pages to finish publishing.
