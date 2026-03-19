# GardenVision AI 🌿

> Upload a garden photo. Choose a style. Get a professional landscaping concept in seconds.

---

## What this is

A full-stack web app that lets homeowners and landscapers visualise how an outdoor space could look after landscaping work. Built with Next.js + React. Designed to be embedded in or linked from a landscaping company's website as a lead generation tool.

---

## Quickstart — get it running on your computer

### Step 1 — Install Node.js (if you haven't already)

Go to **https://nodejs.org** and download the **LTS version** (the green button). Run the installer. That's it.

To check it worked, open Terminal (Mac) or Command Prompt (Windows) and type:
```
node --version
```
You should see something like `v20.11.0`.

---

### Step 2 — Download this project

If you have git installed:
```bash
git clone https://github.com/YOUR_USERNAME/gardenvision.git
cd gardenvision
```

Or just download the ZIP from GitHub and unzip it somewhere on your computer.

---

### Step 3 — Install dependencies

In Terminal, inside the project folder:
```bash
npm install
```

This downloads all the libraries the app needs. Takes about 30 seconds.

---

### Step 4 — Set up your local env file

Copy the example env file:
```bash
cp .env.example .env.local
```

Open `.env.local` in any text editor and fill in your keys:

```
GEMINI_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
LEAD_WEBHOOK_URL=your_webhook_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
MAX_FREE_GENERATIONS=3
GENERATION_COOLDOWN_SECONDS=30
ENABLE_WATERMARK=true
FREE_IMAGE_QUALITY=standard
PAID_IMAGE_QUALITY=high
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
NEXT_PUBLIC_SITE_NAME=GardenVision AI
NEXT_PUBLIC_SITE_SHORT_NAME=GardenVision
NEXT_PUBLIC_SITE_DESCRIPTION=Upload a property photo and preview a premium landscaping concept that stays faithful to the real space.
NEXT_PUBLIC_LOGO_PRIMARY=Garden
NEXT_PUBLIC_LOGO_ACCENT=Vision
NEXT_PUBLIC_COMPANY_TAG=
NEXT_PUBLIC_LEAD_FORM_HEADING=Request a landscaping quote
NEXT_PUBLIC_LEAD_FORM_CTA=Continue with this design
```

Gemini is the default live provider and prompt orchestration path. Anthropic stays behind the same provider abstraction for later use, but it is not the active image generator today.

Usage control note: the MVP currently tracks free-generation limits, cooldowns, and active locks with an httpOnly session cookie plus lightweight in-memory server state. This is fine for a lean initial deployment, but Redis / Vercel KV / a database session table should replace it for durable cross-instance enforcement.

Supabase note: if `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are present, the app will persist:
- leads
- saved concept metadata
- lightweight generation usage records

Apply the schema in [supabase/schema.sql](supabase/schema.sql) before going live.

**Getting your Gemini key:**
1. Go to https://aistudio.google.com
2. Sign up / log in
3. Click "Get API key"
4. Click "Create Key" — copy it into `.env.local`

**Getting your Anthropic key (optional for later provider work):**
1. Go to https://console.anthropic.com
2. Sign up / log in  
3. Click "API Keys" in the sidebar
4. Click "Create Key" — copy it into `.env.local`

---

### Step 5 — Run the app

```bash
npm run dev
```

Open your browser and go to: **http://localhost:3000**

You should see the GardenVision app running. Upload a photo and try it!

---

## Does it work without the Gemini key?

**Yes — partially.** The full flow runs (upload → style → generation animation → result → lead form). If `GEMINI_API_KEY` is missing, the "After" view stays in demo mode and shows the composed landscaping prompt summary instead of a live generated image.

Add the Gemini key when you're ready for live image generation.

---

## Pushing to GitHub

### First time setup:

1. Go to **https://github.com** and log in
2. Click the **+** button → "New repository"
3. Name it `gardenvision` — leave everything else as default
4. Click "Create repository"
5. Copy the URL it gives you (looks like `https://github.com/yourusername/gardenvision.git`)

Then in your terminal (in the project folder):

```bash
git init
git add .
git commit -m "Initial commit — GardenVision MVP"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gardenvision.git
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

**Important:** The `.gitignore` file excludes `.env`, `.env.local`, and `.env.*.local` — your local secrets will NOT be pushed to GitHub.

---

## Deploying live (optional)

The easiest way to put this live is **Vercel** — it's free for personal projects:

1. Go to **https://vercel.com** and sign in with your GitHub account
2. Click "Add New Project"
3. Import your `gardenvision` repository
4. Under "Environment Variables", add:
   - `GEMINI_API_KEY` → your key
   - `ANTHROPIC_API_KEY` → your key
   - `LEAD_WEBHOOK_URL` → your webhook URL
   - `SUPABASE_URL` → your Supabase project URL
   - `SUPABASE_SERVICE_ROLE_KEY` → your Supabase service role key
   - `NEXT_PUBLIC_SITE_URL` → your final domain or Vercel URL
   - `NEXT_PUBLIC_SITE_NAME` → your live brand name
5. Click "Deploy"

Vercel gives you a live URL like `https://gardenvision.vercel.app` in about 2 minutes.

Before deployment, create a Supabase project and run the SQL in [supabase/schema.sql](supabase/schema.sql) inside the Supabase SQL editor.

---

## Wiring up the lead form

Lead submissions can now be stored in Supabase and optionally forwarded to a webhook. If Supabase is configured, the app also stores saved concept metadata and lightweight usage records.

**Option A — Webhook (easiest):**
1. Create a free account at https://zapier.com or https://make.com
2. Create a "Catch Webhook" trigger
3. Copy the webhook URL
4. Add it to `.env.local` as `LEAD_WEBHOOK_URL=https://...`
5. Connect it to email, Google Sheets, your CRM, etc.

**Option B — Email (direct):**
Install Resend or Nodemailer and add a few lines to `src/app/api/leads/route.js`.

---

## Folder structure

```
gardenvision/
├── src/
│   ├── app/
│   │   ├── page.js          ← The entire app UI
│   │   ├── layout.js        ← HTML wrapper
│   │   ├── globals.css      ← Base styles
│   │   └── api/
│   │       ├── generate/
│   │       │   └── route.js ← Provider-backed concept generation
│   │       └── leads/
│   │           └── route.js ← Lead form submission
│   └── lib/
│       ├── generation/
│       │   └── providers/   ← Gemini live provider + Anthropic fallback slot
│       └── promptBuilder.js ← Lean outdoor prompt logic
├── .env.example             ← Copy to .env.local
├── .env.local               ← Your actual keys (NOT in git)
├── .gitignore
├── next.config.js
├── package.json
└── README.md
```

---

## B2B / White-label config

Brand/domain settings now live in:
- `src/lib/siteConfig.js`
- `.env.local` via the `NEXT_PUBLIC_SITE_*` variables

That config feeds:
- header/footer branding
- lead-form copy
- metadata / Open Graph tags
- sitemap / robots / canonical URLs

The Supabase server adapter lives in:
- `src/lib/supabaseAdmin.js`

The automatic domain files live in:
- `src/app/sitemap.js`
- `src/app/robots.js`
- `src/app/opengraph-image.js`
- `src/app/icon.svg`

Usage limits and rendering controls now live in `.env.local` via:

```bash
MAX_FREE_GENERATIONS=3
GENERATION_COOLDOWN_SECONDS=30
ENABLE_WATERMARK=true
FREE_IMAGE_QUALITY=standard
PAID_IMAGE_QUALITY=high
```

---

## What to build next

1. **Real before/after slider** — replace the tab UI with a drag slider component
2. **Multiple concept variants** — generate 2–3 options per session
3. **User accounts** — save concepts, revisit later
4. **Payment / upgrade** — Stripe integration to unlock unlimited generations
5. **Email delivery** — send the concept image to the user's email after lead capture
6. **Admin dashboard** — view all leads, download concepts
7. **White-label portal** — let landscaping businesses manage their own branded version

---

## Costs

| Service | Cost |
|---|---|
| Gemini (image generation) | Varies by model and usage |
| Anthropic (future fallback slot) | Optional |
| Vercel hosting | Free for personal use |

A session using all 3 free generations depends on your selected Gemini model and image volume.
