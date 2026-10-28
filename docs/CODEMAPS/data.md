<!-- Generated: 2026-10-28 | Files scanned: 12 | Token estimate: ~650 -->
# Data & Prisma Schema Codemap

## Database Configuration
- **Schema**: `prisma/schema.prisma`
- **Client**: `src/lib/prisma.ts` (Prisma 5.22 + LibSQL adapter support)
- **Seed**: `prisma/seed.ts`

## Core Entity Groups
1. **Identity & Auth**: `User`, `Account`, `Session`, `Notification`.
2. **Wallet & Ledger**: `Wallet`, `WalletTransaction`, `EscrowAccount`, `PaymentMethod`.
3. **Tontines**: `Tontine`, `TontineMember`, `TontineCycle`, `Contribution`, `Beneficiary`, `Penalty`, `TontineVote`.
4. **Associations**:
   - Core: `Association`, `AssociationMembership`, `AssociationRole`, `AssocSubGroup`, `AssociationRelation`.
   - Finance: `AssocCaisse`, `AssocCaisseTransaction`, `AssocCotisation`, `AssocCotisationPayment`, `AssocLoan`, `AssocLoanRepayment`, `AssocSanction`, `AssocPaymentPlan`.
   - Activities & Meetings: `AssociationActivity`, `ActivityParticipant`, `ActivitySession`, `ActivityContribution`, `AssocMeeting`, `AssocMeetingAttendance`, `AssocMeetingFine`.
   - Governance & Mutual Aid: `AssocSolidarityEvent`, `AssocSolidarityContribution`, `AssocElection`, `AssocCandidate`, `AssocVote`, `AssocStatuteArticle`, `AssocDocument`, `AssocAuditLog`.
   - Templates: `AssociationTemplate`, `AssociationTemplateReview`.
5. **Vertical Modules**: `SavingsGoal`, `SavingsContribution`, `RealEstateProject`, `RealEstateInvestment`, `MarketplaceProduct`, `MarketplaceOrder`, `I18nLanguage`, `I18nTranslation`.
