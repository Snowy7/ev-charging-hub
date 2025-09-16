"use client";

import { useMemo, useState } from "react";

type Doc = {
  id: string;
  title: string;
  type: "report" | "slides" | "notes" | "datasheet";
  year: number;
  url: string;
  tags: string[];
};

const docs: Doc[] = [
  {
    id: "c1-draft",
    title: "Capstone 1 Report (Draft)",
    type: "report",
    year: 2025,
    url: "/docs/c1-draft.pdf",
    tags: ["wireless", "navigation"],
  },
  {
    id: "c2-final",
    title: "Capstone 2 Report (Final)",
    type: "report",
    year: 2025,
    url: "/docs/c2-final.pdf",
    tags: ["power", "robotics"],
  },
];

const filters = ["all", "report", "slides", "notes", "datasheet"];

export default function DocsLibrary() {
  const [q, setQ] = useState("");
  const [f, setF] = useState("all");

  const filtered = useMemo(() => {
    return docs.filter((d) => {
      const passType = f === "all" ? true : d.type === (f as Doc["type"]);
      const passQuery =
        !q ||
        d.title.toLowerCase().includes(q.toLowerCase()) ||
        d.tags.join(" ").toLowerCase().includes(q.toLowerCase());
      return passType && passQuery;
    });
  }, [q, f]);

  return (
    <section id="docs" className="mx-auto max-w-7xl px-6 py-16 md:py-20">
      <h2 className="mb-6 text-3xl font-semibold">Documents Library</h2>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search reports, tags..."
          className="w-full max-w-xs rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm outline-none placeholder:text-white/40 focus:border-[color:var(--color-neon-blue)]/50"
        />
        <div className="flex flex-wrap gap-2">
          {filters.map((x) => (
            <button
              key={x}
              onClick={() => setF(x)}
              className={`rounded-md px-3 py-1.5 text-sm ${
                f === x
                  ? "bg-[color:var(--color-neon-blue)]/20 text-[color:var(--color-neon-blue)] shadow-[var(--shadow-glow)]"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {x}
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((d) => (
          <a
            key={d.id}
            href={d.url}
            className="card group block overflow-hidden"
            target="_blank"
            rel="noreferrer"
          >
            <div className="flex items-center justify-between p-4">
              <span className="text-white/90">{d.title}</span>
              <span className="rounded bg-white/10 px-2 py-0.5 text-xs">{d.type}</span>
            </div>
            <div className="flex flex-wrap gap-2 px-4 pb-4">
              {d.tags.map((t) => (
                <span
                  key={t}
                  className="rounded bg-white/5 px-2 py-0.5 text-xs text-white/70 group-hover:bg-white/10"
                >
                  {t}
                </span>
              ))}
            </div>
          </a>
        ))}
      </div>

      {filtered.length === 0 && <p className="mt-4 text-sm text-white/60">No documents found.</p>}
    </section>
  );
}