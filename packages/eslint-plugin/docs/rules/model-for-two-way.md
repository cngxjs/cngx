# model-for-two-way

Prefer `model()` over an `input()`/`output()` pair for two-way binding.

An `input(x)` plus `output(xChange)` pair compiles and even supports the
banana-in-a-box syntax, but it is two declarations for one value and loses the
single writable-signal surface `model()` gives. The rule pairs on the declared
field names (`x` + `xChange`); alias-renamed bindings are out of scope.

## Invalid

```ts
class Pager {
  readonly page = input(0);
  readonly pageChange = output<number>();
}
```

## Valid

```ts
class Pager {
  readonly page = model(0);
}
```

## Fix

Replace the matching `input()`/`output()` pair with a single `model()`.

## Configuration

Category `wiring`. `error` in `recommended` and `all`. No options.
