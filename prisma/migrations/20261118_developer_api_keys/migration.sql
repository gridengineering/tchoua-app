-- Clés API développeurs externes
CREATE TABLE IF NOT EXISTS "developer_api_keys" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "prefix" TEXT NOT NULL,
  "keyHash" TEXT NOT NULL,
  "scopes" TEXT NOT NULL DEFAULT 'apps:write apps:read',
  "lastUsedAt" TIMESTAMP(3),
  "revokedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "developer_api_keys_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "developer_api_keys_prefix_key" ON "developer_api_keys" ("prefix");
CREATE INDEX IF NOT EXISTS "developer_api_keys_userId_revokedAt_idx" ON "developer_api_keys" ("userId", "revokedAt");
DO $$ BEGIN
  ALTER TABLE "developer_api_keys" ADD CONSTRAINT "developer_api_keys_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
