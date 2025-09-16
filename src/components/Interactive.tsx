"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion } from "framer-motion";

const ProcessSim = dynamic(() => import("./Interactive/ProcessSim"), {
  ssr: false,
  loading: () => (
    <div className="h-[520px] w-full animate-pulse rounded-lg bg-white/5" />
  ),
});
import Slam2D from "./Interactive/Slam2D";

export default function Interactive() {
  const [tab, setTab] = useState<"slam" | "process">("process");

  return (
    <section
      id="interactive"
      className="mx-auto max-w-6xl px-6 py-16 md:py-24"
    >
      <motion.h2
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.4 }}
        transition={{ duration: 0.6 }}
        className="mb-4 text-3xl font-semibold md:text-4xl"
      >
        Interactive Demonstrations
      </motion.h2>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <button
          onClick={() => setTab("process")}
          className={`rounded-md px-3 py-1.5 text-sm ${
            tab === "process"
              ? "bg-[color:var(--color-neon-green)]/20 text-[color:var(--color-neon-green)] shadow-[var(--shadow-glowg)]"
              : "bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          3D Process
        </button>
        <button
          onClick={() => setTab("slam")}
          className={`rounded-md px-3 py-1.5 text-sm ${
            tab === "slam"
              ? "bg-[color:var(--color-neon-blue)]/20 text-[color:var(--color-neon-blue)] shadow-[var(--shadow-glow)]"
              : "bg-white/5 text-white/70 hover:bg-white/10"
          }`}
        >
          2D SLAM
        </button>
      </div>

      <div className="card p-4">
        {tab === "process" ? <ProcessSim /> : <Slam2D />}
      </div>
    </section>
  );
}