# @cngx/common/timeline

Headless timeline core. This entry ships everything `<cngx-timeline>` composes but does not own: the grouping presenter, the row atoms (item, marker, connector), the projection and template slot directives, the marker-host DI contract, and the label/template config cascade. Reach for it directly when a row should render standalone without the organism, when an app-wide override (bucketing, marker template, labels) has to be provided, or when an ejected skin needs the brain without the styled component. For the styled, async-state-driven feed, use [`@cngx/ui/timeline`](../../ui/timeline/) - that README covers grouping modes, layout, skins and the body switch.

## Import

```typescript
import {
  CngxTimelineItem,
  CngxTimelineTime,
  createTimelineGrouping,
  provideTimelineConfig,
} from '@cngx/common/timeline';
```

## Quick Start

A row is a terminal composable unit, not a fragment of the organism. It ships its own token SET rules, so it renders complete and density-correct with no `<cngx-timeline>` above it:

```typescript
import { Component } from '@angular/core';
import { CngxTimelineItem, CngxTimelineTime } from '@cngx/common/timeline';
import { CngxTime } from '@cngx/common/display';

@Component({
  selector: 'app-example',
  template: `
    <cngx-timeline-item status="done" position="last">
      <cngx-time cngxTimelineTime [date]="deployedAt" />
      <p>Deployment finished</p>
    </cngx-timeline-item>
  `,
  imports: [CngxTimelineItem, CngxTimelineTime, CngxTime],
})
export class ExampleComponent {
  protected readonly deployedAt = new Date();
}
```

## Grouping presenter

`createTimelineGrouping` derives sorted date bands from a flat list. Pure derivation over one `linkedSignal`; nothing is synced, the input array is never mutated.

```typescript
const grouping = createTimelineGrouping({
  items: this.events,                       // () => readonly T[]
  dateAccessor: (event) => event.occurredAt, // Date | string | number
  groupBy: () => 'day',                     // 'day' | 'week' | 'month' | 'none' | TimelineGroupingFn<T>
  direction: () => 'desc',                  // 'asc' | 'desc'
});
grouping.groups(); // Signal<readonly TimelineGroup<T>[]>
```

Every reactive knob is a zero-arg accessor, so a `Signal` or `input()` passes directly. Three properties make it the organism's only data path:

- **Defensive stable sort.** Input order is irrelevant; items sharing a timestamp keep their input order in both directions.
- **Local-calendar bucketing.** `day` / `week` / `month` read local date fields, so 23- and 25-hour DST days group as one day. Weeks start Monday. UTC or fiscal rules go through a `TimelineGroupingFn<T>` returning `{ key, start }`.
- **Append-stability.** Bands whose items are the same object references hand back the same band reference, keyed on identity rather than id - a refetch returns new objects and must not pin a band to a stale payload.

A `TimelineGroup<T>` carries `key` (stable, doubles as `@for` track and `aria-labelledby` seed), `start` (local bucket start) and `items`. It carries no label; formatting is a locale concern owned by the header slot or `labels.groupLabel`.

`CNGX_TIMELINE_GROUPING_FACTORY` resolves the presenter the organism builds bands with (type `CngxTimelineGroupingFactory`, defaults to `createTimelineGrouping`). Override at root for app-wide bucketing rules, or in `viewProviders` for one component. Wrap rather than replace: call `createTimelineGrouping` inside the override and post-process its `groups`.

## Row atoms

### CngxTimelineItem

One event: marker, rail segment, optional timestamp, projected body. Two independent state channels that compose - `status` is editorial (where the event sits in the history), `state` is whether this row's own data is in flight or failed. A failed row paints `rejected` and announces the failure without discarding the editorial status it returns to after a retry.

|Input|Type|Default|Description|
|-|-|-|-|
|`status`|`TimelineStatus \| undefined`|`undefined`|`'done' \| 'active' \| 'upcoming' \| 'rejected'`. Drives marker/rail colour and the SR status line|
|`state`|`CngxAsyncState<unknown> \| undefined`|`undefined`|This row's own async state; sets `aria-busy`, repaints as rejected on error|
|`position`|`TimelineConnectorPosition`|`'middle'`|Forwarded to the rail; `'last'` / `'only'` stop it|
|`item`|`unknown`|`undefined`|Payload handed to an app-wide `*cngxTimelineMarkerTpl` as `$implicit`|

The `TimelineStatus` vocabulary is deliberately narrow: it describes a history, not what the user may do. A timeline needing `disabled` or `current` is a stepper - see `@cngx/common/stepper`.

### CngxTimelineMarker and CngxTimelineConnector

Both usable standalone, both decorative and `aria-hidden` - the owning item carries the semantics.

|Component|Inputs|Notes|
|-|-|-|
|`<cngx-timeline-marker>`|`status`, `busy`|Status-coloured dot; projects a glyph, icon or avatar. `busy` pulses via `box-shadow` (no box change, suppressed under reduced motion)|
|`<cngx-timeline-connector>`|`status`, `position`|Rail segment. `upcoming` dashed, `rejected` danger-toned; `position: 'first' \| 'middle' \| 'last' \| 'only'` clips the ends, `'only'` renders nothing. Logical properties throughout, so RTL needs no override|

### Projection slots on the row

|Directive|Placement|
|-|-|
|`[cngxTimelineTime]`|Timestamp; positioned by the active mode raster. Pair with `<cngx-time>` from `@cngx/common/display`|
|`[cngxTimelineOpposite]`|Far side of the rail from the body. Keep it non-interactive - it projects ahead of the body, and dev mode warns on focusable content|
|`[cngxTimelineMarkerContent]`|Inside the marker dot; wins over the timeline-wide `*cngxTimelineMarkerTpl` (most-local-wins)|
|`[cngxTimelineContent]`|Explicit body marker; unslotted content lands in the body anyway|

## Template slots

Eight structural directives, consumed by the organism through the three-stage cascade: per-instance directive, then `CngxTimelineConfig.templates`, then built-in markup.

|Directive|Context|Config key|
|-|-|-|
|`CngxTimelineItemTpl` (`*cngxTimelineItem`)|`$implicit: T`, `index`, `first`, `last`, `group` (per group, not per timeline)|`item`|
|`CngxTimelineDateHeader`|`$implicit: TimelineGroup<T>`|`dateHeader`|
|`CngxTimelineMarkerTpl`|`$implicit: T`, `status`|`marker`|
|`CngxTimelineEmpty`|`$implicit: EmptyReason`|`empty`|
|`CngxTimelineError`|`$implicit: unknown`, `retry`|`error`|
|`CngxTimelineRetryButton`|`$implicit: () => void`|`retryButton`|
|`CngxTimelineLoadingTail`|none|`loadingTail`|
|`CngxTimelineSkeleton`|none|`skeleton`|

The three generic slots carry a type-pinning input: bind the same array the timeline renders (`[cngxTimelineItem]="events()"`) and the `let-` variables come out typed. The binding is never read at runtime - it is the `ngForOf` mechanism, and leaving it off falls back to `unknown`. The class is `CngxTimelineItemTpl` so it does not collide with the `CngxTimelineItem` component; the selector consumers write stays `cngxTimelineItem`.

## Marker host token

`CNGX_TIMELINE_MARKER_HOST` is how a row reaches the timeline-wide marker template. The organism is data-driven - the consumer writes `<cngx-timeline-item>` inside the row template themselves, so the organism has no handle on the marker. It provides `CngxTimelineMarkerHost` (`markerTpl: Signal<TemplateRef<...> | null>`, already resolved through the config cascade); the row injects it optionally and falls back to its own `[cngxTimelineMarkerContent]` projection. A token rather than a parent class keeps the row usable standalone.

## Configuration

Labels and app-wide slot templates, nothing behavioural. Resolution: per-instance input, then `provideTimelineConfigAt`, then `provideTimelineConfig`, then library defaults.

```typescript
provideTimelineConfig(
  withTimelineLabels({
    retry: 'Erneut versuchen',
    emptyFallback: 'Noch keine Ereignisse.',
    groupLabel: (group) => group.start.toLocaleDateString('de-AT'),
  }),
  withTimelineTemplates({ empty: myEmptyTemplate }),
);
```

- Defaults are English; a missing translation shows English text, never a blank surface. `labels.status` merges key by key, so renaming one status keeps the other three.
- `provideTimelineConfigAt(...)` returns `Provider[]` for `viewProviders` and merges onto the enclosing config, so a region re-phrases one label without resetting the rest.
- `injectTimelineConfig()` reads the resolved config in an injection context; `CNGX_TIMELINE_CONFIG` is the raw token.
- `CngxTimelineLabels` covers `timelineRegion`, `retry`, `errorFallback`, `emptyFallback`, `loading`, `refreshing`, `itemBusy`, `itemErrorFallback`, the `status` map and `groupLabel`.

## Accessibility

What the headless layer contributes, before any organism ARIA:

- Marker and connector are `aria-hidden`. Colour is never the only channel: the status reaches assistive tech through a screen-reader-only line on the item, fed from `labels.status`, rendered only while it has something to say.
- `aria-busy` on the item is a `computed()` over the row's own `state`, not the list's.
- A failed row paints `rejected`, announces it (the announcement always matches the paint), and renders a visible inline error from `labels.itemErrorFallback`. Both read as row content in DOM order - the host has no role, so `aria-describedby` would resolve nowhere.
- Dev mode warns once per row when `[cngxTimelineOpposite]` contains focusable content: the slot projects ahead of the body, so a control there takes focus before the row it belongs to.
- Every string a surface can render without a consumer slot is localisable through `withTimelineLabels`.

## See Also

- [`@cngx/ui/timeline`](../../ui/timeline/) - the styled organism: grouping inputs, layout, skins, async body, Material bridge
- [`@cngx/common/stepper`](../stepper/) - guided process; timeline is history
- [`CngxTime`](../display/) - relative timestamp formatting for `[cngxTimelineTime]`
- [`CngxAsyncState`](../../core/) - the per-row `[state]` contract
- [API on compodocx](https://cngxjs.github.io/cngx/)
- Tests: `projects/common/timeline/*.spec.ts`
