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
      <ul>
        @for (label of signup.errorLabels(); track label) {
          <li>{{ label }}</li>
        }
      </ul>
    }

    <button type="submit">Submit</button>
  </fieldset>
</form>
```

The visible list is yours. The live region is the directive's: it appends a visually hidden polite region to the host and writes `announcement()` into it. Do not render a second one.

## Inputs

| Input | Type | Default | Notes |
|-|-|-|-|
| `scope` | `CngxErrorScopeContract \| undefined` | `undefined` | Overrides the ancestor `CNGX_ERROR_SCOPE`. |
| `cngxErrorAggregatorName` | `string \| undefined` | `undefined` | Registers the aggregator in `CngxErrorRegistry` under this name. |
| `autoAnnounce` | `boolean` | `true` | `false` removes the directive's live region; you own the announcement. |
| `announcePoliteness` | `'polite' \| 'assertive' \| 'off'` | `'polite'` | A change replaces the region; `'off'` renders it without `role`. |
| `errorCountAnnouncement` | `((count: number) => string) \| undefined` | `undefined` | Text when no active source has a label. Falls back to `CNGX_INTERACTIVE_I18N` (`1 error` / `2 errors`). |

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
| `announcement` | `Signal<string>` | Joined labels, or the count message when no active source has a label; empty when hidden. |
| `addSource(entry: CngxErrorAggregatorSourceEntry)` | `void` | Last wins on `key`; the replaced source stays listed (CNGX1020). |
| `removeSource(key: string, entry?: CngxErrorAggregatorSourceEntry)` | `void` | No-op if absent. With `entry` only that source leaves and a replaced one takes the key back. |

### `CngxErrorAggregatorSourceEntry`

| Field | Type | Notes |
|-|-|-|
| `key` | `string` | Unique within this aggregator. |
| `condition` | `Signal<boolean>` | Live signal the aggregator reads on every recompute. |
| `label?` | `string \| null` | Optional human-readable text included in `errorLabels()` and `announcement()`. |

## Accessibility

Each aggregator speaks through one region. By default that is the directive's own: a visually hidden `role="status"` / `aria-live="polite"` span inside the host, filled from `announcement()`.

- `announcement()` is `''` whenever `shouldShow()` is `false`, so a scope that has not been revealed yet stays silent.
- Active sources without a label still speak: the count message (`1 error`, `2 errors`) from `errorCountAnnouncement` or `CNGX_INTERACTIVE_I18N`. With at least one label, the labels are spoken.
- Every `reveal()` of the scope speaks the errors again, even when they did not change: the region is emptied and written after render.
- A language flip does not re-speak a shown announcement; the next error change speaks the new copy.
- The host carries `aria-invalid="true"` only when `shouldShow()` is `true`, so AT focus on the host element reflects the same reveal-state as the live region.

To place the region yourself (next to the form, at the page root, through `LiveAnnouncer`), switch the directive's off:

```html
<fieldset cngxErrorAggregator [autoAnnounce]="false" #agg="cngxErrorAggregator">...</fieldset>
<span class="cngx-sr-only" aria-live="polite" aria-atomic="true">
  {{ agg.announcement() }}
</span>
```

A consumer region does not get the re-voice on `reveal()` for free; read the scope's `revealEpoch` for that.

If the aggregator host is itself a form control (e.g. a `<fieldset>` with one input child), the `aria-invalid` host binding is announced together with the field. If the aggregator is just a layout host, the binding is still valid HTML and benign.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/main/common/interactive/error-aggregator/) for the full inputs / outputs / token surface.
- Stories: `examples/stories/common/interactive/error-aggregator/`.
- `CngxErrorRegistry` - optional named-lookup root, opt-in via `provideErrorRegistry()`.
- `CngxErrorScope` - the visibility gate read via `CNGX_ERROR_SCOPE`.
- `CngxErrorSource` - the per-condition contributor that calls `addSource` / `removeSource`.
- `CngxErrorState` - single-host marker for ARIA on one element (no aggregation).
