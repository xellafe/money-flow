---
status: partial
phase: 11-update-error-handling
source: [11-VERIFICATION.md]
started: 2026-04-03T16:15:00Z
updated: 2026-04-03T16:15:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Background error reaches UI
expected: Launch NSIS build with blocked update endpoint; wait 3s for startup check to fire. The Settings view and/or update banner should show error state — NOT stuck in `'idle'` indefinitely.
result: [pending]

### 2. Mid-download error reaches UI
expected: Start a download, kill the network mid-way. The UI should transition from `'downloading'` to error state — NOT stuck in `'downloading'` forever.
result: [pending]

## Summary

total: 2
passed: 0
issues: 0
pending: 2
skipped: 0
blocked: 0

## Gaps
