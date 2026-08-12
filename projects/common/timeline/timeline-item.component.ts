import { NgTemplateOutlet } from '@angular/common';
import {
  afterNextRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  Directive,
  ElementRef,
  inject,
  input,
  isDevMode,
  ViewEncapsulation,
} from '@angular/core';
import { type CngxAsyncState } from '@cngx/core/utils';

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
 * Marks content that belongs on the far side of the rail from the row's
 * body - the year label opposite a card, the timestamp across a centred
 * rail.
 *
 * Per-row content, so it is a projection slot rather than a timeline-wide
 * template: the row template already owns it, and the config cascade is
 * for surfaces the whole timeline shares.
 *
 * The extra grid track only exists for rows that actually project into it
 * (`:has(> [cngxTimelineOpposite])`), so markup that predates this slot
 * keeps its raster to the pixel. Placement follows the row: opposite content
 * sits across the rail from the body under `start`, `end` and `alternate`
 * alike.
 *
 * ```html
 * <cngx-timeline-item status="done">
 *   <span cngxTimelineOpposite>2019</span>
 *   <p>Founded</p>
 * </cngx-timeline-item>
 * ```
 *
 * **Keep the content non-interactive.** The slot projects ahead of the body,
 * so it is read first in every layout. For a year or a short label that is
 * the right reading order whichever side the rail is on. A link or a button
 * would take focus before the row it belongs to, and no placement of the
 * grid can fix that, because the paint follows `[data-row-side]` while the
 * DOM order does not.
 *
 * @category common/timeline
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/timeline/timeline-item.component.ts
 * @relatedTo CngxTimelineItem, CngxTimelineTime
 * @since 0.1.0
 */
@Directive({
  selector: '[cngxTimelineOpposite]',
  standalone: true,
  host: { class: 'cngx-timeline-item__opposite' },
})
export class CngxTimelineOpposite {}

/**
 * Marks content to render inside this row's marker dot - a glyph, an icon,
 * an avatar.
 *
 * The per-row counterpart to the timeline-wide `*cngxTimelineMarkerTpl`, and
 * the only route when the row stands on its own. It also *wins* over that
 * template when both are present: most-local-wins, the same direction as
 * every other slot in the family, so one row can carry a different glyph
 * without the timeline's default being torn out for the rest.
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
 * @internal Enough of the tabbable surface to catch the mistake this warns
 * about. Not a general focus-order utility - `[tabindex]` matches a negative
 * value too, which is deliberately over-eager for a dev-only check.
 */
const FOCUSABLE =
  'a[href], button, input, select, textarea, summary, [tabindex], [contenteditable]';

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
 * **What it announces.** The marker and rail are `aria-hidden`, so colour is
 * never the only channel - the status reaches assistive tech through a
 * screen-reader-only line fed from `CNGX_TIMELINE_CONFIG.labels.status`, and
 * a failed row through a visible inline error. Both are read as the row's own
 * content, in DOM order, rather than through `aria-describedby`: the host is
 * a plain element with no role, so a description pointed at its own
 * descendants would resolve nowhere and duplicate the text for anyone
 * browsing it. Neither element is rendered while it has nothing to say.
 *
 * ### Standalone
 * ```html
 * <cngx-timeline-item status="done">
 *   <cngx-time cngxTimelineTime [date]="event.at" />
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
 * <example-url>http://localhost:4200/#/ui/timeline/basics/standalone-atoms</example-url>
 * <example-url>http://localhost:4200/#/ui/timeline/basics/custom-date-header-and-marker</example-url>
 * <example-url>http://localhost:4200/#/ui/timeline/basics/marker-precedence</example-url>
 * <example-url>http://localhost:4200/#/ui/timeline/layout/media-markers</example-url>
 * <example-url>http://localhost:4200/#/ui/timeline/layout/placement-end</example-url>
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
  },
  template: `
    <cngx-timeline-marker [status]="markerStatus()" [busy]="busy()">
      @if (markerTpl(); as tpl) {
        <ng-container
          *ngTemplateOutlet="tpl; context: { $implicit: item(), status: markerStatus() }"
        />
      } @else {
        <ng-content select="[cngxTimelineMarkerContent]" />
      }
    </cngx-timeline-marker>
    <cngx-timeline-connector [status]="markerStatus()" [position]="position()" />
    <ng-content select="[cngxTimelineOpposite]" />
    <ng-content select="[cngxTimelineTime]" />
    <div class="cngx-timeline-item__body">
      <ng-content select="[cngxTimelineContent]" />
      <ng-content />
      @if (errorText(); as text) {
        <p class="cngx-timeline-item__error">{{ text }}</p>
      }
    </div>
    @if (statusText(); as text) {
      <span class="cngx-timeline-item__sr">{{ text }}</span>
    }
  `,
  styleUrls: ['./timeline-tokens.css', './timeline-item.component.css'],
})
export class CngxTimelineItem {
  private readonly config = injectTimelineConfig();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

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
   * @internal The timeline-wide marker template, when a `<cngx-timeline>` is
   * above this row. Absent standalone.
   */
  private readonly hostMarkerTpl =
    inject(CNGX_TIMELINE_MARKER_HOST, { optional: true })?.markerTpl ?? (() => null);

  /** @internal Set when this row projects its own marker content. */
  private readonly ownMarker = contentChild(CngxTimelineMarkerContent);

  /**
   * @internal The timeline-wide template is the *default*, so a row that
   * projects its own marker content overrides it - most-local-wins, the
   * same direction as every other slot in the family. Resolving to `null`
   * rather than branching on `<ng-content>` keeps the projection static:
   * content lands in the DOM once and renders whatever it was given.
   */
  protected readonly markerTpl = computed(() => (this.ownMarker() ? null : this.hostMarkerTpl()));

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
   * @internal Busy outranks everything: a row still loading has nothing
   * settled to report. Otherwise this reads `markerStatus`, not `status`,
   * so the announcement can never contradict the paint - a failed row
   * announces the `rejected` it shows, not the editorial status it kept.
   */
  protected readonly statusText = computed(() => {
    const labels = this.config.labels;
    if (this.busy()) {
      return labels?.itemBusy ?? '';
    }
    const status = this.markerStatus();
    return status ? (labels?.status?.[status] ?? '') : '';
  });

  /** @internal Visible inline error, blank unless this row failed. */
  protected readonly errorText = computed(() =>
    this.failed() ? (this.config.labels?.itemErrorFallback ?? '') : '',
  );

  constructor() {
    if (isDevMode()) {
      // afterNextRender, not an effect: this is a one-shot authoring check
      // on projected content, and the reactive graph has no business
      // carrying it. Runs once per row, after its content exists.
      afterNextRender(() => {
        const opposite = this.host.nativeElement.querySelector(':scope > [cngxTimelineOpposite]');
        if (opposite?.querySelector(FOCUSABLE)) {
          console.warn(
            '[cngx-timeline-item] focusable content inside [cngxTimelineOpposite]. ' +
              'The slot projects ahead of the row body, so under placement="end" or ' +
              '"alternate" it takes focus before the row it belongs to while painting ' +
              'on the far side of the rail. Keep opposite content non-interactive and ' +
              'put controls in the body.',
            this.host.nativeElement,
          );
        }
      });
    }
  }
}
