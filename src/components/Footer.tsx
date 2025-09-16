export default function Footer() {
  return (
    <footer id="contact" className="mt-8 border-t border-white/10 bg-black/20">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 px-6 py-6 md:flex-row">
        <p className="text-xs text-white/60">© 2025 Smart Autonomous EV Charging Hub</p>
        <a href="https://github.com/" className="text-xs text-[color:var(--color-neon-green)] hover:underline">
          Collaborate with us
        </a>
      </div>
    </footer>
  );
}