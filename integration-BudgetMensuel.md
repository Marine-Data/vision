# Intégration du composant BudgetMensuel

## 1. Structure générale

Le composant `BudgetMensuel.jsx` reprend la structure Excel **exactement** :

```
┌─────────────────────────────────────────────────┐
│ Budget — 2026-09                                │
├─────────────────────────────────────────────────┤
│
│ 💰 DÉPENSES COURANTES
│ ┌──────────────┬────────┬────────┬─────────┐
│ │ Poste        │ Budget │ Réalisé│ Écart   │
│ ├──────────────┼────────┼────────┼─────────┤
│ │ Abonnements  │ 81.97  │ 58.57  │ +23.40  │
│ │ ...          │        │        │         │
│ ├──────────────┼────────┼────────┼─────────┤
│ │ Total        │ 1373   │ 1219   │ +154    │
│ └──────────────┴────────┴────────┴─────────┘
│
│ 🏦 ÉPARGNE PROGRAMMÉE
│ ... (structure identique)
│
│ ⚖️ SOLDE
│ Total mensuel : 2248 | 2094 | +154
│
│ 💵 SALAIRE MENSUEL
│ Salaire : 2150 | 2080.48 | -69.52
│
│ 📦 PROVISIONS CUMULÉES
│ Vacances: 762€ ████████░░░░ (seuil: 1500€)
│ Formation: 3200€
│ Sport: 520€
│
│ 💎 ÉPARGNE TOTALE
│ Épargne prévue: 6930€
│ Épargne réelle: 6850€
│ Épargne dispo: 5975€ (après provisions)
│
└─────────────────────────────────────────────────┘
```

---

## 2. Props attendues

```jsx
<BudgetMensuel
  // Données brutes (lecture seule)
  budget={budgetRows}              // array de vision_budget + vision_budget_mois
  transactions={txnRows}            // array de vision_transactions
  poches={pouchRows}                // array de vision_poches
  items={itemRows}                  // array de vision_items
  params={paramRows}                // array de vision_params
  
  // État du composant
  moisIndex={selectedMonth}         // numéro du mois (0 = août 2026)
  
  // Callbacks
  onSelectMonth={(index) => {...}}  // Appelé quand l'utilisateur change de mois
  onTransactionClick={(lineId) => {...}}  // Appelé au clic sur une ligne
  
  // Fonctions de calcul (réutiliser celles du code existant)
  anneeMoisDe={(index) => {}}      // Convertit mois_index → {annee, mois}
  pocketCalc={(items, pocket, params, moisIndex, mode) => []}  // Calcule provisions
  planEpargne={(items, params, moisIndex) => []}  // Épargne prévue par mois
  reelDisponible={(params, poches, items, moisIndex) => number}  // Épargne dispo
/>
```

---

## 3. Intégration dans le fichier index.html

### Étape A : Importer le composant dans App.jsx

Ajoute à la navigation (là où se trouvent les autres onglets) :

```javascript
import BudgetMensuel from './BudgetMensuel';

// Dans la liste des onglets (où sont Aperçu, Planning, Suivi, etc.)
const tabs = [
  { id: 'apercu', label: 'Aperçu', component: Apercu },
  { id: 'planning', label: 'Planning', component: Planning },
  { id: 'suivi', label: 'Suivi', component: Suivi },
  { id: 'budget-mensuel', label: '📊 Budget mensuel', component: BudgetMensuel },  // ← NOUVEAU
  { id: 'budget', label: 'Budget (reconversion)', component: Budget },
  { id: 'tresorerie', label: 'Trésorerie', component: Tresorerie },
  // ... reste des onglets
];
```

### Étape B : Passer les props au composant

Dans le code qui rend les onglets, utilise l'état global (Supabase) :

```javascript
{activeTab === 'budget-mensuel' && (
  <BudgetMensuel
    budget={budgetRows}           // État Supabase
    transactions={transactionRows} // État Supabase
    poches={pocheRows}            // État Supabase
    items={itemRows}              // État Supabase
    params={paramRows}            // État Supabase
    
    moisIndex={moisIndex}         // État local
    
    onSelectMonth={(index) => setMoisIndex(index)}
    onTransactionClick={(lineId) => {
      // Afficher un modal/détail des transactions du mois pour ce poste
      console.log('Clic sur poste:', lineId, 'mois:', moisIndex);
      // À implémenter : modal avec liste transactions
    }}
    
    anneeMoisDe={anneeMoisDe}
    pocketCalc={pocketCalc}
    planEpargne={planEpargne}
    reelDisponible={reelDisponible}
  />
)}
```

### Étape C : Gérer l'état du mois sélectionné

```javascript
// Dans le composant App ou état global
const [moisIndex, setMoisIndex] = useState(0);

// Ou si mois_index est déjà dans l'état global:
const moisIndex = globalState.selectedMoisIndex;
const setMoisIndex = (index) => updateGlobalState({ selectedMoisIndex: index });
```

---

## 4. Cas d'usage : clic sur une ligne

Quand l'utilisateur clique sur "Abonnements", afficher les transactions de ce mois pour ce poste :

```javascript
onTransactionClick={(line) => {
  const txnsForLine = transactions.filter(t => 
    t.budget_line_id === line.id && t.mois_index === moisIndex
  );
  
  // Afficher un modal ou une table détail
  showTransactionDetail({
    poste: line.poste,
    moisIndex: moisIndex,
    transactions: txnsForLine,
    total: txnsForLine.reduce((sum, t) => sum + t.montant, 0),
  });
}}
```

---

## 5. Dépendances et compatibilité

### Imports utilisés
```javascript
import React, { useState, useEffect, useMemo } from 'react';
```

✅ React 18+ (hooks)
✅ Pas de dépendances externes (tout inline)
✅ Styles CSS-in-JS (inline)

### Navigateurs
✅ Chrome, Firefox, Safari, Edge (ES2020+)
✅ Mobile-friendly (flexbox)

---

## 6. Intégration des fonctions de calcul

Les trois fonctions (`pocketCalc`, `planEpargne`, `reelDisponible`) existent déjà dans le code (lignes 17272+ du index.html minifié).

**Tu dois les passer comme props** au lieu de les refaire :

```javascript
// Dans App.jsx, cherche ces fonctions et passe-les:

const pocketCalcFn = (items, pocket, params, moisIndex, mode) => {
  // Signature existante du code
  return pocketCalc(items, pocket, params.monthlyRate || 500, moisIndex, mode);
};

const planEpargeFn = (items, params, moisIndex) => {
  // Signature existante du code
  return planEpargne(items, params, moisIndex);
};

const reelDisponibleFn = (params, poches, items, moisIndex) => {
  // Signature existante du code
  return reelDisponible(rawReel, calcs, moisIndex);
};

// Puis passe-les:
<BudgetMensuel
  ...
  pocketCalc={pocketCalcFn}
  planEpargne={planEpargeFn}
  reelDisponible={reelDisponibleFn}
/>
```

---

## 7. Checklist d'implémentation

- [ ] Copier `BudgetMensuel.jsx` dans le dossier des composants
- [ ] Importer dans `App.jsx`
- [ ] Ajouter tab dans la navigation
- [ ] Passer les props (budget, transactions, poches, items, params)
- [ ] Passer les callbacks (onSelectMonth, onTransactionClick)
- [ ] Passer les fonctions de calcul
- [ ] Tester avec un mois de données réelles
- [ ] Implémenter le modal "détail transactions" au clic
- [ ] Vérifier l'affichage sur mobile

---

## 8. Étapes suivantes (après P1.1)

1. **P1.2 :** Intégrer dans navigation → test bout en bout
2. **P1.3 :** Modal "détail transactions" → afficher transactions du mois pour un poste
3. **P2 :** Ajouter graphiques (courbes épargne, barres dépenses)
4. **P3 :** Réconciliation (import BoursoBank)

