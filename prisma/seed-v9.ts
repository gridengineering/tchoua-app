import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding V9 demo associations...");

  const usersData = [
    { id: "usr-v9-001", email: "paul.biya@tchoua.cm", name: "Paul Biya", phone: "+237699000101" },
    { id: "usr-v9-002", email: "marie.kouam@tchoua.cm", name: "Marie Kouam", phone: "+237699000102" },
    { id: "usr-v9-003", email: "jean.mengue@tchoua.cm", name: "Jean Mengue", phone: "+237699000103" },
    { id: "usr-v9-004", email: "grace.ewondo@tchoua.cm", name: "Grace Ewondo", phone: "+237699000104" },
    { id: "usr-v9-005", email: "francois.nguema@tchoua.cm", name: "Francois Nguema", phone: "+237699000105" },
  ];

  const hashedPw = await bcrypt.hash("Demo1234", 12);
  for (const u of usersData) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, password: hashedPw, role: "USER" },
    });
  }
  console.log("✓ 5 demo users");

  const associations = [
    { id: "assoc-emergence-yaounde", name: "Emergence Yaoundé", slug: "emergence-yaounde", type: "INVESTMENT", status: "ACTIVE", creator: "usr-v9-001", region: "Centre" },
    { id: "assoc-femmes-actives", name: "Femmes Actives", slug: "femmes-actives", type: "TONTINE_CLUB", status: "PENDING", creator: "usr-v9-002", region: "Littoral" },
    { id: "assoc-tontine-bafoussam", name: "Tontine Bafoussam", slug: "tontine-bafoussam", type: "TONTINE_CLUB", status: "ACTIVE", creator: "usr-v9-003", region: "Ouest" },
    { id: "assoc-sante-solidarite", name: "Santé Solidarité", slug: "sante-solidarite", type: "MUTUAL", status: "ACTIVE", creator: "usr-v9-004", region: "Nord" },
    { id: "assoc-agri-cooperative", name: "Coopérative Agricole du Centre", slug: "agri-cooperative", type: "AGRICULTURAL", status: "DRAFT", creator: "usr-v9-005", region: "Est" },
  ];

  for (const a of associations) {
    await prisma.association.upsert({
      where: { id: a.id },
      update: {},
      create: {
        id: a.id, name: a.name, nameSlug: a.slug, type: a.type, status: a.status,
        creatorId: a.creator, region: a.region, activatedAt: a.status === "ACTIVE" ? new Date() : null,
      },
    });
  }
  console.log("✓ 5 associations");

  const memberships = [
    { id: "mem-ey-001", assoc: "assoc-emergence-yaounde", user: "usr-v9-001", role: "PRESIDENT" },
    { id: "mem-ey-002", assoc: "assoc-emergence-yaounde", user: "usr-v9-002", role: "SECRETARY" },
    { id: "mem-ey-003", assoc: "assoc-emergence-yaounde", user: "usr-v9-003", role: "TREASURER" },
    { id: "mem-ey-004", assoc: "assoc-emergence-yaounde", user: "usr-v9-004", role: "MEMBER" },
    { id: "mem-fa-001", assoc: "assoc-femmes-actives", user: "usr-v9-002", role: "PRESIDENT" },
    { id: "mem-fa-002", assoc: "assoc-femmes-actives", user: "usr-v9-004", role: "SECRETARY" },
    { id: "mem-fa-003", assoc: "assoc-femmes-actives", user: "usr-v9-005", role: "MEMBER" },
    { id: "mem-tb-001", assoc: "assoc-tontine-bafoussam", user: "usr-v9-003", role: "PRESIDENT" },
    { id: "mem-ss-001", assoc: "assoc-sante-solidarite", user: "usr-v9-004", role: "PRESIDENT" },
    { id: "mem-ac-001", assoc: "assoc-agri-cooperative", user: "usr-v9-005", role: "PRESIDENT" },
  ];

  for (const m of memberships) {
    await prisma.associationMembership.upsert({
      where: { id: m.id },
      update: {},
      create: {
        id: m.id, associationId: m.assoc, userId: m.user, role: m.role,
        status: "ACTIVE", joinedAt: new Date(), memberNumber: "001",
      },
    });
  }
  console.log("✓ 10 memberships");

  await prisma.associationLifecycleEvent.upsert({
    where: { id: "lev-ey-001" },
    update: {},
    create: {
      id: "lev-ey-001", associationId: "assoc-emergence-yaounde",
      fromStatus: "PENDING", toStatus: "ACTIVE",
      triggeredBy: "USER", userId: "usr-v9-001", reason: "Validation conforme",
    },
  });
  console.log("✓ lifecycle event");

  await prisma.associationRelation.upsert({
    where: { id: "rel-001" },
    update: {},
    create: {
      id: "rel-001", sourceId: "assoc-emergence-yaounde", targetId: "assoc-femmes-actives",
      type: "MOTHER", status: "ACTIVE",
    },
  });
  console.log("✓ relation");

  await prisma.election.upsert({
    where: { id: "elec-ey-001" },
    update: {},
    create: {
      id: "elec-ey-001", associationId: "assoc-emergence-yaounde",
      title: "Élection du bureau 2024", type: "BUREAU",
      status: "CLOSED", startDate: new Date("2024-01-15"), endDate: new Date("2024-01-20"),
      createdById: "usr-v9-001",
    },
  });
  console.log("✓ election");

  await prisma.approvalWorkflow.upsert({
    where: { id: "wf-ey-001" },
    update: {},
    create: {
      id: "wf-ey-001", associationId: "assoc-emergence-yaounde",
      name: "Validation des prêts", entityType: "LOAN", votingLevel: "STANDARD",
    },
  });
  await prisma.approvalStep.upsert({
    where: { id: "step-ey-001" },
    update: {},
    create: {
      id: "step-ey-001", workflowId: "wf-ey-001", stepNumber: 1,
      roleRequired: "TREASURER", action: "APPROVE",
    },
  });
  console.log("✓ workflow + step");

  await prisma.associationReport.upsert({
    where: { id: "rep-ey-001" },
    update: {},
    create: {
      id: "rep-ey-001", associationId: "assoc-emergence-yaounde",
      type: "ACTIVITY", title: "Rapport annuel 2024", format: "PDF", status: "READY",
      generatedById: "usr-v9-001", generatedAt: new Date(),
    },
  });
  console.log("✓ report");

  await prisma.associationNotification.upsert({
    where: { id: "notif-ey-001" },
    update: {},
    create: {
      id: "notif-ey-001", associationId: "assoc-emergence-yaounde",
      membershipId: "mem-ey-001", title: "Bienvenue", message: "Bienvenue dans Emergence Yaoundé",
      type: "INFO", isRead: false,
    },
  });
  console.log("✓ notification");

  await prisma.associationWebhook.upsert({
    where: { id: "wh-ey-001" },
    update: {},
    create: {
      id: "wh-ey-001", associationId: "assoc-emergence-yaounde",
      url: "https://example.com/webhook", events: '["MEMBER_JOINED","LOAN_CREATED"]',
      isActive: true, secret: "whsec_demo_123",
    },
  });
  console.log("✓ webhook");

  await prisma.associationAuditLog.upsert({
    where: { id: "audit-ey-001" },
    update: {},
    create: {
      id: "audit-ey-001", associationId: "assoc-emergence-yaounde",
      action: "CREATE", entity: "ASSOCIATION", entityId: "assoc-emergence-yaounde",
      userId: "usr-v9-001", details: "Création de l'association",
    },
  });
  console.log("✓ audit log");

  console.log("✅ V9 Seed completed!");
}

main().catch(console.error).finally(() => prisma.$disconnect());
