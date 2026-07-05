# Moysidis Mobile Massage — Practice Management App

An English-only practice management web application for Moysidis Mobile Massage, a professional mobile massage therapy business in Switzerland.

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
- Email: Nodemailer (SMTP, optional — not configured; thank-you emails are logged only, per user's choice)
- i18n: Custom LanguageContext (English only)

## Where Things Live

- `lib/api-spec/openapi.yaml` — OpenAPI spec (source of truth for all API contracts)
- `lib/db/src/schema/` — Database schema (clients, medical_history, appointments, expenses, reviews)
- `artifacts/api-server/src/routes/` — Backend route handlers
- `artifacts/api-server/src/lib/email.ts` — Thank-you email logic
- `artifacts/moysidis-app/src/pages/` — Frontend pages
- `artifacts/moysidis-app/src/lib/i18n.tsx` — Translation system (English only)
- `artifacts/moysidis-app/src/pages/ClientBooking.tsx` — Public self-service booking page (`/book`), table-style form for clients
- `attached_assets/IMG_2593_1782977930405.png` — Moysidis logo

## Features

- **Dashboard** — Today's income (CHF), appointment count, monthly profit, total clients, quick complete/cancel buttons; link to share the public booking page
- **Appointments** — Manager can create appointments via a client picker dropdown (looked up from Clients), view, complete, cancel; status badges; date/status filtering
- **Client Booking Page** (`/book`) — Public, standalone (no sidebar), table-style self-service form for clients to book their own appointment (name, email, phone, service, date, time, notes); looks up or creates the client record automatically
- **Clients** — Searchable client list with medical history indicator; full client detail view
- **Intake Form** (`/intake`) — Tablet-friendly client self-service medical history form with GDPR consent
- **Expenses** — Track business expenses by category (Oils, Transport, Equipment, Insurance, Marketing, etc.)
- **Finance** — Day/Month/Year period toggle; income vs expenses chart, service revenue breakdown, summaries in CHF
- **Reviews** — Star rating display after session completion; post-session thank-you email with review link (scheduled 20 min after completion) — currently logged only, no SMTP configured
- **English only** — German has been fully removed; language switcher removed from UI

## Architecture Decisions

- Language is stored in React context (`LanguageContext`) with full translation maps in `src/lib/i18n.tsx`
- Email sending is fire-and-forget via `setTimeout` for the first build; for production durability, replace with a persisted job queue
- GDPR consent is enforced both client-side (button disabled) and server-side (400 if `gdprAccepted: false`)
- Currency is always CHF; dates use DD.MM.YYYY (Swiss format)
- No authentication in v1 — add Replit Auth or Clerk before deploying to production with real client data

## User Preferences

- Language: English only (German removed by user request)
- Currency: CHF
- Date format: DD.MM.YYYY (uses date-fns `enUS` locale for formatting)
- Logo: Moysidis Mobile Massage (attached_assets/IMG_2593_1782977930405.png)
- Thank-you emails: user opted to skip real SMTP setup for now — kept as internal-log-only; ask before enabling real sending

## Gotchas

- After any OpenAPI spec change, run `pnpm --filter @workspace/api-spec run codegen` before touching frontend or backend code
- The `/intake` route is the client-facing tablet form — no sidebar, full-screen kiosk mode
- The `/book` route is the client-facing self-booking form — also no sidebar, standalone
- Email only sends if all 4 SMTP env vars are set; it gracefully skips otherwise (logged as WARN) — this is intentional per user's choice, not a bug
- `mergeParams: true` on sub-routers works at runtime but TypeScript needs explicit `req.params as Record<string, string>` casts

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
