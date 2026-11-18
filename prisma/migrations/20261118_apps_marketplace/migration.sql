-- Apps marketplace : registry des apps et installations
CREATE TABLE IF NOT EXISTS "platform_apps" (
  "id" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "tagline" TEXT,
  "description" TEXT,
  "developerName" TEXT NOT NULL,
  "developerUrl" TEXT,
  "repositoryUrl" TEXT,
  "homepageUrl" TEXT,
  "iconUrl" TEXT,
  "coverUrl" TEXT,
  "scope" TEXT NOT NULL,
  "category" TEXT NOT NULL DEFAULT 'Productivité',
  "status" TEXT NOT NULL DEFAULT 'PUBLISHED',
  "version" TEXT NOT NULL DEFAULT '1.0.0',
  "manifest" TEXT,
  "permissions" TEXT,
  "screenshots" TEXT,
  "installCount" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "platform_apps_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "platform_apps_slug_key" ON "platform_apps" ("slug");
CREATE INDEX IF NOT EXISTS "platform_apps_scope_status_idx" ON "platform_apps" ("scope", "status");
CREATE INDEX IF NOT EXISTS "platform_apps_category_status_idx" ON "platform_apps" ("category", "status");

CREATE TABLE IF NOT EXISTS "app_installations" (
  "id" TEXT NOT NULL,
  "appId" TEXT NOT NULL,
  "userId" TEXT,
  "associationId" TEXT,
  "status" TEXT NOT NULL DEFAULT 'ACTIVE',
  "version" TEXT NOT NULL DEFAULT '1.0.0',
  "settings" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "app_installations_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "app_installations_appId_userId_idx" ON "app_installations" ("appId", "userId");
CREATE INDEX IF NOT EXISTS "app_installations_appId_associationId_idx" ON "app_installations" ("appId", "associationId");

DO $$ BEGIN
  ALTER TABLE "app_installations" ADD CONSTRAINT "app_installations_appId_fkey"
    FOREIGN KEY ("appId") REFERENCES "platform_apps"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "app_installations" ADD CONSTRAINT "app_installations_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "app_installations" ADD CONSTRAINT "app_installations_associationId_fkey"
    FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
