# multi-link

A worker sign-up, profile, hours-tracking, and pay leaderboard app —
now with a real backend: Vercel serverless functions + Postgres.

## What's included

- **Sign up / Login with email** — first account created becomes `admin` (the owner). Any admin can promote or demote other users to/from admin, the same way group admins work on WhatsApp. Password fields have a Show/Hide toggle.
- **Profile pictures** — workers can upload a photo; it's resized in the browser before saving so it stays small.
- **Sidebar navigation** — different menu for admins vs workers.
- **Admin Overview** — all-time worker earnings, this week's worker earnings, and the admin's 25% cut of this week's total, calculated automatically.
- **Workers list** — every worker with their hours/earnings; click a name to open their full profile, including bank details, for payroll.
- **Manage Admins** — promote/demote any user (except yourself, to avoid locking yourself out).
- **Worker dashboard** — their own hours, running total earned, and a form to log new hours.
- **Top Earners** — leaderboard ranked by total earnings; admins can click a name to jump to that worker's profile.
- **Profile** — name, phone, date of birth, email, bank account name & number. Bank account numbers are encrypted (AES-256-GCM) before they're stored, and only ever decrypted for an admin viewing that worker's profile — never sent back to the worker's own browser after saving.

## File structure

```
src/                      the React frontend (unchanged from before)
  services/dataService.js   <-- calls the API below (only file that does)
api/                       the backend — Vercel runs each file as a serverless function
  _lib/
    schema.sql              run this once against your database
    db.js                   database connection
    auth.js                 password hashing, JWT, bank-number encryption
  auth/
    signup.js
    login.js
  profile.js
  hours.js
  settings.js
  leaderboard.js
```

## One-time setup

### 1. Add a database
In your Vercel project dashboard: **Storage** tab → **Create Database** →
choose **Postgres** (powered by Neon) → connect it to your project.
Vercel automatically sets the `POSTGRES_URL` environment variable for you.

### 2. Run the schema
In the database's **Query** tab (in the Vercel dashboard), paste the
contents of `api/_lib/schema.sql` and run it. This creates the `users`,
`hours_entries`, and `settings` tables.

### 3. Set your secret keys
In **Project → Settings → Environment Variables**, add:

- `JWT_SECRET` — any long random string. Generate one with:
  `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
- `BANK_ENCRYPTION_KEY` — a 32-byte hex key, same command as above.

Never commit these values to GitHub — `.env.example` shows the names
only, not real values.

### 4. Redeploy
Push any small change (or just click **Redeploy** in Vercel) so the new
environment variables take effect.

## Local development

`npm run dev` only runs the frontend — it won't serve `/api` routes.
To test the full app locally (frontend + backend together), install
the Vercel CLI and run:

```bash
npm install -g vercel
vercel dev
```

This links to your Vercel project and its environment variables, and
serves both the React app and the API functions on the same local URL.

## Security notes

- Passwords: hashed with bcrypt (12 rounds), never stored in plain text.
- Bank account numbers: encrypted with AES-256-GCM before touching the
  database, and excluded from every API response — the app only ever
  writes them, never reads them back out to the browser.
- Sessions: JWTs expire after 7 days.
- Still worth doing before a bigger public launch: rate limiting on
  login/signup, HTTPS is already enforced by Vercel, and a proper
  password-reset flow (not included yet).

## Learning the backend — a hands-on walkthrough

You said you want to get good at this, so here's how to actually learn
it rather than just deploy it.

### 1. Understand what a serverless function is

Every file in `/api` is its own tiny server. When your browser calls
`fetch("/api/hours")`, Vercel finds `api/hours.js`, runs the
`handler(req, res)` function inside it, and sends back whatever you
call `res.status(...).json(...)` with. That's the whole model:
**one file = one URL = one function that reads a request and writes a
response.**

- `api/hours.js` → `/api/hours`
- `api/admin/overview.js` → `/api/admin/overview`
- `api/admin/users/[id].js` → `/api/admin/users/anything-here` (the
  `[id]` becomes `req.query.id`)

### 2. Run it on your machine and watch it work

```bash
npm install -g vercel   # one-time
cd multi-link
vercel link              # connects this folder to your Vercel project
vercel env pull .env.local   # downloads your real env vars locally
vercel dev                # starts frontend + backend together
```

Now open the local URL it gives you, use the app, and watch your
terminal — every time the app calls the backend, you'll see it print
in real time. This is the best way to build intuition for what's
actually happening.

### 3. Make one small edit and see it change

Try this to get a feel for editing: open `api/settings.js`, find the
line `LIMIT 10` in a different file... actually, simplest first edit —
open `api/leaderboard.js` and change:

```js
LIMIT 10
```

to

```js
LIMIT 5
```

Save the file. If `vercel dev` is running, it reloads automatically —
refresh the Top Earners page and you'll see only 5 people now instead
of 10. That's the full loop: **edit a file → save → see it change.**
Everything else in this backend is just bigger versions of that.

### 4. Read a query, then write your own

Every database call in this app follows the same shape:

```js
const result = await query("SELECT * FROM hours_entries WHERE user_id = $1", [userId]);
```

- The `$1` is a placeholder — the value from the array after it fills
  it in safely (this prevents a security issue called SQL injection,
  where someone could type malicious text into a form to attack your
  database).
- `result.rows` is always an array of matching rows.

Try adding a new, tiny endpoint yourself as practice: create
`api/ping.js` with:

```js
export default function handler(req, res) {
  res.status(200).json({ message: "pong", time: new Date().toISOString() });
}
```

Push it, then visit `https://your-site.vercel.app/api/ping` directly
in your browser. Seeing raw JSON like that is exactly what your React
components are reading every time they call `apiFetch(...)`.

### 5. Where to look when something breaks

- **Vercel → your project → Deployments → click a deployment → Functions/Logs tab** — shows real errors from the backend, including ones that never reach the browser.
- **Browser DevTools → Network tab → click the failed request → Response tab** — shows exactly what the backend sent back.
- Most errors in this app will be one of: a missing environment variable, a typo in a SQL column name, or forgetting to run `schema.sql` after a database change.



Amounts are formatted in Nigerian Naira (₦) by default — edit the
`formatMoney` function in `HoursTracker.jsx` and `TopEarners.jsx` if
you need a different currency.
