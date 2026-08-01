import { Router, Request, Response } from 'express';
import multer from 'multer';
import { queryAI, checkHealth, getSafeConfig, updateConfig, VALID_PROVIDERS } from '../services/providers.js';
import { OXFORD_DEBATER_PROMPT, LOGIC_PROFESSOR_PROMPT } from '../services/prompts.js';
import { buildSynthesisInput, CHUNK_ANALYSIS_NOTE, splitIntoChunks, SYNTHESIS_PROMPT } from '../services/chunking.js';

export const debateRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'text/plain',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/markdown',
    ];
    if (allowed.includes(file.mimetype) || file.originalname.match(/\.(txt|md|pdf|docx?)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file type. Please upload .txt, .md, .pdf, or .docx files.'));
    }
  },
});

function extractTextFromBuffer(buffer: Buffer, mimetype: string, filename: string): string {
  if (mimetype === 'text/plain' || mimetype === 'text/markdown' || filename.match(/\.(txt|md)$/i)) {
    return buffer.toString('utf-8');
  }

  if (mimetype === 'application/pdf' || filename.endsWith('.pdf')) {
    try {
      const text = buffer.toString('utf-8');
      if (text.match(/[a-zA-Z]{4,}/)) return text;
      return '[PDF file detected. For best results, convert to .txt. Basic extraction attempted but may be incomplete.]';
    } catch {
      return '[Unable to extract text from PDF. Please use a .txt file.]';
    }
  }

  if (filename.match(/\.docx?$/i)) {
    try {
      const text = buffer.toString('utf-8');
      if (text.match(/[a-zA-Z]{4,}/)) return text;
      return '[Word document detected. For best results, convert to .txt. Basic extraction attempted but may be incomplete.]';
    } catch {
      return '[Unable to extract text from document. Please use a .txt file.]';
    }
  }

  return buffer.toString('utf-8');
}

async function analyzeText(text: string, signal: AbortSignal): Promise<{ debater: string; professor: string }> {
  const chunks = splitIntoChunks(text);
  if (chunks.length === 1) {
    const [debater, professor] = await Promise.all([
      queryAI(OXFORD_DEBATER_PROMPT, chunks[0], signal),
      queryAI(LOGIC_PROFESSOR_PROMPT, chunks[0], signal),
    ]);
    return { debater, professor };
  }

  const debaterParts: string[] = [];
  const professorParts: string[] = [];

  // Process sections sequentially to keep local and hosted provider resource use bounded.
  for (let i = 0; i < chunks.length; i += 1) {
    if (signal.aborted) throw new DOMException('Request aborted', 'AbortError');
    const section = `${chunks[i]}\n\n${CHUNK_ANALYSIS_NOTE}`;
    const [debater, professor] = await Promise.all([
      queryAI(OXFORD_DEBATER_PROMPT, section, signal),
      queryAI(LOGIC_PROFESSOR_PROMPT, section, signal),
    ]);
    debaterParts.push(debater);
    professorParts.push(professor);
  }

  if (signal.aborted) throw new DOMException('Request aborted', 'AbortError');

  const [debater, professor] = await Promise.all([
    queryAI(`${OXFORD_DEBATER_PROMPT}\n\n${SYNTHESIS_PROMPT}`, buildSynthesisInput('Debater', debaterParts), signal),
    queryAI(`${LOGIC_PROFESSOR_PROMPT}\n\n${SYNTHESIS_PROMPT}`, buildSynthesisInput('Professor', professorParts), signal),
  ]);
  return { debater, professor };
}

// ── Debate endpoint ─────────────────────────────────

debateRouter.post('/debate', upload.single('file'), async (req: Request, res: Response) => {
  const controller = new AbortController();
  let responseSent = false;
  const abortIfDisconnected = () => {
    if (!responseSent) controller.abort();
  };
  req.on('aborted', abortIfDisconnected);
  res.on('close', abortIfDisconnected);

  try {
    let text = '';

    if (req.file) {
      text = extractTextFromBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
    } else if (req.body.text) {
      text = req.body.text;
    } else {
      responseSent = true;
      res.status(400).json({ error: 'Please provide either a file or text content.' });
      return;
    }

    if (text.length < 50) {
      responseSent = true;
      res.status(400).json({ error: 'Text is too short. Please provide at least 50 characters for meaningful debate.' });
      return;
    }

    const health = await checkHealth(controller.signal);
    if (controller.signal.aborted || req.destroyed) return;
    if (!health.ok) {
      responseSent = true;
      res.status(503).json({ error: health.message });
      return;
    }

    console.log(`Processing debate request (${text.length} chars, provider: ${health.provider})...`);
    const data = await analyzeText(text, controller.signal);

    if (controller.signal.aborted || req.destroyed) return;
    responseSent = true;
    res.json({
      originalLength: text.length,
      debater: data.debater,
      professor: data.professor,
    });
  } catch (err) {
    if (controller.signal.aborted || (err instanceof DOMException && err.name === 'AbortError') || req.destroyed) return;
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Debate error:', message);
    responseSent = true;
    res.status(500).json({ error: message });
  } finally {
    req.off('aborted', abortIfDisconnected);
    res.off('close', abortIfDisconnected);
  }
});

// ── Config & health endpoints ───────────────────────

debateRouter.get('/config', (_req: Request, res: Response) => {
  res.json(getSafeConfig());
});

debateRouter.post('/config', (req: Request, res: Response) => {
  const { provider, model, apiKey } = req.body;

  if (provider && !VALID_PROVIDERS.includes(provider)) {
    res.status(400).json({ error: `Invalid provider. Choose: ${VALID_PROVIDERS.join(', ')}` });
    return;
  }

  const update: Partial<{ provider: string; model: string; apiKey: string }> = {};
  if (provider) update.provider = provider;
  if (model) update.model = model;
  if (apiKey !== undefined) update.apiKey = apiKey;

  const cfg = updateConfig(update as Partial<{ provider: typeof VALID_PROVIDERS[number]; model: string; apiKey: string }>);
  res.json(cfg);
});

debateRouter.get('/health', async (_req: Request, res: Response) => {
  const health = await checkHealth();
  res.json(health);
});
