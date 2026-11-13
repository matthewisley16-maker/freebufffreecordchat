/**
 * The bridge between "somewhere an error happened" and the one report dialog.
 *
 * Error boundaries and window listeners are not all inside the same React tree
 * (the root crash boundary renders BEFORE the Convex provider), so they cannot
 * render a mutation-backed dialog themselves. They call `requestReport` instead;
 * the single `<ReportProblem />` mounted inside the providers opens. When even
 * that is impossible (a full-page crash), `queueReport` keeps the report in
 * localStorage and `takeQueuedReports` sends it on the next successful load.
 */

export type ProblemReport = {
  message: string;
  stack?: string;
  /** Where it came from: a feature label, "window", "promise", "root"… */
  source?: string;
  url?: string;
};

type Listener = (report: ProblemReport) => void;

let listener: Listener | null = null;
const listeners = new Set<Listener>();

/** Register the dialog. Multiple mounts are harmless; the newest wins. */
export function onReportRequest(next: Listener): () => void {
  listener = next;
  listeners.add(next);
  return () => {
    listeners.delete(next);
    if (listener === next) listener = null;
  };
}

/** Ask the dialog to open, prefilled with this error. */
export function requestReport(report: ProblemReport): boolean {
  if (listener) {
    listener(report);
    return true;
  }
  queueReport(report);
  return false;
}

const QUEUE_KEY = "fc-pending-error-reports";
const QUEUE_MAX = 5;

export function queueReport(report: ProblemReport): void {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const list = Array.isArray(parsed) ? parsed : [];
    list.push({
      message: String(report.message ?? "").slice(0, 500),
      stack: report.stack ? String(report.stack).slice(0, 2000) : undefined,
      source: report.source?.slice(0, 120),
      url: (report.url ?? (typeof window !== "undefined" ? window.location.href : "")).slice(0, 500),
      at: Date.now(),
    });
    localStorage.setItem(QUEUE_KEY, JSON.stringify(list.slice(-QUEUE_MAX)));
  } catch {
    /* storage disabled — there is nowhere to keep it */
  }
}

export function takeQueuedReports(): ProblemReport[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    localStorage.removeItem(QUEUE_KEY);
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row) => row && typeof row.message === "string" && row.message.trim())
      .slice(0, QUEUE_MAX)
      .map((row) => ({
        message: String(row.message).slice(0, 2000),
        stack: typeof row.stack === "string" ? row.stack.slice(0, 6000) : undefined,
        source: typeof row.source === "string" ? row.source.slice(0, 120) : undefined,
        url: typeof row.url === "string" ? row.url.slice(0, 500) : undefined,
      }));
  } catch {
    return [];
  }
}
