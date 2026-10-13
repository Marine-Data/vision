import React from "react";
import { contenuDe } from "../lib/contenu.js";
import { HWK_COLOR, HWK_STATUS } from "../lib/devoirs.js";
import { hwkFmt, hwkLate } from "../lib/format.js";
import { supabase } from "../lib/supabase.js";

export function DevoirsAncien({
  rows,
  setRows,
  loading,
  err,
  contenu: ctRows,
  edit: ctEdit,
  save: ctSave,
  add: ctAdd,
  del: ctDel,
}) {
  const [modeMat, setModeMat] = React.useState(!1);
  // Supprimer une matière encore utilisée par des devoirs ne suffit pas : la
  // liste des matières réunit les matières déclarées et celles réellement
  // employées, donc elle reviendrait aussitôt. On réaffecte d'abord.
  async function supprimerMatiere(o) {
    const utilises = (rows || []).filter((x) => x.subject === o.titre);
    if (utilises.length) {
      const dest = window.prompt(
        utilises.length +
          " devoir(s) utilisent « " +
          o.titre +
          " ». À quelle matière les rattacher ? (laisse vide pour annuler)",
        "Divers",
      );
      if (!dest || !dest.trim()) return;
      const nouvelle = dest.trim();
      setRows((p) =>
        p.map((x) =>
          x.subject === o.titre
            ? {
                ...x,
                subject: nouvelle,
              }
            : x,
        ),
      );
      const { error: E } = await supabase
        .from("vision_homework")
        .update({
          subject: nouvelle,
        })
        .eq("subject", o.titre);
      if (E) {
        window.alert("Impossible de réaffecter les devoirs : " + E.message);
        return;
      }
    }
    ctDel(o.id);
  }
  // Matières : celles enregistrées en base, plus toute matière déjà utilisée
  // par un devoir — pour qu'aucun devoir ne disparaisse des filtres.
  const matieres = [
    ...new Set([...contenuDe(ctRows, "matiere").map((x) => x.titre), ...(rows || []).map((x) => x.subject)]),
  ].filter(Boolean);
  const [open, setOpen] = React.useState(!1),
    [sel, setSel] = React.useState(null),
    [fSub, setFSub] = React.useState("Toutes"),
    [fDate, setFDate] = React.useState("Toutes"),
    [nSub, setNSub] = React.useState(""),
    [nTitle, setNTitle] = React.useState(""),
    [nDesc, setNDesc] = React.useState(""),
    [nDead, setNDead] = React.useState(""),
    [saving, setSaving] = React.useState(!1),
    [toast, setToast] = React.useState("");
  function flash(m) {
    setToast(m), setTimeout(() => setToast(""), 2200);
  }
  async function add() {
    if (!nTitle.trim() || !nDead) {
      flash("Titre et date obligatoires");
      return;
    }
    if (!nSub) {
      flash("Choisis une matière");
      return;
    }
    setSaving(!0);
    const { data: u } = await supabase.auth.getUser(),
      uid = u && u.user ? u.user.id : null;
    const { data: d, error: e } = await supabase
      .from("vision_homework")
      .insert({
        user_id: uid,
        subject: nSub,
        title: nTitle.trim(),
        description: nDesc.trim() || null,
        deadline: nDead,
        status: "À faire",
      })
      .select()
      .single();
    setSaving(!1);
    if (e) {
      flash("Erreur : " + e.message);
      return;
    }
    setRows((p) => [...p, d].sort((a, b) => (a.deadline || "").localeCompare(b.deadline || ""))),
      setOpen(!1),
      setNTitle(""),
      setNDesc(""),
      setNDead(""),
      flash("Sauvegardé ✓");
  }
  async function setStatus(id, st) {
    setRows((p) =>
      p.map((r) =>
        r.id === id
          ? {
              ...r,
              status: st,
            }
          : r,
      ),
    ),
      setSel((p) =>
        p && p.id === id
          ? {
              ...p,
              status: st,
            }
          : p,
      );
    const patch = {
      status: st,
      updated_at: new Date().toISOString(),
    };
    if (st === "Fait") patch.submitted_at = new Date().toISOString();
    if (st === "Corrigé") patch.corrected_at = new Date().toISOString();
    await supabase.from("vision_homework").update(patch).eq("id", id);
  }
  async function saveNotes(id, v) {
    setRows((p) =>
      p.map((r) =>
        r.id === id
          ? {
              ...r,
              notes: v,
            }
          : r,
      ),
    );
    await supabase
      .from("vision_homework")
      .update({
        notes: v,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id);
  }
  async function del(id) {
    if (!window.confirm("Supprimer ce devoir ?")) return;
    setRows((p) => p.filter((r) => r.id !== id)), setSel(null);
    await supabase.from("vision_homework").delete().eq("id", id);
  }
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const wk = new Date(now.getTime() + 6048e5);
  const shown = rows.filter((r) => {
    if (fSub !== "Toutes" && r.subject !== fSub) return !1;
    if (fDate === "Toutes") return !0;
    if (!r.deadline) return !1;
    const d = new Date(r.deadline + "T00:00:00");
    if (fDate === "Semaine prochaine") return d >= now && d <= wk;
    if (fDate === "En retard") return hwkLate(r.deadline, r.status);
    return !0;
  });
  const done = rows.filter((r) => r.status === "Fait" || r.status === "Corrigé").length;
  const btn = (active) => ({
    padding: "6px 12px",
    borderRadius: 8,
    border: "1px solid " + (active ? "var(--oxblood)" : "var(--line)"),
    background: active ? "var(--oxblood)" : "#fff",
    color: active ? "#fff" : "inherit",
    cursor: "pointer",
    fontSize: 13,
    marginRight: 6,
    marginBottom: 6,
  });
  const inp = {
    width: "100%",
    minHeight: "var(--tap)",
    padding: "11px 13px",
    borderRadius: "var(--radius-sm)",
    background: "var(--surface-alt)",
    border: "1.5px solid var(--line)",
    fontSize: 14,
    marginTop: 4,
    boxSizing: "border-box",
    fontFamily: "inherit",
  };
  if (sel) {
    const r = rows.find((x) => x.id === sel.id) || sel;
    return (
      <section className="sec">
        <div className="detail-header">
          <button className="back-btn" onClick={() => setSel(null)}>
            ← Retour aux devoirs
          </button>
        </div>
        <h2>{r.title}</h2>
        <p className="sub">
          {r.subject}
          {" · échéance "}
          {hwkFmt(r.deadline)}
        </p>
        {r.description ? (
          <div className="card">
            <div className="detail">{r.description}</div>
          </div>
        ) : null}
        <div className="h3">Statut</div>
        <div>
          {HWK_STATUS.map((s) => (
            <button style={btn(r.status === s)} onClick={() => setStatus(r.id, s)} key={s}>
              {s}
            </button>
          ))}
        </div>
        <div className="h3">Notes</div>
        <textarea
          style={{
            ...inp,
            minHeight: 150,
            resize: "vertical",
          }}
          defaultValue={r.notes || ""}
          placeholder="Notes prises pendant / après le cours…"
          onBlur={(e) => saveNotes(r.id, e.target.value)}
        />
        <div
          className="detail"
          style={{
            marginTop: 4,
          }}
        >
          Sauvegardé automatiquement en quittant le champ.
        </div>
        <div
          style={{
            marginTop: 22,
          }}
        >
          <button
            style={{
              ...btn(!1),
              borderColor: "rgba(221,95,67,.45)",
              color: "var(--red)",
            }}
            onClick={() => del(r.id)}
          >
            Supprimer ce devoir
          </button>
        </div>
        {toast ? (
          <div
            className="detail"
            style={{
              marginTop: 10,
              color: "var(--green)",
            }}
          >
            {toast}
          </div>
        ) : null}
      </section>
    );
  }
  return (
    <section className="sec">
      <h2>Devoirs</h2>
      <p className="sub">
        {done}
        {" / "}
        {rows.length}
        {" devoirs terminés."}
      </p>
      <div>
        <button
          style={{
            ...btn(!0),
            padding: "9px 16px",
          }}
          onClick={() => setOpen(!0)}
        >
          + Ajouter un devoir
        </button>
      </div>
      {open ? (
        <div
          className="card"
          style={{
            marginTop: 10,
          }}
        >
          <div
            className="h3"
            style={{
              marginTop: 0,
            }}
          >
            Nouveau devoir
          </div>
          <div className="detail">Matière</div>
          <div>
            {matieres.map((s) => (
              <button style={btn(nSub === s)} onClick={() => setNSub(s)} key={s}>
                {s}
              </button>
            ))}
          </div>
          <div
            className="detail"
            style={{
              marginTop: 8,
            }}
          >
            Titre
          </div>
          <input
            style={inp}
            value={nTitle}
            placeholder="Ex. Présenter une app"
            onChange={(e) => setNTitle(e.target.value)}
          />
          <div
            className="detail"
            style={{
              marginTop: 8,
            }}
          >
            Description (optionnel)
          </div>
          <textarea
            style={{
              ...inp,
              minHeight: 70,
              resize: "vertical",
            }}
            value={nDesc}
            onChange={(e) => setNDesc(e.target.value)}
          />
          <div
            className="detail"
            style={{
              marginTop: 8,
            }}
          >
            Échéance
          </div>
          <input type="date" style={inp} value={nDead} onChange={(e) => setNDead(e.target.value)} />
          <div
            style={{
              marginTop: 14,
            }}
          >
            <button
              style={{
                ...btn(!0),
                padding: "9px 16px",
              }}
              disabled={saving}
              onClick={add}
            >
              {saving ? "Sauvegarde…" : "Sauvegarder"}
            </button>
            <button style={btn(!1)} onClick={() => setOpen(!1)}>
              Annuler
            </button>
          </div>
        </div>
      ) : null}
      {toast ? (
        <div
          className="detail"
          style={{
            marginTop: 8,
            color: "var(--green)",
          }}
        >
          {toast}
        </div>
      ) : null}
      <div className="h3">Matières</div>
      <button className="btn-outline btn-sm" onClick={() => setModeMat(!modeMat)}>
        {modeMat ? "✓ Terminer" : "✎ Gérer les matières"}
      </button>
      {modeMat && (
        <div
          className="card"
          style={{
            marginTop: 8,
          }}
        >
          <div className="editable-hint">
            Renommer une matière ne renomme pas les devoirs déjà enregistrés : ils gardent l'ancienne, qui
            reste proposée dans les filtres. Supprimer une matière encore utilisée te demandera d'abord à
            quelle autre matière rattacher ces devoirs — sinon elle reviendrait toute seule dans la liste.
          </div>
          {contenuDe(ctRows, "matiere").map((o) => (
            <div className="brow" key={o.id}>
              <input
                className="bedit lbl"
                value={o.titre || ""}
                placeholder="Matière"
                aria-label="Nom de la matière"
                onChange={(w) =>
                  ctEdit(o.id, {
                    titre: w.target.value,
                  })
                }
                onBlur={() => ctSave(o.id)}
              />
              <button
                className="bdel"
                onClick={() => supprimerMatiere(o)}
                aria-label="Supprimer cette matière"
              >
                ×
              </button>
            </div>
          ))}
          <button className="badd" onClick={() => ctAdd("matiere")}>
            + Ajouter une matière
          </button>
        </div>
      )}
      <div className="h3">Filtres</div>
      <div>
        {[...matieres, "Toutes"].map((s) => (
          <button style={btn(fSub === s)} onClick={() => setFSub(s)} key={s}>
            {s}
          </button>
        ))}
      </div>
      <div
        style={{
          marginTop: 4,
        }}
      >
        {["Toutes", "Semaine prochaine", "En retard"].map((s) => (
          <button style={btn(fDate === s)} onClick={() => setFDate(s)} key={s}>
            {s}
          </button>
        ))}
      </div>
      <div className="h3">Liste</div>
      {loading ? (
        <div className="detail">Chargement…</div>
      ) : err ? (
        <div
          className="detail"
          style={{
            color: "var(--red)",
          }}
        >
          {"Erreur : " + err}
        </div>
      ) : shown.length === 0 ? (
        <div className="card">
          <div className="detail">Aucun devoir pour ce filtre.</div>
        </div>
      ) : (
        <div>
          {shown.map((r) => (
            <div
              className="card"
              style={{
                cursor: "pointer",
                marginBottom: 8,
                borderLeft: "4px solid " + (HWK_COLOR[r.status] || "var(--line-strong)"),
              }}
              onClick={() => setSel(r)}
              key={r.id}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: 10,
                  alignItems: "baseline",
                }}
              >
                <b>{r.title}</b>
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: "nowrap",
                    color: HWK_COLOR[r.status] || "var(--slate)",
                  }}
                >
                  {r.status}
                </span>
              </div>
              <div
                className="detail"
                style={{
                  marginTop: 3,
                  color: hwkLate(r.deadline, r.status) ? "var(--red)" : void 0,
                }}
              >
                {r.subject}
                {" · "}
                {hwkFmt(r.deadline)}
                {hwkLate(r.deadline, r.status) ? " · en retard" : ""}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
