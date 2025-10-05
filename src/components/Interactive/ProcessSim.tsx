"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, TransformControls, Line, Grid, Environment } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import * as THREE from "three";
import { Step, useSim } from "./simStore";

const sideOffset = new THREE.Vector3(-1.2, 0, 0); // charging port on car's left side (outside clearly)
const OBSTACLES: { c: THREE.Vector3; s: number }[] = [
  { c: new THREE.Vector3(-2.5, 0.4, -1.2), s: 1.1 },
  { c: new THREE.Vector3(0.0, 0.4, 0.0), s: 1.1 },
  { c: new THREE.Vector3(2.6, 0.4, 1.4), s: 1.1 },
  { c: new THREE.Vector3(1.2, 0.4, -2.0), s: 1.1 },
  { c: new THREE.Vector3(-1.8, 0.4, 2.1), s: 1.1 },
];

// Helper: segment vs AABB (XZ plane)
function segmentIntersectsAABBXZ(p0: THREE.Vector3, p1: THREE.Vector3, min: THREE.Vector3, max: THREE.Vector3): boolean {
  let t0 = 0;
  let t1 = 1;
  const dx = p1.x - p0.x;
  const dz = p1.z - p0.z;

  // X slabs
  if (Math.abs(dx) < 1e-6) {
    if (p0.x < min.x || p0.x > max.x) return false;
  } else {
    const inv = 1 / dx;
    let tNear = (min.x - p0.x) * inv;
    let tFar = (max.x - p0.x) * inv;
    if (tNear > tFar) [tNear, tFar] = [tFar, tNear];
    t0 = Math.max(t0, tNear);
    t1 = Math.min(t1, tFar);
    if (t1 < t0) return false;
  }

  // Z slabs
  if (Math.abs(dz) < 1e-6) {
    if (p0.z < min.z || p0.z > max.z) return false;
  } else {
    const inv = 1 / dz;
    let tNear = (min.z - p0.z) * inv;
    let tFar = (max.z - p0.z) * inv;
    if (tNear > tFar) [tNear, tFar] = [tFar, tNear];
    t0 = Math.max(t0, tNear);
    t1 = Math.min(t1, tFar);
    if (t1 < t0) return false;
  }

  return t1 >= 0 && t0 <= 1;
}
// Primitive shapes (no external models)
function Car() {
  return (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.6, 3.6]} />
        <meshStandardMaterial color="#9ca3af" metalness={0.35} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.62, 0]}>
        <boxGeometry args={[1.85, 0.04, 3.65]} />
        <meshStandardMaterial color="#00ffa3" emissive="#0a523f" emissiveIntensity={0.35} />
      </mesh>
      {[
        [-0.7, 0.18, 1.3],
        [0.7, 0.18, 1.3],
        [-0.7, 0.18, -1.3],
        [0.7, 0.18, -1.3],
      ].map((p, i) => (
        <mesh key={i} position={p as unknown as [number, number, number]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.28, 0.28, 0.22, 24]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.3} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

function Robot() {
  return (
    <group>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.35, 0.35, 0.22, 32]} />
        <meshStandardMaterial color="#a3b2c6" metalness={0.4} roughness={0.42} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.12, 32]} />
        <meshStandardMaterial color="#39b7ff" emissive="#0b3a52" emissiveIntensity={0.8} />
      </mesh>
    </group>
  );
}

function Draggable({
  active,
  children,
  onChange,
  initial,
  controlsRef,
  lockY,
  onDragChange,
}: {
  active: boolean;
  children: React.ReactNode;
  onChange: (v: THREE.Vector3) => void;
  initial: THREE.Vector3;
  controlsRef?: React.MutableRefObject<import("three-stdlib").OrbitControls | null>;
  lockY?: number;
  onDragChange?: (dragging: boolean) => void;
}) {
  const ref = useRef<THREE.Object3D>(null!);
  const tcRef = useRef<import("three-stdlib").TransformControls | null>(null);
  const lastPosRef = useRef<THREE.Vector3 | null>(null);

  // Set initial position once
  useEffect(() => {
    if (ref.current) {
      ref.current.position.copy(initial);
    }
  }, [initial]);

  // Disable orbit controls while dragging
  useEffect(() => {
    const tc = tcRef.current;
    const oc = controlsRef?.current;
    if (!tc || !oc) return;
    const handler = (e: { value: boolean }) => {
      oc.enabled = !e.value;
      onDragChange?.(e.value);
      // Commit position only when dragging ends to avoid re-render churn breaking capture
      if (!e.value && ref.current) {
        if (typeof lockY === "number") ref.current.position.y = lockY;
        const p = lastPosRef.current ?? ref.current.position.clone();
        onChange(p.clone());
      }
    };
    // TransformControls emits a custom event name; cast to suppress overly strict typing
    (tc as unknown as { addEventListener: (t: string, f: (e: { value: boolean }) => void) => void }).addEventListener("dragging-changed", handler);
    return () => (tc as unknown as { removeEventListener: (t: string, f: (e: { value: boolean }) => void) => void }).removeEventListener("dragging-changed", handler);
  }, [controlsRef, onDragChange, lockY, onChange]);

  return (
    <TransformControls
      ref={tcRef}
      mode="translate"
      enabled={active}
      object={ref}
      showY={false}
      showX
      showZ
      onMouseDown={() => {
        console.log("mouse down");
        const oc = controlsRef?.current;
        if (oc) oc.enabled = false;
        onDragChange?.(true);
      }}
      onMouseUp={() => {
        console.log("mouse up");
        const oc = controlsRef?.current;
        if (oc) oc.enabled = true;
        onDragChange?.(false);
      }}
      onObjectChange={() => {
        if (!ref.current) return;
        if (typeof lockY === "number") ref.current.position.y = lockY;
        // Track latest position locally; we will commit on drag end
        lastPosRef.current = ref.current.position.clone();
      }}
    >
      <group ref={ref}>{children}</group>
    </TransformControls>
  );
}

function PathLine({ points }: { points: THREE.Vector3[] }) {
  if (!points || points.length < 2) return null;
  const pts = points.map((p) => [p.x, p.y, p.z] as [number, number, number]);
  return <Line points={pts} color="#00ffa3" transparent opacity={0.75} />;
}

function GuidanceLine({ a, b, progress = 1 }: { a: THREE.Vector3; b: THREE.Vector3; progress?: number }) {
  const p = a.clone().lerp(b, THREE.MathUtils.clamp(progress, 0, 1));
  const pts: [number, number, number][] = [a.toArray() as [number, number, number], p.toArray() as [number, number, number]];
  return (
    <Line
      points={pts}
      color="#39b7ff"
      transparent
      opacity={0.6}
      dashed
      dashSize={0.3}
      gapSize={0.2}
    />
  );
}

function StepVisuals() {
  const { step, robotPos, carPos } = useSim();
  const sweepRef = useRef<THREE.Mesh>(null!);
  const blueRingRef = useRef<THREE.Mesh>(null!);
  const time = useRef(0);
  const guideProgress = useRef(0);
  useFrame((_, dt) => {
    time.current += dt;
    if (sweepRef.current) sweepRef.current.rotation.z -= dt * 1.5;
    guideProgress.current = Math.min(1, guideProgress.current + dt * 0.5);
    // Animate blue charging ring up/down to indicate energy transfer
    if (step === "charging" && blueRingRef.current) {
      const baseY = 0.65;
      const amplitude = 0.12;
      const speed = 2.6;
      blueRingRef.current.position.y = baseY + Math.sin(time.current * speed) * amplitude;
    }
  });

  const anchors = [
    new THREE.Vector3(-6, 0.05, -4),
    new THREE.Vector3(6, 0.05, -4),
    new THREE.Vector3(-6, 0.05, 4),
    new THREE.Vector3(6, 0.05, 4),
  ];

  return (
    <>
      {step === "scan" && (
        <mesh ref={sweepRef} position={[robotPos.x, 0.03, robotPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 2.4, 64, 1, 0, Math.PI / 3]} />
          <meshBasicMaterial color="#39b7ff" transparent opacity={0.28} depthWrite={false} blending={THREE.AdditiveBlending} />
        </mesh>
      )}

      {step === "scan" && (
        <>
          {anchors.map((p, i) => (
            <group key={i} position={p.toArray()}>
              <mesh>
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshStandardMaterial color="#39b7ff" emissive="#0a2a3a" emissiveIntensity={0.6} />
              </mesh>
              {[0, 0.6].map((phase, k) => {
                const t = (time.current + phase) % 1.0;
                const r = 0.4 + t * 10.0;
                const op = 0.22 * (1 - t);
                return (
                  <mesh key={k} rotation={[-Math.PI / 2, 0, 0]}>
                    <ringGeometry args={[r, r + 0.06, 96]} />
                    <meshBasicMaterial color="#39b7ff" transparent opacity={op} depthWrite={false} blending={THREE.AdditiveBlending} />
                  </mesh>
                );
              })}
            </group>
          ))}

          {/* Brief glow on robot/car when pulse passes */}
          {(() => {
            const radii = [0, 0.6].map((phase) => 0.4 + ((time.current + phase) % 1.0) * 10.0);
            const near = 0.35;
            const carTarget = carPos.clone().add(sideOffset);
            const anyNear = anchors.some((a) =>
              radii.some((rr) => Math.abs(a.distanceTo(robotPos) - rr) < near)
            );
            const anyNearCar = anchors.some((a) =>
              radii.some((rr) => Math.abs(a.distanceTo(carTarget) - rr) < near)
            );
            return (
              <>
                {anyNear && (
                  <mesh position={[robotPos.x, 0.5, robotPos.z]}>
                    <sphereGeometry args={[0.24, 16, 16]} />
                    <meshBasicMaterial color="#8af7d1" transparent opacity={0.42} depthWrite={false} blending={THREE.AdditiveBlending} />
                  </mesh>
                )}
                {anyNearCar && (
                  <mesh position={carTarget.toArray()}>
                    <sphereGeometry args={[0.24, 16, 16]} />
                    <meshBasicMaterial color="#8af7d1" transparent opacity={0.42} depthWrite={false} blending={THREE.AdditiveBlending} />
                  </mesh>
                )}
              </>
            );
          })()}

          {/* After both pulses: send signal from car to robot and form guiding dashed line */}
          <GuidanceLine a={carPos.clone().add(sideOffset)} b={robotPos.clone()} progress={guideProgress.current} />

          {/* Traveling pulse along the dashed line */}
          {(() => {
            const u = (time.current * 0.45) % 1; // slower pulse speed
            const start = carPos.clone().add(sideOffset);
            const pos = start.clone().lerp(robotPos, u);
            return (
              <mesh position={pos.toArray()}>
                <sphereGeometry args={[0.12, 16, 16]} />
                <meshBasicMaterial color="#eaf6ff" transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
              </mesh>
            );
          })()}
        </>
      )}

      {/* After scanning, reveal target with a soft pulsing glow to convey positioning resolved */}
      {(step === "navigating" || step === "docking") && (
        <group position={carPos.clone().add(sideOffset).toArray()} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <ringGeometry args={[0.25, 0.3, 64]} />
            <meshBasicMaterial color="#00ffa3" transparent opacity={0.95} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh>
            <ringGeometry args={[0.34, 0.42, 64]} />
            <meshBasicMaterial color="#00ffa3" transparent opacity={0.25 + 0.2 * Math.abs(Math.sin(time.current * 2))} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      )}

      {step === "docking" && (
        <group position={carPos.clone().add(sideOffset).toArray()}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.22, 0.26, 32]} />
            <meshBasicMaterial color="#00ffa3" transparent opacity={0.9} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
        </group>
      )}

      {step === "charging" && (
        <>
          <mesh position={carPos.clone().add(sideOffset).add(new THREE.Vector3(0, 0.65, 0)).toArray()} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.26, 0.36, 96]} />
            <meshBasicMaterial color="#00ffa3" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <mesh ref={blueRingRef} position={[robotPos.x, 0.65, robotPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.22, 0.32, 96]} />
            <meshBasicMaterial color="#39b7ff" transparent opacity={0.8} depthWrite={false} blending={THREE.AdditiveBlending} />
          </mesh>
          <Line points={[new THREE.Vector3(robotPos.x, 0.65, robotPos.z), carPos.clone().add(sideOffset).setY(0.65)]} color="#8af7d1" transparent opacity={0.5} />
        </>
      )}
    </>
  );
}

export function MainScene({ topDown, showRays, showRoom, kbActive }: { topDown: boolean; showRays: boolean; showRoom: boolean; kbActive: boolean }) {
  const { step, playing, setStep, robotPos, carPos, setRobotPos, setCarPos } = useSim();
  const [path, setPath] = useState<THREE.Vector3[]>([]);
  const [predicted, setPredicted] = useState<THREE.Vector3[]>([]);
  const controls = useRef<import("three-stdlib").OrbitControls | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera>(null);
  const pressedRef = useRef<Set<string>>(new Set());
  const obstacles = useMemo(() => OBSTACLES, []);
  const rayAABB = (
    ro: THREE.Vector3,
    rd: THREE.Vector3,
    min: THREE.Vector3,
    max: THREE.Vector3
  ) => {
    let tmin = -Infinity;
    let tmax = Infinity;
    for (const axis of ["x", "y", "z"] as const) {
      const invD = 1 / (rd[axis] === 0 ? 1e-6 : rd[axis]);
      let t0 = (min[axis] - ro[axis]) * invD;
      let t1 = (max[axis] - ro[axis]) * invD;
      if (t0 > t1) [t0, t1] = [t1, t0];
      tmin = Math.max(tmin, t0);
      tmax = Math.min(tmax, t1);
      if (tmax < tmin) return null;
    }
    return tmin > 0 ? tmin : tmax > 0 ? tmax : null;
  };

  useEffect(() => {
    const target = carPos.clone().add(sideOffset);
    const pts: THREE.Vector3[] = [];
    const N = 64;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = THREE.MathUtils.lerp(robotPos.x, target.x, t);
      const z = THREE.MathUtils.lerp(robotPos.z, target.z, t) + Math.sin(t * Math.PI) * 0.6;
      pts.push(new THREE.Vector3(x, 0.02, z));
    }
    setPath(pts);
  }, [robotPos.x, robotPos.z, carPos.x, carPos.z, carPos]);

  // Predicted path using simple potential fields (avoids obstacles). Updates each frame while scanning/homing
  useFrame(() => {
    if (!(step === "scan" || step === "navigating")) return;
    const target = carPos.clone().add(sideOffset);
    const simPos = robotPos.clone();
    const nodes: THREE.Vector3[] = [simPos.clone()];
    const up = new THREE.Vector3(0, 1, 0);
    for (let i = 0; i < 60; i++) {
      const toT = target.clone().sub(simPos).setY(0);
      const d = toT.length();
      if (d < 0.05) break;
      toT.normalize();
      const repel = new THREE.Vector3();
      const tangent = new THREE.Vector3();
      obstacles.forEach(({ c, s }) => {
        const half = s / 2;
        const min = new THREE.Vector3(c.x - half, -Infinity, c.z - half);
        const max = new THREE.Vector3(c.x + half, Infinity, c.z + half);
        const p = simPos.clone();
        const closest = new THREE.Vector3(
          Math.max(min.x, Math.min(p.x, max.x)),
          0,
          Math.max(min.z, Math.min(p.z, max.z))
        );
        const away = p.clone().sub(closest).setY(0);
        const dist = Math.max(0.0001, away.length());
        const influence = half + 1.1;
        if (dist < influence) {
          const falloff = (1 - dist / influence) ** 2;
          const awayDir = away.normalize();
          repel.add(awayDir.clone().multiplyScalar(falloff * 2.0));
          const left = awayDir.clone().applyAxisAngle(up, Math.PI / 2);
          const right = awayDir.clone().applyAxisAngle(up, -Math.PI / 2);
          const choose = left.dot(toT) > right.dot(toT) ? left : right;
          tangent.add(choose.multiplyScalar(falloff * 1.4));
        }
      });
      const v = toT.clone().multiplyScalar(0.25).add(repel).add(tangent);
      simPos.add(v.multiplyScalar(0.2));
      nodes.push(simPos.clone().setY(0.02));
      if (nodes.length > 80) break;
    }
    setPredicted(nodes);
  });

  useFrame((_, dt) => {
    if (!playing) return;
    if (step === "navigating" || step === "docking") {
      const dockTarget = carPos.clone().add(sideOffset);
      const desired = step === "navigating" ? path[Math.min(24, path.length - 1)] : dockTarget;
      const toTarget = desired.clone().sub(robotPos).setY(0);
      const d = toTarget.length();

      // If direct segment intersects any obstacle AABB, push a detour along the axis of least penetration
      let detour = new THREE.Vector3();
      for (const { c, s } of obstacles) {
        const half = s / 2;
        const min = new THREE.Vector3(c.x - half, -Infinity, c.z - half);
        const max = new THREE.Vector3(c.x + half, Infinity, c.z + half);
        if (segmentIntersectsAABBXZ(robotPos, desired, min, max)) {
          // choose axis to sidestep based on which side has more clearance
          const left = new THREE.Vector3(-toTarget.z, 0, toTarget.x).normalize();
          const right = left.clone().multiplyScalar(-1);
          const leftProbe = robotPos.clone().add(left.clone().multiplyScalar(0.8));
          const rightProbe = robotPos.clone().add(right.clone().multiplyScalar(0.8));
          const collides = (p: THREE.Vector3) =>
            obstacles.some(({ c: cc, s: ss }) => {
              const h = ss / 2;
              return (
                p.x >= cc.x - h && p.x <= cc.x + h && p.z >= cc.z - h && p.z <= cc.z + h
              );
            });
          if (!collides(leftProbe) && collides(rightProbe)) detour = left.multiplyScalar(1.2);
          else if (!collides(rightProbe) && collides(leftProbe)) detour = right.multiplyScalar(1.2);
          else detour = (Math.random() > 0.5 ? left : right).multiplyScalar(1.2);
          break;
        }
      }

      if (d > 0.01) {
        toTarget.normalize();

        // Obstacle avoidance force fields (kept, but lowered to avoid over-cancellation)
        const repel = new THREE.Vector3();
        const tangent = new THREE.Vector3();
        const up = new THREE.Vector3(0, 1, 0);
        obstacles.forEach(({ c, s }) => {
          const half = s / 2;
          const min = new THREE.Vector3(c.x - half, -Infinity, c.z - half);
          const max = new THREE.Vector3(c.x + half, Infinity, c.z + half);
          const p = robotPos.clone();
          const closest = new THREE.Vector3(
            Math.max(min.x, Math.min(p.x, max.x)),
            0,
            Math.max(min.z, Math.min(p.z, max.z))
          );
          const away = p.clone().sub(closest).setY(0);
          const dist = Math.max(0.0001, away.length());
          const influence = half + 0.9;
          if (dist < influence) {
            const falloff = (1 - dist / influence) ** 2;
            const awayDir = away.normalize();
            repel.add(awayDir.clone().multiplyScalar(falloff * 1.6));
            const left = awayDir.clone().applyAxisAngle(up, Math.PI / 2);
            const right = awayDir.clone().applyAxisAngle(up, -Math.PI / 2);
            const choose = left.dot(toTarget) > right.dot(toTarget) ? left : right;
            tangent.add(choose.multiplyScalar(falloff * 1.1));
          }
        });

        const v = toTarget
          .clone()
          .multiplyScalar(step === "navigating" ? 1.2 : 0.55)
          .add(detour)
          .add(repel)
          .add(tangent);

        setRobotPos(robotPos.clone().addScaledVector(v, dt));
      } else if (step === "navigating") {
        setStep("docking");
      } else if (step === "docking") {
        setStep("charging");
      }
    }
  });

  // WASD navigation when view is focused
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'a' || k === 's' || k === 'd') {
        pressedRef.current.add(k);
      }
    };
    const up = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'w' || k === 'a' || k === 's' || k === 'd') {
        pressedRef.current.delete(k);
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  useFrame((_, dt) => {
    if (!kbActive) return;
    const cam = cameraRef.current;
    const oc = controls.current;
    if (!cam || !oc) return;
    const speed = (topDown ? 6 : 4) * dt;
    const forward = new THREE.Vector3();
    cam.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).negate();
    const move = new THREE.Vector3();
    const keys = pressedRef.current;
    if (keys.has('w')) move.add(forward);
    if (keys.has('s')) move.add(forward.clone().multiplyScalar(-1));
    if (keys.has('d')) move.add(right);
    if (keys.has('a')) move.add(right.clone().multiplyScalar(-1));
    if (move.lengthSq() === 0) return;
    move.normalize().multiplyScalar(speed);
    cam.position.add(move);
    oc.target.add(move);
  });

  return (
    <>
      {/* Ground plane under the grid */}
      <mesh position={[0, -0.001, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[60, 60]} />
        <meshStandardMaterial color="#0b1117" roughness={0.95} metalness={0} />
      </mesh>

      <ambientLight intensity={0.4} />
      <hemisphereLight args={[0xbcc7d6, 0x1a1f26, 0.7]} />
      <directionalLight position={[5, 6, 3]} intensity={0.5} castShadow />
      <directionalLight position={[-6, 5, -3]} intensity={0.2} />

      {/* Grid ground */}
      <Grid args={[30, 30]} cellSize={0.6} cellThickness={0.5} sectionSize={3} sectionThickness={1} fadeDistance={18} fadeStrength={1} followCamera={false} infiniteGrid />

      {/* Subtle environment lighting to prevent dark materials from appearing black */}
      <Environment preset="city" background={false} />

      {/* Optional room (open on viewing/front side) */}
      {showRoom && (
        <group>
          {/* Back wall */}
          <mesh position={[0, 3, -12]} receiveShadow>
            <planeGeometry args={[24, 6]} />
            <meshStandardMaterial color="#111827" roughness={0.95} />
          </mesh>
          {/* Left wall */}
          <mesh position={[-12, 3, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
            <planeGeometry args={[24, 6]} />
            <meshStandardMaterial color="#0f172a" roughness={0.95} />
          </mesh>
          {/* Right wall */}
          <mesh position={[12, 3, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
            <planeGeometry args={[24, 6]} />
            <meshStandardMaterial color="#0f172a" roughness={0.95} />
          </mesh>
          {/* Ceiling: hide in top-down to avoid blocking */}
          {!topDown && (
            <mesh position={[0, 6, 0]} rotation={[Math.PI / 2, 0, 0]} receiveShadow>
              <planeGeometry args={[24, 24]} />
              <meshStandardMaterial color="#0b1320" roughness={0.9} />
            </mesh>
          )}
        </group>
      )}

      <Draggable
        active={!playing}
        onChange={setCarPos}
        initial={carPos}
        controlsRef={controls}
        lockY={carPos.y}
        onDragChange={(d)=>{ if (controls.current) controls.current.enabled = !d; }}
      >
        <Car />
      </Draggable>

      <Draggable
        active={!playing}
        onChange={setRobotPos}
        initial={robotPos}
        controlsRef={controls}
        lockY={robotPos.y}
        onDragChange={(d)=>{ if (controls.current) controls.current.enabled = !d; }}
      >
        <Robot />
      </Draggable>

      {/* Hide target marker during scan; it's revealed with glow in StepVisuals post‑scan */}
      {step !== "scan" && (
        <mesh position={carPos.clone().add(sideOffset).toArray()} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.25, 0.3, 32]} />
          <meshBasicMaterial color="#00ffa3" />
        </mesh>
      )}
      <mesh position={[robotPos.x, 0.02, robotPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.27, 32]} />
        <meshBasicMaterial color="#39b7ff" />
      </mesh>

      <PathLine points={path} />
      {predicted.length > 1 && (
        <Line
          points={predicted.map((p) => [p.x, p.y, p.z] as [number, number, number])}
          color="#39b7ff"
          transparent
          opacity={0.85}
        />
      )}

      {/* Obstacles */}
      {obstacles.map(({ c, s }, i) => (
        <mesh key={i} position={c.toArray()} castShadow>
          <boxGeometry args={[s, s, s]} />
          <meshStandardMaterial color="#ff6b6b" />
        </mesh>
      ))}

      {/* SLAM beams (scan + navigating) */}
      {showRays && (step === "scan" || step === "navigating") && (
        (() => {
          const rays = typeof window !== "undefined" && window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 32 : 64;
          const positions: number[] = [];
          for (let i = 0; i < rays; i++) {
            const a = (i / rays) * Math.PI * 2;
            const ro = robotPos.clone();
            const rd = new THREE.Vector3(Math.cos(a), 0, Math.sin(a)).normalize();
            let minT: number | null = null;
            obstacles.forEach(({ c, s }) => {
              const min = c.clone().addScalar(-s / 2);
              const max = c.clone().addScalar(s / 2);
              const t = rayAABB(ro, rd, min, max);
              if (t && t > 0 && (minT === null || t < minT)) minT = t;
            });
            const maxR = 8;
            const t = minT !== null ? Math.min(minT, maxR) : maxR;
            const hit = ro.add(rd.multiplyScalar(t));
            positions.push(robotPos.x, robotPos.y + 0.05, robotPos.z, hit.x, hit.y, hit.z);
          }
          return (
            <lineSegments key={`${robotPos.x.toFixed(2)}-${robotPos.z.toFixed(2)}-${step}`}>
              <bufferGeometry>
                <bufferAttribute attach="attributes-position" args={[new Float32Array(positions), 3]} />
              </bufferGeometry>
              <lineBasicMaterial color="#39b7ff" transparent opacity={step === "scan" ? 0.24 : 0.15} />
            </lineSegments>
          );
        })()
      )}

      <StepVisuals />

      <OrbitControls
        ref={controls}
        enableDamping
        maxPolarAngle={Math.PI / 2.05}
        minPolarAngle={topDown ? 0 : 0}
        enablePan={false}
        enableRotate={!topDown}
        minDistance={4}
        maxDistance={14}
        makeDefault
      />
      <PerspectiveCamera ref={cameraRef} makeDefault position={topDown ? [0.01, 16, 0.01] : [7.5, 7, 7.5]} fov={50} />
    </>
  );
}

function MiniMap() {
  const { robotPos, carPos } = useSim();
  // 2D representation using HTML canvas for crisp/UI-like look (not real 3D)
  return (
    <div className="h-full w-full bg-[#0b1117]">
      <svg viewBox="0 0 300 200" preserveAspectRatio="xMidYMid meet" className="h-full w-full">
        {/* grid */}
        <defs>
          <pattern id="g" width="20" height="20" patternUnits="userSpaceOnUse">
            <path d="M 20 0 L 0 0 0 20" fill="none" stroke="#1f2a37" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="300" height="200" fill="url(#g)" />
        {/* convert world [-15..15]x[-10..10] to svg */}
        {(() => {
          const toX = (x: number) => ((x + 15) / 30) * 300;
          const toY = (z: number) => ((10 - z) / 20) * 200;
          const car = carPos.clone().add(sideOffset);
          const rx = toX(robotPos.x);
          const rz = toY(robotPos.z);
          const cx = toX(car.x);
          const cz = toY(car.z);
          return (
            <g>
              {/* obstacles */}
              {OBSTACLES.map((o, i) => (
                <rect key={i} x={toX(o.c.x - o.s / 2)} y={toY(o.c.z + o.s / 2)} width={(o.s / 30) * 300} height={(o.s / 20) * 200} fill="#ff6b6b" fillOpacity="0.8" />
              ))}
              {/* straight guide */}
              <line x1={rx} y1={rz} x2={cx} y2={cz} stroke="#39b7ff" strokeOpacity="0.35" strokeDasharray="6 6" />
              <circle cx={cx} cy={cz} r={6} fill="#00ffa3" fillOpacity="0.9" />
              <circle cx={rx} cy={rz} r={6} fill="#39b7ff" fillOpacity="0.95" />
            </g>
          );
        })()}
      </svg>
    </div>
  );
}

export default function ProcessSim() {
  const { step, setStep, playing, setPlaying, reset } = useSim();
  const [canvasKey, setCanvasKey] = useState(0);
  const [contextLost, setContextLost] = useState(false);
  const [topDown, setTopDown] = useState(false);
  const [showRays, setShowRays] = useState(true);
  const [showRoom, setShowRoom] = useState(true);
  const [kbActive, setKbActive] = useState(false);
  useEffect(() => {
    if (!playing && step === "idle") return;
    if (step === "scan") {
      const id = setTimeout(() => setStep("navigating"), 2400);
      return () => clearTimeout(id);
    }
  }, [step, playing, setStep]);

  const start = () => {
    if (step === "idle") setStep("scan");
    setPlaying(true);
  };

  const stop = () => {
    setPlaying(false);
    reset();
  };

  return (
    <div className="relative">
      <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* Left: Simulation viewport - responsive aspect ratio */}
        <div className="relative w-full aspect-[16/10] lg:aspect-auto lg:h-[520px] overflow-hidden rounded-lg border border-white/10 bg-black/30">
          <Canvas
            key={canvasKey}
            shadows={{ type: THREE.PCFSoftShadowMap }}
            dpr={[1, 1.75]}
            gl={{ powerPreference: "high-performance", antialias: true }}
            onCreated={(state) => {
              const canvas = state.gl.domElement;
              const onLost = (e: Event) => {
                e.preventDefault();
                setContextLost(true);
              };
              canvas.addEventListener("webglcontextlost", onLost, { passive: false } as AddEventListenerOptions);
            }}
            onPointerOver={() => setKbActive(true)}
            onPointerOut={() => setKbActive(false)}
          >
            <Suspense fallback={null}>
              <MainScene topDown={topDown} showRays={showRays} showRoom={showRoom} kbActive={kbActive} />
            </Suspense>
          </Canvas>
          {contextLost && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50 backdrop-blur-sm">
              <div className="rounded-lg border border-white/15 bg-black/60 p-5 text-base">
                <div className="mb-3 text-white/90">Graphics context was lost.</div>
                <button
                  className="rounded-lg bg-white/10 px-4 py-2 text-white/90 hover:bg-white/15"
                  onClick={() => {
                    setContextLost(false);
                    setCanvasKey((k) => k + 1);
                  }}
                >
                  Restart 3D
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Right: Controls and status - improved readability */}
        <aside className="rounded-lg border border-slate-300 dark:border-white/10 bg-white dark:bg-slate-900/90 p-4 shadow-lg">
          <div className="mb-3 text-base font-semibold text-slate-900 dark:text-white">Controls</div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              className="rounded-lg bg-slate-200 dark:bg-white/10 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-colors border border-slate-300 dark:border-white/10"
              onClick={() => (playing ? setPlaying(false) : start())}
            >
              {playing ? "Pause" : "Play"}
            </button>
            <button className="rounded-lg bg-slate-200 dark:bg-white/10 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-colors border border-slate-300 dark:border-white/10" onClick={stop}>
              Stop
            </button>
            <button className="rounded-lg bg-slate-200 dark:bg-white/10 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-colors border border-slate-300 dark:border-white/10" onClick={() => setCanvasKey((k) => k + 1)}>
              Restart
            </button>
            <button
              className="rounded-lg bg-slate-200 dark:bg-white/10 px-4 py-2.5 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-300 dark:hover:bg-white/20 transition-colors border border-slate-300 dark:border-white/10"
              onClick={() => setTopDown((v) => !v)}
            >
              {topDown ? "Free View" : "Top-down"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-slate-900 dark:text-white">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" checked={showRays} onChange={(e) => setShowRays(e.target.checked)} />
              <span>Show LiDAR</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" className="w-4 h-4" checked={showRoom} onChange={(e) => setShowRoom(e.target.checked)} />
              <span>Show Room</span>
            </label>
          </div>

          <div className="mt-5">
            <div className="mb-2 text-sm font-medium text-slate-900 dark:text-white">Quick Steps</div>
            <div className="flex flex-wrap gap-2">
              {(["scan", "navigating", "docking", "charging"] as Step[]).map((s) => (
                <button
                  key={s}
                  className={`rounded-lg px-3 py-2 text-sm font-medium capitalize transition-colors border ${
                    step === s
                      ? "bg-[color:var(--color-neon-blue)]/20 text-[color:var(--color-neon-blue)] ring-1 ring-[color:var(--color-neon-blue)]/30 border-[color:var(--color-neon-blue)]/30"
                      : "bg-slate-200 dark:bg-white/5 text-slate-900 dark:text-white border-slate-300 dark:border-white/10 hover:bg-slate-300 dark:hover:bg-white/10"
                  }`}
                  onClick={() => {
                    setStep(s);
                    setPlaying(true);
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-lg border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/5 p-3 text-sm text-slate-900 dark:text-white">
            <div className="mb-1.5 font-semibold text-slate-900 dark:text-white">Status</div>
            <div className="text-slate-700 dark:text-slate-300 capitalize">{`Step: ${step}`}</div>
            <div className="mt-1.5 text-xs text-slate-600 dark:text-slate-400">Scan → Navigate → Dock → Charge</div>
          </div>

          {step === "charging" && (
            <div className="mt-3 rounded-lg border border-green-400 dark:border-green-500/30 bg-green-50 dark:bg-green-900/20 p-3 text-sm text-green-900 dark:text-green-300">
              Charging… Coils aligned. Energy transfer stabilized.
            </div>
          )}

          <div className="mt-5 rounded-lg border border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/5 p-3">
            <div className="mb-2 text-sm font-medium text-slate-900 dark:text-white">Mini-map</div>
            <div className="aspect-video overflow-hidden rounded-lg">
              <MiniMap />
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}