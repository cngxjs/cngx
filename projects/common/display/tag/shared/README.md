# Tag Shared

Internal helpers consumed by `CngxTag`, `CngxTagGroup`, and their slot directives. Nothing in this folder is re-exported from `@cngx/common/display`. Consumers have no API surface here. The folder exists so the two atoms can share a structural CSS skeleton and a slot-resolution helper without duplicating either.

## What lives here

| File | Purpose |
|-|-|
| `inject-resolved-template.ts` | `injectResolvedTagTemplate(directive, key)`: 3-stage cascade (instance directive > `CNGX_TAG_CONFIG.templates[key]` > `null`) used by every `*cngxTag*` and `*cngxTagGroup*` slot host. `CngxTagTemplateKey` is the union of currently-wired keys (`label`, `prefix`, `suffix`, `header`, `accessory`). |
| `tag-base.css` | Structural skeleton for `.cngx-tag` and `.cngx-tag-group`. Layout, density modifiers, gap and alignment variants, label shrink/truncate hook. Layout-only: no `@property` registrations, no thematic skin. The per-atom files (`tag.css`, `tag-group.component.css`) register the tokens this file consumes. |

Both files carry `@internal` doc tags. The helper deliberately copies the select-shared variant instead of importing it: Sheriff blocks `lib:common-display` from reaching into `lib:forms-select`, and hoisting to `@cngx/core/utils` is a separate consolidation. See `inject-resolved-template.ts` for the full rationale.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for the public tag surface.
- `CngxTag`, `CngxTagGroup`: the two atoms that consume these helpers.
