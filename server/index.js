import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PROFILES } from './seed.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_FILE = path.join(__dirname, 'db.json');
// Single logged-in user. State = { swipes: { [profileId]: {action, at} }, matches: [{profileId, at}] }
const load = () => (fs.existsSync(DB_FILE) ? JSON.parse(fs.readFileSync(DB_FILE, 'utf8')) : { swipes: {}, matches: [] });
const save = (db) => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
// Privacy: strip the server-only flag from anything leaving the API.
const pub = ({ likesMe, ...p }) => p;
const byId = (id) => PROFILES.find((p) => p.id === id);

const api = express.Router();

// Profiles not yet swiped on. Never includes who liked the user.
api.get('/feed', (_req, res) => {
  const { swipes } = load();
  res.json(PROFILES.filter((p) => !swipes[p.id]).map(pub));
});

// Records like/pass. A match exists only when the user likes someone who already liked them.
api.post('/swipe', (req, res) => {
  const { profileId, action } = req.body || {};
  const profile = byId(profileId);
  if (!profile) return res.status(404).json({ error: 'Unknown profile' });
  if (!['like', 'pass'].includes(action)) return res.status(400).json({ error: 'action must be like or pass' });

  const db = load();
  if (db.swipes[profileId]) return res.json({ match: false, alreadySwiped: true, profile: null }); // idempotent
  db.swipes[profileId] = { action, at: new Date().toISOString() };
  const match = action === 'like' && profile.likesMe;
  if (match) db.matches.push({ profileId, at: new Date().toISOString() });
  save(db);
  res.json({ match, profile: match ? pub(profile) : null });
});

// Mutual matches only, newest first.
api.get('/matches', (_req, res) => {
  const { matches } = load();
  res.json([...matches].reverse().map((m) => ({ ...pub(byId(m.profileId)), matchedAt: m.at })));
});

// Demo helper: clears all swipes and matches.
api.post('/reset', (_req, res) => {
  save({ swipes: {}, matches: [] });
  res.json({ ok: true });
});

const app = express();
app.use(express.json());
app.use('/api', api);
app.use('/', api); // also exposes GET /feed, POST /swipe, GET /matches exactly as specified
const dist = path.join(__dirname, '..', 'dist');
if (fs.existsSync(dist)) app.use(express.static(dist));
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Coy Discover API on :${PORT}`));
