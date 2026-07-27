import { Component, inject } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';

import type { TimelineGroup } from './grouping';
import {
  CNGX_TIMELINE_CONFIG,
  injectTimelineConfig,
  provideTimelineConfig,
  provideTimelineConfigAt,
  withTimelineLabels,
  type CngxTimelineConfig,
} from './timeline-config';

function group(start: Date): TimelineGroup<unknown> {
  return { key: 'k', start, items: [] };
}

function readConfig(): CngxTimelineConfig {
  return TestBed.runInInjectionContext(() => injectTimelineConfig());
}

describe('timeline config cascade', () => {
  describe('library defaults', () => {
    it('resolves without any provider', () => {
      TestBed.configureTestingModule({});

      expect(TestBed.inject(CNGX_TIMELINE_CONFIG)).toBe(readConfig());
    });

    it('ships English text for every label', () => {
      TestBed.configureTestingModule({});
      const { labels } = readConfig();

      expect(labels).toMatchObject({
        timelineRegion: 'Timeline',
        retry: 'Retry',
        errorFallback: 'Could not load the timeline.',
        emptyFallback: 'No events yet.',
        loading: 'Loading timeline',
        refreshing: 'Updating…',
        itemBusy: 'Updating',
        itemErrorFallback: 'Could not load this event.',
      });
    });

    it('formats a group header from its start date', () => {
      TestBed.configureTestingModule({});
      const start = new Date(2026, 6, 20);

      expect(readConfig().labels?.groupLabel?.(group(start))).toBe(start.toLocaleDateString());
    });

    it('reserves an empty templates bag for the slot stage', () => {
      TestBed.configureTestingModule({});

      expect(readConfig().templates).toEqual({});
    });
  });

  describe('withTimelineLabels', () => {
    it('merges partially, leaving untouched keys at their default', () => {
      TestBed.configureTestingModule({
        providers: [provideTimelineConfig(withTimelineLabels({ retry: 'Erneut versuchen' }))],
      });
      const { labels } = readConfig();

      expect(labels?.retry).toBe('Erneut versuchen');
      expect(labels?.emptyFallback).toBe('No events yet.');
    });

    it('composes across several features, last write wins per key', () => {
      TestBed.configureTestingModule({
        providers: [
          provideTimelineConfig(
            withTimelineLabels({ retry: 'One', emptyFallback: 'Nothing here.' }),
            withTimelineLabels({ retry: 'Two' }),
          ),
        ],
      });
      const { labels } = readConfig();

      expect(labels?.retry).toBe('Two');
      expect(labels?.emptyFallback).toBe('Nothing here.');
    });

    it('overrides the group-header formatter', () => {
      TestBed.configureTestingModule({
        providers: [
          provideTimelineConfig(
            withTimelineLabels({ groupLabel: (g) => `Week of ${g.start.getFullYear()}` }),
          ),
        ],
      });

      expect(readConfig().labels?.groupLabel?.(group(new Date(2026, 6, 20)))).toBe('Week of 2026');
    });

    it('leaves the library defaults untouched for the next injector', () => {
      TestBed.configureTestingModule({
        providers: [provideTimelineConfig(withTimelineLabels({ retry: 'Mutated?' }))],
      });
      expect(readConfig().labels?.retry).toBe('Mutated?');

      TestBed.resetTestingModule();
      TestBed.configureTestingModule({});

      expect(readConfig().labels?.retry).toBe('Retry');
    });
  });

  describe('provideTimelineConfigAt', () => {
    it('wins over the root provider inside the component scope', () => {
      @Component({
        selector: 'cngx-timeline-scope-host',
        template: '',
        viewProviders: [...provideTimelineConfigAt(withTimelineLabels({ retry: 'Scoped' }))],
      })
      class ScopeHost {
        readonly config = inject(CNGX_TIMELINE_CONFIG);
      }

      TestBed.configureTestingModule({
        imports: [ScopeHost],
        providers: [provideTimelineConfig(withTimelineLabels({ retry: 'Root' }))],
      });
      const fixture = TestBed.createComponent(ScopeHost);

      expect(fixture.componentInstance.config.labels?.retry).toBe('Scoped');
      expect(readConfig().labels?.retry).toBe('Root');
    });

    it('resolves a scoped override against the library defaults, not the root config', () => {
      @Component({
        selector: 'cngx-timeline-scope-host',
        template: '',
        viewProviders: [...provideTimelineConfigAt(withTimelineLabels({ retry: 'Scoped' }))],
      })
      class ScopeHost {
        readonly config = inject(CNGX_TIMELINE_CONFIG);
      }

      TestBed.configureTestingModule({
        imports: [ScopeHost],
        providers: [provideTimelineConfig(withTimelineLabels({ emptyFallback: 'Root empty.' }))],
      });
      const fixture = TestBed.createComponent(ScopeHost);

      expect(fixture.componentInstance.config.labels?.emptyFallback).toBe('No events yet.');
    });
  });
});
