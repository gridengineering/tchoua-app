# Security Policy — TCHOUA (`tchoua-app`)

## Supported Versions

| Version | Supported |
| :--- | :--- |
| `0.1.x` (production `master`) | :white_check_mark: |

## Security Architecture & Guardrails

1. **Authentication & Session Management**:
   - Powered by NextAuth.js (`src/lib/auth.ts`) with `bcryptjs` password hashing and HTTP-only session cookies.
2. **Role-Based Access Control (RBAC)**:
   - Platform-level roles (`USER`, `ADMIN`) and association-level dynamic permissions (`src/lib/association/permissions.ts`) are verified server-side on every mutating API route.
3. **Financial & Database Integrity**:
   - All database queries use parameterized Prisma ORM calls (`src/lib/prisma.ts`).
   - Multi-step ledger operations (wallet transfers, cotisations, tontine payouts, loans) run inside atomic `prisma.$transaction` blocks.
4. **Secret Hygiene**:
   - Environment files (`.env`, `.env*.local`) and local SQLite databases (`prisma/dev.db`) are excluded via `.gitignore`.

## Reporting a Vulnerability

Please report suspected security vulnerabilities privately to the TCHOUA maintainers rather than opening a public issue. Include reproduction steps, affected route or component, and potential impact.
