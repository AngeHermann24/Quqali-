"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/site";

const SECTIONS = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/candidatures", label: "Candidatures" },
  { href: "/admin/agents", label: "Agents & affectations" },
  { href: "/admin/etablissements", label: "Établissements" },
  { href: "/admin/abonnements", label: "Abonnements" },
  { href: "/admin/moderation", label: "Modération" },
  { href: "/admin/awards", label: "Awards" },
  { href: "/admin/tarifs", label: "Tarifs" },
  { href: "/admin/brochures", label: "Brochures" },
];

export function AdminNav() {
  const pathname = usePathname();
  return (
    <div className="sticky top-16 z-30 border-b border-line bg-white/95 backdrop-blur">
      <nav className="container-page no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 py-2.5 sm:mx-0 sm:px-0" aria-label="Sections du back-office">
        {SECTIONS.map((s) => {
          const actif = s.href === "/admin" ? pathname === "/admin" : pathname.startsWith(s.href);
          return (
            <Link
              key={s.href}
              href={s.href}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition",
                actif ? "border-primary bg-primary text-white" : "border-line bg-white text-ink hover:border-primary",
              )}
            >
              {s.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}
