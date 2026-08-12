# Vision — App de reconversion (React + Vite + PWA + Supabase)

App mobile installable qui affiche ton dossier et **sauvegarde ton suivi** (cases cochées)
dans Supabase, en privé, sur tous tes appareils.

## Mise en route — 3 étapes

### 1. Supabase (une fois)
- Crée un projet gratuit sur https://supabase.com
- **SQL Editor → colle le contenu de `supabase/schema.sql` → Run** (crée la table + la sécurité)
- **Project Settings → API** : copie *Project URL* et la clé *anon public*
- Colle-les dans **`src/supabaseConfig.js`** (2 lignes)

> La clé « anon » est publique et sans danger : la sécurité RLS (dans le SQL) fait que
> chaque personne ne voit que ses propres données.

### 2. GitHub
- Dépose tous ces fichiers dans le repo `vision` (branche `main`)
- Dans le repo : **Settings → Pages → Build and deployment → Source = GitHub Actions**

### 3. C'est en ligne
À chaque `push`, GitHub build et publie automatiquement sur
**https://marine-data.github.io/vision/**. Ouvre-le sur ton téléphone puis
« Ajouter à l'écran d'accueil » pour l'installer comme une app.

---

### Développer en local (optionnel)
```bash
npm install
npm run dev
```

> Le nom du repo est `vision`, d'où `base: '/vision/'` dans `vite.config.js`.
> Si tu renommes le repo, change cette valeur.
