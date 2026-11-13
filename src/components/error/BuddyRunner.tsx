import { useCallback, useEffect, useRef, useState } from "react";

/**
 * A tiny endless runner, in the spirit of the offline dinosaur: the Freecord
 * buddy hops over little blocks while the ground scrolls. It is deliberately
 * small — one canvas, one animation loop, no images, no audio — so it can live
 * on an error screen without making the failure worse.
 *
 * Space / Up / Enter / click / tap jumps; the loop only runs while the game is
 * on screen and the tab is visible.
 */

const W = 720;
const H = 200;
const GROUND = 164;
const BEST_KEY = "freecord:runner-best";

type Block = { x: number; w: number; h: number };

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

export default function BuddyRunner() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [over, setOver] = useState(false);
  const [started, setStarted] = useState(false);

  // Mutable game state, kept out of React so the loop never re-renders.
  const game = useRef({
    y: 0,
    vy: 0,
    blocks: [] as Block[],
    speed: 4.4,
    distance: 0,
    spawnIn: 90,
    tick: 0,
    running: false,
    over: false,
  });

  useEffect(() => {
    try {
      const stored = Number(localStorage.getItem(BEST_KEY) || "0");
      if (Number.isFinite(stored)) setBest(stored);
    } catch {
      // no storage: the game still works, it just forgets the best score
    }
  }, []);

  const reset = useCallback(() => {
    const g = game.current;
    g.y = 0;
    g.vy = 0;
    g.blocks = [];
    g.speed = 4.4;
    g.distance = 0;
    g.spawnIn = 90;
    g.tick = 0;
    g.running = true;
    g.over = false;
    setScore(0);
    setOver(false);
    setStarted(true);
  }, []);

  const jump = useCallback(() => {
    const g = game.current;
    if (g.over) { reset(); return; }
    if (!g.running) { reset(); return; }
    // A single jump at a time: holding the key does not let the buddy fly.
    if (g.y <= 0.5) g.vy = -12.4;
  }, [reset]);

  // Draw + physics loop.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(2, window.devicePixelRatio || 1);
    canvas.width = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    let raf = 0;
    let last = performance.now();
    let alive = true;

    const buddy = { w: 44, h: 50, x: 74 };

    function drawBuddy(y: number, running: boolean, tick: number) {
      const c = ctx!;
      const top = GROUND - buddy.h - y;
      // shadow
      c.fillStyle = "rgba(0,0,0,.35)";
      c.beginPath();
      c.ellipse(buddy.x + buddy.w / 2, GROUND + 2, 20 - y * 0.04, 4, 0, 0, Math.PI * 2);
      c.fill();

      // arms
      c.fillStyle = "#9b74ff";
      c.strokeStyle = "#40157a";
      c.lineWidth = 2.4;
      roundRect(c, buddy.x - 8, top + 18, 12, 24, 6);
      c.fill(); c.stroke();
      roundRect(c, buddy.x + buddy.w - 4, top + 18, 12, 24, 6);
      c.fill(); c.stroke();

      // legs (wiggle while running on the ground)
      const legOffset = running && y === 0 ? Math.sin(tick / 4) * 2 : 0;
      c.fillStyle = "#6d28d9";
      roundRect(c, buddy.x + 6, top + buddy.h - 8 + legOffset, 12, 16, 6);
      c.fill(); c.stroke();
      roundRect(c, buddy.x + buddy.w - 18, top + buddy.h - 8 - legOffset, 12, 16, 6);
      c.fill(); c.stroke();

      // body
      const grad = c.createLinearGradient(0, top, 0, top + buddy.h);
      grad.addColorStop(0, "#b79bff");
      grad.addColorStop(1, "#7239e8");
      c.fillStyle = grad;
      roundRect(c, buddy.x, top, buddy.w, buddy.h, 16);
      c.fill(); c.stroke();

      // eyes
      c.fillStyle = "#1c0a33";
      c.beginPath(); c.ellipse(buddy.x + 15, top + 19, 4.6, 6, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(buddy.x + 29, top + 19, 4.6, 6, 0, 0, Math.PI * 2); c.fill();
      c.fillStyle = "#fff";
      c.beginPath(); c.arc(buddy.x + 16.5, top + 17, 1.7, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.arc(buddy.x + 30.5, top + 17, 1.7, 0, Math.PI * 2); c.fill();

      // blush + grin
      c.fillStyle = "rgba(251,113,133,.55)";
      c.beginPath(); c.ellipse(buddy.x + 10, top + 30, 3.4, 2.1, 0, 0, Math.PI * 2); c.fill();
      c.beginPath(); c.ellipse(buddy.x + 34, top + 30, 3.4, 2.1, 0, 0, Math.PI * 2); c.fill();
      c.strokeStyle = "#2a0a45";
      c.lineWidth = 2.6;
      c.beginPath();
      c.arc(buddy.x + 22, top + 31, 7, 0.15 * Math.PI, 0.85 * Math.PI);
      c.stroke();
    }

    function frame(now: number) {
      if (!alive) return;
      const dt = Math.min(2.5, (now - last) / 16.666);
      last = now;
      const g = game.current;
      g.tick += dt;

      // physics
      g.vy += 0.78 * dt;
      g.y -= g.vy * dt;
      if (g.y <= 0) { g.y = 0; g.vy = 0; }

      if (g.running && !g.over) {
        g.distance += g.speed * dt;
        g.speed = Math.min(9.5, 4.4 + g.distance / 1600);
        setScore(Math.floor(g.distance / 10));

        g.spawnIn -= dt;
        if (g.spawnIn <= 0) {
          const h = 26 + Math.random() * 24;
          g.blocks.push({ x: W + 20, w: 18 + Math.random() * 8, h });
          g.spawnIn = (70 + Math.random() * 50) * (4.4 / g.speed);
        }
        for (const b of g.blocks) b.x -= g.speed * dt;
        g.blocks = g.blocks.filter((b) => b.x + b.w > -20);

        // collision: a forgiving box around the buddy, so near misses feel fair
        for (const b of g.blocks) {
          const bx = b.x;
          const by = GROUND - b.h;
          const px = buddy.x + 7;
          const py = GROUND - buddy.h - g.y + 4;
          if (px + buddy.w - 14 > bx && px < bx + b.w && py + buddy.h - 6 > by && py < GROUND) {
            g.over = true;
            g.running = false;
            setOver(true);
            setBest((prev) => {
              const next = Math.max(prev, Math.floor(g.distance / 10));
              try { localStorage.setItem(BEST_KEY, String(next)); } catch { /* ignore */ }
              return next;
            });
            break;
          }
        }
      }

      // paint
      ctx!.clearRect(0, 0, W, H);
      const sky = ctx!.createLinearGradient(0, 0, 0, H);
      sky.addColorStop(0, "#0d0b16");
      sky.addColorStop(1, "#141024");
      ctx!.fillStyle = sky;
      ctx!.fillRect(0, 0, W, H);

      // stars
      ctx!.fillStyle = "rgba(196,181,253,.5)";
      for (let i = 0; i < 26; i++) {
        const sx = (i * 97 + (g.distance * 0.12) % 97) % W;
        const sy = 18 + ((i * 37) % 80);
        ctx!.fillRect(sx, sy, 1.6, 1.6);
      }

      // ground
      ctx!.strokeStyle = "rgba(167,139,250,.45)";
      ctx!.lineWidth = 2;
      ctx!.beginPath();
      ctx!.moveTo(0, GROUND + 1);
      ctx!.lineTo(W, GROUND + 1);
      ctx!.stroke();
      ctx!.fillStyle = "rgba(139,92,246,.16)";
      for (let i = 0; i < 30; i++) {
        const sx = (i * 41 - (g.distance * 1.0) % 41 + W) % W;
        ctx!.fillRect(sx, GROUND + 8 + (i % 3) * 6, 10, 2);
      }

      // obstacles: little purple blocks with a toothy grin mark
      for (const b of g.blocks) {
        const by = GROUND - b.h;
        ctx!.fillStyle = "#5b21b6";
        roundRect(ctx!, b.x, by, b.w, b.h, 5);
        ctx!.fill();
        ctx!.fillStyle = "rgba(255,255,255,.22)";
        roundRect(ctx!, b.x + 4, by + 5, b.w - 8, 4, 2);
        ctx!.fill();
      }

      drawBuddy(g.y, g.running && !g.over, g.tick);

      if (g.over) {
        ctx!.fillStyle = "rgba(11,11,16,.55)";
        ctx!.fillRect(0, 0, W, H);
        ctx!.fillStyle = "#f5f3fc";
        ctx!.font = "600 20px Inter, system-ui, sans-serif";
        ctx!.textAlign = "center";
        ctx!.fillText("oof — the buddy bumped into a bug", W / 2, 88);
        ctx!.fillStyle = "#c4b5fd";
        ctx!.font = "500 13px Inter, system-ui, sans-serif";
        ctx!.fillText("press space or tap to try again", W / 2, 116);
        ctx!.textAlign = "left";
      } else if (!g.running) {
        ctx!.fillStyle = "#c4b5fd";
        ctx!.font = "500 14px Inter, system-ui, sans-serif";
        ctx!.textAlign = "center";
        ctx!.fillText("press space, click or tap to jump", W / 2, 100);
        ctx!.textAlign = "left";
      }

      raf = requestAnimationFrame(frame);
    }

    raf = requestAnimationFrame(frame);
    return () => {
      alive = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  // The game takes focus when it opens: otherwise Space would activate the
  // "Play a tiny game" button again (closing the game) instead of jumping.
  useEffect(() => {
    canvasRef.current?.focus({ preventScroll: true });
  }, []);

  // Keyboard control (only while this game is mounted).
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.code === "Space" || e.code === "ArrowUp" || e.code === "Enter") {
        const target = e.target as HTMLElement | null;
        if (target && target.closest("button, a, input, textarea, select")) return;
        e.preventDefault();
        jump();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [jump]);

  return (
    <div className="fc-runner">
      <div className="fc-runner-hud">
        <span className="fc-runner-label">Buddy dash</span>
        <span className="fc-runner-scores">
          <span>score {score}</span>
          <span>best {best}</span>
        </span>
      </div>
      <canvas
        ref={canvasRef}
        className="fc-runner-canvas"
        tabIndex={0}
        onPointerDown={(e) => { e.preventDefault(); jump(); }}
        aria-label="Little buddy runner: press space or tap to jump over blocks"
        role="application"
      />
      <p className="fc-runner-hint">
        {over ? "Tap or press space to go again" : started ? "Jump the little blocks — space or tap" : "Space, click or tap to start"}
      </p>
    </div>
  );
}
