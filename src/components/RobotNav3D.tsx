"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Line } from "@react-three/drei";
import { useRef, useState, useCallback } from "react";
import * as THREE from "three";

interface Vec3 { x: number; y: number; z: number }

function Robot({ position, heading }: { position: Vec3; heading: number }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) {
      ref.current.position.set(position.x, position.y, position.z);
      ref.current.rotation.y = heading;
    }
  });
  return (
    <group ref={ref}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.25, 0.12, 24]} />
        <meshStandardMaterial color="#39b7ff" metalness={0.3} roughness={0.4} />
      </mesh>
      <mesh position={[0.25, 0.08, 0]}>
        <coneGeometry args={[0.12, 0.24, 16]} />
        <meshStandardMaterial color="#00ffa3" emissive="#00ffa3" emissiveIntensity={0.4} />
      </mesh>
    </group>
  );
}

function Car({ position }: { position: Vec3 }) {
  return (
    <group position={[position.x, position.y, position.z]}>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[0.9, 0.3, 1.8]} />
        <meshStandardMaterial color="#202830" metalness={0.2} roughness={0.7} />
      </mesh>
      <mesh position={[0, 0.25, 0]}>
        <boxGeometry args={[0.9, 0.1, 1.8]} />
        <meshStandardMaterial color="#303a44" />
      </mesh>
      <mesh position={[0, 0.16, 0.7]}>
        <boxGeometry args={[0.9, 0.2, 0.4]} />
        <meshStandardMaterial color="#151b22" />
      </mesh>
    </group>
  );
}

function Floor({ onSet }: { onSet?: (x: number, z: number) => void }) {
  const gridColor = new THREE.Color(0x23313d);
  const gridColor2 = new THREE.Color(0x1a2530);
  return (
    <group>
      <mesh
        receiveShadow
        rotation={[-Math.PI / 2, 0, 0]}
        onClick={(e) => {
          if (!onSet) return;
          const p = e.point;
          onSet(p.x, p.z);
        }}
      >
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0d141a" />
      </mesh>
      <gridHelper args={[40, 40, gridColor, gridColor2]} />
    </group>
  );
}

function PathLine({ points }: { points: Vec3[] }) {
  const pts = points.map((p) => [p.x, p.y + 0.02, p.z] as [number, number, number]);
  return <Line points={pts} color="#00ffa3" lineWidth={1} />;
}

interface SimState {
  robot: Vec3;
  heading: number;
  car: Vec3;
  path: Vec3[];
  phase: string;
  progress: number; // 0..1 along path
  playing: boolean;
  speed: number;
}

export default function RobotNav3D() {
  const [state, setState] = useState<SimState>(() => ({
    robot: { x: -6, y: 0.06, z: -6 },
    heading: 0,
    car: { x: 5, y: 0.06, z: 4 },
    path: [],
    phase: "Idle",
    progress: 0,
    playing: true,
    speed: 1,
  }));

  const recomputePath = useCallback((robot: Vec3, car: Vec3) => {
    // Simple straight path with a mid waypoint demo
    const mid: Vec3 = { x: robot.x, y: 0.06, z: car.z };
    return [robot, mid, car];
  }, []);

  const plan = useCallback(() => {
    setState((s) => {
      const path = recomputePath(s.robot, s.car);
      return { ...s, path, phase: "Plan Path", progress: 0 };
    });
  }, [recomputePath]);

  // Animation frame hook within a nested canvas scope
  function Animated() {
    useFrame((_, delta) => {
      setState((s) => {
        if (!s.playing || s.path.length < 2) return s;
        const spd = s.speed * 1.2;
        let progress = s.progress + delta * 0.15 * spd;
        if (progress >= 1) progress = 1;
        // Interpolate along path segments
        const segCount = s.path.length - 1;
        const segPos = progress * segCount;
        const segIdx = Math.min(Math.floor(segPos), segCount - 1);
        const localT = segPos - segIdx;
        const a = s.path[segIdx];
        const b = s.path[segIdx + 1];
        const robot = {
          x: THREE.MathUtils.lerp(a.x, b.x, localT),
          y: 0.06,
            z: THREE.MathUtils.lerp(a.z, b.z, localT),
        };
        const heading = Math.atan2(b.x - a.x, b.z - a.z);
        let phase = s.phase;
        if (progress === 0) phase = "Navigate";
        else if (progress < 0.85) phase = "Navigate";
        else if (progress < 0.97) phase = "Fine Align";
        else if (progress >= 0.97) phase = "Charging";
        return { ...s, robot, heading, progress, phase };
      });
    });
    return null;
  }

  const togglePlay = () => setState((s) => ({ ...s, playing: !s.playing }));
  const reset = () => setState((s) => ({
    ...s,
    robot: { x: -6, y: 0.06, z: -6 },
    progress: 0,
    phase: "Idle",
    path: [],
  }));

  const setSpeed = (v: number) => setState((s) => ({ ...s, speed: v }));

  const moveCar = (dx: number, dz: number) =>
    setState((s) => ({ ...s, car: { x: s.car.x + dx, y: 0.06, z: s.car.z + dz } }));

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="h-64 rounded-md border border-white/10 bg-black/40">
          <Canvas shadows camera={{ position: [6, 5, 6], fov: 55 }}>
            <color attach="background" args={["#0a0f14"]} />
            <hemisphereLight args={[0xffffff, 0x202020, 0.6]} />
            <directionalLight castShadow position={[4, 8, 4]} intensity={1} />
            <Floor onSet={(x, z) => setState((s) => ({ ...s, car: { x, y: 0.06, z } }))} />
            {state.path.length > 0 && <PathLine points={state.path} />}
            <Car position={state.car} />
            <Robot position={state.robot} heading={state.heading} />
            <OrbitControls enablePan enableDamping />
            <Animated />
          </Canvas>
        </div>
        <div className="h-64 rounded-md border border-white/10 bg-black/40">
          <Canvas camera={{ position: [0, 30, 0], fov: 35 }}>
            <orthographicCamera />
            <color attach="background" args={["#0a0f14"]} />
            <ambientLight intensity={0.5} />
            <Floor />
            {state.path.length > 0 && <PathLine points={state.path} />}
            <Car position={state.car} />
            <Robot position={state.robot} heading={state.heading} />
          </Canvas>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-3 text-xs text-white/70">
        <span className="text-neon-green/80">Phase: {state.phase}</span>
        <span>Progress: {(state.progress * 100).toFixed(0)}%</span>
        <span>Robot: {state.robot.x.toFixed(1)},{state.robot.z.toFixed(1)}</span>
        <span>Car: {state.car.x.toFixed(1)},{state.car.z.toFixed(1)}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        <button onClick={plan} className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15">Plan</button>
        <button onClick={togglePlay} className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15">{state.playing ? "Pause" : "Play"}</button>
        <button onClick={reset} className="rounded bg-white/10 px-3 py-1.5 text-sm hover:bg-white/15">Reset</button>
        <label className="flex items-center gap-1 text-xs">
          <span>Speed</span>
          <input type="range" min={0.25} max={3} step={0.25} value={state.speed} onChange={(e) => setSpeed(parseFloat(e.target.value))} />
          <span>{state.speed.toFixed(2)}</span>
        </label>
        <div className="flex items-center gap-1 text-xs">
          <span>Move Car</span>
          <button onClick={() => moveCar(0.5,0)} className="rounded bg-white/10 px-2 py-1 hover:bg-white/15">+X</button>
          <button onClick={() => moveCar(-0.5,0)} className="rounded bg-white/10 px-2 py-1 hover:bg-white/15">-X</button>
          <button onClick={() => moveCar(0,0.5)} className="rounded bg-white/10 px-2 py-1 hover:bg-white/15">+Z</button>
          <button onClick={() => moveCar(0,-0.5)} className="rounded bg-white/10 px-2 py-1 hover:bg-white/15">-Z</button>
        </div>
      </div>
      <p className="text-xs text-white/50">1. Plan to generate path 2. Play to navigate 3. Adjust car position then re-plan.</p>
    </div>
  );
}
