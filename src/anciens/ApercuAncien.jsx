import React from "react";
import { IMG_BANNIERE } from "../assets/images.js";
import { VISION_CONFIG } from "../config.js";
import {
  calcsDesPoches,
  formationCalc,
  getCible,
  planEpargne,
  pocketCalc,
  seuilPoche,
} from "../lib/calculs.js";
import { chronoTriee, contenuDe, prochainesEcheances } from "../lib/contenu.js";
import { hwkToggleDone } from "../lib/devoirs.js";
import { eurosCourt, hwkFmt, hwkLate, paramOuDefaut, releveDuMois, relevesLivrets } from "../lib/format.js";
import { MOIS, libelleDelai, moisNow } from "../lib/mois.js";

export function ApercuAncien({
  progress: t = {},
  budget: e,
  params: r,
  items: im,
  hw: hwList = [],
  setHw: setHwList,
  readOnly: hwRO,
  contenu: ctRows,
  edit: ctEdit,
  save: ctSave,
  add: ctAdd,
  del: ctDel,
  poches: pochesRows,
}) {
  const [modeChrono, setModeChrono] = React.useState(!1);
  const n = prochainesEcheances(3, ctRows),
    s = n[0],
    suiviRows = contenuDe(ctRows, "suivi"),
    i = suiviRows.filter((d) => t[d.item_key]).length,
    o = contenuDe(ctRows, "piece"),
    a = o.filter((d) => t[d.item_key]).length,
    u = getCible(r, e),
    Mm = moisNow(),
    MvacArr = pocketCalc(im, "vacances", paramOuDefaut(r, "provision_vacances_mensuelle"), MOIS.length),
    MformArr = formationCalc(im, r, MOIS.length),
    MsportArr = pocketCalc(im, "sport", 0, MOIS.length, !0),
    MpocheCalcs = calcsDesPoches(pochesRows, im, r, MOIS.length),
    MepgArr = pocketCalc(im, "epargne", 0, MOIS.length),
    MrawReel = relevesLivrets(r, MOIS.length),
    MplanArr = planEpargne(im, r),
    l = MplanArr[Mm],
    c = u ? Math.min(100, Math.round((l / u) * 100)) : 0,
    MpocheM = MvacArr.solde[Mm],
    Mdernier = (() => {
      for (let w = MOIS.length - 1; w >= 0; w--) {
        const q = releveDuMois(r, w);
        if (q !== "" && q != null) return w;
      }
      return -1;
    })(),
    Mflag = MpocheM < seuilPoche(r);
  return (
    <section className="sec">
      {Mflag && (
        <div className="bwarn" role="alert">
          {MpocheM < seuilPoche(r) && (
            <span>
              ⚠ Poche vacances basse ({eurosCourt(MpocheM)}
              {"). "}
            </span>
          )}
          Va dans Budget mois.
        </div>
      )}
      <div
        className="card"
        style={{
          padding: 0,
          border: 0,
          overflow: "hidden",
          height: 148,
          backgroundImage: `linear-gradient(180deg, rgba(14,58,66,.05), rgba(14,58,66,.30)), url(${IMG_BANNIERE})`,
          backgroundSize: "cover",
          backgroundPosition: "center 62%",
        }}
      />
      {s && (
        <>
          <div className="h3">À faire ensuite</div>
          <div className="card">
            <div
              style={{
                display: "flex",
                alignItems: "baseline",
                justifyContent: "space-between",
                gap: 10,
              }}
            >
              <b>{s.titre}</b>
              <span
                style={{
                  color: "var(--oxblood)",
                  fontWeight: 700,
                  whiteSpace: "nowrap",
                }}
              >
                {libelleDelai(s.j)}
              </span>
            </div>
            {s.detail && (
              <div
                className="detail"
                style={{
                  marginTop: 3,
                }}
              >
                {s.detail}
              </div>
            )}
          </div>
          {n.slice(1).map((d, p) => (
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                padding: "5px 4px",
                fontSize: 13.5,
              }}
              key={p}
            >
              <span>{d.titre}</span>
              <span
                style={{
                  color: "var(--slate)",
                  whiteSpace: "nowrap",
                }}
              >
                {libelleDelai(d.j)}
              </span>
            </div>
          ))}
        </>
      )}
      {(() => {
        // Devoirs : en retard non faits + ceux à rendre dans les 7 jours (faits = barrés, décochables)
        const t0 = new Date();
        t0.setHours(0, 0, 0, 0);
        const t7 = new Date(t0.getTime() + 6048e5),
          isD = (x) => x.status === "Fait" || x.status === "Corrigé",
          list = (hwList || [])
            .filter((x) => {
              if (!x.deadline) return !1;
              const dd = new Date(x.deadline + "T00:00:00");
              return dd < t0 ? !isD(x) : dd <= t7;
            })
            .sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""));
        if (!list.length) return null;
        return (
          <>
            <div className="h3">Devoirs à faire</div>
            <div
              className="card"
              style={{
                padding: "4px 12px",
              }}
            >
              {list.map((x) => (
                <label className={"check" + (isD(x) ? " done" : "")} key={x.id}>
                  <input
                    type="checkbox"
                    checked={isD(x)}
                    disabled={hwRO || !setHwList}
                    onChange={() => hwkToggleDone(setHwList, x)}
                  />
                  <span className="lbl">
                    <b>{x.title}</b>
                    <span
                      className="meta"
                      style={{
                        color: hwkLate(x.deadline, x.status) ? "#b42828" : void 0,
                      }}
                    >
                      {x.subject}
                      {" · "}
                      {hwkFmt(x.deadline)}
                      {hwkLate(x.deadline, x.status) ? " · en retard" : ""}
                    </span>
                  </span>
                </label>
              ))}
            </div>
          </>
        );
      })()}
      <div className="h3">Où j'en suis</div>
      <div className="card">
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 13,
          }}
        >
          <span>Matelas de sécurité</span>
          <b>
            {c}
            {" %"}
          </b>
        </div>
        <div
          className="prog"
          style={{
            margin: "6px 0 14px",
          }}
        >
          <i
            style={{
              width: c + "%",
            }}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: 16,
          }}
        >
          <div
            style={{
              flex: 1,
            }}
          >
            <div className="detail">Étapes de suivi</div>
            <b>
              {i}
              {" / "}
              {suiviRows.length}
            </b>
          </div>
          <div
            style={{
              flex: 1,
            }}
          >
            <div className="detail">Pièces prêtes</div>
            <b>
              {a}
              {" / "}
              {o.length}
            </b>
          </div>
        </div>
      </div>
      <div className="h3">Chronologie de l'année</div>
      {!hwRO && (
        <div
          style={{
            marginBottom: 10,
          }}
        >
          <button className="btn-outline btn-sm" onClick={() => setModeChrono(!modeChrono)}>
            {modeChrono ? "✓ Terminer" : "✎ Modifier les jalons"}
          </button>
        </div>
      )}
      {modeChrono ? (
        <div className="card">
          <div className="editable-hint">
            Champs sur fond gris : clique pour corriger. L'enregistrement est automatique. La date sert au
            compte à rebours de l'Aperçu.
          </div>
          {chronoTriee(ctRows).map((o) => (
            <div
              style={{
                borderBottom: "1px solid var(--line)",
                padding: "8px 0",
              }}
              key={o.id}
            >
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                }}
              >
                <input
                  className="bedit lbl"
                  value={o.titre || ""}
                  placeholder="Jalon"
                  onChange={(w) =>
                    ctEdit(o.id, {
                      titre: w.target.value,
                    })
                  }
                  onBlur={() => ctSave(o.id)}
                />
                <button className="bdel" onClick={() => ctDel(o.id)} aria-label="Supprimer">
                  ×
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  gap: 6,
                  alignItems: "center",
                  marginTop: 4,
                }}
              >
                <input
                  type="date"
                  className="bedit"
                  style={{
                    width: "auto",
                  }}
                  value={o.date_iso || ""}
                  aria-label="Date du jalon"
                  onChange={(w) =>
                    ctEdit(o.id, {
                      date_iso: w.target.value || null,
                    })
                  }
                  onBlur={() => ctSave(o.id)}
                />
                <input
                  className="bedit"
                  value={o.complement || ""}
                  placeholder="Période affichée (ex. 17 août → 7 sept.)"
                  onChange={(w) =>
                    ctEdit(o.id, {
                      complement: w.target.value,
                    })
                  }
                  onBlur={() => ctSave(o.id)}
                />
              </div>
              <input
                className="bedit"
                style={{
                  width: "100%",
                  marginTop: 4,
                }}
                value={o.detail || ""}
                placeholder="Détail"
                onChange={(w) =>
                  ctEdit(o.id, {
                    detail: w.target.value,
                  })
                }
                onBlur={() => ctSave(o.id)}
              />
            </div>
          ))}
          <button className="badd" onClick={() => ctAdd("chrono")}>
            + Ajouter un jalon
          </button>
        </div>
      ) : (
        <div className="card">
          {chronoTriee(ctRows).map((d) => (
            <div className="tl" key={d.item_key || d.id}>
              <div className="when">
                {d.complement ||
                  (d.date_iso
                    ? new Intl.DateTimeFormat(VISION_CONFIG.locale, {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      }).format(new Date(d.date_iso + "T00:00:00"))
                    : "")}
              </div>
              <div className="what">{d.titre}</div>
              <div className="det">{d.detail}</div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
