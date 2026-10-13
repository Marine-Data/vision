// Import d'un relevé BoursoBank (PDF du compte courant) : lecture, classement,
// préparation de l'aperçu. Rien n'est enregistré ici : c'est l'écran d'import
// qui montre tout, et seul le bouton « Enregistrer » écrit dans la base.
import { lireReleve } from "./releve.js";

// ---- Chargement de pdf.js à la demande (comme ExcelJS pour l'export) ----
const PDFJS = [
  [
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js",
  ],
  [
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js",
    "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js",
  ],
];
let chargement = null;
export function chargerPdfJs() {
  if (window.pdfjsLib) return Promise.resolve(window.pdfjsLib);
  if (chargement) return chargement;
  chargement = new Promise((ok, ko) => {
    const essai = (i) => {
      if (i >= PDFJS.length) {
        chargement = null;
        ko(new Error("lecteur PDF introuvable (connexion ?)"));
        return;
      }
      const s = document.createElement("script");
      s.src = PDFJS[i][0];
      s.async = true;
      s.onload = () => {
        if (!window.pdfjsLib) return essai(i + 1);
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS[i][1];
        ok(window.pdfjsLib);
      };
      s.onerror = () => {
        s.remove();
        essai(i + 1);
      };
      document.head.appendChild(s);
    };
    essai(0);
  });
  return chargement;
}

export async function lireFichierPdf(fichier) {
  const pdfjs = await chargerPdfJs(),
    doc = await pdfjs.getDocument({ data: new Uint8Array(await fichier.arrayBuffer()) }).promise,
    pages = [];
  for (let p = 1; p <= doc.numPages; p++) {
    const pg = await doc.getPage(p),
      vp = pg.getViewport({ scale: 1 }),
      tc = await pg.getTextContent();
    pages.push({
      items: tc.items.map((i) => ({
        str: i.str,
        x: i.transform[4],
        y: vp.height - i.transform[5],
        w: i.width,
      })),
    });
  }
  return lireReleve(pages);
}

// ---- Classement ----
// Groupes spéciaux : salaire, vacances, sport, ignorer. Sinon : nom d'un poste du budget.
export const REGLES = [
  [
    "ignorer",
    /^VIR (INST |SEPA )?ZINZEN|Virement de Marine ZINZEN|Virement depuis LIVRET|^REJ VIR|EPARGNE AUTOMATIQUE|PROVISION VACANCES|^VIR VIR pour|^VIR Vir pour|^VIR Courses/i,
  ],
  ["salaire", /ADEDOM/i],
  ["vacances", /TAP AIR|TRANSAVIA|AIRBNB|CLICKANDBOAT|BOOKING|EASYJET|RYANAIR|VUELING|HOTEL/i],
  ["sport", /MANGOPAY|MONCLUB|EN AVANT/i],
  [
    "Alimentation",
    /LIDL|INTERMARCHE|CARREFOUR|DISTRIBEN|FP PARIS|PATISSERIE|TABAC|ACE MART|HUGO PRIMEUR|BELLE VIE|G20|MONOP|FRANPRIX|NOUS PARIS|DISTRI LABRO|CHEZ DOLLY|SUMUP|BOULANG|PICARD|NATURALIA|BIOCOOP|AUCHAN|LECLERC|CASINO|PRIMEUR/i,
  ],
  [
    "Transports",
    /SNCF|RESEAU MISTRAL|SANEF|NAVIGO|RATP|REGIELER|DAT AIX|BLABLACAR|INDIGO|CLICHY|UBER|VELIB|AUTOROUTE/i,
  ],
  ["Beauté & soins", /INSTITUT WENDY|AROMA-ZONE|NORMAL PARIS|SEPHORA|COIFF/i],
  ["Vêtements", /TIME TO PRESSING|DECATHLON|ZARA|UNIQLO|KIABI|PRESSING/i],
  ["Santé / pharmacie", /DOCTOLIB|DOCTEUR|PHARMA|MEDECIN|DENTISTE/i],
  ["Logement & énergie", /EDF|ENGIE|LOYER|ASSURANCE HABIT/i],
  ["Impôts (DGFIP)", /FINANCES PUBLIQUES|DIRECTION GENERALE DES FINANCE|DGFIP/i],
  ["Abonnements", /ANTHROPIC|CLAUDE|MEDIAPART|GOOGLE|STRAVA|YOUTUB|NETFLIX|SPOTIFY|DEEZER|BOURSO PROTECT/i],
  ["Matériel & high-tech", /AMAZON|EURL CUEFF|FNAC|DARTY|APPLE/i],
  ["Plaisir / sorties", /EL COMPADRE|RESTAU|CINEMA|UGC|PATHE/i],
  ["Argent liquide", /RETRAIT DAB/i],
];

// Nom lisible du commerçant (sert aussi de motif pour les règles apprises).
export function nomOperation(libelle) {
  return libelle
    .replace(/^(CARTE|AVOIR) \d\d\/\d\d\/\d\d /, "")
    .replace(/ CB\*\d+$/, "")
    .replace(/^PRLV SEPA /, "")
    .replace(/^VIR (SEPA |INST )?/, "")
    .replace(/\s+\d+$/, "")
    .trim();
}

// Règles : celles de la base (Réglages → Import du relevé), mots-clés appris d'abord,
// puis les mots-clés de base dans leur ordre. Chaque règle donne un groupe spécial
// (ignorer, salaire, vacances, sport) ou un poste (nom actuel du poste).
// Sans règles en base (mode partage, chargement), les règles du code servent de secours.
export function classer(op, regles) {
  const t = (op.libelle + " " + op.detail.join(" ")).toUpperCase(),
    liste = regles || [];
  const tri = [...liste].sort(
    (a, b) =>
      (a.source === "appris" ? 0 : 1) - (b.source === "appris" ? 0 : 1) || (a.sort || 0) - (b.sort || 0),
  );
  const r = tri.find((x) => x.motif && t.includes(x.motif.toUpperCase()));
  if (r) return r.groupe || r.poste;
  if (liste.some((x) => x.source === "base")) return null;
  for (const [poste, re] of REGLES) if (re.test(t)) return poste;
  return null;
}

// Opération qui ressemble à une dépense déjà dans l'app (même montant à 1 centime près, à 3 jours près).
export function dejaSaisie(op, transactions) {
  const d = new Date(op.dateAchat + "T00:00:00").getTime();
  return (transactions || []).find(
    (x) =>
      Math.abs(Number(x.montant) - op.montant) < 0.01 &&
      Math.abs(new Date(x.date_depense + "T00:00:00").getTime() - d) <= 3 * 864e5,
  );
}

// Note d'un total par poste : « Relevé · Lidl ×3, Intermarché, … »
export function noteDesOperations(ops) {
  const n = {};
  ops.forEach((o) => {
    const k = nomOperation(o.libelle);
    n[k] = (n[k] || 0) + 1;
  });
  return (
    "Relevé · " +
    Object.entries(n)
      .map(([k, c]) => (c > 1 ? k + " ×" + c : k))
      .join(", ")
  );
}
