import express from 'express';
import cors from 'cors';
import { debateRouter } from './routes/debate.js';
import { getSafeConfig } from './services/providers.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '50mb' }));

app.use('/api', debateRouter);

app.listen(PORT, () => {
  const cfg = getSafeConfig();
  console.log(`\n  Debalect server running on http://localhost:${PORT}`);
  console.log(`  Provider: ${cfg.provider}  |  Model: ${cfg.model}\n`);
});
