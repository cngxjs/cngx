# Avatar

Display atom for a user, person, or entity portrait. Renders one of three sources in priority order: a loaded `<img>`, an initials block, or projected fallback content (typically a `<cngx-icon>`). Carries an optional presence dot. Not a user-picker, not a group/stack component, no automatic initials derivation from a name.

## Import

```ts
import { CngxAvatar } from '@cngx/common/display';
```

## Quick start

```html
<!-- Image with initials fallback if the URL 404s -->
<cngx-avatar src="/img/jane.jpg" alt="Jane Doe" initials="JD" />

<!-- Initials only -->
<cngx-avatar initials="JD" />

<!-- Final fallback: projected icon -->
<cngx-avatar>
  <cngx-icon><mat-icon>person</mat-icon></cngx-icon>
</cngx-avatar>

<!-- Square shape, large, with a presence dot -->
<cngx-avatar
  src="/img/team.jpg"
  alt="Team mascot"
  shape="square"
  size="lg"
  status="online"
/>
```

## Rendering cascade

The template picks exactly one source per render:

1. `<img>` if `src` is set and has not errored on load.
2. `<span class="cngx-avatar__initials">` if `initials` is set.
3. Projected `<ng-content>` otherwise.

The fallback is signal-driven: a failed image load flips `imageErroredState` and the next branch takes over without a flicker. Resetting `src` to a new URL clears the error state on the next successful load.

Two read-only signals are exposed for consumer logic:

| Signal | Type | Meaning |
|-|-|-|
| `imageLoaded` | `Signal<boolean>` | The current `<img>` has fired `load`. |
| `showFallback` | `Signal<boolean>` | Initials or projected content is currently rendered. |

## Accessibility

The image branch uses standard `<img alt>`. When `alt` is unset it defaults to the empty string, which marks the image as decorative for assistive tech - the surrounding text or `aria-label` of an enclosing control must carry the identity.

The initials branch is marked `aria-hidden="true"`. Initials are a visual shortcut, not the user's name; never rely on them for accessible identity. If the avatar appears standalone (no surrounding label), wrap it in a labelled host:

```html
<span aria-label="Jane Doe">
  <cngx-avatar initials="JD" />
</span>
```

The status dot carries `aria-label="<status>"` with the raw value (`online` / `offline` / `busy` / `away`). Override in the consumer when the surrounding context already announces presence.

| Branch | Host ARIA |
|-|-|
| Image | `<img alt="...">` (empty alt = decorative) |
| Initials | `aria-hidden="true"` on the initials span |
| Projected | inherits from projected content |
| Status dot | `aria-label="<status>"` |

## Sizing

`size` ∈ `xs | sm | md | lg | xl` (default `md`). Each variant pins both `--cngx-avatar-size` and `--cngx-avatar-font-size` so the initials track the plate.

| Variant | Plate | Initials |
|-|-|-|
| `xs` | `1.5rem` | `0.625rem` |
| `sm` | `2rem` | `0.75rem` |
| `md` | `2.5rem` | `1rem` |
| `lg` | `3rem` | `1.125rem` |
| `xl` | `4rem` | `1.5rem` |

For one-off sizes, set the active tokens inline:

```html
<cngx-avatar initials="JD" style="--cngx-avatar-size: 56px; --cngx-avatar-font-size: 1.25rem" />
```

## Shape

`shape` ∈ `circle | square` (default `circle`). Circle uses `--cngx-avatar-circle-radius` (defaults to the foundation pill token). Square uses `--cngx-avatar-square-radius`. The `<img>` inherits the host radius, so the picture is clipped to the same shape.

## Status

`status` ∈ `online | offline | busy | away` (or unset). The dot is positioned bottom-right, sized in `em` so it scales with the avatar, and bordered with `--cngx-avatar-status-border` (defaults to the surface color so the dot reads as cut out). Status colors fall back to the foundation system tokens: `online` → `--cngx-color-success`, `busy` → `--cngx-color-danger`, `away` → `--cngx-color-warning`.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs and tokens.
- Stories: `examples/stories/common/display/avatar/`.
