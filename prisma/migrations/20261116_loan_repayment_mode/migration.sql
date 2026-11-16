ALTER TABLE "association_memberships" ADD COLUMN IF NOT EXISTS "loanRepaymentMode" TEXT NOT NULL DEFAULT 'PRIORITY';
