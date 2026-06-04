# Error Aggregator

Rolls one-or-more `CngxErrorSource` children into a single live A11y surface and toggles `aria-invalid` / `.cngx-error` on its host. One member of the error-coordination family alongside `CngxErrorRegistry` (the optional named-lookup root), `CngxErrorScope` (visibility gate), `CngxErrorSource` (per-condition contributor), and `CngxErrorState` (single-host marker).

## Import

```ts
import {
  CngxErrorAggregator,
  CNGX_ERROR_AGGREGATOR,
  type CngxErrorAggregatorContract,
  type CngxErrorAggregatorSourceEntry,
} from '@cngx/common/interactive';
```

## Quick start

```html
<form cngxErrorScope #scope="cngxErrorScope"
      (submit)="$event.preventDefault(); scope.reveal()">
  <fieldset cngxErrorAggregator #signup="cngxErrorAggregator">
    <legend>Sign up</legend>

    <span cngxErrorSource="email-format" [when]="emailFormatBad()"
          label="Email format invalid"></span>
    <span cngxErrorSource="email-taken"  [when]="emailTaken()"
          label="Email already in use"></span>
    <span cngxErrorSource="password-weak" [when]="passwordWeak()"
          label="Password too weak"></span>

    @if (signup.shouldShow()) {
      <ul role="list">
        @for (label of signup.errorLabels(); track label) {
          <li>{{ label }}</li>
        }
      </ul>
    }

    <span class="cngx-sr-only" aria-live="polite" aria-atomic="true">
      {{ signup.announcement() }}
    </span>

    <button type="submit">Submit</button>
  </fieldset>
</form>
```

The aggregator owns no template. Render the visible list and the live region in your own markup; the directive only exposes the signals and reflects the rolled-up state on its host.

## `CNGX_ERROR_AGGREGATOR` contract

The directive provides itself via `useExisting`, so any descendant (`CngxErrorSource`, custom directive, programmatic helper) can inject the contract without referencing the concrete class.

### `CngxErrorAggregatorContract`

| Member | Type | Notes |
|-|-|-|
| `hasError` | `Signal<boolean>` | At least one source active. |
| `errorCount` | `Signal<number>` | Active source count. |
| `activeErrors` | `Signal<readonly string[]>` | Active source keys, registration order. |
| `errorLabels` | `Signal<readonly string[]>` | Active source labels (skips null labels). |
| `shouldShow` | `Signal<boolean>` | Gated by ambient scope's `showErrors()`. |
| `announcement` | `Signal<string>` | SR-friendly joined labels, empty when hidden. |
| `addSource(entry: CngxErrorAggregatorSourceEntry)` | `void` | Idempotent on `key`. |
| `removeSource(key: string)` | `void` | No-op if absent. |

### `CngxErrorAggregatorSourceEntry`

| Field | Type | Notes |
|-|-|-|
| `key` | `string` | Unique within this aggregator. |
| `condition` | `Signal<boolean>` | Live signal the aggregator reads on every recompute. |
| `label?` | `string \| null` | Optional human-readable text included in `errorLabels()` and `announcement()`. |

## Accessibility

The directive does not render an SR live region itself - it exposes `announcement()` and lets the consumer place the region wherever the surrounding semantic context fits (next to the form, inside the dialog, at the page root). The canonical wiring:

```html
<fieldset cngxErrorAggregator #agg="cngxErrorAggregator">...</fieldset>
<span class="cngx-sr-only" aria-live="polite" aria-atomic="true">
  {{ agg.announcement() }}
</span>
```

Three properties make this safe:

- `announcement()` is `''` whenever `shouldShow()` is `false`, so a scope that has not been revealed yet stays silent.
- `errorLabels()` is structurally compared, so flipping an unrelated signal upstream does not re-emit the same labels and does not re-announce.
- The host carries `aria-invalid="true"` only when `shouldShow()` is `true`, so AT focus on the host element reflects the same reveal-state as the live region.

If the aggregator host is itself a form control (e.g. a `<fieldset>` with one input child), the `aria-invalid` host binding is announced together with the field. If the aggregator is just a layout host, the binding is still valid HTML and benign.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for the full inputs / outputs / token surface.
- Stories: `examples/stories/common/interactive/error-aggregator/`.
- `CngxErrorRegistry` - optional named-lookup root, opt-in via `provideErrorRegistry()`.
- `CngxErrorScope` - the visibility gate read via `CNGX_ERROR_SCOPE`.
- `CngxErrorSource` - the per-condition contributor that calls `addSource` / `removeSource`.
- `CngxErrorState` - single-host marker for ARIA on one element (no aggregation).
