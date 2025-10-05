"use client";

import { useState } from "react";
import { motion } from "framer-motion";

export default function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || !email || !message) return;
    setLoading(true);
    try {
      await new Promise((r) => setTimeout(r, 1000));
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
      setTimeout(() => setSent(false), 5000);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="contact" className="mx-auto max-w-7xl px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
        className="mb-12"
      >
        <h2 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">Get in Touch</h2>
        <p className="max-w-2xl text-lg text-slate-600 dark:text-white/70 leading-relaxed">
          Interested in our project or looking to collaborate? We'd love to hear from you.
        </p>
      </motion.div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Contact Form */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <form onSubmit={onSubmit} className="card p-8 space-y-6">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-white/80">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-all placeholder:text-white/40 focus:border-[color:var(--color-neon-blue)]/50 focus:bg-white/10 focus:ring-2 focus:ring-[color:var(--color-neon-blue)]/20"
                placeholder="Your name"
                required
              />
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-white/80">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-all placeholder:text-white/40 focus:border-[color:var(--color-neon-blue)]/50 focus:bg-white/10 focus:ring-2 focus:ring-[color:var(--color-neon-blue)]/20"
                placeholder="you@example.com"
                required
              />
            </div>
            
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700 dark:text-white/80">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm outline-none transition-all placeholder:text-white/40 focus:border-[color:var(--color-neon-blue)]/50 focus:bg-white/10 focus:ring-2 focus:ring-[color:var(--color-neon-blue)]/20"
                placeholder="Tell us about your interest..."
                required
              />
            </div>
            
            <div className="flex items-center gap-4">
              <motion.button
                type="submit"
                disabled={loading}
                whileHover={{ scale: loading ? 1 : 1.02 }}
                whileTap={{ scale: loading ? 1 : 0.98 }}
                className="rounded-xl bg-[color:var(--color-neon-blue)]/20 px-6 py-3 font-semibold text-[color:var(--color-neon-blue)] shadow-[0_0_30px_rgba(77,163,255,0.3)] transition-all hover:bg-[color:var(--color-neon-blue)]/30 hover:shadow-[0_0_40px_rgba(77,163,255,0.5)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="h-4 w-4 animate-spin"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Sending...
                  </span>
                ) : (
                  "Send Message"
                )}
              </motion.button>
              
              {sent && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center gap-2 text-sm font-medium text-[color:var(--color-neon-blue)]"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  Message sent!
                </motion.span>
              )}
            </div>
          </form>
        </motion.div>

        {/* Contact Info */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex flex-col gap-6"
        >
          {/* Info Card */}
          <div className="card p-8 flex-1">
            <h3 className="mb-6 text-2xl font-bold text-slate-900 dark:text-white">Contact Information</h3>
            <div className="space-y-4">
              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-start gap-4"
              >
                <div className="rounded-lg bg-[color:var(--color-neon-blue)]/10 p-3 text-[color:var(--color-neon-blue)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-white/60">Email</div>
                  <a href="mailto:hello@example.com" className="font-medium text-slate-900 dark:text-white/90 hover:text-[color:var(--color-neon-blue)] transition-colors">
                    hello@example.com
                  </a>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-start gap-4"
              >
                <div className="rounded-lg bg-[color:var(--color-neon-blue)]/10 p-3 text-[color:var(--color-neon-blue)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-white/60">Location</div>
                  <div className="font-medium text-slate-900 dark:text-white/90">Doha, Qatar</div>
                </div>
              </motion.div>

              <motion.div
                whileHover={{ x: 4 }}
                className="flex items-start gap-4"
              >
                <div className="rounded-lg bg-[color:var(--color-neon-blue)]/10 p-3 text-[color:var(--color-neon-blue)]">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm text-slate-600 dark:text-white/60">Availability</div>
                  <div className="font-medium text-slate-900 dark:text-white/90">Open for collaboration</div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="card p-8">
            <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">Quick Links</h3>
            <div className="grid grid-cols-2 gap-3">
              <motion.a
                href="#docs"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-200/70 dark:bg-white/10 px-4 py-3 text-sm font-medium text-slate-700 dark:text-white/90 transition-all hover:bg-slate-300/70 dark:hover:bg-white/15"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
                Documentation
              </motion.a>
              <motion.a
                href="#media"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-200/70 dark:bg-white/10 px-4 py-3 text-sm font-medium text-slate-700 dark:text-white/90 transition-all hover:bg-slate-300/70 dark:hover:bg-white/15"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="23 7 16 12 23 17 23 7" />
                  <rect x="1" y="5" width="15" height="14" rx="2" ry="2" />
                </svg>
                Media Gallery
              </motion.a>
              <motion.a
                href="#interactive"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-200/70 dark:bg-white/10 px-4 py-3 text-sm font-medium text-slate-700 dark:text-white/90 transition-all hover:bg-slate-300/70 dark:hover:bg-white/15"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18" />
                  <line x1="7" y1="12" x2="17" y2="12" />
                  <line x1="12" y1="7" x2="12" y2="17" />
                </svg>
                Simulations
              </motion.a>
              <motion.a
                href="#team"
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 rounded-lg bg-slate-200/70 dark:bg-white/10 px-4 py-3 text-sm font-medium text-slate-700 dark:text-white/90 transition-all hover:bg-slate-300/70 dark:hover:bg-white/15"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
                Our Team
              </motion.a>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}