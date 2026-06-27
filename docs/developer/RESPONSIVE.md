# Responsive design for Resilience360

This app is large (main shell in `src/App.tsx`, global styles in `src/index.css` and `src/App.css`). Use this checklist when adding or fixing layouts so behavior stays consistent on phone, tablet, and desktop.

## 1. Viewport and base document

- `index.html` already sets `width=device-width`, `initial-scale=1`, and `viewport-fit=cover` for notched devices.
- Global fluid type tokens live in `src/index.css` under `:root` (`--type-body`, `--type-h1`, etc.). Prefer these over fixed `px` for copy.

## 2. Layout principles

- Prefer **CSS Grid** with `repeat(auto-fit, minmax(...))` or `minmax(0, 1fr)` so columns collapse instead of overflowing.
- Add **`min-width: 0`** on flex/grid children that should shrink (maps, tables, long text).
- Use **`overflow-x: auto`** only when unavoidable (wide tables); avoid hiding whole panels per breakpoint.

## 3. Breakpoints used in this repo

Approximate tiers (grep `max-width` in `src/index.css` / `src/App.css` for the full set):

| Range        | Typical adjustments                          |
|-------------|-----------------------------------------------|
| ≤ 1100px    | Tighter shell padding; home cards 2 columns |
| ≤ 900px    | Navbar controls stack vertically              |
| ≤ 768px    | Many grids → single column; toolbar gaps     |
| ≤ 700px    | Home card grid → 1 column                     |
| ≤ 640px    | Portal iframe min-height; action rows wrap    |
| ≤ 520px    | Smallest padding / type tweaks                |

When adding rules, extend an existing breakpoint band if possible instead of introducing a new one.

## 4. Navbar language / role toolbar

- Toolbar markup: `nav-toolbar-controls` with `nav-toolbar-label-text` spans (`App.tsx`, `HomePageView.tsx`).
- Labels must remain **visible on all widths**; selects keep `aria-label` for assistive tech. Do not clip label text to 1px for “space saving”.

## 5. Earthquake monitor (`App.css`)

- Globe area: `.earthquake-monitor-globe-area` uses a **column flex** layout below 1200px so the **World View** chip (`.earthquake-mini-map`) stacks under the globe instead of being removed.
- Below 1024px the activity list moves under the globe; keep scroll regions (`overflow-y: auto`) with a sensible `max-height` using `vh` where needed.

## 6. Embedded portals and maps

- Iframes: `.pgbc-portal-frame` gets a minimum height on small screens (`index.css`).
- Leaflet: `.leaflet-map` heights step down by breakpoint; if you add a new map, give it `width: 100%`, `min-width: 0`, and a mobile height.

## 7. Tables and wide content

- Prefer horizontal scroll on the **panel** (`overflow-x: auto` on `.content-layer .panel.section-panel` at ≤900px) rather than dropping columns without an alternative.
- `pre` / `code`: `max-width: 100%` and `overflow-x: auto` are already set globally.

## 8. QA

- Resize the browser from ~360px to 1440px+ on key flows: home, one section with a map, earthquake monitor, any embedded portal.
- Optional: `src/components/ResponsiveQa.tsx` exists for automated breakpoint checks in dev.
- For Capacitor builds, verify safe areas (`env(safe-area-inset-*)`) on a real device after shell changes.

## 9. What to avoid

- **`display: none` on real content** (not print, not decorative markers) purely for viewport size—reflow, stack, or scroll instead.
- **Global `button { width: 100% }`** without scoping—can break icon toolbars and modals; scope to layout regions if you add stacking rules.
