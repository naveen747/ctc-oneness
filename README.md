# ONENESS · CTC Family Retreat 2026

Live leaderboard website for the Christalaya Telugu Church family retreat (Sat 10 Oct 2026, Khedda Resorts, Kanakapura Road).

- **Before 10 Oct, 8:00 AM IST:** Bible-verse loading screen (English + Telugu), countdown, event info, team cheering, Do's & Don'ts. Teams, game names and scores stay hidden.
- **From 10 Oct, 8:00 AM IST:** live leaderboard, race chart, game results and team member lists. It opens automatically using server time.
- **Admin (`/admin`):** one password login. Add participants by team (bulk paste), add and order games, award points (winner +10, runner-up +5, ties allowed), void mistakes, post an announcement banner, download a CSV backup.

Stack: Next.js on Vercel and Supabase Postgres. Visitors read a CDN-cached endpoint that refreshes every 3 seconds, so hundreds of phones cause about one database read every few seconds. Points are an append-only log: mistakes are voided, never overwritten.

---

## Setup (about 10 minutes)

### 1. Supabase: create the database
1. Go to https://supabase.com, choose **New project**, and pick the region **Mumbai (ap-south-1)**.
2. Open **SQL Editor → New query**, paste the whole of `supabase/schema.sql` and click **Run**. You should see "Success".
3. Go to **Project Settings → API** and keep these two values handy:
   - **Project URL**
   - **service_role** key (on newer projects this is under **API Keys → Secret key**, starting `sb_secret_`). Never share this key and never put it in front-end code.

### 2. Vercel: deploy
1. Go to https://vercel.com, choose **Add New → Project**, and import the `ctc-oneness` GitHub repo.
2. Before clicking Deploy, open **Environment Variables** and add:

   | Name | Value |
   |---|---|
   | `SUPABASE_URL` | Project URL from Supabase |
   | `SUPABASE_SERVICE_ROLE_KEY` | service_role key from Supabase |
   | `ADMIN_PASSWORD` | your admin password (6+ characters) |

3. Click **Deploy**. Your link will look like `ctc-oneness.vercel.app`. You can rename it under Settings → Domains.

### 3. Test run (Friday)
1. Open `/admin` and log in.
2. In **Settings**, tap **Open now** so you can see the live view. Add a few test names and games, score some games, and check the public site on your phone.
3. When you're done, use **Reset all scores** and **Remove all people**, delete the test games, and set visibility back to **Auto**.

### On the day
1. **Morning:** after the lottery, open **People**, pick a team and category, paste the names (one per line), and tap Add. Repeat for each team.
2. **After each game:** open **Score**, pick the game, tap the winner once (+10) and the runner-up twice (+5), then tap **Award points**. For a tie, mark both teams as winners.
3. **If you make a mistake:** tap **Void** on that result, then score it again.
4. **Backup:** download a CSV from **Settings** every few games.

## Notes
- **Supabase free tier:** projects pause after a week with no activity. Open the site or admin once a day before the event.
- **Changing content:** verses, Do's & Don'ts and event details live in `lib/content.ts`. Team names and colours live in `lib/teams.ts`.
- **Running locally:** `npm install && npm run dev` runs with an in-memory demo database. The admin password is `admin123` unless `ADMIN_PASSWORD` is set.
