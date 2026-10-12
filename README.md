# Vision

Application personnelle de suivi : budget, épargne, reconversion, devoirs, pièces à fournir, sport.

En ligne : https://marine-data.github.io/vision/

## Où est le code ?

**Tout le code de l'application est dans `index.html`.** C'est le seul fichier utilisé par le site.

- Pour mettre l'app à jour : remplacer `index.html` à la racine par la nouvelle version, puis valider (commit).
- GitHub Pages publie directement la branche `main`, dossier racine (Settings → Pages → *Deploy from a branch* → `main` / `root`).
- Les données (budget, dépenses, tâches…) sont dans Supabase, pas dans ce dépôt : remplacer `index.html` ne les touche jamais.

## Les autres dossiers

| Dossier | Contenu |
|---|---|
| `archive/ancienne-version/` | Ancienne version de l'app en fichiers séparés (React + Vite), d'avant octobre 2026. **Ne plus l'utiliser** : elle n'a ni Budget mois, ni Accueil, ni Devoirs/Pièces, ni alerte salaire, ni export Excel. Gardée seulement pour mémoire. |
| `supabase/` | Scripts de la base de données (pour référence). |
| `public/` | Icônes de l'app. |

## Pourquoi l'ancienne publication automatique a été retirée

Un fichier de publication automatique (`.github/workflows/deploy.yml`) reconstruisait le site à partir de l'ancien dossier `src/`. Il était mal rangé, donc inactif ; s'il avait été réparé, il aurait remis en ligne l'ancienne version de l'app. Il a été supprimé pour éviter ce risque.
