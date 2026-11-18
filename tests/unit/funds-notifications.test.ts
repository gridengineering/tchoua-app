jest.mock("@/lib/prisma", () => ({
  prisma: {
    notification: { create: jest.fn(async ({ data }: any) => ({ id: "notif-1", createdAt: new Date(), ...data })) },
    assocMessage: { create: jest.fn(async ({ data }: any) => ({ id: "msg-1", createdAt: new Date(), ...data })) },
  },
}));

jest.mock("@/lib/rtc/centrifugo", () => ({
  publishToUser: jest.fn(async () => true),
  publishAssociationEvent: jest.fn(async () => true),
}));

jest.mock("@/lib/mailer", () => ({
  sendTransactionalEmail: jest.fn(async () => true),
}));

jest.mock("@/lib/governance", () => ({
  getGovernanceConfig: jest.fn(async () => ({
    notifications: {
      enabled: true,
      events: [
        { key: "WALLET_TRANSFER", label: "Virement wallet", enabled: true, channels: ["IN_APP", "CHAT", "EMAIL"] },
        { key: "ASSOC_DEPOSIT", label: "Versement association", enabled: true, channels: ["IN_APP", "CHAT", "EMAIL"] },
      ],
    },
  })),
}));

import { prisma } from "@/lib/prisma";
import { publishAssociationEvent, publishToUser } from "@/lib/rtc/centrifugo";
import { sendTransactionalEmail } from "@/lib/mailer";
import { notifyAssociationMovement, notifyWalletMovement } from "@/lib/notifications/funds";

describe("notifications de mouvements de fonds", () => {
  beforeEach(() => jest.clearAllMocks());

  it("notifie le membre dans sa langue et envoie un e-mail pour un mouvement de wallet", async () => {
    await notifyWalletMovement({
      kind: "WALLET_SENT",
      person: { id: "u1", name: "Alice", email: "alice@example.com", language: "en" },
      amount: 25000,
      currency: "XAF",
      motif: "Scolarité",
      balance: 75000,
      counterparty: "Bob",
    });

    expect(prisma.notification.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ userId: "u1", title: "Funds transfer sent" }),
    }));
    const notice = (prisma.notification.create as jest.Mock).mock.calls[0][0].data;
    expect(notice.message).toContain("25,000 XAF");
    expect(notice.message).toContain("Scolarité");
    expect(notice.message).toContain("Bob");
    expect(publishToUser).toHaveBeenCalledWith("u1", expect.objectContaining({ type: "notification" }));
    expect(sendTransactionalEmail).toHaveBeenCalledWith(expect.objectContaining({ to: "alice@example.com" }));
  });

  it("crée un message de groupe avec la preuve et une notification pour le membre", async () => {
    await notifyAssociationMovement({
      associationId: "assoc-1",
      associationName: "Association Test",
      actorMembershipId: "mem-1",
      actorName: "Bureau",
      target: { id: "u2", name: "Jean", email: "jean@example.com", language: "fr" },
      amount: 50000,
      currency: "XAF",
      motif: "Cotisation mars",
      method: "BANK",
      balance: 150000,
      proofUrl: "/uploads/preuve.pdf",
      kind: "ASSOC_DEPOSIT",
    });

    expect(prisma.assocMessage.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        associationId: "assoc-1",
        mediaUrl: "/uploads/preuve.pdf",
        type: "DOCUMENT",
      }),
    }));
    expect(publishAssociationEvent).toHaveBeenCalledWith("assoc-1", "GENERAL", expect.anything());
    const notice = (prisma.notification.create as jest.Mock).mock.calls[0][0].data;
    expect(notice.title).toBe("Versement enregistré");
    expect(notice.message).toMatch(/50.?000 XAF/);
    expect(notice.message).toContain("Cotisation mars");
    expect(notice.link).toBe("/associations/assoc-1/comptes");
  });
});
