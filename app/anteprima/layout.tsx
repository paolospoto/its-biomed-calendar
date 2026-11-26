import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Link from "next/link";
import ui from "@/components/calendar-ui/ui.module.css";
import { longDate } from "@/components/calendar-ui/format";
import { reference } from "@/lib/preview/data";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Anteprima UI · ITS Biomed Calendar",
  robots: { index: false },
};

const SCREENS = [
  ["Login", "/anteprima/login"],
  ["Home", "/anteprima"],
  ["Modulo", "/anteprima/moduli/31"],
  ["Importa", "/anteprima/manutenzione"],
  ["Correzione riga", "/anteprima/manutenzione?riga=33"],
  ["Modifica calendario", "/anteprima/manutenzione/calendario?lezione=480"],
] as const;

export default function PreviewLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${ui.root} ${inter.className}`}>
      <div className={ui.banner}>
        <span>
          <strong>Anteprima statica</strong> · nessun collegamento a Supabase · dati dai PDF di calendario e dal quadro
          orario, riferiti a {longDate(reference.date).toLowerCase()} ore {reference.time}
        </span>
        <nav className={ui.bannerLinks} aria-label="Schermate">
          {SCREENS.map(([label, href]) => (
            <Link key={href} href={href}>
              {label}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  );
}
