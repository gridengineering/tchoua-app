ALTER TABLE "platform_apps"
  ADD COLUMN IF NOT EXISTS "descriptionHtml" TEXT,
  ADD COLUMN IF NOT EXISTS "descriptionUrl" TEXT;
