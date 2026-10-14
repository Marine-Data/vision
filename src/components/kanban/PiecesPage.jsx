import React from "react";
import {
  ACC_THEMES,
  KB_I,
  KB_INPUT,
  KB_LABEL,
  KB_PALETTE,
  KB_SR,
  KbEtapes,
  KbPill,
  KbSheet,
  KbToast,
  PIECE_ETAPES,
  accIcone,
  kbBouton,
  kbCompteurs,
  kbFlash,
  kbToggleBtn,
} from "./communs.jsx";
import { contenuDe } from "../../lib/contenu.js";

export // ============================================================
// PIÈCES
// ============================================================
function kbDossierIcone(nom) {
  return /scap/i.test(nom)
    ? ACC_THEMES.reco.i
    : /sport|avant/i.test(nom)
      ? ACC_THEMES.sport.i
      : /\bdu\b|paris 1|univ/i.test(nom)
        ? ACC_THEMES.devoirs.i
        : KB_I.doc;
}

export function PiecesPage({
  rows,
  progress,
  pieceEtapes,
  readOnly,
  onEtape,
  onEdit,
  onSave,
  onAdd,
  onDel,
  onMove,
  onRenameGroupe,
}) {
  const [selKey, setSelKey] = React.useState(null),
    [ajoutGroupe, setAjoutGroupe] = React.useState(null),
    [nom, setNom] = React.useState(""),
    [voir, setVoir] = React.useState({}),
    [editG, setEditG] = React.useState(null),
    [nomG, setNomG] = React.useState(""),
    [nouveauxG, setNouveauxG] = React.useState([]),
    [creerG, setCreerG] = React.useState(!1),
    [nomNouveauG, setNomNouveauG] = React.useState(""),
    [conf, setConf] = React.useState(!1),
    [toast, setToast] = React.useState("");
  const flash = kbFlash(setToast),
    erreur = (err) => flash("Échec : " + (err && err.message ? err.message : "connexion")),
    pieces = contenuDe(rows, "piece"),
    etapeDe = (k) => (pieceEtapes && pieceEtapes[k]) || (progress && progress[k] ? "validee" : "afournir"),
    etDe = (k) => PIECE_ETAPES.find((e) => e.k === etapeDe(k)),
    groupes = [];
  pieces.forEach((p) => {
    const g = p.groupe || "Autres";
    let x = groupes.find((y) => y.nom === g);
    x ||
      ((x = {
        nom: g,
        items: [],
      }),
      groupes.push(x)),
      x.items.push(p);
  });
  nouveauxG
    .filter((g) => !groupes.some((y) => y.nom === g))
    .forEach((g) =>
      groupes.push({
        nom: g,
        items: [],
      }),
    );
  groupes.forEach((g, i) => {
    const pal = KB_PALETTE[i % KB_PALETTE.length];
    (g.c = pal.c), (g.soft = pal.soft);
    g.ok = g.items.filter((p) => etapeDe(p.item_key) === "validee").length;
    g.complet = g.items.length > 0 && g.ok === g.items.length;
  });
  groupes.sort((a, b) => (a.complet ? 1 : 0) - (b.complet ? 1 : 0));
  const total = pieces.length,
    valides = pieces.filter((p) => etapeDe(p.item_key) === "validee").length,
    aFournir = pieces.filter((p) => etapeDe(p.item_key) === "afournir"),
    sel = pieces.find((p) => p.item_key === selKey),
    titreG = (g) => g.split(" — ")[0],
    sousG = (g) => g.split(" — ").slice(1).join(" — ");
  async function changer(p, k, viaAppuiLong) {
    if (etapeDe(p.item_key) === k) {
      viaAppuiLong ? flash("Déjà validée") : setSelKey(null);
      return;
    }
    try {
      await onEtape(p.item_key, k),
        setSelKey(null),
        flash((p.titre || "Pièce") + " → " + PIECE_ETAPES.find((e) => e.k === k).l);
    } catch (err) {
      erreur(err);
    }
  }
  async function ajouter() {
    const t = nom.trim();
    if (!t) {
      flash("Écris le nom de la pièce");
      return;
    }
    try {
      await onAdd(t, ajoutGroupe === "Autres" ? null : ajoutGroupe);
      setNouveauxG((l) => l.filter((g) => g !== ajoutGroupe)),
        setAjoutGroupe(null),
        setNom(""),
        flash("Ajoutée : " + t);
    } catch (err) {
      erreur(err);
    }
  }
  async function renommerG(ancien) {
    const t = nomG.trim();
    setEditG(null);
    if (!t || t === ancien) return;
    if (groupes.some((g) => g.nom === t)) {
      flash("Ce dossier existe déjà");
      return;
    }
    if (nouveauxG.includes(ancien)) {
      setNouveauxG((l) => l.map((g) => (g === ancien ? t : g)));
      return;
    }
    try {
      await onRenameGroupe(ancien === "Autres" ? null : ancien, t), flash("Dossier renommé");
    } catch (err) {
      erreur(err);
    }
  }
  function creerDossier() {
    const t = nomNouveauG.trim();
    if (!t) {
      setCreerG(!1);
      return;
    }
    if (groupes.some((g) => g.nom === t)) {
      flash("Ce dossier existe déjà");
      return;
    }
    setNouveauxG((l) => [...l, t]), setCreerG(!1), setNomNouveauG(""), setNom(""), setAjoutGroupe(t);
  }
  async function supprimer(p) {
    if (!conf) {
      setConf(!0);
      return;
    }
    try {
      await onDel(p.id), setSelKey(null), flash("Pièce supprimée");
    } catch (err) {
      erreur(err);
    }
  }
  const ouvrir = (p) => {
    readOnly || (setConf(!1), setSelKey(p.item_key));
  };
  return (
    <section className="sec">
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 10,
          marginBottom: 12,
        }}
      >
        <h2
          style={{
            margin: 0,
          }}
        >
          Pièces à fournir
        </h2>
        <span
          role="img"
          aria-label={valides + " pièces validées sur " + total}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            fontSize: 15,
            fontWeight: 800,
            color: "var(--t-ambre)",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          <span
            style={{
              width: 64,
              height: 8,
              borderRadius: 99,
              background: "var(--ambre-doux)",
              overflow: "hidden",
            }}
          >
            <span
              style={{
                display: "block",
                height: 8,
                borderRadius: 99,
                width: (total ? Math.round((valides / total) * 100) : 0) + "%",
                background: "var(--c-ambre)",
              }}
            />
          </span>
          {valides + "/" + total}
        </span>
      </div>
      {aFournir.length > 0 && (
        <div
          style={{
            borderRadius: 22,
            background: "var(--c-ambre)",
            color: "#ffffff",
            padding: 14,
            display: "flex",
            flexDirection: "column",
            gap: 10,
            marginBottom: 12,
            boxShadow: "0 10px 24px rgba(138,90,18,.25)",
          }}
        >
          <span
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 8,
            }}
          >
            <span
              style={{
                fontFamily: "Georgia,serif",
                fontSize: 30,
                fontWeight: 700,
                lineHeight: 1,
              }}
            >
              {aFournir.length}
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 800,
              }}
            >
              {aFournir.length > 1 ? "pièces à fournir" : "pièce à fournir"}
            </span>
          </span>
          {aFournir.map((p) => (
            <button
              type="button"
              onClick={() => ouvrir(p)}
              style={{
                minHeight: 44,
                border: 0,
                borderRadius: 14,
                background: "rgba(255,255,255,.14)",
                color: "#ffffff",
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                textAlign: "left",
                fontSize: 15,
                fontWeight: 700,
                fontFamily: "inherit",
                cursor: readOnly ? "default" : "pointer",
              }}
              key={p.item_key}
            >
              <span
                style={{
                  flex: "none",
                  padding: "2px 8px",
                  borderRadius: 99,
                  background: "var(--surface)",
                  color: "var(--t-ambre)",
                  fontSize: 12.5,
                  fontWeight: 900,
                }}
              >
                {titreG(p.groupe || "Autres")}
              </span>
              <span
                style={{
                  flex: 1,
                  minWidth: 0,
                }}
              >
                {p.titre}
              </span>
              {readOnly ? null : accIcone(KB_I.chevron, 16, 2.4)}
            </button>
          ))}
        </div>
      )}
      {kbCompteurs(
        pieces,
        PIECE_ETAPES,
        "",
        null,
        (k) => pieces.filter((p) => etapeDe(p.item_key) === k).length,
      )}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        {groupes.map((g) => {
          const ouvert = !!voir[g.nom],
            liste = [...g.items].sort(
              (a, b) =>
                ({
                  afournir: 0,
                  envoyee: 1,
                  validee: 2,
                })[etapeDe(a.item_key)] -
                  {
                    afournir: 0,
                    envoyee: 1,
                    validee: 2,
                  }[etapeDe(b.item_key)] || (a.sort || 0) - (b.sort || 0),
            ),
            visibles = ouvert ? liste : liste.filter((p) => etapeDe(p.item_key) !== "validee"),
            edition = editG === g.nom;
          const barre = g.items.length ? (
            <div
              role="img"
              aria-label={g.ok + " validées sur " + g.items.length}
              style={{
                display: "flex",
                gap: 4,
              }}
            >
              {liste.map((p) => {
                const v = etapeDe(p.item_key);
                return (
                  <span
                    style={{
                      flex: 1,
                      height: 7,
                      borderRadius: 99,
                      background:
                        v === "validee"
                          ? "#0f8a68"
                          : v === "envoyee"
                            ? "repeating-linear-gradient(135deg,#b5561f 0 4px,#e0a074 4px 7px)"
                            : "#e3d3b6",
                    }}
                    key={p.item_key}
                  />
                );
              })}
            </div>
          ) : null;
          return (
            <section
              aria-label={g.nom}
              style={{
                background: "var(--surface)",
                borderRadius: 22,
                padding: 12,
                display: "flex",
                flexDirection: "column",
                gap: 10,
                boxShadow: "var(--shadow)",
              }}
              key={g.nom}
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
                    width: 36,
                    height: 36,
                    borderRadius: 11,
                    background: g.soft,
                    color: g.c,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {accIcone(kbDossierIcone(g.nom), 18, 2.2)}
                </span>
                {edition ? (
                  <form
                    onSubmit={(ev) => {
                      ev.preventDefault(), renommerG(g.nom);
                    }}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      display: "flex",
                    }}
                  >
                    <label htmlFor={"kbg-" + g.nom} style={KB_SR}>
                      Nom du dossier
                    </label>
                    <input
                      id={"kbg-" + g.nom}
                      autoFocus={!0}
                      value={nomG}
                      onChange={(ev) => setNomG(ev.target.value)}
                      onBlur={() => renommerG(g.nom)}
                      onKeyDown={(ev) => {
                        ev.key === "Escape" && setEditG(null);
                      }}
                      style={{
                        ...KB_INPUT,
                        minHeight: 44,
                        fontWeight: 800,
                        borderColor: g.c,
                      }}
                    />
                  </form>
                ) : (
                  <button
                    type="button"
                    disabled={readOnly}
                    onClick={() => {
                      setEditG(g.nom), setNomG(g.nom);
                    }}
                    aria-label={"Renommer le dossier " + g.nom}
                    style={{
                      flex: 1,
                      minWidth: 0,
                      minHeight: 44,
                      border: 0,
                      background: "none",
                      padding: 0,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-start",
                      justifyContent: "center",
                      textAlign: "left",
                      color: "var(--ink)",
                      fontFamily: "inherit",
                      cursor: readOnly ? "default" : "text",
                    }}
                  >
                    <span
                      style={{
                        fontSize: 16,
                        fontWeight: 800,
                        lineHeight: 1.25,
                      }}
                    >
                      {titreG(g.nom)}
                    </span>
                    {sousG(g.nom) ? (
                      <span
                        style={{
                          fontSize: 13,
                          color: "var(--slate)",
                          fontWeight: 600,
                          lineHeight: 1.3,
                        }}
                      >
                        {sousG(g.nom)}
                      </span>
                    ) : null}
                  </button>
                )}
                {g.complet ? (
                  <span
                    style={{
                      flex: "none",
                      padding: "4px 10px",
                      borderRadius: 99,
                      background: "var(--vert-doux)",
                      color: "var(--t-vert)",
                      fontSize: 13,
                      fontWeight: 900,
                      display: "flex",
                      alignItems: "center",
                      gap: 4,
                    }}
                  >
                    {accIcone(KB_I.check, 13, 3)}Complet
                  </span>
                ) : (
                  <span
                    style={{
                      flex: "none",
                      fontSize: 13,
                      fontWeight: 800,
                      color: g.c,
                      fontVariantNumeric: "tabular-nums",
                    }}
                  >
                    {g.ok + "/" + g.items.length}
                  </span>
                )}
                {!readOnly && (
                  <button
                    type="button"
                    onClick={() => {
                      setNom(""), setAjoutGroupe(g.nom);
                    }}
                    aria-label={"Ajouter une pièce au dossier " + titreG(g.nom)}
                    style={{
                      flex: "none",
                      width: 44,
                      height: 44,
                      marginRight: -6,
                      border: 0,
                      borderRadius: "50%",
                      background: "none",
                      color: "var(--slate-light)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    {accIcone(KB_I.plus, 20, 2.4)}
                  </button>
                )}
              </div>
              {barre}
              {!g.items.length ? (
                readOnly ? null : (
                  <button
                    type="button"
                    onClick={() => {
                      setNom(""), setAjoutGroupe(g.nom);
                    }}
                    style={{
                      alignSelf: "flex-start",
                      minHeight: 44,
                      display: "flex",
                      alignItems: "center",
                      gap: 6,
                      padding: "6px 14px",
                      borderRadius: 22,
                      border: "2px dashed var(--line-strong)",
                      background: "var(--surface)",
                      color: g.c,
                      fontSize: 14,
                      fontWeight: 800,
                      fontFamily: "inherit",
                      cursor: "pointer",
                    }}
                  >
                    {accIcone(KB_I.plus, 16, 2.6)}Ajouter une pièce
                  </button>
                )
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 8,
                  }}
                >
                  {visibles.map((p) => (
                    <KbPill
                      titre={p.titre || "Sans nom"}
                      etape={etDe(p.item_key)}
                      couleur={g.c}
                      soft={g.soft}
                      due={p.date_iso}
                      fini={etapeDe(p.item_key) === "validee"}
                      onClick={() => ouvrir(p)}
                      onLong={readOnly ? null : () => changer(p, "validee", !0)}
                      key={p.item_key}
                    />
                  ))}
                  {g.ok
                    ? kbToggleBtn(
                        ouvert ? "Masquer" : g.ok + " validée" + (g.ok > 1 ? "s" : ""),
                        ouvert ? "Masquer les pièces validées" : "Voir les " + g.ok + " pièces validées",
                        () =>
                          setVoir(
                            Object.assign({}, voir, {
                              [g.nom]: !ouvert,
                            }),
                          ),
                      )
                    : null}
                </div>
              )}
            </section>
          );
        })}
        {!readOnly &&
          (creerG ? (
            <form
              onSubmit={(ev) => {
                ev.preventDefault(), creerDossier();
              }}
              style={{
                background: "var(--surface)",
                borderRadius: 22,
                padding: 12,
                display: "flex",
                gap: 8,
                boxShadow: "var(--shadow)",
              }}
            >
              <label htmlFor="kb-nouveau-dossier" style={KB_SR}>
                Nom du nouveau dossier
              </label>
              <input
                id="kb-nouveau-dossier"
                autoFocus={!0}
                value={nomNouveauG}
                onChange={(ev) => setNomNouveauG(ev.target.value)}
                onKeyDown={(ev) => {
                  ev.key === "Escape" && setCreerG(!1);
                }}
                placeholder="Ex. Mutuelle, France Travail…"
                autoComplete="off"
                style={{
                  ...KB_INPUT,
                  flex: 1,
                }}
              />
              <button
                type="submit"
                aria-label="Créer le dossier"
                style={{
                  flex: "none",
                  width: 48,
                  height: 48,
                  border: 0,
                  borderRadius: 14,
                  background: "var(--c-ambre)",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                }}
              >
                {accIcone(KB_I.check, 20, 2.6)}
              </button>
            </form>
          ) : (
            <button
              type="button"
              onClick={() => {
                setNomNouveauG(""), setCreerG(!0);
              }}
              style={{
                minHeight: 52,
                border: "2px dashed #c9ab78",
                borderRadius: 22,
                background: "transparent",
                color: "var(--t-ambre)",
                fontSize: 15.5,
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                fontFamily: "inherit",
                cursor: "pointer",
              }}
            >
              {accIcone(KB_I.dossier, 18, 2.4)}Nouveau dossier
            </button>
          ))}
        {!readOnly && pieces.length > 0 && (
          <p
            className="detail"
            style={{
              textAlign: "center",
              margin: 0,
            }}
          >
            Appui long sur une pièce : elle passe en « Validée ».
          </p>
        )}
      </div>
      {sel && (
        <KbSheet label={titreG(sel.groupe || "Autres")} onClose={() => setSelKey(null)}>
          <label htmlFor="kb-piece-nom" style={KB_LABEL}>
            Nom de la pièce
          </label>
          <input
            id="kb-piece-nom"
            value={sel.titre || ""}
            onChange={(ev) =>
              onEdit(sel.id, {
                titre: ev.target.value,
              })
            }
            onBlur={() => onSave(sel.id)}
            autoComplete="off"
            style={{
              ...KB_INPUT,
              marginBottom: 16,
              fontWeight: 700,
            }}
          />
          <KbEtapes etapes={PIECE_ETAPES} actuelle={etapeDe(sel.item_key)} onPick={(k) => changer(sel, k)} />
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginBottom: 8,
            }}
          >
            {kbBouton("Monter", () => onMove(sel.id, -1), {
              outline: !0,
              icone: KB_I.haut,
              h: 46,
            })}
            {kbBouton("Descendre", () => onMove(sel.id, 1), {
              outline: !0,
              icone: KB_I.bas,
              h: 46,
            })}
          </div>
          {kbBouton(conf ? "Confirmer la suppression" : "Supprimer la pièce", () => supprimer(sel), {
            outline: !0,
            fg: "var(--t-rouge)",
            bd: conf ? "var(--c-rouge)" : "var(--rouge-doux)",
            h: 46,
          })}
        </KbSheet>
      )}
      {ajoutGroupe && (
        <KbSheet
          label={"Nouvelle pièce · " + titreG(ajoutGroupe)}
          onClose={() => setAjoutGroupe(null)}
          form={!0}
          onSubmit={ajouter}
        >
          <label htmlFor="kb-piece-ajout" style={KB_SR}>
            Nom de la pièce
          </label>
          <input
            id="kb-piece-ajout"
            data-autofocus="1"
            value={nom}
            onChange={(ev) => setNom(ev.target.value)}
            placeholder="Ex. Attestation employeur"
            autoComplete="off"
            style={{
              ...KB_INPUT,
              height: 52,
              marginBottom: 14,
            }}
          />
          {kbBouton("Ajouter", null, {
            type: "submit",
            icone: KB_I.plus,
            disabled: !nom.trim(),
            h: 54,
            bg: "var(--c-ambre)",
          })}
        </KbSheet>
      )}
      <KbToast texte={toast} />
    </section>
  );
}

// ============================================================
// DEVOIRS
// ============================================================
