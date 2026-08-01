import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
  onReset: () => void;
}

interface State {
  hasError: boolean;
  error: string | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center px-4" style={{ color: 'rgb(var(--text))' }}>
          <div className="max-w-md space-y-3 text-center">
            <div className="text-[13px] font-mono uppercase tracking-wider" style={{ color: 'rgb(var(--text-muted))' }}>
              Error
            </div>
            <p className="text-[14px] leading-relaxed" style={{ color: 'rgb(var(--text-secondary))' }}>
              {this.state.error || 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                this.props.onReset();
              }}
              className="text-[13px] underline underline-offset-2 hover:opacity-80"
              style={{ color: 'rgb(var(--accent))' }}
            >
              Start fresh
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
