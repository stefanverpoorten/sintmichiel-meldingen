"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/beheer", label: "Overzicht" },
  { href: "/beheer/archief", label: "Archief" },
  { href: "/beheer/niet-uitgevoerd", label: "Niet uitgevoerd" },
  { href: "/beheer/klusjesmannen", label: "Klusjesmannen" },
  { href: "/beheer/mails", label: "Mails" },
];

export default function Navigatie() {
  const pad = usePathname();
  return (
    <nav className="nav">
      {links.map((l) => {
        const actief = l.href === "/beheer" ? pad === "/beheer" || pad.startsWith("/beheer/aanvraag") : pad.startsWith(l.href);
        return (
          <Link key={l.href} href={l.href} className={actief ? "actief" : ""}>
            {l.label}
          </Link>
        );
      })}
    </nav>
  );
}
