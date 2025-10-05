"use client";

import { useEffect, useRef, useState } from "react";

type Pt = { x: number; y: number };
type Circle = { c: Pt; r: number };
type Step = "idle" | "anchors" | "planning" | "slam" | "docking" | "charging";

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
  const dprRef = useRef(1);
  const BASE_W = 520;
  const BASE_H = 340;
  const TARGET_CLEAR_PX = 34;
  const lastCssSize = useRef({ w: 0, h: 0 });
  const lastDpr = useRef(0);
  const [robot, setRobot] = useState<Pt>({ x: 60, y: 180 });
  const [car, setCar] = useState<Pt>({ x: 420, y: 160 });
  // charging port on left side of car: offset -30 px on x
  const carPort = { x: car.x - 30, y: car.y };

  const [playing, setPlaying] = useState(false);
  const [isEdit, setIsEdit] = useState(true);
  const [speed, setSpeed] = useState(1.0);
  const [showRays, setShowRays] = useState(true);
  const [trail, setTrail] = useState<Pt[]>([]);
  const [obstacles, setObstacles] = useState<Circle[]>([
    { c: { x: 160, y: 120 }, r: 14 },
    { c: { x: 230, y: 200 }, r: 16 },
    { c: { x: 300, y: 100 }, r: 14 },
    { c: { x: 120, y: 220 }, r: 15 },
    { c: { x: 380, y: 200 }, r: 16 },
  ]);

  // multi‑step process state
  const [step, setStep] = useState<Step>("anchors");
  const [chargeProgress, setChargeProgress] = useState(0); // 0..1

  // anchors → signal → reveal line → predicted path
  const bothHitRef = useRef(false);
  const signalStartRef = useRef(0);
  const signalTRef = useRef(0); // 0..1 from car→robot
  const signalReceivedRef = useRef(false);
  const signalGlowUntilRef = useRef(0);
  const lineFormStartRef = useRef(0);
  const lineFormTRef = useRef(0); // 0..1
  const anchorsFadeUntilRef = useRef(0);
  const prevStepRef = useRef<Step>("anchors");
  const planningStartRef = useRef(0);
  const scanningStartRef = useRef(0);
  const dragRef = useRef<null | { type: "robot" | "car" | "obstacle"; idx?: number }>(null);
  const toLocal = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = (e.currentTarget as HTMLCanvasElement).getBoundingClientRect();
    const sx = rect.width / BASE_W || 1;
    const sy = rect.height / BASE_H || 1;
    return { x: (e.clientX - rect.left) / sx, y: (e.clientY - rect.top) / sy };
  };

  function enforceTargetClear(center: Pt, radius: number): Pt {
    const v = { x: center.x - carPort.x, y: center.y - carPort.y };
    const d = Math.hypot(v.x, v.y);
    const minD = radius + TARGET_CLEAR_PX;
    if (d < minD) {
      const s = minD / (d || 1);
      return {
        x: clamp(carPort.x + v.x * s, 10 + radius, BASE_W - 10 - radius),
        y: clamp(carPort.y + v.y * s, 10 + radius, BASE_H - 10 - radius),
      };
    }
    return {
      x: clamp(center.x, 10 + radius, BASE_W - 10 - radius),
      y: clamp(center.y, 10 + radius, BASE_H - 10 - radius),
    };
  }

  function resetVisuals() {
    bothHitRef.current = false;
    signalStartRef.current = 0;
    signalTRef.current = 0;
    signalReceivedRef.current = false;
    signalGlowUntilRef.current = 0;
    lineFormStartRef.current = 0;
    lineFormTRef.current = 0;
    anchorsFadeUntilRef.current = 0;
  }

  useEffect(() => {
    // smooth fade of anchors overlay when leaving anchors
    if (prevStepRef.current === "anchors" && step !== "anchors") {
      anchorsFadeUntilRef.current = performance.now() + 900;
    }
    // reset transient visuals when (re)entering anchors
    if (step === "anchors") {
      resetVisuals();
      scanningStartRef.current = performance.now();
    }
    prevStepRef.current = step;
  }, [step]);

  // path following with obstacle repulsion
  function stepLogic(dt: number) {
    if (step === "slam" || step === "docking") {
      const target = step === "slam" ? carPort : carPort;
      const toTargetVec = sub(target, robot);
      const toTarget = norm(toTargetVec);
      const distToTarget = Math.hypot(toTargetVec.x, toTargetVec.y);

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
      // Tangential steer to skirt around obstacles rather than stalling head-on
      const tangent = obstacles.reduce(
        (acc, o) => {
          const away = sub(robot, o.c);
          const d = Math.hypot(away.x, away.y);
          const influence = o.r + 26;
          if (d < influence && d > 0.0001) {
            const falloff = (1 - d / influence) ** 2;
            const awayDir = { x: away.x / d, y: away.y / d };
            const left = { x: -awayDir.y, y: awayDir.x };
            const right = { x: awayDir.y, y: -awayDir.x };
            const choose = left.x * toTarget.x + left.y * toTarget.y > right.x * toTarget.x + right.y * toTarget.y ? left : right;
            return add(acc, mul(choose, falloff * 1.4));
          }
          return acc;
        },
        { x: 0, y: 0 }
      );

      // Detect if straight line to target is blocked by any obstacle
      const dirToTarget = distToTarget > 0 ? { x: toTargetVec.x / distToTarget, y: toTargetVec.y / distToTarget } : { x: 0, y: 0 };
      const straightBlocked = obstacles.some((o) => {
        const t = rayCircle(robot, dirToTarget, o);
        return t !== null && t > 0 && t < distToTarget;
      });
      // bias towards the target when near it to prevent getting stuck behind obstacles
      const toPort = sub(carPort, robot);
      const distToPortNow = Math.hypot(toPort.x, toPort.y);
      const nearRadius = TARGET_CLEAR_PX + 16;
      let bias = { x: 0, y: 0 };
      if (distToPortNow < nearRadius + 40) {
        const towards = norm(toPort);
        const t = Math.max(0, Math.min(1, (nearRadius + 40 - distToPortNow) / 40));
        bias = mul(towards, 20 * t);
      }

      const slamSpeed = step === "slam" ? 48 * speed : 26 * speed; // slightly slower
      const tangentWeight = straightBlocked ? 120 * speed : 60 * speed;
      let v = add(add(add(mul(toTarget, slamSpeed), mul(repel, 90 * speed)), mul(tangent, tangentWeight)), bias);
      // Nudge if nearly stalled
      const vLen = Math.hypot(v.x, v.y);
      if (vLen < 1e-3) v = add(v, mul(tangent, 30));
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
      setChargeProgress((p) => Math.min(1, p + dt * 0.12)); // slower fill
    }
  }

  // render loop
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
      if (rect.width < 2 || rect.height < 2) return; // avoid collapsing to 0 during layout/tabs
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const cssW = Math.floor(rect.width);
      const cssH = Math.floor(rect.height);
      const changed = cssW !== lastCssSize.current.w || cssH !== lastCssSize.current.h || dpr !== lastDpr.current;
      if (!changed) return;
      lastCssSize.current = { w: cssW, h: cssH };
      lastDpr.current = dpr;
      dprRef.current = dpr;
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

    let last = performance.now();
    let raf = 0;

    const loop = (now: number) => {
      const dt = Math.min(1 / 30, (now - last) / 1000);
      last = now;

      if (playing) stepLogic(dt);

      // clear
      ctx.clearRect(0, 0, BASE_W, BASE_H);

      // grid
      ctx.fillStyle = "rgba(255,255,255,0.06)";
      for (let x = 0; x <= BASE_W; x += 20) ctx.fillRect(x, 0, 1, BASE_H);
      for (let y = 0; y <= BASE_H; y += 20) ctx.fillRect(0, y, BASE_W, 1);

      const anchors: Pt[] = [
        { x: 20, y: 20 },
        { x: 500, y: 20 },
        { x: 20, y: 300 },
        { x: 500, y: 300 },
      ];

      // Step: Anchors localization visuals (with fade out)
      const anchorsFadeMs = 900;
      const anchorsActive = step === "anchors" || now < anchorsFadeUntilRef.current;
      if (anchorsActive) {
        const cycle = 3.2; // slower, clearer
        const tcyc = (now / 1000) % cycle;
        const pulseR = (tcyc / cycle) * 360 + 8;
        const alpha = step === "anchors" ? 1 : Math.max(0, Math.min(1, (anchorsFadeUntilRef.current - now) / anchorsFadeMs));
        ctx.save();
        ctx.globalAlpha *= alpha;

        // draw anchors as points
        anchors.forEach((a) => {
          ctx.fillStyle = "rgba(255,255,255,0.85)";
          ctx.beginPath();
          ctx.arc(a.x, a.y, 3, 0, Math.PI * 2);
          ctx.fill();
        });

        let hitRobot = false;
        let hitCar = false;

        const scanningAllowed = !isEdit;
        if (scanningAllowed) {
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

            // detect pulse touching robot/car
            if (Math.abs(pulseR - dR) < 3) hitRobot = true;
            if (Math.abs(pulseR - dC) < 3) hitCar = true;
          });
        }

        // glow both when pulse reaches both (ensure min scan time)
        const minScanMs = 1800; // ensure we actually scan a bit
        if (!isEdit && hitRobot && hitCar && !bothHitRef.current && now - scanningStartRef.current >= minScanMs) {
          bothHitRef.current = true;
          signalStartRef.current = now;
        }

        // neutral glow color (distinct from blue/green)
        const glowColor = "rgba(255,200,60,0.45)";
        if (hitRobot) {
          ctx.strokeStyle = glowColor;
          ctx.beginPath();
          ctx.arc(robot.x, robot.y, 14, 0, Math.PI * 2);
          ctx.stroke();
        }
        if (hitCar) {
          ctx.strokeStyle = glowColor;
          ctx.strokeRect(car.x - 22, car.y - 14, 44, 28);
        }

        // animate signal from car → robot once both are hit (slower)
        if (!isEdit && bothHitRef.current && !signalReceivedRef.current) {
          const dur = 1400; // ms
          const tt = Math.min(1, (now - signalStartRef.current) / dur);
          signalTRef.current = tt;
          const dx = robot.x - carPort.x;
          const dy = robot.y - carPort.y;
          const sx = carPort.x + dx * tt;
          const sy = carPort.y + dy * tt;
          ctx.fillStyle = "rgba(255,200,60,0.9)";
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();
          if (tt >= 1) {
            signalReceivedRef.current = true;
            signalGlowUntilRef.current = now + 900;
            lineFormStartRef.current = now;
            lineFormTRef.current = 0;
            planningStartRef.current = now;
            setStep("planning");
          }
        }

        // robot glow on receive
        if (!isEdit && signalReceivedRef.current && now < signalGlowUntilRef.current) {
          ctx.strokeStyle = "rgba(255,200,60,0.6)";
          ctx.beginPath();
          ctx.arc(robot.x, robot.y, 16, 0, Math.PI * 2);
          ctx.stroke();
        }

        // No line reveal during anchors; handled in planning

        ctx.restore();
      }

      // Planning: reveal lines over ~1s, robot stays idle
      if (!isEdit && step === "planning") {
        const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
        const dur = 1000;
        const tForm = easeOutCubic(Math.min(1, (now - planningStartRef.current) / dur));
        lineFormTRef.current = tForm;

        const dx = carPort.x - robot.x;
        const dy = carPort.y - robot.y;
        const px = robot.x + dx * tForm;
        const py = robot.y + dy * tForm;
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = "rgba(57,183,255,0.7)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(robot.x, robot.y);
        ctx.lineTo(px, py);
        ctx.stroke();
        ctx.setLineDash([]);

        // predicted path with fade-in
        ctx.save();
        ctx.globalAlpha *= tForm;
        const maxSteps = 160;
        const stepLen = 3.5;
        const pts: Pt[] = [{ x: robot.x, y: robot.y }];
        let p = { x: robot.x, y: robot.y };
        for (let i = 0; i < maxSteps; i++) {
          const toTarget = norm(sub(carPort, p));
          const repel = obstacles.reduce(
            (acc, o) => {
              const d = Math.hypot(p.x - o.c.x, p.y - o.c.y);
              const rad = o.r + 26;
              if (d < rad && d > 0) {
                const dir = norm(sub(p, o.c));
                const k = (rad - d) / rad;
                return add(acc, mul(dir, k * 1.4));
              }
              return acc;
            },
            { x: 0, y: 0 }
          );
          const v = add(mul(toTarget, stepLen), mul(repel, 60 * (1 / 30)));
          const next = add(p, v);
          pts.push(next);
          p = next;
          if (len(p, carPort) < 10) break;
        }
        ctx.strokeStyle = "rgba(0,255,163,0.85)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
        ctx.restore();

        if (now - planningStartRef.current >= dur + 200) setStep("slam");
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
      if (!isEdit && (step === "slam" || step === "docking" || (step === "anchors" && signalReceivedRef.current))) {
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = "rgba(57,183,255,0.6)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(robot.x, robot.y);
        ctx.lineTo(carPort.x, carPort.y);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Predicted path (curved, obstacle-aware) overlay
      const drawPredictedPath = () => {
        const maxSteps = 160;
        const stepLen = 3.5; // pixels per step
        const pts: Pt[] = [{ x: robot.x, y: robot.y }];
        let p = { x: robot.x, y: robot.y };
        for (let i = 0; i < maxSteps; i++) {
          const toTarget = norm(sub(carPort, p));
          const repel = obstacles.reduce(
            (acc, o) => {
              const d = Math.hypot(p.x - o.c.x, p.y - o.c.y);
              const rad = o.r + 26;
              if (d < rad && d > 0) {
                const dir = norm(sub(p, o.c));
                const k = (rad - d) / rad;
                return add(acc, mul(dir, k * 1.4));
              }
              return acc;
            },
            { x: 0, y: 0 }
          );
          const v = add(mul(toTarget, stepLen), mul(repel, 60 * (1 / 30)));
          const next = add(p, v);
          pts.push(next);
          p = next;
          if (len(p, carPort) < 10) break;
        }
        ctx.strokeStyle = "rgba(0,255,163,0.7)";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y);
        ctx.stroke();
      };
      if (!isEdit && (step === "slam" || step === "docking" || step === "planning")) {
        drawPredictedPath();
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
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("resize", onWinResize);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, speed, obstacles, robot, car, step, showRays, chargeProgress]);

  // remove auto-transition; controlled by planning step

  return (
    <div className="relative">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left: Simulation viewport - responsive aspect ratio */}
        <div className="relative w-full aspect-[16/10] lg:aspect-auto lg:h-[520px] overflow-hidden rounded-lg border border-slate-300 dark:border-white/10 bg-slate-900 shadow-lg">
          <canvas
            ref={ref}
            width={520}
            height={340}
            className="w-full h-full block"
            onMouseDown={(e) => {
            if (!isEdit) return;
            const p = toLocal(e);
            // check robot
            if (Math.hypot(p.x - robot.x, p.y - robot.y) < 14) {
              dragRef.current = { type: "robot" };
              return;
            }
            // check car (approx box)
            if (p.x >= car.x - 18 && p.x <= car.x + 18 && p.y >= car.y - 10 && p.y <= car.y + 10) {
              dragRef.current = { type: "car" };
              return;
            }
            // check obstacles
            let idx = -1;
            let best = Infinity;
            obstacles.forEach((o, i) => {
              const d = Math.hypot(o.c.x - p.x, o.c.y - p.y);
              if (d < best && d <= o.r + 6) {
                best = d; idx = i;
              }
            });
            if (idx >= 0) dragRef.current = { type: "obstacle", idx };
            }}
            onMouseMove={(e) => {
            if (!isEdit) return;
            const drag = dragRef.current;
            if (!drag) return;
            const p = toLocal(e);
            if (drag.type === "robot") setRobot({ x: clamp(p.x, 10, BASE_W - 10), y: clamp(p.y, 10, BASE_H - 10) });
            else if (drag.type === "car") {
              const nx = clamp(p.x, 40, BASE_W - 40);
              const ny = clamp(p.y, 20, BASE_H - 20);
              setCar({ x: nx, y: ny });
            } else if (drag.type === "obstacle" && drag.idx !== undefined) {
              const idx = drag.idx;
              setObstacles((obs) => obs.map((o, i) => {
                if (i !== idx) return o;
                const next = enforceTargetClear({ x: p.x, y: p.y }, o.r);
                return { ...o, c: next };
              }));
            }
            }}
            onMouseUp={() => { dragRef.current = null; }}
            onMouseLeave={() => { dragRef.current = null; }}
            onDoubleClick={(e) => {
            if (!isEdit) return;
            const p = toLocal(e);
            setObstacles((obs) => {
              if (obs.length >= 8) return obs; // limit
              const r = 12 + Math.round(Math.random() * 8);
              const c = enforceTargetClear({ x: p.x, y: p.y }, r);
              return [...obs, { c, r }];
            });
            }}
            onContextMenu={(e) => {
            if (!isEdit) return;
            e.preventDefault();
            const p = toLocal(e);
            let idx = -1;
            let best = Infinity;
            obstacles.forEach((o, i) => {
              const d = Math.hypot(o.c.x - p.x, o.c.y - p.y);
              if (d < best) { best = d; idx = i; }
            });
            if (idx >= 0) setObstacles((obs) => obs.filter((_, i) => i !== idx));
            }}
          />
        </div>

        {/* Right: Controls - improved readability */}
        <aside className="rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/90 p-4 shadow-lg">
          <div className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Controls</div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={() => {
                setIsEdit((e) => !e);
                if (isEdit) {
                  setStep("anchors");
                  setPlaying(true);
                  scanningStartRef.current = performance.now();
                } else {
                  setPlaying(false);
                  resetVisuals();
                  bothHitRef.current = false;
                  signalReceivedRef.current = false;
                }
              }}
              className={`rounded-lg px-4 py-2.5 text-sm font-medium transition-colors border ${
                isEdit 
                  ? "bg-slate-200 dark:bg-white/10 text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 border-slate-300 dark:border-white/10" 
                  : "bg-[color:var(--color-neon-blue)]/20 text-[color:var(--color-neon-blue)] ring-1 ring-[color:var(--color-neon-blue)]/30 border-[color:var(--color-neon-blue)]/30"
              }`}
            >
              {isEdit ? "Enter Run" : "Enter Edit"}
            </button>
            {!isEdit && (
              <button
                onClick={() => setPlaying((v) => !v)}
                className="rounded-lg bg-slate-200 dark:bg-white/10 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-colors border border-slate-300 dark:border-white/10"
              >
                {playing ? "Pause" : "Play"}
              </button>
            )}
            <button
              onClick={() => {
                setTrail([]);
                setRobot({ x: 60, y: 180 });
                setStep("anchors");
                setChargeProgress(0);
                resetVisuals();
                bothHitRef.current = false;
                signalReceivedRef.current = false;
                setPlaying(false);
                setIsEdit(true);
              }}
              className="rounded-lg bg-slate-200 dark:bg-white/10 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-colors border border-slate-300 dark:border-white/10"
            >
              Reset
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-900 dark:text-white">
            {!isEdit && (
              <div className="flex items-center gap-2 w-full">
                <label className="font-medium">Speed:</label>
                <input
                  type="range"
                  className="flex-1"
                  min={0.4}
                  max={2}
                  step={0.1}
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                />
                <span className="text-xs font-mono text-slate-900 dark:text-white">{speed.toFixed(1)}x</span>
              </div>
            )}
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" checked={showRays} onChange={(e) => setShowRays(e.target.checked)} />
              <span>Show LiDAR</span>
            </label>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-sm font-medium text-slate-900 dark:text-white">Quick Steps</div>
            <div className="flex flex-wrap gap-2">
              {(["anchors", "slam", "docking", "charging"] as Step[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setStep(s);
                    setPlaying(true);
                  }}
                  className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors border ${
                    step === s 
                      ? "bg-[color:var(--color-neon-blue)]/20 text-[color:var(--color-neon-blue)] ring-1 ring-[color:var(--color-neon-blue)]/30 border-[color:var(--color-neon-blue)]/30" 
                      : "bg-slate-200 dark:bg-white/5 text-slate-900 dark:text-white border-slate-300 dark:border-white/10 hover:bg-slate-300 dark:hover:bg-white/10"
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/5 p-3 text-sm text-slate-900 dark:text-white">
            <div className="mb-1.5 font-semibold text-slate-900 dark:text-white">Status</div>
            <div className="text-slate-700 dark:text-slate-300 capitalize">{`Step: ${step}`}</div>
            <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">Anchors → Planning → SLAM → Docking → Charging</div>
          </div>

          {isEdit && (
            <div className="mt-3 rounded-lg border border-blue-400 dark:border-blue-500/30 bg-blue-50 dark:bg-blue-900/20 p-3 text-sm text-blue-900 dark:text-blue-300">
              Tip: Drag robot, car, or obstacles. Double-click to add. Right-click to remove.
            </div>
          )}

        </aside>
      </div>
    </div>
  );
}