import { Directive, inject, TemplateRef } from '@angular/core';
import type { EmptyReason } from '@cngx/common/card';

import type { TimelineGroup } from './grouping';
import type { TimelineStatus } from './marker.component';

/**
 * Context for `*cngxTimelineItem` - the item itself plus where it sits.
 *
 * `first` and `last` are positions **within the group**, not within the
 * whole timeline, because that is what a consumer needs to decide whether
 * to draw a trailing rail.
 *
 * @category common/timeline
 */
export interface CngxTimelineItemContext<T> {
  readonly $implicit: T;
  /** Index within the group. */
  readonly index: number;
  /** First item of its group. */
  readonly first: boolean;
  /** Last item of its group. */
  readonly last: boolean;
  /** The group this item was bucketed into. */
  readonly group: TimelineGroup<T>;
}

/**
 * The row template. The one slot with no built-in fallback: only the
 * consumer knows what an event of theirs looks like.
 *
 * ```html
 * <cngx-timeline [state]="events" [dateAccessor]="at">
 *   <ng-template cngxTimelineItem let-event let-last="last">
 *     <cngx-timeline-item [position]="last ? 'last' : 'middle'">
 *       <cngx-time cngxTimelineTime [date]="event.at" />
 *       <p>{{ event.summary }}</p>
 *     </cngx-timeline-item>
 *   </ng-template>
 * </cngx-timeline>
 * ```
 *
 * Named `CngxTimelineItemTpl` so it does not collide with the
 * `CngxTimelineItem` component; the selector stays `cngxTimelineItem`,
 * which is what consumers write.
 *
 * @category common/timeline
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/timeline/template-slots.ts
 * @relatedTo CngxTimelineItem, CngxTimelineDateHeader
 * @since 0.1.0
 */
@Directive({
  selector: 'ng-template[cngxTimelineItem]',
  standalone: true,
  exportAs: 'cngxTimelineItem',
})
export class CngxTimelineItemTpl<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxTimelineItemContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: CngxTimelineItemTpl<T>,
    ctx: unknown,
  ): ctx is CngxTimelineItemContext<T> {
    return true;
  }
}

/**
 * Context for `*cngxTimelineDateHeader` - the whole group, so a header can
 * show its item count alongside the date.
 *
 * @category common/timeline
 */
export interface CngxTimelineDateHeaderContext<T> {
  readonly $implicit: TimelineGroup<T>;
}

/**
 * The per-group header. Falls back to
 * `CNGX_TIMELINE_CONFIG.labels.groupLabel`, which formats the group's
 * start date in the browser locale.
 *
 * The element this renders into is what the group's `aria-labelledby`
 * points at, so a header that renders nothing leaves the group unnamed.
 *
 * ```html
 * <ng-template cngxTimelineDateHeader let-group>
 *   <h3>{{ format(group.start) }} ({{ group.items.length }})</h3>
 * </ng-template>
 * ```
 *
 * @category common/timeline
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/timeline/template-slots.ts
 * @relatedTo CngxTimelineItemTpl
 * @since 0.1.0
 */
@Directive({
  selector: 'ng-template[cngxTimelineDateHeader]',
  standalone: true,
  exportAs: 'cngxTimelineDateHeader',
})
export class CngxTimelineDateHeader<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxTimelineDateHeaderContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: CngxTimelineDateHeader<T>,
    ctx: unknown,
  ): ctx is CngxTimelineDateHeaderContext<T> {
    return true;
  }
}

/**
 * Context for `*cngxTimelineMarkerTpl` - the item and the status the
 * organism resolved for it.
 *
 * @category common/timeline
 */
export interface CngxTimelineMarkerContext<T> {
  readonly $implicit: T;
  readonly status: TimelineStatus | undefined;
}

/**
 * What goes inside the marker dot - an icon, an avatar, a type glyph.
 * Falls back to a bare coloured dot.
 *
 * Whatever renders here is inside an `aria-hidden` element, so it must
 * not be the only carrier of anything: the status reaches assistive tech
 * through `CNGX_TIMELINE_CONFIG.labels.status`.
 *
 * Keeps `Tpl` in class *and* selector to stay clear of
 * `CngxTimelineMarker`, the component it renders into.
 *
 * @category common/timeline
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/timeline/template-slots.ts
 * @relatedTo CngxTimelineMarker
 * @since 0.1.0
 */
@Directive({
  selector: 'ng-template[cngxTimelineMarkerTpl]',
  standalone: true,
  exportAs: 'cngxTimelineMarkerTpl',
})
export class CngxTimelineMarkerTpl<T = unknown> {
  readonly templateRef = inject<TemplateRef<CngxTimelineMarkerContext<T>>>(TemplateRef);

  static ngTemplateContextGuard<T>(
    _dir: CngxTimelineMarkerTpl<T>,
    ctx: unknown,
  ): ctx is CngxTimelineMarkerContext<T> {
    return true;
  }
}

/**
 * Context for `*cngxTimelineEmpty` - why the timeline is empty.
 *
 * The distinction is the point: "nothing has happened yet" and "your
 * filter matched nothing" call for different copy and different actions.
 * Vocabulary shared with `CngxCardGrid` so an app writes one empty-state
 * component and reuses it.
 *
 * @category common/timeline
 */
export interface CngxTimelineEmptyContext {
  readonly $implicit: EmptyReason;
}

/**
 * The empty surface. Falls back to
 * `CNGX_TIMELINE_CONFIG.labels.emptyFallback`.
 *
 * ```html
 * <ng-template cngxTimelineEmpty let-reason>
 *   @if (reason === 'no-results') { <p>No events match this filter.</p> }
 *   @else { <p>Nothing has happened yet.</p> }
 * </ng-template>
 * ```
 *
 * @category common/timeline
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/timeline/template-slots.ts
 * @relatedTo CngxTimelineError
 * @since 0.1.0
 */
@Directive({
  selector: 'ng-template[cngxTimelineEmpty]',
  standalone: true,
  exportAs: 'cngxTimelineEmpty',
})
export class CngxTimelineEmpty {
  readonly templateRef = inject<TemplateRef<CngxTimelineEmptyContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxTimelineEmpty,
    ctx: unknown,
  ): ctx is CngxTimelineEmptyContext {
    return true;
  }
}

/**
 * Context for `*cngxTimelineError` - the raw error plus the retry the
 * organism owns.
 *
 * @category common/timeline
 */
export interface CngxTimelineErrorContext {
  readonly $implicit: unknown;
  /** Re-drives the consumer's source; emits the organism's `retry` output. */
  readonly retry: () => void;
}

/**
 * The whole error surface, replacing message and retry control together.
 * Reach for `*cngxTimelineRetryButton` instead when only the button needs
 * restyling. Falls back to
 * `CNGX_TIMELINE_CONFIG.labels.errorFallback` plus a plain retry button.
 *
 * @category common/timeline
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/timeline/template-slots.ts
 * @relatedTo CngxTimelineRetryButton, CngxTimelineEmpty
 * @since 0.1.0
 */
@Directive({
  selector: 'ng-template[cngxTimelineError]',
  standalone: true,
  exportAs: 'cngxTimelineError',
})
export class CngxTimelineError {
  readonly templateRef = inject<TemplateRef<CngxTimelineErrorContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxTimelineError,
    ctx: unknown,
  ): ctx is CngxTimelineErrorContext {
    return true;
  }
}

/**
 * Context for `*cngxTimelineRetryButton` - the retry callback.
 *
 * @category common/timeline
 */
export interface CngxTimelineRetryButtonContext {
  readonly $implicit: () => void;
}

/**
 * Just the retry control inside the default error surface, for apps that
 * want their own button component without rewriting the error copy.
 *
 * Whatever renders here has to be operable: the library ships no button
 * component, so a consumer template is responsible for its own `type`,
 * accessible name and click wiring.
 *
 * ```html
 * <ng-template cngxTimelineRetryButton let-retry>
 *   <button type="button" (click)="retry()">Try again</button>
 * </ng-template>
 * ```
 *
 * @category common/timeline
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/timeline/template-slots.ts
 * @relatedTo CngxTimelineError
 * @since 0.1.0
 */
@Directive({
  selector: 'ng-template[cngxTimelineRetryButton]',
  standalone: true,
  exportAs: 'cngxTimelineRetryButton',
})
export class CngxTimelineRetryButton {
  readonly templateRef = inject<TemplateRef<CngxTimelineRetryButtonContext>>(TemplateRef);

  static ngTemplateContextGuard(
    _dir: CngxTimelineRetryButton,
    ctx: unknown,
  ): ctx is CngxTimelineRetryButtonContext {
    return true;
  }
}

/**
 * The tail appended below the list while a background refresh runs, with
 * the already-loaded items still on screen. Falls back to
 * `CNGX_TIMELINE_CONFIG.labels.refreshing`.
 *
 * Contextless on purpose - a refresh has nothing to say beyond the fact
 * that it is happening.
 *
 * @category common/timeline
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/timeline/template-slots.ts
 * @relatedTo CngxTimelineError
 * @since 0.1.0
 */
@Directive({
  selector: 'ng-template[cngxTimelineLoadingTail]',
  standalone: true,
  exportAs: 'cngxTimelineLoadingTail',
})
export class CngxTimelineLoadingTail {
  readonly templateRef = inject<TemplateRef<void>>(TemplateRef);
}
