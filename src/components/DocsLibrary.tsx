"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";

type Doc = {
  id: string;
  title: string;
  type: "report" | "presentation" | "logbook";
  year: number;
  url: string;
  tags: string[];
  size?: string;
};

const docs: Doc[] = [
  // Reports
  {
    id: "final-report",
    title: "Capstone Final Report",
    type: "report",
    year: 2025,
    url: "/reports/reports/capstone final report.pdf",
    tags: ["final", "complete", "wireless", "robotics"],
    size: "Full Report",
  },
  {
    id: "second-draft",
    title: "Capstone Second Draft",
    type: "report",
    year: 2025,
    url: "/reports/reports/Capstone second draft .pdf",
    tags: ["draft", "wireless", "navigation"],
    size: "Draft",
  },
  // Presentations
  {
    id: "presentation-2",
    title: "Capstone Presentation II",
    type: "presentation",
    year: 2025,
    url: "/reports/presentations/Capston Presentation II.pdf",
    tags: ["slides", "presentation", "final"],
    size: "Slides",
  },
  // Logbooks
  {
    id: "logbook-1",
    title: "Logbook Week 1",
    type: "logbook",
    year: 2025,
    url: "/reports/logbooks/Logbook_Sheet.pdf",
    tags: ["weekly", "progress"],
  },
  {
    id: "logbook-2",
    title: "Logbook Week 2",
    type: "logbook",
    year: 2025,
    url: "/reports/logbooks/Logbook_Sheet (1).pdf",
    tags: ["weekly", "progress"],
  },
  {
    id: "logbook-3",
    title: "Logbook Week 3",
    type: "logbook",
    year: 2025,
    url: "/reports/logbooks/Logbook_Sheet (2).pdf",
    tags: ["weekly", "progress"],
  },
  {
    id: "logbook-4",
    title: "Logbook Week 4",
    type: "logbook",
    year: 2025,
    url: "/reports/logbooks/Logbook_Sheet (3).pdf",
    tags: ["weekly", "progress"],
  },
  {
    id: "logbook-5",
    title: "Logbook Week 5",
    type: "logbook",
    year: 2025,
    url: "/reports/logbooks/Logbook_Sheet (4).pdf",
    tags: ["weekly", "progress"],
  },
  {
    id: "logbook-6",
    title: "Logbook Week 6",
    type: "logbook",
    year: 2025,
    url: "/reports/logbooks/Logbook_Sheet (5).pdf",
    tags: ["weekly", "progress"],
  },
  {
    id: "logbook-7",
    title: "Logbook Week 7",
    type: "logbook",
    year: 2025,
    url: "/reports/logbooks/Logbook_Sheet (6).pdf",
    tags: ["weekly", "progress"],
  },
  {
    id: "logbook-8",
    title: "Logbook Week 8",
    type: "logbook",
    year: 2025,
    url: "/reports/logbooks/Logbook_Sheet (7).pdf",
    tags: ["weekly", "progress"],
  },
];

const filters = ["all", "report", "presentation", "logbook"];

const typeIcons = {
  report: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10 9 9 9 8 9" />
    </svg>
  ),
  presentation: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <line x1="8" y1="21" x2="16" y2="21" />
      <line x1="12" y1="17" x2="12" y2="21" />
    </svg>
  ),
  logbook: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
};

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

  // Group by type for better organization
  const grouped = useMemo(() => {
    const reports = filtered.filter((d) => d.type === "report");
    const presentations = filtered.filter((d) => d.type === "presentation");
    const logbooks = filtered.filter((d) => d.type === "logbook");
    return { reports, presentations, logbooks };
  }, [filtered]);

  return (
    <section id="docs" className="mx-auto max-w-7xl px-6 py-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 0.6 }}
      >
        <div className="mb-8">
          <h2 className="mb-3 text-4xl font-bold tracking-tight">Documentation Library</h2>
          <p className="text-lg text-slate-600 dark:text-dim">
            Explore our complete collection of reports, presentations, and development logbooks
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <svg
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-white/40"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search documents..."
              className="w-full rounded-xl border border-slate-300 dark:border-white/10 bg-white dark:bg-white/5 py-3 pl-10 pr-4 text-sm text-slate-900 dark:text-white outline-none transition-all placeholder:text-slate-500 dark:placeholder:text-white/40 focus:border-[color:var(--color-neon-blue)]/50 focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-[color:var(--color-neon-blue)]/20"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map((filter) => (
              <motion.button
                key={filter}
                onClick={() => setF(filter)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`rounded-lg px-4 py-2.5 text-sm font-medium capitalize transition-all border ${
                  f === filter
                    ? "bg-[color:var(--color-neon-blue)]/20 text-[color:var(--color-neon-blue)] border-[color:var(--color-neon-blue)]/30 shadow-[0_0_20px_rgba(77,163,255,0.3)] ring-1 ring-[color:var(--color-neon-blue)]/30"
                    : "bg-slate-200 dark:bg-white/5 text-slate-900 dark:text-white border-slate-300 dark:border-white/10 hover:bg-slate-300 dark:hover:bg-white/10 hover:text-slate-900 dark:hover:text-white shadow-sm"
                }`}
              >
                {filter}
                {filter !== "all" && (
                  <span className="ml-2 rounded-full bg-slate-300 dark:bg-white/10 px-2 py-0.5 text-xs text-slate-700 dark:text-white/70">
                    {filter === "report"
                      ? docs.filter((d) => d.type === "report").length
                      : filter === "presentation"
                      ? docs.filter((d) => d.type === "presentation").length
                      : docs.filter((d) => d.type === "logbook").length}
                  </span>
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Documents Grid */}
        {(f === "all" || f === "report") && grouped.reports.length > 0 && (
          <div className="mb-12">
            <h3 className="mb-4 text-2xl font-semibold">Reports</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {grouped.reports.map((doc, index) => (
                <DocumentCard key={doc.id} doc={doc} index={index} />
              ))}
            </div>
          </div>
        )}

        {(f === "all" || f === "presentation") && grouped.presentations.length > 0 && (
          <div className="mb-12">
            <h3 className="mb-4 text-2xl font-semibold">Presentations</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {grouped.presentations.map((doc, index) => (
                <DocumentCard key={doc.id} doc={doc} index={index} />
              ))}
            </div>
          </div>
        )}

        {(f === "all" || f === "logbook") && grouped.logbooks.length > 0 && (
          <div className="mb-12">
            <h3 className="mb-4 text-2xl font-semibold">Development Logbooks</h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {grouped.logbooks.map((doc, index) => (
                <DocumentCard key={doc.id} doc={doc} index={index} />
              ))}
            </div>
          </div>
        )}

        {filtered.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
              className="py-16 text-center"
            >
              <div className="mb-4 text-4xl">📄</div>
              <p className="text-lg text-slate-600 dark:text-white/60">No documents found matching your search.</p>
            </motion.div>
        )}

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-12 grid gap-4 sm:grid-cols-3"
        >
          <div className="card p-6 text-center">
            <div className="mb-2 text-3xl font-bold text-[color:var(--color-neon-blue)]">
              {docs.filter((d) => d.type === "report").length}
            </div>
            <div className="text-sm text-slate-600 dark:text-dim">Reports</div>
          </div>
          <div className="card p-6 text-center">
            <div className="mb-2 text-3xl font-bold text-[color:var(--color-neon-blue)]">
              {docs.filter((d) => d.type === "presentation").length}
            </div>
            <div className="text-sm text-slate-600 dark:text-dim">Presentations</div>
          </div>
          <div className="card p-6 text-center">
            <div className="mb-2 text-3xl font-bold text-[color:var(--color-neon-blue)]">
              {docs.filter((d) => d.type === "logbook").length}
            </div>
            <div className="text-sm text-slate-600 dark:text-dim">Logbooks</div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}

function DocumentCard({ doc, index }: { doc: Doc; index: number }) {
  return (
    <motion.a
      href={doc.url}
      target="_blank"
      rel="noreferrer"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="card group relative overflow-hidden"
    >
      <div className="p-5">
        <div className="mb-3 flex items-start justify-between">
          <div className="rounded-lg bg-[color:var(--color-neon-blue)]/10 p-2 text-[color:var(--color-neon-blue)] transition-all group-hover:bg-[color:var(--color-neon-blue)]/20">
            {typeIcons[doc.type]}
          </div>
          {doc.size && (
            <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-white/70">
              {doc.size}
            </span>
          )}
        </div>
        
        <h4 className="mb-2 text-lg font-semibold transition-colors group-hover:text-[color:var(--color-neon-blue)]">
          {doc.title}
        </h4>
        
        <div className="mb-4 flex flex-wrap gap-2">
          {doc.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-white/5 px-2 py-1 text-xs text-white/60 transition-all group-hover:bg-white/10 group-hover:text-white/80"
            >
              {tag}
            </span>
          ))}
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <span className="text-white/50">{doc.year}</span>
          <span className="flex items-center gap-1 text-[color:var(--color-neon-blue)] opacity-0 transition-opacity group-hover:opacity-100">
            View PDF
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" />
              <line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </span>
        </div>
      </div>

      {/* Hover effect overlay */}
      <div className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--color-neon-blue)]/5 to-transparent" />
      </div>
    </motion.a>
  );
}