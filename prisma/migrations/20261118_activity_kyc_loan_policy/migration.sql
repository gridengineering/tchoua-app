-- KYC optionnel par activité (0 = aucun KYC requis)
ALTER TABLE "association_activities"
  ADD COLUMN IF NOT EXISTS "minKycLevel" INTEGER NOT NULL DEFAULT 0;
