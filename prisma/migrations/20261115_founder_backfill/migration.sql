-- Alignement des données historiques : le créateur d'une association est
-- fondateur. Les imports antérieurs avaient parfois créé le créateur comme
-- simple membre, ou ne lui avaient pas créé d'adhésion.

INSERT INTO "association_memberships"
  ("id", "userId", "associationId", "role", "status", "joinedAt", "createdAt", "updatedAt")
SELECT
  md5(random()::text || clock_timestamp()::text),
  a."creatorId",
  a.id,
  'FOUNDER',
  'ACTIVE',
  a."createdAt",
  now(),
  now()
FROM "associations" a
WHERE NOT EXISTS (
  SELECT 1 FROM "association_memberships" m
  WHERE m."associationId" = a.id AND m."userId" = a."creatorId"
);

UPDATE "association_memberships" m
SET "role" = 'FOUNDER', "status" = 'ACTIVE', "updatedAt" = now()
FROM "associations" a
WHERE m."associationId" = a.id
  AND m."userId" = a."creatorId"
  AND m."role" <> 'FOUNDER';
