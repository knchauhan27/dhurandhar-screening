# 🎬 Dhurandhar Batch Screening — Setup & Deployment Guide

---

## STEP 1 — Create Supabase Project

1. Go to https://supabase.com and sign in / sign up.
2. Click **New Project**.
3. Give it a name (e.g. `dhurandhar-screening`) and set a database password.
4. Wait for the project to be ready (~1 min).
   pass - Kunj@9408479023

---

## STEP 2 — Run the SQL Schema

1. In your Supabase project, click **SQL Editor** in the left sidebar.
2. Open `schema.sql` from this project.
3. Paste the full contents and click **Run**.

This will:

- Create the `students` table
- Create the `registrations` table
- Enable Row Level Security (RLS) with public read/write policies
- Insert all 200 sample students

> ⚠️ **Replace the student names** with your actual batch list before running!
> The file uses placeholder names. Edit lines 60–260 in schema.sql.

---

## STEP 3 — Get Your Supabase Keys

1. In Supabase, go to **Project Settings → API**.
2. Copy:
   - **Project URL** (looks like `https://abcxyz.supabase.co`)
   - **anon / public key** (a long JWT string)

---

## STEP 4 — Paste Keys Into script.js

Open `script.js` and find lines 12–13:

```js
const SUPABASE_URL = "https://YOUR_PROJECT_ID.supabase.co"; // ← REPLACE
const SUPABASE_ANON = "YOUR_SUPABASE_ANON_KEY"; // ← REPLACE
```

Replace with your actual values. Example:

```js
const SUPABASE_URL = "https://abcxyzabc.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

---

## STEP 5 — Deploy (Choose One Option)

### Option A — Netlify Drop (Easiest, Free)

1. Go to https://app.netlify.com/drop
2. Drag and drop your project folder containing:
   - `index.html`
   - `script.js`
3. Netlify gives you a live URL instantly. Share it with your batch!

### Option B — GitHub + Vercel / Netlify (Better, also Free)

1. Create a GitHub repo and push your 3 files.
2. Go to https://vercel.com or https://app.netlify.com.
3. Import the GitHub repo.
4. Deploy. Done.

### Option C — GitHub Pages (Free)

1. Create a GitHub repo.
2. Push `index.html` and `script.js` (rename `index.html` to `index.html` — already correct).
3. Go to repo Settings → Pages → Branch: main → `/root`.
4. Your site is live at `https://yourusername.github.io/repo-name`.

### Option D — Local Testing

Simply open `index.html` in any modern browser. Everything works locally
since all dependencies are loaded from CDN and Supabase is cloud-hosted.

---

## FILE STRUCTURE

```
/
├── index.html      — Full UI
├── script.js       — All logic (Supabase + PDF)
├── schema.sql      — Database setup (run once in Supabase)
└── SETUP.md        — This file
```

---

## CUSTOMISING STUDENT NAMES

In `schema.sql`, the INSERT block starts at line 60.
Each row looks like:

```sql
(1, 'Aarav Shah'),
(2, 'Aanya Patel'),
...
```

Replace the names with your actual batch. Keep the same format.
Run the SQL after editing.

---

## HOW THE SEAT SYSTEM WORKS

- Maximum seats: **100**
- First group to register gets seats 1, 2, 3 … (based on group size)
- Next group picks up where the last left off
- This is enforced by reading the highest `end_sequence` from the registrations table

---

## TROUBLESHOOTING

| Problem                                          | Fix                                                      |
| ------------------------------------------------ | -------------------------------------------------------- |
| Blank page / JS errors                           | Check browser console. Likely wrong Supabase keys.       |
| "Failed to load students"                        | Double-check SUPABASE_URL and SUPABASE_ANON in script.js |
| Registration fails silently                      | Check RLS policies in Supabase → Table Editor → Policies |
| PDF not downloading                              | Make sure jsPDF CDN loads (needs internet)               |
| Students not showing as registered after refresh | Check that the UPDATE policy on `students` is enabled    |

---

## SECURITY NOTE

The `anon` key is safe to expose in the frontend — Supabase is designed this way.
Row Level Security (RLS) protects your data. The policies in schema.sql allow:

- ✅ Anyone can READ students and registrations
- ✅ Anyone can UPDATE students (to mark as registered)
- ✅ Anyone can INSERT registrations
- ❌ Nobody can DELETE (not needed and not allowed)

If you want tighter security, you can restrict policies further in Supabase.

---

Built with ❤️ for GMERS Gotri MBBS Batch
