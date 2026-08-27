# no-effect-in-ngoninit

Disallow `effect()` inside `ngOnInit`.

`effect()` needs an injection context. `ngOnInit` is not one, so the call throws
NG0203 at runtime. The rule flags `effect(...)` inside both the method form and
the arrow-field form of the lifecycle hook.

## Invalid

```ts
@Component({ /* ... */ })
class Panel {
  ngOnInit() {
    effect(() => this.sync());
  }
}
```

## Valid

```ts
@Component({ /* ... */ })
class Panel {
  constructor() {
    effect(() => this.sync());
  }
}
```

## Fix

Move the `effect()` call into the constructor or a field initializer - both run
in an injection context.

## Configuration

Category `signal-hygiene`. `error` in `recommended` and `all`. No options.
