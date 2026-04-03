---
phase: 10
name: Update UI
status: approved
reviewed_at: 2026-04-03
created: 2026-04-03
sources:
  - 10-CONTEXT.md (primary — all key decisions pre-answered)
  - REQUIREMENTS.md (UPD-04, UPD-05, UPD-07, UPD-08, UPD-09)
  - src/components/Toast.jsx (visual template)
  - src/views/SettingsView.jsx (section pattern)
---

# UI-SPEC — Phase 10: Update UI

> Visual and interaction contract for the auto-update notification banner and
> Settings → Aggiornamenti section. All decisions sourced from 10-CONTEXT.md
> and existing codebase patterns. No design questions remain open.

---

## 1. Design System

| Property         | Value                                                        | Source              |
|------------------|--------------------------------------------------------------|---------------------|
| Tool             | Tailwind CSS v4 (no shadcn)                                  | CONTEXT.md          |
| Component lib    | Lucide React (icons), Framer Motion (animation), Radix Dialog | CONTEXT.md         |
| Font             | Inter Variable — loaded globally                             | existing codebase   |
| Design language  | Light, clean, minimal — white surfaces, soft gray borders    | CONTEXT.md          |
| Icon library     | Lucide React                                                 | existing codebase   |

---

## 2. Spacing

8-point scale. Exceptions limited to 12px (py-3, gap-3) for Toast visual-match compatibility.

| Token  | px  | Tailwind class |
|--------|-----|----------------|
| xs     | 4   | `gap-1` / `p-1` |
| sm     | 8   | `gap-2` / `p-2` |
| md     | 16  | `gap-4` / `px-4` |
| lg     | 24  | `gap-6` / `bottom-6 right-6` |
| xl     | 32  | `gap-8` |
| 2xl    | 48  | `gap-12` |
| 3xl    | 64  | `gap-16` |

**Phase-specific callouts:**
- Banner container: `fixed bottom-6 right-6` = 24px from viewport edges
- Banner inner padding: `px-4 py-3` = 16px / 12px (12px vertical is an existing Toast convention — preserved for visual match)
- Flex gap between stacked notifications: `gap-3` = 12px (existing Toast convention — preserved)
- Settings container: `p-8` = 32px (existing SettingsView pattern)
- Settings sections gap: `space-y-6` = 24px between sections

---

## 3. Typography

Font: **Inter Variable**. Declare exactly 4 sizes, 2 weights.

| Role                    | Size    | Weight    | Line-height | Tailwind classes                               |
|-------------------------|---------|-----------|-------------|------------------------------------------------|
| Page heading            | 24px    | 600       | 1.2         | `text-2xl font-semibold`                       |
| Section heading         | 14px    | 600       | 1.4         | `text-sm font-semibold uppercase tracking-wider` |
| Body / labels           | 14px    | 400       | 1.5         | `text-sm`                                      |
| Version / meta text     | 14px    | 400       | 1.5         | `text-sm text-gray-500`                        |
| Button label / small    | 12px    | 600       | N/A         | `text-xs font-semibold`                        |

**Weights used:** regular (400) + semibold (600)
**Progress emphasis:** progress percentage N% rendered in `font-semibold` within the body text string

---

## 4. Color

60/30/10 split. Italian-language app — color communicates state, not decoration.

| Role              | Value         | Tailwind class          | Reserved for                                    |
|-------------------|---------------|-------------------------|-------------------------------------------------|
| Surface (60%)     | white         | `bg-white`              | All card surfaces, banner, settings background  |
| Secondary (30%)   | gray-100/200  | `bg-gray-100`/`border-gray-200` | Inactive buttons, section dividers, borders |
| Accent (10%)      | blue-500/600  | `bg-blue-500 hover:bg-blue-600` | "Installa e riavvia" button (banner + Settings) |
| Text primary      | gray-800      | `text-gray-800`         | All body text, banner message                   |
| Text secondary    | gray-500      | `text-gray-500`         | Section headings, version label, "Sei già aggiornato" |
| Text muted        | gray-400/600  | `text-gray-400`/`text-gray-600` | Dismiss X button idle, progress text     |
| Icon accent       | blue-500      | `text-blue-500`         | ArrowDownToLine icon in UpdateBanner            |
| Semantic: error   | red-500       | `text-red-500`          | Error label in Settings ("Impossibile..."), AlertCircle icons |
| Semantic: success | green-500     | `text-green-500`        | Check icons in Toast only — NOT used in Aggiornamenti section |

---

## 5. Component Inventory

### 5.1 UpdateBanner (`src/components/UpdateBanner.jsx`)

**Visibility rule:** Render only when `status === 'ready' && !isDismissed`.
Never render during `checking`, `downloading`, `up-to-date`, `idle`, or `error`.

**DOM structure:**
```
motion.div  ← animation wrapper (NOT fixed — positioned by parent container)
  ArrowDownToLine icon (18px, text-blue-500, shrink-0)
  div.flex.flex-col.flex-1.gap-0.5
    span.text-sm.text-gray-800   ← "Aggiornamento disponibile — v{version}"
    button.installa-riavvia      ← "Installa e riavvia"
  button.dismiss-x               ← X close button
```

**Tailwind classes — root motion.div:**
```
bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3
flex items-center gap-3 text-gray-800 min-w-[260px]
```
*(Identical to Toast.jsx root — intentional visual match)*

**"Installa e riavvia" button (inside banner):**
```
bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-3 py-2
text-xs font-semibold transition-colors cursor-pointer
```

**Dismiss X button:**
```
ml-auto text-gray-400 hover:text-gray-600 transition-colors cursor-pointer
```
- Icon: `<X size={16} />`
- `aria-label="Chiudi notifica aggiornamento"`

**Animation (motion.div — same as Toast):**
```js
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }}
exit={{ opacity: 0, y: 20, transition: { duration: 0.2, ease: 'easeIn' } }}
```

**Props:**
```ts
{
  version: string        // e.g. "1.2.0"
  onInstall: () => void  // calls installUpdate()
  onDismiss: () => void  // calls dismissBanner()
}
```

---

### 5.2 Notification Stack Container (in `App.jsx`)

```jsx
<div className="fixed bottom-6 right-6 z-50 flex flex-col-reverse gap-3">
  <AnimatePresence>
    {showToast && <Toast key="toast" ... />}
  </AnimatePresence>
  <AnimatePresence>
    {showBanner && <UpdateBanner key="update-banner" ... />}
  </AnimatePresence>
</div>
```

**Note:** `flex-col-reverse` means Toast (lower in DOM) renders at bottom (closer to viewport edge). UpdateBanner stacks above it. No z-index layering needed within the container.

**Toast migration:** Remove `fixed bottom-6 right-6 z-50` from Toast's own `className` — positioning is now owned by the container. Toast root becomes:
```
bg-white border border-gray-200 shadow-lg rounded-xl px-4 py-3
flex items-center gap-3 text-gray-800 min-w-[260px]
```

---

### 5.3 Settings → Aggiornamenti Section (in `src/views/SettingsView.jsx`)

**Section structure (follows existing Categorie / Sincronizzazione pattern):**
```jsx
<section>
  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
    Aggiornamenti
  </h3>
  {/* version row */}
  {/* action area */}
</section>
```

**Version row (always visible):**
```jsx
<p className="text-sm text-gray-500 mb-3">
  Versione corrente: <span className="text-gray-700">{updateStatus.appVersion}</span>
</p>
```

**Action area — state machine:**

| `status`     | Rendered output                                              |
|--------------|--------------------------------------------------------------|
| `idle`       | "Controlla aggiornamenti" button (enabled)                  |
| `checking`   | "Controlla aggiornamenti" button (disabled) + `<Loader2 size={14} className="animate-spin inline-block mr-1" />` |
| `up-to-date` | "Sei già aggiornato" text + "Controlla aggiornamenti" button |
| `downloading`| Progress text + (no button)                                  |
| `ready`      | "Aggiornamento pronto" text + "Installa e riavvia" button    |
| `error`      | Error message block + "Controlla aggiornamenti" button       |

**"Controlla aggiornamenti" button (idle/checking/up-to-date/error):**
```
bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg px-4 py-2
text-sm font-semibold transition-colors cursor-pointer
disabled:opacity-50 disabled:cursor-not-allowed
```

**"Installa e riavvia" button (ready state — Settings):**
```
bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2
text-sm font-semibold transition-colors cursor-pointer
```

**Progress text (downloading state):**
```jsx
<p className="text-sm text-gray-600">
  Versione {updateStatus.version} disponibile —{' '}
  download <span className="font-semibold">{updateStatus.progress}%</span> completato
</p>
```

**"up-to-date" state:**
```jsx
<p className="text-sm text-gray-500 mb-3">Sei già aggiornato</p>
{/* followed by enabled "Controlla aggiornamenti" button */}
```

**Error state:**
```jsx
<p className="text-sm text-red-500 mb-1">Impossibile controllare gli aggiornamenti</p>
<p className="text-sm text-gray-500 mb-3">{updateStatus.error}</p>
{/* followed by enabled "Controlla aggiornamenti" button (acts as Riprova) */}
```
- No separate "Riprova" link — the "Controlla aggiornamenti" button serves as retry in error state
  *(CONTEXT.md says "Riprova" inline link; consolidated into the primary button to keep the interface minimal — agent's discretion per CONTEXT.md §Agent's Discretion)*

**"ready" state (Settings):**
```jsx
<p className="text-sm text-gray-500 mb-3">Aggiornamento pronto</p>
<button className="bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-2 text-sm font-semibold transition-colors cursor-pointer">
  Installa e riavvia
</button>
```

**SettingsView new prop signature:**
```ts
SettingsView({
  onShowCategoryManager: () => void,
  onShowSyncSettings: () => void,
  updateStatus: {
    status: 'idle'|'checking'|'available'|'downloading'|'ready'|'up-to-date'|'error',
    version: string | null,
    progress: number,        // 0–100
    error: string | null,
    appVersion: string,
    isDismissed: boolean,
    checkForUpdates: () => void,
    installUpdate: () => void,
    dismissBanner: () => void
  }
})
```

---

### 5.4 `useUpdateStatus` Hook (`src/hooks/useUpdateStatus.js`)

Not a visual component, but the hook shape is part of the interaction contract.

**Exposed shape:**
```ts
{
  status: 'idle' | 'checking' | 'available' | 'downloading' | 'ready' | 'up-to-date' | 'error'
  version: string | null      // available/downloading/ready version
  progress: number            // 0–100, only meaningful during 'downloading'
  error: string | null        // only meaningful during 'error'
  appVersion: string          // from app.getVersion() via IPC, loaded on mount
  isDismissed: boolean        // banner dismissed by user
  checkForUpdates: () => void // calls window.electronAPI.updater.checkForUpdates()
  installUpdate: () => void   // calls window.electronAPI.updater.installUpdate()
  dismissBanner: () => void   // sets isDismissed = true (does NOT change status)
}
```

**Initial state on mount:** `status: 'idle'`, `isDismissed: false`. Hook does NOT trigger an automatic check — startup check is Phase 9 main process responsibility.

---

## 6. Interaction Contracts

### 6.1 Update Banner Lifecycle

```
App starts
  → status: idle
  → [Phase 9 main process fires onUpdateAvailable]
  → status: available → renderer calls startDownload() automatically
  → status: downloading, progress: 0→100 (live updates)
  → status: ready
  → UpdateBanner appears (slide-up animation)

User clicks "Installa e riavvia" (banner or Settings)
  → installUpdate() called → app quits and installs
  → (no further UI state — app closes)

User clicks X (banner only)
  → isDismissed = true
  → banner exits (slide-down animation via AnimatePresence exit)
  → Settings section still shows 'ready' state with "Installa e riavvia" button
```

### 6.2 Manual Check Lifecycle (Settings)

```
User clicks "Controlla aggiornamenti"
  → status: checking → button disabled, Loader2 spinner shown
  → [IPC check resolves]

  Branch A — up to date:
    status: up-to-date → "Sei già aggiornato" text + button re-enabled

  Branch B — update found:
    status: available → startDownload() fires automatically
    status: downloading → progress text updates live
    status: ready → "Aggiornamento pronto" + "Installa e riavvia" button
                  → UpdateBanner appears in corner

  Branch C — network/error:
    status: error → red error text + gray "Controlla aggiornamenti" button (acts as retry)
```

### 6.3 Accessibility

- Banner dismiss button: `aria-label="Chiudi notifica aggiornamento"`
- "Controlla aggiornamenti" button disabled during `checking`: add `disabled` attribute (not just `opacity-50`) so screen readers announce it as unavailable
- Loader2 spinner: `aria-hidden="true"` (decorative)
- Progress text updates: wrap in `<p role="status" aria-live="polite">` so screen readers announce progress changes

---

## 7. Copywriting Contract

All text is Italian (existing app language).

| Element                        | Copy                                                    | State          |
|--------------------------------|---------------------------------------------------------|----------------|
| Banner message                 | `Aggiornamento disponibile — v{version}`                | ready          |
| Banner CTA                     | `Installa e riavvia`                                    | ready          |
| Banner dismiss aria-label      | `Chiudi notifica aggiornamento`                         | ready          |
| Section heading                | `Aggiornamenti`                                         | always         |
| Version label                  | `Versione corrente: {appVersion}`                       | always         |
| Manual check button            | `Controlla aggiornamenti`                               | idle/error/up-to-date |
| Checking state                 | button text stays `Controlla aggiornamenti` + spinner   | checking       |
| Up-to-date state               | `Sei già aggiornato`                                    | up-to-date     |
| Downloading state              | `Versione {version} disponibile — download {N}% completato` | downloading |
| Ready state (Settings)         | `Aggiornamento pronto`                                  | ready          |
| Settings CTA (ready)           | `Installa e riavvia`                                    | ready          |
| Error heading                  | `Impossibile controllare gli aggiornamenti`             | error          |
| Error detail                   | `{updateStatus.error}` (raw error string from IPC)      | error          |
| Retry (error) button           | `Controlla aggiornamenti` (same button, calls checkForUpdates) | error   |

**Empty state:** Not applicable — the "idle" state is the default state (version shown, button available). No empty-state illustration or message needed.

**Destructive actions in this phase:** "Installa e riavvia" triggers `quitAndInstall()` (closes and relaunches app). This is not destructive to data — no confirmation dialog required. The explicitness of the button label ("Installa **e riavvia**") is sufficient user consent.

---

## 8. Animation Contract

All animations use Framer Motion `motion.div` + `AnimatePresence`.

| Element        | Entry                                  | Exit                                   | Duration       |
|----------------|----------------------------------------|----------------------------------------|----------------|
| UpdateBanner   | `opacity: 0→1, y: 20→0, easeOut`      | `opacity: 1→0, y: 0→20, easeIn`       | 300ms / 200ms  |
| Toast          | (unchanged from existing)              | (unchanged from existing)              | 300ms / 200ms  |

Both use identical animation values — they are visually indistinguishable siblings in the stack.

---

## 9. Registry

| Registry        | Status            | Safety Gate |
|-----------------|-------------------|-------------|
| shadcn official | not initialized   | N/A         |
| third-party     | none declared     | N/A         |

No shadcn. No third-party registries. Lucide React and Framer Motion are already installed.

---

## 10. File Map

| File                                      | Action   | Notes                                                   |
|-------------------------------------------|----------|---------------------------------------------------------|
| `src/components/UpdateBanner.jsx`         | CREATE   | New component — matches Toast visual style              |
| `src/components/index.js`                 | EDIT     | Add `UpdateBanner` export                               |
| `src/hooks/useUpdateStatus.js`            | CREATE   | New hook — owns all update state                        |
| `src/hooks/index.js`                      | EDIT     | Add `useUpdateStatus` export                            |
| `src/views/SettingsView.jsx`              | EDIT     | Add `updateStatus` prop + Aggiornamenti section         |
| `src/App.jsx`                             | EDIT     | Add hook call, refactor Toast container, pass prop      |
| `electron/main.cjs`                       | EDIT     | Add `ipcMain.handle('get-app-version', ...)`            |
| `electron/preload.cjs`                    | EDIT     | Add `getAppVersion` to `electronAPI` object             |

---

## 11. Pre-Population Sources

| Source              | Decisions Used                                                        |
|---------------------|-----------------------------------------------------------------------|
| 10-CONTEXT.md       | All component decisions (D-01 through D-14), stacking layout, hook shape, IPC additions |
| REQUIREMENTS.md     | UPD-04, UPD-05, UPD-07, UPD-08, UPD-09 — interaction rules          |
| Toast.jsx           | Exact Tailwind classes, animation values, icon sizes, aria patterns   |
| SettingsView.jsx    | Section heading classes, button classes, container padding            |
| User input          | 0 (all answered upstream — no questions required during this session) |

---

## Checker Sign-Off

- [x] Dimension 1 Copywriting: FLAG (non-blocking — retry consolidation justified in §5.3)
- [x] Dimension 2 Visuals: FLAG (non-blocking — focal point implied by accent color contract)
- [x] Dimension 3 Color: PASS
- [x] Dimension 4 Typography: PASS
- [x] Dimension 5 Spacing: PASS
- [x] Dimension 6 Registry Safety: PASS

**Approval:** approved 2026-04-03

---

*Phase: 10-update-ui | UI-SPEC status: approved | Created: 2026-04-03 | Approved: 2026-04-03*
