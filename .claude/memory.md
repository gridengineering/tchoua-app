# TCHOUA — Project Memory & Durable Context

## Domain Overview
TCHOUA (`tchoua-app`) is a full-stack financial and community platform built with Next.js 16 (App Router), React 19, TypeScript 5, Prisma 5 (SQLite/LibSQL), NextAuth v4, and Tailwind CSS 4.

## Core Modules & Specifications
1. **Tontines (`SPECIFICATION_TONTINE.md`)**: Rotative, cumulative, auction, and solidarity tontines with automated scheduling, tour orders, penalties, and beneficiary payouts.
2. **Associations (`SPECIFICATION.md` & `SPECIFICATION_ASSOCIATION.md`)**: Multi-role governance, dynamic RBAC permissions, sub-groups/antennes, caisses, cotisations, activities, meetings with quorum & progressive absence fines (R-001 to R-052), mutual aid/solidarity events, loans, elections, sanctions, templates, and financial PDF/CSV/JSON reports.
3. **Wallet (`SPECIFICATION_WALLET.md`)**: Multi-currency wallet (`XAF`, `EUR`, `USD`, `CAD`, `GBP`), escrow, p2p transfers, Mobile Money / Orange Money / Stripe / Interac top-ups and withdrawals.
4. **Épargne (`SPECIFICATION_EPARGNE.md`)**: Individual and collective savings goals, locked vaults, automatic contributions, and interest/bonus calculation.
5. **Immobilier (`SPECIFICATION_IMMOBILIER.md`)**: Collaborative real estate investment, land/property co-ownership shares, and construction milestones.
6. **Marketplace (`SPECIFICATION_MARKETPLACE.md`)**: Community commerce, group buying, escrow payments, and vendor storefronts.
7. **Vote (`SPECIFICATION_VOTE.md`)**: Electronic elections, weighted/anonymous voting, candidate applications, and quorum verification.

## Critical Architectural Invariants
- **Next.js 16 Dynamic Route Params**: In Next.js 16 App Router, `context.params` is a `Promise<{ id: string, ... }>` and must always be `await`ed (`const { id } = await params;`).
- **Prisma Client Singleton**: Always import `prisma` from `@/lib/prisma`. Run `npx prisma generate` after any change to `prisma/schema.prisma`.
- **Association Business Rules (`src/lib/association/business-rules.ts`)**: Rules `R-001` through `R-052` govern membership eligibility, debt blocking, progressive sanctions, quorum, loan ceilings, and template conversion.
- **Verification Gate**: Always run `npx tsc --noEmit`, `npm run lint`, and `npm test` before committing or deploying to production (`www.tchoua.com`).
