# Implementation decisions · 2026-10-18

- Local React/TypeScript/Vite app in the provided directory; preserve the original harness documents. No existing implementation or Git repository was present. No public hosting or external account was authorized.
- pnpm 11.25.0 with exact direct versions and frozen lockfile. The desktop bundled Node is available through `scripts/forma`; no system installation is changed.
- One strict schemaVersion 1 JSON root, atomic localStorage replacement under Web Locks, canonical kg and immutable workout snapshots. No network API or assets.
- Cross-tab exclusion uses Web Locks when available, with an IndexedDB readwrite transaction as the fallback mutex. The transaction holds no fitness records and runs the single localStorage replacement synchronously inside its exclusive callback. Its later completion/abort does not roll back localStorage. Environments without either reliable exclusion mechanism refuse writes. Browser tests disable Web Locks in both tabs to verify the fallback.
- Native HTML dialogs plus explicit Tab cycling provide consistent keyboard traversal across Chromium and WebKit. `useId` prevents nested exercise-detail dialogs from sharing titles.
- Performance measurement uses in-page pointerdown-to-DOM-commit timings. Initial broad Playwright round-trip measurements included automation overhead and simultaneous Lighthouse work; they are diagnostic only, not substituted for the protocol's action-to-visible measurement. Budgets remain unchanged.
- Source dates in seed remain fixed. Production does not expose clock/fixture testing switches.

- Backup round-trip invariant: normal commits reject a serialized root over 2 MiB and keep the old root/active draft. Exports use compact JSON so a valid local root always fits the import byte limit. Entity counts remain independent maximum ceilings, not a promise to bypass browser capacity. This guards the existing export/import requirement; no data is silently removed.
- First initialization re-reads and seeds inside the same exclusion mechanism as later commits. Browser storage access is lazy, so a SecurityError from the localStorage getter reaches recovery instead of crashing module startup.
