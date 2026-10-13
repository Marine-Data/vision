// Lecture d'un relevé BoursoBank (PDF) : renvoie le compte, la période et les opérations.
// Fonction pure à partir des éléments de texte de pdf.js : testable dans Node et utilisable dans l'app.
const RE_DATE = /^\d{2}\/\d{2}\/\d{4}$/;
const RE_MONTANT = /^\d{1,3}(?:\.\d{3})*,\d{2}$/;
const montant = (s) => Number(s.replace(/\./g, "").replace(",", "."));
const iso = (d) => d.slice(6, 10) + "-" + d.slice(3, 5) + "-" + d.slice(0, 2);

export function lireReleve(pages) {
  // pages : [{ items: [{ str, x, y, w }] }]  (y croissant vers le bas)
  let compte = "courant",
    periode = null,
    soldeDebut = null,
    soldeFin = null;
  const ops = [];
  let cur = null;
  for (const page of pages) {
    const lignes = [];
    for (const it of page.items) {
      if (!it.str.trim()) continue;
      let l = lignes.find((x) => Math.abs(x.y - it.y) < 2.5);
      if (!l) lignes.push((l = { y: it.y, items: [] }));
      l.items.push(it);
    }
    lignes.sort((a, b) => a.y - b.y);
    lignes.forEach((l) => l.items.sort((a, b) => a.x - b.x));
    const texte = (l) =>
      l.items
        .map((i) => i.str)
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
    // colonnes Débit / Crédit d'après l'en-tête
    let xDebit = null,
      xCredit = null,
      dansMouvements = false;
    for (const l of lignes) {
      const t = texte(l);
      if (/Compte d'épargne\s*:\s*Livret A/i.test(t)) compte = "livretA";
      else if (/Compte d'épargne\s*:\s*Livret D/i.test(t)) compte = "ldd";
      const p = t.match(/du (\d{2}\/\d{2}\/\d{4}) au (\d{2}\/\d{2}\/\d{4})/);
      if (p && !periode) periode = { debut: iso(p[1]), fin: iso(p[2]) };
      const deb = l.items.find((i) => /^Débit$/.test(i.str.trim())),
        cre = l.items.find((i) => /^Crédit$/.test(i.str.trim()));
      if (deb && cre) {
        xDebit = deb.x + deb.w;
        xCredit = cre.x + cre.w;
        dansMouvements = true;
        continue;
      }
      if (!dansMouvements) continue;
      if (/^A réception d'un extrait/i.test(t) || /^Boursorama - SA/i.test(t)) {
        dansMouvements = false;
        cur = null;
        continue;
      }
      if (/^opération$/i.test(t)) continue;
      const sa = t.match(/SOLDE AU : (\d{2}\/\d{2}\/\d{4}) ([\d.]+,\d{2})/);
      if (sa) {
        if (soldeDebut == null) soldeDebut = montant(sa[2]);
        continue;
      }
      const ns = t.match(/Nouveau solde en EUR : ([\d.]+,\d{2})/);
      if (ns) {
        soldeFin = montant(ns[1]);
        cur = null;
        continue;
      }
      const premier = l.items[0];
      if (RE_DATE.test(premier.str.trim()) && premier.x < 80) {
        const nums = l.items.filter((i) => RE_MONTANT.test(i.str.trim()));
        const am = nums[nums.length - 1];
        if (!am) continue;
        const droite = am.x + am.w;
        const sens = Math.abs(droite - xCredit) < Math.abs(droite - xDebit) ? "credit" : "debit";
        const libelle = l.items
          .filter((i) => i !== premier && !RE_DATE.test(i.str.trim()) && !RE_MONTANT.test(i.str.trim()))
          .map((i) => i.str)
          .join(" ")
          .replace(/\s+/g, " ")
          .trim();
        cur = { date: iso(premier.str.trim()), libelle, detail: [], montant: montant(am.str.trim()), sens };
        ops.push(cur);
      } else if (cur && premier.x > 60 && !/^Date$|^Libellé/.test(t)) {
        cur.detail.push(t);
      }
    }
  }
  ops.forEach((o) => {
    o.compte = compte;
    const m = o.libelle.match(/^(?:CARTE|AVOIR) (\d{2})\/(\d{2})\/(\d{2}) /);
    o.dateAchat = m ? "20" + m[3] + "-" + m[2] + "-" + m[1] : o.date;
  });
  const debit = ops.filter((o) => o.sens === "debit").reduce((s, o) => s + o.montant, 0),
    credit = ops.filter((o) => o.sens === "credit").reduce((s, o) => s + o.montant, 0);
  const controle =
    soldeDebut != null && soldeFin != null
      ? Math.round((soldeDebut - debit + credit - soldeFin) * 100) / 100
      : null;
  return { compte, periode, soldeDebut, soldeFin, controle, ops };
}
