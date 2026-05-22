# Tag Config

Internal configuration surface backing `CngxTag` and `CngxTagGroup`. The parent [Tag README](../README.md) covers the cascade at a usage level (priority order, the four feature factories, a typical `provideTagConfig` snippet). This file is the lookup reference: token shape, provider helper signatures, and the discriminated-union feature contract.

## Import

```ts
import {
  CNGX_TAG_CONFIG,
  provideTagConfig,
  provideTagConfigAt,
  injectTagConfig,
  withTagDefaults,
  withTagGroupDefaults,
  withTagColors,
  withTagSlots,
  type CngxTagConfig,
  type CngxTagConfigFeature,
} from '@cngx/common/display';
```

## Quick start

```ts
bootstrapApplication(AppComponent, {
  providers: [
    provideTagConfig(
      withTagDefaults({ variant: 'subtle', size: 'sm' }),
      withTagColors({
        'my-brand': {
          bg: 'var(--cngx-color-primary)',
          color: 'var(--cngx-color-on-primary)',
          border: 'transparent',
        },
      }),
    ),
  ],
});
```

## DI token

`CNGX_TAG_CONFIG` is an `InjectionToken<CngxTagConfig>` with `providedIn: 'root'` and a default factory returning the library defaults. Direct `inject(CNGX_TAG_CONFIG)` always resolves; no explicit provider is needed for the defaults case.

`CngxTagConfig` has four optional sub-trees. Every key is optional; partial overrides are deep-merged with the library defaults.

| Sub-tree | Shape | Backs |
|-|-|-|
| `defaults` | `{ variant?, color?, size?, truncate?, maxWidth? }` | `CngxTag` input fallbacks |
| `groupDefaults` | `{ gap?, align?, semanticList? }` | `CngxTagGroup` input fallbacks |
| `colors` | `Record<string, { bg; color; border }>` | Consumer palette entries, resolved through `[data-color="<key>"]` |
| `templates` | `{ label?, prefix?, suffix?, header?, accessory? }` | App-wide slot overrides (tier 2 of the slot cascade) |

The five predefined color keys (`neutral` / `success` / `warning` / `error` / `info`) ship in `tag.css` and are not part of the `colors` map. Registering one of those keys via `withTagColors` is a no-op against the predefined cascade.

## Provider helpers

| Helper | Return | Scope |
|-|-|-|
| `provideTagConfig(...features)` | `EnvironmentProviders` | App root: pass into `bootstrapApplication`'s `providers`. Deep-merges features over `CNGX_TAG_DEFAULTS`. |
| `provideTagConfigAt(...features)` | `Provider[]` | Component sub-tree: pass into `viewProviders`. Injects the parent `CNGX_TAG_CONFIG` with `skipSelf` and deep-merges, so cascades stack cumulatively. |
| `injectTagConfig()` | `CngxTagConfig` | Convenience accessor inside an injection context. Equivalent to `inject(CNGX_TAG_CONFIG)`. |

An empty-features call (`provideTagConfig()`, `provideTagConfigAt()`) short-circuits: no fresh provider entry, parent identity flows through untouched.

## Feature factories

Four factories, each writes one sub-tree of `CngxTagConfig`. Each returns a `CngxTagConfigFeature` discriminated union the reducer matches on.

| Factory | `kind` | Payload type |
|-|-|-|
| `withTagDefaults` | `'defaults'` | `NonNullable<CngxTagConfig['defaults']>` |
| `withTagGroupDefaults` | `'groupDefaults'` | `NonNullable<CngxTagConfig['groupDefaults']>` |
| `withTagColors` | `'colors'` | `NonNullable<CngxTagConfig['colors']>` |
| `withTagSlots` | `'templates'` | `NonNullable<CngxTagConfig['templates']>` |

Repeated factories of the same `kind` last-write-wins per inner key; payloads are spread-merged, so partial overrides compose cleanly.

```ts
provideTagConfig(
  withTagDefaults({ variant: 'subtle' }),
  withTagDefaults({ size: 'sm' }),
  // resolved defaults: { variant: 'subtle', size: 'sm', color: 'neutral', ... }
);
```

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for token, provider, and factory signatures.
- [`CngxTag`](../README.md): the directive whose inputs the `defaults` / `colors` / `templates` sub-trees back.
- [`CngxTagGroup`](../../tag-group/README.md): the container whose inputs the `groupDefaults` sub-tree backs.
