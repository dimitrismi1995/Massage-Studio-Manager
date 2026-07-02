# Moysidis Mobile Massage — Practice Management App

A bilingual (EN/DE) practice management web application for Moysidis Mobile Massage, a professional mobile massage therapy business in Switzerland.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at /api)
- `pnpm --filter @workspace/moysidis-app run dev` — run the frontend (served at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` — for post-session thank-you emails

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React 19 + Vite, Tailwind CSS, Recharts, Framer Motion, Wouter
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (zod/v4), drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Email: Nodemailer (SMTP, optional)
- i18n: Custom LanguageContext (EN / DE)

## Where Things Live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Database schema (clients, medical_history, appointments, expenses, reviews)
- `artifacts/api-server/src/routes/` — Backend route handlers
- `artifacts/api-server/src/lib/email.ts` — Thank-you email logic
- `artifacts/moysidis-app/src/pages/` — Frontend pages
- `artifacts/moysidis-app/src/lib/i18n.tsx` — Translation system (EN/DE)
- `attached_assets/IMG_2593_1782977930405.png` — Moysidis logo

## Features

- **Dashboard** — Today's income (CHF), appointment count, monthly profit, total clients, quick complete/cancel buttons
- **Appointments** — Create, view, complete, cancel appointments; status badges; date/status filtering
- **Clients** — Searchable client list with medical history indicator; full client detail view
- **Intake Form** (`/intake`) — Tablet-friendly client self-service medical history form with GDPR consent; supports EN/DE
- **Expenses** — Track business expenses by category (Oils, Transport, Equipment, Insurance, Marketing, etc.)
- **Finance** — Monthly income vs expenses bar chart, service revenue breakdown, daily/monthly/yearly summaries in CHF
- **Reviews** — Star rating display after session completion; post-session thank-you email with review link (scheduled 20 min after completion)
- **Bilingual** — EN/DE toggle in sidebar; all UI strings translated

## Architecture Decisions

- Language is stored in React context (`LanguageContext`) with full translation maps in `src/lib/i18n.tsx`
- Email sending is fire-and-forget via `setTimeout` for the first build; for production durability, replace with a persisted job queue
- GDPR consent is enforced both client-side (button disabled) and server-side (400 if `gdprAccepted: false`)
- Currency is always CHF; dates use DD.MM.YYYY (Swiss format)
- No authentication in v1 — add Replit Auth or Clerk before deploying to production with real client data

## User Preferences

- Language: English + German (Swiss)
- Currency: CHF
- Date format: DD.MM.YYYY
- Logo: Moysidis Mobile Massage (attached_assets/IMG_2593_1782977930405.png)

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before touching frontend or backend code
- The `/intake` route is the client-facing tablet form — no sidebar, full-screen kiosk mode
- Email only sends if all 4 SMTP env vars are set; it gracefully skips otherwise (logged as WARN)
- `mergeParams: true` on sub-routers works at runtime but TypeScript needs explicit `req.params as Record<string, string>` casts

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
