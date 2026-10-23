import { type DonneesRapport, PROMPT_SYSTEME_RAPPORT, SCHEMA_RAPPORT, construireMessage, normaliserRapport } from "@/lib/ia/rapport";
import { genererRapportLocal } from "@/lib/ia/rapport-local";

const MODELE_DEFAUT = "claude-sonnet-5-5";

export async function POST(request: Request) {
  const origine = request.headers.get("origin");
  if (origine && new URL(origine).host !== request.headers.get("host")) return Response.json({ erreur: "Origine non autorisée." }, { status: 403 });

  let donnees: DonneesRapport;
  try {
    donnees = await request.json();
  } catch {
    return Response.json({ erreur: "Requête invalide." }, { status: 400 });
  }
  if (!donnees?.etablissement?.nom || !donnees.periode?.mois || !Array.isArray(donnees.avis) || donnees.avis.length > 500)
    return Response.json({ erreur: "Données du rapport incomplètes." }, { status: 400 });

  const cle = process.env.ANTHROPIC_API_KEY;
  if (!cle) return Response.json({ rapport: genererRapportLocal(donnees), source: "demo" });

  const modele = process.env.ANTHROPIC_MODEL || MODELE_DEFAUT;
  try {
    const reponse = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": cle, "anthropic-version": "2023-06-01" },
      body: JSON.stringify({
        model: modele,
        max_tokens: 4096,
        system: PROMPT_SYSTEME_RAPPORT,
        messages: [{ role: "user", content: construireMessage(donnees) }],
        output_config: { format: { type: "json_schema", schema: SCHEMA_RAPPORT } },
      }),
      signal: AbortSignal.timeout(120_000),
    });
    if (!reponse.ok) {
      console.error("API Claude", reponse.status, (await reponse.text()).slice(0, 500));
      return Response.json({ erreur: `L'API Claude a répondu avec le code ${reponse.status}.` }, { status: 502 });
    }
    const resultat = (await reponse.json()) as { content?: { type: string; text?: string }[]; stop_reason?: string };
    const texte = resultat.content?.find((b) => b.type === "text")?.text;
    if (!texte) return Response.json({ erreur: `Réponse vide de l'IA (${resultat.stop_reason ?? "inconnu"}).` }, { status: 502 });
    return Response.json({ rapport: normaliserRapport(JSON.parse(texte)), source: "claude", modele });
  } catch (erreur) {
    console.error("Génération du rapport", erreur);
    return Response.json({ erreur: "La génération du rapport a échoué. Réessayez dans quelques minutes." }, { status: 502 });
  }
}
