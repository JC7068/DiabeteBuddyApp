// DiabetesBuddy — Dexcom sandbox integration
//
// A minimal server that performs the real Dexcom OAuth 2.0 authorization-code
// flow and fetches live sandbox glucose readings. Run this locally — it is
// not something that can run inside a browser-only page, because the token
// exchange requires a client secret that must never reach the browser.
//
// Setup:
//   1. Register a free app at https://developer.dexcom.com
//      - Redirect URI: http://localhost:3000/callback
//      - This gives you a Client ID and Client Secret
//   2. Copy .env.example to .env and fill in your credentials
//   3. npm install
//   4. npm start
//   5. Open http://localhost:3000 and click "Connect Dexcom"
//      (Sandbox login needs no password — just pick a SandboxUser)

const express = require('express');
const axios = require('axios');
require('dotenv').config();

const app = express();
app.use(express.static('public'));

const {
  DEXCOM_CLIENT_ID,
  DEXCOM_CLIENT_SECRET,
  DEXCOM_REDIRECT_URI,
  PORT = 3000,
} = process.env;

// Sandbox base — swap to https://api.dexcom.com for a production app
const DEXCOM_BASE = 'https://sandbox-api.dexcom.com';

// In-memory token store, fine for a local demo — use a real session/db store
// (and encrypt tokens at rest) for anything beyond a portfolio project.
let tokens = null;

// Step 1: send the user to Dexcom's consent screen
app.get('/auth/dexcom', (req, res) => {
  const params = new URLSearchParams({
    client_id: DEXCOM_CLIENT_ID,
    redirect_uri: DEXCOM_REDIRECT_URI,
    response_type: 'code',
    scope: 'offline_access',
  });
  res.redirect(`${DEXCOM_BASE}/v2/oauth2/login?${params}`);
});

// Step 2: Dexcom redirects back here with a one-time code
app.get('/callback', async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send('Missing authorization code');

  try {
    const { data } = await axios.post(
      `${DEXCOM_BASE}/v2/oauth2/token`,
      new URLSearchParams({
        client_id: DEXCOM_CLIENT_ID,
        client_secret: DEXCOM_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: DEXCOM_REDIRECT_URI,
      }),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );
    tokens = { ...data, obtained_at: Date.now() };
    res.redirect('/?connected=1');
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).send('Token exchange failed — check your .env credentials');
  }
});

// Refresh the access token when it's close to expiring
async function ensureFreshToken() {
  if (!tokens) throw new Error('Not connected — visit /auth/dexcom first');
  const ageSeconds = (Date.now() - tokens.obtained_at) / 1000;
  if (ageSeconds < tokens.expires_in - 60) return; // still valid

  const { data } = await axios.post(
    `${DEXCOM_BASE}/v2/oauth2/token`,
    new URLSearchParams({
      client_id: DEXCOM_CLIENT_ID,
      client_secret: DEXCOM_CLIENT_SECRET,
      refresh_token: tokens.refresh_token,
      grant_type: 'refresh_token',
      redirect_uri: DEXCOM_REDIRECT_URI,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );
  tokens = { ...data, obtained_at: Date.now() };
}

// Step 3: the actual data — estimated glucose values
// Sandbox convention: request the last 24h ending "now" relative to the
// sandbox user's data range (sandbox clocks don't match real time).
app.get('/api/glucose', async (req, res) => {
  try {
    await ensureFreshToken();

    // Sandbox data has a fixed historical window, so pull it first
    const { data: range } = await axios.get(
      `${DEXCOM_BASE}/v3/users/self/dataRange`,
      { headers: { Authorization: `Bearer ${tokens.access_token}` } }
    );
    const end = range.egvs.end.systemTime;
    const startDate = new Date(end);
    startDate.setDate(startDate.getDate() - 1);

    const { data: egvs } = await axios.get(
      `${DEXCOM_BASE}/v3/users/self/egvs`,
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
        params: { startDate: startDate.toISOString(), endDate: end },
      }
    );

    // Convert mg/dL (Dexcom's native unit) to mmol/L for the UK-style UI
    const readings = egvs.records.map(r => ({
      time: r.systemTime,
      mmol: Math.round((r.value / 18.0182) * 10) / 10,
      trend: r.trend,
    }));

    res.json({ connected: true, readings });
  } catch (err) {
    if (err.message.includes('Not connected')) {
      return res.json({ connected: false });
    }
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: 'Failed to fetch glucose data' });
  }
});

app.get('/api/status', (req, res) => {
  res.json({ connected: !!tokens });
});

app.listen(PORT, () => {
  console.log(`DiabetesBuddy Dexcom integration running at http://localhost:${PORT}`);
});
