import React from "react";
import {
  ACC_THEMES,
  HW_ETAPES,
  KB_I,
  KB_INPUT,
  KB_LABEL,
  KB_PALETTE,
  KB_SR,
  KbEtapes,
  KbLane,
  KbPill,
  KbSheet,
  KbToast,
  accEcheance,
  accIcone,
  kbBouton,
  kbChip,
  kbCompteurs,
  kbFlash,
  kbRaccourcis,
  kbToggleBtn,
} from "./communs.jsx";
import { contenuDe } from "../../lib/contenu.js";
import { hwkLate } from "../../lib/format.js";
import { supabase } from "../../lib/supabase.js";

export // ============================================================
// DEVOIRS
// ============================================================
function DevoirsPage({
  rows,
  setRows,
  loading,
  err,
  contenu,
  onEditCt,
  onSaveCt,
  onStatus,
  onMatAdd,
  onMatDel,
  readOnly,
}) {
  const [selId, setSelId] = React.useState(null),
    [ajout, setAjout] = React.useState(!1),
    [nTitre, setNTitre] = React.useState(""),
    [nMat, setNMat] = React.useState(""),
    [nDate, setNDate] = React.useState(""),
    [fEtape, setFEtape] = React.useState(""),
    [fMat, setFMat] = React.useState(""),
    [fDate, setFDate] = React.useState(""),
    [voir, setVoir] = React.useState({}),
    [conf, setConf] = React.useState(!1),
    [enreg, setEnreg] = React.useState(""),
    [matOuvert, setMatOuvert] = React.useState(!1),
    [matNom, setMatNom] = React.useState(""),
    [matSuppr, setMatSuppr] = React.useState(null),
    [matDest, setMatDest] = React.useState(""),
    [matAncien, setMatAncien] = React.useState({}),
    [toast, setToast] = React.useState("");
  const flash = kbFlash(setToast),
    erreur = (e) => flash("Échec : " + (e && e.message ? e.message : "connexion")),
    lignesMat = contenuDe(contenu, "matiere"),
    matieres = [...new Set([...lignesMat.map((x) => x.titre), ...(rows || []).map((x) => x.subject)])].filter(
      Boolean,
    ),
    couleurMat = (m) => KB_PALETTE[Math.max(0, matieres.indexOf(m)) % KB_PALETTE.length],
    abrev = (m) =>
      (m || "?")
        .replace(/[^A-Za-zÀ-ÿ0-9 ]/g, "")
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .padEnd(2, (m || "?").charAt(1).toUpperCase()),
    etDe = (s) => HW_ETAPES.find((x) => x.k === s) || HW_ETAPES[0],
    sel = (rows || []).find((r) => r.id === selId),
    auj = new Date();
  auj.setHours(0, 0, 0, 0);
  const dansSemaine = (d) => {
      if (!d) return !1;
      const x = new Date(d + "T00:00:00");
      return x >= auj && x <= new Date(auj.getTime() + 6048e5);
    },
    filtre = (r) =>
      (!fEtape || r.status === fEtape) &&
      (!fMat || r.subject === fMat) &&
      (!fDate || (fDate === "semaine" ? dansSemaine(r.deadline) : hwkLate(r.deadline, r.status))),
    actif = !!(fEtape || fMat || fDate),
    aRendre = (rows || [])
      .filter((r) => (r.status === "À faire" || r.status === "En cours") && r.deadline)
      .sort((a, b) => a.deadline.localeCompare(b.deadline)),
    prochain = aRendre[0],
    eProchain = prochain ? accEcheance(prochain.deadline) : null;
  async function patch(id, p, msg) {
    setRows((l) =>
      l.map((r) =>
        r.id === id
          ? {
              ...r,
              ...p,
            }
          : r,
      ),
    );
    const { error: E } = await supabase
      .from("vision_homework")
      .update({
        ...p,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
    E ? erreur(E) : (setEnreg("ok"), msg && flash(msg));
  }
  async function changer(r, k) {
    if (r.status === k) {
      setSelId(null);
      return;
    }
    try {
      await onStatus(r.id, k), setSelId(null), flash((r.title || "Devoir") + " → " + etDe(k).l);
    } catch (e) {
      erreur(e);
    }
  }
  async function ajouter() {
    const t = nTitre.trim();
    if (!nMat) {
      flash("Choisis une matière");
      return;
    }
    if (!t) {
      flash("Écris un titre");
      return;
    }
    if (!nDate) {
      flash("Choisis la date de rendu");
      return;
    }
    const { data: u } = await supabase.auth.getUser(),
      uid = u && u.user ? u.user.id : null,
      { data: d, error: E } = await supabase
        .from("vision_homework")
        .insert({
          user_id: uid,
          subject: nMat,
          title: t,
          deadline: nDate,
          status: "À faire",
        })
        .select()
        .single();
    if (E) {
      erreur(E);
      return;
    }
    setRows((l) => [...l, d].sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""))),
      setAjout(!1),
      setNTitre(""),
      setNDate(""),
      flash("Ajouté en " + nMat);
  }
  async function supprimer(r) {
    if (!conf) {
      setConf(!0);
      return;
    }
    setRows((l) => l.filter((x) => x.id !== r.id)), setSelId(null);
    const { error: E } = await supabase.from("vision_homework").delete().eq("id", r.id);
    E ? erreur(E) : flash("Devoir supprimé");
  }
  async function ajouterMatiere() {
    const t = matNom.trim();
    if (!t) return;
    if (matieres.some((m) => m.toLowerCase() === t.toLowerCase())) {
      flash("Cette matière existe déjà");
      return;
    }
    try {
      await onMatAdd(t), setMatNom(""), flash("Matière ajoutée : " + t);
    } catch (e) {
      erreur(e);
    }
  }
  async function renommerMatiere(o) {
    const ancien = o.titre || "",
      brouillon = matAncien[o.id],
      nouveau = (brouillon == null ? ancien : brouillon).trim();
    setMatAncien((m) => {
      const c = {
        ...m,
      };
      delete c[o.id];
      return c;
    });
    if (!nouveau || nouveau === ancien) return;
    if (matieres.some((m) => m !== ancien && m.toLowerCase() === nouveau.toLowerCase())) {
      flash("Cette matière existe déjà");
      return;
    }
    onEditCt(o.id, {
      titre: nouveau,
    }),
      onSaveCt(o.id);
    if ((rows || []).some((r) => r.subject === ancien)) {
      setRows((l) =>
        l.map((r) =>
          r.subject === ancien
            ? {
                ...r,
                subject: nouveau,
              }
            : r,
        ),
      );
      const { error: E } = await supabase
        .from("vision_homework")
        .update({
          subject: nouveau,
        })
        .eq("subject", ancien);
      if (E) {
        erreur(E);
        return;
      }
    }
    flash("Matière renommée");
  }
  async function supprimerMatiere(m) {
    const utilises = (rows || []).filter((r) => r.subject === m).length;
    if (matSuppr !== m) {
      setMatSuppr(m), setMatDest(matieres.find((x) => x !== m) || "");
      return;
    }
    if (utilises && !matDest) {
      flash("Choisis où rattacher les devoirs");
      return;
    }
    try {
      if (utilises) {
        setRows((l) =>
          l.map((r) =>
            r.subject === m
              ? {
                  ...r,
                  subject: matDest,
                }
              : r,
          ),
        );
        const { error: E } = await supabase
          .from("vision_homework")
          .update({
            subject: matDest,
          })
          .eq("subject", m);
        if (E) throw E;
      }
      const ligne = lignesMat.find((x) => x.titre === m);
      ligne && (await onMatDel(ligne.id));
      setMatSuppr(null), fMat === m && setFMat(""), flash("Matière supprimée");
    } catch (e) {
      erreur(e);
    }
  }
  if (loading)
    return (
      <section className="sec">
        <p className="detail">Chargement…</p>
      </section>
    );
  const couloirs = matieres
    .filter((m) => !fMat || m === fMat)
    .map((m) => {
      const col = couleurMat(m),
        toutes = (rows || []).filter((r) => r.subject === m),
        liste = toutes
          .filter(filtre)
          .sort(
            (a, b) =>
              (hwkLate(b.deadline, b.status) ? 1 : 0) - (hwkLate(a.deadline, a.status) ? 1 : 0) ||
              HW_ETAPES.findIndex((x) => x.k === a.status) - HW_ETAPES.findIndex((x) => x.k === b.status) ||
              (a.deadline || "9").localeCompare(b.deadline || "9"),
          ),
        rendus = toutes.filter((r) => r.status === "Fait" || r.status === "Corrigé").length,
        ouvert = !!voir[m] || fEtape === "Corrigé",
        corriges = fEtape ? 0 : liste.filter((r) => r.status === "Corrigé").length,
        visibles = ouvert || fEtape ? liste : liste.filter((r) => r.status !== "Corrigé");
      if (actif && !liste.length && !fMat) return null;
      return (
        <KbLane
          titre={m}
          abrev={abrev(m)}
          c={col.c}
          soft={col.soft}
          ratio={rendus + "/" + toutes.length}
          pct={toutes.length ? Math.round((rendus / toutes.length) * 100) : 0}
          onHeader={() => setFMat(fMat === m ? "" : m)}
          headerAria={
            m +
            " : " +
            rendus +
            " rendus sur " +
            toutes.length +
            (fMat === m ? ". Afficher toutes les matières" : ". Afficher seulement cette matière")
          }
          onAdd={
            readOnly
              ? null
              : () => {
                  setNMat(m), setNTitre(""), setNDate(""), setAjout(!0);
                }
          }
          addAria={"Ajouter un devoir en " + m}
          vide={!toutes.length && !readOnly}
          onVide={() => {
            setNMat(m), setNTitre(""), setNDate(""), setAjout(!0);
          }}
          videLabel="Ajouter un devoir"
          key={m}
        >
          {visibles.map((r) => (
            <KbPill
              titre={r.title || "Devoir"}
              etape={etDe(r.status)}
              couleur={col.c}
              soft={col.soft}
              due={r.deadline}
              fini={r.status === "Fait" || r.status === "Corrigé"}
              onClick={() => {
                readOnly || (setConf(!1), setEnreg(""), setSelId(r.id));
              }}
              key={r.id}
            />
          ))}
          {corriges
            ? kbToggleBtn(
                ouvert ? "Masquer" : "+" + corriges + " corrigé" + (corriges > 1 ? "s" : ""),
                ouvert ? "Masquer les devoirs corrigés" : "Voir " + corriges + " devoir(s) corrigé(s)",
                () =>
                  setVoir(
                    Object.assign({}, voir, {
                      [m]: !ouvert,
                    }),
                  ),
                "#5a4fa8",
              )
            : null}
          {actif && !liste.length ? (
            <span className="detail" key="vide">
              Aucun devoir pour ce filtre
            </span>
          ) : null}
        </KbLane>
      );
    })
    .filter(Boolean);
  return (
    <section className="sec">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          marginBottom: 12,
        }}
      >
        <h2
          style={{
            margin: 0,
          }}
        >
          Devoirs
        </h2>
        {!readOnly && (
          <div
            style={{
              display: "flex",
              gap: 8,
              flex: "none",
            }}
          >
            <button
              type="button"
              onClick={() => {
                setMatSuppr(null), setMatNom(""), setMatOuvert(!0);
              }}
              aria-label="Gérer les matières"
              style={{
                width: 46,
                height: 46,
                border: "2px solid #c9d4f2",
                borderRadius: 14,
                background: "#ffffff",
                color: "#3b5fc4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              {accIcone(KB_I.liste, 20, 2.2)}
            </button>
            {kbBouton(
              "Devoir",
              () => {
                setNMat(fMat || matieres[0] || ""), setNTitre(""), setNDate(""), setAjout(!0);
              },
              {
                icone: KB_I.plus,
                h: 46,
                width: "auto",
                bg: "#3b5fc4",
              },
            )}
          </div>
        )}
      </div>
      {err ? (
        <p
          className="detail"
          style={{
            color: "#b8432a",
          }}
        >
          {"Erreur : " + err}
        </p>
      ) : null}
      {prochain && (
        <button
          type="button"
          onClick={() => {
            readOnly || (setConf(!1), setEnreg(""), setSelId(prochain.id));
          }}
          aria-label={"Prochain rendu : " + prochain.title + ", " + prochain.subject + ", " + eProchain.aria}
          style={{
            width: "100%",
            border: 0,
            borderRadius: 22,
            background: eProchain.late ? "#a63a24" : "#3b5fc4",
            color: "#ffffff",
            padding: 14,
            display: "flex",
            alignItems: "center",
            gap: 12,
            textAlign: "left",
            marginBottom: 12,
            boxShadow: "0 10px 24px rgba(59,95,196,.25)",
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          <span
            style={{
              flex: "none",
              width: 50,
              height: 50,
              borderRadius: 16,
              background: "rgba(255,255,255,.16)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {accIcone(ACC_THEMES.devoirs.i, 22, 2)}
          </span>
          <span
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 800,
                letterSpacing: ".06em",
                textTransform: "uppercase",
              }}
            >
              {prochain.subject}
            </span>
            <span
              style={{
                fontFamily: "Georgia,serif",
                fontSize: 18,
                fontWeight: 700,
                lineHeight: 1.2,
                display: "-webkit-box",
                WebkitLineClamp: 2,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }}
            >
              {prochain.title}
            </span>
          </span>
          <span
            style={{
              flex: "none",
              padding: "6px 10px",
              borderRadius: 12,
              background: "#ffffff",
              color: eProchain.urgent ? "#b8432a" : "#3b5fc4",
              fontSize: 15,
              fontWeight: 900,
            }}
          >
            {eProchain.l}
          </span>
        </button>
      )}
      {kbCompteurs(
        rows,
        HW_ETAPES,
        fEtape,
        setFEtape,
        (k) => (rows || []).filter((r) => r.status === k).length,
      )}
      <div
        role="group"
        aria-label="Filtrer par date"
        style={{
          display: "flex",
          gap: 6,
          marginBottom: 12,
        }}
      >
        {kbChip("Toutes dates", !fDate, () => setFDate(""), {
          fontSize: 13.5,
        })}
        {kbChip(
          "7 prochains jours",
          fDate === "semaine",
          () => setFDate(fDate === "semaine" ? "" : "semaine"),
          {
            fontSize: 13.5,
          },
        )}
        {kbChip("En retard", fDate === "retard", () => setFDate(fDate === "retard" ? "" : "retard"), {
          fontSize: 13.5,
        })}
      </div>
      {actif && (
        <button
          type="button"
          onClick={() => {
            setFEtape(""), setFMat(""), setFDate("");
          }}
          style={{
            minHeight: 44,
            marginBottom: 12,
            padding: "0 14px",
            border: 0,
            borderRadius: 99,
            background: "var(--ink)",
            color: "#ffffff",
            fontSize: 14,
            fontWeight: 800,
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          Effacer les filtres{accIcone(KB_I.croix, 14, 2.8)}
        </button>
      )}
      {!matieres.length ? (
        <div
          style={{
            background: "#ffffff",
            borderRadius: 22,
            padding: 16,
            boxShadow: "var(--shadow)",
            display: "flex",
            flexDirection: "column",
            gap: 10,
          }}
        >
          <p
            style={{
              margin: 0,
              fontWeight: 700,
            }}
          >
            Ajoute d'abord une matière.
          </p>
          {!readOnly &&
            kbBouton("Ajouter une matière", () => setMatOuvert(!0), {
              icone: KB_I.plus,
              bg: "#3b5fc4",
            })}
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          {couloirs}
        </div>
      )}
      {sel && (
        <KbSheet label={sel.title || "Devoir"} onClose={() => setSelId(null)}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
              flexWrap: "wrap",
            }}
          >
            <span
              style={{
                padding: "3px 10px",
                borderRadius: 99,
                background: couleurMat(sel.subject).soft,
                color: couleurMat(sel.subject).c,
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {sel.subject}
            </span>
            {accEcheance(sel.deadline) ? (
              <span
                style={{
                  padding: "3px 10px",
                  borderRadius: 99,
                  background: accEcheance(sel.deadline).urgent ? "#fbe9e4" : "#eef3f4",
                  color: accEcheance(sel.deadline).urgent ? "#b8432a" : "var(--ink-soft)",
                  fontSize: 13,
                  fontWeight: 800,
                }}
              >
                {"À rendre · " + accEcheance(sel.deadline).l}
              </span>
            ) : null}
          </div>
          <KbEtapes etapes={HW_ETAPES} actuelle={sel.status} onPick={(k) => changer(sel, k)} />
          <label htmlFor="kb-hw-date" style={KB_LABEL}>
            À rendre le
          </label>
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 8,
            }}
          >
            {kbRaccourcis().map((w) =>
              kbChip(
                w.l,
                sel.deadline === w.k,
                () =>
                  patch(
                    sel.id,
                    {
                      deadline: w.k,
                    },
                    "Date enregistrée",
                  ),
                {
                  fontSize: 13.5,
                },
              ),
            )}
          </div>
          <input
            id="kb-hw-date"
            type="date"
            value={sel.deadline || ""}
            onChange={(ev) =>
              ev.target.value &&
              patch(
                sel.id,
                {
                  deadline: ev.target.value,
                },
                "Date enregistrée",
              )
            }
            style={{
              ...KB_INPUT,
              marginBottom: 16,
            }}
          />
          <label htmlFor="kb-hw-desc" style={KB_LABEL}>
            Consignes
          </label>
          <textarea
            id="kb-hw-desc"
            key={"d" + sel.id}
            defaultValue={sel.description || ""}
            rows={3}
            placeholder="Ajouter les consignes"
            onFocus={() => setEnreg("")}
            onBlur={(ev) =>
              (ev.target.value || null) !== (sel.description || null) &&
              patch(sel.id, {
                description: ev.target.value || null,
              })
            }
            style={{
              ...KB_INPUT,
              resize: "vertical",
              marginBottom: 14,
            }}
          />
          <label htmlFor="kb-hw-notes" style={KB_LABEL}>
            Notes
          </label>
          <textarea
            id="kb-hw-notes"
            key={"n" + sel.id}
            defaultValue={sel.notes || ""}
            rows={4}
            placeholder="Notes prises pendant / après le cours…"
            onFocus={() => setEnreg("")}
            onBlur={(ev) =>
              (ev.target.value || "") !== (sel.notes || "") &&
              patch(sel.id, {
                notes: ev.target.value,
              })
            }
            style={{
              ...KB_INPUT,
              resize: "vertical",
            }}
          />
          <p
            role="status"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              margin: "6px 0 16px",
              fontSize: 13.5,
              fontWeight: 700,
              color: enreg ? "#0b6e53" : "var(--slate)",
            }}
          >
            {enreg ? accIcone(KB_I.check, 14, 2.8) : null}
            {enreg ? "Enregistré" : "Enregistré automatiquement en quittant le champ"}
          </p>
          {kbBouton(conf ? "Confirmer la suppression" : "Supprimer le devoir", () => supprimer(sel), {
            outline: !0,
            fg: "#b8432a",
            bd: conf ? "#b8432a" : "#f0d5ce",
            h: 48,
          })}
        </KbSheet>
      )}
      {ajout && (
        <KbSheet label="Nouveau devoir" onClose={() => setAjout(!1)} form={!0} onSubmit={ajouter}>
          <span style={KB_LABEL}>Matière</span>
          <div
            role="group"
            aria-label="Matière"
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 6,
              marginBottom: 14,
            }}
          >
            {matieres.map((m) => {
              const on = m === nMat,
                col = couleurMat(m);
              return (
                <button
                  type="button"
                  onClick={() => setNMat(m)}
                  aria-pressed={on ? "true" : "false"}
                  style={{
                    minHeight: 46,
                    borderRadius: 14,
                    border: "2px solid " + (on ? col.c : "#c9d8db"),
                    background: on ? col.soft : "#ffffff",
                    color: "var(--ink)",
                    fontSize: 14,
                    fontWeight: 800,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "0 10px",
                    textAlign: "left",
                    fontFamily: "inherit",
                    cursor: "pointer",
                  }}
                  key={m}
                >
                  <span
                    style={{
                      flex: "none",
                      width: 26,
                      height: 26,
                      borderRadius: 8,
                      background: col.c,
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 900,
                    }}
                  >
                    {abrev(m)}
                  </span>
                  {m}
                </button>
              );
            })}
          </div>
          <label htmlFor="kb-hw-titre" style={KB_LABEL}>
            Titre
          </label>
          <input
            id="kb-hw-titre"
            data-autofocus="1"
            value={nTitre}
            onChange={(ev) => setNTitre(ev.target.value)}
            placeholder="Ex. Exercices chapitre 3"
            autoComplete="off"
            style={{
              ...KB_INPUT,
              marginBottom: 14,
            }}
          />
          <label htmlFor="kb-hw-ndate" style={KB_LABEL}>
            À rendre le
          </label>
          <div
            style={{
              display: "flex",
              gap: 6,
              marginBottom: 8,
            }}
          >
            {kbRaccourcis().map((w) =>
              kbChip(w.l, nDate === w.k, () => setNDate(w.k), {
                fontSize: 13.5,
              }),
            )}
          </div>
          <input
            id="kb-hw-ndate"
            type="date"
            value={nDate}
            onChange={(ev) => setNDate(ev.target.value)}
            style={{
              ...KB_INPUT,
              marginBottom: 16,
            }}
          />
          {kbBouton("Ajouter", null, {
            type: "submit",
            icone: KB_I.plus,
            disabled: !(nTitre.trim() && nMat && nDate),
            h: 54,
            bg: "#3b5fc4",
          })}
        </KbSheet>
      )}
      {matOuvert && (
        <KbSheet label="Matières" onClose={() => setMatOuvert(!1)} form={!0} onSubmit={ajouterMatiere}>
          {matieres.map((m) => {
            const ligne = lignesMat.find((x) => x.titre === m),
              nb = (rows || []).filter((r) => r.subject === m).length,
              col = couleurMat(m),
              enSuppr = matSuppr === m;
            return (
              <div
                style={{
                  borderBottom: "1px solid var(--line)",
                  padding: "8px 0",
                  display: "flex",
                  flexDirection: "column",
                  gap: 8,
                }}
                key={m}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                  }}
                >
                  <span
                    style={{
                      flex: "none",
                      width: 30,
                      height: 30,
                      borderRadius: 9,
                      background: col.c,
                      color: "#ffffff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 11,
                      fontWeight: 900,
                    }}
                  >
                    {abrev(m)}
                  </span>
                  {ligne ? (
                    [
                      <label htmlFor={"kb-mat-" + ligne.id} style={KB_SR} key="l">
                        Nom de la matière
                      </label>,
                      <input
                        id={"kb-mat-" + ligne.id}
                        value={matAncien[ligne.id] != null ? matAncien[ligne.id] : ligne.titre || ""}
                        onChange={(ev) => {
                          const v = ev.target.value;
                          setMatAncien((a) => ({
                            ...a,
                            [ligne.id]: v,
                          }));
                        }}
                        onBlur={() => renommerMatiere(ligne)}
                        onKeyDown={(ev) => {
                          ev.key === "Enter" && (ev.preventDefault(), ev.currentTarget.blur());
                        }}
                        style={{
                          ...KB_INPUT,
                          minHeight: 44,
                          flex: 1,
                          fontWeight: 700,
                        }}
                        key="i"
                      />,
                    ]
                  ) : (
                    <span
                      style={{
                        flex: 1,
                        fontWeight: 700,
                      }}
                    >
                      {m}
                    </span>
                  )}
                  <span
                    style={{
                      flex: "none",
                      fontSize: 13,
                      fontWeight: 700,
                      color: "var(--slate)",
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {nb + " devoir" + (nb > 1 ? "s" : "")}
                  </span>
                  <button
                    type="button"
                    onClick={() => supprimerMatiere(m)}
                    aria-label={(enSuppr ? "Confirmer la suppression de " : "Supprimer la matière ") + m}
                    style={{
                      flex: "none",
                      minWidth: 44,
                      minHeight: 44,
                      padding: "0 10px",
                      border: "2px solid " + (enSuppr ? "#b8432a" : "#f0d5ce"),
                      borderRadius: 12,
                      background: "#ffffff",
                      color: "#b8432a",
                      fontSize: 13.5,
                      fontWeight: 800,
                      fontFamily: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    {enSuppr ? "Confirmer" : accIcone(KB_I.croix, 16, 2.6)}
                  </button>
                </div>
                {enSuppr && nb > 0 ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 8,
                      flexWrap: "wrap",
                    }}
                  >
                    <label
                      htmlFor="kb-mat-dest"
                      style={{
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {"Rattacher ses " + nb + " devoir" + (nb > 1 ? "s" : "") + " à"}
                    </label>
                    <select
                      id="kb-mat-dest"
                      value={matDest}
                      onChange={(ev) => setMatDest(ev.target.value)}
                      style={{
                        ...KB_INPUT,
                        width: "auto",
                        flex: 1,
                        minHeight: 44,
                      }}
                    >
                      <option value="">Choisir…</option>
                      {matieres
                        .filter((x) => x !== m)
                        .map((x) => (
                          <option value={x} key={x}>
                            {x}
                          </option>
                        ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setMatSuppr(null)}
                      style={{
                        minHeight: 44,
                        border: 0,
                        background: "none",
                        color: "var(--ink-soft)",
                        fontWeight: 800,
                        fontFamily: "inherit",
                        cursor: "pointer",
                      }}
                    >
                      Annuler
                    </button>
                  </div>
                ) : enSuppr ? (
                  <button
                    type="button"
                    onClick={() => setMatSuppr(null)}
                    style={{
                      alignSelf: "flex-start",
                      minHeight: 40,
                      border: 0,
                      background: "none",
                      color: "var(--ink-soft)",
                      fontWeight: 800,
                      fontFamily: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    Annuler
                  </button>
                ) : null}
              </div>
            );
          })}
          <p
            className="detail"
            style={{
              margin: "10px 0",
            }}
          >
            Renommer une matière renomme aussi ses devoirs.
          </p>
          <div
            style={{
              display: "flex",
              gap: 8,
            }}
          >
            <label htmlFor="kb-mat-new" style={KB_SR}>
              Nouvelle matière
            </label>
            <input
              id="kb-mat-new"
              value={matNom}
              onChange={(ev) => setMatNom(ev.target.value)}
              placeholder="Nouvelle matière"
              autoComplete="off"
              style={{
                ...KB_INPUT,
                flex: 1,
              }}
            />
            <button
              type="submit"
              aria-label="Ajouter la matière"
              disabled={!matNom.trim()}
              style={{
                flex: "none",
                width: 48,
                height: 48,
                border: 0,
                borderRadius: 14,
                background: "#3b5fc4",
                color: "#ffffff",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                opacity: matNom.trim() ? 1 : 0.55,
              }}
            >
              {accIcone(KB_I.plus, 20, 2.6)}
            </button>
          </div>
        </KbSheet>
      )}
      <KbToast texte={toast} />
    </section>
  );
}

export async function hwkSetStatus(setRows, id, st) {
  const now = new Date().toISOString(),
    patch = {
      status: st,
      updated_at: now,
    };
  if (st === "Fait") patch.submitted_at = now;
  if (st === "Corrigé") patch.corrected_at = now;
  if (st === "À faire" || st === "En cours") (patch.submitted_at = null), (patch.corrected_at = null);
  setRows((p) =>
    p.map((r) =>
      r.id === id
        ? {
            ...r,
            ...patch,
          }
        : r,
    ),
  );
  const { error: E } = await supabase.from("vision_homework").update(patch).eq("id", id);
  if (E) throw E;
}

// Barre du bas : 5 onglets fixes + « Plus ».
