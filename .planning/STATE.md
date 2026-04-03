---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Security & Privacy
status: ready
last_updated: "2026-06-10"
last_activity: 2026-06-10
progress:
  total_phases: 5
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State: MoneyFlow Security & Privacy

**Last Updated:** 2026-06-10 (v1.2 roadmap created)

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-03)

**Core Value:** L'utente riesce a capire la propria situazione finanziaria a colpo d'occhio — dashboard chiara, dati leggibili, flusso di importazione senza frizioni.
**Current Focus:** Phase 12 — Dependency Audit (ready to plan)

## Current Position

**Phase:** 12 — Dependency Audit
**Plan:** —
**Status:** Ready to plan (roadmap defined, no plans created yet)
**Progress:** 0 / 5 phases complete · 0 / 0 plans complete

```
Phase 12 ░░░░░░░░░░  Not started
Phase 13 ░░░░░░░░░░  Not started
Phase 14 ░░░░░░░░░░  Not started
Phase 15 ░░░░░░░░░░  Not started
Phase 16 ░░░░░░░░░░  Not started
```

**Last activity:** 2026-06-10 — Roadmap created (5 phases, 13 requirements mapped)

## Accumulated Context

### Key Decisions Made (v1.2)

| Decision | Rationale |
|----------|-----------|
| Drive backup key = PBKDF2 from Google OAuth `sub` | Account-bound (not machine-bound) → enables cross-device restore without password |
| Local data key = `safeStorage` (DPAPI/Keychain) | Transparent to user, OS-backed, no password required |
| Two separate keys: local key ≠ backup key | Local key is machine-bound; backup key is account-bound — different trust models |
| Do NOT use `electron-store` `encryptionKey` for SEC-07 | Not cryptographically secure; use Node.js `crypto` directly with AES-256-GCM |
| Migration flag = `.storage-migrated-v1` file in `userData` | Atomic, survives app crashes, prevents double-migration |
| Legacy backup detection via envelope check (`v: 1, encrypted: true`) | Backward-compat: pre-v1.2 plaintext backups restore without error |
| NEVER run `npm audit fix --force` | Would silently upgrade `electron-store` v8 → v9, breaking `encryptionKey` API |
| `safeStorage` fallback: plaintext if `!isEncryptionAvailable()` | Dev/CI headless environments (GNOME Keyring unavailable) must not crash |
| Architecture: main process owns all crypto | `safeStorage` is main-process-only; encryption key must never cross IPC boundary to renderer |
| New shared module: `electron/storage.cjs` | Centralizes key management + AES-256-GCM ops; required by both `main.cjs` and `googleDrive.cjs` |

### Known Blockers

None.

### Deferred Issues

- 2 residual `selectedYear !== null` patterns in AreaChartCard.jsx (line 63) and TransactionFilterBar.jsx (line 73) — cosmetically inconsistent but functionally harmless. See `deferred-items.md`.
- Date range picker in TransactionFilterBar — still deferred.
- `xlsx@0.18.5` → `exceljs` migration — no drop-in with Italian bank format support; deferred past v1.2.
- Electron 34 → 41 upgrade — 3 major versions; dedicated v1.3 milestone.

## Archived

- v1.1 Roadmap: `.planning/milestones/v1.1-ROADMAP.md`
- v1.1 Requirements: `.planning/milestones/v1.1-REQUIREMENTS.md`
- v1.0 Roadmap: `.planning/milestones/v1.0-ROADMAP.md`
- v1.0 Requirements: `.planning/milestones/v1.0-REQUIREMENTS.md`
- Retrospective: `.planning/RETROSPECTIVE.md`

---

*State tracking initialized: 2026-03-17 | v1.0 archived: 2026-03-30 | v1.1 archived: 2026-04-03 | v1.2 roadmap created: 2026-06-10*
