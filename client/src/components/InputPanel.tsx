import { useState, useRef, DragEvent, useEffect } from 'react';

interface Props {
  onSubmit: (text: string, file: File | null) => void;
  isLoading: boolean;
  error: string | null;
}

export default function InputPanel({ onSubmit, isLoading, error }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readPreview = (f: File) => {
    const ext = f.name.split('.').pop()?.toLowerCase();
    const isText = ext === 'txt' || ext === 'md' || f.type === 'text/plain' || f.type === 'text/markdown';
    if (!isText) {
      setPreview(null);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      setPreview(text.slice(0, 800));
    };
    reader.readAsText(f);
  };

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const f = files[0];
      const validTypes = ['text/plain', 'text/markdown', 'application/pdf', '.txt', '.md', '.pdf', '.docx'];
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

  return (
    <div className="space-y-4 animate-fade-in">
      {/* File upload zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-2xl border-2 border-dashed transition-all duration-300 p-10 text-center cursor-pointer
          ${isDragging
            ? 'border-accent bg-accent/5 shadow-glow'
            : file
              ? 'border-debate-oxford/40 bg-debate-oxford/5'
              : 'border-surface-border hover:border-zinc-600 bg-transparent'
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
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div>
            <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-white/5 flex items-center justify-center">
              <svg className="w-7 h-7" style={{ color: 'rgb(var(--text-muted))' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <p className="text-sm" style={{ color: 'rgb(var(--text-secondary))' }}>
              <span className="font-medium" style={{ color: 'rgb(var(--text))' }}>Drop your file</span> or click to browse
            </p>
            <p className="text-xs mt-1.5" style={{ color: 'rgb(var(--text-muted))' }}>.txt .md .pdf .docx &mdash; up to 10MB</p>
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
        <div className="glass rounded-xl p-4 border-red-500/20 bg-red-500/5 animate-slide-in">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-400">Could not process your request</p>
              <p className="text-xs text-red-400/70 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={!canSubmit}
        className={`
          w-full py-3.5 px-6 rounded-xl font-medium text-sm transition-all duration-300
          ${canSubmit
            ? 'bg-white text-black hover:bg-zinc-200 active:scale-[0.98]'
            : 'bg-white/5 text-zinc-600 cursor-not-allowed'
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
        ) : (
          'Begin Debate'
        )}
      </button>
    </div>
  );
}
