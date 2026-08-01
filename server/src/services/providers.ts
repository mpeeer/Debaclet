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

export class ProviderTimeoutError extends Error {
  constructor() {
    super('The AI provider timed out while generating a response.');
    this.name = 'ProviderTimeoutError';
  }
}

function requestSignal(timeoutMs: number, externalSignal?: AbortSignal): { signal: AbortSignal; cleanup: () => void } {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(new ProviderTimeoutError()), timeoutMs);
  const abortFromRequest = () => controller.abort(externalSignal?.reason);
  externalSignal?.addEventListener('abort', abortFromRequest, { once: true });
  return {
    signal: controller.signal,
    cleanup: () => {
      clearTimeout(timeout);
      externalSignal?.removeEventListener('abort', abortFromRequest);
    },
  };
}

async function queryOllama(systemPrompt: string, userText: string, externalSignal?: AbortSignal): Promise<string> {
  if (externalSignal?.aborted) throw new DOMException('Request aborted', 'AbortError');
  const request = requestSignal(120000, externalSignal);
  try {
    const res = await fetch(`${config.ollamaHost}/api/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: config.model,
        system: systemPrompt,
        prompt: userText,
        stream: false,
        options: { temperature: 0.7, top_p: 0.9 },
      }),
      signal: request.signal,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Ollama error ${res.status}: ${errText}`);
    }
    const data = (await res.json()) as { response: string };
    return data.response;
  } catch (err) {
    if (request.signal.aborted) throw request.signal.reason || err;
    throw new Error(
      `Could not reach Ollama at ${config.ollamaHost}. Is Ollama installed and running? Run 'ollama serve' in a terminal to start it.`
    );
  } finally {
    request.cleanup();
  }
}

async function checkOllama(externalSignal?: AbortSignal): Promise<boolean> {
  const request = requestSignal(3000, externalSignal);
  try {
    const res = await fetch(`${config.ollamaHost}/api/tags`, { signal: request.signal });
    return res.ok;
  } catch {
    return false;
  } finally {
    request.cleanup();
  }
}

async function queryOpenAI(systemPrompt: string, userText: string, externalSignal?: AbortSignal): Promise<string> {
  if (!config.apiKey) throw new Error('OpenAI API key not set. Configure it in Settings.');
  if (externalSignal?.aborted) throw new DOMException('Request aborted', 'AbortError');
  const request = requestSignal(120000, externalSignal);
  try {
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
      signal: request.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(`OpenAI error ${res.status}: ${err.error?.message || res.statusText}`);
    }
    const data = (await res.json()) as { choices: { message: { content: string } }[] };
    return data.choices[0]?.message.content || '';
  } catch (err) {
    if (request.signal.aborted) throw request.signal.reason || err;
    throw err;
  } finally {
    request.cleanup();
  }
}

async function checkOpenAI(externalSignal?: AbortSignal): Promise<boolean> {
  if (!config.apiKey) return false;
  const request = requestSignal(5000, externalSignal);
  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${config.apiKey}` },
      signal: request.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    request.cleanup();
  }
}

async function queryAnthropic(systemPrompt: string, userText: string, externalSignal?: AbortSignal): Promise<string> {
  if (!config.apiKey) throw new Error('Anthropic API key not set. Configure it in Settings.');
  if (externalSignal?.aborted) throw new DOMException('Request aborted', 'AbortError');
  const request = requestSignal(120000, externalSignal);
  try {
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
      signal: request.signal,
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: { message: res.statusText } }));
      throw new Error(`Anthropic error ${res.status}: ${err.error?.message || res.statusText}`);
    }
    const data = (await res.json()) as { content: { type: string; text: string }[] };
    return data.content.find((b) => b.type === 'text')?.text || '';
  } catch (err) {
    if (request.signal.aborted) throw request.signal.reason || err;
    throw err;
  } finally {
    request.cleanup();
  }
}

async function checkAnthropic(externalSignal?: AbortSignal): Promise<boolean> {
  if (!config.apiKey) return false;
  const request = requestSignal(5000, externalSignal);
  try {
    const res = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': config.apiKey,
        'anthropic-version': '2023-06-01',
      },
      signal: request.signal,
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    request.cleanup();
  }
}

export async function queryAI(systemPrompt: string, userText: string, signal?: AbortSignal): Promise<string> {
  switch (config.provider) {
    case 'openai':
      return queryOpenAI(systemPrompt, userText, signal);
    case 'anthropic':
      return queryAnthropic(systemPrompt, userText, signal);
    case 'ollama':
    default:
      return queryOllama(systemPrompt, userText, signal);
    case 'webllm':
      throw new Error('WebLLM inference runs in the browser — this should not reach the server.');
  }
}

export async function checkHealth(signal?: AbortSignal): Promise<{
  ok: boolean;
  provider: ProviderName;
  model: string;
  message: string;
}> {
  let ok = false;
  let message = '';

  switch (config.provider) {
    case 'openai':
      if (!config.apiKey) message = 'OpenAI API key not set. Add your key in Settings.';
      else {
        ok = await checkOpenAI(signal);
        message = ok ? 'Connected' : 'Could not reach OpenAI API. Check your key and network.';
      }
      break;
    case 'anthropic':
      if (!config.apiKey) message = 'Anthropic API key not set. Add your key in Settings.';
      else {
        ok = await checkAnthropic(signal);
        message = ok ? 'Connected' : 'Could not reach Anthropic API. Check your key and network.';
      }
      break;
    case 'ollama':
    default:
      ok = await checkOllama(signal);
      message = ok
        ? 'Connected'
        : `Ollama is not responding at ${config.ollamaHost}. Make sure Ollama is installed and running with 'ollama serve'.`;
      break;
    case 'webllm':
      ok = true;
      message = 'Browser-based inference runs on your device. No server needed.';
  }

  return { ok, provider: config.provider, model: config.model, message };
}
