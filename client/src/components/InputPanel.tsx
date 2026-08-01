import { useState, useRef, DragEvent, useEffect } from 'react';
import { readFileContent } from '../services/fileReader';

interface Props {
  onSubmit: (text: string, file: File | null) => void;
  isLoading: boolean;
  error: string | null;
}

/** Return the most relevant contextual tip for a given error message */
function getErrorTip(error: string): string | null {
  const msg = error.toLowerCase();
  if (msg.includes('webgpu')) {
    return '💡 Try using Chrome 113+ or Edge 113+, or switch to a different AI provider in Settings.';
  }
  if (msg.includes('too short') || msg.includes('50 characters')) {
    return '💡 A good debate needs substance — try uploading a longer document with at least a full paragraph.';
  }
  if (msg.startsWith('docx') || msg.includes('docx files require')) {
    return '💡 Save your document as .txt, .md, or .pdf to use browser mode.';
  }
  if (msg.includes('failed to fetch') || msg.includes('networkerror')) {
    return '💡 Check your internet connection — the AI model needs to download on first use. VPNs or firewalls may block it.';
  }
  if (msg.includes('corrupted') || (msg.includes('pdf') && !msg.includes('docx'))) {
    return '💡 This PDF might be scanned or image-based. Try a text-based PDF, or upload a .txt file instead.';
  }
  return '💡 Try again with a different file, or check your internet connection if the AI model hasn\'t downloaded yet.';
}

export default function InputPanel({ onSubmit, isLoading, error }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const previewIdRef = useRef(0);

  const readPreview = async (f: File) => {
    const id = ++previewIdRef.current;
    try {
      const text = await readFileContent(f);
      if (id === previewIdRef.current) {
        setPreview(text.slice(0, 800));
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
      const validTypes = ['text/plain', 'text/markdown', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', '.txt', '.md', '.pdf', '.docx'];
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      if (validTypes.includes(f.type) || validTypes.includes(ext)) {
        setFile(f);
        readPreview(f);
      } else {
        alert('Unsupported file type. Please use .txt, .md, .pdf, or .docx files.');
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

  const handleSubmit = () => {
    if (!file) return;
    onSubmit('', file);
  };

  const canSubmit = Boolean(file) && !isLoading;

  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSubmit) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [file, canSubmit]);

  const removeFile = () => {
    setFile(null);
    setPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const errorTip = error ? getErrorTip(error) : null;

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="eyebrow mb-2">Start an analysis</p>
          <h2 className="text-lg sm:text-xl font-semibold tracking-tight" style={{ color: 'rgb(var(--text))' }}>Upload a document to begin</h2>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-medium" style={{ color: 'rgb(var(--text-muted))' }}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Private by default
        </span>
      </div>

      {/* File upload zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-2xl border-2 border-dashed transition-all duration-300 p-8 sm:p-10 text-center cursor-pointer surface-card hover-lift
          ${isDragging
            ? 'border-accent bg-accent/[0.08] shadow-glow scale-[1.01]'
            : file
              ? 'border-emerald-500/30 bg-emerald-500/[0.04]'
              : 'border-surface-border hover:border-zinc-500/50 bg-transparent hover:bg-white/[0.02]'
          }
        `}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".txt,.md,.pdf,.docx"
          onChange={(e) => handleFileChange(e.target.files)}
          className="hidden"
        />

        {file ? (
          <div className="flex items-center justify-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-debate-oxford/10 flex items-center justify-center">
              <svg className="w-6 h-6 text-debate-oxford" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium" style={{ color: 'rgb(var(--text))' }}>{file.name}</p>
              <p className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); removeFile(); }}
              className="ml-2 p-1.5 rounded-lg hover:bg-white/5 transition-colors"
              style={{ color: 'rgb(var(--text-muted))' }}
              aria-label="Remove selected file"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div>
            <div className="w-14 h-14 mx-auto mb-5 rounded-2xl bg-accent/10 border border-accent/15 flex items-center justify-center">
              <svg className="w-7 h-7" style={{ color: 'rgb(var(--text-muted))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <p className="text-[15px]" style={{ color: 'rgb(var(--text-secondary))' }}>
              <span className="font-semibold" style={{ color: 'rgb(var(--text))' }}>Drop your document</span> or click to browse
            </p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
              className="mt-4 inline-flex items-center justify-center rounded-lg bg-accent px-3.5 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-500 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2"
            >
              Browse files
            </button>
            <p className="text-xs mt-3" style={{ color: 'rgb(var(--text-muted))' }}>.txt .md .pdf .docx &mdash; up to 10MB</p>
          </div>
        )}
      </div>

      {/* File preview */}
      {preview && (
        <div className="glass rounded-2xl p-5 animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
              Preview
            </span>
            <span className="text-xs" style={{ color: 'rgb(var(--text-muted))' }}>
              First {preview.length} characters
            </span>
          </div>
          <div
            className="text-sm leading-relaxed whitespace-pre-wrap font-mono max-h-48 overflow-y-auto"
            style={{ color: 'rgb(var(--text-secondary))' }}
          >
            {preview}
            {preview.length >= 800 && (
              <span style={{ color: 'rgb(var(--text-muted))' }}>...</span>
            )}
          </div>
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="relative glass rounded-2xl p-5 border-red-500/20 bg-red-500/[0.03] animate-fade-in overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-red-500/40 to-transparent" />
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-300 mb-1">Something went wrong</p>
              <p className="text-sm text-red-400/80 leading-relaxed">{error}</p>
              {errorTip && (
                <div className="mt-3 pt-3 border-t border-red-500/10">
                  <p className="text-xs text-red-400/60">{errorTip}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`
          w-full py-3.5 px-6 rounded-xl font-semibold text-sm transition-all duration-300
          ${canSubmit
            ? 'bg-accent text-white hover:bg-blue-500 hover:shadow-lg hover:shadow-accent/20 active:scale-[0.98]'
            : 'bg-white/[0.04] text-zinc-600 cursor-not-allowed'
          }
        `}
      >
        {isLoading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Debating...
          </span>
        ) : (            'Run analysis'
        )}
      </button>
    </div>
  );
}
