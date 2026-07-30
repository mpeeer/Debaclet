import express from 'express';
import cors from 'cors';
import { debateRouter } from './routes/debate.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));

app.use('/api', debateRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', model: process.env.OLLAMA_MODEL || 'llama3.1' });
});

app.listen(PORT, () => {
  console.log(`\n  🧠 Debalect server running on http://localhost:${PORT}`);
  console.log(`  📡 Using Ollama model: ${process.env.OLLAMA_MODEL || 'llama3.1'}\n`);
});
