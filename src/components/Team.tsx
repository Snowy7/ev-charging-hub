export default function Team() {
  const people = [
    {
      name: "Islam Azzam",
      role: "Robotics & Systems",
      links: { linkedin: "#", github: "#" },
    },
    {
      name: "Nadine Al‑Jada",
      role: "Power & Wireless Charging",
      links: { linkedin: "#", github: "#" },
    },
  ];

  return (
    <section id="team" className="mx-auto max-w-7xl px-6 py-16 md:py-24">
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <h2 className="text-3xl font-semibold md:text-4xl">Team</h2>
        <p className="max-w-xl text-sm text-white/70">We combine robotics, power electronics, and systems engineering to deliver reliable autonomous wireless charging.</p>
      </div>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {people.map((p) => (
          <article key={p.name} className="card group overflow-hidden">
            <div className="flex items-center gap-4 p-5">
              <div className="h-14 w-14 flex-none overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_40%,rgba(57,183,255,0.25),transparent_60%)] ring-1 ring-white/10" />
              <div className="min-w-0">
                <h3 className="truncate text-lg font-medium text-white/95">{p.name}</h3>
                <p className="truncate text-sm text-white/60">{p.role}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-t border-white/10 bg-white/[0.03] px-5 py-3">
              <div className="flex gap-2">
                <a
                  href={p.links.linkedin}
                  className="rounded-md bg-white/10 px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/15"
                >
                  LinkedIn
                </a>
                <a
                  href={p.links.github}
                  className="rounded-md bg-white/10 px-3 py-1.5 text-xs text-white/80 transition-colors hover:bg-white/15"
                >
                  GitHub
                </a>
              </div>
              <span className="text-xs text-white/50 group-hover:text-white/70">View profile →</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}