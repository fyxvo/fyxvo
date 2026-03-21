"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";

export type ErrorBoundarySection =
  | "gateway-health"
  | "analytics"
  | "notification-bell"
  | "project-list"
  | "default";

interface Props {
  readonly children: ReactNode;
  readonly fallback?: ReactNode;
  readonly section?: ErrorBoundarySection;
  readonly retry?: () => void;
}

interface State {
  readonly hasError: boolean;
}

function GatewayHealthFallback() {
  return (
    <div className="rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-4 py-6 text-center">
      <p className="text-sm text-[var(--fyxvo-text-muted)]">Gateway status unavailable.</p>
      <a
        href="https://status.fyxvo.com"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 inline-block text-xs text-[var(--fyxvo-brand)] underline hover:no-underline"
      >
        View status page
      </a>
    </div>
  );
}

function AnalyticsFallback({ retry }: { readonly retry?: () => void }) {
  return (
    <div className="rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-4 py-6 text-center">
      <p className="text-sm text-[var(--fyxvo-text-muted)]">Analytics unavailable.</p>
      {retry ? (
        <button
          type="button"
          onClick={retry}
          className="mt-3 text-xs text-[var(--fyxvo-brand)] underline hover:no-underline"
        >
          Retry
        </button>
      ) : null}
    </div>
  );
}

function ProjectListFallback() {
  function handleReload() {
    window.location.reload();
  }

  return (
    <div className="rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-4 py-6 text-center">
      <p className="text-sm text-[var(--fyxvo-text-muted)]">Could not load projects.</p>
      <button
        type="button"
        onClick={handleReload}
        className="mt-3 text-xs text-[var(--fyxvo-text-muted)] underline hover:text-[var(--fyxvo-text)]"
      >
        Refresh page
      </button>
    </div>
  );
}

function DefaultFallback({ onRetry }: { readonly onRetry: () => void }) {
  return (
    <div className="rounded-xl border border-[var(--fyxvo-border)] bg-[var(--fyxvo-panel-soft)] px-4 py-6 text-center">
      <p className="text-sm text-[var(--fyxvo-text-muted)]">This section could not be displayed.</p>
      <div className="mt-3 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={onRetry}
          className="text-xs text-[var(--fyxvo-text-muted)] underline hover:text-[var(--fyxvo-text)]"
        >
          Try again
        </button>
        <a
          href="/support"
          className="text-xs text-[var(--fyxvo-brand)] underline hover:no-underline"
        >
          Contact support
        </a>
      </div>
    </div>
  );
}

export class SectionErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, _info: ErrorInfo) {
    // Report to analytics-errors API
    void fetch("/api/analytics-errors", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        component: this.props.section ?? "default",
        message: error.message,
        page: typeof window !== "undefined" ? window.location.pathname : "unknown",
      }),
      keepalive: true,
    }).catch(() => undefined);
  }

  override render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    // If a custom fallback is provided, always use it (backwards compat)
    if (this.props.fallback !== undefined) {
      return this.props.fallback;
    }

    const section = this.props.section ?? "default";

    // Notification bell: render nothing
    if (section === "notification-bell") {
      return null;
    }

    if (section === "gateway-health") {
      return <GatewayHealthFallback />;
    }

    if (section === "analytics") {
      return <AnalyticsFallback {...(this.props.retry ? { retry: this.props.retry } : {})} />;
    }

    if (section === "project-list") {
      return <ProjectListFallback />;
    }

    // default
    return (
      <DefaultFallback onRetry={() => this.setState({ hasError: false })} />
    );
  }
}
