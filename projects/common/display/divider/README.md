# Divider

Presentational separator directive that pins the correct ARIA shape on whatever host element it sits on. No DOM of its own, no content projection, no styling shipped from the directive itself - visual defaults live in the Track-B stylesheet at `@cngx/themes` and bind through `.cngx-divider`.

## Import

```ts
import { CngxDivider } from '@cngx/common/display';
```

## Quick start

```html
<!-- Horizontal (default) -->
<div>First row</div>
<cngx-divider></cngx-divider>
<div>Second row</div>

<!-- Vertical inside a flex row -->
<div class="inline-row">
  <span>left</span>
  <cngx-divider orientation="vertical"></cngx-divider>
  <span>right</span>
</div>

<!-- Inset (drops the line in from the start/end edge) -->
<cngx-divider [inset]="true"></cngx-divider>
```

## Selector

Two selectors, same directive:

- `cngx-divider` as element: a dedicated separator node.
- `[cngxDivider]` as attribute: promote any structurally-empty host (`<hr>`, `<li>`, `<div>`) into a separator without adding a wrapper.

```html
<hr cngxDivider />
<li cngxDivider role="separator"></li>
```

Exported as `cngxDivider` for template references.

## Accessibility

The host is always announced as a separator. Orientation is reflected as an attribute so screen readers can place the divider on the correct axis.

| `orientation` | Host attributes |
|-|-|
| `'horizontal'` (default) | `role="separator"`, `aria-orientation="horizontal"` |
| `'vertical'` | `role="separator"`, `aria-orientation="vertical"` |

`role="separator"` is set unconditionally. Do not override it on the host - if you need a decorative line that is not a structural separator, use a plain `<div>` styled with `.cngx-divider` and skip the directive.

## Orientation and inset

Two inputs, both presentational:

| Input | Type | Default | Effect |
|-|-|-|-|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Drives `aria-orientation` and the `cngx-divider--vertical` class |
| `inset` | `boolean` | `false` | Toggles the `cngx-divider--inset` class for indented list contexts |

Host classes the directive adds:

- `.cngx-divider` - always.
- `.cngx-divider--vertical` - when `orientation === 'vertical'`.
- `.cngx-divider--inset` - when `inset` is true.

No CSS is bundled with the directive. Pull in the default look once at the app root:

```scss
@use '@cngx/themes/cngx.css';
```

That brings in `projects/common/theming/components/cngx-divider.css`, which scopes `.cngx-divider`, sizes both axes, and wires the four CSS custom properties below.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs and tokens.
- Stories: `examples/stories/common/display/divider/`.
