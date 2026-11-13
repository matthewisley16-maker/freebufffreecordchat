import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft } from "lucide-react";
import { toast } from "sonner";

/**
 * A real browser window for a call.
 *
 * `open()` MUST be called straight from a click handler: browsers only allow
 * `window.open` during a user gesture, so opening it from an effect would be
 * blocked. The window gets a copy of the app's stylesheets and a container that
 * React portals the call UI into; the call itself, its WebRTC connections and
 * all its state stay where they are, so popping out never reconnects anything.
 *
 * The popup is closed when the user brings the call back, leaves the call, or
 * closes the window themselves (which flips the caller back to the in-app UI).
 */
export function useCallPopout(title: string, name = "call") {
  const [win, setWin] = useState<Window | null>(null);
  const winRef = useRef<Window | null>(null);

  const open = useCallback(() => {
    const existing = winRef.current;
    if (existing && !existing.closed) {
      existing.focus();
      return true;
    }
    const popup = window.open(
      "",
      `freecord-call-${name}`,
      "popup=yes,width=480,height=780,resizable=yes,scrollbars=no",
    );
    if (!popup) {
      toast.error("Your browser blocked the call window. Allow pop-ups for Freecord, then try again.");
      return false;
    }

    const doc = popup.document;
    doc.title = title;
    doc.documentElement.className = document.documentElement.className;
    doc.documentElement.lang = document.documentElement.lang || "en";

    // Copy the app's styles so the call looks identical in its own window.
    for (const node of Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))) {
      if (node.tagName === "LINK") {
        const link = doc.createElement("link");
        link.rel = "stylesheet";
        link.href = (node as HTMLLinkElement).href;
        doc.head.appendChild(link);
      } else {
        doc.head.appendChild(doc.importNode(node, true));
      }
    }

    const base = doc.createElement("style");
    base.textContent = [
      "html,body{margin:0;height:100%;background:#0b0b10;color:#eeecf6;}",
      'body{font-family:Inter,ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;overflow:hidden;}',
      ".fc-popout-root{height:100%;display:flex;}",
    ].join("");
    doc.head.appendChild(base);

    const root = doc.createElement("div");
    root.className = "fc-popout-root";
    doc.body.appendChild(root);

    winRef.current = popup;
    setWin(popup);
    popup.addEventListener("pagehide", () => {
      winRef.current = null;
      setWin(null);
    });
    return true;
  }, [title, name]);

  const close = useCallback(() => {
    const popup = winRef.current;
    winRef.current = null;
    setWin(null);
    try {
      popup?.close();
    } catch {
      // The window may already be gone.
    }
  }, []);

  // Leaving the call must never leave an orphaned window behind.
  useEffect(() => () => {
    try {
      winRef.current?.close();
    } catch {
      // ignore
    }
    winRef.current = null;
  }, []);

  return { win, open, close };
}

export function CallPopout({
  win,
  title,
  onClose,
  children,
}: {
  win: Window | null;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!win || win.closed) return null;
  const host = win.document.querySelector(".fc-popout-root");
  if (!host) return null;

  return createPortal(
    <div className="fc-popout">
      <header className="fc-popout-head">
        <span className="fc-popout-title">{title}</span>
        <button onClick={onClose} title="Move the call back into Freecord" aria-label="Move the call back into Freecord">
          <ArrowLeft size={15} />
        </button>
      </header>
      {children}
    </div>,
    host,
  );
}
