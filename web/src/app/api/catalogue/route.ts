import { NextResponse } from "next/server";
import { baseActive, cataloguePublic, gestionDe, listeEtablissements } from "@/lib/db/catalogue";
import type { Gestion } from "@/lib/admin";

/** GET /api/catalogue — établissements publics + état de gestion admin, au format legacy. */
export async function GET() {
  const [etablissements, lignes] = await Promise.all([cataloguePublic(), listeEtablissements()]);
  const gestion: Gestion = Object.fromEntries(lignes.map((l) => [l.slug, gestionDe(l)]));
  return NextResponse.json(
    { etablissements, gestion, source: baseActive() ? "db" : "demo" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
