import {
  budgetDuMois,
  itemCompte,
  ligneBudgetId,
  montantSigne,
  pocketCalc,
  tauxVacances,
} from "./calculs.js";
import { num, param, paramOuDefaut } from "./format.js";
import { MOIS, anneeMoisDe, moisNow } from "./mois.js";

export // Budget mensuel — reproduit BUDGET_TABLEAU.xlsx.
// Écart = Budget − Réalisé. Total des sorties (SOLDE Excel) = courantes + épargne.
// Reste disponible = salaire − total des sorties. Provision vacances = pocketCalc.
// ============================================================
// Export Excel identique à BUDGET_TABLEAU.xlsx
// Même feuille, mêmes lignes, mêmes formules, mêmes couleurs.
// ExcelJS est chargé à la demande (seulement au moment de l'export).
// ============================================================
const XL_MOIS = ["Janv", "Févr", "Mars", "Avr", "Mai", "Juin", "Juil", "Août", "Sept", "Oct", "Nov", "Déc"];

// Données de l'export, calculées comme l'app (et donc comme l'Excel).

export // Données de l'export, calculées comme l'app (et donc comme l'Excel).
function donneesExport(budget, bmRows, tx, items, params, jusqua) {
  const mtItem = (x) => (x.montant_reel != null && x.paid ? num(x.montant_reel) : num(x.montant_prevu)),
    catDe = (w) => {
      const m = (budget || []).find((b) => b.id === ligneBudgetId(w)),
        c = m ? m.categorie : null;
      return c != null ? c : w.kind === "charge" ? "courantes" : w.kind === "epargne" ? "epargne" : null;
    },
    estVacances = (w) => /vacances/i.test(w.poste || "") || /vacances/i.test(w.line_key || ""),
    vac0 = pocketCalc(items, "vacances", tauxVacances(params), 1),
    mois = [];
  for (let m = 1; m <= jusqua; m++) {
    const lignes = budgetDuMois(bmRows, budget, m),
      txi = (tx || []).filter((x) => num(x.mois_index) === m),
      reel = (ids) =>
        txi.filter((x) => ids.includes(x.budget_line_id)).reduce((s, x) => s + montantSigne(x), 0),
      courantes = {},
      ep = lignes.filter((w) => catDe(w) === "epargne" || w.kind === "epargne"),
      epHors = ep.filter((w) => !estVacances(w)),
      epVac = ep.filter(estVacances),
      rev = lignes.filter((w) => w.kind === "revenu"),
      idsRev = rev.map(ligneBudgetId),
      { annee, mois: m0 } = anneeMoisDe(m),
      env = (items || []).filter(
        (x) => (x.pocket === "formation" || x.pocket === "sport") && num(x.mois_index) === m,
      );
    lignes
      .filter((w) => catDe(w) === "courantes" && w.line_key !== "c_sport")
      .forEach((w) => {
        const k = w.poste || "?",
          c =
            courantes[k] ||
            (courantes[k] = {
              b: 0,
              r: 0,
            });
        (c.b += num(w.montant)), (c.r += reel([ligneBudgetId(w)]));
      });
    mois.push({
      label: XL_MOIS[m0],
      annee,
      courantes,
      epB: epHors.reduce((s, w) => s + num(w.montant), 0),
      epR: reel(epHors.map(ligneBudgetId)),
      vacB: epVac.reduce((s, w) => s + num(w.montant), 0),
      vacR: reel(epVac.map(ligneBudgetId)),
      salB: rev.reduce((s, w) => s + num(w.montant), 0),
      salR: txi.some((x) => idsRev.includes(x.budget_line_id)) ? reel(idsRev) : null,
      vacPayes: (items || [])
        .filter((x) => x.pocket === "vacances" && itemCompte(x) && x.paid && num(x.mois_index) === m)
        .reduce((s, x) => s + mtItem(x), 0),
      envB: env.filter(itemCompte).reduce((s, x) => s + mtItem(x), 0),
      envR: env.filter((x) => itemCompte(x) && x.paid).reduce((s, x) => s + mtItem(x), 0),
    });
  }
  return {
    mois,
    depart: {
      livrets: param(params, "reel_0", 0),
      enveloppe: param(params, "enveloppe_formation", 0),
      dejaPaye: (items || [])
        .filter(
          (x) =>
            (x.pocket === "formation" || x.pocket === "sport") &&
            num(x.mois_index) === 0 &&
            x.paid &&
            itemCompte(x),
        )
        .reduce((s, x) => s + mtItem(x), 0),
      provision: vac0.solde[0],
    },
  };
}

// Construit le classeur (fonction pure : testable hors de l'app).

export // Construit le classeur (fonction pure : testable hors de l'app).
function construireClasseur(ExcelJS, d) {
  const wb = new ExcelJS.Workbook(),
    premier = d.mois[0],
    dernier = d.mois[d.mois.length - 1],
    titre =
      premier.annee === dernier.annee
        ? premier.label + "-" + dernier.label + " " + dernier.annee
        : premier.label + " " + premier.annee + "-" + dernier.label + " " + dernier.annee,
    ws = wb.addWorksheet(titre.slice(0, 31)),
    EUR = "0.00\\€",
    col = (i) => {
      let s = "",
        n = i;
      while (n > 0) {
        const r = (n - 1) % 26;
        (s = String.fromCharCode(65 + r) + s), (n = Math.floor((n - 1) / 26));
      }
      return s;
    },
    fill = (argb) => ({
      type: "pattern",
      pattern: "solid",
      fgColor: {
        argb,
      },
    }),
    BLEU_TETE = "FF0070C0",
    BLEU_BLOC = "FF4472C4",
    VERT = "FFE2EFDA",
    ROSE = "FFFFE6E6",
    put = (ref, v, o) => {
      const c = ws.getCell(ref),
        opt = o || {};
      c.value =
        typeof v === "string" && v.startsWith("=")
          ? {
              formula: v.slice(1),
            }
          : v;
      c.font = {
        name: "Calibri",
        size: 11,
        bold: !!opt.bold,
        color: opt.color
          ? {
              argb: opt.color,
            }
          : void 0,
      };
      if (opt.fill) c.fill = fill(opt.fill);
      if (opt.num !== !1 && (typeof v === "number" || (typeof v === "string" && v.startsWith("="))))
        c.numFmt = EUR;
      return c;
    },
    bloc = (r, txt) => {
      put("A" + r, txt, {
        bold: !0,
        color: "FFFFFFFF",
        fill: BLEU_BLOC,
      });
    },
    cols = d.mois.map((m, i) => ({
      B: col(2 + i * 3),
      R: col(3 + i * 3),
      E: col(4 + i * 3),
      m,
    }));
  ws.getColumn(1).width = 46;
  cols.forEach((c) => {
    (ws.getColumn(c.B).width = 14), (ws.getColumn(c.R).width = 14), (ws.getColumn(c.E).width = 13);
  });

  // En-tête
  put("A1", "Poste", {
    bold: !0,
    color: "FFFFFFFF",
    fill: BLEU_TETE,
  });
  cols.forEach((c) => {
    put(c.B + "1", "Budget " + c.m.label, {
      bold: !0,
      color: "FFFFFFFF",
      fill: BLEU_TETE,
    });
    put(c.R + "1", "Réalisé " + c.m.label, {
      bold: !0,
      color: "FFFFFFFF",
      fill: BLEU_TETE,
    });
    put(c.E + "1", "Écart " + c.m.label, {
      bold: !0,
      color: "FFFFFFFF",
      fill: BLEU_TETE,
    });
  });

  // Dépenses courantes (tous les postes rencontrés sur la période, par ordre alphabétique)
  put("A2", "DÉPENSES COURANTES", {
    bold: !0,
  });
  const postes = [...new Set(d.mois.flatMap((m) => Object.keys(m.courantes)))].sort((a, b) =>
    a.localeCompare(b, "fr"),
  );
  let r = 3;
  postes.forEach((p) => {
    put("A" + r, p);
    cols.forEach((c) => {
      const v = c.m.courantes[p] || {
        b: 0,
        r: 0,
      };
      put(c.B + r, Math.round(v.b * 100) / 100);
      put(c.R + r, Math.round(v.r * 100) / 100);
      put(c.E + r, "=" + c.B + r + "-" + c.R + r);
    });
    r++;
  });
  const rTot = r,
    debut = 3,
    fin = r - 1;
  put("A" + rTot, "Total courantes", {
    bold: !0,
    fill: VERT,
  });
  cols.forEach((c) =>
    [c.B, c.R, c.E].forEach((k) =>
      put(k + rTot, "=SUM(" + k + debut + ":" + k + fin + ")", {
        bold: !0,
        fill: VERT,
      }),
    ),
  );

  // Épargne programmée
  const rEpT = rTot + 2,
    rEp = rEpT + 1,
    rVac = rEpT + 2;
  put("A" + rEpT, "ÉPARGNE PROGRAMMÉE", {
    bold: !0,
  });
  put("A" + rEp, "Épargne");
  put("A" + rVac, "Vacances");
  cols.forEach((c) => {
    put(c.B + rEp, c.m.epB), put(c.R + rEp, c.m.epR);
    put(c.B + rVac, c.m.vacB), put(c.R + rVac, c.m.vacR);
  });

  // Solde et salaire
  const rSolde = rVac + 3,
    rSal = rSolde + 1;
  put("A" + rSolde, "SOLDE", {
    bold: !0,
    fill: ROSE,
  });
  cols.forEach((c) =>
    [c.B, c.R].forEach((k) =>
      put(k + rSolde, "=SUM(" + k + rTot + "," + k + rEp + "," + k + rVac + ")", {
        bold: !0,
        fill: ROSE,
      }),
    ),
  );
  put("A" + rSal, "SALAIRE MENSUEL (net)", {
    bold: !0,
  });
  cols.forEach((c) => {
    put(c.B + rSal, c.m.salB, {
      bold: !0,
    });
    if (c.m.salR != null)
      put(c.R + rSal, Math.round(c.m.salR * 100) / 100, {
        bold: !0,
      });
    put(c.E + rSal, "=IF(" + c.R + rSal + '="","",' + c.R + rSal + "-" + c.R + rSolde + ")", {
      bold: !0,
    });
  });

  // Lignes du point de départ (calculées plus bas, référencées en absolu)
  const rVacT = rSal + 2,
    rVacDep = rVacT + 1,
    rVacFin = rVacT + 2,
    rEnvT = rVacFin + 2,
    rEnvPay = rEnvT + 1,
    rEnvFin = rEnvT + 2,
    rEpgT = rEnvFin + 2,
    rEpgFin = rEpgT + 1,
    rDep = rEpgFin + 1,
    rLiv = rDep + 1,
    rEnv = rDep + 2,
    rDeja = rDep + 3,
    rProv = rDep + 4,
    rEpDep = rDep + 5,
    abs = (row) => "$B$" + row;

  // Provision vacances
  bloc(rVacT, "PROVISION VACANCES");
  put("A" + rVacDep, "Dépenses vacances payées");
  put("A" + rVacFin, "Provision Vacances (fin de mois)", {
    bold: !0,
  });
  cols.forEach((c, i) => {
    if (c.m.vacPayes) put(c.R + rVacDep, Math.round(c.m.vacPayes * 100) / 100);
    const prec = i === 0 ? abs(rProv) : cols[i - 1].R + rVacFin;
    put(c.B + rVacFin, "=" + prec + "+" + c.B + rVac, {
      bold: !0,
    });
    put(
      c.R + rVacFin,
      "=" + prec + "+" + c.R + rVac + "-" + c.R + rVacDep + "+MIN(0,N(" + c.E + rSal + "))",
      {
        bold: !0,
      },
    );
  });

  // Enveloppe formation + sport
  bloc(rEnvT, "ENVELOPPE FORMATION + SPORT");
  put("A" + rEnvPay, "Paiements du mois");
  put("A" + rEnvFin, "Reste dans l'enveloppe (fin de mois)", {
    bold: !0,
  });
  cols.forEach((c, i) => {
    put(c.B + rEnvPay, c.m.envB), put(c.R + rEnvPay, c.m.envR);
    const prec = i === 0 ? abs(rEnv) + "-" + abs(rDeja) : cols[i - 1].R + rEnvFin;
    put(c.B + rEnvFin, "=" + prec + "-" + c.B + rEnvPay, {
      bold: !0,
    });
    put(c.R + rEnvFin, "=" + prec + "-" + c.R + rEnvPay, {
      bold: !0,
    });
  });

  // Épargne
  bloc(rEpgT, "ÉPARGNE");
  put("A" + rEpgFin, "Épargne (fin de mois)", {
    bold: !0,
    fill: VERT,
  });
  cols.forEach((c, i) => {
    const prec = i === 0 ? abs(rEpDep) : cols[i - 1].R + rEpgFin;
    put(c.B + rEpgFin, "=" + prec + "+" + c.B + rEp, {
      bold: !0,
      fill: VERT,
    });
    put(c.R + rEpgFin, "=" + prec + "+" + c.R + rEp, {
      bold: !0,
      fill: VERT,
    });
  });

  // Point de départ
  bloc(rDep, "POINT DE DÉPART — 31/08/2026");
  put("A" + rLiv, "Livrets au 31/08 (Livret A + LDD)"), put("B" + rLiv, d.depart.livrets);
  put("A" + rEnv, "Enveloppe formation + sport (montant total)"), put("B" + rEnv, d.depart.enveloppe);
  put("A" + rDeja, "Déjà payé sur l'enveloppe en août"), put("B" + rDeja, d.depart.dejaPaye);
  put("A" + rProv, "Provision vacances fin août"), put("B" + rProv, d.depart.provision);
  put("A" + rEpDep, "Épargne de départ", {
    bold: !0,
    fill: VERT,
  });
  put("B" + rEpDep, "=B" + rLiv + "-(B" + rEnv + "-B" + rDeja + ")-B" + rProv, {
    bold: !0,
    fill: VERT,
  });
  ws.views = [
    {
      state: "frozen",
      xSplit: 1,
      ySplit: 1,
    },
  ];
  return wb;
}

export let XL_LIB = null;

export function chargerExcelJS() {
  if (window.ExcelJS) return Promise.resolve(window.ExcelJS);
  if (XL_LIB) return XL_LIB;
  const sources = [
    "https://cdnjs.cloudflare.com/ajax/libs/exceljs/4.4.0/exceljs.min.js",
    "https://cdn.jsdelivr.net/npm/exceljs@4.4.0/dist/exceljs.min.js",
  ];
  XL_LIB = new Promise((ok, ko) => {
    const essai = (i) => {
      if (i >= sources.length) {
        (XL_LIB = null), ko(new Error("bibliothèque Excel introuvable (connexion ?)"));
        return;
      }
      const s = document.createElement("script");
      (s.src = sources[i]), (s.async = !0), (s.crossOrigin = "anonymous");
      s.onload = () => (window.ExcelJS ? ok(window.ExcelJS) : essai(i + 1));
      s.onerror = () => {
        s.remove(), essai(i + 1);
      };
      document.head.appendChild(s);
    };
    essai(0);
  });
  return XL_LIB;
}

export async function exporterBudgetExcel(budget, bmRows, tx, items, params) {
  const ExcelJS = await chargerExcelJS(),
    jusqua = Math.min(MOIS.length - 1, moisNow() + 1),
    d = donneesExport(budget, bmRows, tx, items, params, jusqua),
    wb = construireClasseur(ExcelJS, d),
    buf = await wb.xlsx.writeBuffer(),
    blob = new Blob([buf], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  (a.href = url),
    (a.download = "BUDGET_TABLEAU.xlsx"),
    document.body.appendChild(a),
    a.click(),
    document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2e3);
}
