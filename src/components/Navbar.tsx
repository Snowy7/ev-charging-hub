"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const link =
    "text-sm text-white/80 hover:text-[color:var(--color-neon-green)] transition-colors";

  return (
    <header className={clsx("fixed inset-x-0 z-40 pointer-events-none transition-all duration-300 ease-in-out", scrolled ? "top-4" : "top-0") }>
      <div className={"mx-auto max-w-none transition-all duration-300 ease-in-out"}>
        <div
          className={clsx(
            "pointer-events-auto w-full py-2 border border-white/10 backdrop-blur-md transition-all duration-300 ease-in-out",
            scrolled
              ? "mx-4 md:mx-auto md:max-w-7xl rounded-2xl bg-black/55 shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
              : "rounded-none bg-black/25 shadow-[0_6px_20px_rgba(0,0,0,0.25)] border-b w-full"
          )}
        >
          <nav
            className={clsx(
              "flex items-center justify-between transition-all duration-300 ease-in-out",
              scrolled ? "px-5 py-3" : "px-6 py-4"
            )}
          >
            <a href="#" className="font-semibold text-white">
              EV Charging Hub
            </a>
            {/* Desktop links */}
            <div className="hidden items-center gap-4 md:flex">
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
              <a
                href="#contact"
                className="rounded-md bg-[color:var(--color-neon-blue)]/20 px-3 py-1.5 text-[color:var(--color-neon-blue)] shadow-[var(--shadow-glow)] hover:bg-[color:var(--color-neon-blue)]/30"
              >
                Contact
              </a>
            </div>
            {/* Mobile toggle */}
            <button
              aria-label="Toggle menu"
              className="md:hidden rounded-md p-2 text-white/80 hover:bg-white/10"
              onClick={() => setOpen((v) => !v)}
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </button>
          </nav>
          {/* Mobile dropdown */}
          {open && (
            <div className="md:hidden border-t border-white/10 px-4 py-3">
              <div className="flex flex-col gap-2">
                <a onClick={() => setOpen(false)} href="#interactive" className={link}>Demos</a>
                <a onClick={() => setOpen(false)} href="#media" className={link}>Media</a>
                <a onClick={() => setOpen(false)} href="#docs" className={link}>Docs</a>
                <a onClick={() => setOpen(false)} href="#team" className={link}>Team</a>
                <a
                  onClick={() => setOpen(false)}
                  href="#contact"
                  className="mt-1 rounded-md bg-[color:var(--color-neon-blue)]/20 px-3 py-2 text-[color:var(--color-neon-blue)] shadow-[var(--shadow-glow)] hover:bg-[color:var(--color-neon-blue)]/30"
                >
                  Contact
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}