import "@/app/globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Smart Autonomous EV Charging Hub",
  description:
    "Interactive showcase: wireless EV charging with autonomous robotic alignment. By Islam Azzam & Nadine Al‑Jada.",
  openGraph: {
    title: "Smart Autonomous EV Charging Hub",
    description: "Wireless + Autonomous + Precise. Explore the interactive demos.",
    images: ["https://dummyimage.com/1200x630/0a0f14/eaf6ff.png&text=EV+Charging+Hub"],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}