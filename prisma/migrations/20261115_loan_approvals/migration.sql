-- Approbations de prêt nominatives : une ligne par membre du bureau.
-- Deux décisions distinctes sont exigées au-dessus du seuil de 500 000 FCFA.

CREATE TABLE IF NOT EXISTS "assoc_loan_approvals" (
  "id" TEXT NOT NULL,
  "loanId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "decision" TEXT NOT NULL DEFAULT 'APPROVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assoc_loan_approvals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "assoc_loan_approvals_loanId_membershipId_key"
  ON "assoc_loan_approvals"("loanId", "membershipId");
CREATE INDEX IF NOT EXISTS "assoc_loan_approvals_loanId_decision_idx"
  ON "assoc_loan_approvals"("loanId", "decision");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assoc_loan_approvals_loanId_fkey'
  ) THEN
    ALTER TABLE "assoc_loan_approvals"
      ADD CONSTRAINT "assoc_loan_approvals_loanId_fkey"
      FOREIGN KEY ("loanId") REFERENCES "assoc_loans"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'assoc_loan_approvals_membershipId_fkey'
  ) THEN
    ALTER TABLE "assoc_loan_approvals"
      ADD CONSTRAINT "assoc_loan_approvals_membershipId_fkey"
      FOREIGN KEY ("membershipId") REFERENCES "association_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
