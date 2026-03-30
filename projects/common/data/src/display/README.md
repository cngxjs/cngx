# Display — Metric & Trend

Display-only components for metrics (formatted numbers) and trends (percentage change). Composable — work inside cards, dashboards, or standalone.

## Import

```typescript
import {
  CngxMetric,
  CngxTrend,
} from '@cngx/common/data';
```

## CngxMetric — Formatted Numeric Display

Displays a numeric value with optional unit suffix. Uses `Intl.NumberFormat` for locale-aware formatting. Null values render as em-dash.

### Selector

```html
<cngx-metric />
```

### Inputs

| Input | Type | Default | Description |
|-|-|-|-|
| `value` | `number \| string \| null` | **Required** | Numeric or string value. `null` renders as em-dash (—). |
| `unit` | `string \| undefined` | `undefined` | Unit suffix (e.g., "bpm", "h", "%", "kg"). |
| `format` | `Intl.NumberFormatOptions \| undefined` | `undefined` | `Intl.NumberFormat` options for the numeric value. |

### Example

```html
<!-- Basic -->
<cngx-metric [value]="1234" unit="bpm" />
<!-- Renders: "1,234 bpm" (locale-dependent) -->

<!-- With format options -->
<cngx-metric
  [value]="99.6"
  unit="%"
  [format]="{ maximumFractionDigits: 1 }"
/>
<!-- Renders: "99.6 %" -->

<!-- Null value -->
<cngx-metric [value]="null" unit="bpm" />
<!-- Renders: "—" -->

<!-- String value (no formatting) -->
<cngx-metric [value]="'N/A'" />
<!-- Renders: "N/A" -->
```

### Inside a Card

```html
<cngx-card>
  <header cngxCardHeader>
    <span>Heart Rate</span>
  </header>
  <div cngxCardBody>
    <cngx-metric [value]="heartRate()" unit="bpm" />
  </div>
</cngx-card>
```

### Accessibility

- `aria-label` automatically set to `"<formattedValue> <unit>"` (e.g., "1,234 bpm")
- For string values without units, `aria-label` is the string itself
- `role` is implicit (span) — no explicit role required

### CSS Classes

- `.cngx-metric` — host element
- `.cngx-metric__value` — the formatted numeric span
- `.cngx-metric__unit` — the unit suffix span (conditional)

### Styling

All sizing and spacing via CSS. No CSS custom properties — inherit from parent.

```scss
.cngx-metric {
  display: inline-flex;
  align-items: baseline;
  gap: 0.25em; // between value and unit
}

.cngx-metric__value {
  font-weight: 600;
}

.cngx-metric__unit {
  font-size: 0.875em;
  opacity: 0.7;
}
```

## CngxTrend — Trend Indicator

Displays a trend percentage with directional arrow (↑ positive, ↓ negative, → flat). Consumer can override the SR label for full context.

### Selector

```html
<cngx-trend />
```

### Inputs

| Input | Type | Required | Description |
|-|-|-|-|
| `value` | `number` | Yes | Trend percentage. Positive = up, negative = down, zero = flat. |
| `label` | `string \| undefined` | No | Consumer-provided SR label override. When set, replaces the generated default (e.g., "Revenue increased 5.3% vs. last quarter"). |

### Example

```html
<!-- Basic -->
<cngx-trend [value]="5.3" />
<!-- Renders: "↑ +5.3 %" with SR: "+5.3 % up" -->

<!-- Negative -->
<cngx-trend [value]="-2.1" />
<!-- Renders: "↓ -2.1 %" with SR: "-2.1 % down" -->

<!-- Flat -->
<cngx-trend [value]="0" />
<!-- Renders: "→ 0.0 %" with SR: "0.0 % unchanged" -->

<!-- Custom label -->
<cngx-trend
  [value]="5.3"
  label="Revenue up 5.3% vs. last quarter"
/>
<!-- Renders: "↑ +5.3 %" with SR: "Revenue up 5.3% vs. last quarter" -->
```

### Inside a Card Header

```html
<cngx-card>
  <header cngxCardHeader>
    <span>Revenue</span>
    <cngx-trend [value]="revenue().trend" />
  </header>
</cngx-card>
```

### Accessibility

- `aria-label` set to generated default or custom label (always present)
- Arrow (↑↓→) marked with `aria-hidden="true"` (visual only)
- Screen readers announce: `"+5.3 % up"` (default) or custom label

### CSS Classes

- `.cngx-trend` — host element
- `.cngx-trend--up` — applied when value > 0
- `.cngx-trend--down` — applied when value < 0

### Styling

```scss
.cngx-trend {
  display: inline-flex;
  align-items: center;
  gap: 0.25em;

  &--up { color: var(--color-success, #10b981); }
  &--down { color: var(--color-danger, #ef4444); }
  // (flat has no special color)
}
```

## Composition Examples

### Health Dashboard

```typescript
@Component({
  selector: 'app-health-dashboard',
  template: `
    <div class="metrics-grid">
      <cngx-card>
        <header cngxCardHeader>
          <span>Heart Rate</span>
          <cngx-trend [value]="metrics().heartRateTrend" />
        </header>
        <div cngxCardBody>
          <cngx-metric [value]="metrics().heartRate" unit="bpm" />
          <p class="text-secondary">Current</p>
        </div>
      </cngx-card>

      <cngx-card>
        <header cngxCardHeader>
          <span>Body Weight</span>
          <cngx-trend [value]="metrics().weightTrend" />
        </header>
        <div cngxCardBody>
          <cngx-metric
            [value]="metrics().weight"
            unit="kg"
            [format]="{ maximumFractionDigits: 1 }"
          />
          <p class="text-secondary">vs. last week</p>
        </div>
      </cngx-card>

      <cngx-card>
        <header cngxCardHeader>
          <span>Sleep</span>
          <cngx-trend [value]="metrics().sleepTrend" />
        </header>
        <div cngxCardBody>
          <cngx-metric
            [value]="metrics().sleep"
            unit="h"
            [format]="{ maximumFractionDigits: 1 }"
          />
          <p class="text-secondary">Average last night</p>
        </div>
      </cngx-card>
    </div>
  `,
  imports: [CngxCard, CngxCardHeader, CngxCardBody, CngxMetric, CngxTrend],
})
export class HealthDashboardComponent {
  readonly metrics = signal({
    heartRate: 72,
    heartRateTrend: 2.5,
    weight: 75.3,
    weightTrend: -1.2,
    sleep: 7.5,
    sleepTrend: 0.5,
  });
}
```

### Financial Summary

```html
<div class="summary-grid">
  <div class="summary-item">
    <span class="label">Revenue</span>
    <cngx-metric [value]="250000" [format]="{ style: 'currency', currency: 'USD' }" />
    <cngx-trend
      [value]="12.5"
      label="Up 12.5% vs. last month"
    />
  </div>

  <div class="summary-item">
    <span class="label">Expenses</span>
    <cngx-metric [value]="150000" [format]="{ style: 'currency', currency: 'USD' }" />
    <cngx-trend
      [value]="-5.2"
      label="Down 5.2% vs. last month"
    />
  </div>

  <div class="summary-item">
    <span class="label">Margin</span>
    <cngx-metric [value]="40" unit="%" />
    <cngx-trend
      [value]="3.1"
      label="Up 3.1 percentage points vs. last month"
    />
  </div>
</div>
```

## Type Inference

Both components are fully typed — no casting needed:

```typescript
readonly metrics = signal<MetricsDto>({
  heartRate: 72,
  trend: 2.5,
});

// TypeScript infers types correctly
<cngx-metric [value]="metrics().heartRate" /> // number
<cngx-trend [value]="metrics().trend" /> // number
```

## Accessibility Guidelines

### For Metric

- Always provide a unit or use a string value that's self-explanatory
- Use `format` to control decimal places — no truncation or rounding on display
- Consider context: if used in a card with a label, the label provides context for SR users

```html
<!-- Good: label + metric + unit together -->
<header cngxCardHeader>Heart Rate</header>
<cngx-metric [value]="72" unit="bpm" />
<!-- SR: "Heart Rate" (from header) + "72 bpm" (from aria-label) -->

<!-- Also good: explicit label -->
<div [attr.aria-label]="'Heart Rate: ' + metrics().heartRate + ' bpm'">
  <cngx-metric [value]="metrics().heartRate" unit="bpm" />
</div>
```

### For Trend

- Always provide custom `label` if context is non-obvious
- Arrow symbols are hidden with `aria-hidden` — direction communicated via label
- Avoid using color alone to communicate direction (must have text)

```html
<!-- Good: color + symbol + label -->
<cngx-trend
  [value]="5.3"
  label="Revenue increased 5.3% vs. last quarter"
/>

<!-- Also good: default generated label works when context is clear -->
<cngx-trend [value]="5.3" />
<!-- Generated label: "+5.3 % up" -->
```

## See Also

- [CngxCard](../../card/README.md) — container for metrics
- [CngxMetric / CngxTrend in Compodoc](../../README.md) — full API reference
- Compodoc: Full API reference at `/docs`
