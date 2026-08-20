# Dads Weekend 2026 — Scoring

Mobile web app for the tournament: three courses, four teams, 40 points.
Every player enters on their own phone, scores sync live, and the whole
thing keeps working when the signal dies at Wolf Creek.

## Deploy — about 15 minutes

### 1. Supabase (the sync backend)

1. Create a free project at supabase.com.
2. Open **SQL Editor → New query**, paste `supabase.sql`, hit **Run**.
3. Go to **Project Settings → API** and copy two values:
   - Project URL
   - `anon` `public` key

### 2. Netlify (the hosting)

1. Push this folder to a GitHub repo.
2. In Netlify: **Add new site → Import an existing project** → pick the repo.
3. Build settings are already in `netlify.toml` — leave them alone.
4. Before the first deploy, open **Site configuration → Environment variables**
   and add:

   ```
   VITE_SUPABASE_URL       = https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY  = your-anon-public-key
   ```

5. Deploy. Rename the site to something memorable under
   **Domain management** so the link is easy to text out.

Both variables must be set *before* the build — Vite bakes them in at
build time. If you add them after, hit **Trigger deploy → Clear cache and
deploy site**.

### 3. On each phone

Open the link, tap Share → **Add to Home Screen**. It opens fullscreen
with no browser chrome. Everyone picks their own name on first launch.

## Running it locally

```bash
npm install
cp .env.example .env      # fill in your two Supabase values
npm run dev
```

## Before the weekend

- **Setup → Courses**: pick the nines for Wolf Creek and Innisfail, and
  the tee at each course. All hole data is loaded from the real cards.
- **Setup → Team names**: rename the four teams.
- **Setup → Matchups**: confirm the 2v2 pairings for each course.
- **Setup → Points**: change the split if the defaults are wrong.

Whatever you set syncs to every phone, so do it once on yours.

## How scoring works

**Per course — 9 points**

Each 2v2 pairing plays three matches: front nine, back nine and overall
18. One point each, so a pairing is worth 3 and the two pairings are
worth 6. Plus 3 points to the lowest group score.

At Sundre and Wolf Creek the group score is the team's **best ball net**:
on every hole you take whichever partner posted the lower net score, then
total those 18. Not the two rounds added together, and not one player's
whole card. At Innisfail it's the team's net scramble score.

**Games — 13 points**
- Beersbee: six 2v2 matches, 1 point each
- Bocce: 3 / 2 / 1
- Bean bag: 1 point per made shot

27 + 13 = 40 on the table. A team's ceiling is 25.

**Courses.** Sundre is a fixed 18. Wolf Creek has four nines (West, East,
South, North) and Innisfail has three (Aspen, Spruce, Hazelwood) — pick
front and back in Setup and the app re-indexes the strokes and pulls the
right rating and slope. Wolf Creek's signed combinations are West+East
(the Old Course, par 70), South+North (the Links, par 71), East+South and
South+West. Any other pairing works but isn't on the printed rating table,
so it uses an estimate and says so.

**Reactions.** Twelve emotes — Dog, 3 Putt, Mulligan, KP, Cryin', Flushed,
Wet, Sandy, Blow-up, Beer, Ice Cold, Greenie. Tap React on the entry
screen and it pops up on every other phone within a second. Running
tallies live under Hall of Shame on the Standings tab.

**Handicaps.** Course handicap = index × slope ÷ 113 + (rating − par),
with strokes falling on the lowest stroke-index holes first and wrapping
past 18. Innisfail uses the printed front-nine or back-nine index
depending on which nine you play first. The scramble uses 70% of the low
handicap plus 30% of the high.

**Pickups.** The "Picked up" button records par + 2 and marks the hole
with an asterisk. That hole wins nothing in the direct match. The strokes
still count toward the four-team aggregate, or the totals would not be
comparable — the aggregate shows an asterisk so everyone can see a pickup
is in there.

## Refresh

Refresh pulls everyone's latest scores over what's on the phone, so it
asks twice before it does anything. Tap once for "You sure?", again for
"Sure sure?", a third time to actually refresh. It resets itself after
six seconds.

## Offline

The app shell is cached by a service worker and every score is written to
the phone first, then queued for Supabase. The header shows
"3 waiting" whenever entries haven't made it up yet, and flushes
automatically when signal returns. Don't clear your browser data
mid-round.

## Security note

The Supabase policy in `supabase.sql` lets anyone with the URL read and
write. That's intentional for a tournament nobody is trying to hack.
Don't reuse it for anything that matters.
