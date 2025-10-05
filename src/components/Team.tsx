"use client";

import { motion } from "framer-motion";

const people = [
  {
    name: "Islam Azzam",
    links: { linkedin: "#", github: "#" },
    avatar: "IA",
  },
  {
    name: "Nadine Al‑Jada",
    links: { linkedin: "#", github: "#" },
    avatar: "NA",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      ease: "easeOut",
    },
  },
};

export default function Team() {
  return (
    <section id="team" className="mx-auto max-w-7xl px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">Meet the Team</h2>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-white/70 leading-relaxed">
          We combine robotics, power electronics, and systems engineering to deliver reliable
          autonomous wireless charging solutions.
        </p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.2 }}
        className="grid gap-6 md:grid-cols-2 lg:gap-8"
      >
        {people.map((person) => (
          <motion.article
            key={person.name}
            variants={itemVariants}
            whileHover={{ y: -8 }}
            className="card group relative overflow-hidden"
          >
            {/* Gradient overlay on hover */}
            <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--color-neon-blue)]/10 to-transparent" />
            </div>

            <div className="relative p-6 sm:p-8">
              {/* Avatar and Info */}
              <div className="mb-6 flex items-center justify-center">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="relative flex h-24 w-24 flex-none items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-[color:var(--color-neon-blue)]/20 to-[color:var(--color-neon-blue)]/5 ring-2 ring-[color:var(--color-neon-blue)]/20 transition-all"
                >
                  <span className="text-3xl font-bold text-[color:var(--color-neon-blue)]">
                    {person.avatar}
                  </span>
                </motion.div>
              </div>
              
              <h3 className="mb-6 text-center text-2xl font-bold text-slate-900 dark:text-white/95 transition-colors group-hover:text-[color:var(--color-neon-blue)]">
                {person.name}
              </h3>

              {/* Links */}
              <div className="flex items-center justify-center gap-3 border-t border-slate-200 dark:border-white/10 pt-5">
                <motion.a
                  href={person.links.linkedin}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 rounded-lg bg-slate-200/70 dark:bg-white/10 px-4 py-2 text-sm font-medium text-slate-700 dark:text-white/90 transition-all hover:bg-slate-300/70 dark:hover:bg-white/15 hover:text-slate-900 dark:hover:text-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                  </svg>
                  LinkedIn
                </motion.a>
                <motion.a
                  href={person.links.github}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex items-center gap-2 rounded-lg bg-slate-200/70 dark:bg-white/10 px-4 py-2 text-sm font-medium text-slate-700 dark:text-white/90 transition-all hover:bg-slate-300/70 dark:hover:bg-white/15 hover:text-slate-900 dark:hover:text-white"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" />
                  </svg>
                  GitHub
                </motion.a>
              </div>
            </div>
          </motion.article>
        ))}
      </motion.div>
    </section>
  );
}