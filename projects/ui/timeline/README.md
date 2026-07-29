# CngxTimeline

Chronological event feed. Groups a flat list into date bands and switches its
body on a bound async state.

## Import

```typescript
import { CngxTimeline } from '@cngx/ui/timeline';
import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineTime } from '@cngx/common/timeline';
```

## Quick Start

```typescript
import { Component } from '@angular/core';
import { CngxTimeline } from '@cngx/ui/timeline';
import { CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineTime } from '@cngx/common/timeline';
import { CngxTime } from '@cngx/common/display';

@Component({
  selector: 'app-example',
  template: `
    <cngx-timeline [state]="feed" [dateAccessor]="at" [idAccessor]="byId" groupBy="day">
      <ng-template cngxTimelineItem let-event let-last="last">
        <cngx-timeline-item [position]="last ? 'last' : 'middle'" status="done">
          <cngx-time cngxTimelineTime [date]="event.at" />
          <p>{{ event.summary }}</p>
        </cngx-timeline-item>
      </ng-template>
    </cngx-timeline>
  `,
  imports: [CngxTimeline, CngxTimelineItem, CngxTimelineItemTpl, CngxTimelineTime, CngxTime],
})
export class ExampleComponent {
  // feed is a CngxAsyncState<Event[]> from createAsyncState / injectAsyncState
  protected readonly at = (event: Event) => event.at;
  protected readonly byId = (event: Event) => event.id;
}
```

`[items]` takes a plain array when there is no async state to bind. `[state]`
wins over it.

## Overview

The organism owns very little. Bucketing lives in a presenter
(`createTimelineGrouping`, `@cngx/common/timeline`) fronted by
`CNGX_TIMELINE_GROUPING_FACTORY`, the row raster lives with `CngxTimelineItem`,
and latency gating lives in `<cngx-skeleton>` (`@cngx/ui/skeleton`). What the
component adds is the band-and-row rendering, the ARIA chain, and the body
switch over `[state]`.

The rows are content, not widgets: there is no roving tabindex and no selection.
Links and buttons a consumer puts *inside* a row are natively tabbable in DOM
order, which is what a read-only history wants. Timeline is history; guided
process is `@cngx/common/stepper`.

## Grouping

`[groupBy]` takes `'day'` (default), `'week'`, `'month'`, `'none'`, or a
function. The three calendar modes read **local** date fields, so a 23- or
25-hour DST day still groups as one day. Weeks start Monday and a band is
anchored on its own Monday rather than on a week number.

`[direction]` is `'desc'` (newest first, the activity-feed convention) or
`'asc'`.

Input order is irrelevant - the presenter sorts defensively. Bands whose items
are the same objects hand back the same band reference, so appending leaves
every other band's `@for` block untouched.

For anything the built-ins do not cover - fiscal quarters, UTC days, "today /
this week / earlier" - pass a function returning a key and a start instant:

```typescript
protected readonly byQuarter = (date: Date) => ({
  key: `${date.getFullYear()}-Q${Math.floor(date.getMonth() / 3) + 1}`,
  start: new Date(date.getFullYear(), Math.floor(date.getMonth() / 3) * 3, 1),
});
```

Swap the whole presenter app-wide through `CNGX_TIMELINE_GROUPING_FACTORY`
instead of forking the component.

## Async state

Bind `[state]` and the body follows it: skeleton on first load, error surface
with a retry, empty surface, and a refreshing tail over content that stays on
screen. Every branch comes from `resolveAsyncView`, and the show-delay /
min-dwell gating is the skeleton container's - the timeline holds no latency
logic, so a load that resolves faster than the delay never flashes a
placeholder.

`[skeletonRowCount]` sizes the placeholder to the usual result length, and
`*cngxTimelineSkeleton` reshapes the placeholder row itself when your rows are
taller than a dot and two bars.
`[emptyReason]` tells the empty slot which empty it is looking at: the organism
cannot infer whether a filter cleared the list or nothing has ever happened.

The bound state is republished through `CNGX_STATEFUL`, so `CngxToastOn` /
`CngxAlertOn` / `CngxBannerOn` attach on the host with no binding of their own.

A single row can carry its own state. `<cngx-timeline-item [state]="rowState">`
sets `aria-busy` while that row is in flight and repaints marker and rail as
`rejected` on failure, without discarding the editorial `status` the row goes
back to once a retry lands.

## Modes and skins

`[mode]` selects the row raster:

- `narrative` (default) - timestamp above the body.
- `activity` - timestamp trailing the body on one line.

`[skin]` is paint only; structure, ARIA and slot behaviour are identical across
values:

- `line` (default) - bare rail, no surface.
- `card` - each row body lifted onto its own surface.
- `bands` - alternating group tint for long timelines.

## Slots

Eight template slots, each resolved through the family-standard three-stage
cascade: per-instance directive, then `CngxTimelineConfig.templates`, then the
built-in markup.

|Directive|Context|
|-|-|
|`*cngxTimelineItem`|`$implicit`, `index`, `first`, `last`, `group`|
|`*cngxTimelineDateHeader`|`$implicit: TimelineGroup<T>`|
|`*cngxTimelineMarkerTpl`|`$implicit`, `status`|
|`*cngxTimelineEmpty`|`$implicit: EmptyReason`|
|`*cngxTimelineError`|`$implicit: unknown`, `retry`|
|`*cngxTimelineRetryButton`|`$implicit: retry`|
|`*cngxTimelineLoadingTail`|none|
|`*cngxTimelineSkeleton`|none|

`*cngxTimelineMarkerTpl` applies to every row; a single row overrides it by
projecting its own `[cngxTimelineMarkerContent]`, which wins.

## Configuration

```typescript
provideTimelineConfig(
  withTimelineLabels({ retry: 'Try again', emptyFallback: 'Nothing yet.' }),
  withTimelineTemplates({ empty: myEmptyTemplate }),
);
```

Root, or scoped to a subtree with `provideTimelineConfigAt` in `viewProviders`,
where features merge onto the parent config rather than replacing it - a region
can re-phrase one label without resetting the rest. Resolution runs per-instance
input, then the scoped provider, then root, then the library default. Defaults
are English; supply your locale through the cascade.

The config is deliberately small - text and templates only. There are no
behavioural switches to configure: bucketing swaps through the factory token,
everything visual through the slots.

## Accessibility

Every band is its own list: grouped renders `role="group"` on the container,
then per band a generic wrapper holding the date header beside a `role="list"`
that owns only `role="listitem"` rows and is named by that header. A screen
reader therefore reports an item count per band rather than one across the whole
timeline. The header sits outside the list on purpose - a list may own nothing
but list items, and the header is a consumer slot that often carries a heading.
`groupBy: 'none'` moves `list` up to the container and drops both wrappers to
`presentation`, shortening the chain to `list -> listitem` without a second code
path.

`aria-busy` sits on the element that owns the content, and is a `computed()`
over the bound state rather than a one-time setting. A polite live region stays
in the DOM whether or not there is anything to say - a region created together
with its message is announced inconsistently or not at all.

A row's status line announces what the row paints: a failed row reports
`rejected` even while it keeps the editorial status it will return to.

## Composition

Consumers wire filtering, searching, paging and scroll tracking themselves -
none of them is injected by the timeline, which keeps one filter usable across a
timeline, a table and a chart at once. Narrow the list in a `computed()` and
hand the result to `[items]`; see the integration stories for
`injectDataSource`, filter-before-bind, and `CngxScrollSpy` band navigation.

Two swap points cover the rest without a fork. `CNGX_TIMELINE_GROUPING_FACTORY`
replaces the bucketing; `CNGX_TIMELINE_VIEW_FACTORY` replaces the body-view
mapping, for when holding rows through every refetch or treating a filtered
empty differently is a product decision rather than a library one.

An ejected skin keeps working: `createTimelineView`, `createTimelineSlots`,
`createTimelineSlotBinding` and `createTimelineFallbackCopy` are public, so the
copy imports the brain instead of restating it. The state-forwarding façade it
also needs, `createForwardedAsyncState`, is not timeline-specific and ships from
`@cngx/common/data` alongside the rest of the async-state surface.

## Material Theme

```scss
@use '@angular/material' as mat;
@use '@cngx/themes/material/timeline-theme' as timeline;

$theme: mat.define-theme((...));

html {
  @include mat.all-component-themes($theme);
  @include timeline.theme($theme);
}
```

Without the bridge the family uses the cngx foundation `--cngx-color-*` tokens
(light/dark aware) with a native look; the bridge maps text, rail, surface and
the status colours onto `--mat-sys-*`.

## See Also

- [CngxTimelineItem](../../common/timeline/) - the row molecule, usable standalone
- [CngxAsyncState](../../core/utils/) - async state contract
- [CngxSkeleton](../skeleton/) - the loading body
- [API on compodocx](https://cngxjs.github.io/cngx/)
- Tests: `projects/ui/timeline/timeline.component.spec.ts`, `timeline-async.spec.ts`
