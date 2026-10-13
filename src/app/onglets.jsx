export const ONGLETS = [
  {
    id: "apercu",
    label: "Accueil",
    icon: "kanban",
  },
  {
    id: "planning",
    label: "Planning",
    icon: "calendrier",
  },
  {
    id: "suivi",
    label: "Suivi",
    icon: "checklist",
  },
  {
    id: "budget",
    label: "Budget",
    icon: "portefeuille",
  },
  {
    id: "tresorerie",
    label: "Budget mois",
    icon: "curseurs",
  },
  {
    id: "stats",
    label: "Graphiques",
    icon: "courbe",
  },
  {
    id: "sport",
    label: "Sport",
    icon: "haltere",
  },
  {
    id: "pieces",
    label: "Pièces",
    icon: "document",
  },
  {
    id: "homework",
    label: "Devoirs",
    icon: "livre",
  },
  {
    id: "historique",
    label: "Historique",
    icon: "horloge",
  },
];

export const NAV_ICONS = {
  kanban: [
    "M4 5.8A1.8 1.8 0 015.8 4h12.4A1.8 1.8 0 0120 5.8v12.4a1.8 1.8 0 01-1.8 1.8H5.8A1.8 1.8 0 014 18.2z",
    "M9.4 4v16",
    "M14.6 4v16",
    "M6.2 7.4h1.4",
    "M11.3 7.4h1.4",
    "M11.3 10.6h1.4",
    "M16.4 7.4h1.4",
  ],
  boussole: ["M12 3a9 9 0 110 18 9 9 0 010-18", "M15.6 8.4l-2.1 5.1-5.1 2.1 2.1-5.1z"],
  calendrier: [
    "M4 6.8A1.8 1.8 0 015.8 5h12.4A1.8 1.8 0 0120 6.8v11.4a1.8 1.8 0 01-1.8 1.8H5.8A1.8 1.8 0 014 18.2z",
    "M4 9.6h16",
    "M8.4 3.4v3.2",
    "M15.6 3.4v3.2",
  ],
  checklist: ["M4 7.6l1.9 1.9L9.4 6", "M4 16.4l1.9 1.9L9.4 14.8", "M12.6 8h7.4", "M12.6 16.8h7.4"],
  portefeuille: [
    "M4 8.4A1.8 1.8 0 015.8 6.6h12.4A1.8 1.8 0 0120 8.4v9.2a1.8 1.8 0 01-1.8 1.8H5.8A1.8 1.8 0 014 17.6z",
    "M20 11.4h-3.1a1.6 1.6 0 000 3.2H20",
  ],
  curseurs: ["M7 4.2v15.6", "M12 4.2v15.6", "M17 4.2v15.6", "M4.9 9.2h4.2", "M9.9 15h4.2", "M14.9 7.4h4.2"],
  courbe: ["M4.4 4.6v14.8h15.2", "M7.6 15.6l3.4-4 2.9 2.4 4.5-6"],
  haltere: ["M6.8 8.2v7.6", "M3.8 9.8v4.4", "M17.2 8.2v7.6", "M20.2 9.8v4.4", "M6.8 12h10.4"],
  document: ["M6.2 3.6h6.6l5 5v11.8a1 1 0 01-1 1H6.2a1 1 0 01-1-1V4.6a1 1 0 011-1z", "M12.8 3.6V8.6h5"],
  livre: [
    "M12 6.6C10.4 5.1 7.9 4.6 4.6 5.1v12.2c3.3-.5 5.8 0 7.4 1.5 1.6-1.5 4.1-2 7.4-1.5V5.1c-3.3-.5-5.8 0-7.4 1.5z",
    "M12 6.6v12.2",
  ],
  horloge: ["M12 3.6a8.4 8.4 0 110 16.8 8.4 8.4 0 010-16.8", "M12 7.4V12l2.9 1.9"],
};

export const navIcon = (cle) => (
  <svg
    viewBox="0 0 24 24"
    width={22}
    height={22}
    fill="none"
    stroke="currentColor"
    strokeWidth={1.6}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    {(NAV_ICONS[cle] || []).map((d, k) => (
      <path d={d} key={k} />
    ))}
  </svg>
);

export const MODE_PARTAGE =
  typeof window < "u" &&
  (new URLSearchParams(window.location.search).has("partage") ||
    (window.location.hash || "").includes("partage"));

export const ONGLETS_VERROUILLES = ["tresorerie", "stats", "historique"];

export const MOT_DE_PASSE_PARTAGE = "vision2027";

export const rienFaire = () => {};
