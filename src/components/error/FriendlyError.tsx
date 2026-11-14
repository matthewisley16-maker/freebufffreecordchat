import { useState } from "react";
import BuddyRunner from "./BuddyRunner";
import FreecordBuddy from "./FreecordBuddy";
import "./error.css";

/**
 * The friendly error screen: a bobbing purple buddy, plain-language copy and two
 * useful actions (refresh, report) instead of a raw exception. `compact` is the
 * in-page variant used when one feature fails but the rest of Freecord is fine.
 */
export default function FriendlyError({
  eyebrow = "oopsie!",
  title = "Oopsie — that didn't load.",
  text = "That's our fault, not yours. Give it a moment and refresh the page — your messages and communities are safe.",
  label,
  message,
  stack,
  retryLabel = "Refresh the page",
  onRetry,
  onReport,
  reportNote,
  compact = false,
}: {
  eyebrow?: string;
  title?: string;
  text?: string;
  label?: string;
  message?: string;
  stack?: string;
  retryLabel?: string;
  onRetry?: () => void;
  onReport?: () => void;
  reportNote?: string;
  compact?: boolean;
}) {
  const [gameOpen, setGameOpen] = useState(false);

  const actions = (
    <div className="fc-oops-actions">
      {onRetry && (
        <button type="button" className="fc-oops-btn primary" onClick={onRetry}>
          {retryLabel}
        </button>
      )}
      {!compact && (
        <button type="button" className="fc-oops-btn" onClick={() => setGameOpen((open) => !open)}>
          {gameOpen ? "Hide the game" : "Play a tiny game"}
        </button>
      )}
      {onReport && (
        <button type="button" className="fc-oops-btn ghost" onClick={onReport}>
          Report to admin
        </button>
      )}
    </div>
  );

  if (compact) {
    return (
      <div role="alert" className="fc-oops-inline">
        <FreecordBuddy size={68} />
        <strong>Oopsie — {label ?? "that part"} didn&apos;t load.</strong>
        <p>The rest of Freecord is still working.</p>
        {actions}
        {reportNote && <p className="fc-oops-note">{reportNote}</p>}
      </div>
    );
  }

  return (
    <div className="fc-oops">
      <div className="fc-oops-glow" aria-hidden="true" />
      <div className="fc-oops-card">
        <FreecordBuddy size={148} className="fc-oops-buddy" title="The Freecord buddy, looking apologetic" />
        <p className="fc-oops-eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="fc-oops-text">{text}</p>
        {actions}
        {gameOpen && <BuddyRunner />}
        {reportNote && <p className="fc-oops-note">{reportNote}</p>}
        {(message || stack) && (
          <details className="fc-oops-details">
            <summary>What went wrong</summary>
            {message && <p>{message}</p>}
            {stack && <pre>{stack}</pre>}
          </details>
        )}
      </div>
    </div>
  );
}
