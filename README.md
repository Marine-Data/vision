# Vision

Application personnelle de suivi : budget, épargne, reconversion, devoirs, pièces à fournir, sport.

En ligne : https://marine-data.github.io/vision/

## Comment c'est organisé

Le code est découpé en petits fichiers lisibles dans `src/`. GitHub les assemble automatiquement en un seul fichier, `index.html`, qui est celui publié en ligne.

```
src/
  main.js                  démarrage de l'app
  App.jsx                  écran principal : chargement des données, onglets, enregistrements
  config.js                réglages (base de données, mois de départ, objectif 6 mois…)
  index.css                styles

  components/              un fichier par écran
    kanban/Accueil.jsx       page d'accueil (tâches par thème)
    kanban/DevoirsPage.jsx   onglet Devoirs
    kanban/PiecesPage.jsx    onglet Pièces
    kanban/communs.jsx       pastilles, fenêtres, boutons partagés par ces 3 écrans
    BudgetMensuel.jsx        onglet Budget mois (tableau Excel, clôture, alerte)
    AlerteSalaire.jsx        bandeau d'alerte de dépassement du salaire
    SaisieRapide.jsx         saisie d'une dépense (bouton +)
    AutresOutils.jsx         « Autres outils » sous Budget mois
    graphiques/              onglet Graphiques
    Planning.jsx, Suivi.jsx, Sport.jsx, Historique.jsx, NavBas.jsx, Connexion.jsx…

  lib/                     calculs, sans affichage
    calculs.js               épargne, provisions, enveloppe, budget du mois
    alerteSalaire.js         calcul de l'alerte salaire
    epargneAuto.js           épargne programmée du 3 du mois
    exportExcel.js           export BUDGET_TABLEAU.xlsx
    mois.js, format.js…      dates et mise en forme des montants

  data/contenu.js          contenus par défaut (planning, pièces, suivi…)
  assets/images.js         images intégrées (icône, fond)
  anciens/                 anciens écrans remplacés (non utilisés, gardés pour mémoire)

page/index.html            modèle de la page
index.html                 le site construit — NE PAS MODIFIER À LA MAIN
```

## Modifier l'app

1. Modifier les fichiers dans `src/`.
2. Envoyer sur `main` : la publication automatique (`.github/workflows/construire.yml`) reconstruit `index.html` en 2 minutes environ, puis GitHub Pages le met en ligne.

Ne plus remplacer `index.html` à la main : il serait écrasé à la prochaine modification de `src/`.

En local : `npm install`, puis `npm run dev` pour essayer, `npm run build` pour construire `dist/index.html`.

Les données (budget, dépenses, tâches…) sont dans Supabase, pas dans ce dépôt.

## Les autres dossiers

| Dossier | Contenu |
|---|---|
| `archive/ancienne-version/` | Version d'avant octobre 2026, ne plus utiliser. |
| `supabase/` | Scripts de la base de données (référence). |
| `public/` | Anciennes icônes (non utilisées par l'app). |
