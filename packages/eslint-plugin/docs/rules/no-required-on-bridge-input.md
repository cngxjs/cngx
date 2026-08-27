# no-required-on-bridge-input

Disallow `input.required()` on a directive with an optional fallback token.

A bridge directive injects a fallback token (`CNGX_STATEFUL`) as `optional` and
falls back to it when no input is bound. `input.required()` on such a class
breaks that path: the template now demands a binding the fallback was supposed
to make unnecessary. Bridge inputs stay optional with an empty-string transform.

Within a bridge class every `input.required()` is flagged - the rule cannot
statically tell the bridge input from a data input, and a bridge atom's inputs
are its bridge surface by design. A class that merely injects some unrelated
optional token (a config token, an optional ancestor) is not a bridge and is
not flagged.

## Invalid

```ts
class SortBridge {
  private readonly state = inject(CNGX_STATEFUL, { optional: true });
  readonly sortRef = input.required<CngxSort>();
}
```

## Valid

```ts
class SortBridge {
  private readonly state = inject(CNGX_STATEFUL, { optional: true });
  readonly sortRef = input<CngxSort | undefined, CngxSort | '' | undefined>(undefined, {
    transform: (v) => (typeof v === 'string' ? undefined : v),
  });
}
```

## Fix

Make the input optional with a transform that coerces empty-string or undefined
to undefined.

## Options

```js
'cngx/no-required-on-bridge-input': ['error', { tokens: ['CNGX_STATEFUL', 'MY_BRIDGE_TOKEN'] }]
```

|Option|Type|Default|Meaning|
|-|-|-|-|
|`tokens`|`string[]`|`['CNGX_STATEFUL']`|Fallback token names that mark a class as a bridge.|

## Configuration

Category `wiring`. `error` in `recommended` and `all`.
