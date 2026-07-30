import { Router, Request, Response } from 'express';
import multer from 'multer';
import { queryOllama, checkOllamaHealth } from '../services/ollama.js';
import { OXFORD_DEBATER_PROMPT, LOGIC_PROFESSOR_PROMPT } from '../services/prompts.js';

export const debateRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
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
  // For text-based files, decode directly
  if (mimetype === 'text/plain' || mimetype === 'text/markdown' || filename.match(/\.(txt|md)$/i)) {
    return buffer.toString('utf-8');
  }

  // For PDFs (basic extraction - proper PDF parsing requires pdf-parse)
  if (mimetype === 'application/pdf' || filename.endsWith('.pdf')) {
    try {
      // Try to extract readable text; binary PDFs will produce garbage
      const text = buffer.toString('utf-8');
      // Basic check if it looks like text content
      if (text.match(/[a-zA-Z]{4,}/)) {
        return text;
      }
      return '[PDF file detected. For best results, please paste the text content directly or convert to .txt. Basic text extraction attempted but may be incomplete.]';
    } catch {
      return '[Unable to extract text from PDF. Please paste the content directly or use a .txt file.]';
    }
  }

  // DOCX - basic extraction attempt
  if (filename.match(/\.docx?$/i)) {
    try {
      const text = buffer.toString('utf-8');
      if (text.match(/[a-zA-Z]{4,}/)) {
        return text;
      }
      return '[Word document detected. For best results, please paste the text content directly or convert to .txt. Basic text extraction attempted but may be incomplete.]';
    } catch {
      return '[Unable to extract text from document. Please paste the content directly or use a .txt file.]';
    }
  }

  return buffer.toString('utf-8');
}

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

    const isHealthy = await checkOllamaHealth();
    if (!isHealthy) {
      res.status(503).json({
        error: 'Ollama is not running. Please start Ollama and ensure a model is loaded.',
        hint: 'Run: ollama serve  and then: ollama pull llama3.1',
      });
      return;
    }

    console.log(`\n📝 Processing debate request (${text.length} chars)...`);

    // Run both in parallel for speed
    const [debaterResponse, professorResponse] = await Promise.all([
      queryOllama(OXFORD_DEBATER_PROMPT, text),
      queryOllama(LOGIC_PROFESSOR_PROMPT, text),
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

debateRouter.get('/health', async (_req: Request, res: Response) => {
  const isHealthy = await checkOllamaHealth();
  res.json({
    ollama: isHealthy,
    model: process.env.OLLAMA_MODEL || 'llama3.1',
  });
});
