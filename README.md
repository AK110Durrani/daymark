# Daymark

Daymark is a free, offline-first Expo planner for daily, weekly, and monthly tasks.

## Project location

The mobile app lives in artifacts/daymark. It stores tasks locally with AsyncStorage, works without an account or paid backend, and includes optional local notifications.

## Development

pnpm install
pnpm --filter @workspace/daymark run typecheck
pnpm --filter @workspace/daymark run dev

See artifacts/daymark/README.md and artifacts/daymark/PRIVACY.md for release and privacy notes.