import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Interactive from "@/components/Interactive";
import MediaShowcase from "@/components/MediaShowcase";
import DocsLibrary from "@/components/DocsLibrary";
import Team from "@/components/Team";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <main className="bg-grid">
      <Navbar />
      <Hero />
      <Interactive />
      <MediaShowcase />
      <DocsLibrary />
      <Team />
      <Footer />
    </main>
  );
}