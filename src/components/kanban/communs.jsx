import React from "react";

export // ============================================================
// Kanban : Accueil, Devoirs, Pièces — composants partagés.
// Toutes les couleurs de texte ont un contraste ≥ 4,5:1, les
// icônes ≥ 3:1, les zones à toucher ≥ 44 px.
// ============================================================
const ACC_THEMES = {
  devoirs: {
    l: "Devoirs",
    short: "Devoirs",
    c: "var(--t-bleu)",
    soft: "var(--bleu-doux)",
    tab: "homework",
    page: "Devoirs",
    i: "M12 6.6C10.4 5.1 7.9 4.6 4.6 5.1v12.2c3.3-.5 5.8 0 7.4 1.5 1.6-1.5 4.1-2 7.4-1.5V5.1c-3.3-.5-5.8 0-7.4 1.5zM12 6.6v12.2",
  },
  budget: {
    l: "Budget",
    short: "Budget",
    c: "var(--t-vert)",
    soft: "var(--vert-doux)",
    tab: "tresorerie",
    page: "Budget mois",
    i: "M4 8.4A1.8 1.8 0 0 1 5.8 6.6h12.4A1.8 1.8 0 0 1 20 8.4v9.2a1.8 1.8 0 0 1-1.8 1.8H5.8A1.8 1.8 0 0 1 4 17.6zM20 11.4h-3.1a1.6 1.6 0 0 0 0 3.2H20",
  },
  reco: {
    l: "Reconversion",
    short: "Reconv.",
    c: "var(--t-teal)",
    soft: "var(--teal-doux)",
    tab: "suivi",
    page: "Suivi",
    i: "M2 9l10-5 10 5-10 5zM6 11v5c3 2 9 2 12 0v-5M22 9v6",
  },
  sport: {
    l: "Sport",
    short: "Sport",
    c: "var(--t-rose)",
    soft: "var(--rose-doux)",
    tab: "sport",
    page: "Sport",
    i: "M6.8 8.2v7.6M3.8 9.8v4.4M17.2 8.2v7.6M20.2 9.8v4.4M6.8 12h10.4",
  },
  pieces: {
    l: "Pièces",
    short: "Pièces",
    c: "var(--t-ambre)",
    soft: "var(--ambre-doux)",
    tab: "pieces",
    page: "Pièces",
    i: "M6.2 3.6h6.6l5 5v11.8a1 1 0 0 1-1 1H6.2a1 1 0 0 1-1-1V4.6a1 1 0 0 1 1-1zM12.8 3.6V8.6h5",
  },
};

export const KB_I = {
  rond: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z",
  play: "M8 5v14l11-7z",
  sablier: "M7 3h10M7 21h10M8 3c0 5 8 5 8 9s-8 4-8 9M16 3c0 5-8 5-8 9",
  check: "M5 12l5 5L20 7",
  etoile: "M12 3.5l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8-4.2-4.1 5.8-.8z",
  doc: "M6.2 3.6h6.6l5 5v11.8a1 1 0 0 1-1 1H6.2a1 1 0 0 1-1-1V4.6a1 1 0 0 1 1-1zM12.8 3.6V8.6h5",
  envoi: "M4 12l16-8-6 16-3-6zM11 14l9-10",
  plus: "M12 5v14M5 12h14",
  chevron: "M9 6l6 6-6 6",
  croix: "M6 6l12 12M18 6L6 18",
  haut: "M12 19V5M6 11l6-6 6 6",
  bas: "M12 5v14M6 13l6 6 6-6",
  dossier:
    "M3.6 7.2A1.8 1.8 0 0 1 5.4 5.4h4l2 2.2h7.2a1.8 1.8 0 0 1 1.8 1.8v8.4a1.8 1.8 0 0 1-1.8 1.8H5.4a1.8 1.8 0 0 1-1.8-1.8zM12 10.8v4.8M9.6 13.2h4.8",
  liste: "M4 6h10M4 12h16M4 18h12M18 4v4M16 6h4",
};
// Étapes du kanban (Accueil, tâches libres)

export // Étapes du kanban (Accueil, tâches libres)
const ACC_ETAPES = [
  {
    k: "afaire",
    l: "À faire",
    i: KB_I.rond,
    c: "var(--ink-soft)",
    soft: "var(--fond-gris)",
  },
  {
    k: "encours",
    l: "En cours",
    i: KB_I.play,
    c: "var(--t-teal)",
    soft: "var(--teal-doux)",
    fill: !0,
  },
  {
    k: "attente",
    l: "En attente",
    i: KB_I.sablier,
    c: "var(--t-orange)",
    soft: "var(--orange-doux)",
  },
  {
    k: "fait",
    l: "Fait",
    i: KB_I.check,
    c: "var(--t-vert)",
    soft: "var(--vert-doux)",
  },
];
// Étapes d'un devoir : la valeur stockée reste celle de la base (« Fait »),
// seul le libellé affiché change (« Rendu »).

export // Étapes d'un devoir : la valeur stockée reste celle de la base (« Fait »),
// seul le libellé affiché change (« Rendu »).
const HW_ETAPES = [
  {
    k: "À faire",
    l: "À faire",
    i: KB_I.rond,
    c: "var(--ink-soft)",
    soft: "var(--fond-gris)",
    kan: "afaire",
  },
  {
    k: "En cours",
    l: "En cours",
    i: KB_I.play,
    c: "var(--t-bleu)",
    soft: "var(--bleu-doux)",
    fill: !0,
    kan: "encours",
  },
  {
    k: "Fait",
    l: "Rendu",
    i: KB_I.check,
    c: "var(--t-vert)",
    soft: "var(--vert-doux)",
    kan: "fait",
  },
  {
    k: "Corrigé",
    l: "Corrigé",
    i: KB_I.etoile,
    c: "var(--t-violet)",
    soft: "var(--violet-doux)",
    kan: "fait",
  },
];

export const PIECE_ETAPES = [
  {
    k: "afournir",
    l: "À fournir",
    i: KB_I.doc,
    c: "var(--t-ambre)",
    soft: "var(--ambre-doux)",
    kan: "afaire",
  },
  {
    k: "envoyee",
    l: "Envoyée",
    i: KB_I.envoi,
    c: "var(--t-orange)",
    soft: "var(--orange-doux)",
    kan: "attente",
  },
  {
    k: "validee",
    l: "Validée",
    i: KB_I.check,
    c: "var(--t-vert)",
    soft: "var(--vert-doux)",
    kan: "fait",
  },
];

export const SUIVI_ETAPES = [
  {
    k: "afaire",
    l: "À faire",
    i: KB_I.rond,
    c: "var(--ink-soft)",
    soft: "var(--fond-gris)",
    kan: "afaire",
  },
  {
    k: "fait",
    l: "Fait",
    i: KB_I.check,
    c: "var(--t-vert)",
    soft: "var(--vert-doux)",
    kan: "fait",
  },
];

export const ACC_ORDRE = {
  encours: 0,
  afaire: 1,
  attente: 2,
  fait: 3,
};

export const ACC_MOIS = [
  "janv.",
  "févr.",
  "mars",
  "avr.",
  "mai",
  "juin",
  "juil.",
  "août",
  "sept.",
  "oct.",
  "nov.",
  "déc.",
];

export const KB_PALETTE = [
  {
    c: "var(--t-bleu)",
    soft: "var(--bleu-doux)",
  },
  {
    c: "var(--t-teal)",
    soft: "var(--teal-doux)",
  },
  {
    c: "var(--t-ambre)",
    soft: "var(--ambre-doux)",
  },
  {
    c: "var(--t-rose)",
    soft: "var(--rose-doux)",
  },
  {
    c: "var(--t-violet)",
    soft: "var(--violet-doux)",
  },
  {
    c: "var(--t-vert)",
    soft: "var(--vert-doux)",
  },
];

export const KB_SR = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clip: "rect(0 0 0 0)",
  whiteSpace: "nowrap",
};

export function accIcone(d, size, sw, fill) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill || "none"}
      stroke="currentColor"
      strokeWidth={sw || 2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      <path d={d} />
    </svg>
  );
}

export function accIso(d) {
  return (
    d.getFullYear() +
    "-" +
    String(d.getMonth() + 1).padStart(2, "0") +
    "-" +
    String(d.getDate()).padStart(2, "0")
  );
}

// Échéance → libellé court à l'écran + phrase complète pour la lecture vocale.

export // Échéance → libellé court à l'écran + phrase complète pour la lecture vocale.
function accEcheance(iso) {
  if (!iso) return null;
  const p = String(iso).slice(0, 10).split("-"),
    d = new Date(+p[0], +p[1] - 1, +p[2]),
    t = new Date(),
    auj = new Date(t.getFullYear(), t.getMonth(), t.getDate()),
    j = Math.round((d - auj) / 864e5),
    date = d.getDate() + " " + ACC_MOIS[d.getMonth()];
  if (j < 0)
    return {
      l: "En retard",
      aria: "en retard de " + -j + " jour" + (j < -1 ? "s" : "") + ", prévu le " + date,
      urgent: !0,
      late: !0,
      j,
    };
  if (j === 0)
    return {
      l: "Aujourd'hui",
      aria: "pour aujourd'hui",
      urgent: !0,
      j,
    };
  if (j === 1)
    return {
      l: "Demain",
      aria: "pour demain",
      urgent: !0,
      j,
    };
  if (j <= 3)
    return {
      l: "J-" + j,
      aria: "dans " + j + " jours, le " + date,
      urgent: !0,
      j,
    };
  return {
    l: date,
    aria: "pour le " + date,
    urgent: !1,
    j,
  };
}

export function kbRaccourcis() {
  const a = new Date();
  return [
    {
      k: accIso(new Date(a.getFullYear(), a.getMonth(), a.getDate() + 1)),
      l: "Demain",
    },
    {
      k: accIso(new Date(a.getFullYear(), a.getMonth(), a.getDate() + 6)),
      l: "Semaine",
    },
    {
      k: accIso(new Date(a.getFullYear(), a.getMonth() + 1, 0)),
      l: "Fin du mois",
    },
  ];
}

export function kbFlash(set) {
  return (m) => {
    set(m), clearTimeout(window.__kbT), (window.__kbT = setTimeout(() => set(""), 1800));
  };
}

export function KbToast({ texte }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        left: 20,
        right: 20,
        bottom: "calc(96px + env(safe-area-inset-bottom))",
        zIndex: 60,
        padding: texte ? "12px 16px" : 0,
        borderRadius: 14,
        background: texte ? "var(--entete)" : "transparent",
        color: "#ffffff",
        fontSize: 15,
        fontWeight: 600,
        textAlign: "center",
        maxWidth: 520,
        margin: "0 auto",
        pointerEvents: "none",
      }}
    >
      {texte}
    </div>
  );
}

// Fenêtre du bas accessible : Échap et le bouton retour du téléphone la ferment,
// le focus reste dedans, et revient sur l'élément touché à la fermeture.

export // Fenêtre du bas accessible : Échap et le bouton retour du téléphone la ferment,
// le focus reste dedans, et revient sur l'élément touché à la fermeture.
function KbSheet({ label, onClose, children, form, onSubmit }) {
  const ref = React.useRef(null),
    fermer = React.useRef(onClose);
  fermer.current = onClose;
  React.useEffect(() => {
    const avant = document.activeElement,
      el = ref.current,
      focusables = () =>
        el
          ? [...el.querySelectorAll("button:not([disabled]),input:not([disabled]),textarea,select,a[href]")]
          : [];
    const premier = el && (el.querySelector("[data-autofocus]") || focusables()[0]);
    premier
      ? premier.focus({
          preventScroll: !0,
        })
      : el && el.focus();
    let parRetour = !1;
    try {
      history.pushState(
        {
          kbSheet: Date.now(),
        },
        "",
      );
    } catch (e) {}
    const onPop = () => {
      if (window.__kbIgnorePop) {
        window.__kbIgnorePop = !1;
        return;
      }
      (parRetour = !0), fermer.current();
    };
    const onKey = (ev) => {
      if (ev.key === "Escape") {
        ev.preventDefault(), fermer.current();
        return;
      }
      if (ev.key !== "Tab") return;
      const l = focusables();
      if (!l.length) return;
      const a = l[0],
        z = l[l.length - 1];
      if (ev.shiftKey && document.activeElement === a) ev.preventDefault(), z.focus();
      else if (!ev.shiftKey && document.activeElement === z) ev.preventDefault(), a.focus();
    };
    window.addEventListener("popstate", onPop), document.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("popstate", onPop), document.removeEventListener("keydown", onKey);
      if (!parRetour)
        try {
          history.state && history.state.kbSheet && ((window.__kbIgnorePop = !0), history.back());
        } catch (e) {}
      avant &&
        avant.focus &&
        document.contains(avant) &&
        avant.focus({
          preventScroll: !0,
        });
    };
  }, []);
  const props = {
    ref,
    className: "sheet",
    role: "dialog",
    "aria-modal": "true",
    "aria-label": label,
    tabIndex: -1,
    children: [
      <div className="sheethead">
        <h3
          style={{
            margin: 0,
            fontSize: "1.2rem",
            lineHeight: 1.25,
          }}
        >
          {label}
        </h3>
        <button type="button" className="sheetclose" onClick={onClose} aria-label="Fermer">
          {accIcone(KB_I.croix, 20, 2.4)}
        </button>
      </div>,
      children,
    ],
  };
  return (
    <div
      className="sheetbg"
      onClick={(ev) => {
        ev.target === ev.currentTarget && onClose();
      }}
    >
      {form ? (
        <form
          {...props}
          onSubmit={(ev) => {
            ev.preventDefault(), onSubmit && onSubmit();
          }}
        />
      ) : (
        <div {...props} />
      )}
    </div>
  );
}

// Grille de gros boutons d'étape (même fenêtre partout).

export // Grille de gros boutons d'étape (même fenêtre partout).
function KbEtapes({ etapes, actuelle, onPick }) {
  return (
    <div
      role="group"
      aria-label="Étape"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(" + etapes.length + ",minmax(0,1fr))",
        gap: 8,
        marginBottom: 18,
      }}
    >
      {etapes.map((et) => {
        const on = actuelle === et.k;
        return (
          <button
            type="button"
            onClick={() => onPick(et.k)}
            aria-pressed={on ? "true" : "false"}
            style={{
              border: 0,
              background: "none",
              padding: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 7,
              color: et.c,
              fontFamily: "inherit",
              cursor: "pointer",
            }}
            key={et.k}
          >
            <span
              style={{
                width: 60,
                height: 60,
                borderRadius: 20,
                background: on ? et.c : "var(--surface)",
                color: on ? "#ffffff" : et.c,
                border: "2px solid " + et.c,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxSizing: "border-box",
              }}
            >
              {accIcone(et.i, 26, 2.2)}
            </span>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              {et.l}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// Pastille : titre sur 2 lignes max, échéance, contour rouge si en retard,
// appui long optionnel.

export // Pastille : titre sur 2 lignes max, échéance, contour rouge si en retard,
// appui long optionnel.
function KbPill({ titre, etape, couleur, soft, due, fini, onClick, onLong, sousTitre }) {
  const e = !fini && due ? accEcheance(due) : null,
    late = !!(e && e.late),
    look = fini
      ? {
          bg: "var(--fond-doux)",
          bd: "var(--fond-doux)",
          fg: "var(--ink-soft)",
          dbg: etape.soft,
          dfg: etape.c,
          fill: "none",
        }
      : etape.fill
        ? {
            bg: soft,
            bd: couleur,
            fg: "var(--ink)",
            dbg: couleur,
            dfg: "#ffffff",
            fill: "currentColor",
          }
        : etape.kan === "attente" || etape.k === "attente"
          ? {
              bg: "var(--orange-doux)",
              bd: "var(--orange-doux)",
              fg: "var(--ink)",
              dbg: "var(--surface)",
              dfg: etape.c,
              fill: "none",
            }
          : {
              bg: "var(--surface)",
              bd: "var(--line-strong)",
              fg: "var(--ink)",
              dbg: etape.soft,
              dfg: etape.c,
              fill: "none",
            },
    lp = React.useRef({
      t: 0,
      fired: !1,
    });
  const longProps = onLong
    ? {
        onPointerDown: () => {
          (lp.current.fired = !1),
            clearTimeout(lp.current.t),
            (lp.current.t = setTimeout(() => {
              lp.current.fired = !0;
              try {
                navigator.vibrate && navigator.vibrate(30);
              } catch (x) {}
              onLong();
            }, 550));
        },
        onPointerUp: () => clearTimeout(lp.current.t),
        onPointerLeave: () => clearTimeout(lp.current.t),
        onPointerCancel: () => clearTimeout(lp.current.t),
        onContextMenu: (ev) => ev.preventDefault(),
      }
    : {};
  return (
    <button
      type="button"
      onClick={() => {
        if (lp.current.fired) {
          lp.current.fired = !1;
          return;
        }
        onClick && onClick();
      }}
      {...longProps}
      aria-label={
        titre +
        (sousTitre ? ", " + sousTitre : "") +
        ", " +
        etape.l +
        (e ? ", " + e.aria : "") +
        (onLong ? ". Appui long pour valider" : "")
      }
      style={{
        minHeight: 44,
        maxWidth: "100%",
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 12px 6px 6px",
        borderRadius: 22,
        border: "2px solid " + (late ? "var(--c-rouge)" : look.bd),
        background: late ? "var(--rouge-doux)" : look.bg,
        color: look.fg,
        fontSize: 14.5,
        fontWeight: 600,
        textAlign: "left",
        fontFamily: "inherit",
        cursor: "pointer",
        userSelect: "none",
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
      }}
    >
      <span
        style={{
          flex: "none",
          width: 28,
          height: 28,
          borderRadius: "50%",
          background: look.dbg,
          color: look.dfg,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        {accIcone(etape.i, 14, 2.6, look.fill)}
      </span>
      <span
        style={{
          minWidth: 0,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textDecoration: fini && etape.k === "Corrigé" ? "line-through" : "none",
        }}
      >
        {titre}
      </span>
      {e ? (
        <span
          aria-hidden="true"
          style={{
            flex: "none",
            fontSize: 12.5,
            fontWeight: 800,
            color: e.urgent ? "var(--t-rouge)" : "var(--slate)",
          }}
        >
          {e.l}
        </span>
      ) : null}
    </button>
  );
}

// Ligne (couloir) : en-tête, barre de progression, contenu, état vide utile.

export // Ligne (couloir) : en-tête, barre de progression, contenu, état vide utile.
function KbLane({
  titre,
  sous,
  icone,
  abrev,
  c,
  soft,
  ratio,
  pct,
  onHeader,
  headerAria,
  onAdd,
  addAria,
  badge,
  barre,
  children,
  vide,
  onVide,
  videLabel,
}) {
  const tete = [
    <span
      style={{
        flex: "none",
        width: 36,
        height: 36,
        borderRadius: 11,
        background: soft,
        color: c,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 13,
        fontWeight: 900,
      }}
    >
      {icone ? accIcone(icone, 18, 2.2) : abrev}
    </span>,
    <span
      style={{
        flex: 1,
        minWidth: 0,
        display: "flex",
        flexDirection: "column",
      }}
    >
      <span
        style={{
          fontSize: 16,
          fontWeight: 800,
          lineHeight: 1.25,
        }}
      >
        {titre}
      </span>
      {sous ? (
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--slate)",
            lineHeight: 1.3,
          }}
        >
          {sous}
        </span>
      ) : null}
    </span>,
    badge ||
      (ratio != null ? (
        <span
          style={{
            flex: "none",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {barre ? null : (
            <span
              aria-hidden="true"
              style={{
                width: 54,
                height: 7,
                borderRadius: 99,
                background: soft,
                overflow: "hidden",
              }}
            >
              <span
                style={{
                  display: "block",
                  height: 7,
                  borderRadius: 99,
                  width: pct + "%",
                  background: c,
                }}
              />
            </span>
          )}
          <span
            style={{
              fontSize: 13,
              fontWeight: 800,
              color: c,
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {ratio}
          </span>
        </span>
      ) : null),
    onHeader ? (
      <span
        aria-hidden="true"
        style={{
          flex: "none",
          color: "var(--slate-light)",
          display: "flex",
        }}
      >
        {accIcone(KB_I.chevron, 18, 2.4)}
      </span>
    ) : null,
  ];
  return (
    <section
      aria-label={titre}
      style={{
        background: "var(--surface)",
        borderRadius: 22,
        padding: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        boxShadow: "var(--shadow)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        {onHeader ? (
          <button
            type="button"
            onClick={onHeader}
            aria-label={headerAria}
            style={{
              flex: 1,
              minWidth: 0,
              border: 0,
              background: "none",
              padding: 0,
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              gap: 10,
              color: "var(--ink)",
              textAlign: "left",
              fontFamily: "inherit",
              cursor: "pointer",
            }}
          >
            {tete}
          </button>
        ) : (
          <div
            style={{
              flex: 1,
              minWidth: 0,
              minHeight: 44,
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            {tete}
          </div>
        )}
        {onAdd ? (
          <button
            type="button"
            onClick={onAdd}
            aria-label={addAria}
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
        ) : null}
      </div>
      {barre || null}
      {vide ? (
        <button
          type="button"
          onClick={onVide}
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
            color: c,
            fontSize: 14,
            fontWeight: 800,
            fontFamily: "inherit",
            cursor: "pointer",
          }}
        >
          {accIcone(KB_I.plus, 16, 2.6)}
          {videLabel || "Ajouter"}
        </button>
      ) : (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
          }}
        >
          {children}
        </div>
      )}
    </section>
  );
}

export function kbToggleBtn(label, aria, onClick, couleur) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={aria}
      style={{
        minHeight: 44,
        display: "flex",
        alignItems: "center",
        gap: 6,
        padding: "6px 12px",
        borderRadius: 22,
        border: "2px dashed var(--line-strong)",
        background: "var(--surface)",
        color: couleur || "var(--t-vert)",
        fontSize: 14,
        fontWeight: 800,
        fontFamily: "inherit",
        cursor: "pointer",
      }}
    >
      {label}
    </button>
  );
}

export function kbCompteurs(liste, etapes, actif, onPick, nbDe) {
  return (
    <div
      role="group"
      aria-label={onPick ? "Filtrer par étape" : "Résumé par étape"}
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(" + etapes.length + ",minmax(0,1fr))",
        gap: 6,
        marginBottom: 12,
      }}
    >
      {etapes.map((et) => {
        const nb = nbDe(et.k),
          on = actif === et.k,
          st = {
            minHeight: 52,
            borderRadius: 14,
            padding: "6px 4px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            background: on ? et.c : et.soft,
            color: on ? "#ffffff" : et.c,
            border: "2px solid " + (on ? et.c : et.soft),
            fontFamily: "inherit",
          },
          inner = [
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 5,
              }}
            >
              {accIcone(et.i, 15, 2.4)}
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 800,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {nb}
              </span>
            </span>,
            <span
              style={{
                fontSize: 12.5,
                fontWeight: 800,
                whiteSpace: "nowrap",
              }}
            >
              {et.l}
            </span>,
          ];
        return onPick ? (
          <button
            type="button"
            onClick={() => onPick(on ? "" : et.k)}
            aria-pressed={on ? "true" : "false"}
            aria-label={et.l + " : " + nb + (on ? ", filtre actif" : ", filtrer")}
            style={{
              ...st,
              cursor: "pointer",
            }}
            key={et.k}
          >
            {inner}
          </button>
        ) : (
          <span role="img" aria-label={et.l + " : " + nb} style={st} key={et.k}>
            {inner}
          </span>
        );
      })}
    </div>
  );
}

export function kbChip(label, on, onClick, extra) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={on ? "true" : "false"}
      style={{
        flex: 1,
        minHeight: 44,
        borderRadius: 14,
        border: "2px solid " + (on ? "var(--ink)" : "var(--line-strong)"),
        background: on ? "var(--entete)" : "var(--surface)",
        color: on ? "#ffffff" : "var(--ink-soft)",
        fontSize: 14,
        fontWeight: 800,
        fontFamily: "inherit",
        cursor: "pointer",
        padding: "0 8px",
        ...(extra || {}),
      }}
      key={label}
    >
      {label}
    </button>
  );
}

export const KB_INPUT = {
  width: "100%",
  minHeight: 48,
  border: "2px solid var(--line-strong)",
  borderRadius: 14,
  padding: "10px 14px",
  fontSize: 16,
  fontFamily: "inherit",
  color: "var(--ink)",
  background: "var(--surface)",
  boxSizing: "border-box",
};

export const KB_LABEL = {
  display: "block",
  fontSize: 14,
  fontWeight: 800,
  color: "var(--ink-soft)",
  margin: "0 0 6px",
};

export function kbBouton(label, onClick, opts) {
  const o = opts || {};
  return (
    <button
      type={o.type || "button"}
      onClick={onClick}
      disabled={o.disabled}
      style={{
        width: o.width || "100%",
        minHeight: o.h || 52,
        border: o.outline ? "2px solid " + (o.bd || "var(--line-strong)") : 0,
        borderRadius: 16,
        background: o.outline ? "var(--surface)" : o.bg || "var(--teal-dark)",
        color: o.outline ? o.fg || "var(--ink)" : "#ffffff",
        fontSize: 15.5,
        fontWeight: 800,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        fontFamily: "inherit",
        cursor: "pointer",
        opacity: o.disabled ? 0.55 : 1,
        padding: "0 14px",
      }}
    >
      {o.icone ? accIcone(o.icone, 18, 2.6) : null}
      {label}
    </button>
  );
}

// ============================================================
// ACCUEIL
// ============================================================
