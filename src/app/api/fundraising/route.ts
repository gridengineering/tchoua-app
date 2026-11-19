import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  cleanText,
  dateOrNull,
  getFundraisingActor,
  isContributionMode,
  isContributorMode,
  isFundraisingScope,
  isFundraisingType,
  canManage,
  safeAmount,
  serializeProject,
} from "@/lib/fundraising";
import { notifyFundraisingProject } from "@/lib/fundraising/notifications";

const contributionSelect = { amount: true, status: true, contributorUserId: true, contributorEmail: true, id: true, createdAt: true };

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const hasBearer = Boolean(req.headers.get("authorization"));
  const actor = await getFundraisingActor(req, searchParams.get("associationId"));
  if (hasBearer && !actor) return NextResponse.json({ error: "Jeton d'application invalide." }, { status: 401 });

  const publicOnly = !actor || searchParams.get("public") === "1";
  const type = searchParams.get("type");
  const scope = searchParams.get("scope");
  const q = cleanText(searchParams.get("q"), 120);

  const where: any = publicOnly
    ? { scope: "PUBLIC", status: { in: ["PUBLISHED", "CLOSED"] } }
    : actor!.isBureau
      ? {
          OR: [
            { associationId: actor!.associationId },
            { scope: { in: ["ALL_ASSOCIATIONS", "PUBLIC"] }, status: { in: ["PUBLISHED", "CLOSED"] } },
          ],
        }
      : {
          OR: [
            { associationId: actor!.associationId, status: { in: ["PUBLISHED", "CLOSED"] } },
            { scope: { in: ["ALL_ASSOCIATIONS", "PUBLIC"] }, status: { in: ["PUBLISHED", "CLOSED"] } },
          ],
        };

  if (isFundraisingType(type)) where.type = type;
  if (isFundraisingScope(scope)) where.scope = scope;
  if (q) where.AND = [{ OR: [{ title: { contains: q, mode: "insensitive" } }, { objectives: { contains: q, mode: "insensitive" } }] }];

  const projects = await prisma.fundraisingProject.findMany({
    where,
    orderBy: [{ status: "asc" }, { publishedAt: "desc" }, { createdAt: "desc" }],
    take: 100,
    include: {
      contributions: { select: contributionSelect },
      _count: { select: { contributions: true } },
    },
  });

  return NextResponse.json({
    projects: projects.map((project) => serializeProject(project, { isManager: Boolean(actor?.isBureau) })),
    publicOnly,
    actor: actor ? { associationId: actor.associationId, role: actor.role, isBureau: actor.isBureau } : null,
  });
}

export async function POST(req: NextRequest) {
  let body: any;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "JSON invalide." }, { status: 400 }); }
  const actor = await getFundraisingActor(req, cleanText(body?.associationId) || null);
  if (!actor) return NextResponse.json({ error: "Non autorisé." }, { status: 401 });
  if (!canManage(actor)) return NextResponse.json({ error: "Réservé au fondateur et au bureau." }, { status: 403 });

  const title = cleanText(body.title, 160);
  const type = body.type;
  const contextJustification = cleanText(body.contextJustification);
  const objectives = cleanText(body.objectives);
  const expectedResults = cleanText(body.expectedResults);
  const beneficiaries = cleanText(body.beneficiaries);
  const targetAmount = safeAmount(body.targetAmount);
  const startDate = dateOrNull(body.startDate);
  const endDate = dateOrNull(body.endDate);
  const contributionMode = body.contributionMode;
  const fixedAmount = body.fixedAmount == null || body.fixedAmount === "" ? null : safeAmount(body.fixedAmount);
  const contributorMode = body.contributorMode;
  const scope = body.scope;
  const status = body.status === "PUBLISHED" ? "PUBLISHED" : "DRAFT";

  if (!title || title.length < 3) return NextResponse.json({ error: "Le titre du projet est requis." }, { status: 400 });
  if (!isFundraisingType(type)) return NextResponse.json({ error: "Type de levée invalide." }, { status: 400 });
  if (!startDate || !endDate || endDate <= startDate) return NextResponse.json({ error: "La date de fin doit être postérieure à la date de début." }, { status: 400 });
  if (!isContributionMode(contributionMode)) return NextResponse.json({ error: "Mode de contribution invalide." }, { status: 400 });
  if (contributionMode === "FIXE" && (!fixedAmount || fixedAmount <= 0)) return NextResponse.json({ error: "Le montant fixe est requis." }, { status: 400 });
  if (!isContributorMode(contributorMode)) return NextResponse.json({ error: "Mode de contributeur invalide." }, { status: 400 });
  if (!isFundraisingScope(scope)) return NextResponse.json({ error: "Portée invalide." }, { status: 400 });
  if (status === "PUBLISHED") {
    if (targetAmount <= 0) return NextResponse.json({ error: "La cagnotte cible doit être supérieure à 0." }, { status: 400 });
    if (!contextJustification || !objectives || !expectedResults || !beneficiaries) {
      return NextResponse.json({ error: "Contexte, objectifs, résultats attendus et bénéficiaires sont requis avant publication." }, { status: 400 });
    }
  }

  const project = await prisma.fundraisingProject.create({
    data: {
      associationId: actor.associationId,
      createdById: actor.userId,
      title,
      type,
      contextJustification,
      objectives,
      expectedResults,
      beneficiaries,
      targetAmount,
      startDate,
      endDate,
      contributionMode,
      fixedAmount: contributionMode === "FIXE" ? fixedAmount : null,
      contributorMode,
      scope,
      status,
      publishedAt: status === "PUBLISHED" ? new Date() : null,
    },
    include: { contributions: { select: contributionSelect } },
  });

  if (status === "PUBLISHED") await notifyFundraisingProject(project);

  const fresh = await prisma.fundraisingProject.findUnique({
    where: { id: project.id },
    include: { contributions: { select: contributionSelect } },
  });
  return NextResponse.json({ project: serializeProject(fresh, { isManager: true }) }, { status: 201 });
}
