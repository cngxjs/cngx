# Error Source

Marks the host element as a single error condition that the nearest `CngxErrorAggregator` ancestor collects. Pure DI propagation, no DOM output, no-op when no aggregator is in scope. Within the error family this is the leaf: the registry holds the root, aggregators group leaves, scopes form reveal boundaries, sources (this) report conditions. `CngxErrorState` is a separate single-host marker; it does not render collected state.

## Import

```ts
import { CngxErrorSource } from '@cngx/common/interactive';
```

## Quick start

```html
<fieldset cngxErrorAggregator>
  <span cngxErrorSource="email-format"
        [when]="email().invalid()"
        label="Email format invalid"></span>
  <span cngxErrorSource="email-taken"
        [when]="serverErr() === 'taken'"
        label="Email already in use"></span>
</fieldset>
```

The directive registers each source on construction and unregisters on destroy; a key or label change re-registers it. Bind a signal-derived boolean to `[when]`; the aggregator subscribes to that signal and recomputes on change.

Keys are unique per aggregator. A second source with a taken key replaces the first (last wins, dev mode warns [`CNGX1020`](../../../../core-concepts/error-codes/cngx1020.md)); the first stays listed and takes the key back when the second is destroyed.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/main/common/interactive/error-source/) for the full contract.
- `CngxErrorAggregator` - collects sources, exposes the aggregated state.
- `CngxErrorRegistry` - root coordinator across aggregators and scopes.
- `CngxErrorScope` - reveal boundary (submit, navigate, manual).
- `CngxErrorState` - single-host ARIA marker; does not read sources.
