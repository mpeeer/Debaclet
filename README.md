# 🧠 Debalect

**Open-source cognitive training platform.** Submit your argument. Face a world-class Oxford Union debate opponent and receive rigorous logical analysis from a university professor — all running locally on your machine.

> No cloud. No API keys. No AI fluff. Just your ideas against the best counterarguments, powered by local AI via [Ollama](https://ollama.com).

---

## Architecture

```
┌────────────────────────────────────────────────────┐
│                  Debalect                          │
│                                                    │
│  ┌──────────────┐          ┌───────────────────┐  │
│  │   Frontend   │  HTTP    │     Backend       │  │
│  │  React+Vite  │◄────────►│  Express+Node.js  │  │
│  │  TailwindCSS │  :5173   │  Port :3001       │  │
│  └──────────────┘          └────────┬──────────┘  │
│                                     │              │
│                           ┌─────────▼──────────┐  │
│                           │      Ollama        │  │
│                           │  Local LLM Server  │  │
│                           │  Port :11434       │  │
│                           └────────────────────┘  │
│                                                    │
│  Two AI Personas:                                  │
│  ▸ Oxford Union Debater — Counterarguments         │
│  ▸ Logic Professor — Logical analysis              │
└────────────────────────────────────────────────────┘
```

## Features

- **📄 File Upload** — Submit `.txt`, `.md`, `.pdf`, or `.docx` files (drag & drop)
- **📝 Text Paste** — Or paste your essay directly
- **🎭 Dual Analysis** — Both the debater and professor analyze in parallel
- **🔍 Structured Output** — Parsed and beautifully displayed counterarguments with collapsible cards
- **🎨 Apple/Windows Minimal Design** — Dark theme, glass morphism, smooth animations
- **🔒 100% Local** — Everything runs on your machine; your ideas never leave it

## Prerequisites

- **Node.js** ≥ 18
- **Ollama** installed and running with a model pulled

### Install Ollama

```bash
# macOS / Linux
curl -fsSL https://ollama.com/install.sh | sh

# Windows
# Download from https://ollama.com/download/windows
```

### Pull a Model

```bash
ollama pull llama3.1     # Recommended (~8B params, great quality)
# or
ollama pull mistral       # Faster, smaller (~7B params)
# or
ollama pull llama3.2      # Lightweight (~3B params)
```

Set the model in your environment:
```bash
export OLLAMA_MODEL=llama3.1   # default: llama3.1
```

## Quick Start

```bash
# 1. Install dependencies
npm run install:all

# 2. Start both frontend and backend
npm run dev

# Frontend: http://localhost:5173
# Backend:  http://localhost:3001
```

Or run them separately:
```bash
# Terminal 1 — Backend
npm run dev:server

# Terminal 2 — Frontend
npm run dev:client
```

## Usage

1. **Ensure Ollama is running** — `ollama serve` in a terminal (or use the Ollama app)
2. Open `http://localhost:5173`
3. Paste your essay or drag a file into the upload zone
4. Click **Begin Debate**
5. Browse the counterarguments (expand each card) and professor's logical analysis
6. Click **New debate** to start fresh

## How It Works

1. Your text is sent to the Express backend
2. The backend sends it to Ollama with **two different system prompts** in parallel:
   - **Oxford Union Debater** — Trained to find the strongest counterarguments with evidence, rhetoric, and real-world examples
   - **Logic Professor** — Trained to reconstruct the argument, identify premises/assumptions, detect fallacies, and give an epistemic verdict
3. Responses are parsed and displayed in a structured UI

## Customization

### Change the LLM Model

```bash
OLLAMA_MODEL=mistral npm run dev
```

### Change Ollama Host

```bash
OLLAMA_HOST=http://192.168.1.100:11434 npm run dev
```

### Customize the Personas

Edit `server/src/services/prompts.ts` to modify the system prompts for the debater or professor.

## Project Structure

```
debalect/
├── client/                  # React + Vite + TailwindCSS
│   ├── src/
│   │   ├── components/
│   │   │   ├── Header.tsx           # Sticky glass header
│   │   │   ├── InputPanel.tsx       # Text area + file upload
│   │   │   ├── DebateView.tsx       # Tab switcher (debater/professor)
│   │   │   ├── CounterArgument.tsx  # Parsed counterargument cards
│   │   │   └── ProfessorNote.tsx    # Parsed logical analysis
│   │   ├── App.tsx                  # Main state machine
│   │   ├── types.ts                 # Shared types
│   │   └── index.css                # Global styles + design tokens
│   └── ...
├── server/                  # Express + TypeScript
│   ├── src/
│   │   ├── routes/
│   │   │   └── debate.ts            # POST /api/debate endpoint
│   │   ├── services/
│   │   │   ├── ollama.ts            # Ollama API client
│   │   │   └── prompts.ts           # System prompts for both personas
│   │   └── index.ts                 # Express server entry
│   └── ...
└── package.json             # Root scripts
```

## License

MIT — Open source. Use it, fork it, improve it.

---

<p align="center">
  <sub>Built for sharper thinking. No cloud required.</sub>
</p>
