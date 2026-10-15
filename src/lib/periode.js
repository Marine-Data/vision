// Période d'un cours, écrite dans « complement » : « 30/09 → 09/12/2026 ».
// Sans période, le cours revient toutes les semaines.

// → [début, fin] (AAAA-MM-JJ), ou null.
export function periode(c) {
  const m = String((c && c.complement) || "").match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?\s*→\s*(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (!m) return null;
  const fin = m[6] + "-" + m[5].padStart(2, "0") + "-" + m[4].padStart(2, "0"),
    an = m[3] || (Number(m[2]) > Number(m[5]) ? String(Number(m[6]) - 1) : m[6]);
  return [an + "-" + m[2].padStart(2, "0") + "-" + m[1].padStart(2, "0"), fin];
}

export const ecrirePeriode = (de, a) => {
  if (!de || !a) return null;
  const f = (x, an) => x.slice(8, 10) + "/" + x.slice(5, 7) + (an ? "/" + x.slice(0, 4) : "");
  return f(de, de.slice(0, 4) !== a.slice(0, 4)) + " → " + f(a, true);
};

// Le cours a-t-il lieu ce jour-là (dans sa période) ?
export function actifLe(c, dIso) {
  const p = periode(c);
  return !p || (p[0] <= dIso && p[1] >= dIso);
}
// Période finie avant ce jour.
export const termine = (c, dIso) => {
  const p = periode(c);
  return !!p && p[1] < dIso;
};
// Cours d'une seule fois (rattrapage) : la période tient en un jour.
export const uneFois = (c) => {
  const p = periode(c);
  return !!p && p[0] === p[1];
};
