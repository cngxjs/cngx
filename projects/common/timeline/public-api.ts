/**
 * @module @cngx/common/timeline
 */
export {
  CNGX_TIMELINE_GROUPING_FACTORY,
  createTimelineGrouping,
  type CngxTimelineGroupingFactory,
  type TimelineDateAccessor,
  type TimelineDirection,
  type TimelineGroup,
  type TimelineGroupBy,
  type TimelineGroupingFn,
  type TimelineGroupingOptions,
  type TimelineGroupKey,
  type TimelineGrouping,
} from './grouping';
export { CngxTimelineMarker, type TimelineStatus } from './marker.component';
export {
  CngxTimelineConnector,
  type TimelineConnectorPosition,
} from './connector.component';
export {
  CngxTimelineContent,
  CngxTimelineItem,
  CngxTimelineMarkerContent,
  CngxTimelineTime,
} from './timeline-item.component';
export {
  CNGX_TIMELINE_MARKER_HOST,
  type CngxTimelineMarkerHost,
} from './marker-host.token';
export {
  CngxTimelineDateHeader,
  CngxTimelineEmpty,
  CngxTimelineError,
  CngxTimelineItemTpl,
  CngxTimelineLoadingTail,
  CngxTimelineMarkerTpl,
  CngxTimelineRetryButton,
  type CngxTimelineDateHeaderContext,
  type CngxTimelineEmptyContext,
  type CngxTimelineErrorContext,
  type CngxTimelineItemContext,
  type CngxTimelineMarkerContext,
  type CngxTimelineRetryButtonContext,
} from './template-slots';
export {
  CNGX_TIMELINE_CONFIG,
  injectTimelineConfig,
  provideTimelineConfig,
  provideTimelineConfigAt,
  withTimelineLabels,
  withTimelineTemplates,
  type CngxTimelineConfig,
  type CngxTimelineConfigFeature,
  type CngxTimelineLabels,
  type CngxTimelineTemplates,
} from './timeline-config';
