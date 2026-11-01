// Saisie groupée : une dépense Vision égale à la somme de 2 à 4 lignes du relevé,
// toutes à quelques jours de sa date (ex. « Netflix + Supabase » saisis ensemble).
export function trouverGroupes(libres, manquants, proche) {
  const groupes = [];
  const restants = [...manquants];
  for (const t of [...libres].sort((a, b) => Number(b.montant) - Number(a.montant))) {
    const cible = Math.round(Number(t.montant) * 100);
    const cand = restants.filter((r) => proche(t, r));
    let trouve = null;
    const chercher = (debut, choisis, somme) => {
      if (trouve) return;
      if (choisis.length >= 2 && somme === cible) return (trouve = [...choisis]);
      if (choisis.length === 4 || somme >= cible) return;
      for (let i = debut; i < cand.length && !trouve; i++)
        chercher(i + 1, [...choisis, cand[i]], somme + Math.round(cand[i].montant * 100));
    };
    chercher(0, [], 0);
    if (trouve) {
      groupes.push({ vision: t, lignes: trouve });
      for (const r of trouve) restants.splice(restants.indexOf(r), 1);
    }
  }
  return { groupes, restants };
}
