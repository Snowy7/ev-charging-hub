"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

export default function Navbar() {
  const [solid, setSolid] = useState(false);
  useEffect(() => {
    const onScroll = () => setSolid(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const link =
    "text-sm text-white/80 hover:text-[color:var(--color-neon-green)] transition-colors";

  return (
    <header
      className={clsx(
        "sticky top-0 z-40",
        solid
          ? "backdrop-blur-md bg-black/35 border-b border-white/10"
          : "backdrop-blur-md bg-black/25 border-b border-white/10"
      )}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <a href="#" className="font-semibold text-white">
          EV Charging Hub
        </a>
        <div className="flex items-center gap-4">
          <a href="#interactive" className={link}>
            Demos
          </a>
          <a href="#media" className={link}>
            Media
          </a>
          <a href="#docs" className={link}>
            Docs
          </a>
          <a href="#team" className={link}>
            Team
          </a>
          <a href="#contact" className="rounded-md bg-[color:var(--color-neon-blue)]/20 px-3 py-1.5 text-[color:var(--color-neon-blue)] shadow-[var(--shadow-glow)] hover:bg-[color:var(--color-neon-blue)]/30">
            Contact
          </a>
        </div>
      </nav>
    </header>
  );
}