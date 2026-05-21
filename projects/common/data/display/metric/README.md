# Metric

Display atom for a single formatted numeric figure plus an optional unit. Wraps `Intl.NumberFormat` against the injected `LOCALE_ID` so values render in the user's locale without per-component plumbing. `null` collapses to an em-dash placeholder; strings pass through unformatted for "N/A" rows. No state ownership, no async lifecycle, no business logic. It renders a number, period.

## Import

```ts
import { CngxMetric } from '@cngx/common/data';
```

## Quick start

```html
<!-- Locale-formatted integer with unit -->
<cngx-metric [value]="1234" unit="bpm" />

<!-- One decimal, percentage suffix -->
<cngx-metric [value]="99.6" unit="%" [format]="{ maximumFractionDigits: 1 }" />

<!-- Currency via Intl.NumberFormat options -->
<cngx-metric [value]="250000" [format]="{ style: 'currency', currency: 'USD' }" />

<!-- Missing value renders as em-dash -->
<cngx-metric [value]="null" unit="bpm" />

<!-- String passes through verbatim -->
<cngx-metric [value]="'N/A'" />
```

## Inputs

| Input | Type | Notes |
|-|-|-|
| `value` | `number \| string \| null` (required) | `null` renders the `U+2014` placeholder glyph. Strings are not reformatted. Numbers run through `Intl.NumberFormat`. |
| `unit` | `string \| undefined` | Optional suffix slot. Hidden when empty. |
| `format` | `Intl.NumberFormatOptions \| undefined` | Forwarded to `Intl.NumberFormat`. When omitted, falls back to `value.toLocaleString(LOCALE_ID)`. |

## Accessibility

The host carries the full announcement; the two inner spans (`.cngx-metric__value`, `.cngx-metric__unit`) stay visually distinct without needing their own ARIA.

| Inputs | Host attribute |
|-|-|
| `unit` set | `aria-label="<formattedValue> <unit>"` (e.g. `"1,234 bpm"`) |
| `unit` unset | `aria-label="<formattedValue>"` |
| `value = null` | `aria-label` carries the `U+2014` placeholder glyph |

If the metric sits next to its own visible heading (`<header cngxCardHeader>Heart Rate</header>` then `<cngx-metric ...>`), AT reads heading + metric naturally. Wrapping the metric in an explicit `aria-label` on a parent is only needed when the surrounding markup does not already name it.

## Locale behaviour

Formatting is driven by Angular's `LOCALE_ID`. Override globally:

```ts
bootstrapApplication(App, {
  providers: [{ provide: LOCALE_ID, useValue: 'de-AT' }],
});
```

Or per-instance, by reaching past `LOCALE_ID` with explicit `format` options that pin the locale on the consumer side. The component does not expose a per-instance locale input on purpose: one app, one number format.

## Composition

Stays neutral inside any card variant, header, or grid cell. Pair with `CngxTrend` for "value plus directional indicator" patterns.

```html
<cngx-card>
  <header cngxCardHeader>
    <span>Revenue</span>
    <cngx-trend [value]="revenue().trend" />
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
- Stories: `examples/stories/common/data/metric/`.
- `CngxTrend` for the directional-change counterpart.
- `CngxCard` (`@cngx/common/card`) as the typical container.
