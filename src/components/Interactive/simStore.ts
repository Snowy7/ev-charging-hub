import { create } from "zustand";
import * as THREE from "three";

export type Step = "scan" | "navigating" | "docking" | "charging" | "idle";

const INIT_ROBOT = new THREE.Vector3(-8, 0.1, -2);
const INIT_CAR = new THREE.Vector3(7, 0.3, 2);

type SimState = {
  step: Step;
  playing: boolean;
  speed: number;
  robotPos: THREE.Vector3;
  carPos: THREE.Vector3;
  setStep: (s: Step) => void;
  setPlaying: (p: boolean) => void;
  setSpeed: (v: number) => void;
  setRobotPos: (v: THREE.Vector3) => void;
  setCarPos: (v: THREE.Vector3) => void;
  reset: () => void;
};

export const useSim = create<SimState>((set) => ({
  step: "idle",
  playing: false,
  speed: 1.0,
  robotPos: INIT_ROBOT.clone(),
  carPos: INIT_CAR.clone(),
  setStep: (s) => set({ step: s }),
  setPlaying: (p) => set({ playing: p }),
  setSpeed: (v) => set({ speed: v }),
  setRobotPos: (v) => set({ robotPos: v.clone() }),
  setCarPos: (v) => set({ carPos: v.clone() }),
  reset: () =>
    set({
      step: "idle",
      playing: false,
      speed: 1.0,
      robotPos: INIT_ROBOT.clone(),
      carPos: INIT_CAR.clone(),
    }),
}));