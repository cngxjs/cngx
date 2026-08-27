# untracked-in-effect

Wrap service and side-effect calls inside `effect()` in `untracked()`.

A `this`-rooted call inside an `effect()` callback subscribes the effect to
every signal the callee reads - including a service's internal dedup and queue
signals. The effect then re-fires on the callee's own state changes: a reactive
loop that can freeze the tab. Wrapping the call in `untracked()` keeps the
effect subscribed only to what it reads directly.

This rule is advisory and ships opt-in (`all` at `warn`, off in `recommended`):
a signal read and a service call are statically indistinguishable, so it narrows
rather than proves. It skips the `CngxAsyncContainer` exception, anything under
a `cngx-allow-effect-writes` comment marker, and single-level zero-argument
reads of fields the class declares with a signal factory (`signal`, `computed`,
`input`, `model`, `linkedSignal`, the queries).

## Invalid

```ts
class Panel {
  constructor() {
    effect(() => {
      const status = this.status();
      this.toaster.show(status); // subscribes the effect to the toaster's internals
    });
  }
}
```

## Valid

```ts
class Panel {
  constructor() {
    effect(() => {
      const status = this.status();
      untracked(() => this.toaster.show(status));
    });
  }
}
```

## Fix

Wrap the call in `untracked(() => ...)`.

## Configuration

Category `opt-in`. Off in `recommended`, `warn` in `all`. No options.
