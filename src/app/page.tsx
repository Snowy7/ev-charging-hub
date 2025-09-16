import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Interactive from "@/components/Interactive";
import MediaShowcase from "@/components/MediaShowcase";
import DocsLibrary from "@/components/DocsLibrary";
import Contact from "../components/Contact";
import Team from "@/components/Team";
import Footer from "@/components/Footer";

export default function Page() {
  return (
    <main>
      <Navbar />
      <Hero />
      <Interactive />
      <MediaShowcase />
      <DocsLibrary />
      <Team />
      <Contact />
      <Footer />
    </main>
  );
}