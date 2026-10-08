# DiabetesBuddy — now with live Dexcom data

This server now serves the full DiabetesBuddy UI (`public/index.html`) and
performs the real Dexcom OAuth 2.0 authorization-code flow, since the token
exchange needs a client secret that can only ever live server-side.

## What this does

- Serves the actual DiabetesBuddy app — Home, Dexcom, OmniPod, Settings
- Performs the real Dexcom OAuth 2.0 authorization-code flow
- Every time you open the app, the Home and Dexcom tabs fetch **fresh data
  from Dexcom's API** — nothing is hardcoded into the page anymore
- Converts mg/dL → mmol/L to match the UK-style UI
- Refreshes access tokens automatically when they're close to expiring
- OmniPod tab stays simulated — see "Why there's no equivalent for OmniPod" below

**Sandbox caveat:** Dexcom's sandbox serves a fixed simulated dataset, not a
true real-time feed — so you'll get live-fetched data each time you open the
app, but it's the same underlying sandbox history until Dexcom refreshes it.
Swapping to a real production Dexcom account (see below) makes it genuinely
live and changing.

## Setup

1. Register a free developer account and app at [developer.dexcom.com](https://developer.dexcom.com)
   - Set the redirect URI to `http://localhost:3000/callback`
   - This gives you a **Client ID** and **Client Secret**
2. `cp .env.example .env` and fill in your credentials
3. `npm install`
4. `npm start`
5. Open `http://localhost:3000` — you'll see the full app. If not yet
   connected, a banner at the top prompts you to connect; pick any
   `SandboxUser1`–`6` on the consent screen (no password needed in sandbox)
6. Home and Dexcom tabs now populate with real (simulated) glucose data
   pulled live from Dexcom's API every time you load the page

## Moving to production

- Apply for Dexcom's **Limited** or **Full Partner** access tier — sandbox
  only serves fake data
- Swap `sandbox-api.dexcom.com` for `api.dexcom.com` in `server.js`
- Glucose data is PHI under HIPAA — if you ever store it (rather than just
  displaying it live), you need a Business Associate Agreement with every
  service in your storage/hosting chain
- Replace the in-memory token store with a real session store, and encrypt
  tokens at rest

## Why there's no equivalent for OmniPod

Insulet (OmniPod's manufacturer) doesn't offer a public API for controlling
insulin delivery. That's not a gap in this project — it's regulatory. Automated
insulin dosing is a Class II medical device function; Omnipod 5's own dosing
algorithm went through formal FDA clearance. A third-party app that could send
dosing commands to a pod would need to go through the same regulatory process
itself.

Insulet does share *historical* pump data with the open Tidepool platform, so
reading past dose logs is realistic; sending new dose commands from a hobby
project is not, and isn't something to build toward. The OmniPod screens in
the DiabetesBuddy prototype are intentionally simulated for this reason — say
so plainly in your portfolio write-up, it's a stronger signal than pretending
otherwise.
