export const HOTES_3D: Record<string, string> = {
  "my.matterport.com": "Matterport",
  "kuula.co": "Kuula",
  "momento360.com": "Momento360",
  "roundme.com": "Roundme",
};

export const VISITE_DEMO = "https://my.matterport.com/show/?m=Zh14WDtkjdC";

export function analyserLien3D(saisie: string): { url: string; fournisseur: string } | { erreur: string } {
  let url: URL;
  try {
    url = new URL(saisie.trim());
  } catch {
    return { erreur: "Lien invalide : copiez l'adresse complète commençant par https://" };
  }
  if (url.protocol !== "https:") return { erreur: "Le lien doit commencer par https://" };
  const fournisseur = HOTES_3D[url.hostname.replace(/^www\./, "")];
  if (!fournisseur) return { erreur: `Fournisseur non pris en charge. Acceptés : ${Object.values(HOTES_3D).join(", ")}.` };
  if (fournisseur === "Matterport") {
    const m = url.searchParams.get("m");
    if (!m || !/^[A-Za-z0-9]{6,20}$/.test(m)) return { erreur: "Lien Matterport incomplet : il doit contenir ?m=identifiant." };
    return { url: `https://my.matterport.com/show/?m=${m}&play=1&qs=1&brand=0`, fournisseur };
  }
  return { url: url.toString(), fournisseur };
}
