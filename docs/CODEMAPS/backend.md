<!-- Generated: 2026-10-28 | Files scanned: 95 | Token estimate: ~750 -->
# Backend & API Codemap

## Authentication & Authorization
- `src/lib/auth.ts` — NextAuth configuration (Credentials & session callbacks).
- `src/lib/association/permissions.ts` & `src/lib/association/business-rules.ts` — Granular RBAC permissions and business rules `R-001` to `R-052`.

## Primary API Routes (`src/app/api/`)
### Associations (`/api/associations`)
- `GET/POST /api/associations` — List/filter associations & create association (with initial bureau, caisses, template cloning).
- `GET/PUT/DELETE /api/associations/[id]` — Association profile, statutes, governance config.
- `GET/POST/PUT /api/associations/[id]/members` & `/members/[memberId]` — Membership lifecycle, role assignments, suspension, radiation, warning, payment plan (`R-001`..`R-025`).
- `GET/POST/PATCH /api/associations/[id]/meetings` — Scheduling, quorum verification (`R-046`), attendance tracking, progressive absence fines (`R-050`), minutes locking (`R-047`).
- `GET/POST /api/associations/[id]/caisses` & `/cotisations` — Treasury management, cotisation calls, and payments.
- `GET/POST /api/associations/[id]/activities` & `/[actId]/sessions/[sessionId]` — Internal tontines/activities, draws, auctions, and beneficiary payouts.
- `GET/POST/PATCH /api/associations/[id]/loans` — Member credit requests, ceiling/debt checks (`R-010`), repayment schedules.
- `GET/POST /api/associations/[id]/solidarity` — Mutual aid events, automatic contribution collection.
- `GET/POST /api/associations/[id]/reports` — Real-time financial statements (`FINANCIER`, `MEMBRES`, `TONTINES`, `SANCTIONS`, `GLOBAL`) with JSON/CSV export.
- `POST /api/associations/[id]/convert-to-template` & `/api/association-templates` — Anonymized template publishing, fork, and ratings (`R-051`, `R-052`).

### Tontines, Wallet & Other Modules
- `/api/tontines/**` — Tontine creation, memberships, cycles, contributions, beneficiaries, penalties.
- `/api/wallet/**` — Balance, deposit, withdraw, transfer, escrow, transactions.
- `/api/savings/**` — Individual/group savings goals and deposits.
- `/api/immobilier/**` — Real estate projects and share subscriptions.
- `/api/marketplace/**` — Products, orders, group purchases.
- `/api/votes/**` — Elections, candidates, ballots.
