import { Router, Request, Response } from 'express';
import multer from 'multer';
import { queryAI, checkHealth, getSafeConfig, updateConfig, VALID_PROVIDERS } from '../services/providers.js';
import { OXFORD_DEBATER_PROMPT, LOGIC_PROFESSOR_PROMPT } from '../services/prompts.js';

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

// ── Debate endpoint ─────────────────────────────────

debateRouter.post('/debate', upload.single('file'), async (req: Request, res: Response) => {
  try {
    let text = '';

    if (req.file) {
      text = extractTextFromBuffer(req.file.buffer, req.file.mimetype, req.file.originalname);
    } else if (req.body.text) {
      text = req.body.text;
    } else {
      res.status(400).json({ error: 'Please provide either a file or text content.' });
      return;
    }

    if (text.length < 50) {
      res.status(400).json({ error: 'Text is too short. Please provide at least 50 characters for meaningful debate.' });
      return;
    }

    if (text.length > 15000) {
      text = text.slice(0, 15000) + '\n\n[...text truncated for length]';
    }

    // Check provider health
    const health = await checkHealth();
    if (!health.ok) {
      res.status(503).json({ error: health.message });
      return;
    }

    console.log(`Processing debate request (${text.length} chars, provider: ${health.provider})...`);

    const [debaterResponse, professorResponse] = await Promise.all([
      queryAI(OXFORD_DEBATER_PROMPT, text),
      queryAI(LOGIC_PROFESSOR_PROMPT, text),
    ]);

    res.json({
      originalLength: text.length,
      debater: debaterResponse,
      professor: professorResponse,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('Debate error:', message);
    res.status(500).json({ error: message });
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
