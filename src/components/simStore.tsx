import { create } from "zustand";
import * as THREE from "three";

export type Step = "scan" | "homing" | "docking" | "charging" | "idle";

type SimState = {
  step: Step;
  playing: boolean;
  robotPos: THREE.Vector3;
  carPos: THREE.Vector3;
  setStep: (s: Step) => void;
  setPlaying: (p: boolean) => void;
  setRobotPos: (v: THREE.Vector3) => void;
  setCarPos: (v: THREE.Vector3) => void;
  reset: () => void;
};

export const useSim = create<SimState>((set) => ({
  step: "idle",
  playing: false,
  robotPos: new THREE.Vector3(-4, 0.1, -2),
  carPos: new THREE.Vector3(3, 0.3, 1),
  setStep: (s) => set({ step: s }),
  setPlaying: (p) => set({ playing: p }),
  setRobotPos: (v) => set({ robotPos: v.clone() }),
  setCarPos: (v) => set({ carPos: v.clone() }),
  reset: () =>
    set({
      step: "idle",
      playing: false,
      robotPos: new THREE.Vector3(-4, 0.1, -2),
      carPos: new THREE.Vector3(3, 0.3, 1),
    }),
}));