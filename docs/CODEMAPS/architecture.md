<!-- Generated: 2026-10-28 | Files scanned: 210 | Token estimate: ~650 -->
# TCHOUA System Architecture

## Overview
Full-stack Next.js 16 (App Router) community finance platform combining Tontines, Associations, Multi-Currency Wallet, Savings (Épargne), Real Estate (Immobilier), Marketplace, and Electronic Voting.

## High-Level Data Flow
```
[Browser / React 19 Client Components]
       │ (fetch JSON / NextAuth Session)
       ▼
[Next.js 16 Route Handlers: src/app/api/**]
       │ (Auth + RBAC + Zod / Business Rules R-001..R-052)
       ▼
[Domain Engines: src/lib/** (association, tontine, wallet, i18n)]
       │ (Prisma Client $transaction)
       ▼
[SQLite / LibSQL Database via Prisma ORM (prisma/schema.prisma)]
```

## Core Domain Boundaries
| Domain | UI Entrypoint | API Surface | Core Logic / Spec |
| :--- | :--- | :--- | :--- |
| **Associations** | `src/app/associations/` | `src/app/api/associations/` | `src/lib/association/business-rules.ts` (`SPECIFICATION_ASSOCIATION.md`) |
| **Tontines** | `src/app/tontines/` | `src/app/api/tontines/` | `src/lib/tontine-calculations.ts` (`SPECIFICATION_TONTINE.md`) |
| **Wallet** | `src/app/wallet/` | `src/app/api/wallet/` | `SPECIFICATION_WALLET.md` |
| **Épargne** | `src/app/epargne/` | `src/app/api/savings/` | `SPECIFICATION_EPARGNE.md` |
| **Immobilier** | `src/app/immobilier/` | `src/app/api/immobilier/` | `SPECIFICATION_IMMOBILIER.md` |
| **Marketplace** | `src/app/marketplace/` | `src/app/api/marketplace/` | `SPECIFICATION_MARKETPLACE.md` |
| **Votes** | `src/app/votes/` | `src/app/api/votes/` | `SPECIFICATION_VOTE.md` |
