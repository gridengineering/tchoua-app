# Security Policy — TCHOUA (`tchoua-app`)

## Supported Versions

| Version | Supported |
| :--- | :--- |
| `0.1.x` (production `master`) | :white_check_mark: |

## Security Architecture & Guardrails (Domaines D32, D33 & Annexes ARP)

1. **Authentication, SSO & KYC1 Onboarding**:
   - Powered by NextAuth.js (`src/lib/auth.ts`) with `bcryptjs` password hashing, HTTP-only session cookies, and OAuth 2.0 / OIDC Single Sign-On (**Google, Facebook, LinkedIn, Instagram**).
   - Member invitation confirmations (`/api/invites/confirm`) use HMAC-signed tokens (`createInviteToken` / `verifyInviteToken` in `src/lib/association/member-invite.ts`) and upgrade verified members to **KYC1**.
2. **Isolation & Role-Based Access Control (RBAC — `SEC01`, `SEC02`)**:
   - Every API request verifies the relation between authenticated user, association scope, and target entity server-side (`SEC01`), including direct ID lookups.
   - Platform-level roles (`USER`, `ADMIN`) and association-level dynamic permissions (`src/lib/permissions.ts`, `src/lib/association/permissions.ts`) are enforced on every mutating route; mandate revocation takes effect immediately without waiting for session expiry (`SEC02`).
   - Technical administrators do not hold implicit business rights over association funds.
3. **Separation of Duties & Anti-Self-Approval (`D18`, `D21`, `D32`)**:
   - A requester or beneficiary (loan, disbursement, sanction appeal, guarantee evaluation) cannot unilaterally approve their own operation (`PRE03`, `SAN03`, `GAR02`).
4. **Confidentiality of Social, Medical & Personal Data (`D04`, `D23`, `D30`, `SEC03`)**:
   - Treasurers receive payment amount and recipient details without automatic access to sensitive medical diagnostics or supporting documents (`AID03`).
   - Stored files and exports are never exposed via guessable public URLs (`SEC03`); member phone/contact visibility respects privacy consent (`COM02`).
   - Passwords, tokens, and secrets are never written to logs or audit diagnostics.
5. **Financial Integrity, Exact Arithmetic & Idempotency (`SEC04`, `FIN01`, `PAY01`, `ARC01–ARC04`)**:
   - All database queries use parameterized Prisma ORM calls (`src/lib/prisma.ts`).
   - Monetary calculations use exact decimal/integer arithmetic (`src/lib/arp/money.ts`) — never binary floating-point rounding for ledger balances.
   - Multi-step ledger operations (wallet transfers, cotisations, tontine attributions/auctions, loans, restructurings) run inside atomic `prisma.$transaction` blocks with idempotency keys and unique constraints (`PAY01`, `ATT02`).
   - Validated financial movements are never deleted; corrections use linked reversals/counter-entries (`SEC04`).
6. **Secret Hygiene**:
   - Environment files (`.env`, `.env*.local`), OAuth client secrets, and local SQLite databases (`prisma/dev.db`) are excluded via `.gitignore`.

## Reporting a Vulnerability

Please report suspected security vulnerabilities privately to the TCHOUA maintainers rather than opening a public issue. Include reproduction steps, affected route or component, and potential impact.
