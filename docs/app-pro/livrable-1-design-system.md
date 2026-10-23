# App Pro — Livrable 1 : Moodboard & système de design

> **Qualité+ Pro** (`pro.qualite.ci`, en dev `localhost:3001`) — l'espace de travail des établissements : candidature, audit, abonnement, pilotage quotidien. **Réservée aux établissements** : aucun lien vers l'app usager, les agents ou l'admin.

---

## 1. Moodboard — direction artistique

**L'idée en une phrase : un outil de travail rassurant, pas un gadget — le bleu roi cadre, le vert récompense.**

| Référence | Ce qu'on en prend |
|---|---|
| **Yango Pro / Uber Driver** | Bottom nav utile, gros chiffres, actions en un geste, « mon boulot du jour » d'abord |
| **Wave / Stripe Dashboard** | Bento de chiffres clés, statuts lisibles, sérieux sans être austère |
| **Duolingo** | Le parcours de certification comme un chemin d'étapes qui se débloque |
| **iOS** | Verre dépoli, coins ronds — la marque reste reconnaissable avec l'app usager |

**4 principes fondateurs**
1. **Le statut d'abord** — on ouvre l'app et on sait où on en est : « audit dans 3 jours », « publié, 94 % ».
2. **Gros chiffres, peu de texte** — le gérant n'est pas technicien : chiffres ronds, mots simples.
3. **Vert = réussi, bleu = cadre** — le vert ne sert qu'aux succès et validations, jamais en décor.
4. **Un geste = une action** — confirmer une réservation, répondre à un avis, payer : jamais plus de 2 taps.

**Différence avec l'app Usager** : même famille (logo, polices, coins ronds) mais — pas de carte plein écran, pas de recherche ; à la place : un header bleu roi, un parcours de certification, un dashboard bento. Là où l'usager rêve, le pro travaille.

## 2. Palette

Identique à l'app usager (même marque), avec un rôle renforcé pour le bleu roi :

| Token | Hex | Usage Pro |
|---|---|---|
| `--bleu-900` | `#16296B` | Fond du header, texte sur sombre |
| `--bleu-800` | `#1E3A8A` | **Couleur de cadre** : menu, en-têtes, éléments actifs |
| `--bleu-500` | `#2D4DB0` | Liens, éléments secondaires |
| `--vert-600` | `#16A34A` | **Succès uniquement** : certifié, payé, étape validée |
| `--vert-400` | `#22C55E` | Confettis, graphes positifs |
| `--blanc` / `--surface` | `#FFFFFF` / `#F5F7FB` | Cartes / fond |
| `--encre` / `--discret` / `--ligne` | `#0F172A` / `#64748B` / `#E2E8F0` | Texte / secondaire / bordures |
| `--or` | `#D4A017` | Awards |
| `--ambre` | `#D97706` | **Attente** : dossier en examen, audit programmé, paiement en cours |
| `--danger` | `#DC2626` | Sous 80 %, impayé, badge retiré |

**Dégradé** réservé aux moments forts (admission, pack Premium) : `bleu roi → vert`, jamais en fond permanent — le Pro reste sobre.

**Mode sombre** : fond `#0B1220`, cartes `#131C33`, encre `#F1F5F9`, bleu roi → `#4C6FE0`.

## 3. Typographie

| Rôle | Police | Taille | Graisse |
|---|---|---|---|
| Chiffre clé | Poppins | 32–44 px | 800 |
| Titre | Poppins | 24–28 px | 700 |
| Sous-titre | Poppins | 17 px | 600 |
| Corps | Inter | 14–15 px | 400–500 |
| Étiquette | Inter | 11 px, +8 % tracking, MAJ | 600 |

## 4. Matière et formes

- **Rayons** : cartes 20–24 px, panneaux 28 px, boutons/puces `full` — un cran moins rond que l'usager (outil).
- **Ombres** : douces et basses — `0 4px 16px rgba(15,23,42,.06)` carte, `0 8px 24px` flottant.
- **Verre dépoli** : uniquement la barre du bas et les barres d'action flottantes.
- **Bento** : le tableau de bord est une grille de cartes de tailles variées — grand anneau de score en vedette, moyennes (vues, avis, réservations), bandeaux d'alerte pleine largeur.

## 5. Composants signature

| Composant | Spec |
|---|---|
| **ParcoursCertif** | Chemin animé des étapes (soumis → validé → audit programmé → réalisé → résultat → payé → publié) : ligne qui se remplit en vert, étape courante qui pulse |
| **AnneauScore** | Grand anneau SVG qui se remplit + compteur défilant jusqu'à la note ; vert ≥ 80 %, ambre en dessous |
| **CarteBento** | Variantes : chiffre clé + mini-graphe, liste courte, statut + CTA ; glisse à l'ouverture |
| **BadgeCertifie** | Pilule verte « Qualité certifiée », reflet 6 s ; le jour de l'admission : confettis bleu/vert + vibration succès |
| **EtapeDossier** | Ligne d'assistant (étape n/total, titre, sauvegarde auto affichée « Enregistré ✓ ») |
| **DocChip** | Document : icône type, état (requis / reçu / à refaire), bouton envoi photo |
| **CarteReservation** | Heure, client, couverts/chambre, deux gros boutons Confirmer (vert) / Refuser (contour) |
| **CarteAvis** | Étoiles + personnel noté + texte, zone « Votre réponse publique », bouton Signaler |
| **PillStatut** | Étiquettes uniformes : Soumis / En examen (ambre), Audit programmé (bleu), Admis / Certifié / Payé (vert), Action requise (danger) |
| **NavBasPro** | 5 icônes : Accueil, Ma fiche, Avis, Réservations, Plus ; **avant publication** : Mon parcours, Documents, Aide, Profil |
| **EcranVerrouille** | Basique : aperçu flouté + « Passer à Premium » (cadenas + dégradé discret) |
| **SquelettePro** | Blocs shimmer pour dashboard et listes |

## 6. Effets & animations — spécifications

| Moment | Animation | Spec |
|---|---|---|
| Splash | Logo + fondu vers l'écran d'accueil | ≤ 1,5 s, une fois par session |
| Parcours | La ligne verte avance jusqu'à l'étape courante, coche dessinée | 800 ms, `ease-out` |
| Score | Anneau + compteur | 1 s, `cubic-bezier(.22,1,.36,1)` |
| Admission | Confettis bleu/vert + vibration [20,50,20] | 1,2 s, une fois |
| Graphiques | Courbes qui se tracent (`stroke-dashoffset`) | 700 ms à l'ouverture |
| Listes | Cartes qui glissent en cascade | 40 ms de décalage |
| Tactile | Boutons scale 0,97 + vibration 10 ms | — |
| Gestes | Tirer pour rafraîchir les listes, glisser pour revenir | — |

**Performance** : `transform`/`opacity` uniquement, `prefers-reduced-motion` respecté, pas de blur sur calques animés — cible 60 fps entrée de gamme et connexion lente (squelettes plutôt que spinners).

## 7. Haptique

Tap 10 ms · confirmer réservation / paiement OK [20,50,20] · erreur ou refus [30,30,30].

## 8. Icônes, graphes, documents

- Lucide trait 2 px ; icônes « métier » en pastilles bleu roi.
- Graphes : sparklines SVG maison (pas de lib) — courbe de note, barres de vues.
- Documents : envoi photo via `input[type=file][capture]`, aperçu vignette, factures/rapports en PDF générés en front (moteur `lib/pdf.ts` déjà éprouvé).
- PWA installable, saisie du dossier tolérante au hors-ligne (brouillon local).

## 9. À valider

1. Ambre `#D97706` ajouté pour les statuts « en attente » — ok ?
2. Dashboard « bento » avec anneau de score en vedette — ok ?
3. Avant publication, nav réduite à 4 onglets (Mon parcours, Documents, Aide, Profil) comme spécifié — ok ?
4. En dev, l'app Pro tournera sur **localhost:3001** pendant que l'usager reste sur 3000 — ok ?

J'attends ta validation avant le livrable 2 (arborescence des écrans et parcours établissement).
