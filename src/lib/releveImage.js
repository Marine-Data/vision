// Lecture d'un screenshot de relevé : préparation de l'image avant OCR + extraction des dépenses.
// parserReleve est une fonction pure (testable dans Node) ; preparerImage utilise le navigateur.

const sansAccent = (s) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

// Mois en toutes lettres ou abrégés (« oct », « sept. », « octobre »…).
const MOIS = {
  janvier: 1,
  janv: 1,
  jan: 1,
  fevrier: 2,
  fevr: 2,
  fev: 2,
  mars: 3,
  mar: 3,
  avril: 4,
  avr: 4,
  mai: 5,
  juin: 6,
  juillet: 7,
  juil: 7,
  aout: 8,
  septembre: 9,
  sept: 9,
  sep: 9,
  octobre: 10,
  oct: 10,
  novembre: 11,
  nov: 11,
  decembre: 12,
  dec: 12,
};

const enIso = (y, m, d) => `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;

// Sans année sur le screenshot : on prend l'année en cours, ou la précédente si la date serait dans le futur.
function avecAnnee(m, d, a) {
  if (a) return enIso(a, m, d);
  const auj = new Date();
  let an = auj.getFullYear();
  if (new Date(an, m - 1, d) - auj > 7 * 864e5) an -= 1;
  return enIso(an, m, d);
}

// Cherche une date dans une ligne : 19/10, 19/10/2026, « 19 octobre », « Lundi 19 oct. 2026 ».
function trouverDate(l) {
  const num = l.match(/(?<![\d,.])(\d{1,2})[/.](\d{1,2})(?:[/.](\d{4}|\d{2}))?(?![\d,])/);
  if (num && Number(num[1]) >= 1 && Number(num[1]) <= 31 && Number(num[2]) >= 1 && Number(num[2]) <= 12) {
    const a = num[3] ? (num[3].length === 2 ? 2000 + Number(num[3]) : Number(num[3])) : null;
    return { iso: avecAnnee(Number(num[2]), Number(num[1]), a), texte: num[0] };
  }
  for (const m of l.matchAll(/(?<!\d)(\d{1,2})\s+([A-Za-zÀ-ÿ]{3,9})\.?(?:\s+(\d{4}))?/g)) {
    const mois = MOIS[sansAccent(m[2])];
    if (mois && Number(m[1]) >= 1 && Number(m[1]) <= 31)
      return { iso: avecAnnee(mois, Number(m[1]), m[3] ? Number(m[3]) : null), texte: m[0] };
  }
  return null;
}

// Montants : « 12,50 », « -1 234,56 € », « 12.50 € » (le point n'est une décimale que s'il y a un signe ou un € juste après).
const RE_MONTANT = /([-−–+])?\s?(\d{1,3}(?:[ .\u00a0\u202f]\d{3})+|\d+)([,.])(\d{2})(?!\d)(?!\.\d)/g;

function trouverMontants(l) {
  const res = [];
  for (const m of l.matchAll(RE_MONTANT)) {
    if (m[3] === "." && !(m[1] || /^\s*€/.test(l.slice(m.index + m[0].length)))) continue;
    const entier = m[2].replace(/[ .\u00a0\u202f]/g, "");
    res.push({ valeur: Number(entier + "." + m[4]), signe: m[1] || "", texte: m[0] });
  }
  return res;
}

const IGNORER = /solde|total|disponible|plafond|encours|prochain|virement re[cç]u/i;

// L'OCR lit parfois un chiffre comme une lettre ou un signe juste après la virgule : « -5,/6 » pour « -5,76 ».
const CHIFFRE_OCR = { "/": "7", O: "0", o: "0", l: "1", I: "1", "|": "1", S: "5", B: "8" };
const corrigerDecimales = (l) =>
  l.replace(
    /(\d),([\dOolI|S/B]{2})(?![\w])/g,
    (_, a, b) => a + "," + [...b].map((c) => CHIFFRE_OCR[c] || c).join(""),
  );

const jourSuivant = (iso) => {
  const d = new Date(iso + "T12:00:00");
  d.setDate(d.getDate() + 1);
  const suivant = enIso(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const auj = new Date();
  return suivant > enIso(auj.getFullYear(), auj.getMonth() + 1, auj.getDate()) ? iso : suivant;
};

export function parserReleve(texte) {
  const lignes = [];
  // Opérations vues avant le premier en-tête de date (il a défilé hors de l'écran) : elles sont plus
  // récentes que cet en-tête. On leur donne le lendemain de cette date, ou aujourd'hui s'il n'y en a aucun.
  const sansDate = [];
  let dateCourante = null; // date d'un en-tête de groupe (« 19 octobre ») valable pour les lignes suivantes
  let libellePrecedent = ""; // libellé vu sur la ligne d'avant, si le montant est seul sur sa ligne
  for (const brut of String(texte || "").split("\n")) {
    const l = corrigerDecimales(brut.replace(/_/g, " ")).replace(/\s+/g, " ").trim();
    if (!l) continue;
    if (IGNORER.test(l)) {
      libellePrecedent = "";
      continue;
    }
    const d = trouverDate(l);
    const montants = trouverMontants(l);
    if (!montants.length) {
      if (d) {
        if (!dateCourante) for (const x of sansDate) x.date = jourSuivant(d.iso);
        dateCourante = d.iso;
        libellePrecedent = "";
      } else if (/[A-Za-zÀ-ÿ]{3,}/.test(l)) libellePrecedent = l;
      continue;
    }
    const dernier = montants[montants.length - 1];
    if (dernier.signe === "+") {
      libellePrecedent = "";
      continue; // un crédit n'est pas une dépense à vérifier
    }
    const date = d ? d.iso : dateCourante;
    // sans date connue, on ne garde que les montants précédés d'un « - » (le solde en haut d'écran n'en a pas)
    if (!date && !dernier.signe) continue;
    if (d) {
      if (!dateCourante) for (const x of sansDate) x.date = jourSuivant(d.iso);
      dateCourante = d.iso;
    }
    let libelle = l;
    if (d) libelle = libelle.replace(d.texte, " ");
    for (const m of montants) libelle = libelle.replace(m.texte, " ");
    libelle = libelle
      .replace(/[-−–+€>»›«©®|]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    if (!/[A-Za-zÀ-ÿ]{2,}/.test(libelle)) libelle = libellePrecedent;
    libellePrecedent = "";
    const ligne = { date, montant: Math.abs(dernier.valeur), libelle: (libelle || "Dépense").slice(0, 60) };
    lignes.push(ligne);
    if (!date) sansDate.push(ligne);
  }
  const auj = new Date();
  for (const x of sansDate) if (!x.date) x.date = enIso(auj.getFullYear(), auj.getMonth() + 1, auj.getDate());
  return lignes;
}

// Prépare le screenshot pour l'OCR : agrandit (les captures de téléphone sont petites),
// passe en niveaux de gris, inverse les thèmes sombres (texte clair sur fond foncé) et renforce le contraste.
export async function preparerImage(fichier) {
  try {
    const bmp = await createImageBitmap(fichier);
    const echelle = Math.min(2400 / bmp.width, Math.max(1, 1800 / bmp.width));
    const w = Math.round(bmp.width * echelle);
    const h = Math.round(bmp.height * echelle);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(bmp, 0, 0, w, h);
    const img = ctx.getImageData(0, 0, w, h);
    const px = img.data;
    const gris = new Uint8ClampedArray(w * h);
    let somme = 0;
    for (let i = 0, j = 0; i < px.length; i += 4, j++) {
      const g = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
      gris[j] = g;
      somme += g;
    }
    const sombre = somme / gris.length < 128;
    for (let i = 0, j = 0; i < px.length; i += 4, j++) {
      let g = sombre ? 255 - gris[j] : gris[j];
      g = Math.max(0, Math.min(255, (g - 128) * 1.6 + 128));
      px[i] = px[i + 1] = px[i + 2] = g;
      px[i + 3] = 255;
    }
    ctx.putImageData(img, 0, 0);
    return await new Promise((ok, ko) =>
      canvas.toBlob((b) => (b ? ok(b) : ko(new Error("canvas"))), "image/png"),
    );
  } catch (e) {
    return fichier; // pas de préparation possible : on lit l'image telle quelle
  }
}
