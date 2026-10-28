# Project Instructions — TCHOUA (`tchoua-app`)

## Tech Stack
| Layer | Technology | Version |
| :--- | :--- | :--- |
| **Language** | TypeScript | `5.x` |
| **Framework** | Next.js (App Router) | `16.2.4` |
| **UI Library** | React + Tailwind CSS + Framer Motion + GSAP + Lucide | `19.2.4` / `4.x` |
| **Database & ORM** | SQLite / LibSQL + Prisma | `5.22.0` |
| **Authentication** | NextAuth.js (`@/lib/auth`) | `4.24.14` |
| **Validation** | Zod | `4.4.3` |
| **Testing** | Jest + Testing Library (Unit) & Playwright (E2E) | `30.4.2` / `1.59.1` |
| **Agent Harness** | Everything Claude Code (`ecc-universal`) | `2.2.3` (`.agents/`) |

## Code Style & Conventions
- **Next.js 16 Route Handlers**: Route context `params` is a `Promise`. Always `const { id } = await params;` before accessing route parameters. Read `node_modules/next/dist/docs/` when working with Next.js 16 APIs.
- **Database Access**: Always use the shared Prisma singleton from `src/lib/prisma.ts`. Wrap multi-step financial mutations (wallet transfers, cotisations, loans, session distributions) inside `prisma.$transaction(...)`.
- **Association Business Rules**: All association rules (`R-001` to `R-052`) are centralized in `src/lib/association/business-rules.ts` and enforced in `src/app/api/associations/**`.
- **Internationalization**: Client UI strings use `useTranslation()` from `src/lib/i18n/index.tsx` (`fr`, `en`, `es`, `de`, `it`, `pt`, `zh`, `ar`).

## Testing & Verification (`verification-loop`)
- **Type Check**: `npx tsc --noEmit`
- **Linter**: `npm run lint`
- **Unit & Integration Tests**: `npm test`
- **E2E Tests**: `npm run test:e2e`
- **ECC Doctor & Harness Audit**:
  - `node .agents/...` or `npx ecc-universal doctor`
  - `npx ecc-universal harness-audit repo`

## Build & Run
- **Dev Server**: `npm run dev`
- **Production Build**: `npm run build`
- **Start Production Server**: `npm start`
- **Database Generate / Push / Seed**:
  - `npm run db:generate`
  - `npm run db:push`
  - `npm run db:seed`

## Project Structure
- `src/app/api/` — Next.js 16 REST API route handlers (`associations`, `tontines`, `wallet`, `savings`, `marketplace`, `immobilier`, `votes`, `auth`, `admin`).
- `src/app/` — App Router pages (`associations`, `tontines`, `wallet`, `epargne`, `immobilier`, `marketplace`, `votes`, `dashboard`, `admin`).
- `src/components/` — Reusable UI and domain components (`associations`, `tontines`, `wallet`, `layout`, `ui`).
- `src/lib/` — Domain engines, Prisma client (`prisma.ts`), NextAuth config (`auth.ts`), association business rules (`association/business-rules.ts`), and i18n (`i18n/`).
- `prisma/` — Prisma schema (`schema.prisma`) and database seed (`seed.ts`).
- `tests/` — Unit (`tests/unit/`) and Playwright E2E (`tests/e2e/`) test suites.
- `docs/CODEMAPS/` — Token-lean architecture codemaps (`architecture.md`, `backend.md`, `frontend.md`, `data.md`, `dependencies.md`).
- `.agents/` — Installed ECC skills (293), subagents (68), rules (122), and workflows (94).
