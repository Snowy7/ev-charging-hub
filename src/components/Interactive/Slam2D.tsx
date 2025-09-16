"use client";

import { useEffect, useRef, useState } from "react";

type Pt = { x: number; y: number };
type Circle = { c: Pt; r: number };
type Step = "idle" | "anchors" | "slam" | "docking" | "charging";

function len(a: Pt, b: Pt) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function norm(a: Pt) {
  const d = Math.hypot(a.x, a.y) || 1;
  return { x: a.x / d, y: a.y / d };
}
function add(a: Pt, b: Pt) {
  return { x: a.x + b.x, y: a.y + b.y };
}
function sub(a: Pt, b: Pt) {
  return { x: a.x - b.x, y: a.y - b.y };
}
function mul(a: Pt, s: number) {
  return { x: a.x * s, y: a.y * s };
}
function clamp(v: number, a: number, b: number) {
  return Math.min(b, Math.max(a, v));
}
function rayCircle(origin: Pt, dir: Pt, circle: Circle): number | null {
  // returns t where origin + dir * t hits circle (if any)
  const oc = sub(origin, circle.c);
  const b = oc.x * dir.x + oc.y * dir.y;
  const c = oc.x * oc.x + oc.y * oc.y - circle.r * circle.r;
  const disc = b * b - c;
  if (disc < 0) return null;
  const t = -b - Math.sqrt(disc);
  return t > 0 ? t : null;
}

export default function Slam2D() {
  const ref = useRef<HTMLCanvasElement>(null);
  const [robot, setRobot] = useState<Pt>({ x: 60, y: 180 });
  const [car, setCar] = useState<Pt>({ x: 420, y: 160 });
  // charging port on left side of car: offset -30 px on x
  const carPort = { x: car.x - 30, y: car.y };

  const [playing, setPlaying] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [showRays, setShowRays] = useState(true);
  const [trail, setTrail] = useState<Pt[]>([]);
  const [obstacles, setObstacles] = useState<Circle[]>([
    { c: { x: 170, y: 140 }, r: 14 },
    { c: { x: 250, y: 180 }, r: 16 },
    { c: { x: 320, y: 120 }, r: 14 },
  ]);

  // multi‑step process state
  const [step, setStep] = useState<Step>("anchors");
  const [chargeProgress, setChargeProgress] = useState(0); // 0..1

  // path following with obstacle repulsion
  function stepLogic(dt: number) {
    if (step === "slam" || step === "docking") {
      const target = step === "slam" ? carPort : carPort;
      const toTarget = norm(sub(target, robot));
      const repel = obstacles.reduce(
        (acc, o) => {
          const d = len(robot, o.c);
          const rad = o.r + 26;
          if (d < rad) {
            const dir = norm(sub(robot, o.c));
            const k = (rad - d) / rad;
            return add(acc, mul(dir, k * 1.4));
          }
          return acc;
        },
        { x: 0, y: 0 }
      );
      const slamSpeed = step === "slam" ? 60 * speed : 30 * speed;
      const v = add(mul(toTarget, slamSpeed), mul(repel, 90 * speed));
      const next = add(robot, mul(v, dt));
      setRobot({ x: clamp(next.x, 10, 510), y: clamp(next.y, 10, 310) });
      setTrail((t) => {
        const nt = [...t, robot];
        return nt.length > 800 ? nt.slice(nt.length - 800) : nt;
      });

      // transitions
      const distToPort = len(robot, carPort);
      if (step === "slam" && distToPort < 40) setStep("docking");
      if (step === "docking" && distToPort < 10) {
        setStep("charging");
        setChargeProgress(0);
      }
    } else if (step === "charging") {
      setChargeProgress((p) => Math.min(1, p + dt * 0.15));
    }
  }

  // render loop
  useEffect(() => {
    const cvs = ref.current;
    if (!cvs) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    let last = performance.now();
    let raf = 0;

    const loop = (now: number) => {
      const dt = Math.min(1 / 30, (now - last) / 1000);
      last = now;

      if (playing) stepLogic(dt);

      // clear
      ctx.clearRect(0, 0, cvs.width, cvs.height);

      // grid
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      for (let x = 0; x <= cvs.width; x += 20) ctx.fillRect(x, 0, 1, cvs.height);
      for (let y = 0; y <= cvs.height; y += 20) ctx.fillRect(0, y, cvs.width, 1);

      const anchors: Pt[] = [
        { x: 20, y: 20 },
        { x: 500, y: 20 },
        { x: 20, y: 300 },
        { x: 500, y: 300 },
      ];

      // Step: Anchors localization visuals
      if (step === "anchors") {
        const t = (now / 1000) % 2.2;
        const pulseR = (t / 2.2) * 360 + 8;
        anchors.forEach((a) => {
          // base pulse
          ctx.strokeStyle = "rgba(57,183,255,0.25)";
          ctx.beginPath();
          ctx.arc(a.x, a.y, pulseR, 0, Math.PI * 2);
          ctx.stroke();

          // trilateration to robot: dashed radius = distance
          const dR = len(a, robot);
          ctx.setLineDash([6, 6]);
          ctx.strokeStyle = "rgba(57,183,255,0.35)";
          ctx.beginPath();
          ctx.arc(a.x, a.y, dR, 0, Math.PI * 2);
          ctx.stroke();

          // trilateration to car: green
          const dC = len(a, car);
          ctx.strokeStyle = "rgba(0,255,163,0.3)";
          ctx.beginPath();
          ctx.arc(a.x, a.y, dC, 0, Math.PI * 2);
          ctx.stroke();
          ctx.setLineDash([]);

          // signal lines to robot and car
          ctx.strokeStyle = "rgba(255,255,255,0.06)";
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(robot.x, robot.y);
          ctx.stroke();
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(car.x, car.y);
          ctx.stroke();
        });

        // ghost markers: estimated pose/icons
        ctx.fillStyle = "rgba(57,183,255,0.35)";
        ctx.beginPath();
        ctx.arc(robot.x, robot.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "rgba(0,255,163,0.25)";
        ctx.fillRect(car.x - 20, car.y - 12, 40, 24);
      }

      // trail
      if (trail.length > 1) {
        ctx.strokeStyle = "rgba(57,183,255,0.7)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for (let i = 1; i < trail.length; i++) ctx.lineTo(trail[i].x, trail[i].y);
        ctx.stroke();
      }

      // obstacles
      obstacles.forEach((o) => {
        ctx.fillStyle = "rgba(255,80,80,0.85)";
        ctx.beginPath();
        ctx.arc(o.c.x, o.c.y, o.r, 0, Math.PI * 2);
        ctx.fill();
      });

      // guidance line to car side port (only when navigating)
      if (step === "slam" || step === "docking") {
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = "rgba(57,183,255,0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(robot.x, robot.y);
        ctx.lineTo(carPort.x, carPort.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // LiDAR rays truncated
      if (showRays && (step === "slam" || step === "docking")) {
        const rays = 48;
        for (let i = 0; i < rays; i++) {
          const ang = (i / rays) * Math.PI * 2;
          const dir = { x: Math.cos(ang), y: Math.sin(ang) };
          let minT: number | null = null;
          obstacles.forEach((o) => {
            const t = rayCircle(robot, dir, o);
            if (t && t > 0 && (minT === null || t < minT)) minT = t;
          });
          const maxR = 140;
          const tHit = minT !== null ? Math.min(minT, maxR) : maxR;
          ctx.strokeStyle = step === "slam" ? "rgba(57,183,255,0.22)" : "rgba(57,183,255,0.12)";
          ctx.beginPath();
          ctx.moveTo(robot.x, robot.y);
          ctx.lineTo(robot.x + dir.x * tHit, robot.y + dir.y * tHit);
          ctx.stroke();
        }
      }

      // Magnetic docking visual: curved field lines converging
      if (step === "docking") {
        const dx = carPort.x - robot.x;
        const dy = carPort.y - robot.y;
        const nLines = 8;
        ctx.strokeStyle = "rgba(0,255,163,0.5)";
        for (let i = 0; i < nLines; i++) {
          const off = (i - nLines / 2) * 3;
          ctx.beginPath();
          ctx.moveTo(robot.x - dy * 0.02 + off, robot.y + dx * 0.02);
          const midX = (robot.x + carPort.x) / 2 + off * 0.6;
          const midY = (robot.y + carPort.y) / 2 + Math.sin((now / 200 + i) % Math.PI) * 6;
          ctx.quadraticCurveTo(midX, midY, carPort.x, carPort.y);
          ctx.stroke();
        }
        // target ring
        ctx.strokeStyle = "rgba(0,255,163,0.8)";
        ctx.beginPath();
        ctx.arc(carPort.x, carPort.y, 8 + Math.sin(now / 120) * 1.2, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Charging visual: pulsing rings and energy arcs
      if (step === "charging") {
        const baseR = 10 + Math.sin(now / 160) * 2;
        for (let i = 0; i < 3; i++) {
          ctx.strokeStyle = i % 2 === 0 ? "rgba(0,255,163,0.5)" : "rgba(57,183,255,0.4)";
          ctx.beginPath();
          ctx.arc(carPort.x, carPort.y, baseR + i * 6, 0, Math.PI * 2);
          ctx.stroke();
        }
        // energy arc between robot and port
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.beginPath();
        const mX = (robot.x + carPort.x) / 2;
        const mY = (robot.y + carPort.y) / 2 - 8;
        ctx.quadraticCurveTo(mX, mY, carPort.x, carPort.y);
        ctx.stroke();
      }

      // car body
      ctx.fillStyle = "rgba(0,255,163,0.9)";
      ctx.fillRect(car.x - 18, car.y - 10, 36, 20);
      // car port: hide during anchors step; subtle glow after
      if (step !== "anchors") {
        ctx.fillStyle = "rgba(0,255,163,1)";
        ctx.beginPath();
        ctx.arc(carPort.x, carPort.y, 5, 0, Math.PI * 2);
        ctx.fill();
        // glow
        ctx.strokeStyle = "rgba(0,255,163,0.35)";
        const glowR = 8 + Math.sin(now / 140) * 1.2;
        ctx.beginPath();
        ctx.arc(carPort.x, carPort.y, glowR, 0, Math.PI * 2);
        ctx.stroke();
      }

      // robot
      ctx.fillStyle = "rgba(57,183,255,0.95)";
      ctx.beginPath();
      ctx.arc(robot.x, robot.y, 8, 0, Math.PI * 2);
      ctx.fill();

      // charging progress bar above car
      if (step === "charging") {
        const w = 80;
        const h = 8;
        const x = car.x - w / 2;
        const y = car.y - 28;
        ctx.fillStyle = "rgba(255,255,255,0.12)";
        ctx.fillRect(x, y, w, h);
        ctx.fillStyle = "rgba(0,255,163,0.9)";
        ctx.fillRect(x, y, w * chargeProgress, h);
        ctx.strokeStyle = "rgba(255,255,255,0.25)";
        ctx.strokeRect(x, y, w, h);
      }

      // step label
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.font = "12px ui-sans-serif, system-ui, -apple-system";
      const label =
        step === "anchors"
          ? "Anchors localization"
          : step === "slam"
          ? "SLAM navigation"
          : step === "docking"
          ? "Magnetic docking"
          : step === "charging"
          ? "Charging"
          : "";
      if (label) ctx.fillText(label, 12, 18);

      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, obstacles, robot, car, step, showRays, chargeProgress]);

  // timed transition: Anchors → SLAM
  useEffect(() => {
    if (!playing) return;
    if (step !== "anchors") return;
    const id = setTimeout(() => setStep("slam"), 2200);
    return () => clearTimeout(id);
  }, [step, playing]);

  return (
    <div className="flex flex-col gap-3">
      <div className="w-full overflow-hidden rounded-md border border-white/10 bg-black/30">
        <canvas ref={ref} width={520} height={340} className="w-full" />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <button
          onClick={() => setPlaying((v) => !v)}
          className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button
          onClick={() => {
            setTrail([]);
            setRobot({ x: 60, y: 180 });
            setStep("anchors");
            setChargeProgress(0);
          }}
          className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
        >
          Reset Robot
        </button>
        <div className="ml-2 flex gap-2">
          {(["anchors", "slam", "docking", "charging"] as Step[]).map((s) => (
            <button
              key={s}
              onClick={() => {
                setStep(s);
                setPlaying(true);
              }}
              className={`rounded-md px-3 py-1.5 text-sm ${
                step === s
                  ? "bg-[color:var(--color-neon-blue)]/20 text-[color:var(--color-neon-blue)] shadow-[var(--shadow-glow)]"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {s}
            </button>
          ))}
        </div>
        <label className="ml-2 text-xs text-white/70">Speed</label>
        <input
          type="range"
          min={0.4}
          max={2}
          step={0.1}
          value={speed}
          onChange={(e) => setSpeed(parseFloat(e.target.value))}
        />
        <label className="ml-2 flex items-center gap-2 text-xs text-white/70">
          <input
            type="checkbox"
            checked={showRays}
            onChange={(e) => setShowRays(e.target.checked)}
          />
          Show LiDAR
        </label>
        <span className="ml-auto text-xs text-white/60">
          Steps: Anchors → SLAM → Magnetic Docking → Charging
        </span>
      </div>
    </div>
  );
}