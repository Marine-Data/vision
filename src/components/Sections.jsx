import {
  chronologie, semaine, semaineNotes, suivi, budgetEcheancier, budgetRecap,
  budgetMensuel, epargneProjection, vacances, sportSlots, pieces,
} from '../data/dossier.js'

/* ---------- Aperçu ---------- */
export function Apercu() {
  return (
    <section className="sec">
      <h2>Chronologie de l'année</h2>
      <p className="sub">Septembre 2026 → juillet 2027, tous dispositifs confondus.</p>
      <div className="card">
        {chronologie.map((t, i) => (
          <div className="tl" key={i}>
            <div className="when">{t.when}</div>
            <div className="what">{t.what}</div>
            <div className="det">{t.det}</div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ---------- Emploi du temps ---------- */
export function Planning() {
  return (
    <section className="sec">
      <h2>Emploi du temps</h2>
      <p className="sub">Deux points fixes : sport jeudi soir et dimanche après-midi. Le reste des soirées peut accueillir un cours.</p>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Jour</th><th>Journée</th><th>Soirée</th></tr></thead>
          <tbody>
            {semaine.map((d, i) => (
              <tr key={i} className={d.fixe ? 'total' : ''}>
                <td><b>{d.jour}</b></td><td>{d.journee}</td>
                <td style={d.fixe ? { color: 'var(--oxblood)', fontWeight: 600 } : {}}>{d.soir}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {semaineNotes.map((n, i) => (
        <div className={'note' + (i === 2 ? ' red' : '')} key={i}>{n}</div>
      ))}
    </section>
  )
}

/* ---------- Suivi (cochable) ---------- */
export function Suivi({ progress, toggle }) {
  const done = suivi.filter((s) => progress[s.key]).length
  const pct = Math.round((done / suivi.length) * 100)
  return (
    <section className="sec">
      <h2>Tableau de suivi</h2>
      <p className="sub">{done} / {suivi.length} étapes faites · coché = sauvegardé automatiquement.</p>
      <div className="prog"><i style={{ width: pct + '%' }} /></div>
      <div className="note red"><b>⚠ Ouverture des inscriptions SCAP : lundi 17 août 2026 à 10h</b> (clôture le 7 septembre). Les horaires des cours s'affichent à ce moment-là.</div>
      <div className="card" style={{ padding: '4px 12px' }}>
        {suivi.map((s) => (
          <label className={'check' + (progress[s.key] ? ' done' : '')} key={s.key}>
            <input type="checkbox" checked={!!progress[s.key]} onChange={() => toggle(s.key)} />
            <span className="lbl">
              <b>{s.etape}</b>
              <span className="meta">{s.echeance}{s.action !== '—' ? ' · ' + s.action : ''}</span>
            </span>
          </label>
        ))}
      </div>
    </section>
  )
}

/* ---------- Budget ---------- */
export function Budget() {
  return (
    <section className="sec">
      <h2>Budget &amp; échéancier</h2>
      <p className="sub">Coût de la reconversion en autofinancement intégral.</p>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Échéance</th><th>Poste</th><th className="num">Montant</th></tr></thead>
          <tbody>
            {budgetEcheancier.map((r, i) => (
              <tr key={i}><td>{r.echeance}</td><td>{r.poste}</td><td className="num">{r.montant}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="h3">Récapitulatif</div>
      <div className="card" style={{ padding: 0 }}>
        <table className="tbl">
          <tbody>
            {budgetRecap.map((r, i) => (
              <tr key={i} className={r.total ? 'total' : ''}>
                <td>{r.poste}</td><td className="num">{r.montant}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="note">Autofinancement intégral : pas de CPF ni d'employeur. Impact sur l'épargne détaillé dans l'onglet Trésorerie.</div>
    </section>
  )
}

/* ---------- Trésorerie ---------- */
export function Tresorerie() {
  return (
    <section className="sec">
      <h2>Trésorerie</h2>
      <p className="sub">Budget mensuel à l'équilibre + modèle d'épargne.</p>

      <div className="h3">Budget mensuel</div>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Poste</th><th>Détail</th><th className="num">/ mois</th></tr></thead>
          <tbody>
            {budgetMensuel.map((r, i) => (
              <tr key={i} className={r.total ? 'total' : ''}>
                <td>{r.poste}</td><td className="detail">{r.detail}</td>
                <td className={'num' + (r.pos ? ' pos' : '')}>{r.montant}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="note red"><b>Objectif : 12 900 € (6 mois de salaire) sur les livrets avant le PEA — déjà atteint</b> (13 321,59 € à la mi-août). Le DU fait plonger le matelas à ≈ 9 660 € fin 2026, puis il remonte au-dessus de 12 900 € vers juillet 2027.</div>

      <div className="h3">Projection épargne (livrets)</div>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Mois</th><th className="num">Épargne</th><th>Événement</th><th className="num">Solde</th></tr></thead>
          <tbody>
            {epargneProjection.map((r, i) => (
              <tr key={i}>
                <td>{r.mois}</td><td className="num pos">{r.ep}</td>
                <td className={r.low ? 'low' : ''}>{r.evt}</td>
                <td className={'num' + (r.low ? ' low' : r.ok ? ' ok' : '')}>{r.solde}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="h3">Provision vacances — 430 €/mois</div>
      <div className="card" style={{ padding: 0, overflowX: 'auto' }}>
        <table className="tbl">
          <thead><tr><th>Mois</th><th className="num">Virement</th><th>Dépenses</th><th className="num">Solde</th></tr></thead>
          <tbody>
            {vacances.map((r, i) => (
              <tr key={i}><td>{r.mois}</td><td className="num">{r.v}</td><td className="detail">{r.dep}</td><td className="num">{r.solde}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  )
}

/* ---------- Sport ---------- */
export function Sport() {
  return (
    <section className="sec">
      <h2>Sport</h2>
      <p className="sub"><b>En Avant! de Paris</b> — Free Style Gym, cotisation annuelle (600 €, 2 cours/semaine) + entraînement libre le soir.</p>
      <div className="card">
        {sportSlots.map((s, i) => (
          <div className="check" key={i} style={{ borderBottom: i < 2 ? '1px solid var(--line)' : 0 }}>
            <span className="di">{s.di}</span>
            <span className="lbl"><b>{s.nom}</b><span className="meta">{s.quand}</span></span>
          </div>
        ))}
      </div>
      <div>
        <span className="chip">Fixe · jeudi 20h–22h</span>
        <span className="chip">Fixe · dimanche 14h–16h</span>
        <span className="chip free">Libre · le soir</span>
      </div>
      <div className="note red"><b>S'inscrire maintenant ou attendre les horaires SCAP ?</b> Tu ne sauras qu'à l'inscription SCAP si une session tombe le jeudi soir. Attends tes créneaux SCAP, ou inscris-toi après avoir demandé au club l'encaissement du chèque et sa politique de remboursement.</div>
      <div className="note">À préparer : certificat médical de moins de 3 mois + chèque de 600 € à l'ordre de « En avant de Paris ».</div>
    </section>
  )
}

/* ---------- Pièces (cochable) ---------- */
export function Pieces({ progress, toggle }) {
  const all = pieces.flatMap((g) => g.items)
  const done = all.filter((it) => progress[it.key]).length
  const pct = Math.round((done / all.length) * 100)
  return (
    <section className="sec">
      <h2>Pièces à fournir</h2>
      <p className="sub">{done} / {all.length} pièces prêtes · coché = sauvegardé.</p>
      <div className="prog"><i style={{ width: pct + '%' }} /></div>
      {pieces.map((g, i) => (
        <div key={i}>
          <div className="h3">{g.titre}</div>
          <div className="card" style={{ padding: '4px 12px' }}>
            {g.items.map((it) => (
              <label className={'check' + (progress[it.key] ? ' done' : '')} key={it.key}>
                <input type="checkbox" checked={!!progress[it.key]} onChange={() => toggle(it.key)} />
                <span className="lbl"><b>{it.label}</b></span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </section>
  )
}
