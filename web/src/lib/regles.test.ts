import assert from "node:assert/strict";
import { test } from "node:test";
import { MOTIF_INDEPENDANCE, MOTIF_ROTATION, type Intervenant, agentsEligibles, assignerAgent, peutAuditer } from "./regles.ts";

const intervenants: Intervenant[] = [
  { id: "double", nom: "Accompagnatrice et agente", roles: ["accompagnateur", "agent"], secteurs: ["sante"], zones: ["Cocody"] },
  { id: "agent-a", nom: "Agent A", roles: ["agent"], secteurs: ["sante"], zones: ["Plateau"] },
  { id: "agent-b", nom: "Agent B", roles: ["agent"], secteurs: ["sante", "hotellerie"], zones: ["Cocody"] },
  { id: "accomp", nom: "Accompagnateur seul", roles: ["accompagnateur"], secteurs: ["sante"], zones: ["Cocody"] },
];
const liens = [{ accompagnateurId: "double", etablissementId: "clinique-x" }];

test("un accompagnateur ne peut jamais auditer un établissement qu'il a accompagné", () => {
  assert.deepEqual(peutAuditer("double", "clinique-x", liens), { autorise: false, motif: MOTIF_INDEPENDANCE });
  assert.deepEqual(peutAuditer("double", "autre-clinique", liens), { autorise: true });
});

test("l'assignation automatique exclut l'accompagnateur, même s'il est le mieux placé", () => {
  const { agent, exclus } = assignerAgent({ id: "clinique-x", secteur: "sante", commune: "Cocody" }, intervenants, liens);
  assert.equal(agent?.id, "agent-b");
  assert.deepEqual(exclus.map((e) => [e.intervenant.id, e.motif]), [["double", MOTIF_INDEPENDANCE]]);
});

test("la rotation exclut l'agent du dernier audit", () => {
  const candidats = agentsEligibles({ id: "clinique-x", secteur: "sante" }, intervenants, liens, "agent-b");
  assert.deepEqual(candidats.filter((c) => c.eligible).map((c) => c.intervenant.id), ["agent-a"]);
  assert.equal(candidats.find((c) => c.intervenant.id === "agent-b")?.motif, MOTIF_ROTATION);
});

test("seuls les agents habilités au secteur sont candidats ; aucun agent si tous sont exclus", () => {
  const { agent } = assignerAgent({ id: "clinique-x", secteur: "sante" }, intervenants.slice(0, 1), liens);
  assert.equal(agent, null);
  const candidats = agentsEligibles({ id: "hotel-y", secteur: "hotellerie" }, intervenants, liens);
  assert.deepEqual(candidats.map((c) => c.intervenant.id), ["agent-b"]);
});
