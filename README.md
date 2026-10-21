# FORMA

An English, white-first, flat strength-training web app. React + TypeScript + Vite. All personal records stay in this browser; no accounts, cloud sync, analytics, remote assets or backend services.

## Run

Node.js 24.19.0 and pnpm 11.25.0 were tested in this environment. Dependencies are pinned in `package.json` and `pnpm-lock.yaml`.

```sh
pnpm install --frozen-lockfile
pnpm dev
```

Open http://127.0.0.1:5173. This workspace also includes `./scripts/forma install` and `./scripts/forma dev`, which detect the Codex desktop bundled Node/pnpm when they are absent from your shell PATH. This helper changes only its own process PATH.

```sh
pnpm build
pnpm preview
```

Production preview: http://127.0.0.1:4173. Deployments must serve `index.html` for unknown application routes (SPA fallback). No external publication was performed.

## Use

- Dashboard → Start workout uses the active plan. Without an active plan, choose one from Plans.
- Enter external load and reps in a set row. Blur or Enter saves valid fields; Done commits both inputs and starts rest. Invalid drafts remain visible, show errors, and block finishing.
- Reload or return to Current workout to resume committed inputs, original start time, and the rest deadline.
- Finish workout → review → Save workout stores only completed sets in one atomic root write.
- Plans supports template copies and custom plans; completed workouts are immutable snapshots.
- Progress shows eight natural weeks, independent load/set-volume records, and dated body-weight entries.
- Settings supports kg/lb and cm/in, goals, JSON backup, validated replacement import, and typed DELETE clearing. Back up first if you want to retain your personal records.

First launch uses `fixtures/seed.json`, with synthetic records dated October 2026. Their dates are not shifted to today. To re-import this fixture: Settings → Import data → choose the file → review → Replace all data. Future body-weight dates are rejected, so the supplied fixture requires a local date of October 16, 2026 or later. After clearing, refresh stays empty and does not restore demo history.

## Checks

```sh
pnpm lint
pnpm typecheck
pnpm test:unit
pnpm test:component
pnpm build
pnpm preview
# In a second terminal, with the preview running:
FORMA_TEST_URL=http://127.0.0.1:4173 pnpm test:e2e
```

Tests use an isolated browser clock at `2026-10-18T04:00:00Z`, Asia/Shanghai; production always uses real time. The default E2E browser projects are Chromium and WebKit. Install WebKit with `pnpm exec playwright install webkit`. On this Mac, Chromium uses installed Google Chrome; set `FORMA_CHROME_PATH` to a Chrome/Chromium executable on another machine. `FORMA_TEST_URL` defaults to the dev server. `./scripts/forma <script-name>` runs the equivalent package script in this desktop environment.

See `evidence/final-report.md` for actual results and remaining gate limitations. The original harness README is preserved as `HARNESS.md`.

## Storage and recovery

`forma.app.v1` stores one schemaVersion 1 root in localStorage. The serialized root is capped at 2 MiB so every normal exported backup fits the import limit. Export uses compact JSON. Every commit validates the root, takes a cross-tab write lock, checks the revision, and replaces the root in one `setItem`. Other tabs become read-only after a storage revision change and ask you to reload. When Web Locks is unavailable, an IndexedDB readwrite transaction over a shared mutex store serializes the synchronous replacement. IndexedDB stores no fitness data. If neither coordination mechanism is available, writes are refused. This does not claim localStorage compare-and-set is atomic.

If browser storage is blocked, full, corrupt, or from an unsupported schema, the app shows an error. It never automatically overwrites unreadable data. Recovery offers retry, raw backup download where readable, and explicit typed DELETE reset. A failed finish retains the active workout. A failed import retains the previous root. Export backups before clearing browser data; localStorage is not encrypted backup storage.

## Structure

- `src/domain/model.ts`: strict runtime schemas, canonical values, calendar arithmetic and workout transitions.
- `src/data/repository.ts`: storage, validation, revision/lock protocol and recovery.
- `src/main.tsx`: application routes and feature views sharing one repository snapshot.
- `src/components/Modal.tsx`: native dialogs, safe focus and keyboard loop.
- `src/styles/app.css`: shared visual tokens and responsive layouts.
- `tests/`: domain/storage tests, component checks, browser journeys, capacity generator.
- `docs/`, `fixtures/`, `templates/`: original requirements and acceptance material.

Dependencies have one role each: React renders views; React Router handles SPA routes; Zod validates all stored/imported entities; Lucide provides local SVG icons. Vite builds; TypeScript/ESLint check; Vitest/Testing Library/Playwright/axe/Lighthouse verify; Prettier formats. No paid dependency is needed.
# Live deployment

FORMA is available at [csalute6-hash.github.io/forma-fitness](https://csalute6-hash.github.io/forma-fitness/).
Pushes to `main` deploy through `.github/workflows/pages.yml`. Training data stays in the current browser; it is not synchronized between devices. Direct application routes use the Pages `404.html` fallback and render the app while retaining HTTP 404.

