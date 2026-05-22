# Tabs Overflow

Headless surface for the "tabs do not fit" problem. This folder ships no molecule. The molecule (`<cngx-tab-overflow>`) lives in `@cngx/ui/tabs`. What lives here are the contracts that molecule consumes: a DOM-resolution adapter that lets the same molecule key into a cngx-native strip or a Material `<mat-tab-group>` interchangeably, a bounded retry loop for "anchor the IntersectionObserver as soon as the strip exists", a template cascade for the More-button and per-row slot, and the two `ng-template` directives that drive it.

## Import

```ts
import {
  CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY,
  CNGX_DOM_ANCHOR_RETRY_FACTORY,
  CNGX_OVERFLOW_POPOVER_HIGHLIGHT_FACTORY,
  CngxTabOverflowTrigger,
  CngxTabOverflowItem,
  createTabOverflowTemplateBindings,
  tabOverflowOptionId,
} from '@cngx/common/tabs';
```

All overflow exports live on the `@cngx/common/tabs` entry. There is no `@cngx/common/tabs/overflow` secondary.

## Quick start

Replace the default More-button text and per-row body via the two slot directives. The library owns the button shell, ARIA, popover plumbing; the template owns content.

```html
<cngx-tab-overflow>
  <ng-template cngxTabOverflowTrigger let-count>
    <cngx-icon><mat-icon>more_horiz</mat-icon></cngx-icon>
    +{{ count }}
  </ng-template>

  <ng-template cngxTabOverflowItem let-tab let-disabled="disabled">
    <cngx-icon><mat-icon>{{ tab.icon ?? 'tab' }}</mat-icon></cngx-icon>
    <span [class.is-muted]="disabled">{{ tab.label() }}</span>
  </ng-template>
</cngx-tab-overflow>
```

To set the same defaults app-wide, skip the per-instance directive and feed `CNGX_TABS_CONFIG`:

```ts
provideCngxTabs(
  withTabOverflowTriggerTemplate(triggerTpl),
  withTabOverflowItemTemplate(itemTpl),
)
```

The cascade resolves per-instance directive first, then `CNGX_TABS_CONFIG.templates`, then the built-in `i18n.moreTabsLabel(count)` / `tab.label() ?? tab.id` text.

## Strategy contract: DOM adapter

The molecule is variant-agnostic. It does not know whether it is wrapping a cngx-native `<cngx-tab-group>` or a Material `<mat-tab-group>`. It asks the injected adapter for the IntersectionObserver root and for the DOM button matching a given tab handle. Override `CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY` to support a custom skin.

| Method | Returns | Notes |
|-|-|-|
| `resolveStripRoot(panelHost, host)` | `HTMLElement \| null` | The scroll viewport the IO observes. `null` triggers a one-frame retry via `CNGX_DOM_ANCHOR_RETRY_FACTORY`. |
| `resolveTabButton(handle, root, idx)` | `HTMLElement \| null` | cngx-native keys by `[id="${handle.id}-header"]`; Material keys positionally because handle ids never reach the rendered DOM. |

```ts
// Custom skin adapter
providers: [
  {
    provide: CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY,
    useValue: () => ({
      resolveStripRoot: (_, host) => host.closest('.my-skin__viewport'),
      resolveTabButton: (handle, root) =>
        root.querySelector(`[data-tab-id="${handle.id}"]`),
    }),
  },
]
```

## Strategy contract: anchor retry

The strip is queried by `closest()` from the molecule host. On first render the wrapper may not be in the DOM yet (animations, deferred views, MDC ripple init). `createDomAnchorRetry` is a bounded rAF loop with one shared attempt counter and one cancellation closure, used by both `<cngx-tab-overflow>` (rAF) and the Material header-anchor path (`afterNextRender`).

| Field | Type | Notes |
|-|-|-|
| `attempt` | `() => true \| false \| null` | `true` halts; `false`/`null` schedules another tick. |
| `maxAttempts` | `number` | First synchronous call counts as attempt #1. |
| `schedule` | `(cb) => () => void` | Plug in rAF, `afterNextRender`, `setTimeout`, microtask. Returns a cancel closure. |
| `onGiveUp` | `() => void` | Fires once after the cap. Hook telemetry here. |

Override `CNGX_DOM_ANCHOR_RETRY_FACTORY` for retry-with-backoff or to surface give-up events to a logger.

## Strategy contract: popover highlight sync

`createOverflowPopoverHighlightSync(popover, ad)` resets `CngxActiveDescendant`'s highlight whenever the More popover closes. Without it, a keyboard session leaves a stale `activeIndex` that bleeds into the next open. Override `CNGX_OVERFLOW_POPOVER_HIGHLIGHT_FACTORY` for last-index preservation or custom rules. Runs in injection context only.

## Slot directives

Two structural slots, both with the same 3-stage cascade (per-instance > `CNGX_TABS_CONFIG.templates` > built-in):

| Directive | Selector | Replaces |
|-|-|-|
| `CngxTabOverflowTrigger` | `ng-template[cngxTabOverflowTrigger]` | Default `i18n.moreTabsLabel(count)` on the More button. |
| `CngxTabOverflowItem` | `ng-template[cngxTabOverflowItem]` | Default `tab.label() ?? tab.id` text inside each popover row. |

The trigger context exposes `count` and `hiddenTabs`. The item context exposes the `tab` handle, an `index`, a pre-resolved `disabled` flag, and a `pick()` commit-aware callback. Both contexts ship the value on `$implicit` so `let-count` / `let-tab` shorthand works.

## Template cascade helper

`createTabOverflowTemplateBindings(...)` is the pure factory the molecule calls to wire its `contentChild()` queries against the resolved config and produce: the two `TemplateRef` signals, a stable `triggerContext` (structural-equal so `ngTemplateOutlet` does not rebind on shape-stable IO emissions), a per-row context builder with WeakMap caching, and an `adItems` projection for `CngxActiveDescendant`. No DI, no destroy hooks, safe to call from field-init.

`tabOverflowOptionId(tab)` returns the stable `<li>` id (`${tab.id}-overflow-option`) that `aria-activedescendant` points at. Use it from custom rows if you replace the entire row shell.

## See also

- [API on compodocx](https://cngxjs.github.io/cngx/) for token signatures, context interfaces, and cascade resolution order.
- `@cngx/common/tabs`: the parent entry, presenter directive, host tokens, configuration cascade.
- `@cngx/ui/tabs`: ships the `<cngx-tab-overflow>` molecule and the cngx-native skin.
- `@cngx/ui/mat-tabs`: `createCngxMatTabOverflowDomAdapter()` keys the same molecule into a Material `<mat-tab-group>`.
- Stories: `examples/stories/common/tabs/overflow/`.
