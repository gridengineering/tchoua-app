CREATE TABLE IF NOT EXISTS "association_member_accounts" (
  "id" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "associationId" TEXT NOT NULL,
  "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'XAF',
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "association_member_accounts_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "association_member_accounts_membershipId_key" ON "association_member_accounts"("membershipId");
CREATE INDEX IF NOT EXISTS "association_member_accounts_associationId_idx" ON "association_member_accounts"("associationId");

CREATE TABLE IF NOT EXISTS "association_member_transactions" (
  "id" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "associationId" TEXT NOT NULL,
  "activityId" TEXT,
  "bankAccountId" TEXT,
  "sessionId" TEXT,
  "type" TEXT NOT NULL,
  "direction" TEXT NOT NULL,
  "method" TEXT NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "balanceAfter" DOUBLE PRECISION NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'COMPLETED',
  "reference" TEXT,
  "proofUrl" TEXT,
  "note" TEXT,
  "createdById" TEXT,
  "reconciledAt" TIMESTAMP(3),
  "reconciledById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "association_member_transactions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "association_member_transactions_membershipId_createdAt_idx" ON "association_member_transactions"("membershipId","createdAt");
CREATE INDEX IF NOT EXISTS "association_member_transactions_associationId_createdAt_idx" ON "association_member_transactions"("associationId","createdAt");
CREATE INDEX IF NOT EXISTS "association_member_transactions_activityId_createdAt_idx" ON "association_member_transactions"("activityId","createdAt");
CREATE INDEX IF NOT EXISTS "association_member_transactions_status_idx" ON "association_member_transactions"("status");

ALTER TABLE "association_member_accounts" ADD CONSTRAINT "association_member_accounts_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "association_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "association_member_accounts" ADD CONSTRAINT "association_member_accounts_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "association_member_transactions" ADD CONSTRAINT "association_member_transactions_accountId_fkey" FOREIGN KEY ("accountId") REFERENCES "association_member_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "association_member_transactions" ADD CONSTRAINT "association_member_transactions_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "association_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "association_member_transactions" ADD CONSTRAINT "association_member_transactions_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "association_member_transactions" ADD CONSTRAINT "association_member_transactions_activityId_fkey" FOREIGN KEY ("activityId") REFERENCES "association_activities"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "association_member_transactions" ADD CONSTRAINT "association_member_transactions_bankAccountId_fkey" FOREIGN KEY ("bankAccountId") REFERENCES "assoc_bank_accounts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "association_member_transactions" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "association_member_transactions_idempotencyKey_key" ON "association_member_transactions"("idempotencyKey");
