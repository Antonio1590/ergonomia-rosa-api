import { Component } from "react";
import type { ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  message?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
          <div className="text-4xl mb-3">⚠️</div>
          <p className="font-semibold text-red-800 mb-1">
            {this.props.message ?? "Error inesperado"}
          </p>
          {this.state.error && (
            <p className="text-sm text-red-600 mb-4 font-mono">
              {this.state.error.message}
            </p>
          )}
          <button
            onClick={this.handleReset}
            className="rounded-xl bg-[#006D32] px-4 py-2 text-sm font-semibold text-white hover:bg-[#005224] transition"
          >
            Reintentar
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
