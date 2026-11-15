-- Clés d'idempotence pour les mutations financières rejouées hors ligne.
ALTER TABLE "assoc_loans" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "assoc_loan_repayments" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "assoc_social_aid_requests" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "idempotencyKey" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "assoc_loans_idempotencyKey_key" ON "assoc_loans"("idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "assoc_loan_repayments_idempotencyKey_key" ON "assoc_loan_repayments"("idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "assoc_social_aid_requests_idempotencyKey_key" ON "assoc_social_aid_requests"("idempotencyKey");
CREATE UNIQUE INDEX IF NOT EXISTS "wallet_transactions_idempotencyKey_key" ON "wallet_transactions"("idempotencyKey");
