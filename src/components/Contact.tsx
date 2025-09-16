"use client";

import { useState } from "react";

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
      await new Promise((r) => setTimeout(r, 700));
      setSent(true);
      setName("");
      setEmail("");
      setMessage("");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section id="contact" className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <h2 className="text-3xl font-semibold md:text-4xl">Contact Us</h2>
        <p className="max-w-xl text-sm text-white/70">Interested in the project or collaboration? Send us a message and we’ll get back to you.</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <form onSubmit={onSubmit} className="card p-5">
          <div className="grid gap-4">
            <div>
              <label className="mb-1 block text-xs text-white/70">Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-[color:var(--color-neon-blue)]/50"
                placeholder="Your name"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/70">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-[color:var(--color-neon-blue)]/50"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs text-white/70">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full resize-y rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-[color:var(--color-neon-blue)]/50"
                placeholder="How can we help?"
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                disabled={loading}
                className="rounded-md bg-[color:var(--color-neon-green)]/20 px-4 py-2 text-[color:var(--color-neon-green)] shadow-[var(--shadow-glowg)] transition-colors hover:bg-[color:var(--color-neon-green)]/30 disabled:opacity-60"
              >
                {loading ? "Sending..." : "Send Message"}
              </button>
              {sent && <span className="text-sm text-white/70">Thanks! We’ll be in touch.</span>}
            </div>
          </div>
        </form>
        <div className="card p-5">
          <h3 className="mb-2 font-medium">Details</h3>
          <ul className="space-y-1 text-sm text-white/70">
            <li>Email: hello@example.com</li>
            <li>Location: Cairo, EG</li>
            <li>Availability: Open for collaboration</li>
          </ul>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <a href="#docs" className="rounded-md bg-white/10 px-3 py-2 text-center text-sm hover:bg-white/15">Read Docs</a>
            <a href="#media" className="rounded-md bg-white/10 px-3 py-2 text-center text-sm hover:bg-white/15">Watch Media</a>
          </div>
        </div>
      </div>
    </section>
  );
}


