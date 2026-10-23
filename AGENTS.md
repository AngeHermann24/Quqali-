# Projet Quqliter — plateforme de promotion de la qualité de service

- Travail étape par étape : ne jamais passer à l'étape suivante sans validation de l'utilisateur. Livrables des étapes dans `docs/`.
- Langue : français. Marché : Côte d'Ivoire (Abidjan). Devise : FCFA.
- Identité visuelle stricte : bleu roi #1E3A8A (`primary`), vert #16A34A (`success`), blanc, gris clair #F5F7FB (`surface`). Polices Poppins (titres) + Inter (texte). Mobile first.

## Application web (`web/`)
- Next.js 16.4 (App Router, Cache Components + Partial Prefetching activés), React 19, Tailwind CSS v4, TypeScript.
- Lire `web/node_modules/next/dist/docs/` avant d'utiliser une API Next.js (versions récentes, comportements différents).
- Accès à `params` / `searchParams` : à placer dans un composant enveloppé de `<Suspense>`.
- Carte : Leaflet + OpenStreetMap (`src/components/map.tsx`, chargé côté client uniquement).
- Données de démonstration : `src/lib/data.ts` (à remplacer par Supabase). Les espaces établissement / accompagnateur et les paiements stockent leur état dans le `localStorage` (`src/lib/stockage.ts`, clés dans `CLES` de `src/lib/espace.ts`).
- Règles métier pures et testées : `src/lib/regles.ts` (indépendance accompagnateur/agent), `src/lib/abonnement.ts` (tarifs, rappels, grâce, suspension ; le paiement ne touche jamais `audit`), `src/lib/facture-pdf.ts` (factures PDF sans dépendance), `src/lib/reservation.ts` (créneaux, capacités, statuts, messages), `src/lib/avis.ts` (compte requis, un avis par visite, modération anti-faux, notes du personnel), `src/lib/awards.ts` (5 catégories, score = 30 % avis clients + 70 % audit, lissage Bayésien, départage) et `src/lib/ia/` (prompt, schéma, e-mail, secours local des rapports IA). Ces fichiers n'utilisent que des imports relatifs (`./x.ts`) pour rester testables avec `node --test`. Les avis et les votes des Awards influencent uniquement le palmarès, jamais la note du label.
- Back-office `/admin/*` (étape 9) : `src/lib/admin.ts` (transitions de dossiers, état `Gestion` suspension/retrait de badge dans `CLES.gestion`, statistiques globales, données démo `DOSSIERS_CANDIDATURES_DEMO`/`TRANSACTIONS_DEMO`), `src/lib/qrcode.ts` (encodeur QR maison → `MatriceQr{taille,modules}`), `src/lib/pdf.ts` + `src/lib/brochure-pdf.ts` (affiche A4 gares, carte avis comptoir). Layout `src/app/admin/layout.tsx` + `AdminNav` ; sections : `/admin` (stats), `candidatures`, `agents`, `etablissements`, `abonnements`, `moderation`, `awards`, `tarifs`, `brochures`. Effets publics de la gestion : `src/components/etat-certification.tsx` (`BadgePublic`, `BandeauGestion`), filtre dans `results-view.tsx`, exclusion dans `use-awards.ts`. Le code de visite des cartes = `codeVisiteDemo(id)` de `avis.ts`.
- Visites 3D : `src/lib/visite3d.ts` liste les hôtes autorisés (Matterport, Kuula, Momento360, Roundme) — jamais d'iframe arbitraire ; `docs/etape-7-prompt-rapport-ia.md` est généré à partir du code, le régénérer si le prompt change.
- Secrets : `ANTHROPIC_API_KEY` et `ANTHROPIC_MODEL` dans `.env.local` (modèle dans `.env.example`). Sans clé, `/api/rapports/generer` renvoie un rapport de démonstration.
- Ne jamais appeler `new Date()` / `Date.now()` pendant le rendu d'un composant pré-rendu : passer par `useHorloge()` (`src/lib/use-config.ts`) ou un gestionnaire d'événement.
- Classes de composants (`.btn`, `.card`, `.input`…) dans `src/app/globals.css` : ne pas leur appliquer de variantes (`sm:`…), et éviter de combiner des utilitaires contradictoires (pas de tailwind-merge).

## Commandes (dans `web/`)
- `npm run dev` : serveur de développement (http://localhost:3000)
- `npm test` : tests unitaires des règles métier (`node --test`, fichiers `src/**/*.test.ts`)
- `npm run lint` : ESLint
- `npx tsc --noEmit` : vérification des types (après `npx next typegen`)
- `npm run build` : build de production (ne pas lancer pendant que `npm run dev` tourne)
