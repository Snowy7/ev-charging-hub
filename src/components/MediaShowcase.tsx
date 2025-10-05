"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface MediaItem {
  src: string;
  alt: string;
  title?: string;
  desc?: string;
  priority?: boolean;
}

export default function MediaShowcase() {
  const items: MediaItem[] = [
    {
      src: "/images/Simulation_GIF.gif",
      alt: "Autonomous alignment and charging sequence",
      title: "Prototype Demo",
      desc: "Autonomous alignment and charging sequence.",
      priority: true,
    },
    {
      src: "/images/charger_simulation.png",
      alt: "Charger simulation overview",
      title: "Charger Simulation",
      desc: "Robot path planning and docking behavior.",
    },
    { src: "/images/Overall%20Design.png", alt: "Overall wireless charger design" },
    { src: "/images/plates_design.png", alt: "Transmitter and receiver plate design" },
    { src: "/images/DIRECTIVITY_PLOT.png", alt: "Antenna directivity plot" },
    { src: "/images/GAIN_PLOT.png", alt: "Antenna gain plot" },
    { src: "/images/SS.png", alt: "System schematic" },
  ];

  const featured = items.slice(0, 2);
  const gallery = items.slice(2);

  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (active === null) return;
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight") setActive((i) => (i === null ? 0 : (i + 1) % items.length));
      if (e.key === "ArrowLeft")
        setActive((i) => (i === null ? 0 : (i - 1 + items.length) % items.length));
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, items.length]);

  // Prevent background scrolling when lightbox is open
  useEffect(() => {
    if (active !== null) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [active]);

  return (
    <section id="media" className="mx-auto max-w-7xl px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">Media Gallery</h2>
        <p className="text-lg text-slate-600 dark:text-dim">
          Visual documentation of our wireless charging system, designs, and test results
        </p>
      </motion.div>

      <div className="grid gap-6 md:grid-cols-2">
        {featured.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: idx * 0.1, duration: 0.5 }}
            whileHover={{ y: -8 }}
            className="card overflow-hidden cursor-zoom-in group"
            onClick={() => setActive(idx)}
          >
            <div className="relative aspect-video">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                priority={item.priority}
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 50vw"
              />
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{boxShadow:"inset 0 0 0 2px color-mix(in srgb, var(--color-neon-blue) 55%, transparent)", background:"radial-gradient(circle at 70% 30%, rgba(77,163,255,0.18), transparent 55%)"}} />
            </div>
            <div className="p-5">
              <h3 className="mb-2 text-lg font-semibold text-slate-900 dark:text-white group-hover:text-[color:var(--color-neon-blue)] transition-colors">{item.title ?? item.alt}</h3>
              {item.desc && <p className="text-sm text-slate-600 dark:text-dim">{item.desc}</p>}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {gallery.map((g, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05, duration: 0.4 }}
            whileHover={{ y: -6 }}
            className="card overflow-hidden cursor-zoom-in group"
            onClick={() => setActive(i + featured.length)}
          >
            <div className="relative h-48 w-full">
              <Image
                src={g.src}
                alt={g.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{boxShadow:"inset 0 0 0 1px color-mix(in srgb, var(--color-neon-blue) 55%, transparent)", background:"radial-gradient(circle at 70% 30%, rgba(77,163,255,0.14), transparent 55%)"}} />
            </div>
            <div className="p-4">
              <p className="text-sm font-medium text-slate-700 dark:text-white/80 group-hover:text-[color:var(--color-neon-blue)] transition-colors">{g.alt}</p>
            </div>
          </motion.div>
        ))}
      </div>

      <AnimatePresence>
        {active !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-sm"
            onClick={() => setActive(null)}
            role="dialog"
            aria-modal="true"
          >
          <motion.button
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="absolute right-4 top-4 rounded-lg bg-[color:var(--color-neon-blue)]/20 px-4 py-2 text-sm font-medium text-[color:var(--color-neon-blue)] hover:bg-[color:var(--color-neon-blue)]/30 shadow-[var(--shadow-glow)] backdrop-blur"
            onClick={(e) => {
              e.stopPropagation();
              setActive(null);
            }}
          >
            Close
          </motion.button>

          <motion.button
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            whileHover={{ scale: 1.1, x: -4 }}
            whileTap={{ scale: 0.9 }}
            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-lg bg-[color:var(--color-neon-blue)]/20 p-3 text-2xl text-[color:var(--color-neon-blue)] hover:bg-[color:var(--color-neon-blue)]/30 backdrop-blur"
            onClick={(e) => {
              e.stopPropagation();
              setActive((i) => (i === null ? 0 : (i - 1 + items.length) % items.length));
            }}
            aria-label="Previous"
          >
            ‹
          </motion.button>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            whileHover={{ scale: 1.1, x: 4 }}
            whileTap={{ scale: 0.9 }}
            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-lg bg-[color:var(--color-neon-blue)]/20 p-3 text-2xl text-[color:var(--color-neon-blue)] hover:bg-[color:var(--color-neon-blue)]/30 backdrop-blur"
            onClick={(e) => {
              e.stopPropagation();
              setActive((i) => (i === null ? 0 : (i + 1) % items.length));
            }}
            aria-label="Next"
          >
            ›
          </motion.button>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="relative mx-auto w-full max-w-5xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-[70vh] w-full rounded-xl overflow-hidden">
              <Image
                src={items[active].src}
                alt={items[active].alt}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
            <div className="mt-6 rounded-xl bg-black/80 backdrop-blur-md p-4">
              <p className="text-xl font-semibold text-white drop-shadow-lg">
                {items[active].title ?? items[active].alt}
              </p>
              <p className="mt-2 text-base text-white/80">
                {active + 1} / {items.length}
              </p>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}