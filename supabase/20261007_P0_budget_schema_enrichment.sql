-- ============================================================
-- MIGRATION SUPABASE — P0 Budget Schema Enrichment
-- ============================================================
-- Date: 2026-10-07
-- Contexte: Enrichir le schéma vision_budget et vision_transactions
--           pour supporter le composant BudgetMensuel et la réconciliation
--
-- Améliorations:
--   P0.1 : Ajouter colonne 'categorie' à vision_budget
--   P0.2 : Ajouter colonnes de métadonnées à vision_transactions
--
-- Durée estimée: ~2min
-- Risque: ❌ Aucun — colonnes optionnelles, pas de rupture
-- ============================================================

-- ============================================================
-- P0.1 : VISION_BUDGET — Ajouter catégories
-- ============================================================

ALTER TABLE vision_budget
ADD COLUMN categorie TEXT CHECK (categorie IN ('courantes', 'epargne'));

-- Peuplement des catégories (kind = source de vérité)
UPDATE vision_budget SET categorie = 'courantes' WHERE kind = 'charge';
UPDATE vision_budget SET categorie = 'epargne'   WHERE kind = 'epargne';
-- Revenus gardent categorie = NULL (pas de catégorie)

-- Vérification
-- Attendu : NULL→1 (salaire), courantes→12, epargne→2
-- À exécuter manuellement après migration pour vérifier:
--   SELECT categorie, COUNT(*) as count
--   FROM vision_budget
--   GROUP BY categorie
--   ORDER BY categorie;

-- ============================================================
-- P0.2 : VISION_TRANSACTIONS — Ajouter métadonnées de réconciliation
-- ============================================================

ALTER TABLE vision_transactions
ADD COLUMN source_paiement TEXT CHECK (source_paiement IN ('boursobank', 'manuel', 'autre')) DEFAULT 'manuel',
ADD COLUMN est_doublon BOOLEAN DEFAULT false,
ADD COLUMN date_rapprochement TIMESTAMP NULL,
ADD COLUMN note_reconciliation TEXT NULL;

-- Tous les champs par défaut :
--   source_paiement = 'manuel' (à override lors de l'import BoursoBank)
--   est_doublon = false (à qualifier lors de la réconciliation)
--   date_rapprochement = NULL (rempli lors du rapprochement)
--   note_reconciliation = NULL (optionnel, pour la traçabilité)

-- ============================================================
-- POST-MIGRATION CHECKS (à exécuter manuellement)
-- ============================================================

-- 1. Vérifier vision_budget.categorie
-- SELECT categorie, COUNT(*) as count FROM vision_budget GROUP BY categorie ORDER BY categorie;
-- Attendu: NULL→1, courantes→12, epargne→2

-- 2. Vérifier vision_transactions (comptage)
-- SELECT COUNT(*) FROM vision_transactions;

-- 3. Vérifier les colonnes existe bien
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'vision_budget' AND column_name = 'categorie';
-- SELECT column_name, data_type FROM information_schema.columns
-- WHERE table_name = 'vision_transactions' AND column_name IN ('source_paiement', 'est_doublon', 'date_rapprochement', 'note_reconciliation');

-- ============================================================
-- NOTES
-- ============================================================
-- - Pas de données existantes à migrer (new columns, defaults appliqués)
-- - Rollback possible: ALTER TABLE vision_budget DROP COLUMN categorie;
--                     ALTER TABLE vision_transactions DROP COLUMN source_paiement, est_doublon, date_rapprochement, note_reconciliation;
-- - Dépendances UI : BudgetMensuel.jsx attend categorie
--                   Réconciliation.jsx attend source_paiement, est_doublon, date_rapprochement
