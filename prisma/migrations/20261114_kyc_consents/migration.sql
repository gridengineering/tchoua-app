-- KYC / LBC-FT et consentements plateforme (idempotent)
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kycLevel" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kycStatus" TEXT NOT NULL DEFAULT 'NONE';
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kycVerifiedAt" TIMESTAMP(3);
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "kycData" TEXT;

ALTER TABLE "associations" ADD COLUMN IF NOT EXISTS "minKycLevel" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "associations" ADD COLUMN IF NOT EXISTS "requireRegulationApproval" BOOLEAN NOT NULL DEFAULT true;

CREATE TABLE IF NOT EXISTS "kyc_requests" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "requestedLevel" INTEGER NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "fullName" TEXT,
  "dateOfBirth" TEXT,
  "nationality" TEXT,
  "idType" TEXT,
  "idNumber" TEXT,
  "address" TEXT,
  "city" TEXT,
  "country" TEXT,
  "occupation" TEXT,
  "sourceOfFunds" TEXT,
  "documentRef" TEXT,
  "reviewNote" TEXT,
  "reviewedById" TEXT,
  "reviewedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "kyc_requests_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "kyc_requests_userId_status_idx" ON "kyc_requests"("userId", "status");
CREATE INDEX IF NOT EXISTS "kyc_requests_status_createdAt_idx" ON "kyc_requests"("status", "createdAt");

DO $$ BEGIN
  ALTER TABLE "kyc_requests" ADD CONSTRAINT "kyc_requests_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "kyc_requests" ADD CONSTRAINT "kyc_requests_reviewedById_fkey"
    FOREIGN KEY ("reviewedById") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS "platform_consents" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "document" TEXT NOT NULL,
  "version" TEXT NOT NULL,
  "acceptedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "ip" TEXT,
  "userAgent" TEXT,
  CONSTRAINT "platform_consents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "platform_consents_userId_document_version_key"
  ON "platform_consents"("userId", "document", "version");
CREATE INDEX IF NOT EXISTS "platform_consents_userId_idx" ON "platform_consents"("userId");

DO $$ BEGIN
  ALTER TABLE "platform_consents" ADD CONSTRAINT "platform_consents_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
