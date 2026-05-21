# Error Source

Marks the host element as a single error condition that the nearest `CngxErrorAggregator` ancestor collects. Pure DI propagation, no DOM output, no-op when no aggregator is in scope. Within the error family this is the leaf: the registry holds the root, aggregators group leaves, scopes form reveal boundaries, sources (this) report conditions, and `CngxErrorState` renders them.

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

The directive registers each source on construction and unregisters on destroy. Bind a signal-derived boolean to `[when]`; the aggregator subscribes to that signal and recomputes on change.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for the full contract.
- `CngxErrorAggregator` - collects sources, exposes the aggregated state.
- `CngxErrorRegistry` - root coordinator across aggregators and scopes.
- `CngxErrorScope` - reveal boundary (submit, navigate, manual).
- `CngxErrorState` - presentation atom that renders the collected state.
