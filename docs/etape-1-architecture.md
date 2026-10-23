# ÉTAPE 1 : Architecture du site

Convention d'URL : `/compte` (usager), `/pro` (établissement), `/agent` (agent évaluateur), `/partenaire` (accompagnateur), `/admin` (administrateur).

---

## 1. Arborescence

```
PUBLIC (sans connexion)
/                                   Accueil
├── /etablissements                 Recherche : liste + carte + filtres
│   └── /[slug]                     Fiche établissement
│       ├── /reserver               Réservation / prise de RDV (Premium)
│       └── /avis/nouveau           Déposer un avis
├── /secteurs/hotellerie            Pages secteur (SEO + entrée thématique)
├── /secteurs/sante
├── /secteurs/restauration
├── /le-label                       La promesse : 100 % audités, seuil 80 %, indépendance
├── /methodologie                   Grille d'audit, contrôles, charte déontologique
├── /verifier-un-badge              Vérifier l'authenticité d'un badge (code / QR)
├── /awards                         Édition en cours, catégories, formule 30/70
│   ├── /vote                       Vote des usagers
│   └── /[annee]                    Palmarès archivés
├── /offre-pro                      Pour les établissements : bénéfices, parcours A/B
│   ├── /tarifs                     Basique vs Premium (FCFA)
│   └── /candidature                Formulaire en plusieurs étapes (choix du parcours A ou B)
├── /devenir-accompagnateur         Présentation + candidature partenaire
├── /a-propos   /faq   /contact
├── /connexion  /inscription  /mot-de-passe-oublie
└── /mentions-legales  /cgu  /cgv  /confidentialite

ESPACE USAGER            /compte
├── /                    Tableau de bord
├── /reservations        Mes réservations / RDV
├── /avis                Mes avis
├── /favoris             Mes favoris
└── /parametres          Profil, notifications

ESPACE ÉTABLISSEMENT     /pro
├── /                    Tableau de bord (statut, score, alertes, statistiques)
├── /dossier             Dossier de candidature et pièces justificatives
├── /audits              Historique des audits
│   └── /[id]            Résultat détaillé + plan d'actions
├── /accompagnement      Suivi du parcours B
├── /fiche               Éditeur de fiche publique (+ visite 3D si Premium)
├── /avis                Avis clients et réponses
├── /reservations        Calendrier et demandes (Premium)
├── /rapports-ia         Rapports mensuels IA (Premium)
├── /badge               Badge numérique, QR code, kit de communication
├── /abonnement          Pack, paiements, factures
├── /awards              Participation aux awards
└── /parametres          Équipe (collaborateurs), compte

ESPACE AGENT             /agent
├── /                    Tableau de bord (missions du jour, carte)
├── /missions            Liste des missions
│   └── /[id]            Détail + déclaration de non-conflit
│       ├── /audit       Grille d'audit sur place (mobile, hors-ligne)
│       └── /rapport     Rapport et soumission
├── /awards              Notation des nominés (jury, 70 %)
├── /historique          Audits réalisés
└── /profil              Habilitations, zones, disponibilités

ESPACE ACCOMPAGNATEUR    /partenaire
├── /                    Tableau de bord (ou statut de candidature si non validé)
├── /missions            Missions proposées et en cours
│   └── /[id]            Diagnostic, plan d'actions, séances, progression
├── /ressources          Référentiel, guides, modèles
├── /honoraires          Missions facturables et paiements
└── /profil              Expertises, secteurs, zones, références

ESPACE ADMIN             /admin
├── /                    Tableau de bord (indicateurs, alertes)
├── /candidatures        Candidatures établissements
├── /etablissements      Tous les établissements (statut, score, pack)
├── /audits              Planification et assignation des agents
├── /validation          Comité qualité : validation des rapports
├── /recours             Contestations des établissements
├── /accompagnements     Demandes et assignation des accompagnateurs
├── /agents              Gestion des agents
├── /partenaires         Validation et gestion des accompagnateurs
├── /referentiel         Grilles d'audit par secteur (versionnées)
├── /moderation          Avis et signalements
├── /awards              Éditions, catégories, calcul 30/70, palmarès
├── /paiements           Transactions, abonnements, packs, tarifs
├── /contenus            Pages, FAQ, actualités
├── /utilisateurs        Comptes et rôles
└── /journal             Journal d'activité (traçabilité)
```

---

## 2. Liste des pages

### Pages publiques

| Page | Objectif | Contenu | Actions |
|---|---|---|---|
| **Accueil** | Rassurer et orienter vers la recherche | Grand bandeau d'accueil (« Tous nos établissements sont audités sur place ») avec barre de recherche (secteur + commune), chiffres clés, établissements à la une par secteur, « Comment ça marche » en 3 étapes, lauréats des awards, encart pour les professionnels | Rechercher, explorer un secteur, ouvrir une fiche, aller à l'offre pro |
| **Recherche** | Trouver un établissement certifié | Cartes (photo, nom, secteur, commune, score, badge), carte interactive. Filtres : secteur, sous-type (hôtel, clinique, maquis…), commune, score minimum, services, réservation possible. Tri. | Filtrer, passer de la liste à la carte, ajouter en favori, ouvrir une fiche |
| **Page secteur** | Référencement + entrée thématique | Présentation du secteur, critères propres au secteur, meilleurs établissements, sous-catégories | Mêmes actions que la recherche |
| **Fiche établissement** | Convaincre avec des preuves | Galerie, badge « Qualité certifiée », date du dernier audit et du prochain contrôle, note de gouvernance + 3 critères (hygiène, accueil, présentation du personnel), infos pratiques, carte, services, avis vérifiés et réponses, visite 3D (Premium), awards obtenus | Réserver (Premium), appeler / WhatsApp, itinéraire, favori, partager, laisser un avis, signaler |
| **Réservation** | Réserver ou prendre RDV (Premium) | Selon le secteur : chambre et dates, table et horaire, ou créneau de RDV. Récapitulatif, coordonnées. | Réserver, payer un acompte (option), recevoir la confirmation par SMS et e-mail |
| **Déposer un avis** | Recueillir des avis crédibles | Note par critère, commentaire, photo, date de visite, preuve de visite (réservation ou QR code sur place) | Soumettre (publication après modération) |
| **Le label** | Expliquer la promesse | Différence avec un annuaire, alternative à l'ISO, seuil de 80 %, indépendance, « le paiement n'influence jamais la note » | Vérifier un badge, candidater |
| **Méthodologie** | Transparence | Critères et pondérations, processus d'audit, contrôles réguliers, règles de retrait du badge, charte déontologique | Consultation |
| **Vérifier un badge** | Lutter contre les faux badges | Saisie du code ou scan du QR code, puis statut en temps réel : valide, suspendu ou retiré | Vérifier, signaler une fraude |
| **Awards** | Valoriser l'excellence | Édition en cours, catégories, calendrier, formule 30 % clients / 70 % évaluateurs, nominés, palmarès | Voter (connecté), consulter les archives |
| **Offre pro** | Convertir les établissements | Problème du coût de l'ISO, bénéfices, comparaison des parcours A (audit direct) et B (accompagnement), témoignages, FAQ pro | Candidater, voir les tarifs |
| **Tarifs** | Choisir un pack | Comparatif Basique / Premium en FCFA, frais d'audit et d'accompagnement | Choisir un pack, aller à la candidature |
| **Candidature** | Entrer dans le processus | Formulaire en plusieurs étapes : établissement, responsable, documents (RCCM, autorisation d'exploitation, agrément santé…), auto-diagnostic rapide, choix du parcours A ou B | Soumettre, créer le compte pro |
| **Devenir accompagnateur** | Recruter des partenaires | Rôle, engagements déontologiques, rémunération, formulaire (CV, expertises, secteurs, zones, références) | Candidater |
| **À propos / FAQ / Contact / pages légales** | Confiance et conformité | Équipe, mission, questions fréquentes, formulaire de contact, CGU, CGV, confidentialité | Contacter |
| **Inscription / connexion** | Accès aux espaces | Choix du type de compte : usager, établissement ou accompagnateur. Connexion par téléphone + code SMS ou par e-mail. **Les comptes agent et admin sont créés uniquement par un admin.** | S'inscrire, se connecter, réinitialiser le mot de passe |

### Espace usager

| Page | Objectif | Contenu | Actions |
|---|---|---|---|
| Tableau de bord | Vue d'ensemble | Réservations à venir, avis à laisser, favoris récents | Accès rapides |
| Mes réservations | Suivre ses réservations | Liste avec statut (en attente, confirmée, passée, annulée) | Annuler, modifier, laisser un avis après la visite |
| Mes avis | Suivre ses contributions | Statut de modération, réponses de l'établissement | Modifier, supprimer |
| Favoris | Retrouver des établissements | Liste des établissements sauvegardés | Retirer, ouvrir la fiche |
| Paramètres | Gérer son compte | Profil, notifications (SMS, e-mail), confidentialité | Modifier, supprimer le compte |

### Espace établissement

| Page | Objectif | Contenu | Actions |
|---|---|---|---|
| Tableau de bord | Suivre son statut et sa performance | Frise d'avancement (Candidature → Audit → Résultat → Paiement → Publié), score actuel, prochain contrôle, alertes (score proche de 80 %, pièces manquantes), statistiques (vues, clics, réservations) | Actions rapides |
| Dossier | Compléter la candidature | Informations légales, pièces justificatives, historique du statut | Téléverser, compléter |
| Audits | Comprendre sa note | Audits initiaux, de contrôle et réaudits. Score par critère, rapport PDF, points forts et points à améliorer, plan d'actions | Télécharger, contester (recours encadré), demander un accompagnement |
| Accompagnement | Suivre le parcours B | Accompagnateur assigné, plan d'actions, séances, progression, messagerie | Valider les séances, échanger, confirmer « prêt pour réaudit » |
| Ma fiche | Gérer sa vitrine | Description, photos, horaires, services, contacts, géolocalisation, visite 3D (Premium), aperçu | Modifier (soumis à modération), prévisualiser |
| Avis clients | Gérer sa réputation | Liste des avis, tendances par critère | Répondre, signaler un abus |
| Réservations (Premium) | Gérer la demande | Calendrier, demandes, disponibilités | Accepter, refuser, gérer les disponibilités |
| Rapports IA (Premium) | Progresser | Rapport mensuel : synthèse des avis, tendances, recommandations, archives | Consulter, télécharger |
| Badge et communication | Exploiter le label | Badge numérique, QR code de vérification, autocollant et affiche, widget pour site web | Télécharger, commander le kit |
| Abonnement | Gérer son pack | Pack actif, échéance, historique des paiements, factures | Payer (Mobile Money / carte), passer en Premium, renouveler |
| Awards | Participer | Éligibilité, catégories, calendrier | Confirmer sa participation |
| Paramètres | Gérer l'équipe | Collaborateurs et rôles internes (gérant, employé) | Inviter, retirer |

### Espace agent évaluateur (mobile first, utilisable hors connexion)

| Page | Objectif | Contenu | Actions |
|---|---|---|---|
| Tableau de bord | Organiser ses journées | Missions du jour et de la semaine, carte, alertes | Démarrer une mission |
| Missions | Gérer ses missions | Listes : planifiées, en cours, à finaliser | Accepter, refuser (avec motif) |
| Détail mission | Préparer l'audit | Établissement, type d'audit (initial, contrôle, réaudit, inopiné), historique des scores. **Aucune information de paiement.** | Déclarer un conflit d'intérêts ou attester de son absence, démarrer |
| Grille d'audit | Noter sur place | Critères du secteur, notation item par item, photos horodatées et géolocalisées, commentaires, score calculé automatiquement | Pointer son arrivée par GPS, saisir, joindre des preuves |
| Rapport | Formaliser | Synthèse automatique, constats, recommandations, signature | Soumettre au comité (le rapport est verrouillé ensuite) |
| Awards (jury) | Part des évaluateurs (70 %) | Nominés de sa catégorie | Noter |
| Historique / profil | Suivi | Audits passés, secteurs habilités, zones, disponibilités | Consulter, mettre à jour ses disponibilités |

### Espace accompagnateur partenaire

| Page | Objectif | Contenu | Actions |
|---|---|---|---|
| Statut de candidature | Suivre sa validation | Étapes : dossier → entretien → signature de la charte → validé | Compléter le dossier, signer la charte |
| Tableau de bord | Vue d'ensemble | Missions actives, séances à venir, honoraires | Accès rapides |
| Missions | Choisir ses missions | Missions proposées (secteur, commune, besoin), missions en cours | Accepter, refuser (déclarer un conflit) |
| Détail mission | Accompagner | Diagnostic (rapport initial avec l'accord de l'établissement), plan d'actions, séances et comptes rendus, progression, messagerie | Planifier une séance, rédiger un compte rendu, mettre à jour le plan, déclarer « prêt pour réaudit » |
| Ressources | Se former | Référentiel public, guides, modèles | Consulter, télécharger |
| Honoraires | Être payé | Missions facturables, paiements reçus | Télécharger un relevé |
| Profil | Être bien affecté | Expertises, secteurs, zones, certifications | Modifier |

### Espace administrateur

| Page | Objectif | Contenu | Actions |
|---|---|---|---|
| Tableau de bord | Piloter | Établissements par statut, audits à planifier, rapports à valider, revenus, alertes (scores sous 80 %, contrôles en retard) | Accès rapides |
| Candidatures | Filtrer les entrées | File d'attente, vérification des documents | Déclarer recevable ou non, orienter vers le parcours A ou B |
| Établissements | Gérer le catalogue | Liste, statut, score, pack | Publier, suspendre, retirer le badge, ordonner un contrôle |
| Audits | Planifier | Calendrier, charge des agents, assignation **avec blocage automatique des conflits** | Assigner, programmer un contrôle inopiné |
| Validation (comité qualité) | Double contrôle | Rapport et preuves de l'agent | Valider, demander un complément, ordonner un contre-audit. **Il ne peut jamais modifier une note.** |
| Recours | Traiter les contestations | Dossier de recours | Rejeter, ordonner un contre-audit par un autre agent |
| Accompagnements | Orchestrer le parcours B | Demandes, accompagnateurs disponibles | Assigner, suivre |
| Agents / partenaires | Gérer les intervenants | Comptes, habilitations, candidatures | Créer, valider, suspendre |
| Référentiel | Définir les règles | Grilles par secteur, critères, pondérations, seuil | Modifier (versionné, sans effet sur les audits passés) |
| Modération | Garder des avis fiables | Avis et signalements | Publier, masquer, traiter |
| Awards | Organiser | Éditions, catégories, votes, notes du jury, calcul 30/70 | Ouvrir et clôturer les votes, publier le palmarès |
| Paiements | Gérer les revenus | Transactions, abonnements, factures, configuration des packs | Rembourser, modifier les tarifs |
| Contenus / utilisateurs | Administrer | Pages, FAQ, comptes et rôles | Éditer, attribuer un rôle |
| Journal | Traçabilité | Toutes les actions sensibles (qui, quoi, quand) | Filtrer, exporter |

---

## 3. Parcours utilisateurs

### Usager : recherche, fiche, réservation, avis
```
Accueil ──► Recherche (secteur + commune + filtres) ──► Liste / Carte
                                                          │
                                                          ▼
                                                Fiche établissement
                                       (badge, note, 3 critères, avis, 3D)
                         ┌───────────────────────┼────────────────────────┐
                         ▼                       ▼                        ▼
                 Premium : Réserver     Basique : Appeler /         Favori / Partager
                         │              WhatsApp / Itinéraire
                         ▼
          Connexion (téléphone + code SMS, en 30 s)
                         │
          Choix date / créneau ──► Confirmation (SMS + e-mail)
                         │
                      Visite
                         │
          Invitation à laisser un avis (lendemain de la visite)
                         │
          Avis (note par critère + commentaire) ──► Modération ──► Publication
                                                                       │
                                                      Réponse de l'établissement
```

### Établissement, parcours A : audit direct
```
Offre pro ──► Candidature (infos + documents + auto-diagnostic, choix « Parcours A »)
                 │
                 ▼
     Recevabilité (admin) ──── non recevable ──► Notification + motif
                 │ recevable
                 ▼
     [Frais d'audit ? — à trancher]
                 │
     Planification : l'admin assigne un agent (contrôle anti-conflit automatique)
                 │
     Audit sur place : pointage GPS, grille, preuves photo
                 │
     Rapport soumis ──► Comité qualité (admin) : validation
                 │
        ┌────────┴─────────┐
        ▼                  ▼
   Score < 80 %        Score ≥ 80 %
        │                  │
   Rapport +           Choix du pack (Basique / Premium)
   recommandations         │
        │              Paiement (Mobile Money / carte)
        ▼                  │
   Parcours B          Création de la fiche ──► Modération
   ou réaudit              │
   après délai         PUBLICATION + badge « Qualité certifiée »
                           │
                       Contrôles réguliers (dont contrôles inopinés)
                           │
                       Score < 80 % ──► Retrait du badge ──► Proposition du parcours B
```

### Établissement, parcours B : accompagnement
```
Candidature (choix « Parcours B : je veux être accompagné »)
        │
Recevabilité (admin)
        │
Diagnostic initial (audit diagnostic ou auto-diagnostic approfondi — à trancher)
        │
L'admin assigne un accompagnateur (secteur, zone)
        │   └─► Le système enregistre le lien : cet accompagnateur ne pourra
        │       JAMAIS être assigné comme agent sur cet établissement
        ▼
L'accompagnateur accepte (déclaration de non-conflit)
        │
Plan d'actions co-construit ──► Séances (sur place / à distance) ──► Suivi de progression
        │
L'accompagnateur déclare « prêt pour réaudit » + l'établissement confirme
        │
Réaudit par un agent indépendant (l'accompagnateur est exclu automatiquement)
        │
Comité qualité
   ├─► ≥ 80 % : pack ──► paiement ──► PUBLICATION + badge
   └─► < 80 % : prolongation de l'accompagnement ──► nouveau réaudit
```

### Accompagnateur partenaire : inscription, validation, missions
```
« Devenir accompagnateur » ──► Inscription + dossier (CV, expertises, secteurs, zones, références)
        │
Statut « en validation » ──► Examen par l'admin (+ entretien) ── refus ──► Notification + motif
        │ validé
Signature de la charte déontologique (indépendance, confidentialité) ──► Compte activé
        │
Missions proposées ──► Accepter / Refuser (déclarer un conflit)
        │
Diagnostic ──► Plan d'actions ──► Séances + comptes rendus ──► Progression
        │
« Prêt pour réaudit » ──► Résultat du réaudit notifié ──► Clôture ──► Honoraires
```

### Agent évaluateur : audit, notation, rapport
```
Compte créé par l'admin (habilitations : secteurs, zones)
        │
Mission assignée ──► Déclaration de non-conflit ── conflit ──► Réassignation par l'admin
        │
Préparation : fiche, historique des scores, grille du secteur (téléchargée pour le hors-ligne)
        │
Sur place : pointage GPS horodaté
        │
Grille : hygiène / accueil / présentation du personnel (+ gouvernance)
        │   notation item par item + photos et commentaires comme preuves
        ▼
Score calculé automatiquement (pondérations du référentiel en vigueur)
        │
Rapport : constats, points forts, recommandations ──► Signature ──► Soumission (verrouillé)
        │
Comité qualité : valide / demande un complément / ordonne un contre-audit
```

---

## 4. Matrice des droits

**Légende** : **L** = lire · **C** = créer / agir · **M** = modifier · **V** = valider / décider · **(p)** = seulement ses propres données ou ses missions assignées · **—** = aucun accès

| Ressource / action | Visiteur | Usager | Établissement | Agent | Accompagnateur | Admin |
|---|---|---|---|---|---|---|
| Recherche, fiches publiées, vérification de badge | L | L | L | L | L | L |
| Note globale + 3 critères (public) | L | L | L | L | L | L |
| Rapport d'audit détaillé | — | — | L (p) | L (p) | L (p, avec accord) | L |
| Réserver / prendre RDV | — | C | — | — | — | L |
| Gérer les réservations | — | L/M (p) | L/M (p, Premium) | — | — | L |
| Déposer un avis | — | C (visite vérifiée) | — | — | — | — |
| Répondre à un avis | — | — | C (p) | — | — | — |
| Signaler un avis ou une fiche | C | C | C | — | — | — |
| Modérer avis et signalements | — | — | — | — | — | V/M |
| Voter aux awards (30 %) | — | C (1 vote / catégorie) | — | — | — | L |
| Noter les nominés, jury (70 %) | — | — | — | C | — | L |
| Configurer les awards, publier le palmarès | — | — | — | — | — | C/M/V |
| Candidature établissement | — | — | C/L (p) | — | — | L/V |
| Modifier sa fiche | — | — | M (p), puis modération | — | — | M/V |
| Payer un pack, voir ses factures | — | — | C/L (p) | — | — | L |
| Voir les paiements | — | — | L (p) | **—** | — | L |
| Rapports IA | — | — | L (p, Premium) | — | — | L |
| Planifier un audit, assigner un agent | — | — | — | — | — | C/M |
| Réaliser un audit, saisir les notes | — | — | — | C/M (p, avant soumission) | **— (interdit)** | **—** |
| Valider un rapport, publier | — | — | — | — | — | V |
| Modifier une note validée | — | — | — | — | — | **—** (contre-audit uniquement) |
| Contester un résultat | — | — | C (p) | — | — | V |
| Suspendre ou retirer un badge | — | — | — | — | — | C (automatique si < 80 %) |
| Demander un accompagnement | — | — | C | — | — | L/V |
| Assigner un accompagnateur | — | — | — | — | — | C |
| Exécuter l'accompagnement (plan, séances) | — | — | L + valide (p) | — | C/M (p) | L |
| Déclarer « prêt pour réaudit » | — | — | Confirme (p) | — | C (p) | L |
| Référentiel d'audit | L (version publique) | L | L | L | L | C/M (versionné) |
| Gérer les comptes et les rôles | — | — | Gérer son équipe (p) | — | — | C/M/S |
| Journal d'activité | — | — | — | — | — | L |

### Règles appliquées par le système (et pas seulement par procédure)
1. **Anti-conflit** : toute assignation d'audit est bloquée si l'agent a déjà accompagné cet établissement. L'agent doit aussi déclarer l'absence de conflit avant chaque mission.
2. **Paiement séparé de la notation** : les agents et le comité ne voient jamais le statut de paiement ni le pack. Ces données sont dans des tables séparées, protégées par les règles d'accès de Supabase (sécurité au niveau des lignes).
3. **Notes non modifiables** : une note ne peut plus être modifiée une fois le rapport soumis, y compris par un admin. Seul un contre-audit peut produire une nouvelle note.
4. **Retrait automatique** : si un audit de contrôle validé donne moins de 80 %, le badge passe immédiatement au statut « retiré ».
5. **Traçabilité** : toute action sensible (assignation, validation, retrait, modification du référentiel) est enregistrée dans le journal.

---

## Points à trancher
1. **Frais d'audit initial** : payants avant l'audit, ou inclus dans le pack après admission ? Dans les deux cas, la note n'est pas affectée.
2. **Après un retrait du badge** : fiche dépubliée immédiatement, ou mention « en réévaluation » avec un délai de mise en conformité (par exemple 30 jours) ?
3. **Avis** : réservés aux visites vérifiées (réservation ou QR code sur place) ? Recommandé pour la crédibilité du label.
4. **Accompagnement** : payé via la plateforme (avec commission) ou directement à l'accompagnateur ?
5. **Fréquence des contrôles** : par exemple un contrôle par semestre + un contrôle inopiné par an ?
6. **Diagnostic du parcours B** : audit diagnostic par un agent, ou auto-diagnostic approfondi ?
