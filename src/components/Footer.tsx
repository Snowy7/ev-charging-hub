export default function Footer() {
  return (
    <footer className="mt-12 border-t border-white/10 bg-black/20">
      <div className="mx-auto max-w-7xl px-6 py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <h3 className="mb-2 font-semibold">EV Charging Hub</h3>
            <p className="text-sm text-white/65">Wireless + Autonomous + Precise.</p>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium text-white/80">Explore</h4>
            <ul className="space-y-1 text-sm text-white/70">
              <li><a href="#interactive" className="hover:underline">Demos</a></li>
              <li><a href="#media" className="hover:underline">Media</a></li>
              <li><a href="#docs" className="hover:underline">Docs</a></li>
              <li><a href="#team" className="hover:underline">Team</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium text-white/80">Contact</h4>
            <ul className="space-y-1 text-sm text-white/70">
              <li><a href="#contact" className="hover:underline">Get in touch</a></li>
              <li><a href="mailto:hello@example.com" className="hover:underline">hello@example.com</a></li>
            </ul>
          </div>
          <div>
            <h4 className="mb-2 text-sm font-medium text-white/80">Open Source</h4>
            <a href="https://github.com/" className="text-sm text-[color:var(--color-neon-green)] hover:underline">Collaborate with us</a>
          </div>
        </div>
        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
          <p className="text-xs text-white/60">© 2025 Smart Autonomous EV Charging Hub</p>
          <p className="text-xs text-white/60">Built with Next.js</p>
        </div>
      </div>
    </footer>
  );
}