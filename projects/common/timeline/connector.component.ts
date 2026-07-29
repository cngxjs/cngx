import { ChangeDetectionStrategy, Component, input, ViewEncapsulation } from '@angular/core';

import type { TimelineStatus } from './marker.component';

/**
 * Where a connector segment sits in its run, which decides which ends get
 * clipped back to the adjacent marker's centre.
 *
 * `'only'` renders nothing at all - a single-item timeline has no rail to
 * draw.
 *
 * @category common/timeline
 */
export type TimelineConnectorPosition = 'middle' | 'first' | 'last' | 'only';

/**
 * The rail segment between two markers.
 *
 * Decorative and `aria-hidden`: it repeats a sequence the DOM order
 * already carries, so announcing it would only add noise. It is
 * status-capable all the same, because the *visual* run of a history is
 * where a rejected step or a not-yet-reached tail reads fastest - a
 * dashed segment for `upcoming` and a danger-toned one for `rejected`,
 * so the distinction survives without colour.
 *
 * Drawn with `border-inline-start` and clipped with block-direction
 * margins - logical properties throughout, so the rail lands on the
 * correct side under `dir="rtl"` with no override.
 *
 * ### Between two items
 * ```html
 * <cngx-timeline-connector status="done" />
 * ```
 *
 * ### Last item in the run
 * ```html
 * <cngx-timeline-connector position="last" />
 * ```
 *
 * @category common/timeline
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/timeline/connector.component.ts
 * @relatedTo CngxTimelineMarker
 * @since 0.1.0
 */
@Component({
  selector: 'cngx-timeline-connector',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-timeline-connector',
    'aria-hidden': 'true',
    '[attr.data-status]': 'status()',
    '[attr.data-position]': 'position()',
  },
  template: '',
  styleUrls: ['./timeline-tokens.css', './connector.component.css'],
})
export class CngxTimelineConnector {
  /**
   * Status of the segment. `upcoming` renders dashed, `rejected` in the
   * danger tone, `done` and `active` solid in their own tones. Left unset
   * the rail paints in the neutral border colour.
   */
  readonly status = input<TimelineStatus | undefined>(undefined);

  /**
   * Position in the run. `'first'` clips the head back to the marker
   * centre, `'last'` clips the tail, `'only'` hides the segment
   * entirely. Defaults to `'middle'` - a full-height segment.
   */
  readonly position = input<TimelineConnectorPosition>('middle');
}
