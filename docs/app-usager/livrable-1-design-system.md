# App Usager — Livrable 1 : Moodboard & système de design

> Application **Quqliter Usager** (`quqliter.ci`) — guide de confiance de la qualité de service à Abidjan. **Réservée aux usagers** : aucun lien, bouton ou mention vers les espaces établissement, agent, accompagnateur ou admin (règle d'isolement, déjà appliquée sur le site actuel).

---

## 1. Moodboard — direction artistique

**L'idée en une phrase : une carte vivante d'Abidjan sous une vitre de verre.**

| Référence | Ce qu'on en prend |
|---|---|
| **Yango / Glovo** | La carte plein écran dès l'accueil, le panneau qui glisse du bas, la vitesse perçue |
| **Apple Wallet** | La pile de cartes pour les réservations, les gestes qui « attrapent » |
| **iOS** | Le verre dépoli, les coins très ronds, les ombres qui flottent |
| **Airbnb** | La photo reine, le double-tap favori, le scroll en parallaxe |
| **Linear** | La sobriété des micro-interactions, jamais de gadget gratuit |

**5 principes fondateurs**
1. **La carte d'abord** — Abidjan est le décor, pas une fonction cachée.
2. **Tout flotte** — barre de recherche, navigation, boutons : tout lévite au-dessus de la carte.
3. **Gros et rond** — titres très gras, coins 24–32 px, cibles tactiles ≥ 48 px.
4. **Vert = confiance** — le vert #16A34A signifie toujours « audité et certifié ».
5. **Rien de pro** — zéro trace de back-office : l'usager vit dans un monde simple.

---

## 2. Palette de couleurs

| Token | Hex | Usage |
|---|---|---|
| `--bleu-900` | `#16296B` | Fond profond des dégradés, mode sombre accentué |
| `--bleu-800` | `#1E3A8A` | **Bleu roi** — couleur de marque, titres forts, icône active |
| `--bleu-500` | `#2D4DB0` | Transition de dégradé |
| `--vert-600` | `#16A34A` | **Vert confiance** — certifié, succès, CTA principal |
| `--vert-400` | `#22C55E` | Marqueurs de carte, confettis, pulse |
| `--blanc` | `#FFFFFF` | Surfaces, panneaux |
| `--surface` | `#F5F7FB` | Fond page, zones respirantes |
| `--encre` | `#0F172A` | Texte principal |
| `--discret` | `#64748B` | Texte secondaire |
| `--ligne` | `#E2E8F0` | Bordures fines |
| `--or` | `#D4A017` | **Awards uniquement** — rubans, médailles, page festive |
| `--danger` | `#DC2626` | Erreurs, annulations |

**Dégradé signature** (fonds d'écrans clés, bouton héros) :
`linear-gradient(135deg, #1E3A8A → #2D4DB0 → #16A34A)` — animé très lentement (20 s, `background-position` qui dérive de ±15 %), jamais criard.

**Mode sombre** (option profil) : fond `#0B1220`, surface `#131C33`, encre `#F1F5F9`, le bleu roi devient `#4C6FE0` (lisibilité), le vert reste `#22C55E`.

## 3. Typographie

| Rôle | Police | Taille mobile | Graisse | Usage |
|---|---|---|---|---|
| Display | Poppins | 36–40 px | 800 | Écran d'accueil, chiffres clés |
| Titre | Poppins | 24–28 px | 700 | Nom d'établissement, sections |
| Sous-titre | Poppins | 18 px | 600 | En-têtes de carte |
| Corps | Inter | 15–16 px | 400–500 | Texte, descriptions |
| Petit | Inter | 13 px | 500 | Méta, horaires, quartier |
| Micro | Inter | 11 px | 600, +8 % tracking, MAJ | Étiquettes (« CERTIFIÉ », « PREMIUM ») |

Règle : titres **très grands et très gras**, beaucoup d'air autour (les sections respirent à 24–32 px).

## 4. Matière et formes

- **Rayons** : cartes 24 px, panneaux 28 px, bottom sheet 32 px (haut), boutons et puces `full`.
- **Ombres** — 3 niveaux :
  - `flottant` : `0 8px 24px rgba(15,23,42,.12)` — barres et cartes sur la carte
  - `panneau` : `0 -8px 40px rgba(15,23,42,.14)` — bottom sheet
  - `survol` : `0 16px 48px rgba(30,58,138,.18)` — carte soulevée
- **Verre dépoli** : `background: rgba(255,255,255,.72) + backdrop-filter: blur(20px)` + bord `rgba(255,255,255,.5)` — barre de recherche, navigation du bas, cartes flottantes.
- **Bento** : l'accueil mélange des cartes de tailles variées (grande 2×2, moitiés, bandeau) — jamais une liste uniforme.

## 5. Composants signature

| Composant | Spec |
|---|---|
| **BottomSheet** | Panneau blanc sur la carte, 3 hauteurs : *apercu* (visible ~140 px), *moitié* (55 %), *plein* (92 %). Poignée de glissement, ferme au glisser-bas. |
| **BarreRecherche** | Flottante verre dépoli, loupe, placeholder « Où allez-vous aujourd'hui ? », ondulation au toucher |
| **PuceSecteur** | 3 grosses puces (Hôtels / Restaurants / Santé), icône + label ; active = dégradé bleu→vert, icône blanche |
| **CarteEtablissement** | Photo 4:3 arrondie 24 px, anneau de score en coin, badge certifié, nom + quartier + note avis ; pression = scale 0,97 |
| **AnneauScore** | Anneau SVG qui se remplit + compteur qui défile jusqu'à la note (vert ≥ 80 %) |
| **BadgeCertifie** | Pilule verte « Qualité certifiée » ; un reflet brillant la traverse toutes les 6 s |
| **NavBas** | Barre flottante verre dépoli, 5 icônes ; l'active grossit, passe bleu roi, petit point vert dessous |
| **PileReservations** | Réservations empilées façon Wallet : la première entière, les suivantes en lamelles ; un tap déplie |
| **BoutonMagnetique** | Scale 0,97 + ondulation + vibration légère au toucher ; primaire = dégradé, succès = vert plein |
| **CocheConfirmation** | Cercle vert, coche qui se dessine, confettis bleus/verts, vibration succès |
| **JaugeCritere** | 3 barres (Hygiène / Accueil / Présentation) qui se remplissent en cascade |
| **Squelette** | Blocs gris clair avec balayage lumineux — jamais de roue qui tourne |
| **CoeurFavori** | Double-tap photo → cœur qui explose en étincelles bleues/vertes |
| **CarteAward** | Décor or + bleu roi, ruban, effet cérémonie |

## 6. Effets & animations — spécifications

| Moment | Animation | Durée / easing |
|---|---|---|
| Splash | Logo qui se dessine (trait), puis zoom de la carte depuis le ciel | 1,2 s + 0,9 s `ease-out` |
| Carte | Marqueurs verts qui pulsent (2,4 s), rebond à l'apparition ; caméra qui s'incline 3D à la sélection | spring `0.5 / 0.8` |
| Score | Anneau + compteur jusqu'à la note | 1 s `cubic-bezier(.22,1,.36,1)` |
| Badge | Reflet brillant traversant | 6 s en boucle |
| Fiche | Photo qui grandit de la liste vers la fiche (transition partagée), parallaxe au scroll | 350 ms partagé |
| Réservation | Coche + confettis + vibration | 800 ms |
| Tactile | Bouton magnétique (scale + ripple + haptique) | 150 ms |
| Gestes | Glisser-bas ferme, tirer rafraîchit, double-tap favori | — |

**Règles de performance** (60 fps sur entrée de gamme) :
- Animer uniquement `transform` et `opacity` ; `backdrop-filter` uniquement sur les éléments fixes (jamais sur un calque qui défile).
- `prefers-reduced-motion` → toutes les animations décoratives désactivées, états finaux affichés directement.
- Pas d'animation > 1,2 s hors boucles ambiantes (pulse, dégradé).

## 7. Haptique

| Geste | Retour |
|---|---|
| Tap bouton / puce | vibration légère 10 ms |
| Confirmation réservation | motif succès [20, 50, 20] ms |
| Ajout favori | vibration moyenne 15 ms |
| Erreur / refus | double vibration [30, 30, 30] ms |

## 8. Icônes et carte

- **Icônes** : Lucide, trait 2 px, arrondies — cohérentes partout.
- **Carte** : style clair personnalisé (rues fines gris clair, lagune bleutée), marqueurs **verts pulsatifs** ; vue 3D inclinée à la sélection (Mapbox GL en production, Leaflet/OSM stylisé au MVP).
- **Position usager** : point bleu avec halo, comme Yango.

## 9. Tokens CSS (base du thème)

```css
:root {
  --bleu-900:#16296B; --bleu-800:#1E3A8A; --bleu-500:#2D4DB0;
  --vert-600:#16A34A; --vert-400:#22C55E;
  --blanc:#FFFFFF; --surface:#F5F7FB; --encre:#0F172A;
  --discret:#64748B; --ligne:#E2E8F0; --or:#D4A017; --danger:#DC2626;

  --degrade-marque: linear-gradient(135deg,#1E3A8A,#2D4DB0 45%,#16A34A);
  --r-carte:24px; --r-panneau:28px; --r-sheet:32px;
  --ombre-flottant:0 8px 24px rgba(15,23,42,.12);
  --ombre-panneau:0 -8px 40px rgba(15,23,42,.14);
  --ombre-survol:0 16px 48px rgba(30,58,138,.18);
  --verre:rgba(255,255,255,.72);
  --verre-bord:rgba(255,255,255,.5);
}
```

## 10. Accessibilité

- Contraste AA minimum (texte bleu roi / encre sur blanc validé).
- Cibles tactiles ≥ 48 px, partout.
- Chaque animation a un état final statique (`prefers-reduced-motion`).
- Le score est aussi affiché en chiffres, jamais en couleur seule.

## 11. À valider

1. Palette : ajout d'un **bleu profond #16296B** (dégradés/sombre) et d'un **or #D4A017** réservé aux Awards — ok ?
2. Le verre dépoli partout suppose des téléphones récents : fallback opaque prévu sur entrée de gamme.
3. Carte : MVP en Leaflet/OSM stylisé (déjà en place), passage à Mapbox GL 3D en production — d'accord ?
4. Le nom définitif (actuellement **Quqliter**) pour les maquettes du livrable 2.

J'attends ta validation avant le livrable 2 (maquettes : lancement, connexion, accueil avec carte, fiche établissement).
