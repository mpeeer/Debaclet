<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset=".github/assets/logo-dark.svg">
    <img alt="Debalect" src=".github/assets/logo-light.svg" width="240">
  </picture>
</p>

<p align="center">
  <strong>Upload an essay. Get a structured debate analysis — counterarguments, logical deconstruction, and an epistemic verdict.</strong>
</p>

<p align="center">
  <a href="https://github.com/mpeeer/Debaclet/actions"><img src="https://img.shields.io/github/actions/workflow/status/mpeeer/Debaclet/.github%2Fworkflows%2Fdeploy.yml?branch=main&label=deploy" alt="Deploy status"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" alt="License: MIT"></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/badge/node-%E2%89%A518-339933" alt="Node ≥ 18"></a>
</p>

<br>

<!--
  ## Screenshots

  To complete this README, add the following images to .github/assets/:

  | File | Dimensions | Description |
  |---|---|---|
  | `screenshot-main.png` | 1400×900 | Full interface — file upload, dual-panel results, and score history |
  | `screenshot-cards.png` | 700×500 | Expanded counterargument cards with claim, evidence, and impact |
  | `screenshot-professor.png` | 700×500 | Professor analysis panel with confidence meter and fallacy detection |

  Once added, uncomment the image sections below.
-->

<!--
<p align="center">
  <img src=".github/assets/screenshot-main.png" alt="Debalect interface showing file upload, dual-panel debate output, and score history" width="100%" style="max-width: 900px;">
</p>

<br>
-->

---

## Overview

Debalect runs two parallel analysis paths against a submitted text:

1. **Debater** — Identifies the core thesis and produces structured counterarguments with claims, evidence, and impact assessment. Returns a closing statement.
2. **Professor** — Reconstructs the argument into formal premises and conclusion, surfaces implicit assumptions, evaluates strengths and weaknesses, flags logical fallacies, and assigns an epistemic confidence rating.

Results are parsed into structured UI cards. Every analysis receives a composite quality score (0–100) based on counterargument count, confidence level, and fallacy presence. Sessions are saved to local storage.

The application ships as a fully static web frontend with an optional Express backend for API-key-based providers.

<br>

<!--
<table>
  <tr>
    <td width="50%"><img src=".github/assets/screenshot-cards.png" alt="Structured counterargument cards with claim, evidence, and impact sections" width="100%"></td>
    <td width="50%"><img src=".github/assets/screenshot-professor.png" alt="Professor panel showing argument reconstruction, confidence meter, and fallacy detection" width="100%"></td>
  </tr>
</table>
-->

---

## Features

| Category | Capabilities |
|---|---|
| **Input** | Drag-and-drop file upload (.txt, .md, .pdf, .docx), live text preview, 10 MB limit |
| **Analysis** | Dual-path parallel inference, thesis extraction, structured counterargument parsing |
| **Structured output** | Claim / Evidence / Impact breakdown, argument reconstruction with premises & assumptions, fallacy detection, confidence meter |
| **Quality scoring** | Composite 0–100 score per analysis, color-coded badges, score trend chart (last 10) |
| **History** | Last 20 analyses persisted in local storage, rename, revisit, clear |
| **Comparison** | Select two past analyses and view scores side-by-side |
| **Export** | Download any analysis as a Markdown file |
| **Themes** | Dark, Light, Oxford Blue, Professor Purple, System (auto-detect) |

---

## AI Providers

Four inference backends are supported. The browser provider requires no setup — models download once, then all inference runs on-device.

| Provider | Setup | Authentication | Cost | Data location |
|---|---|---|---|---|
| **Browser** (WebLLM) | None | None | Free | On-device |
| **Ollama** | [Install Ollama](https://ollama.com/download) | None | Free | Local host |
| **OpenAI** | None | API key | Pay-per-use | Cloud |
| **Anthropic** | None | API key | Pay-per-use | Cloud |

> **Browser requirements:** Chrome 113+ or Edge 113+ with WebGPU support. The first analysis downloads ~2 GB of model weights, cached in IndexedDB for subsequent sessions.

---

## Quick Start

### Prerequisites

- **Node.js** ≥ 18
- (Optional) Ollama, or an OpenAI / Anthropic API key

### Browser-only (no backend)

```bash
cd client
npm install
npm run dev
# → http://localhost:5173
```

When no backend is detected, the application automatically locks to Browser mode.

### With backend (Ollama, OpenAI, Anthropic)

```bash
npm run install:all
npm run dev

# Client: http://localhost:5173
# Server: http://localhost:3001
```

### Ollama

```bash
ollama pull llama3.1
# Optional: set a custom model
export OLLAMA_MODEL=llama3.1
```

### OpenAI / Anthropic

Open **Settings** (gear icon) in the application, select your provider, and enter your API key. Keys are held in server memory only and are never written to disk.

Alternatively, start the server with environment variables:

```bash
PROVIDER=openai MODEL=gpt-4o-mini OPENAI_API_KEY=sk-... npm run dev:server
```

---

## Deployment

### GitHub Pages

The repository includes a GitHub Actions workflow (`.github/workflows/deploy.yml`) that builds and deploys on every push to `main`.

1. Push to GitHub
2. Enable GitHub Actions in **Settings → Pages → Build and deployment → Source: GitHub Actions**
3. Push to `main` — deployment runs automatically

The deployed site uses Browser-only inference. No server is required.

### Static hosting (manual)

```bash
cd client
npm install
npx vite build --base=/your-base-path/
# Deploy client/dist/ to any static host (Vercel, Netlify, S3 + CloudFront, etc.)
```

---

## Project Structure

```
.
├── .github/workflows/
│   └── deploy.yml                       # GitHub Pages CI/CD
├── client/                              # React 18 + Vite + Tailwind CSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx               # Sticky header, provider badge
│   │   │   ├── InputPanel.tsx           # Drag-and-drop file upload with preview
│   │   │   ├── DebateView.tsx           # Tabbed / split-panel result view
│   │   │   ├── CounterArgument.tsx      # Parsed counterargument card component
│   │   │   ├── ProfessorNote.tsx        # Argument reconstruction, fallacies, verdict
│   │   │   ├── SettingsModal.tsx        # Provider, model, API key management
│   │   │   ├── ThemeSwitcher.tsx        # Five-theme picker
│   │   │   └── ErrorBoundary.tsx        # React error boundary
│   │   ├── context/
│   │   │   └── ThemeContext.tsx          # Theme state + persistence
│   │   ├── services/
│   │   │   ├── webllm.ts                # WebLLM inference engine (WebGPU)
│   │   │   └── prompts.ts               # System prompts for debater and professor
│   │   ├── App.tsx                       # Application state machine, history, scoring
│   │   ├── types.ts                      # TypeScript type definitions
│   │   └── index.css                     # Design tokens and global styles
│   └── ...
├── server/                              # Express + TypeScript
│   ├── src/
│   │   ├── routes/
│   │   │   └── debate.ts                # POST /api/debate, POST /api/config
│   │   ├── services/
│   │   │   ├── providers.ts             # Ollama / OpenAI / Anthropic adapter
│   │   │   └── prompts.ts               # Server-side system prompts
│   │   └── index.ts                      # Express entry point (port 3001)
│   └── ...
└── package.json                          # Root workspace scripts
```

---

## Configuration

### Server environment variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Server listen port |
| `PROVIDER` | `ollama` | `ollama`, `openai`, or `anthropic` |
| `MODEL` | `llama3.1` | Model identifier |
| `OLLAMA_HOST` | `http://localhost:11434` | Ollama API endpoint |
| `OPENAI_API_KEY` | — | OpenAI API key |
| `ANTHROPIC_API_KEY` | — | Anthropic API key |

### Browser model selection

When using the Browser provider, available models are determined by `@mlc-ai/web-llm`:

- `Llama-3.2-3B-Instruct-q4f16_1-MLC` (default)
- `Llama-3.2-1B-Instruct-q4f16_1-MLC`
- `Gemma-2-2B-it-q4f16_1-MLC`

---

## Local Development

```bash
# Install dependencies for both client and server
npm run install:all

# Start both in development mode
npm run dev

# Type-check the full project
npm run typecheck

# Build the client for production
npm run build
```

---

## Contributing

Bug reports and pull requests are welcome. For major changes, open an issue first to discuss the proposed approach. Ensure `npm run typecheck` passes before submitting a PR.

---

## License

MIT. See [LICENSE](./LICENSE) for details.
