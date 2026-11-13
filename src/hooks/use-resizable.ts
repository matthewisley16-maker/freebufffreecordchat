import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Remember a floating call window's size and let the user drag its corner.
 *
 * The size is pure UI state: it never touches the call. It is stored per `name`
 * so the voice overlay and the DM call window keep their own dimensions across
 * navigation and reloads. Nothing is applied until the user actually resizes,
 * which leaves the designed default layout untouched.
 *
 * The pointer listeners are attached inside the pointerdown handler itself
 * (rather than in an effect keyed on a `resizing` flag) so the very first mouse
 * move of a fast drag is never missed.
 */
export function useResizableWindow(
  name: string,
  options: { minWidth: number; minHeight: number; maxWidth?: number; maxHeight?: number },
) {
  const { minWidth, minHeight, maxWidth, maxHeight } = options;
  const storageKey = `freecord:call-size:${name}`;

  const [size, setSize] = useState<{ width: number; height: number } | null>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw) as Partial<{ width: number; height: number }>;
      if (typeof parsed.width === "number" && typeof parsed.height === "number") {
        return { width: parsed.width, height: parsed.height };
      }
    } catch {
      // A corrupt or unavailable storage entry just means "default size".
    }
    return null;
  });
  const [resizing, setResizing] = useState(false);

  const clamp = useCallback(
    (width: number, height: number) => {
      const maxW = Math.max(minWidth, Math.min(maxWidth ?? window.innerWidth - 32, window.innerWidth - 24));
      const maxH = Math.max(minHeight, Math.min(maxHeight ?? window.innerHeight - 32, window.innerHeight - 24));
      return {
        width: Math.round(Math.max(minWidth, Math.min(maxW, width))),
        height: Math.round(Math.max(minHeight, Math.min(maxH, height))),
      };
    },
    [minWidth, minHeight, maxWidth, maxHeight],
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent<HTMLElement>) => {
      // Never let the resize gesture start a window drag or select text.
      e.preventDefault();
      e.stopPropagation();

      const target = e.currentTarget;
      const el = (target.closest("[data-resizable]") as HTMLElement | null) ?? target.parentElement;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const start = { x: e.clientX, y: e.clientY, width: rect.width, height: rect.height, left: rect.left, top: rect.top };
      // Freeze the current size first, so growing and shrinking both feel 1:1.
      setSize({ width: Math.round(rect.width), height: Math.round(rect.height) });
      setResizing(true);
      try {
        target.setPointerCapture(e.pointerId);
      } catch {
        // Pointer capture is a nicety; window listeners still work without it.
      }

      function move(ev: PointerEvent) {
        const next = clamp(start.width + (ev.clientX - start.x), start.height + (ev.clientY - start.y));
        // Stay inside the viewport even when the window is anchored to an edge.
        const roomW = window.innerWidth - start.left - 16;
        const roomH = window.innerHeight - start.top - 16;
        setSize({
          width: Math.round(Math.max(minWidth, Math.min(next.width, roomW))),
          height: Math.round(Math.max(minHeight, Math.min(next.height, roomH))),
        });
      }

      function stop() {
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", stop);
        window.removeEventListener("pointercancel", stop);
        setResizing(false);
      }

      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", stop);
      window.addEventListener("pointercancel", stop);
    },
    [clamp, minWidth, minHeight],
  );

  useEffect(() => {
    if (!size) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify(size));
    } catch {
      // Storage being full or disabled must never break a call.
    }
  }, [size, storageKey]);

  /** Back to the designed size (double-click the grip). */
  const reset = useCallback(() => {
    setSize(null);
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // ignore
    }
  }, [storageKey]);

  const style = size
    ? { width: size.width, height: size.height, maxWidth: "calc(100vw - 24px)", maxHeight: "calc(100vh - 24px)" }
    : undefined;

  return { style, resizing, onPointerDown, reset, hasCustomSize: Boolean(size) };
}
