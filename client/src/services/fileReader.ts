import * as pdfjsLib from 'pdfjs-dist';
import workerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

// Bundle the worker locally instead of relying on a CDN
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;

/**
 * Read a file's text content. Handles:
 * - .txt, .md — plain text via FileReader
 * - .pdf — text extraction via pdf.js
 * - .docx — not supported client-side (returns an error)
 */
export async function readFileContent(file: File): Promise<string> {
  const ext = file.name.split('.').pop()?.toLowerCase();
  const isPdf = ext === 'pdf' || file.type === 'application/pdf';
  const isDocx = ext === 'docx' || file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';

  if (isDocx) {
    throw new Error('DOCX files require the server backend. Save as .txt, .md, or .pdf for browser mode.');
  }

  if (isPdf) {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const pageTexts: string[] = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ('str' in item ? item.str : ''))
        .join(' ');
      pageTexts.push(pageText);
    }
    return pageTexts.join('\n').trim();
  }

  // Plain text files (.txt, .md, etc.)
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsText(file);
  });
}
