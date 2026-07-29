/**
 * @module @cngx/ui/timeline
 */

export {
  CngxTimeline,
  type CngxTimelineMode,
  type CngxTimelineSkin,
} from './timeline.component';
// The organism composes these rather than inlining them, and they are public
// for the same reason: an ejected skin has to resolve the same slot cascade,
// the same body-view mapping and the same fallback copy, or it forks the
// brain instead of replacing the paint. The state-forwarding façade is the
// one piece that is not timeline-specific at all, so it ships from
// `@cngx/common/data` next to the rest of the async-state surface.
export {
  CNGX_TIMELINE_VIEW_FACTORY,
  createTimelineView,
  type CngxTimelineView,
  type CngxTimelineViewFactory,
} from './timeline-view';
export {
  createTimelineSlotBinding,
  createTimelineSlots,
  type CngxTimelineSlotQueries,
  type CngxTimelineSlots,
  type CngxTimelineSlotSource,
} from './slot-cascade';
export {
  createTimelineFallbackCopy,
  type CngxTimelineFallbackCopy,
} from './timeline-labels';
