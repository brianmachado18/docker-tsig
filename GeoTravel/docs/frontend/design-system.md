# Frontend Design System

The current frontend uses TailwindCSS with a pragmatic GIS dashboard style: dense, readable, responsive, and map-first.

| Concern | Rule |
|---|---|
| Layout | Prefer full-width app surfaces over marketing sections |
| Components | Keep common primitives in `frontend/src/components/common/` |
| Icons | Prefer the existing icon approach used by current components |
| Colors | Keep route status colors distinct: available, pending, off-season, cancelled |
| Responsive | Preserve desktop map productivity and mobile readability |
| Text | Source user-facing strings from `frontend/src/locales/` when i18n is in scope |
