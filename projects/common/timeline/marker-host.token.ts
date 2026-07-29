import { InjectionToken, type Signal, type TemplateRef } from '@angular/core';

import type { CngxTimelineMarkerContext } from './template-slots';

/**
 * The contract a timeline exposes to the rows beneath it, so an app-wide
 * marker template can reach a dot the organism does not itself render.
 *
 * `<cngx-timeline>` is data-driven in v1: the consumer owns the whole row
 * template and writes `<cngx-timeline-item>` themselves, which means the
 * organism has no handle on the marker inside it. Passing the resolved
 * template through DI is what closes that gap without the row having to
 * thread it down by hand.
 *
 * @category common/timeline
 */
export interface CngxTimelineMarkerHost {
  /** Resolved `*cngxTimelineMarkerTpl`, already through the config cascade. */
  readonly markerTpl: Signal<TemplateRef<CngxTimelineMarkerContext<unknown>> | null>;
}

/**
 * DI token for {@link CngxTimelineMarkerHost}. Provided by `<cngx-timeline>`;
 * injected optionally by `CngxTimelineItem`, which falls back to its own
 * `[cngxTimelineMarkerContent]` projection when no timeline is above it.
 *
 * A token rather than an injected parent class: the row must stay usable
 * standalone, and a concrete parent type would make the two mutually
 * dependent and block the decompose schematic.
 *
 * @category common/timeline
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/timeline/marker-host.token.ts
 * @relatedTo CngxTimelineMarkerTpl, CngxTimelineItem
 * @since 0.1.0
 */
export const CNGX_TIMELINE_MARKER_HOST = new InjectionToken<CngxTimelineMarkerHost>(
  'CngxTimelineMarkerHost',
);
