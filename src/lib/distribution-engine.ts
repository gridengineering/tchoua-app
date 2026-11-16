import { prisma } from "@/lib/prisma";

export type DistributionResult = {
  success: boolean;
  allocations: {
    type: "DEBT" | "ACTIVITY" | "LOAN" | "EXCESS";
    id: string; // sanctionId, activityId or loanId
    name: string;
    amountAllocated: number;
    amountExpected: number;
    priority: number;
    status: "SUCCESS" | "FAILED" | "PARTIAL" | "SKIPPED";
  }[];
  remainingBalance: number;
  error?: string;
};

/**
 * Moteur de Répartition Financière (Module 9 & Phase C)
 */
export async function distributeContribution(
  associationId: string,
  membershipId: string,
  totalPaid: number,
  paymentMethod: string = "CASH",
  reference?: string,
  meetingId?: string // Nouveau paramètre pour lier à une session globale
): Promise<DistributionResult> {
  let remainingBalance = totalPaid;
  const allocations: DistributionResult["allocations"] = [];

  // 1. Récupérer les souscriptions, prêts, et sanctions impayées
  const [membership, subscriptions, activeLoans, pendingSanctions] = await Promise.all([
    prisma.associationMembership.findUnique({
      where: { id: membershipId },
      select: { loanRepaymentMode: true },
    }),
    prisma.activitySubscription.findMany({
      where: { membershipId, status: "ACTIVE", activity: { associationId, status: "ACTIVE" } },
      include: { activity: true },
    }),
    prisma.assocLoan.findMany({
      where: { borrowerMembershipId: membershipId, status: "ACTIVE", activity: { associationId } },
      include: { activity: true, repayments: true },
    }),
    prisma.assocSanction.findMany({
      where: { membershipId, status: "PENDING", meeting: { associationId } },
    })
  ]);

  // 2. Préparer la liste des obligations à traiter
  type Obligation = {
    type: "DEBT" | "ACTIVITY" | "LOAN";
    id: string; 
    name: string;
    expectedAmount: number;
    minAmount?: number;
    priority: number; // 0 (Dettes) à 4 (Basse)
    activityId?: string;
    subscription?: any;
    loan?: any;
    sanction?: any;
  };

  const obligations: Obligation[] = [];

  // 2a. Dettes (Sanctions impayées) -> Priorité 0
  for (const sanction of pendingSanctions) {
    obligations.push({
      type: "DEBT",
      id: sanction.id,
      name: `Sanction / Dette: ${sanction.failureType}`,
      expectedAmount: sanction.penaltyAmount,
      priority: 0,
      sanction: sanction
    });
  }

  // 2b. Activités -> Priorité 1 à 4
  for (const sub of subscriptions) {
    const act = sub.activity;
    let expected = (act.contributionAmount || 0) * sub.partsCount;
    let priority = 4;
    let minAmount: number | undefined = undefined;

    // Clé de répartition personnelle du membre. Les postes obligatoires gardent
    // toujours leur minimum statutaire ; seuls les postes optionnels peuvent être
    // librement fixés, pondérés ou laissés en résiduel.
    const allocationType = sub.allocationType || "NONE";
    const allocationValue = Number(sub.allocationValue || 0);

    if (act.participation === "MANDATORY") {
      if (act.type.startsWith("TONTINE") || act.type === "INVESTISSEMENT") {
        priority = 1;
      } else if (act.type === "AIDE_SOLIDAIRE") {
        priority = 2;
        minAmount = expected;
        expected = Infinity;
      } else {
        priority = 1;
      }
      // Un membre peut volontairement cotiser plus que son minimum obligatoire.
      if (allocationType === "FIXED" && allocationValue > 0 && Number.isFinite(expected)) {
        expected = Math.max(expected, allocationValue);
      } else if (allocationType === "PERCENTAGE" && allocationValue > 0 && Number.isFinite(expected)) {
        expected = Math.max(expected, (totalPaid * allocationValue) / 100);
      }
    } else {
      if (act.type === "EPARGNE" || act.type === "COLLECTION") {
        priority = 4;
        expected = Infinity;
      } else {
        priority = 3;
      }

      if (allocationType === "FIXED" && allocationValue > 0) {
        expected = allocationValue;
      } else if (allocationType === "PERCENTAGE" && allocationValue > 0) {
        expected = (totalPaid * allocationValue) / 100;
      } else if (allocationType === "RESIDUAL") {
        expected = Infinity;
        priority = 4;
      }
    }

    if (expected > 0 || priority === 4) {
      obligations.push({
        type: "ACTIVITY",
        id: act.id,
        name: act.name,
        expectedAmount: expected,
        minAmount,
        priority,
        activityId: act.id,
        subscription: sub,
      });
    }
  }

  // 2c. Prêts -> Priorité 1 par défaut, ou résiduel (4.5) après les activités
  const loanRepaymentResidual = membership?.loanRepaymentMode === "RESIDUAL";
  for (const loan of activeLoans) {
    const totalRepaid = loan.repayments.reduce((acc, rep) => acc + rep.amount, 0);
    const balanceDue = loan.totalDue - totalRepaid;
    if (balanceDue > 0) {
      obligations.push({
        type: "LOAN",
        id: loan.id,
        name: `Remboursement Prêt: ${loan.activity.name}`,
        expectedAmount: balanceDue,
        priority: loanRepaymentResidual ? 4.5 : 1,
        activityId: loan.activityId,
        loan: loan,
      });
    }
  }

  // 3. Trier par priorité (0, 1, 2, 3, 4)
  obligations.sort((a, b) => a.priority - b.priority);

  // 4. Exécuter l'algorithme (Transactionnel)
  try {
    await prisma.$transaction(async (tx) => {
      
      // Enregistrer le versement global si lié à un meeting
      if (meetingId) {
        let cash = 0, momo = 0, bank = 0;
        if (paymentMethod === "CASH") cash = totalPaid;
        else if (paymentMethod === "MOBILE_MONEY") momo = totalPaid;
        else if (paymentMethod === "BANK_TRANSFER") bank = totalPaid;

        await tx.assocSessionContribution.create({
          data: {
            meetingId,
            membershipId,
            totalAmount: totalPaid,
            cashAmount: cash,
            mobileMoneyAmount: momo,
            bankTransferAmount: bank,
            status: "ALLOCATED",
            receiptId: reference
          }
        });
      }

      for (const obs of obligations) {
        if (remainingBalance <= 0) {
           // Fonds épuisés
           if (obs.priority === 1 || obs.priority === 2) {
             // Générer sanction pour échec total
             if (meetingId) {
                await tx.assocSanction.create({
                  data: {
                    meetingId,
                    membershipId,
                    activityId: obs.activityId,
                    failureType: obs.type === "LOAN" ? "REPAYMENT" : obs.priority === 1 ? "OBLIGATORY_TOTAL" : "OBLIGATORY_PARTIAL",
                    penaltyAmount: Math.min(obs.expectedAmount, 1000), // Pénalité d'exemple de 1000 FCFA
                    description: `Échec paiement: ${obs.name}`
                  }
                });
             }
             allocations.push({ type: obs.type, id: obs.id, name: obs.name, amountAllocated: 0, amountExpected: obs.minAmount || obs.expectedAmount, priority: obs.priority, status: "FAILED" });
           } else if (obs.priority === 0) {
             allocations.push({ type: obs.type, id: obs.id, name: obs.name, amountAllocated: 0, amountExpected: obs.expectedAmount, priority: obs.priority, status: "FAILED" });
           } else {
             allocations.push({ type: obs.type, id: obs.id, name: obs.name, amountAllocated: 0, amountExpected: obs.minAmount || obs.expectedAmount, priority: obs.priority, status: "SKIPPED" });
           }
           continue;
        }

        let allocated = 0;
        let status: "SUCCESS" | "FAILED" | "PARTIAL" | "SKIPPED" = "SUCCESS";

        if (obs.priority === 0) {
          // Dette
          allocated = Math.min(remainingBalance, obs.expectedAmount);
          if (allocated < obs.expectedAmount) status = "PARTIAL";
        } else if (obs.priority === 1) {
          // Obligatoire Totale
          allocated = Math.min(remainingBalance, obs.expectedAmount);
          if (allocated < obs.expectedAmount) {
             status = "FAILED";
             if (meetingId) {
                await tx.assocSanction.create({
                  data: {
                    meetingId,
                    membershipId,
                    activityId: obs.activityId,
                    failureType: obs.type === "LOAN" ? "REPAYMENT" : "OBLIGATORY_TOTAL",
                    penaltyAmount: 1000, // Exemple fixe
                    description: `Échec partiel paiement: ${obs.name}`
                  }
                });
             }
          }
        } else if (obs.priority === 2) {
          // Obligatoire Partielle
          const minReq = obs.minAmount || 0;
          allocated = Math.min(remainingBalance, minReq); // simplifé: on alloue jusqu'au min, ou le reste
          if (allocated < minReq) {
             status = "FAILED";
             if (meetingId) {
                await tx.assocSanction.create({
                  data: {
                    meetingId,
                    membershipId,
                    activityId: obs.activityId,
                    failureType: "OBLIGATORY_PARTIAL",
                    penaltyAmount: 500, // Exemple
                    description: `Manque cotisation minimale: ${obs.name}`
                  }
                });
             }
          }
        } else if (obs.priority === 3) {
          if (remainingBalance >= obs.expectedAmount) {
            allocated = obs.expectedAmount;
          } else {
            status = "SKIPPED";
            allocated = 0;
          }
        } else if (obs.priority === 4.5) {
          // Remboursement de prêt en résiduel : il prend ce qui reste, sans
          // sanction s'il n'y a plus de fonds après les activités.
          allocated = Math.min(remainingBalance, obs.expectedAmount);
          status = allocated === 0 ? "SKIPPED" : allocated < obs.expectedAmount ? "PARTIAL" : "SUCCESS";
        } else if (obs.priority === 4) {
          const allocType = obs.subscription?.allocationType || "NONE";
          const allocVal = obs.subscription?.allocationValue || 0;
          
          if (allocType === "FIXED" && allocVal > 0) {
             allocated = Math.min(allocVal, remainingBalance);
             if (allocated < allocVal) status = "PARTIAL";
          } else if (allocType === "PERCENTAGE" && allocVal > 0) {
             const calcAmount = (totalPaid * allocVal) / 100;
             allocated = Math.min(calcAmount, remainingBalance);
          } else if (allocType === "RESIDUAL") {
             allocated = remainingBalance;
          } else {
             allocated = 0;
             status = "SKIPPED";
          }
        }

        if (allocated > 0) {
          remainingBalance -= allocated;

          if (obs.type === "DEBT" && obs.sanction) {
             const newPenalty = obs.expectedAmount - allocated;
             await tx.assocSanction.update({
               where: { id: obs.id },
               data: { 
                 penaltyAmount: newPenalty, 
                 status: newPenalty <= 0 ? "APPLIED" : "PENDING" // Marqué APPLIED (réglée) si 0
               }
             });
          } else if (obs.type === "ACTIVITY") {
            await tx.activityContribution.create({
              data: { activityId: obs.id, membershipId, amount: allocated, unit: "CASH", status: "PAID", paymentMethod, reference }
            });
            await tx.associationActivity.update({
              where: { id: obs.id }, data: { caisseBalance: { increment: allocated } }
            });
          } else if (obs.type === "LOAN") {
            await tx.assocLoanRepayment.create({
              data: { loanId: obs.id, amount: allocated, paymentMethod, reference }
            });
            if (obs.loan && (allocated >= obs.expectedAmount)) {
               await tx.assocLoan.update({ where: { id: obs.id }, data: { status: "REPAID", repaidAt: new Date() } });
            }
            if (obs.activityId) {
               await tx.associationActivity.update({ where: { id: obs.activityId }, data: { caisseBalance: { increment: allocated } } });
            }
          }
        }

        allocations.push({
          type: obs.type,
          id: obs.id,
          name: obs.name,
          amountAllocated: allocated,
          amountExpected: obs.minAmount || obs.expectedAmount,
          priority: obs.priority,
          status: status,
        });
      }

      // Gestion de l'excédent (Sauvegarde dans le profil du membre)
      if (remainingBalance > 0) {
         await tx.associationMembership.update({
           where: { id: membershipId },
           data: { excessBalance: { increment: remainingBalance } }
         });
      }

    });
  } catch (error: any) {
    return { success: false, allocations, remainingBalance: totalPaid, error: error.message };
  }

  if (remainingBalance > 0) {
    allocations.push({ type: "EXCESS", id: "excess", name: "Excédent (Reportable)", amountAllocated: remainingBalance, amountExpected: 0, priority: 5, status: "SUCCESS" });
  }

  return { success: true, allocations, remainingBalance };
}
