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
      <ng-template [cngxTimelineItem]="feed.data()" let-event let-last="last">
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

Binding the same array to `[cngxTimelineItem]` is what types `let-event`.
Angular cannot infer a structural directive's context generic from a sibling
input on the host, so the slot pins it through an input of its own - the
`ngForOf` mechanism. The binding is optional and never read at runtime; leave
it off and the `let-` variables fall back to `unknown`.

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

## Layout

Three inputs, each defaulting to the v1 rendering, each resolving to a
`[data-*]` attribute the row stylesheet reads. No new DOM, no ARIA change: the
role chain is byte-identical across every combination, and DOM order stays
chronological whatever the paint does.

|Input|Values|Effect|
|-|-|-|
|`[placement]`|`start` (default), `end`, `alternate`|which side of the rail the body sits on|
|`[rail]`|`segmented` (default), `continuous`|whether the rail breaks between rows|
|`[orientation]`|`vertical` (default), `horizontal`|which axis the run reads along|

```html
<cngx-timeline [items]="milestones()" [dateAccessor]="at"
               placement="alternate" rail="continuous" groupBy="none">
  <ng-template [cngxTimelineItem]="milestones()" let-milestone let-last="last">
    <cngx-timeline-item [position]="last ? 'last' : 'middle'" status="done">
      <strong cngxTimelineOpposite>{{ milestone.year }}</strong>
      <h3>{{ milestone.title }}</h3>
    </cngx-timeline-item>
  </ng-template>
</cngx-timeline>
```

**Alternation comes from the loop index**, not from `:nth-child`, so a filtered
or refetched list alternates by its rendered position rather than by DOM
structure. The built-in loading placeholder derives its sides the same way, so
the swap from skeleton to content does not reflow.

**`alternate` is not supported with `mode="activity"`.** Alternating a
scan-feed defeats the scan; those rows render `start` and dev mode warns once.

**`alternate` collapses to a single side below `32rem`** of the timeline's own
width. It is a container query, not a viewport one, so the same timeline
behaves correctly inside a narrow panel on a wide screen. The threshold is a
literal because a container-query condition cannot read a custom property.

**`continuous` stretches each segment across the row gap**, per segment rather
than as one line behind the run. That is what keeps a `rejected` stretch red
and an `upcoming` tail dashed. The last segment of a band never stretches, so
the gap between groups stays open.

### Horizontal

`orientation="horizontal"` transposes the whole raster: the rail becomes the
axis, the cards stack away from it, and grouped bands become labelled columns.
The run sits behind `overflow-x: auto`, which makes it keyboard-scrollable
natively.

Orientation **composes** with placement rather than replacing it. Under
`horizontal`, `[placement]` selects which side of the *axis* a row sits on, so
`alternate` puts cards above and below in turn. The organism derives a side per
row, never a direction; the stylesheet decides which axis that side lives on.

```html
<cngx-timeline [items]="events()" [dateAccessor]="at"
               orientation="horizontal" placement="alternate" groupBy="none">
```

A horizontal row takes `--cngx-timeline-item-inline-size` (default `12rem`)
rather than a content-derived width, because flex would otherwise size every
card to its longest word and the axis would read as a ragged queue.

`mode="activity"` has no horizontal variant: a scan-feed is a vertical shape,
and those rows render the narrative axis.

**RTL is free.** In horizontal the run's main axis *is* the inline axis, so
`dir="rtl"` reverses the whole timeline through the same logical properties
that carry the block axis in vertical. Neither stylesheet contains a single
physical property.

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

### Content across the rail

`[cngxTimelineOpposite]` is a projection slot on the row, not a template slot:
it carries per-row content, and the config cascade is for surfaces the whole
timeline shares. Whatever is projected lands on the far side of the rail from
the body.

```html
<cngx-timeline-item status="done">
  <cngx-time cngxTimelineOpposite [date]="event.at" />
  <p>{{ event.summary }}</p>
</cngx-timeline-item>
```

The row grows a third grid track only when something is actually projected, so
markup written before this slot existed keeps its geometry unchanged.

Keep the content non-interactive. The slot projects ahead of the body in DOM
order, which reads correctly for a label but would put a link or button before
the row it belongs to.

### Media inside the marker

The dot clips to its circle, so a photo, an avatar or a glyph renders inside it
with no extra markup. Sizing has two halves and they behave differently:

|Content|Sized by|
|-|-|
|`img` / `picture`|the marker; fills it edge to edge|
|`svg`|`--cngx-timeline-marker-glyph-size` (60% of the dot)|
|`<cngx-avatar>` / `<cngx-icon>`|its own size token, never the marker|

Bare media follows `--cngx-timeline-marker-size` on its own. A projected atom
does not: `CngxAvatar` and `CngxIcon` pin `--cngx-avatar-size` /
`--cngx-icon-size` on their own host, where nothing inherited from the marker
reaches them. **Enlarging a marker that holds an atom means setting both.**

```html
<cngx-timeline-item [style.--cngx-timeline-marker-size]="'48px'">
  <cngx-avatar cngxTimelineMarkerContent size="lg" initials="JD" />
  <p>{{ event.summary }}</p>
</cngx-timeline-item>
```

`--cngx-timeline-rail-inset` derives from the marker size at the row host, so
the rail meets an enlarged dot's centre with no further wiring.

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
