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

### Step 4 — Set up your API keys

Copy the example env file:
```bash
cp .env.example .env.local
```

Open `.env.local` in any text editor and fill in your keys:

```
ANTHROPIC_API_KEY=your_key_here
STABILITY_API_KEY=your_key_here
```

**Getting your Anthropic key:**
1. Go to https://console.anthropic.com
2. Sign up / log in
3. Click "API Keys" in the sidebar
4. Click "Create Key" — copy it into `.env.local`

**Getting your Stability AI key:**
1. Go to https://platform.stability.ai
2. Sign up / log in  
3. Click your profile → "API Keys"
4. Create a key — copy it into `.env.local`
5. You'll need to add a small amount of credit (images cost ~$0.01–0.03 each)

---

### Step 5 — Run the app

```bash
npm run dev
```

Open your browser and go to: **http://localhost:3000**

You should see the GardenVision app running. Upload a photo and try it!

---

## Does it work without the Stability AI key?

**Yes — partially.** The full flow runs (upload → style → generation animation → result → lead form), and the Anthropic prompt building works. The "After" image will show your original photo with an overlay explaining the API isn't connected yet. Everything else works perfectly.

Add the Stability key when you're ready for real image generation.

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

**Important:** The `.gitignore` file already excludes `.env.local` — your API keys will NOT be pushed to GitHub.

---

## Deploying live (optional)

The easiest way to put this live is **Vercel** — it's free for personal projects:

1. Go to **https://vercel.com** and sign in with your GitHub account
2. Click "Add New Project"
3. Import your `gardenvision` repository
4. Under "Environment Variables", add:
   - `ANTHROPIC_API_KEY` → your key
   - `STABILITY_API_KEY` → your key
5. Click "Deploy"

Vercel gives you a live URL like `https://gardenvision.vercel.app` in about 2 minutes.

---

## Wiring up the lead form

Right now, submitted leads are logged to the console. To receive them:

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
│   │       │   └── route.js ← Stability AI image generation
│   │       └── leads/
│   │           └── route.js ← Lead form submission
│   └── lib/
│       └── promptBuilder.js ← Style prompts + prompt logic
├── .env.example             ← Copy to .env.local
├── .env.local               ← Your actual keys (NOT in git)
├── .gitignore
├── next.config.js
├── package.json
└── README.md
```

---

## B2B / White-label config

To brand this for a specific landscaping company, edit the `BRAND` object at the top of `src/app/page.js`:

```js
const BRAND = {
  name: 'GardenVision AI',
  companyTag: 'Prepared for Green Leaf Landscapes',  // Shows in header
  leadFormHeading: 'Request a quote from Green Leaf',
  leadFormCTA: 'Send my concept to Green Leaf',
  freeGenerations: 5,   // How many free goes per session
  watermark: false,     // Turn off watermark for paid clients
}
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
| Anthropic (prompt enhancement) | ~$0.001–0.003 per generation |
| Stability AI (image generation) | ~$0.01–0.03 per generation |
| Vercel hosting | Free for personal use |

A session using all 3 free generations costs roughly **£0.05–0.10** in AI API costs.
