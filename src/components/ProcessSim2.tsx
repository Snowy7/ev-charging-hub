"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import {
  OrbitControls,
  PerspectiveCamera,
  useGLTF,
} from "@react-three/drei";
import { Suspense, useEffect, useState } from "react";
import * as THREE from "three";
import { Step, useSim } from "./simStore";

// charging offset: LEFT side of car
const sideOffset = new THREE.Vector3(-0.9, 0, 0);

/* ------------------ MODELS ------------------- */
function RobotModel() {
  // Call hook unconditionally
  let scene = null;
  try {
    const gltf = useGLTF("/models/robot.glb");
    scene = gltf.scene;
  } catch (error) {
    // Fallback to primitive mesh
    scene = null;
  }
  
  if (scene) {
    return <primitive object={scene} scale={0.8} />;
  }
  
  return (
    <mesh>
      <cylinderGeometry args={[0.35, 0.35, 0.25, 32]} />
      <meshStandardMaterial color="#39b7ff" emissive="#0b3a52" emissiveIntensity={0.8} />
    </mesh>
  );
}

function CarModel() {
  // Call hook unconditionally
  let scene = null;
  try {
    const gltf = useGLTF("/models/car.glb");
    scene = gltf.scene;
  } catch (error) {
    // Fallback to primitive mesh
    scene = null;
  }
  
  if (scene) {
    return <primitive object={scene} scale={1} />;
  }
  
  return (
    <mesh>
      <boxGeometry args={[2, 0.9, 4]} />
      <meshStandardMaterial color="#00ffa3" emissive="#0a523f" emissiveIntensity={0.6} />
    </mesh>
  );
}

/* ------------------ MAIN SCENE --------------- */
function MainScene() {
  const { step, setStep, playing, robotPos, carPos, setRobotPos } = useSim();
  const [path, setPath] = useState<THREE.Vector3[]>([]);

  const finalTarget = carPos.clone().add(sideOffset);

  // auto switch scan→homing
  useEffect(() => {
    if (step === "scan") {
      const t = setTimeout(() => setStep("homing"), 3000);
      return () => clearTimeout(t);
    }
  }, [step, setStep]);

  // recalc path
  useEffect(() => {
    if (step === "homing" || step === "docking") {
      const pts: THREE.Vector3[] = [];
      const N = 40;
      for (let i = 0; i <= N; i++) {
        const t = i / N;
        const x = THREE.MathUtils.lerp(robotPos.x, finalTarget.x, t);
        const z = THREE.MathUtils.lerp(robotPos.z, finalTarget.z, t);
        pts.push(new THREE.Vector3(x, 0.05, z));
      }
      setPath(pts);
    }
  }, [step, robotPos, carPos]);

  // move robot along path
  const [pathIndex, setPathIndex] = useState(0);
  useFrame((_, dt) => {
    if (!playing) return;
    if (step === "homing") {
      if (pathIndex < path.length - 1) {
        const nextP = path[pathIndex + 1];
        const dir = nextP.clone().sub(robotPos);
        if (dir.length() > 0.01) {
          dir.normalize();
          setRobotPos(robotPos.clone().add(dir.multiplyScalar(1.2 * dt)));
        }
        setPathIndex(pathIndex + 1);
      } else {
        setStep("docking");
      }
    } else if (step === "docking") {
      const dir = finalTarget.clone().sub(robotPos);
      if (dir.length() > 0.05) {
        dir.normalize();
        setRobotPos(robotPos.clone().add(dir.multiplyScalar(0.6 * dt)));
      } else {
        setStep("charging");
      }
    }
  });

  // Obstacles placed in path
  const obstacles = [
    new THREE.Vector3(-2, 0.4, 0),
    new THREE.Vector3(0, 0.4, 1.5),
    new THREE.Vector3(1.5, 0.4, -1),
  ];

  /* --- VISUALS --- */
  const beams: JSX.Element[] = [];
  if (step === "scan" || step === "homing") {
    const rays = 36;
    for (let i = 0; i < rays; i++) {
      const ang = (i / rays) * Math.PI * 2;
      beams.push(
        <line key={i}>
          <bufferGeometry
            ref={(g) => {
              if (g) {
                g.setFromPoints([
                  robotPos.clone(),
                  robotPos.clone().add(new THREE.Vector3(Math.cos(ang) * 4, 0, Math.sin(ang) * 4)),
                ]);
              }
            }}
          />
          <lineBasicMaterial color="#39b7ff" transparent opacity={0.15} />
        </line>
      );
    }
  }

  return (
    <>
      <ambientLight intensity={0.8} />
      <directionalLight position={[6, 10, 6]} intensity={1} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 20]} />
        <meshStandardMaterial color="#0a0f14" />
      </mesh>

      {/* Obstacles */}
      {obstacles.map((o, i) => (
        <mesh key={i} position={o}>
          <boxGeometry args={[0.8, 0.8, 0.8]} />
          <meshStandardMaterial color="#ff6b6b" />
        </mesh>
      ))}

      {/* Car & Robot */}
      <group position={carPos}>
        <Suspense fallback={null}>
          <CarModel />
        </Suspense>
      </group>
      <group position={robotPos}>
        <Suspense fallback={null}>
          <RobotModel />
        </Suspense>
      </group>

      {/* UWB scan: expanding rings */}
      {step === "scan" &&
        [carPos, robotPos].map((p, i) => (
          <mesh key={i} position={[p.x, 0.05, p.z]} rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.5, 6, 64]} />
            <meshBasicMaterial
              color={i === 0 ? "#00ffa3" : "#39b7ff"}
              transparent
              opacity={0.2}
            />
          </mesh>
        ))}

      {/* Path line */}
      {path.length > 1 && <line>
        <bufferGeometry ref={(g) => g?.setFromPoints(path)} />
        <lineDashedMaterial color={0x39b7ff} dashSize={0.3} gapSize={0.15} />
      </line>}

      {beams}

      {/* QR Docking */}
      {step === "docking" && (
        <mesh position={finalTarget} rotation={[-Math.PI/2,0,0]}>
          <planeGeometry args={[0.5,0.5]} />
          <meshBasicMaterial color="#ffffff" />
        </mesh>
      )}

      {/* Charging */}
      {step === "charging" &&
        [...Array(4)].map((_, i) => (
          <mesh
            key={i}
            position={finalTarget.clone().add(new THREE.Vector3(0,0.6,0))}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <ringGeometry args={[0.3+i*0.15,0.35+i*0.15,64]} />
            <meshBasicMaterial
              color={i%2===0 ? "#00ffa3" : "#39b7ff"}
              transparent
              opacity={0.4-i*0.08}
            />
          </mesh>
        ))}

      <OrbitControls enableDamping />
      <PerspectiveCamera makeDefault position={[7, 6, 7]} fov={55} />
    </>
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

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button className="rounded-md bg-white/10 px-3 py-1.5 text-sm" onClick={() => (playing ? setPlaying(false) : start())}>
          {playing ? "Pause" : "Play"}
        </button>
        <button className="rounded-md bg-white/10 px-3 py-1.5 text-sm" onClick={stop}>
          Stop
        </button>
        <div className="ml-2 flex gap-2">
          {(["scan","homing","docking","charging"] as Step[]).map((s)=>(
            <button key={s} className={`rounded-md px-3 py-1.5 text-sm ${step===s?"bg-[color:var(--color-neon-blue)]/20 text-[color:var(--color-neon-blue)]":"bg-white/5 text-white/70"}`} onClick={()=>{ setStep(s); setPlaying(true); }}>
              {s}
            </button>
          ))}
        </div>
        <div className="ml-auto text-xs text-white/70">Steps: Scan → Homing → Docking → Charging</div>
      </div>
    </div>
  );
}