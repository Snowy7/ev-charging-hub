"use client";

import { useEffect, useRef, useState } from "react";

type Pt = { x: number; y: number };

function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}

export default function SlamSim() {
  const ref = useRef<HTMLCanvasElement>(null);
  const BASE_W = 520;
  const BASE_H = 320;
  const lastCssSize = useRef({ w: 0, h: 0 });
  const lastDpr = useRef(0);
  const [robot, setRobot] = useState<Pt>({ x: 60, y: 160 });
  const [target, setTarget] = useState<Pt>({ x: 360, y: 140 });
  const [obstacles, setObstacles] = useState<{ p: Pt; r: number }[]>([
    { p: { x: 160, y: 80 }, r: 14 },
    { p: { x: 220, y: 180 }, r: 16 },
    { p: { x: 120, y: 160 }, r: 12 },
  ]);
  const [running, setRunning] = useState(true);
  const [showRays, setShowRays] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [trail, setTrail] = useState<Pt[]>([]);
  const [drag, setDrag] = useState<null | { type: "robot" | "target" }>(null);

  function stepLogic() {
    const dx = target.x - robot.x;
    const dy = target.y - robot.y;
    const dist = Math.hypot(dx, dy) || 1;
    const goal = { x: dx / dist, y: dy / dist };

    const steer = { x: 0, y: 0 };
    obstacles.forEach(({ p, r }) => {
      const ox = robot.x - p.x;
      const oy = robot.y - p.y;
      const d = Math.hypot(ox, oy);
      const minD = r + 24;
      if (d < minD && d > 0) {
        const f = (minD - d) * 0.06;
        steer.x += (ox / d) * f;
        steer.y += (oy / d) * f;
      }
    });

    const v = {
      x: (goal.x + steer.x) * 1.6 * speed,
      y: (goal.y + steer.y) * 1.6 * speed,
    };
    if (dist > 2) {
      setRobot((r) => ({ x: r.x + v.x, y: r.y + v.y }));
      setTrail((t) => {
        const nt = [...t, { x: robot.x, y: robot.y }];
        return nt.length > 400 ? nt.slice(nt.length - 400) : nt;
      });
    }
  }

  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    let resizeScheduled = false;
    const doResize = () => {
      resizeScheduled = false;
      const container = cvs.parentElement || cvs;
      const rect = container.getBoundingClientRect();
      if (rect.width < 2 || rect.height < 2) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.floor(rect.width);
      const cssH = Math.floor(rect.height);
      const changed = cssW !== lastCssSize.current.w || cssH !== lastCssSize.current.h || dpr !== lastDpr.current;
      if (!changed) return;
      lastCssSize.current = { w: cssW, h: cssH };
      lastDpr.current = dpr;
      const sx = cssW / BASE_W;
      const sy = cssH / BASE_H;
      const targetW = Math.max(1, Math.floor(cssW * dpr));
      const targetH = Math.max(1, Math.floor(cssH * dpr));
      if (cvs.width !== targetW) cvs.width = targetW;
      if (cvs.height !== targetH) cvs.height = targetH;
      ctx.setTransform(dpr * sx, 0, 0, dpr * sy, 0, 0);
    };
    const scheduleResize = () => {
      if (resizeScheduled) return;
      resizeScheduled = true;
      requestAnimationFrame(doResize);
    };
    scheduleResize();
    const ro = new ResizeObserver(scheduleResize);
    const container = cvs.parentElement || cvs;
    ro.observe(container);
    const onWinResize = () => scheduleResize();
    window.addEventListener("resize", onWinResize);

    let raf = 0;
    const render = () => {
      if (running) stepLogic();

      const w = BASE_W;
      const h = BASE_H;
      ctx.clearRect(0, 0, w, h);

      // Grid
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      for (let x = 0; x <= w; x += 20) ctx.fillRect(x, 0, 1, h);
      for (let y = 0; y <= h; y += 20) ctx.fillRect(0, y, w, 1);

      // Trail
      ctx.strokeStyle = "rgba(57,183,255,0.6)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      trail.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
      ctx.stroke();

      // Obstacles
      obstacles.forEach(({ p, r }) => {
        ctx.fillStyle = "rgba(255,80,80,0.8)";
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill();
      });

      // Target
      ctx.fillStyle = "rgba(0,255,163,0.9)";
      ctx.beginPath();
      ctx.arc(target.x, target.y, 12, 0, Math.PI * 2);
      ctx.fill();

      // Robot
      ctx.fillStyle = "rgba(57,183,255,0.95)";
      ctx.beginPath();
      ctx.arc(robot.x, robot.y, 10, 0, Math.PI * 2);
      ctx.fill();

      // LiDAR rays
      if (showRays) {
        const rays = 36;
        for (let i = 0; i < rays; i++) {
          const ang = (i / rays) * Math.PI * 2;
          const maxR = 90;
          let hit: Pt | null = null;
          for (let r = 0; r <= maxR; r += 2) {
            const px = robot.x + Math.cos(ang) * r;
            const py = robot.y + Math.sin(ang) * r;
            const collision = obstacles.some(({ p, r }) => Math.hypot(px - p.x, py - p.y) <= r);
            if (collision) {
              hit = { x: px, y: py };
              break;
            }
          }
          ctx.strokeStyle = "rgba(57,183,255,0.25)";
          ctx.beginPath();
          ctx.moveTo(robot.x, robot.y);
          ctx.lineTo(
            hit ? hit.x : robot.x + Math.cos(ang) * maxR,
            hit ? hit.y : robot.y + Math.sin(ang) * maxR
          );
          ctx.stroke();
          if (hit) {
            ctx.fillStyle = "rgba(57,183,255,0.8)";
            ctx.beginPath();
            ctx.arc(hit.x, hit.y, 2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      raf = requestAnimationFrame(render);
    };

    raf = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", onWinResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, speed, showRays, obstacles, robot, target, trail]);

  const toLocal = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const sx = rect.width / BASE_W || 1;
    const sy = rect.height / BASE_H || 1;
    return { x: (e.clientX - rect.left) / sx, y: (e.clientY - rect.top) / sy };
  };

  return (
    <div className="flex flex-col gap-3">
      <canvas
        ref={ref}
        width={520}
        height={320}
        className="mx-auto w-full rounded-md border border-white/10 bg-black/30 block"
        onMouseDown={(e) => {
          const p = toLocal(e);
          if (Math.hypot(p.x - robot.x, p.y - robot.y) < 14) setDrag({ type: "robot" });
          else if (Math.hypot(p.x - target.x, p.y - target.y) < 16) setDrag({ type: "target" });
        }}
        onMouseMove={(e) => {
          if (!drag) return;
          const p = toLocal(e);
          if (drag.type === "robot") setRobot({ x: clamp(p.x, 0, 520), y: clamp(p.y, 0, 320) });
          else setTarget({ x: clamp(p.x, 0, 520), y: clamp(p.y, 0, 320) });
        }}
        onMouseUp={() => setDrag(null)}
        onMouseLeave={() => setDrag(null)}
        onDoubleClick={(e) => {
          const p = toLocal(e);
          setObstacles((o) => [...o, { p, r: 12 + Math.round(Math.random() * 8) }]);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          const p = toLocal(e);
          let idx = -1;
          let best = Infinity;
          obstacles.forEach((o, i) => {
            const d = Math.hypot(o.p.x - p.x, o.p.y - p.y);
            if (d < best) {
              best = d;
              idx = i;
            }
          });
          if (idx >= 0) setObstacles((obs) => obs.filter((_, i) => i !== idx));
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setRunning((r) => !r)}
          className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
        >
          {running ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => {
            setTrail([]);
            setRobot({ x: 60, y: 160 });
          }}
          className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
        >
          Reset Robot
        </button>
        <button
          onClick={() => setTrail([])}
          className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
        >
          Clear Trail
        </button>
        <label className="ml-2 text-xs text-white/70">Speed</label>
        <input
          type="range"
          min={0.2}
          max={3}
          step={0.1}
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
        />
        <label className="ml-2 flex items-center gap-2 text-xs text-white/70">
          <input type="checkbox" checked={showRays} onChange={(e) => setShowRays(e.target.checked)} />
          Show LiDAR
        </label>
        <span className="ml-auto text-xs text-white/50">
          Tip: Drag robot/target. Double‑click to add obstacle. Right‑click to remove.
        </span>
      </div>
    </div>
  );
}