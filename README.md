# Simple Lists

Offline-first PWA for shopping and task lists: **Organizations → Projects → Lists → Items**.
Data lives only in this device's IndexedDB; use Settings → Export / Import to move it.

## Develop

```bash
npm install
npm run dev
```

`npm run build` type-checks and builds to `dist/` (with the service worker). `npm run preview` serves the build —
use it to test offline mode and the "Update available" prompt. `npm run icons` regenerates the PNG icons in `public/`.

## Deploy

Import the repo in Vercel (framework preset: Vite). `vercel.json` rewrites every route to `index.html`
and serves `sw.js` without caching.

## Using lists

- Tap an item to check / uncheck it. Checked items move to the bottom (most recent first).
- Type in "Add items" — every line break creates an item; pasting several lines creates one per line.
- Swipe an item left to delete it (Undo in the toast).
- Hold an unchecked item: release without moving to edit it, or move to reorder. Hold a checked item to edit it.
  On desktop, right-click also opens the editor.
- The eye icon in the header hides / shows checked items (saved per list).

Cards (organizations, projects, lists) work the same way: tap to open, hold to edit or drag to reorder, or use the ⋯ button.

## Structure

```
src/
  db/          Dexie schema, data operations, backup export/import
  theme/       Color tokens (CSS variables), palette helpers, light/dark/system mode
  components/  Shared UI: Page transitions, Header, cards collection, sortable, sheets, toasts
  features/    organizations · projects · lists · items · settings screens
  routes/      Route table and direction-aware page transitions
```

Schema changes: add `this.version(n).stores(...).upgrade(...)` in `src/db/db.ts` and bump `SCHEMA_VERSION`
(backups from newer schemas are rejected on import).
