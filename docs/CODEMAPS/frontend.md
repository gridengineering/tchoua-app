<!-- Generated: 2026-10-28 | Files scanned: 85 | Token estimate: ~600 -->
# Frontend Codemap

## App Router Pages (`src/app/`)
- `/` (`src/app/page.tsx`) — Landing page with interactive Tontine/Association showcases.
- `/dashboard` — Unified user financial dashboard (tontines, associations, wallet, upcoming payments).
- `/associations` — Directory, creation wizard (`/associations/create`), templates gallery (`/associations/templates`), and association workspace (`/associations/[id]/*`: dashboard, members, bureau, caisses, cotisations, activities, meetings, solidarity, loans, sanctions, elections, documents, reports, relations, settings).
- `/tontines` — Tontine explorer, creation wizard, and cycle management (`/tontines/[id]`).
- `/wallet` — Multi-currency wallet management, transfers, and transaction history.
- `/epargne`, `/immobilier`, `/marketplace`, `/votes` — Dedicated vertical module interfaces.
- `/admin` — Platform administration (users, wallets, tontines, associations, languages/translations).

## Shared Components & State (`src/components/`, `src/lib/i18n/`)
- `src/components/layout/` — Navigation bar, sidebar, language switcher, notifications.
- `src/components/associations/` — Governance widgets, org chart, quorum indicators, role matrices, financial modals.
- `src/lib/i18n/index.tsx` — Client i18n provider with dictionary loading and persistent locale storage.
