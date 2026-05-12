/**
 * @jest-environment node
 */
import { createMocks, RequestMethod } from "node-mocks-http";
import { mockDeep, DeepMockProxy } from "jest-mock-extended";
import { PrismaClient } from "@prisma/client";
import { getServerSession } from "next-auth";

import { PATCH as patchLifecycle } from "../[id]/lifecycle/route";
import { GET as getRelations, POST as postRelations } from "../[id]/relations/route";
import { POST as postMemberAction } from "../[id]/members/[membershipId]/actions/route";
import { GET as getElections, POST as postElection } from "../[id]/elections/route";
import { GET as getWorkflows, POST as postWorkflow } from "../[id]/workflows/route";
import { GET as getReports, POST as postReport } from "../[id]/reports/route";
import { GET as getNotifications, PATCH as patchNotifications } from "../[id]/notifications/route";
import { GET as getWebhooks, POST as postWebhook } from "../[id]/webhooks/route";

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}));

const mockedGetServerSession = getServerSession as jest.Mock;
const prismaMock = jest.requireMock("@/lib/prisma").prisma as DeepMockProxy<PrismaClient>;

function mockNextRequest(method: RequestMethod, body?: any, query?: Record<string, string>): any {
  const basePath = "http://localhost/api/associations/assoc-1";
  const search = query ? "?" + new URLSearchParams(query).toString() : "";
  const { req } = createMocks({ method, url: basePath + search, body });
  if (body) {
    Object.assign(req, { json: async () => body });
  }
  return req;
}

function mockParams(associationId: string, membershipId?: string) {
  if (membershipId) {
    return Promise.resolve({ id: associationId, membershipId });
  }
  return Promise.resolve({ id: associationId });
}

describe("Associations API Integration", () => {
  beforeEach(() => {
    jest.resetAllMocks();
    mockedGetServerSession.mockResolvedValue({
      user: { id: "user-demo-id", email: "demo@tchoua.cm" },
    });
  });

  describe("Lifecycle (/associations/[id]/lifecycle)", () => {
    it("PATCH transition DRAFT → PENDING returns 200 and updated association", async () => {
      prismaMock.association.findUnique.mockResolvedValue({ id: "assoc-1", status: "DRAFT" } as any);
      prismaMock.associationMembership.findFirst.mockResolvedValue({ id: "mem-1", role: "PRESIDENT", status: "ACTIVE" } as any);
      prismaMock.$transaction.mockResolvedValue([
        { id: "assoc-1", status: "PENDING" },
        { id: "event-1" },
        { id: "log-1" },
      ]);

      const req = mockNextRequest("PATCH", { toStatus: "PENDING", reason: "test" });
      const res = await patchLifecycle(req, { params: mockParams("assoc-1") });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.association.status).toBe("PENDING");
    });

    it("PATCH invalid transition returns 400", async () => {
      prismaMock.association.findUnique.mockResolvedValue({ id: "assoc-1", status: "DRAFT" } as any);
      prismaMock.associationMembership.findFirst.mockResolvedValue({ id: "mem-1", role: "PRESIDENT", status: "ACTIVE" } as any);

      const req = mockNextRequest("PATCH", { toStatus: "DISSOLVED", reason: "bad" });
      const res = await patchLifecycle(req, { params: mockParams("assoc-1") });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("Transition invalide");
    });

    it("PATCH without authentication returns 401", async () => {
      mockedGetServerSession.mockResolvedValueOnce(null);
      const req = mockNextRequest("PATCH", { toStatus: "PENDING" });
      const res = await patchLifecycle(req, { params: mockParams("assoc-1") });

      expect(res.status).toBe(401);
    });
  });

  describe("Relations (/associations/[id]/relations)", () => {
    it("GET lists relations and returns 200 with arrays", async () => {
      prismaMock.association.findUnique.mockResolvedValue({ id: "assoc-1" } as any);
      prismaMock.associationMembership.findFirst.mockResolvedValue({ id: "mem-1", role: "MEMBER" } as any);
      prismaMock.$transaction.mockResolvedValue([[], []]);

      const req = mockNextRequest("GET");
      const res = await getRelations(req, { params: mockParams("assoc-1") });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.sourceRelations)).toBe(true);
      expect(Array.isArray(json.targetRelations)).toBe(true);
    });

    it("POST creates a relation and returns 201", async () => {
      prismaMock.$transaction.mockResolvedValue([{ id: "assoc-1" }, { id: "assoc-2" }]);
      prismaMock.associationMembership.findFirst.mockResolvedValue({ id: "mem-1", role: "PRESIDENT", status: "ACTIVE" } as any);
      prismaMock.association.findUnique.mockResolvedValue({ parentId: null } as any);
      prismaMock.associationRelation.findMany.mockResolvedValue([]);
      prismaMock.associationRelation.create.mockResolvedValue({ id: "rel-1", sourceId: "assoc-1", targetId: "assoc-2", type: "SISTER" } as any);

      const req = mockNextRequest("POST", { targetId: "assoc-2", type: "SISTER" });
      const res = await postRelations(req, { params: mockParams("assoc-1") });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.relation).toBeDefined();
    });

    it("POST relation with self returns 400", async () => {
      prismaMock.$transaction.mockResolvedValue([{ id: "assoc-1" }, { id: "assoc-1" }]);
      prismaMock.association.findUnique.mockResolvedValue({ id: "assoc-1" } as any);
      prismaMock.associationMembership.findFirst.mockResolvedValue({ id: "mem-1", role: "PRESIDENT", status: "ACTIVE" } as any);

      const req = mockNextRequest("POST", { targetId: "assoc-1", type: "CHILD" });
      const res = await postRelations(req, { params: mockParams("assoc-1") });

      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain("cycle");
    });
  });

  describe("Members actions (/associations/[id]/members/[membershipId]/actions)", () => {
    it("POST SUSPEND updates status to SUSPENDED", async () => {
      prismaMock.associationMembership.findFirst
        .mockResolvedValueOnce({ id: "actor-1", role: "PRESIDENT", status: "ACTIVE" } as any)
        .mockResolvedValueOnce({ id: "target-1", associationId: "assoc-1", status: "ACTIVE" } as any);
      prismaMock.associationMembership.update.mockResolvedValue({ id: "target-1", status: "SUSPENDED" } as any);
      prismaMock.associationAuditLog.create.mockResolvedValue({ id: "log-1" } as any);

      const req = mockNextRequest("POST", { action: "SUSPEND", reason: "Violation" });
      const res = await postMemberAction(req, { params: mockParams("assoc-1", "target-1") });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.membership.status).toBe("SUSPENDED");
    });

    it("POST EXCLUDE updates status to EXPELLED", async () => {
      prismaMock.associationMembership.findFirst
        .mockResolvedValueOnce({ id: "actor-1", role: "SECRETARY", status: "ACTIVE" } as any)
        .mockResolvedValueOnce({ id: "target-1", associationId: "assoc-1", status: "ACTIVE" } as any);
      prismaMock.associationMembership.update.mockResolvedValue({ id: "target-1", status: "EXPELLED", excludedAt: new Date(), excludeReason: "Bad behavior" } as any);
      prismaMock.associationAuditLog.create.mockResolvedValue({ id: "log-1" } as any);

      const req = mockNextRequest("POST", { action: "EXCLUDE", reason: "Bad behavior" });
      const res = await postMemberAction(req, { params: mockParams("assoc-1", "target-1") });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.membership.status).toBe("EXPELLED");
    });

    it("POST without permission returns 403", async () => {
      prismaMock.associationMembership.findFirst.mockResolvedValue({ id: "actor-1", role: "MEMBER", status: "ACTIVE" } as any);

      const req = mockNextRequest("POST", { action: "SUSPEND" });
      const res = await postMemberAction(req, { params: mockParams("assoc-1", "target-1") });

      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.error).toContain("Permission");
    });
  });

  describe("Elections (/associations/[id]/elections)", () => {
    it("GET lists elections and returns 200", async () => {
      prismaMock.associationMembership.findFirst.mockResolvedValue({ id: "mem-1", role: "MEMBER", status: "ACTIVE" } as any);
      prismaMock.election.findMany.mockResolvedValue([{ id: "elec-1", title: "Election 1" }] as any);

      const req = mockNextRequest("GET");
      const res = await getElections(req, { params: mockParams("assoc-1") });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.elections)).toBe(true);
    });

    it("POST creates an election and returns 201", async () => {
      prismaMock.associationMembership.findFirst.mockResolvedValue({ id: "mem-1", role: "PRESIDENT", status: "ACTIVE" } as any);
      prismaMock.election.create.mockResolvedValue({ id: "elec-2", title: "New Election", status: "DRAFT" } as any);

      const req = mockNextRequest("POST", { title: "New Election", type: "BUREAU" });
      const res = await postElection(req, { params: mockParams("assoc-1") });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.election.title).toBe("New Election");
    });
  });

  describe("Workflows (/associations/[id]/workflows)", () => {
    it("GET lists workflows and returns 200", async () => {
      prismaMock.associationMembership.findFirst.mockResolvedValue({ id: "mem-1", role: "MEMBER", status: "ACTIVE" } as any);
      prismaMock.approvalWorkflow.findMany.mockResolvedValue([{ id: "wf-1", name: "Approval" }] as any);

      const req = mockNextRequest("GET");
      const res = await getWorkflows(req, { params: mockParams("assoc-1") });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.workflows)).toBe(true);
    });

    it("POST creates a workflow with steps and returns 201", async () => {
      prismaMock.associationMembership.findFirst.mockResolvedValue({ id: "mem-1", role: "PRESIDENT", status: "ACTIVE" } as any);
      prismaMock.approvalWorkflow.create.mockResolvedValue({
        id: "wf-2",
        name: "Loan Approval",
        steps: [{ id: "step-1", stepNumber: 1, roleRequired: "TREASURER" }],
      } as any);

      const req = mockNextRequest("POST", {
        name: "Loan Approval",
        entityType: "LOAN",
        steps: [{ stepNumber: 1, roleRequired: "TREASURER" }],
      });
      const res = await postWorkflow(req, { params: mockParams("assoc-1") });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.workflow.steps.length).toBe(1);
    });
  });

  describe("Reports (/associations/[id]/reports)", () => {
    it("GET lists reports and returns 200", async () => {
      prismaMock.associationMembership.findFirst.mockResolvedValue({ id: "mem-1", role: "TREASURER", status: "ACTIVE" } as any);
      prismaMock.associationReport.findMany.mockResolvedValue([{ id: "rep-1", title: "Rapport 1" }] as any);
      prismaMock.associationReport.count.mockResolvedValue(1);

      const req = mockNextRequest("GET");
      const res = await getReports(req, { params: mockParams("assoc-1") });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.reports)).toBe(true);
      expect(json.pagination.total).toBe(1);
    });

    it("POST creates a report and returns 201 with status PENDING", async () => {
      prismaMock.associationMembership.findFirst.mockResolvedValue({ id: "mem-1", role: "SECRETARY", status: "ACTIVE" } as any);
      prismaMock.associationReport.create.mockResolvedValue({ id: "rep-2", title: "New Report", status: "PENDING" } as any);
      prismaMock.associationReport.update.mockResolvedValue({ id: "rep-2", status: "READY" } as any);
      prismaMock.associationReport.findUnique.mockResolvedValue({ id: "rep-2", title: "New Report", status: "PENDING" } as any);

      const req = mockNextRequest("POST", { type: "CUSTOM", title: "New Report" });
      const res = await postReport(req, { params: mockParams("assoc-1") });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.report.status).toBe("PENDING");
    });
  });

  describe("Notifications (/associations/[id]/notifications)", () => {
    it("GET returns notifications with 200", async () => {
      prismaMock.associationMembership.findUnique.mockResolvedValue({ id: "mem-1" } as any);
      prismaMock.associationNotification.findMany.mockResolvedValue([{ id: "notif-1", message: "Hello" }] as any);
      prismaMock.associationNotification.count.mockResolvedValue(1);

      const req = mockNextRequest("GET");
      const res = await getNotifications(req, { params: mockParams("assoc-1") });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.notifications)).toBe(true);
      expect(json.unreadCount).toBe(1);
    });

    it("PATCH marks notifications as read and returns 200", async () => {
      prismaMock.associationMembership.findUnique.mockResolvedValue({ id: "mem-1" } as any);
      prismaMock.associationNotification.updateMany.mockResolvedValue({ count: 2 } as any);

      const req = mockNextRequest("PATCH", { ids: ["notif-1", "notif-2"] });
      const res = await patchNotifications(req, { params: mockParams("assoc-1") });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });
  });

  describe("Webhooks (/associations/[id]/webhooks)", () => {
    it("GET lists webhooks and returns 200", async () => {
      prismaMock.associationMembership.findFirst.mockResolvedValue({ id: "mem-1", role: "PRESIDENT", status: "ACTIVE" } as any);
      prismaMock.associationWebhook.findMany.mockResolvedValue([{ id: "wh-1", url: "https://example.com" }] as any);

      const req = mockNextRequest("GET");
      const res = await getWebhooks(req, { params: mockParams("assoc-1") });

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(Array.isArray(json.webhooks)).toBe(true);
    });

    it("POST creates a webhook and returns 201", async () => {
      prismaMock.associationMembership.findFirst.mockResolvedValue({ id: "mem-1", role: "TREASURER", status: "ACTIVE" } as any);
      prismaMock.associationWebhook.create.mockResolvedValue({ id: "wh-2", url: "https://hook.example.com", events: '["MEMBER_JOIN"]' } as any);

      const req = mockNextRequest("POST", { url: "https://hook.example.com", events: ["MEMBER_JOIN"] });
      const res = await postWebhook(req, { params: mockParams("assoc-1") });

      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.webhook.url).toBe("https://hook.example.com");
    });
  });
});
