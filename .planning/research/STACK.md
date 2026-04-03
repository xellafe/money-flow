# Technology Stack: Auto-Update via GitHub Releases

**Project:** MoneyFlow v1.1 Auto-Update
**Researched:** 2026-04-03
**Confidence:** HIGH — verified from npm registry, electron-builder monorepo source, official README

---

## Recommended Libraries

### New Dependency Required

| Library | Version | Placement | Why |
|---------|---------|-----------|-----|
| `electron-updater` | `^6.8.3` | `dependencies` (runtime) | Must be in `dependencies`, NOT `devDependencies` — it runs in the packaged production app. Same monorepo as electron-builder 26, fully compatible. |

**Install command:**
```bash
npm install electron-updater
```

> **Verified latest:** `npm view electron-updater dist-tags` → `{ latest: '6.8.3', next: '6.8.3' }` as of 2026-04-03.
> Part of the `electron-userland/electron-builder` monorepo — same repo as your existing `electron-builder ^26.0.0`.
> No peer dependencies. Runtime deps: `semver`, `js-yaml`, `fs-extra`, `builder-util-runtime` (all auto-installed).

### No Other New Libraries Needed

- **No `update-electron-app`** — Squirrel-based wrapper; incompatible with electron-builder GitHub publish format.
- **No additional UI library** — extend existing toast + Radix Dialog patterns already in the project.
- **No `electron-log`** — optional for logging; overkill for this scope; `console.log` to stderr is sufficient.

---

## electron-builder Config Changes

### 1. Add `publish` to `package.json` `build` section

```jsonc
"build": {
  "appId": "com.moneyflow.app",
  "productName": "MoneyFlow",
  // ... existing config stays unchanged ...

  "publish": {
    "provider": "github",
    "owner": "YOUR_GITHUB_USERNAME",   // replace with actual GitHub owner
    "repo": "YOUR_REPO_NAME",          // replace with actual repo name
    "releaseType": "release"           // "release" = stable; "prerelease" for betas
  }
}
```

> **Why explicit `owner`/`repo`?** The current `package.json` has no `repository` field.
> electron-builder falls back to `package.json#repository` for auto-detection — since it is absent,
> explicit values are required. Alternative: add `"repository": "https://github.com/OWNER/REPO"` to
> `package.json` root — either approach works.

### 2. Portable target: exclude from auto-update

The current `win.target` includes both `portable` and `nsis`. **electron-updater does NOT support
portable** (official README: "Windows: NSIS only"). The portable exe can still be uploaded to the
GitHub Release as a download, but it must not receive the `latest.yml` publish config.

Simplest approach — put `publish` only in `nsis` target scope (not at root level):

```jsonc
"win": {
  "target": ["portable", "nsis"],
  "icon": "public/logo.ico",
  "signAndEditExecutable": false
  // No root-level publish — keep publish scoped to nsis only
},
"nsis": {
  "oneClick": false,
  "allowToChangeInstallationDirectory": true,
  "createDesktopShortcut": true,
  "createStartMenuShortcut": true,
  "shortcutName": "MoneyFlow",
  "publish": {
    "provider": "github",
    "owner": "YOUR_GITHUB_USERNAME",
    "repo": "YOUR_REPO_NAME",
    "releaseType": "release"
  }
}
```

> In practice, even with root-level `publish`, electron-builder only generates `latest.yml` for
> installer targets (nsis). The portable exe gets uploaded to the release but has no update metadata.
> Scoping to `nsis` is cleaner and avoids ambiguity.

### 3. Add release script to `package.json` scripts

```jsonc
"electron:release": "vite build && electron-builder --publish always"
```

`--publish always` uploads artifacts to GitHub Release unconditionally (not just on CI).
Use this on tag pushes: `npm run release:patch` already bumps version + pushes tag;
add `electron:release` as the follow-up build step.

### 4. GitHub Token for publishing

electron-builder needs `GH_TOKEN` env var to **publish** (upload to GitHub Releases).
It does NOT need a token to **check/download updates** from a public repository.

```powershell
# Local manual release:
$env:GH_TOKEN = "ghp_xxxxxxxxxxxx"
npm run electron:release

# GitHub Actions CI:
env:
  GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## Code Signing

### Current State

`"signAndEditExecutable": false` is already set — the app ships **unsigned on Windows**.

### Impact on Auto-Update

| Concern | Reality |
|---------|---------|
| Does electron-updater work unsigned? | **YES.** Works correctly without code signing. |
| SmartScreen on initial install | **YES — warning triggers.** "Windows protected your PC" on the NSIS installer. User clicks "More info → Run anyway". One-time friction. |
| SmartScreen on updates | **Same as initial install.** Each update installer (downloaded + applied by electron-updater) triggers SmartScreen again because it is unsigned. |
| Certificate requirement | **Not required** for GitHub Releases provider. Only needed for Microsoft Store or EV workflows. |

### Recommendation: Keep Unsigned for v1.1

Code signing requires an EV certificate (~€300–500/year from DigiCert/Sectigo) or
Azure Trusted Signing (~€10/month). Out of scope for v1.1. SmartScreen warning is
acceptable for a personal finance tool distributed to known users.

If signing is added later:
- Set `"signAndEditExecutable": true`
- Set env vars: `CSC_LINK` (path to `.p12`), `CSC_KEY_PASSWORD`
- electron-builder 26 has Azure Trusted Signing support with signing queue (fixed in latest changelog)

---

## IPC Bridge Extension

The existing preload uses `contextBridge.exposeInMainWorld` + `ipcRenderer.invoke` / `ipcRenderer.on`.
Extend the same pattern — no new architecture needed.

**Events: main → renderer (use `ipcMain`/`mainWindow.webContents.send`):**

| Event channel | Payload | Trigger |
|---------------|---------|---------|
| `update:checking` | none | Auto-check started |
| `update:available` | `{ version, releaseNotes }` | Newer version found |
| `update:not-available` | `{ version }` | Already on latest |
| `update:download-progress` | `{ percent, bytesPerSecond, transferred, total }` | During download |
| `update:downloaded` | `{ version }` | Ready to install |
| `update:error` | `{ message }` | Any error |

**Commands: renderer → main (use `ipcRenderer.invoke`):**

| Channel | Action |
|---------|--------|
| `update:check` | Call `autoUpdater.checkForUpdates()` |
| `update:install` | Call `autoUpdater.quitAndInstall()` |

electron-updater's `autoUpdater` is a drop-in singleton — just `require('electron-updater').autoUpdater`.

---

## CSP: No Changes Required

electron-updater makes all HTTP requests from the **main process** (Node.js), not from renderer
WebContents. The existing `Content-Security-Policy` in `main.cjs` controls renderer-side network
only. The GitHub API and CDN calls from the updater are completely outside CSP scope.

---

## Electron 34 Compatibility

**No known issues.** electron-updater 6.8.3 is from the same actively-maintained monorepo as
electron-builder 26, which targets Electron 34 in its CI matrix. The `autoUpdater` API surface is
stable across Electron versions.

---

## What NOT to Add

| Don't add | Why |
|-----------|-----|
| `update-electron-app` | Squirrel-based; incompatible with electron-builder GitHub publish format |
| `electron-log` | Overkill; adds bundle weight; `console.log` is sufficient for v1.1 |
| `electron-updater` in devDependencies | Must be in `dependencies` — bundled into the asar for production |
| Code signing toolchain | Out of scope v1.1; unsigned works; EV cert cost not justified |
| Custom update server | GitHub Releases is free, zero maintenance, already the right provider |
| Delta/differential updates | Requires `bsdiff4` native module; not worth complexity for personal app |
| Squirrel.Windows target | Different paradigm, incompatible with NSIS auto-update; do not replace NSIS |
| Auto-download without user consent | Bad UX for a financial app; always prompt before downloading |
| `autoUpdater.checkForUpdatesAndNotify()` | Built-in notification is an OS-level dialog, not a toast; use `checkForUpdates()` with manual IPC events for the custom toast UI |

---

## Sources

- `npm view electron-updater dist-tags` — npm registry, 2026-04-03 (confirmed: `6.8.3`)
- `npm view electron-builder version` — npm registry, 2026-04-03 (confirmed: `26.8.1`)
- https://github.com/electron-userland/electron-builder/tree/master/packages/electron-updater (README — Windows: NSIS only)
- https://github.com/electron-userland/electron-builder/blob/master/CHANGELOG.md (v26 series — Electron 34 support)
- `package.json` — existing config: `signAndEditExecutable: false`, targets: `portable` + `nsis`
- `electron/preload.cjs` — existing IPC bridge pattern (contextBridge + invoke + on)
- `electron/main.cjs` — existing CSP config, IPC handler structure
