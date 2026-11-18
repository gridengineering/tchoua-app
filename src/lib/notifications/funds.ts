import { prisma } from "@/lib/prisma";
import { publishAssociationEvent, publishToUser } from "@/lib/rtc/centrifugo";
import { sendTransactionalEmail } from "@/lib/mailer";

export type FundsLang = "fr" | "en" | "es" | "de";

export type FundsPerson = {
  id: string;
  name: string;
  email?: string | null;
  language?: string | null;
};

export type FundsMovement = {
  associationId: string;
  associationName: string;
  actorMembershipId: string;
  actorName: string;
  target: FundsPerson;
  amount: number;
  currency: string;
  motif: string;
  method: string;
  balance?: number | null;
  proofUrl?: string | null;
  activityName?: string | null;
  kind:
    | "ASSOC_DEPOSIT"
    | "ASSOC_PENDING"
    | "ASSOC_CONFIRM"
    | "ASSOC_PAYOUT"
    | "ASSOC_SETTLE"
    | "ASSOC_ACTIVITY";
};

export type WalletMovementNotice = {
  kind: "WALLET_DEPOSIT" | "WALLET_WITHDRAWAL" | "WALLET_SENT" | "WALLET_RECEIVED";
  person: FundsPerson;
  amount: number;
  currency: string;
  motif: string;
  balance?: number | null;
  counterparty?: string | null;
};

function langOf(value: string | null | undefined): FundsLang {
  const lang = (value || "fr").toLowerCase().slice(0, 2);
  return lang === "en" || lang === "es" || lang === "de" ? lang : "fr";
}

function money(amount: number, currency: string, lang: FundsLang) {
  const locale = lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : lang === "de" ? "de-DE" : "en-US";
  return `${new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(Number(amount || 0))} ${currency}`;
}

function methodLabel(method: string, lang: FundsLang) {
  const labels: Record<FundsLang, Record<string, string>> = {
    fr: { WALLET: "wallet", BANK: "banque", CASH: "espèces", ACTIVITY: "activité", MEMBER_ACCOUNT: "compte association" },
    en: { WALLET: "wallet", BANK: "bank", CASH: "cash", ACTIVITY: "activity", MEMBER_ACCOUNT: "association account" },
    es: { WALLET: "wallet", BANK: "banco", CASH: "efectivo", ACTIVITY: "actividad", MEMBER_ACCOUNT: "cuenta de la asociación" },
    de: { WALLET: "Wallet", BANK: "Bank", CASH: "Bargeld", ACTIVITY: "Aktivität", MEMBER_ACCOUNT: "Vereinskonto" },
  };
  return labels[lang][method.toUpperCase()] ?? method.toLowerCase();
}

type NoticeText = { title: string; text: string; group: string };

function textFor(movement: FundsMovement, lang: FundsLang): NoticeText {
  const amount = money(movement.amount, movement.currency, lang);
  const balance = movement.balance == null ? "" : money(movement.balance, movement.currency, lang);
  const motif = movement.motif || (lang === "fr" ? "non précisé" : lang === "es" ? "no especificado" : lang === "de" ? "nicht angegeben" : "not specified");
  const method = methodLabel(movement.method, lang);
  const member = movement.target.name;
  const assoc = movement.associationName;
  const activity = movement.activityName ? ` · ${movement.activityName}` : "";
  const suffix = balance ? (lang === "fr" ? ` Nouveau solde : ${balance}.` : lang === "es" ? ` Nuevo saldo: ${balance}.` : lang === "de" ? ` Neuer Saldo: ${balance}.` : ` New balance: ${balance}.`) : "";

  const dictionaries: Record<FundsLang, Record<FundsMovement["kind"], NoticeText>> = {
    fr: {
      ASSOC_DEPOSIT: {
        title: "Versement enregistré",
        text: `Votre versement de ${amount} à ${assoc} a été enregistré. Motif : ${motif}. Moyen : ${method}.${suffix}`,
        group: `💸 ${member} a approvisionné son compte association de ${amount} · ${method} · Motif : ${motif}${activity}.`,
      },
      ASSOC_PENDING: {
        title: "Versement en attente de rapprochement",
        text: `Votre versement de ${amount} à ${assoc} est enregistré en attente. Motif : ${motif}. Le bureau doit confirmer la preuve bancaire.`,
        group: `⏳ ${member} a déclaré un versement de ${amount} · ${method} · Motif : ${motif}${activity}. En attente de rapprochement.`,
      },
      ASSOC_CONFIRM: {
        title: "Versement confirmé",
        text: `Votre versement de ${amount} à ${assoc} a été confirmé et crédité. Motif : ${motif}.${suffix}`,
        group: `✅ Versement confirmé pour ${member} : ${amount} · ${method} · Motif : ${motif}${activity}.`,
      },
      ASSOC_PAYOUT: {
        title: "Paiement reçu de l'association",
        text: `L'association ${assoc} vous a versé ${amount} sur ${method}. Motif : ${motif}.${suffix}`,
        group: `💸 L'association a payé ${member} : ${amount} · ${method} · Motif : ${motif}${activity}.`,
      },
      ASSOC_SETTLE: {
        title: "Engagement réglé",
        text: `Votre engagement de ${amount} a été réglé depuis votre AVOIR auprès de ${assoc}. Motif : ${motif}.${suffix}`,
        group: `🧾 ${member} a réglé ${amount} depuis son AVOIR · Motif : ${motif}${activity}.`,
      },
      ASSOC_ACTIVITY: {
        title: "Bénéfice d'activité crédité",
        text: `${amount} ont été crédités sur votre AVOIR auprès de ${assoc}${movement.activityName ? ` (${movement.activityName})` : ""}. Motif : ${motif}.${suffix}`,
        group: `🎁 ${member} a reçu ${amount} sur son AVOIR${activity} · Motif : ${motif}.`,
      },
    },
    en: {
      ASSOC_DEPOSIT: {
        title: "Deposit recorded",
        text: `Your deposit of ${amount} to ${assoc} has been recorded. Reason: ${motif}. Method: ${method}.${suffix}`,
        group: `💸 ${member} topped up their association account with ${amount} · ${method} · Reason: ${motif}${activity}.`,
      },
      ASSOC_PENDING: {
        title: "Deposit awaiting reconciliation",
        text: `Your deposit of ${amount} to ${assoc} is pending. Reason: ${motif}. The board must confirm the bank proof.`,
        group: `⏳ ${member} reported a deposit of ${amount} · ${method} · Reason: ${motif}${activity}. Awaiting reconciliation.`,
      },
      ASSOC_CONFIRM: {
        title: "Deposit confirmed",
        text: `Your deposit of ${amount} to ${assoc} has been confirmed and credited. Reason: ${motif}.${suffix}`,
        group: `✅ Deposit confirmed for ${member}: ${amount} · ${method} · Reason: ${motif}${activity}.`,
      },
      ASSOC_PAYOUT: {
        title: "Payment received from the association",
        text: `The association ${assoc} paid you ${amount} via ${method}. Reason: ${motif}.${suffix}`,
        group: `💸 The association paid ${member}: ${amount} · ${method} · Reason: ${motif}${activity}.`,
      },
      ASSOC_SETTLE: {
        title: "Commitment settled",
        text: `Your commitment of ${amount} was settled from your member account with ${assoc}. Reason: ${motif}.${suffix}`,
        group: `🧾 ${member} settled ${amount} from their member account · Reason: ${motif}${activity}.`,
      },
      ASSOC_ACTIVITY: {
        title: "Activity benefit credited",
        text: `${amount} were credited to your member account with ${assoc}${movement.activityName ? ` (${movement.activityName})` : ""}. Reason: ${motif}.${suffix}`,
        group: `🎁 ${member} received ${amount} in their member account${activity} · Reason: ${motif}.`,
      },
    },
    es: {
      ASSOC_DEPOSIT: {
        title: "Depósito registrado",
        text: `Su depósito de ${amount} a ${assoc} ha sido registrado. Motivo: ${motif}. Medio: ${method}.${suffix}`,
        group: `💸 ${member} aprovisionó su cuenta de asociación con ${amount} · ${method} · Motivo: ${motif}${activity}.`,
      },
      ASSOC_PENDING: {
        title: "Depósito pendiente de conciliación",
        text: `Su depósito de ${amount} a ${assoc} está pendiente. Motivo: ${motif}. La junta debe confirmar el justificante bancario.`,
        group: `⏳ ${member} declaró un depósito de ${amount} · ${method} · Motivo: ${motif}${activity}. Pendiente de conciliación.`,
      },
      ASSOC_CONFIRM: {
        title: "Depósito confirmado",
        text: `Su depósito de ${amount} a ${assoc} ha sido confirmado y acreditado. Motivo: ${motif}.${suffix}`,
        group: `✅ Depósito confirmado para ${member}: ${amount} · ${method} · Motivo: ${motif}${activity}.`,
      },
      ASSOC_PAYOUT: {
        title: "Pago recibido de la asociación",
        text: `La asociación ${assoc} le pagó ${amount} por ${method}. Motivo: ${motif}.${suffix}`,
        group: `💸 La asociación pagó a ${member}: ${amount} · ${method} · Motivo: ${motif}${activity}.`,
      },
      ASSOC_SETTLE: {
        title: "Compromiso liquidado",
        text: `Su compromiso de ${amount} fue liquidado desde su cuenta de miembro con ${assoc}. Motivo: ${motif}.${suffix}`,
        group: `🧾 ${member} liquidó ${amount} desde su cuenta de miembro · Motivo: ${motif}${activity}.`,
      },
      ASSOC_ACTIVITY: {
        title: "Beneficio de actividad acreditado",
        text: `${amount} fueron acreditados en su cuenta de miembro con ${assoc}${movement.activityName ? ` (${movement.activityName})` : ""}. Motivo: ${motif}.${suffix}`,
        group: `🎁 ${member} recibió ${amount} en su cuenta de miembro${activity} · Motivo: ${motif}.`,
      },
    },
    de: {
      ASSOC_DEPOSIT: {
        title: "Einzahlung erfasst",
        text: `Ihre Einzahlung von ${amount} an ${assoc} wurde erfasst. Grund: ${motif}. Mittel: ${method}.${suffix}`,
        group: `💸 ${member} hat sein Vereinskonto um ${amount} aufgeladen · ${method} · Grund: ${motif}${activity}.`,
      },
      ASSOC_PENDING: {
        title: "Einzahlung wartet auf Abgleich",
        text: `Ihre Einzahlung von ${amount} an ${assoc} ist vorgemerkt. Grund: ${motif}. Der Vorstand muss den Banknachweis bestätigen.`,
        group: `⏳ ${member} hat eine Einzahlung von ${amount} gemeldet · ${method} · Grund: ${motif}${activity}. Wartet auf Abgleich.`,
      },
      ASSOC_CONFIRM: {
        title: "Einzahlung bestätigt",
        text: `Ihre Einzahlung von ${amount} an ${assoc} wurde bestätigt und gutgeschrieben. Grund: ${motif}.${suffix}`,
        group: `✅ Einzahlung bestätigt für ${member}: ${amount} · ${method} · Grund: ${motif}${activity}.`,
      },
      ASSOC_PAYOUT: {
        title: "Zahlung vom Verein erhalten",
        text: `Der Verein ${assoc} hat Ihnen ${amount} per ${method} ausgezahlt. Grund: ${motif}.${suffix}`,
        group: `💸 Der Verein hat ${member} ${amount} ausgezahlt · ${method} · Grund: ${motif}${activity}.`,
      },
      ASSOC_SETTLE: {
        title: "Verpflichtung beglichen",
        text: `Ihre Verpflichtung von ${amount} wurde aus Ihrem Mitgliedskonto bei ${assoc} beglichen. Grund: ${motif}.${suffix}`,
        group: `🧾 ${member} hat ${amount} aus dem Mitgliedskonto beglichen · Grund: ${motif}${activity}.`,
      },
      ASSOC_ACTIVITY: {
        title: "Aktivitätsertrag gutgeschrieben",
        text: `${amount} wurden Ihrem Mitgliedskonto bei ${assoc} gutgeschrieben${movement.activityName ? ` (${movement.activityName})` : ""}. Grund: ${motif}.${suffix}`,
        group: `🎁 ${member} erhielt ${amount} auf dem Mitgliedskonto${activity} · Grund: ${motif}.`,
      },
    },
  };
  return dictionaries[lang][movement.kind];
}

function walletText(notice: WalletMovementNotice, lang: FundsLang): { title: string; text: string } {
  const amount = money(notice.amount, notice.currency, lang);
  const balance = notice.balance == null ? "" : money(notice.balance, notice.currency, lang);
  const suffix = balance ? (lang === "fr" ? ` Nouveau solde : ${balance}.` : lang === "es" ? ` Nuevo saldo: ${balance}.` : lang === "de" ? ` Neuer Saldo: ${balance}.` : ` New balance: ${balance}.`) : "";
  const counterparty = notice.counterparty || "—";
  const dict: Record<FundsLang, Record<WalletMovementNotice["kind"], { title: string; text: string }>> = {
    fr: {
      WALLET_DEPOSIT: { title: "Dépôt wallet enregistré", text: `Votre dépôt de ${amount} sur votre wallet a été enregistré. Motif : ${notice.motif}.${suffix}` },
      WALLET_WITHDRAWAL: { title: "Retrait wallet enregistré", text: `Votre retrait de ${amount} depuis votre wallet a été enregistré. Motif : ${notice.motif}.${suffix}` },
      WALLET_SENT: { title: "Transfert de fonds envoyé", text: `Vous avez envoyé ${amount} à ${counterparty} depuis votre wallet. Motif : ${notice.motif}.${suffix}` },
      WALLET_RECEIVED: { title: "Transfert de fonds reçu", text: `Vous avez reçu ${amount} de ${counterparty} sur votre wallet. Motif : ${notice.motif}.${suffix}` },
    },
    en: {
      WALLET_DEPOSIT: { title: "Wallet deposit recorded", text: `Your wallet deposit of ${amount} was recorded. Reason: ${notice.motif}.${suffix}` },
      WALLET_WITHDRAWAL: { title: "Wallet withdrawal recorded", text: `Your wallet withdrawal of ${amount} was recorded. Reason: ${notice.motif}.${suffix}` },
      WALLET_SENT: { title: "Funds transfer sent", text: `You sent ${amount} to ${counterparty} from your wallet. Reason: ${notice.motif}.${suffix}` },
      WALLET_RECEIVED: { title: "Funds transfer received", text: `You received ${amount} from ${counterparty} on your wallet. Reason: ${notice.motif}.${suffix}` },
    },
    es: {
      WALLET_DEPOSIT: { title: "Depósito wallet registrado", text: `Su depósito de ${amount} en su wallet fue registrado. Motivo: ${notice.motif}.${suffix}` },
      WALLET_WITHDRAWAL: { title: "Retiro wallet registrado", text: `Su retiro de ${amount} de su wallet fue registrado. Motivo: ${notice.motif}.${suffix}` },
      WALLET_SENT: { title: "Transferencia enviada", text: `Envió ${amount} a ${counterparty} desde su wallet. Motivo: ${notice.motif}.${suffix}` },
      WALLET_RECEIVED: { title: "Transferencia recibida", text: `Recibió ${amount} de ${counterparty} en su wallet. Motivo: ${notice.motif}.${suffix}` },
    },
    de: {
      WALLET_DEPOSIT: { title: "Wallet-Einzahlung erfasst", text: `Ihre Wallet-Einzahlung von ${amount} wurde erfasst. Grund: ${notice.motif}.${suffix}` },
      WALLET_WITHDRAWAL: { title: "Wallet-Auszahlung erfasst", text: `Ihre Wallet-Auszahlung von ${amount} wurde erfasst. Grund: ${notice.motif}.${suffix}` },
      WALLET_SENT: { title: "Geldtransfer gesendet", text: `Sie haben ${amount} an ${counterparty} aus Ihrem Wallet gesendet. Grund: ${notice.motif}.${suffix}` },
      WALLET_RECEIVED: { title: "Geldtransfer empfangen", text: `Sie haben ${amount} von ${counterparty} auf Ihrem Wallet empfangen. Grund: ${notice.motif}.${suffix}` },
    },
  };
  return dict[lang][notice.kind];
}

function emailHtml(title: string, text: string, footer: string) {
  return `<!doctype html><html><body style="margin:0;background:#f6f3ec;font-family:Arial,sans-serif;color:#16211b">
  <div style="max-width:600px;margin:0 auto;padding:22px">
    <div style="background:#0d3d28;color:#fff;border-radius:16px;padding:24px 26px">
      <div style="font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#d4a343;font-weight:800">Tchoua · Mouvement de fonds</div>
      <h1 style="font-size:22px;line-height:1.3;margin:10px 0 0">${title}</h1>
    </div>
    <div style="background:#fff;border:1px solid #e4ded1;border-radius:16px;padding:22px 26px;margin-top:14px">
      <p style="margin:0;font-size:14px;line-height:1.7">${text}</p>
      <p style="margin:20px 0 0;padding-top:14px;border-top:1px solid #eee6d6;font-size:11px;color:#66736b">${footer}</p>
    </div>
  </div></body></html>`;
}

async function sendMemberNotice(person: FundsPerson, title: string, text: string, associationName?: string) {
  const lang = langOf(person.language);
  const notification = await prisma.notification.create({
    data: { userId: person.id, title, message: text, type: "INFO", link: "/dashboard/wallet" },
  });
  await publishToUser(person.id, {
    type: "notification",
    notification: { id: notification.id, title, message: text, type: "INFO", event: "FUNDS_MOVEMENT", createdAt: notification.createdAt },
    data: { event: "FUNDS_MOVEMENT" },
  }).catch(() => false);

  const email = (person.email || "").trim();
  if (!email || email.endsWith("@phone.tchoua.local")) return notification;
  await sendTransactionalEmail({
    to: email,
    subject: title,
    text,
    html: emailHtml(title, text, `${associationName ? `${associationName} · ` : ""}Tchoua · ${new Date().toLocaleString(lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : lang === "de" ? "de-DE" : "en-US")}`),
  }).catch(() => false);
  return notification;
}

export async function postAssociationFundsMessage(input: {
  associationId: string;
  membershipId: string;
  content: string;
  mediaUrl?: string | null;
}) {
  const message = await prisma.assocMessage.create({
    data: {
      associationId: input.associationId,
      membershipId: input.membershipId,
      content: input.content,
      type: input.mediaUrl ? "DOCUMENT" : "SYSTEM",
      channel: "GENERAL",
      mediaUrl: input.mediaUrl || null,
    },
  });
  await publishAssociationEvent(input.associationId, "GENERAL", { type: "message", message }).catch(() => false);
  return message;
}

export async function notifyAssociationMovement(movement: FundsMovement) {
  const lang = langOf(movement.target.language);
  const notice = textFor(movement, lang);
  await sendMemberNotice(movement.target, notice.title, notice.text, movement.associationName).catch(() => null);
  await postAssociationFundsMessage({
    associationId: movement.associationId,
    membershipId: movement.actorMembershipId,
    content: notice.group,
    mediaUrl: movement.proofUrl || null,
  }).catch(() => null);
  return notice;
}

export async function notifyWalletMovement(notice: WalletMovementNotice) {
  const lang = langOf(notice.person.language);
  const text = walletText(notice, lang);
  await sendMemberNotice(notice.person, text.title, text.text).catch(() => null);
  return text;
}
