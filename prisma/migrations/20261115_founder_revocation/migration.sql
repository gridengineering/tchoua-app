-- Protection du fondateur : le privilège ne peut être retiré que par deux
-- membres distincts du bureau (proposition + confirmation).

ALTER TABLE "association_memberships"
  ADD COLUMN IF NOT EXISTS "founderRevokedAt" TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS "founder_revocation_requests" (
  "id" TEXT NOT NULL,
  "associationId" TEXT NOT NULL,
  "founderMembershipId" TEXT NOT NULL,
  "proposedById" TEXT NOT NULL,
  "confirmedById" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "reason" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "founder_revocation_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "founder_revocation_requests_associationId_status_idx"
  ON "founder_revocation_requests"("associationId", "status");
CREATE INDEX IF NOT EXISTS "founder_revocation_requests_founderMembershipId_idx"
  ON "founder_revocation_requests"("founderMembershipId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'founder_revocation_requests_associationId_fkey'
  ) THEN
    ALTER TABLE "founder_revocation_requests"
      ADD CONSTRAINT "founder_revocation_requests_associationId_fkey"
      FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'founder_revocation_requests_founderMembershipId_fkey'
  ) THEN
    ALTER TABLE "founder_revocation_requests"
      ADD CONSTRAINT "founder_revocation_requests_founderMembershipId_fkey"
      FOREIGN KEY ("founderMembershipId") REFERENCES "association_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'founder_revocation_requests_proposedById_fkey'
  ) THEN
    ALTER TABLE "founder_revocation_requests"
      ADD CONSTRAINT "founder_revocation_requests_proposedById_fkey"
      FOREIGN KEY ("proposedById") REFERENCES "association_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'founder_revocation_requests_confirmedById_fkey'
  ) THEN
    ALTER TABLE "founder_revocation_requests"
      ADD CONSTRAINT "founder_revocation_requests_confirmedById_fkey"
      FOREIGN KEY ("confirmedById") REFERENCES "association_memberships"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
