# DiabetesBuddy

A portfolio prototype merging Dexcom CGM data and OmniPod insulin dosing into
one friendly app concept.

## Contents

- **`app/index.html`** — the DiabetesBuddy prototype UI (self-contained HTML).
  Home, Dexcom, OmniPod and Settings tabs, UK units (mmol/L). All data in this
  version is simulated/hardcoded for demo purposes.
- **`dexcom-integration/`** — a small Node/Express server implementing a real
  Dexcom OAuth 2.0 sandbox integration (live simulated CGM data, not hardcoded).
  See `dexcom-integration/README.md` for setup.

## Status

- ✅ UI prototype — simulated data
- ✅ Dexcom sandbox OAuth integration — real API, simulated sandbox data
- ❌ OmniPod live integration — not possible for a hobby project; see
  `dexcom-integration/README.md` for why (regulatory, not technical)

## Gitignore

`.env` files (containing real Dexcom credentials) are intentionally excluded —
copy `dexcom-integration/.env.example` to `.env` locally and fill in your own.
