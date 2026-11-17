ALTER TABLE "assoc_meetings"
  ADD COLUMN IF NOT EXISTS "modality" TEXT NOT NULL DEFAULT 'PHYSICAL',
  ADD COLUMN IF NOT EXISTS "onlineUrl" TEXT,
  ADD COLUMN IF NOT EXISTS "openedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3),
  ADD COLUMN IF NOT EXISTS "sessionPresidentId" TEXT,
  ADD COLUMN IF NOT EXISTS "sessionSecretaryId" TEXT,
  ADD COLUMN IF NOT EXISTS "sessionCensorId" TEXT,
  ADD COLUMN IF NOT EXISTS "sessionRolesExtra" TEXT,
  ADD COLUMN IF NOT EXISTS "convenedById" TEXT,
  ADD COLUMN IF NOT EXISTS "committee" TEXT,
  ADD COLUMN IF NOT EXISTS "minutesHtml" TEXT;

CREATE TABLE IF NOT EXISTS "assoc_meeting_agenda_items" (
  "id" TEXT NOT NULL,
  "meetingId" TEXT NOT NULL,
  "order" INTEGER NOT NULL,
  "title" TEXT NOT NULL,
  "presenterId" TEXT,
  "durationMin" INTEGER,
  "content" TEXT,
  "decision" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assoc_meeting_agenda_items_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "assoc_meeting_agenda_items_meetingId_order_key" ON "assoc_meeting_agenda_items"("meetingId","order");
CREATE INDEX IF NOT EXISTS "assoc_meeting_agenda_items_meetingId_idx" ON "assoc_meeting_agenda_items"("meetingId");

CREATE TABLE IF NOT EXISTS "assoc_hosting_rotations" (
  "id" TEXT NOT NULL,
  "associationId" TEXT NOT NULL,
  "membershipId" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  "cycle" INTEGER NOT NULL DEFAULT 1,
  "address" TEXT,
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "hostedMeetingId" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "assoc_hosting_rotations_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX IF NOT EXISTS "assoc_hosting_rotations_associationId_cycle_position_key" ON "assoc_hosting_rotations"("associationId","cycle","position");
CREATE INDEX IF NOT EXISTS "assoc_hosting_rotations_associationId_cycle_status_idx" ON "assoc_hosting_rotations"("associationId","cycle","status");

ALTER TABLE "assoc_meeting_agenda_items" ADD CONSTRAINT "assoc_meeting_agenda_items_meetingId_fkey" FOREIGN KEY ("meetingId") REFERENCES "assoc_meetings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assoc_hosting_rotations" ADD CONSTRAINT "assoc_hosting_rotations_associationId_fkey" FOREIGN KEY ("associationId") REFERENCES "associations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "assoc_hosting_rotations" ADD CONSTRAINT "assoc_hosting_rotations_membershipId_fkey" FOREIGN KEY ("membershipId") REFERENCES "association_memberships"("id") ON DELETE CASCADE ON UPDATE CASCADE;
