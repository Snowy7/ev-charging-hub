"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera, useGLTF, OrbitControls, Line } from "@react-three/drei";
import { Suspense, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Step, useSim } from "./simStore";

const sideOffset = new THREE.Vector3(0.9, 0, 0); // charging offset

/* ------------------ MODELS ------------------- */
interface GLTFLike { scene?: THREE.Group }
function RobotModel() {
  const gltf = useGLTF("/models/robot.glb", true) as unknown as GLTFLike;
  if (gltf?.scene) return <primitive object={gltf.scene} scale={0.8} />;
  return (
    <mesh>
      <cylinderGeometry args={[0.35, 0.35, 0.2, 32]} />
      <meshStandardMaterial
        color="#39b7ff"
        emissive="#0b3a52"
        emissiveIntensity={0.6}
      />
    </mesh>
  );
}

function CarModel() {
  const gltf = useGLTF("/models/car.glb", true) as unknown as GLTFLike;
  if (gltf?.scene) return <primitive object={gltf.scene} scale={0.8} />;
  return (
    <mesh>
      <boxGeometry args={[2, 0.8, 4]} />
      <meshStandardMaterial
        color="#00ffa3"
        emissive="#0a523f"
        emissiveIntensity={0.4}
      />
    </mesh>
  );
}

/* Draggable removed per request */

/* ------------------ PATH LINE ---------------- */
function PathLine({ points }: { points: THREE.Vector3[] }) {
  if (points.length < 2) return null;
  const pts = points.map((p) => [p.x, p.y, p.z] as [number, number, number]);
  return <Line points={pts} color="#00ffa3" lineWidth={1.5} dashed dashSize={0.2} gapSize={0.15} />;
}

/* ------------------ STEP VISUALS ------------- */
function StepVisuals() {
  const { step, robotPos, carPos } = useSim();

  // anchors four corners around scene
  const anchors = [
    new THREE.Vector3(-5, 0.05, -5),
    new THREE.Vector3(5, 0.05, -5),
    new THREE.Vector3(-5, 0.05, 5),
    new THREE.Vector3(5, 0.05, 5),
  ];

  // animate anchors pulses
  const pulseRefs = useRef<THREE.Mesh[]>([]);
  useFrame((_, dt) => {
    pulseRefs.current.forEach((m) => {
      if (m) {
        m.scale.x += dt;
        m.scale.y += dt;
        if (m.scale.x > 4) m.scale.set(1, 1, 1);
      }
    });
  });

  return (
    <>
      {step === "scan" &&
        anchors.map((p, i) => (
          <group key={i} position={p}>
            <mesh>
              <sphereGeometry args={[0.2, 16, 16]} />
              <meshStandardMaterial
                color="#39b7ff"
                emissive="#0b3a52"
                emissiveIntensity={0.9}
              />
            </mesh>
            <mesh
              ref={(m) => (pulseRefs.current[i] = m!)}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <ringGeometry args={[0.3, 0.35, 64]} />
              <meshBasicMaterial color="#39b7ff" transparent opacity={0.3} />
            </mesh>
          </group>
        ))}

      {step === "homing" && (
        <line>
          <bufferGeometry
            ref={(g) =>
              g?.setFromPoints([robotPos.clone(), carPos.clone().add(sideOffset)])
            }
          />
          <lineDashedMaterial color={0x39b7ff} dashSize={0.25} gapSize={0.15} />
        </line>
      )}

      {step === "docking" && (
        <group position={carPos.clone().add(sideOffset)}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry args={[0.5, 0.5]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
            <ringGeometry args={[0.25, 0.33, 32]} />
            <meshBasicMaterial color="#00ffa3" />
          </mesh>
        </group>
      )}

      {step === "charging" && (
        <group
          position={carPos
            .clone()
            .add(sideOffset)
            .add(new THREE.Vector3(0, 0.6, 0))}
        >
          {[0.3, 0.5, 0.7].map((r, i) => (
            <mesh key={i} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[r, r + 0.1, 64]} />
              <meshBasicMaterial
                color={i % 2 === 0 ? "#00ffa3" : "#39b7ff"}
                transparent
                opacity={0.4 - i * 0.1}
              />
            </mesh>
          ))}
        </group>
      )}
    </>
  );
}

/* ------------------ MAIN SCENE --------------- */
function MainScene() {
  const { step, playing, setStep, robotPos, carPos, setRobotPos } = useSim();

  const [path, setPath] = useState<THREE.Vector3[]>([]);
  const [progress, setProgress] = useState(0); // 0..1 along path

  // auto-switch from scan to homing after 3s
  useEffect(() => {
    if (step === "scan") {
      const t = setTimeout(() => setStep("homing"), 3000);
      return () => clearTimeout(t);
    }
  }, [step, setStep]);

  useEffect(() => {
    // Curved bezier path for nicer visual
    const p0 = robotPos.clone();
    const p3 = carPos.clone().add(sideOffset);
    const mid = p0.clone().add(p3).multiplyScalar(0.5);
    const lateral = new THREE.Vector3(0, 0, 2 * Math.sign(p3.x - p0.x || 1));
    const p1 = mid.clone().add(lateral);
    const p2 = mid.clone().add(lateral.clone().multiplyScalar(0.5));
    const pts: THREE.Vector3[] = [];
    const N = 120;
    for (let i = 0; i <= N; i++) {
      const t = i / N;
      const a = p0.clone().lerp(p1, t);
      const b = p1.clone().lerp(p2, t);
      const c = p2.clone().lerp(p3, t);
      const d = a.lerp(b, t);
      const e = b.lerp(c, t);
      const point = d.lerp(e, t);
      point.y = 0.02;
      pts.push(point);
    }
    setPath(pts);
    setProgress(0);
  }, [step, robotPos, carPos, setStep]);

  useFrame((_, dt) => {
    if (!playing) return;
    if (step === "homing" || step === "docking") {
      const speed = step === "homing" ? 0.22 : 0.1; // normalized progress speed
      const next = Math.min(1, progress + dt * speed);
      setProgress(next);
      if (path.length > 1) {
        const idxF = next * (path.length - 1);
        const i0 = Math.floor(idxF);
        const i1 = Math.min(path.length - 1, i0 + 1);
        const t = idxF - i0;
        const pos = path[i0].clone().lerp(path[i1], t);
        setRobotPos(new THREE.Vector3(pos.x, robotPos.y, pos.z));
      }
      if (next >= 1 && step === "homing") setStep("docking");
      else if (next >= 1 && step === "docking") setStep("charging");
    }
  });

  // obstacles placed off to sides
  const obstacles = [
    new THREE.Vector3(1.5, 0, -1.5),
    new THREE.Vector3(-1.5, 0, 1.5),
    new THREE.Vector3(2.5, 0, 2.5),
  ];

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[5, 8, 5]} intensity={1} castShadow />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#0a0f14" />
      </mesh>

      {/* Obstacles */}
      {obstacles.map((o, i) => (
        <mesh key={i} position={o} castShadow>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#ff6b6b" />
        </mesh>
      ))}

      <Suspense fallback={null}>
        <group position={carPos.toArray()}>
          <CarModel />
        </group>
        <group position={robotPos.toArray()}>
          <RobotModel />
        </group>
      </Suspense>

      <PathLine points={path} />
      <StepVisuals />

      <OrbitControls enableDamping />
      <PerspectiveCamera makeDefault position={[8, 6, 8]} fov={55} />
    </>
  );
}

/* ------------------ MINI MAP ----------------- */
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
      <mesh
        position={carPos.clone().add(sideOffset)}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.22, 0.28, 32]} />
        <meshBasicMaterial color="#00ffa3" />
      </mesh>
      <mesh
        position={[robotPos.x, 0.02, robotPos.z]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.2, 0.26, 32]} />
        <meshBasicMaterial color="#39b7ff" />
      </mesh>
    </Canvas>
  );
}

/* ------------------ EXPORT ------------------- */
export default function ProcessSim() {
  const { step, setStep, playing, setPlaying, reset } = useSim();

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
      <div className="h-[520px] w-full overflow-hidden rounded-md">
        <Canvas shadows>
          <Suspense fallback={null}>
            <MainScene />
          </Suspense>
        </Canvas>
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
        <button
          className="rounded-md bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15"
          onClick={stop}
        >
          Stop
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

        <div className="ml-auto text-xs text-white/70">
          Steps: Scan → Homing (UWB + SLAM) → Docking → Charging
        </div>
      </div>
    </div>
  );
}