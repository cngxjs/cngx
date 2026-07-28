/**
 * @module @cngx/ui/timeline
 */

export {
  CngxTimeline,
  type CngxTimelineMode,
  type CngxTimelineSkin,
} from './timeline.component';
// The organism composes these four rather than inlining them, and they are
// public for the same reason: an ejected skin has to resolve the same slot
// cascade, the same body-view mapping, the same fallback copy and the same
// forwarded state, or it forks the brain instead of replacing the paint.
export {
  CNGX_TIMELINE_VIEW_FACTORY,
  createTimelineView,
  type CngxTimelineView,
  type CngxTimelineViewFactory,
} from './timeline-view';
export {
  createTimelineSlotBinding,
  type CngxTimelineSlotSource,
} from './slot-cascade';
export {
  createTimelineFallbackCopy,
  type CngxTimelineFallbackCopy,
} from './timeline-labels';
export { createForwardedAsyncState } from './forwarded-async-state';
