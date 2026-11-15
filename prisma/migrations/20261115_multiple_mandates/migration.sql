-- Une élection du bureau peut produire plusieurs mandats (un par poste).
-- L'ancienne contrainte d'unicité sur electionId empêchait les élections
-- plurinominales et faisait échouer la création du deuxième mandat.

ALTER TABLE "mandate_periods" DROP CONSTRAINT IF EXISTS "mandate_periods_electionId_key";
CREATE INDEX IF NOT EXISTS "mandate_periods_electionId_idx" ON "mandate_periods"("electionId");
