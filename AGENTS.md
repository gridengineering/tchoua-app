<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## ECC Agent Harness & Project Conventions (`tchoua-app`)

- **Onboarding & Instructions**: See [`CLAUDE.md`](./CLAUDE.md) and [`docs/CODEMAPS/architecture.md`](./docs/CODEMAPS/architecture.md) for stack, commands, and module boundaries.
- **Specifications**: Domain rules are defined in `SPECIFICATION.md`, `SPECIFICATION_ASSOCIATION.md`, `SPECIFICATION_TONTINE.md`, `SPECIFICATION_WALLET.md`, `SPECIFICATION_EPARGNE.md`, `SPECIFICATION_IMMOBILIER.md`, `SPECIFICATION_MARKETPLACE.md`, and `SPECIFICATION_VOTE.md`.
- **Quality Gates**: Before committing or deploying, run `npx tsc --noEmit`, `npm run lint`, and `npm test`.

