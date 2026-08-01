import { useState, useRef, DragEvent, useEffect } from 'react';
import { readFileContent } from '../services/fileReader';

interface Props {
  onSubmit: (text: string, file: File | null) => void;
  onRetry?: () => void;
  isLoading: boolean;
  error: string | null;
  initialText?: string;
  initialFile?: File | null;
}

const VALID_TYPES = ['text/plain', 'text/markdown', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];

export default function InputPanel({ onSubmit, onRetry, isLoading, error, initialText = '', initialFile = null }: Props) {
  const [mode, setMode] = useState<'document' | 'text'>(initialText && !initialFile ? 'text' : 'document');
  const [text, setText] = useState(initialText);
  const [file, setFile] = useState<File | null>(initialFile);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [typeError, setTypeError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewIdRef = useRef(0);

  const readPreview = async (f: File) => {
    const id = ++previewIdRef.current;
    try {
      const text = await readFileContent(f);
      if (id === previewIdRef.current) {
        setPreview(text.slice(0, 600));
      }
    } catch {
      if (id === previewIdRef.current) {
        setPreview(null);
      }
    }
  };

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const f = files[0];
      const ext = '.' + (f.name.split('.').pop()?.toLowerCase() || '');
      if (VALID_TYPES.includes(f.type) || ['.txt', '.md', '.pdf', '.docx'].includes(ext)) {
        setFile(f);
        setText('');
        setTypeError(null);
        readPreview(f);
      } else {
        setTypeError('Unsupported file type. Use .txt, .md, .pdf, or .docx.');
      }
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  useEffect(() => {
    setText(initialText);
    setFile(initialFile);
    setMode(initialText && !initialFile ? 'text' : 'document');
    if (initialFile) {
      readPreview(initialFile);
    } else {
      setPreview(null);
    }
  }, [initialText, initialFile]);

  const handleSubmit = () => {
    if (!text.trim() && !file) return;
    onSubmit(text.trim(), file);
  };

  const canSubmit = Boolean(text.trim() || file) && !isLoading;

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSubmit) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, text, canSubmit]);

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4 text-[13px]">
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'document'}
          onClick={() => { setMode('document'); setText(''); }}
          className="hover:opacity-100 transition-opacity"
          style={{ color: mode === 'document' ? 'rgb(var(--text))' : 'rgb(var(--text-muted))' }}
        >
          {mode === 'document' ? '▸' : ' '} Document
        </button>
        <span style={{ color: 'rgb(var(--text-muted))' }}>·</span>
        <button
          type="button"
          role="tab"
          aria-selected={mode === 'text'}
          onClick={() => { setMode('text'); setFile(null); setPreview(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}
          className="hover:opacity-100 transition-opacity"
          style={{ color: mode === 'text' ? 'rgb(var(--text))' : 'rgb(var(--text-muted))' }}
        >
          {mode === 'text' ? '▸' : ' '} Text
        </button>
      </div>

      {mode === 'text' ? (
        <div className="space-y-1.5">
          <textarea
            value={text}
            onChange={(e) => { setText(e.target.value); if (file) { setFile(null); setPreview(null); } }}
            placeholder="Paste an argument, essay, or position."
            rows={10}
            maxLength={33000}
            className="w-full rounded-md border border-surface-border bg-surface-raised px-3 py-3 text-[14px] leading-relaxed focus:border-accent"
            style={{ color: 'rgb(var(--text))' }}
            aria-label="Argument text"
          />
          <div className="flex items-center justify-between text-[12px] font-mono" style={{ color: 'rgb(var(--text-muted))' }}>
            <span>{text.length.toLocaleString()} / 33,000</span>
            <span>min 50 chars</span>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={[
            'rounded-md border border-dashed px-4 py-6 cursor-pointer transition-colors text-center',
            isDragging
              ? 'border-accent bg-surface-overlay'
              : file
                ? 'border-surface-border'
                : 'border-surface-border hover:bg-surface-overlay',
          ].join(' ')}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.pdf,.docx"
            onChange={(e) => handleFileChange(e.target.files)}
            className="hidden"
          />

          {file ? (
            <div className="flex items-center justify-center gap-3">
              <div className="text-[14px]" style={{ color: 'rgb(var(--text))' }}>
                {file.name}
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(); }}
                className="text-[12px] hover:underline"
                style={{ color: 'rgb(var(--text-muted))' }}
                aria-label="Remove selected file"
              >
                remove
              </button>
            </div>
          ) : (
            <div className="text-[14px]" style={{ color: 'rgb(var(--text-secondary))' }}>
              Drop a file or <span style={{ color: 'rgb(var(--accent))' }}>click to browse</span>
              <div className="text-[12px] mt-1 font-mono" style={{ color: 'rgb(var(--text-muted))' }}>
                .txt .md .pdf .docx
              </div>
            </div>
          )}
        </div>
      )}

      {preview && (
        <div className="border border-surface-border rounded-md p-3">
          <div className="flex items-center justify-between mb-2 text-[12px] font-mono" style={{ color: 'rgb(var(--text-muted))' }}>
            <span>preview</span>
            <span>first {preview.length} chars</span>
          </div>
          <div
            className="text-[13px] leading-relaxed whitespace-pre-wrap font-mono max-h-40 overflow-y-auto"
            style={{ color: 'rgb(var(--text-secondary))' }}
          >
            {preview}
            {preview.length >= 600 && <span style={{ color: 'rgb(var(--text-muted))' }}>…</span>}
          </div>
        </div>
      )}

      {(error || typeError) && (
        <div className="border border-surface-border rounded-md p-3 text-[13px] leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
          <div className="font-medium mb-1" style={{ color: 'rgb(var(--text))' }}>Error</div>
          <div>{error || typeError}</div>
          {onRetry && !typeError && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-2 text-[12px] hover:underline"
              style={{ color: 'rgb(var(--accent))' }}
            >
              Retry
            </button>
          )}
        </div>
      )}

      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={[
          'w-full py-2.5 rounded-md text-[14px] font-medium transition-colors',
          canSubmit
            ? 'bg-fg btn-invert hover:opacity-90'
            : 'border border-surface-border cursor-not-allowed',
        ].join(' ')}
        style={canSubmit ? undefined : { color: 'rgb(var(--text-muted))' }}
      >
        {isLoading ? (
          <span className="inline-flex items-center justify-center gap-2">
            <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24" aria-hidden="true">
              <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
            </svg>
            Running…
          </span>
        ) : (
          'Analyze'
        )}
      </button>
    </div>
  );
}
