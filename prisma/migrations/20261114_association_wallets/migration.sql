-- Wallet d'association (un seul wallet par association)
CREATE TABLE IF NOT EXISTS association_wallets (
  id TEXT PRIMARY KEY,
  "associationId" TEXT NOT NULL UNIQUE REFERENCES associations(id) ON DELETE CASCADE,
  balance DOUBLE PRECISION NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'XAF',
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS association_wallet_transactions (
  id TEXT PRIMARY KEY,
  "walletId" TEXT NOT NULL REFERENCES association_wallets(id) ON DELETE CASCADE,
  amount DOUBLE PRECISION NOT NULL,
  "feeAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "netAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'COMPLETED',
  provider TEXT,
  reference TEXT,
  description TEXT,
  "memberId" TEXT REFERENCES association_memberships(id) ON DELETE SET NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS association_wallet_transactions_wallet_created_idx
  ON association_wallet_transactions("walletId", "createdAt");
