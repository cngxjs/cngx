import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { type CngxAsyncState, nextUid } from '@cngx/core/utils';

import { CngxTimelineConnector, type TimelineConnectorPosition } from './connector.component';
import { CNGX_TIMELINE_MARKER_HOST } from './marker-host.token';
import { CngxTimelineMarker, type TimelineStatus } from './marker.component';
import { injectTimelineConfig } from './timeline-config';

/**
 * Marks the element that holds an item's timestamp, so the item can place
 * it in the raster the active mode calls for - above the body in
 * `narrative`, trailing it in `activity`.
 *
 * Pair it with `<cngx-time>` from `@cngx/common/display` for relative
 * formatting; the timeline neither formats nor ticks.
 *
 * @category common/timeline
 */
@Directive({
  selector: '[cngxTimelineTime]',
  standalone: true,
  host: { class: 'cngx-timeline-item__time' },
})
export class CngxTimelineTime {}

/**
 * Marks content to render inside this row's marker dot - a glyph, an icon,
 * an avatar.
 *
 * The per-row counterpart to the app-wide `*cngxTimelineMarkerTpl`, and the
 * only route when the row stands on its own. If a `<cngx-timeline>` above it
 * carries a marker template, that template wins, on the same
 * app-wide-default-under-local-override logic as every other slot in the
 * family.
 *
 * Whatever renders here is inside an `aria-hidden` element - decoration only.
 *
 * @category common/timeline
 */
@Directive({
  selector: '[cngxTimelineMarkerContent]',
  standalone: true,
})
export class CngxTimelineMarkerContent {}

/**
 * Marks the element that holds an item's body. Optional - anything
 * projected without a slot directive lands in the body too. Reach for it
 * when the item also projects a timestamp and the source order would
 * otherwise be ambiguous.
 *
 * @category common/timeline
 */
@Directive({
  selector: '[cngxTimelineContent]',
  standalone: true,
  host: { class: 'cngx-timeline-item__content' },
})
export class CngxTimelineContent {}

/**
 * One event on the timeline: a marker, the rail segment below it, an
 * optional timestamp, and the projected body.
 *
 * A terminal composable unit, not a fragment of the organism. It ships
 * its own token SET rules and defaults to the `narrative` raster, so
 * dropping one into a hand-rolled layout renders a complete, density-
 * correct item with no `<cngx-timeline>` above it. Inside the organism it
 * inherits `[data-mode]` and re-rasters itself.
 *
 * **Two independent state channels.** `status` is where the event sits in
 * a history (`done` / `active` / `upcoming` / `rejected`) - editorial, set
 * by the consumer. `state` is whether *this row's own* data is currently
 * loading or failed. They compose: a `done` item whose `state` errored
 * paints as rejected and announces the failure, without losing the
 * editorial status once the retry succeeds.
 *
 * **What it announces.** The marker and rail are `aria-hidden`, so colour
 * is never the only channel - the status reaches assistive tech through a
 * screen-reader-only line fed from `CNGX_TIMELINE_CONFIG.labels.status`,
 * and a failed row through a visible inline error. Both carry stable IDs
 * that stay in the DOM in every state; `aria-hidden` decides which one is
 * read, and `aria-describedby` always names both.
 *
 * ### Standalone
 * ```html
 * <cngx-timeline-item status="done">
 *   <cngx-time cngxTimelineTime [value]="event.at" />
 *   <p>Deployment finished</p>
 * </cngx-timeline-item>
 * ```
 *
 * ### With its own async state
 * ```html
 * <cngx-timeline-item [state]="rowState" position="last">
 *   <p>{{ rowState.data()?.summary }}</p>
 * </cngx-timeline-item>
 * ```
 *
 * @category common/timeline
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/timeline/timeline-item.component.ts
 * @relatedTo CngxTimelineMarker, CngxTimelineConnector, CNGX_TIMELINE_CONFIG
 * @since 0.1.0
 */
@Component({
  selector: 'cngx-timeline-item',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [CngxTimelineMarker, CngxTimelineConnector, NgTemplateOutlet],
  host: {
    class: 'cngx-timeline-item',
    '[attr.data-status]': 'status()',
    '[attr.data-failed]': 'failed() ? "" : null',
    '[attr.aria-busy]': 'ariaBusy()',
    '[attr.aria-describedby]': 'describedBy',
  },
  template: `
    <cngx-timeline-marker [status]="markerStatus()" [busy]="busy()">
      @if (markerTpl(); as tpl) {
        <ng-container
          *ngTemplateOutlet="tpl; context: { $implicit: item(), status: status() }"
        />
      } @else {
        <ng-content select="[cngxTimelineMarkerContent]" />
      }
    </cngx-timeline-marker>
    <cngx-timeline-connector [status]="markerStatus()" [position]="position()" />
    <ng-content select="[cngxTimelineTime]" />
    <div class="cngx-timeline-item__body">
      <ng-content select="[cngxTimelineContent]" />
      <ng-content />
      <p
        class="cngx-timeline-item__error"
        [id]="errorId"
        [attr.aria-hidden]="errorText() ? null : 'true'"
      >
        {{ errorText() }}
      </p>
    </div>
    <span
      class="cngx-timeline-item__sr"
      [id]="statusId"
      [attr.aria-hidden]="statusText() ? null : 'true'"
    >
      {{ statusText() }}
    </span>
  `,
  styleUrls: ['./timeline-tokens.css', './timeline-item.component.css'],
})
export class CngxTimelineItem {
  private readonly config = injectTimelineConfig();
  private readonly uid = nextUid('cngx-timeline-item');

  /**
   * Where the event sits in the history. Drives the marker and rail
   * colours and the screen-reader status line. Purely editorial - it
   * carries no flow logic, because a timeline is a record and a guided
   * process is a stepper.
   */
  readonly status = input<TimelineStatus | undefined>(undefined);

  /**
   * This row's own async state, for a body that loads, mutates or fails
   * independently of the list around it.
   *
   * Optional by construction and tolerant of a bare `state` attribute
   * (the empty string coerces to `undefined`), so the item never forces a
   * binding a consumer may not have.
   */
  readonly state = input<
    CngxAsyncState<unknown> | undefined,
    CngxAsyncState<unknown> | '' | undefined
  >(undefined, { transform: (value) => (typeof value === 'string' ? undefined : value) });

  /**
   * Position in the run, forwarded to the rail. `'last'` and `'only'`
   * stop the rail at this item so the timeline does not trail off into
   * empty space. The organism sets it; standalone items default to
   * `'middle'`.
   */
  readonly position = input<TimelineConnectorPosition>('middle');

  /**
   * The event this row stands for. Only ever read as the `$implicit` of an
   * app-wide `*cngxTimelineMarkerTpl`, so bind it when the app sets one and
   * that template needs the payload; leave it off otherwise.
   */
  readonly item = input<unknown>(undefined);

  /**
   * @internal App-wide marker template, when a `<cngx-timeline>` is above
   * this row. Absent standalone, where `[cngxTimelineMarkerContent]`
   * projection takes over instead.
   */
  protected readonly markerTpl =
    inject(CNGX_TIMELINE_MARKER_HOST, { optional: true })?.markerTpl ?? (() => null);

  /** @internal Stable target for the screen-reader status line. */
  protected readonly statusId = `${this.uid}-status`;

  /** @internal Stable target for the inline error. */
  protected readonly errorId = `${this.uid}-error`;

  /**
   * @internal Both IDs, always. Which one is actually read is decided by
   * `aria-hidden` on the elements themselves - dropping an ID from this
   * list instead would make the description order jump around as the row
   * changes state.
   */
  protected readonly describedBy = `${this.statusId} ${this.errorId}`;

  /** @internal Work in flight on this row's own state. */
  protected readonly busy = computed(() => {
    const status = this.state()?.status();
    return status === 'loading' || status === 'pending';
  });

  /** @internal This row's own state failed. */
  protected readonly failed = computed(() => this.state()?.status() === 'error');

  /** @internal `aria-busy` reflects the row's own work, not the list's. */
  protected readonly ariaBusy = computed(() => (this.busy() ? 'true' : null));

  /**
   * @internal A failed row paints as rejected regardless of its editorial
   * status - a failure is the more urgent fact, and `status` is left
   * untouched so the row returns to its own colour once a retry lands.
   */
  protected readonly markerStatus = computed<TimelineStatus | undefined>(() =>
    this.failed() ? 'rejected' : this.status(),
  );

  /**
   * @internal Busy outranks status in the announcement for the same
   * reason: a row that is still loading has nothing settled to report.
   */
  protected readonly statusText = computed(() => {
    const labels = this.config.labels;
    if (this.busy()) {
      return labels?.itemBusy ?? '';
    }
    const status = this.status();
    return status ? (labels?.status?.[status] ?? '') : '';
  });

  /** @internal Visible inline error, blank unless this row failed. */
  protected readonly errorText = computed(() =>
    this.failed() ? (this.config.labels?.itemErrorFallback ?? '') : '',
  );
}
