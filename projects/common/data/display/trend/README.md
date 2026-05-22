# Trend

Display atom for a single directional percentage. Renders an arrow glyph (`↑` up, `↓` down, `→` flat) plus a signed value (`+5.3 %`, `-2.1 %`). Direction class toggles `cngx-trend--up` / `cngx-trend--down` for color coding. The arrow is `aria-hidden`; the announcement comes from the host `aria-label`, which the consumer can override when generic phrasing is not enough. Pure presentation. The component never owns the value, never derives it, and has no opinion on what "trend" means in your domain.

## Import

```ts
import { CngxTrend } from '@cngx/common/data';
```

## Quick start

```html
<!-- Positive: up arrow, success color, "+5.3 % up" -->
<cngx-trend [value]="5.3" />

<!-- Negative: down arrow, danger color, "-2.1 % down" -->
<cngx-trend [value]="-2.1" />

<!-- Flat: right arrow, neutral color, "0.0 % unchanged" -->
<cngx-trend [value]="0" />

<!-- Consumer-supplied label when the surrounding context is non-obvious -->
<cngx-trend [value]="5.3" label="Revenue up 5.3 percent versus last quarter" />
```

## Accessibility

| Direction | Host class | Default `aria-label` |
|-|-|-|
| `value > 0` | `cngx-trend--up` | `"+<value> % up"` |
| `value < 0` | `cngx-trend--down` | `"<value> % down"` |
| `value === 0` | (no modifier) | `"0.0 % unchanged"` |

The `↑↓→` glyph is decorative (`aria-hidden="true"`). All semantic content lives in the `aria-label`. Color is never the sole carrier of meaning: the direction word (`up` / `down` / `unchanged`) is in every default label, and the glyph encodes it visually for sighted users.

Set a custom `label` whenever the trend's frame of reference is not obvious from the surrounding markup. The default phrase is good enough only when adjacent text (a card header, a column heading) tells the user what changed against what.

## Composition

Pairs naturally with `CngxMetric` inside a card header for "value plus directional indicator" patterns.

```html
<cngx-card>
  <header cngxCardHeader>
    <span>Revenue</span>
    <cngx-trend [value]="revenue().trend" label="Up 12.5 percent vs. last month" />
  </header>
  <div cngxCardBody>
    <cngx-metric
      [value]="revenue().amount"
      [format]="{ style: 'currency', currency: 'USD' }"
    />
  </div>
</cngx-card>
```

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for inputs and tokens.
- Stories: `examples/stories/common/data/trend/`.
- `CngxMetric` for the formatted-figure counterpart.
- `--cngx-color-success` / `--cngx-color-danger` foundation tokens drive the up / down colors by default.
