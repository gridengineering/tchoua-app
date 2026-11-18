-- Marketplace : petites annonces multi-associations
ALTER TABLE "marketplace_listings"
  ADD COLUMN IF NOT EXISTS "associationId" TEXT,
  ADD COLUMN IF NOT EXISTS "rubrique" TEXT,
  ADD COLUMN IF NOT EXISTS "deadline" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "contactPhone" TEXT,
  ADD COLUMN IF NOT EXISTS "contactEmail" TEXT,
  ADD COLUMN IF NOT EXISTS "contactWhatsapp" TEXT,
  ADD COLUMN IF NOT EXISTS "views" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "interestCount" INTEGER NOT NULL DEFAULT 0;

ALTER TABLE "marketplace_listings" ALTER COLUMN "price" DROP NOT NULL;

CREATE INDEX IF NOT EXISTS "marketplace_listings_associationId_status_idx"
  ON "marketplace_listings" ("associationId", "status");
CREATE INDEX IF NOT EXISTS "marketplace_listings_type_category_idx"
  ON "marketplace_listings" ("type", "category");
CREATE INDEX IF NOT EXISTS "marketplace_listings_sellerId_createdAt_idx"
  ON "marketplace_listings" ("sellerId", "createdAt");

CREATE TABLE IF NOT EXISTS "marketplace_interests" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "message" TEXT,
  "contact" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketplace_interests_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "marketplace_interests_listingId_userId_key"
  ON "marketplace_interests" ("listingId", "userId");
CREATE INDEX IF NOT EXISTS "marketplace_interests_listingId_createdAt_idx"
  ON "marketplace_interests" ("listingId", "createdAt");

CREATE TABLE IF NOT EXISTS "marketplace_conversations" (
  "id" TEXT NOT NULL,
  "listingId" TEXT NOT NULL,
  "buyerId" TEXT NOT NULL,
  "sellerId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketplace_conversations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "marketplace_conversations_listingId_buyerId_key"
  ON "marketplace_conversations" ("listingId", "buyerId");
CREATE INDEX IF NOT EXISTS "marketplace_conversations_sellerId_updatedAt_idx"
  ON "marketplace_conversations" ("sellerId", "updatedAt");
CREATE INDEX IF NOT EXISTS "marketplace_conversations_buyerId_updatedAt_idx"
  ON "marketplace_conversations" ("buyerId", "updatedAt");

CREATE TABLE IF NOT EXISTS "marketplace_messages" (
  "id" TEXT NOT NULL,
  "conversationId" TEXT NOT NULL,
  "senderId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "readAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "marketplace_messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "marketplace_messages_conversationId_createdAt_idx"
  ON "marketplace_messages" ("conversationId", "createdAt");

DO $$ BEGIN
  ALTER TABLE "marketplace_listings" ADD CONSTRAINT "marketplace_listings_associationId_fkey"
    FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "marketplace_interests" ADD CONSTRAINT "marketplace_interests_listingId_fkey"
    FOREIGN KEY ("listingId") REFERENCES "marketplace_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "marketplace_interests" ADD CONSTRAINT "marketplace_interests_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "marketplace_conversations" ADD CONSTRAINT "marketplace_conversations_listingId_fkey"
    FOREIGN KEY ("listingId") REFERENCES "marketplace_listings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "marketplace_conversations" ADD CONSTRAINT "marketplace_conversations_buyerId_fkey"
    FOREIGN KEY ("buyerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "marketplace_conversations" ADD CONSTRAINT "marketplace_conversations_sellerId_fkey"
    FOREIGN KEY ("sellerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "marketplace_messages" ADD CONSTRAINT "marketplace_messages_conversationId_fkey"
    FOREIGN KEY ("conversationId") REFERENCES "marketplace_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
DO $$ BEGIN
  ALTER TABLE "marketplace_messages" ADD CONSTRAINT "marketplace_messages_senderId_fkey"
    FOREIGN KEY ("senderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
