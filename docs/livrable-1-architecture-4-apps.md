# Livrable 1 — Architecture des 4 applications Qualité+

Refonte de la plateforme en **4 applications séparées** (modèle Yango : une app par public), reliées par **une seule base de données et un seul système d'authentification**, chacune sur son sous-domaine avec son design, sa page de connexion et sa navigation.

## 1. Vue d'ensemble

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                            PLATEFORME QUALITÉ+                                 │
├─────────────────┬─────────────────┬─────────────────┬────────────────────────┤
│  APP USAGER     │  APP PRO        │  APP AGENT      │  ADMIN (back-office)   │
│  qualite.ci     │  pro.qualite.ci │  agent…ci       │  admin.qualite.ci      │
│  www.qualite.ci │                 │                 │                        │
├─────────────────┼─────────────────┼─────────────────┼────────────────────────┤
│ Usagers         │ Établissements  │ Agents          │ Équipe Qualité+         │
│ (sans compte)   │ adhérents       │ évaluateurs     │ interne                │
│ + compte client │ + accompagn.    │ terrain         │                        │
│                 │ partenaires     │                 │                        │
├─────────────────┼─────────────────┼─────────────────┼────────────────────────┤
│ Recherche,      │ Candidature,    │ Audits          │ Validation,            │
│ fiches, avis,   │ abonnement,     │ assignés,       │ affectation,           │
│ réservations,   │ réservations,   │ grille de       │ établissements,        │
│ awards, compte  │ 3D, rapports IA │ notation hors-  │ paiements, modération, │
│ client          │ suivi qualité   │ ligne, rapports │ awards, brochures      │
├─────────────────┼─────────────────┼─────────────────┼────────────────────────┤
│ Blanc, chaleureux│ « Outil de     │ Ultra simple,   │ Sobre, tableaux,       │
│ bleu + vert     │ travail »,      │ gros boutons,   │ statistiques           │
│ en accents      │ menu bleu roi   │ mobile only,    │                        │
│ PWA installable │                 │ connexion faible│                        │
└────────┬────────┴────────┬────────┴────────┬────────┴───────────┬────────────┘
         │                 │                 │                    │
         └─────────────────┴────────┬────────┴────────────────────┘
                                    │
                    ┌───────────────▼────────────────┐
                    │   SUPABASE — socle unique      │
                    │ • Auth (1 compte, 1 rôle)      │
                    │ • PostgreSQL + RLS par rôle    │
                    │ • Storage (documents, photos)  │
                    │ • Edge functions + cron        │
                    └───────────────┬────────────────┘
        ┌────────────┬────────────┬─┴──────────┬────────────┬───────────┐
        │  Paiement  │    SMS     │   E-mail   │    IA      │   Cartes  │
        │  CinetPay  │ agrégateur │  Resend/   │  Claude    │  OSM +    │
        │  OM / MTN  │ (notifs)   │  Brevo     │  (rapports)│  Leaflet  │
        │  Wave/carte│            │            │            │           │
        └────────────┴────────────┴────────────┴────────────┴───────────┘
```

## 2. Les 4 applications

| # | Application | Sous-domaine | Public | Contenu principal | Identité |
|---|---|---|---|---|---|
| 1 | **Usager** | `qualite.ci` (apex) + `www.qualite.ci` | Grand public, compte client optionnel | Recherche, fiches, avis, réservations, awards, méthodologie, compte client | Très blanche, chaleureuse ; bleu/vert en accents ; mobile-first, PWA |
| 2 | **Pro** | `pro.qualite.ci` | Établissements adhérents + accompagnateurs partenaires | Candidature, suivi de statut, abonnement/paiements, réservations, 3D, rapports IA, accompagnement, missions partenaires | « Outil de travail » : menu et en-tête bleu roi, vert pour les succès |
| 3 | **Agent** | `agent.qualite.ci` | Évaluateurs terrain | Audits assignés, itinéraire, grille de notation + photos, hors-ligne, rapport | Ultra simple : gros boutons, mobile uniquement, tolérant réseau faible |
| 4 | **Admin** | `admin.qualite.ci` | Équipe Qualité+ | Validation candidatures, affectations, établissements/badges, abonnements, modération, awards, brochures, stats | Sobre, tableaux, data-viz |

## 3. Liens entre les applications

```
 www.qualite.ci ──« Vous êtes un établissement ? Rejoignez-nous »──▶ pro.qualite.ci
 pro.qualite.ci ──« Retour au site grand public »──────────────▶ www.qualite.ci
```

- **agent.qualite.ci et admin.qualite.ci n'ont aucun lien public** : on y entre uniquement par leur page de connexion (comptes créés/invités par l'admin).
- Les **QR codes** des brochures (gares, comptoirs) et les codes de visite pointent vers `www.qualite.ci`.
- Les **e-mails et SMS** renvoient vers l'application du rôle concerné (réservation → usager ou pro ; audit assigné → agent ; candidature validée → pro).
- Règle d'isolation : un compte usager ne peut **jamais** ouvrir pro/agent/admin ; un compte pro non plus. La sécurité est garantie côté base (RLS), pas seulement côté liens.

## 4. Socle technique partagé

| Couche | Choix | Rôle |
|---|---|---|
| **Base** | Supabase (PostgreSQL) | Une seule base ; chaque rôle ne voit que ses données via **Row Level Security** |
| **Auth** | Supabase Auth | Un seul compte = un seul rôle (`usager`, `etablissement`, `accompagnateur`, `agent`, `admin`) porté dans le JWT |
| **Fichiers** | Supabase Storage | Documents de candidature, photos d'audit, logos, 3D (lien externe) |
| **Serveur** | Routes API Next + Edge functions | Webhook paiement, génération rapport IA, envoi SMS/e-mail, vérification codes de visite |
| **Tâches planifiées** | Cron | Rappels d'échéance et suspension d'impayés, rapport IA le 1er du mois, rappel réservation J-1, clôture annuelle des Awards |
| **Paiement** | CinetPay (ou équivalent) | Orange Money, MTN MoMo, Wave, carte — webhook confirme la transaction |
| **Cartes** | OpenStreetMap + Leaflet (Mapbox possible) | Carte des résultats, itinéraire agent |

## 5. Organisation du code — monorepo

**Option retenue (recommandée) : un seul projet Next.js, routage par sous-domaine.**

```
platforme/
├─ middleware.ts            # lit le Host → aiguille vers le bon groupe de routes
├─ app/
│  ├─ (usager)/             # www : accueil, recherche, fiches, compte client
│  ├─ (pro)/                # pro : dashboard établissement + partenaire
│  ├─ (agent)/              # agent : audits, grille, hors-ligne (PWA)
│  ├─ (admin)/              # admin : back-office
│  └─ api/                  # webhook paiement, rapports IA, codes de visite
└─ src/
   ├─ lib/db/               # client Supabase, types générés, helpers RLS
   ├─ lib/metier/           # règles déjà éprouvées : regles, abonnement,
   │                        # avis, awards, admin, reservation, pdf, qrcode
   └─ ui/                   # kit visuel partagé (logo, couleurs, boutons, cartes)
```

Pourquoi un seul projet plutôt que 4 apps Next.js :

- **Un seul déploiement** au lieu de quatre (même serveur, les 4 sous-domaines pointent vers lui ; le `middleware` aiguille par `Host`).
- **Zéro duplication** : les règles métier (déjà écrites et testées), le kit visuel et la couche base sont partagés naturellement.
- Le découpage par route de Next.js fait que **le code de l'app Pro n'est jamais téléchargé** par un visiteur usager — les bundles restent légers.
- L'isolation réelle est portée par la **RLS côté base** + le contrôle du rôle dans le middleware, pas par la séparation des déploiements.

Alternative si l'équipe grandit : passer à un monorepo de 4 apps distinctes (`apps/usager`, `apps/pro`…) partageant les mêmes paquets — possible plus tard sans refonte, puisque le code sera déjà rangé par univers.

**Développement local** : `qualite.local`, `pro.qualite.local`, `agent.qualite.local`, `admin.qualite.local` dans le fichier hosts (ou paramètre `?app=` en dev).

## 6. Flux de données transverses

| Flux | Chemin |
|---|---|
| **Admission** | Pro dépose sa candidature → Admin valide et affecte un agent → Agent réalise l'audit (hors-ligne puis synchro) → score ≥ 80 % enregistré → fiche publiée sur www + badge |
| **Avis** | Usager (compte) dépose un avis avec preuve de visite → modération (auto + admin) → publié sur www → visible dans le dashboard pro |
| **Awards** | Avis clients (30 %) + notes d'audit (70 %) → calcul annuel → palmarès public sur www, pilotage dans admin |
| **Paiement** | Pro choisit son pack → Mobile Money/carte → webhook confirme → abonnement actif, facture PDF → rappels automatiques, suspension puis réactivation ; **la note n'est jamais touchée** |
| **Brochures** | Admin génère les PDF (QR) → posées dans les gares et aux comptoirs → scannées → arrivent sur www |
| **Accompagnement** | Pro demande un accompagnement → Admin affecte un partenaire → plan d'action suivi dans pro → réaudit par un **autre** agent (indépendance garantie en base + à l'affectation) |
| **Agent hors-ligne** | L'app agent télécharge ses missions en avance → grille remplie sans réseau → synchronisation au retour de connexion |

## 7. Sécurité et rôles (résumé)

- Un compte = **un seul rôle** ; les comptes agent et admin sont créés par l'admin (pas d'auto-inscription).
- **RLS** : chaque table porte une politique par rôle (l'usager lit les fiches publiques, le pro lit/modifie seulement son établissement, l'agent voit seulement ses audits, l'admin voit tout).
- Le **middleware** redirige quiconque tente d'ouvrir la mauvaise app vers sa propre page de connexion — détaillé au livrable 3.
- Même avec le bon sous-domaine, un jeton usager ne peut rien lire d'autre que le public — la base refuse.

## 8. Correspondance avec l'existant

Le prototype actuel (`web/`, données localStorage) contient déjà tous les écrans — ils migrent tels quels vers les 4 apps :

| Écrans existants | Future app |
|---|---|
| `/`, `/etablissements`, fiches, `/awards`, `/methodologie`, avis, réservation, compte client | **www** (usager) |
| `/pro/*`, `/devenir-partenaire`, `/partenaire/*`, `/tarifs` | **pro** |
| *(à créer : audits terrain hors-ligne)* | **agent** |
| `/admin/*` | **admin** |
| `src/lib/{regles,abonnement,avis,awards,reservation,admin,ia,pdf,qrcode,brochure-pdf,visite3d}` | `src/lib/metier/` partagé — inchangés, déjà testés |

## 9. Points à valider

1. **Nom et domaines** : `qualite.ci` / `pro.qualite.ci` / `agent.qualite.ci` / `admin.qualite.ci` (remplacer `[NOM]` si autre choix).
2. **Un seul projet Next.js + routage par sous-domaine** — validé ? (vs 4 apps distinctes)
3. **L'app Pro regroupe établissement ET accompagnateur** (deux espaces dans une même app, deux types de compte), comme spécifié.
4. **Supabase** comme socle unique (Auth + Postgres + RLS + Storage + cron).
5. Paiement : **CinetPay** en tête de liste pour Mobile Money CI — à confirmer.

En attente de ta validation avant le livrable 2 (arborescence des pages de chaque application).
