"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, PerspectiveCamera, TransformControls, Line, Grid } from "@react-three/drei";
import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import * as THREE from "three";
import { Step, useSim } from "./simStore";

// Primitive shapes (no external models)
function Car() {
  return (
    <group>
      <mesh position={[0, 0.3, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.8, 0.6, 3.6]} />
        <meshStandardMaterial color="#0e151b" metalness={0.2} roughness={0.6} />
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
          <meshStandardMaterial color="#111922" />
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
        <meshStandardMaterial color="#18222b" metalness={0.2} roughness={0.6} />
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
}: {
  active: boolean;
  children: React.ReactNode;
  onChange: (v: THREE.Vector3) => void;
  initial: THREE.Vector3;
}) {
  const ref = useRef<THREE.Object3D>(null!);
  useFrame(() => {
    if (ref.current) ref.current.position.lerp(initial, 0.2);
  });
  return (
    <TransformControls
      mode="translate"
      enabled={active}
      object={ref as any}
      onObjectChange={() => onChange(ref.current.position.clone())}
    >
      <group ref={ref}>{children}</group>
    </TransformControls>
  );
}

function PathLine({ points }: { points: THREE.Vector3[] }) {
  if (!points || points.length < 2) return null;
  return <Line points={points} color="#39b7ff" transparent opacity={0.6} />;
}

function StepVisuals() {
  const { step, robotPos, carPos } = useSim();
  const sweepRef = useRef<THREE.Mesh>(null!);
  const time = useRef(0);
  useFrame((_, dt) => {
    time.current += dt;
    if (sweepRef.current) sweepRef.current.rotation.z -= dt * 1.5;
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
          <meshBasicMaterial color="#39b7ff" transparent opacity={0.25} />
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
                    <meshBasicMaterial color="#39b7ff" transparent opacity={op} />
                  </mesh>
                );
              })}
            </group>
          ))}

          {/* Brief glow on robot/car when pulse passes */}
          {(() => {
            const radii = [0, 0.6].map((phase) => 0.4 + ((time.current + phase) % 1.0) * 10.0);
            const near = 0.35;
            const anyNear = anchors.some((a) =>
              radii.some((rr) => Math.abs(a.distanceTo(robotPos) - rr) < near)
            );
            const anyNearCar = anchors.some((a) =>
              radii.some((rr) => Math.abs(a.distanceTo(carPos) - rr) < near)
            );
            return (
              <>
                {anyNear && (
                  <mesh position={[robotPos.x, 0.5, robotPos.z]}>
                    <sphereGeometry args={[0.2, 12, 12]} />
                    <meshBasicMaterial color="#39b7ff" transparent opacity={0.3} />
                  </mesh>
                )}
                {anyNearCar && (
                  <mesh position={[carPos.x, 0.5, carPos.z]}>
                    <sphereGeometry args={[0.2, 12, 12]} />
                    <meshBasicMaterial color="#00ffa3" transparent opacity={0.3} />
                  </mesh>
                )}
              </>
            );
          })()}
        </>
      )}

      {/* After scanning, reveal target with a soft pulsing glow to convey positioning resolved */}
      {(step === "navigating" || step === "docking") && (
        <group position={[carPos.x, 0.03, carPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <ringGeometry args={[0.25, 0.3, 64]} />
            <meshBasicMaterial color="#00ffa3" transparent opacity={0.95} />
          </mesh>
          <mesh>
            <ringGeometry args={[0.34, 0.42, 64]} />
            <meshBasicMaterial color="#00ffa3" transparent opacity={0.25 + 0.2 * Math.abs(Math.sin(time.current * 2))} />
          </mesh>
        </group>
      )}

      {step === "docking" && (
        <group position={[carPos.x, 0.01, carPos.z]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.22, 0.26, 32]} />
            <meshBasicMaterial color="#00ffa3" />
          </mesh>
        </group>
      )}

      {step === "charging" && (
        <>
          <mesh position={[carPos.x, 0.65, carPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.26, 0.36, 96]} />
            <meshBasicMaterial color="#00ffa3" transparent opacity={0.8} />
          </mesh>
          <mesh position={[robotPos.x, 0.65, robotPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.22, 0.32, 96]} />
            <meshBasicMaterial color="#39b7ff" transparent opacity={0.8} />
          </mesh>
          <Line points={[new THREE.Vector3(robotPos.x, 0.65, robotPos.z), new THREE.Vector3(carPos.x, 0.65, carPos.z)]} color="#8af7d1" transparent opacity={0.5} />
        </>
      )}
    </>
  );
}

function MainScene() {
  const { step, playing, setStep, robotPos, carPos, setRobotPos, setCarPos } = useSim();
  const [path, setPath] = useState<THREE.Vector3[]>([]);
  const obstacles = useMemo(
    () => [
      { c: new THREE.Vector3(-2.5, 0.4, -1.2), s: 1.1 },
      { c: new THREE.Vector3(0.0, 0.4, 0.0), s: 1.1 },
      { c: new THREE.Vector3(2.6, 0.4, 1.4), s: 1.1 },
      { c: new THREE.Vector3(1.2, 0.4, -2.0), s: 1.1 },
      { c: new THREE.Vector3(-1.8, 0.4, 2.1), s: 1.1 },
    ],
    []
  );
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
    const pts: THREE.Vector3[] = [];
    const N = 64;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const x = THREE.MathUtils.lerp(robotPos.x, carPos.x, t);
      const z = THREE.MathUtils.lerp(robotPos.z, carPos.z, t) + Math.sin(t * Math.PI) * 0.6;
      pts.push(new THREE.Vector3(x, 0.02, z));
    }
    setPath(pts);
  }, [robotPos.x, robotPos.z, carPos.x, carPos.z]);

  useFrame((_, dt) => {
    if (!playing) return;
    if (step === "navigating" || step === "docking") {
      const target = step === "navigating" ? path[Math.min(24, path.length - 1)] : path[path.length - 1];
      const toTarget = target.clone().sub(robotPos).setY(0);
      const d = toTarget.length();
      if (d > 0.01) {
        toTarget.normalize();

        // Obstacle avoidance force fields
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
          const influence = half + 1.1; // a bit larger
          if (dist < influence) {
            const falloff = (1 - dist / influence) ** 2;
            const awayDir = away.normalize();
            repel.add(awayDir.clone().multiplyScalar(falloff * 2.0));
            const left = awayDir.clone().applyAxisAngle(up, Math.PI / 2);
            const right = awayDir.clone().applyAxisAngle(up, -Math.PI / 2);
            const choose = left.dot(toTarget) > right.dot(toTarget) ? left : right;
            tangent.add(choose.multiplyScalar(falloff * 1.4));
          }
        });

        const v = toTarget
          .clone()
          .multiplyScalar(step === "navigating" ? 1.4 : 0.6)
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

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 6, 3]} intensity={1} castShadow />

      {/* Grid ground */}
      <Grid args={[30, 30]} cellSize={0.6} cellThickness={0.5} sectionSize={3} sectionThickness={1} fadeDistance={18} fadeStrength={1} followCamera={false} infiniteGrid />

      <Draggable active={!playing} onChange={setCarPos} initial={carPos}>
        <Car />
      </Draggable>

      <Draggable active={!playing} onChange={setRobotPos} initial={robotPos}>
        <Robot />
      </Draggable>

      {/* Hide target marker during scan; it's revealed with glow in StepVisuals post‑scan */}
      {step !== "scan" && (
        <mesh position={[carPos.x, 0.02, carPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.25, 0.3, 32]} />
          <meshBasicMaterial color="#00ffa3" />
        </mesh>
      )}
      <mesh position={[robotPos.x, 0.02, robotPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.27, 32]} />
        <meshBasicMaterial color="#39b7ff" />
      </mesh>

      <PathLine points={path} />

      {/* Obstacles */}
      {obstacles.map(({ c, s }, i) => (
        <mesh key={i} position={c.toArray()} castShadow>
          <boxGeometry args={[s, s, s]} />
          <meshStandardMaterial color="#ff6b6b" />
        </mesh>
      ))}

      {/* SLAM beams (scan + navigating) */}
      {(step === "scan" || step === "navigating") &&
        new Array(48).fill(0).map((_, i) => {
          const a = (i / 48) * Math.PI * 2;
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
          return <Line key={i} points={[robotPos.clone(), hit]} color="#39b7ff" transparent opacity={step === "scan" ? 0.28 : 0.18} />;
        })}

      <StepVisuals />

      <OrbitControls enableDamping />
      <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={55} />
    </>
  );
}

function MiniMap() {
  const { robotPos, carPos } = useSim();
  return (
    <Canvas orthographic camera={{ zoom: 90, position: [0, 20, 0] }}>
      <color attach="background" args={["#0b1117"]} />
      <gridHelper args={[30, 30, "#1f2a37", "#1f2a37"]} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[30, 20]} />
        <meshBasicMaterial color="#0a0f14" />
      </mesh>
      <mesh position={[carPos.x, 0.02, carPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.22, 0.28, 32]} />
        <meshBasicMaterial color="#00ffa3" />
      </mesh>
      <mesh position={[robotPos.x, 0.02, robotPos.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.2, 0.26, 32]} />
        <meshBasicMaterial color="#39b7ff" />
      </mesh>
    </Canvas>
  );
}

export default function ProcessSim() {
  const { step, setStep, playing, setPlaying, reset } = useSim();
  const [canvasKey, setCanvasKey] = useState(0);
  const [contextLost, setContextLost] = useState(false);
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
      <div className="h-[520px] w-full overflow-hidden rounded-md relative">
        <Canvas
          key={canvasKey}
          shadows
          onCreated={(state) => {
            const canvas = state.gl.domElement;
            const onLost = (e: Event) => {
              e.preventDefault();
              setContextLost(true);
            };
            canvas.addEventListener("webglcontextlost", onLost, { passive: false } as AddEventListenerOptions);
          }}
        >
          <Suspense fallback={null}>
            <MainScene />
          </Suspense>
        </Canvas>
        {contextLost && (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/50">
            <div className="rounded-md border border-white/15 bg-black/60 p-4 text-sm">
              <div className="mb-2 text-white/80">Graphics context was lost.</div>
              <button
                className="rounded-md bg-white/10 px-3 py-1.5 text-white/90 hover:bg-white/15"
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

      <div className="pointer-events-none absolute right-3 top-3 w-56 overflow-hidden rounded-md border border-white/10 bg-black/40 shadow-[var(--shadow-glow)]">
        <div className="pointer-events-auto aspect-video">
          <MiniMap />
        </div>
        <div className="pointer-events-auto border-t border-white/10 px-2 py-1 text-center text-[10px] text-white/70">
          Top‑down view
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
          onClick={() => (playing ? setPlaying(false) : start())}
        >
          {playing ? "Pause" : "Play"}
        </button>
        <button className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15" onClick={stop}>
          Stop
        </button>
        <button className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15" onClick={() => setCanvasKey((k) => k + 1)}>
          Restart 3D
        </button>

        <div className="ml-2 flex gap-2">
          {(["scan", "homing", "docking", "charging"] as Step[]).map((s) => (
            <button
              key={s}
              className={`rounded-md px-3 py-1.5 text-sm ${
                step === s
                  ? "bg-[color:var(--color-neon-blue)]/20 text-[color:var(--color-neon-blue)] shadow-[var(--shadow-glow)]"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
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

        <div className="ml-auto text-xs text-white/70">Steps: Scan (SLAM) → UWB Homing → QR Docking → Charging</div>
      </div>

      {step === "charging" && (
        <div className="mt-2 rounded-md border border-white/10 bg-black/30 p-2 text-xs text-white/80">
          Charging… Coils aligned. Energy transfer stabilized.
        </div>
      )}
    </div>
  );
}