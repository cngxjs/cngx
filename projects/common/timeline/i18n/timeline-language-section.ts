import type { CngxMessage } from '@cngx/core/i18n';

/**
 * The timeline section of a {@link CngxLanguagePack}: every string the
 * timeline renders without a consumer slot. It feeds the `labels` of
 * `CNGX_TIMELINE_CONFIG`.
 *
 * @category common/timeline
 * @since 0.1.0
 * @relatedTo CNGX_TIMELINE_CONFIG, withTimelineLabels
 */
export interface CngxTimelineLanguageSection {
  /** Accessible name of the timeline list. */
  readonly timelineRegion: string;
  /** Label of the built-in retry control. */
  readonly retry: string;
  /** Body of the error surface. */
  readonly errorFallback: string;
  /** Body of the empty surface. */
  readonly emptyFallback: string;
  /** Accessible name of the loading body. */
  readonly loading: string;
  /** Refreshing tail below the list. */
  readonly refreshing: string;
  /** Screen-reader text of a pending item. */
  readonly itemBusy: string;
  /** Inline error text of a failed item. */
  readonly itemErrorFallback: string;
  /** Screen-reader wording per process status. */
  readonly status: {
    readonly done: string;
    readonly active: string;
    readonly upcoming: string;
    readonly rejected: string;
  };
  /** `{date}`: a group header, `{date}` being the group's start date in the app locale. */
  readonly groupHeader: CngxMessage;
}

/**
 * The English timeline section: the single source of the timeline's English
 * copy. `CNGX_TIMELINE_CONFIG` defaults its `labels` to it.
 *
 * @category common/timeline
 * @since 0.1.0
 * @relatedTo CNGX_TIMELINE_CONFIG
 */
export const CNGX_TIMELINE_LANGUAGE_EN: CngxTimelineLanguageSection = {
  timelineRegion: 'Timeline',
  retry: 'Retry',
  errorFallback: 'Could not load the timeline.',
  emptyFallback: 'No events yet.',
  loading: 'Loading timeline',
  refreshing: 'Updating…',
  itemBusy: 'Updating',
  itemErrorFallback: 'Could not load this event.',
  status: {
    done: 'Completed',
    active: 'In progress',
    upcoming: 'Upcoming',
    rejected: 'Rejected',
  },
  groupHeader: '{date}',
};

declare module '@cngx/core/i18n' {
  interface CngxLanguagePack {
    readonly timeline: CngxTimelineLanguageSection;
  }
}
