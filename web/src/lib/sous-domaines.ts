/** Classification de l'hôte : vitrine (domaine nu) vs espaces app (sous-domaines / dev). */

export type EspaceHote = "vitrine" | "app" | "pro" | "admin";

/** Hôtes toujours considérés comme « app » (dev local, previews Vercel, healthchecks). */
const HOTES_APP = [/^localhost(:\d+)?$/, /^127\.0\.0\.1(:\d+)?$/, /\.vercel\.app$/, /\.local$/, /^\[::1\]/];

export function espaceDe(hote: string | null): EspaceHote {
  if (!hote) return "app";
  const h = hote.split(":")[0].toLowerCase();
  if (HOTES_APP.some((r) => r.test(h))) return "app";
  if (h.startsWith("pro.")) return "pro";
  if (h.startsWith("admin.")) return "admin";
  if (h.startsWith("app.")) return "app";
  // Domaine nu de production → vitrine (app accessible uniquement via app.*).
  return "vitrine";
}
