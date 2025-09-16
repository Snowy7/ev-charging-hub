"use client";

import { motion } from "framer-motion";

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="glass px-3 py-2">
      <div className="text-xs text-white/60">{label}</div>
      <div className="text-lg font-semibold">{value}</div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="glass px-3 py-1 text-xs text-white/80">{children}</span>
  );
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-[radial-gradient(ellipse_at_top_left,rgba(57,183,255,0.15),transparent_40%),radial-gradient(ellipse_at_bottom_right,rgba(0,255,163,0.12),transparent_45%)]">
      {/* Dark overlay replacing video */}
      <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(10,15,20,0.9),rgba(10,15,20,0.6))]" />

      {/* Glowing gradient orbs for depth */}
      <div
        className="orb orb-blue -left-24 top-10 h-72 w-72"
        style={{ animation: "float-y 10s ease-in-out infinite" }}
      />
      <div
        className="orb orb-green -right-24 top-40 h-72 w-72"
        style={{ animation: "float-y 12s ease-in-out infinite" }}
      />

      <div className="relative z-10 mx-auto max-w-6xl px-6 pt-24 pb-16 md:pb-24">
        <div className="grid items-center gap-10 md:grid-cols-2">
          {/* Left column: copy, chips, stats, ctas */}
          <div>
            <motion.h1
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.7 }}
              className="text-4xl font-semibold tracking-tight md:text-6xl"
            >
              Redefining EV Charging
              <span className="block text-[color:var(--color-neon-green)] drop-shadow-[0_0_12px_#00ffa399]">
                Smart. Autonomous. Wireless.
              </span>
            </motion.h1>

            <motion.p
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, duration: 0.7 }}
              className="mt-4 max-w-xl text-white/80"
            >
              An autonomous robotic platform that precisely aligns wireless
              coils for optimal efficiency and effortless charging—no cables,
              no hassle.
            </motion.p>

            {/* Feature chips */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.25, duration: 0.6 }}
              className="mt-5 flex flex-wrap gap-2"
            >
              <Chip>SLAM + LiDAR</Chip>
              <Chip>UWB Homing</Chip>
              <Chip>QR Docking ≤ 2 cm</Chip>
              <Chip>Wireless WPT ≥ 85%</Chip>
            </motion.div>

            {/* KPIs */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.35, duration: 0.6 }}
              className="mt-6 grid grid-cols-3 gap-3 max-w-md"
            >
              <Stat label="Efficiency" value="≥ 85%" />
              <Stat label="Align Accuracy" value="≤ 2 cm" />
              <Stat label="Docking Time" value="≤ 60 s" />
            </motion.div>

            {/* CTAs */}
            <motion.div
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45, duration: 0.6 }}
              className="mt-7 flex flex-wrap gap-3"
            >
              <a
                href="#interactive"
                className="rounded-md bg-[color:var(--color-neon-blue)]/20 px-5 py-3 text-[color:var(--color-neon-blue)] shadow-[var(--shadow-glow)] transition-colors hover:bg-[color:var(--color-neon-blue)]/30"
              >
                Explore Interactive Demos
              </a>
              <a
                href="#media"
                className="rounded-md bg-white/10 px-5 py-3 text-white/90 transition-colors hover:bg-white/15"
              >
                Watch Prototype Video
              </a>
            </motion.div>
          </div>

          {/* Right column: media card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="card overflow-hidden"
          >
            <div className="relative aspect-video">
              <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,rgba(57,183,255,0.2),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(0,255,163,0.18),transparent_55%)]" />
              <button
                aria-label="Play video"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-black/50 p-4 backdrop-blur hover:bg-black/60"
                onClick={() => {
                  const el = document.getElementById("media");
                  el?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <svg
                  width="22"
                  height="22"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M8 5v14l11-7L8 5z" fill="#eaf6ff" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-between p-4">
              <div>
                <h3 className="font-medium">Autonomous Docking Demo</h3>
                <p className="text-sm text-dim">See the robot align and charge.</p>
              </div>
              <a
                href="#interactive"
                className="rounded-md bg-[color:var(--color-neon-green)]/20 px-3 py-1.5 text-[color:var(--color-neon-green)] hover:bg-[color:var(--color-neon-green)]/30"
              >
                Try it
              </a>
            </div>
          </motion.div>
        </div>

        {/* Scroll cue */}
        <div className="mt-10 flex items-center gap-3 text-sm text-white/70">
          <div className="scroll-cue" />
          <span>Scroll to explore the interactive demos</span>
        </div>
      </div>
    </section>
  );
}