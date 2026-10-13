import { eurosCourt, num } from "../lib/format.js";
import { MOIS } from "../lib/mois.js";

export function Formations({ items: gi = [] }) {
  // Tout vient de vision_items (formation + sport) : annuler / payer / modifier un poste met à jour cet onglet.
  const gList = (gi || [])
      .filter((x) => (x.pocket === "formation" || x.pocket === "sport") && num(x.montant_prevu) > 0)
      .sort((a, b) => num(a.mois_index) - num(b.mois_index) || (a.sort || 0) - (b.sort || 0)),
    gOpt = (x) => /optionnel/i.test(x.label || ""),
    gSum = (arr, f) => arr.reduce((s, x) => s + f(x), 0),
    gBase = gList.filter((x) => !gOpt(x)),
    gOptL = gList.filter(gOpt),
    gPaid = (x) => (x.paid ? num(x.montant_reel ?? x.montant_prevu) : 0),
    gTot = gSum(gBase, (x) => num(x.montant_prevu)),
    gOptT = gSum(gOptL, (x) => num(x.montant_prevu)),
    gPay = gSum(gList, gPaid),
    gForm = gSum(
      gBase.filter((x) => x.pocket === "formation"),
      (x) => num(x.montant_prevu),
    ),
    gSport = gSum(
      gBase.filter((x) => x.pocket === "sport"),
      (x) => num(x.montant_prevu),
    ),
    gRecap = [
      {
        poste: "Formation (SCAP + DU)",
        montant: eurosCourt(gForm),
      },
      {
        poste: "Sport — En Avant! de Paris",
        montant: eurosCourt(gSport),
      },
      {
        poste: "Total engagé — autofinancement",
        montant: eurosCourt(gTot),
        total: !0,
      },
      {
        poste: "Déjà payé",
        montant: eurosCourt(gPay),
      },
      {
        poste: "Reste à payer",
        montant: eurosCourt(Math.max(0, gTot - gSum(gBase, gPaid))),
        total: !0,
      },
      ...(gOptL.length
        ? [
            {
              poste: "Option — " + gOptL.map((x) => x.label).join(", "),
              montant: "+ " + eurosCourt(gOptT),
            },
            {
              poste: "Total avec option",
              montant: eurosCourt(gTot + gOptT),
              total: !0,
            },
          ]
        : []),
    ];
  return (
    <section className="sec">
      <h2>{"Budget & échéancier"}</h2>
      <p className="sub">Coût de la reconversion en autofinancement intégral.</p>
      <div
        className="card"
        style={{
          padding: 0,
          overflowX: "auto",
        }}
      >
        <table className="tbl">
          <thead>
            <tr>
              <th>Échéance</th>
              <th>Poste</th>
              <th className="num">Montant</th>
            </tr>
          </thead>
          <tbody>
            {gList.map((t, e) => (
              <tr key={t.id || e}>
                <td>{MOIS[num(t.mois_index)]}</td>
                <td>{(t.paid ? "✓ " : "") + t.label}</td>
                <td className="num">{eurosCourt(num(t.montant_prevu))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="h3">Récapitulatif</div>
      <div
        className="card"
        style={{
          padding: 0,
        }}
      >
        <table className="tbl">
          <tbody>
            {gRecap.map((t, e) => (
              <tr className={t.total ? "total" : ""} key={e}>
                <td>{t.poste}</td>
                <td className="num">{t.montant}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="note">
        Autofinancement intégral : ni CPF ni employeur. Impact sur l'épargne dans l'onglet Trésorerie.
      </div>
    </section>
  );
}
