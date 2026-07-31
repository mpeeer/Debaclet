import { CreateMLCEngine, MLCEngine } from '@mlc-ai/web-llm';

const BROWSER_MODELS = [
  { id: 'Llama-3.2-3B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 3B', size: '~2 GB' },
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', label: 'Llama 3.2 1B', size: '~800 MB' },
  { id: 'Gemma-2-2B-it-q4f16_1-MLC', label: 'Gemma 2 2B', size: '~1.5 GB' },
];

export type { MLCEngine };

let engine: MLCEngine | null = null;
let currentModel: string = '';

export function getAvailableBrowserModels() {
  return BROWSER_MODELS;
}

export function getEngine(): MLCEngine | null {
  return engine;
}

export function getCurrentModel(): string {
  return currentModel;
}

export async function loadModel(
  modelId: string,
  onProgress: (text: string, pct: number) => void,
): Promise<MLCEngine> {
  // If same model already loaded, reuse
  if (engine && currentModel === modelId) {
    onProgress('Model already loaded', 100);
    return engine;
  }

  // Unload previous engine if switching models
  if (engine) {
    engine.unload();
    engine = null;
    currentModel = '';
  }

  engine = await CreateMLCEngine(modelId, {
    initProgressCallback: (report) => {
      const pct = report.progress ? Math.round(report.progress * 100) : 0;
      onProgress(report.text, pct);
    },
  });

  currentModel = modelId;
  return engine;
}

export async function queryBrowserAI(
  modelId: string,
  systemPrompt: string,
  userText: string,
  onProgress: (text: string, pct: number) => void,
): Promise<string> {
  const eng = await loadModel(modelId, onProgress);

  const reply = await eng.chat.completions.create({
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userText },
    ],
    temperature: 0.7,
    max_tokens: 4096,
  });

  return reply.choices[0].message.content || '';
}

export function isWebGPUSupported(): boolean {
  if (typeof navigator === 'undefined') return false;
  if (!('gpu' in navigator)) return false;
  return true;
}
