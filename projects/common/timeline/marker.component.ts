import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';
import { coerceBooleanProperty } from '@cngx/core/utils';

/**
 * Process vocabulary shared by the timeline marker, the connector and
 * `CngxTimelineItem`.
 *
 * Deliberately narrow: it describes where an event sits in a history, not
 * what the user may do about it. A timeline that needed `disabled`,
 * `editable` or `current` would be a stepper, and steppers live in
 * `@cngx/common/stepper` with their own flow logic.
 *
 * @category common/timeline
 */
export type TimelineStatus = 'done' | 'active' | 'upcoming' | 'rejected';

/**
 * The dot on the timeline rail - a status-coloured slot host for whatever
 * the consumer projects into it (nothing, a glyph, an icon, an avatar).
 *
 * Purely decorative and marked `aria-hidden`: the status it paints is
 * already carried semantically by the owning `CngxTimelineItem`, and
 * announcing it twice is worse than not announcing it here at all. That
 * also means colour is never this atom's only signal - the item's ARIA is.
 *
 * Usable standalone. It ships its own token SET rules, so a marker
 * dropped into a hand-rolled layout renders at the right size and tracks
 * `[data-density]` with no timeline organism above it.
 *
 * ### Bare dot
 * ```html
 * <cngx-timeline-marker status="done" />
 * ```
 *
 * ### With a projected glyph
 * ```html
 * <cngx-timeline-marker status="rejected">!</cngx-timeline-marker>
 * ```
 *
 * ### Pending
 * ```html
 * <cngx-timeline-marker status="active" busy />
 * ```
 *
 * @category common/timeline
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/timeline/marker.component.ts
 * @relatedTo CngxTimelineConnector
 * @since 0.1.0
 */
@Component({
  selector: 'cngx-timeline-marker',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-timeline-marker',
    'aria-hidden': 'true',
    '[attr.data-status]': 'status()',
    '[class.cngx-timeline-marker--busy]': 'busy()',
  },
  template: `<ng-content />`,
  styleUrls: ['./timeline-tokens.css', './marker.component.css'],
})
export class CngxTimelineMarker {
  /**
   * Where the event sits in the history. Drives the dot colour and, for
   * `upcoming`, its hollow fill. Left unset the marker paints in the
   * neutral rail colour.
   */
  readonly status = input<TimelineStatus | undefined>(undefined);

  /**
   * Whether the marker pulses to signal work in flight - typically bound
   * from an item's own `[state]` being `pending`.
   *
   * The pulse is a `box-shadow` animation rather than a `transform` or a
   * size change: the marker sits in a grid track the rail is aligned to,
   * so anything that altered its box would drag the rail with it every
   * frame. Suppressed under `prefers-reduced-motion`.
   */
  readonly busy = input(false, { transform: coerceBooleanProperty });
}
