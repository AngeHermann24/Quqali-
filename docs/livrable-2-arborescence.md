# Livrable 2 — Arborescence des pages des 4 applications

Arborescence complète de chaque application. Légende : ✅ existe dans le prototype actuel · 🆕 à créer · 🔒 compte requis · 📱 mobile uniquement.

Chaque application possède **sa propre page de connexion** (détaillée au livrable 3) et sa propre navigation — aucun menu ne mélange les univers.

---

## 1. APP USAGER — `qualite.ci` (mobile-first, PWA installable)

```
/                              ✅ Accueil : recherche (secteur, ville, quartier),
                                  catégories Hôtels / Restaurants / Santé,
                                  établissements à la une, teaser Awards,
                                  « Comment ça marche »
/etablissements                ✅ Résultats : liste + carte interactive, filtres
                                  (secteur, ville, services, note min), tri par
                                  note ; les suspendus n'y apparaissent pas
/etablissements/[slug]         ✅ Fiche : photos, note globale + détail par
                                  critère (hygiène, accueil, présentation,
                                  gouvernance), badge « Qualité certifiée »,
                                  avis + note du personnel, carte, horaires,
                                  contact
   ├─ Premium : Visite 3D      ✅ iframe (hôtes autorisés uniquement)
   └─ Premium : Réserver       ✅ créneau, coordonnées → demande envoyée
/avis/[slug]                   🆕 🔒 dépôt d'avis : preuve de visite → note
                                  globale + personnel + commentaire
/awards                        ✅ Lauréats de l'année + classements complets
/methodologie                  ✅ Grille, seuil 80 %, indépendance, contrôles
/tarifs                        ✅ Packs Basique / Premium (info pour les étab.)
/contact                       🆕 Formulaire + coordonnées Qualité+
/connexion                     🆕 Connexion compte client (téléphone/e-mail)
/inscription                   🆕 Création de compte client (léger)
/compte                        🆕 🔒 Tableau de bord client
   ├─ /compte/reservations     🆕 🔒 mes réservations (statuts, annulation)
   ├─ /compte/avis             🆕 🔒 mes avis déposés (+ statut de modération)
   └─ /compte/favoris          🆕 🔒 établissements favoris ♥
```

Lien discret dans le pied de page : « Vous êtes un établissement ? Rejoignez-nous » → `pro.qualite.ci`.

---

## 2. APP PRO — `pro.qualite.ci` (2 types de compte, 1 app)

L'accueil redirige selon le rôle du compte connecté (établissement ou accompagnateur). Lien permanent : « Retour au site grand public » → `qualite.ci`.

### A. Espace Établissement

```
/connexion                     🆕 Connexion (même page pour les 2 rôles,
                                  le rôle oriente vers le bon espace)
/inscription                   ✅→/inscription dépôt de candidature : infos,
                                  documents, responsable, secteur, demande
                                  d'accompagnement éventuelle
/tableau-de-bord               ✅→/ note affichée, statut de la candidature
                                  (soumis → en audit → admis/refusé), avis
                                  récents, état de l'abonnement, raccourcis
/candidature                   🆕 🔒 suivi détaillé : documents, pièces
                                  manquantes, historique, agent assigné,
                                  date d'audit
/accompagnement                ✅ 🔒 demande (par nous ou partenaire) +
                                  suivi : plan d'action, étapes, date de réaudit
/avis                          🆕 🔒 avis reçus : répondre, signaler un faux avis
/abonnement                    ✅ 🔒 pack Basique/Premium, paiement Mobile
                                  Money/carte, factures PDF, prorata au
                                  changement de pack
/reservations                  ✅ 🔒 [Premium] demandes reçues, agenda,
                                  disponibilités, confirmation/refus
/visite-3d                     ✅→/premium 🔒 [Premium] lien de la visite 3D
/rapports                      ✅ 🔒 [Premium] rapports mensuels IA
                                  (tendances, points forts, axes d'amélioration)
/parametres                    🆕 🔒 fiche publique : photos, horaires,
                                  services, coordonnées
```

### B. Espace Accompagnateur partenaire

```
/inscription-partenaire        ✅→/inscription dépôt de candidature : profil,
                                  secteurs, zones, documents → validation admin
/tableau-de-bord               ✅→/ missions en cours, progression, demandes
/missions/[id]                 ✅ 🔒 détail mission : établissement accompagné,
                                  plan d'action, étapes cochées, échanges
/profil                        🆕 🔒 secteurs couverts, zones, documents
```

> Rappel métier : un accompagnateur n'est **jamais** évaluateur de l'établissement qu'il a accompagné (règle appliquée à l'affectation côté admin, et garantie en base).

---

## 3. APP AGENT — `agent.qualite.ci` (📱 mobile only, PWA, hors-ligne)

Ultra simple, gros boutons, fonctionne avec une connexion faible : les missions sont téléchargées à l'avance, la grille se remplit sans réseau et se synchronise au retour de connexion.

```
/connexion                     🆕 Connexion agent (compte créé par l'admin,
                                  pas d'inscription)
/                              🆕 🔒 Audits du jour + à venir : cartes mission
                                  (établissement, adresse, type : admission /
                                  contrôle annuel / inopiné, statut)
/audits/[id]                   🆕 🔒 Détail mission : adresse + bouton
                                  « Itinéraire » (ouvre l'app GPS), contact,
                                  historique des notes, consignes
/audits/[id]/grille            🆕 🔒 Grille de notation : hygiène (30 %),
                                  accueil (25 %), présentation du personnel
                                  (20 %), gouvernance (25 %) + critères
                                  sectoriels — notes 0–5, photos jointes,
                                  commentaire par critère — **100 % hors-ligne**
/audits/[id]/rapport           🆕 🔒 Score calculé en %, verdict vs seuil 80 %,
                                  rapport généré → envoi/synchronisation
/missions-passees              🆕 🔒 Historique des audits rendus
/profil                        🆕 🔒 Secteurs, zones, disponibilité
```

L'app agent n'a **aucun lien public** — connexion directe uniquement.

---

## 4. ADMIN — `admin.qualite.ci` (sobre, tableaux, stats)

```
/connexion                     🆕 Connexion équipe (compte créé par un admin)
/                              ✅ Tableau de bord : KPI, file « À traiter »,
                                  établissements par secteur, réputation,
                                  score moyen, revenus
/candidatures                  ✅ Validation établissements : dossier,
                                  documents, affectation agent → audit →
                                  admission auto ≥ 80 %
   └─ onglet accompagnateurs   ✅ Candidatures partenaires : entretien →
                                  validé/refusé
/agents                        ✅ Équipe évaluateurs : fiches, audits
                                  programmés, affectation (indépendance +
                                  rotation), demandes d'accompagnement
/etablissements                ✅ Liste complète : suspendre/rétablir,
                                  retirer/remettre le badge, lien fiche
/abonnements                   ✅ Abonnés, états (actif/grâce/suspendu), MRR,
                                  total encaissé, journal des transactions
/moderation                    ✅ File des avis : suspects auto + signalés par
                                  les établissements → publier / rejeter
/awards                        ✅ Classements par catégorie en temps réel,
                                  avis en attente, clôture annuelle 🆕
/tarifs                        ✅ Configuration des packs (prix mensuel/annuel)
/brochures                     ✅ Génération PDF : affiche A4 gares (QR →
                                  annuaire) + carte comptoir (QR → fiche +
                                  code de visite)
/statistiques                  🆕 Vue approfondie : secteurs, scores moyens,
                                  revenus, avis, audits par mois
/parametres                    🆕 Comptes admin/agents (invitations), grille
                                  d'audit, seuils, textes
```

L'admin n'a **aucun lien public** — connexion directe uniquement.

---

## 5. Routes API partagées (toutes apps, côté serveur)

```
/api/paiement/webhook          🆕 confirmation CinetPay → active l'abonnement
/api/rapports/generer          ✅ rapport mensuel IA (Claude) — cron 1er du mois
/api/avis/verifier-code        🆕 vérifie un code de visite sans le consommer
/api/agent/sync                🆕 réception des audits hors-ligne
/api/notifications             🆕 envoi SMS/e-mail (réservations, rappels)
```

## 6. Récapitulatif

| App | Pages existantes | Pages à créer | Accès |
|---|---|---|---|
| Usager | 6 + fiches | compte client (5), avis dédié, contact, connexion | public + compte léger |
| Pro — Établissement | 7 | candidature détaillée, avis, paramètres | 🔒 |
| Pro — Accompagnateur | 3 | profil | 🔒 |
| Agent | 0 | 7 pages, toute l'app + hors-ligne | 🔒 📱 |
| Admin | 9 | statistiques, paramètres, connexion | 🔒 interne |

En attente de ta validation avant le livrable 3 (parcours de connexion et redirection selon le rôle).
