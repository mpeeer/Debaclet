import { useState, useRef, DragEvent, useEffect } from 'react';

interface Props {
  onSubmit: (text: string, file: File | null) => void;
  isLoading: boolean;
  error: string | null;
}

export default function InputPanel({ onSubmit, isLoading, error }: Props) {
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const f = files[0];
      const validTypes = ['text/plain', 'text/markdown', 'application/pdf', '.txt', '.md', '.pdf', '.docx'];
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      if (validTypes.includes(f.type) || validTypes.includes(ext)) {
        setFile(f);
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
    if (!text.trim() && !file) return;
    onSubmit(text, file);
  };

  const canSubmit = Boolean(text.trim().length >= 50 || file) && !isLoading;

  // ⌘ + Enter keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: globalThis.KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && canSubmit) {
        e.preventDefault();
        handleSubmit();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [text, file, canSubmit]);

  const removeFile = () => {
    setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Text input */}
      <div className="glass rounded-2xl p-5 transition-all duration-300 focus-within:shadow-glow focus-within:border-accent/30">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste your essay, argument, or any text you'd like rigorously debated..."
          rows={8}
          className="w-full bg-transparent text-white placeholder-zinc-600 resize-none text-[15px] leading-relaxed focus:outline-none"
          disabled={isLoading}
        />
        <div className="flex items-center justify-between mt-3 pt-3 border-t border-surface-border">
          <span className="text-xs text-zinc-600">
            {text.length > 0
              ? `${text.length} characters (min 50)`
              : 'Min 50 characters for meaningful debate'}
          </span>
          <span className="text-xs text-zinc-600">
            <kbd className="px-1.5 py-0.5 text-[11px] rounded bg-white/5 border border-white/10 font-mono">⌘</kbd>
            {' + '}
            <kbd className="px-1.5 py-0.5 text-[11px] rounded bg-white/5 border border-white/10 font-mono">Enter</kbd>
          </span>
        </div>
      </div>

      {/* File upload */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative rounded-2xl border-2 border-dashed transition-all duration-300 p-8 text-center cursor-pointer
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
          <div className="flex items-center justify-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-debate-oxford/10 flex items-center justify-center">
              <svg className="w-5 h-5 text-debate-oxford" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
              </svg>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">{file.name}</p>
              <p className="text-xs text-zinc-500">{(file.size / 1024).toFixed(1)} KB</p>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); removeFile(); }}
              className="ml-2 p-1.5 rounded-lg hover:bg-white/5 text-zinc-500 hover:text-zinc-300 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div>
            <div className="w-12 h-12 mx-auto mb-3 rounded-2xl bg-white/5 flex items-center justify-center">
              <svg className="w-6 h-6 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
              </svg>
            </div>
            <p className="text-sm text-zinc-400">
              <span className="text-zinc-300 font-medium">Drop a file</span> or click to browse
            </p>
            <p className="text-xs text-zinc-600 mt-1">.txt, .md, .pdf, .docx — up to 10MB</p>
          </div>
        )}
      </div>

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
            ? 'bg-white text-black hover:bg-zinc-200 active:scale-[0.98] shadow-lg shadow-white/5'
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
