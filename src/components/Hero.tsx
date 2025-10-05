"use client";

import { motion } from "framer-motion";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <motion.div
      whileHover={{ scale: 1.05, y: -2 }}
      className="glass px-4 py-3 transition-all hover:bg-white/10 dark:hover:bg-white/10"
    >
      <div className="text-xs font-medium text-slate-600 dark:text-white/60">{label}</div>
      <div className="text-xl font-bold text-[color:var(--color-neon-blue)]">{value}</div>
    </motion.div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <motion.span
      whileHover={{ scale: 1.05 }}
      className="glass px-3 py-1.5 text-xs font-medium text-slate-700 dark:text-white/90 transition-all hover:bg-white/10 dark:hover:bg-white/10"
    >
      {children}
    </motion.span>
  );
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: "easeOut",
    },
  },
};

export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden pt-24 pb-12 md:pt-32 md:pb-20">
      {/* Hero grid background scoped with radial fade */}
      <div
        className="pointer-events-none absolute inset-0 z-0 hero-grid bg-grid"
        style={{ animation: "float-y 15s ease-in-out infinite" }}
      />

      {/* Glowing gradient orbs for depth (hero only) */}
      <div
        className="orb orb-blue -left-24 top-12 h-64 w-64 md:h-96 md:w-96"
        style={{ animation: "float-y 12s ease-in-out infinite" }}
      />
      <div
        className="orb orb-green -right-24 top-44 h-64 w-64 md:h-96 md:w-96"
        style={{ animation: "float-y 14s ease-in-out infinite 2s" }}
      />

      <div className="relative z-10 mx-auto max-w-7xl px-6">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16"
        >
          {/* Left column: copy, chips, stats, ctas */}
          <div className="space-y-8">
            <motion.div variants={itemVariants} className="space-y-6">
              <h1 className="text-4xl font-bold tracking-tight leading-tight sm:text-5xl md:text-6xl lg:text-7xl text-slate-900 dark:text-white">
                <span className="block">Redefining</span>
                <span className="block text-[color:var(--color-neon-blue)] drop-shadow-[0_0_20px_rgba(77,163,255,0.6)]">
                  EV Charging
                </span>
              </h1>

              <p className="text-xl text-slate-700 dark:text-white/80 leading-relaxed sm:text-2xl">
                No plugs. No hassle.{" "}
                <span className="font-semibold text-slate-900 dark:text-white">Just charge.</span>
              </p>
            </motion.div>

            <motion.p
              variants={itemVariants}
              className="max-w-xl text-base leading-relaxed sm:text-lg text-slate-700 dark:text-white/75"
            >
              An autonomous robotic platform that precisely aligns wireless coils for optimal
              efficiency and effortless charging—no cables, no hassle.
            </motion.p>

            {/* Feature chips */}
            <motion.div variants={itemVariants} className="flex flex-wrap gap-3">
              <Chip>SLAM + LiDAR</Chip>
              <Chip>UWB Homing</Chip>
              <Chip>QR Docking ≤ 2 cm</Chip>
              <Chip>Wireless WPT ≥ 85%</Chip>
            </motion.div>

            {/* KPIs */}
            <motion.div
              variants={itemVariants}
              className="grid grid-cols-3 gap-3 sm:gap-4"
            >
              <Stat label="Efficiency" value="≥ 85%" />
              <Stat label="Accuracy" value="≤ 2 cm" />
              <Stat label="Docking" value="≤ 60 s" />
            </motion.div>

            {/* CTAs */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col gap-3 sm:flex-row sm:gap-4"
            >
              <motion.a
                href="#interactive"
                whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(77, 163, 255, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                className="rounded-xl bg-[color:var(--color-neon-blue)]/20 px-6 py-3.5 text-center font-semibold text-[color:var(--color-neon-blue)] shadow-[0_0_30px_rgba(77,163,255,0.3)] transition-all hover:bg-[color:var(--color-neon-blue)]/30"
              >
                Explore Interactive Demos
              </motion.a>
              <motion.a
                href="#media"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-xl bg-white/10 px-6 py-3.5 text-center font-semibold text-white/90 backdrop-blur transition-all hover:bg-white/15"
              >
                Watch Prototype Video
              </motion.a>
            </motion.div>
          </div>

          {/* Right column: media card */}
          <motion.div variants={itemVariants} className="card overflow-hidden">
            <div className="relative aspect-video">
              <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,rgba(77,163,255,0.2),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(77,163,255,0.15),transparent_55%)]" />
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Play video"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[color:var(--color-neon-blue)]/20 p-5 backdrop-blur transition-all hover:bg-[color:var(--color-neon-blue)]/30 hover:shadow-[0_0_30px_rgba(77,163,255,0.5)]"
                onClick={() => {
                  const el = document.getElementById("media");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <svg
                  width="28"
                  height="28"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="text-[color:var(--color-neon-blue)]"
                >
                  <path d="M8 5v14l11-7L8 5z" fill="currentColor" />
                </svg>
              </motion.button>
            </div>
            <div className="flex flex-col items-start justify-between gap-4 p-5 sm:flex-row sm:items-center">
              <div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-white">Autonomous Docking Demo</h3>
                <p className="text-sm text-slate-600 dark:text-dim">See the robot align and charge in real-time.</p>
              </div>
              <motion.a
                href="#interactive"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="rounded-lg bg-[color:var(--color-neon-blue)]/20 px-4 py-2 text-sm font-medium text-[color:var(--color-neon-blue)] transition-all hover:bg-[color:var(--color-neon-blue)]/30"
              >
                Try it
              </motion.a>
            </div>
          </motion.div>
        </motion.div>

        {/* Scroll cue */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.8 }}
          className="mt-16 flex items-center justify-center gap-3 text-sm text-slate-600 dark:text-white/70 md:justify-start"
        >
          <div className="scroll-cue" />
          <span>Scroll to explore the interactive demos</span>
        </motion.div>
      </div>
    </section>
  );
}