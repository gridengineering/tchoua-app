-- ARP : cadre de gestion, versions et noyau des fonds.
-- Migration idempotente, appliquée manuellement sur la base de production.

CREATE TABLE IF NOT EXISTS arp_profiles (
  id              TEXT PRIMARY KEY,
  "associationId" TEXT NOT NULL UNIQUE,
  structure       TEXT NOT NULL DEFAULT 'AUTONOME',
  status          TEXT NOT NULL DEFAULT 'DRAFT',
  origin          TEXT NOT NULL DEFAULT 'MANUAL',
  version         INTEGER NOT NULL DEFAULT 1,
  config          JSONB NOT NULL,
  checks          JSONB,
  "draftConfig"   JSONB,
  "draftChecks"   JSONB,
  "effectiveAt"   TIMESTAMP(3),
  "approvedById"  TEXT,
  "approvedAt"    TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT arp_profiles_association_fk
    FOREIGN KEY ("associationId") REFERENCES associations(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS arp_profiles_status_idx ON arp_profiles(status);

CREATE TABLE IF NOT EXISTS arp_profile_versions (
  id              TEXT PRIMARY KEY,
  "profileId"     TEXT NOT NULL,
  "associationId" TEXT NOT NULL,
  version         INTEGER NOT NULL,
  status          TEXT NOT NULL,
  origin          TEXT NOT NULL DEFAULT 'MANUAL',
  config          JSONB NOT NULL,
  checks          JSONB,
  hash            TEXT NOT NULL,
  "createdById"   TEXT,
  "approvedById"  TEXT,
  "effectiveAt"   TIMESTAMP(3),
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT arp_profile_versions_profile_fk
    FOREIGN KEY ("profileId") REFERENCES arp_profiles(id) ON DELETE CASCADE,
  CONSTRAINT arp_profile_versions_association_fk
    FOREIGN KEY ("associationId") REFERENCES associations(id) ON DELETE CASCADE,
  CONSTRAINT arp_profile_versions_unique UNIQUE ("profileId", version)
);

CREATE INDEX IF NOT EXISTS arp_profile_versions_assoc_idx
  ON arp_profile_versions("associationId", "createdAt");

CREATE TABLE IF NOT EXISTS arp_funds (
  id              TEXT PRIMARY KEY,
  "associationId" TEXT NOT NULL,
  code            TEXT NOT NULL,
  name            TEXT NOT NULL,
  type            TEXT NOT NULL DEFAULT 'LIBRE',
  currency        TEXT NOT NULL DEFAULT 'XAF',
  "activityId"    TEXT,
  status          TEXT NOT NULL DEFAULT 'ACTIVE',
  "createdById"   TEXT,
  "createdAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT arp_funds_association_fk
    FOREIGN KEY ("associationId") REFERENCES associations(id) ON DELETE CASCADE,
  CONSTRAINT arp_funds_activity_fk
    FOREIGN KEY ("activityId") REFERENCES association_activities(id) ON DELETE SET NULL,
  CONSTRAINT arp_funds_code_unique UNIQUE ("associationId", code)
);

CREATE INDEX IF NOT EXISTS arp_funds_assoc_status_idx ON arp_funds("associationId", status);

CREATE TABLE IF NOT EXISTS arp_fund_movements (
  id            TEXT PRIMARY KEY,
  "fundId"      TEXT NOT NULL,
  direction     TEXT NOT NULL,
  "amountMinor" BIGINT NOT NULL,
  currency      TEXT NOT NULL,
  "valueDate"   TIMESTAMP(3) NOT NULL,
  "occurredAt"  TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "sourceType"  TEXT NOT NULL DEFAULT 'MANUAL',
  "sourceId"    TEXT,
  description   TEXT NOT NULL,
  "reversesId"  TEXT,
  "createdById" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT arp_fund_movements_fund_fk
    FOREIGN KEY ("fundId") REFERENCES arp_funds(id) ON DELETE CASCADE,
  CONSTRAINT arp_fund_movements_amount_positive CHECK ("amountMinor" > 0),
  CONSTRAINT arp_fund_movements_direction CHECK (direction IN ('IN', 'OUT'))
);

CREATE INDEX IF NOT EXISTS arp_fund_movements_fund_idx
  ON arp_fund_movements("fundId", "occurredAt");
CREATE INDEX IF NOT EXISTS arp_fund_movements_source_idx
  ON arp_fund_movements("sourceType", "sourceId");

CREATE TABLE IF NOT EXISTS arp_fund_reservations (
  id            TEXT PRIMARY KEY,
  "fundId"      TEXT NOT NULL,
  "amountMinor" BIGINT NOT NULL,
  currency      TEXT NOT NULL,
  purpose       TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'ACTIVE',
  "expiresAt"   TIMESTAMP(3),
  "consumedAt"  TIMESTAMP(3),
  "releasedAt"  TIMESTAMP(3),
  "createdById" TEXT,
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT arp_fund_reservations_fund_fk
    FOREIGN KEY ("fundId") REFERENCES arp_funds(id) ON DELETE CASCADE,
  CONSTRAINT arp_fund_reservations_amount_positive CHECK ("amountMinor" > 0),
  CONSTRAINT arp_fund_reservations_status CHECK (status IN ('ACTIVE', 'RELEASED', 'CONSUMED'))
);

CREATE INDEX IF NOT EXISTS arp_fund_reservations_fund_idx
  ON arp_fund_reservations("fundId", status);
