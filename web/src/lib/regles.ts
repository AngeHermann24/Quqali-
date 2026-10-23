import type { Secteur } from "./data";

export type Role = "agent" | "accompagnateur";

export interface Intervenant {
  id: string;
  nom: string;
  roles: Role[];
  secteurs: Secteur[];
  zones: string[];
}

export interface LienAccompagnement {
  accompagnateurId: string;
  etablissementId: string;
}

export const MOTIF_INDEPENDANCE = "A accompagné cet établissement : audit interdit (règle d'indépendance).";
export const MOTIF_ROTATION = "A réalisé le dernier audit de cet établissement (rotation des agents).";

export const aAccompagne = (intervenantId: string, etablissementId: string, liens: LienAccompagnement[]) =>
  liens.some((l) => l.accompagnateurId === intervenantId && l.etablissementId === etablissementId);

export function peutAuditer(agentId: string, etablissementId: string, liens: LienAccompagnement[]) {
  return aAccompagne(agentId, etablissementId, liens)
    ? { autorise: false as const, motif: MOTIF_INDEPENDANCE }
    : { autorise: true as const };
}

export function agentsEligibles(
  cible: { id: string; secteur: Secteur },
  intervenants: Intervenant[],
  liens: LienAccompagnement[],
  dernierAgentId?: string,
) {
  return intervenants
    .filter((i) => i.roles.includes("agent") && i.secteurs.includes(cible.secteur))
    .map((intervenant) => {
      const verification = peutAuditer(intervenant.id, cible.id, liens);
      const motif = !verification.autorise ? verification.motif : intervenant.id === dernierAgentId ? MOTIF_ROTATION : undefined;
      return { intervenant, eligible: !motif, motif };
    });
}

export function assignerAgent(
  cible: { id: string; secteur: Secteur; commune?: string },
  intervenants: Intervenant[],
  liens: LienAccompagnement[],
  dernierAgentId?: string,
) {
  const candidats = agentsEligibles(cible, intervenants, liens, dernierAgentId);
  const eligibles = candidats
    .filter((c) => c.eligible)
    .sort((a, b) => Number(b.intervenant.zones.includes(cible.commune ?? "")) - Number(a.intervenant.zones.includes(cible.commune ?? "")));
  return { agent: eligibles[0]?.intervenant ?? null, exclus: candidats.filter((c) => !c.eligible) };
}
