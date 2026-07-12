# ONE WAY OUT — Developers Hub

The command center for the ONE WAY OUT Roblox game development project.
Every class, economy number, location, visual reference, boss arena, and
build task lives here instead of scattered across Discord and Drive.

This is a standalone app, independent of the rest of this repository.

## Sections

- **Classes** — all playable classes, stats, abilities, unlock costs
- **Economy** — animal/item loot tables, class prices, game passes, XP curve, revenue projections
- **Locations** — every named location across the 4 worlds
- **Visual Guide** — color palettes, reference images, typography notes
- **Boss Arenas** — the 4 final boss encounters
- **Development** — the build roadmap and timeline

Every section is fully editable (add/edit/delete), including image uploads.
Data is stored in the browser's `localStorage`, so it lives on the device
you're using — it does not sync between team members yet.

## Running it

```bash
npm install
npm run dev      # local dev server
npm run build    # production build to dist/
```
