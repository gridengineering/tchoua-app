-- Groupes de rôles, droits d'accès et règles d'enregistrement.
-- Cette migration conserve les rôles existants et les rattache à un groupe
-- facultatif. Les règles d'enregistrement sont inspirées du modèle Odoo :
-- ressource + domaine JSON + opérations + cible (rôle, groupe ou global).

CREATE TABLE IF NOT EXISTS "system_role_groups" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "color" TEXT NOT NULL DEFAULT '#6366f1',
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  "parentId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "system_role_groups_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "system_role_groups_name_key" ON "system_role_groups"("name");
CREATE INDEX IF NOT EXISTS "system_role_groups_parentId_idx" ON "system_role_groups"("parentId");

ALTER TABLE "system_roles" ADD COLUMN IF NOT EXISTS "groupId" TEXT;
CREATE INDEX IF NOT EXISTS "system_roles_groupId_idx" ON "system_roles"("groupId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'system_role_groups_parentId_fkey'
  ) THEN
    ALTER TABLE "system_role_groups"
      ADD CONSTRAINT "system_role_groups_parentId_fkey"
      FOREIGN KEY ("parentId") REFERENCES "system_role_groups"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'system_roles_groupId_fkey'
  ) THEN
    ALTER TABLE "system_roles"
      ADD CONSTRAINT "system_roles_groupId_fkey"
      FOREIGN KEY ("groupId") REFERENCES "system_role_groups"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "system_record_rules" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "description" TEXT,
  "resource" TEXT NOT NULL,
  "domain" TEXT NOT NULL DEFAULT '[]',
  "operations" TEXT NOT NULL DEFAULT 'READ',
  "active" BOOLEAN NOT NULL DEFAULT TRUE,
  "roleId" TEXT,
  "groupId" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "system_record_rules_pkey" PRIMARY KEY ("id")
);
CREATE INDEX IF NOT EXISTS "system_record_rules_resource_roleId_idx" ON "system_record_rules"("resource", "roleId");
CREATE INDEX IF NOT EXISTS "system_record_rules_resource_groupId_idx" ON "system_record_rules"("resource", "groupId");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'system_record_rules_roleId_fkey'
  ) THEN
    ALTER TABLE "system_record_rules"
      ADD CONSTRAINT "system_record_rules_roleId_fkey"
      FOREIGN KEY ("roleId") REFERENCES "system_roles"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'system_record_rules_groupId_fkey'
  ) THEN
    ALTER TABLE "system_record_rules"
      ADD CONSTRAINT "system_record_rules_groupId_fkey"
      FOREIGN KEY ("groupId") REFERENCES "system_role_groups"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
