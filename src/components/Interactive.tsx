"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { motion, AnimatePresence } from "framer-motion";

const ProcessSim = dynamic(() => import("./Interactive/ProcessSim"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[520px] w-full items-center justify-center animate-pulse rounded-lg bg-white/5">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-white/10 border-t-[color:var(--color-neon-blue)]" />
        <p className="text-sm text-white/60">Loading 3D simulation...</p>
      </div>
    </div>
  ),
});
import Slam2D from "./Interactive/Slam2D";

const tabs = [
  {
    id: "process" as const,
    label: "Autonomous Docking",
    subtitle: "3D",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2L2 7l10 5 10-5-10-5z" />
        <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
  },
  {
    id: "slam" as const,
    label: "SLAM Navigation",
    subtitle: "2D",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
        <line x1="9" y1="9" x2="15" y2="15" />
        <line x1="15" y1="9" x2="9" y2="15" />
      </svg>
    ),
  },
];

export default function Interactive() {
  const [tab, setTab] = useState<"slam" | "process">("process");

  return (
    <section id="interactive" className="mx-auto max-w-7xl px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
          Interactive Simulations
        </h2>
        <p className="text-lg text-slate-600 dark:text-dim leading-relaxed">
          Experience our autonomous system in action with real-time 3D and 2D simulations
        </p>
      </motion.div>

      {/* Tab Buttons */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-6 flex flex-wrap gap-3"
      >
        {tabs.map((t) => (
          <motion.button
            key={t.id}
            onClick={() => setTab(t.id)}
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 rounded-xl px-5 py-3 font-medium transition-all ${
              tab === t.id
                ? "bg-[color:var(--color-neon-blue)]/20 text-[color:var(--color-neon-blue)] shadow-[0_0_20px_rgba(77,163,255,0.3)] ring-1 ring-[color:var(--color-neon-blue)]/30"
                : "bg-slate-200/50 dark:bg-white/5 text-slate-700 dark:text-white/70 hover:bg-slate-300/50 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white/90"
            }`}
          >
            {t.icon}
            <span>
              {t.label}
              <span className="ml-2 text-xs opacity-70">({t.subtitle})</span>
            </span>
          </motion.button>
        ))}
      </motion.div>

      {/* Simulation Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="card overflow-hidden p-6"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {tab === "process" ? <ProcessSim /> : <Slam2D />}
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </section>
  );
}