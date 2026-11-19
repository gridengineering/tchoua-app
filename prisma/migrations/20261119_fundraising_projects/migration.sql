-- Projets de levée de fonds des associations (module Apps association-fundraising)
CREATE TABLE IF NOT EXISTS "fundraising_projects" (
  "id" TEXT NOT NULL,
  "associationId" TEXT NOT NULL,
  "createdById" TEXT,
  "title" TEXT NOT NULL,
  "type" TEXT NOT NULL DEFAULT 'PROJET',
  "contextJustification" TEXT NOT NULL DEFAULT '',
  "objectives" TEXT NOT NULL DEFAULT '',
  "expectedResults" TEXT NOT NULL DEFAULT '',
  "beneficiaries" TEXT NOT NULL DEFAULT '',
  "targetAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "currency" TEXT NOT NULL DEFAULT 'XAF',
  "startDate" TIMESTAMP(3) NOT NULL,
  "endDate" TIMESTAMP(3) NOT NULL,
  "contributionMode" TEXT NOT NULL DEFAULT 'LIBRE',
  "fixedAmount" DOUBLE PRECISION,
  "contributorMode" TEXT NOT NULL DEFAULT 'IDENTIFIE',
  "scope" TEXT NOT NULL DEFAULT 'ASSOCIATION',
  "status" TEXT NOT NULL DEFAULT 'DRAFT',
  "coverUrl" TEXT,
  "publishedAt" TIMESTAMP(3),
  "closedAt" TIMESTAMP(3),
  "notificationCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fundraising_projects_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "fundraising_projects_associationId_status_idx" ON "fundraising_projects"("associationId", "status");
CREATE INDEX IF NOT EXISTS "fundraising_projects_scope_status_endDate_idx" ON "fundraising_projects"("scope", "status", "endDate");

CREATE TABLE IF NOT EXISTS "fundraising_contributions" (
  "id" TEXT NOT NULL,
  "projectId" TEXT NOT NULL,
  "contributorUserId" TEXT,
  "contributorName" TEXT,
  "contributorEmail" TEXT,
  "contributorPhone" TEXT,
  "associationId" TEXT,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'XAF',
  "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
  "message" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PLEDGED',
  "paymentMethod" TEXT,
  "paymentReference" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "fundraising_contributions_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "fundraising_contributions_projectId_status_idx" ON "fundraising_contributions"("projectId", "status");
CREATE INDEX IF NOT EXISTS "fundraising_contributions_contributorUserId_idx" ON "fundraising_contributions"("contributorUserId");
ALTER TABLE "fundraising_contributions"
  DROP CONSTRAINT IF EXISTS "fundraising_contributions_projectId_fkey";
ALTER TABLE "fundraising_contributions"
  ADD CONSTRAINT "fundraising_contributions_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "fundraising_projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
