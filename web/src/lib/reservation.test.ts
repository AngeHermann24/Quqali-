import assert from "node:assert/strict";
import { test } from "node:test";
import {
  CONFIG_RESERVATION_DEFAUT as C,
  type Demande,
  type Reservation,
  changerStatut,
  creerReservation,
  creneaux,
  disponibilitesHotel,
  disponibilitesRestaurant,
  disponibilitesSante,
  messagesClient,
  verifierDemande,
} from "./reservation.ts";
import { analyserLien3D } from "./visite3d.ts";

const MAINTENANT = "2026-10-20T08:00:00.000Z";
const client = { nom: "Awa K.", telephone: "07 08 09 10 11" };
const resa = (d: Demande, secteur: Reservation["secteur"], statut: Reservation["statut"] = "confirmee", rang = 1): Reservation => ({
  ...creerReservation("etab", secteur, C, d, rang, MAINTENANT),
  statut,
});

test("créneaux : pas régulier, dernier créneau avant la fermeture", () => {
  assert.deepEqual(creneaux("12:00", "14:00", 30), ["12:00", "12:30", "13:00", "13:30"]);
});

test("restaurant : capacité par créneau, jours fermés, délai minimum", () => {
  const d1 = { client, date: "2026-10-22", heure: "20:00", couverts: 25 };
  const dispo = disponibilitesRestaurant(C, "2026-10-22", [resa(d1, "restauration")], MAINTENANT);
  assert.equal(dispo.find((c) => c.heure === "20:00")?.restants, 5);
  assert.equal(dispo.find((c) => c.heure === "19:30")?.restants, 30);
  assert.equal(verifierDemande("restauration", C, { ...d1, couverts: 6 }, [resa(d1, "restauration")], MAINTENANT), "Il ne reste que 5 place(s) sur ce créneau.");
  assert.equal(verifierDemande("restauration", C, { ...d1, couverts: 4 }, [resa(d1, "restauration", "annulee")], MAINTENANT), null);
  assert.deepEqual(disponibilitesRestaurant({ ...C, restaurant: { ...C.restaurant, joursFermes: [4] } }, "2026-10-22", [], MAINTENANT), []);
  assert.ok(!disponibilitesRestaurant(C, "2026-10-20", [], "2026-10-20T11:30:00.000Z").some((c) => c.heure === "12:00" || c.heure === "13:00"));
});

test("hôtel : stock par nuit, chevauchements, capacité", () => {
  const occupee = resa({ client, arrivee: "2026-11-01", depart: "2026-11-04", chambreId: "suite", nbChambres: 2, voyageurs: 6 }, "hotellerie");
  const dispo = disponibilitesHotel(C, "2026-11-03", "2026-11-05", [occupee]);
  assert.equal(dispo.find((x) => x.chambre.id === "suite")?.restantes, 0);
  assert.equal(disponibilitesHotel(C, "2026-11-04", "2026-11-06", [occupee]).find((x) => x.chambre.id === "suite")?.restantes, 2);
  assert.equal(dispo.find((x) => x.chambre.id === "standard")?.totalParChambre, 90000);
  assert.match(verifierDemande("hotellerie", C, { client, arrivee: "2026-11-03", depart: "2026-11-05", chambreId: "suite" }, [occupee], MAINTENANT) ?? "", /complet/);
  assert.match(verifierDemande("hotellerie", C, { client, arrivee: "2026-11-05", depart: "2026-11-05", chambreId: "standard" }, [], MAINTENANT) ?? "", /départ/);
  assert.match(verifierDemande("hotellerie", C, { client, arrivee: "2026-11-05", depart: "2026-11-06", chambreId: "standard", voyageurs: 3 }, [], MAINTENANT) ?? "", /Capacité/);
});

test("santé : jours du praticien, créneau unique par patient", () => {
  assert.deepEqual(disponibilitesSante(C, "gyn", "2026-10-21", [], MAINTENANT), []);
  const pris = resa({ client, praticienId: "gyn", date: "2026-10-22", heure: "14:30" }, "sante");
  const dispo = disponibilitesSante(C, "gyn", "2026-10-22", [pris], MAINTENANT);
  assert.equal(dispo.find((c) => c.heure === "14:30")?.libre, false);
  assert.match(verifierDemande("sante", C, { client, praticienId: "gyn", date: "2026-10-22", heure: "14:30" }, [pris], MAINTENANT) ?? "", /vient d'être pris/);
});

test("statuts : confirmation automatique ou manuelle, transitions autorisées", () => {
  const d = { client, date: "2026-10-22", heure: "20:00", couverts: 2 };
  assert.equal(creerReservation("e", "restauration", C, d, 1, MAINTENANT).statut, "en_attente");
  assert.equal(creerReservation("e", "restauration", { ...C, autoConfirmation: true }, d, 1, MAINTENANT).statut, "confirmee");
  const r = creerReservation("e", "restauration", C, d, 7, MAINTENANT);
  assert.equal(r.reference, "RES-261020-007");
  assert.equal(changerStatut(r, "confirmee", MAINTENANT).statut, "confirmee");
  assert.throws(() => changerStatut(changerStatut(r, "refusee", MAINTENANT), "confirmee", MAINTENANT));
});

test("messages : SMS toujours, e-mail si fourni, contenu adapté", () => {
  const r = creerReservation("e", "restauration", C, { client: { ...client, email: "awa@example.com" }, date: "2026-10-22", heure: "20:00", couverts: 2 }, 1, MAINTENANT);
  const msgs = messagesClient(r, "Saveurs d'Akwaba", C, "creee");
  assert.deepEqual(msgs.map((m) => m.canal), ["sms", "email"]);
  assert.match(msgs[0].contenu, /bien reçue.*Table pour 2 le jeudi 22 octobre à 20:00/);
  assert.match(messagesClient({ ...r, statut: "refusee", motifRefus: "complet" }, "X", C, "refusee")[0].contenu, /\(complet\)/);
});

test("visite 3D : seuls les fournisseurs autorisés en https", () => {
  assert.deepEqual(analyserLien3D("https://my.matterport.com/show/?m=Zh14WDtkjdC"), { url: "https://my.matterport.com/show/?m=Zh14WDtkjdC&play=1&qs=1&brand=0", fournisseur: "Matterport" });
  assert.ok("erreur" in analyserLien3D("http://my.matterport.com/show/?m=Zh14WDtkjdC"));
  assert.ok("erreur" in analyserLien3D("https://evil.example.com/show/?m=abc"));
  assert.ok("erreur" in analyserLien3D("https://my.matterport.com/show/"));
  assert.ok("erreur" in analyserLien3D("javascript:alert(1)"));
  assert.deepEqual(analyserLien3D("https://kuula.co/share/collection/7abc"), { url: "https://kuula.co/share/collection/7abc", fournisseur: "Kuula" });
});
