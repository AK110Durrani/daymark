# Daymark

Daymark is an offline-first personal planner for daily, weekly, and monthly tasks.
It keeps tasks and activity history on the device, works without an account, and
uses optional local notifications for reminders.

## Included

- Home overview with completion progress
- Daily, weekly, and monthly task planning
- Task details with editable notes
- Activity timeline and daily/weekly charts
- History summary
- Optional hourly reminders
- Local JSON export for backups
- Dark mode and accessible labels
- Android and iOS application identifiers in `app.json`

## Development

This is an Expo Router app in a pnpm workspace.

```bash
pnpm install
pnpm --filter @workspace/daymark run typecheck
pnpm --filter @workspace/daymark run dev
```

The app does not require a database, API key, login, or paid service.

## Store preparation

- Android package: `com.aghaasif.daymark`
- iOS bundle identifier: `com.aghaasif.daymark`
- Version: `1.0.0`
- Android version code: `1`
- App icon: `assets/images/icon.png`

Before publishing, replace the package identifiers with ones owned by you if
you plan to use a different publisher namespace, then increment the version
and Android version code for every update.

Google Play requires a signed Android App Bundle, store screenshots, a
description, a content rating, and a developer account. This repository is
ready for those release steps, but signing and store submission must be done
with your own Android publishing account.