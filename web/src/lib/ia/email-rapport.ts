import { LIBELLES_CRITERES, type RapportIA } from "./rapport.ts";

const e = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const BLEU = "#1E3A8A";
const VERT = "#16A34A";

export function emailRapportHtml(r: RapportIA, o: { etablissement: string; mois: string; nombreAvis: number; moyenne: number | null; noteLabel: number | null; lien: string }) {
  const liste = (titre: string, couleur: string, items: { titre: string; detail: string }[]) =>
    items.length
      ? `<h2 style="font-size:16px;color:${couleur};margin:24px 0 8px">${titre}</h2>${items
          .map((i) => `<p style="margin:0 0 8px;font-size:14px;line-height:1.5"><strong>${e(i.titre)}</strong> — ${e(i.detail)}</p>`)
          .join("")}`
      : "";
  const kpi = (valeur: string, label: string) =>
    `<td style="padding:12px;background:#F5F7FB;border-radius:12px;text-align:center"><div style="font-size:20px;font-weight:700;color:${BLEU}">${valeur}</div><div style="font-size:12px;color:#64748b">${label}</div></td>`;
  return `<!doctype html><html lang="fr"><body style="margin:0;background:#F5F7FB;font-family:Inter,Arial,sans-serif;color:#0f172a">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden">
<tr><td style="background:${BLEU};padding:24px;color:#ffffff">
<div style="font-size:22px;font-weight:700">Quali<span style="color:#7ee2a4">CI</span></div>
<div style="margin-top:8px;font-size:18px;font-weight:600">Votre rapport mensuel — ${e(o.mois)}</div>
<div style="font-size:13px;opacity:.8">${e(o.etablissement)}</div></td></tr>
<tr><td style="padding:24px">
<p style="margin:0 0 16px;font-size:14px;line-height:1.5">Bonjour,<br>${e(r.message_gerant)}</p>
<table role="presentation" width="100%" cellpadding="0" cellspacing="8"><tr>
${kpi(String(o.nombreAvis), "avis ce mois")}${kpi(o.moyenne === null ? "—" : `${o.moyenne.toLocaleString("fr-FR")}/5`, "note moyenne des avis")}${kpi(o.noteLabel === null ? "—" : `${o.noteLabel.toLocaleString("fr-FR")} %`, "note du label (audit)")}
</tr></table>
<h2 style="font-size:16px;color:${BLEU};margin:24px 0 8px">Synthèse</h2>
<p style="margin:0;font-size:14px;line-height:1.5">${e(r.synthese)}</p>
<p style="margin:8px 0 0;font-size:13px;color:#64748b">${e(r.tendance.commentaire)}</p>
${liste("Points forts", VERT, r.points_forts)}
${liste("Points à améliorer", BLEU, r.points_faibles)}
${
  r.recommandations.length
    ? `<h2 style="font-size:16px;color:${BLEU};margin:24px 0 8px">Recommandations du mois</h2><ol style="margin:0;padding-left:20px">${r.recommandations
        .map((x) => `<li style="margin:0 0 8px;font-size:14px;line-height:1.5"><strong>${e(x.action)}</strong><br><span style="color:#64748b;font-size:12px">${LIBELLES_CRITERES[x.critere]} · priorité ${x.priorite} · ${e(x.justification)}</span></li>`)
        .join("")}</ol>`
    : ""
}
<p style="margin:28px 0 0;text-align:center"><a href="${e(o.lien)}" style="display:inline-block;background:${VERT};color:#ffffff;text-decoration:none;font-weight:600;padding:12px 20px;border-radius:12px">Voir le rapport complet</a></p>
</td></tr>
<tr><td style="padding:16px 24px;border-top:1px solid #e2e8f0;font-size:11px;color:#64748b;line-height:1.5">
Rapport généré automatiquement par intelligence artificielle à partir de vos avis clients vérifiés. Il n'a aucun effet sur votre note de gouvernance, qui résulte uniquement de l'audit sur place.
</td></tr></table></td></tr></table></body></html>`;
}
