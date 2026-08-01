export const MAX_DIRECT_CHARS = 15000;
export const CHUNK_SIZE = 7000;
export const CHUNK_OVERLAP = 500;
export const MAX_CHUNKS = 5;
export const MAX_SUPPORTED_CHARS = CHUNK_SIZE * MAX_CHUNKS - CHUNK_OVERLAP * (MAX_CHUNKS - 1);

export function splitIntoChunks(text: string): string[] {
  if (text.length <= MAX_DIRECT_CHARS) return [text];
  if (text.length > MAX_SUPPORTED_CHARS) {
    throw new Error(`This document is too long for bounded analysis. Please split it into files smaller than ${MAX_SUPPORTED_CHARS.toLocaleString()} characters.`);
  }

  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end = Math.min(text.length, start + CHUNK_SIZE);
    chunks.push(text.slice(start, end).trim());
    if (end >= text.length) break;
    start = end - CHUNK_OVERLAP;
  }
  return chunks.filter(Boolean);
}

export const CHUNK_ANALYSIS_NOTE = `
This is one section of a longer document. Analyze only the material provided, be concise, and preserve the required output headings. Do not assume this section represents the entire argument.`;

export const SYNTHESIS_PROMPT = `You are the senior editor consolidating several partial analyses of one long argument. Produce one rigorous final analysis from the supplied partial analyses.

Remove duplicates, resolve contradictions conservatively, and do not invent evidence. Preserve the exact output format and headings required by the role prompt. Return only the final structured response, with no editorial commentary.`;

export function buildSynthesisInput(label: string, analyses: string[]): string {
  const sections = analyses.map((analysis, index) => `--- ${label} section ${index + 1} ---\n${analysis.slice(0, 3500)}`);
  return sections.join('\n\n');
}
