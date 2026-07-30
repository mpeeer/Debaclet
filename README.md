# Debalect

**Cognitive training platform.** Drop your essay. Face a world-class Oxford Union debate opponent and receive rigorous logical analysis from a university professor.

> No install. No account. No API key. Just your browser — or run locally with Ollama, OpenAI, or Anthropic.

[![Deploy to GitHub Pages](https://github.com/actions/workflows/pages/pages-build-deployment/badge.svg)](https://github.com/features/actions)

---

## How It Works

```
┌─────────────────────────────────────────────────────┐
│                    Debalect                         │
│                                                     │
│  Your Essay In  ──►  Two AI Personas Run in Parallel│
│                                                     │
│  ┌─────────────────────┐  ┌───────────────────────┐ │
│  │  Oxford Union       │  │  Logic Professor      │ │
│  │  Debater            │  │                       │ │
│  │  • Counterarguments │  │  • Thesis extraction  │ │
│  │  • Evidence/impact  │  │  • Fallacy detection  │ │
│  │  • Real-world cases │  │  • Epistemic verdict  │ │
│  │  • Rhetorical force │  │  • Confidence meter   │ │
│  └─────────────────────┘  └───────────────────────┘ │
│                                                     │
│  Output: Structured cards, quality scores, export   │
└─────────────────────────────────────────────────────┘
```

## AI Providers

Debalect supports four AI backends. Pick what works for you.

| Provider | Setup | Key | Cost | Privacy | Speed |
|----------|-------|-----|------|---------|-------|
| **Browser** (WebLLM) | None | None | Free | Full (on-device) | Model-dependent |
| **Ollama** | Install once | None | Free | Full | Fast |
| **OpenAI** | None | API key | Pay-per-use | Cloud | Fast |
| **Anthropic** | None | API key | Pay-per-use | Cloud | Fast |

**The Browser provider is the headline.** Models run directly in your browser via WebGPU. The first debate downloads the model (~2 GB, cached in IndexedDB). After that, all inference happens on your device with zero latency to any server. Requires Chrome 113+ or Edge 113+.

The API key providers (OpenAI, Anthropic) are useful when you want stronger models or don't have a WebGPU-capable browser. Debalect's value isn't the model — it's the **cognitive training format**: dual-persona debate, structured parsing, evidence/impact breakdowns, fallacy detection, and epistemic verdicts with confidence meters.

## Features

- **File upload** — Drag and drop `.txt` or `.md` files, with live preview
- **Dual-panel view** — Side-by-side debater and professor panels, or tabbed switching
- **Counterargument cards** — Parsed with evidence, impact, and real-world examples
- **Fallacy detection** — Ad hominem, straw man, false dilemma, and more
- **Confidence meter** — Visual gauge showing the professor's epistemic certainty
- **Quality scoring** — Every debate gets a 0–100 score from counter count, confidence, and fallacy presence
- **Score trend chart** — Bar chart showing progression over your last 10 debates
- **Debate comparison** — Select two past debates and view them side-by-side
- **Session history** — Last 20 debates with rename, revisit, and clear
- **Export as Markdown** — Download any debate as a `.md` file
- **Theme system** — Dark, Light, Oxford Blue, Professor Purple, and System (auto)
- **No BS** — No ads, no tracking, no accounts, no AI fluff

## Deploy to GitHub Pages

Debalect works as a **fully static site**. Push to `main` and GitHub Actions deploys automatically.

1. Fork or push this repo to GitHub
2. Go to **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. Push to `main` — the workflow in `.github/workflows/deploy.yml` builds and deploys

The deployed site uses only the Browser provider (WebLLM). No backend required.

**Manual build:**
```bash
cd client
npm install
npx vite build --base=/your-repo-name/
# Output in client/dist/ — deploy to any static host
```

## Local Development

### Prerequisites

- **Node.js** ≥ 18

### Quick Start (Browser-only)

Run the frontend alone — no backend needed if you're using the Browser provider:

```bash
cd client
npm install
npm run dev
# Opens http://localhost:5173
```

The app auto-detects there's no server and locks to Browser mode.

### Quick Start (with Backend)

For Ollama, OpenAI, or Anthropic providers:

```bash
# 1. Install all dependencies
npm run install:all

# 2. Start both frontend and backend
npm run dev

# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

### Ollama Setup

```bash
# Install Ollama: https://ollama.com/download
ollama pull llama3.1     # Recommended (~8B params)
# or
ollama pull llama3.2      # Lightweight (~3B params)

# Set model via env var (optional)
export OLLAMA_MODEL=llama3.1
```

### OpenAI / Anthropic Setup

No install needed. Open Settings (gear icon) in the app, select your provider, and paste your API key. The key stays in server memory only — never written to disk.

Start the server with your key (optional, alternative to UI):
```bash
PROVIDER=openai MODEL=gpt-4o-mini OPENAI_API_KEY=sk-... npm run dev:server
```

## Project Structure

```
debalect/
├── client/                          # React + Vite + TailwindCSS
│   ├── public/
│   │   └── 404.html                 # SPA routing for GitHub Pages
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx           # Sticky header + provider badge
│   │   │   ├── InputPanel.tsx       # File upload with preview
│   │   │   ├── DebateView.tsx       # Dual-panel / tabbed view
│   │   │   ├── CounterArgument.tsx  # Parsed counterargument cards
│   │   │   ├── ProfessorNote.tsx    # Logical analysis + confidence meter
│   │   │   ├── SettingsModal.tsx    # Provider, model, API key config
│   │   │   └── ThemeSwitcher.tsx    # 5-theme picker
│   │   ├── context/
│   │   │   └── ThemeContext.tsx      # Theme state management
│   │   ├── services/
│   │   │   ├── webllm.ts            # WebLLM engine (browser inference)
│   │   │   └── prompts.ts           # Debater/professor system prompts
│   │   ├── App.tsx                  # Main state machine + history + scoring
│   │   ├── types.ts                 # Shared TypeScript types
│   │   └── index.css                # Design tokens + global styles
│   └── ...
├── server/                          # Express + TypeScript
│   ├── src/
│   │   ├── routes/
│   │   │   └── debate.ts            # POST /api/debate + /api/config
│   │   ├── services/
│   │   │   ├── providers.ts         # Ollama / OpenAI / Anthropic abstraction
│   │   │   └── prompts.ts           # Server-side system prompts
│   │   └── index.ts                 # Express entry
│   └── ...
├── .github/workflows/
│   └── deploy.yml                   # Auto-deploy to GitHub Pages
└── package.json                     # Root scripts
```

## License

MIT — Open source. Use it, fork it, improve it.

---

<p align="center">
  <sub>Built for sharper thinking. No cloud required.</sub>
</p>
