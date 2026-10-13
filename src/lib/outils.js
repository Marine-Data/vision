export // Sauvegarde différée : on attend que la frappe s'arrête avant d'écrire en base,
// au lieu d'attendre que l'utilisateur sorte du champ.
const visionTimers = {};

// Export du suivi mensuel : fichier CSV séparé par points-virgules, encodé avec
// un BOM pour qu'Excel ouvre correctement les accents et les colonnes.

export // Export du suivi mensuel : fichier CSV séparé par points-virgules, encodé avec
// un BOM pour qu'Excel ouvre correctement les accents et les colonnes.
function exportMoisCSV(nomMois, lignes) {
  const esc = (v) => '"' + String(v == null ? "" : v).replace(/"/g, '""') + '"',
    corps = lignes.map((l) => l.map(esc).join(";")).join("\r\n"),
    blob = new Blob(["\ufeff" + corps], {
      type: "text/csv;charset=utf-8;",
    }),
    url = URL.createObjectURL(blob),
    a = document.createElement("a");
  (a.href = url),
    (a.download =
      "vision-budget-" +
      String(nomMois)
        .replace(/[^A-Za-z0-9]+/g, "-")
        .toLowerCase() +
      ".csv"),
    document.body.appendChild(a),
    a.click(),
    document.body.removeChild(a),
    setTimeout(() => URL.revokeObjectURL(url), 1e3);
}

export function debounceSave(key, fn, ms = 800) {
  clearTimeout(visionTimers[key]), (visionTimers[key] = setTimeout(fn, ms));
}

// mois_index (ancre) <-> mois calendaire. L'ancre reste définie une seule fois,
// dans VISION_CONFIG : rien n'est recopié en base.
