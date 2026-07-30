export type ProviderName = 'ollama' | 'openai' | 'anthropic' | 'webllm';
export const VALID_PROVIDERS: ProviderName[] = ['ollama', 'openai', 'anthropic', 'webllm'];

export interface ProviderConfig {
  provider: ProviderName;
  model: string;
  apiKey: string;
  ollamaHost: string;
}

export interface SafeConfig {
  provider: ProviderName;
  model: string;
  hasKey: boolean;
  ollamaHost: string;
}

// In-memory config (resets on server restart)
let config: ProviderConfig = {
  provider: (process.env.PROVIDER as ProviderName) || 'ollama',
  model: process.env.MODEL || process.env.OLLAMA_MODEL || 'llama3.1',
  apiKey: process.env.API_KEY || '',
  ollamaHost: process.env.OLLAMA_HOST || 'http://localhost:11434',
};

export function getSafeConfig(): SafeConfig {
  return {
    provider: config.provider,
    model: config.model,
    hasKey: !!config.apiKey,
    ollamaHost: config.ollamaHost,
  };
}

export function getFullConfig(): ProviderConfig {
  return { ...config };
}

export function updateConfig(partial: Partial<ProviderConfig>): SafeConfig {
  config = { ...config, ...partial };
  return getSafeConfig();
}

// ── Ollama ──────────────────────────────────────────

async function queryOllama(systemPrompt: string, userText: string): Promise<string> {
  const body = {
    model: config.model,
    system: systemPrompt,
    prompt: userText,
    stream: false,
    options: { temperature: 0.7, top_p: 0.9 },
  };

  const res = await fetch(`${config.ollamaHost}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Ollama error ${res.status}: ${errText}`);
  }

  const data = (await res.json()) as { response: string };
  return data.response;
}

async function checkOllama(): Promise<boolean> {
  try {
    const res = await fetch(`${config.ollamaHost}/api/tags`, { signal: AbortSignal.timeout(3000) });
    return res.ok;
  } catch {
    return false;
  }
}

// ── OpenAI ──────────────────────────────────────────

async function queryOpenAI(systemPrompt: string, userText: string): Promise<string> {
  if (!config.apiKey) throw new Error('OpenAI API key not set. Configure it in Settings.');

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${config.apiKey}`,
    },
    body: JSON.stringify({
      model: config.model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userText },
      ],
      temperature: 0.7,
      max_tokens: 4096,
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(`OpenAI error ${res.status}: ${err.error?.message || res.statusText}`);
  }

  const data = (await res.json()) as { choices: { message: { content: string } }[] };
  return data.choices[0].message.content;
}

async function checkOpenAI(): Promise<boolean> {
  if (!config.apiKey) return false;
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${config.apiKey}` },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Anthropic ───────────────────────────────────────

async function queryAnthropic(systemPrompt: string, userText: string): Promise<string> {
  if (!config.apiKey) throw new Error('Anthropic API key not set. Configure it in Settings.');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': config.apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.model || 'claude-3-5-haiku-latest',
      max_tokens: 4096,
      system: systemPrompt,
      messages: [{ role: 'user', content: userText }],
    }),
    signal: AbortSignal.timeout(120000),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
    throw new Error(`Anthropic error ${res.status}: ${err.error?.message || res.statusText}`);
  }

  const data = (await res.json()) as { content: { type: string; text: string }[] };
  const textBlock = data.content.find((b) => b.type === 'text');
  return textBlock?.text || '';
}

async function checkAnthropic(): Promise<boolean> {
  if (!config.apiKey) return false;
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

// ── Unified interface ───────────────────────────────

export async function queryAI(systemPrompt: string, userText: string): Promise<string> {
  switch (config.provider) {
    case 'openai':
      return queryOpenAI(systemPrompt, userText);
    case 'anthropic':
      return queryAnthropic(systemPrompt, userText);
    case 'ollama':
    default:
      return queryOllama(systemPrompt, userText);
    case 'webllm':
      throw new Error('WebLLM inference runs in the browser — this should not reach the server.');
  }
}

export async function checkHealth(): Promise<{
  ok: boolean;
  provider: ProviderName;
  model: string;
  message: string;
}> {
  let ok = false;
  let message = '';

  switch (config.provider) {
    case 'openai':
      if (!config.apiKey) {
        message = 'OpenAI API key not set. Add your key in Settings.';
      } else {
        ok = await checkOpenAI();
        message = ok ? 'Connected' : 'Could not reach OpenAI API. Check your key and network.';
      }
      break;
    case 'anthropic':
      if (!config.apiKey) {
        message = 'Anthropic API key not set. Add your key in Settings.';
      } else {
        ok = await checkAnthropic();
        message = ok ? 'Connected' : 'Could not reach Anthropic API. Check your key and network.';
      }
      break;
    case 'ollama':
    default:
      ok = await checkOllama();
      message = ok ? 'Connected' : 'Ollama is not running. Start it with `ollama serve`.';
      break;
    case 'webllm':
      ok = true;
      message = 'Browser-based inference runs on your device. No server needed.';
  }

  return { ok, provider: config.provider, model: config.model, message };
}
