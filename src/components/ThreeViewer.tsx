"use client";

import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage } from "@react-three/drei";
import { Suspense } from "react";

function Placeholder() {
  return (
    <mesh>
      <torusKnotGeometry args={[0.7, 0.24, 128, 16]} />
      <meshStandardMaterial color="#39b7ff" metalness={0.5} />
    </mesh>
  );
}

// Replace Placeholder with your GLTF once ready.
export default function ThreeViewer() {
  return (
    <div className="h-[420px] w-full overflow-hidden rounded-md">
      <Canvas camera={{ position: [2.4, 2, 2.4], fov: 55 }}>
        <color attach="background" args={["#0a0f14"]} />
        <Suspense fallback={null}>
          <Stage
            environment="city"
            intensity={0.7}
            shadows="contact"
            adjustCamera
          >
            <Placeholder />
          </Stage>
        </Suspense>
        <ambientLight intensity={0.5} />
        <OrbitControls
          enableDamping
          dampingFactor={0.05}
          maxDistance={6}
          minDistance={1.2}
        />
      </Canvas>
    </div>
  );
}