"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { PerspectiveCamera } from "@react-three/drei";
import * as THREE from "three";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { MainScene } from "./ProcessSim";
import { Step, useSim } from "./simStore";

function CinematicCameraFollower({ strength = 0.14 }: { strength?: number }) {
  const { robotPos } = useSim();
  const camRef = useRef<THREE.PerspectiveCamera>(null);
  const lookRef = useRef(new THREE.Vector3());
  const currentPos = useRef(new THREE.Vector3(7.5, 6, 7.5));
  const lastPos = useRef<THREE.Vector3 | null>(null);
  const forwardRef = useRef(new THREE.Vector3(1, 0, 1).normalize());
  const timeRef = useRef(0);

  useFrame((_, dt) => {
    timeRef.current += dt;
    const target = robotPos.clone();
    // Derive forward direction from motion
    if (lastPos.current) {
      const delta = target.clone().sub(lastPos.current);
      delta.y = 0;
      if (delta.lengthSq() > 1e-5) {
        forwardRef.current.copy(delta.normalize());
      }
    }
    lastPos.current = target.clone();

    const up = new THREE.Vector3(0, 1, 0);
    const forward = forwardRef.current.clone();
    const side = new THREE.Vector3().crossVectors(up, forward).normalize(); // side-left of motion

    // Speed-based elevation and gentle bob
    const speedElev = 2.6;
    const bob = Math.sin(timeRef.current * 1.2) * 0.15;

    // Desired cinematic offset: a bit behind and to the side of robot
    const behind = forward.clone().multiplyScalar(-3.8);
    const lateral = side.clone().multiplyScalar(5.2);
    const vertical = up.clone().multiplyScalar(speedElev + bob);
    const desired = target.clone().add(behind).add(lateral).add(vertical);

    // Look slightly ahead of robot
    const lookTarget = target.clone().add(forward.clone().multiplyScalar(1.6));

    const k = 1 - Math.exp(-strength * (dt * 60));
    currentPos.current.lerp(desired, k);
    lookRef.current.lerp(lookTarget, k);

    if (camRef.current) {
      const cam = camRef.current;
      cam.position.copy(currentPos.current);
      cam.lookAt(lookRef.current);

      // Subtle banking based on turn rate
      // Approximate turn by comparing current forward to smoothed look vector direction
      const prevForward = forwardRef.current.clone();
      const toLook = lookRef.current.clone().sub(cam.position).setY(0).normalize();
      const crossY = prevForward.clone().cross(toLook).y;
      const dot = THREE.MathUtils.clamp(prevForward.dot(toLook), -1, 1);
      const angle = Math.atan2(crossY, dot);
      const bank = THREE.MathUtils.clamp(angle * 0.35, -0.35, 0.35);
      const fwdAxis = new THREE.Vector3();
      cam.getWorldDirection(fwdAxis);
      cam.rotateOnAxis(fwdAxis, bank * 0.2);
    }
  });

  return <PerspectiveCamera ref={camRef} makeDefault fov={52} />;
}

export default function CinematicSim() {
  const { step, setStep, playing, setPlaying, reset } = useSim();
  const [canvasKey, setCanvasKey] = useState(0);
  const [recording, setRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  // Auto-run cinematic flow
  useEffect(() => {
    if (!playing && step === "idle") {
      setStep("scan");
      setPlaying(true);
    }
    if (step === "scan") {
      const id = setTimeout(() => setStep("navigating"), 2400);
      return () => clearTimeout(id);
    }
  }, [step, playing, setStep, setPlaying]);

  const startRecording = (canvas: HTMLCanvasElement) => {
    if (!canvas.captureStream) return;
    const stream = canvas.captureStream(60);
    const mr = new MediaRecorder(stream, { mimeType: "video/webm; codecs=vp9" });
    chunksRef.current = [];
    mr.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) chunksRef.current.push(e.data);
    };
    mr.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: "video/webm" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.style.display = "none";
      a.href = url;
      a.download = "simulation.webm";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        URL.revokeObjectURL(url);
        a.remove();
      }, 0);
    };
    mr.start();
    mediaRecorderRef.current = mr;
    setRecording(true);
  };

  const stopRecording = () => {
    const mr = mediaRecorderRef.current;
    if (!mr) return;
    mr.stop();
    setRecording(false);
  };

  return (
    <div className="relative">
      <div className="h-[560px] w-full overflow-hidden rounded-md relative">
        <Canvas
          key={canvasKey}
          shadows={{ type: THREE.PCFSoftShadowMap }}
          dpr={[1, 1.75]}
          gl={{ powerPreference: "high-performance", antialias: true }}
          onCreated={(state) => {
            const canvas = state.gl.domElement;
            // Autostart recording if previously toggled
            // No-op by default
          }}
        >
          <Suspense fallback={null}>
            <MainScene topDown={false} showRays={true} showRoom={true} kbActive={false} />
            <CinematicCameraFollower />
          </Suspense>
        </Canvas>
        <div className="absolute left-2 top-2 flex gap-2">
          <button
            className="rounded-md bg-white/10 px-3 py-1.5 text-sm text-white hover:bg-white/15"
            onClick={() => (playing ? setPlaying(false) : setPlaying(true))}
          >
            {playing ? "Pause" : "Play"}
          </button>
          {!recording ? (
            <button
              className="rounded-md bg-green-500/80 px-3 py-1.5 text-sm text-white hover:bg-green-500"
              onClick={() => {
                const c = document.querySelector("canvas");
                if (c) startRecording(c);
              }}
            >
              Start Recording
            </button>
          ) : (
            <button
              className="rounded-md bg-red-500/80 px-3 py-1.5 text-sm text-white hover:bg-red-500"
              onClick={stopRecording}
            >
              Stop & Download
            </button>
          )}
        </div>
      </div>
    </div>
  );
}


