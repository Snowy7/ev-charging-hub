"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

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

  return (
    <section id="media" className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <h2 className="mb-6 text-3xl font-semibold">Media Showcase</h2>

      <div className="grid gap-6 md:grid-cols-2">
        {featured.map((item, idx) => (
          <div
            key={idx}
            className="card overflow-hidden cursor-zoom-in group"
            onClick={() => setActive(idx)}
          >
            <div className="relative aspect-video">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                priority={item.priority}
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 50vw"
              />
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{boxShadow:"inset 0 0 0 2px color-mix(in srgb, var(--color-neon-blue) 55%, transparent)", background:"radial-gradient(circle at 70% 30%, rgba(77,163,255,0.18), transparent 55%)"}} />
            </div>
            <div className="p-4">
              <h3 className="mb-1 font-medium group-hover:text-[color:var(--color-neon-blue)] transition-colors">{item.title ?? item.alt}</h3>
              {item.desc && <p className="text-sm text-dim">{item.desc}</p>}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {gallery.map((g, i) => (
          <div
            key={i}
            className="card overflow-hidden cursor-zoom-in group"
            onClick={() => setActive(i + featured.length)}
          >
            <div className="relative h-44 w-full">
              <Image
                src={g.src}
                alt={g.alt}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              />
              <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100" style={{boxShadow:"inset 0 0 0 1px color-mix(in srgb, var(--color-neon-blue) 55%, transparent)", background:"radial-gradient(circle at 70% 30%, rgba(77,163,255,0.14), transparent 55%)"}} />
            </div>
            <div className="p-3">
              <p className="text-sm text-white/80 group-hover:text-[color:var(--color-neon-blue)] transition-colors">{g.alt}</p>
            </div>
          </div>
        ))}
      </div>

      {active !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
          onClick={() => setActive(null)}
          role="dialog"
          aria-modal="true"
        >
          <button
            className="absolute right-4 top-4 rounded bg-[color:var(--color-neon-blue)]/20 px-3 py-1 text-[color:var(--color-neon-blue)] hover:bg-[color:var(--color-neon-blue)]/30 shadow-[var(--shadow-glow)]"
            onClick={(e) => {
              e.stopPropagation();
              setActive(null);
            }}
          >
            Close
          </button>

          <button
            className="absolute left-2 top-1/2 -translate-y-1/2 rounded bg-[color:var(--color-neon-blue)]/20 p-2 text-[color:var(--color-neon-blue)] hover:bg-[color:var(--color-neon-blue)]/30"
            onClick={(e) => {
              e.stopPropagation();
              setActive((i) => (i === null ? 0 : (i - 1 + items.length) % items.length));
            }}
            aria-label="Previous"
          >
            ‹
          </button>
          <button
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded bg-[color:var(--color-neon-blue)]/20 p-2 text-[color:var(--color-neon-blue)] hover:bg-[color:var(--color-neon-blue)]/30"
            onClick={(e) => {
              e.stopPropagation();
              setActive((i) => (i === null ? 0 : (i + 1) % items.length));
            }}
            aria-label="Next"
          >
            ›
          </button>

          <div className="relative mx-auto w-full max-w-5xl p-6" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-[70vh] w-full">
              <Image
                src={items[active].src}
                alt={items[active].alt}
                fill
                className="object-contain"
                sizes="100vw"
                priority
              />
            </div>
            <div className="mt-3 text-center text-sm text-white/80">
              {items[active].title ?? items[active].alt}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}