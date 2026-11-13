import { useEffect, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { AlertTriangle, Send } from "lucide-react";
import { onReportRequest, takeQueuedReports, type ProblemReport } from "@/lib/report-problem";

/**
 * One report dialog for the whole app.
 *
 * Error boundaries, window listeners and a full-page crash all funnel into this
 * component (see `lib/report-problem`). What is sent: the error text, the page,
 * where it was caught, and the optional note the member writes. Nothing else.
 */
export default function ReportProblem() {
  const submit = useMutation(api.reports.submit);
  const [open, setOpen] = useState(false);
  const [report, setReport] = useState<ProblemReport | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  /** An error nobody offered a button for — keep a visible way to report it. */
  const [caught, setCaught] = useState<ProblemReport | null>(null);

  useEffect(() => onReportRequest((next) => {
    setReport(next);
    setNote("");
    setOpen(true);
  }), []);

  useEffect(() => {
    const describe = (raw: unknown, source: string): ProblemReport => {
      if (typeof raw === "string") return { message: raw.slice(0, 2000), source };
      const err = raw as { message?: string; stack?: string } | null;
      return {
        message: (err?.message || "Something went wrong").slice(0, 2000),
        stack: err?.stack,
        source,
      };
    };
    const onError = (event: ErrorEvent) => setCaught(describe(event.error ?? event.message, "window"));
    const onRejection = (event: PromiseRejectionEvent) => setCaught(describe(event.reason, "promise"));
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  // A crash of the entire page can only queue its report. Send anything queued
  // as soon as the app loads successfully again.
  useEffect(() => {
    let cancelled = false;
    void (async () => {
      for (const queued of takeQueuedReports()) {
        if (cancelled) return;
        try {
          await submit({
            message: queued.message,
            stack: queued.stack,
            source: queued.source,
            url: queued.url ?? window.location.href,
          });
        } catch {
          /* one failed queued report must not block the rest */
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [submit]);

  async function send() {
    if (!report) return;
    setBusy(true);
    try {
      await submit({
        message: report.message.slice(0, 2000),
        note: note.trim() ? note.trim().slice(0, 2000) : undefined,
        stack: report.stack?.slice(0, 6000),
        source: report.source?.slice(0, 120),
        url: window.location.href.slice(0, 500),
      });
      toast.success("Report sent to the admin panel. Thank you!");
      setOpen(false);
      setReport(null);
      setNote("");
      setCaught(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not send the report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) setReport(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report this to the admin</DialogTitle>
            <DialogDescription>
              The admin panel receives the error text and the page you were on. Add a sentence about what you were
              doing if you want — no passwords or private messages are sent.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="max-h-28 overflow-auto rounded-md border border-border bg-muted/40 p-2 text-xs break-words text-muted-foreground">
              {report?.message ?? "No error details"}
            </div>
            <label className="block text-xs font-medium" htmlFor="report-note">
              What happened? (optional)
            </label>
            <Textarea
              id="report-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. I pressed Send and the message never appeared."
              maxLength={2000}
              rows={4}
            />
            <p className="text-[11px] text-muted-foreground">{note.length}/2000</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={() => void send()} disabled={busy || !report}>
              <Send className="mr-1 size-4" /> Send report
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {caught && !open && (
        <button
          type="button"
          onClick={() => {
            setReport(caught);
            setNote("");
            setOpen(true);
          }}
          className="fixed bottom-4 right-4 z-[130] flex items-center gap-2 rounded-full border border-destructive/40 bg-background px-3 py-2 text-xs font-medium text-destructive shadow-lg hover:bg-destructive/10"
          aria-label="Report this error to the admin"
        >
          <AlertTriangle size={14} /> Report this error
        </button>
      )}
    </>
  );
}
