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
    <section id="team" className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <h2 className="mb-6 text-3xl font-semibold">Team</h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {people.map((p) => (
          <div key={p.name} className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg text-white/90">{p.name}</h3>
                <p className="text-sm text-white/60">{p.role}</p>
              </div>
              <div className="flex gap-2">
                <a
                  href={p.links.linkedin}
                  className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
                >
                  LinkedIn
                </a>
                <a
                  href={p.links.github}
                  className="rounded bg-white/10 px-2 py-1 text-xs hover:bg-white/15"
                >
                  GitHub
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}