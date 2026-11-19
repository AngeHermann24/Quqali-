# Étape — Vitrine + préparation PWA/TWA (stores)

## Architecture déployée

| Hôte | Rôle |
|---|---|
| `qualiteplus.ci` (domaine nu) | Vitrine marketing — aucune route app accessible (redirect `/`) |
| `app.qualiteplus.ci` | App usager (PWA installable, futur TWA Play Store) |
| `pro.qualiteplus.ci` | App pro (réécriture `/` → `/pro`) |
| `admin.qualiteplus.ci` | Back-office interne |

Dev local : `localhost:3000` = app usager, `vitrine.localhost:3000` = aperçu vitrine.

## Fichiers clés

- `src/lib/sous-domaines.ts` — classification hôte → espace
- `src/proxy.ts` — routage sous-domaines + session Supabase + exemptions PWA
- `src/app/layout.tsx` — rendu sans chrome app sur la vitrine
- `src/components/vitrine/vitrine.tsx` — page vitrine (charte Qualité+, hero photo Abidjan)
- `src/app/manifest.ts` — manifest **par hôte** : usager / pro / vitrine (`display: browser`)
- `src/app/api/assetlinks/route.ts` + rewrite `/.well-known/assetlinks.json` — liaison TWA

## Icônes générées (`web/public/`)

- Usager : `icon.svg`, `icon-pro.svg` non — usager = `icon.svg` + `icon-192/512.png` + `icon-maskable-*.png`
- Pro : `icon-pro.svg` (dégradé nuit + anneau or + « PRO ») + `icon-pro-*.png` + maskables
- Rasterisées via `sharp` depuis les SVG sources.

## Pour publier sur le Play Store (reste à faire)

1. Domaine + DNS : `app.` et `pro.` en CNAME vers Vercel.
2. `web/.env.local` : clés Supabase (toujours bloquant) + après Bubblewrap :
   `TWA_PACKAGE_NAME=ci.qualiteplus.app` et `TWA_SHA256_FINGERPRINTS=AA:BB:...`
3. Bubblewrap (`npm i -g @bubblewrap/cli`) : `bubblewrap init --manifest https://app.qualiteplus.ci/manifest.webmanifest` puis idem pour pro → 2 `.aab`.
4. Google Play Console : 2 fiches (Qualité+ / Qualité+ Pro), icônes `icon-512.png` respectives, captures d'écran.
5. Assetlinks : vérifier `https://app.qualiteplus.ci/.well-known/assetlinks.json` renvoie le JSON une fois les variables renseignées.

## Vérifications effectuées

- `tsc --noEmit` ✓, `eslint` ✓
- `app.localhost/manifest.webmanifest` → manifest usager ✓
- `pro.localhost/manifest.webmanifest` → manifest pro ✓
- `/.well-known/assetlinks.json` → 404 propre tant que non configuré ✓
