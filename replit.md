# Daymark

Daymark is an offline-first Expo task planner for daily, weekly, and monthly planning.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/daymark run dev` — run the Expo mobile app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Mobile: Expo Router, React Native, AsyncStorage, local notifications

## Where things live

- `artifacts/daymark/app/` — Expo Router screens
- `artifacts/daymark/src/context/DaymarkContext.tsx` — local task state and persistence
- `artifacts/daymark/src/notifications.ts` — optional device reminders
- `artifacts/daymark/constants/colors.ts` — light/dark theme tokens
- `artifacts/daymark/app.json` — store identifiers and Expo configuration

## Architecture decisions

- The first release is local-only so the app works offline and needs no account or paid backend.
- AsyncStorage is the source of truth for tasks, activity, reminder preference, and export data.
- Notifications are opt-in and scheduled locally; the app still works when permissions are denied.
- The API server remains a shared workspace service but Daymark does not depend on it.

## Product

- Plan work by daily, weekly, or monthly mode.
- Complete tasks, review activity, edit notes, and export a local backup.
- Use optional local reminders without sending task data to a server.

## User preferences

- Keep the free version offline-first and free of required paid services.

## Gotchas

- Android Play Store submission still requires the user's own developer account and signed release bundle.
- Do not commit signing keys or local environment files.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
