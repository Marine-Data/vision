import React, { useState, useEffect, useMemo } from 'react';

/**
 * BudgetMensuel — Reproduit le tableau Excel exactement
 *
 * Structure :
 * 1. DÉPENSES COURANTES (12 postes)
 * 2. ÉPARGNE PROGRAMMÉE (2 postes)
 * 3. SOLDE (total)
 * 4. SALAIRE MENSUEL (revenu)
 * 5. PROVISION VACANCES (compteur cumulatif)
 * 6. ÉPARGNE (compteur cumulatif)
 *
 * Props:
 * - budget: array de lignes vision_budget avec categorie
 * - transactions: array de vision_transactions
 * - poches: array de vision_poches
 * - items: array de vision_items (pour pocketCalc)
 * - params: array de vision_params
 * - moisIndex: numéro du mois (0 = ancre)
 * - onSelectMonth: callback (moisIndex)
 * - onTransactionClick: callback (budget_line_id) pour afficher détail
 */
function BudgetMensuel({
  budget = [],
  transactions = [],
  poches = [],
  items = [],
  params = [],
  moisIndex = 0,
  onSelectMonth = () => {},
  onTransactionClick = () => {},
  anneeMoisDe = (i) => { const d = new Date(2026, 7, 1); d.setMonth(d.getMonth() + i); return { annee: d.getFullYear(), mois: d.getMonth() }; },
  pocketCalc = () => [],
  planEpargne = () => [],
  reelDisponible = () => 0,
}) {
  // ============================================================
  // 1. CALCULS RÉALISÉS (agrégation vision_transactions)
  // ============================================================

  const realisedByLine = useMemo(() => {
    const map = {};
    transactions
      .filter(txn => txn.mois_index === moisIndex)
      .forEach(txn => {
        if (!map[txn.budget_line_id]) map[txn.budget_line_id] = 0;
        map[txn.budget_line_id] += txn.montant;
      });
    return map;
  }, [transactions, moisIndex]);

  // ============================================================
  // 2. GROUPER PAR CATÉGORIE
  // ============================================================

  const parCategorie = useMemo(() => {
    const grouped = { courantes: [], epargne: [], null: [] };

    budget.forEach(line => {
      const cat = line.categorie || 'null'; // null → revenus
      const reel = realisedByLine[line.id] || 0;
      const ecart = line.montant - reel;

      const item = {
        ...line,
        reel,
        ecart,
        pourcentage: line.montant > 0 ? ((reel / line.montant) * 100).toFixed(1) : '0',
      };

      if (cat === 'courantes') grouped.courantes.push(item);
      else if (cat === 'epargne') grouped.epargne.push(item);
      else grouped.null.push(item); // revenus
    });

    return grouped;
  }, [budget, realisedByLine]);

  // ============================================================
  // 3. TOTAUX PAR SECTION
  // ============================================================

  const totalCourantes = useMemo(() => ({
    budget: parCategorie.courantes.reduce((sum, l) => sum + l.montant, 0),
    reel: parCategorie.courantes.reduce((sum, l) => sum + l.reel, 0),
  }), [parCategorie.courantes]);

  const totalEpargne = useMemo(() => ({
    budget: parCategorie.epargne.reduce((sum, l) => sum + l.montant, 0),
    reel: parCategorie.epargne.reduce((sum, l) => sum + l.reel, 0),
  }), [parCategorie.epargne]);

  totalCourantes.ecart = totalCourantes.budget - totalCourantes.reel;
  totalEpargne.ecart = totalEpargne.budget - totalEpargne.reel;

  const solde = {
    budget: totalCourantes.budget + totalEpargne.budget,
    reel: totalCourantes.reel + totalEpargne.reel,
  };
  solde.ecart = solde.budget - solde.reel;

  // ============================================================
  // 4. SALAIRE (revenu)
  // ============================================================

  const salaire = useMemo(() => {
    const salaireLine = parCategorie.null.find(l => l.kind === 'revenu');
    if (!salaireLine) return { budget: 0, reel: 0, ecart: 0 };
    return {
      id: salaireLine.id,
      budget: salaireLine.montant,
      reel: salaireLine.reel,
      ecart: salaireLine.ecart,
      poste: salaireLine.poste,
    };
  }, [parCategorie.null]);

  // ============================================================
  // 5. PROVISIONS CUMULÉES (pocketCalc pour chaque poche)
  // ============================================================

  const provisionsCalcs = useMemo(() => {
    const calcs = {};
    poches
      .filter(p => p.statut === 'actif')
      .forEach(pocket => {
        const cumul = pocketCalc(items, pocket, params, moisIndex, 'cumul');
        calcs[pocket.id] = {
          id: pocket.id,
          label: pocket.label,
          montant: cumul[moisIndex] || 0,
          seuil: pocket.seuil_bas || null,
        };
      });
    return calcs;
  }, [poches, pocketCalc, items, params, moisIndex]);

  // ============================================================
  // 6. ÉPARGNE CUMULÉE (planEpargne + reelDisponible)
  // ============================================================

  const epargneCalcs = useMemo(() => {
    const plan = planEpargne(items, params, moisIndex);
    const planVal = plan[moisIndex] || 0;

    const reel = params.find(p => p.param_key === `reel_${moisIndex}`)?.montant || 0;
    const dispo = reelDisponible(params, poches, items, moisIndex);

    return {
      prevu: planVal,
      reel,
      dispo,
    };
  }, [planEpargne, reelDisponible, items, params, poches, moisIndex]);

  // ============================================================
  // 7. SÉLECTEUR DE MOIS
  // ============================================================

  const moisActuel = anneeMoisDe(moisIndex);
  const mois_label = `${moisActuel.annee}-${String(moisActuel.mois + 1).padStart(2, '0')}`;

  const handlePrevMonth = () => onSelectMonth(moisIndex - 1);
  const handleNextMonth = () => onSelectMonth(moisIndex + 1);

  // ============================================================
  // RENDU
  // ============================================================

  return (
    <div className="budget-mensuel" style={styles.container}>
      {/* ========== HEADER ========== */}
      <div style={styles.header}>
        <h2 style={styles.title}>📊 Budget — {mois_label}</h2>

        <div style={styles.selector}>
          <button onClick={handlePrevMonth} style={styles.btn}>←</button>
          <select
            value={moisIndex}
            onChange={(e) => onSelectMonth(parseInt(e.target.value))}
            style={styles.select}
          >
            {[...Array(24)].map((_, i) => {
              const date = anneeMoisDe(i);
              const label = `${date.annee}-${String(date.mois + 1).padStart(2, '0')}`;
              return <option key={i} value={i}>{label}</option>;
            })}
          </select>
          <button onClick={handleNextMonth} style={styles.btn}>→</button>
        </div>
      </div>

      {/* ========== DÉPENSES COURANTES ========== */}
      <Section title="💰 DÉPENSES COURANTES" style={styles.section}>
        <Table
          items={parCategorie.courantes}
          total={totalCourantes}
          onRowClick={(line) => onTransactionClick(line.id)}
        />
      </Section>

      {/* ========== ÉPARGNE PROGRAMMÉE ========== */}
      <Section title="🏦 ÉPARGNE PROGRAMMÉE" style={styles.section}>
        <Table
          items={parCategorie.epargne}
          total={totalEpargne}
          onRowClick={(line) => onTransactionClick(line.id)}
        />
      </Section>

      {/* ========== SOLDE ========== */}
      <Section title="⚖️ SOLDE" style={styles.section}>
        <SummaryRow
          label="Total mensuel"
          budget={solde.budget}
          reel={solde.reel}
          ecart={solde.ecart}
          isBold
        />
      </Section>

      {/* ========== SALAIRE ========== */}
      <Section title="💵 SALAIRE MENSUEL" style={styles.section}>
        <SummaryRow
          label={salaire.poste || 'Salaire'}
          budget={salaire.budget}
          reel={salaire.reel}
          ecart={salaire.ecart}
        />
      </Section>

      {/* ========== PROVISIONS CUMULÉES ========== */}
      <Section title="📦 PROVISIONS CUMULÉES" style={styles.section}>
        {Object.values(provisionsCalcs).map((prov) => (
          <div key={prov.id} style={styles.provisionItem}>
            <span style={styles.provisionLabel}>{prov.label}</span>
            <span style={styles.provisionValue}>{prov.montant.toFixed(2)}€</span>
            {prov.seuil && (
              <div style={styles.progressBar}>
                <div
                  style={{
                    ...styles.progressFill,
                    width: `${Math.min((prov.montant / prov.seuil) * 100, 100)}%`,
                  }}
                />
              </div>
            )}
          </div>
        ))}
      </Section>

      {/* ========== ÉPARGNE TOTALE ========== */}
      <Section title="💎 ÉPARGNE TOTALE" style={styles.section}>
        <SummaryRow
          label="Épargne prévue (mois)"
          budget={epargneCalcs.prevu}
          reel={'-'}
          ecart={'-'}
        />
        <SummaryRow
          label="Épargne réelle (BoursoBank)"
          budget={epargneCalcs.reel}
          reel={'-'}
          ecart={'-'}
        />
        <SummaryRow
          label="Épargne dispo (après provisions)"
          budget={epargneCalcs.dispo}
          reel={'-'}
          ecart={'-'}
          isBold
        />
      </Section>
    </div>
  );
}

// ============================================================
// SOUS-COMPOSANTS
// ============================================================

function Section({ title, children, style }) {
  return (
    <section style={{ ...styles.sectionContainer, ...style }}>
      <h3 style={styles.sectionTitle}>{title}</h3>
      {children}
    </section>
  );
}

function Table({ items, total, onRowClick }) {
  return (
    <div style={styles.tableContainer}>
      <table style={styles.table}>
        <thead>
          <tr style={styles.thead}>
            <th style={styles.th}>Poste</th>
            <th style={styles.thNumber}>Budget</th>
            <th style={styles.thNumber}>Réalisé</th>
            <th style={styles.thNumber}>Écart</th>
          </tr>
        </thead>
        <tbody>
          {items.map((line) => (
            <tr
              key={line.id}
              style={{
                ...styles.tr,
                cursor: 'pointer',
                opacity: 0.9,
                ':hover': { opacity: 1 },
              }}
              onClick={() => onRowClick(line)}
            >
              <td style={styles.td}>{line.poste}</td>
              <td style={{ ...styles.td, ...styles.tdNumber }}>
                {line.montant.toFixed(2)}€
              </td>
              <td style={{ ...styles.td, ...styles.tdNumber }}>
                {line.reel.toFixed(2)}€
              </td>
              <td
                style={{
                  ...styles.td,
                  ...styles.tdNumber,
                  color: line.ecart > 0 ? '#2ecc71' : '#e74c3c', // vert si surplus, rouge si dépasse
                }}
              >
                {(line.ecart > 0 ? '+' : '')}{line.ecart.toFixed(2)}€
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={styles.tfootTr}>
            <td style={{ ...styles.td, fontWeight: 'bold' }}>Total</td>
            <td style={{ ...styles.td, ...styles.tdNumber, fontWeight: 'bold' }}>
              {total.budget.toFixed(2)}€
            </td>
            <td style={{ ...styles.td, ...styles.tdNumber, fontWeight: 'bold' }}>
              {total.reel.toFixed(2)}€
            </td>
            <td
              style={{
                ...styles.td,
                ...styles.tdNumber,
                fontWeight: 'bold',
                color: total.ecart > 0 ? '#2ecc71' : '#e74c3c',
              }}
            >
              {(total.ecart > 0 ? '+' : '')}{total.ecart.toFixed(2)}€
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

function SummaryRow({ label, budget, reel, ecart, isBold }) {
  return (
    <div style={{ ...styles.summaryRow, fontWeight: isBold ? 'bold' : 'normal' }}>
      <span style={styles.summaryLabel}>{label}</span>
      <div style={styles.summaryValues}>
        <span>{typeof budget === 'number' ? `${budget.toFixed(2)}€` : budget}</span>
        <span style={styles.summaryEcart}>{typeof ecart === 'number' ? `${(ecart > 0 ? '+' : '')}${ecart.toFixed(2)}€` : ecart}</span>
      </div>
    </div>
  );
}

// ============================================================
// STYLES (inline pour simplicité)
// ============================================================

const styles = {
  container: {
    maxWidth: '1000px',
    margin: '0 auto',
    padding: '20px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    color: '#333',
    lineHeight: '1.6',
  },
  header: {
    marginBottom: '30px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '20px',
  },
  title: {
    margin: 0,
    fontSize: '24px',
    fontWeight: '700',
    color: '#0e3a42',
  },
  selector: {
    display: 'flex',
    gap: '10px',
    alignItems: 'center',
  },
  btn: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
    backgroundColor: '#f5f5f5',
    ':hover': {
      backgroundColor: '#e0e0e0',
    },
  },
  select: {
    padding: '8px 12px',
    fontSize: '14px',
    border: '1px solid #ccc',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  section: {
    marginBottom: '30px',
  },
  sectionContainer: {
    border: '1px solid #e0e0e0',
    borderRadius: '6px',
    padding: '20px',
    backgroundColor: '#fafafa',
  },
  sectionTitle: {
    margin: '0 0 15px 0',
    fontSize: '16px',
    fontWeight: '600',
    color: '#0e3a42',
    borderBottom: '2px solid #0e9fb2',
    paddingBottom: '10px',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  thead: {
    backgroundColor: '#f0f0f0',
  },
  th: {
    padding: '12px',
    textAlign: 'left',
    fontWeight: '600',
    borderBottom: '2px solid #ccc',
    fontSize: '13px',
  },
  thNumber: {
    textAlign: 'right',
  },
  tr: {
    borderBottom: '1px solid #e0e0e0',
    ':hover': {
      backgroundColor: '#f9f9f9',
    },
  },
  td: {
    padding: '12px',
    fontSize: '14px',
  },
  tdNumber: {
    textAlign: 'right',
    fontFamily: 'monospace',
  },
  tfootTr: {
    backgroundColor: '#f0f0f0',
    borderTop: '2px solid #ccc',
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px 0',
    borderBottom: '1px solid #e0e0e0',
    fontSize: '14px',
  },
  summaryLabel: {
    flex: 1,
  },
  summaryValues: {
    display: 'flex',
    gap: '30px',
    fontFamily: 'monospace',
    fontWeight: '600',
  },
  summaryEcart: {
    minWidth: '120px',
    textAlign: 'right',
  },
  provisionItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '15px',
    padding: '10px 0',
    borderBottom: '1px solid #e0e0e0',
  },
  provisionLabel: {
    flex: 1,
    fontSize: '14px',
  },
  provisionValue: {
    fontFamily: 'monospace',
    fontWeight: '600',
    fontSize: '14px',
    minWidth: '80px',
    textAlign: 'right',
  },
  progressBar: {
    width: '150px',
    height: '8px',
    backgroundColor: '#e0e0e0',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0e9fb2',
    transition: 'width 0.3s',
  },
};

export default BudgetMensuel;
