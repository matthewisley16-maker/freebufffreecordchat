import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";

const DISMISS_KEY = "fc-notification-prompt-dismissed-at";
/** "Not now" hides it for a month, not forever. */
const SNOOZE_MS = 30 * 86_400_000;

/**
 * The in-app version of the browser's "allow notifications" question.
 *
 * Shown once, inline, while the browser has not decided yet AND the account has
 * not turned desktop notifications on. Answering either way (or "Not now")
 * hides it: "Not now" snoozes for 30 days, the browser's own "Block" is final
 * and never asked again. The same switch also lives in Settings → Notifications.
 */
export default function NotificationPrompt() {
  const me = useQuery(api.users.me, {});
  const updateSettings = useMutation(api.users.updateSettings);
  const [hidden, setHidden] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (typeof Notification === "undefined") {
      setHidden(true);
      return;
    }
    if (me === undefined) {
      setHidden(true);
      return;
    }
    const enabled = (me?.settings as { desktopNotifications?: boolean } | null | undefined)?.desktopNotifications === true;
    const dismissedAt = Number(localStorage.getItem(DISMISS_KEY) ?? 0);
    const snoozed = dismissedAt > 0 && Date.now() - dismissedAt < SNOOZE_MS;
    // "denied" cannot be asked again from the page, so stay quiet.
    setHidden(enabled || snoozed || Notification.permission !== "default");
  }, [me]);

  async function turnOn() {
    if (typeof Notification === "undefined") return;
    setBusy(true);
    try {
      let permission = Notification.permission;
      if (permission === "default") permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setHidden(true);
        toast.error("Notifications are blocked. Allow them for this site in your browser settings.");
        return;
      }
      await updateSettings({ desktopNotifications: true });
      setHidden(true);
      toast.success("Notifications are on.");
      try {
        new Notification("Freecord Chat", {
          body: "You'll get a heads-up for DMs, mentions and invites while this tab is in the background.",
        });
      } catch {
        /* the preference is saved even if the browser refuses a sample */
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not turn on notifications.");
    } finally {
      setBusy(false);
    }
  }

  function notNow() {
    try {
      localStorage.setItem(DISMISS_KEY, String(Date.now()));
    } catch {
      /* storage disabled — hiding for this visit is still fine */
    }
    setHidden(true);
  }

  if (hidden) return null;

  return (
    <div
      role="region"
      aria-label="Notification permission"
      className="mx-3 mt-2 flex flex-wrap items-center gap-3 rounded-lg border border-violet-400/25 bg-violet-500/10 px-3 py-2 text-xs text-violet-100 sm:mx-4"
    >
      <Bell size={16} className="shrink-0" />
      <div className="min-w-0 flex-1">
        <strong className="block text-sm font-semibold">Would you like to receive notifications?</strong>
        <span className="text-violet-200/80">
          Get a heads-up for DMs, mentions and invites, even while this tab is in the background.
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Button size="sm" onClick={() => void turnOn()} disabled={busy}>
          {busy ? "Asking…" : "Turn on notifications"}
        </Button>
        <Button size="sm" variant="ghost" onClick={notNow} disabled={busy}>
          Not now
        </Button>
        <button type="button" aria-label="Dismiss notification prompt" onClick={notNow} className="text-violet-200/70 hover:text-violet-100">
          <X size={15} />
        </button>
      </div>
    </div>
  );
}
