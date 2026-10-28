# ADR 0001: TCHOUA Modular Financial & Association Architecture

- **Status**: Accepted
- **Date**: 2026-10-28

## Context
TCHOUA unifies community financial instruments (Tontines, Associations, Multi-Currency Wallet, Épargne, Immobilier, Marketplace, Electronic Voting) within a single Next.js 16 application backed by Prisma and SQLite/LibSQL.

## Decisions
1. **Centralized Business Rules Engine**: Association governance, quorum (`R-046`), progressive absence fines (`R-050`), debt blocking (`R-010`), and template anonymization (`R-051`, `R-052`) are isolated in pure, unit-tested modules under `src/lib/association/business-rules.ts`.
2. **Transactional Financial Integrity**: All caisse, cotisation, session payout, loan, and wallet mutations execute inside `prisma.$transaction(...)` blocks with audit trail logging (`AssocAuditLog`, `WalletTransaction`).
3. **ECC Agent Harness Integration**: The repository ships with Everything Claude Code (`ecc-universal`) rules, skills, codemaps, and CI quality gates (`tsc --noEmit`, `eslint`, `jest`) to enforce specification compliance on every change.
