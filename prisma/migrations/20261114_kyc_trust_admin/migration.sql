-- KYC avancé, confiance des associations et quarantaine (idempotent)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "whatsappVerifiedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "quarantinedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "quarantineReason" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "quarantinedById" TEXT;

ALTER TABLE "associations" ADD COLUMN IF NOT EXISTS "trustScore" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "associations" ADD COLUMN IF NOT EXISTS "trustLevel" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "associations" ADD COLUMN IF NOT EXISTS "trustBreakdown" TEXT;
ALTER TABLE "associations" ADD COLUMN IF NOT EXISTS "trustComputedAt" TIMESTAMP(3);
ALTER TABLE "associations" ADD COLUMN IF NOT EXISTS "quarantinedAt" TIMESTAMP(3);
ALTER TABLE "associations" ADD COLUMN IF NOT EXISTS "quarantineReason" TEXT;
ALTER TABLE "associations" ADD COLUMN IF NOT EXISTS "quarantinedById" TEXT;

CREATE TABLE IF NOT EXISTS "kyc_documents" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "kycRequestId" TEXT,
  "type" TEXT NOT NULL,
  "label" TEXT NOT NULL,
  "filePath" TEXT NOT NULL,
  "mimeType" TEXT NOT NULL,
  "size" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "kyc_documents_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "kyc_documents_userId_createdAt_idx" ON "kyc_documents"("userId", "createdAt");
CREATE INDEX IF NOT EXISTS "kyc_documents_kycRequestId_idx" ON "kyc_documents"("kycRequestId");

DO $$ BEGIN
  ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "kyc_documents" ADD CONSTRAINT "kyc_documents_kycRequestId_fkey"
    FOREIGN KEY ("kycRequestId") REFERENCES "kyc_requests"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "verification_codes" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "channel" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "codeHash" TEXT NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "verification_codes_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "verification_codes_userId_channel_expiresAt_idx" ON "verification_codes"("userId", "channel", "expiresAt");

DO $$ BEGIN
  ALTER TABLE "verification_codes" ADD CONSTRAINT "verification_codes_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
