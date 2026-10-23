# App Pro — Livrable 2 : Arborescence des écrans et parcours établissement

> `pro.qualite.ci` (dev : `localhost:3001`). **Un seul type de compte : établissement.** L'app a deux états qui changent la navigation : **avant publication** (parcours de certification) et **après publication** (outil de pilotage). Légende : ✅ existe dans le prototype · 🆕 à créer · 🔒 compte requis.

---

## 1. Le parcours de l'établissement

```
Onboarding (3 écrans)
   │
   ▼
Création de compte  ──►  téléphone/email → code SMS → responsable → PIN
   │
   ▼
Dossier de candidature (assistant, sauvegarde auto)
   │  infos · responsable légal · documents · vérification → envoi
   ▼
┌───────────────── AVANT PUBLICATION ─────────────────┐
│ Nav : Mon parcours · Documents · Aide · Profil       │
│                                                     │
│  Dossier soumis → validé → audit programmé →        │
│  audit réalisé → résultat                           │
│                       │                             │
│         ┌─────────────┴──────────────┐              │
│         ▼ ≥ 80 %                     ▼ < 80 %       │
│   Félicitations 🎉           Plan d'action +        │
│   → choix du pack            accompagnement          │
│   → paiement                 → réaudit               │
│   → PUBLIÉ                     (boucle)              │
└───────────────────────────┬─────────────────────────┘
                            ▼
┌───────────────── APRÈS PUBLICATION ─────────────────┐
│ Nav : Accueil · Ma fiche · Avis · Réservations · Plus│
│  (abonnement, accompagnement, rapport IA, awards,    │
│   contrôles, paramètres)                             │
└──────────────────────────────────────────────────────┘
```

## 2. Arborescence — avant publication

```
/onboarding                🆕 3 écrans + « Créer mon compte » / « Me connecter »
/connexion                 🆕 tel ou email → code SMS → PIN
/inscription               🆕 création du compte (responsable, PIN)
/dossier                   ✅→/pro/inscription 🔒 assistant de candidature :
   ├─ étape 1 informations    nom, secteur, adresse + point sur carte,
   │                          téléphone, email, horaires
   ├─ étape 2 responsable     responsable légal, employés, création
   ├─ étape 3 documents       RCCM, autorisation, pièce d'ID, photos
   │                          (envoi depuis le téléphone)
   └─ étape 4 vérification    récapitulatif → envoi
/parcours                  🆕 🔒 ÉCRAN CENTRAL — le chemin animé :
                             soumis → validé → audit programmé →
                             réalisé → résultat → paiement → publié
   ├─ créneau d'audit         choix parmi les créneaux proposés
   ├─ /resultat               score % en anneau, détail par critère,
   │                          points forts / à corriger, rapport PDF
   │   ├─ ≥ 80 % → félicitations → /abonnement
   │   └─ < 80 % → écran bienveillant → « Demander un accompagnement »
   └─ /accompagnement         ✅→/pro/accompagnement formulaire
                             (par Qualité+ / partenaire accrédité)
                             puis suivi : plan d'action à cocher,
                             %, messages, bouton « Demander le réaudit »
/documents                 🆕 🔒 pièces du dossier : requis / reçus / à refaire,
                             renvoi en un geste
/aide                      🆕 FAQ + contact support
/profil                    🆕 🔒 infos, utilisateurs et rôles, déconnexion
```

## 3. Arborescence — après publication

```
/ (Accueil)                ✅→/pro 🔒 TABLEAU DE BORD bento :
                             anneau de note, évolution du mois, vues de
                             la fiche, nouveaux avis, réservations du
                             jour (Premium), abonnement, prochain contrôle
                             + bandeaux d'alerte en haut
/fiche                     🆕 🔒 MA FICHE : ce que voit l'usager —
                             description, photos, horaires, services,
                             contact, menu/tarifs ; aperçu usager ;
                             modifs sensibles → validation
/avis                      ✅→/pro 🔒 avis reçus : filtres note/critère,
                             réponse publique, signalement abusif,
                             thèmes récurrents (mini-graphe)
/reservations              ✅→/pro/reservations 🔒 [Premium] calendrier,
                             liste du jour, confirmer/refuser en un geste,
                             disponibilités ; [Basique] écran verrouillé → Premium
/plus                      🆕 🔒 menu « Plus » →
   ├─ /plus/abonnement      ✅→/pro/abonnement packs Basique/Premium,
   │                        paiement OM/MTN/Wave/carte, factures PDF,
   │                        renouvellement, « le paiement n'influence
   │                        jamais la note » affiché clairement
   ├─ /plus/visite-3d       ✅→/pro/premium 🔒 [Premium] lien 360° + aperçu ;
   │                        [Basique] verrouillé
   ├─ /plus/rapports        ✅→/pro/rapports 🔒 [Premium] rapport mensuel IA
   │                        (points forts/faibles, thèmes, recommandations,
   │                        PDF, historique) ; [Basique] aperçu flouté
   ├─ /plus/awards          🆕 🔒 catégories, statut nominé ou non,
   │                        calendrier, classement (30 % clients /
   │                        70 % évaluateurs)
   ├─ /plus/controles       🆕 🔒 calendrier des contrôles, résultats,
   │                        alerte bienveillante si < 80 % + plan de
   │                        correction + risque de retrait expliqué
   ├─ /plus/accompagnement  ✅ 🔒 suivi du plan d'action (réutilisé
   │                        après publication si accompagné)
   └─ /plus/parametres      🆕 🔒 établissement, utilisateurs et rôles,
                            notifications, langue, verrouillage,
                            mode sombre, aide, déconnexion
```

## 4. Comptes et rôles (un établissement = plusieurs utilisateurs)

| Rôle | Peut |
|---|---|
| **Gérant** | Tout : dossier, abonnement, fiche, avis, réservations, utilisateurs |
| **Responsable** | Avis et réservations uniquement |
| **Comptable** | Paiements et factures uniquement |

Un compte peut gérer **plusieurs sites** de la même structure — sélecteur d'établissement en haut du dashboard (🆕).

## 5. Données de démonstration (3 comptes)

| Compte | État | Sert à montrer |
|---|---|---|
| Restaurant « Chez Tanti », Marcory | Candidature en cours (audit programmé) | Le parcours avant publication, choix du créneau |
| Hôtel « La Baie des Sirènes », Riviera | Admis, **Basique** | Dashboard, écrans Premium verrouillés, montée de pack |
| Clinique « Les Palmiers », Cocody | Admise, **Premium** | Réservations, visite 3D, rapport IA, awards |

## 6. Notifications (déclencheurs)

Dossier validé · audit programmé (rappel J-1) · résultat disponible · paiement reçu · abonnement qui expire · nouvel avis · nouvelle réservation · rapport IA du mois · contrôle à venir — push + SMS + email.

## 7. Correspondance avec l'existant

| Actuel (`/pro/*`) | Devient |
|---|---|
| `/pro/inscription` (assistant dossier) | `/dossier` — même logique, nouvelle enveloppe |
| `/pro` (dashboard + statut) | `/` dashboard + `/parcours` séparé |
| `/pro/accompagnement` | `/plus/accompagnement` (+ avant publication) |
| `/pro/abonnement` | `/plus/abonnement` |
| `/pro/reservations`, `/pro/premium`, `/pro/rapports` | `/reservations`, `/plus/visite-3d`, `/plus/rapports` |
| — | 🆕 `/parcours`, `/resultat`, `/documents`, `/fiche`, `/plus/*`, connexion/PIN, rôles |

## 8. À valider

1. La **double navigation** (4 onglets avant / 5 après) — le cœur de la spec.
2. `/parcours` comme écran central avant publication (au lieu d'un dashboard vide).
3. Menu « **Plus** » qui regroupe les fonctions secondaires — ok ?
4. Les 3 comptes démo proposés.

J'attends ta validation avant le livrable 3 (maquettes : création de compte, suivi de certification, résultat d'audit, tableau de bord).
