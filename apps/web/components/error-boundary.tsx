"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  /** Optional fallback UI. Defaults to a styled error card. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * React Error Boundary for catching rendering errors.
 *
 * Wrap each screen or section to prevent a single component crash
 * from taking down the entire application.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <RfqDetail ... />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error("[ErrorBoundary] Uncaught error:", error, errorInfo);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }
      return (
        <div
          role="alert"
          style={{
            padding: "32px",
            textAlign: "center",
            color: "var(--text-secondary)",
          }}
        >
          <h2 style={{ fontSize: "18px", fontWeight: 600, marginBottom: "8px", color: "var(--neg)" }}>
            Something went wrong
          </h2>
          <p style={{ fontSize: "13px", marginBottom: "16px" }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </p>
          <button
            className="btn"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            Try Again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
