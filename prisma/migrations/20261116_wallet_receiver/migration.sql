-- Colonne de traçabilité du bénéficiaire pour l'idempotence des virements
ALTER TABLE "wallet_transactions" ADD COLUMN IF NOT EXISTS "receiverId" TEXT;
