# DiabetesBuddy

A portfolio prototype merging Dexcom CGM data and OmniPod insulin dosing into
one friendly app concept.

## Contents

- **`app/index.html`** — standalone offline demo. Open it directly in a
  browser, zero setup. All data (including the Dexcom tab) is hardcoded —
  useful for a quick look, screenshots, or anywhere Node isn't available.
- **`dexcom-integration/`** — the real app. A Node/Express server that serves
  the same UI but with Home and Dexcom tabs pulling **live data from Dexcom's
  API** on every page load, via a proper OAuth 2.0 flow. See
  `dexcom-integration/README.md` for setup. **This is the version to run** if
  you want to see live glucose data rather than fixed numbers.

## Status

- ✅ UI prototype
- ✅ Dexcom integration — real OAuth 2.0, live-fetched sandbox data (not hardcoded)
- ❌ OmniPod live integration — not possible for a hobby project; see
  `dexcom-integration/README.md` for why (regulatory, not technical)

## Gitignore

`.env` files (containing real Dexcom credentials) are intentionally excluded —
copy `dexcom-integration/.env.example` to `.env` locally and fill in your own.
