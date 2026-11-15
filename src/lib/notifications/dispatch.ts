import { prisma } from "@/lib/prisma";
import { getGovernanceConfig } from "@/lib/governance";
import { publishToUser } from "@/lib/rtc/centrifugo";

export type NotificationEventKey =
  | "WALLET_DEPOSIT" | "WALLET_WITHDRAWAL" | "WALLET_TRANSFER"
  | "KYC_APPROVED" | "KYC_REJECTED" | "TRUST_CHANGED" | "QUARANTINE"
  | "MEETING_REMINDER" | "CONTRIBUTION_DUE" | "SECURITY_ALERT";

type DispatchInput = {
  event: NotificationEventKey;
  userId: string;
  associationId?: string | null;
  title: string;
  message: string;
  link?: string | null;
  type?: "INFO" | "WARNING" | "ACTION_REQUIRED" | "SUCCESS" | "ERROR";
  data?: Record<string, unknown>;
};

/**
 * Diffuse un événement vers l'application Tchoua Mobile :
 * notification in-app, canal chat de l'utilisateur et notification d'association.
 * Les canaux sont configurables dans Administration → Gouvernance → Notifications.
 */
export async function dispatchNotification(input: DispatchInput) {
  const governance = await getGovernanceConfig();
  if (!governance.notifications.enabled) return { delivered: false, reason: "DISABLED" };

  const rule = governance.notifications.events.find((event) => event.key === input.event);
  if (rule && !rule.enabled) return { delivered: false, reason: "EVENT_DISABLED" };
  const channels = rule?.channels ?? ["IN_APP"];

  const notification = await prisma.notification.create({
    data: {
      userId: input.userId,
      title: input.title,
      message: input.message,
      type: input.type ?? "INFO",
      link: input.link ?? null,
    },
  });

  let chatDelivered = false;
  if (channels.includes("CHAT")) {
    chatDelivered = await publishToUser(input.userId, {
      type: "notification",
      notification: {
        id: notification.id, title: input.title, message: input.message,
        type: input.type ?? "INFO", link: input.link ?? null, event: input.event,
        associationId: input.associationId ?? null, createdAt: notification.createdAt,
      },
      data: input.data ?? {},
    });
  }

  let associationNotification = null;
  if (input.associationId) {
    const membership = await prisma.associationMembership.findUnique({
      where: { userId_associationId: { userId: input.userId, associationId: input.associationId } },
      select: { id: true },
    });
    if (membership) {
      associationNotification = await prisma.associationNotification.create({
        data: {
          associationId: input.associationId,
          membershipId: membership.id,
          title: input.title,
          message: input.message,
          type: input.type ?? "INFO",
          link: input.link ?? null,
        },
      });
    }
  }

  return { delivered: true, notification, associationNotification, channels, chatDelivered };
}
