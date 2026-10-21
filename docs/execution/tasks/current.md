# Current task — FORMA local MVP
Status: GitHub Pages DEPLOYED; product acceptance remains PARTIAL (manual final acceptance outstanding)
Requirements: all 36 catalog P0 entries.
Candidate: `9442ba34b3d9916fe3fa807cd106a20aeea76a32b3e4debe80cc49be2a44795e`; lock and per-file hashes in `evidence/candidate-hashes.json`.
Observed: initial harness had no application or Git repository; preserved original fixtures and requirements.
Implemented: six English routes and real training loop, one-root repository, strict schema, snapshots, backup/recovery, responsive controls.
Verified: lint/typecheck/build, 32 unit + 4 component + 25 Chromium + 25 WebKit tests; three Lighthouse runs; independent clean build and SPA deep links.
Evidence: `evidence/final-report.md`, actual logs/screenshots and updated traceability.
Blocker: actual screen-reader speech/navigation and browser UI 200% zoom remain NOT_RUN. Automated reflow/axe/keyboard do not replace them.
Next: execute `evidence/manual-checks.md`, record actual observations, re-evaluate G01/G05 and three PARTIAL P0 entries. Overall PARTIAL until then.
Invariants: canonical kg; immutable snapshots; one root atomic commit; one active workout; no external assets or publication.
