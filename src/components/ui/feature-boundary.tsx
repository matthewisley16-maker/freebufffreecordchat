import { recordServiceError } from "@/lib/diagnostics";
import { requestReport } from "@/lib/report-problem";
import { Component, Fragment, type ErrorInfo, type ReactNode } from "react";
import FriendlyError from "@/components/error/FriendlyError";

/**
 * FeatureBoundary — an in-app error boundary.
 *
 * Convex `useQuery` hooks throw on failure, and an uncaught throw in one feature
 * (a message list, the GIF picker, an admin query, …) would otherwise unmount the
 * whole React tree and leave a blank/black page. Wrapping each independent
 * feature in this boundary keeps every *other* part of Freecord interactive: only
 * the failing feature shows an error state, and "Try again" remounts just that
 * subtree so its queries retry.
 *
 * It is intentionally NOT a global/loading gate: it never blocks the app and it
 * is never used to communicate background maintenance.
 */
export class FeatureBoundary extends Component<
  {
    children: ReactNode;
    /** Short, human label for what failed, e.g. "Messages". */
    label?: string;
    /** Custom fallback. When omitted a compact inline notice is shown. */
    fallback?: ReactNode;
    /** Stretch to fill the parent region instead of sitting inline. */
    block?: boolean;
    className?: string;
  },
  { error: Error | null; attempt: number }
> {
  state: { error: Error | null; attempt: number } = { error: null, attempt: 0 };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // Kept in the console only — never surfaced as a page-wide failure state.
    console.error(`[Freecord] ${this.props.label ?? "feature"} failed:`, error, info.componentStack);
    // Recorded as a FEATURE failure: it appears in the diagnostic report but is
    // never allowed to claim that the connection/backend is down.
    recordServiceError(error, "feature");
  }

  private reset = () => this.setState((s) => ({ error: null, attempt: s.attempt + 1 }));

  render() {
    if (this.state.error) {
      if (this.props.fallback !== undefined) return this.props.fallback;
      const label = this.props.label ?? "This part of Freecord";
      return (
        <div role="alert" className={this.props.className}>
          <FriendlyError
            compact
            label={label}
            onRetry={this.reset}
            onReport={() =>
              requestReport({
                message: this.state.error?.message || "Unknown error",
                stack: this.state.error?.stack,
                source: this.props.label ?? "feature",
              })
            }
          />
        </div>
      );
    }
    // `key={attempt}` remounts the subtree on retry so its queries re-run.
    return <Fragment key={this.state.attempt}>{this.props.children}</Fragment>;
  }
}
