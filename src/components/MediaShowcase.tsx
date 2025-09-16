export default function MediaShowcase() {
  return (
    <section id="media" className="mx-auto max-w-6xl px-6 py-16 md:py-20">
      <h2 className="mb-6 text-3xl font-semibold">Media Showcase</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="card overflow-hidden">
          <div className="aspect-video">
            <div className="h-full w-full bg-[radial-gradient(circle_at_30%_30%,rgba(57,183,255,0.2),transparent_55%),radial-gradient(circle_at_70%_70%,rgba(0,255,163,0.18),transparent_55%)]" />
          </div>
          <div className="p-4">
            <h3 className="mb-1 font-medium">Prototype Demo</h3>
            <p className="text-sm text-dim">Autonomous alignment and charging sequence.</p>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="aspect-video">
            <div className="h-full w-full bg-[radial-gradient(circle_at_60%_40%,rgba(57,183,255,0.18),transparent_55%),radial-gradient(circle_at_40%_70%,rgba(0,255,163,0.16),transparent_55%)]" />
          </div>
          <div className="p-4">
            <h3 className="mb-1 font-medium">CAD & Coils</h3>
            <p className="text-sm text-dim">Coil geometry and mounting assembly visuals.</p>
          </div>
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="card overflow-hidden">
            <div className="h-44 w-full bg-[radial-gradient(circle_at_50%_40%,rgba(57,183,255,0.14),transparent_60%),radial-gradient(circle_at_60%_70%,rgba(0,255,163,0.12),transparent_60%)]" />
            <div className="p-3">
              <p className="text-sm text-white/80">Gallery item {i + 1}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}