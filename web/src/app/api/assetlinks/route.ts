import { NextResponse } from "next/server";

/**
 * /.well-known/assetlinks.json — liaison TWA (Bubblewrap) ↔ domaine.
 * Valeurs fournies par variables d'environnement après génération des apps :
 *   TWA_PACKAGE_NAME="ci.qualiteplus.app"
 *   TWA_SHA256_FINGERPRINTS="AA:BB:..." (plusieurs séparées par des virgules)
 */
export async function GET() {
  const packageName = process.env.TWA_PACKAGE_NAME;
  const empreintes = (process.env.TWA_SHA256_FINGERPRINTS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

  if (!packageName || empreintes.length === 0) {
    return new NextResponse("Asset links non configurés", { status: 404 });
  }

  const json = empreintes.map((sha256_fingerprint) => ({
    relation: ["delegate_permission/common.handle_all_urls"],
    target: {
      namespace: "android_app",
      package_name: packageName,
      sha256_cert_fingerprints: [sha256_fingerprint],
    },
  }));

  return NextResponse.json(json, { headers: { "Cache-Control": "public, max-age=3600" } });
}
