# Coy Discover

Swipe-based "Discover" tab (React + Vite, Node/Express, JSON-file persistence) with a blank "Home" placeholder tab.

## Run
```bash
npm install
npm run dev      # API on :4000, web on :5173
```

https://github.com/user-attachments/assets/b713ef7f-9a84-41eb-8226-e74b03187c30




Production-style: `npm start` (builds, then Express serves everything on :4000).

## API (also available under `/api`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/feed` | Profiles not yet swiped on |
| POST | `/swipe` `{profileId, action: "like"\|"pass"}` | Records swipe, returns `{match, profile}` |
| GET | `/matches` | Mutual matches only |
| POST | `/reset` | Demo helper: clears swipes/matches |

## Privacy design (Coy's core promise)
- Seed profiles carry a server-only `likesMe` flag. It is stripped from every response (`pub()` in `server/index.js`).
- A match is created only when the user likes a profile that already liked them. Nothing else reveals who liked you.
- Swipes/matches persist in `server/db.json`. Swiped profiles never return to `/feed`; repeat swipes are idempotent.
- Demo: 36 seeded profiles, 11 have liked you (e.g. Rohan, Ishita, Naina). Like them to see "It's a match!".
