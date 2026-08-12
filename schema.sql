-- Activer l'extension UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Table des étapes (Pièce n°2)
CREATE TABLE IF NOT EXISTS etapes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  numero INTEGER NOT NULL,
  nom TEXT NOT NULL,
  echeance TEXT,
  statut TEXT CHECK (statut IN ('a_faire', 'en_cours', 'termine', 'a_venir')) DEFAULT 'a_venir',
  prochaine_action TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Table des cours (Pièces n°3 et n°4)
CREATE TABLE IF NOT EXISTS cours (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  format TEXT,
  duree TEXT,
  tarif INTEGER,
  semestre INTEGER,
  date_debut DATE,
  date_fin DATE,
  est_optionnel BOOLEAN DEFAULT FALSE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 3. Table des dépenses (Pièce n°6)
CREATE TABLE IF NOT EXISTS depenses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  poste TEXT NOT NULL,
  montant INTEGER,
  echeance TEXT,
  type TEXT CHECK (type IN ('engage', 'optionnel')) DEFAULT 'engage',
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 4. Table du budget mensuel (Pièce n°7)
CREATE TABLE IF NOT EXISTS budget_mensuel (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  mois DATE NOT NULL,
  revenus INTEGER,
  total_charges_vie INTEGER,
  total_epargne INTEGER,
  solde_livrets INTEGER,
  solde_vacances INTEGER,
  evenement TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 5. Table des pièces à fournir (Pièce n°8)
CREATE TABLE IF NOT EXISTS pieces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nom TEXT NOT NULL,
  est_obtenue BOOLEAN DEFAULT FALSE,
  formation TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 6. Table de l'emploi du temps (Pièce n°1)
CREATE TABLE IF NOT EXISTS emploi_du_temps (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  jour TEXT NOT NULL,
  journee TEXT,
  soiree TEXT,
  repere TEXT CHECK (repere IN ('fixe', 'souple')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- --- RLS (Row Level Security) ---
-- Activer RLS sur toutes les tables
ALTER TABLE etapes ENABLE ROW LEVEL SECURITY;
ALTER TABLE cours ENABLE ROW LEVEL SECURITY;
ALTER TABLE depenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE budget_mensuel ENABLE ROW LEVEL SECURITY;
ALTER TABLE pieces ENABLE ROW LEVEL SECURITY;
ALTER TABLE emploi_du_temps ENABLE ROW LEVEL SECURITY;

-- Politiques : L'utilisateur ne voit et ne modifie que ses propres données
CREATE POLICY "Lecture de ses propres etapes" ON etapes FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insertion de ses propres etapes" ON etapes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Modification de ses propres etapes" ON etapes FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Suppression de ses propres etapes" ON etapes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Lecture de ses propres cours" ON cours FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insertion de ses propres cours" ON cours FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Modification de ses propres cours" ON cours FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Suppression de ses propres cours" ON cours FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Lecture de ses propres depenses" ON depenses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insertion de ses propres depenses" ON depenses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Modification de ses propres depenses" ON depenses FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Suppression de ses propres depenses" ON depenses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Lecture de son propre budget" ON budget_mensuel FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insertion de son propre budget" ON budget_mensuel FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Modification de son propre budget" ON budget_mensuel FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Suppression de son propre budget" ON budget_mensuel FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Lecture de ses propres pieces" ON pieces FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insertion de ses propres pieces" ON pieces FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Modification de ses propres pieces" ON pieces FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Suppression de ses propres pieces" ON pieces FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Lecture de son propre emploi du temps" ON emploi_du_temps FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Insertion de son propre emploi du temps" ON emploi_du_temps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Modification de son propre emploi du temps" ON emploi_du_temps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Suppression de son propre emploi du temps" ON emploi_du_temps FOR DELETE USING (auth.uid() = user_id);
