# Select shared internals

Entry-private plumbing for the nine `@cngx/forms/select` composites. Everything here is consumed only by sibling files inside the `forms/select` entry and is deliberately held out of `public-api.ts`. The barrel BFS never reaches these units, so they are not part of the published API surface.

Sheriff's `internal` encapsulation pattern guards the boundary: a stray `export ... from './shared/internal/...'` added to the entry barrel surfaces as an encapsulation violation at `npm run lint` rather than silently widening the published API. The sibling half, `shared/` one level up, holds the 33 re-exported units that are the entry's API.

Rule: do not re-export anything from this folder through `public-api.ts`. New private helpers for the select family belong here; new public surface belongs in `shared/`.
