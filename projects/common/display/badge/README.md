# Badge

Display atom that attaches a small floating counter or dot indicator to any host element. The directive injects a `<span class="cngx-badge-indicator">` child, manages its content and modifier classes from a single value input, and ensures the host can anchor it. Purely presentational: the indicator is `aria-hidden="true"`, so the semantic meaning lives on the host (`aria-label`, surrounding text).

`CngxBadge` is not a notifications system, not a status pill, and not a toggle. For colored status labels with text use `CngxTag`. For input-like chips use `CngxChip`.

## Import

```ts
import { CngxBadge, type CngxBadgeColor, type CngxBadgePosition } from '@cngx/common/display';
```

## Quick start

```html
<!-- Numeric counter on an icon button -->
<button type="button" [cngxBadge]="unread()" color="error" aria-label="Inbox, {{ unread() }} unread">
  <cngx-icon><mat-icon aria-hidden="true">mail</mat-icon></cngx-icon>
</button>

<!-- Dot mode: presence indicator, no text -->
<button type="button" [cngxBadge]="true" color="primary" aria-label="New activity">
  <cngx-icon><mat-icon aria-hidden="true">notifications</mat-icon></cngx-icon>
</button>

<!-- Cap with overflow -->
<button type="button" [cngxBadge]="237" [max]="99" color="primary">Inbox</button>
<!-- renders "99+" -->

<!-- Hide on demand without unmounting the host -->
<button type="button" [cngxBadge]="count()" [hidden]="count() === 0" color="neutral">
  Drafts
</button>
```

## Selector and host pattern

Attribute directive only: `[cngxBadge]`. The value is required and accepts `number | string | boolean`:

|-|-|
| `number` | rendered as text; values above `max` render as `"{max}+"`. `0` hides the indicator. |
| `string` | rendered verbatim. Empty string hides the indicator. |
| `true` / `false` | dot mode toggle. `true` shows a dot, `false` hides the indicator. |

The host element keeps its own role and content. The directive only adds the `cngx-badge-host` class and, for non-inline positions, sets `position: relative` on the host if its computed position is `static`. It does not move, replace, or wrap the host.

```html
<button type="button" [cngxBadge]="5">Inbox</button>
<a [cngxBadge]="true" routerLink="/profile">Profile</a>
<span [cngxBadge]="'NEW'" color="warning">Beta toggle</span>
```

## Accessibility

The indicator span carries `aria-hidden="true"` and is therefore never announced. The host owns the semantics. Anything a screen reader needs to know about the badge must be in the host's accessible name.

| Pattern | Correct shape |
|-|-|
| Icon-only button with counter | `aria-label` on the button includes the count: `aria-label="Inbox, 5 unread"`. |
| Text host with counter | Either include the count in the host text, or use `aria-label` on the host. |
| Dot mode (presence) | `aria-label` on the host states what the dot means: `aria-label="New activity"`. |
| Anti-pattern | Relying on the visual badge alone. AT users get no signal. |

The directive does not read the count for you. Recompute the host's accessible name when the count changes.

## Color variants

`color` (`CngxBadgeColor`, default `'primary'`):

| Value | Use |
|-|-|
| `primary` | Neutral counter / default emphasis. |
| `error` | Destructive or attention-required state (unread errors, failed jobs). |
| `warning` | Soft alert, non-blocking. |
| `neutral` | Low-emphasis count, e.g. drafts. |

## Positions

`position` (`CngxBadgePosition`, default `'above-end'`):

| Value | Anchor |
|-|-|
| `above-end` | Top-right corner of the host (default, LTR-aware via `inset-inline-end`). |
| `above-start` | Top-left corner. |
| `below-end` | Bottom-right corner. |
| `below-start` | Bottom-left corner. |
| `inline` | Renders in normal flow at the end of the host. No corner anchoring, no border ring, no `position: relative` on the host. |

Corner positions render a contrast ring (`--cngx-badge-border`) so the indicator reads as a cut-out pill against the host surface.

## Other inputs

| Input | Default | Purpose |
|-|-|-|
| `hidden` | `false` | Force-hides the indicator regardless of value. Cheaper than toggling the directive itself. |
| `max` | `99` | Cap for numeric values. Anything over renders as `"{max}+"`. |

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs and tokens.
- Stories: `examples/stories/common/display/badge/`.
