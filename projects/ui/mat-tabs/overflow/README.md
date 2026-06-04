# Mat Tabs Overflow

Material-side DOM adapter that wires `@cngx/common/tabs/overflow` to a `<mat-tab-group>`. The overflow molecule itself is variant-agnostic; this adapter teaches it where Material's scroll viewport lives and how to look up the rendered `.mat-mdc-tab` button by registration index. Material owns the DOM, so handle ids never reach the buttons - the adapter keys positionally instead.

## Import

```ts
import { createCngxMatTabOverflowDomAdapter } from '@cngx/ui/mat-tabs';
```

## Quick start

`[cngxMatTabs]` already provides this adapter on its own directive - consumers do not wire it. Use it directly only when building a custom directive on top of Material's tab header.

```ts
import { Directive } from '@angular/core';
import { CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY } from '@cngx/common/tabs';
import { createCngxMatTabOverflowDomAdapter } from '@cngx/ui/mat-tabs';

@Directive({
  selector: 'mat-tab-group[myTabs]',
  providers: [
    {
      provide: CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY,
      useValue: createCngxMatTabOverflowDomAdapter,
    },
  ],
})
export class MyTabs {}
```

## Resolution contract

| Hook | Returns | Lookup |
|-|-|-|
| `resolveStripRoot` | `.mat-mdc-tab-label-container` | walks `host.closest('mat-tab-header')`, then queries the label container via any rendered `.mat-mdc-tab` descendant |
| `resolveTabButton` | `.mat-mdc-tab` at index `idx` | positional `querySelectorAll(...).item(idx)` against `presenter.tabs()` registration order |

`resolveStripRoot` returning `null` is a retry signal - the molecule's rAF loop polls again next frame and succeeds once `MatTabHeader` has committed its DOM. Selectors come from `MaterialPrivateSurfaces` so any future Material rename stays a one-file change.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for the full surface.
- `@cngx/common/tabs/overflow` - the underlying overflow molecule and its `CngxTabOverflowDomAdapter` contract.
- `@cngx/ui/mat-tabs` - the `[cngxMatTabs]` directive that ships this adapter by default.
